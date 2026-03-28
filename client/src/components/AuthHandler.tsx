import { useEffect } from 'react';
import axios from 'axios';

const AuthHandler = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) return;

    axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/token`, { code })
      .then(res => {
        const { access_token, refresh_token, expires_in } = res.data;
        if (access_token) {
          localStorage.setItem('access_token', access_token);
          // Stocker le refresh_token (Google le renvoie uniquement au premier login)
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
          }
          // Stocker l'heure d'expiration pour savoir quand rafraîchir
          const expiresAt = Date.now() + (expires_in - 60) * 1000; // -60s de marge
          localStorage.setItem('token_expires_at', String(expiresAt));
          window.history.replaceState({}, '', '/');
          window.location.href = '/';
        }
      })
      .catch(err => {
        console.error('[OAuth] Erreur échange du code:', err);
      });
  }, []);

  return null;
};

export default AuthHandler;