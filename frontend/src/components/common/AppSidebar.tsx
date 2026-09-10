import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Radio,
  FileAudio,
  BrainCircuit,
  Globe,
  Settings,
  LogOut,
  LogIn,
  PanelLeftClose,
  History,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { getMyCalls } from '../../utils/api';

export interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: 'dashboard' | 'live-analysis' | 'recorded-analysis' | 'call-intelligence' | 'landing';
  activeTab?: string;
  onNavigate: (
    view: 'dashboard' | 'live-analysis' | 'recorded-analysis' | 'call-intelligence' | 'landing',
    tab?: string
  ) => void;
  user: UserProfile | null;
  authToken?: string | null;
  onSignOut?: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  isOverlay?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onClose,
  activePage,
  activeTab = 'Overview',
  onNavigate,
  user,
  authToken,
  onSignOut,
  onOpenAuth,
  isOverlay = true,
}) => {
  const [callCount, setCallCount] = React.useState(0);

  useEffect(() => {
    if (!authToken) { setCallCount(0); return; }
    let cancelled = false;
    const loadCount = () => {
      getMyCalls(authToken).then((data) => {
        if (!cancelled) setCallCount(Number(data.total_analysis_results ?? (data.analysis_results || []).length));
      }).catch(() => { if (!cancelled) setCallCount(0); });
    };
    loadCount();
    window.addEventListener('voiceguardian-history-updated', loadCount);
    return () => { cancelled = true; window.removeEventListener('voiceguardian-history-updated', loadCount); };
  }, [authToken]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navItems = [
    {
      id: 'dashboard-overview',
      name: 'Dashboard Overview',
      icon: LayoutDashboard,
      action: () => onNavigate('dashboard', 'Overview'),
      isActive: activePage === 'dashboard' && (activeTab === 'Overview' || !activeTab),
    },
    {
      id: 'live-analysis',
      name: 'Live Call Analysis',
      icon: Radio,
      badge: 'LIVE',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse',
      action: () => onNavigate('live-analysis'),
      isActive:
        activePage === 'live-analysis' ||
        (activePage === 'dashboard' && activeTab === 'Live Analysis'),
    },
    {
      id: 'recorded-analysis',
      name: 'Recorded Call Analysis',
      icon: FileAudio,
      badge: 'UPLOAD',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      action: () => onNavigate('recorded-analysis'),
      isActive:
        activePage === 'recorded-analysis' ||
        (activePage === 'dashboard' && activeTab === 'Recorded Call'),
    },
    {
      id: 'call-intelligence',
      name: 'Call Intelligence',
      icon: BrainCircuit,
      badge: 'INTEL',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      action: () => onNavigate('call-intelligence'),
      isActive:
        activePage === 'call-intelligence' ||
        (activePage === 'dashboard' && activeTab === 'Call Intelligence'),
    },
    {
      id: 'threat-map',
      name: 'Threat Map',
      icon: Globe,
      action: () => onNavigate('dashboard', 'Threat Map'),
      isActive: activePage === 'dashboard' && activeTab === 'Threat Map',
    },
    {
      id: 'call-history',
      name: 'Call History',
      icon: History,
      count: callCount.toLocaleString(),
      action: () => onNavigate('dashboard', 'History'),
      isActive: activePage === 'dashboard' && activeTab === 'History',
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      action: () => onNavigate('dashboard', 'Settings'),
      isActive: activePage === 'dashboard' && activeTab === 'Settings',
    },
  ];

  const userName = user?.name || user?.email?.split('@')[0] || 'Operator';

  const content = (
    <div className="w-72 sm:w-80 h-full flex flex-col justify-between bg-[#060a0f]/98 border-r border-slate-800/90 text-slate-200 font-['Plus_Jakarta_Sans',sans-serif] select-none p-4 sm:p-5 backdrop-blur-2xl shadow-2xl overflow-y-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="text-[#22d3ee] text-base leading-none drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
              ◆
            </span>
            <div className="flex flex-col">
              <span className="font-['Space_Grotesk'] font-bold text-base text-[#2dd4bf] tracking-widest drop-shadow-[0_0_12px_rgba(45,212,191,0.35)]">
                TEAM ROCKET
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Voice Security Suite
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close sidebar (Esc)"
          >
            <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-teal-400 transition-colors" />
          </button>
        </div>

        <div className="space-y-1.5 font-mono">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.action();
                  if (isOverlay) onClose();
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                  item.isActive
                    ? 'bg-[#0f2429] text-[#22d3ee] font-semibold border border-teal-500/35 shadow-[0_0_18px_rgba(34,211,238,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      item.isActive ? 'text-[#22d3ee]' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}

                {item.count && (
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80 space-y-3 font-mono mt-6">
        {user ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-inner">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={userName}
                  className="w-7 h-7 rounded-full border border-teal-500/40 object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 text-xs font-bold shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="truncate text-left">
                <div className="text-xs font-semibold text-slate-200 truncate">{userName}</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : onOpenAuth ? (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                onOpenAuth('login');
                if (isOverlay) onClose();
              }}
              className="w-full py-2 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between text-[10px] text-slate-600 px-1 font-mono">
          <span>Engine v3.8.4</span>
          <span className="flex items-center gap-1 text-emerald-400/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        </div>
      </div>
    </div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />
        <div className="relative z-10 animate-in slide-in-from-left duration-200 h-full shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
