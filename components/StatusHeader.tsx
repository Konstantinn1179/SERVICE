
import React from 'react';
import { StatusColor, BranchType } from '../types';

interface Props {
  status: StatusColor;
  branch: BranchType;
  onInfoClick?: () => void;
}

const colorMap: Record<StatusColor, string> = {
  red: 'bg-red-600 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)]',
  yellow: 'bg-yellow-500 border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]',
  green: 'bg-green-600 border-green-400 shadow-[0_0_15px_rgba(22,163,74,0.5)]',
  blue: 'bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)]',
  black: 'bg-gray-950 border-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
};

const textMap: Record<StatusColor, string> = {
  red: 'КРИТИЧНО',
  yellow: 'ВНИМАНИЕ',
  green: 'ШТАТНО',
  blue: 'КОНСУЛЬТАЦИЯ',
  black: 'ОТКАЗ'
};

const StatusHeader: React.FC<Props> = ({ status, branch, onInfoClick }) => {
  return (
    <div className="flex items-center justify-between bg-gray-900 border-b border-gray-800 p-3 sm:p-4 sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <div className="relative">
             <div className={`w-3 h-3 rounded-full ${colorMap[status].split(' ')[0]} animate-pulse`}></div>
             <div className={`absolute -inset-1 rounded-full opacity-30 ${colorMap[status].split(' ')[0]} blur-sm`}></div>
        </div>
        
        <div>
           <h1 className="text-base sm:text-lg font-bold text-gray-100 tracking-tight leading-none">АКПП-центр</h1>
           <div className="flex items-center gap-2 mt-0.5">
             <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${colorMap[status]}`}>
               {textMap[status]}
             </span>
             <span className="text-[9px] sm:text-[10px] uppercase text-gray-500 font-mono tracking-widest hidden xs:block">
               {branch}
             </span>
           </div>
        </div>
      </div>
      
      <div className="flex items-center">
          {/* Desktop Address */}
          <div className="hidden sm:block text-right mr-2">
            <div className="text-xs text-gray-500">АКПП-центр Киров</div>
            <div className="text-[10px] text-gray-600">ул. Романа Ердякова 23г</div>
          </div>
          
          {/* Mobile Info Button */}
          <button 
             onClick={onInfoClick}
             className="lg:hidden p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg border border-gray-700 ml-2 active:scale-95 transition-all"
             aria-label="Info"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </button>
      </div>
    </div>
  );
};

export default StatusHeader;
