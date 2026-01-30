import React from 'react';
import { Message } from '../types';

interface Props {
  message: Message;
}

const ChatMessage: React.FC<Props> = ({ message }) => {
  const isBot = message.role === 'model';

  // Basic markdown-like parser for bold text (**text**)
  const formatText = (text: string) => {
    // Remove the [STATUS: ...] tag for display if present
    const cleanText = text.replace(/\[STATUS:\s*\w+\]/g, '').trim();
    
    return cleanText.split(/(\*\*.*?\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 animate-fade-in`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
          isBot
            ? 'bg-gray-800 text-gray-200 rounded-tl-sm border border-gray-700'
            : 'bg-blue-600 text-white rounded-tr-sm'
        }`}
      >
        <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
          {formatText(message.text)}
        </div>
        <div className={`text-[10px] mt-1 opacity-50 ${isBot ? 'text-left' : 'text-right'}`}>
            {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;