
export enum JobTier {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface Job {
  id: string;
  title: string;
  tier: JobTier;
  pay: number;
  energyCost: number;
  stressGain: number;
  repGain: number;
  minSkill: number;
  failProb: number;
  description: string;
  timeHours: number;
}

export enum LocationType {
  RENTAL = 'Rental',
  CAFE = 'Co-working Cafe',
  COURSES = 'Online Academy'
}

export interface Upgrade {
  id: string;
  name: string;
  level: number;
  price: number;
  perks: string;
  effect: (p: PlayerStats) => PlayerStats;
}

export interface PlayerStats {
  money: number;
  energy: number;
  stress: number;
  reputation: number;
  skillLevel: number;
  day: number;
  currentTime: number; // 0 to 24
  burnoutCount: number;
  equipmentLevel: number;
  rentalLevel: number; // 1: Rat Hole, 2: Luxury Studio
  unpaidRents: number;
  isBurnedOut: boolean;
  burnoutRemaining: number;
  pinnedJobId: string | null;
  pinHistory: Record<string, number>; // JobID -> Days remaining
  history: { day: number; money: number; stress: number }[];
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'negative';
  effect: (p: PlayerStats) => { stats: PlayerStats; log: string };
}

export type GameStatus = 'PLAYING' | 'WIN' | 'FAIL_MONEY' | 'FAIL_BURNOUT';

export interface WorkResult {
  success: boolean;
  jobTitle: string;
  pay: number;
  repChange: number;
  feedback: string;
}

export interface LeaderboardEntry {
  name: string;
  day: number;
  type: 'GOOD' | 'BAD' | 'SAD';
}
