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
const HARDCODED_KEY = ""; // <--- ВСТАВЬ СЮДА СВОЙ КЛЮЧ GEMINI (начинается с AIza...)

const apiKey = HARDCODED_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = "gemini-3-flash-preview";

// Helper to format history for Gemini
const formatHistory = (messages: Message[]) => {
  return messages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));
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

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
      },
      contents: [...previousHistory, { role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text || "Извините, получен пустой ответ от сервера.";
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
  try {
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
  } catch (e) {
    console.error("Analysis Error", e);
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
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: SUMMARY_PROMPT,
      },
      contents: formatHistory(history)
    });
    return response.text || "Не удалось создать отчет.";
  } catch (e) {
    console.error("Summary Generation Error", e);
    return "Ошибка генерации отчета.";
  }
};