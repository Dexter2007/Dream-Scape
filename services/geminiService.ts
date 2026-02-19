
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

// Helper to extract clean message from potential JSON error
const getCleanErrorMessage = (error: any): string => {
  const msg = error.message || '';
  try {
    if (msg.trim().startsWith('{')) {
      const json = JSON.parse(msg);
      if (json.error && json.error.message) {
        return json.error.message;
      }
    }
  } catch (e) {
    // ignore
  }
  return msg;
};

// Persistent Background Retry Wrapper
// Keeps trying for a long time if the system is busy, instead of failing early.
async function retryOperation<T>(
  operation: () => Promise<T>, 
  onStatusUpdate?: (msg: string) => void,
  retries = 3, // Reduced from 60 to 3 to prevent quota burning
  initialDelay = 2000
): Promise<T> {
  let delay = initialDelay;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const rawMessage = error.message || '';
      const status = error.status;
      const cleanMessage = getCleanErrorMessage(error);
      const lowerMsg = cleanMessage.toLowerCase();

      // STOP IMMEDIATELY for Fatal Errors
      // 400 = Bad Request, 401 = Unauthorized, 403 = Forbidden
      if (status === 400 || status === 401 || status === 403 || 
          lowerMsg