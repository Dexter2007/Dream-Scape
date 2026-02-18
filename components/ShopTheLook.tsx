
import React, { useState, useRef, useEffect } from 'react';
import { LookCollection, RoomStyle, ProductItem } from '../types';
import { ImageUpload } from './ImageUpload';
import { generateShopTheLook } from '../services/geminiService';
import { LoadingOverlay } from './LoadingOverlay';

// Static fallbacks for "Trending" - Now with real Unsplash images
const COLLECTIONS: LookCollection[] = [
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

// Helper to generate a placeholder color based on string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Component for a Product Card
const ProductCard: React.FC<{ product: ProductItem }> = ({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const bgColor = stringToColor(product.name + (product.category || ''));
  const buyUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(product.query || product.name)}`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-default">
      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 relative bg-slate-100 dark:bg-slate-700">
        {/* Placeholder / Loading State */}
        <div 
          className={`absolute inset-0 flex items-center justify-center text-white font-bold text-xl uppercase transition-opacity duration-500 z-10 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ backgroundColor: bgColor }}
        >
           <span className="drop-shadow-md">{product.name.substring(0, 1)}</span>
        </div>
        
        {product.image && (
          <img 
            src={product.image} 
            alt={product.name} 
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-20 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none z-30" />
      </div>
      
      <div className="flex-grow text-center sm:text-left">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{product.category || 'Product'}</div>
        <h5 className="font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{product.name}</h5>
        <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">${product.price}</p>
      </div>
      <a 
        href={buyUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 transform flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
      >
        <span>Buy Now</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
        </svg>
      </a>
    </div>
  );
};

export const ShopTheLook: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [generatedLook, setGeneratedLook] = useState<LookCollection | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Infinite Scroll State
  const [displayedCollections, setDisplayedCollections] = useState<LookCollection[]>(COLLECTIONS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleImageSelect = async (base64: string) => {
    setPreviewImage(base64);
    setAnalyzing(true);
    setError(null);
    setGeneratedLook(null);
    try {
       const look = await generateShopTheLook(base64);
       setGeneratedLook(look);
       // Add the new look to the collections feed
       setDisplayedCollections(prev => [look, ...prev]);
       
       setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }, 100);
    } catch (e: any) {
       console.error(e);
       setError(e.message || "Failed to analyze image. Please try again.");
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

  const loadMoreCollections = () => {
    setIsLoadingMore(true);
    // Simulate fetching more data by duplicating existing collections with new IDs
    setTimeout(() => {
      const newCollections = COLLECTIONS.map((c, i) => ({
        ...c,
        id: `${c.id}-${Date.now()}-${i}`,
        title: `${c.title} ${Math.floor(Math.random() * 100)}` // Variation in title
      }));
      setDisplayedCollections(prev => [...prev, ...newCollections]);
      setIsLoadingMore(false);
    }, 1500);
  };

  return (
    <div className="space-y-16 animate-fade-in-up pb-12">
      
      {/* Hero / Upload Section */}
      <div className="text-center max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 dark:text-white">Shop Your Inspiration</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Upload any room photo you love. Our AI will analyze the style and find similar furniture and decor items for you to buy.
          </p>
        </div>

        {!previewImage && !generatedLook && (
           <div className="transform hover:scale-[1.01] transition-transform duration-300">
             <ImageUpload onImageSelected={handleImageSelect} />
           </div>
        )}

        {analyzing && previewImage && (
          <div className="relative h-96 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl mx-auto max-w-3xl">
             <img src={previewImage} className="w-full h-full object-cover blur-sm opacity-50" alt="Scanning" />
             <div className="absolute inset-0 flex items-center justify-center">
                <LoadingOverlay status="Identifying products..." />
             </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl border border-red-100 dark:border-red-800 text-sm">
            {error}
            <button onClick={() => setPreviewImage(null)} className="ml-4 underline font-bold">Try Again</button>
          </div>
        )}
      </div>

      {/* Generated Result Section (Top Detail View) */}
      {generatedLook && (
        <div ref={resultRef} className="animate-fade-in-up scroll-mt-24">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">Analysis Complete</span>
              </h3>
              <button onClick={handleReset} className="text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                 Scan Another Room
              </button>
           </div>

           <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
             <div className="grid lg:grid-cols-2">
                {/* Image Side */}
                <div className="relative h-[400px] lg:h-auto min-h-[400px] group">
                   <img src={generatedLook.image} alt="Analyzed Room" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                      <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit mb-3">
                        {generatedLook.style}
                      </span>
                      <h2 className="text-3xl font-bold text-white mb-2 font-serif">{generatedLook.title}</h2>
                      <p className="text-white/90 text-sm leading-relaxed max-w-md">{generatedLook.description}</p>
                   </div>
                </div>

                {/* Products Side */}
                <div className="p-6 lg:p-10 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col h-full">
                   <div className="flex items-center gap-2 mb-6">
                      <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">Featured Items</h4>
                      <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold ml-auto">
                        {generatedLook.products.length} Found
                      </span>
                   </div>
                   
                   <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow max-h-[500px]">
                      {generatedLook.products.map((product) => (
                         <ProductCard key={product.id} product={product} />
                      ))}
                   </div>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Collections Divider */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#fafaf9] dark:bg-[#0f172a] px-6 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
             Trending Collections
          </span>
        </div>
      </div>

      {/* Infinite Scroll Grid */}
      <div className="grid gap-12">
        {displayedCollections.map((collection, index) => (
          <div key={`${collection.id}-${index}`} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors group animate-fade-in-up">
            <div className="grid md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-3 relative h-64 md:h-auto overflow-hidden">
                <img 
                  src={collection.image} 
                  alt={collection.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-8">
                  <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                    <span className="bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block shadow-lg">
                      {collection.style}
                    </span>
                    <h3 className="text-3xl font-bold text-white mb-2 font-serif">{collection.title}</h3>
                    <p className="text-slate-200 text-sm max-w-md">{collection.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2 p-6 lg:p-8 bg-slate-50 dark:bg-slate-900/30 flex flex-col justify-center transition-colors border-l border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                   Featured Items
                   <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-auto">{collection.products.length} items</span>
                </h4>
                <div className="space-y-4">
                  {collection.products.slice(0, 3).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                  {collection.products.length > 3 && (
                    <div className="text-center pt-2">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">+ {collection.products.length - 3} more items</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Sentinel for Infinite Scroll */}
        <div ref={observerTarget} className="flex justify-center py-8">
          {isLoadingMore ? (
             <div className="flex flex-col items-center gap-3">
               <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
               <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Loading more styles...</span>
             </div>
          ) : (
             <div className="h-4"></div>
          )}
        </div>
      </div>
    </div>
  );
};
