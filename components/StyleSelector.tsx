
import React from 'react';
import { RoomStyle } from '../types';
import { ROOM_STYLES } from '../constants';

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleSelect: (style: string) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onStyleSelect }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 px-1 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
        Choose a Style
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {ROOM_STYLES.map((style) => (
          <button
            key={style.value}
            onClick={() => onStyleSelect(style.value)}
            className={`relative group rounded-2xl overflow-hidden aspect-[4/5] text-left transition-all duration-500 ease-out
              ${selectedStyle === style.value 
                ? 'ring-4 ring-indigo-500 ring-offset-4 dark:ring-offset-slate-900 shadow-2xl scale-[1.02] z-10' 
                : 'hover:shadow-2xl hover:scale-[1.03] hover:z-10 ring-1 ring-black/5 dark:ring-white/10'
              }`}
          >
            {/* Overlay for text readability */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 transition-opacity duration-500
               ${selectedStyle === style.value ? 'opacity-90' : 'opacity-70 group-hover:opacity-90'}
            `} />
            
            <img 
              src={style.image} 
              alt={style.label}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* DreamSpace Watermark on Banner */}
            <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-80 transition-opacity duration-500">
               <span className="font-serif italic text-white/90 text-[10px] tracking-wider drop-shadow-md bg-white/10 backdrop-blur-md px-2 py-1 rounded-full border border-white/20">DreamSpace</span>
            </div>
            
            <div className="absolute bottom-0 left-0 p-5 z-20 w-full transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
              <p className="text-white font-bold text-lg md:text-xl flex justify-between items-center font-serif tracking-tight">
                {style.label}
                {selectedStyle === style.value && (
                  <div className="bg-indigo-500 rounded-full p-1 shadow-lg shadow-indigo-500/50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </p>
              <div className="overflow-hidden max-h-0 group-hover:max-h-32 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]">
                 <div className="pt-2 pb-1">
                   <div className="w-8 h-0.5 bg-white/30 mb-2"></div>
                   <p className="text-slate-200 text-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 font-light">{style.description}</p>
                 </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
