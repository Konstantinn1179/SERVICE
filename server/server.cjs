
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');
const fs = require('fs');

const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
const path = require('path');

// Initialize Gemini Client (Legacy/Backup)
const geminiApiKey = process.env.VITE_API_KEY || process.env.GOOGLE_AI_KEY;
let geminiClient = null;
if (geminiApiKey) {
    geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
}

// Initialize OpenRouter/OpenAI Client (Primary)
const openRouterKey = process.env.OPENROUTER_API_KEY;
let openAiClient = null;
if (openRouterKey) {
    openAiClient = new OpenAI({
        apiKey: openRouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
    });
    console.log("OpenAI/OpenRouter client initialized.");
} else {
    console.warn("OPENROUTER_API_KEY not set. Qwen/OpenRouter features will fail.");
}


// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Telegram Bot for notifications
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;
// Enable polling to receive /start command
const bot = telegramToken ? new TelegramBot(telegramToken, { polling: true }) : null;

// Handle /start command
if (bot) {
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const webAppUrl = process.env.WEB_APP_URL;

        if (!webAppUrl) {
            console.log('WEB_APP_URL is not set.');
            bot.sendMessage(chatId, 'Добро пожаловать! Сервис работает, но ссылка на Web App не настроена (WEB_APP_URL).');
            return;
        }

        bot.sendMessage(chatId, 'Добро пожаловать в АКПП-центр! 🔧\nНажмите кнопку ниже, чтобы начать запись.', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Открыть приложение', web_app: { url: webAppUrl } }]
                ]
            }
        });
    });
}

// Initialize Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './service-account.json';
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

let calendar = null;

const initCalendar = async () => {
    try {
        let auth;
        // Check if key is provided as JSON string in env var (for cloud deployment)
        if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
             let jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
             // Remove markdown code blocks if user accidentally copied them
             if (jsonStr.trim().startsWith('```')) {
                 jsonStr = jsonStr.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
             }
             const credentials = JSON.parse(jsonStr);
             auth = new google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES,
            });
            console.log('Google Calendar API initialized with JSON env var.');
        } 
        // Fallback to file path
        else if (fs.existsSync(KEY_PATH)) {
            auth = new google.auth.GoogleAuth({
                keyFile: KEY_PATH,
                scopes: SCOPES,
            });
            console.log('Google Calendar API initialized with key file.');
        } else {
            console.log('Google Service Account Key not found (checked env GOOGLE_SERVICE_ACCOUNT_JSON and file ' + KEY_PATH + ')');
            console.log('Calendar integration will be skipped.');
            return;
        }

        calendar = google.calendar({ version: 'v3', auth });
    } catch (error) {
        console.error('Failed to initialize Google Calendar:', error.message);
    }
};

initCalendar();

// Helper to check availability
const checkAvailability = async (date, time) => {
    if (!calendar) return true; // If calendar not set up, assume available (or handle error)

    try {
        // Force Moscow Timezone (+03:00)
        const startDateTime = new Date(`${date}T${time}:00+03:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Check 1 hour slot

        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: startDateTime.toISOString(),
            timeMax: endDateTime.toISOString(),
            singleEvents: true,
            timeZone: 'Europe/Moscow',
        });

        // If there are any events in this interval, it's busy
        return response.data.items.length === 0;
    } catch (error) {
        console.error('Error checking availability:', error);
        return true; // Fail open (allow booking) if check fails, or false to be safe
    }
};

// Helper to add event
const addCalendarEvent = async (booking) => {
    if (!calendar) return;
    if (!booking.booking_date || !booking.booking_time) return;

    try {
        // Force Moscow Timezone (+03:00)
        const startDateTime = new Date(`${booking.booking_date}T${booking.booking_time}:00+03:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

        const event = {
            summary: `Ремонт АКПП: ${booking.car_brand} ${booking.car_model}`,
            description: `Имя: ${booking.name}\nТелефон: ${booking.phone}\nПричина: ${booking.reason}`,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: 'Europe/Moscow',
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: 'Europe/Moscow',
            },
        };

        const res = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
        });
        console.log('Event created: %s', res.data.htmlLink);
        return res.data;
    } catch (error) {
        console.error('Error adding to calendar:', error);
    }
};

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Get available slots for a specific date
app.get('/api/slots', async (req, res) => {
    const { date } = req.query; // Format: YYYY-MM-DD
    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    if (!calendar) {
        return res.status(503).json({ error: 'Calendar service unavailable' });
    }

    try {
        // Define working hours: 9:00 to 18:00
        const workStartHour = 9;
        const workEndHour = 18;
        const slots = [];

        // Check events for the whole day in Moscow time
        const dayStart = new Date(`${date}T00:00:00+03:00`);
        const dayEnd = new Date(`${date}T23:59:59+03:00`);

        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: dayStart.toISOString(),
            timeMax: dayEnd.toISOString(),
            singleEvents: true,
            timeZone: 'Europe/Moscow',
        });

        const busyEvents = response.data.items || [];

        // Generate all possible hourly slots
        for (let hour = workStartHour; hour < workEndHour; hour++) {
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            // Moscow time for the slot
            const slotStart = new Date(`${date}T${timeString}:00+03:00`);
            const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

            // Check if this slot overlaps with any busy event
            const isBusy = busyEvents.some(event => {
                const eventStart = new Date(event.start.dateTime || event.start.date);
                const eventEnd = new Date(event.end.dateTime || event.end.date);
                
                // Simple overlap check
                return (slotStart < eventEnd && slotEnd > eventStart);
            });

            if (!isBusy) {
                slots.push(timeString);
            }
        }

        res.json({ date, available_slots: slots });
    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ error: 'Failed to fetch slots' });
    }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
    const { name, phone, car_brand, car_model, year, reason, booking_date, booking_time } = req.body;

    // Basic validation
    if (!name || !phone) {
        return res.status(400).json({ error: 'Имя и телефон обязательны' });
    }

    // Combine model and year if year is provided
    const fullModel = year ? `${car_model} (${year})` : car_model;

    // Check Google Calendar Availability first
    if (booking_date && booking_time) {
        const isAvailable = await checkAvailability(booking_date, booking_time);
        if (!isAvailable) {
            return res.status(409).json({ 
                error: 'К сожалению, это время уже занято. Пожалуйста, выберите другое время.' 
            });
        }
    }

    // WORKAROUND: Since 'booking_date' and 'booking_time' columns might not exist in Supabase yet,
    // we append them to the 'reason' field for storage, but keep them separate for Telegram notifications.
    let storedReason = reason || '';
    if (booking_date) storedReason += `\n📅 Дата: ${booking_date}`;
    if (booking_time) storedReason += `\n⏰ Время: ${booking_time}`;

    const { data, error } = await supabase
        .from('car_bookings')
        .insert([
            { 
                name, 
                phone, 
                car_brand, 
                car_model: fullModel, 
                reason: storedReason
                // Removed explicit booking_date/time columns to avoid schema errors
            }
        ])
        .select();

    if (error) {
        console.error('Supabase error:', error);
        // Fallback: If error is about missing columns, try inserting without date/time (optional safety)
        // For now, return error so user knows to update DB
        return res.status(500).json({ error: error.message });
    }

    // Send Telegram Notification
    if (bot && adminChatId) {
        const dateStr = booking_date ? `\n📅 <b>Дата:</b> ${booking_date}` : '';
        const timeStr = booking_time ? `\n⏰ <b>Время:</b> ${booking_time}` : '';
        
        const message = `🔔 <b>Новая заявка!</b>\n\n👤 <b>Имя:</b> ${name}\n📱 <b>Телефон:</b> ${phone}\n🚗 <b>Авто:</b> ${car_brand} ${fullModel}${dateStr}${timeStr}\n🔧 <b>Причина:</b> ${reason || 'Не указана'}`;
        try {
            await bot.sendMessage(adminChatId, message, { parse_mode: 'HTML' });
            console.log('Telegram notification sent to', adminChatId);
        } catch (botError) {
            console.error('Failed to send Telegram notification:', botError.message);
        }
    } else {
        console.log('Telegram bot or ADMIN_CHAT_ID not configured. Skipping notification.');
    }

    // Add to Google Calendar
    if (booking_date && booking_time) {
        await addCalendarEvent({ 
            name, 
            phone, 
            car_brand, 
            car_model: fullModel, 
            reason, 
            booking_date, 
            booking_time 
        });
    }

    res.status(201).json({ success: true, data });
});

// Test DB Connection
app.get('/api/test-db', async (req, res) => {
    const { data, error } = await supabase
        .from('car_bookings')
        .select('*')
        .limit(1);
    
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({ message: "Connected to Supabase!", data });
});

// Telegram Auth Check Endpoint (Placeholder)
app.post('/api/auth/telegram', (req, res) => {
    // TODO: Implement real hash verification
    const { initData } = req.body;
    console.log("Received initData:", initData);
    
    // Mock success for now
    res.json({ success: true, user: { id: 12345, name: "Test User" } });
});

// Proxy for AI API (Supports Gemini and OpenRouter/Qwen)
app.post('/api/ai-proxy', async (req, res) => {
    try {
        const { model, config, contents } = req.body;
        
        // Priority 1: OpenRouter (Qwen)
        if (openAiClient) {
             // Convert Google Gemini format to OpenAI format
             let messages = [];
             
             // 1. System Prompt
             if (config && config.systemInstruction) {
                 messages.push({ role: "system", content: config.systemInstruction });
             }

             // 2. Chat History
             if (contents && Array.isArray(contents)) {
                 contents.forEach(item => {
                     const role = item.role === 'model' ? 'assistant' : 'user';
                     const text = item.parts && item.parts[0] ? item.parts[0].text : '';
                     if (text) {
                         messages.push({ role, content: text });
                     }
                 });
             }

             const completion = await openAiClient.chat.completions.create({
                 model: "qwen/qwen-2.5-72b-instruct", // Force Qwen 2.5
                 messages: messages,
                 // Optional parameters
                 temperature: 0.7,
             });

             let text = completion.choices[0].message.content;
             // Remove markdown code blocks if present
             if (text.trim().startsWith('```')) {
                 text = text.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
             }

             return res.json({
                 text: text
             });
        }

        // Priority 2: Gemini (Legacy/Backup)
        if (geminiClient) {
            const response = await geminiClient.models.generateContent({
                model: model || "gemini-3-flash-preview",
                config,
                contents
            });
            
            let text = response.text();
            // Remove markdown code blocks if present (just in case)
            if (text.trim().startsWith('```')) {
                 text = text.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
            }

            return res.json({ text: text });
        }

        throw new Error("No AI client configured (Check OPENROUTER_API_KEY or VITE_API_KEY)");

    } catch (error) {
        console.error("AI Proxy Error:", error);
        res.status(500).json({ error: error.message || "AI Request Failed" });
    }
});

// All other GET requests not handled before will return our React app

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
