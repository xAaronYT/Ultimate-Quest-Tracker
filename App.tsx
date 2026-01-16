import React, { useState, useMemo, useEffect } from 'react';
import { Quest } from './types';
import { TRADERS, COLLECTOR_ITEMS, TRADER_COLORS } from './constants';
import { QuestCard } from './components/QuestCard';
import { normalizeAssetName } from './utils';

type FilterMode = 'Active' | 'Kappa' | 'Lightkeeper' | 'All';

const App: React.FC = () => {
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        
        if (!response.ok) {
           throw new Error(`FILE_NOT_FOUND: ${response.status}. Deployment Check: Is quests_updated.json in the project root?`);
        }
        const data = await response.json();
        setAllQuests(data);
        setError(null);
      } catch (err: any) {
        console.error("DATA_SYNC_ERROR:", err.message);
        setError(err.message);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };
    fetchData();

    const savedQuests = localStorage.getItem('eft_architect_quests');
    const savedItems = localStorage.getItem('eft_architect_stash');
    if (savedQuests) {
      try { setCompletedQuestIds(new Set(JSON.parse(savedQuests))); } catch (e) { console.error("Corrupt progress reset."); }
    }
    if (savedItems) {
      try { setFoundCollectorItems(new Set(JSON.parse(savedItems))); } catch (e) { console.error("Corrupt stash reset."); }
    }
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
    localStorage.clear();
    window.location.reload();
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
      }

      return matchesSearch && matchesTrader && matchesFilterMode;
    });
  }, [allQuests, searchQuery, activeTrader, filterMode, completedQuestIds]);

  const stats = useMemo(() => {
    const kappaQuests = allQuests.filter(q => q.kappaRequired);
    const lkQuests = allQuests.filter(q => q.lightkeeperRequired);
    const calculateStats = (list: Quest[]) => {
      if (list.length === 0) return { count: 0, total: 0, pct: 0 };
      const count = list.filter(q => completedQuestIds.has(q.id)).length;
      return { count, total: list.length, pct: Math.round((count / list.length) * 100) };
    };
    return {
      overall: calculateStats(allQuests),
      kappa: calculateStats(kappaQuests),
      lightkeeper: calculateStats(lkQuests)
    };
  }, [allQuests, completedQuestIds]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#080808] flex-col gap-8">
        <div className="relative">
            <div className="w-16 h-16 border-2 border-orange-500/10 border-t-orange-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border border-orange-500/20 rounded-full animate-ping" />
            </div>
        </div>
        <p className="text-[10px] font-black tracking-[1.2em] text-orange-500 uppercase animate-pulse">Syncing Intel</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#080808] p-10">
        <div className="max-w-md w-full border border-red-900/40 bg-red-950/10 p-10 rounded-2xl text-center space-y-6 shadow-2xl">
           <h2 className="text-white font-black uppercase tracking-[0.2em] text-lg">Operational Failure</h2>
           <p className="text-xs text-gray-500 font-mono leading-relaxed">{error}</p>
           <button onClick={() => window.location.reload()} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Re-initialize</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0c0c] text-gray-200 selection:bg-orange-500/30 font-inter">
      {showWipeSafeguard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <div className="max-w-sm w-full p-8 bg-[#121212] border border-red-900/30 rounded-2xl text-center space-y-6 shadow-2xl">
            <h4 className="text-xl font-black uppercase text-white italic">Confirm System Wipe</h4>
            <p className="text-xs text-gray-500 tracking-wider">Erasing local progress database. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowWipeSafeguard(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg">Cancel</button>
              <button onClick={handleGlobalWipe} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">Confirm Wipe</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <nav className="w-64 flex-shrink-0 border-r border-white/5 bg-[#0a0a0a] flex flex-col z-30">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-lg font-black tracking-tighter text-white uppercase italic leading-tight">EFT-Architect</h1>
          <p className="text-[8px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-2 opacity-80">v1.2 Production</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <button
            onClick={() => setActiveTrader('All')}
            className={`w-full flex items-center gap-4 px-6 py-4 transition-all border-l-4 ${
              activeTrader === 'All' ? 'bg-orange-500/5 border-orange-500 text-orange-500' : 'border-transparent text-gray-600 hover:text-gray-300'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operations Hub</span>
          </button>
          
          <div className="px-6 py-3 text-[8px] font-black text-gray-800 uppercase tracking-widest">Traders</div>
          
          {TRADERS.map((trader) => (
            <button
              key={trader}
              onClick={() => setActiveTrader(trader)}
              className={`w-full flex items-center gap-4 px-6 py-3 transition-all border-l-4 ${
                activeTrader === trader 
                ? `bg-white/5 ${TRADER_COLORS[trader] || 'border-gray-500'} text-white` 
                : 'border-transparent text-gray-500 hover:text-orange-400 hover:bg-white/5'
              }`}
            >
              <div className="w-7 h-7 rounded bg-black/40 flex items-center justify-center border border-white/5 overflow-hidden">
                <img 
                  src={`assets/${normalizeAssetName(trader)}.png`} 
                  alt=""
                  className={`w-full h-full object-cover transition-all ${activeTrader === trader ? 'grayscale-0' : 'grayscale opacity-40'}`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.trader-fallback')) {
                      const span = document.createElement('span');
                      span.className = 'trader-fallback text-[9px] font-black text-orange-500';
                      span.innerText = trader[0];
                      parent.appendChild(span);
                    }
                  }}
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{trader}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 flex flex-col min-w-0 bg-[#0c0c0c] relative">
        <header className="px-8 py-6 border-b border-white/5 flex flex-col lg:flex-row justify-between items-center gap-6 bg-[#0f0f0f]/90 backdrop-blur-xl z-20 sticky top-0">
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
            {activeTrader === 'All' ? 'Operations' : activeTrader}
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
            <input 
              type="text" 
              placeholder="Search data..."
              className="bg-[#141414] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-orange-500/40 w-full lg:w-56 font-bold placeholder:text-gray-700 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="flex bg-black p-1 rounded-lg border border-white/5 shrink-0">
              {(['Active', 'Kappa', 'Lightkeeper', 'All'] as FilterMode[]).map((mode) => (mode !== 'All' || activeTrader !== 'All') && (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${
                    filterMode === mode ? 'bg-orange-500 text-black' : 'text-gray-600 hover:text-orange-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setShowWipeSafeguard(true)}
              className="p-2.5 rounded-lg border border-white/5 hover:border-red-900/50 text-gray-600 hover:text-red-500 transition-all"
              title="PURGE SYSTEM"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-[140px]">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
          {filteredQuests.length === 0 && (
            <div className="h-64 flex items-center justify-center text-gray-800 font-black uppercase tracking-[0.4em] text-[10px]">
              Empty Intel Response
            </div>
          )}
        </div>

        {/* PROGRESS HUD */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0c0c0c]/98 border-t border-white/5 backdrop-blur-2xl z-20">
          <div className="p-4 px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              <ProgressBar label="Overall" value={`${stats.overall.count}/${stats.overall.total}`} pct={stats.overall.pct} color="bg-orange-600" />
              <ProgressBar label="Kappa" value={`${stats.kappa.pct}%`} pct={stats.kappa.pct} color="bg-[#fff000]" labelColor="text-[#fff000]" />
              <ProgressBar label="Lightkeeper" value={`${stats.lightkeeper.pct}%`} pct={stats.lightkeeper.pct} color="bg-blue-600" labelColor="text-blue-500" />
            </div>
          </div>
          <div className="w-full border-t border-white/5 py-1 bg-black/40 flex justify-center items-center">
             <span className="text-[7px] font-black uppercase tracking-[0.3em] text-gray-700 italic">Encrypted Secure Link Established</span>
          </div>
        </div>
      </main>

      <aside className="hidden 2xl:flex w-80 flex-shrink-0 border-l border-white/5 bg-[#0a0a0a] flex flex-col z-30">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] italic">The Stash</h3>
          <span className="text-[8px] font-mono text-gray-800">REQD_{COLLECTOR_ITEMS.length}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-4 gap-2">
            {COLLECTOR_ITEMS.map((item) => {
              const isFound = foundCollectorItems.has(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleCollectorItem(item)}
                  className={`aspect-square rounded border transition-all flex items-center justify-center relative overflow-hidden group ${
                    isFound 
                      ? 'bg-orange-500/10 border-orange-500/40' 
                      : 'bg-[#0f0f0f] border-white/5 opacity-30 hover:opacity-100 hover:border-white/20'
                  }`}
                  title={item}
                >
                  <img 
                    src={`assets/items/${normalizeAssetName(item)}.png`} 
                    alt=""
                    className={`w-[80%] h-[80%] object-contain transition-transform group-hover:scale-110 ${isFound ? '' : 'grayscale'}`}
                    onError={(e) => {
                       e.currentTarget.style.display = 'none';
                       const parent = e.currentTarget.parentElement;
                       if (parent && !parent.querySelector('.item-fallback')) {
                         const span = document.createElement('span');
                         span.className = 'item-fallback text-[7px] font-black text-gray-700 text-center px-1 leading-tight uppercase';
                         span.innerText = item.split(' ').map(w => w[0]).join('').slice(0,3);
                         parent.appendChild(span);
                       }
                    }}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-8 p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
             <div className="flex justify-between items-end text-[9px] font-black uppercase text-gray-600 tracking-widest">
               <span>Stash Delta</span>
               <span className="text-orange-500 text-lg font-mono leading-none">{foundCollectorItems.size}</span>
             </div>
             <div className="w-full bg-black h-1 rounded-full overflow-hidden">
               <div className="bg-orange-500 h-full transition-all duration-700" style={{ width: `${(foundCollectorItems.size / COLLECTOR_ITEMS.length) * 100}%` }} />
             </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

const ProgressBar: React.FC<{ label: string, value: string, pct: number, color: string, labelColor?: string }> = ({ label, value, pct, color, labelColor = "text-gray-600" }) => (
  <div className="flex-1 space-y-2">
    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
      <span className={labelColor}>{label}</span>
      <span className="text-white/60 font-mono">{value}</span>
    </div>
    <div className="w-full bg-white/[0.03] h-1 rounded-full overflow-hidden">
      <div className={`${color} h-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

export default App;