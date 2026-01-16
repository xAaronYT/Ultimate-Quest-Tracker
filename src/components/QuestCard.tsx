import React, { useState } from 'react';
import { Quest } from '../types';
import { normalizeAssetName } from '../utils';

interface QuestCardProps {
  quest: Quest;
  isCompleted: boolean;
  isAvailable: boolean;
  onToggle: (id: string) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, isCompleted, isAvailable, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`relative flex flex-col transition-all duration-200 rounded-xl border overflow-hidden
      ${isCompleted 
        ? 'bg-black/20 border-white/5 opacity-40' 
        : !isAvailable 
          ? 'bg-[#0a0a0a] border-white/5 opacity-60 grayscale' 
          : 'bg-[#111111] border-white/10 shadow-lg'
      }
    `}>
      <div className="flex h-24">
        {/* LEFT 75%: MAIN CLICK AREA (TOGGLE COMPLETE) */}
        <div 
          onClick={() => onToggle(quest.id)}
          className="w-[75%] p-4 flex gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors border-r border-white/5"
        >
          <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center p-1">
            <img 
              src={`/assets/${normalizeAssetName(quest.trader.name)}.png`} 
              alt={quest.trader.name} 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 italic">
                {quest.trader.name}
              </span>
              <div className="flex gap-1">
                {quest.kappaRequired && <span className="text-[8px] font-black bg-yellow-500 text-black px-1 rounded-sm">K</span>}
                {quest.lightkeeperRequired && <span className="text-[8px] font-black bg-blue-600 text-white px-1 rounded-sm">L</span>}
              </div>
            </div>
            <h3 className={`text-[11px] font-black uppercase tracking-tight leading-tight line-clamp-2 ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
              {quest.name}
            </h3>
          </div>
        </div>

        {/* RIGHT 25%: DROP DOWN ARROW */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-[25%] flex items-center justify-center cursor-pointer hover:bg-white/[0.05] transition-colors group"
        >
          <svg 
            className={`w-5 h-5 text-gray-600 group-hover:text-orange-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* EXPANDED CONTENT: OBJECTIVES / REQS */}
      {isExpanded && (
        <div className="p-4 border-t border-white/5 bg-black/20 text-[10px] space-y-3">
          {quest.objectives && quest.objectives.length > 0 && (
            <div>
              <p className="text-orange-500 font-black uppercase tracking-widest mb-1 text-[8px]">Objectives</p>
              <ul className="space-y-1 text-gray-400 font-bold">
                {quest.objectives.map((obj, i) => (
                  <li key={i} className="flex gap-2 leading-tight">
                    <span className="text-orange-500/50">•</span> {obj.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="pt-2 border-t border-white/5 flex justify-between items-center text-gray-600 italic">
            <span>Required Level: {quest.minPlayerLevel || 1}</span>
          </div>
        </div>
      )}

      {/* PROGRESS BAR (BOTTOM) */}
      <div className={`h-1 w-full ${isCompleted ? 'bg-green-600' : 'bg-white/5'}`} />

      {/* LOCKED OVERLAY */}
      {!isAvailable && !isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
          <div className="px-2 py-0.5 bg-black/90 border border-white/10 rounded flex items-center gap-2">
             <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Locked</span>
          </div>
        </div>
      )}
    </div>
  );
};