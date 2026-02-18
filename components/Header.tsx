
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onHomeClick }) => {
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
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out border-b
        ${scrolled || isMobileMenuOpen 
          ? 'bg-white/95 backdrop-blur-xl border-slate-200 shadow-sm py-2' 
          : 'bg-transparent border-transparent py-4'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a 
            href="/"
            className="flex items-center gap-3 cursor-pointer group relative z-50"
            onClick={handleLogoClick}
          >
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              D
            </div>
            <span className={`text-2xl font-bold font-serif tracking-tight transition-colors duration-300 ${scrolled || isMobileMenuOpen ? 'text-slate-900' : 'text-slate-900'}`}>
              DreamSpace
            </span>
          </a>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/50 backdrop-blur-sm">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out
                  ${currentView === item.id 
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden relative z-50">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center gap-1.5">
                <span className={`block w-6 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-6 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-6 h-0.5 bg-slate-900 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`md:hidden absolute top-0 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden
          ${isMobileMenuOpen ? 'max-h-[400px] opacity-100 pt-20 pb-6' : 'max-h-0 opacity-0 pt-0 pb-0'}
        `}
      >
        <div className="px-4 space-y-2">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-6 py-4 rounded-xl text-lg font-medium transition-all transform duration-300 delay-[${index * 50}ms]
                ${currentView === item.id 
                  ? 'bg-slate-50 text-indigo-600 translate-x-2' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
                ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
              `}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-center">
                {item.label}
                {currentView === item.id && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
