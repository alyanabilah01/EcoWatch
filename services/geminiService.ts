
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Observation } from "../types";

/**
 * getProjectRecommendations provides tailored advice for the user's dashboard.
 */
export const getProjectRecommendations = async (user: UserProfile) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an encouraging environmental mentor. Give a one-sentence, friendly recommendation for this user based on their progress: ${JSON.stringify(user)}. Avoid scientific jargon.`,
    });
    return response.text || "You're making a real difference. What's next?";
  } catch (error) {
    return "Check out your local park today!";
  }
};

/**
 * analyzeObservationImage performs deep scientific multimodal analysis.
 */
export const analyzeObservationImage = async (base64Image: string, projectTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          {
            text: `Analyze this photo for the "${projectTitle}" project.
            Provide a simple, structured report using these EXACT labels:
            Name: (common and scientific name)
            Health: (how does it look?)
            Interesting Fact: (one cool thing about it)
            Impact: (how it helps the ecosystem)
            
            Keep descriptions short and easy to read. Be friendly.`
          },
        ],
      },
    });
    return response.text;
  } catch (error) {
    return "Identification error. Please try again with a clearer photo.";
  }
};

/**
 * getSmartSuggestions provides preventive measures and conservation actions.
 */
export const getSmartSuggestions = async (user: UserProfile) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 3 simple, bulleted environmental tips for a regular person interested in ${JSON.stringify(user.learnedInterests)}. Make them practical, short, and impactful.`,
    });
    return response.text;
  } catch (error) {
    return null;
  }
};

export interface PredictionResult {
  summary: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  forecast: string;
  biodiversityStatus: string;
  sources: { title: string; uri: string }[];
}

/**
 * getProjectPrediction forecasts environmental changes and risks.
 */
export const getProjectPrediction = async (category: string, historicalCount: number): Promise<PredictionResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform an environmental forecasting for the category: "${category}". 
      The project currently has ${historicalCount} historical data points in our database.
      
      Using Google Search, identify:
      1. Expected 7-day environmental shifts or weather-related risks (AQI spikes, water turbidity, etc).
      2. 30-day biodiversity health trend for this region (estimated status: Stable, Declining, or Recovering).
      
      Format your response as a JSON object with these fields:
      summary: (2 short sentences about the current situation)
      riskLevel: (Low, Moderate, High, or Critical)
      forecast: (Short prediction of changes for the next week)
      biodiversityStatus: (Status and 1 sentence explanation)
      
      BE SCIENTIFIC BUT READABLE.`,
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const result = JSON.parse(response.text || "{}");

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.filter((c: any) => c.web).map((c: any) => ({
      title: c.web.title || "Reference",
      uri: c.web.uri,
    }));

    return { 
      summary: result.summary || "Forecasting unavailable.", 
      riskLevel: result.riskLevel || 'Moderate', 
      forecast: result.forecast || "Stable patterns expected.", 
      biodiversityStatus: result.biodiversityStatus || "Monitoring ongoing.",
      sources 
    };
  } catch (error) {
    console.error("Prediction failed:", error);
    return { 
      summary: "Connection to forecasting node lost.", 
      riskLevel: 'Moderate', 
      forecast: "Analyzing local trends...", 
      biodiversityStatus: "Status unknown.",
      sources: [] 
    };
  }
};

export const getEducationalChatResponse = async (message: string, history: any[], user: UserProfile) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: history.concat([{role: 'user', parts: [{text: message}]}]),
      config: {
        systemInstruction: `You are Dr. Eco, a friendly nature guide. 
        Answer questions about the environment simply and clearly. 
        Avoid overly technical jargon unless asked. 
        Use bullet points for lists.`
      }
    });
    return response.text;
  } catch (error) { return "I'm offline for a moment. Try again?"; }
};

export const generateEducationalImage = async (context: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `A clear, high-quality photograph of ${context} in its natural habitat.` }] }
    });
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) { return null; }
};
