
import { GoogleGenAI, Type } from "@google/genai";
import { EcosystemReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateEcosystemReport(lat: number, lng: number): Promise<EcosystemReport | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a realistic technical/ecological report for a virtual environment filled with International Space Stations at coordinates [${lat.toFixed(2)}, ${lng.toFixed(2)}]. Invent a fictional but plausible biological or technological "species" (like a micro-organism or a maintenance bot) that might inhabit the station's exterior.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            species: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            health: { type: Type.STRING, enum: ['Healthy', 'Stressed', 'Critical'] },
            description: { type: Type.STRING },
            funFact: { type: Type.STRING },
          },
          required: ["species", "scientificName", "health", "description", "funFact"]
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as EcosystemReport;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch ecosystem report:", error);
    return null;
  }
}
