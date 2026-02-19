
import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  status: string;
}

const LOADING_MESSAGES = [
  "Analyzing room geometry...",
  "Identifying light sources...",
  "Removing clutter...",
  "Applying style textures...",
  "Rendering photorealistic lighting...",
  "Finalizing design details...",
  "Polishing your masterpiece..."
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-2xl transition-colors duration-300">
      <div className="relative mb-8">
        {/* Outer Ring */}
        <div className="w-24 h-24 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
        
        {/* Spinning Gradient Ring */}
        <div className="absolute inset-0 w-24 h-24 border-4 border-t-indigo-500 border-r-purple-500 border-b-pink-500 border-l-transparent rounded-full animate-spin"></div>
        
        {/* Inner Pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-16 h-16 bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full animate-pulse flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-bounce">
               <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
             </svg>
           </div>
        </div>
      </div>

      <div className="text-center space-y-2 px-6">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 animate-pulse">
           {status || 'Dreaming up your design...'}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-all duration-500 h-5">
           {LOADING_MESSAGES[messageIndex]}
        </p>
        <div className="w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mt-4 overflow-hidden">
           <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-progress-indeterminate"></div>
        </div>
      </div>
      
      <style>{`
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};
