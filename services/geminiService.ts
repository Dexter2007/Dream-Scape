
import { GoogleGenAI, Type } from "@google/genai";
import { DesignAdvice, LookCollection } from "../types";

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

  // 1. Try standard process.env (Node/Webpack)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    key = process.env.API_KEY;
  }
  
  // 2. Try Vite import.meta.env
  if (!key) {
    try {
      // @ts-ignore
      if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        key = import.meta.env.VITE_API_KEY;
      }
    } catch (e) {
      // Ignore if not in Vite
    }
  }

  // Check if key is the placeholder or empty
  if (!key || key === 'INSERT_YOUR_VALID_GEMINI_API_KEY_HERE' || key.includes('INSERT_YOUR')) {
    return undefined;
  }

  return key;
};

// Helper for delays
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fallback images for products when cropping fails or no box is found
// These are generic high-quality furniture/decor images to ensure the UI always looks good
const FALLBACK_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80', // Sofa
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=300&q=80', // Chair
  'https://images.unsplash.com/photo-1507473888900-52e1adad70ac?auto=format&fit=crop&w=300&q=80', // Lamp
  'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=300&q=80', // Decor/Art
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80', // Leather Chair
  'https://images.unsplash.com/photo-1522751512423-1d02da42d22b?auto=format&fit=crop&w=300&q=80', // Plant/Pot
  'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=300&q=80', // Cushion/Textile
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80', // Bright/Pop
  'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=300&q=80', // Table
];

// Helper to crop image from bounding box
async function cropImage(base64Image: string, box: number[]): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // box is [ymin, xmin, ymax, xmax] on 0-1000 scale
      const [ymin, xmin, ymax, xmax] = box;
      
      const width = img.width;
      const height = img.height;
      
      const x = (xmin / 1000) * width;
      const y = (ymin / 1000) * height;
      const w = ((xmax - xmin) / 1000) * width;
      const h = ((ymax - ymin) / 1000) * height;

      // Ensure dimensions are valid
      if (w <= 0 || h <= 0) {
        resolve('');
        return;
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the cropped portion
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } else {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = base64Image;
  });
}

// Helper to resize image if too large (default max dimension 1024px)
// Reduced from 1536px to 1024px to significantly reduce payload size and help with rate limits
const resizeImage = (base64Str: string, maxDimension = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Str;
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      
      // If image is small enough, return original
      if (w <= maxDimension && h <= maxDimension) {
        resolve(base64Str);
        return;
      }

      // Calculate new dimensions
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
        // Return as JPEG with 0.8 quality to further save bandwidth
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// Retry wrapper for API calls with Aggressive Backoff and Status Updates
async function retryOperation<T>(
  operation: () => Promise<T>, 
  onStatusUpdate?: (msg: string) => void,
  retries = 8, 
  initialDelay = 2000
): Promise<T> {
  let delay = initialDelay;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      // Check for Rate Limit (429), Service Unavailable (503), or Resource Exhausted
      const errorMessage = error.message || '';
      const isRateLimit = error.status === 429 || 
                          errorMessage.includes('429') || 
                          errorMessage.includes('Resource has been exhausted') ||
                          errorMessage.includes('quota');
                          
      const isOverloaded = error.status === 503 || errorMessage.includes('503') || errorMessage.includes('Overloaded');

      if (isRateLimit || isOverloaded) {
        // If this is the last retry, throw the error
        if (i === retries - 1) throw error;

        // Exponential backoff with some jitter to prevent thundering herd
        const jitter = Math.random() * 500;
        const currentDelay = delay + jitter;
        const waitSeconds = Math.ceil(currentDelay / 1000);
        
        console.warn(`Rate limit hit (Attempt ${i + 1}/${retries}). Waiting ${waitSeconds}s...`);
        
        if (onStatusUpdate) {
          onStatusUpdate(`System busy (Rate Limit). Retrying in ${waitSeconds}s...`);
        }

        await wait(currentDelay);
        
        // Increase delay for next attempt, cap at 15 seconds
        delay = Math.min(delay * 1.5, 15000);
        continue;
      }

      // If it's another error (like 400 Bad Request), throw immediately
      throw error;
    }
  }
  throw new Error("Maximum retries exceeded");
}

export const generateRoomRedesign = async (
  base64Image: string,
  style: string,
  onStatusUpdate?: (msg: string) => void
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing or invalid. Please check your .env file.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-2.5-flash-image';
  
  const prompt = `
    Act as a professional interior designer.
    Redesign the room in the input image to fully embody the '${style}' design style.
    
    REQUIREMENTS:
    1. STRICTLY PRESERVE: Room structure, perspective, window/door placements, and ceiling height.
    2. TRANSFORM: Furniture, decor, materials, colors, lighting to strictly match the '${style}' aesthetic.
    3. QUALITY: Photorealistic, high definition, natural lighting.
    
    MANDATORY CLEANUP:
    - DETECT and COMPLETELY REMOVE any existing watermarks, text overlays, logos, or copyright marks.
    - DO NOT generate any new text, letters, or characters in the image. The output must be purely visual.
    
    Return only the generated image.
  `;

  // Optimize image size before sending
  if (onStatusUpdate) onStatusUpdate("Optimizing image...");
  // Use 1024px max dimension for generating images to be safe with limits
  const optimizedImage = await resizeImage(base64Image, 1024);

  try {
    return await retryOperation(async () => {
      const mimeType = getMimeType(optimizedImage);
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64(optimizedImage)
              }
            },
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
      throw new Error("No image generated in response.");
    }, onStatusUpdate, 8, 2000); 
  } catch (error: any) {
    console.error("Redesign error:", error);
    
    const msg = error.message || '';

    if (error.status === 403 || msg.includes('leaked') || msg.includes('key')) {
      throw new Error("Your API Key has been revoked or is invalid. Please check your .env file.");
    }

    if (error.status === 400 && msg.includes('API key')) {
      throw new Error("Invalid API Key. Please check your .env file.");
    }
    
    if (error.status === 429 || msg.includes('429') || msg.includes('exhausted') || msg.includes('quota')) {
       throw new Error("System is busy (Rate Limit). Please wait a moment and try again.");
    }
    
    throw error;
  }
};

export const getDesignAdvice = async (
  base64Image: string,
  style: string,
  onStatusUpdate?: (msg: string) => void
): Promise<DesignAdvice> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-3-flash-preview';

  const prompt = `
    Analyze this room image for a '${style}' style redesign.
    Provide professional interior design advice in JSON format.
  `;
  
  // Use optimized image for advice as well to save bandwidth
  const optimizedImage = await resizeImage(base64Image, 800); // Smaller for analysis

  try {
    return await retryOperation(async () => {
      const mimeType = getMimeType(optimizedImage);
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64(optimizedImage)
              }
            },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              critique: {
                type: Type.STRING,
                description: "A short critique of the current room state.",
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of specific actionable steps to achieve the look.",
              },
              colorPalette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING, description: "Hex color code e.g. #FFFFFF" },
                  },
                  required: ["name", "hex"]
                },
                description: "A recommended color palette of 5 colors.",
              },
              furnitureRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of specific furniture or decor items to buy.",
              }
            },
            required: ["critique", "suggestions", "colorPalette", "furnitureRecommendations"]
          }
        }
      });

      const jsonText = response.text || "{}";
      return JSON.parse(jsonText) as DesignAdvice;
    }, onStatusUpdate, 3, 4000); 
  } catch (error: any) {
    console.error("Advice error:", error);
    // Silent fail for advice is handled in UI, but we throw here to let UI know
    throw error;
  }
};

export const generateShopTheLook = async (
  base64Image: string,
  onStatusUpdate?: (msg: string) => void
): Promise<LookCollection> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-3-flash-preview';

  const prompt = `
    Analyze this room image and identify the key furniture and decor products that make up this look.
    Return a JSON object with:
    1. title: A catchy title for this room design (e.g. "Minimalist Zen", "Boho Chic Living").
    2. style: The closest matching design style (e.g. Modern, Bohemian, Industrial, Minimalist, etc.).
    3. description: A sophisticated, short description of the room's aesthetic and key elements.
    4. products: A list of 4 to 8 distinct items found in the image.
       For each product include:
       - name: A specific, searchable product name (e.g. "Cognac Leather Sectional", "Brass Arc Floor Lamp").
       - price: An estimated price in USD (integer).
       - category: One of 'Furniture', 'Lighting', 'Decor', 'Rug', 'Art', 'Plant'.
       - query: A google shopping search query string for this item.
       - box_2d: A bounding box [ymin, xmin, ymax, xmax] of the item in the image using a 0-1000 normalized scale.
  `;
  
  // Use optimized image
  const optimizedImage = await resizeImage(base64Image, 1024);

  try {
    return await retryOperation(async () => {
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
                      items: { type: Type.NUMBER },
                      description: "Bounding box [ymin, xmin, ymax, xmax] in 0-1000 coordinates"
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
      
      // Transform to LookCollection structure
      const productsWithImages = await Promise.all((data.products || []).map(async (p: any, idx: number) => {
        let imageUrl = '';
        if (p.box_2d && p.box_2d.length === 4) {
             // Crop the image using the bounding box from the optimized image
             // Note: cropImage re-loads the image, we should use optimizedImage for consistency
             imageUrl = await cropImage(optimizedImage, p.box_2d);
        }
        
        // Fallback if cropping failed or no box was provided
        if (!imageUrl) {
           // Use a deterministic random fallback based on index to be stable for this session
           // or just random. Random from pool ensures variety.
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
        image: base64Image, // Keep original for display
        products: productsWithImages
      } as LookCollection;
    }, onStatusUpdate, 5, 3000);
  } catch (error: any) {
    console.error("Shop The Look error:", error);
    throw error;
  }
};
