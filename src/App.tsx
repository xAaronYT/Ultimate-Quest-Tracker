import React, { useState, useMemo, useEffect } from 'react';
import { Quest } from './types';
import { TRADERS, COLLECTOR_ITEMS, TRADER_COLORS } from './constants';
import { QuestCard } from './components/QuestCard';
import { normalizeAssetName } from './utils';

type FilterMode = 'Active' | 'Kappa' | 'Lightkeeper' | 'Show All';

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
        const response = await fetch('/quests_updated.json');
        if (!response.ok) throw new Error(`Data Sync Error: ${response.status}`);
        const data = await response.json();
        setAllQuests(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };
    fetchData();

    const savedQuests = localStorage.getItem('uqt_progress');
    const savedItems = localStorage.getItem('uqt_stash');
    if (savedQuests) try { setCompletedQuestIds(new Set(JSON.parse(savedQuests))); } catch (e) {}
    if (savedItems) try { setFoundCollectorItems(new Set(JSON.parse(savedItems))); } catch (e) {}
  }, []);

  useEffect(() => {
    if (allQuests.length > 0) {
      localStorage.setItem('uqt_progress', JSON.stringify(Array.from(completedQuestIds)));
      localStorage.setItem('uqt_stash', JSON.stringify(Array.from(foundCollectorItems)));
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
    localStorage.clear();
    setCompletedQuestIds(new Set());
    setFoundCollectorItems(new Set());
    setShowWipeSafeguard(false);
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
    const filtered = allQuests.filter(q => {
      const isDone = completedQuestIds.has(q.id);
      const matchesSearch = q.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrader = activeTrader === 'All' || q.trader.name === activeTrader;
      
      let matchesFilterMode = true;
      if (filterMode === 'Active') matchesFilterMode = !isDone;
      else if (filterMode === 'Kappa') matchesFilterMode = q.kappaRequired && !isDone;
      else if (filterMode === 'Lightkeeper') matchesFilterMode = q.lightkeeperRequired && !isDone;
      else if (filterMode === 'Show All') matchesFilterMode = true;

      return matchesSearch && matchesTrader && matchesFilterMode;
    });

    // PRIORITY SORT: Active AND Available quests moved to top
    return [...filtered].sort((a, b) => {
      const aDone = completedQuestIds.has(a.id);
      const bDone = completedQuestIds.has(b.id);
      const aAvail = checkAvailability(a);
      const bAvail = checkAvailability(b);

      // Score: 0 = High Priority (Available & Active), 1 = Low Priority (Done or Locked)
      const aScore = (!aDone && aAvail) ? 0 : 1;
      const bScore = (!bDone && bAvail) ? 0 : 1;

      return aScore - bScore;
    });
  }, [allQuests, searchQuery, activeTrader, filterMode, completedQuestIds, questNameToIdMap]);

  const stats = useMemo(() => {
    const calculate = (list: Quest[]) => {
      const count = list.filter(q => completedQuestIds.has(q.id)).length;
      return { count, total: list.length, pct: Math.round((count / list.length) * 100) || 0 };
    };
    return {
      overall: calculate(allQuests),
      kappa: calculate(allQuests.filter(q => q.kappaRequired)),
      lightkeeper: calculate(allQuests.filter(q => q.lightkeeperRequired))
    };
  }, [allQuests, completedQuestIds]);

  if (isLoading) return <div className="h-screen bg-[#080808] flex items-center justify-center text-orange-500 font-black tracking-[1em] animate-pulse uppercase">Syncing Intel...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0c0c] text-gray-200 font-inter">
      
      {showWipeSafeguard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full p-8 bg-[#121212] border border-red-900/30 rounded-2xl text-center space-y-6 shadow-2xl">
            <h4 className="text-xl font-black uppercase text-white italic">Confirm System Wipe</h4>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowWipeSafeguard(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg">Cancel</button>
              <button onClick={handleGlobalWipe} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Confirm Wipe</button>
            </div>
          </div>
        </div>
      )}

      <nav className="w-64 flex-shrink-0 border-r border-white/5 bg-[#0a0a0a] flex flex-col z-30">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-lg font-black tracking-tighter text-white uppercase italic leading-tight">Ultimate Quest Tracker</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <button onClick={() => setActiveTrader('All')} className={`w-full flex px-6 py-4 border-l-4 transition-all ${activeTrader === 'All' ? 'bg-orange-500/5 border-orange-500 text-orange-500' : 'border-transparent text-gray-600 hover:text-gray-300'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">Global Operations</span>
          </button>
          <div className="px-6 py-3 text-[8px] font-black text-gray-800 uppercase tracking-widest">Traders</div>
          {TRADERS.map((trader) => (
            <button key={trader} onClick={() => setActiveTrader(trader)} className={`w-full flex items-center gap-4 px-6 py-3 border-l-4 transition-all ${activeTrader === trader ? `bg-white/5 ${TRADER_COLORS[trader] || 'border-gray-500'} text-white` : 'border-transparent text-gray-500 hover:text-orange-400'}`}>
              <div className="w-7 h-7 rounded bg-black/40 flex items-center justify-center border border-white/5 overflow-hidden">
                <img src={`/assets/${normalizeAssetName(trader)}.png`} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{trader}</span>
            </button>
          ))}
        </div>

        {/* REVAMPED DONATION BOX */}
        <div className="p-4 bg-black/60 border-t border-white/5">
          <a 
            href="https://cash.app/$xajcinc" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 hover:border-orange-500/50 transition-all group"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Support the App</span>
            <span className="text-[8px] font-bold text-gray-500 text-center leading-tight">Your donations keep the servers running and the intel fresh.</span>
            <div className="mt-3 px-4 py-1.5 bg-orange-500 text-black text-[9px] font-black uppercase tracking-widest rounded group-hover:bg-orange-400 transition-colors">
              Donate Now
            </div>
          </a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#0f0f0f] z-20 sticky top-0">
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{activeTrader}</h2>
          <div className="flex gap-4 items-center">
            <input type="text" placeholder="Search..." className="bg-[#141414] border border-white/10 rounded-lg px-4 py-2 text-xs w-56 font-bold focus:border-orange-500/50 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <div className="flex bg-black p-1 rounded-lg border border-white/5">
              {(['Active', 'Kappa', 'Lightkeeper', 'Show All'] as FilterMode[]).map((mode) => (
                <button key={mode} onClick={() => setFilterMode(mode)} className={`px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${filterMode === mode ? 'bg-orange-500 text-black' : 'text-gray-600 hover:text-orange-400'}`}>{mode}</button>
              ))}
            </div>
            <button onClick={() => setShowWipeSafeguard(true)} className="p-2.5 rounded-lg border border-white/5 text-gray-600 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-[160px] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredQuests.map(quest => (
              <QuestCard key={quest.id} quest={quest} isCompleted={completedQuestIds.has(quest.id)} isAvailable={checkAvailability(quest)} onToggle={toggleQuest} />
            ))}
          </div>
        </div>

        {/* BOTTOM BAR: SOLID OPACITY */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0c0c0c] border-t border-white/10 p-6 px-8 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto grid grid-cols-3 gap-12">
            <ProgressBar label="Overall" value={`${stats.overall.count}/${stats.overall.total}`} pct={stats.overall.pct} color="bg-orange-600" />
            <ProgressBar label="Kappa" value={`${stats.kappa.pct}%`} pct={stats.kappa.pct} color="bg-[#fff000]" labelColor="text-[#fff000]" />
            <ProgressBar label="Lightkeeper" value={`${stats.lightkeeper.pct}%`} pct={stats.lightkeeper.pct} color="bg-blue-600" labelColor="text-blue-500" />
          </div>
        </div>
      </main>

      <aside className="hidden 2xl:flex w-80 flex-shrink-0 border-l border-white/5 bg-[#0a0a0a] flex flex-col z-30">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] italic">The Stash</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-4 gap-2">
            {COLLECTOR_ITEMS.map((item) => (
              <StashItem 
                key={item} 
                item={item} 
                isFound={foundCollectorItems.has(item)} 
                onToggle={toggleCollectorItem} 
              />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

const StashItem: React.FC<{ item: string, isFound: boolean, onToggle: (item: string) => void }> = ({ item, isFound, onToggle }) => {
  const [imgError, setImgError] = React.useState(false);
  
  return (
    <button
      onClick={() => onToggle(item)}
      title={imgError ? item : undefined}
      className={`relative aspect-square rounded border flex items-center justify-center overflow-hidden transition-all ${isFound ? 'bg-orange-500/10 border-orange-500/40 opacity-100' : 'bg-[#0f0f0f] border-white/5 opacity-30 hover:opacity-50'}`}
    >
      {!imgError ? (
        <img 
          src={`/assets/items/${normalizeAssetName(item)}.png`} 
          alt={item} 
          className="w-[80%] h-[80%] object-contain z-10"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-[7px] font-bold text-center p-1 text-gray-600 uppercase leading-none break-words">
           {item}
        </span>
      )}
    </button>
  );
};

const ProgressBar: React.FC<{ label: string, value: string, pct: number, color: string, labelColor?: string }> = ({ label, value, pct, color, labelColor = "text-gray-600" }) => (
  <div className="flex-1 space-y-3">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className={labelColor}>{label}</span><span className="text-white font-mono">{value}</span></div>
    <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden"><div className={`${color} h-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.1)]`} style={{ width: `${pct}%` }} /></div>
  </div>
);

export default App;