import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Compass, Bookmark, LogIn, LogOut, Loader2, Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'explore' | 'vault';
  setActiveTab: (tab: 'explore' | 'vault') => void;
  onOpenAuth: () => void;
  onOpenAbout: () => void;
  vaultCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenAbout,
  vaultCount,
}) => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="w-full bg-transparent px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 pb-2 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-sm">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="font-extrabold text-base sm:text-xl tracking-tight text-white">
            VAULT<span className="text-white">.</span>
          </span>
        </div>

        {/* Desktop Seamless Navigation Tabs */}
        <nav className="hidden sm:flex items-center gap-8">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 py-1 text-sm font-bold transition-colors relative ${
              activeTab === 'explore'
                ? 'text-white'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 text-white" />
            <span>Explore</span>
            {activeTab === 'explore' && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 py-1 text-sm font-bold transition-colors relative ${
              activeTab === 'vault'
                ? 'text-white'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4 text-white" />
            <span>My Vault</span>
            {vaultCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white text-black font-extrabold">
                {vaultCount}
              </span>
            )}
            {activeTab === 'vault' && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </button>
        </nav>

        {/* Account & About Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* About Developer Button */}
          <button
            onClick={onOpenAbout}
            title="About Creator & Architecture"
            className="flex items-center gap-1.5 sm:gap-2 h-8 px-3 sm:px-3.5 bg-white/[0.04] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/20 text-zinc-300 hover:text-white text-xs font-bold rounded-full transition-all shadow-sm hover:scale-105"
          >
            <Code2 className="w-3.5 h-3.5 text-white" />
            <span>About</span>
          </button>

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 h-8 pl-1.5 pr-2 sm:pr-2.5 bg-[#141417] hover:bg-[#18181c] border border-[#27272a] hover:border-[#3f3f46] rounded-full transition-all cursor-pointer shadow-sm group">
              <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-extrabold text-[10px]">
                {initial}
              </div>

              <span className="text-xs font-bold text-white max-w-[70px] sm:max-w-[90px] truncate tracking-tight">
                {displayName}
              </span>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Sign Out"
                className="p-1 text-[#71717a] hover:text-white rounded-full transition-colors ml-0.5 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                ) : (
                  <LogOut className="w-3 h-3 text-white" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 h-8 px-3.5 sm:px-4 bg-white hover:bg-[#e4e4e7] text-black text-xs font-extrabold rounded-full transition-all shadow-sm hover:scale-105"
            >
              <LogIn className="w-3.5 h-3.5 text-black" />
              <span>Sign In</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile Bottom Navigation Bar (Thumb Friendly) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-white/[0.08] px-6 py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center gap-1 py-1 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'explore'
                ? 'text-white'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            <Compass className={`w-5 h-5 ${activeTab === 'explore' ? 'text-white scale-110' : 'text-[#71717a]'}`} />
            <span className="text-[11px]">Explore</span>
            {activeTab === 'explore' && (
              <span className="w-1 h-1 bg-white rounded-full mt-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex flex-col items-center gap-1 py-1 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'vault'
                ? 'text-white'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            <div className="relative">
              <Bookmark className={`w-5 h-5 ${activeTab === 'vault' ? 'text-white scale-110' : 'text-[#71717a]'}`} />
              {vaultCount > 0 && (
                <span className="absolute -top-1.5 -right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-white text-black font-extrabold">
                  {vaultCount}
                </span>
              )}
            </div>
            <span className="text-[11px]">My Vault</span>
            {activeTab === 'vault' && (
              <span className="w-1 h-1 bg-white rounded-full mt-0.5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
