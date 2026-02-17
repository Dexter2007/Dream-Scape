import React from 'react';
import { DesignAdvice } from '../types';

interface AdvicePanelProps {
  advice: DesignAdvice;
}

export const AdvicePanel: React.FC<AdvicePanelProps> = ({ advice }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-600">
            <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
          </svg>
          Designer's Critique
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">{advice.critique}</p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">Color Palette</h3>
        <div className="flex gap-3 flex-wrap">
          {advice.colorPalette.map((color, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 group">
              <div 
                className="w-12 h-12 rounded-full shadow-md border border-slate-100 group-hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: color.hex }}
                title={color.hex}
              />
              <span className="text-[10px] font-medium text-slate-500 uppercase max-w-[60px] text-center truncate">{color.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">Action Plan</h3>
        <ul className="space-y-2">
          {advice.suggestions.map((suggestion, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-slate-700">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5">
                {idx + 1}
              </span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">Furniture Recommendations</h3>
        <div className="flex flex-wrap gap-2">
          {advice.furnitureRecommendations.map((item, idx) => (
            <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};