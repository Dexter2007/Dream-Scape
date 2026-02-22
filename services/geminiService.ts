
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

// Helper to handle API errors
const handleApiError = (error: any) => {
  const errorMessage = error.message || '';
  
  // Check for retryable errors (Rate Limit 429, Overloaded 503)
  const isRateLimit = error.status === 429 || 
                      errorMessage.includes('429') || 
                      errorMessage.includes('exhausted') ||
                      errorMessage.includes('quota') ||
                      errorMessage.includes('Too Many Requests');
                      
  const isOverloaded = error.status === 503 || 
                       errorMessage.includes('503') || 
                       errorMessage.includes('Overloaded') ||
                       errorMessage.includes('Service Unavailable');

  if (isRateLimit || isOverloaded) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }
  
  throw error;
};

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
            const result = `data:image/png;base64,${part.inlineData.data}`;
            responseCache.set(cacheKey, result);
            return result;
          }
        }
      }
    }
    throw new Error("No image generated.");

  } catch (error: any) {
    console.error("Redesign error:", error);
    handleApiError(error);
    throw error; // Should be unreachable due to handleApiError throwing
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
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] }
    });
    const result = response.text || "";

    if (result) responseCache.set(cacheKey, result);
    return result || `A beautiful ${style} aesthetic curated just for you.`;
  } catch (e) {
    // For non-critical text, just return fallback instead of throwing
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
    const result = JSON.parse(response.text || "{}") as DesignAdvice;

    responseCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    console.error("Advice error:", error);
    handleApiError(error);
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
    console.error("Shop The Look error:", error);
    handleApiError(error);
    throw error;
  }
};
