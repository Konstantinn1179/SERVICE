import React from 'react';
import { VehicleCard } from '../types';

interface Props {
  data: VehicleCard;
  className?: string;
}

const VehicleCardDisplay: React.FC<Props> = ({ data, className }) => {
  // Safe accessor to prevent crashes if data is malformed
  const symptoms = data?.symptoms || [];

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg ${className}`}>
      <h3 className="text-sm uppercase tracking-wider text-gray-400 font-bold mb-4 border-b border-gray-700 pb-2">
        Карточка Автомобиля
      </h3>
      
      <div className="space-y-4">
        {/* Car Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Марка</label>
            <div className="font-semibold text-white">{data?.brand || '—'}</div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Модель</label>
            <div className="font-semibold text-white">{data?.model || '—'}</div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Год</label>
            <div className="font-semibold text-white">{data?.year || '—'}</div>
          </div>
          <div>
            <label className="text-xs text-gray-500">КПП</label>
            <div className="font-semibold text-white">{data?.gearbox || '—'}</div>
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Симптомы</label>
          {symptoms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {symptoms.map((sym, idx) => (
                <span key={idx} className="bg-red-900/40 text-red-200 text-xs px-2 py-1 rounded border border-red-800/50">
                  {sym}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-600 italic text-sm">Нет данных</span>
          )}
        </div>

        {/* Statuses */}
        <div className="pt-2 border-t border-gray-700 grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${data?.drivable === false ? 'bg-red-500' : data?.drivable === true ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-xs text-gray-300">На ходу: {data?.drivable === null ? '?' : data?.drivable ? 'Да' : 'Нет'}</span>
          </div>
           <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${data?.needs_diagnosis ? 'bg-orange-500' : 'bg-gray-500'}`}></div>
            <span className="text-xs text-gray-300">Диагностика: {data?.needs_diagnosis ? 'Нужна' : 'Нет'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCardDisplay;