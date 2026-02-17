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
        className={`relative border border-dashed rounded-3xl p-16 text-center transition-all duration-500 ease-out cursor-pointer group overflow-hidden
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
            : 'border-slate-300 bg-white/60 hover:border-indigo-400 hover:bg-white/80 hover:shadow-xl hover:shadow-indigo-500/10'
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        <div className="relative flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-white shadow-lg shadow-slate-200/50 text-indigo-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 border border-slate-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-slate-900">Upload your room photo</h3>
            <p className="text-slate-500 font-light">Drag and drop or click to browse</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-medium bg-slate-100 px-3 py-1 rounded-full">
            <span>JPG</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>PNG</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>Max 10MB</span>
          </div>
        </div>
      </div>
    </div>
  );
};