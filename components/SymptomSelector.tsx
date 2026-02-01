
import React, { useState } from 'react';
import { COMMON_SYMPTOMS, MAINTENANCE_TYPES, CONSULT_TOPICS, PRICE_ITEMS } from '../services/carData';

interface Props {
  onSelect: (text: string, rawItem?: string, type?: MenuLevel) => void;
  onCarSelect: () => void;
  onBooking: () => void;
}

type MenuLevel = 'main' | 'repair' | 'maintenance' | 'consult' | 'prices';

// Helper to get icons for any item type
const getIcon = (item: string, type: MenuLevel) => {
  const s = item.toLowerCase();

  // --- REPAIR ICONS ---
  if (type === 'repair') {
    if (s.includes('пинки') || s.includes('удары')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />;
    if (s.includes('вибрация')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
    if (s.includes('шум') || s.includes('гул')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />;
    if (s.includes('аварийный')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />;
    if (s.includes('течь')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />;
    return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
  }

  // --- MAINTENANCE ICONS ---
  if (type === 'maintenance') {
    if (s.includes('масла')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />;
    if (s.includes('фильтр')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />;
    return <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>;
  }

  // --- CONSULT ICONS ---
  if (type === 'consult') {
    if (s.includes('цены')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
    if (s.includes('гарантия')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
    if (s.includes('где')) return <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></>;
    return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />;
  }
  
  // --- PRICES ICONS ---
  if (type === 'prices') {
      if (s.includes('диагностика')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
      if (s.includes('масла')) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />;
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
  }

  return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
};

const SymptomSelector: React.FC<Props> = ({ onSelect, onCarSelect, onBooking }) => {
  const [level, setLevel] = useState<MenuLevel>('main');

  const handleSelection = (item: string) => {
    let prefix = '';
    if (level === 'repair') prefix = 'Беспокоит проблема: ';
    if (level === 'maintenance') prefix = 'Интересует обслуживание: ';
    if (level === 'consult') prefix = 'Вопрос: ';
    if (level === 'prices') prefix = 'Сколько стоит ';
    
    onSelect(`${prefix}${item}`, item, level);
  };

  return (
    <div className="px-3 sm:px-4 pb-3 pt-1 relative">
      
      {/* --- LEVEL 1: MAIN CATEGORIES (GRID ON MOBILE) --- */}
      {level === 'main' && (
        <div className="grid grid-cols-3 sm:flex sm:flex-nowrap gap-2 sm:gap-3">
          {/* 0. BOOKING (Prominent) */}
          <button
            onClick={onBooking}
            className="flex flex-col items-center justify-center h-20 sm:w-28 sm:h-24 bg-blue-600 hover:bg-blue-500 rounded-xl border border-blue-400 hover:border-blue-300 transition-all active:scale-95 group p-1.5 sm:p-2 text-center shadow-lg shadow-blue-900/50"
          >
            <div className="mb-1 sm:mb-2 p-1 sm:p-1.5 bg-blue-800/50 rounded-lg group-hover:bg-blue-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <span className="text-[9px] sm:text-[10px] leading-tight text-white font-bold uppercase tracking-wide">
              Записаться
            </span>
          </button>

          {/* 1. Car Select */}
          <button
            onClick={onCarSelect}
            className="flex flex-col items-center justify-center h-20 sm:w-28 sm:h-24 bg-blue-900/20 hover:bg-blue-900/40 rounded-xl border border-blue-500/30 hover:border-blue-500 transition-all active:scale-95 group p-1.5 sm:p-2 text-center"
          >
            <div className="mb-1 sm:mb-2 p-1 sm:p-1.5 bg-blue-900/50 rounded-lg group-hover:bg-blue-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l2-4h10l2 4v8h-2v-1H7v1H5v-8zm2 0h10m-9 5a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
            </div>
            <span className="text-[9px] sm:text-[10px] leading-tight text-blue-200 group-hover:text-white font-bold uppercase tracking-wide">
              Авто
            </span>
          </button>

          {/* 2. Prices Category */}
          <button
            onClick={() => setLevel('prices')}
            className="flex flex-col items-center justify-center h-20 sm:w-28 sm:h-24 bg-yellow-900/20 hover:bg-yellow-900/40 rounded-xl border border-yellow-500/30 hover:border-yellow-500 transition-all active:scale-95 group p-1.5 sm:p-2 text-center"
          >
            <div className="mb-1 sm:mb-2 p-1 sm:p-1.5 bg-yellow-900/50 rounded-lg group-hover:bg-yellow-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[9px] sm:text-[10px] leading-tight text-yellow-200 group-hover:text-white font-bold uppercase tracking-wide">
              Цены
            </span>
          </button>

          {/* 3. Repair Category */}
          <button
            onClick={() => setLevel('repair')}
            className="flex flex-col items-center justify-center h-20 sm:w-28 sm:h-24 bg-red-900/20 hover:bg-red-900/40 rounded-xl border border-red-500/30 hover:border-red-500 transition-all active:scale-95 group p-1.5 sm:p-2 text-center"
          >
            <div className="mb-1 sm:mb-2 p-1 sm:p-1.5 bg-red-900/50 rounded-lg group-hover:bg-red-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-[9px] sm:text-[10px] leading-tight text-red-200 group-hover:text-white font-bold uppercase tracking-wide">
              Ремонт
            </span>
          </button>

          {/* 4. Maintenance Category */}
          <button
            onClick={() => setLevel('maintenance')}
            className="flex flex-col items-center justify-center h-20 sm:w-28 sm:h-24 bg-green-900/20 hover:bg-green-900/40 rounded-xl border border-green-500/30 hover:border-green-500 transition-all active:scale-95 group p-1.5 sm:p-2 text-center"
          >
            <div className="mb-1 sm:mb-2 p-1 sm:p-1.5 bg-green-900/50 rounded-lg group-hover:bg-green-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-[9px] sm:text-[10px] leading-tight text-green-200 group-hover:text-white font-bold uppercase tracking-wide">
              ТО
            </span>
          </button>

          {/* 5. Consult Category */}
          <button
            onClick={() => setLevel('consult')}
            className="flex flex-col items-center justify-center h-20 sm:w-28 sm:h-24 bg-gray-800 hover:bg-gray-750 rounded-xl border border-gray-700 hover:border-blue-400 transition-all active:scale-95 group p-1.5 sm:p-2 text-center"
          >
            <div className="mb-1 sm:mb-2 p-1 sm:p-1.5 bg-gray-900 rounded-lg group-hover:bg-gray-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-[9px] sm:text-[10px] leading-tight text-gray-400 group-hover:text-white font-bold uppercase tracking-wide">
              Вопрос
            </span>
          </button>
        </div>
      )}

      {/* --- LEVEL 2: SUB-MENUS (SCROLLABLE WITH FADE CUE) --- */}
      {level !== 'main' && (
        <div className="relative group">
           {/* Fade Effect Cues for Scroll */}
           <div className="absolute left-14 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none opacity-50"></div>
           <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none"></div>

           <div className="flex overflow-x-auto space-x-2 sm:space-x-3 scrollbar-hide pb-2">
              {/* Back Button */}
              <button
                onClick={() => setLevel('main')}
                className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-20 sm:w-16 sm:h-24 bg-gray-950 hover:bg-gray-800 rounded-xl border border-gray-800 hover:border-gray-600 transition-all active:scale-95 group text-center sticky left-0 z-20"
              >
                <div className="mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </div>
                <span className="text-[9px] text-gray-500 font-bold uppercase">Назад</span>
              </button>

              {/* List Items */}
              {level === 'prices' && PRICE_ITEMS.map((item, idx) => (
                 <PriceMenuItem key={idx} item={item} onClick={() => handleSelection(`${item.title} (${item.price})`)} />
              ))}
              {level === 'repair' && COMMON_SYMPTOMS.map((item, idx) => (
                 <SubMenuItem key={idx} item={item} type="repair" onClick={() => handleSelection(item)} />
              ))}
              {level === 'maintenance' && MAINTENANCE_TYPES.map((item, idx) => (
                 <SubMenuItem key={idx} item={item} type="maintenance" onClick={() => handleSelection(item)} />
              ))}
              {level === 'consult' && CONSULT_TOPICS.map((item, idx) => (
                 <SubMenuItem key={idx} item={item} type="consult" onClick={() => handleSelection(item)} />
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

interface PriceMenuItemProps {
  item: { title: string, price: string };
  onClick: () => void;
}

const PriceMenuItem: React.FC<PriceMenuItemProps> = ({ item, onClick }) => {
    return (
        <button
          onClick={onClick}
          className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-20 sm:w-36 sm:h-24 bg-gray-800 hover:bg-gray-750 rounded-xl border border-gray-700 hover:border-yellow-500 transition-all active:scale-95 group p-1.5 sm:p-2 text-center"
        >
          <div className="mb-1 p-1 bg-yellow-900/30 rounded-lg group-hover:bg-yellow-900/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[9px] sm:text-[10px] leading-tight text-gray-300 font-medium mb-1 line-clamp-1">
            {item.title}
          </span>
          <span className="text-[10px] sm:text-xs font-bold text-white bg-gray-700 px-2 py-0.5 rounded-full group-hover:bg-yellow-600 transition-colors">
            {item.price}
          </span>
        </button>
    )
}

interface SubMenuItemProps {
  item: string;
  type: MenuLevel;
  onClick: () => void;
}

const SubMenuItem: React.FC<SubMenuItemProps> = ({ item, type, onClick }) => {
    let borderColor = 'border-gray-700';
    let hoverBorder = 'hover:border-gray-500';
    let iconColor = 'text-gray-400';
    
    if (type === 'repair') { iconColor = 'text-red-400'; hoverBorder = 'hover:border-red-500'; }
    if (type === 'maintenance') { iconColor = 'text-green-400'; hoverBorder = 'hover:border-green-500'; }
    if (type === 'consult') { iconColor = 'text-blue-400'; hoverBorder = 'hover:border-blue-500'; }

    return (
        <button
          onClick={onClick}
          className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-20 sm:w-28 sm:h-24 bg-gray-800 hover:bg-gray-750 rounded-xl border ${borderColor} ${hoverBorder} transition-all active:scale-95 group p-1.5 sm:p-2 text-center`}
        >
          <div className="mb-1 sm:mb-2 p-1 sm:p-1.5 bg-gray-900 rounded-lg group-hover:bg-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               {getIcon(item, type)}
            </svg>
          </div>
          <span className="text-[9px] sm:text-[10px] leading-tight text-gray-400 group-hover:text-white font-medium line-clamp-2">
            {item}
          </span>
        </button>
    )
}

export default SymptomSelector;
