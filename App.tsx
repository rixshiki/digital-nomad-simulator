
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Job, 
  JobTier, 
  PlayerStats, 
  GameStatus, 
  LocationType, 
  Upgrade,
  WorkResult,
  LeaderboardEntry
} from './types';
import { 
  BASE_RENT,
  LUXURY_RENT,
  RENT_INTERVAL,
  WIN_GOAL, 
  MAX_BURNOUTS, 
  generateJobs, 
  UPGRADES,
  LIFESTYLE_UPGRADES,
  POSITIVE_EVENTS, 
  NEGATIVE_EVENTS 
} from './constants';
import StatBar from './components/StatBar';
import { getClientFeedback, getDailyHoroscope } from './services/geminiService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const INITIAL_STATS: PlayerStats = {
  money: 1000,
  energy: 100,
  stress: 0,
  reputation: 0,
  skillLevel: 1,
  day: 1,
  currentTime: 8, // Start at 8 AM
  burnoutCount: 0,
  equipmentLevel: 1,
  rentalLevel: 1,
  unpaidRents: 0,
  isBurnedOut: false,
  burnoutRemaining: 0,
  pinnedJobId: null,
  pinHistory: {},
  history: [{ day: 1, money: 1000, stress: 0 }],
};

interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  position: 'right' | 'left' | 'left20' | 'bottom' | 'top' | 'center';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'tutorial-welcome',
    title: 'Welcome, Nomad!',
    content: 'This simulator tracks your journey to financial freedom. Your goal is to reach ฿1,000,000 without burning out or getting evicted.',
    position: 'center'
  },
  {
    targetId: 'tutorial-day-time',
    title: 'Calendar & Clock',
    content: 'Time moves when you work, study, or rest. Keep an eye on the day; rent is due every 10 days!',
    position: 'right'
  },
  {
    targetId: 'tutorial-money',
    title: 'The Bottom Line',
    content: 'This is your current balance. Reach ฿1,000,000 to win. If you hit negative and can\'t pay rent, it\'s game over.',
    position: 'right'
  },
  {
    targetId: 'tutorial-vitals',
    title: 'Vitals Management',
    content: 'Energy is spent working. Stress builds up from deadlines. Low energy stops you from working, and high stress leads to Burnout.',
    position: 'right'
  },
  {
    targetId: 'tutorial-secondary',
    title: 'Growth & Influence',
    content: 'Reputation increases your pay multiplier. Skill levels unlock higher tier, better paying contracts.',
    position: 'right'
  },
  {
    targetId: 'tutorial-penalties',
    title: 'Risks & Strikes',
    content: 'Burnout happens at 100% stress, locking you from work for 3 days. Rent Strikes occur when you can\'t pay rent. 2 strikes and you\'re evicted!',
    position: 'right'
  },
  {
    targetId: 'tutorial-upgrades',
    title: 'Gear Up',
    content: 'Invest your hard-earned cash in better equipment. Better gear reduces stress, saves energy, or doubles your income.',
    position: 'right'
  },
  {
    targetId: 'tutorial-job-board',
    title: 'Job Board',
    content: 'This is your income source. Easy jobs are safe; Hard jobs pay huge but carry high failure risk and stress.',
    position: 'left20'
  },
  {
    targetId: 'tutorial-routine',
    title: 'Daily Routine',
    content: 'Manage your day here. Rest at home for free, or pay for a Cafe break to reduce stress quickly. Study to increase your skill level.',
    position: 'left'
  },
  {
    targetId: 'tutorial-feed',
    title: 'Activity Feed',
    content: 'Watch this area for random events, client feedback, and system messages. It keeps you informed of everything happening in your nomad life.',
    position: 'left'
  }
];

const App: React.FC = () => {
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [gameStatus, setGameStatus] = useState<GameStatus>('PLAYING');
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [logs, setLogs] = useState<string[]>(["Welcome to Nomad Life. Reach 1,000,000 ฿ to retire."]);
  const [horoscope, setHoroscope] = useState<string>("Initializing...");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  
  // Custom Popup States
  const [showRestartPopup, setShowRestartPopup] = useState(false);
  const [showRentWarning, setShowRentWarning] = useState(false);
  const [showBurnoutAlert, setShowBurnoutAlert] = useState(false);
  const [workResult, setWorkResult] = useState<WorkResult | null>(null);

  // Leaderboard States
  const [playerName, setPlayerName] = useState('');
  const [isLeaderboardSaved, setIsLeaderboardSaved] = useState(false);

  const jobPool = useMemo(() => generateJobs(), []);

  // Use a ref to store the pinned ID to avoid dependency loops in refreshJobs
  const pinnedIdRef = useRef<string | null>(null);
  useEffect(() => {
    pinnedIdRef.current = stats.pinnedJobId;
  }, [stats.pinnedJobId]);

  const refreshJobs = useCallback((day: number) => {
    setAvailableJobs(prev => {
      const dailyJobs: Job[] = [];
      const count = 4;
      const currentPinnedId = pinnedIdRef.current;
      
      if (currentPinnedId) {
        const pinnedJob = prev.find(j => j.id === currentPinnedId) || jobPool.find(j => j.id === currentPinnedId);
        if (pinnedJob) {
          dailyJobs.push(pinnedJob);
        }
      }

      const doablePool = jobPool.filter(j => 
        !dailyJobs.some(dj => dj.id === j.id)
      );
      
      if (doablePool.length > 0 && dailyJobs.length < count) {
        const guaranteed = doablePool[Math.floor(Math.random() * doablePool.length)];
        dailyJobs.push(guaranteed);
      }

      if (day <= 3 && !dailyJobs.some(j => j.tier === JobTier.EASY)) {
        const easyPool = jobPool.filter(j => 
          j.tier === JobTier.EASY && 
          !dailyJobs.some(dj => dj.id === j.id)
        );
        if (easyPool.length > 0) {
          const randomEasy = easyPool[Math.floor(Math.random() * easyPool.length)];
          dailyJobs.push(randomEasy);
        }
      }

      while (dailyJobs.length < count) {
        const randomJob = jobPool[Math.floor(Math.random() * jobPool.length)];
        if (!dailyJobs.some(j => j.id === randomJob.id)) {
          dailyJobs.push(randomJob);
        }
      }

      return dailyJobs.sort((a, b) => {
        if (a.id === currentPinnedId) return -1;
        if (b.id === currentPinnedId) return 1;
        return 0;
      });
    });
  }, [jobPool]);

  useEffect(() => {
    refreshJobs(stats.day);
    const updateHoro = async () => {
      const msg = await getDailyHoroscope(stats.day);
      setHoroscope(msg);
    };
    updateHoro();
  }, [stats.day, refreshJobs]);

  // Check if it's the first time
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('nomad_tutorial_seen');
    if (!hasSeenTutorial) {
      setTutorialStep(0);
    }
  }, []);

  useEffect(() => {
    if (workResult) {
      const timer = setTimeout(() => {
        setWorkResult(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [workResult]);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 100));
  };

  const checkGameEnd = (currentStats: PlayerStats) => {
    if (currentStats.money >= WIN_GOAL) setGameStatus('WIN');
    else if (currentStats.unpaidRents >= 2) setGameStatus('FAIL_MONEY');
    else if (currentStats.burnoutCount >= MAX_BURNOUTS) setGameStatus('FAIL_BURNOUT');
  };

  const addTime = (hours: number) => {
    setStats(prev => {
      let nextStats = { ...prev };
      let totalHours = prev.currentTime + hours;
      while (totalHours >= 24) {
        nextStats.day += 1;
        totalHours -= 24;
        
        const currentRent = nextStats.rentalLevel >= 2 ? LUXURY_RENT : BASE_RENT;
        const daysUntilRent = RENT_INTERVAL - (nextStats.day % RENT_INTERVAL);

        if (daysUntilRent === 2) {
          setShowRentWarning(true);
        }
        
        if (nextStats.day % RENT_INTERVAL === 0) {
          if (nextStats.money >= currentRent) {
            nextStats.money -= currentRent;
            addLog(`RENT PAID: -${currentRent} ฿.`);
          } else {
            nextStats.unpaidRents += 1;
            addLog(`WARNING: Could not pay rent! Unpaid: ${nextStats.unpaidRents}/2 strikes.`);
          }
        }

        if (nextStats.pinnedJobId) {
          const remaining = (nextStats.pinHistory[nextStats.pinnedJobId] !== undefined ? nextStats.pinHistory[nextStats.pinnedJobId] : 3) - 1;
          nextStats.pinHistory = { ...nextStats.pinHistory, [nextStats.pinnedJobId]: remaining };
          if (remaining <= 0) {
            addLog(`Pinned Job expired!`);
            nextStats.pinnedJobId = null;
          }
        }

        if (nextStats.isBurnedOut) {
          nextStats.burnoutRemaining -= 1;
          if (nextStats.burnoutRemaining <= 0) {
            nextStats.isBurnedOut = false;
            addLog("Recovered from Burnout!");
          }
        }
        nextStats.energy = Math.min(100, nextStats.energy + (nextStats.isBurnedOut ? 20 : 10));
        if (!nextStats.isBurnedOut && Math.random() < 0.20) {
          const isPositive = Math.random() > 0.5;
          const eventPool = isPositive ? POSITIVE_EVENTS : NEGATIVE_EVENTS;
          const event = eventPool[Math.floor(Math.random() * eventPool.length)];
          const { stats: updated, log } = event.effect(nextStats);
          addLog(`EVENT: ${event.title} - ${log}`);
          nextStats = { ...nextStats, ...updated };
        }
        nextStats.history = [...nextStats.history, { day: nextStats.day, money: nextStats.money, stress: nextStats.stress }];
        addLog(`--- Day ${nextStats.day} begins ---`);
      }
      nextStats.currentTime = totalHours;
      checkGameEnd(nextStats);
      return nextStats;
    });
  };

  const handleRestHome = () => {
    if (stats.energy >= 100 && stats.stress <= 0) return addLog("You are perfectly fine.");
    setStats(prev => ({
      ...prev,
      energy: Math.min(100, prev.energy + 40),
      stress: Math.max(0, prev.stress - 15),
    }));
    addLog(`Rested at Home.`);
    addTime(stats.rentalLevel >= 2 ? 6 : 8);
  };

  const handleRestCafe = () => {
    const cost = 150;
    if (stats.money < cost) return addLog("Not enough money for the cafe.");
    setStats(prev => ({
      ...prev,
      money: prev.money - cost,
      energy: Math.min(100, prev.energy + 15),
      stress: Math.max(0, prev.stress - 25),
    }));
    addLog(`Rested at Cafe.`);
    addTime(2);
  };

  const handleStudy = () => {
    const cost = 800 * stats.skillLevel;
    const energyCost = 30;
    if (stats.money < cost) return addLog("Not enough money for the course.");
    if (stats.energy < energyCost) return addLog("Too tired to study.");

    setStats(prev => ({
      ...prev,
      money: prev.money - cost,
      energy: prev.energy - energyCost,
      skillLevel: prev.skillLevel + 1,
      stress: Math.min(100, prev.stress + 8)
    }));
    addLog(`Course complete! Skill Level: ${stats.skillLevel + 1}.`);
    addTime(4);
  };

  const handlePinJob = (jobId: string) => {
    setStats(prev => {
      if (prev.pinnedJobId === jobId) {
        return { ...prev, pinnedJobId: null };
      }
      const history = { ...prev.pinHistory };
      if (history[jobId] === undefined) history[jobId] = 3;
      return { ...prev, pinnedJobId: jobId, pinHistory: history };
    });
  };

  const handleWork = async (job: Job) => {
    if (stats.energy < job.energyCost) return addLog("Too exhausted.");
    if (stats.skillLevel < job.minSkill) return addLog("Not enough skill.");

    setIsProcessing(true);
    const energyCost = stats.equipmentLevel >= 2 ? job.energyCost * 0.85 : job.energyCost;
    const incomeMult = (stats.equipmentLevel >= 4 ? 2 : 1) * (1 + stats.reputation / 1000);
    const skillBonus = (stats.skillLevel - job.minSkill) * 0.08; 
    const finalFailProb = Math.max(0.01, job.failProb - skillBonus);
    const isSuccess = Math.random() > finalFailProb;

    const feedback = await getClientFeedback(job.title, isSuccess);
    const pay = isSuccess ? Math.floor(job.pay * incomeMult) : 0;
    const repChange = isSuccess ? job.repGain : -Math.floor(job.repGain * 1.5);

    setStats(prev => {
      let nextMoney = prev.money + pay;
      let nextRep = Math.max(0, prev.reputation + repChange);
      let nextStress = Math.min(100, prev.stress + job.stressGain);
      let nextBurnoutCount = prev.burnoutCount;
      let nextIsBurnedOut = prev.isBurnedOut;
      let nextBurnoutRemaining = prev.burnoutRemaining;
      let nextPinnedJobId = prev.pinnedJobId;

      if (nextStress >= 100) {
        nextBurnoutCount += 1;
        nextIsBurnedOut = true;
        nextBurnoutRemaining = 3;
        nextStress = 0; 
        addLog(`CRITICAL COLLAPSE #${nextBurnoutCount}!`);
        setShowBurnoutAlert(true);
      }

      return {
        ...prev,
        money: nextMoney,
        reputation: nextRep,
        energy: Math.max(0, prev.energy - energyCost),
        stress: nextStress,
        burnoutCount: nextBurnoutCount,
        isBurnedOut: nextIsBurnedOut,
        burnoutRemaining: nextBurnoutRemaining,
        pinnedJobId: nextPinnedJobId
      };
    });

    setWorkResult({
      success: isSuccess,
      jobTitle: job.title,
      pay,
      repChange,
      feedback
    });

    addLog(isSuccess ? `PAID: ${pay} ฿` : `FAILED: No pay.`);
    addTime(job.timeHours);
    setIsProcessing(false);
  };

  const buyUpgrade = (upgrade: Upgrade, type: 'gear' | 'lifestyle') => {
    if (stats.money < upgrade.price) return addLog("Not enough funds.");
    
    if (type === 'gear') {
      if (stats.equipmentLevel >= upgrade.level) return addLog("Already owned.");
      if (upgrade.level > stats.equipmentLevel + 1) return addLog(`Buy ${UPGRADES[stats.equipmentLevel].name} first!`);
      setStats(prev => ({ ...prev, money: prev.money - upgrade.price, equipmentLevel: upgrade.level }));
    } else {
      if (stats.rentalLevel >= upgrade.level) return addLog("Already owned.");
      setStats(prev => ({ ...prev, money: prev.money - upgrade.price, rentalLevel: upgrade.level }));
    }
    addLog(`Upgraded to ${upgrade.name}!`);
  };

  const resetGame = () => {
    pinnedIdRef.current = null;
    setStats(INITIAL_STATS);
    setGameStatus('PLAYING');
    setLogs(["Game Restarted. Welcome back to the grind."]);
    setShowRestartPopup(false);
    setShowRentWarning(false);
    setShowBurnoutAlert(false);
    setWorkResult(null);
    setPlayerName('');
    setIsLeaderboardSaved(false);
    refreshJobs(1);
  };

  const saveToLeaderboard = () => {
    if (!playerName.trim()) return;
    const typeMap = { 'WIN': 'GOOD', 'FAIL_MONEY': 'BAD', 'FAIL_BURNOUT': 'SAD' };
    const entry: LeaderboardEntry = {
      name: playerName,
      day: stats.day,
      type: typeMap[gameStatus as keyof typeof typeMap] as any
    };
    const currentBoard = JSON.parse(localStorage.getItem('nomad_leaderboard') || '[]');
    currentBoard.push(entry);
    localStorage.setItem('nomad_leaderboard', JSON.stringify(currentBoard));
    setIsLeaderboardSaved(true);
  };

  const getLeaderboard = (type: 'GOOD' | 'BAD' | 'SAD') => {
    const board: LeaderboardEntry[] = JSON.parse(localStorage.getItem('nomad_leaderboard') || '[]');
    const filtered = board.filter(e => e.type === type);
    if (type === 'GOOD') return filtered.sort((a, b) => a.day - b.day).slice(0, 3);
    else return filtered.sort((a, b) => b.day - a.day).slice(0, 3);
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours) % 24;
    return `${h.toString().padStart(2, '0')}:00`;
  };

  const currentRentCost = stats.rentalLevel >= 2 ? LUXURY_RENT : BASE_RENT;
  const repBonusPercent = Math.round(stats.reputation / 10);
  const daysUntilRent = RENT_INTERVAL - (stats.day % RENT_INTERVAL);

  const startTutorial = () => {
    setTutorialStep(0);
  };

  const nextTutorial = () => {
    if (tutorialStep !== null) {
      if (tutorialStep >= TUTORIAL_STEPS.length - 1) {
        setTutorialStep(null);
        localStorage.setItem('nomad_tutorial_seen', 'true');
      } else {
        setTutorialStep(tutorialStep + 1);
      }
    }
  };

  const skipTutorial = () => {
    setTutorialStep(null);
    localStorage.setItem('nomad_tutorial_seen', 'true');
  };

  const currentTutoStep = tutorialStep !== null ? TUTORIAL_STEPS[tutorialStep] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative overflow-hidden">
      
      {/* Tutorial Overlay */}
      {tutorialStep !== null && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Blackout with "hole" logic via z-index on targets */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto" onClick={nextTutorial}></div>
          
          <div className={`fixed z-[110] pointer-events-auto transition-all duration-300 ${
            currentTutoStep?.position === 'center' 
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' 
            : currentTutoStep?.position === 'right'
            ? 'top-1/4 left-[340px]'
            : currentTutoStep?.position === 'left20'
            ? 'top-1/4 right-[20%]'
            : currentTutoStep?.position === 'left'
            ? 'top-1/4 right-[40%]'
            : 'top-1/2 left-1/2'
          }`}>
            <div className="bg-slate-900 border-2 border-indigo-500 w-80 rounded-2xl p-6 shadow-2xl animate-in zoom-in duration-300">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="text-indigo-400 font-black uppercase text-xs tracking-widest">{currentTutoStep?.title}</h4>
                 <span className="text-[10px] text-slate-500 font-mono">{tutorialStep + 1} / {TUTORIAL_STEPS.length}</span>
               </div>
               <p className="text-sm text-slate-300 leading-relaxed mb-6">
                 {currentTutoStep?.content}
               </p>
               <div className="flex gap-2">
                 <button onClick={nextTutorial} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition-all">
                    {tutorialStep >= TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
                 </button>
                 <button onClick={skipTutorial} className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-2 rounded-xl text-xs transition-all">
                    Skip
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <aside className={`w-full md:w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-5 sticky top-0 h-auto md:h-screen overflow-y-auto ${tutorialStep > 0 && tutorialStep < 7 ? 'z-[110]':'z-20'} custom-scrollbar`}>
        <div id="tutorial-day-time" className={`flex items-center justify-between rounded-lg p-1 transition-all ${tutorialStep === 1 ? 'z-[110] relative bg-slate-900 ring-4 ring-indigo-500/50' : ''}`}>
          <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Vitals</h2>
          <div className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
            Day {stats.day} • {formatTime(stats.currentTime)}
          </div>
        </div>
        
        <div id="tutorial-money" className={`bg-slate-950 p-4 rounded-xl border border-slate-800 group transition-all hover:border-emerald-500/50 ${tutorialStep === 2 ? 'z-[110] relative ring-4 ring-indigo-500/50 bg-slate-950' : ''}`}>
          <span className="text-xs text-slate-400 block mb-1 uppercase tracking-tighter">Bank Balance</span>
          <div className="text-2xl font-mono text-emerald-400 font-bold flex items-baseline gap-2">
            {stats.money.toLocaleString()} <span className="text-sm opacity-50">฿</span>
          </div>
        </div>
        
        <div id="tutorial-vitals" className={`space-y-3 rounded-lg p-1 transition-all ${tutorialStep === 3 ? 'z-[110] relative bg-slate-900 ring-4 ring-indigo-500/50' : ''}`}>
          <StatBar label="Energy" value={stats.energy} max={100} color="bg-amber-500" icon="⚡" />
          <StatBar label="Stress" value={stats.stress} max={100} color="bg-rose-500" icon="🔥" />
        </div>
        
        <div id="tutorial-secondary" className={`grid grid-cols-2 gap-3 rounded-lg p-1 transition-all ${tutorialStep === 4 ? 'z-[110] relative bg-slate-900 ring-4 ring-indigo-500/50' : ''}`}>
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800 text-center">
            <span className="text-[9px] uppercase text-slate-500 block">Reputation</span>
            <span className="text-lg font-mono font-bold">{stats.reputation}</span>
            <span className="text-[8px] text-emerald-400 font-black">+{repBonusPercent}% Pay</span>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800 text-center">
            <span className="text-[9px] uppercase text-slate-500 block">Skill</span>
            <span className="text-lg font-mono font-bold">{stats.skillLevel}</span>
          </div>
        </div>

        <div id="tutorial-penalties" className={`grid grid-cols-2 gap-3 rounded-lg p-1 transition-all ${tutorialStep === 5 ? 'z-[110] relative bg-slate-900 ring-4 ring-indigo-500/50' : ''}`}>
          <div className="bg-slate-800/20 p-3 rounded-lg border border-rose-500/20 text-center">
            <span className="text-[9px] uppercase text-slate-500 block font-bold">Burnout</span>
            <div className="flex items-center justify-center gap-1 mt-1">
               {[...Array(MAX_BURNOUTS)].map((_, i) => (
                 <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < stats.burnoutCount ? 'bg-rose-500 shadow-lg shadow-rose-500/40' : 'bg-slate-700'}`}></div>
               ))}
            </div>
          </div>
          <div className="bg-slate-800/20 p-3 rounded-lg border border-amber-500/20 text-center">
            <span className="text-[9px] uppercase text-slate-500 block font-bold">Rent Strike</span>
            <div className="flex items-center justify-center gap-1 mt-1">
               {[...Array(2)].map((_, i) => (
                 <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < stats.unpaidRents ? 'bg-amber-500 shadow-lg shadow-amber-500/40' : 'bg-slate-700'}`}></div>
               ))}
            </div>
          </div>
        </div>

        <section className="bg-slate-950 p-3 rounded-xl border border-slate-800">
           <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Profitability</h3>
           <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.history}>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '8px' }}
                    labelFormatter={(day) => `Day ${day}`}
                  />
                  <Line type="monotone" dataKey="money" stroke="#10b981" strokeWidth={2} dot={false} animationDuration={500} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </section>

        <section id="tutorial-upgrades" className={`space-y-3 rounded-lg p-1 transition-all ${tutorialStep === 6 ? 'z-[110] relative bg-slate-900 ring-4 ring-indigo-500/50' : ''}`}>
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Upgrades</h3>
          <div className="space-y-2">
            {UPGRADES.slice(1).map((u) => {
              const isLocked = u.level > stats.equipmentLevel + 1;
              const isOwned = stats.equipmentLevel >= u.level;
              const canAfford = stats.money >= u.price;
              return (
                <button 
                  key={u.id}
                  disabled={isOwned || !canAfford || isLocked}
                  onClick={() => buyUpgrade(u, 'gear')}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all relative ${
                    isOwned 
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : !isLocked && canAfford
                    ? 'bg-slate-800 border-indigo-500/30 hover:border-indigo-500'
                    : 'bg-slate-800/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-300 truncate">{u.name}</span>
                    <span className={`text-[9px] font-mono ${isOwned ? 'text-emerald-400' : canAfford ? 'text-indigo-400' : 'text-rose-500/60'}`}>
                      {isOwned ? 'OWNED' : `฿${u.price}`}
                    </span>
                  </div>
                  {!isOwned && !isLocked && (
                    <div className="text-[7px] text-slate-500 mt-0.5 line-clamp-1">{u.perks}</div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-auto pt-4 space-y-3">
          <div className="bg-slate-800/30 p-4 rounded-xl text-[10px] italic border-l-2 border-indigo-500 leading-relaxed text-slate-400">
             &ldquo;{horoscope}&rdquo;
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={startTutorial} className="w-full bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-400 text-[10px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 border border-indigo-500/20">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Play Tutorial
            </button>
            <button onClick={() => setShowRestartPopup(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold py-2 rounded-lg transition-all">
              Restart Game
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 flex flex-col gap-8 max-w-5xl mx-auto w-full">
        {gameStatus !== 'PLAYING' ? (
           <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in duration-500 h-full overflow-y-auto custom-scrollbar p-4">
             <div className="max-w-xl w-full bg-slate-900 rounded-3xl p-8 md:p-10 text-center border border-slate-800 shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-slate-800/20 to-transparent pointer-events-none"></div>
               <div className="text-7xl mb-6 drop-shadow-lg">
                 {gameStatus === 'WIN' ? '🏖️' : gameStatus === 'FAIL_BURNOUT' ? '🥩' : '🏘️'}
               </div>
               <h1 className="text-4xl font-black mb-2 tracking-tight">
                 {gameStatus === 'WIN' ? 'Millionaire!' : gameStatus === 'FAIL_BURNOUT' ? 'Permanent Burnout' : 'Evicted'}
               </h1>
               <div className="mb-6 inline-flex items-center gap-2 text-xs font-mono font-bold bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-indigo-400">
                  Day {stats.day} • {stats.history.length} Days Survived
               </div>
               
               {!isLeaderboardSaved ? (
                 <div className="mb-8 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                   <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-4">Save your legacy</p>
                   <div className="flex flex-col sm:flex-row gap-2">
                     <input type="text" placeholder="Your Name" maxLength={12} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
                     <button onClick={saveToLeaderboard} disabled={!playerName.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-bold py-3 px-6 rounded-xl transition-all">Save Score</button>
                   </div>
                 </div>
               ) : (
                 <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-2"><span className="text-amber-500">🏆</span> TOP 3 LEADERBOARD</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(['GOOD', 'BAD', 'SAD'] as const).map(type => (
                        <div key={type} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                          <div className="text-[10px] font-black uppercase tracking-tighter text-slate-500 mb-3">{type} ENDINGS</div>
                          <div className="space-y-2">
                            {getLeaderboard(type).length > 0 ? getLeaderboard(type).map((e, i) => (
                              <div key={i} className="flex justify-between items-center text-xs">
                                <span className="text-slate-300 font-bold max-w-[80px] truncate">{i+1}. {e.name}</span>
                                <span className="text-indigo-400 font-mono">Day {e.day}</span>
                              </div>
                            )) : <div className="text-[10px] text-slate-600">No records yet</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                 {gameStatus === 'WIN' && "You've retired to a tropical beach. No more standups. No more merge conflicts. You stayed a nomad for a record time!"}
                 {gameStatus === 'FAIL_MONEY' && "You couldn't cover the rent. The landlord changed the locks while you were coding at a cafe. You moved back home."}
                 {gameStatus === 'FAIL_BURNOUT' && "Your brain hit a wall. You've retired from coding to sell meatballs on a street corner. Total burnout attained."}
               </p>
               <button onClick={resetGame} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all active:scale-95">New Career Start</button>
             </div>
           </div>
        ) : (
          <>
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div id="tutorial-welcome">
                <h1 className="text-3xl font-extrabold tracking-tight">Digital Nomad Simulator</h1>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-slate-500 text-sm">Active Gear:</span>
                   <span className="text-indigo-400 text-sm font-semibold">{UPGRADES[stats.equipmentLevel-1].name}</span>
                   <span className={`ml-4 text-xs font-mono font-bold ${daysUntilRent === 1 ? 'text-rose-500 animate-pulse' : 'text-emerald-400/80'}`}>
                     Rent Due: In {daysUntilRent} Days (฿{currentRentCost.toLocaleString()})
                   </span>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section id="tutorial-job-board" className={`flex flex-col rounded-2xl p-2 transition-all ${tutorialStep === 7 ? 'z-[110] relative bg-slate-950 ring-4 ring-indigo-500/50' : ''}`}>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-xl font-bold">Contract Board</h3>
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Daily Selection</span>
                </div>
                <div className="grid gap-4">
                  {availableJobs.map((job) => {
                    const isPinned = stats.pinnedJobId === job.id;
                    const pinsLeft = stats.pinHistory[job.id] !== undefined ? stats.pinHistory[job.id] : 3;
                    const skillBonus = (stats.skillLevel - job.minSkill) * 0.08;
                    const displayRisk = Math.round(Math.max(1, (job.failProb - skillBonus) * 100));
                    const canDoSkill = stats.skillLevel >= job.minSkill;
                    const scaledPay = Math.floor((job.pay * (stats.equipmentLevel >= 4 ? 2 : 1)) * (1 + stats.reputation / 1000));
                    
                    return (
                      <div key={job.id} className={`p-5 rounded-2xl border bg-slate-900/40 transition-all group ${!canDoSkill ? 'opacity-40 grayscale pointer-events-none' : 'hover:border-indigo-500/50 hover:bg-slate-900/60'} border-slate-800 relative ${isPinned ? 'ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/10' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${job.tier === JobTier.EASY ? 'bg-emerald-500 text-emerald-950' : job.tier === JobTier.MEDIUM ? 'bg-blue-500 text-blue-950' : 'bg-rose-500 text-rose-950'}`}>{job.tier}</span>
                            <h4 className="text-base font-bold mt-2 text-slate-100 group-hover:text-white flex items-center gap-2">
                              {job.title}
                              {isPinned && <span className="text-[10px] bg-indigo-500 text-white px-1.5 rounded uppercase font-bold animate-pulse">Pinned ({pinsLeft}d)</span>}
                            </h4>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400 font-mono font-bold text-lg">{scaledPay.toLocaleString()} ฿</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Risk: {displayRisk}%</div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed line-clamp-2">{job.description}</p>
                        <div className="grid grid-cols-4 gap-2 mb-4 text-[10px] uppercase font-bold text-slate-500">
                          <div className="bg-slate-800/50 p-1.5 rounded text-center">⚡ {Math.round(stats.equipmentLevel >= 2 ? job.energyCost * 0.85 : job.energyCost)}</div>
                          <div className="bg-slate-800/50 p-1.5 rounded text-center">🔥 {job.stressGain}</div>
                          <div className="bg-slate-800/50 p-1.5 rounded text-center">🕒 {job.timeHours}h</div>
                          <div className="bg-slate-800/50 p-1.5 rounded text-center">🏆 Skl {job.minSkill}</div>
                        </div>
                        <div className="flex gap-2">
                          <button disabled={!canDoSkill || isProcessing} onClick={() => handleWork(job)} className="flex-1 bg-slate-800 hover:bg-indigo-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed">Execute Contract</button>
                          <button 
                            onClick={() => handlePinJob(job.id)}
                            className={`px-4 rounded-xl transition-all border ${isPinned ? 'bg-indigo-600 border-indigo-500 text-white shadow-inner' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                            title={isPinned ? "Unpin Job" : "Pin Job for 3 days"}
                          >
                            <svg className="w-4 h-4" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="flex flex-col gap-8">
                <section id="tutorial-routine" className={`bg-slate-900/40 rounded-3xl p-6 border border-slate-800 transition-all ${tutorialStep === 8 ? 'z-[110] relative bg-slate-900 ring-4 ring-indigo-500/50' : ''}`}>
                  <h3 className="text-xl font-bold mb-4">Daily Routine</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <button disabled={isProcessing} onClick={handleRestHome} className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-800 hover:border-emerald-500/30 transition-all active:scale-[0.99] group">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl group-hover:scale-110 transition-transform">🛏️</div>
                        <div className="text-left">
                          <div className="text-xs font-black uppercase">Home Rest</div>
                          <div className="text-[9px] text-slate-500">Energy +40, Stress -15</div>
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-mono text-amber-400">🕒 {stats.rentalLevel >= 2 ? 6 : 8}h • ฿0</div>
                    </button>

                    <button disabled={isProcessing} onClick={handleRestCafe} className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-800 hover:border-emerald-500/30 transition-all active:scale-[0.99] group">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl group-hover:scale-110 transition-transform">☕</div>
                        <div className="text-left">
                          <div className="text-xs font-black uppercase">Cafe Break</div>
                          <div className="text-[9px] text-slate-500">Energy +15, Stress -25</div>
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-mono text-emerald-400">🕒 2h • ฿150</div>
                    </button>

                    <button disabled={isProcessing} onClick={handleStudy} className="bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-800 hover:border-indigo-500/30 transition-all active:scale-[0.99] group">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl group-hover:scale-110 transition-transform">🎓</div>
                        <div className="text-left">
                          <div className="text-xs font-black uppercase">Study Course</div>
                          <div className="text-[9px] text-slate-500">Skill Level +1, Stress +8</div>
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-mono text-indigo-400">🕒 4h • ฿{Math.floor(800 * stats.skillLevel)}</div>
                    </button>
                  </div>
                </section>

                <section id="tutorial-feed" className={`bg-slate-900/60 rounded-3xl p-8 border border-slate-800 flex flex-col flex-1 min-h-[300px] transition-all ${tutorialStep === 9 ? 'z-[110] relative bg-slate-900 ring-4 ring-indigo-500/50' : ''}`}>
                  <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-6">Activity Feed</h3>
                  <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar font-mono text-[11px]">
                    <div className="space-y-2">
                      {logs.slice(0, 100).map((log, i) => (
                        <div key={i} className={`p-2 rounded-lg transition-colors ${i === 0 ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500' : 'text-slate-500 opacity-80'}`}>
                          <span className="opacity-30 mr-2">[{stats.day}]</span>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </main>

      {showRestartPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200 text-center">
            <h3 className="text-2xl font-bold mb-2">Restart Game?</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">Your current progress and savings will be permanently lost.</p>
            <div className="flex flex-col gap-3">
              <button onClick={resetGame} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all">Yes, Restart Grind</button>
              <button onClick={() => setShowRestartPopup(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRentWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 w-full max-w-sm rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-in zoom-in duration-300 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-2xl font-black mb-2 text-amber-500 uppercase tracking-tight">Rent Warning!</h3>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
              Your landlord is knocking on the digital door. You have <span className="text-amber-400 font-bold">2 days</span> left to ensure your balance covers the <span className="text-amber-400 font-bold">฿{currentRentCost.toLocaleString()}</span> rent.
            </p>
            <button onClick={() => setShowRentWarning(false)} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-amber-900/40">Got it, back to the grind</button>
          </div>
        </div>
      )}

      {showBurnoutAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border-2 border-rose-500/50 w-full max-w-sm rounded-3xl p-8 shadow-[0_0_50px_rgba(244,63,94,0.3)] animate-in zoom-in duration-300 text-center">
            <div className="text-5xl mb-4">🤯</div>
            <h3 className="text-2xl font-black mb-2 text-rose-500 uppercase tracking-tight">Major Burnout!</h3>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
              Your brain has officially entered "Read-Only" mode. Stress hit the limit. You are <span className="text-rose-400 font-bold">unable to work for 3 days</span> while you recover.
            </p>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 mb-8">
               <span className="text-[10px] text-slate-500 uppercase block mb-1">Burnout Stacks</span>
               <div className="flex justify-center gap-2">
                 {[...Array(MAX_BURNOUTS)].map((_, i) => (
                    <div key={i} className={`h-2 w-8 rounded-full ${i < stats.burnoutCount ? 'bg-rose-500' : 'bg-slate-800'}`}></div>
                 ))}
               </div>
            </div>
            <button onClick={() => setShowBurnoutAlert(false)} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-rose-900/40">Resting... reluctantly</button>
          </div>
        </div>
      )}

      <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 transform ${workResult ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
        {workResult && (
          <div className="bg-slate-900 border border-slate-700 w-full max-w-[320px] rounded-2xl p-5 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 h-1 bg-indigo-500 animate-[progress_4.5s_linear_forwards]"></div>
            <div className="flex items-center justify-between mb-3">
               <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${workResult.success ? 'bg-emerald-500 text-emerald-950' : 'bg-rose-500 text-rose-950'}`}>{workResult.success ? 'Success' : 'Failure'}</span>
               <button onClick={() => setWorkResult(null)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>
            <div className="mb-4">
              <p className="text-sm font-bold truncate text-slate-200">{workResult.jobTitle}</p>
              <p className="text-[10px] text-slate-400 italic mt-1 leading-tight line-clamp-2">&ldquo;{workResult.feedback}&rdquo;</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
                <span className="text-[8px] text-slate-500 uppercase font-bold block">Payment</span>
                <span className={`text-xs font-mono font-bold ${workResult.pay > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{workResult.pay > 0 ? `+${workResult.pay}` : '0'} ฿</span>
              </div>
              <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
                <span className="text-[8px] text-slate-500 uppercase font-bold block">Rep</span>
                <span className={`text-xs font-mono font-bold ${workResult.repChange >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>{workResult.repChange >= 0 ? `+${workResult.repChange}` : workResult.repChange}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default App;
