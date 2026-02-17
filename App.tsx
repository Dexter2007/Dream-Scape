import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ImageUpload } from './components/ImageUpload';
import { StyleSelector } from './components/StyleSelector';
import { AdvicePanel } from './components/AdvicePanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { StyleQuiz } from './components/StyleQuiz';
import { ShopTheLook } from './components/ShopTheLook';
import { RoomDesigner } from './components/RoomDesigner';
import { RoomStyle, GenerationResult, LoadingState, AppView } from './types';
import { generateRoomRedesign, getDesignAdvice } from './services/geminiService';
import { ROOM_STYLES } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('redesign');
  
  // AI Redesign State
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<RoomStyle>(RoomStyle.Modern);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isGenerating: false, statusMessage: '' });
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setOriginalImage(null);
    setResult(null);
    setError(null);
  };

  const handleDownload = (format: 'png' | 'jpeg') => {
    if (!result?.generatedImage) return;

    if (format === 'png') {
      const link = document.createElement('a');
      link.href = result.generatedImage;
      link.download = `dreamspace-${selectedStyle.toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Convert to JPEG
      const img = new Image();
      img.src = result.generatedImage;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill white background for transparent PNGs if any
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const jpegUrl = canvas.toDataURL('image/jpeg', 0.9);
          const link = document.createElement('a');
          link.href = jpegUrl;
          link.download = `dreamspace-${selectedStyle.toLowerCase()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };
    }
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setLoadingState({ isGenerating: true, statusMessage: 'Dreaming up your new room...' });
    setError(null);
    setResult({ originalImage, generatedImage: null, advice: null }); 

    try {
      setLoadingState({ isGenerating: true, statusMessage: 'Analyzing space & redesigning...' });

      const [generatedImage, advice] = await Promise.all([
        generateRoomRedesign(originalImage, selectedStyle),
        getDesignAdvice(originalImage, selectedStyle)
      ]);

      setResult({
        originalImage,
        generatedImage,
        advice
      });
    } catch (err: any) {
      console.error("Generation failed", err);
      setError(err.message || "Something went wrong. Please check your API key and try again.");
    } finally {
      setLoadingState({ isGenerating: false, statusMessage: '' });
    }
  };

  const handleQuizComplete = (style: RoomStyle) => {
    setSelectedStyle(style);
    setCurrentView('redesign');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'quiz':
        return <StyleQuiz onComplete={handleQuizComplete} />;
      case 'shop':
        return <ShopTheLook />;
      case 'designer':
        return <RoomDesigner />;
      case 'redesign':
      default:
        return (
          <>
            {/* Hero / Intro */}
            {!originalImage && (
              <div className="relative animate-fade-in-up">
                <div className="text-center max-w-5xl mx-auto py-24 md:py-32 px-4 relative z-10">
                  
                  <span className="inline-block py-1 px-3 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wide mb-6 shadow-sm">
                    POWERED BY GEMINI AI
                  </span>

                  <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-slate-900 mb-8 font-serif leading-tight">
                    Redesign your <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 drop-shadow-sm">
                      sanctuary.
                    </span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-slate-600 mb-12 font-light leading-relaxed max-w-2xl mx-auto">
                    Experience the future of interior design. Upload a photo, curate your style, and watch your space transform instantly.
                  </p>

                  <div className="max-w-xl mx-auto bg-white/60 backdrop-blur-md p-2 rounded-3xl shadow-2xl shadow-indigo-200/40 border border-white/60 transform hover:scale-[1.01] transition-transform duration-300 ring-1 ring-white/60">
                    <ImageUpload onImageSelected={setOriginalImage} />
                  </div>

                  {/* Feature Grid */}
                  <div className="grid md:grid-cols-3 gap-8 mt-24 text-left">
                    <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl border border-white/40 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform shadow-inner">
                        🎨
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">15+ Design Styles</h3>
                      <p className="text-slate-600">From Japandi to Cyberpunk, explore a diverse range of aesthetic transformations.</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl border border-white/40 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                       <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform shadow-inner">
                        💡
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Expert Advice</h3>
                      <p className="text-slate-600">Get actionable critiques, color palettes, and furniture suggestions.</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md p-8 rounded-2xl border border-white/40 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                       <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform shadow-inner">
                        ⚡
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Rendering</h3>
                      <p className="text-slate-600">Visualize your new room in seconds with state-of-the-art Generative AI.</p>
                    </div>
                  </div>

                  {/* Style Marquee */}
                  <div className="mt-24">
                     <div className="flex justify-between items-end mb-8">
                        <h2 className="text-3xl font-bold font-serif text-slate-900">Trending Styles</h2>
                        <button onClick={() => setCurrentView('quiz')} className="text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 group">
                           Take the Style Quiz <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {ROOM_STYLES.slice(0, 4).map(style => (
                           <div 
                              key={style.value} 
                              className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-500" 
                              onClick={() => setSelectedStyle(style.value)}
                           >
                              {/* Background Image */}
                              <img 
                                src={style.image} 
                                alt={style.label} 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                              />

                              {/* Dark Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>

                              {/* Content Container - Centered and Elegant */}
                              <div className="absolute inset-0 flex flex-col justify-end p-6 items-center text-center">
                                {/* Title Slide Up */}
                                <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                                  <p className="font-serif text-2xl text-white tracking-widest font-medium drop-shadow-md">
                                    {style.label}
                                  </p>
                                </div>
                                
                                {/* Description Fade In */}
                                <div className="max-h-0 overflow-hidden group-hover:max-h-24 transition-[max-height] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]">
                                   <div className="pt-3 pb-1">
                                     <div className="w-8 h-px bg-white/40 mx-auto mb-3"></div>
                                     <p className="text-xs text-slate-100 font-sans font-light tracking-wide leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                       {style.description}
                                     </p>
                                   </div>
                                </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                </div>
              </div>
            )}

            {/* Active Redesign View */}
            {originalImage && (
              <div className="space-y-8 animate-fade-in-up pt-12">
                {/* Control Bar */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-indigo-100/50 border border-white/50">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden relative group cursor-pointer shadow-md ring-4 ring-white" onClick={handleReset}>
                         <img src={originalImage} alt="Original" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white">
                              <path d="M10 2a.75.75 0 0 1 .75.75v1.259l1.33-1.33a.75.75 0 1 1 1.06 1.06l-2.5 2.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.33 1.33V2.75A.75.75 0 0 1 10 2Z" />
                            </svg>
                         </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 font-serif">Your Room</h2>
                        <button onClick={handleReset} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                          Select different photo
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={handleGenerate}
                        disabled={loadingState.isGenerating}
                        className="w-full md:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                      >
                        {loadingState.isGenerating ? 'Designing...' : 'Generate New Design'}
                        {!loadingState.isGenerating && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Style Selector inside the control panel */}
                  <div className="mt-8 pt-8 border-t border-slate-100/50">
                    <StyleSelector selectedStyle={selectedStyle} onStyleSelect={setSelectedStyle} />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Results Section */}
                {(result || loadingState.isGenerating) && (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                     {/* Images Area */}
                     <div className="lg:col-span-2 space-y-4">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100/50 border border-white/60 aspect-[4/3] bg-white group">
                           {loadingState.isGenerating && <LoadingOverlay status={loadingState.statusMessage} />}
                           
                           {result?.generatedImage ? (
                             <>
                               <img src={result.generatedImage} alt="Redesigned Room" className="w-full h-full object-cover" />
                               
                               <div className="absolute bottom-6 right-6 bg-white/90 text-slate-900 text-sm font-medium px-4 py-2 rounded-full backdrop-blur-xl shadow-lg font-serif">
                                 {selectedStyle} Design
                               </div>
                             </>
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                                <span className="font-light">{loadingState.isGenerating ? '' : 'Your masterpiece will appear here'}</span>
                             </div>
                           )}
                        </div>

                        {/* Dedicated Download Section - Outside of the image */}
                        {result?.generatedImage && (
                          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in-up">
                            <div className="flex items-center gap-4">
                              <div className="bg-green-100 p-3 rounded-full text-green-600 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l4.75-6.75Z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-slate-900 font-bold text-lg">Design Ready</h3>
                                <p className="text-slate-500 text-sm">Download your new {selectedStyle.toLowerCase()} room design.</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-3 w-full sm:w-auto">
                              <button 
                                onClick={() => handleDownload('png')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all focus:ring-2 focus:ring-indigo-100 shadow-sm"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                                </svg>
                                PNG
                              </button>
                              <button 
                                onClick={() => handleDownload('jpeg')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-slate-900 border border-slate-900 rounded-xl hover:bg-indigo-600 hover:border-indigo-600 transition-all shadow-md focus:ring-2 focus:ring-indigo-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                  <path d="M13.75 7h-3v5.296l1.943-2.048a.75.75 0 0 1 1.114 1.004l-3.25 3.5a.75.75 0 0 1-1.114 0l-3.25-3.5a.75.75 0 1 1 1.114-1.004l1.943 2.048V7h1.5V1.75a.75.75 0 0 0-1.5 0V7h-3A2.25 2.25 0 0 0 4 9.25v7.5A2.25 2.25 0 0 0 6.25 19h7.5A2.25 2.25 0 0 0 16 16.75v-7.5A2.25 2.25 0 0 0 13.75 7Z" />
                                </svg>
                                JPEG
                              </button>
                            </div>
                          </div>
                        )}
                     </div>

                     {/* Advice Area */}
                     <div className="lg:col-span-1 h-full min-h-[500px]">
                        {loadingState.isGenerating ? (
                          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-8 h-full flex flex-col gap-8 animate-pulse">
                             <div className="h-8 bg-slate-100 rounded-lg w-1/2"></div>
                             <div className="space-y-3">
                               <div className="h-4 bg-slate-100 rounded w-full"></div>
                               <div className="h-4 bg-slate-100 rounded w-full"></div>
                               <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                             </div>
                             <div className="h-40 bg-slate-100 rounded-2xl w-full mt-auto"></div>
                          </div>
                        ) : result?.advice ? (
                          <AdvicePanel advice={result.advice} />
                        ) : null}
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
    <div className="min-h-screen flex flex-col font-sans text-slate-900 relative selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* Global Background Elements */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-[#fafaf9]">
        {/* Dot Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: 'radial-gradient(#a8a29e 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
        
        {/* Rich Watercolor Meshes */}
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] bg-gradient-to-br from-indigo-300/30 to-purple-300/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-rose-300/30 to-orange-200/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply animate-blob animation-delay-2000"></div>
        <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-gradient-to-r from-emerald-200/20 to-teal-200/20 rounded-full blur-[90px] pointer-events-none mix-blend-multiply animate-blob animation-delay-4000"></div>

        {/* Central Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#fafaf9]/80 pointer-events-none"></div>
      </div>

      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-0">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
