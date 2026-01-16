import React, { useState } from 'react';
import { Quest } from '../types';
import { TRADER_COLORS } from '../constants';
import { normalizeAssetName } from '../utils';

interface QuestCardProps {
  quest: Quest;
  isCompleted: boolean;
  isAvailable: boolean;
  onToggle: (id: string) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, isCompleted, isAvailable, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLocked = !isAvailable && !isCompleted;

  return (
    <div 
      className={`group/card relative rounded-lg border transition-all duration-300 flex flex-col overflow-hidden ${
        isCompleted 
          ? 'bg-[#0a0a0a] border-green-500/20' 
          : isLocked 
            ? 'border-red-900/20 bg-[#0d0a0a]' 
            : 'border-white/5 bg-[#121212] hover:border-white/10'
      } border-l-4 ${TRADER_COLORS[quest.trader.name] || 'border-gray-800'}`}
    >
      {/* LOCKED OVERLAY */}
      {isLocked && (
        <div className="absolute inset-0 z-10 bg-black/40 pointer-events-none flex items-center justify-center opacity-60">
          <div className="bg-red-900/80 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.3em] -rotate-12">
            Locked
          </div>
        </div>
      )}

      <div className="flex h-16 min-h-[4rem]">
        <div 
          className={`flex-1 p-3 flex items-center gap-3 transition-colors min-w-0 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.02]'} border-r border-white/5`}
          onClick={() => !isLocked && onToggle(quest.id)}
        >
          <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center border border-white/5 shrink-0 overflow-hidden relative">
            <img 
              src={`assets/${normalizeAssetName(quest.trader.name)}.png`} 
              alt=""
              className={`w-full h-full object-cover ${isCompleted ? 'grayscale opacity-30' : isLocked ? 'grayscale opacity-10' : ''}`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.trader-fallback')) {
                  const span = document.createElement('span');
                  span.className = 'trader-fallback text-[10px] font-black text-gray-700';
                  span.innerText = quest.trader.name[0];
                  parent.appendChild(span);
                }
              }}
            />
            {isCompleted && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className={`text-[10px] font-black tracking-tight leading-tight truncate uppercase ${isCompleted ? 'text-green-500/50 line-through' : isLocked ? 'text-gray-600' : 'text-gray-200 transition-colors group-hover/card:text-orange-500'}`}>
              {quest.name}
            </h3>
            <div className="flex gap-2 mt-0.5 items-center">
              <span className={`text-[7px] font-bold tracking-tighter shrink-0 ${isCompleted ? 'text-green-900' : isLocked ? 'text-red-900' : 'text-orange-600'}`}>LVL {quest.minPlayerLevel}</span>
              <span className="text-[7px] text-gray-600 font-bold uppercase tracking-tighter shrink-0">{quest.trader.name}</span>
            </div>
          </div>
        </div>

        {/* RIGHT AREA */}
        <div className="w-16 flex flex-col shrink-0">
          <div className="flex-1 flex items-center justify-center gap-1 border-b border-white/5 bg-black/20">
            {quest.kappaRequired && <div className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-black ${isCompleted ? 'bg-green-900 text-green-400' : 'bg-[#fff000] text-black'}`} title="KAPPA">K</div>}
            {quest.lightkeeperRequired && <div className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-black ${isCompleted ? 'bg-green-900 text-green-400' : 'bg-blue-600 text-white'}`} title="LIGHTKEEPER">L</div>}
          </div>
          <button 
            className={`flex-1 flex items-center justify-center transition-all hover:bg-white/5 ${isExpanded ? 'bg-white/5' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg className={`w-3 h-3 text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-orange-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-white/5 bg-[#0a0a0a]/80 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-4">
            <div>
              <h4 className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-2">Objectives</h4>
              <ul className="space-y-1.5">
                {quest.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="mt-1 w-1 h-1 rounded-full bg-gray-800 shrink-0" />
                    <span className={`text-[9px] leading-tight ${isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                      {obj.description} {obj.count ? `(${obj.count})` : ''}
                      {obj.foundInRaid && <span className="ml-1 text-[6px] text-orange-500 font-black border border-orange-500/20 px-0.5 rounded">FIR</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <div className="text-[8px] font-mono text-orange-500/80 font-bold">+{quest.experience?.toLocaleString()} XP</div>
              {quest.wikiLink && (
                <a href={quest.wikiLink} target="_blank" rel="noopener noreferrer" className="text-[7px] text-gray-500 hover:text-white font-black uppercase underline decoration-orange-500/30">Intelligence Link ↗</a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};