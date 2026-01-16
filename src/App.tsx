import React, { useState, useMemo, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Quest } from './types';
import { TRADERS, COLLECTOR_ITEMS } from './constants';
import { QuestCard } from './components/QuestCard';
import { BugReportModal } from './components/BugReportModal';
import { normalizeAssetName } from './utils';

type FilterMode = 'Active' | 'Kappa' | 'Lightkeeper' | 'Show All';
type MobileView = 'Quests' | 'Stash';

const App: React.FC = () => {
    const [allQuests, setAllQuests] = useState<Quest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set());
    const [foundCollectorItems, setFoundCollectorItems] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTrader, setActiveTrader] = useState<string>('All');
    const [filterMode, setFilterMode] = useState<FilterMode>('Active');
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    const [mobileView, setMobileView] = useState<MobileView>('Quests');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/quests_updated.json');
                const data = await response.json();
                setAllQuests(data);
            } catch (err) {
                console.error("Failed to load quest data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();

        const savedQuests = localStorage.getItem('uqt_progress');
        const savedItems = localStorage.getItem('uqt_stash');
        if (savedQuests) setCompletedQuestIds(new Set(JSON.parse(savedQuests)));
        if (savedItems) setFoundCollectorItems(new Set(JSON.parse(savedItems)));
    }, []);

    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem('uqt_progress', JSON.stringify(Array.from(completedQuestIds)));
            localStorage.setItem('uqt_stash', JSON.stringify(Array.from(foundCollectorItems)));
        }
    }, [completedQuestIds, foundCollectorItems, isLoading]);

    const toggleQuest = (id: string) => {
        setCompletedQuestIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleCollectorItem = (item: string) => {
        setFoundCollectorItems(prev => {
            const next = new Set(prev);
            next.has(item) ? next.delete(item) : next.add(item);
            return next;
        });
    };

    const handleReset = () => {
        setCompletedQuestIds(new Set());
        setFoundCollectorItems(new Set());
        localStorage.removeItem('uqt_progress');
        localStorage.removeItem('uqt_stash');
        setShowResetConfirm(false);
    };

    const questNameToIdMap = useMemo(() => {
        const map: Record<string, string> = {};
        allQuests.forEach(q => { map[q.name] = q.id; });
        return map;
    }, [allQuests]);

    const checkAvailability = (quest: Quest) => {
        if (quest.name === "New Beginnings") {
            const collectorId = questNameToIdMap["Collector"];
            if (!collectorId || !completedQuestIds.has(collectorId)) return false;
        }
        if (!quest.taskRequirements || quest.taskRequirements.length === 0) return true;
        return quest.taskRequirements.every(req => {
            const targetId = questNameToIdMap[req.task.name];
            return targetId ? completedQuestIds.has(targetId) : true;
        });
    };

    const filteredQuests = useMemo(() => {
        return allQuests.filter(q => {
            const isDone = completedQuestIds.has(q.id);
            const matchesSearch = q.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTrader = activeTrader === 'All' || q.trader.name === activeTrader;
            let matchesFilterMode = true;
            if (filterMode === 'Active') matchesFilterMode = !isDone;
            else if (filterMode === 'Kappa') matchesFilterMode = q.kappaRequired;
            else if (filterMode === 'Lightkeeper') matchesFilterMode = q.lightkeeperRequired;
            return matchesSearch && matchesTrader && matchesFilterMode;
        }).sort((a, b) => {
            const aDone = completedQuestIds.has(a.id);
            const bDone = completedQuestIds.has(b.id);
            const aAvailable = checkAvailability(a);
            const bAvailable = checkAvailability(b);
            const getWeight = (d: boolean, av: boolean) => (!d && av ? 0 : !d && !av ? 1 : 2);
            return getWeight(aDone, aAvailable) - getWeight(bDone, bAvailable);
        });
    }, [allQuests, searchQuery, activeTrader, filterMode, completedQuestIds, questNameToIdMap]);

    const stats = useMemo(() => {
        const calc = (list: Quest[]) => {
            if (list.length === 0) return { count: 0, total: 0, pct: 0 };
            const count = list.filter(q => completedQuestIds.has(q.id)).length;
            return { count, total: list.length, pct: Math.round((count / list.length) * 100) };
        };
        return {
            overall: calc(allQuests),
            kappa: calc(allQuests.filter(q => q.kappaRequired)),
            lightkeeper: calc(allQuests.filter(q => q.lightkeeperRequired))
        };
    }, [allQuests, completedQuestIds]);

    if (isLoading) return <div className="h-screen bg-[#080808] flex items-center justify-center text-orange-500 font-black tracking-[1em] animate-pulse uppercase">Syncing Intel...</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-[#0c0c0c] text-gray-200 font-inter text-[13px]">
            <Analytics />
            <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />

            <nav className="w-[70px] lg:w-64 flex-shrink-0 border-r border-white/5 bg-[#0a0a0a] flex flex-col z-30">
                <div className="p-4 lg:p-6 border-b border-white/5">
                    <h1 className="text-sm lg:text-lg font-black tracking-tighter text-white uppercase italic leading-none">
                        <span className="lg:hidden">UQT</span>
                        <span className="hidden lg:inline">Ultimate Quest Tracker</span>
                    </h1>
                </div>

                <div className="lg:hidden flex flex-col items-center py-4 gap-4 border-b border-white/5">
                    <button onClick={() => setMobileView('Quests')} className={`p-2 rounded-lg transition-all ${mobileView === 'Quests' ? 'text-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'text-gray-600'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </button>
                    <button onClick={() => setMobileView('Stash')} className={`p-2 rounded-lg transition-all ${mobileView === 'Stash' ? 'text-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'text-gray-600'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </button>
                    {/* Mobile Reset Action */}
                    <button
                        onClick={() => showResetConfirm ? handleReset() : setShowResetConfirm(true)}
                        className={`mt-4 p-2 rounded-lg transition-all ${showResetConfirm ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-red-900/40'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <button onClick={() => { setActiveTrader('All'); setMobileView('Quests'); }} className={`w-full flex items-center justify-center lg:justify-start lg:px-6 py-4 border-l-4 transition-all ${activeTrader === 'All' ? 'bg-orange-500/5 border-orange-500 text-orange-500' : 'border-transparent text-gray-600'}`}>
                        <span className="text-[10px] font-black uppercase lg:block hidden tracking-widest">Global Operations</span>
                        <span className="lg:hidden font-black text-[10px]">ALL</span>
                    </button>
                    {TRADERS.map((t) => (
                        <button key={t} onClick={() => { setActiveTrader(t); setMobileView('Quests'); }} className={`w-full flex items-center justify-center lg:justify-start lg:gap-4 lg:px-6 py-3 border-l-4 transition-all ${activeTrader === t ? 'bg-white/5 border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-orange-400'}`}>
                            <div className="w-7 h-7 rounded bg-black/40 border border-white/5 overflow-hidden flex-shrink-0">
                                <img src={`/assets/${normalizeAssetName(t)}.png`} className="w-full h-full object-cover" alt={t} />
                            </div>
                            <span className="text-[10px] font-black uppercase hidden lg:block tracking-widest">{t}</span>
                        </button>
                    ))}
                </div>

                <div className="p-4 bg-black/60 border-t border-white/5 space-y-2 hidden lg:block">
                    {!showResetConfirm ? (
                        <button onClick={() => setShowResetConfirm(true)} className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-red-900/40 hover:text-red-600 transition-colors">Wipe Progress</button>
                    ) : (
                        <div className="flex gap-1">
                            <button onClick={handleReset} className="flex-1 py-2 bg-red-600 text-black text-[9px] font-black uppercase tracking-widest rounded-lg">Confirm</button>
                            <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2 bg-white/5 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Cancel</button>
                        </div>
                    )}
                    <button onClick={() => setIsBugModalOpen(true)} className="w-full py-2 bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">Report Bug</button>
                    <a href="https://cash.app/$xajcinc" target="_blank" rel="noreferrer" className="px-4 py-2 bg-orange-500 text-black text-[8px] font-black uppercase tracking-widest rounded-lg text-center block">Donate</a>
                </div>
            </nav>

            <main className="flex-1 flex flex-col relative min-w-0 bg-[#0c0c0c]">
                <header className="px-4 lg:px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center bg-[#0f0f0f] z-20 sticky top-0">
                    <h2 className="text-xl lg:text-3xl font-black text-white italic uppercase">{mobileView === 'Stash' ? 'The Stash' : activeTrader}</h2>
                    <div className="flex gap-4 items-center w-full sm:w-auto mt-4 sm:mt-0">
                        <input
                            type="text"
                            placeholder="Search Intel..."
                            className="flex-1 sm:w-48 bg-[#141414] border border-white/10 rounded-lg px-4 py-2 text-xs font-bold outline-none focus:border-orange-500/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="hidden md:flex bg-black p-1 rounded-lg border border-white/5">
                            {(['Active', 'Kappa', 'Lightkeeper', 'Show All'] as FilterMode[]).map((m) => (
                                <button key={m} onClick={() => setFilterMode(m)} className={`px-3 py-1.5 rounded text-[8px] font-black uppercase transition-all ${filterMode === m ? 'bg-orange-500 text-black' : 'text-gray-600 hover:text-gray-300'}`}>{m}</button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-[280px] md:pb-[180px] custom-scrollbar">
                    {mobileView === 'Quests' ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 items-start">
                            {filteredQuests.map(q => (
                                <QuestCard key={q.id} quest={q} isCompleted={completedQuestIds.has(q.id)} isAvailable={checkAvailability(q)} onToggle={toggleQuest} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                            {COLLECTOR_ITEMS.map((item) => (
                                <StashItem key={item} item={item} isFound={foundCollectorItems.has(item)} onToggle={toggleCollectorItem} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-[#0c0c0c]/95 backdrop-blur-md border-t border-white/10 p-4 lg:p-6 z-40">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-12">
                        <ProgressBar label="Overall" value={`${stats.overall.pct}%`} pct={stats.overall.pct} color="bg-orange-600" />
                        <ProgressBar label="Kappa" value={`${stats.kappa.pct}%`} pct={stats.kappa.pct} color="bg-[#fff000]" labelColor="text-[#fff000]" />
                        <ProgressBar label="Lightkeeper" value={`${stats.lightkeeper.pct}%`} pct={stats.lightkeeper.pct} color="bg-blue-600" labelColor="text-blue-500" />
                    </div>
                </div>
            </main>

            <aside className="hidden lg:flex w-72 2xl:w-80 flex-shrink-0 border-l border-white/5 bg-[#0a0a0a] flex flex-col z-30">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest italic">The Stash</h3>
                    <span className="text-[9px] font-mono text-gray-600">{foundCollectorItems.size} / {COLLECTOR_ITEMS.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-4 gap-2">
                        {COLLECTOR_ITEMS.map((item) => (
                            <StashItem key={item} item={item} isFound={foundCollectorItems.has(item)} onToggle={toggleCollectorItem} />
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
};

const StashItem: React.FC<{ item: string, isFound: boolean, onToggle: (item: string) => void }> = ({ item, isFound, onToggle }) => {
    const [imgErr, setImgErr] = useState(false);
    const assetName = normalizeAssetName(item);
    return (
        <button onClick={() => onToggle(item)} className={`relative aspect-square rounded-md border flex items-center justify-center overflow-hidden transition-all duration-200 ${isFound ? 'bg-orange-500/20 border-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.2)]' : 'bg-zinc-900/50 border-white/10 opacity-60 hover:opacity-100'}`}>
            {!imgErr ? (
                <img src={`/assets/items/${assetName}.png`} className={`w-[85%] h-[85%] object-contain transition-all ${!isFound ? 'brightness-50 grayscale' : 'brightness-110'}`} onError={() => setImgErr(true)} alt={item} />
            ) : (
                <span className="text-[6px] text-gray-400 uppercase p-1 text-center font-black leading-tight break-all">{item}</span>
            )}
        </button>
    );
};

const ProgressBar: React.FC<{ label: string, value: string, pct: number, color: string, labelColor?: string, className?: string }> = ({ label, value, pct, color, labelColor = "text-gray-600", className = "" }) => (
    <div className={`flex-1 space-y-1.5 ${className}`}>
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
            <span className={labelColor}>{label}</span>
            <span className="text-white font-mono">{value}</span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className={`${color} h-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
        </div>
    </div>
);

export default App;