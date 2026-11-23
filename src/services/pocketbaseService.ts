import PocketBase from "pocketbase";
import { AvatarConfig, Grade, Profile, UserPlan, UserRole } from "../types";

export interface SeasonalQuestItem {
  day: number;
  id: string;
  title: string;
  desc: string;
  gameId: string;
  xpReward: number;
  starsReward: number;
  isBoss?: boolean;
  rewardSkinId?: string;
}

export interface SeasonalIslandRecord {
  id?: string;
  slug: "hanukkah-2026" | "christmas-2026" | string;
  title: string;
  language: "he" | "en";
  is_active: boolean;
  requires_registration: boolean;
  presentation_url?: string;
  quests_json: SeasonalQuestItem[];
}

export interface RegisteredAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: UserPlan;
  grade: Grade;
  class_code: string;
  xp: number;
  hp: number;
  stars: number;
  avatar_config: AvatarConfig;
  createdAt: string;
}

const PB_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_POCKETBASE_URL) ||
  "http://127.0.0.1:8090";

export const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const LOCAL_AUTH_KEY = "iyey_or_pb_account_v1";
const LOCAL_PROGRESS_KEY = "iyey_or_pb_student_progress_v1";
const LOCAL_SEASONAL_DONE_KEY = "iyey_or_seasonal_completed_v1";

export const FALLBACK_SEASONAL_ISLANDS: SeasonalIslandRecord[] = [
  {
    slug: "hanukkah-2026",
    title: "אִי הָאוֹר וְהַמַּכַּבִּים — חֲנֻכָּה תשפ״ז",
    language: "he",
    is_active: true,
    requires_registration: true,
    presentation_url:
      "https://docs.google.com/presentation/d/1Cy7VmNrRGro_EY2Rxecd4GfvFW8-riPOKxDzjdjHCOw/edit?usp=drivesdk",
    quests_json: [
      {
        day: 1,
        id: "hanukkah-candle-1",
        title: "נֵר רִאשׁוֹן: נִיצוֹץ הָאוֹתִיּוֹת בַּמְּנוֹרָה",
        desc: "זַהוּ אֶת הַנִּיקּוּד וְהָאוֹת הַפּוֹתַחַת בְּמִילֵּי חֲנֻכָּה (אוֹר, נֵר, כַּד).",
        gameId: "letters-quiz",
        xpReward: 50,
        starsReward: 5,
      },
      {
        day: 2,
        id: "hanukkah-candle-2",
        title: "נֵר שֵׁנִי: סְבִיבוֹן הַמִּסְפָּרִים בְּלוּחַ הַמֵּאָה",
        desc: "סוֹבְבוּ אֶת הַסְּבִיבוֹן הַמָּתֵמָטִי וּפִתְרוּ חִידוֹת חִיבּוּר וְחִיסּוּר עַד 20.",
        gameId: "numbers-quiz",
        xpReward: 55,
        starsReward: 6,
      },
      {
        day: 3,
        id: "hanukkah-candle-3",
        title: "נֵר שְׁלִישִׁי: בּוֹנִים מִילִּים שֶׁל גְּבוּרָה",
        desc: "הַרְכִּיבוּ מִילִּים מֵאוֹתִיּוֹת הַחַג: סְבִיבוֹן, חֲנֻכִּיָּה, מַכַּבִּים וְסוּפְגָּנִיָּה.",
        gameId: "word-builder",
        xpReward: 60,
        starsReward: 6,
      },
      {
        day: 4,
        id: "hanukkah-candle-4",
        title: "נֵר רְבִיעִי: מַעְבָּדַת הַשֶּׁמֶן הַטָּהוֹר וְהַשַּׁלְהֶבֶת",
        desc: "גַּלּוּ בַּמַּעְבָּדָה כֵּיצַד שֶׁמֶן וּפְתִילָה יוֹצְרִים אוֹר חַם וּמֵאִיר.",
        gameId: "science-lab",
        xpReward: 65,
        starsReward: 7,
      },
      {
        day: 5,
        id: "hanukkah-candle-5",
        title: "נֵר חֲמִישִׁי: מַסְלוּל רוֹבּוֹט הַמַּכַּבִּים",
        desc: "הַנְחוּ אֶת רוֹבּוֹט הָאוֹר בַּמְּבוֹךְ כְּדֵי לְהָבִיא אֶת פַּךְ הַשֶּׁמֶן לַהֵיכָל.",
        gameId: "robot-path",
        xpReward: 70,
        starsReward: 8,
      },
      {
        day: 6,
        id: "hanukkah-candle-6",
        title: "נֵר שִׁישִּׁי: קוֹרְאִים בְּקוֹל אֶת שִׁירֵי הָאוֹר",
        desc: "קִרְאוּ בְּקוֹל רָם מִשְׁפְּטֵי חֲנֻכָּה מְנוּקָּדִים וְהָאִירוּ אֶת הַכִּיתָּה.",
        gameId: "voice-read",
        xpReward: 75,
        starsReward: 8,
      },
      {
        day: 7,
        id: "hanukkah-candle-7",
        title: "נֵר שְׁבִיעִי: צִיּוּר חֲנֻכִּיַּת פִּיקְסֶל-אוֹר מְנַגֶּנֶת",
        desc: "עַצְּבוּ חֲנֻכִּיָּה זוֹהֶרֶת בִּפִיקְסֶלִים עִם מַנְגִּינַת חַג אִישִׁית.",
        gameId: "pixel-studio",
        xpReward: 80,
        starsReward: 10,
      },
      {
        day: 8,
        id: "hanukkah-candle-8-boss",
        title: "נֵר שְׁמִינִי · קְרַב בּוֹס: נִיצְחוֹן הָאוֹר עַל הַחוֹשֶׁךְ!",
        desc: "הַשְׁלִימוּ אֶת אֶתְגַּר הָאוֹר הַמְּסַכֵּם וּפִתְחוּ אֶת תַּלְבּוֹשֶׁת 'כֶּתֶר אוֹר הַמַּכַּבִּים'!",
        gameId: "balloon-pop",
        xpReward: 150,
        starsReward: 20,
        isBoss: true,
        rewardSkinId: "hanukkah-crown",
      },
    ],
  },
  {
    slug: "christmas-2026",
    title: "Winter Spark Island — Christmas 2026",
    language: "en",
    is_active: true,
    requires_registration: true,
    presentation_url:
      "https://docs.google.com/presentation/d/1Cy7VmNrRGro_EY2Rxecd4GfvFW8-riPOKxDzjdjHCOw/edit?usp=drivesdk",
    quests_json: [
      {
        day: 1,
        id: "xmas-day-1",
        title: "Day 1: Starlight Alphabet Spark",
        desc: "Match winter phonics and glowing letters.",
        gameId: "letters-quiz",
        xpReward: 45,
        starsReward: 5,
      },
      {
        day: 2,
        id: "xmas-day-2",
        title: "Day 2: Snowflake Number Count",
        desc: "Solve quick addition and clock puzzles.",
        gameId: "numbers-quiz",
        xpReward: 45,
        starsReward: 5,
      },
      {
        day: 3,
        id: "xmas-day-3",
        title: "Day 3: Frosty Word Builder",
        desc: "Assemble joyful holiday words from glowing tiles.",
        gameId: "word-builder",
        xpReward: 50,
        starsReward: 6,
      },
      {
        day: 4,
        id: "xmas-day-4",
        title: "Day 4: Ice & Steam Science Lab",
        desc: "Explore how snow, water, and steam transform!",
        gameId: "science-lab",
        xpReward: 55,
        starsReward: 6,
      },
      {
        day: 5,
        id: "xmas-day-5",
        title: "Day 5: Sleigh Robot Coding Path",
        desc: "Program the light robot through the snowy maze.",
        gameId: "robot-path",
        xpReward: 60,
        starsReward: 7,
      },
      {
        day: 6,
        id: "xmas-day-6",
        title: "Day 6: Floating Star Balloons",
        desc: "Pop the matching math balloons in the winter sky.",
        gameId: "balloon-pop",
        xpReward: 60,
        starsReward: 7,
      },
      {
        day: 7,
        id: "xmas-day-7",
        title: "Day 7: Winter Story Read-Aloud",
        desc: "Practice reading aloud with clear pronunciation.",
        gameId: "voice-read",
        xpReward: 65,
        starsReward: 8,
      },
      {
        day: 8,
        id: "xmas-day-8",
        title: "Day 8: Aurora Memory Match",
        desc: "Find matching pairs under the Northern Lights.",
        gameId: "memory-match",
        xpReward: 65,
        starsReward: 8,
      },
      {
        day: 9,
        id: "xmas-day-9",
        title: "Day 9: Polar Space & Nature Quiz",
        desc: "Discover winter constellations and Arctic animals.",
        gameId: "science-quiz",
        xpReward: 70,
        starsReward: 9,
      },
      {
        day: 10,
        id: "xmas-day-10",
        title: "Day 10: Holiday Vocabulary Treasure",
        desc: "Unlock synonyms, opposites, and festive expressions.",
        gameId: "words-quiz",
        xpReward: 75,
        starsReward: 9,
      },
      {
        day: 11,
        id: "xmas-day-11",
        title: "Day 11: Pixel Snowflake Music Studio",
        desc: "Paint a glowing winter crystal and compose a melody.",
        gameId: "pixel-studio",
        xpReward: 80,
        starsReward: 10,
      },
      {
        day: 12,
        id: "xmas-day-12-boss",
        title: "Day 12 Finale: Winter Spark Boss Challenge!",
        desc: "Complete the 12-day countdown to unlock the Winter Spark Outfit!",
        gameId: "numbers-quiz",
        xpReward: 160,
        starsReward: 25,
        isBoss: true,
        rewardSkinId: "winter-spark",
      },
    ],
  },
];

export function getSavedAccount(): RegisteredAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RegisteredAccount;
  } catch {
    return null;
  }
}

export function saveLocalAccount(acc: RegisteredAccount | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!acc) {
      localStorage.removeItem(LOCAL_AUTH_KEY);
    } else {
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(acc));
    }
  } catch {
    /* ignore */
  }
}

export async function registerOrLoginPocketBase(params: {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  grade: Grade;
  classCode?: string;
  currentProfile: Profile;
}): Promise<{ account: RegisteredAccount; syncedToBackend: boolean }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim() || params.currentProfile.name;
  const cleanPassword = params.password && params.password.length >= 8
    ? params.password
    : "IyeyOr2026!";

  const payload = {
    email: cleanEmail,
    password: cleanPassword,
    passwordConfirm: cleanPassword,
    name: cleanName,
    role: params.role,
    plan: "free_registered" as UserPlan,
    grade: params.grade,
    class_code: (params.classCode || "").trim(),
    xp: params.currentProfile.xp ?? 0,
    hp: params.currentProfile.hp ?? 100,
    stars: params.currentProfile.stars ?? 0,
    avatar_config: params.currentProfile.avatar,
  };

  try {
    // Try creating user or authenticating against PocketBase
    let record: Record<string, unknown>;
    try {
      record = await pb.collection("users").create(payload);
      await pb.collection("users").authWithPassword(cleanEmail, cleanPassword);
    } catch {
      const authData = await pb
        .collection("users")
        .authWithPassword(cleanEmail, cleanPassword);
      record = authData.record as unknown as Record<string, unknown>;
    }

    const acc: RegisteredAccount = {
      id: String(record.id || `pb_${Date.now()}`),
      email: cleanEmail,
      name: String(record.name || cleanName),
      role: (record.role as UserRole) || params.role,
      plan: (record.plan as UserPlan) || "free_registered",
      grade: (record.grade as Grade) || params.grade,
      class_code: String(record.class_code || params.classCode || ""),
      xp: Number(record.xp ?? payload.xp),
      hp: Number(record.hp ?? payload.hp),
      stars: Number(record.stars ?? payload.stars),
      avatar_config:
        (record.avatar_config as AvatarConfig) || params.currentProfile.avatar,
      createdAt: new Date().toISOString(),
    };
    saveLocalAccount(acc);
    return { account: acc, syncedToBackend: true };
  } catch {
    // Seamless offline / Vercel fallback with plan = "free_registered"
    const acc: RegisteredAccount = {
      id: `local_${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      role: params.role,
      plan: "free_registered",
      grade: params.grade,
      class_code: (params.classCode || "").trim(),
      xp: payload.xp,
      hp: payload.hp,
      stars: payload.stars,
      avatar_config: params.currentProfile.avatar,
      createdAt: new Date().toISOString(),
    };
    saveLocalAccount(acc);
    return { account: acc, syncedToBackend: false };
  }
}

export async function logoutPocketBase(): Promise<void> {
  try {
    pb.authStore.clear();
  } catch {
    /* ignore */
  }
  saveLocalAccount(null);
}

export async function syncStudentProgressToPocketBase(params: {
  account: RegisteredAccount | null;
  profile: Profile;
  islandId: string;
  stageId: string;
  xpEarned: number;
  starsEarned: number;
  completed: boolean;
}): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
      const list = raw ? (JSON.parse(raw) as unknown[]) : [];
      list.push({
        student: params.account?.id || "guest",
        island_id: params.islandId,
        stage_id: params.stageId,
        xp_earned: params.xpEarned,
        stars_earned: params.starsEarned,
        completed: params.completed,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(list.slice(-100)));
    } catch {
      /* ignore */
    }
  }

  if (params.account) {
    const updatedAcc: RegisteredAccount = {
      ...params.account,
      xp: params.profile.xp ?? params.account.xp + params.xpEarned,
      hp: params.profile.hp ?? 100,
      stars: params.profile.stars,
      avatar_config: params.profile.avatar,
    };
    saveLocalAccount(updatedAcc);
  }

  if (!pb.authStore.isValid || !pb.authStore.record?.id) return;

  try {
    const userId = pb.authStore.record.id;
    await pb.collection("users").update(userId, {
      xp: params.profile.xp ?? 0,
      hp: params.profile.hp ?? 100,
      stars: params.profile.stars ?? 0,
      avatar_config: params.profile.avatar,
    });
    await pb.collection("student_progress").create({
      student: userId,
      island_id: params.islandId,
      stage_id: params.stageId,
      xp_earned: params.xpEarned,
      stars_earned: params.starsEarned,
      completed: params.completed,
    });
  } catch {
    /* PocketBase offline fallback already persisted locally */
  }
}

export async function fetchSeasonalIslands(): Promise<SeasonalIslandRecord[]> {
  try {
    const records = await pb
      .collection("seasonal_islands")
      .getFullList<SeasonalIslandRecord>({
        filter: "is_active = true",
      });
    if (records && records.length > 0) {
      return records.map((r) => ({
        ...r,
        quests_json: Array.isArray(r.quests_json) ? r.quests_json : [],
      }));
    }
  } catch {
    /* use local fallback when PocketBase server is not running */
  }
  return FALLBACK_SEASONAL_ISLANDS;
}

export function getCompletedSeasonalQuests(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_SEASONAL_DONE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markSeasonalQuestCompleted(questId: string): string[] {
  const current = getCompletedSeasonalQuests();
  const next = Array.from(new Set([...current, questId]));
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_SEASONAL_DONE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}
