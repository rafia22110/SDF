import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Compass,
  Play,
  Edit3,
  Copy,
  Check,
  Filter,
  LayoutGrid,
  List,
  RotateCcw,
} from "lucide-react";
import { IslandId } from "../types";
import { ISLANDS, GAMES, IslandInfo } from "../data/content";
import { IslandIllustration } from "./AvatarSvg";
import { BoardCategory, BoardItem, pushItemToSmartBoard } from "./SmartBoard";
import { sfx } from "../audio";

export interface TimePeriod {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
}

export interface TimetableLesson {
  subject: string;
  topic: string;
  islandId: IslandId;
  gameId?: string;
  notes?: string;
  category: BoardCategory;
}

interface FlexibleTimetableProps {
  teacherName: string;
  onNavigateToIsland?: (islandId: IslandId) => void;
  onLaunchGame?: (gameId: string) => void;
  onNotify?: (message: string) => void;
}

const ALL_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"] as const;

const DEFAULT_PERIODS: TimePeriod[] = [
  { id: "p-0", startTime: "08:00", endTime: "08:45", label: "שָׁעָה 1 · פְּתִיחַת בּוֹקֶר" },
  { id: "p-1", startTime: "08:45", endTime: "09:30", label: "שָׁעָה 2 · לִמּוּדֵי לִיבָּה" },
  { id: "p-2", startTime: "09:50", endTime: "10:35", label: "שָׁעָה 3 · מַעְבָּדַת אִיִּים" },
  { id: "p-3", startTime: "10:35", endTime: "11:20", label: "שָׁעָה 4 · תַּרְגּוּל וּמִשְׂחָק" },
  { id: "p-4", startTime: "11:40", endTime: "12:25", label: "שָׁעָה 5 · יְצִירָה וְסִיכּוּם" },
];

const ISLAND_TO_CATEGORY: Record<IslandId, BoardCategory> = {
  letters: "שפה וקריאה",
  words: "שפה וקריאה",
  numbers: "מתמטיקה",
  science: "מדע וחלל",
  logic: "מדע וחלל",
  create: "משימות כיתה",
};

const ISLAND_STYLE: Record<
  IslandId,
  {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    boardColor: BoardItem["color"];
    emoji: string;
  }
> = {
  letters: {
    bg: "bg-sky-50/90",
    border: "border-sky-300",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-800",
    boardColor: "cyan",
    emoji: "🔤",
  },
  numbers: {
    bg: "bg-amber-50/90",
    border: "border-amber-300",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900",
    boardColor: "amber",
    emoji: "🧮",
  },
  words: {
    bg: "bg-pink-50/90",
    border: "border-pink-300",
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-800",
    boardColor: "pink",
    emoji: "📖",
  },
  science: {
    bg: "bg-emerald-50/90",
    border: "border-emerald-300",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    boardColor: "emerald",
    emoji: "🪐",
  },
  logic: {
    bg: "bg-violet-50/90",
    border: "border-violet-300",
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-800",
    boardColor: "violet",
    emoji: "🤖",
  },
  create: {
    bg: "bg-fuchsia-50/90",
    border: "border-fuchsia-300",
    badgeBg: "bg-fuchsia-100",
    badgeText: "text-fuchsia-800",
    boardColor: "pink",
    emoji: "🎨",
  },
};

const DEFAULT_LESSONS: Record<string, TimetableLesson> = {
  "ראשון__p-0": {
    subject: "מִפְגַּשׁ בּוֹקֶר וְשָׂפָה",
    topic: "צְלִיל פּוֹתֵחַ וּתְנוּעוֹת הַנִּיקּוּד",
    islandId: "letters",
    gameId: "letters-quiz",
    notes: "פְּתִיחָה מְשׁוּתֶּפֶת עַל הַלּוּחַ",
    category: "שפה וקריאה",
  },
  "ראשון__p-1": {
    subject: "מָתֵמָטִיקָה וְחֶשְׁבּוֹן",
    topic: "לוּחַ הַכֶּפֶל וּקְרִיאַת שָׁעוֹן",
    islandId: "numbers",
    gameId: "numbers-quiz",
    notes: "עֲבוֹדָה בְּזוּגוֹת",
    category: "מתמטיקה",
  },
  "ראשון__p-2": {
    subject: "מַדָּע וְחָלָל",
    topic: "מַצְּבֵי הַצְּבִירָה שֶׁל הַמַּיִם",
    islandId: "science",
    gameId: "matter-lab",
    notes: "נִיסּוּי בְּמַעְבָּדַת הַמַּיִם",
    category: "מדע וחלל",
  },
  "ראשון__p-3": {
    subject: "אוֹצַר מִילִּים בְּעִבְרִית",
    topic: "מִילִּים נִרְדָּפוֹת וַהֲפָכִים",
    islandId: "words",
    gameId: "word-builder",
    notes: "הַרְכָּבַת מִילִּים מֵאוֹתִיּוֹת",
    category: "שפה וקריאה",
  },
  "ראשון__p-4": {
    subject: "סִיכּוּם יוֹם וִיצִירָה",
    topic: "צִיּוּר דְּגָמִים בְּפִיקְסֶל-אוֹר",
    islandId: "create",
    gameId: "pixel-studio",
    notes: "תַּעֲרוּכָה כִּיתָּתִית",
    category: "משימות כיתה",
  },
  "שני__p-0": {
    subject: "קְרִיאָה קוֹלִית",
    topic: "קְרִיאָה בְּקוֹל רָם וַהֲבָרוֹת",
    islandId: "letters",
    gameId: "voice-read",
    notes: "תַּרְגּוּל עִם מִיקְרוֹפוֹן",
    category: "שפה וקריאה",
  },
  "שני__p-1": {
    subject: "חִישּׁוּב מָהִיר",
    topic: "בָּלוֹנֵי מִסְפָּרִים וְשְׁבָרִים",
    islandId: "numbers",
    gameId: "balloon-pop",
    notes: "אֶתְגַּר כִּיתָּתִי",
    category: "מתמטיקה",
  },
  "שני__p-2": {
    subject: "חֲשִׁיבָה וְרוֹבּוֹטִיקָה",
    topic: "תִּכְנוּת מַסְלוּל רוֹבּוֹט הָאוֹר",
    islandId: "logic",
    gameId: "robo-path",
    notes: "אַלְגּוֹרִיתְמִיקָה בְּסִיסִית",
    category: "מדע וחלל",
  },
  "שלישי__p-0": {
    subject: "אַסְטְרוֹנוֹמְיָה וְחָלָל",
    topic: "מַסָּע בְּמַעֲרֶכֶת הַשֶּׁמֶשׁ",
    islandId: "science",
    gameId: "science-quiz",
    notes: "הַכָּרַת כּוֹכְבֵי הַלֶּכֶת",
    category: "מדע וחלל",
  },
  "שלישי__p-1": {
    subject: "הַנְדָּסָה וּמְדִידוֹת",
    topic: "הֶיקֵּף וְשֶׁטַח מְצוּלָּעִים",
    islandId: "numbers",
    gameId: "numbers-quiz",
    notes: "דַּף מְשִׂימָה מְשׁוּתָּף",
    category: "מתמטיקה",
  },
  "רביעי__p-0": {
    subject: "כְּתִיבָה וְאוֹצַר מִילִּים",
    topic: "זִיכָּרוֹן מִילִּים וּכְתִיבַת סִיפּוּר",
    islandId: "words",
    gameId: "memory-pairs",
    notes: "עֲבוֹדָה בִּקְבוּצוֹת",
    category: "שפה וקריאה",
  },
  "רביעי__p-1": {
    subject: "חִידוֹת הִגָּיוֹן",
    topic: "הַשְׁלָמַת סְדָרוֹת וְדְּפוּסִים",
    islandId: "logic",
    gameId: "logic-quiz",
    notes: "חֲשִׁיבָה לוֹגִית",
    category: "מדע וחלל",
  },
  "חמישי__p-0": {
    subject: "מָתֵמָטִיקָה חֲוָויָיתִית",
    topic: "חִילּוּק וְכֶפֶל מָהִיר",
    islandId: "numbers",
    gameId: "balloon-pop",
    notes: "טוּרְנִיר כּוֹכְבֵי אוֹר",
    category: "מתמטיקה",
  },
  "שישי__p-0": {
    subject: "שַׁבָּת שָׁלוֹם וִיצִירָה",
    topic: "סְטוּדְיוֹ פִּיקְסֶל-אוֹר כִּיתָּתִי",
    islandId: "create",
    gameId: "pixel-studio",
    notes: "יְצִירָה חוֹפְשִׁית לִכְבוֹד שַׁבָּת",
    category: "משימות כיתה",
  },
};

const STORAGE_LESSONS_KEY = "iyey_or_flexible_timetable_v2";
const STORAGE_PERIODS_KEY = "iyey_or_flexible_periods_v2";

export function FlexibleTimetable({
  teacherName,
  onNavigateToIsland,
  onLaunchGame,
  onNotify,
}: FlexibleTimetableProps) {
  // Periods (rows) state
  const [periods, setPeriods] = useState<TimePeriod[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_PERIODS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        /* ignore */
      }
    }
    return DEFAULT_PERIODS;
  });

  // Lessons dictionary keyed by `${day}__${periodId}`
  const [lessons, setLessons] = useState<Record<string, TimetableLesson>>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_LESSONS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch {
        /* ignore */
      }
    }
    return DEFAULT_LESSONS;
  });

  // View controls
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");
  const [selectedDay, setSelectedDay] = useState<string>("ראשון");
  const [filterIslandId, setFilterIslandId] = useState<IslandId | "all">("all");
  const [showFriday, setShowFriday] = useState<boolean>(true);

  // Period management drawer
  const [showPeriodEditor, setShowPeriodEditor] = useState(false);
  const [newStart, setNewStart] = useState("12:30");
  const [newEnd, setNewEnd] = useState("13:15");
  const [newPeriodLabel, setNewPeriodLabel] = useState("");

  // Active slot editor state
  const [editingSlot, setEditingSlot] = useState<{
    day: string;
    periodId: string;
  } | null>(null);
  const [formDay, setFormDay] = useState<string>("ראשון");
  const [formPeriodId, setFormPeriodId] = useState<string>("p-0");
  const [formSubject, setFormSubject] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formIslandId, setFormIslandId] = useState<IslandId>("letters");
  const [formGameId, setFormGameId] = useState<string>("");
  const [formNotes, setFormNotes] = useState("");
  const [formCategory, setFormCategory] = useState<BoardCategory>("שפה וקריאה");

  // Copy lesson buffer
  const [copiedLesson, setCopiedLesson] = useState<TimetableLesson | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LESSONS_KEY, JSON.stringify(lessons));
    } catch {
      /* ignore */
    }
  }, [lessons]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PERIODS_KEY, JSON.stringify(periods));
    } catch {
      /* ignore */
    }
  }, [periods]);

  const visibleDays = showFriday
    ? ALL_DAYS
    : ALL_DAYS.filter((d) => d !== "שישי");

  const getIsland = (id: IslandId): IslandInfo =>
    ISLANDS.find((i) => i.id === id) || ISLANDS[0];

  // Count how many weekly slots are assigned to each island
  const islandCounts: Record<IslandId, number> = {
    letters: 0,
    numbers: 0,
    words: 0,
    science: 0,
    logic: 0,
    create: 0,
  };
  Object.values(lessons).forEach((item) => {
    if (item && islandCounts[item.islandId] !== undefined) {
      islandCounts[item.islandId] += 1;
    }
  });

  const openSlotEditor = (day: string, periodId: string) => {
    sfx.click();
    const key = `${day}__${periodId}`;
    const existing = lessons[key];
    setEditingSlot({ day, periodId });
    setFormDay(day);
    setFormPeriodId(periodId);

    if (existing) {
      setFormSubject(existing.subject);
      setFormTopic(existing.topic);
      setFormIslandId(existing.islandId);
      setFormGameId(existing.gameId || "");
      setFormNotes(existing.notes || "");
      setFormCategory(existing.category);
    } else {
      const defaultIsl: IslandId =
        filterIslandId !== "all" ? filterIslandId : "letters";
      const islInfo = getIsland(defaultIsl);
      const firstGame = GAMES.find((g) => g.island === defaultIsl);
      setFormIslandId(defaultIsl);
      setFormSubject(islInfo.badgeText);
      setFormTopic("");
      setFormGameId(firstGame?.id || "");
      setFormNotes("");
      setFormCategory(ISLAND_TO_CATEGORY[defaultIsl]);
    }
  };

  const handleSelectIslandInForm = (islId: IslandId) => {
    sfx.click();
    const isl = getIsland(islId);
    const islandGames = GAMES.filter((g) => g.island === islId);
    setFormIslandId(islId);
    setFormCategory(ISLAND_TO_CATEGORY[islId]);
    if (!formSubject.trim()) {
      setFormSubject(isl.badgeText);
    }
    if (islandGames.length > 0) {
      setFormGameId(islandGames[0].id);
    } else {
      setFormGameId("");
    }
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) return;
    sfx.correct();

    const targetKey = `${formDay}__${formPeriodId}`;
    const oldKey = editingSlot
      ? `${editingSlot.day}__${editingSlot.periodId}`
      : null;

    setLessons((prev) => {
      const next = { ...prev };
      // If teacher changed the day or period while editing, remove old slot
      if (oldKey && oldKey !== targetKey) {
        delete next[oldKey];
      }
      next[targetKey] = {
        subject: formSubject.trim(),
        topic: formTopic.trim() || getIsland(formIslandId).subtitle,
        islandId: formIslandId,
        gameId: formGameId || undefined,
        notes: formNotes.trim() || undefined,
        category: formCategory,
      };
      return next;
    });

    const isl = getIsland(formIslandId);
    onNotify?.(
      `השיעור "${formSubject.trim()}" שובץ ליום ${formDay}׳ ושויך אל ${isl.name}!`,
    );
    setEditingSlot(null);
  };

  const handleDeleteSlot = (day: string, periodId: string) => {
    sfx.click();
    const key = `${day}__${periodId}`;
    setLessons((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (
      editingSlot &&
      editingSlot.day === day &&
      editingSlot.periodId === periodId
    ) {
      setEditingSlot(null);
    }
    onNotify?.(`המשבצת ביום ${day}׳ פונתה.`);
  };

  const handlePasteLesson = (day: string, periodId: string) => {
    if (!copiedLesson) return;
    sfx.pop();
    const key = `${day}__${periodId}`;
    setLessons((prev) => ({
      ...prev,
      [key]: { ...copiedLesson },
    }));
    onNotify?.(
      `השיעור "${copiedLesson.subject}" הועתק ליום ${day}׳!`,
    );
  };

  const handleAddPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStart || !newEnd) return;
    sfx.pop();
    const newId = `p-${Date.now()}`;
    const nextIdx = periods.length + 1;
    setPeriods((prev) => [
      ...prev,
      {
        id: newId,
        startTime: newStart,
        endTime: newEnd,
        label: newPeriodLabel.trim() || `שָׁעָה ${nextIdx}`,
      },
    ]);
    setNewPeriodLabel("");
    onNotify?.(`נוספה משבצת שעה חדשה (${newStart} - ${newEnd}) למערכת השעות!`);
  };

  const handleRemovePeriod = (periodId: string) => {
    if (periods.length <= 1) return;
    sfx.click();
    setPeriods((prev) => prev.filter((p) => p.id !== periodId));
  };

  const handleResetDefaultTimetable = () => {
    sfx.click();
    setPeriods(DEFAULT_PERIODS);
    setLessons(DEFAULT_LESSONS);
    onNotify?.("מערכת השעות אופסה לתבנית ברירת המחדל.");
  };

  const handleBroadcastLessonToBoard = (
    day: string,
    period: TimePeriod,
    lesson: TimetableLesson,
  ) => {
    sfx.win();
    const isl = getIsland(lesson.islandId);
    const style = ISLAND_STYLE[lesson.islandId];
    const linkedGame = GAMES.find((g) => g.id === lesson.gameId);

    const newItem: BoardItem = {
      id: `tt-${Date.now()}`,
      type: "note",
      title: `${style.emoji} ${lesson.subject} · ${isl.name}`,
      content: `נוֹשֵׂא: ${lesson.topic} (${day}׳, ${period.startTime}–${period.endTime})${
        linkedGame ? ` · מִשְׂחָק מְשׁוּיָּךְ: ${linkedGame.title}` : ""
      }${lesson.notes ? ` · דָּגֵשׁ: ${lesson.notes}` : ""}`,
      emoji: style.emoji,
      category: lesson.category,
      color: style.boardColor,
      fontSize: "large",
      pinned: true,
      x: 50,
      y: 50,
      author: teacherName,
      sourceLabel: `${isl.name} · מערכת שעות`,
    };
    pushItemToSmartBoard(newItem);
    onNotify?.(
      `השיעור "${lesson.subject}" (${isl.name}) שוגר ללוח הלמידה האינטראקטיבי!`,
    );
  };

  const handleBroadcastFullDayToBoard = (day: string) => {
    sfx.win();
    const dayEntries = periods
      .map((p) => {
        const l = lessons[`${day}__${p.id}`];
        if (!l) return null;
        const isl = getIsland(l.islandId);
        return `${p.startTime} ${l.subject} (${isl.name} - ${l.topic})`;
      })
      .filter(Boolean);

    if (dayEntries.length === 0) {
      onNotify?.(`אין שיעורים משובצים ביום ${day}׳ לשיגור.`);
      return;
    }

    const newItem: BoardItem = {
      id: `tt-day-${Date.now()}`,
      type: "note",
      title: `📅 מַעֲרֶכֶת שָׁעוֹת לְיוֹם ${day}׳ (מְשׁוּיֶּכֶת לְאִיֵּי הָאוֹר)`,
      content: dayEntries.join(" · "),
      emoji: "🗓️",
      category: "משימות כיתה",
      color: "cyan",
      fontSize: "normal",
      pinned: true,
      x: 45,
      y: 45,
      author: teacherName,
      sourceLabel: `מערכת יום ${day}׳`,
    };
    pushItemToSmartBoard(newItem);
    onNotify?.(`כל מערכת השעות של יום ${day}׳ שוגרה ללוח הלמידה!`);
  };

  const availableGamesForFormIsland = GAMES.filter(
    (g) => g.island === formIslandId,
  );

  return (
    <div className="glass-strong rounded-3xl p-6 space-y-5">
      {/* ====================================================================
         HEADER & VIEW CONTROLS
         ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-sky-600 mb-0.5 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>תִּכְנוּן פֵּדָגוֹגִי חָכָם · חִיבּוּר יָשִׁיר לְאִיֵּי הַלְּמִידָה</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 nikud">
            <Calendar className="w-5 h-5 text-sky-600" />
            <span>מַעֲרֶכֶת שָׁעוֹת גְּמִישָׁה וְשִׁיּוּךְ לְאִיֵּי הָאוֹר</span>
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            הַגְדִּירוּ שִׁיעוּרִים לְפִי יָמִים וְשָׁעוֹת, שַׁיְּיכוּ כָּל שִׁיעוּר לְאֶחָד מֵ-6 הָאִיִּים בַּמַּעֲרֶכֶת, וְשַׁגְּרוּ לַלּוּחַ אוֹ הַמְרִיאוּ יְשִׁירוֹת לָאִי!
          </p>
        </div>

        {/* Toolbar: Weekly/Daily switch, Period manager, Quick add */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white/85 border border-slate-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setViewMode("weekly");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "weekly"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>לוּחַ שְׁבוּעִי</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setViewMode("daily");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "daily"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>תְּצוּגָה יוֹמִית</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              sfx.click();
              setShowPeriodEditor((v) => !v);
            }}
            className={`btn-glow px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              showPeriodEditor
                ? "bg-sky-100 border-sky-300 text-sky-900"
                : "bg-white/90 border-slate-200 text-slate-700 hover:bg-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>נִיהוּל שָׁעוֹת וְיָמִים</span>
          </button>

          <button
            type="button"
            onClick={() => openSlotEditor(selectedDay, periods[0]?.id || "p-0")}
            className="btn-glow px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>שִׁיעוּר חָדָשׁ</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
         6 ISLANDS FILTER & WEEKLY DISTRIBUTION STRIP
         ==================================================================== */}
      <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/90 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>סִינוּן וּמַאזְן שִׁיעוּרִים לְפִי אִיֵּי הַלְּמִידָה בַּמַּעֲרֶכֶת:</span>
          </div>
          {filterIslandId !== "all" && (
            <button
              type="button"
              onClick={() => setFilterIslandId("all")}
              className="text-sky-600 font-bold hover:underline"
            >
              הַצֵּג אֶת כָּל הָאִיִּים ({Object.keys(lessons).length} שִׁיעוּרִים)
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {ISLANDS.map((isl) => {
            const st = ISLAND_STYLE[isl.id];
            const isSelected = filterIslandId === isl.id;
            const count = islandCounts[isl.id] || 0;
            return (
              <div
                key={isl.id}
                onClick={() => {
                  sfx.click();
                  setFilterIslandId(isSelected ? "all" : isl.id);
                }}
                className={`cursor-pointer p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                  isSelected
                    ? `${st.bg} ${st.border} ring-2 ring-sky-500 shadow-xs`
                    : "bg-white/90 border-slate-200/90 hover:border-sky-300"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-slate-900 truncate nikud">
                    {st.emoji} {isl.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate nikud">
                    {count} שִׁיעוּרִים בַּשָּׁבוּעַ
                  </div>
                </div>
                <div className="shrink-0">
                  <IslandIllustration id={isl.id} size={34} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
         FLEXIBLE TIME PERIODS & DAYS CONFIGURATION DRAWER
         ==================================================================== */}
      {showPeriodEditor && (
        <div className="p-4 rounded-2xl bg-sky-50/90 border border-sky-200 space-y-4 animate-pop">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>הַתְאָמָה אִישִׁית שֶׁל שְׁעוֹת הַלִּימּוּד וִימֵי הַשָּׁבוּעַ</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFriday}
                  onChange={(e) => setShowFriday(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>הַצֵּג יוֹם שִׁישִּׁי בַּמַּעֲרֶכֶת</span>
              </label>
              <button
                type="button"
                onClick={handleResetDefaultTimetable}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:text-rose-600 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>אִיפּוּס לִבְרִירַת מֶחְדָּל</span>
              </button>
            </div>
          </div>

          {/* Existing periods list */}
          <div className="flex flex-wrap gap-2">
            {periods.map((p, idx) => (
              <div
                key={p.id}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center gap-2"
              >
                <span className="font-extrabold text-sky-700 tabular-nums">
                  {idx + 1}. {p.startTime}–{p.endTime}
                </span>
                <span className="text-slate-600 nikud">({p.label})</span>
                {periods.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePeriod(p.id)}
                    className="text-slate-400 hover:text-rose-600"
                    title="הסר רצועת זמן"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add new time slot form */}
          <form
            onSubmit={handleAddPeriod}
            className="flex flex-wrap items-end gap-2 pt-2 border-t border-sky-200/70"
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                שְׁעַת הַתְחָלָה:
              </label>
              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                שְׁעַת סִיּוּם:
              </label>
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold tabular-nums"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                כּוֹתֶרֶת הַשָּׁעָה (למשל: שעה 6 · מעבדת חקר):
              </label>
              <input
                type="text"
                value={newPeriodLabel}
                onChange={(e) => setNewPeriodLabel(e.target.value)}
                placeholder="שָׁעָה 6 · הַעֲשָׁרָה וְאִיִּים"
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="btn-glow px-4 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוֹסֵף רְצוּעַת שָׁעָה</span>
            </button>
          </form>
        </div>
      )}

      {/* ====================================================================
         LESSON EDITOR PANEL (CREATE / EDIT / ASSIGN ISLAND & GAME)
         ==================================================================== */}
      {editingSlot && (
        <form
          onSubmit={handleSaveLesson}
          className="p-5 rounded-3xl bg-white/95 border-2 border-sky-300 shadow-md space-y-4 animate-pop"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-sky-600" />
              <h4 className="text-sm font-extrabold text-slate-900">
                הַגְדָּרַת שִׁיעוּר וְשִׁיּוּךְ לְאִי לְמִידָה
              </h4>
            </div>
            <div className="flex items-center gap-2">
              {lessons[`${editingSlot.day}__${editingSlot.periodId}`] && (
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteSlot(editingSlot.day, editingSlot.periodId)
                  }
                  className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>מְחַק שִׁיעוּר זֶה</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
              >
                סְגוֹר
              </button>
            </div>
          </div>

          {/* Step 1: Choose Island association */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-800">
              1. בִּחֲרוּ לְאֵיזֶה מֵהָאִיִּים בַּמַּעֲרֶכֶת הַשִּׁיעוּר מְשׁוּיָּךְ:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {ISLANDS.map((isl) => {
                const active = formIslandId === isl.id;
                const st = ISLAND_STYLE[isl.id];
                return (
                  <button
                    key={isl.id}
                    type="button"
                    onClick={() => handleSelectIslandInForm(isl.id)}
                    className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1.5 ${
                      active
                        ? `${st.bg} ${st.border} ring-2 ring-sky-500 shadow-xs`
                        : "bg-white border-slate-200 hover:border-sky-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold text-slate-900 nikud">
                        {st.emoji} {isl.name}
                      </span>
                      {active && (
                        <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 nikud">
                      {isl.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Day, Hour, Subject, Topic, Linked Game */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                יוֹם בַּשָּׁבוּעַ:
              </label>
              <select
                value={formDay}
                onChange={(e) => setFormDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
              >
                {ALL_DAYS.map((d) => (
                  <option key={d} value={d}>
                    יוֹם {d}׳
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                שָׁעָה בַּמַּעֲרֶכֶת:
              </label>
              <select
                value={formPeriodId}
                onChange={(e) => setFormPeriodId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.startTime} - {p.endTime} ({p.label})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                שֵׁם הַמִּקְצוֹעַ / הַשִּׁיעוּר:
              </label>
              <input
                type="text"
                required
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="למשל: מתמטיקה / שפה וקריאה"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                נוֹשֵׂא הַשִּׁיעוּר הַמְּדוּיָּק:
              </label>
              <input
                type="text"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                placeholder="למשל: שברים פשוטים / תנועות הניקוד"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                פְּעִילוּת / מִשְׂחָק מְשׁוּיָּךְ מֵהָאִי ({getIsland(formIslandId).name}):
              </label>
              <select
                value={formGameId}
                onChange={(e) => setFormGameId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
              >
                <option value="">לְלֹא מִשְׂחָק סְפֵּצִיפִי (כל האי)</option>
                {availableGamesForFormIsland.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.title} ({g.skills})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                הֶעָרוֹת / דְּגָשִׁים לַשִּׁיעוּר:
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="למשל: עבודה בקבוצות / להביא מחברת"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-glow flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>שְׁמוֹר וְשַׁיֵּיךְ לָאִי</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ====================================================================
         CLIPBOARD BANNER WHEN COPYING A LESSON
         ==================================================================== */}
      {copiedLesson && (
        <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-xs">
          <div className="font-bold text-amber-900">
            📋 הַשִּׁיעוּר &quot;{copiedLesson.subject}&quot; ({getIsland(copiedLesson.islandId).name}) מוּעְתָּק בַּזִּיכָּרוֹן — לִחֲצוּ עַל &quot;הַדְבֵּק כָּאן&quot; בְּכָל מִשְׁבֶּצֶת רֵיקָה בַּמַּעֲרֶכֶת.
          </div>
          <button
            type="button"
            onClick={() => setCopiedLesson(null)}
            className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold"
          >
            סִיַּימְתִּי הַעְתָּקָה
          </button>
        </div>
      )}

      {/* ====================================================================
         VIEW MODE 1: WEEKLY MATRIX GRID (לוח שבועי מלא)
         ==================================================================== */}
      {viewMode === "weekly" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700 bg-white/75">
                <th className="p-2.5 font-extrabold w-28">שָׁעָה / יוֹם</th>
                {visibleDays.map((d) => (
                  <th key={d} className="p-2.5 font-extrabold min-w-[148px]">
                    <div className="flex items-center justify-between gap-1">
                      <span>יוֹם {d}׳</span>
                      <button
                        type="button"
                        onClick={() => handleBroadcastFullDayToBoard(d)}
                        className="px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white text-[10px] font-bold transition-colors"
                        title={`שגר את כל מערכת יום ${d}׳ ללוח`}
                      >
                        שַׁגֵּר יוֹם
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {periods.map((period) => (
                <tr key={period.id} className="hover:bg-white/40">
                  {/* Time Period Column */}
                  <td className="p-2.5 align-top bg-white/50">
                    <div className="font-extrabold text-sky-800 tabular-nums whitespace-nowrap">
                      {period.startTime} – {period.endTime}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 nikud">
                      {period.label}
                    </div>
                  </td>

                  {/* Day Cells */}
                  {visibleDays.map((day) => {
                    const key = `${day}__${period.id}`;
                    const cell = lessons[key];
                    const isDimmed =
                      filterIslandId !== "all" &&
                      cell &&
                      cell.islandId !== filterIslandId;

                    if (!cell) {
                      return (
                        <td key={key} className="p-1.5 align-top">
                          <div className="h-full min-h-[86px] rounded-2xl border border-dashed border-slate-200/90 hover:border-sky-300 bg-white/40 hover:bg-white/80 transition-all flex flex-col items-center justify-center gap-1 p-2">
                            <button
                              type="button"
                              onClick={() => openSlotEditor(day, period.id)}
                              className="text-slate-400 hover:text-sky-600 font-bold text-[11px] flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>שַׁבֵּץ שִׁיעוּר + אִי</span>
                            </button>
                            {copiedLesson && (
                              <button
                                type="button"
                                onClick={() =>
                                  handlePasteLesson(day, period.id)
                                }
                                className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px]"
                              >
                                + הַדְבֵּק כָּאן
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    }

                    const isl = getIsland(cell.islandId);
                    const style = ISLAND_STYLE[cell.islandId];
                    const linkedGame = GAMES.find((g) => g.id === cell.gameId);

                    return (
                      <td
                        key={key}
                        className={`p-1.5 align-top transition-opacity ${
                          isDimmed ? "opacity-30" : "opacity-100"
                        }`}
                      >
                        <div
                          className={`p-2.5 rounded-2xl border ${style.bg} ${style.border} transition-all flex flex-col justify-between gap-2 min-h-[96px]`}
                        >
                          {/* Top Row: Linked Island Chip + Edit/Copy actions */}
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigateToIsland?.(cell.islandId)
                                }
                                className={`px-2 py-0.5 rounded-lg ${style.badgeBg} ${style.badgeText} font-extrabold text-[10px] flex items-center gap-1 hover:opacity-80 truncate`}
                                title={`עבור אל ${isl.name}`}
                              >
                                <span>{style.emoji}</span>
                                <span className="truncate nikud">
                                  {isl.name}
                                </span>
                              </button>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    sfx.click();
                                    setCopiedLesson(cell);
                                    onNotify?.(
                                      `השיעור "${cell.subject}" הועתק. בחרו משבצת להדבקה!`,
                                    );
                                  }}
                                  className="p-1 rounded hover:bg-white/80 text-slate-500 hover:text-slate-900"
                                  title="שכפל שיעור למשבצת אחרת"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openSlotEditor(day, period.id)}
                                  className="p-1 rounded hover:bg-white/80 text-slate-500 hover:text-slate-900"
                                  title="ערוך שיעור או החלף אי"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Subject & Topic */}
                            <div
                              onClick={() => openSlotEditor(day, period.id)}
                              className="cursor-pointer"
                            >
                              <div className="font-extrabold text-slate-900 text-xs leading-snug nikud">
                                {cell.subject}
                              </div>
                              <div className="text-[11px] text-slate-600 leading-tight mt-0.5 nikud">
                                {cell.topic}
                              </div>
                              {linkedGame && (
                                <div className="text-[10px] text-slate-500 mt-1 truncate nikud">
                                  🎮 {linkedGame.title}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bottom Action Buttons: Broadcast to SmartBoard & Go to Island/Game */}
                          <div className="flex items-center gap-1 pt-1 border-t border-slate-200/60">
                            <button
                              type="button"
                              onClick={() =>
                                handleBroadcastLessonToBoard(day, period, cell)
                              }
                              className="flex-1 py-1 px-1.5 rounded-lg bg-white/90 hover:bg-sky-600 text-sky-800 hover:text-white font-bold text-[10px] transition-colors text-center"
                            >
                              + לַלּוּחַ
                            </button>
                            {linkedGame && onLaunchGame ? (
                              <button
                                type="button"
                                onClick={() => onLaunchGame(linkedGame.id)}
                                className="py-1 px-2 rounded-lg bg-white/90 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-[10px] transition-colors flex items-center gap-0.5"
                                title={`הפעל משחק: ${linkedGame.title}`}
                              >
                                <Play className="w-2.5 h-2.5" />
                                <span>מִשְׂחָק</span>
                              </button>
                            ) : (
                              onNavigateToIsland && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onNavigateToIsland(cell.islandId)
                                  }
                                  className="py-1 px-2 rounded-lg bg-white/90 hover:bg-sky-600 text-slate-700 hover:text-white font-bold text-[10px] transition-colors"
                                >
                                  לָאִי
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ====================================================================
           VIEW MODE 2: FOCUSED DAILY SCHEDULE WITH ISLAND ILLUSTRATIONS
           ==================================================================== */
        <div className="space-y-4">
          {/* Day selector bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {ALL_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setSelectedDay(d);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedDay === d
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-white/85 border border-slate-200 text-slate-700 hover:bg-white"
                  }`}
                >
                  יוֹם {d}׳
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleBroadcastFullDayToBoard(selectedDay)}
              className="btn-glow px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>שַׁגֵּר אֶת כָּל מַעֲרֶכֶת יוֹם {selectedDay}׳ לַלּוּחַ</span>
            </button>
          </div>

          {/* Detailed daily cards */}
          <div className="space-y-2.5">
            {periods.map((period) => {
              const key = `${selectedDay}__${period.id}`;
              const cell = lessons[key];

              if (!cell) {
                return (
                  <div
                    key={key}
                    className="p-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-sky-700 tabular-nums">
                        {period.startTime} – {period.endTime} · {period.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        מִשְׁבֶּצֶת פְּנוּיָה לְשִׁיבּוּץ שִׁיעוּר וְאִי לְמִידָה
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSlotEditor(selectedDay, period.id)}
                      className="btn-glow px-3.5 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>שַׁבֵּץ שִׁיעוּר</span>
                    </button>
                  </div>
                );
              }

              const isl = getIsland(cell.islandId);
              const style = ISLAND_STYLE[cell.islandId];
              const linkedGame = GAMES.find((g) => g.id === cell.gameId);

              return (
                <div
                  key={key}
                  className={`p-4 rounded-2xl border ${style.bg} ${style.border} flex flex-wrap items-center justify-between gap-4`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="shrink-0">
                      <IslandIllustration id={cell.islandId} size={56} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-sky-800 tabular-nums">
                          {period.startTime} – {period.endTime}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg ${style.badgeBg} ${style.badgeText} text-xs font-bold nikud`}
                        >
                          {style.emoji} {isl.name}
                        </span>
                        {linkedGame && (
                          <span className="text-xs text-slate-600 font-bold nikud">
                            · 🎮 {linkedGame.title}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1 nikud">
                        {cell.subject}: {cell.topic}
                      </h4>
                      {cell.notes && (
                        <p className="text-xs text-slate-600 mt-0.5 nikud">
                          דָּגֵשׁ: {cell.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleBroadcastLessonToBoard(selectedDay, period, cell)
                      }
                      className="btn-glow px-3 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                    >
                      + שַׁגֵּר לַלּוּחַ
                    </button>
                    {onNavigateToIsland && (
                      <button
                        type="button"
                        onClick={() => onNavigateToIsland(cell.islandId)}
                        className="btn-glow px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xs"
                      >
                        עֲבוֹר לְ{isl.name}
                      </button>
                    )}
                    {linkedGame && onLaunchGame && (
                      <button
                        type="button"
                        onClick={() => onLaunchGame(linkedGame.id)}
                        className="btn-glow px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>הַפְעֵל מִשְׂחָק</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openSlotEditor(selectedDay, period.id)}
                      className="p-2 rounded-xl bg-white/90 border border-slate-200 text-slate-600 hover:text-slate-900"
                      title="ערוך משבצת"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
