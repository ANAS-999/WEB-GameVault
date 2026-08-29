import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Github, Linkedin, Mail, Code2, 
  Sparkles, Layers, Cpu, Database
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const techStack = [
    'React 18', 'TypeScript', 'Tailwind CSS', 'IGDB API v4', 'Firebase Auth', 'Firestore'
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-[#0c0c0e] border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl my-auto flex flex-col overflow-hidden text-zinc-100 overscroll-contain"
        >
          {/* Header Bar - Clean & Minimalist */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0c0c0e]/90 backdrop-blur-sm">
            <h2 className="font-bold text-base text-white tracking-tight">
              About Creator
            </h2>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.12] border border-white/[0.06] text-zinc-400 hover:text-white transition-all"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dialog Body */}
          <div className="p-6 space-y-5">
            
            {/* Creator Profile Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-lg font-black text-white flex-shrink-0">
                  A
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">Anas</h3>
                  <p className="text-xs text-zinc-400 truncate">Software Engineer</p>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href="https://github.com/ANAS-999"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub: ANAS-999"
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.12] hover:text-white border border-white/[0.06] text-zinc-400 flex items-center justify-center transition-all hover:scale-105"
                >
                  <Github className="w-3.5 h-3.5" />
                </a>

                <a
                  href="https://www.linkedin.com/in/anas-bencheikh-dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn: Anas Bencheikh"
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.12] hover:text-white border border-white/[0.06] text-zinc-400 flex items-center justify-center transition-all hover:scale-105"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                </a>

                <a
                  href="mailto:anas.dev.999@gmail.com"
                  title="Email: anas.dev.999@gmail.com"
                  className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.12] hover:text-white border border-white/[0.06] text-zinc-400 flex items-center justify-center transition-all hover:scale-105"
                >
                  <Mail className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Bio / Description */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Overview
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white font-semibold">GameVault</strong> is a minimalist web app built to discover games, explore franchise storylines chronologically, and curate a personal backlog with real-time IGDB metadata.
              </p>
            </div>

            {/* Tech Stack Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Tech Stack
              </span>
              <div className="flex flex-wrap gap-1.5">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] text-zinc-300 text-[11px] font-medium rounded-lg"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
