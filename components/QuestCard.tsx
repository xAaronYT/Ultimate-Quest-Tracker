
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
          ? 'bg-[#0a0a0a] border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
          : isLocked 
            ? 'border-red-900/30 bg-[#0d0a0a]' 
            : 'border-white/5 bg-[#121212] hover:border-white/10 hover:bg-[#161616] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
      } border-l-4 ${TRADER_COLORS[quest.trader.name] || 'border-gray-800'}`}
    >
      {/* LOCKED OVERLAY */}
      {isLocked && (
        <div className="absolute inset-0 z-10 bg-black/40 pointer-events-none flex items-center justify-center">
          <div className="bg-red-600 text-white text-[10px] font-[900] px-3 py-1 rounded shadow-[0_0_15px_rgba(220,38,38,0.6)] uppercase tracking-[0.2em] border border-red-400/50 -rotate-12 translate-x-12">
            Locked
          </div>
        </div>
      )}

      {/* COMPLETED OVERLAY */}
      {isCompleted && (
        <div className="absolute inset-0 z-10 bg-green-500/5 pointer-events-none flex items-center justify-center">
          <div className="bg-green-600 text-black text-[10px] font-[900] px-3 py-1 rounded shadow-[0_0_15px_rgba(34,197,94,0.4)] uppercase tracking-[0.2em] border border-green-400/50 -rotate-12 translate-x-12">
            Completed
          </div>
        </div>
      )}

      <div className="flex h-16 min-h-[4rem]">
        {/* LEFT AREA: COMPLETION TOGGLE */}
        <div 
          className={`flex-1 p-3 flex items-center gap-3 transition-colors min-w-0 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.02]'} border-r border-white/5`}
          onClick={() => !isLocked && onToggle(quest.id)}
        >
          <div className="relative shrink-0">
            <img 
              src={`assets/${normalizeAssetName(quest.trader.name)}.png`} 
              alt=""
              className={`w-9 h-9 rounded-md object-cover border border-white/10 ${isCompleted ? 'grayscale-0 opacity-40' : isLocked ? 'grayscale opacity-30' : ''}`}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            {isCompleted && (
              <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-black p-0.5 rounded-full shadow-lg border border-black/20 z-20">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={6} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {isLocked && (
              <div className="absolute -top-1.5 -right-1.5 bg-red-600 text-white p-0.5 rounded shadow-lg border border-red-400/30 z-20">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className={`text-[11px] font-black tracking-tight leading-tight truncate uppercase ${isCompleted ? 'text-green-500/70 line-through' : isLocked ? 'text-gray-500' : 'text-gray-200 group-hover/card:text-orange-400 transition-colors'}`}>
              {quest.name}
            </h3>
            <div className="flex gap-2 mt-1 items-center">
              <span className="text-[7px] text-gray-500 font-bold uppercase tracking-tighter shrink-0">{quest.trader.name}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-800 shrink-0" />
              <span className={`text-[7px] font-bold tracking-tighter shrink-0 ${isCompleted ? 'text-green-800' : isLocked ? 'text-red-900' : 'text-orange-500'}`}>L.{quest.minPlayerLevel}</span>
            </div>
          </div>
        </div>

        {/* RIGHT AREA: PROFOUND ICONS & EXPAND */}
        <div className="w-20 flex flex-col shrink-0">
          <div className="flex-1 flex items-center justify-center gap-1 border-b border-white/5 bg-black/40">
            {quest.kappaRequired && (
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center text-[11px] text-black font-[1000] transition-all ${isCompleted ? 'bg-green-600 shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'bg-[#fff000] shadow-[0_0_12px_rgba(255,240,0,0.6)]'}`}
                title="KAPPA REQUIRED"
              >K</div>
            )}
            {quest.lightkeeperRequired && (
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center text-[11px] text-white font-[1000] transition-all ${isCompleted ? 'bg-green-700 shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.5)]'}`}
                title="LIGHTKEEPER REQUIRED"
              >L</div>
            )}
          </div>
          <button 
            className={`flex-1 flex items-center justify-center transition-all duration-300 hover:bg-white/5 ${isExpanded ? 'bg-white/5' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg className={`w-4 h-4 text-gray-500 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-orange-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-4 border-t border-white/5 bg-[#0a0a0a]/50 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
          <div className="space-y-4">
            <div>
              <h4 className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="w-1 h-1 bg-gray-700" /> Objectives
              </h4>
              <ul className="space-y-1.5">
                {quest.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2 group/obj">
                    <div className="mt-1 w-1 h-1 rounded-full bg-gray-800 flex-shrink-0 group-hover/obj:bg-orange-500 transition-colors" />
                    <span className={`text-[9px] leading-tight transition-colors ${isCompleted ? 'text-green-900/60' : 'text-gray-400 group-hover/obj:text-gray-200'}`}>
                      {obj.description} {obj.count ? `(${obj.count})` : ''}
                      {obj.foundInRaid && <span className="ml-1 text-[7px] text-orange-500/80 font-black border border-orange-500/20 px-0.5 rounded">FiR</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              <div>
                <h4 className="text-[7px] font-black text-gray-700 uppercase mb-1">Reward</h4>
                <div className="text-orange-400 font-mono text-[8px] font-bold">+{quest.experience?.toLocaleString()} XP</div>
              </div>
              <div className="text-right flex flex-col items-end">
                {quest.wikiLink && (
                  <a 
                    href={quest.wikiLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[7px] text-orange-500 hover:text-white transition-colors font-black uppercase tracking-tighter"
                  >
                    WIKI INTEL ↗
                  </a>
                )}
                <span className="text-[6px] text-gray-800 font-mono mt-1">ID_{quest.id.substring(0, 5)}</span>
              </div>
            </div>
            
            {quest.taskRequirements.length > 0 && (
               <div className="pt-2">
                <h4 className="text-[7px] font-black text-gray-700 uppercase mb-1">Prerequisites</h4>
                <div className="flex flex-wrap gap-1">
                  {quest.taskRequirements.map((req, i) => (
                    <span key={i} className="text-[6px] bg-white/[0.03] px-1.5 py-0.5 rounded text-gray-500 border border-white/5 truncate max-w-full hover:text-orange-300 transition-colors">
                      {req.task.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
