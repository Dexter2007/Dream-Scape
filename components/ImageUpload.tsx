
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
        className={`relative border-2 border-dashed rounded-[2rem] p-8 md:p-16 text-center transition-all duration-500 ease-out cursor-pointer group overflow-hidden glass
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30 scale-[1.02] shadow-2xl' 
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10'
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-indigo-200 to-purple-200 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none animate-pulse-slow"></div>

        <div className="relative flex flex-col items-center gap-4 md:gap-6 z-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-translate-y-2 duration-500 border border-slate-100 dark:border-slate-700 animate-float">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Upload your room photo</h3>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-light group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Drag and drop or click to browse</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold bg-slate-100/50 dark:bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/50">
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
