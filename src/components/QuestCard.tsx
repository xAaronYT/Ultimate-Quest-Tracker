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
  // STRICT LOGIC: Only show yellow ring if it's actually KAPPA required AND NOT COMPLETED
  const showKappaRing = quest.kappaRequired && !isCompleted;

  return (
    <div 
      onClick={() => onToggle(quest.id)}
      className={`relative group cursor-pointer transition-all duration-300 rounded-xl border-2 overflow-hidden
        ${isCompleted ? 'bg-black/20 border-white/5 opacity-40' : 
          !isAvailable ? 'bg-[#0a0a0a] border-red-900/20 opacity-60 grayscale' : 
          showKappaRing ? 'bg-[#111111] border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 
          'bg-[#111111] border-white/5 hover:border-orange-500/30'}
      `}
    >
      <div className="p-5 flex gap-5">
        <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center p-1">
          <img 
            src={`/assets/${normalizeAssetName(quest.trader.name)}.png`} 
            alt={quest.trader.name} 
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 italic">
              {quest.trader.name}
            </span>
            {showKappaRing && (
              <span className="text-[8px] font-black bg-yellow-500 text-black px-1.5 py-0.5 rounded uppercase">Kappa</span>
            )}
          </div>
          <h3 className={`text-sm font-black uppercase tracking-tight leading-tight truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
            {quest.name}
          </h3>
          <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">
            Level {quest.minPlayerLevel || 1} Required
          </p>
        </div>
      </div>

      <div className={`h-1.5 w-full transition-colors ${isCompleted ? 'bg-green-600' : showKappaRing ? 'bg-yellow-500/20' : 'bg-white/5'}`} />
      
      {!isAvailable && !isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <span className="text-[9px] font-black text-red-500 bg-black/80 px-3 py-1 border border-red-500/20 rounded-full uppercase tracking-widest">Locked</span>
        </div>
      )}
    </div>
  );
};