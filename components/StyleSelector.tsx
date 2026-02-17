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
      <h3 className="text-lg font-semibold text-slate-900 mb-4 px-1">Choose a Style</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROOM_STYLES.map((style) => (
          <button
            key={style.value}
            onClick={() => onStyleSelect(style.value)}
            className={`relative group rounded-xl overflow-hidden aspect-[4/3] text-left transition-all duration-200 border-2 
              ${selectedStyle === style.value ? 'border-indigo-600 ring-2 ring-indigo-100 ring-offset-2' : 'border-transparent hover:border-indigo-300'}`}
          >
            {/* Overlay for text readability */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-300
               ${selectedStyle === style.value ? 'opacity-90' : 'opacity-70 group-hover:opacity-80'}
            `} />
            
            <img 
              src={style.image} 
              alt={style.label}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* DreamSpace Watermark on Banner */}
            <div className="absolute top-2 right-2 z-20 opacity-60">
               <span className="font-serif italic text-white/90 text-[10px] tracking-wider drop-shadow-md">DreamSpace</span>
            </div>
            
            <div className="absolute bottom-0 left-0 p-3 z-20 w-full">
              <p className="text-white font-medium text-sm flex justify-between items-center">
                {style.label}
                {selectedStyle === style.value && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-indigo-400">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                )}
              </p>
              {selectedStyle === style.value && (
                 <p className="text-slate-300 text-xs mt-1 leading-tight">{style.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};