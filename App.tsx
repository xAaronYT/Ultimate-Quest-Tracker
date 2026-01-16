
import React, { useState, useMemo, useEffect } from 'react';
import { Quest } from './types';
import { TRADERS, COLLECTOR_ITEMS, TRADER_COLORS } from './constants';
import { QuestCard } from './components/QuestCard';
import { normalizeAssetName } from './utils';

type FilterMode = 'Active' | 'Kappa' | 'Lightkeeper' | 'All';

const App: React.FC = () => {
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set());
  const [foundCollectorItems, setFoundCollectorItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrader, setActiveTrader] = useState<string>('All');
  const [filterMode, setFilterMode] = useState<FilterMode>('Active');
  const [showWipeSafeguard, setShowWipeSafeguard] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('./quests_updated.json');
        if (!response.ok) throw new Error("Intel transmission interrupted");
        const data = await response.json();
        setAllQuests(data);
      } catch (error) {
        console.error("CRITICAL SYSTEM FAILURE:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };
    fetchData();

    const savedQuests = localStorage.getItem('eft_architect_quests');
    const savedItems = localStorage.getItem('eft_architect_stash');
    if (savedQuests) setCompletedQuestIds(new Set(JSON.parse(savedQuests)));
    if (savedItems) setFoundCollectorItems(new Set(JSON.parse(savedItems)));
  }, []);

  useEffect(() => {
    if (allQuests.length > 0) {
      localStorage.setItem('eft_architect_quests', JSON.stringify(Array.from(completedQuestIds)));
      localStorage.setItem('eft_architect_stash', JSON.stringify(Array.from(foundCollectorItems)));
    }
  }, [completedQuestIds, foundCollectorItems, allQuests]);

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

  const handleGlobalWipe = () => {
    setCompletedQuestIds(new Set());
    setFoundCollectorItems(new Set());
    setShowWipeSafeguard(false);
  };

  const questNameToIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    allQuests.forEach(q => { map[q.name] = q.id; });
    return map;
  }, [allQuests]);

  const checkAvailability = (quest: Quest) => {
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
      if (filterMode === 'Active') {
        matchesFilterMode = !isDone;
      } else if (filterMode === 'Kappa') {
        matchesFilterMode = q.kappaRequired && !isDone;
      } else if (filterMode === 'Lightkeeper') {
        matchesFilterMode = q.lightkeeperRequired && !isDone;
      } else if (filterMode === 'All') {
        matchesFilterMode = true;
      }

      return matchesSearch && matchesTrader && matchesFilterMode;
    });
  }, [allQuests, searchQuery, activeTrader, filterMode, completedQuestIds]);

  const traderStats = useMemo(() => {
    if (activeTrader === 'All') return null;
    const quests = allQuests.filter(q => q.trader.name === activeTrader);
    const completed = quests.filter(q => completedQuestIds.has(q.id)).length;
    const unlocked = quests.filter(q => !completedQuestIds.has(q.id) && checkAvailability(q)).length;
    const locked = quests.length - completed - unlocked;
    return { total: quests.length, completed, unlocked, locked };
  }, [allQuests, activeTrader, completedQuestIds, questNameToIdMap]);

  const stats = useMemo(() => {
    const kappaQuests = allQuests.filter(q => q.kappaRequired);
    const lkQuests = allQuests.filter(q => q.lightkeeperRequired);
    const calc = (list: Quest[]) => {
      if (list.length === 0) return { count: 0, total: 0, pct: 0 };
      const count = list.filter(q => completedQuestIds.has(q.id)).length;
      return { count, total: list.length, pct: Math.round((count / list.length) * 100) };
    };
    return {
      overall: calc(allQuests),
      kappa: calc(kappaQuests),
      lightkeeper: calc(lkQuests)
    };
  }, [allQuests, completedQuestIds]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#080808] flex-col gap-8">
        <div className="w-16 h-16 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black tracking-[0.8em] text-orange-500 uppercase animate-pulse">Syncing Intel</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0c0c] text-gray-200 selection:bg-orange-500/30">
      {/* WIPE SAFEGUARD MODAL */}
      {showWipeSafeguard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-md w-full p-10 bg-[#121212] border border-red-900/30 rounded-2xl shadow-2xl text-center space-y-8">
            <div className="w-20 h-20 bg-red-950/30 border border-red-500/50 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-black uppercase tracking-tighter text-white">Full System Reset?</h4>
              <p className="text-xs text-gray-500 mt-3 font-medium leading-relaxed">
                Warning: This action will purge all mission data, stash records, and trader standing. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowWipeSafeguard(false)}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded transition-all"
              >
                Abort
              </button>
              <button 
                onClick={handleGlobalWipe}
                className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR: NAVIGATION */}
      <nav className="w-64 flex-shrink-0 border-r border-white/5 bg-[#0a0a0a] flex flex-col z-30 shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-gradient-to-b from-[#121212] to-[#0a0a0a]">
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">EFT-Architect</h1>
          <p className="text-[8px] text-orange-500 font-bold uppercase tracking-widest mt-2 opacity-70">
            Quest & Item Tracking
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <button
            onClick={() => setActiveTrader('All')}
            className={`w-full flex items-center gap-4 px-6 py-4 transition-all border-l-4 ${
              activeTrader === 'All' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'border-transparent text-gray-600 hover:text-gray-300'
            }`}
          >
            <div className="w-8 h-8 rounded flex items-center justify-center bg-white/5 border border-white/5 shrink-0">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h.252a1.5 1.5 0 011.06.44l1.192 1.192a1.5 1.5 0 001.06.44h.431A2 2 0 0022 14v-2a2 2 0 00-2-2h-1.252a1.5 1.5 0 01-1.06-.44l-1.192-1.192a1.5 1.5 0 00-1.06-.44H15a2 2 0 00-2-2V4.67a2 2 0 01.596-1.414l.404-.404A2 2 0 0012.586 2H10c-2.21 0-4 1.79-4 4v.5" />
               </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">All Quests</span>
          </button>
          
          <div className="h-px bg-white/5 my-2 mx-4" />
          
          {TRADERS.map((trader) => (
            <button
              key={trader}
              onClick={() => setActiveTrader(trader)}
              className={`w-full flex items-center gap-4 px-6 py-2.5 transition-all border-l-4 ${
                activeTrader === trader 
                ? `bg-white/5 ${TRADER_COLORS[trader] || 'border-gray-500'} text-white` 
                : 'border-transparent text-gray-500 hover:text-orange-400 hover:bg-white/5'
              }`}
            >
              <img 
                src={`assets/${normalizeAssetName(trader)}.png`} 
                alt=""
                className={`w-8 h-8 rounded object-cover border border-white/5 shrink-0 transition-all ${activeTrader === trader ? 'grayscale-0 border-white/20' : 'grayscale opacity-50'}`}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <span className="text-[10px] font-black uppercase tracking-widest">{trader}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0c0c0c] relative">
        <header className="px-8 py-6 border-b border-white/5 flex flex-col xl:flex-row justify-between items-center gap-6 bg-[#0f0f0f]/95 backdrop-blur-2xl z-20 sticky top-0 shadow-lg">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                {activeTrader === 'All' ? 'All Quests' : activeTrader}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                  <span className="text-orange-500">{filteredQuests.length}</span> Visible
                </p>
                {traderStats && (
                  <>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                      <span className="text-green-500">{traderStats.completed}</span> Completed
                    </p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                      <span className="text-blue-500">{traderStats.unlocked}</span> Unlocked
                    </p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                      <span className="text-red-900">{traderStats.locked}</span> Locked
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-center">
            <div className="relative w-full xl:w-64">
              <input 
                type="text" 
                placeholder="Search Intel..."
                className="bg-[#141414] border border-white/10 rounded-lg px-10 py-2.5 text-xs focus:outline-none focus:border-orange-500/40 transition-all placeholder:text-gray-700 w-full font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="absolute left-3.5 top-3.5 w-3 h-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex bg-black p-1 rounded-lg border border-white/5 shrink-0 overflow-x-auto no-scrollbar">
              {(['Active', 'Kappa', 'Lightkeeper', 'All'] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                    filterMode === mode ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-600 hover:text-orange-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowWipeSafeguard(true)}
              className="p-2.5 rounded-lg border border-white/5 hover:border-red-900/50 hover:bg-red-950/20 text-gray-600 hover:text-red-500 transition-all group shrink-0"
              title="Wipe All Progress"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-48">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredQuests.map(quest => (
              <QuestCard 
                key={quest.id}
                quest={quest}
                isCompleted={completedQuestIds.has(quest.id)}
                isAvailable={checkAvailability(quest)}
                onToggle={toggleQuest}
              />
            ))}
          </div>
        </div>

        {/* PROGRESS FOOTER HUD */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0c0c0c]/90 border-t border-white/5 backdrop-blur-xl z-20">
          <div className="max-w-6xl mx-auto flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ProgressBar 
                label="All Quests" 
                value={`${stats.overall.count}/${stats.overall.total}`} 
                pct={stats.overall.pct} 
                color="bg-orange-600" 
              />
              <ProgressBar 
                label="Kappa" 
                value={`${stats.kappa.pct}%`} 
                pct={stats.kappa.pct} 
                color="bg-[#fff000]" 
                labelColor="text-[#fff000]"
              />
              <ProgressBar 
                label="Lightkeeper" 
                value={`${stats.lightkeeper.pct}%`} 
                pct={stats.lightkeeper.pct} 
                color="bg-blue-600" 
                labelColor="text-blue-500"
              />
            </div>
            
            <div className="flex justify-center border-t border-white/[0.03] pt-2">
               <p className="text-[8px] text-gray-700 font-bold uppercase tracking-[0.15em] opacity-80 hover:opacity-100 transition-opacity">
                  Enjoying EFT-Architect? <a href="https://cash.app/$xajcinc" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-500 transition-colors">Donate</a> to support system uptime.
               </p>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: COLLECTOR ITEMS */}
      <aside className="hidden lg:flex w-[380px] flex-shrink-0 border-l border-white/5 bg-[#0a0a0a] flex flex-col z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-[#111] to-[#0a0a0a]">
          <h3 className="text-sm font-black text-orange-500 uppercase tracking-[0.3em] italic">Collector Items</h3>
          <p className="text-[8px] text-gray-600 font-bold uppercase mt-1 tracking-widest">Stash Inventory Status</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="grid grid-cols-5 gap-1.5">
            {COLLECTOR_ITEMS.map((item) => {
              const isFound = foundCollectorItems.has(item);
              const assetName = normalizeAssetName(item);
              
              return (
                <button
                  key={item}
                  onClick={() => toggleCollectorItem(item)}
                  className={`aspect-square rounded border transition-all duration-500 flex items-center justify-center relative group overflow-hidden ${
                    isFound 
                    ? 'bg-orange-500/10 border-orange-500/40 shadow-inner' 
                    : 'bg-[#0f0f0f] border-white/5 opacity-30 hover:opacity-100 hover:border-orange-500/20'
                  }`}
                >
                  <img 
                    src={`assets/items/${assetName}.png`} 
                    alt=""
                    className={`w-[85%] h-[85%] object-contain transition-all duration-500 ${isFound ? 'scale-110 drop-shadow-[0_0_5px_#f97316]' : 'grayscale brightness-50 scale-90'}`}
                    onError={(e) => {
                       e.currentTarget.style.display = 'none';
                       const parent = e.currentTarget.parentElement;
                       if (parent && !parent.querySelector('.fallback')) {
                         const span = document.createElement('span');
                         span.className = 'fallback text-[7px] font-black text-gray-800 uppercase text-center p-1 leading-none';
                         span.innerText = item.split(' ').map(w => w[0]).join('');
                         parent.appendChild(span);
                       }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center pointer-events-none">
                    <span className="text-[7px] font-black text-orange-500 uppercase leading-tight">{item}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-6 bg-white/[0.02] rounded-xl border border-white/5 relative overflow-hidden">
            <div className="flex justify-between items-end text-[9px] font-black uppercase mb-3 tracking-widest">
              <span className="text-gray-600">STASH DELTA</span>
              <span className="text-orange-500 text-lg font-mono">{foundCollectorItems.size}<span className="text-gray-700 text-sm mx-1">/</span>{COLLECTOR_ITEMS.length}</span>
            </div>
            <div className="w-full bg-black h-1.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-orange-500 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_#f97316]" 
                style={{ width: `${(foundCollectorItems.size / COLLECTOR_ITEMS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

const ProgressBar: React.FC<{ label: string, value: string, pct: number, color: string, labelColor?: string }> = ({ label, value, pct, color, labelColor = "text-gray-600" }) => (
  <div className="flex-1 min-w-[120px]">
    <div className="flex justify-between text-[9px] font-black uppercase mb-1.5 tracking-widest leading-none">
      <span className={labelColor}>{label}</span>
      <span className="text-white/80 font-mono text-[8px]">{value}</span>
    </div>
    <div className="w-full bg-white/[0.03] h-1 rounded-full overflow-hidden border border-white/5">
      <div 
        className={`${color} h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_4px_rgba(0,0,0,0.5)]`} 
        style={{ width: `${pct}%` }} 
      />
    </div>
  </div>
);

export default App;
