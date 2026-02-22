
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Sun, Moon, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onHomeClick: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  onViewChange, 
  onHomeClick,
  isDarkMode,
  onToggleTheme
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { id: AppView; label: string }[] = [
    { id: 'redesign', label: 'AI Redesign' },
    { id: 'designer', label: 'Room Planner' },
    { id: 'shop', label: 'Shop the Look' },
    { id: 'quiz', label: 'Style Quiz' },
  ];

  const handleNavClick = (view: AppView) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onHomeClick();
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${scrolled || isMobileMenuOpen 
          ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30 shadow-lg shadow-black/5 py-3 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60' 
          : 'bg-transparent border-b border-transparent py-5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <a 
            href="/"
            className="flex items-center gap-3 cursor-pointer group relative z-50"
            onClick={handleLogoClick}
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-slate-900 dark:bg-indigo-600 rounded-xl rotate-3 group-hover:rotate-6 transition-transform duration-300 opacity-20 dark:opacity-40"></div>
                <div className="relative w-10 h-10 bg-slate-900 dark:bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:-translate-y-0.5 transition-transform duration-300">
                  <Sparkles className="w-5 h-5" />
                </div>
            </div>
            <span className="text-2xl font-bold font-serif tracking-tight text-slate-900 dark:text-white">
              DreamSpace
            </span>
          </a>
          
          <div className="flex items-center gap-4">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-full bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm ring-1 ring-white/30 dark:ring-white/5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ease-out whitespace-nowrap z-10
                    ${currentView === item.id 
                      ? 'text-slate-900 dark:text-white' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {currentView === item.id && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-white/80 dark:bg-slate-700/80 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10 -z-10 backdrop-blur-sm"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="group p-2.5 rounded-full bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all duration-300 focus:outline-none z-50 overflow-hidden relative"
              aria-label="Toggle Dark Mode"
            >
               <div className="relative w-5 h-5">
                  <div className={`absolute inset-0 transform transition-transform duration-500 ${isDarkMode ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}>
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className={`absolute inset-0 transform transition-transform duration-500 ${isDarkMode ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`}>
                    <Moon className="w-5 h-5 text-indigo-400" />
                  </div>
               </div>
            </button>

            {/* Mobile Menu Button */}
            <div className="md:hidden relative z-50">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-full bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white transition-colors focus:outline-none"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden absolute top-full left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-6 py-4 rounded-xl text-lg font-medium transition-colors
                    ${currentView === item.id 
                      ? 'bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                >
                  <div className="flex justify-between items-center">
                    {item.label}
                    {currentView === item.id && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
