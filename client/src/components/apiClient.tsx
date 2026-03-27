import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const BASE = 'http://localhost:3000';

// Instance axios partagée
const api = axios.create({ baseURL: BASE });

let isRefreshing = false;
// File des requêtes en attente pendant le refresh
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (token: string | null, error: unknown = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
};

const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expires_at');
  window.location.href = '/';
};

// ── Intercepteur REQUEST : injecte access_token dans les params ──────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    // On passe le token en query param (comme le reste de l'app)
    config.params = { ...config.params, access_token: token };
  }
  return config;
});

// ── Intercepteur RESPONSE : gère les 401 ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Si un refresh est déjà en cours, on met la requête en file
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.params = { ...original.params, access_token: token };
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      isRefreshing = false;
      logout();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${BASE}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const newToken: string = data.access_token;
      localStorage.setItem('access_token', newToken);

      // Mettre à jour l'expiration
      if (data.expires_in) {
        const expiresAt = Date.now() + (data.expires_in - 60) * 1000;
        localStorage.setItem('token_expires_at', String(expiresAt));
      }

      processQueue(newToken);
      original.params = { ...original.params, access_token: newToken };
      return api(original);
    } catch (refreshError) {
      processQueue(null, refreshError);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;