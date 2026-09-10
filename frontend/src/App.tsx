import React, { useState } from 'react';
import { Mic, ArrowUp } from 'lucide-react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SoundWaveBackground } from './components/SoundWaveBackground';
import { RadarDetectionSweep } from './components/RadarDetectionSweep';
import { FiveCheckpoints } from './components/FiveCheckpoints';
import { AnalysisModal } from './components/AnalysisModal';
import { AuthModal } from './components/AuthModal';
import { LiveAnalysisPage } from './components/LiveAnalysisPage';
import { RecordedAnalysisPage } from './components/RecordedAnalysisPage';
import { CallIntelligencePage } from './components/CallIntelligencePage';
import { Footer } from './components/Footer';
import { ThemeProvider } from './context/ThemeContext';
import { UserProfile } from './types';

function AppContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'mic' | 'upload' | 'demo'>('mic');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string | null>(null);

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('voiceguardian_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState<string | null>(() => sessionStorage.getItem('voiceguardian_token'));

  const [currentView, setCurrentView] = useState<'dashboard' | 'landing' | 'live-analysis' | 'recorded-analysis' | 'call-intelligence'>(() => {
    try {
      const saved = localStorage.getItem('voiceguardian_user');
      return saved ? 'dashboard' : 'landing';
    } catch {
      return 'landing';
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<string>('Overview');

  React.useEffect(() => {
    if (user && !authToken) {
      localStorage.removeItem('voiceguardian_user');
      setUser(null);
      setCurrentView('landing');
    }

  }, []);

  const handleNavigate = (view: 'dashboard' | 'live-analysis' | 'recorded-analysis' | 'call-intelligence' | 'landing', tab?: string) => {
    if (tab) {
      setDashboardTab(tab);
    }
    setCurrentView(view);
  };

  const [pendingAnalysis, setPendingAnalysis] = useState<{
    mode: 'mic' | 'upload' | 'demo';
    checkpointId?: string | null;
  } | null>(null);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthReason(null);
    setPendingAnalysis(null);
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleSignOut = () => {
    localStorage.removeItem('voiceguardian_user');
    sessionStorage.removeItem('voiceguardian_token');
    setUser(null);
    setAuthToken(null);
    setCurrentView('landing');
    setPendingAnalysis(null);
    setAuthReason(null);
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile, token: string) => {
    setUser(authenticatedUser);
    setAuthToken(token);
    sessionStorage.setItem('voiceguardian_token', token);
    localStorage.setItem('voiceguardian_user', JSON.stringify(authenticatedUser));

    if (pendingAnalysis?.mode === 'mic') {
      setCurrentView('live-analysis');
      setPendingAnalysis(null);
      setAuthReason(null);
    } else if (pendingAnalysis) {
      setCurrentView('dashboard');
      setModalMode(pendingAnalysis.mode);
      setSelectedCheckpoint(pendingAnalysis.checkpointId || null);
      setIsModalOpen(true);
      setPendingAnalysis(null);
      setAuthReason(null);
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleOpenAnalysis = (mode: 'mic' | 'upload' | 'demo') => {
    if (mode === 'mic') {
      if (!user) {
        setPendingAnalysis({ mode: 'mic', checkpointId: null });
        setAuthReason('Sign in or create an account with Google to start real-time live voice analysis.');
        setAuthMode('login');
        setAuthModalOpen(true);
        return;
      }
      setCurrentView('live-analysis');
      return;
    }

    if (!user) {
      setPendingAnalysis({ mode, checkpointId: null });
      setAuthReason('Sign in or create an account with Google to upload and analyze audio recordings.');
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }

    setModalMode(mode);
    setSelectedCheckpoint(null);
    setIsModalOpen(true);
  };

  const handleCheckpointClick = (checkpointId: string) => {
    if (!user) {
      setPendingAnalysis({ mode: 'upload', checkpointId });
      setAuthReason('Sign in or create an account with Google to inspect acoustic checkpoints.');
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }

    setSelectedCheckpoint(checkpointId);
    setModalMode('upload');
    setIsModalOpen(true);
  };

  return (
    <>
      {currentView === 'live-analysis' ? (
        <LiveAnalysisPage
          user={user}
          authToken={authToken}
          initialSource="mic"
          onBackToDashboard={() => handleNavigate('dashboard')}
          onViewLanding={() => handleNavigate('landing')}
          onNavigate={handleNavigate}
        />
      ) : currentView === 'recorded-analysis' ? (
        <RecordedAnalysisPage
          user={user}
          authToken={authToken}
          onBackToDashboard={() => handleNavigate('dashboard')}
          onViewLanding={() => handleNavigate('landing')}
          onNavigate={handleNavigate}
        />
      ) : currentView === 'call-intelligence' ? (
        <CallIntelligencePage
          user={user}
          authToken={authToken}
          onBackToDashboard={() => handleNavigate('dashboard')}
          onViewLanding={() => handleNavigate('landing')}
          onNavigate={handleNavigate}
        />
      ) : user && currentView === 'dashboard' ? (
        <Dashboard
          user={user}
          authToken={authToken}
          initialTab={dashboardTab}
          onSignOut={handleSignOut}
          onOpenAnalysis={handleOpenAnalysis}
          onViewLanding={() => handleNavigate('landing')}
          onNavigateLiveAnalysis={() => handleNavigate('live-analysis')}
          onNavigateRecordedAnalysis={() => handleNavigate('recorded-analysis')}
          onNavigateCallIntelligence={() => handleNavigate('call-intelligence')}
        />
      ) : (
        <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif] bg-[#080d11] text-slate-100">
          <SoundWaveBackground />

          <div
            aria-hidden="true"
            className="pointer-events-none fixed -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-cyan-500/5 blur-[140px] z-0"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed top-1/3 right-10 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px] z-0"
          />

          <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-12 lg:px-16 flex flex-col justify-between flex-1">
            <Header
              user={user}
              onOpenAuth={handleOpenAuth}
              onSignOut={handleSignOut}
              onGoToDashboard={user ? () => handleNavigate('dashboard') : undefined}
              onGoToLiveAnalysis={() => handleNavigate('live-analysis')}
              onGoToRecordedAnalysis={() => handleNavigate('recorded-analysis')}
              onGoToCallIntelligence={() => handleNavigate('call-intelligence')}
            />

            <main className="py-8 sm:py-14 my-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 xl:gap-14 items-center">
                <div className="lg:col-span-7 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-slate-800/90 bg-[#091117]/80 text-[11px] font-mono tracking-wider text-slate-300 mb-6 w-fit select-none shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                    <span className="uppercase">VOICE THREAT INTELLIGENCE PLATFORM</span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-white tracking-[-0.035em] leading-[1.08] mb-6">
                    <span>Detect the voice.</span>
                    <br />
                    <span className="text-[#22d3ee] drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                      Understand
                    </span>{' '}
                    <span>the threat.</span>
                    <br />
                    <span>Stay one step ahead.</span>
                  </h1>

                  <p className="text-slate-400 text-base sm:text-[17px] leading-[1.65] max-w-xl font-normal mb-8">
                    Team Rocket analyzes calls in real time to surface AI-cloned voices,
                    social-engineering scripts, and fraud patterns — with evidence, not just a score.
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      id="start-voice-analysis-btn"
                      onClick={() => handleOpenAnalysis('mic')}
                      className="px-6 py-3.5 rounded-xl bg-[#2dd4bf] hover:bg-[#22d3ee] text-slate-950 font-bold text-sm sm:text-[15px] flex items-center gap-2.5 shadow-[0_0_25px_rgba(45,212,191,0.35)] transition-all duration-200 cursor-pointer group hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Mic className="w-4 h-4 text-slate-950 fill-current" />
                      <span>Start Live Voice Analysis</span>
                    </button>

                    <button
                      type="button"
                      id="analyze-audio-btn"
                      onClick={() => handleNavigate('recorded-analysis')}
                      className="px-6 py-3.5 rounded-xl bg-[#091117] hover:bg-[#0f1922] border border-slate-700 hover:border-teal-500/40 text-white font-semibold text-sm sm:text-[15px] flex items-center gap-2.5 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ArrowUp className="w-4 h-4 text-teal-400" />
                      <span>Analyze Recorded Audio</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center lg:justify-end">
                  <RadarDetectionSweep
                    isAnalyzing={isModalOpen}
                    onClick={() => handleOpenAnalysis('mic')}
                  />
                </div>
              </div>

              <FiveCheckpoints
                activeCheckpoint={selectedCheckpoint}
                onSelectCheckpoint={handleCheckpointClick}
              />
            </main>

            <Footer />
          </div>
        </div>
      )}

      <AnalysisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
        initialCheckpoint={selectedCheckpoint}
      />

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        reason={authReason}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthReason(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
