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

    // Pulling directly from the JSON's reward structure
    const rewards = quest.finishRewards;

    return (
        <div className={`relative flex flex-col transition-all duration-200 rounded-xl border overflow-hidden self-start w-full
      ${isCompleted
                ? 'bg-black/40 border-green-900/30'
                : !isAvailable
                    ? 'bg-[#0a0a0a] border-white/5 opacity-60 grayscale'
                    : 'bg-[#111111] border-white/10 shadow-lg hover:border-white/20'
            }
    `}>
            <div className="flex h-20 md:h-24">
                <div
                    onClick={() => onToggle(quest.id)}
                    className="w-[75%] p-3 md:p-4 flex gap-3 md:gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors border-r border-white/5"
                >
                    <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-lg bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center p-1">
                        <img
                            src={`/assets/${normalizeAssetName(quest.trader.name)}.png`}
                            className="w-full h-full object-contain"
                            alt={quest.trader.name}
                        />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                        <h3 className="font-black text-[11px] md:text-[12px] uppercase tracking-tighter text-gray-100 truncate italic leading-tight">
                            {quest.name}
                        </h3>
                        <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                            {quest.trader.name}
                        </p>
                    </div>
                </div>

                <div className="w-[25%] flex items-center justify-between px-2 md:px-3 gap-2">
                    <div className="flex gap-1">
                        {quest.kappaRequired && <span className="text-[12px] md:text-[14px] font-black text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">K</span>}
                        {quest.lightkeeperRequired && <span className="text-[12px] md:text-[14px] font-black text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">L</span>}
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-1.5 md:p-2 rounded-lg transition-colors ${isExpanded ? 'bg-orange-600/20 text-orange-500' : 'hover:bg-white/5 text-gray-500'}`}
                    >
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 bg-black/60 border-t border-white/5 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2.5">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 border-l-2 border-orange-500 ml-1">Mission Parameters</span>
                        {quest.objectives?.map((obj) => (
                            <div key={obj.id} className="flex items-start gap-3 bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)] flex-shrink-0" />
                                <p className="text-[11px] font-bold text-gray-200 leading-snug">{obj.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* REWARDS FROM JSON finishRewards */}
                    <div className="space-y-2.5">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 border-l-2 border-green-500 ml-1">Intel Rewards</span>
                        <div className="flex flex-wrap gap-2">
                            {rewards?.experience && (
                                <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-[10px] font-black text-green-400">
                                    +{rewards.experience} XP
                                </div>
                            )}
                            {rewards?.items?.map((r: any, i: number) => (
                                <div key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-black text-gray-300">
                                    {r.count}x {r.item.name}
                                </div>
                            ))}
                            {rewards?.traderStanding?.map((s: any, i: number) => (
                                <div key={i} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-black text-blue-400">
                                    {s.standing > 0 ? '+' : ''}{s.standing} {s.trader.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isCompleted && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-950/10 pointer-events-none">
                    <div className="bg-green-600/20 border border-green-500/40 px-4 py-1.5 rounded-full backdrop-blur-md">
                        <span className="text-[11px] font-black text-green-400 uppercase tracking-[0.2em] italic">Quest Success</span>
                    </div>
                </div>
            )}
        </div>
    );
};