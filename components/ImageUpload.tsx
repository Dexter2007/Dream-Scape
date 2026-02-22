
import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  onImageSelected: (base64: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onImageSelected(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-[2.5rem] p-10 md:p-20 text-center transition-all duration-500 ease-out cursor-pointer group overflow-hidden glass
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/40 scale-[1.02] shadow-2xl shadow-indigo-500/20' 
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:shadow-2xl hover:shadow-indigo-500/10'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        
        {/* Decorative background blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/20 dark:to-purple-600/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none animate-pulse-slow"></div>

        <div className="relative flex flex-col items-center gap-6 md:gap-8 z-10">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-black/40 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:-translate-y-2 duration-500 border border-slate-100 dark:border-slate-700/50 animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 md:w-12 md:h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="space-y-2 md:space-y-3">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">Upload your room photo</h3>
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-light group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors max-w-sm mx-auto leading-relaxed">Drag and drop your image here, or click to browse your files</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm px-5 py-2 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-sm">
            <span>JPG</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span>PNG</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span>Max 10MB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
