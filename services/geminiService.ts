
import { GoogleGenAI, Type } from "@google/genai";
import { RoomStyle, DesignAdvice } from "../types";

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
const getApiKey = (): string => {
  // 1. Try process.env (Standard Node/Webpack/Shimmed environments)
  try {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
  } catch(e) {}

  // 2. Try Vite import.meta.env
  try {
    // @ts-ignore
    if (import.meta?.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch(e) {}

  return '';
};

export const generateRoomRedesign = async (
  base64Image: string,
  style: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing. Please check your .env file.");
  
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
  } catch (error) {
    console.error("Redesign error:", error);
    throw error;
  }
};

export const getDesignAdvice = async (
  base64Image: string,
  style: string
): Promise<DesignAdvice> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-3-flash-preview';

  const prompt = `
    Analyze this room image for a '${style}' style redesign.
    Provide professional interior design advice in JSON format.
  `;

  try {
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
  } catch (error) {
    console.error("Advice error:", error);
    throw error;
  }
};
