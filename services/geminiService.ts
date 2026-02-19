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

  // Limit history length to reduce token usage
  const MAX_HISTORY_MESSAGES = 16; // pairs of user/assistant approximated by messages count
  const startIndex = Math.max(0, history.length - MAX_HISTORY_MESSAGES - 1);
  const previousHistory = isFirstMessage ? [] : formatHistory(history.slice(startIndex, -1));

  const runGeneration = async () => {
    // Call our own backend proxy instead of Google directly
    // Supports both Gemini and OpenRouter (Qwen)
    const response = await fetch('/api/ai-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL_NAME,
            config: {
                systemInstruction: systemInstruction,
            },
            contents: [...previousHistory, { role: 'user', parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        throw new Error(`Proxy error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || "Извините, получен пустой ответ от сервера.";
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
    // Call our own backend proxy instead of Google directly
    const response = await fetch('/api/ai-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL_NAME,
            config: {
                systemInstruction: COMBINED_ANALYSIS_PROMPT,
                responseMimeType: "application/json",
                // Note: Schema is ignored by OpenRouter proxy currently, 
                // but kept here if we switch back to Gemini or enhance proxy
            },
            contents: formatHistory(history)
        })
    });

    if (!response.ok) {
         throw new Error(`Proxy error: ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.text || "{}";
    
    // Robust JSON extraction for Qwen/OpenRouter
    // 1. Remove markdown code blocks
    text = text.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
    
    // 2. Find the first '{' and the last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        console.error("JSON Parse Error in analyzeDialogue:", e, text);
        parsed = {};
    }
    
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
    const response = await fetch('/api/ai-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
    });

    if (!response.ok) return [];

    const data = await response.json();
    const parsed = JSON.parse(data.text || "{}");
    return Array.isArray(parsed.buttons) ? parsed.buttons : [];
  } catch (e) {
    console.error("Buttons Error", e);
    return [];
  }
};

// 4. Generate Technical Summary
export const generateSummary = async (history: Message[]): Promise<string> => {
  try {
    const response = await fetch('/api/ai-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL_NAME,
            config: {
                systemInstruction: SUMMARY_PROMPT,
            },
            contents: [{ role: 'user', parts: [{ text: JSON.stringify(history) }] }]
        })
    });

    if (!response.ok) return "";

    const data = await response.json();
    return data.text || "";
  } catch (error) {
    console.error("Generate Summary Error:", error);
    return "";
  }
};
