import React, { useState } from "react";
import {
  Play,
  Sparkles,
  CheckCircle2,
  Shield,
  Heart,
  Zap,
  Swords,
  Compass,
  Volume2,
  VolumeX,
  GitBranch,
  Award,
  Users,
  BookOpen,
  Flame,
} from "lucide-react";
import {
  ClassState,
  IslandId,
  PartyRole,
  Profile,
  QuestType,
} from "../types";
import { BADGES, GAMES, ISLANDS } from "../data/content";
import { AvatarSvg, IslandIllustration } from "./AvatarSvg";
import { sfx, speak } from "../audio";

interface StudentGamingHubProps {
  mode: "skill-tree" | "quests";
  profile: Profile;
  classState: ClassState;
  selectedIsland: IslandId | null;
  soundMuted: boolean;
  onSelectIsland: (id: IslandId | null) => void;
  onLaunchGame: (gameId: string) => void;
  onUpdateProfile: (next: Profile) => void;
  onOpenProfileModal: () => void;
  onToggleMute: () => void;
  onSwitchToBoard: () => void;
}

export const PARTY_ROLES_INFO: Record<
  PartyRole,
  {
    title: string;
    engTitle: string;
    emoji: string;
    badgeClass: string;
    desc: string;
    superpower: string;
  }
> = {
  tank: {
    title: "הַטַּנְק הַמּוֹבִיל",
    engTitle: "Tank",
    emoji: "🛡️",
    badgeClass: "bg-sky-100 text-sky-900 border-sky-300",
    desc: "מֵעִיז לִפְתּוֹחַ נוֹשְׂאִים חֲדָשִׁים, שׁוֹאֵל שְׁאֵלוֹת אַמִּיצוֹת וּמוֹבִיל אֶת הַפְּלָאטוֹן קָדִימָה!",
    superpower: "+15% XP בִּפְתִיחַת עֲנַף מְיוּמָנוּת חָדָשׁ",
  },
  healer: {
    title: "הַהִילֶר הַתּוֹמֵךְ",
    engTitle: "Healer",
    emoji: "💚",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
    desc: "מַסְבִּיר בְּסַבְלָנוּת לַחֲבֵרִים, מְחַלֵּק 'בָּאפִים' שֶׁל עִידּוּד וּמְסַיֵּיעַ כְּשֶׁמִּישֶׁהוּ נִתְקָע!",
    superpower: "מְמַלֵּא מַד HP וְנוֹתֵן בָּאף רֶמֶז לַקְּבוּצָה",
  },
  dps: {
    title: "אַלּוּף הַבִּיצּוּעַ",
    engTitle: "DPS / Mage",
    emoji: "⚔️",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    desc: "מְפַצֵּחַ אֶתְגָּרִים בִּמְהִירוּת, מֵפִיק תּוֹצָרִים יְצִירָתִיִּים וּמַכְנִיעַ קְרָבוֹת בּוֹס!",
    superpower: "נֶזֶק כָּפוּל לְנקוּדוֹת הַתּוֹרְפָּה בִּקְרָבוֹת בּוֹס",
  },
};

export const CLASS_BUFFS = [
  {
    id: "buff-hint",
    name: "💡 בָּאף הַהֶסְבֵּר הַחָכָם (Buff)",
    desc: "חִיזּוּק מֵהַמּוֹרֶה אוֹ מֵחָבֵר: פּוֹתֵחַ רְמָזִים מְאִירֵי עֵינַיִם וּמַעֲלֶה כּוֹחַ לְמִידָה בְּ-+20% XP!",
  },
  {
    id: "buff-checkpoint",
    name: "🚩 בָּאף מָגֵן הַצֶּ'קְפּוֹינְט (Checkpoint Shield)",
    desc: "טָעוּת לֹא מוֹחֶקֶת הִתְקַדְּמוּת! שׁוֹמֵר עַל הָרֶצֶף וּמְאַפְשֵׁר Try Again חָכָם יוֹתֵר.",
  },
  {
    id: "buff-coop",
    name: "🤝 בָּאף קוֹ-אוֹפּ כִּיתָּתִי (Co-op Synergy)",
    desc: "עֲבוֹדָה בְּזוּגוֹת אוֹ בִּקְבוּצָה מַכְפִּילָה אֶת כּוֹכְבֵי הַשָּׁלָל (Loot) בְּסוֹף הַשִּׁיעוּר!",
  },
];

interface SkillBranchMeta {
  islandId: IslandId;
  treeTitle: string;
  tier1Skill: string;
  tier2Skill: string;
  ultimateSkill: string;
  bossTitle: string;
  bossEmoji: string;
  bossWeakness: string;
}

export const SKILL_TREE_BRANCHES: SkillBranchMeta[] = [
  {
    islandId: "letters",
    treeTitle: "עֲנַף הַשָּׂפָה וְהַקְּרִיאָה",
    tier1Skill: "שָׁלָב 1: זִיהוּי אוֹתִיּוֹת, צְלִיל פּוֹתֵחַ וְנִיקּוּד",
    tier2Skill: "שָׁלָב 2: קְרִיאָה קוֹלִית שׁוֹטֶפֶת בְּמִיקְרוֹפוֹן",
    ultimateSkill: "יְכוֹלֶת-עַל: קוֹרֵא הַמְּגִילּוֹת הַגָּלַקְטִי 📖✨",
    bossTitle: "דְּרָקוֹן הַנִּיקּוּד וְהַהֲבָרוֹת",
    bossEmoji: "🐲",
    bossWeakness: "הַקְשָׁבָה לַצְּלִיל הַפּוֹתֵחַ וַחֲלוּקַת מִילָּה לַהֲבָרוֹת קְצָרוֹת!",
  },
  {
    islandId: "numbers",
    treeTitle: "עֲנַף הַמָּתֵמָטִיקָה וְהַזְּמַן",
    tier1Skill: "שָׁלָב 1: חִיבּוּר, חִיסּוּר וּקְרִיאַת שָׁעוֹן מְחוֹגִים",
    tier2Skill: "שָׁלָב 2: לוּחַ הַכֶּפֶל, שְׁבָרִים וְחִישּׁוּב מָהִיר",
    ultimateSkill: "יְכוֹלֶת-עַל: אַדְרִיכַל הַמִּסְפָּרִים וְהַגֵּיאוֹמֶטְרִיָּה 🧮⚡",
    bossTitle: "הָאַרְכִי-בּוֹס מֵתוֹדִיקָה",
    bossEmoji: "🐉",
    bossWeakness: "פֵּירוּק לַעֲשָׂרוֹת שְׁלֵמוֹת וְשִׁימּוּשׁ בְּחוֹק הַחִילּוּף!",
  },
  {
    islandId: "words",
    treeTitle: "עֲנַף אוֹצַר הַמִּילִּים וְהַהַבָּעָה",
    tier1Skill: "שָׁלָב 1: הַרְכָּבַת מִילִּים מֵאוֹתִיּוֹת מְפוּזָּרוֹת",
    tier2Skill: "שָׁלָב 2: מִילִּים נִרְדָּפוֹת, הֲפָכִים וּפִתְגָּמִים",
    ultimateSkill: "יְכוֹלֶת-עַל: אשף הַסִּיפּוּרִים וְהַשָּׂפָה 🧩👑",
    bossTitle: "שׁוֹמֵר חִידוֹת הַהֲפָכִים",
    bossEmoji: "sphinx" === "sphinx" ? "🦁" : "🦁",
    bossWeakness: "מְצִיאַת הַשּׁוֹרֶשׁ הַמְּשׁוּתָּף שֶׁל מִשְׁפַּחַת הַמִּילִּים!",
  },
  {
    islandId: "science",
    treeTitle: "עֲנַף הַמַּדָּע, הַטֶּבַע וְהֶחָלָל",
    tier1Skill: "שָׁלָב 1: נִיסּוּי בְּמַצְּבֵי הַצְּבִירָה בַּמַּעְבָּדָה",
    tier2Skill: "שָׁלָב 2: מַעֲרֶכֶת הַשֶּׁמֶשׁ, צְמָחִים וְגוּף הָאָדָם",
    ultimateSkill: "יְכוֹלֶת-עַל: מַדְעָן הֶחָלָל הָרָאשִׁי 🪐🔬",
    bossTitle: "גּוֹלֶם הַקֶּרַח וְהַקִּיטוֹר",
    bossEmoji: "👾",
    bossWeakness: "שִׁינּוּי הַטֶּמְפֵּרָטוּרָה בַּמַּעְבָּדָה מִמוּצָק לְנוֹזֵל וּלְגַז!",
  },
  {
    islandId: "logic",
    treeTitle: "עֲנַף הָאַלְגּוֹרִיתְמִיקָה וְהַחֲשִׁיבָה",
    tier1Skill: "שָׁלָב 1: זִיכָּרוֹן חָזוּתִי וְהַשְׁלָמַת סְדָרוֹת",
    tier2Skill: "שָׁלָב 2: תִּכְנוּת מַסְלוּל רוֹבּוֹט הָאוֹר בִּפְקוּדוֹת",
    ultimateSkill: "יְכוֹלֶת-עַל: מְהַנְדֵּס הַקּוֹד וְהָרוֹבּוֹטִים 🤖🧠",
    bossTitle: "מְבוֹךְ הַלּוֹגִיקָה הַמִּסְתּוֹרִי",
    bossEmoji: "🤖",
    bossWeakness: "תִּכְנוּן צַעַד-אַחַר-צַעַד לִפְנֵי לְחִיצָה עַל הַפְעָלָה!",
  },
  {
    islandId: "create",
    treeTitle: "עֲנַף הַיְּצִירָה, הָאֳמָנוּת וְהַסְּקִינִים",
    tier1Skill: "שָׁלָב 1: צִיּוּר דְּגָמִים בְּפִיקְסֶל-אוֹר מְנַגֵּן",
    tier2Skill: "שָׁלָב 2: עִיצּוּב סְקִינִים וִיצִירוֹת לַגָּלֶרְיָה הַכִּיתָּתִית",
    ultimateSkill: "יְכוֹלֶת-עַל: יוֹצֵר הָעוֹלָמוֹת הַזּוֹהֲרִים 🎨🌟",
    bossTitle: "רוּחַ הַקַּנְבָּס הָרֵיק",
    bossEmoji: "🎨",
    bossWeakness: "שִׁילּוּב צְבָעִים וְצְלִילִים חָפְשִׁי לְלֹא פַּחַד מִטָּעוּיוֹת!",
  },
];

export const GAMING_PEDAGOGY_GLOSSARY = [
  {
    category: "1. תַּהֲלִיךְ הַלְּמִידָה וְהִתְקַדְּמוּת",
    items: [
      {
        term: "עֲלִיַּית שָׁלָב (Level Up)",
        emoji: "🆙",
        meaning: "שְׁלִיטָה בִּמְיוּמָנוּת חֲדָשָׁה אוֹ סִיּוּם נוֹשֵׂא!",
        pedagogy:
          "בִּמְקוֹם לוֹמַר 'סִיַּימְנוּ פֶּרֶק', אֲנַחְנוּ עוֹשִׂים Level Up — הַיְּכוֹלוֹת שֶׁלְּךָ עָלוּ בִּזְכוּת הַמַּאֲמָץ שֶׁלְּךָ!",
      },
      {
        term: "מַדַּד נִיסָּיוֹן (XP - Experience Points)",
        emoji: "✨",
        meaning: "נְקוּדּוֹת שֶׁמִּצְטַבְּרוֹת עַל כָּל תַּרְגּוּל, הִשְׁתַּתְּפוּת וְנִיסָּיוֹן.",
        pedagogy:
          "XP אֵינוֹ צִיּוּן מַלְחִיץ שֶׁל מִבְחָן — הוּא תָּמִיד עוֹלֶה כְּכָל שֶׁמִּתְאַמְּצִים וּמְנַסִּים!",
      },
      {
        term: "עֵץ מְיוּמָנוּיוֹת (Skill Tree)",
        emoji: "🌳",
        meaning: "מַפַּת הַמַּסְלוּל הַלִּימּוּדִי שֶׁלְּךָ בָּאִיִּים.",
        pedagogy:
          "כְּמוֹ בְּמִשְׂחֲקֵי תַּפְקִידִים (RPG), לִימּוּד בְּסִיסִי (לְמָשָׁל חִיבּוּר וְחִיסּוּר) פּוֹתֵחַ אֶת הַדֶּרֶךְ לִמְיוּמָנוּיוֹת עַל (כֶּפֶל, שְׁבָרִים וְרוֹבּוֹטִיקָה)!",
      },
    ],
  },
  {
    category: "2. אֶתְגָּרִים וּמְשִׂימוֹת (Quests & Bosses)",
    items: [
      {
        term: "קְווֶסְט יוֹמִי / רָאשִׁי / צַד (Quests)",
        emoji: "📜",
        meaning: "מְשִׂימָה יוֹמִית קְצָרָה, פְּרוֹיֶקְט רָאשִׁי אוֹ מְשִׂימַת בּוֹנוּס לְהַעֲשָׁרָה.",
        pedagogy:
          "מְחַלֵּק אֶת הַלְּמִידָה לְמַטְּרוֹת בְּרוּרוֹת וּמְהַנּוֹת עִם שָׁלָל (Loot) בְּסוֹף כָּל קְווֶסְט.",
      },
      {
        term: "קְרַב בּוֹס (Boss Fight) — 'הָאַרְכִי-בּוֹס מֵתוֹדִיקָה'",
        emoji: "🐉",
        meaning: "אֶתְגַּר מְסַכֵּם אוֹ מַצֶּגֶת שֶׁבּוֹ מְיַשְּׂמִים אֶת כָּל הַכֵּלִים שֶׁאָסַפְנוּ!",
        pedagogy:
          "לְכָל בּוֹס יֵשׁ 'נְקוּדַת תּוֹרְפָּה' — כְּשֶׁמִּשְׁתַּמְּשִׁים בַּנּוֹסְחָה אוֹ בַּטֶּכְנִיקָה הַנְּכוֹנָה, מַכְנִיעִים אֶת הַפַּחַד מֵהַמִּבְחָן!",
      },
    ],
  },
  {
    category: "3. תְּפִיסַת הַכִּישָּׁלוֹן, מָשׁוֹב וְווִיסּוּת (Growth Mindset)",
    items: [
      {
        term: "נְקוּדַת שְׁמִירָה (Checkpoint)",
        emoji: "🚩",
        meaning: "טְיוּטָה, מִבְדַּק אֶמְצַע אוֹ מָשׁוֹב מְעַצֵּב מֵהַמּוֹרֶה.",
        pedagogy:
          "אִם טָעִיתָ — אַתָּה לֹא מַתְחִיל מֵאֶפֶס! חוֹזְרִים לַצֶּ'קְפּוֹינְט הָאַחֲרוֹן, מְתַקְּנִים וּמַמְשִׁיכִים קָדִימָה.",
      },
      {
        term: "Game Over = לְחַץ Try Again!",
        emoji: "🔄",
        meaning: "כִּישָּׁלוֹן הוּא רַק הַזְמָנָה לְנַסּוֹת שׁוּב חֲכָמִים וּמְנוּסִּים יוֹתֵר.",
        pedagogy:
          "תְּפִיסַת מְסוּגָּלוּת צוֹמַחַת (Growth Mindset): כָּל שַׂחְקָן גָּדוֹל נִפְסַל לִפְנֵי שֶׁפִּיצֵּחַ אֶת הַשָּׁלָב!",
      },
      {
        term: "מַד בְּרִיאוּת וְקֶשֶׁב (HP / Mana Bar)",
        emoji: "❤️",
        meaning: "מַד הָאֵנֶרְגְּיָה הָרִגְשִׁית, הַקֶּשֶׁב וְהַסַּבְלָנוּת שֶׁלִּי בַּשִּׁיעוּר.",
        pedagogy:
          "כְּשֶׁהַ-HP נָמוּךְ, לוֹקְחִים 'שִׁיקּוּי בְּרִיאוּת' (נְשִׁימָה, מִילָּה טוֹבָה אוֹ הַפְסָקָה קְצָרָה) וְחוֹזְרִים בְּכוֹחַ מָלֵא!",
      },
    ],
  },
  {
    category: "4. תַּפְקִידִים חֶבְרָתִיִּים וְשִׁיתּוּף פְּעוּלָה (Co-op & Loot)",
    items: [
      {
        term: "פְּלָאטוֹן / קוֹ-אוֹפּ (Co-op Party / Guild)",
        emoji: "🛡️",
        meaning: "לְמִידַת עֲמִיתִים שֶׁבָּהּ לְכָל תַּלְמִיד יֵשׁ חוֹזְקָה מְיוּחֶדֶת.",
        pedagogy:
          "הַ'טַנְק' מוֹבִיל, הַ'הִילֶר' תּוֹמֵךְ וּמַסְבִּיר, וְ'אַלּוּף הַבִּיצּוּעַ' (DPS) בּוֹנֶה אֶת הַתּוֹצָר — יַחַד מְנַצְּחִים!",
      },
      {
        term: "בָּאף (Buff) + סְקִינִים וְשָׁלָל (Skins & Loot)",
        emoji: "🎁",
        meaning: "חִיזּוּק זְמַנִּי מֵחָבֵר/מוֹרֶה וַאֲבִיזְרֵי עִיצּוּב אִישִׁיִּים לַדְּמוּת.",
        pedagogy:
          "בִּיטּוּי עַצְמִי וְתַגְמוּל פְּנִימִי שֶׁמְּשַׁקֵּף אֶת הַמַּסָּע וְהַהֶישֵּׂגִים שֶׁל הַתַּלְמִיד.",
      },
    ],
  },
];

export function StudentGamingHub({
  mode,
  profile,
  classState,
  selectedIsland,
  soundMuted,
  onSelectIsland,
  onLaunchGame,
  onUpdateProfile,
  onOpenProfileModal,
  onToggleMute,
  onSwitchToBoard,
}: StudentGamingHubProps) {
  const [questFilter, setQuestFilter] = useState<QuestType | "all">("all");
  const [showGlossary, setShowGlossary] = useState(false);
  const [potionMessage, setPotionMessage] = useState<string | null>(null);

  // Derived RPG stats
  const totalXp =
    profile.xp ?? profile.totalStars * 10 + Object.keys(profile.gamesPlayed).length * 25;
  const currentLevel = Math.max(1, Math.floor(totalXp / 100) + 1);
  const xpIntoLevel = totalXp % 100;
  const currentHp = profile.hp ?? 90;
  const currentRole: PartyRole = profile.partyRole || "dps";
  const roleMeta = PARTY_ROLES_INFO[currentRole];
  const activeBuff =
    profile.activeBuff || CLASS_BUFFS[0].name;

  const handleDrinkHealthPotion = () => {
    sfx.win();
    const nextHp = 100;
    const nextXp = totalXp + 15;
    onUpdateProfile({
      ...profile,
      hp: nextHp,
      xp: nextXp,
      level: Math.max(1, Math.floor(nextXp / 100) + 1),
    });
    const msg =
      "🧪 שָׁתִיתָ שִׁיקּוּי בְּרִיאוּת וְקֶשֶׁב! מַד הַ-HP הִתְמַלֵּא לְ-100% וְקִיבַּלְתָּ +15 XP עַל וִיסּוּת עַצְמִי חָכָם!";
    setPotionMessage(msg);
    speak("כל הכבוד! לקחת נשימה עמוקה, מד הבריאות והקשב שלך התמלא למאה אחוז!");
    setTimeout(() => setPotionMessage(null), 4500);
  };

  const handleSelectRole = (role: PartyRole) => {
    sfx.correct();
    onUpdateProfile({
      ...profile,
      partyRole: role,
    });
    speak(`בחרת בתפקיד ${PARTY_ROLES_INFO[role].title} בפלאטון הכיתתי!`);
  };

  const handleActivateBuff = (buffName: string) => {
    sfx.pop();
    onUpdateProfile({
      ...profile,
      activeBuff: buffName,
      xp: totalXp + 10,
    });
  };

  const filteredGames = selectedIsland
    ? GAMES.filter((g) => g.island === selectedIsland)
    : GAMES;

  const filteredMissions =
    questFilter === "all"
      ? classState.missions
      : classState.missions.filter(
          (m) => (m.questType || "main") === questFilter,
        );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ====================================================================
         TOP RPG PLAYER HUD (Level Up, XP Bar, HP/Mana Potion, Buff & Co-op Role)
         ==================================================================== */}
      <section className="glass-strong rounded-3xl p-5 md:p-6 border border-sky-200/80 space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Left: Avatar + Level + XP Bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenProfileModal}
              className="btn-glow relative rounded-3xl p-1.5 bg-white/90 border-2 border-sky-400 shrink-0 shadow-xs"
              title="פְּתַח דְּמוּת שַׂחְקָן, סְקִינִים וְשָׁלָל (Skins & Loot)"
            >
              <AvatarSvg config={profile.avatar} size={74} />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-[11px] shadow-xs tabular-nums">
                LVL {currentLevel}
              </span>
            </button>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-sky-600 text-white text-xs font-extrabold tabular-nums">
                  🆙 Level {currentLevel}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold ${roleMeta.badgeClass}`}
                >
                  {roleMeta.emoji} {roleMeta.title} ({roleMeta.engTitle})
                </span>
                <span className="text-xs font-bold text-amber-600 tabular-nums">
                  ⭐ {profile.stars} שָׁלָל כּוֹכָבִים (Loot)
                </span>
              </div>

              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 nikud">
                שַׂחְקָן: {profile.name} · כִּיתָּה {profile.grade}׳ ({classState.name})
              </h1>

              {/* XP Bar */}
              <div className="w-full max-w-md space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>✨ מַדַּד נִיסָּיוֹן (XP): {totalXp} XP</span>
                  <span className="text-sky-700 tabular-nums">
                    עוֹד {100 - xpIntoLevel} XP לְ-Level Up!
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200/90 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${Math.max(8, xpIntoLevel)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: HP / Mana Bar + Health Potion + Quick Controls */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3">
            {/* HP / Attention Bar */}
            <div className="p-3 rounded-2xl bg-white/85 border border-slate-200/90 flex items-center gap-3">
              <div className="space-y-1 min-w-[165px]">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-600 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>מַד קֶשֶׁב וְאֵנֶרְגְּיָה (HP)</span>
                  </span>
                  <span className="tabular-nums font-extrabold text-slate-800">
                    {currentHp}/100
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-rose-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${currentHp}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleDrinkHealthPotion}
                className="btn-glow px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 text-xs font-extrabold transition-colors whitespace-nowrap"
                title="עייפים או מוצפים? שתו שיקוי בריאות להפסקה קצרה ומילוי אנרגיה!"
              >
                🧪 שְׁתֵה שִׁיקּוּי HP
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setShowGlossary((v) => !v);
                }}
                className={`btn-glow px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  showGlossary
                    ? "bg-amber-400 border-amber-400 text-slate-950"
                    : "bg-white/90 border-slate-200 text-slate-700 hover:bg-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                <span>מִילּוֹן הַגֵּיימִינְג הַחִינוּכִי</span>
              </button>

              <button
                type="button"
                onClick={onOpenProfileModal}
                className="btn-glow px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>סְקִינִים וְשָׁלָל (Skins & Loot)</span>
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                className="btn-glow p-2 rounded-xl bg-white/85 border border-slate-200 text-slate-700"
                title={soundMuted ? "הפעל צלילים" : "השתק צלילים"}
              >
                {soundMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-sky-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Health Potion Feedback Banner */}
        {potionMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900 flex items-center justify-between animate-pop">
            <span>{potionMessage}</span>
            <button
              type="button"
              onClick={() => setPotionMessage(null)}
              className="text-emerald-700 underline"
            >
              סְגוֹר
            </button>
          </div>
        )}

        {/* Active Buff + Co-op Party Role Bar */}
        <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Co-op Role Picker (7 cols) */}
          <div className="lg:col-span-7 flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span>הַתַּפְקִיד שֶׁלִּי בַּפְּלָאטוֹן (Co-op Party):</span>
            </span>
            {(["tank", "healer", "dps"] as PartyRole[]).map((r) => {
              const info = PARTY_ROLES_INFO[r];
              const active = currentRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSelectRole(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    active
                      ? `${info.badgeClass} ring-2 ring-sky-500 shadow-xs`
                      : "bg-white/80 border-slate-200 text-slate-600 hover:bg-white"
                  }`}
                >
                  <span>{info.emoji}</span>
                  <span>{info.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Buff Selector (5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-end gap-2">
            <span className="text-xs font-extrabold text-violet-700 whitespace-nowrap">
              ✨ בָּאף פָּעִיל (Buff):
            </span>
            <select
              value={activeBuff}
              onChange={(e) => handleActivateBuff(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-xs font-bold text-violet-900"
            >
              {CLASS_BUFFS.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ====================================================================
         COLLAPSIBLE INTERACTIVE GAMING PEDAGOGY GLOSSARY (מילון הגיימינג החינוכי)
         ==================================================================== */}
      {showGlossary && (
        <section className="glass-strong rounded-3xl p-6 border-2 border-amber-300 space-y-5 animate-pop">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>🎮</span>
                <span>מִילּוֹן הַגֵּיימִינְג הַפֵּדָגוֹגִי — לְדַבֵּר בִּשְׂפַת הַשַּׂחְקָנִים!</span>
              </h2>
              <p className="text-xs text-slate-600">
                לִחֲצוּ עַל כָּל מוּשָׂג כְּדֵי לִשְׁמוֹעַ הֶסְבֵּר קוֹלִי כֵּיצַד מוּשְׂגֵי הַמִּשְׂחָקִים הוֹפְכִים אֶת הַלְּמִידָה בַּכִּיתָּה לְהַרְפַּתְקָה מְנִיעָה לִפְעוּלָה:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGlossary(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              סְגוֹר מִילּוֹן ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GAMING_PEDAGOGY_GLOSSARY.map((group) => (
              <div
                key={group.category}
                className="p-4 rounded-2xl bg-white/85 border border-slate-200/90 space-y-3"
              >
                <h3 className="text-sm font-extrabold text-sky-800 border-b border-slate-100 pb-1.5">
                  {group.category}
                </h3>
                <div className="space-y-2.5">
                  {group.items.map((item) => (
                    <div
                      key={item.term}
                      onClick={() => {
                        sfx.click();
                        speak(`${item.term}. ${item.meaning}. ${item.pedagogy}`);
                      }}
                      className="cursor-pointer p-3 rounded-xl bg-sky-50/60 hover:bg-sky-100/70 border border-sky-200/70 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 nikud">
                          <span>{item.emoji}</span>
                          <span>{item.term}</span>
                        </div>
                        <span className="text-[10px] font-bold text-sky-600">
                          🔊 הַקְרֵא
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-1 nikud">
                        {item.meaning}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 nikud">
                        {item.pedagogy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
         MODE 1: SKILL TREE & REALMS (עץ המיומנויות וממלכות האיים)
         ==================================================================== */}
      {mode === "skill-tree" ? (
        <div className="space-y-8">
          {/* Skill Tree Header */}
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-sky-600 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4" />
                <span>RPG Skill Tree · תּוֹכְנִית הַלִּימּוּדִים כְּעֵץ מְיוּמָנוּיוֹת מתפתח</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 nikud">
                🌳 עֵץ הַמְּיוּמָנוּיוֹת וּמַמְלְכוֹת הָאוֹר (Skill Tree)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 nikud">
                בִּחֲרוּ עֲנַף מְיוּמָנוּת כְּדֵי לִפְתּוֹחַ שְׁלַבִּים חֲדָשִׁים, לִצְבּוֹר XP וְלִפְתּוֹחַ יְכוֹלוֹת-עַל! כָּל מְיוּמָנוּת בְּסִיסִית פּוֹתַחַת אֶת הַשָּׁלָב הַבָּא בָּעֵץ.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedIsland && (
                <button
                  type="button"
                  onClick={() => onSelectIsland(null)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-sky-700 hover:bg-sky-50"
                >
                  הַצֵּג אֶת כָּל עֵץ הַמְּיוּמָנוּיוֹת
                </button>
              )}
              <button
                type="button"
                onClick={onSwitchToBoard}
                className="btn-glow px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span>לְלוּחַ הַמַּסָּע הַכִּיתָּתִי</span>
              </button>
            </div>
          </section>

          {/* 6 Skill Tree Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SKILL_TREE_BRANCHES.map((branch, idx) => {
              const isl =
                ISLANDS.find((i) => i.id === branch.islandId) || ISLANDS[0];
              const islandGames = GAMES.filter(
                (g) => g.island === branch.islandId,
              );
              const playedInBranch = islandGames.reduce(
                (acc, g) => acc + (profile.gamesPlayed[g.id] || 0),
                0,
              );
              const branchLevel = Math.min(5, 1 + playedInBranch);
              const isSelected = selectedIsland === branch.islandId;

              return (
                <div
                  key={branch.islandId}
                  className={`glass-strong rounded-3xl p-5 transition-all flex flex-col justify-between gap-4 border-2 ${
                    isSelected
                      ? "border-sky-500 bg-white/95 shadow-md"
                      : "border-white/90 hover:border-sky-300"
                  }`}
                >
                  {/* Top Island & Skill Branch Header */}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-800 text-[11px] font-extrabold">
                          {branch.treeTitle} · רָמָה {branchLevel}/5
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-1 nikud">
                          {isl.name}
                        </h3>
                        <p className="text-xs text-sky-600 font-bold nikud">
                          {isl.subtitle}
                        </p>
                      </div>
                      <div
                        onClick={() => onSelectIsland(branch.islandId)}
                        className="cursor-pointer shrink-0 animate-float"
                        style={{ animationDelay: `${idx * 0.35}s` }}
                      >
                        <IslandIllustration id={branch.islandId} size={78} />
                      </div>
                    </div>

                    {/* Visual Skill Progression Nodes (Tier 1 -> Tier 2 -> Ultimate) */}
                    <div className="space-y-2 p-3 rounded-2xl bg-white/85 border border-slate-200/80 text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0">
                          ✓
                        </span>
                        <span className="nikud">{branch.tier1Skill}</span>
                      </div>
                      <div className="mr-2.5 h-3 border-r-2 border-dashed border-sky-300" />
                      <div className="flex items-center gap-2 text-sky-900 font-bold">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                            playedInBranch >= 1
                              ? "bg-sky-600 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          2
                        </span>
                        <span className="nikud">{branch.tier2Skill}</span>
                      </div>
                      <div className="mr-2.5 h-3 border-r-2 border-dashed border-amber-300" />
                      <div className="flex items-center gap-2 text-amber-800 font-extrabold">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                            playedInBranch >= 2
                              ? "bg-amber-400 text-slate-950"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          👑
                        </span>
                        <span className="nikud">{branch.ultimateSkill}</span>
                      </div>
                    </div>

                    {/* Boss Weak-Spot Preview */}
                    <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/80 text-[11px]">
                      <div className="font-extrabold text-rose-900 flex items-center gap-1">
                        <span>{branch.bossEmoji}</span>
                        <span>בּוֹס הָעֲנָף: {branch.bossTitle}</span>
                      </div>
                      <div className="text-rose-700 mt-0.5 nikud">
                        נְקוּדַת תּוֹרְפָּה: {branch.bossWeakness}
                      </div>
                    </div>
                  </div>

                  {/* Direct Skill Nodes / Games Launch Buttons */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/70">
                    <div className="text-[11px] font-bold text-slate-500">
                      שְׁלַבֵּי אִימּוּן וּקְווֶסְטִים בָּעֲנָף זֶה (+45 XP לְכָל שָׁלָב):
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {islandGames.map((g, gIdx) => {
                        const times = profile.gamesPlayed[g.id] || 0;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => onLaunchGame(g.id)}
                            className="btn-glow w-full p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-between gap-2 shadow-xs"
                          >
                            <span className="flex items-center gap-1.5 truncate nikud">
                              <span>{g.emoji}</span>
                              <span>
                                שָׁלָב {gIdx + 1}: {g.title}
                              </span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] shrink-0 tabular-nums">
                              {times > 0 ? `🚩 צֶ'קְפּוֹינְט (${times})` : "שַׂחֵק +XP"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* All Interactive Simulation Nodes Grid when an island is selected */}
          {selectedIsland && (
            <section className="glass-strong rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900">
                  🎯 מְשִׂחֲקֵי הָעֲנָף הַנִּבְחָר ({filteredGames.length}):
                </h3>
                <button
                  type="button"
                  onClick={() => onSelectIsland(null)}
                  className="text-xs font-bold text-sky-600 hover:underline"
                >
                  הַצֵּג אֶת כָּל הָעֲנָפִים
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGames.map((game) => (
                  <div
                    key={game.id}
                    className="p-4 rounded-2xl bg-white/90 border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-base font-extrabold text-slate-900 flex items-center gap-2 nikud">
                        <span className="text-2xl">{game.emoji}</span>
                        <span>{game.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 nikud">
                        {game.desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onLaunchGame(game.id)}
                      className="btn-glow px-4 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs shrink-0 flex items-center gap-1.5"
                    >
                      <Play className="w-4 h-4" />
                      <span>הַתְחֵל שָׁלָב</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* ====================================================================
           MODE 2: QUEST LOG, BOSS FIGHT ARENA & CO-OP PARTY GUILD
           ==================================================================== */
        <div className="space-y-8">
          {/* Quest Log Section */}
          <section className="glass-strong rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-sky-600 flex items-center gap-1.5">
                  <Swords className="w-4 h-4" />
                  <span>Quest Log & Boss Arena · שִׁיעוּרֵי הַבַּיִת וְהַמִּבְחָנִים הוֹפְכִים לְהַרְפַּתְקָה</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 nikud">
                  ⚔️ לוּחַ הַקְּווֶסְטִים וְזִירַת קְרָבוֹת הַבּוֹס
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 nikud">
                  הַשְׁלִימוּ קְווֶסְטִים יוֹמִיִּים, מְשִׂימוֹת רָאשִׁיּוֹת וּמְשִׂימוֹת צַד, וְגַלּוּ אֶת נְקוּדוֹת הַתּוֹרְפָּה שֶׁל הַבּוֹסִים כְּדֵי לַעֲלוֹת שָׁלָב (Level Up)!
                </p>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-extrabold text-amber-900 flex items-center gap-2 tabular-nums">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>
                  קְווֶסְט יוֹמִי: {profile.todayCount} / {classState.dailyGoal}{" "}
                  שְׁלַבִּים הַיּוֹם
                </span>
              </div>
            </div>

            {/* Quest Category Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "כָּל הַקְּווֶסְטִים", emoji: "📜" },
                { id: "daily", label: "קְווֶסְט יוֹמִי (Daily Quest)", emoji: "⚡" },
                { id: "main", label: "מְשִׂימָה רָאשִׁית (Main Quest)", emoji: "🏆" },
                { id: "side", label: "מְשִׂימַת צַד (Side Quest)", emoji: "🌟" },
                { id: "boss", label: "קְרַב בּוֹס (Boss Fight)", emoji: "🐉" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setQuestFilter(tab.id as QuestType | "all");
                  }}
                  className={`btn-glow px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                    questFilter === tab.id
                      ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                      : "bg-white/85 border-slate-200 text-slate-700 hover:bg-white"
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Quests List */}
            <div className="space-y-3.5">
              {filteredMissions.map((m) => {
                const game = GAMES.find((g) => g.id === m.gameId);
                const qType: QuestType = m.questType || "main";
                const xpReward = m.xpReward || (qType === "boss" ? 150 : 75);

                const typeBadge =
                  qType === "boss"
                    ? {
                        label: "🐉 קְרַב בּוֹס (Boss Fight)",
                        cls: "bg-rose-100 text-rose-900 border-rose-300",
                      }
                    : qType === "daily"
                      ? {
                          label: "⚡ קְווֶסְט יוֹמִי (Daily Quest)",
                          cls: "bg-amber-100 text-amber-900 border-amber-300",
                        }
                      : qType === "side"
                        ? {
                            label: "🌟 מְשִׂימַת צַד (Side Quest)",
                            cls: "bg-violet-100 text-violet-900 border-violet-300",
                          }
                        : {
                            label: "🏆 מְשִׂימָה רָאשִׁית (Main Quest)",
                            cls: "bg-sky-100 text-sky-900 border-sky-300",
                          };

                return (
                  <div
                    key={m.id}
                    className={`p-5 rounded-3xl border-2 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                      m.done
                        ? "bg-emerald-50/90 border-emerald-300"
                        : qType === "boss"
                          ? "bg-rose-50/85 border-rose-300 shadow-xs"
                          : "bg-white/90 border-slate-200/90"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg border text-xs font-extrabold ${typeBadge.cls}`}
                        >
                          {typeBadge.label}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 text-xs font-extrabold tabular-nums">
                          +{xpReward} XP
                        </span>
                        <span className="text-xs font-bold text-amber-600 tabular-nums">
                          +15 ⭐ שָׁלָל (Loot)
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 nikud">
                        <span className="text-2xl">
                          {qType === "boss" ? "🐉" : game?.emoji || "🎯"}
                        </span>
                        <span>
                          {m.bossName ? `${m.bossName} — ` : ""}
                          {game?.title}
                        </span>
                      </h3>

                      <p className="text-xs text-slate-700 font-medium nikud">
                        {m.note}
                      </p>

                      {m.bossWeakness && (
                        <div className="inline-block mt-1 px-3 py-1.5 rounded-xl bg-white/90 border border-rose-200 text-xs font-bold text-rose-800 nikud">
                          🎯 {m.bossWeakness}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
                      {m.done ? (
                        <div className="px-4 py-2.5 rounded-2xl bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>הַקְּווֶסְט הוּשְׁלַם! (+{xpReward} XP)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onLaunchGame(m.gameId)}
                          className={`btn-glow px-5 py-3 rounded-2xl font-extrabold text-xs text-white flex items-center gap-2 shadow-xs ${
                            qType === "boss"
                              ? "bg-rose-600 hover:bg-rose-500"
                              : "bg-sky-600 hover:bg-sky-500"
                          }`}
                        >
                          <Play className="w-4 h-4" />
                          <span>
                            {qType === "boss"
                              ? "⚔️ צֵא לִקְרַב הַבּוֹס כָּעֵת!"
                              : "🚀 הַתְחֵל קְווֶסְט כָּעֵת"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Co-op Guild Party Roster & Badges Loot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Co-op Party Guild Roster (6 cols) */}
            <section className="lg:col-span-6 glass-strong rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-600" />
                  <span>🛡️ הַפְּלָאטוֹן הַכִּיתָּתִי שֶׁלָּנוּ (Co-op Guild)</span>
                </h3>
                <span className="text-xs font-bold text-sky-700">
                  {classState.students.length} שַׂחְקָנִים בַּגִּילְדָּה
                </span>
              </div>
              <p className="text-xs text-slate-600">
                בִּלְמִידַת עֲמִיתִים כָּל אֶחָד תּוֹרֵם מֵהַחוֹזְקָה שֶׁלּוֹ — הַטַּנְק מוֹבִיל, הַהִילֶר מַסְבִּיר וְתוֹמֵךְ, וְאַלּוּף הַבִּיצּוּעַ מֵפִיק תּוֹצָרִים!
              </p>

              <div className="space-y-2.5">
                {classState.students.map((st, idx) => {
                  const rRole: PartyRole =
                    st.partyRole ||
                    (["tank", "healer", "dps"][idx % 3] as PartyRole);
                  const rInfo = PARTY_ROLES_INFO[rRole];
                  const stLevel =
                    st.level || Math.max(2, Math.floor(st.stars / 12));
                  return (
                    <div
                      key={st.id}
                      className="p-3 rounded-2xl bg-white/85 border border-slate-200/90 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <AvatarSvg config={st.avatar} size={42} />
                        <div>
                          <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2 nikud">
                            <span>{st.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-extrabold tabular-nums">
                              LVL {stLevel}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`px-2 py-0.2 rounded border text-[10px] font-bold ${rInfo.badgeClass}`}
                            >
                              {rInfo.emoji} {rInfo.title}
                            </span>
                            <span>· כיתה {st.grade}׳</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-extrabold text-amber-600 tabular-nums">
                        {st.stars} ⭐
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Skins, Badges & Loot Showcase (6 cols) */}
            <section className="lg:col-span-6 glass-strong rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>🎁 תָּגֵי הֶישֵּׂג וְשָׁלָל (Badges & Loot)</span>
                </h3>
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="text-xs font-bold text-violet-600 hover:underline"
                >
                  פְּתַח חֲנוּת סְקִינִים ⬅
                </button>
              </div>
              <p className="text-xs text-slate-600">
                כָּל קְווֶסְט אוֹ קְרַב בּוֹס מַעֲנִיק כּוֹכְבֵי שָׁלָל וּפוֹתֵחַ עִיטּוּרִים וּסְקִינִים חֲדָשִׁים לַדְּמוּת שֶׁלָּכֶם:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BADGES.map((b) => {
                  const unlocked = profile.badges.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                        unlocked
                          ? "bg-amber-50/90 border-amber-300 text-slate-900"
                          : "bg-white/60 border-slate-200/70 text-slate-400"
                      }`}
                    >
                      <span className="text-2xl">{b.icon}</span>
                      <div>
                        <div className="text-xs font-extrabold nikud">
                          {b.name} {unlocked && "✓"}
                        </div>
                        <div className="text-[11px] text-slate-500 nikud">
                          {b.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
