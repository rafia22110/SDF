export type Grade = "א" | "ב" | "ג" | "ד" | "ה" | "ו";

export type IslandId =
  | "letters"
  | "numbers"
  | "words"
  | "science"
  | "logic"
  | "create";

export type QuestType = "daily" | "main" | "side" | "boss";

export type PartyRole = "tank" | "healer" | "dps";

export interface AvatarConfig {
  shape: number;
  color: number;
  accessory: string | null;
}

export interface Profile {
  name: string;
  grade: Grade;
  avatar: AvatarConfig;
  stars: number;
  totalStars: number;
  badges: string[];
  gamesPlayed: Record<string, number>;
  bestScores: Record<string, number>;
  islandsVisited: IslandId[];
  createdAt: number;
  lastPlayedDay: string;
  streak: number;
  ownedAccessories: string[];
  todayCount: number;
  todayDay: string;
  // Gamification & RPG Pedagogy fields
  xp?: number;
  level?: number;
  hp?: number;
  partyRole?: PartyRole;
  activeBuff?: string | null;
}

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  avatar: AvatarConfig;
  stars: number;
  gamesPlayed: number;
  lastActive: string;
  isLocal?: boolean;
  partyRole?: PartyRole;
  level?: number;
}

export interface Mission {
  id: string;
  gameId: string;
  studentId: string; // "all" = whole class
  assignedAt: number;
  done: boolean;
  note?: string;
  questType?: QuestType;
  xpReward?: number;
  bossName?: string;
  bossWeakness?: string;
}

export interface ClassState {
  name: string;
  code: string;
  students: Student[];
  missions: Mission[];
  dailyGoal: number;
}

export interface AppState {
  profile: Profile | null;
  classState: ClassState;
  builds: Record<string, number[][]>;
}

/* ---------- quiz engine ---------- */

export type QuestionDisplay =
  | { kind: "emoji"; value: string }
  | { kind: "big"; value: string }
  | { kind: "clock"; h: number; m: number }
  | { kind: "sequence"; items: string[] }
  | { kind: "count"; value: string; n: number };

export interface Question {
  prompt: string;
  options: string[];
  answer: number; // index into options
  display?: QuestionDisplay;
  speak?: string;
  hint?: string;
}

export interface GameProps {
  grade: Grade;
  onExit: () => void;
  onFinish: (score: number, total: number) => void;
}

export interface GameMeta {
  id: string;
  title: string;
  desc: string;
  island: IslandId;
  emoji: string;
  skills: string;
}
