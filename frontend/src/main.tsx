import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

const googleClientId =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

// TEMPORARY: verify the Vercel build is receiving the correct client ID
console.log('Google Client ID:', googleClientId);

const root = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Only wrap in GoogleOAuthProvider when a client ID is configured.
createRoot(document.getElementById('root')!).render(
  googleClientId ? (
    <StrictMode>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </StrictMode>
  ) : (
    root
  ),
);
