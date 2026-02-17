import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  label?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ beforeImage, afterImage, label }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    e.preventDefault(); // Prevent text selection
    handleMove(e.clientX);
  }, [isResizing, handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isResizing) return;
    handleMove(e.touches[0].clientX);
  }, [isResizing, handleMove]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing, handleMouseMove, handleEnd, handleTouchMove]);

  // Allow clicking on the container to jump to that position
  const handleContainerClick = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden group cursor-col-resize"
      onClick={handleContainerClick}
    >
      {/* After Image (Background - The New Design) */}
      <img 
        src={afterImage} 
        alt="After Design" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0" 
        draggable={false}
      />

      {/* Watermark - Placed *between* After and Before image. 
          It sits on top of After (z-0) but will be covered by Before (z-20) 
      */}
      {label && (
        <div className="absolute bottom-5 right-6 pointer-events-none select-none z-10">
           <span className="font-serif italic text-2xl text-white/60 tracking-[0.2em] drop-shadow-md">
             {label}
           </span>
        </div>
      )}
      
      {/* Before Image (Foreground - The Original) - Clipped */}
      <img 
        src={beforeImage} 
        alt="Before Original" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-20"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        draggable={false}
      />

      {/* Slider Handle Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-30 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Handle Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/60 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 drop-shadow-md">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clipRule="evenodd" transform="rotate(45 10 10)" /> 
          </svg>
          {/* Custom Arrows */}
          <div className="absolute inset-0 flex items-center justify-between px-1">
             <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80"><path d="M5 1L1 5L5 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
             <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80"><path d="M1 1L5 5L1 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
};