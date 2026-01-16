import React from 'react';
import { Quest } from '../types';
import { normalizeAssetName } from '../utils';

interface QuestCardProps {
  quest: Quest;
  isCompleted: boolean;
  isAvailable: boolean;
  onToggle: (id: string) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, isCompleted, isAvailable, onToggle }) => {
  return (
    <div 
      onClick={() => onToggle(quest.id)}
      className={`relative group cursor-pointer transition-all duration-200 rounded-xl border overflow-hidden
        ${isCompleted 
          ? 'bg-black/20 border-white/5 opacity-40' 
          : !isAvailable 
            ? 'bg-[#0a0a0a] border-white/5 opacity-60 grayscale' 
            : 'bg-[#111111] border-white/10 hover:border-orange-500/30 shadow-lg'
        }
      `}
    >
      <div className="p-5 flex gap-5">
        {/* Trader Icon */}
        <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center p-1">
          <img 
            src={`/assets/${normalizeAssetName(quest.trader.name)}.png`} 
            alt={quest.trader.name} 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 italic">
              {quest.trader.name}
            </span>
            <div className="flex gap-1">
              {quest.kappaRequired && (
                <span className="w-5 h-5 flex items-center justify-center text-[10px] font-black bg-yellow-500 text-black rounded-sm shadow-sm" title="Kappa Required">K</span>
              )}
              {quest.lightkeeperRequired && (
                <span className="w-5 h-5 flex items-center justify-center text-[10px] font-black bg-blue-600 text-white rounded-sm shadow-sm" title="Lightkeeper Required">L</span>
              )}
            </div>
          </div>
          
          <h3 className={`text-sm font-black uppercase tracking-tight leading-tight truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
            {quest.name}
          </h3>
          
          <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">
            Lvl {quest.minPlayerLevel || 1}
          </p>
        </div>
      </div>

      {/* Progress Indicator at Bottom of Card */}
      <div className={`h-1 w-full transition-colors ${isCompleted ? 'bg-green-600' : 'bg-white/5'}`} />
      
      {/* Locked Overlay */}
      {!isAvailable && !isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="px-3 py-1 bg-black/80 border border-white/10 rounded flex items-center gap-2">
            <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest font-inter">Locked</span>
          </div>
        </div>
      )}
    </div>
  );
};