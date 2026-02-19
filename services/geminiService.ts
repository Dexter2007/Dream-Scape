
import { GoogleGenAI, Type } from "@google/genai";
import { DesignAdvice, LookCollection } from "../types";

// --- PERSISTENT CACHE IMPLEMENTATION ---
class PersistentCache {
  private memoryCache = new Map<string, any>();
  private prefix = 'dsc_'; 
  private maxAge = 24 * 60 * 60 * 1000;

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage() {
    // Lazy load implementation
  }

  get(key: string): any | null {
    if (this.memoryCache.has(key)) return this.memoryCache.get(key);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.prefix + key);
        if (stored) {
          const { data, timestamp } = JSON.parse(stored);
          if (Date.now() - timestamp > this.maxAge) {
            localStorage.removeItem(this.prefix + key);
            return null;
          }
          this.memoryCache.set(key, data);
          return data;
        }
      } catch (e) {}
    }
    return null;
  }

  set(key: string, data: any): void {
    this.memoryCache.set(key, data);
    if (typeof window !== 'undefined') {
      try {
        const entry = JSON.stringify({ data, timestamp: Date.now() });
        localStorage.setItem(this.prefix + key, entry);
      } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.message?.toLowerCase().includes('quota')) {
          this.pruneCache();
          try {
             localStorage.setItem(this.prefix + key, JSON.stringify({ data, timestamp: Date.now() }));
          } catch (retryError) {}
        }
      }
    }
  }

  private pruneCache() {
    const keys: { key: string, timestamp: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(k) || '{}');
          keys.push({ key: k, timestamp: item.timestamp || 0 });
        } catch {
          keys.push({ key: k, timestamp: 0 });
        }
      }
    }
    keys.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(keys.length * 0.3) || 1;
    for (let i = 0; i < toRemove; i++) {
       localStorage.removeItem(keys[i].key);
    }
  }
}

const cache = new PersistentCache();
const resizedImageCache = new Map<string, string>();

const getCacheKey = (type: string, data: string, ...args: any[]) => {
  const dataSignature = `${data.substring(0, 30)}_${data.length}_${data.slice(-30)}`;
  return `${type}_${dataSignature}_${args.join('_')}`;
};

const cleanBase64 = (base64Data: string) => {
  return base64Data.split(',')[1] || base64Data;
};

const getMimeType = (base64Data: string) => {
  const match = base64Data.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const FALLBACK_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=300&q=80',
];

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

const resizeImage = (base64Str: string, maxDimension = 640): Promise<string> => {
  const cacheKey = `${base64Str.substring(0, 30)}_${base64Str.length}_${maxDimension}`;
  if (resizedImageCache.has(cacheKey)) {
    return Promise.resolve(resizedImageCache.get(cacheKey)!);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Str;
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w <= maxDimension && h <= maxDimension) {
        resizedImageCache.set(cacheKey, base64Str);
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
        const resized = canvas.toDataURL('image/jpeg', 0.5);
        resizedImageCache.set(cacheKey, resized);
        resolve(resized);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

async function withRetry<T>(
  operation: () => Promise<T>, 
  onStatusUpdate?: (msg: string) => void,
  maxRetries = 3
): Promise<T> {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempts++;
      const errorMessage = error.message || '';
      
      // If error suggests "Entity Not Found", it's likely a project mismatch with Gemini 3 Pro
      if (errorMessage.includes("Requested entity was not found")) {
        // This specific error is handled in the UI to re-trigger Key Selection
        throw error;
      }

      const isRateLimit = error.status === 429 || 
                          errorMessage.includes('429') || 
                          errorMessage.includes('exhausted') || 
                          errorMessage.includes('quota');
      const isOverloaded = error.status === 503 || errorMessage.includes('503') || errorMessage.includes('Overloaded');

      if (!isRateLimit && !isOverloaded) throw error;
      if (attempts >= maxRetries) throw new Error("AI capacity reached. Please try again in a few seconds.");

      const baseDelay = 2000 * Math.pow(2, attempts - 1);
      const delay = Math.random() * baseDelay + 500;
      
      if (onStatusUpdate) {
        onStatusUpdate(`Waiting for system capacity (Attempt ${attempts}/${maxRetries})...`);
      }
      await wait(delay);
    }
  }
  throw new Error("Request timed out.");
}

export const generateRoomRedesign = async (
  base64Image: string,
  style: string,
  onStatusUpdate?: (msg: string) => void
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing.");

  const cacheKey = getCacheKey('redesign', base64Image, style);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Optimized System Instructions for Pro Image model
  const prompt = `Act as a world-class architectural visualizer. 
  REIMAGINE the room in the attached image using a professional '${style}' interior design aesthetic.
  CORE CONSTRAINTS:
  1. STRUCTURAL INTEGRITY: Maintain exact window positions, door frames, and perspective.
  2. AESTHETIC TRANSFORMATION: Replace ALL furniture, textures, and lighting with high-end ${style} equivalents.
  3. LIGHTING: Ensure natural, photorealistic sunlight or studio-grade warm lighting.
  4. QUALITY: High resolution, professional photography style, no text, no watermarks.
  Return only the generated image.`;

  if (onStatusUpdate) onStatusUpdate("Optimizing source image for pro rendering...");
  const optimizedImage = await resizeImage(base64Image, 800);

  try {
    const result = await withRetry(async () => {
      // Create new instance to ensure freshest key is used
      const ai = new GoogleGenAI({ apiKey });
      const mimeType = getMimeType(optimizedImage);
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64(optimizedImage) } },
            { text: prompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "4:3",
            imageSize: "1K"
          }
        }
      });

      if (response.candidates?.[0]) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("Generation completed but no image was returned.");
    }, onStatusUpdate, 3);

    cache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    throw error;
  }
};

export const generateQuizResultDescription = async (style: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return `A unique style tailored for you: ${style}.`;

  const cacheKey = `quiz_desc_${style}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: `Write a captivating 2-sentence interior design description for "${style}".` }] }
    });
    const result = response.text || "";
    if (result) cache.set(cacheKey, result);
    return result || `A beautiful ${style} aesthetic curated just for you.`;
  } catch (e) {
    return `A unique fusion style tailored just for you: ${style}.`;
  }
};

export const getDesignAdvice = async (
  base64Image: string,
  style: string,
  onStatusUpdate?: (msg: string) => void
): Promise<DesignAdvice> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing.");

  const cacheKey = getCacheKey('advice', base64Image, style);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const optimizedImage = await resizeImage(base64Image, 384);

  try {
    const result = await withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey });
      const mimeType = getMimeType(optimizedImage);
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64(optimizedImage) } },
            { text: `Analyze this room for a '${style}' style redesign. Return JSON with critique, suggestions, colorPalette (name, hex), and furnitureRecommendations.` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              critique: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              colorPalette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                  },
                  required: ["name", "hex"]
                }
              },
              furnitureRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["critique", "suggestions", "colorPalette", "furnitureRecommendations"]
          }
        }
      });
      return JSON.parse(response.text || "{}") as DesignAdvice;
    }, onStatusUpdate, 3); 

    cache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    throw error;
  }
};

export const generateShopTheLook = async (
  base64Image: string,
  onStatusUpdate?: (msg: string) => void
): Promise<LookCollection> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing.");

  const cacheKey = getCacheKey('shop', base64Image);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const optimizedImage = await resizeImage(base64Image, 384);

  try {
    const result = await withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey });
      const mimeType = getMimeType(optimizedImage);
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64(optimizedImage) } },
            { text: `Identify furniture in this image. Return JSON with title, style, description, and products (name, price, category, query, box_2d [ymin, xmin, ymax, xmax]).` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              style: { type: Type.STRING },
              description: { type: Type.STRING },
              products: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                    query: { type: Type.STRING },
                    box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                  },
                  required: ["name", "price", "category", "query", "box_2d"]
                }
              }
            },
            required: ["title", "style", "description", "products"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      const productsWithImages = await Promise.all((data.products || []).map(async (p: any, idx: number) => {
        let imageUrl = '';
        if (p.box_2d?.length === 4) imageUrl = await cropImage(optimizedImage, p.box_2d);
        if (!imageUrl) imageUrl = FALLBACK_PRODUCT_IMAGES[Math.floor(Math.random() * FALLBACK_PRODUCT_IMAGES.length)];
        return { id: `gen-${idx}`, name: p.name, price: p.price, image: imageUrl, query: p.query || p.name, category: p.category };
      }));

      return {
        id: Date.now().toString(),
        title: data.title || "Custom Collection",
        style: data.style || "Modern",
        description: data.description || "A curated collection based on your image.",
        image: base64Image,
        products: productsWithImages
      } as LookCollection;
    }, onStatusUpdate, 3);

    cache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    throw error;
  }
};
