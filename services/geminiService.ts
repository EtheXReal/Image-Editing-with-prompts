import { GoogleGenAI, Modality } from "@google/genai";
import { stripBase64Prefix } from "../utils/imageUtils";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Edits an image using Gemini 2.5 Flash Image based on a text prompt.
 * 
 * @param base64Image The full base64 string (including data URI prefix) of the original image.
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @param prompt The text instruction for editing.
 * @returns The base64 data of the generated image (without prefix).
 */
export const editImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const ai = getClient();
    const rawBase64 = stripBase64Prefix(base64Image);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: rawBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // Check for valid response parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error("No content generated from Gemini.");
    }

    // Look for inlineData in the response
    const imagePart = parts.find(p => p.inlineData && p.inlineData.data);
    
    if (imagePart && imagePart.inlineData) {
      return imagePart.inlineData.data;
    }

    throw new Error("The model did not return a valid image.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to edit image with Gemini.");
  }
};