import React, { useState, useEffect } from 'react';
import { COMMON_SYMPTOMS, MAINTENANCE_TYPES } from '../services/carData';

interface Props {
  onSubmit: (name: string, phone: string, brand: string, model: string, year: string, reason: string, bookingDate: string, bookingTime: string, chatId?: number, platform?: string, licensePlate?: string, mileage?: string) => void;
  onCancel: () => void;
  onOpenCarSelector?: () => void;
  initialName?: string;
  initialBrand?: string;
  initialModel?: string;
  initialYear?: string;
  initialReason?: string;
}

const BookingForm: React.FC<Props> = ({ 
  onSubmit, 
  onCancel, 
  onOpenCarSelector,
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
  const [bookingDateDisplay, setBookingDateDisplay] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [reason, setReason] = useState(initialReason);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [mileage, setMileage] = useState('');
  const [showRepairInfo, setShowRepairInfo] = useState(false);
  const [showMaintenanceInfo, setShowMaintenanceInfo] = useState(false);
  const [showCarInfo, setShowCarInfo] = useState(false);
  const [showRepairOverlay, setShowRepairOverlay] = useState(false);
  const [showMaintenanceOverlay, setShowMaintenanceOverlay] = useState(false);
  const [selectedRepairs, setSelectedRepairs] = useState<string[]>([]);
  const [selectedMaintenance, setSelectedMaintenance] = useState<string[]>([]);

  // Update fields if initial props change (e.g. after async analysis completes)
  useEffect(() => {
    if (initialName && !name) setName(initialName);
    if (initialBrand && !brand) setBrand(initialBrand);
    if (initialModel && !model) setModel(initialModel);
    if (initialYear && !year) setYear(initialYear);
    if (initialReason && !reason) setReason(initialReason);
  }, [initialName, initialBrand, initialModel, initialYear, initialReason]);
  
  useEffect(() => {
    const items = initialReason ? initialReason.split(',').map(s => s.trim()).filter(Boolean) : [];
    setSelectedRepairs(items.filter(sym => COMMON_SYMPTOMS.includes(sym)));
    setSelectedMaintenance(items.filter(item => MAINTENANCE_TYPES.includes(item)));
  }, [initialReason]);
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [calendarUnavailable, setCalendarUnavailable] = useState(false);
  const DEFAULT_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

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
        setCalendarUnavailable(false);
      } else {
        console.error('Failed to fetch slots');
        setCalendarUnavailable(true);
        setAvailableSlots(DEFAULT_SLOTS);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setCalendarUnavailable(true);
      setAvailableSlots(DEFAULT_SLOTS);
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
  
  // Simple license plate formatter (RU style: A123BC 43 or A123BC 143)
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase();
    // Allow Cyrillic, Latin letters and digits; remove extra spaces/hyphens
    raw = raw.replace(/[^A-ZА-Я0-9]/g, '');
    // Try to match pattern: Letter + 3 digits + 2 letters + region (2-3 digits)
    const m = raw.match(/^([A-ZА-Я])(\d{0,3})([A-ZА-Я]{0,2})(\d{0,3})$/);
    if (m) {
      const l1 = m[1] || '';
      const d3 = m[2] || '';
      const l2 = m[3] || '';
      const reg = m[4] || '';
      const left = `${l1}${d3}${l2}`;
      const formatted = reg.length > 0 ? `${left} ${reg}` : left;
      setLicensePlate(formatted);
      return;
    }
    setLicensePlate(raw);
  };
  
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 8);
    let display = val;
    if (val.length > 2) display = val.slice(0, 2) + '/' + val.slice(2);
    if (val.length > 4) display = display.slice(0, 5) + '/' + val.slice(4);
    setBookingDateDisplay(display);
    if (val.length === 8) {
      const dd = val.slice(0, 2);
      const mm = val.slice(2, 4);
      const yyyy = val.slice(4);
      const iso = `${yyyy}-${mm}-${dd}`;
      const d = new Date(`${iso}T00:00:00`);
      if (!isNaN(d.getTime())) {
        setBookingDate(iso);
        return;
      }
    }
    setBookingDate('');
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
    if (!bookingDate) {
      setError('Выберите дату записи.');
      return;
    }
    if (!bookingTime) {
      setError('Выберите время записи.');
      return;
    }

    setError('');
    const chatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const params = new URLSearchParams(window.location.search);
    const platformParam = params.get('platform') || (window.Telegram?.WebApp ? 'telegram' : undefined);
    onSubmit(name, phone, brand, model, year, reason, bookingDate, bookingTime, chatId, platformParam || 'web', licensePlate, mileage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-gray-900 w-full max-w-lg sm:max-w-xl rounded-2xl flex flex-col shadow-2xl border border-gray-700 relative my-auto">
        
        {/* Accent Top Border */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-green-500"></div>

        <div className="p-6">
          {/* Overlays */}
          {showRepairOverlay && (
            <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-gray-900 w-full max-w-md h-[75vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl border border-red-700 animate-slide-up">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <h3 className="text-lg font-bold text-white">Выберите неисправность</h3>
                  <button onClick={() => setShowRepairOverlay(false)} className="text-gray-400 hover:text-white p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                  <div className="grid grid-cols-2 gap-3">
                    {COMMON_SYMPTOMS.map((sym, idx) => {
                      const isSelected = selectedRepairs.includes(sym);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const currentlySelected = selectedRepairs.includes(sym);
                            setSelectedRepairs(currentlySelected ? selectedRepairs.filter(s => s !== sym) : [...selectedRepairs, sym]);
                            setReason(prev => {
                              const items = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : [];
                              if (currentlySelected) {
                                return items.filter(i => i !== sym).join(', ');
                              } else {
                                if (items.includes(sym)) return prev;
                                return [...items, sym].join(', ');
                              }
                            });
                          }}
                          className={`${isSelected ? 'bg-red-600 border-yellow-400 text-white ring-2 ring-yellow-400' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-red-600 hover:border-red-500 hover:text-white'} p-4 rounded-xl text-center transition-all text-sm font-bold active:scale-95`}
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="p-3 bg-gray-950 text-center text-[10px] text-gray-600 rounded-b-xl sm:rounded-b-2xl">
                  Можно выбрать несколько пунктов, затем закрыть окно
                </div>
              </div>
            </div>
          )}
          {showMaintenanceOverlay && (
            <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-gray-900 w-full max-w-md h-[75vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl border border-green-700 animate-slide-up">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <h3 className="text-lg font-bold text-white">Выберите ТО/обслуживание</h3>
                  <button onClick={() => setShowMaintenanceOverlay(false)} className="text-gray-400 hover:text-white p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                  <div className="grid grid-cols-2 gap-3">
                    {MAINTENANCE_TYPES.map((item, idx) => {
                      const isSelected = selectedMaintenance.includes(item);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const currentlySelected = selectedMaintenance.includes(item);
                            setSelectedMaintenance(currentlySelected ? selectedMaintenance.filter(s => s !== item) : [...selectedMaintenance, item]);
                            setReason(prev => {
                              const items = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : [];
                              if (currentlySelected) {
                                return items.filter(i => i !== item).join(', ');
                              } else {
                                if (items.includes(item)) return prev;
                                return [...items, item].join(', ');
                              }
                            });
                          }}
                          className={`${isSelected ? 'bg-green-600 border-yellow-400 text-white ring-2 ring-yellow-400' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-green-600 hover:border-green-500 hover:text-white'} p-4 rounded-xl text-center transition-all text-sm font-bold active:scale-95`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="p-3 bg-gray-950 text-center text-[10px] text-gray-600 rounded-b-xl sm:rounded-b-2xl">
                  Можно выбрать несколько пунктов, затем закрыть окно
                </div>
              </div>
            </div>
          )}
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

          {/* Inline Icons/Shortcuts */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Авто */}
            <button
              type="button"
              onClick={() => { setShowCarInfo(v => !v); onOpenCarSelector?.(); }}
              className="flex flex-col items-center justify-center h-16 bg-blue-900/20 hover:bg-blue-900/40 rounded-xl border border-blue-500/30 hover:border-blue-500 transition-all active:scale-95 group p-1.5 text-center"
            >
              <div className="mb-1 p-1 bg-blue-900/50 rounded-lg group-hover:bg-blue-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l2-4h10l2 4v8h-2v-1H7v1H5v-8zm2 0h10m-9 5a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
              </div>
              <span className="text-[10px] leading-tight text-blue-200 group-hover:text-white font-bold uppercase tracking-wide">
                Авто
              </span>
            </button>
            {/* Несправность */}
            <button
              type="button"
              onClick={() => { setShowRepairOverlay(true); setShowRepairInfo(false); setShowMaintenanceInfo(false); }}
              className={`flex flex-col items-center justify-center h-16 rounded-xl border transition-all active:scale-95 group p-1.5 text-center ${
                showRepairOverlay 
                  ? 'bg-red-900/40 border-red-500' 
                  : 'bg-red-900/20 border-red-500/30 hover:bg-red-900/40 hover:border-red-500'
              }`}
            >
              <div className={`mb-1 p-1 rounded-lg transition-colors ${
                showRepairOverlay ? 'bg-red-900/60' : 'bg-red-900/50 group-hover:bg-red-800'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${showRepairOverlay ? 'text-white' : 'text-red-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className={`text-[10px] leading-tight font-bold uppercase tracking-wide ${
                showRepairOverlay ? 'text-white' : 'text-red-200 group-hover:text-white'
              }`}>
                Несправность
              </span>
            </button>
            {/* ТО */}
            <button
              type="button"
              onClick={() => { setShowMaintenanceOverlay(true); setShowMaintenanceInfo(false); setShowRepairInfo(false); }}
              className="flex flex-col items-center justify-center h-16 bg-green-900/20 hover:bg-green-900/40 rounded-xl border border-green-500/30 hover:border-green-500 transition-all active:scale-95 group p-1.5 text-center"
            >
              <div className="mb-1 p-1 bg-green-900/50 rounded-lg group-hover:bg-green-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <span className="text-[10px] leading-tight text-green-200 group-hover:text-white font-bold uppercase tracking-wide">
                ТО
              </span>
            </button>
          </div>

          {/* Info Panels */}
          {showCarInfo && (
            <div className="mb-3 text-xs text-gray-300 bg-gray-800/60 border border-gray-700 rounded-lg p-3">
              Укажите марку, модель и год. Можно выбрать из списка — нажмите «Авто» ещё раз, чтобы открыть выбор.
            </div>
          )}
          {showRepairInfo && (
            <div className="mb-3">
              <div className="text-xs text-gray-300 mb-2">Частые неисправности:</div>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((sym, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setReason(prev => {
                        const items = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : [];
                        if (items.includes(sym)) return prev;
                        const next = [...items, sym].join(', ');
                        return next;
                      });
                    }}
                    className="px-2 py-1 text-xs rounded border border-red-500/40 text-red-200 bg-red-900/30 hover:bg-red-900/50 transition-colors"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          )}
          {showMaintenanceInfo && (
            <div className="mb-3">
              <div className="text-xs text-gray-300 mb-2">ТО и обслуживание:</div>
              <div className="flex flex-wrap gap-2">
                {MAINTENANCE_TYPES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setReason(prev => {
                        const items = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : [];
                        if (items.includes(item)) return prev;
                        const next = [...items, item].join(', ');
                        return next;
                      });
                    }}
                    className="px-2 py-1 text-xs rounded border border-green-500/40 text-green-200 bg-green-900/30 hover:bg-green-900/50 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                <label className="block text-xs text-gray-400 mb-1 ml-1">Гос. номер</label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={handlePlateChange}
                  placeholder="А123ВС 43"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 ml-1">Пробег, км</label>
                <input
                  type="number"
                  min={0}
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="120000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 ml-1">Дата</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bookingDateDisplay}
                    onChange={handleDateInputChange}
                    placeholder="дд/мм/гггг"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 text-sm"
                  />
                  {bookingDateDisplay && (
                    <div className="text-[11px] text-gray-400 mt-1">Выбрано: {bookingDateDisplay}</div>
                  )}
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
                  {bookingDate && !loadingSlots && calendarUnavailable && (
                    <div className="text-[11px] text-yellow-400 mt-1">Календарь недоступен, выберите ориентировочное время</div>
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
              disabled={!bookingDate || !bookingTime}
              className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] mt-2 ${
                !bookingDate || !bookingTime
                  ? 'bg-gray-700 text-gray-300 cursor-not-allowed shadow-gray-900/10'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-900/20'
              }`}
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
