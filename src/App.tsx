import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VaultProvider, useVault } from './context/VaultContext';
import { Navbar } from './components/Navbar';
import { ExploreView } from './views/ExploreView';
import { VaultView } from './views/VaultView';
import { GameModal } from './components/GameModal';
import { AuthModal } from './components/AuthModal';
import { AboutModal } from './components/AboutModal';
import { IGDBGame } from './types';
import { AlertCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isFirebaseReady } = useAuth();
  const { vaultItems } = useVault();

  const [activeTab, setActiveTab] = useState<'explore' | 'vault'>('explore');
  const [selectedGame, setSelectedGame] = useState<IGDBGame | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#e4e4e7] flex flex-col font-sans relative">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        vaultCount={vaultItems.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 pt-3 sm:pt-6 pb-24 sm:pb-8 space-y-6 sm:space-y-8">
        
        {/* Firebase Config Info Banner if placeholders detected */}
        {!isFirebaseReady && (
          <div className="p-3.5 sm:p-4 bg-[#141417] border border-[#27272a] rounded-xl flex items-start gap-3 text-xs text-white">
            <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white">Firebase Setup Required</span>
              <p className="text-[#8e8e93]">
                Please update your <code className="bg-[#0a0a0c] px-1.5 py-0.5 rounded text-white border border-[#27272a]">.env</code> file with your Firebase credentials to enable real-time authentication and cloud vault syncing.
              </p>
            </div>
          </div>
        )}

        {/* Stable Motion View Container */}
        <div className="w-full relative">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'explore' ? (
              <motion.div
                key="explore-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="w-full"
              >
                <ExploreView
                  onSelectGame={(game) => setSelectedGame(game)}
                  onOpenAuth={() => setIsAuthOpen(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="vault-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="w-full"
              >
                <VaultView
                  onSelectGame={(game) => setSelectedGame(game)}
                  onOpenAuth={() => setIsAuthOpen(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#18181c] bg-[#0a0a0c] py-5 sm:py-6 px-4 sm:px-6 text-center text-xs text-[#8e8e93]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-extrabold text-white tracking-tight">GAME VAULT</span>
          <div className="flex items-center gap-4 text-[11px] font-medium text-[#71717a]">
            <span>Powered by IGDB API & Firebase</span>
            <span>•</span>
            <button 
              onClick={() => setIsAboutOpen(true)}
              className="text-zinc-400 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              About Developer
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GameModal
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSelectGame={(game) => setSelectedGame(game)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 bg-[#0c0c0e] border border-white/[0.08] rounded-3xl shadow-2xl space-y-4">
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-xs text-zinc-400">
              An unexpected error occurred while loading this view.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-5 py-2 bg-white text-black font-bold text-xs rounded-full hover:bg-zinc-200 transition-all shadow-sm"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <VaultProvider>
          <AppContent />
        </VaultProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
