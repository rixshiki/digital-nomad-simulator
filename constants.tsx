
import { Job, JobTier, RandomEvent, Upgrade } from './types';

export const BASE_RENT = 2000;
export const LUXURY_RENT = 10000;
export const RENT_INTERVAL = 10;
export const WIN_GOAL = 1000000;
export const MAX_BURNOUTS = 3;

export const UPGRADES: Upgrade[] = [
  {
    id: 'u1',
    name: 'Ancient Laptop',
    level: 1,
    price: 0,
    perks: 'Slow work speed, Stress builds up quickly.',
    effect: (p) => p,
  },
  {
    id: 'u2',
    name: 'Mechanical Keyboard',
    level: 2,
    price: 2500,
    perks: 'Faster typing (Reduced Energy consumption by 15%).',
    effect: (p) => ({ ...p, equipmentLevel: 2 }),
  },
  {
    id: 'u3',
    name: 'Ergonomic Chair',
    level: 3,
    price: 8000,
    perks: 'Reduces the frequency of "Back Pain" random events.',
    effect: (p) => ({ ...p, equipmentLevel: 3 }),
  },
  {
    id: 'u4',
    name: 'MacBook Pro',
    level: 4,
    price: 25000,
    perks: 'Unlocks High-end contracts with 2x Income.',
    effect: (p) => ({ ...p, equipmentLevel: 4 }),
  },
];

export const LIFESTYLE_UPGRADES: Upgrade[] = [
  {
    id: 'ls1',
    name: 'Luxury Studio',
    level: 2,
    price: 15000,
    perks: 'Optimized sleep cycle. Rest time reduced from 8h to 6h. Rent increases to ฿10,000.',
    effect: (p) => ({ ...p, rentalLevel: 2 }),
  }
];

const EASY_DATA = [
  { t: 'Fix Navbar CSS', d: 'The logo is overlapping the menu.' },
  { t: 'Clean Console Logs', d: 'Production is leaking dev secrets.' },
  { t: 'Update README', d: 'The setup instructions are 2 years old.' },
  { t: 'Icon Replacement', d: 'Swap all PNGs for SVGs.' },
  { t: 'Simple Bugfix', d: 'Button does nothing when clicked.' },
  { t: 'Favicon Polish', d: 'Client wants it to "pop" more.' },
  { t: 'Color Palette Edit', d: 'Marketing changed their mind again.' },
  { t: 'Form Validation', d: 'Users are entering emojis as emails.' },
  { t: 'Markdown Formatting', d: 'Fix the blog post layout.' },
  { t: 'Asset Compression', d: 'The landing page is 50MB.' }
];

const MEDIUM_DATA = [
  { t: 'React Dashboard', d: 'Build a complex data visualization view.' },
  { t: 'Auth Integration', d: 'Connect Firebase/Supabase for login.' },
  { t: 'Stripe Checkout', d: 'Implement a basic payment flow.' },
  { t: 'API Endpoint', d: 'Create a CRUD service for a mobile app.' },
  { t: 'State Refactor', d: 'Move prop-drilling hell to Redux/Zustand.' },
  { t: 'Grid Overhaul', d: 'Make the whole site truly responsive.' },
  { t: 'Unit Test Suite', d: 'Target 80% coverage on core logic.' },
  { t: 'SQL Migration', d: 'Move data from Postgres to MySQL.' },
  { t: 'Performance Audit', d: 'Improve Lighthouse score from 40 to 90.' },
  { t: 'Component Library', d: 'Standardize the UI elements.' }
];

const HARD_DATA = [
  { t: 'AI Integration Engine', d: 'LLM-powered automation for enterprise.' },
  { t: 'Blockchain Contract', d: 'Deploy a secure NFT minting contract.' },
  { t: 'Legacy Migration', d: 'Rewriting a COBOL system in Go.' },
  { t: 'Load Balancing', d: 'Scaling to 1 million concurrent users.' },
  { t: 'Security Patching', d: 'Fixing a critical zero-day exploit.' },
  { t: 'WebAssembly Core', d: 'Porting a C++ engine to the browser.' },
  { t: 'Distributed DB', d: 'Multi-region data synchronization.' },
  { t: 'Algorithm Dev', d: 'Optimizing a pathfinding system.' },
  { t: 'SaaS Architecture', d: 'Designing a multi-tenant backend.' },
  { t: 'Real-time Video', d: 'Implementing WebRTC with low latency.' }
];

export const generateJobs = (): Job[] => {
  const jobs: Job[] = [];
  for (let i = 0; i < 30; i++) {
    const base = EASY_DATA[i % EASY_DATA.length];
    jobs.push({
      id: `e-${i}`,
      title: `${base.t} (v${i+1})`,
      tier: JobTier.EASY,
      pay: 150 + Math.floor(Math.random() * 150),
      energyCost: 12,
      stressGain: 4,
      repGain: 2,
      minSkill: 1,
      failProb: 0.10, // Base fail prob
      description: base.d,
      timeHours: 2,
    });
  }
  for (let i = 0; i < 30; i++) {
    const base = MEDIUM_DATA[i % MEDIUM_DATA.length];
    jobs.push({
      id: `m-${i}`,
      title: `${base.t} (v${i+1})`,
      tier: JobTier.MEDIUM,
      pay: 900 + Math.floor(Math.random() * 1100),
      energyCost: 40,
      stressGain: 18,
      repGain: 8,
      minSkill: 3,
      failProb: 0.25,
      description: base.d,
      timeHours: 6,
    });
  }
  for (let i = 0; i < 30; i++) {
    const base = HARD_DATA[i % HARD_DATA.length];
    jobs.push({
      id: `h-${i}`,
      title: `DEADLINE: ${base.t}`,
      tier: JobTier.HARD,
      pay: 6000 + Math.floor(Math.random() * 9000),
      energyCost: 55,
      stressGain: 45,
      repGain: 25,
      minSkill: 6,
      failProb: 0.45,
      description: base.d,
      timeHours: 12,
    });
  }
  return jobs;
};

export const POSITIVE_EVENTS: RandomEvent[] = [
  { id: 'p1', title: 'Generous Tip', description: 'Client loved the docs! +500 ฿', type: 'positive', effect: (p) => ({ stats: { ...p, money: p.money + 500 }, log: 'Received 500 ฿ bonus!' }) },
  { id: 'p2', title: 'Open Source Fame', description: 'Your PR was merged into React! +20 Rep', type: 'positive', effect: (p) => ({ stats: { ...p, reputation: p.reputation + 20 }, log: 'Gained 20 Reputation!' }) },
  { id: 'p3', title: 'Coffee Gift', description: 'A stranger paid for your latte. -10 Stress', type: 'positive', effect: (p) => ({ stats: { ...p, stress: Math.max(0, p.stress - 10) }, log: 'Feeling refreshed! -10 Stress.' }) },
  { id: 'p4', title: 'Found Crypto', description: 'Found a private key in an old folder! +1200 ฿', type: 'positive', effect: (p) => ({ stats: { ...p, money: p.money + 1200 }, log: 'Cashed out 1200 ฿!' }) },
  { id: 'p5', title: 'Bug Bounty', description: 'Accidentally found a security flaw. +2000 ฿', type: 'positive', effect: (p) => ({ stats: { ...p, money: p.money + 2000 }, log: 'Bounty hunter! +2000 ฿.' }) },
  { id: 'p6', title: 'Deep Sleep', description: 'Finally got 8 hours. +40 Energy', type: 'positive', effect: (p) => ({ stats: { ...p, energy: Math.min(100, p.energy + 40) }, log: 'Woke up energized! +40 Energy.' }) },
  { id: 'p7', title: 'Streamer Shoutout', description: 'A big dev streamer liked your UI. +15 Rep', type: 'positive', effect: (p) => ({ stats: { ...p, reputation: p.reputation + 15 }, log: '+15 Reputation.' }) },
  { id: 'p8', title: 'Stack Overflow King', description: 'Your answer reached 1M people. +10 Rep', type: 'positive', effect: (p) => ({ stats: { ...p, reputation: p.reputation + 10 }, log: '+10 Reputation.' }) },
  { id: 'p9', title: 'Tax Refund', description: 'Government overcharged you last year. +800 ฿', type: 'positive', effect: (p) => ({ stats: { ...p, money: p.money + 800 }, log: '+800 ฿ refund.' }) },
  { id: 'p10', title: 'Productivity Hack', description: 'New Pomodoro technique works. -15 Stress', type: 'positive', effect: (p) => ({ stats: { ...p, stress: Math.max(0, p.stress - 15) }, log: '-15 Stress.' }) },
  { id: 'p11', title: 'Referral Bonus', description: 'Referred a friend to a gig. +1000 ฿', type: 'positive', effect: (p) => ({ stats: { ...p, money: p.money + 1000 }, log: '+1000 ฿ referral.' }) },
  { id: 'p12', title: 'Free Coworking Day', description: 'Promo at the local hub. +100 ฿', type: 'positive', effect: (p) => ({ stats: { ...p, money: p.money + 100 }, log: 'Saved 100 ฿ on fees.' }) },
  { id: 'p13', title: 'Code Refactor Success', description: 'The project is now faster. -10 Energy cost next task.', type: 'positive', effect: (p) => ({ stats: { ...p, energy: Math.min(100, p.energy + 10) }, log: '+10 Energy bonus.' }) },
  { id: 'p14', title: 'Twitter Thread Viral', description: 'Shared "10 CSS tips". +30 Rep', type: 'positive', effect: (p) => ({ stats: { ...p, reputation: p.reputation + 30 }, log: 'Social media king! +30 Rep.' }) },
  { id: 'p15', title: 'Keyboard Cleaning', description: 'Tofu crumbs removed. Satisfying. -5 Stress', type: 'positive', effect: (p) => ({ stats: { ...p, stress: Math.max(0, p.stress - 5) }, log: '-5 Stress.' }) },
  { id: 'p16', title: 'Happy Birthday', description: 'Grandma sent a card with cash. +200 ฿', type: 'positive', effect: (p) => ({ stats: { ...p, money: p.money + 200 }, log: 'Thanks Grandma! +200 ฿.' }) },
  { id: 'p17', title: 'Yoga Session', description: 'Stretched those hamstrings. +15 Energy', type: 'positive', effect: (p) => ({ stats: { ...p, energy: Math.min(100, p.energy + 15) }, log: '+15 Energy.' }) },
  { id: 'p18', title: 'Algorithm Insight', description: 'Solved it in your sleep! +1 Skill', type: 'positive', effect: (p) => ({ stats: { ...p, skillLevel: p.skillLevel + 1 }, log: '+1 Skill Level!' }) },
  { id: 'p19', title: 'Cheap Street Food', description: 'Delicious and budget-friendly. +150 ฿', type: 'positive', effect: (p) => ({ stats: { ...p, money: p.money + 150 }, log: 'Saved 150 ฿ on dinner.' }) },
  { id: 'p20', title: 'Zen State', description: 'Everything is flowing. -20 Stress', type: 'positive', effect: (p) => ({ stats: { ...p, stress: Math.max(0, p.stress - 20) }, log: 'Reached Zen. -20 Stress.' }) },
];

export const NEGATIVE_EVENTS: RandomEvent[] = [
  { id: 'n1', title: 'Laptop Coffee Spill', description: 'Urgent repair needed! -1000 ฿', type: 'negative', effect: (p) => ({ stats: { ...p, money: p.money - 1000 }, log: 'Lost 1000 ฿ on repairs.' }) },
  { id: 'n2', title: 'Back Pain Flare', description: 'Sitting too long... -20 Energy', type: 'negative', effect: (p) => {
    const energyLoss = p.equipmentLevel >= 3 ? 5 : 20;
    return { stats: { ...p, energy: Math.max(0, p.energy - energyLoss) }, log: `Ouch! -${energyLoss} Energy.` };
  }},
  { id: 'n3', title: 'Scope Creep', description: 'Client: "Just one tiny thing..." +15 Stress', type: 'negative', effect: (p) => ({ stats: { ...p, stress: Math.min(100, p.stress + 15) }, log: '+15 Stress from scope creep.' }) },
  { id: 'n4', title: 'Wi-Fi Outage', description: 'Missed a deadline meeting. -10 Rep', type: 'negative', effect: (p) => ({ stats: { ...p, reputation: Math.max(0, p.reputation - 10) }, log: 'Disconnected. -10 Rep.' }) },
  { id: 'n5', title: 'Food Poisoning', description: 'Dodgy tacos. -40 Energy', type: 'negative', effect: (p) => ({ stats: { ...p, energy: Math.max(0, p.energy - 40) }, log: 'Sick! -40 Energy.' }) },
  { id: 'n6', title: 'Gym Subscription Auto-renew', description: 'Haven\'t gone in months. -600 ฿', type: 'negative', effect: (p) => ({ stats: { ...p, money: p.money - 600 }, log: 'Gym tax. -600 ฿.' }) },
  { id: 'n7', title: 'Cloud Bill Shock', description: 'Left a GPU instance running. -1500 ฿', type: 'negative', effect: (p) => ({ stats: { ...p, money: p.money - 1500 }, log: 'Cloud costs! -1500 ฿.' }) },
  { id: 'n8', title: 'Imposter Syndrome', description: "Why am I doing this? +10 Stress", type: 'negative', effect: (p) => ({ stats: { ...p, stress: Math.min(100, p.stress + 10) }, log: '+10 Stress.' }) },
  { id: 'n9', title: 'Ghosted by Client', description: 'Wait, where is my payment? -5 Rep', type: 'negative', effect: (p) => ({ stats: { ...p, reputation: Math.max(0, p.reputation - 5) }, log: 'Client ghosted. -5 Rep.' }) },
  { id: 'n10', title: 'Stolen Charger', description: 'Left it at the cafe. -400 ฿', type: 'negative', effect: (p) => ({ stats: { ...p, money: p.money - 400 }, log: 'Bought new charger. -400 ฿.' }) },
  { id: 'n11', title: 'Carpal Tunnel', description: 'Wrist is burning. -15 Energy', type: 'negative', effect: (p) => ({ stats: { ...p, energy: Math.max(0, p.energy - 15) }, log: 'Pain! -15 Energy.' }) },
  { id: 'n12', title: 'Netflix Binge', description: 'Accidentally watched 10 hours. -30 Energy', type: 'negative', effect: (p) => ({ stats: { ...p, energy: Math.max(0, p.energy - 30) }, log: 'Binged. -30 Energy.' }) },
  { id: 'n13', title: 'Merge Conflict', description: 'Whole team pushed at once. +20 Stress', type: 'negative', effect: (p) => ({ stats: { ...p, stress: Math.min(100, p.stress + 20) }, log: 'Conflict! +20 Stress.' }) },
  { id: 'n14', title: 'Bad Review', description: 'Someone disliked your code style. -15 Rep', type: 'negative', effect: (p) => ({ stats: { ...p, reputation: Math.max(0, p.reputation - 15) }, log: '-15 Rep.' }) },
  { id: 'n15', title: 'Power Surge', description: 'Monitor fried. -2500 ฿', type: 'negative', effect: (p) => ({ stats: { ...p, money: p.money - 2500 }, log: 'New monitor. -2500 ฿.' }) },
  { id: 'n16', title: 'Family Drama', description: 'Loud phone call for 3 hours. +15 Stress', type: 'negative', effect: (p) => ({ stats: { ...p, stress: Math.min(100, p.stress + 15) }, log: 'Drama! +15 Stress.' }) },
  { id: 'n17', title: 'DDoS Attack', description: 'Your portfolio site is down. -10 Rep', type: 'negative', effect: (p) => ({ stats: { ...p, reputation: Math.max(0, p.reputation - 10) }, log: 'DDoS! -10 Rep.' }) },
  { id: 'n18', title: 'Broken Chair', description: 'Back support is gone. +10 Stress', type: 'negative', effect: (p) => ({ stats: { ...p, stress: Math.min(100, p.stress + 10) }, log: 'Uncomfortable. +10 Stress.' }) },
  { id: 'n19', title: 'Vandalism', description: 'Someone keyed your sticker-covered laptop. -300 ฿', type: 'negative', effect: (p) => ({ stats: { ...p, money: p.money - 300 }, log: '-300 ฿.' }) },
  { id: 'n20', title: 'Caffeine Withdrawal', description: 'Headache is real. -25 Energy', type: 'negative', effect: (p) => ({ stats: { ...p, energy: Math.max(0, p.energy - 25) }, log: 'No coffee! -25 Energy.' }) },
];
