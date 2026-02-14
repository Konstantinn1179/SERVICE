import React, { useState, useEffect } from 'react';

interface Props {
  onSubmit: (name: string, phone: string, brand: string, model: string, year: string, reason: string, bookingDate: string, bookingTime: string, chatId?: number, platform?: string) => void;
  onCancel: () => void;
  initialName?: string;
  initialBrand?: string;
  initialModel?: string;
  initialYear?: string;
  initialReason?: string;
}

const BookingForm: React.FC<Props> = ({ 
  onSubmit, 
  onCancel, 
  initialName = '',
  initialBrand = '',
  initialModel = '',
  initialYear = '',
  initialReason = ''
}) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('+7 ');
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [year, setYear] = useState(initialYear);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [reason, setReason] = useState(initialReason);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  // Update fields if initial props change (e.g. after async analysis completes)
  useEffect(() => {
    if (initialName && !name) setName(initialName);
    if (initialBrand && !brand) setBrand(initialBrand);
    if (initialModel && !model) setModel(initialModel);
    if (initialYear && !year) setYear(initialYear);
    if (initialReason && !reason) setReason(initialReason);
  }, [initialName, initialBrand, initialModel, initialYear, initialReason]);
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  React.useEffect(() => {
    if (bookingDate) {
      fetchSlots(bookingDate);
    } else {
        setAvailableSlots([]);
    }
  }, [bookingDate]);

  const fetchSlots = async (date: string) => {
    setLoadingSlots(true);
    setBookingTime(''); // Reset time when date changes
    try {
      const response = await fetch(`/api/slots?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.available_slots || []);
      } else {
        console.error('Failed to fetch slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Simple phone formatter for Russian numbers
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    
    // Ensure it starts with 7
    if (!val) {
      setPhone('+7 ');
      return;
    }
    if (val[0] === '8') val = '7' + val.slice(1);
    if (val[0] !== '7') val = '7' + val;

    // Limit length
    val = val.slice(0, 11);

    // Format
    let formatted = '+7';
    if (val.length > 1) formatted += ' (' + val.slice(1, 4);
    if (val.length >= 5) formatted += ') ' + val.slice(4, 7);
    if (val.length >= 8) formatted += '-' + val.slice(7, 9);
    if (val.length >= 10) formatted += '-' + val.slice(9, 11);

    setPhone(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.length < 2) {
      setError('Пожалуйста, укажите имя.');
      return;
    }
    if (phone.length < 18) { // +7 (XXX) XXX-XX-XX is 18 chars
      setError('Введите полный номер телефона.');
      return;
    }
    if (!agreed) {
      setError('Необходимо согласие на обработку данных.');
      return;
    }

    setError('');
    const chatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const params = new URLSearchParams(window.location.search);
    const platformParam = params.get('platform') || (window.Telegram?.WebApp ? 'telegram' : undefined);
    onSubmit(name, phone, brand, model, year, reason, bookingDate, bookingTime, chatId, platformParam || 'web');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-gray-900 w-full max-w-md rounded-2xl flex flex-col shadow-2xl border border-gray-700 relative my-auto">
        
        {/* Accent Top Border */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-green-500"></div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
               <h2 className="text-xl font-bold text-white">Запись на сервис</h2>
               <p className="text-xs text-gray-500 mt-1">Заполните данные об автомобиле</p>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Телефон</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+7..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm font-mono"
                  />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Марка авто</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Toyota"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Модель</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Camry"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm"
                  />
                </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1 ml-1">Год выпуска</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2020"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Дата</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Время</label>
                  {!bookingDate ? (
                     <div className="text-gray-500 text-sm py-2 px-1">Выберите дату</div>
                  ) : loadingSlots ? (
                     <div className="text-gray-400 text-sm py-2 animate-pulse">Загрузка...</div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setBookingTime(slot)}
                          className={`px-1 py-1.5 text-xs rounded border transition-colors ${
                            bookingTime === slot
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-red-400 text-sm py-2">Нет мест</div>
                  )}
                </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1 ml-1">Неисправность</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Опишите проблему..."
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm resize-none"
              />
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3 mt-4 mb-2">
              <div className="flex items-center h-5">
                <input
                  id="consent"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
              </div>
              <label htmlFor="consent" className="text-xs text-gray-400">
                Я даю согласие на обработку моих персональных данных в соответствии с <a href="#" className="text-blue-400 hover:underline">политикой конфиденциальности</a>.
              </label>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-800/30 mb-4 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] mt-2"
            >
              ОТПРАВИТЬ ЗАЯВКУ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
