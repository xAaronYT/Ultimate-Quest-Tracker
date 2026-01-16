import React, { useState, useMemo, useEffect } from 'react';
import { Quest } from './types';
import { TRADERS, COLLECTOR_ITEMS } from './constants';
import { QuestCard } from './components/QuestCard';
import { BugReportModal } from './components/BugReportModal';
import { normalizeAssetName } from './utils';

type FilterMode = 'Active' | 'Kappa' | 'Lightkeeper' | 'Show All';

const App: React.FC = () => {
  // 1. STATE MANAGEMENT
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set());
  const [foundCollectorItems, setFoundCollectorItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrader, setActiveTrader] = useState<string>('All');
  const [filterMode, setFilterMode] = useState<FilterMode>('Active');
  const [showWipeSafeguard, setShowWipeSafeguard] = useState(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);

  // 2. INITIAL LOAD
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

    // Load progress from LocalStorage
    const savedQuests = localStorage.getItem('uqt_progress');
    const savedItems = localStorage.getItem('uqt_stash');
    if (savedQuests) setCompletedQuestIds(new Set(JSON.parse(savedQuests)));
    if (savedItems) setFoundCollectorItems(new Set(JSON.parse(savedItems)));
  }, []);

  // 3. AUTO-SAVE PROGRESS
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('uqt_progress', JSON.stringify(Array.from(completedQuestIds)));
      localStorage.setItem('uqt_stash', JSON.stringify(Array.from(foundCollectorItems)));
    }
  }, [completedQuestIds, foundCollectorItems, isLoading]);

  // 4. PERSISTENT TOGGLE LOGIC
  // This updates the GLOBAL set, regardless of what filter you are looking at
  const toggleQuest = (id: string) => {
    setCompletedQuestIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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

  // 5. HELPER: Check if prerequisites are met
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

  // 6. FILTERING LOGIC
  const filteredQuests = useMemo(() => {
    return allQuests.filter(q => {
      const isDone = completedQuestIds.has(q.id);
      const matchesSearch = q.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrader = activeTrader === 'All' || q.trader.name === activeTrader;
      
      let matchesFilterMode = true;
      if (filterMode === 'Active') matchesFilterMode = !isDone;
      else if (filterMode === 'Kappa') matchesFilterMode = q.kappaRequired;
      else if (filterMode === 'Lightkeeper') matchesFilterMode = q.lightkeeperRequired;
      // 'Show All' mode allows matchesFilterMode to remain true

      return matchesSearch && matchesTrader && matchesFilterMode;
    }).sort((a, b) => {
      const aDone = completedQuestIds.has(a.id);
      const bDone = completedQuestIds.has(b.id);
      const aAvailable = checkAvailability(a);
      const bAvailable = checkAvailability(b);
      
      // Sort priority: Available & Not Done > Not Available & Not Done > Done
      const getWeight = (d: boolean, av: boolean) => (!d && av ? 0 : !d && !av ? 1 : 2);
      return getWeight(aDone, aAvailable) - getWeight(bDone, bAvailable);
    });
  }, [allQuests, searchQuery, activeTrader, filterMode, completedQuestIds, questNameToIdMap]);

  // 7. STATISTICS
  const stats = useMemo(() => {
    const calc = (list: Quest[]) => {
      const count = list.filter(q => completedQuestIds.has(q.id)).length;
      return { count, total: list.length, pct: Math.round((count / list.length) * 100) || 0 };
    };
    return {
      overall: calc(allQuests),
      kappa: calc(allQuests.filter(q => q.kappaRequired)),
      lightkeeper: calc(allQuests.filter(q => q.lightkeeperRequired))
    };
  }, [allQuests, completedQuestIds]);

  if (isLoading) return <div className="h-screen bg-[#080808] flex items-center justify-center text-orange-500 font-black tracking-[1em] animate-pulse uppercase">Syncing Intel...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0c0c] text-gray-200 font-inter">
      <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
      
      {showWipeSafeguard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 text-center">
          <div className="max-w-sm w-full p-8 bg-[#121212] border border-red-900/30 rounded-2xl space-y-6">
            <h4 className="text-xl font-black uppercase text-white italic">Confirm System Wipe</h4>
            <div className="flex gap-3">
              <button onClick={() => setShowWipeSafeguard(false)} className="flex-1 py-3 bg-white/5 text-[10px] font-black uppercase rounded-lg">Cancel</button>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex-1 py-3 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">Wipe</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <nav className="w-64 flex-shrink-0 border-r border-white/5 bg-[#0a0a0a] flex flex-col z-30">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-lg font-black tracking-tighter text-white uppercase italic leading-none">Ultimate Quest Tracker</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <button onClick={() => setActiveTrader('All')} className={`w-full flex px-6 py-4 border-l-4 ${activeTrader === 'All' ? 'bg-orange-500/5 border-orange-500 text-orange-500' : 'border-transparent text-gray-600'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">Global Operations</span>
          </button>
          {TRADERS.map((t) => (
            <button key={t} onClick={() => setActiveTrader(t)} className={`w-full flex items-center gap-4 px-6 py-3 border-l-4 ${activeTrader === t ? 'bg-white/5 border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-orange-400'}`}>
              <div className="w-7 h-7 rounded bg-black/40 border border-white/5 overflow-hidden">
                <img src={`/assets/${normalizeAssetName(t)}.png`} className="w-full h-full object-cover" alt={t} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
            </button>
          ))}
        </div>
        <div className="p-4 bg-black/60 border-t border-white/5 space-y-2">
          <button onClick={() => setIsBugModalOpen(true)} className="w-full py-2 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 rounded-lg transition-all border border-white/5">Report Bug</button>
          <a href="https://cash.app/$xajcinc" target="_blank" rel="noreferrer" className="flex flex-col items-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/50 transition-all group">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1 font-inter">Support</span>
            <div className="px-4 py-1 bg-orange-500 text-black text-[8px] font-black uppercase tracking-widest rounded">Donate</div>
          </a>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative">
        <header className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#0f0f0f] z-20 sticky top-0">
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{activeTrader}</h2>
          <div className="flex gap-4 items-center">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-[#141414] border border-white/10 rounded-lg px-4 py-2 text-xs w-56 font-bold outline-none focus:border-orange-500/50" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <div className="flex bg-black p-1 rounded-lg border border-white/5">
              {(['Active', 'Kappa', 'Lightkeeper', 'Show All'] as FilterMode[]).map((m) => (
                <button 
                  key={m} 
                  onClick={() => setFilterMode(m)} 
                  className={`px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-colors ${filterMode === m ? 'bg-orange-500 text-black' : 'text-gray-600 hover:text-gray-300'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button onClick={() => setShowWipeSafeguard(true)} className="p-2.5 rounded-lg border border-white/5 text-gray-600 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-[160px] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredQuests.map(q => (
              <QuestCard 
                key={q.id} 
                quest={q} 
                isCompleted={completedQuestIds.has(q.id)} 
                isAvailable={checkAvailability(q)} 
                onToggle={toggleQuest} 
              />
            ))}
          </div>
        </div>

        {/* BOTTOM STATS BAR */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0c0c0c] border-t border-white/10 p-6 px-8 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto grid grid-cols-3 gap-12">
            <ProgressBar label="Overall" value={`${stats.overall.count}/${stats.overall.total}`} pct={stats.overall.pct} color="bg-orange-600" />
            <ProgressBar label="Kappa" value={`${stats.kappa.pct}%`} pct={stats.kappa.pct} color="bg-[#fff000]" labelColor="text-[#fff000]" />
            <ProgressBar label="Lightkeeper" value={`${stats.lightkeeper.pct}%`} pct={stats.lightkeeper.pct} color="bg-blue-600" labelColor="text-blue-500" />
          </div>
        </div>
      </main>

      {/* STASH ASIDE */}
      <aside className="hidden 2xl:flex w-80 flex-shrink-0 border-l border-white/5 bg-[#0a0a0a] flex flex-col z-30">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] italic">The Stash</h3>
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
  return (
    <button onClick={() => onToggle(item)} className={`relative aspect-square rounded-md border transition-all duration-200 flex items-center justify-center overflow-hidden ${isFound ? 'bg-orange-500/20 border-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.2)]' : 'bg-zinc-900/50 border-white/10 opacity-60 hover:opacity-100'}`}>
      {!imgErr ? (
        <img src={`/assets/items/${normalizeAssetName(item)}.png`} className={`w-[85%] h-[85%] object-contain ${!isFound ? 'brightness-75 contrast-125' : 'brightness-110'}`} onError={() => setImgErr(true)} alt={item} />
      ) : (
        <span className="text-[7px] font-black text-gray-500 uppercase p-1">{item}</span>
      )}
      {!isFound && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />}
    </button>
  );
};

const ProgressBar: React.FC<{ label: string, value: string, pct: number, color: string, labelColor?: string }> = ({ label, value, pct, color, labelColor = "text-gray-600" }) => (
  <div className="flex-1 space-y-3">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
      <span className={labelColor}>{label}</span>
      <span className="text-white font-mono">{value}</span>
    </div>
    <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
      <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

export default App;