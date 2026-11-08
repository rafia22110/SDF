import {
  Grade,
  IslandId,
  GameMeta,
  Question,
  ClassState,
  Profile,
} from "../types";

export interface IslandInfo {
  id: IslandId;
  name: string;
  subtitle: string;
  desc: string;
  color: string;
  accentHex: string;
  badgeText: string;
}

export const GRADES: Grade[] = ["א", "ב", "ג", "ד", "ה", "ו"];

export const ISLANDS: IslandInfo[] = [
  {
    id: "letters",
    name: "אִי הָאוֹתִיּוֹת",
    subtitle: "קְרִיאָה, צְלִילִים וְנִיקּוּד",
    desc: "הַכָּרַת הָאוֹתִיּוֹת, תְּנוּעוֹת הַנִּיקּוּד, צְלִיל פּוֹתֵחַ וּקְרִיאָה קוֹלִית בְּעִבְרִית.",
    color: "from-cyan-400 to-blue-600",
    accentHex: "#22d3ee",
    badgeText: "שָׂפָה וּקְרִיאָה",
  },
  {
    id: "numbers",
    name: "אִי הַמִּסְפָּרִים",
    subtitle: "חֶשְׁבּוֹן, הַנְדָּסָה וְשָׁעוֹן",
    desc: "מְנִיָּה, חִיבּוּר וְחִיסּוּר, לוּחַ הַכֶּפֶל, שְׁבָרִים, קְרִיאַת שָׁעוֹן וּבָלוֹנֵי מִסְפָּרִים.",
    color: "from-amber-400 to-orange-600",
    accentHex: "#fbbf24",
    badgeText: "מָתֵמָטִיקָה",
  },
  {
    id: "words",
    name: "אִי הַמִּילִּים",
    subtitle: "אוֹצַר מִילִּים וְהַרְכָּבָה",
    desc: "הֲפָכִים, מִילִּים נִרְדָּפוֹת, הַרְכָּבַת מִילִּים מֵאוֹתִיּוֹת וּמִשְׂחַק זִיכָּרוֹן דּוּ-לְשׁוֹנִי.",
    color: "from-pink-400 to-rose-600",
    accentHex: "#f472b6",
    badgeText: "עברית וְאוֹצַר מִילִּים",
  },
  {
    id: "science",
    name: "אִי הַמַּדָּע וְהֶחָלָל",
    subtitle: "טֶבַע, חָלָל וְנִיסּוּיִים",
    desc: "מַעֲרֶכֶת הַשֶּׁמֶשׁ, מַצְּבֵי צְבִירָה בְּמַעְבָּדָה חַיָּה, גּוּף הָאָדָם וְעוֹלַם הַחַי.",
    color: "from-emerald-400 to-teal-600",
    accentHex: "#4ade80",
    badgeText: "מַדָּע וְטֶבַע",
  },
  {
    id: "logic",
    name: "אִי הַחֲשִׁיבָה",
    subtitle: "לוֹגִיקָה, סְדָרוֹת וְרוֹבּוֹטִיקָה",
    desc: "הַשְׁלָמַת סְדָרוֹת, תִּכְנוּת מַסְלוּל רוֹבּוֹט הָאוֹר וְחִידוֹת זִיכָּרוֹן חֲכָמוֹת.",
    color: "from-violet-400 to-purple-700",
    accentHex: "#a78bfa",
    badgeText: "חֲשִׁיבָה וְאַלְגּוֹרִיתְמִיקָה",
  },
  {
    id: "create",
    name: "אִי הַיְּצִירָה",
    subtitle: "פִּיקְסֶל-אוֹר וּמוּזִיקָה",
    desc: "סְטוּדְיוֹ לְצִיּוּר בְּפִיקְסֶלִים זוֹהֲרִים, בְּנִיַּת דְּגָמִים וִיצִירַת מַנְגִּינוֹת חָלָל.",
    color: "from-fuchsia-400 to-indigo-600",
    accentHex: "#e879f9",
    badgeText: "אֳמָנוּת וִיצִירָה",
  },
];

export const GAMES: GameMeta[] = [
  // Letters Island
  {
    id: "letters-quiz",
    title: "מַסַּע הָאוֹתִיּוֹת וְהַצְּלִילִים",
    desc: "זַהוּ אֶת הָאוֹת הַפּוֹתַחַת, הַנִּיקּוּד הַנָּכוֹן וְהַצְּלִיל הַמַּתְאִים לַמִּילָּה.",
    island: "letters",
    emoji: "🔤",
    skills: "פוֹנֶטִיקָה וְנִיקּוּד",
  },
  {
    id: "voice-read",
    title: "קוֹרְאִים בְּקוֹל רָם",
    desc: "הַאֲזִינוּ לַמִּילָּה הַמְּנוּקֶּדֶת, קִרְאוּ אוֹתָהּ בְּקוֹל וּבִדְקוּ אֶת הַהֲגִיָּה!",
    island: "letters",
    emoji: "🎙️",
    skills: "קְרִיאָה קוֹלִית וְהֲבָרוֹת",
  },
  // Numbers Island
  {
    id: "numbers-quiz",
    title: "אַלּוּפֵי הַחֶשְׁבּוֹן וְהַשָּׁעוֹן",
    desc: "תַּרְגִּילֵי חֶשְׁבּוֹן מוּתְאָמִים לַכִּיתָּה, מְנִיַּת עֲצָמִים וּקְרִיאַת שָׁעוֹן מְחוֹגִים.",
    island: "numbers",
    emoji: "🧮",
    skills: "חֶשְׁבּוֹן וּזְמַן",
  },
  {
    id: "balloon-pop",
    title: "בָּלוֹנֵי הַמִּסְפָּרִים הַמְּרַחֲפִים",
    desc: "פּוֹצְצוּ אֶת הַבָּלוֹן עִם הַתְּשׁוּבָה הַנְּכוֹנָה לִפְנֵי שֶׁיַּחְלוֹף בֶּחָלָל!",
    island: "numbers",
    emoji: "🎈",
    skills: "חִישּׁוּב מָהִיר",
  },
  // Words Island
  {
    id: "word-builder",
    title: "בּוֹנֵי הַמִּילִּים הַזּוֹהֲרוֹת",
    desc: "סַדְּרוּ אֶת הָאוֹתִיּוֹת הַמְּפוּזָּרוֹת כְּדֵי לְהַרְכִּיב אֶת הַמִּילָּה הַנְּכוֹנָה.",
    island: "words",
    emoji: "🧩",
    skills: "כְּתִיב וְהַרְכָּבַת מִילִּים",
  },
  {
    id: "words-quiz",
    title: "אוֹצַר הַמִּילִּים וְהַהֲפָכִים",
    desc: "מִילִּים נִרְדָּפוֹת, הֲפָכִים, פִּתְגָּמִים וַהֲבָנַת הַנִּקְרָא בְּעִבְרִית.",
    island: "words",
    emoji: "📚",
    skills: "עֹשֶׁר לְשׁוֹנִי",
  },
  // Science Island
  {
    id: "science-lab",
    title: "מַעְבָּדַת הַמַּדָּע וּמַצְּבֵי הַצְּבִירָה",
    desc: "שַׁנּוּ טֶמְפֵּרָטוּרָה וּכְבוּדָה בְּמַעְבָּדָה אִינְטֶרְאַקְטִיבִית וְגַלּוּ כֵּיצַד חוֹמָרִים מִשְׁתַּנִּים.",
    island: "science",
    emoji: "🔬",
    skills: "חֵקֶר מַדָּעִי וְסִימוּלַצְיָה",
  },
  {
    id: "science-quiz",
    title: "חִידוֹן הַכּוֹכָבִים וְהַטֶּבַע",
    desc: "שְׁאֵלוֹת מְרַתְּקוֹת עַל מַעֲרֶכֶת הַשֶּׁמֶשׁ, בַּעֲלֵי חַיִּים, צְמָחִים וְגוּף הָאָדָם.",
    island: "science",
    emoji: "🪐",
    skills: "מַדָּעִים וְאַסְטְרוֹנוֹמְיָה",
  },
  // Logic Island
  {
    id: "robot-path",
    title: "מַסְלוּל רוֹבּוֹט הָאוֹר",
    desc: "תַּכְנְנוּ רֶצֶף פְּקוּדוֹת חָכָם כְּדֵי לְהוֹבִיל אֶת הָרוֹבּוֹט אֶל גְּבִישׁ הָאֵנֶרְגְּיָה.",
    island: "logic",
    emoji: "🤖",
    skills: "חֲשִׁיבָה תִּכְנוּתִית",
  },
  {
    id: "memory-match",
    title: "זִיכָּרוֹן גָּלַקְטִי וּסְדָרוֹת",
    desc: "הִפְכוּ כַּרְטִיסִים וּמִצְאוּ זוּגוֹת מַתְאִימִים שֶׁל מוּשָׂגִים, הֲפָכִים וְתַרְגִּילִים.",
    island: "logic",
    emoji: "🧠",
    skills: "זִיכָּרוֹן חָזוּתִי וַהֲקָשָׁה",
  },
  // Create Island
  {
    id: "pixel-studio",
    title: "סְטוּדְיוֹ פִּיקְסֶל-אוֹר וּמוּזִיקָה",
    desc: "צַיְּרוּ יְצִירוֹת אוֹר עַל לוּחַ מִשְׁבְּצוֹת מְנַגֵּן וְשִׁמְרוּ אוֹתָן בַּגָּלֶרְיָה הָאִישִׁית.",
    island: "create",
    emoji: "🎨",
    skills: "יְצִירָתִיּוּת וְדִמְיוֹן",
  },
];

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first-star",
    name: "כּוֹכָב רִאשׁוֹן",
    desc: "סִיַּמְתָּ מִשְׂחָק רִאשׁוֹן בְּאִיֵּי אוֹר!",
    icon: "⭐",
  },
  {
    id: "island-explorer",
    name: "חוֹקֵר הָאִיִּים",
    desc: "בִּיקַּרְתָּ בְּ-3 אִיִּים שׁוֹנִים לְפָחוֹת.",
    icon: "🧭",
  },
  {
    id: "world-traveler",
    name: "נוֹסֵעַ הַגָּלַקְסְיָה",
    desc: "בִּיקַּרְתָּ בְּכָל 6 אִיֵּי הָאוֹר!",
    icon: "🚀",
  },
  {
    id: "math-whiz",
    name: "אַלּוּף הַמִּסְפָּרִים",
    desc: "צָבַרְתָּ הַצְלָחָה בְּמִשְׂחֲקֵי הַחֶשְׁבּוֹן.",
    icon: "🏆",
  },
  {
    id: "artist",
    name: "אֳמַן הָאוֹר",
    desc: "יָצַרְתָּ וְשָׁמַרְתָּ יְצִירַת פִּיקְסֶל-אוֹר.",
    icon: "🎨",
  },
  {
    id: "super-star",
    name: "שׁוֹמֵר הָאוֹר",
    desc: "צָבַרְתָּ מֵעַל 50 כּוֹכְבֵי אוֹר!",
    icon: "👑",
  },
];

export interface AccessoryDef {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

export const ACCESSORIES: AccessoryDef[] = [
  { id: "crown", name: "כֶּתֶר זָהָב", price: 15, emoji: "👑" },
  { id: "glasses", name: "מִשְׁקְפֵי חָלָל", price: 10, emoji: "🥽" },
  { id: "halo", name: "הִילַּת כּוֹכָבִים", price: 20, emoji: "✨" },
  { id: "headphones", name: "אוֹזְנִיּוֹת קֶצֶב", price: 12, emoji: "🎧" },
  { id: "wand", name: "שַׁרְבִיט אוֹר", price: 25, emoji: "🪄" },
];

export const AVATAR_SHAPES = [
  { id: 0, name: "אַסְטְרוֹנָאוּט" },
  { id: 1, name: "רוֹבּוֹט אוֹר" },
  { id: 2, name: "שׁוּעַל כּוֹכָבִים" },
  { id: 3, name: "יַנְשׁוּף חָכָם" },
  { id: 4, name: "גְּבִישׁ קוֹסְמִי" },
];

export const AVATAR_COLORS = [
  { id: 0, name: "טורקיז זוהר", hex: "#22d3ee", secondary: "#0284c7" },
  { id: 1, name: "ורוד ערפילית", hex: "#f472b6", secondary: "#db2777" },
  { id: 2, name: "זהב שמש", hex: "#fbbf24", secondary: "#d97706" },
  { id: 3, name: "ירוק ברקת", hex: "#4ade80", secondary: "#059669" },
  { id: 4, name: "סגול גלקטי", hex: "#a78bfa", secondary: "#7c3aed" },
  { id: 5, name: "אדום שביט", hex: "#fb7185", secondary: "#e11d48" },
];

/* ---------- Default Class & Profile State ---------- */

export const DEFAULT_CLASS_STATE: ClassState = {
  name: "גִּילְדַּת כּוֹכְבֵי הָאוֹר",
  code: "OR-2026",
  dailyGoal: 5,
  students: [
    {
      id: "st-1",
      name: "נוֹעָה כֹּהֵן",
      grade: "ב",
      avatar: { shape: 2, color: 1, accessory: "crown" },
      stars: 48,
      gamesPlayed: 11,
      lastActive: "הַיּוֹם",
      partyRole: "healer",
      level: 4,
    },
    {
      id: "st-2",
      name: "אִיתַי לֵוִי",
      grade: "ג",
      avatar: { shape: 1, color: 0, accessory: "glasses" },
      stars: 62,
      gamesPlayed: 14,
      lastActive: "הַיּוֹם",
      partyRole: "tank",
      level: 5,
    },
    {
      id: "st-3",
      name: "מָאיָה בַּר",
      grade: "א",
      avatar: { shape: 3, color: 4, accessory: "halo" },
      stars: 35,
      gamesPlayed: 8,
      lastActive: "הַיּוֹם",
      partyRole: "dps",
      level: 3,
    },
    {
      id: "st-4",
      name: "דָּנִיאֵל שָׂרִיד",
      grade: "ד",
      avatar: { shape: 0, color: 2, accessory: "headphones" },
      stars: 74,
      gamesPlayed: 16,
      lastActive: "אֶתְמוֹל",
      partyRole: "tank",
      level: 6,
    },
    {
      id: "st-5",
      name: "יַעֵל אֵלְיָהוּ",
      grade: "ה",
      avatar: { shape: 4, color: 3, accessory: "wand" },
      stars: 89,
      gamesPlayed: 19,
      lastActive: "הַיּוֹם",
      partyRole: "healer",
      level: 7,
    },
  ],
  missions: [
    {
      id: "m-boss-1",
      gameId: "numbers-quiz",
      studentId: "all",
      assignedAt: Date.now() - 1800_000,
      done: false,
      questType: "boss",
      xpReward: 150,
      bossName: "הָאַרְכִי-בּוֹס מֵתוֹדִיקָה 🐉🧮",
      bossWeakness: "נְקוּדַת הַתּוֹרְפָּה שֶׁלּוֹ: פֵּירוּק לַעֲשָׂרוֹת שְׁלֵמוֹת, חוֹק הַחִילּוּף וּבְדִיקַת הַמְּחוֹג הַקָּטָן בַּשָּׁעוֹן!",
      note: "אֶתְגַּר הַסִּיכּוּם בְּמָתֵמָטִיקָה — הִשְׁתַּמְּשׁוּ בַּנּוֹסְחָאוֹת שֶׁלָּמַדְנוּ כְּדֵי לְהַכְנִיעַ אֶת הַבּוֹס!",
    },
    {
      id: "m-daily-1",
      gameId: "voice-read",
      studentId: "all",
      assignedAt: Date.now() - 3600_000,
      done: false,
      questType: "daily",
      xpReward: 60,
      note: "קְווֶסְט יוֹמִי (Daily Quest): קְרִיאַת 5 מִילִּים בְּקוֹל רָם עִם נִיקּוּד לְחִיזּוּק שְׁטִיפוּת הַקְּרִיאָה",
    },
    {
      id: "m-main-1",
      gameId: "science-lab",
      studentId: "all",
      assignedAt: Date.now() - 7200_000,
      done: false,
      questType: "main",
      xpReward: 100,
      note: "מְשִׂימָה רָאשִׁית (Main Quest): חֵקֶר מַצְּבֵי הַצְּבִירָה שֶׁל הַמַּיִם בַּמַּעְבָּדָה הַחַיָּה",
    },
    {
      id: "m-side-1",
      gameId: "robot-path",
      studentId: "all",
      assignedAt: Date.now() - 9600_000,
      done: false,
      questType: "side",
      xpReward: 80,
      note: "מְשִׂימַת צַד לְהַעֲשָׁרָה (Side Quest): פִּיצּוּחַ 3 מַסְלוּלֵי קוֹד שֶׁל רוֹבּוֹט הָאוֹר לְבוֹנוּס שָׁלָל!",
    },
  ],
};

export function createInitialProfile(
  name = "יוֹנָתָן",
  grade: Grade = "ב",
): Profile {
  const today = new Date().toISOString().slice(0, 10);
  return {
    name,
    grade,
    avatar: { shape: 0, color: 0, accessory: "crown" },
    stars: 25,
    totalStars: 25,
    badges: ["first-star"],
    gamesPlayed: { "letters-quiz": 1, "numbers-quiz": 1 },
    bestScores: { "letters-quiz": 5, "numbers-quiz": 5 },
    islandsVisited: ["letters", "numbers"],
    createdAt: Date.now(),
    lastPlayedDay: today,
    streak: 3,
    ownedAccessories: ["crown"],
    todayCount: 2,
    todayDay: today,
    xp: 240,
    level: 3,
    hp: 90,
    partyRole: "dps",
    activeBuff: "בָּאף הַהֶסְבֵּר הַחָכָם (+20% XP וְרֶמֶז מוּבְנֶה)",
  };
}

/* ---------- Hebrew Letters & Nikud Data for Smart Board & Games ---------- */

export interface HebrewLetterItem {
  letter: string;
  name: string;
  word: string;
  emoji: string;
  sound: string;
}

export const HEBREW_ALPHABET: HebrewLetterItem[] = [
  { letter: "א", name: "אָלֶף", word: "אַרְיֵה", emoji: "🦁", sound: "אַ" },
  { letter: "ב", name: "בֵּית", word: "בַּיִת", emoji: "🏠", sound: "בַּ" },
  { letter: "ג", name: "גִּימֶל", word: "גָּמָל", emoji: "🐪", sound: "גָּ" },
  { letter: "ד", name: "דָּלֶת", word: "דּוֹלְפִין", emoji: "🐬", sound: "דּוֹ" },
  { letter: "ה", name: "הֵא", word: "הַר", emoji: "⛰️", sound: "הַ" },
  { letter: "ו", name: "וָו", word: "וֶרֶד", emoji: "🌹", sound: "וֶ" },
  { letter: "ז", name: "זַיִן", word: "זֶבְּרָה", emoji: "🦓", sound: "זֶ" },
  { letter: "ח", name: "חֵית", word: "חָתוּל", emoji: "🐱", sound: "חָ" },
  { letter: "ט", name: "טֵית", word: "טִיל", emoji: "🚀", sound: "טִי" },
  { letter: "י", name: "יוֹד", word: "יָרֵחַ", emoji: "🌙", sound: "יָ" },
  { letter: "כ", name: "כַּף", word: "כּוֹכָב", emoji: "⭐", sound: "כּוֹ" },
  { letter: "ל", name: "לָמֶד", word: "לֵב", emoji: "❤️", sound: "לֵ" },
  { letter: "מ", name: "מֵם", word: "מָטוֹס", emoji: "✈️", sound: "מָ" },
  { letter: "נ", name: "נוּן", word: "נֵר", emoji: "🕯️", sound: "נֵ" },
  { letter: "ס", name: "סָמֶךְ", word: "סֵפֶר", emoji: "📖", sound: "סֵ" },
  { letter: "ע", name: "עַיִן", word: "עֵץ", emoji: "🌳", sound: "עֵ" },
  { letter: "פ", name: "פֵּא", word: "פַּרְפַּר", emoji: "🦋", sound: "פַּ" },
  { letter: "צ", name: "צַדִּי", word: "צָב", emoji: "🐢", sound: "צָ" },
  { letter: "ק", name: "קוֹף", word: "קֶשֶׁת", emoji: "🌈", sound: "קֶ" },
  { letter: "ר", name: "רֵישׁ", word: "רַכֶּבֶת", emoji: "🚂", sound: "רַ" },
  { letter: "ש", name: "שִׁין", word: "שֶׁמֶשׁ", emoji: "☀️", sound: "שֶׁ" },
  { letter: "ת", name: "תָּו", word: "תַּפּוּחַ", emoji: "🍎", sound: "תַּ" },
];

export interface NikudMark {
  id: string;
  name: string;
  mark: string;
  vowelSound: "a" | "e" | "i" | "o" | "u" | "silent";
  desc: string;
}

export const NIKUD_MARKS: NikudMark[] = [
  { id: "kamatz", name: "קָמַץ", mark: "ָ", vowelSound: "a", desc: "צְלִיל A פָּתוּחַ" },
  { id: "patach", name: "פַּתַח", mark: "ַ", vowelSound: "a", desc: "צְלִיל A חַד" },
  { id: "tzere", name: "צֵירֵי", mark: "ֵ", vowelSound: "e", desc: "צְלִיל E" },
  { id: "segol", name: "סֶגּוֹל", mark: "ֶ", vowelSound: "e", desc: "צְלִיל E רַךְ" },
  { id: "chirik", name: "חִירִיק", mark: "ִ", vowelSound: "i", desc: "צְלִיל I" },
  { id: "cholam", name: "חוֹלָם", mark: "ֹ", vowelSound: "o", desc: "צְלִיל O" },
  { id: "kubutz", name: "קֻבּוּץ", mark: "ֻ", vowelSound: "u", desc: "צְלִיל U" },
  { id: "shva", name: "שְׁוָא", mark: "ְ", vowelSound: "silent", desc: "עִיצּוּר קָצָר" },
];

/* ---------- Question Generators by Island & Grade ---------- */

export function getQuestionsForGame(gameId: string, grade: Grade): Question[] {
  const isYoung = grade === "א" || grade === "ב";
  const isMid = grade === "ג" || grade === "ד";

  if (gameId === "letters-quiz") {
    if (isYoung) {
      return [
        {
          prompt: "בְּאֵיזוֹ אוֹת מַתְחִילָה הַמִּילָּה 'שֶׁמֶשׁ'?",
          options: ["ש", "ס", "מ", "ר"],
          answer: 0,
          display: { kind: "emoji", value: "☀️" },
          speak: "באיזו אות מתחילה המילה שמש?",
          hint: "הַקְשִׁיבוּ לַצְּלִיל הָרִאשׁוֹן: שׁ... שֶׁמֶשׁ",
        },
        {
          prompt: "בְּאֵיזוֹ אוֹת מַתְחִילָה הַמִּילָּה 'פַּרְפַּר'?",
          options: ["ב", "פ", "כ", "ת"],
          answer: 1,
          display: { kind: "emoji", value: "🦋" },
          speak: "באיזו אות מתחילה המילה פרפר?",
          hint: "פַּ-רְ-פַּ-ר מַתְחִיל בְּאוֹת פֵּא",
        },
        {
          prompt: "אֵיזוֹ מִילָּה מַתְחִילָה בָּאוֹת כּ'?",
          options: ["כּוֹכָב", "יָרֵחַ", "טִיל", "שֶׁמֶשׁ"],
          answer: 0,
          display: { kind: "big", value: "כּ" },
          speak: "איזו מילה מתחילה באות כף?",
          hint: "חַפְּשׂוּ אֶת הָאוֹת כּ' בִּתְחִילַּת הַמִּילָּה",
        },
        {
          prompt: "מָה הַצְּלִיל שֶׁל הָאוֹת מ' עִם חִירִיק (מִ)?",
          options: ["מִי", "מָה", "מוֹ", "מֶה"],
          answer: 0,
          display: { kind: "big", value: "מִ" },
          speak: "מה הצליל של האות מם עם חיריק? מי",
          hint: "נְקוּדָה אַחַת מִתַּחַת לָאוֹת הִיא חִירִיק (I)",
        },
        {
          prompt: "בְּאֵיזוֹ אוֹת מִסְתַּיֶּימֶת הַמִּילָּה 'חָתוּל'?",
          options: ["ח", "ת", "ל", "ו"],
          answer: 2,
          display: { kind: "emoji", value: "🐱" },
          speak: "באיזו אות מסתיימת המילה חתול?",
          hint: "הַקְשִׁיבוּ לַצְּלִיל הָאַחֲרוֹן: חָ-תוּ-ל",
        },
        {
          prompt: "כַּמָּה הֲבָרוֹת יֵשׁ בַּמִּילָּה 'מַ-חְ-שֵׁב'?",
          options: ["2 הֲבָרוֹת", "3 הֲבָרוֹת", "4 הֲבָרוֹת", "הֲבָרָה אַחַת"],
          answer: 0,
          display: { kind: "emoji", value: "💻" },
          speak: "כמה הברות יש במילה מחשב?",
          hint: "מַחְ-שֵׁב — מַחְאוּ כַּף לְכָל הֲבָרָה!",
        },
      ];
    }
    return [
      {
        prompt: "אֵיזוֹ אוֹת סוֹפִית מַתְאִימָה לְסוֹף הַמִּילָּה 'עֵ___' (צֶמַח גָּבוֹהַּ)?",
        options: ["ץ", "ף", "ן", "ך"],
        answer: 0,
        display: { kind: "emoji", value: "🌳" },
        speak: "איזו אות סופית מתאימה לסוף המילה עץ?",
        hint: "הָאוֹת הַסּוֹפִית שֶׁל צַדִּי הִיא ץ",
      },
      {
        prompt: "מַהוּ הַשּׁוֹרֶשׁ שֶׁל הַמִּילִּים: כָּתַב, מִכְתָּב, כְּתוּבּוֹת?",
        options: ["כ.ת.ב", "מ.כ.ת", "כ.ת.ת", "ת.כ.ב"],
        answer: 0,
        display: { kind: "big", value: "מִכְתָּב" },
        speak: "מהו השורש של המילים כתב, מכתב, כתובות?",
        hint: "שְׁלוֹשׁ הָאוֹתִיּוֹת הַחוֹזְרוֹת בְּכָל הַמִּילִּים",
      },
      {
        prompt: "אֵיזוֹ מִילָּה כְּתוּבָה בִּכְתִיב נָכוֹן?",
        options: ["מִשְׂחָק", "מִסְחָק", "מִשְׁכָק", "מִזְחָק"],
        answer: 0,
        display: { kind: "emoji", value: "🎮" },
        speak: "איזו מילה כתובה בכתיב נכון? משחק",
        hint: "מִשְׂחָק נִכְתָּב בְּשִׂין שְׂמָאלִית וְחֵית",
      },
      {
        prompt: "בְּאֵיזוֹ מִילָּה מוֹפִיעַ דָּגֵשׁ חָזָק בָּאוֹת הָאֶמְצָעִית?",
        options: ["סִפֵּר", "סָפַר", "סֵפֶר", "סוֹפֵר"],
        answer: 0,
        display: { kind: "big", value: "סִפֵּר" },
        speak: "באיזו מילה מופיע דגש חזק באות האמצעית?",
        hint: "בְּבִנְיַן פִּיעֵל יֵשׁ דָּגֵשׁ בְּעַיִן הַפּוֹעַל",
      },
      {
        prompt: "מָה הָרַבִּים שֶׁל שֵׁם הָעֶצֶם 'שׁוּלְחָן'?",
        options: ["שׁוּלְחָנוֹת", "שׁוּלְחָנִים", "שׁוּלְחָנֵי", "שׁוּלְחָן"],
        answer: 0,
        display: { kind: "emoji", value: "🪑" },
        speak: "מה הרבים של שם העצם שולחן?",
        hint: "שׁוּלְחָן הוּא זָכָר, אַךְ בְּרַבִּים הַסִּיּוֹמֶת הִיא -וֹת",
      },
      {
        prompt: "אֵיזוֹ מִילָּה שַׁיֶּיכֶת לְמִשְׁפַּחַת הַמִּילִּים שֶׁל 'אוֹר'?",
        options: ["תְּאוּרָה", "אֲוִיר", "אָרוֹן", "אִיּוּר"],
        answer: 0,
        display: { kind: "emoji", value: "💡" },
        speak: "איזו מילה שייכת למשפחת המילים של אור?",
        hint: "מְנוֹרָה מְסַפֶּקֶת תְּאוּרָה בַּחֶדֶר",
      },
    ];
  }

  if (gameId === "numbers-quiz") {
    if (isYoung) {
      return [
        {
          prompt: "כַּמָּה כּוֹכָבִים מוֹפִיעִים עַל הַלּוּחַ?",
          options: ["6", "7", "8", "5"],
          answer: 1,
          display: { kind: "count", value: "⭐", n: 7 },
          speak: "כמה כוכבים מופיעים על הלוח?",
          hint: "סִפְרוּ כּוֹכָב אַחַר כּוֹכָב בְּסַבְלָנוּת",
        },
        {
          prompt: "כַּמָּה הֵם 8 + 5 ?",
          options: ["12", "13", "14", "15"],
          answer: 1,
          display: { kind: "big", value: "8 + 5 = ?" },
          speak: "כמה הם שמונה ועוד חמש?",
          hint: "הַשְׁלִימוּ מִ-8 לְ-10 (עוֹד 2) וְהוֹסִיפוּ 3",
        },
        {
          prompt: "מָה הַשָּׁעָה הַמּוֹפִיעָה בַּשָּׁעוֹן?",
          options: ["03:00", "06:00", "12:15", "09:00"],
          answer: 0,
          display: { kind: "clock", h: 3, m: 0 },
          speak: "מה השעה המופיעה בשעון?",
          hint: "הַמָּחוֹג הַקָּצָר מַצְבִּיעַ עַל 3 וְהָאָרוֹךְ עַל 12",
        },
        {
          prompt: "כַּמָּה הֵם 16 - 7 ?",
          options: ["8", "9", "7", "10"],
          answer: 1,
          display: { kind: "big", value: "16 - 7 = ?" },
          speak: "כמה הם שש עשרה פחות שבע?",
          hint: "7 וְעוֹד כַּמָּה שָׁוֶה 16?",
        },
        {
          prompt: "אֵיזֶה מִסְפָּר גָּדוֹל יוֹתֵר מִ-29 וְקָטָן מִ-32?",
          options: ["28", "31", "33", "25"],
          answer: 1,
          display: { kind: "sequence", items: ["29", "?", "32"] },
          speak: "איזה מספר גדול יותר מעשרים ותשע וקטן משלושים ושתיים?",
          hint: "בִּדְקוּ אֶת הַמִּסְפָּרִים שֶׁבֵּין 29 לְ-32",
        },
        {
          prompt: "מָה הַשָּׁעָה בַּשָּׁעוֹן?",
          options: ["04:30", "05:30", "06:20", "04:00"],
          answer: 0,
          display: { kind: "clock", h: 4, m: 30 },
          speak: "מה השעה בשעון? ארבע וחצי",
          hint: "מְחוֹג הַדַּקּוֹת מַצְבִּיעַ עַל 6 — כְּלוֹמַר חֲצִי שָׁעָה",
        },
      ];
    }
    if (isMid) {
      return [
        {
          prompt: "כַּמָּה הֵם 7 × 8 ?",
          options: ["54", "56", "64", "48"],
          answer: 1,
          display: { kind: "big", value: "7 × 8 = ?" },
          speak: "כמה הם שבע כפול שמונה?",
          hint: "5, 6, 7, 8 -> 56 = 7 × 8",
        },
        {
          prompt: "מָה הַשָּׁעָה המדויקת בַּשָּׁעוֹן?",
          options: ["07:15", "07:45", "03:35", "08:15"],
          answer: 0,
          display: { kind: "clock", h: 7, m: 15 },
          speak: "מה השעה המדויקת בשעון?",
          hint: "מְחוֹג הַדַּקּוֹת עַל 3 הוּא רֶבַע שָׁעָה (15 דַּקּוֹת)",
        },
        {
          prompt: "כַּמָּה הֵם 72 ÷ 9 ?",
          options: ["7", "8", "9", "6"],
          answer: 1,
          display: { kind: "big", value: "72 ÷ 9 = ?" },
          speak: "כמה הם שבעים ושתיים לחלק לתשע?",
          hint: "אֵיזֶה מִסְפָּר כָּפוּל 9 נוֹתֵן 72?",
        },
        {
          prompt: "מָה הֶיקֵּף רִיבּוּעַ שֶׁאֹרֶךְ צַלְעוֹ 9 ס״מ?",
          options: ["36 ס״מ", "81 ס״מ", "18 ס״מ", "27 ס״מ"],
          answer: 0,
          display: { kind: "big", value: "⬜ צֵלָע = 9" },
          speak: "מה היקף ריבוע שאורך צלעו תשעה סנטימטרים?",
          hint: "לְרִיבּוּעַ יֵשׁ 4 צְלָעוֹת שָׁווֹת: 9 × 4",
        },
        {
          prompt: "אֵיזֶה שֶׁבֶר שָׁוֶה לַחֵצִי (1/2)?",
          options: ["3/6", "2/5", "3/8", "4/6"],
          answer: 0,
          display: { kind: "big", value: "½ = ?" },
          speak: "איזה שבר שווה לחצי?",
          hint: "חַפְּשׂוּ שֶׁבֶר שֶׁבּוֹ הַמּוֹנֶה הוּא בְּדִיּוּק חֲצִי מֵהַמְּכַנֶּה",
        },
        {
          prompt: "כַּמָּה הֵם 250 + 375 ?",
          options: ["625", "525", "615", "650"],
          answer: 0,
          display: { kind: "big", value: "250 + 375" },
          speak: "כמה הם מאתיים וחמישים ועוד שלוש מאות שבעים וחמש?",
          hint: "200+300=500, וְעוֹד 50+75=125",
        },
      ];
    }
    return [
      {
        prompt: "מַהוּ הַמִּסְפָּר הָעֶשְׂרוֹנִי הַשָּׁוֶה לַשֶּׁבֶר 3/4 ?",
        options: ["0.75", "0.34", "0.25", "0.80"],
        answer: 0,
        display: { kind: "big", value: "¾ = ?" },
        speak: "מהו המספר העשרוני השווה לשבר שלושה רבעים?",
        hint: "רֶבַע אֶחָד הוּא 0.25, לָכֵן 3 רְבָעִים הֵם...",
      },
      {
        prompt: "מָה שֶׁטַח מְשׁוּלָּשׁ שֶׁבְּסִיסוֹ 10 ס״מ וְגוֹבְהוֹ 6 ס״מ?",
        options: ["30 סמ״ר", "60 סמ״ר", "16 סמ״ר", "45 סמ״ר"],
        answer: 0,
        display: { kind: "big", value: "📐 10 × 6 ÷ 2" },
        speak: "מה שטח משולש שבסיסו עשרה סנטימטרים וגובהו שישה סנטימטרים?",
        hint: "שֶׁטַח מְשׁוּלָּשׁ = (בָּסִיס × גּוֹבַהּ) חֶלְקֵי 2",
      },
      {
        prompt: "כַּמָּה הֵם 20% מִתּוֹךְ 150 ?",
        options: ["30", "25", "20", "35"],
        answer: 0,
        display: { kind: "big", value: "20% × 150" },
        speak: "כמה הם עשרים אחוז מתוך מאה וחמישים?",
        hint: "10% מִ-150 הֵם 15, לָכֵן 20% הֵם כִּפְלַיִים!",
      },
      {
        prompt: "פִּתְרוּ אֶת הַתַּרְגִּיל לְפִי סֵדֶר פְּעוּלוֹת חֶשְׁבּוֹן: 12 + 4 × 5",
        options: ["32", "80", "28", "64"],
        answer: 0,
        display: { kind: "big", value: "12 + 4 × 5" },
        speak: "פתרו את התרגיל לפי סדר פעולות חשבון: שתים עשרה ועוד ארבע כפול חמש",
        hint: "כֶּפֶל קוֹדֵם לְחִיבּוּר! קוֹדֶם חַשְּׁבוּ 4 × 5",
      },
      {
        prompt: "אֵיזֶה מֵהַמִּסְפָּרִים הַבָּאִים הוּא מִסְפָּר רִאשׁוֹנִי?",
        options: ["29", "27", "33", "35"],
        answer: 0,
        display: { kind: "big", value: "29 / 27 / 33 / 35" },
        speak: "איזה מהמספרים הבאים הוא מספר ראשוני?",
        hint: "מִסְפָּר רִאשׁוֹנִי מִתְחַלֵּק רַק בְּ-1 וּבְעַצְמוֹ",
      },
      {
        prompt: "חַלָּלִית טָסָה בִּמְהִירוּת 120 ק״מ לְשָׁעָה. כַּמָּה ק״מ תַּעֲבוֹר בְּ-2.5 שָׁעוֹת?",
        options: ["300 ק״מ", "240 ק״מ", "280 ק״מ", "360 ק״מ"],
        answer: 0,
        display: { kind: "emoji", value: "🚀" },
        speak: "חללית טסה במהירות מאה ועשרים קילומטר לשעה. כמה קילומטרים תעבור בשעתיים וחצי?",
        hint: "בְּשָׁעָתַיִים 240 ק״מ, וּבַחֲצִי שָׁעָה עוֹד 60 ק״מ",
      },
    ];
  }

  if (gameId === "words-quiz") {
    return [
      {
        prompt: "מָה הַהֵפֶךְ מֵהַמִּילָּה 'אוֹר'?",
        options: ["חוֹשֶׁךְ", "שֶׁמֶשׁ", "בוֹקֶר", "חום"],
        answer: 0,
        display: { kind: "emoji", value: "🌗" },
        speak: "מה ההפך מהמילה אור?",
        hint: "כְּשֶׁמְּכַבִּים אֶת הָאוֹר נִהְיֶה...",
      },
      {
        prompt: "אֵיזוֹ מִילָּה הִיא מִילָּה נִרְדֶּפֶת לְ'שִׂמְחָה'?",
        options: ["שָׂשׂוֹן", "עֶצֶב", "רוֹגֶז", "פַּחַד"],
        answer: 0,
        display: { kind: "emoji", value: "😊" },
        speak: "איזו מילה היא מילה נרדפת לשמחה?",
        hint: "קּוֹל שָׂשׂוֹן וְקוֹל שִׂמְחָה",
      },
      {
        prompt: "מָה פֵּירוּשׁ הַבִּיטּוּי 'לֵב זָהָב'?",
        options: [
          "אָדָם טוֹב לֵב וְנָדִיב",
          "אָדָם עָשִׁיר מְאוֹד",
          "תַּכְשִׁיט יָקָר",
          "אָדָם אמיץ",
        ],
        answer: 0,
        display: { kind: "emoji", value: "💛" },
        speak: "מה פירוש הביטוי לב זהב?",
        hint: "תְּכוּנַת אוֹפִי נִפְלָאָה שֶׁל אָדָם שֶׁעוֹזֵר לְכוּלָּם",
      },
      {
        prompt: "מַהוּ הַהֵפֶךְ מֵהַמִּילָּה 'רוֹעֵשׁ'?",
        options: ["שָׁקֵט", "מָהִיר", "גָּבוֹהַּ", "חָזָק"],
        answer: 0,
        display: { kind: "emoji", value: "🤫" },
        speak: "מהו ההפך מהמילה רועש?",
        hint: "בַּסִּפְרִיָּה שׁוֹמְרִים עַל מָקוֹם...",
      },
      {
        prompt: "אֵיזוֹ מִילָּה הִיא מִילָּה נִרְדֶּפֶת לְ'יָרֵחַ'?",
        options: ["לְבָנָה", "חַמָּה", "כּוֹכָב", "עָנָן"],
        answer: 0,
        display: { kind: "emoji", value: "🌕" },
        speak: "איזו מילה היא מילה נרדפת לירח?",
        hint: "צִבְעוֹ לָבָן בִּשְׁמֵי הַלַּיְלָה",
      },
      {
        prompt: "הַשְׁלִימוּ אֶת הַמִּשְׁפָּט: 'הַמַּדְעָנִית הִבִּיטָה בַּכּוֹכָבִים דֶּרֶךְ הַ___'",
        options: ["טֵלֶסְקוֹפּ", "מִיקְרוֹסְקוֹפּ", "סְטֶתוֹסְקוֹפּ", "פֵּרִיסְקוֹפּ"],
        answer: 0,
        display: { kind: "emoji", value: "🔭" },
        speak: "השלימו את המשפט: המדענית הביטה בכוכבים דרך ה...",
        hint: "מַכְשִׁיר אֳפְּטִי לִצְפִיָּה בְּגַרְמֵי שָׁמַיִם רְחוֹקִים",
      },
    ];
  }

  // Default / Science quiz
  return [
    {
      prompt: "אֵיזֶה כּוֹכַב לֶכֶת מְכוּנֶּה 'כּוֹכַב הַלֶּכֶת הָאָדוֹם'?",
      options: ["מַאֲדִים", "צֶדֶק", "נוֹגַהּ", "שַׁבְּתַאי"],
      answer: 0,
      display: { kind: "emoji", value: "🪐" },
      speak: "איזה כוכב לכת מכונה כוכב הלכת האדום?",
      hint: "שְׁמוֹ בְּעִבְרִית קָשׁוּר לַצֶּבַע הָאָדוֹם!",
    },
    {
      prompt: "מָה קוֹרֶה לְמַיִם כַּאֲשֶׁר מְקָרְרִים אוֹתָם לְטֶמְפֵּרָטוּרָה מִתַּחַת לְ-0 מַעֲלוֹת?",
      options: [
        "הוֹפְכִים לְקֶרַח (מוּצָק)",
        "הוֹפְכִים לְאֵדִים (גַּז)",
        "רוֹתְחִים",
        "נֶעֱלָמִים",
      ],
      answer: 0,
      display: { kind: "emoji", value: "🧊" },
      speak: "מה קורה למים כאשר מקררים אותם מתחת לאפס מעלות?",
      hint: "חִשְׁבוּ מָה קוֹרֶה לְמַיִם בַּמַּקְפִּיא",
    },
    {
      prompt: "אֵיזֶה חֵלֶק בַּצֶּמַח קוֹלֵט מַיִם וּמִינֵרָלִים מִן הָאֲדָמָה?",
      options: ["הַשּׁוֹרָשִׁים", "הֶעָלִים", "הַפֶּרַח", "הַפְּרִי"],
      answer: 0,
      display: { kind: "emoji", value: "🌱" },
      speak: "איזה חלק בצמח קולט מים ומינרלים מן האדמה?",
      hint: "הַחֵלֶק שֶׁנִּמְצָא מִתַּחַת לִפְנֵי הַקַּרְקַע",
    },
    {
      prompt: "אֵיזֶה כּוֹכַב לֶכֶת הוּא הַגָּדוֹל בְּיוֹתֵר בְּמַעֲרֶכֶת הַשֶּׁמֶשׁ שֶׁלָּנוּ?",
      options: ["צֶדֶק (יוּפִּיטֶר)", "כַּדּוּר הָאָרֶץ", "חַמָּה", "נֶפְּטוּן"],
      answer: 0,
      display: { kind: "emoji", value: "🌌" },
      speak: "איזה כוכב לכת הוא הגדול ביותר במערכת השמש שלנו?",
      hint: "עֲנַק הַגַּזִּים הַגָּדוֹל בְּמַעֲרֶכֶת הַשֶּׁמֶשׁ",
    },
    {
      prompt: "אֵיזֶה גַּז צְמָחִים מְשַׁחְרְרִים לָאֲוִיר בְּתַהֲלִיךְ הַפּוֹטוֹסִינְתֶּזָה?",
      options: ["חַמְצָן", "הֶלְיוּם", "מֵימָן", "חַנְקָן"],
      answer: 0,
      display: { kind: "emoji", value: "🍃" },
      speak: "איזה גז צמחים משחררים לאוויר בתהליך הפוטוסינתזה?",
      hint: "הַגַּז הַחִיּוּנִי שֶׁאֲנַחְנוּ נוֹשְׁמִים!",
    },
    {
      prompt: "כַּמָּה יָמִים בְּעֵרֶךְ לוֹקֵחַ לְכַדּוּר הָאָרֶץ לְהַקִּיף אֶת הַשֶּׁמֶשׁ הַקָּפָה שְׁלֵמָה?",
      options: ["365 יָמִים (שָׁנָה)", "30 יָמִים (חוֹדֶשׁ)", "24 שָׁעוֹת", "100 יָמִים"],
      answer: 0,
      display: { kind: "emoji", value: "🌍" },
      speak: "כמה ימים בערך לוקח לכדור הארץ להקיף את השמש הקפה שלמה?",
      hint: "הַקָּפָה שְׁלֵמָה סְבִיב הַשֶּׁמֶשׁ נִקְרֵאת שָׁנָה אַחַת",
    },
  ];
}

export interface WordItem {
  vocalized: string;
  plain: string;
  syllables: string[];
  emoji: string;
  hint: string;
}

export const VOICE_WORDS_BY_GRADE: Record<string, WordItem[]> = {
  young: [
    {
      vocalized: "שֶׁמֶשׁ",
      plain: "שמש",
      syllables: ["שֶׁ", "מֶשׁ"],
      emoji: "☀️",
      hint: "מְאִירָה בַּשָּׁמַיִם בַּיּוֹם",
    },
    {
      vocalized: "כּוֹכָב",
      plain: "כוכב",
      syllables: ["כּוֹ", "כָב"],
      emoji: "⭐",
      hint: "זוֹהֵר בִּשְׁמֵי הַלַּיְלָה",
    },
    {
      vocalized: "פַּרְפַּר",
      plain: "פרפר",
      syllables: ["פַּרְ", "פַּר"],
      emoji: "🦋",
      hint: "חֶרֶק צִבְעוֹנִי עִם כְּנָפַיִים",
    },
    {
      vocalized: "רַכֶּבֶת",
      plain: "רכבת",
      syllables: ["רַ", "כֶּ", "בֶת"],
      emoji: "🚂",
      hint: "נוֹסַעַת עַל פַּסֵּי בַּרְזֶל",
    },
    {
      vocalized: "תַּפּוּחַ",
      plain: "תפוח",
      syllables: ["תַּ", "פּוּ", "חַ"],
      emoji: "🍎",
      hint: "פְּרִי מָתוֹק וּפָרִיךְ",
    },
  ],
  older: [
    {
      vocalized: "חַלָּלִית",
      plain: "חללית",
      syllables: ["חַ", "לָּ", "לִית"],
      emoji: "🚀",
      hint: "כְּלִי טַיִס הַמַּמְרִיא לֶחָלָל הַחִיצוֹן",
    },
    {
      vocalized: "טֵלֶסְקוֹפּ",
      plain: "טלסקופ",
      syllables: ["טֵ", "לֶסְ", "קוֹפּ"],
      emoji: "🔭",
      hint: "מַכְשִׁיר לִצְפִיָּה בְּכּוֹכָבִים רְחוֹקִים",
    },
    {
      vocalized: "גָּלַקְסְיָה",
      plain: "גלקסיה",
      syllables: ["גָּ", "לַקְ", "סְיָה"],
      emoji: "🌌",
      hint: "מַעֲרֶכֶת עֲצוּמָה שֶׁל מִילְיַארְדֵי כּוֹכָבִים",
    },
    {
      vocalized: "מַעְבָּדָה",
      plain: "מעבדה",
      syllables: ["מַעְ", "בָּ", "דָה"],
      emoji: "🔬",
      hint: "חֶדֶר מְיוּחָד לְעֲרִיכַת נִיסּוּיִים מַדָּעִיִּים",
    },
    {
      vocalized: "לוויין",
      plain: "לוויין",
      syllables: ["לַ", "וְ", "יָן"],
      emoji: "🛰️",
      hint: "מַקִּיף אֶת כַּדּוּר הָאָרֶץ וּמְשַׁדֵּר מֵידָע",
    },
  ],
};
