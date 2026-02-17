import { GoogleGenAI, Type } from "@google/genai";
import { RoomStyle, DesignAdvice } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to clean base64 string
const cleanBase64 = (base64Data: string) => {
  return base64Data.split(',')[1] || base64Data;
};

// Helper to get mime type
const getMimeType = (base64Data: string) => {
  const match = base64Data.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

export const generateRoomRedesign = async (
  base64Image: string,
  style: RoomStyle
): Promise<string> => {
  if (!apiKey) throw new Error("API Key not found");

  const modelId = 'gemini-2.5-flash-image';
  
  const prompt = `
    Redesign the room in this image to strictly follow the '${style}' design style. 
    Maintain the structural integrity of the room (walls, windows, doors, perspective).
    Change the furniture, flooring, wall colors, lighting, and decorations to match the '${style}' aesthetic perfectly.
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

    // Check for image parts in the response
    if (response.candidates) {
      for (const candidate of response.candidates) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
    }
    
    // Check if there was a text refusal or error
    let refusalText = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) refusalText += part.text;
      }
    }

    if (refusalText) {
      throw new Error(`AI returned text instead of image: ${refusalText.substring(0, 100)}...`);
    }

    throw new Error("No image generated in response.");
  } catch (error) {
    console.error("Redesign error:", error);
    throw error;
  }
};

export const getDesignAdvice = async (
  base64Image: string,
  style: RoomStyle
): Promise<DesignAdvice> => {
  if (!apiKey) throw new Error("API Key not found");

  const modelId = 'gemini-3-flash-preview';

  const prompt = `
    Analyze this room image. I want to redesign it in '${style}' style.
    Provide professional interior design advice.
    Return the response in JSON format.
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