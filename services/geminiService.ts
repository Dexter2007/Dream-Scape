
import { GoogleGenAI, Type } from "@google/genai";
import { DesignAdvice, LookCollection } from "../types";

// Simple in-memory cache to prevent redundant API calls
const responseCache = new Map<string, any>();

// Helper to generate a cache key
const getCacheKey = (type: string, data: string, ...args: any[]) => {
  const dataSignature = `${data.substring(0, 50)}_${data.length}_${data.slice(-50)}`;
  return `${type}_${dataSignature}_${args.join('_')}`;
};

// Helper to clean base64 string
const cleanBase64 = (base64Data: string) => {
  return base64Data.split(',')[1] || base64Data;
};

// Helper to get mime type
const getMimeType = (base64Data: string) => {
  const match = base64Data.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

// Robust API Key Retrieval
const getApiKey = (): string | undefined => {
  let key: string | undefined = undefined;

  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    key = process.env.API_KEY;
  }
  
  if (!key) {
    try {
      // @ts-ignore
      if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        key = import.meta.env.VITE_API_KEY;
      }
    } catch (e) {}
  }

  if (!key || key === 'INSERT_YOUR_VALID_GEMINI_API_KEY_HERE' || key.includes('INSERT_YOUR')) {
    return undefined;
  }

  return key;
};

// Helper for delays
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
// OPTIMIZATION: Aggressive downsizing to save tokens and prevent rate limits
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
        // 0.5 Quality is sufficient for AI analysis but significantly smaller payload
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// Persistent Background Retry Wrapper
// Keeps trying for a long time if the system is busy, instead of failing early.
async function retryOperation<T>(
  operation: () => Promise<T>, 
  onStatusUpdate?: (msg: string) => void,
  retries = 3, // CHANGED: Reduced from 60 to 3 to prevent quota burning
  initialDelay = 2000
): Promise<T> {
  let delay = initialDelay;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const errorMessage = error.message || '';
      const status = error.status;

      // STOP IMMEDIATELY for Fatal Errors
      // 400 = Bad Request, 401 = Unauthorized, 403 = Forbidden
      if (status === 400 || status === 401 || status === 403 || 
          errorMessage.includes('API key') || errorMessage.includes('permission') || errorMessage.includes('location')) {
        throw error;
      }
      
      // STOP IMMEDIATELY for Quota Exhaustion (429 can be Rate Limit OR Quota)
      if (errorMessage.toLowerCase().includes('quota') && errorMessage.toLowerCase().includes('exhausted')) {
         throw new Error("Daily API quota exceeded. Please check your plan or try again tomorrow.");
      }

      // Check for retryable errors (Rate Limit 429, Overloaded 503)
      const isRateLimit = status === 429 || 
                          errorMessage.includes('429') || 
                          errorMessage.includes('Too Many Requests');
                          
      const isOverloaded = status === 503 || 
                           errorMessage.includes('503') || 
                           errorMessage.includes('Overloaded') ||
                           errorMessage.includes('Service Unavailable');

      if (!isRateLimit && !isOverloaded) {
        throw error;
      }

      // If we finally exceeded max retries, throw
      if (i === retries - 1) throw new Error("Server is busy (High Traffic). Please try again later.");

      // Calculate delay with jitter to prevent synchronized retries
      const jitter = Math.random() * 1000;
      const currentDelay = delay + jitter;
      const waitSeconds = Math.ceil(currentDelay / 1000);
      
      console.warn(`Retryable error (Attempt ${i + 1}/${retries}). Waiting ${waitSeconds}s...`);
      
      if (onStatusUpdate) {
        onStatusUpdate(`High traffic. Retrying in ${waitSeconds}s...`);
      }

      await wait(currentDelay);
      
      // Exponential Backoff: Double the delay for the next attempt, cap at 10s
      delay = Math.min(delay * 2, 10000);
    }
  }
  throw new Error("Request timed out.");
}

// ------------------------------------------------------------------
// 1. IMAGE GENERATION (Strictly for Visuals)
// ------------------------------------------------------------------
export const generateRoomRedesign = async (
  base64Image: string,
  style: string,
  onStatusUpdate?: (msg: string) => void
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing or invalid.");

  const cacheKey = getCacheKey('redesign', base64Image, style);
  if (responseCache.has(cacheKey)) {
    if (onStatusUpdate) onStatusUpdate("Loading from cache...");
    await wait(500); 
    return responseCache.get(cacheKey);
  }

  const ai = new GoogleGenAI({ apiKey });
  // Use Image Model ONLY for generation
  const modelId = 'gemini-2.5-flash-image';
  
  const prompt = `
    Act as a professional interior designer.
    Redesign the room in the input image to fully embody the '${style}' design style.
    
    REQUIREMENTS:
    1. STRICTLY PRESERVE: Room structure, perspective, window/door placements.
    2. TRANSFORM: Furniture, decor, materials, colors to strictly match '${style}'.
    3. QUALITY: Photorealistic, high definition, natural lighting.
    
    MANDATORY CLEANUP:
    - REMOVE any existing watermarks or text.
    - DO NOT generate any text in the image.
    Return only the generated image.
  `;

  if (onStatusUpdate) onStatusUpdate("Optimizing image for AI...");
  // 640px is the sweet spot for GenAI input to balance quality/tokens
  const optimizedImage = await resizeImage(base64Image, 640);

  try {
    const result = await retryOperation(async () => {
      const mimeType = getMimeType(optimizedImage);
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64(optimizedImage) } },
            { text: prompt }
          ]
        }
      });

      if (response.candidates) {
        for (const candidate of response.candidates) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
      }
      throw new Error("No image generated.");
    }, onStatusUpdate, 3, 2000); // CHANGED: 3 Retries max

    responseCache.set(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("Redesign error:", error);
    throw error;
  }
};

// ------------------------------------------------------------------
// 2. TEXT/MULTIMODAL GENERATION (Descriptions, Prompts, UI Content)
// ------------------------------------------------------------------

// New function for Style Quiz Result
export const generateQuizResultDescription = async (
  style: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return `A unique fusion style tailored just for you: ${style}.`;

  const cacheKey = `quiz_desc_${style}`;
  if (responseCache.has(cacheKey)) return responseCache.get(cacheKey);

  const ai = new GoogleGenAI({ apiKey });
  // Use Text Model for text tasks
  const modelId = 'gemini-3-flash-preview';

  const prompt = `
    Write a captivating, 2-sentence description for an interior design style called "${style}".
    It should sound professional, inviting, and personalized.
  `;

  try {
    // Retry less aggressively for text as it's lighter
    const result = await retryOperation(async () => {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts: [{ text: prompt }] }
      });
      return response.text || "";
    }, undefined, 2, 1000); // CHANGED: 2 Retries max for text

    if (result) responseCache.set(cacheKey, result);
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
  if (responseCache.has(cacheKey)) return responseCache.get(cacheKey);

  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-3-flash-preview'; // Text model for analysis

  const prompt = `
    Analyze this room image for a '${style}' style redesign.
    Provide professional interior design advice in JSON format.
  `;
  
  // 480px is plenty for text analysis
  const optimizedImage = await resizeImage(base64Image, 480);

  try {
    const result = await retryOperation(async () => {
      const mimeType = getMimeType(optimizedImage);
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64(optimizedImage) } },
            { text: prompt }
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
    }, onStatusUpdate, 3, 2000); // CHANGED: 3 Retries max

    responseCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    console.error("Advice error:", error);
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
  if (responseCache.has(cacheKey)) return responseCache.get(cacheKey);

  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-3-flash-preview'; // Text model for analysis

  const prompt = `
    Analyze this room image and identify the key furniture and decor products.
    Return JSON with:
    1. title (string)
    2. style (string)
    3. description (string)
    4. products (array of objects with name, price, category, query, box_2d [ymin, xmin, ymax, xmax])
  `;
  
  // 480px is sufficient for object detection in this context
  const optimizedImage = await resizeImage(base64Image, 480);

  try {
    const result = await retryOperation(async () => {
      const mimeType = getMimeType(optimizedImage);
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64(optimizedImage) } },
            { text: prompt }
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
                    box_2d: { 
                      type: Type.ARRAY, 
                      items: { type: Type.NUMBER }
                    }
                  },
                  required: ["name", "price", "category", "query", "box_2d"]
                }
              }
            },
            required: ["title", "style", "description", "products"]
          }
        }
      });

      const jsonText = response.text || "{}";
      const data = JSON.parse(jsonText);
      
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

      return {
        id: Date.now().toString(),
        title: data.title || "Custom Collection",
        style: data.style || "Modern",
        description: data.description || "A curated collection based on your image.",
        image: base64Image,
        products: productsWithImages
      } as LookCollection;
    }, onStatusUpdate, 3, 2000); // CHANGED: 3 Retries max

    responseCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    console.error("Shop The Look error:", error);
    const msg = error.message || '';
    if (error.status === 429 || msg.includes('429') || msg.includes('exhausted')) {
       throw new Error("System is busy (Rate Limit). Please wait 1 minute and try again.");
    }
    throw error;
  }
};
