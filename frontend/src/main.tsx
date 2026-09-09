import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {GoogleOAuthProvider} from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

const root = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Only wrap in GoogleOAuthProvider when a client ID is actually configured —
// initializing Google's script with an empty client_id can throw and take
// the whole app down with it. Without it, email/password login still works;
// AuthModal hides the Google button instead of rendering a broken one.
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
