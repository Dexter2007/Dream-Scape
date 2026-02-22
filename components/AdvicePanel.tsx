
import React from 'react';
import { DesignAdvice } from '../types';

interface AdvicePanelProps {
  advice: DesignAdvice;
}

export const AdvicePanel: React.FC<AdvicePanelProps> = ({ advice }) => {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-100/50 dark:shadow-none border border-white/60 dark:border-slate-700 h-full flex flex-col overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-200/50 dark:hover:shadow-none">
      <div className="p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-6">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Design Analysis</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">AI Interior Consultant</p>
          </div>
        </div>

        {/* Critique Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Current Critique
          </h4>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg font-light italic border-l-4 border-rose-200 dark:border-rose-900/50 pl-4 py-1">
            "{advice.critique}"
          </p>
        </div>

        {/* Color Palette */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
             Recommended Palette
          </h4>
          <div className="flex flex-wrap gap-4">
            {advice.colorPalette.map((color, idx) => (
              <div key={idx} className="group flex flex-col items-center gap-2">
                <div 
                  className="w-16 h-16 rounded-2xl shadow-md border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform duration-300 ring-2 ring-white dark:ring-slate-800 relative overflow-hidden"
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors max-w-[80px] text-center truncate">{color.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Plan */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
             Action Plan
          </h4>
          <ul className="grid gap-3">
            {advice.suggestions.map((step, idx) => (
              <li key={idx} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all duration-300 group">
                <span className="flex-shrink-0 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-sm font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm group-hover:scale-110 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-all">
                  {idx + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed pt-1.5 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Furniture Suggestions */}
        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
             Furniture & Decor
          </h4>
          <div className="flex flex-wrap gap-2">
            {advice.furnitureRecommendations.map((item, idx) => (
              <span 
                key={idx} 
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-default"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
