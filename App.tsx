import React, { useState, useEffect, useRef } from 'react';
import { 
  generateChatResponse, 
  analyzeDialogue,
  generateButtons, 
  generateSummary
} from './services/geminiService';
import { 
  Message, 
  VehicleCard, 
  INITIAL_VEHICLE_CARD, 
  StatusColor, 
  BranchType 
} from './types';
import ChatMessage from './components/ChatMessage';
import VehicleCardDisplay from './components/VehicleCardDisplay';
import StatusHeader from './components/StatusHeader';
import CarSelector from './components/CarSelector';
import SymptomSelector from './components/SymptomSelector';
import BookingForm from './components/BookingForm';

// --- CONFIGURATION ---
// СЮДА ВСТАВИТЬ ССЫЛКУ ОТ TRAE (Cloudflare Worker)
// Например: "https://auto-service-backend.username.workers.dev"
const BACKEND_URL = ""; 

// --- STATIC INSTANT ANSWERS (ZERO LATENCY) ---
const STATIC_ANSWERS: Record<string, string> = {
  "Вопрос: Где находитесь?": "[STATUS: blue] **Наш адрес:**\n\nг. Киров, ул. Романа Ердякова 23г.\n\nРаботаем Пн–Пт с 9:00 до 18:00 (обед 13:00–14:00).",
  "Вопрос: Эвакуатор": "[STATUS: yellow] **Эвакуатор (Партнеры):**\n\n📞 +7 (8332) XX-XX-XX\n\nСообщите, что вы от «АКПП-центр» для приоритетной подачи.",
  "Вопрос: Гарантия на работы": "[STATUS: blue] **Гарантия:**\n\nМы даем гарантию на капитальный ремонт от 6 до 12 месяцев (в зависимости от типа трансмиссии и установленных запчастей). Точные условия прописываются в заказ-наряде.",
  "Вопрос: Сроки ремонта": "[STATUS: blue] **Сроки:**\n\n🔹 Диагностика: 30-60 мин\n🔹 ТО (масло): 1-2 часа\n🔹 Снятие/Установка: 1 день\n🔹 Капремонт: 3-5 рабочих дней (при наличии запчастей)",
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleCard, setVehicleCard] = useState<VehicleCard>(INITIAL_VEHICLE_CARD);
  const [status, setStatus] = useState<StatusColor>('blue');
  const [branch, setBranch] = useState<BranchType>('consult');
  const [quickButtons, setQuickButtons] = useState<string[]>([]);
  const [bookingReady, setBookingReady] = useState(false);
  
  // Modals state
  const [showCarSelector, setShowCarSelector] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false); 
  
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const telegram = window.Telegram?.WebApp;

  // Initialize Chat & Telegram
  useEffect(() => {
    // 1. Initialize Telegram Web App
    if (telegram) {
        telegram.ready();
        telegram.expand(); // Open full screen
        
        // Disable vertical swipes to prevent accidental closing on some devices
        // (Note: full swipe prevention requires more CSS/JS, but expand helps)
    }

    // 2. Initialize AI Chat
    const initChat = async () => {
      setIsLoading(true);
      try {
        const text = await generateChatResponse([], true);
        const newMsg: Message = { role: 'model', text, timestamp: new Date() };
        setMessages([newMsg]);
        parseStatusFromText(text);

        // Optional: Pre-fill user name if available from Telegram
        if (telegram?.initDataUnsafe?.user?.first_name) {
           console.log("User detected:", telegram.initDataUnsafe.user.first_name);
        }

      } catch (error) {
        console.error("Init failed", error);
        setStatus('red');
        setMessages([{
          role: 'model',
          text: '[STATUS: red] **Ошибка подключения.**\n\nНе удалось связаться с сервером AI. Проверьте API Key или интернет-соединение.',
          timestamp: new Date()
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract [STATUS: color] from text immediately for quick UI feedback
  const parseStatusFromText = (text: string) => {
    const match = text.match(/\[STATUS:\s*(\w+)\]/i);
    if (match && match[1]) {
      const parsedStatus = match[1].toLowerCase();
      if (['red', 'yellow', 'green', 'blue', 'black'].includes(parsedStatus)) {
        setStatus(parsedStatus as StatusColor);
      }
    }
  };

  const handleSendMessage = async (text: string, isHiddenContext: boolean = false) => {
    if (!text.trim() || isLoading) return;

    // --- CHECK FOR STATIC INSTANT ANSWER ---
    if (STATIC_ANSWERS[text]) {
        const userMsg: Message = { role: 'user', text, timestamp: new Date() };
        const botMsg: Message = { role: 'model', text: STATIC_ANSWERS[text], timestamp: new Date() };
        
        setMessages(prev => [...prev, userMsg, botMsg]);
        parseStatusFromText(STATIC_ANSWERS[text]);
        setInputValue('');
        // We do not set isLoading(true) here, creating an "instant" feel
        return;
    }

    // 1. Optimistic UI update
    const userMsg: Message = { role: 'user', text, timestamp: new Date() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputValue('');
    setIsLoading(true);
    setQuickButtons([]); // Clear buttons while thinking

    try {
      // 2. Start Background Tasks in PARALLEL
      
      // Combined Analysis (Optimization: 1 call instead of 3)
      const analysisPromise = analyzeDialogue(updatedHistory).then(result => {
        // Update Classification
        setBranch(result.classification.branch);
        setStatus(result.classification.status);
        
        // Update Vehicle Card (Merge with existing)
        setVehicleCard(prev => ({
            ...prev,
            ...result.vehicle_data,
            // Ensure array safety if model returns null for symptoms
            symptoms: result.vehicle_data.symptoms || prev.symptoms || []
        }));

        // Update Booking Status
        if (result.booking_status.ready_for_booking || result.booking_status.needs_operator) {
            setBookingReady(true);
        }
      }).catch(err => console.error("Analysis task failed", err));

      // 3. Generate Main Response (Critical Path)
      const responseText = await generateChatResponse(updatedHistory);
      parseStatusFromText(responseText);
      
      const botMsg: Message = { role: 'model', text: responseText, timestamp: new Date() };
      const finalHistory = [...updatedHistory, botMsg];
      setMessages(finalHistory);

      // 4. Generate Buttons
      generateButtons(finalHistory).then(setQuickButtons).catch(err => console.error("Buttons task failed", err));

      await analysisPromise;

    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: '[STATUS: red] Прошу прощения, возникла ошибка соединения. Попробуйте отправить сообщение еще раз.', 
        timestamp: new Date() 
      }]);
      setStatus('red');
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Input Logic
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Ваш браузер не поддерживает голосовой ввод.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleCarSelection = (brand: string, model: string, year: string) => {
    setShowCarSelector(false);
    handleSendMessage(`Мой автомобиль: ${brand} ${model} ${year} года.`);
  };

  const handleMenuSelection = (fullText: string) => {
    handleSendMessage(fullText);
  };

  const handleBookingSubmit = async (name: string, phone: string) => {
    setShowBookingForm(false);
    setBookingReady(false); 
    
    // 1. Show immediate feedback
    const confirmMsg: Message = {
        role: 'model',
        text: `[STATUS: green] **Заявка оформляется...**\n\n${name}, секунду, формирую отчет для мастера.`,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, confirmMsg]);
    setIsLoading(true);

    try {
      // 2. Generate Technical Summary for the Manager
      const summary = await generateSummary(messages);

      // 3. Construct the Data Payload
      const bookingPayload = {
        client: { name, phone },
        vehicle: vehicleCard,
        chatHistory: messages,
        managerSummary: summary,
        timestamp: new Date().toISOString()
      };

      console.log("%c🚀 SENDING TO BACKEND:", "color: lime; font-size: 14px; font-weight: bold;");
      console.log(bookingPayload);
      
      let success = false;

      // --- REAL BACKEND INTEGRATION ---
      if (BACKEND_URL) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/booking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingPayload)
            });

            if (response.ok) {
                success = true;
            } else {
                console.error("Server responded with error:", response.status);
            }
        } catch (netError) {
            console.error("Network error sending booking:", netError);
        }
      } else {
        // Fallback for demo without backend
        console.warn("BACKEND_URL is missing. Simulating success for demo.");
        
        // Also try legacy Telegram sendData if available
        if (telegram) {
             const minimalPayload = {
                client: { name, phone },
                vehicle: vehicleCard,
                summary: summary
            };
            telegram.sendData(JSON.stringify(minimalPayload));
        }
        success = true;
      }

      // 4. Final confirmation to user
      if (success) {
          const finalMsg: Message = {
            role: 'model',
            text: `[STATUS: green] **Заявка принята!**\n\nМы свяжемся с вами по номеру ${phone} в течение 15 минут.\n\nМастер уже получил информацию о вашем ${vehicleCard.brand || 'авто'}.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, finalMsg]);
          setStatus('green');
          
          // Optional: Close app after delay
          if (telegram && BACKEND_URL) {
              setTimeout(() => telegram.close(), 3000);
          }
      } else {
          const errorMsg: Message = {
            role: 'model',
            text: `[STATUS: red] **Ошибка отправки.**\n\nНе удалось передать заявку на сервер. Пожалуйста, позвоните нам напрямую: +7 (8332) XX-XX-XX`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMsg]);
          setStatus('red');
      }

    } catch (e) {
      console.error("Booking error", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Use 100dvh (dynamic viewport height) for better mobile browser support
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-gray-900 text-gray-100">
      
      {/* Header */}
      <StatusHeader 
         status={status} 
         branch={branch} 
         onInfoClick={() => setShowMobileInfo(true)} 
      />

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative z-10 w-full">
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-4 sm:space-y-6">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-gray-800 rounded-2xl px-4 py-3 text-gray-400 text-sm">
                   Анализирую...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Booking Alert */}
          {bookingReady && (
            <div className="px-4 py-2 bg-gray-900/90 backdrop-blur-sm animate-fade-in-up">
              <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-3 flex items-center justify-between shadow-lg">
                <span className="text-sm font-semibold text-white">Готовы записаться?</span>
                <button 
                  onClick={() => setShowBookingForm(true)}
                  className="bg-white text-green-900 text-xs font-bold px-3 py-1.5 rounded shadow hover:bg-gray-100 transition-colors"
                >
                  СТАРТ
                </button>
              </div>
            </div>
          )}

          {/* Quick Buttons (AI Generated) */}
          {!isLoading && quickButtons.length > 0 && (
            <div className="px-4 pb-2 pt-2 bg-gray-900/95 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <div className="flex space-x-2">
                {quickButtons.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(btn)}
                    className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-blue-200 transition-all active:scale-95"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Control Area */}
          <div className="bg-gray-900 border-t border-gray-800 pt-1 pb-safe">
             
             {/* Permanent Symptom Bar with Car Selector */}
             <SymptomSelector 
                onSelect={handleMenuSelection} 
                onCarSelect={() => setShowCarSelector(true)}
             />

             {/* Input Field */}
             <div className="p-2 sm:p-4 flex space-x-2">
                 {/* Voice Button */}
                 <button
                  onClick={startListening}
                  className={`p-3 rounded-xl transition-all border shrink-0 ${
                    isListening 
                      ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                  placeholder={isListening ? "Говорите..." : "Опишите проблему"}
                  className="flex-1 bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm sm:text-base"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 transition-colors flex items-center justify-center min-w-[50px] shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
             </div>
          </div>
        </main>

        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:block w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
           <VehicleCardDisplay data={vehicleCard} />
           
           <div className="mt-8">
              <h4 className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Контакты</h4>
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-sm space-y-2 text-gray-300">
                 <p>📞 +7 (8332) XX-XX-XX</p>
                 <p>📍 ул. Романа Ердякова 23г</p>
                 <p>⏰ Пн–Пт 9:00–18:00</p>
              </div>
           </div>
        </aside>

        {/* Mobile Vehicle Info Modal */}
        {showMobileInfo && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 lg:hidden" onClick={() => setShowMobileInfo(false)}>
                <div 
                    className="bg-gray-900 w-full max-w-md h-[70vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl border border-gray-700 animate-slide-up"
                    onClick={(e) => e.stopPropagation()} // Prevent close on content click
                >
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <h2 className="text-lg font-bold text-white">Инфо об авто</h2>
                        <button onClick={() => setShowMobileInfo(false)} className="text-gray-400 hover:text-white p-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-4 overflow-y-auto">
                        <VehicleCardDisplay data={vehicleCard} className="shadow-none border-0 bg-transparent p-0" />
                        <div className="mt-6 border-t border-gray-800 pt-4">
                            <h4 className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Контакты</h4>
                            <div className="text-sm text-gray-300 space-y-1">
                                <p>📞 +7 (8332) XX-XX-XX</p>
                                <p>📍 ул. Романа Ердякова 23г</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Modal for Car Selection */}
        {showCarSelector && (
          <CarSelector 
            onComplete={handleCarSelection}
            onCancel={() => setShowCarSelector(false)}
          />
        )}

        {/* Modal for Booking (152-FZ Compliant) */}
        {showBookingForm && (
          <BookingForm 
            onSubmit={handleBookingSubmit}
            onCancel={() => setShowBookingForm(false)}
          />
        )}

      </div>
    </div>
  );
}

export default App;