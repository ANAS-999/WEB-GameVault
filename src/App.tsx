import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VaultProvider, useVault } from './context/VaultContext';
import { Navbar } from './components/Navbar';
import { ExploreView } from './views/ExploreView';
import { VaultView } from './views/VaultView';
import { GameModal } from './components/GameModal';
import { AuthModal } from './components/AuthModal';
import { IGDBGame } from './types';
import { AlertCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isFirebaseReady } = useAuth();
  const { vaultItems } = useVault();

  const [activeTab, setActiveTab] = useState<'explore' | 'vault'>('explore');
  const [selectedGame, setSelectedGame] = useState<IGDBGame | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#e4e4e7] flex flex-col font-sans">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        vaultCount={vaultItems.length}
      />

      {/* Main Container - Pixel Perfect Padding & Alignment */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-10 py-6 space-y-8">
        
        {/* Firebase Config Info Banner if placeholders detected */}
        {!isFirebaseReady && (
          <div className="p-4 bg-[#141417] border border-[#27272a] rounded-xl flex items-start gap-3 text-xs text-white">
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
      <footer className="border-t border-[#18181c] bg-[#0a0a0c] py-6 px-6 text-center text-xs text-[#8e8e93]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-extrabold text-white tracking-tight">GAME VAULT</span>
          <span className="text-[11px] font-medium text-[#71717a]">Powered by IGDB API & Firebase</span>
        </div>
      </footer>

      {/* Modals */}
      <GameModal
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <VaultProvider>
        <AppContent />
      </VaultProvider>
    </AuthProvider>
  );
};

export default App;
