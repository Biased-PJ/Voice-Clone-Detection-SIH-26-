import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Shield, Check, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { UserProfile } from '../types';
import { loginWithGoogle, loginWithEmail, registerWithEmail, getMe, getGoogleAuthStatus } from '../utils/api';
import { HAS_GOOGLE_AUTH } from '../utils/config';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  reason?: string | null;
  onClose: () => void;

  onSuccess: (user: UserProfile, token: string) => void;
}

interface GoogleIdTokenClaims {
  email: string;
  name?: string;
  picture?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  reason = null,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Acoustic Threat Analyst');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleBackendReady, setGoogleBackendReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccess(null);
      setGoogleBackendReady(null);
      if (HAS_GOOGLE_AUTH) {
        getGoogleAuthStatus().then((status) => setGoogleBackendReady(status.configured)).catch(() => setGoogleBackendReady(false));
      }
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (mode === 'signup' && !name) {
      setError('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await registerWithEmail(name, email.toLowerCase(), password);
      }
      const { access_token } = await loginWithEmail(email.toLowerCase(), password);

      const me = await getMe(access_token);

      const user: UserProfile = {
        id: me.user_id,
        name: me.name,
        email: me.email,
        provider: 'email',
        role: me.role,
        isAdmin: me.role === 'admin',
      };
      setSuccess(mode === 'login' ? 'Login successful. Loading your workspace...' : 'Registration successful. Signing you in...');
      window.setTimeout(() => {
        onSuccess(user, access_token);
        onClose();
      }, 650);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(null);
    if (!credentialResponse.credential) {
      setError('Google did not return a credential. Please try again.');
      return;
    }

    setGoogleLoading(true);
    try {
      const claims = jwtDecode<GoogleIdTokenClaims>(credentialResponse.credential);
      const { access_token } = await loginWithGoogle(credentialResponse.credential);

      const me = await getMe(access_token);

      const user: UserProfile = {
        id: me.user_id,
        name: me.name,
        email: me.email,
        avatar: claims.picture,
        provider: 'google',
        role: me.role,
        isAdmin: me.role === 'admin',
      };
      setSuccess('Google authentication successful. Loading your workspace...');
      window.setTimeout(() => {
        onSuccess(user, access_token);
        onClose();
      }, 650);
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="voiceguardian-auth-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-[#0a1117] border border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-6 sm:p-8 overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <>
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[11px] font-mono mb-2.5">
              <Shield className="w-3 h-3" />
              <span>TEAM ROCKET CLEARANCE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create Security Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login'
                ? 'Sign in to access acoustic forensics and threat reports'
                : 'Get instant access to real-time voice defense tools'}
            </p>
          </div>

          {reason && (
            <div className="mb-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div className="text-xs text-teal-200">
                <span className="font-semibold block text-white">Authentication Required</span>
                {reason}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${mode === 'login'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${mode === 'signup'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Sign Up
            </button>
          </div>

          <div className="w-full flex justify-center [&>div]:w-full">
            {!HAS_GOOGLE_AUTH || googleBackendReady === false ? (
              <div className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-center text-[11px] text-slate-500">
                Google sign-in isn't fully configured — set VITE_GOOGLE_CLIENT_ID in the frontend and GOOGLE_CLIENT_ID in the backend, then restart both services.
              </div>
            ) : googleLoading ? (
              <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-slate-800 text-xs font-semibold">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>Verifying with Google…</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                text={mode === 'login' ? 'signin_with' : 'signup_with'}
                shape="pill"
                theme="filled_black"
                width="320"
              />
            )}
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10.5px] uppercase tracking-wider">
              <span className="bg-[#0a1117] px-3 text-slate-500 font-mono">or email credentials</span>
            </div>
          </div>

          {error && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3.5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300" role="status">
              <Check className="h-4 w-4" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Parth Jain"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-teal-500 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-teal-500 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setError('Password reset instructions sent to your email.')}
                    className="text-[11px] text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-teal-500 text-white text-xs placeholder:text-slate-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Security Clearance Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-teal-500 text-white text-xs focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="Acoustic Threat Analyst">Acoustic Threat Analyst</option>
                  <option value="Enterprise Security Ops">Enterprise Security Ops</option>
                  <option value="Audio Forensics Investigator">Audio Forensics Investigator</option>
                  <option value="Individual Researcher">Individual Researcher</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:shadow-[0_0_25px_rgba(45,212,191,0.4)] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Radar Console' : 'Create Free Clearance'}</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[10.5px] font-mono text-slate-500 text-center">
            <Check className="w-3 h-3 text-teal-400" />
            <span>AES-256 GCM • Google OAuth 2.0 Identity Protocol</span>
          </div>
        </>
      </div>
    </div>
  );
};
