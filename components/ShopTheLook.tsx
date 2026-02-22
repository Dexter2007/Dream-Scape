
import React, { useState, useRef, useEffect } from 'react';
import { LookCollection, RoomStyle, ProductItem } from '../types';
import { ImageUpload } from './ImageUpload';
import { generateShopTheLook } from '../services/geminiService';
import { LoadingOverlay } from './LoadingOverlay';
import { ROOM_STYLES } from '../constants';

// Initial curated collections
const INITIAL_COLLECTIONS: LookCollection[] = [
  {
    id: '1',
    title: 'Modern Sanctuary',
    style: RoomStyle.Modern,
    description: 'A clean, calm space featuring sleek lines and neutral tones.',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    products: [
      { id: 'p1', name: 'Velvet Sofa', price: 1299, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80', query: 'velvet sofa modern' },
      { id: 'p2', name: 'Abstract Art Print', price: 149, image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=300&q=80', query: 'abstract art print' },
      { id: 'p3', name: 'Marble Coffee Table', price: 499, image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=300&q=80', query: 'marble coffee table' },
    ]
  },
  {
    id: '2',
    title: 'Boho Dream',
    style: RoomStyle.Bohemian,
    description: 'Textures, plants, and earthy colors for a relaxed vibe.',
    image: 'https://images.unsplash.com/photo-1522444195799-478538b28823?auto=format&fit=crop&w=800&q=80',
    products: [
      { id: 'p4', name: 'Rattan Chair', price: 299, image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=300&q=80', query: 'rattan chair' },
      { id: 'p5', name: 'Woven Rug', price: 199, image: 'https://images.unsplash.com/photo-1575414723320-c2883b27c15e?auto=format&fit=crop&w=300&q=80', query: 'woven bohemian rug' },
      { id: 'p6', name: 'Macrame Plant Hanger', price: 35, image: 'https://images.unsplash.com/photo-1522751512423-1d02da42d22b?auto=format&fit=crop&w=300&q=80', query: 'macrame plant hanger' },
    ]
  },
  {
    id: '3',
    title: 'Industrial Loft',
    style: RoomStyle.Industrial,
    description: 'Raw materials meeting modern comfort.',
    image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80',
    products: [
      { id: 'p7', name: 'Leather Armchair', price: 899, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80', query: 'leather armchair industrial' },
      { id: 'p8', name: 'Metal Floor Lamp', price: 129, image: 'https://images.unsplash.com/photo-1507473888900-52e1adad70ac?auto=format&fit=crop&w=300&q=80', query: 'metal floor lamp' },
      { id: 'p9', name: 'Reclaimed Wood Desk', price: 599, image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=80', query: 'reclaimed wood desk' },
    ]
  },
];

// Helper pool for random products
const PRODUCT_IMAGES_POOL = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507473888900-52e1adad70ac?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1575414723320-c2883b27c15e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1522751512423-1d02da42d22b?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=300&q=80',
];

const generateRandomCollection = (idSuffix: string): LookCollection => {
  // Pick a random style from the global constants
  const randomStyleIndex = Math.floor(Math.random() * ROOM_STYLES.length);
  const styleData = ROOM_STYLES[randomStyleIndex];
  
  // Generate random products for this style
  const productCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 products
  const products: ProductItem[] = Array.from({ length: productCount }).map((_, i) => {
    const types = ['Sofa', 'Chair', 'Lamp', 'Table', 'Rug', 'Art', 'Plant', 'Vase', 'Cabinet', 'Mirror'];
    const type = types[Math.floor(Math.random() * types.length)];
    const price = Math.floor(Math.random() * 1500) + 50;
    const img = PRODUCT_IMAGES_POOL[Math.floor(Math.random() * PRODUCT_IMAGES_POOL.length)];
    
    return {
      id: `rand-${idSuffix}-${i}`,
      name: `${styleData.label} ${type}`,
      price,
      image: img,
      query: `${styleData.label} ${type} furniture`,
      category: 'Furniture'
    };
  });

  const titles = ['Living', 'Retreat', 'Haven', 'Space', 'Lounge', 'Studio', 'Corner', 'Oasis', 'Sanctuary', 'Vibes'];
  const randomTitleSuffix = titles[Math.floor(Math.random() * titles.length)];

  return {
    id: `col-${idSuffix}`,
    title: `${styleData.label} ${randomTitleSuffix}`,
    style: styleData.value,
    description: styleData.description,
    image: styleData.image,
    products
  };
};

// Helper to generate a placeholder color based on string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// --- Product Card Component (Matched to Screenshot) ---
const ProductCard: React.FC<{ product: ProductItem }> = ({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const bgColor = stringToColor(product.name + (product.category || ''));
  const buyUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(product.query || product.name)}`;

  return (
    <div className="flex items-center gap-3 md:gap-5 p-3 md:p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group">
      {/* Product Image Square */}
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 relative bg-slate-100 dark:bg-slate-700 shadow-inner">
         <div 
          className={`absolute inset-0 flex items-center justify-center text-white font-bold text-xl uppercase ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ backgroundColor: bgColor }}
        >
           {product.name.substring(0, 1)}
        </div>
        {product.image && (
          <img 
            src={product.image} 
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>
      
      {/* Product Info */}
      <div className="flex-grow min-w-0 flex flex-col justify-center">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Product</div>
        <h5 className="font-serif font-bold text-base md:text-lg text-slate-900 dark:text-white leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {product.name}
        </h5>
        <div className="text-indigo-600 dark:text-indigo-400 font-bold text-base mt-0.5">
           ${product.price}
        </div>
      </div>
      
      {/* Buy Button */}
      <a 
        href={buyUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="hidden sm:flex bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold items-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-lg shadow-slate-900/10 active:scale-95 whitespace-nowrap"
      >
        Buy Now
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
        </svg>
      </a>
      {/* Mobile Icon Button */}
      <a 
        href={buyUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="sm:hidden bg-slate-900 dark:bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-lg active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
           <path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.18 3a65.25 65.25 0 0 1 13.36 1.412.75.75 0 0 1 .58.875 48.645 48.645 0 0 1-1.618 6.2.75.75 0 0 1-.712.513H6a2.503 2.503 0 0 0-2.292 1.5H17.25a.75.75 0 0 1 0 1.5H2.76a.75.75 0 0 1-.748-.807 4.002 4.002 0 0 1 2.716-3.486L3.626 2.716a.25.25 0 0 0-.248-.216H1.75A.75.75 0 0 1 1 1.75ZM6 17.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm9.75 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
        </svg>
      </a>
    </div>
  );
};

// --- Collection Card Component (Wide Layout) ---
const CollectionCard: React.FC<{ collection: LookCollection }> = ({ collection }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedProducts = isExpanded ? collection.products : collection.products.slice(0, 4);
  const remainingCount = Math.max(0, collection.products.length - 4);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row h-full lg:min-h-[500px]">
      
      {/* Left: Hero Image */}
      <div className="lg:w-[60%] relative group overflow-hidden h-[300px] lg:h-auto">
        <img 
          src={collection.image} 
          alt={collection.title} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity"></div>
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 flex flex-col items-start gap-2 md:gap-3">
           <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
             {collection.style}
           </span>
           <h3 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight drop-shadow-sm">
             {collection.title}
           </h3>
           <p className="text-slate-200 text-sm lg:text-base max-w-lg font-light leading-relaxed">
             {collection.description}
           </p>
        </div>
      </div>

      {/* Right: Product List */}
      <div className="lg:w-[40%] bg-white dark:bg-slate-800 flex flex-col border-l border-slate-100 dark:border-slate-700">
         <div className="p-6 md:p-8 pb-4 flex justify-between items-baseline border-b border-slate-50 dark:border-slate-700/50">
            <h4 className="font-serif font-bold text-xl md:text-2xl text-slate-900 dark:text-white">Featured Items</h4>
            <span className="font-serif italic text-slate-400 dark:text-slate-500 text-sm">{collection.products.length} items</span>
         </div>

         <div className="flex-grow p-4 md:p-6 space-y-4 overflow-y-auto max-h-[400px] lg:max-h-[600px] custom-scrollbar bg-slate-50/50 dark:bg-slate-900/20">
            {displayedProducts.map(product => (
               <ProductCard key={product.id} product={product} />
            ))}
            
            {!isExpanded && remainingCount > 0 && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="w-full py-3 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors border border-dashed border-slate-300 rounded-xl hover:border-indigo-300 flex items-center justify-center gap-2 group"
              >
                 <span>+ {remainingCount} more items</span>
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:translate-y-0.5 transition-transform">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                 </svg>
              </button>
            )}

            {isExpanded && collection.products.length > 4 && (
               <button 
                onClick={() => setIsExpanded(false)}
                className="w-full py-3 text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors flex items-center justify-center gap-2 group border border-transparent hover:border-slate-200 rounded-xl"
              >
                 <span>Show less</span>
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform">
                    <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01.02 1.06z" clipRule="evenodd" />
                 </svg>
              </button>
            )}
         </div>
      </div>
    </div>
  );
};

export const ShopTheLook: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [generatedLook, setGeneratedLook] = useState<LookCollection | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Retry Countdown Timer
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  // Infinite Scroll State
  const [displayedCollections, setDisplayedCollections] = useState<LookCollection[]>(INITIAL_COLLECTIONS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Back to Top State
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleImageSelect = async (base64: string) => {
    setPreviewImage(base64);
    setAnalyzing(true);
    setError(null);
    setRetryCountdown(0);
    setGeneratedLook(null);
    try {
       const look = await generateShopTheLook(base64);
       setGeneratedLook(look);
       // Prepend to list but we will display it separately in "Result" section for better UX
       setDisplayedCollections(prev => [look, ...prev]);
       
       setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
    } catch (e: any) {
       console.error(e);
       if (e.message === 'RATE_LIMIT_EXCEEDED') {
          setError("System busy. Please wait 60s before trying again.");
          setRetryCountdown(60);
       } else {
          setError(e.message || "Failed to analyze image. Please try again.");
       }
    } finally {
       setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setGeneratedLook(null);
    setPreviewImage(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHiddenFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        handleImageSelect(base64);
      };
      reader.readAsDataURL(file);
    }
    // Reset so same file can be selected again
    if (e.target) e.target.value = '';
  };

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMoreCollections();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [displayedCollections, isLoadingMore]);

  // Scroll to Top Observer
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadMoreCollections = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      // Generate 2 new random collections derived from our diverse style definitions
      // This ensures new content is always unique and random
      const newItems = [
          generateRandomCollection(`${Date.now()}-1`),
          generateRandomCollection(`${Date.now()}-2`)
      ];
      setDisplayedCollections(prev => [...prev, ...newItems]);
      setIsLoadingMore(false);
    }, 1500);
  };

  return (
    <>
      <div className="space-y-12 md:space-y-20 animate-fade-in-up pb-24">
        {/* Hidden File Input */}
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleHiddenFileInput}
        />

        {/* Hero / Upload Section */}
        <div className="text-center max-w-4xl mx-auto space-y-8 md:space-y-12 pt-4 md:pt-8">
          <div className="space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              AI Visual Search
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold font-serif text-slate-900 dark:text-white tracking-tight">
              Shop the <span className="italic text-indigo-600 dark:text-indigo-400">Look</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-light leading-relaxed px-4">
              Upload any room photo. Our AI breaks down the style and finds the exact furniture pieces for you to buy.
            </p>
          </div>

          {!previewImage && !generatedLook && (
             <div className="transform hover:scale-[1.01] transition-transform duration-500 px-4">
               <ImageUpload onImageSelected={handleImageSelect} />
             </div>
          )}

          {analyzing && previewImage && (
            <div className="relative h-64 md:h-96 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl mx-4 md:mx-auto max-w-3xl">
               <img src={previewImage} className="w-full h-full object-cover blur-md opacity-40 scale-110" alt="Scanning" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingOverlay status="Analyzing aesthetics..." />
               </div>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-300 rounded-2xl border border-red-100 dark:border-red-900/50 flex flex-col items-center gap-2 mx-4">
              <span className="font-bold">Analysis Failed</span>
              <span className="text-sm opacity-90">{error}</span>
              {retryCountdown > 0 ? (
                <div className="mt-2 text-xs font-semibold uppercase tracking-wider bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-full">
                  Retry available in {retryCountdown}s
                </div>
              ) : (
                <button onClick={() => setPreviewImage(null)} className="mt-2 text-xs uppercase tracking-wider font-bold underline hover:no-underline">
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Generated Result Section (Top Detail View) */}
        {generatedLook && (
          <div ref={resultRef} className="animate-fade-in-up scroll-mt-32 max-w-6xl mx-auto px-4 lg:px-0">
             <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Analysis Result</p>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">
                     Your Custom Look
                  </h3>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-2"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" /></svg>
                   <span className="hidden sm:inline">Scan Another</span>
                   <span className="sm:hidden">Scan</span>
                </button>
             </div>
             
             <CollectionCard collection={generatedLook} />
          </div>
        )}

        {/* Collections Grid Header */}
        <div className="flex flex-col items-center justify-center py-8 md:py-12 space-y-4 px-4">
           <div className="w-px h-16 bg-gradient-to-b from-transparent via-slate-300 to-slate-300 dark:via-slate-600 dark:to-slate-600"></div>
           <h2 className="text-3xl md:text-5xl font-bold font-serif text-slate-900 dark:text-white text-center">
              Trending Collections
           </h2>
           <p className="text-slate-500 dark:text-slate-400 max-w-xl text-center text-sm md:text-base">
              Hand-picked interior designs with shoppable furniture lists.
           </p>
        </div>

        {/* Editorial List (Single Column Wide Cards) */}
        <div className="flex flex-col gap-8 md:gap-16 max-w-6xl mx-auto px-4 lg:px-0">
          {displayedCollections.map((collection, index) => (
             <div key={`${collection.id}-${index}`} className="animate-fade-in-up">
                <CollectionCard collection={collection} />
             </div>
          ))}
        </div>
        
        {/* Loading Sentinel */}
        <div ref={observerTarget} className="flex justify-center py-12">
          {isLoadingMore && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-12 h-12">
                   <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Curating more styles...</span>
              </div>
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 p-3 md:p-4 rounded-full shadow-2xl transition-all duration-500 transform
          ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}
          bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-700 dark:hover:bg-indigo-500
          hover:scale-110 active:scale-95 border border-white/20 dark:border-indigo-400/30
        `}
        aria-label="Back to Top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
          <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
        </svg>
      </button>
    </>
  );
};
