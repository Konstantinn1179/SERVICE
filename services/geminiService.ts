import { GoogleGenAI, Type } from "@google/genai";
import { 
  MAIN_SYSTEM_PROMPT, 
  COMBINED_ANALYSIS_PROMPT,
  BUTTONS_PROMPT, 
  FIRST_GREETING_PROMPT,
  SUMMARY_PROMPT
} from "./prompts";
import { Message, VehicleCard, ClassifierResult, BookingStatus, INITIAL_VEHICLE_CARD } from "../types";

// ВАЖНО ДЛЯ ДЕМО:
// На хостингах (Cloudflare/Vercel) переменные process.env часто требуют сложной настройки сборщика.
// Чтобы приложение 100% заработало у клиента прямо сейчас, вставь свой ключ в кавычки ниже.
// ПОСЛЕ ДЕМО НЕ ЗАБУДЬ УБРАТЬ!
const HARDCODED_KEY = import.meta.env.VITE_API_KEY || ""; // Используем переменную окружения

const apiKey = HARDCODED_KEY;

// Lazy init to avoid top-level crashes
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    if (!apiKey) {
      console.error("API Key is missing!");
      throw new Error("API Key is missing. Please check .env file.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const MODEL_NAME = "gemini-3-flash-preview";

// Helper to format history for Gemini
const formatHistory = (messages: Message[]) => {
  return messages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper with exponential backoff
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, initialDelay = 1000): Promise<T> => {
  let currentDelay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.status === 429;
      const isOverloaded = error?.message?.includes('503') || error?.status === 503;
      
      if ((isRateLimit || isOverloaded) && i < retries - 1) {
        console.warn(`Attempt ${i + 1} failed (Rate Limit/Overload). Retrying in ${currentDelay}ms...`);
        await delay(currentDelay);
        currentDelay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

// 1. Main Chat Logic
export const generateChatResponse = async (history: Message[], isFirstMessage: boolean = false) => {
  let systemInstruction = MAIN_SYSTEM_PROMPT;
  let prompt = "";

  if (isFirstMessage) {
     prompt = FIRST_GREETING_PROMPT;
  } else {
     prompt = history[history.length - 1].text;
  }

  const previousHistory = isFirstMessage ? [] : formatHistory(history.slice(0, -1));

  const runGeneration = async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
      },
      contents: [...previousHistory, { role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text || "Извините, получен пустой ответ от сервера.";
  };

  try {
    return await withRetry(runGeneration);
  } catch (error) {
    console.error("Generate Chat Error:", error);
    throw error;
  }
};

// 2. Combined Analysis (Optimization to save quota)
export interface AnalysisResult {
  classification: ClassifierResult;
  vehicle_data: Partial<VehicleCard>;
  booking_status: BookingStatus;
}

export const analyzeDialogue = async (history: Message[]): Promise<AnalysisResult> => {
  const runAnalysis = async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: COMBINED_ANALYSIS_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: {
              type: Type.OBJECT,
              properties: {
                branch: { type: Type.STRING, enum: ["triage", "consult", "defense"] },
                status: { type: Type.STRING, enum: ["red", "yellow", "green", "blue", "black"] },
                reason: { type: Type.STRING }
              },
              required: ["branch", "status"]
            },
            vehicle_data: {
              type: Type.OBJECT,
              properties: {
                brand: { type: Type.STRING, nullable: true },
                model: { type: Type.STRING, nullable: true },
                year: { type: Type.STRING, nullable: true },
                gearbox: { type: Type.STRING, nullable: true },
                symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                drivable: { type: Type.BOOLEAN, nullable: true },
                status: { type: Type.STRING, nullable: true },
                queue_season: { type: Type.STRING, nullable: true },
                needs_diagnosis: { type: Type.BOOLEAN },
                wants_booking: { type: Type.BOOLEAN }
              }
            },
            booking_status: {
              type: Type.OBJECT,
              properties: {
                ready_for_booking: { type: Type.BOOLEAN },
                needs_operator: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
              }
            }
          }
        }
      },
      contents: formatHistory(history)
    });

    const parsed = JSON.parse(response.text || "{}");
    
    // Default fallback values
    return {
      classification: parsed.classification || { branch: "consult", status: "blue", reason: "" },
      vehicle_data: parsed.vehicle_data || {},
      booking_status: parsed.booking_status || { ready_for_booking: false, needs_operator: false, reason: "" }
    };
  };

  try {
    return await withRetry(runAnalysis, 2, 2000); // Fewer retries for analysis, longer initial delay
  } catch (e) {
    console.error("Analysis Error (Max retries exceeded or other error)", e);
    // Fail silently for analysis to not break the chat flow
    return {
      classification: { branch: "consult", status: "blue", reason: "Error" },
      vehicle_data: {},
      booking_status: { ready_for_booking: false, needs_operator: false, reason: "Error" }
    };
  }
};

// 3. Generate Buttons (Background)
export const generateButtons = async (history: Message[]): Promise<string[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: BUTTONS_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
            properties: {
                buttons: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
      },
      contents: formatHistory(history)
    });

    const data = JSON.parse(response.text || "{}");
    return Array.isArray(data.buttons) ? data.buttons : [];
  } catch (e) {
    console.error("Buttons Error", e);
    return [];
  }
};

// 4. Generate Technical Summary
export const generateSummary = async (history: Message[]): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: SUMMARY_PROMPT,
      },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(history) }] }]
    });
    return response.text || "";
  } catch (error) {
    console.error("Generate Summary Error:", error);
    return "";
  }
};