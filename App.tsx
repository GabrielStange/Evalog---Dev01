import React, { useState, useEffect, useRef } from 'react';
import { AppTab, FeedingRecord, BabyProfile, PauseInterval, ThemeColor } from './types';
import Navigation from './components/Navigation';
import FeedingTimer from './components/FeedingTimer';
import HistoryList from './components/HistoryList';
import StatsView from './components/StatsView';
import AIInsights from './components/AIInsights';
import BabyProfileManager from './components/BabyProfileManager';
import ActiveTimerWidget from './components/ActiveTimerWidget';
import LoginScreen from './components/LoginScreen';
import AdminInviteManager from './components/AdminInviteManager';
import { 
    getRecords, 
    saveRecord, 
    deleteRecord, 
    getBabies, 
    saveBaby, 
    getActiveBabyId, 
    setActiveBabyId,
    ensureDataConsistency
} from './services/storageService';
import { supabase } from './services/supabaseClient';
import { Baby, ChevronDown, Moon, Sun, Loader2, Info, ShieldCheck } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const STORAGE_KEY_TIMER_BREAST = 'evalog_timer_breast_v1';
const STORAGE_KEY_TIMER_BOTTLE = 'evalog_timer_bottle_v1';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.TRACKER);
  const [allRecords, setAllRecords] = useState<FeedingRecord[]>([]);
  const [babies, setBabies] = useState<BabyProfile[]>([]);
  const [currentBabyId, setCurrentBabyId] = useState<string | null>(null);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('evalog_theme_mode');
    return saved === 'dark';
  });
  
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // --- LIFTED STATE: Feeding Timer (Initialized from LocalStorage) ---
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMER_BREAST);
      return saved ? JSON.parse(saved).activeSide : null;
    } catch { return null; }
  });

  const [breastStartTime, setBreastStartTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMER_BREAST);
      return saved ? JSON.parse(saved).startTime : null;
    } catch { return null; }
  });

  const [breastElapsed, setBreastElapsed] = useState(0);
  
  // Bottle State
  const [trackerMode, setTrackerMode] = useState<'timer' | 'bottle'>('timer');
  
  const [bottleStatus, setBottleStatus] = useState<'idle' | 'running' | 'paused'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMER_BOTTLE);
      return saved ? JSON.parse(saved).status : 'idle';
    } catch { return 'idle'; }
  });

  const [bottleStartTime, setBottleStartTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMER_BOTTLE);
      return saved ? JSON.parse(saved).startTime : null;
    } catch { return null; }
  });

  const [bottleElapsed, setBottleElapsed] = useState(0);
  
  const [bottleVolume, setBottleVolume] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMER_BOTTLE);
      return saved ? JSON.parse(saved).volume || '' : '';
    } catch { return ''; }
  });
  
  const [bottlePauses, setBottlePauses] = useState<PauseInterval[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMER_BOTTLE);
      return saved ? JSON.parse(saved).pauses || [] : [];
    } catch { return []; }
  });

  const [currentPauseStart, setCurrentPauseStart] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIMER_BOTTLE);
      return saved ? JSON.parse(saved).currentPauseStart : null;
    } catch { return null; }
  });

  const timerRef = useRef<number | null>(null);
  const bottleTimerRef = useRef<number | null>(null);

  // --- Authentication Check ---
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setAuthLoading(false);
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        setAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Data Loading (Async & Realtime) ---
  const loadData = async () => {
    if (!session?.user) return; // Don't load if not logged in

    try {
        if (allRecords.length === 0) setLoading(true);
        
        const { babies: consistentBabies, records: consistentRecords } = await ensureDataConsistency();
        
        setBabies(consistentBabies);
        setAllRecords(consistentRecords);
        
        // Ensure active baby is set
        const activeId = getActiveBabyId();
        if (activeId && consistentBabies.find(b => b.id === activeId)) {
            setCurrentBabyId(activeId);
        } else if (consistentBabies.length > 0) {
            const defaultId = consistentBabies[0].id;
            setCurrentBabyId(defaultId);
            setActiveBabyId(defaultId);
        }
    } catch (error) {
        console.error("Failed to load data", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
        loadData();
    } else {
        setLoading(false); // No session, stop loading spinner to show login
    }

    // Setup Realtime Subscription (Only if logged in to Supabase)
    if (session?.user?.id) {
        const ownerId = session.user.id;
        const channel = supabase
        .channel('table-db-changes')
        .on(
            'postgres_changes',
            {
            event: '*',
            schema: 'public',
            table: 'records',
            filter: `ownerId=eq.${ownerId}`,
            },
            (payload) => {
            getRecords().then(setAllRecords);
            }
        )
        .on(
            'postgres_changes',
            {
            event: '*',
            schema: 'public',
            table: 'babies',
            filter: `ownerId=eq.${ownerId}`,
            },
            (payload) => {
            getBabies().then(setBabies);
            }
        )
        .subscribe();

        return () => {
             supabase.removeChannel(channel);
        };
    }
  }, [session]); // Reload if session changes

  // --- Persist Timer State Logic ---
  useEffect(() => {
    const state = { activeSide, startTime: breastStartTime };
    localStorage.setItem(STORAGE_KEY_TIMER_BREAST, JSON.stringify(state));
  }, [activeSide, breastStartTime]);

  useEffect(() => {
    const state = { 
        status: bottleStatus, 
        startTime: bottleStartTime, 
        pauses: bottlePauses, 
        currentPauseStart: currentPauseStart,
        volume: bottleVolume
    };
    localStorage.setItem(STORAGE_KEY_TIMER_BOTTLE, JSON.stringify(state));
  }, [bottleStatus, bottleStartTime, bottlePauses, currentPauseStart, bottleVolume]);

  // --- Effects for Timers Calculation ---
  useEffect(() => {
    if (activeSide && breastStartTime) {
      setBreastElapsed(Math.floor((Date.now() - breastStartTime) / 1000));
      timerRef.current = window.setInterval(() => {
        setBreastElapsed(Math.floor((Date.now() - breastStartTime) / 1000));
      }, 1000);
    } else {
      setBreastElapsed(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSide, breastStartTime]);

  useEffect(() => {
    const calcElapsed = () => {
        if (!bottleStartTime) return 0;
        let total = Date.now() - bottleStartTime;
        bottlePauses.forEach(p => {
            total -= (p.endTime - p.startTime);
        });
        if (bottleStatus === 'paused' && currentPauseStart) {
            total -= (Date.now() - currentPauseStart);
        }
        return Math.max(0, Math.floor(total / 1000));
    };

    if (bottleStatus === 'running') {
      setBottleElapsed(calcElapsed());
      bottleTimerRef.current = window.setInterval(() => {
         setBottleElapsed(calcElapsed());
      }, 1000);
    } else if (bottleStatus === 'paused') {
       setBottleElapsed(calcElapsed());
       if (bottleTimerRef.current) {
        clearInterval(bottleTimerRef.current);
        bottleTimerRef.current = null;
      }
    } else {
      setBottleElapsed(0);
      if (bottleTimerRef.current) {
        clearInterval(bottleTimerRef.current);
        bottleTimerRef.current = null;
      }
    }
    return () => {
      if (bottleTimerRef.current) clearInterval(bottleTimerRef.current);
    };
  }, [bottleStatus, bottleStartTime, bottlePauses, currentPauseStart]);

  // --- Theme Management ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
        root.classList.add('dark');
        localStorage.setItem('evalog_theme_mode', 'dark');
    } else {
        root.classList.remove('dark');
        localStorage.setItem('evalog_theme_mode', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- Handlers ---
  const handleSaveRecord = async (record: FeedingRecord) => {
    setAllRecords(prev => [record, ...prev]);
    try {
        await saveRecord(record);
        const updated = await getRecords();
        setAllRecords(updated);
    } catch (e) {
        alert("Erro ao salvar registro. Verifique sua conexão.");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        setAllRecords(prev => prev.filter(r => r.id !== id));
        try {
            await deleteRecord(id);
        } catch (e) {
            alert("Erro ao excluir registro.");
            loadData();
        }
    }
  };

  const handleToggleBreastTimer = (side: 'left' | 'right') => {
    if (activeSide === side) {
      handleFinishBreastFeeding();
    } else {
      setBreastStartTime(Date.now());
      setBreastElapsed(0);
      setActiveSide(side);
    }
  };

  const handleFinishBreastFeeding = () => {
    if (!activeSide || !breastStartTime || !currentBabyId) return;
    const record: FeedingRecord = {
      id: crypto.randomUUID(),
      babyId: currentBabyId,
      type: activeSide === 'left' ? 'breast_left' : 'breast_right',
      startTime: breastStartTime,
      endTime: Date.now(),
      durationSeconds: breastElapsed,
      createdAt: Date.now(),
    };
    handleSaveRecord(record);
    setActiveSide(null);
    setBreastStartTime(null);
    setBreastElapsed(0);
  };

  const handleToggleBottleTimer = () => {
    const now = Date.now();
    if (bottleStatus === 'idle') {
      setBottleStartTime(now);
      setBottleStatus('running');
      setBottleElapsed(0);
      setBottlePauses([]);
      setCurrentPauseStart(null);
    } else if (bottleStatus === 'running') {
      setBottleStatus('paused');
      setCurrentPauseStart(now);
    } else if (bottleStatus === 'paused') {
      setBottleStatus('running');
      if (currentPauseStart) {
        setBottlePauses(prev => [...prev, { startTime: currentPauseStart, endTime: now }]);
        setCurrentPauseStart(null);
      }
    }
  };

  const handleResetBottleTimer = () => {
    setBottleStatus('idle');
    setBottleStartTime(null);
    setBottleElapsed(0);
    setBottlePauses([]);
    setCurrentPauseStart(null);
  };

  const handleSaveBottle = () => {
    if (!bottleVolume || !currentBabyId) return;
    const now = Date.now();
    const start = bottleStartTime || now;
    const duration = bottleElapsed > 0 ? bottleElapsed : undefined;
    let finalPauses = [...bottlePauses];
    if (bottleStatus === 'paused' && currentPauseStart) {
        finalPauses.push({ startTime: currentPauseStart, endTime: now });
    }
    const record: FeedingRecord = {
      id: crypto.randomUUID(),
      babyId: currentBabyId,
      type: 'bottle',
      startTime: start,
      endTime: now,
      pauses: finalPauses,
      durationSeconds: duration,
      volumeMl: parseInt(bottleVolume, 10),
      createdAt: now,
    };
    handleSaveRecord(record);
    setBottleVolume('');
    handleResetBottleTimer();
    alert('Mamadeira registrada!');
  };

  const handleSelectBaby = (id: string) => {
      setCurrentBabyId(id);
      setActiveBabyId(id);
      setShowProfileManager(false);
  };

  const handleSaveBaby = async (baby: BabyProfile) => {
      try {
        const updatedBabies = await saveBaby(baby);
        setBabies(updatedBabies);
        if (!currentBabyId) {
            setCurrentBabyId(baby.id);
            setActiveBabyId(baby.id);
        }
      } catch (e) {
          alert("Erro ao salvar perfil do bebê.");
      }
  };

  // --- Rendering ---

  if (authLoading) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
           <Loader2 size={32} className="animate-spin text-rose-400" />
        </div>
      );
  }

  // Strict Login Check
  if (!session) {
      return <LoginScreen isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  // Check Admin
  // @ts-ignore
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = session.user.email === adminEmail;

  // Derived Data
  const currentBabyRecords = allRecords.filter(r => r.babyId === currentBabyId);
  const currentBabyProfile = babies.find(b => b.id === currentBabyId);
  const themeColor: ThemeColor = currentBabyProfile?.themeColor || 'rose';

  const getLastFeedingTime = () => {
    if (currentBabyRecords.length === 0) return null;
    const last = currentBabyRecords[0]; 
    const diff = Date.now() - last.startTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m atrás`;
    return `${minutes}m atrás`;
  };
  
  const getAgeString = (birthDate: number) => {
      const diff = Date.now() - birthDate;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (months > 0) return `${months} meses e ${remainingDays} dias`;
      return `${days} dias`;
  };

  const lastFeedingLabel = getLastFeedingTime();
  const isTimerActive = !!activeSide || bottleStatus !== 'idle';
  const shouldShowWidget = currentTab !== AppTab.TRACKER && isTimerActive;

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
              <div className="flex flex-col items-center animate-pulse">
                  <Baby size={48} className="text-slate-300 mb-4" />
                  <Loader2 size={24} className="animate-spin text-slate-400" />
                  <p className="text-slate-400 mt-2 text-sm font-medium">Sincronizando dados...</p>
              </div>
          </div>
      );
  }

  return (
    <div className={`h-screen bg-${themeColor}-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col overflow-hidden transition-colors duration-500`}>
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 px-4 py-4 shadow-sm flex-none z-40 flex justify-between items-center transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <div className={`bg-${themeColor}-100 dark:bg-${themeColor}-900/30 p-2 rounded-lg transition-colors`}>
            <Baby size={28} className={`text-${themeColor}-500 dark:text-${themeColor}-400 transition-colors`} />
          </div>
          <div>
             <div className="flex items-center gap-2">
                 <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-none">EvaLog</h1>
                 {isAdmin && (
                    <button 
                        onClick={() => setShowAdminPanel(true)}
                        className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border border-amber-200 dark:border-amber-800"
                    >
                        Admin
                    </button>
                 )}
             </div>
             <p className="text-xs text-slate-400 font-medium">Monitor de Amamentação</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex-shrink-0"
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative group">
                <button 
                    onClick={() => setShowProfileManager(true)}
                    className={`flex items-center space-x-2 bg-${themeColor}-50 dark:bg-slate-800 px-3 py-2 rounded-full border border-${themeColor}-100 dark:border-slate-700 hover:bg-${themeColor}-100 dark:hover:bg-slate-700 transition-colors max-w-[150px]`}
                >
                    <div className="text-right flex-shrink min-w-0">
                        <span className={`block text-xs font-bold text-${themeColor}-400 uppercase tracking-wider`}>
                            {currentBabyProfile ? 'Bebê' : 'Perfil'}
                        </span>
                        <div className="flex items-center justify-end gap-1">
                            <span className="block text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                                {currentBabyProfile ? currentBabyProfile.name : 'Criar'}
                            </span>
                            {currentBabyProfile && <Info size={12} className={`text-${themeColor}-400 flex-shrink-0`} />}
                        </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs bg-${themeColor}-400 flex-shrink-0`}>
                    {currentBabyProfile ? currentBabyProfile.name.charAt(0).toUpperCase() : <Baby size={16}/>}
                    </div>
                    <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                </button>

                {currentBabyProfile && (
                    <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50 dark:border-slate-700">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs bg-${themeColor}-400`}>
                                {currentBabyProfile.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{currentBabyProfile.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{currentBabyProfile.gender === 'boy' ? 'Menino' : 'Menina'}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Idade:</span>
                                <span className="font-semibold">{getAgeString(currentBabyProfile.birthDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Peso:</span>
                                <span className="font-semibold">{currentBabyProfile.weightKg ? `${currentBabyProfile.weightKg} kg` : '--'}</span>
                            </div>
                        </div>
                        <div className="absolute top-[-6px] right-8 w-3 h-3 bg-white dark:bg-slate-800 border-t border-l border-slate-100 dark:border-slate-700 transform rotate-45"></div>
                    </div>
                )}
            </div>
        </div>
      </header>
      
      {shouldShowWidget && (
          <div className="flex-none z-30">
            <ActiveTimerWidget 
                themeColor={themeColor}
                activeSide={activeSide}
                breastElapsed={breastElapsed}
                onFinishBreast={handleFinishBreastFeeding}
                bottleStatus={bottleStatus}
                bottleElapsed={bottleElapsed}
                onToggleBottle={handleToggleBottleTimer}
                onNavigateToTracker={() => setCurrentTab(AppTab.TRACKER)}
            />
          </div>
      )}

      {!shouldShowWidget && currentBabyProfile && lastFeedingLabel && (
        <div className={`flex-none bg-white/50 dark:bg-slate-900/50 px-6 py-2 border-b border-${themeColor}-50 dark:border-slate-800 flex justify-center z-20`}>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Última alimentação de <span className={`font-bold text-${themeColor}-500 dark:text-${themeColor}-400`}>{currentBabyProfile.name}</span>: {lastFeedingLabel}
            </p>
        </div>
      )}

      <main className="flex-1 w-full max-w-lg mx-auto pt-4 overflow-y-auto pb-32 no-scrollbar">
        {currentTab === AppTab.TRACKER && (
          <FeedingTimer 
            themeColor={themeColor}
            currentBabyId={currentBabyId}
            activeSide={activeSide}
            breastElapsed={breastElapsed}
            onToggleBreastTimer={handleToggleBreastTimer}
            mode={trackerMode}
            setMode={setTrackerMode}
            bottleStatus={bottleStatus}
            bottleElapsed={bottleElapsed}
            bottleVolume={bottleVolume}
            setBottleVolume={setBottleVolume}
            onToggleBottleTimer={handleToggleBottleTimer}
            onResetBottleTimer={handleResetBottleTimer}
            onSaveBottle={handleSaveBottle}
          />
        )}
        {currentTab === AppTab.HISTORY && (
          <HistoryList 
            records={currentBabyRecords} 
            onDelete={handleDeleteRecord} 
            themeColor={themeColor} 
            babyName={currentBabyProfile?.name} 
          />
        )}
        {currentTab === AppTab.STATS && (
          <StatsView records={currentBabyRecords} themeColor={themeColor} isDarkMode={isDarkMode} />
        )}
        {currentTab === AppTab.AI && (
          <AIInsights records={currentBabyRecords} babyProfile={currentBabyProfile} themeColor={themeColor} />
        )}
      </main>

      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} themeColor={themeColor} />

      {showProfileManager && (
          <BabyProfileManager 
            babies={babies}
            currentBabyId={currentBabyId}
            onSelectBaby={handleSelectBaby}
            onSaveBaby={handleSaveBaby}
            onClose={() => setShowProfileManager(false)}
            themeColor={themeColor}
          />
      )}

      {showAdminPanel && (
          <AdminInviteManager 
            onClose={() => setShowAdminPanel(false)}
            themeColor={themeColor}
          />
      )}
    </div>
  );
};

export default App;