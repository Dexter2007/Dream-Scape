
import { DesignAdvice, LookCollection } from "../types";

// Simple in-memory cache to prevent redundant API calls
const responseCache = new Map<string, any>();

// API Base URL - Points to the local Node.js server
// In production, this would be an environment variable
const API_BASE_URL = 'http://localhost:3001';

// Helper to generate a cache key
const getCacheKey = (type: string, data: string, ...args: any[]) => {
  const dataSignature = `${data.substring(0, 50)}_${data.length}_${data.slice(-50)}`;
  return `${type}_${dataSignature}_${args.join('_')}`;
};

// Fallback images
const FALLBACK_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=300&q=80',
];

// Helper to crop image
async function cropImage(base64Image: string, box: number[]): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const [ymin, xmin, ymax, xmax] = box;
      const width = img.width;
      const height = img.height;
      const x = (xmin / 1000) * width;
      const y = (ymin / 1000) * height;
      const w = ((xmax - xmin) / 1000) * width;
      const h = ((ymax - ymin) / 1000) * height;

      if (w <= 0 || h <= 0) { resolve(''); return; }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      } else {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = base64Image;
  });
}

// Helper to resize image
// OPTIMIZATION: Aggressive downsizing on client to save upload bandwidth
const resizeImage = (base64Str: string, maxDimension = 640): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Str;
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      
      if (w <= maxDimension && h <= maxDimension) {
        resolve(base64Str);
        return;
      }

      if (w > h) {
        if (w > maxDimension) {
          h = Math.round(h * (maxDimension / w));
          w = maxDimension;
        }
      } else {
        if (h > maxDimension) {
          w = Math.round(w * (maxDimension / h));
          h = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// Generic Fetch Helper
async function apiCall(endpoint: string, body: any) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      let errorMsg = "Server Error";
      try {
         const errorData = await response.json();
         errorMsg = errorData.error || errorMsg;
      } catch (e) {
         // Fallback if response isn't JSON (e.g., 404 HTML from Vite if hitting wrong port)
         if (response.status === 404) {
            errorMsg = "Server endpoint not found. Is 'node server.js' running on port 3001?";
         } else {
            errorMsg = `Server Error (${response.status})`;
         }
      }
      throw new Error(errorMsg);
    }
    return response.json();
  } catch (error: any) {
    // Handle network errors (e.g., server down)
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error("Could not connect to server. Please ensure 'node server.js' is running.");
    }
    throw error;
  }
}

// ------------------------------------------------------------------
// 1. IMAGE GENERATION
// ------------------------------------------------------------------
export const generateRoomRedesign = async (
  base64Image: string,
  style: string,
  onStatusUpdate?: (msg: string) => void
): Promise<string> => {
  const cacheKey = getCacheKey('redesign', base64Image, style);
  if (responseCache.has(cacheKey)) {
    if (onStatusUpdate) onStatusUpdate("Loading from cache...");
    return responseCache.get(cacheKey);
  }

  if (onStatusUpdate) onStatusUpdate("Optimizing image...");
  // Resize on client before upload
  const optimizedImage = await resizeImage(base64Image, 640);

  if (onStatusUpdate) onStatusUpdate("Sending to design engine...");
  
  // Set up timers to provide feedback during long polling (High Traffic Handling)
  const trafficTimer1 = setTimeout(() => {
    if (onStatusUpdate) onStatusUpdate("High traffic. Auto-retrying in background...");
  }, 10000);

  const trafficTimer2 = setTimeout(() => {
    if (onStatusUpdate) onStatusUpdate("Still working... High demand right now.");
  }, 25000);

  const trafficTimer3 = setTimeout(() => {
    if (onStatusUpdate) onStatusUpdate("Almost there... Thanks for your patience.");
  }, 45000);

  try {
    const data = await apiCall('/api/redesign', { image: optimizedImage, style });
    if (data.result) {
      responseCache.set(cacheKey, data.result);
      return data.result;
    }
    throw new Error("No image returned from server");
  } catch (err: any) {
    console.error("Redesign API Error:", err);
    throw err;
  } finally {
    clearTimeout(trafficTimer1);
    clearTimeout(trafficTimer2);
    clearTimeout(trafficTimer3);
  }
};

// ------------------------------------------------------------------
// 2. TEXT/MULTIMODAL GENERATION
// ------------------------------------------------------------------

export const generateQuizResultDescription = async (
  style: string
): Promise<string> => {
  const cacheKey = `quiz_desc_${style}`;
  if (responseCache.has(cacheKey)) return responseCache.get(cacheKey);

  try {
    const data = await apiCall('/api/quiz-desc', { style });
    const text = data.text || `A unique fusion style tailored just for you: ${style}.`;
    responseCache.set(cacheKey, text);
    return text;
  } catch (e) {
    console.warn("Quiz Desc Error", e);
    return `A unique fusion style tailored just for you: ${style}.`;
  }
};

export const getDesignAdvice = async (
  base64Image: string,
  style: string,
  onStatusUpdate?: (msg: string) => void
): Promise<DesignAdvice> => {
  const cacheKey = getCacheKey('advice', base64Image, style);
  if (responseCache.has(cacheKey)) return responseCache.get(cacheKey);

  const optimizedImage = await resizeImage(base64Image, 480);
  
  try {
    const result = await apiCall('/api/advice', { image: optimizedImage, style });
    responseCache.set(cacheKey, result);
    return result as DesignAdvice;
  } catch (error: any) {
    console.error("Advice API Error:", error);
    throw error;
  }
};

export const generateShopTheLook = async (
  base64Image: string,
  onStatusUpdate?: (msg: string) => void
): Promise<LookCollection> => {
  const cacheKey = getCacheKey('shop', base64Image);
  if (responseCache.has(cacheKey)) return responseCache.get(cacheKey);

  const optimizedImage = await resizeImage(base64Image, 480);

  try {
    // 1. Get raw product data from server
    const data = await apiCall('/api/shop', { image: optimizedImage });
    
    // 2. Process images on client (crop using canvas)
    // We do this on client to avoid complex canvas setups on node server
    const productsWithImages = await Promise.all((data.products || []).map(async (p: any, idx: number) => {
      let imageUrl = '';
      if (p.box_2d && p.box_2d.length === 4) {
           imageUrl = await cropImage(optimizedImage, p.box_2d);
      }
      if (!imageUrl) {
         imageUrl = FALLBACK_PRODUCT_IMAGES[Math.floor(Math.random() * FALLBACK_PRODUCT_IMAGES.length)];
      }
      
      return {
        id: `gen-${idx}`,
        name: p.name,
        price: p.price,
        image: imageUrl, 
        query: p.query || p.name,
        category: p.category
      };
    }));

    const result = {
      id: Date.now().toString(),
      title: data.title || "Custom Collection",
      style: data.style || "Modern",
      description: data.description || "A curated collection based on your image.",
      image: base64Image,
      products: productsWithImages
    } as LookCollection;

    responseCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    console.error("Shop API Error:", error);
    throw error;
  }
};
