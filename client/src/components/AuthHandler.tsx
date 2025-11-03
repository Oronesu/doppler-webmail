import { useEffect } from 'react';
import axios from 'axios';

const AuthHandler = () => {
    useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    console.log('[OAuth] Code dans URL:', code);

    if (code) {
        axios.post('http://localhost:3000/auth/token', { code })
        .then(res => {
            const accessToken = res.data.access_token;
            console.log('[OAuth] Token reçu:', accessToken?.slice(0, 15) + '...');
            if (accessToken) {
            localStorage.setItem('access_token', accessToken);
            console.log('[OAuth] Token stocké dans localStorage');
            window.history.replaceState({}, '', '/');
            } else {
            console.warn('[OAuth] Aucun token reçu');
            }
        })
        .catch(err => {
            console.error('[OAuth] Erreur lors de l’échange du code:', err);
        });
    }
    }, []);

  return null;
};

export default AuthHandler;
