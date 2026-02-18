
import { GoogleGenAI, Type } from "@google/genai";
import { DesignAdvice } from "../types";

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
  // 1. Try standard process.env (Node/Webpack)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  
  // 2. Try Vite import.meta.env
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore if not in Vite
  }

  return undefined;
};

// Helper for delays
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for API calls
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Check for Rate Limit (429) or Service Unavailable (503)
    const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));
    const isOverloaded = error.status === 503;

    if ((isRateLimit || isOverloaded) && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} attempts left)`);
      await wait(delay);
      // Exponential backoff: double the delay for the next retry
      return retryOperation(operation, retries - 1, delay * 2);
    }

    throw error;
  }
}

export const generateRoomRedesign = async (
  base64Image: string,
  style: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing. Please set VITE_API_KEY in your .env file.");

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

  try {
    return await retryOperation(async () => {
      const mimeType = getMimeType(base64Image);
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64(base64Image)
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
    });
  } catch (error: any) {
    console.error("Redesign error:", error);
    
    if (error.status === 403 || (error.message && error.message.includes('leaked'))) {
      throw new Error("Your API Key has been revoked by Google because it was exposed. Please generate a new key at aistudio.google.com.");
    }
    
    if (error.status === 429) {
       throw new Error("System is busy (Rate Limit). Please wait a minute and try again.");
    }
    
    throw error;
  }
};

export const getDesignAdvice = async (
  base64Image: string,
  style: string
): Promise<DesignAdvice> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-3-flash-preview';

  const prompt = `
    Analyze this room image for a '${style}' style redesign.
    Provide professional interior design advice in JSON format.
  `;

  try {
    return await retryOperation(async () => {
      const mimeType = getMimeType(base64Image);
      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64(base64Image)
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
    });
  } catch (error: any) {
    console.error("Advice error:", error);
    
    if (error.status === 403 || (error.message && error.message.includes('leaked'))) {
      throw new Error("API Key Revoked/Leaked. Please generate a new one.");
    }

    if (error.status === 429) {
       throw new Error("System is busy (Rate Limit). Please wait a minute and try again.");
    }
    
    throw error;
  }
};
