
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ImageUpload } from './components/ImageUpload';
import { StyleSelector } from './components/StyleSelector';
import { AdvicePanel } from './components/AdvicePanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { StyleQuiz } from './components/StyleQuiz';
import { ShopTheLook } from './components/ShopTheLook';
import { RoomDesigner } from './components/RoomDesigner';
import { ImageComparisonSlider } from './components/ImageComparisonSlider';
import { RoomStyle, GenerationResult, LoadingState, AppView } from './types';
import { generateRoomRedesign, getDesignAdvice } from './services/geminiService';
import { ROOM_STYLES } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dreamspace_view');
      if (saved === 'redesign' || saved === 'designer' || saved === 'shop' || saved === 'quiz') return saved;
    }
    return 'redesign';
  });

  useEffect(() => {
    localStorage.setItem('dreamspace_view', currentView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dreamspace_theme') === 'dark';
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dreamspace_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dreamspace_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const [originalImage, setOriginalImage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dreamspace_originalImage');
    return null;
  });

  const [selectedStyle, setSelectedStyle] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dreamspace_selectedStyle') || RoomStyle.Modern;
    return RoomStyle.Modern;
  });

  const [result, setResult] = useState<GenerationResult | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dreamspace_result');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved result", e);
        }
      }
    }
    return null;
  });

  useEffect(() => {
    if (originalImage) {
      try { localStorage.setItem('dreamspace_originalImage', originalImage); } catch (e) {}
    } else { localStorage.removeItem('dreamspace_originalImage'); }
  }, [originalImage]);

  useEffect(() => {
    if (selectedStyle) localStorage.setItem('dreamspace_selectedStyle', selectedStyle);
  }, [selectedStyle]);

  useEffect(() => {
    if (result) {
      try { localStorage.setItem('dreamspace_result', JSON.stringify(result)); } catch (e) {}
    } else { localStorage.removeItem('dreamspace_result'); }
  }, [result]);

  const [loadingState, setLoadingState] = useState<LoadingState>({ isGenerating: false, statusMessage: '' });
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<'redesign' | 'advice' | null>(null);

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDownloadMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    setOriginalImage(null);
    setResult(null);
    setError(null);
    setShowDownloadMenu(false);
    setIsGeneratingAdvice(false);
    setLastFailedAction(null);
  };

  const handleImageSelected = (base64: string) => {
    setOriginalImage(base64);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setOriginalImage(base64String);
        setResult(null);
        setError(null);
        setShowDownloadMenu(false);
        setIsGeneratingAdvice(false);
        setLastFailedAction(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = '';
  };

  const handleGoHome = () => {
    setCurrentView('redesign');
    handleReset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = (format: 'png' | 'jpeg') => {
    if (!result?.generatedImage) return;
    setShowDownloadMenu(false);
    const img = new Image();
    img.src = result.generatedImage;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const fontSize = Math.max(24, Math.floor(img.width * 0.035));
        ctx.font = `italic 700 ${fontSize}px "Playfair Display", serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        const padding = Math.floor(img.width * 0.04);
        ctx.fillText('DreamSpace', canvas.width - padding, canvas.height - padding);
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.95);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `dreamspace-${selectedStyle.toLowerCase()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  };

  const checkKeyAndGenerate = async () => {
    if (!originalImage || isGeneratingRef.current) return;
    
    // Pro models require key selection
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Proceeding after triggering openSelectKey as per instructions to mitigate race conditions
    }
    handleGenerate();
  };

  const handleGenerate = async () => {
    if (!originalImage || isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setLoadingState({ isGenerating: true, statusMessage: 'Initializing high-quality render...' });
    setError(null);
    setLastFailedAction(null);
    setResult({ originalImage, generatedImage: null, advice: null }); 
    setIsGeneratingAdvice(false);

    setTimeout(() => {
      if (resultsRef.current) {
        const elementRect = resultsRef.current.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.scrollY;
        window.scrollTo({ top: absoluteElementTop - 100, behavior: 'smooth' });
      }
    }, 250);

    const updateStatus = (msg: string) => setLoadingState(prev => ({ ...prev, statusMessage: msg }));

    try {
      setLoadingState({ isGenerating: true, statusMessage: 'Generating high-fidelity 1K design...' });
      const generatedImg = await generateRoomRedesign(originalImage, selectedStyle, updateStatus);
      setResult(prev => ({ originalImage, generatedImage: generatedImg, advice: null }));
    } catch (err: any) {
      console.error("Generation failed", err);
      const msg = err.message || "";
      if (msg.includes("Requested entity was not found")) {
        setError("AI Engine project mismatch. Please select a valid Paid API Key.");
        // @ts-ignore
        await window.aistudio.openSelectKey();
      } else {
        setError(msg || "Something went wrong. High traffic.");
      }
      setLastFailedAction('redesign');
    } finally {
      setLoadingState({ isGenerating: false, statusMessage: '' });
      setTimeout(() => { isGeneratingRef.current = false; }, 1000);
    }
  };

  const handleGetAdvice = async () => {
    if (!originalImage || !selectedStyle || isGeneratingAdvice) return;
    setIsGeneratingAdvice(true);
    setError(null);
    setLastFailedAction(null);
    try {
      const advice = await getDesignAdvice(originalImage, selectedStyle, (msg) => {
         setError(msg); 
      });
      setError(null);
      setResult(prev => prev ? { ...prev, advice } : null);
    } catch (err: any) {
      console.error("Advice generation failed", err);
      setError("Could not retrieve design advice. High traffic.");
      setLastFailedAction('advice');
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedAction === 'redesign') checkKeyAndGenerate();
    else if (lastFailedAction === 'advice') handleGetAdvice();
  };

  const handleQuizComplete = (style: string) => {
    setSelectedStyle(style);
    setCurrentView('redesign');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'quiz': return <StyleQuiz onComplete={handleQuizComplete} />;
      case 'shop': return <ShopTheLook />;
      case 'designer': return <RoomDesigner />;
      case 'redesign':
      default:
        return (
          <>
            {!originalImage && (
              <div className="relative animate-fade-in-up">
                <div className="text-center max-w-5xl mx-auto py-16 md:py-32 px-4 relative z-10">
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 md:mb-8 font-serif leading-tight">
                    Redesign your <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 drop-shadow-sm">sanctuary.</span>
                  </h1>
                  <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-8 md:mb-12 font-light leading-relaxed max-w-2xl mx-auto px-2">
                    Experience the future of interior design. Upload a photo, curate your style, and watch your space transform instantly with high-fidelity rendering.
                  </p>
                  <div className="max-w-xl mx-auto bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-2 rounded-3xl shadow-2xl shadow-indigo-200/40 dark:shadow-indigo-900/20 border border-white/60 dark:border-slate-700/60 transform hover:scale-[1.01] transition-transform duration-300 ring-1 ring-white/60 dark:ring-slate-700/60">
                    <ImageUpload onImageSelected={handleImageSelected} />
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 md:gap-8 mt-16 md:mt-24 text-left">
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/40 dark:border-slate-700/40 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform shadow-inner">🎨</div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">15+ Design Styles</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">From Japandi to Cyberpunk, explore a diverse range of aesthetic transformations.</p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/40 dark:border-slate-700/40 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                       <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform shadow-inner">💡</div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Expert Advice</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">Get actionable critiques, color palettes, and furniture suggestions.</p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/40 dark:border-slate-700/40 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                       <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform shadow-inner">⚡</div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pro Rendering</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">Visualize your room in stunning 1K quality using state-of-the-art Gemini 3 Pro.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {originalImage && (
              <div className="space-y-8 animate-fade-in-up pt-6 md:pt-12">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-xl shadow-indigo-100/50 dark:shadow-none border border-white/50 dark:border-slate-700/50">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden relative group cursor-pointer shadow-md ring-4 ring-white dark:ring-slate-700 flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                         <img src={originalImage} alt="Original" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-serif truncate">Your Room</h2>
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs md:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium hover:underline">Select different photo</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button onClick={checkKeyAndGenerate} disabled={loadingState.isGenerating} className="w-full md:w-auto px-6 md:px-10 py-3 md:py-4 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base">
                        {loadingState.isGenerating ? 'Rendering Pro Design...' : 'Generate Pro Design'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-100/50 dark:border-slate-700/50">
                    <StyleSelector selectedStyle={selectedStyle} onStyleSelect={setSelectedStyle} />
                  </div>
                </div>

                {error && (
                  <div className={`border px-6 py-4 rounded-xl flex items-center justify-between gap-4 animate-fade-in-up shadow-sm ${error.includes('Key') || error.includes('entity') ? 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-200' : 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200'}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg></div>
                      <div>
                        <h3 className="font-bold text-sm mb-1">Status Update</h3>
                        <p className="text-sm opacity-90">{error}</p>
                      </div>
                    </div>
                    {lastFailedAction && !loadingState.isGenerating && (
                      <button onClick={handleRetry} className="bg-white/80 dark:bg-slate-800/80 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-white transition-colors">Try Again</button>
                    )}
                  </div>
                )}

                {(result || loadingState.isGenerating) && (
                   <div ref={resultsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 scroll-mt-32">
                     <div className="lg:col-span-2 space-y-4">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100/50 dark:shadow-none border border-white/60 dark:border-slate-700 aspect-[4/3] bg-white dark:bg-slate-800 group">
                           {loadingState.isGenerating && <LoadingOverlay status={loadingState.statusMessage} />}
                           {result?.generatedImage ? (
                             <ImageComparisonSlider beforeImage={result.originalImage} afterImage={result.generatedImage} label="DreamSpace Pro" />
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/50">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                             </div>
                           )}
                        </div>
                        {result?.generatedImage && (
                          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in-up">
                            <div className="flex items-center gap-4">
                              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l4.75-6.75Z" clipRule="evenodd" /></svg></div>
                              <div>
                                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Pro Design Ready</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Download your premium {selectedStyle.toLowerCase()} room rendering.</p>
                              </div>
                            </div>
                            <div className="w-full sm:w-auto relative" ref={dropdownRef}>
                              <button onClick={() => setShowDownloadMenu(!showDownloadMenu)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-900 dark:bg-indigo-600 border border-slate-900 dark:border-indigo-600 rounded-xl hover:bg-indigo-600 transition-all shadow-md focus:ring-2 focus:ring-indigo-200">
                                <span>Download Pro Design</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`}><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                              </button>
                              {showDownloadMenu && (
                                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-up origin-bottom-right">
                                  <button onClick={() => handleDownload('png')} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"><span>Download PNG</span><span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">HQ</span></button>
                                  <button onClick={() => handleDownload('jpeg')} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"><span>Download JPEG</span><span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Lite</span></button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                     </div>
                     <div className="lg:col-span-1 h-full min-h-[400px] lg:min-h-[500px]">
                        {loadingState.isGenerating && !result?.generatedImage ? (
                          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 dark:border-slate-700 p-8 h-full flex flex-col gap-8 animate-pulse">
                             <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-lg w-1/2"></div>
                             <div className="space-y-3"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full"></div><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full"></div><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4"></div></div>
                             <div className="h-40 bg-slate-100 dark:bg-slate-700 rounded-2xl w-full mt-auto"></div>
                          </div>
                        ) : result?.advice ? (
                          <AdvicePanel advice={result.advice} />
                        ) : (
                          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-700 p-8 h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                             {isGeneratingAdvice ? (
                               <>
                                 <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                 <p className="text-sm">Consulting expert designers...</p>
                               </>
                             ) : (
                               <>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-4 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3.001.516.243.571.376 1.199.376 1.864 0 2.472-1.892 4.477-4.225 4.477V8.5a6.5 6.5 0 1 1 13 0v2.107a2.25 2.25 0 0 1-2.25 2.25h-.375a2.25 2.25 0 0 0 0 4.5h.375v.001M12 6.042c1.94 0 3.73.612 5.207 1.666" /></svg>
                                  {result?.generatedImage && (
                                     <div className="space-y-3">
                                        <p className="text-sm">Get actionable advice, color palettes, and furniture tips for this design.</p>
                                        <button onClick={handleGetAdvice} className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 font-bold text-sm rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800">Get Expert Advice</button>
                                     </div>
                                  )}
                               </>
                             )}
                          </div>
                        )}
                     </div>
                   </div>
                )}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-100 relative selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 overflow-x-hidden transition-colors duration-300">
      <div className="fixed inset-0 -z-10 h-full w-full bg-[#fafaf9] dark:bg-[#0f172a] transition-colors duration-300">
        <div className="absolute inset-0 opacity-[0.3] dark:opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(#a8a29e 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] bg-gradient-to-br from-indigo-300/30 to-purple-300/30 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-rose-300/30 to-orange-200/30 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>
      <Header currentView={currentView} onViewChange={setCurrentView} onHomeClick={handleGoHome} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8 relative z-0">{renderContent()}</main>
      <Footer />
      {currentView === 'redesign' && (
        <button onClick={scrollToTop} className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 p-3 md:p-4 rounded-full shadow-2xl transition-all duration-500 transform ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'} bg-slate-900 dark:bg-indigo-600 text-white border border-white/20 hover:scale-110 active:scale-95`} aria-label="Back to Top">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" /></svg>
        </button>
      )}
    </div>
  );
};

export default App;
