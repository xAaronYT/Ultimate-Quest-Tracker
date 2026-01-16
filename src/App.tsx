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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Since quests_updated.json is in /public, it is served at root "/"
        const response = await fetch('/quests_updated.json');
        
        if (!response.ok) {
           throw new Error(`Data Load Error: ${response.status}. Check if file is in /public folder.`);
        }
        const data = await response.json();
        setAllQuests(data);
      } catch (err: any) {
        console.error("Fetch failed:", err.message);
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

  if (isLoading) return <div className="h-screen bg-[#080808] flex items-center justify-center text-orange-500 font-black tracking-widest animate-pulse uppercase">Syncing Intel...</div>;

  if (error) return (
    <div className="h-screen bg-[#080808] flex items-center justify-center p-10">
      <div className="text-center border border-red-900/40 p-10 bg-red-950/10 rounded-2xl">
        <h2 className="text-white font-black uppercase tracking-widest mb-4">Connection Lost</h2>
        <p className="text-xs text-gray-500 font-mono mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg">Retry Sync</button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0c0c] text-gray-200 font-inter">
      {/* SIDEBAR */}
      <nav className="w-64 flex-shrink-0 border-r border-white/5 bg-[#0a0a0a] flex flex-col z-30">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-lg font-black tracking-tighter text-white uppercase italic leading-tight">Ultimate Quest Tracker</h1>
          <p className="text-[8px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-2 opacity-80">v1.2 Production</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <button onClick={() => setActiveTrader('All')} className={`w-full flex px-6 py-4 border-l-4 ${activeTrader === 'All' ? 'bg-orange-500/5 border-orange-500 text-orange-500' : 'border-transparent text-gray-600'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">Global Operations</span>
          </button>
          
          <div className="px-6 py-3 text-[8px] font-black text-gray-800 uppercase tracking-widest">Traders</div>
          
          {TRADERS.map((trader) => (
            <button key={trader} onClick={() => setActiveTrader(trader)} className={`w-full flex items-center gap-4 px-6 py-3 border-l-4 transition-all ${activeTrader === trader ? `bg-white/5 ${TRADER_COLORS[trader] || 'border-gray-500'} text-white` : 'border-transparent text-gray-500 hover:text-orange-400'}`}>
              <div className="w-7 h-7 rounded bg-black/40 flex items-center justify-center border border-white/5 overflow-hidden">
                <img 
                  src={`/assets/${normalizeAssetName(trader)}.png`} 
                  alt=""
                  className={`w-full h-full object-cover ${activeTrader === trader ? 'grayscale-0' : 'grayscale opacity-40'}`}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{trader}</span>
            </button>
          ))}
        </div>

        {/* DONATION BOX */}
        <div className="p-4 border-t border-white/5 bg-black/40">
          <a href="https://cash.app/$xajcinc" target="_blank" rel="noopener noreferrer" className="group block p-3 rounded-lg border border-orange-500/10 hover:border-orange-500/30 transition-all text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-orange-500 transition-colors">Enjoying our app?</p>
            <p className="text-[8px] font-bold text-gray-700 mt-1">Feel free to donate</p>
          </a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#0f0f0f]/90 backdrop-blur-xl z-20 sticky top-0">
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{activeTrader}</h2>
          <div className="flex gap-4 items-center">
            <input type="text" placeholder="Search data..." className="bg-[#141414] border border-white/10 rounded-lg px-4 py-2 text-xs focus:border-orange-500/40 w-56 font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <div className="flex bg-black p-1 rounded-lg border border-white/5">
              {(['Active', 'Kappa', 'Lightkeeper', 'Show All'] as FilterMode[]).map((mode) => (
                <button key={mode} onClick={() => setFilterMode(mode)} className={`px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${filterMode === mode ? 'bg-orange-500 text-black' : 'text-gray-600 hover:text-orange-400'}`}>{mode}</button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-[140px] custom-scrollbar">
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
        </div>

        {/* PROGRESS HUD */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0c0c0c]/98 border-t border-white/5 backdrop-blur-2xl p-4 px-8 z-20">
          <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
            <ProgressBar label="Overall" value={`${stats.overall.count}/${stats.overall.total}`} pct={stats.overall.pct} color="bg-orange-600" />
            <ProgressBar label="Kappa" value={`${stats.kappa.pct}%`} pct={stats.kappa.pct} color="bg-[#fff000]" labelColor="text-[#fff000]" />
            <ProgressBar label="Lightkeeper" value={`${stats.lightkeeper.pct}%`} pct={stats.lightkeeper.pct} color="bg-blue-600" labelColor="text-blue-500" />
          </div>
        </div>
      </main>

      <aside className="hidden 2xl:flex w-80 flex-shrink-0 border-l border-white/5 bg-[#0a0a0a] flex flex-col z-30">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] italic">The Stash</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-4 gap-2">
            {COLLECTOR_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => toggleCollectorItem(item)}
                className={`aspect-square rounded border flex items-center justify-center overflow-hidden transition-all ${foundCollectorItems.has(item) ? 'bg-orange-500/10 border-orange-500/40' : 'bg-[#0f0f0f] border-white/5 opacity-30'}`}
              >
                <img 
                  src={`/assets/items/${normalizeAssetName(item)}.png`} 
                  alt={item} 
                  className="w-[80%] h-[80%] object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

const ProgressBar: React.FC<{ label: string, value: string, pct: number, color: string, labelColor?: string }> = ({ label, value, pct, color, labelColor = "text-gray-600" }) => (
  <div className="flex-1 space-y-2">
    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest"><span className={labelColor}>{label}</span><span className="text-white/60 font-mono">{value}</span></div>
    <div className="w-full bg-white/[0.03] h-1 rounded-full overflow-hidden"><div className={`${color} h-full transition-all duration-1000`} style={{ width: `${pct}%` }} /></div>
  </div>
);

export default App;