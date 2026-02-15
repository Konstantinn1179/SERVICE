import React, { useState, useEffect, useRef } from 'react';
import { 
  generateChatResponse, 
  analyzeDialogue,
  // generateButtons, 
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
import AdminCalendar from './components/AdminCalendar';

// --- CONFIGURATION ---
// Используем прокси Vite для локальной разработки и относительный путь для продакшена
const BACKEND_URL = ""; 

// --- STATIC INSTANT ANSWERS (ZERO LATENCY) ---
const STATIC_ANSWERS: Record<string, string> = {
  "Вопрос: Где находитесь?": "[STATUS: blue] **Наш адрес:**\n\nг. Киров, ул. Романа Ердякова 23г.\n\nРаботаем Пн–Пт с 9:00 до 18:00 (обед 13:00–14:00).",
  "Вопрос: Эвакуатор": "[STATUS: yellow] **Эвакуатор (Партнеры):**\n\n📞 +7 (8332) XX-XX-XX\n\nСообщите, что вы от «АКПП-центр» для приоритетной подачи.",
  "Вопрос: Гарантия на работы": "[STATUS: blue] **Гарантия:**\n\nМы даем гарантию на капитальный ремонт от 6 до 12 месяцев (в зависимости от типа трансмиссии и установленных запчастей). Точные условия прописываются в заказ-наряде.",
  "Вопрос: Сроки ремонта": "[STATUS: blue] **Сроки:**\n\n🔹 Диагностика: 30-60 мин\n🔹 ТО (масло): 1-2 часа\n🔹 Снятие/Установка: 1 день\n🔹 Капремонт: 3-5 рабочих дней (при наличии запчастей)",
};

function App() {
  // Simple routing for demo purposes
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const startParam = params.get('start');
  const isChat = startParam === 'chat';

  if (
    startParam === 'calendar' ||
    startParam === 'admin' ||
    path === '/admin' ||
    path.startsWith('/admin') ||
    path.startsWith('/max/admin')
  ) {
    return <AdminCalendar />;
  }

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
  const inputRef = useRef<HTMLInputElement>(null);
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
        setVehicleCard(prev => {
           // Better symptom merging strategy:
           // If AI returns non-empty symptoms, use them (it sees full context).
           // If AI returns empty/null, keep previous symptoms to avoid clearing them accidentally.
           const newSymptoms = result.vehicle_data.symptoms;
           const finalSymptoms = (newSymptoms && newSymptoms.length > 0) 
              ? newSymptoms 
              : (prev.symptoms || []);

           return {
            ...prev,
            ...result.vehicle_data,
            symptoms: finalSymptoms
           };
        });

        // Update Booking Status
        if (result.booking_status.ready_for_booking) {
            setBookingReady(true);
            // Auto-open booking form if ready
            setShowBookingForm(true);
        } else if (result.booking_status.needs_operator) {
            setBookingReady(true);
        }
      }).catch(err => console.error("Analysis task failed", err));

      // 3. Generate Main Response (Critical Path)
      const responseText = await generateChatResponse(updatedHistory);
      parseStatusFromText(responseText);
      
      const botMsg: Message = { role: 'model', text: responseText, timestamp: new Date() };
      const finalHistory = [...updatedHistory, botMsg];
      setMessages(finalHistory);

      // 4. Generate Buttons (DISABLED as per request to speed up)
      // generateButtons(finalHistory).then(setQuickButtons).catch(err => console.error("Buttons task failed", err));

      // Do NOT await analysisPromise here to avoid blocking UI
      // await analysisPromise;

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

  const handleMenuSelection = (fullText: string, rawItem?: string, type?: string) => {
    // 1. Send message to chat (triggers AI analysis as well)
    handleSendMessage(fullText);

    // 2. Direct update for explicit UI selections (Repair/Maintenance)
    if (rawItem && (type === 'repair' || type === 'maintenance')) {
      setVehicleCard(prev => {
        const currentSymptoms = prev.symptoms || [];
        // Avoid duplicates
        if (!currentSymptoms.includes(rawItem)) {
          return {
            ...prev,
            symptoms: [...currentSymptoms, rawItem]
          };
        }
        return prev;
      });
    }
  };

  const formatDateDMY = (s: string) => {
    if (!s) return '';
    const p = s.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  };
  
  const handleBookingSubmit = async (name: string, phone: string, brand: string, model: string, year: string, reason: string, bookingDate: string, bookingTime: string, chatId?: number, platform?: string, licensePlate?: string, mileage?: string) => {
    setIsLoading(true);
    try {
      // 1. Send to Backend
      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name, 
            phone, 
            car_brand: brand, 
            car_model: model, 
            year, 
            reason,
            booking_date: bookingDate,
            booking_time: bookingTime,
            chat_id: chatId,
            platform: platform,
            license_plate: licensePlate,
            mileage: mileage
        })
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server Error: ${response.status}`);
      }

      // 2. Add system message
      setMessages(prev => [...prev, {
        role: 'system',
        text: `✅ Заявка принята!\n\nИмя: ${name}\nТелефон: ${phone}\nАвто: ${brand} ${model} (${year})${licensePlate ? `\nГос. номер: ${licensePlate}` : ''}${mileage ? `\nПробег: ${mileage} км` : ''}\nДата: ${bookingDate ? formatDateDMY(bookingDate) : 'Не указана'}\nВремя: ${bookingTime || 'Не указано'}\nПричина: ${reason}\n\nМастер свяжется с вами в ближайшее время.`,
        timestamp: new Date()
      }]);
      
      setShowBookingForm(false);
    } catch (e: any) {
      alert(`Ошибка при отправке заявки: ${e.message}`);
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
          <div className="h-[40vh] sm:flex-1 overflow-y-auto p-4 scrollbar-hide space-y-4 sm:space-y-6">
            {isChat ? (
              <>
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
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <div className="text-xl font-bold">Здравствуйте!</div>
                  <div className="text-sm text-gray-400">Выберите раздел ниже</div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Alert */}
          {isChat && bookingReady && (
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
          {isChat && !isLoading && quickButtons.length > 0 && (
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
                onBooking={() => setShowBookingForm(true)}
                onChat={() => {
                  if (isChat) {
                    inputRef.current?.focus();
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    const url = new URL(window.location.href);
                    url.searchParams.set('start', 'chat');
                    window.location.href = url.toString();
                  }
                }}
             />

            {/* Input Field */}
            {isChat && (
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
                  ref={inputRef}
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
            )}
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

        {/* Booking Form Modal */}
        {showBookingForm && (
            <BookingForm 
              initialName={telegram?.initDataUnsafe?.user?.first_name || ''}
              initialBrand={vehicleCard.brand || ''}
              initialModel={vehicleCard.model || ''}
              initialYear={vehicleCard.year?.substring(0, 4) || ''}
              initialReason={vehicleCard.symptoms?.join(', ') || ''}
              onOpenCarSelector={() => setShowCarSelector(true)}
              onSubmit={handleBookingSubmit}
              onCancel={() => setShowBookingForm(false)}
            />
        )}

      </div>
    </div>
  );
}

export default App;
