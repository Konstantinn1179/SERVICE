import React, { useState } from 'react';

interface Props {
  onSubmit: (name: string, phone: string, brand: string, model: string, year: string, reason: string, bookingDate: string, bookingTime: string) => void;
  onCancel: () => void;
  initialName?: string;
}

const BookingForm: React.FC<Props> = ({ onSubmit, onCancel, initialName = '' }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('+7 ');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

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
    onSubmit(name, phone, brand, model, year, reason, bookingDate, bookingTime);
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
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm"
                  />
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

            {/* 152-FZ Compliance Section */}
            <div className="pt-2">
              <label className="flex items-start space-x-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-600 bg-gray-800 checked:border-blue-500 checked:bg-blue-600 transition-all"
                  />
                  <svg
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="text-[11px] leading-tight text-gray-400 group-hover:text-gray-300 transition-colors">
                  Я даю согласие на обработку моих персональных данных в соответствии с <a href="#" className="text-blue-400 underline decoration-blue-400/30 hover:decoration-blue-400">Политикой конфиденциальности</a> и ФЗ-152.
                </div>
              </label>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-2 text-center">
                <p className="text-xs text-red-200">{error}</p>
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