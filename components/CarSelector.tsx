import React, { useState } from 'react';
import { POPULAR_CARS, YEARS } from '../services/carData';

interface Props {
  onComplete: (brand: string, model: string, year: string) => void;
  onCancel: () => void;
}

type Step = 'brand' | 'model' | 'year';

const CarSelector: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<Step>('brand');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const currentBrandData = POPULAR_CARS.find(c => c.name === selectedBrand);

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setStep('model');
  };

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setStep('year');
  };

  const handleYearSelect = (year: string) => {
    onComplete(selectedBrand, selectedModel, year);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-gray-900 w-full max-w-md h-[80vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl border border-gray-700 animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">
            {step === 'brand' && 'Выберите Марку'}
            {step === 'model' && `Модель ${selectedBrand}`}
            {step === 'year' && 'Год выпуска'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          
          {/* STEP 1: BRANDS */}
          {step === 'brand' && (
            <div className="grid grid-cols-2 gap-3">
              {POPULAR_CARS.map((car) => (
                <button
                  key={car.id}
                  onClick={() => handleBrandSelect(car.name)}
                  className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl text-center border border-gray-700 transition-all active:scale-95 flex flex-col items-center"
                >
                  <span className="font-bold text-white text-2xl">{car.name}</span>
                </button>
              ))}
              <button 
                 onClick={() => onCancel()} 
                 className="col-span-2 mt-2 py-3 text-sm text-gray-500 hover:text-gray-300"
              >
                Моей марки нет в списке (ввести вручную)
              </button>
            </div>
          )}

          {/* STEP 2: MODELS */}
          {step === 'model' && currentBrandData && (
            <div className="space-y-2">
              <button 
                onClick={() => setStep('brand')}
                className="mb-4 text-xs text-blue-400 flex items-center"
              >
                ← Назад к маркам
              </button>
              {currentBrandData.models.map((model) => (
                <button
                  key={model}
                  onClick={() => handleModelSelect(model)}
                  className="w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-xl text-left border border-gray-700 transition-all text-white font-medium"
                >
                  {model}
                </button>
              ))}
            </div>
          )}

          {/* STEP 3: YEARS */}
          {step === 'year' && (
             <div>
               <button 
                onClick={() => setStep('model')}
                className="mb-4 text-xs text-blue-400 flex items-center"
              >
                ← Назад к моделям
              </button>
              <div className="grid grid-cols-4 gap-2">
                {YEARS.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className="bg-gray-800 hover:bg-blue-600 hover:border-blue-500 hover:text-white p-3 rounded-xl text-center border border-gray-700 transition-all text-gray-300 text-base font-bold"
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-3 bg-gray-950 text-center text-[10px] text-gray-600 rounded-b-xl sm:rounded-b-2xl">
           Выбор автомобиля помогает AI быстрее найти решение
        </div>
      </div>
    </div>
  );
};

export default CarSelector;
