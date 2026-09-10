import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
// @ts-expect-error CSS is loaded by Vite at runtime.
import './index.css';

const googleClientId =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';


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
