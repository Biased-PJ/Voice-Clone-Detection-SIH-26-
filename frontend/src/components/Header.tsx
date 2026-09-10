import React, { useState, useRef, useEffect } from 'react';
import { LogIn, UserPlus, LogOut, ShieldCheck, ChevronDown, LayoutDashboard, Radio, FileAudio, BrainCircuit } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onSignOut: () => void;
  onGoToDashboard?: () => void;
  onGoToLiveAnalysis?: () => void;
  onGoToRecordedAnalysis?: () => void;
  onGoToCallIntelligence?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onSignOut,
  onGoToDashboard,
  onGoToLiveAnalysis,
  onGoToRecordedAnalysis,
  onGoToCallIntelligence,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="pt-8 pb-4 sm:pt-10 sm:pb-6">
      <div className="flex items-center justify-between">
        <a href="/" className="group flex flex-col tracking-wider font-bold select-none">
          <span className="text-xl sm:text-2xl font-extrabold tracking-widest leading-none font-['Space_Grotesk'] text-[#2dd4bf] drop-shadow-[0_0_12px_rgba(45,212,191,0.25)]">
            TEAM
          </span>
          <span className="text-xl sm:text-2xl font-extrabold tracking-widest leading-tight font-['Space_Grotesk'] text-[#2dd4bf] drop-shadow-[0_0_12px_rgba(45,212,191,0.25)]">
            ROCKET
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              {onGoToLiveAnalysis && (
                <button
                  type="button"
                  id="header-goto-live-analysis-btn"
                  onClick={onGoToLiveAnalysis}
                  className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#0f2429] hover:bg-[#15343c] border border-cyan-500/50 text-cyan-300 hover:text-white text-xs sm:text-[13px] font-mono font-semibold transition-all shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="hidden sm:inline">Live Call</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/40">
                    LIVE
                  </span>
                </button>
              )}

              {onGoToRecordedAnalysis && (
                <button
                  type="button"
                  id="header-goto-recorded-analysis-btn"
                  onClick={onGoToRecordedAnalysis}
                  className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#0d1c24] hover:bg-[#142935] border border-teal-500/50 text-teal-300 hover:text-white text-xs sm:text-[13px] font-mono font-semibold transition-all shadow-[0_0_15px_rgba(45,212,191,0.15)] hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FileAudio className="w-4 h-4 text-teal-400" />
                  <span className="hidden sm:inline">Record Call</span>
                </button>
              )}

              {onGoToCallIntelligence && (
                <button
                  type="button"
                  id="header-goto-call-intelligence-btn"
                  onClick={onGoToCallIntelligence}
                  className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#17140e] hover:bg-[#221c11] border border-amber-500/50 text-amber-300 hover:text-white text-xs sm:text-[13px] font-mono font-semibold transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <BrainCircuit className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Call Forensics</span>
                </button>
              )}

              {onGoToDashboard && (
                <button
                  type="button"
                  id="header-goto-dashboard-btn"
                  onClick={onGoToDashboard}
                  className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#0d161e] hover:bg-[#152330] border border-teal-500/50 text-[#22d3ee] hover:text-white text-xs sm:text-[13px] font-mono font-semibold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
              )}

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  id="user-profile-menu-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#0d161e] border border-teal-500/35 hover:border-teal-400 text-slate-200 text-xs font-mono shadow-[0_0_18px_rgba(45,212,191,0.12)] transition-all focus:outline-none cursor-pointer"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-5 h-5 rounded-full border border-teal-400/50 object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <span className="max-w-[100px] sm:max-w-[140px] truncate font-medium text-white">
                    {user.name}
                  </span>

                  {user.provider === 'google' && (
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}

                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#091117] border border-slate-700/80 shadow-[0_15px_40px_rgba(0,0,0,0.85)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-md">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{user.name}</div>
                        <div className="text-xs text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Auth Provider:</span>
                        <span className="text-teal-300 font-semibold flex items-center gap-1">
                          {user.provider === 'google' ? 'Google OAuth' : 'Encrypted Key'}
                          <ShieldCheck className="w-3 h-3 text-teal-400" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Clearance:</span>
                        <span className="text-slate-200">{user.role || 'Analyst'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      {onGoToLiveAnalysis && (
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            onGoToLiveAnalysis();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 text-xs font-semibold font-mono transition-colors cursor-pointer"
                        >
                          <Radio className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Open Live Analysis</span>
                        </button>
                      )}
                      {onGoToRecordedAnalysis && (
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            onGoToRecordedAnalysis();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/25 text-xs font-semibold font-mono transition-colors cursor-pointer"
                        >
                          <FileAudio className="w-3.5 h-3.5 text-teal-400" />
                          <span>Recorded Audio Forensics</span>
                        </button>
                      )}
                      {onGoToCallIntelligence && (
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            onGoToCallIntelligence();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-xs font-semibold font-mono transition-colors cursor-pointer"
                        >
                          <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                          <span>Call Intelligence</span>
                        </button>
                      )}
                      {onGoToDashboard && (
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            onGoToDashboard();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/25 text-xs font-semibold font-mono transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Go to Dashboard</span>
                        </button>
                      )}
                      <button
                        type="button"
                        id="header-signout-btn"
                        onClick={() => {
                          setDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-semibold font-mono transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                id="header-login-btn"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-mono font-medium text-slate-300 hover:text-white bg-[#0f171d]/90 hover:bg-[#15232d] border border-slate-800 hover:border-teal-500/40 transition-all shadow-sm focus:outline-none cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-teal-400" />
                <span>Log in</span>
              </button>

              <button
                type="button"
                id="header-signup-btn"
                onClick={() => onOpenAuth('signup')}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 transition-all shadow-[0_0_15px_rgba(45,212,191,0.25)] hover:shadow-[0_0_22px_rgba(45,212,191,0.45)] focus:outline-none cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign up</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
