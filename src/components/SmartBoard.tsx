import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Sparkles,
  LayoutGrid,
  Palette,
  Volume2,
  Trash2,
  Pin,
  ChevronLeft,
  Compass,
  Users,
  Copy,
  Check,
  BookOpen,
  Calculator,
  Clock,
  Timer,
  Shuffle,
  PenTool,
  Eraser,
  RotateCcw,
  Eye,
  BookmarkPlus,
  MapPin,
  ExternalLink,
  Video,
} from "lucide-react";
import { Student } from "../types";
import { sfx, speak } from "../audio";
import { HEBREW_ALPHABET, NIKUD_MARKS } from "../data/content";
import { AnalogClockSvg, AvatarSvg } from "./AvatarSvg";

export type BoardCategory = "שפה וקריאה" | "מתמטיקה" | "מדע וחלל" | "משימות כיתה";
export type BoardColor = "cyan" | "pink" | "amber" | "emerald" | "violet";
export type BoardBgMode = "space" | "grid" | "lines" | "clean";
export type BoardLayoutMode = "journey" | "grid" | "columns" | "canvas";

export interface BoardItem {
  id: string;
  type: "note" | "flashcard" | "stamp";
  title: string;
  content: string;
  answer?: string;
  emoji: string;
  category: BoardCategory;
  color: BoardColor;
  fontSize: "normal" | "large";
  pinned: boolean;
  x: number;
  y: number;
  author: string;
  youtubeEmbedUrl?: string;
  externalUrl?: string;
  sourceLabel?: string;
}

export const BOARD_STORAGE_KEY = "iyey_or_board_items_v1";

/* Curated ready-to-collect items so teachers/students can collect what they want in 1 click */
export const CURATED_LIBRARY_ITEMS: Omit<BoardItem, "x" | "y" | "author" | "pinned">[] = [
  {
    id: "lib-he-1",
    type: "note",
    title: "תְּנוּעוֹת הַנִּיקּוּד הַגְּדוֹלוֹת",
    content: "קָמַץ (אָ), צֵירֵי (אֵ), חִירִיק מָלֵא (אִי), חוֹלָם (אוֹ), שׁוּרוּק (אוּ).",
    emoji: "🔤",
    category: "שפה וקריאה",
    color: "cyan",
    fontSize: "normal",
  },
  {
    id: "lib-he-2",
    type: "flashcard",
    title: "חִידַת מִילִּים נִרְדָּפוֹת",
    content: "מַהִי הַמִּילָּה הַנִּרְדֶּפֶת לְ'יָרֵחַ' וּמַהִי הַמִּילָּה הַנִּרְדֶּפֶת לְ'שֶׁמֶשׁ'?",
    answer: "יָרֵחַ = לְבָנָה · שֶׁמֶשׁ = חַמָּה",
    emoji: "🌕",
    category: "שפה וקריאה",
    color: "pink",
    fontSize: "normal",
  },
  {
    id: "lib-he-3",
    type: "note",
    title: "מִשְׁפַּחַת מִילִּים: שׁוֹרֶשׁ כ.ת.ב",
    content: "כָּתַב, מִכְתָּב, כְּתוּבָּה, כַּתָּב, הִתְכַּתְּבוּת, מִכְתָּבִיָּה.",
    emoji: "✍️",
    category: "שפה וקריאה",
    color: "violet",
    fontSize: "normal",
  },
  {
    id: "lib-ma-1",
    type: "flashcard",
    title: "חִידַת כֶּפֶל בֶּחָלָל",
    content: "אִם בְּחַלָּלִית אַחַת יֵשׁ 8 אַסְטְרוֹנָאוּטִים, כַּמָּה יֵשׁ בְּ-6 חַלָּלִיּוֹת?",
    answer: "48 אַסְטְרוֹנָאוּטִים (6 × 8 = 48)",
    emoji: "🚀",
    category: "מתמטיקה",
    color: "amber",
    fontSize: "normal",
  },
  {
    id: "lib-ma-2",
    type: "flashcard",
    title: "שְׁבָרִים בַּשָּׁעוֹן",
    content: "כַּמָּה דַּקּוֹת הֵן שְׁלוֹשָׁה רְבָעִים (3/4) מִתּוֹךְ שָׁעָה שְׁלֵמָה?",
    answer: "45 דַּקּוֹת (כָּל רֶבַע שָׁעָה הוּא 15 דַּקּוֹת)",
    emoji: "⏰",
    category: "מתמטיקה",
    color: "emerald",
    fontSize: "normal",
  },
  {
    id: "lib-sc-1",
    type: "note",
    title: "שְׁלוֹשֶׁת מַצְּבֵי הַצְּבִירָה שֶׁל מַיִם",
    content: "מוּצָק (קֶרַח מִתַּחַת לְ-0°C), נוֹזֵל (מַיִם 0°C–100°C), גַּז (אֵדִים מֵעַל 100°C).",
    emoji: "🔬",
    category: "מדע וחלל",
    color: "emerald",
    fontSize: "normal",
  },
  {
    id: "lib-sc-2",
    type: "flashcard",
    title: "כּוֹכַב הַלֶּכֶת הַגָּדוֹל בְּיוֹתֵר",
    content: "אֵיזֶה כּוֹכַב לֶכֶת הוּא הַגָּדוֹל בְּיוֹתֵר בְּמַעֲרֶכֶת הַשֶּׁמֶשׁ שֶׁלָּנוּ?",
    answer: "צֶדֶק (יוּפִּיטֶר) 🪐",
    emoji: "🪐",
    category: "מדע וחלל",
    color: "cyan",
    fontSize: "normal",
  },
  {
    id: "lib-cl-1",
    type: "note",
    title: "מְשִׂימַת פְּתִיחַת שִׁיעוּר",
    content: "בִּחֲרוּ כַּרְטִיסִיָּה אַחַת מֵהַלּוּחַ, קִרְאוּ אוֹתָהּ בְּקוֹל וְחַבְּרוּ שְׁאֵלָה לַחֲבֵרִים.",
    emoji: "⭐",
    category: "משימות כיתה",
    color: "violet",
    fontSize: "normal",
  },
];

export const INITIAL_BOARD_ITEMS: BoardItem[] = [
  {
    ...CURATED_LIBRARY_ITEMS[0],
    pinned: true,
    x: 40,
    y: 40,
    author: "הַמּוֹרָה רותם",
  },
  {
    ...CURATED_LIBRARY_ITEMS[3],
    pinned: true,
    x: 360,
    y: 40,
    author: "נוֹעָה כֹּהֵן",
  },
  {
    ...CURATED_LIBRARY_ITEMS[5],
    pinned: false,
    x: 680,
    y: 40,
    author: "אִיתַי לֵוִי",
  },
];

export function pushItemToSmartBoard(newItem: BoardItem) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(BOARD_STORAGE_KEY);
    const current: BoardItem[] = raw ? JSON.parse(raw) : INITIAL_BOARD_ITEMS;
    const exists = current.some((it) => it.id === newItem.id);
    const updated = exists ? current : [newItem, ...current];
    localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(updated));
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("iyey_or_smartboard_sync");
      channel.postMessage({ type: "ITEMS_SYNC", items: updated });
      channel.close();
    }
  } catch {
    /* ignore */
  }
}

interface JourneyStation {
  id: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  guideTip: string;
  actionText: string;
}

const JOURNEY_STATIONS: JourneyStation[] = [
  {
    id: 1,
    title: "1. נְקוּדַת הַתְחָלָה: אִיסּוּף וִיצִירָה",
    subtitle: "אִסְפוּ פְּרִיטִים מוּכָנִים אוֹ הוֹסִיפוּ מִשֶּׁלָּכֶם בְּקְלִיק",
    guideTip:
      "כָּאן מַתְחִיל הַמַּסָּע! הַקְלִידוּ מוּשָׂג אוֹ שְׁאֵלָה בְּשׁוּרַת הַיְּצִירָה הַמְּהִירָה, אוֹ לִחֲצוּ עַל פְּרִיטִים בְּ'מַאֲגַר הַפְּרִיטִים לְאִיסּוּף' כְּדֵי לֶאֱסוֹף אוֹתָם יְשִׁירוֹת לַלּוּחַ שֶׁלָּכֶם.",
    actionText: "הַדְגֵּם אִיסּוּף פְּרִיט חָדָשׁ לַלּוּחַ",
  },
  {
    id: 2,
    title: "2. סִידּוּר מַסְלוּל הַלְּמִידָה",
    subtitle: "מַסְלוּל מְמוּסְפָּר, עַמּוּדוֹת נוֹשֵׂא אוֹ קַנְבָּס חוֹפְשִׁי",
    guideTip:
      "אַחֲרֵי שֶׁאָסַפְתֶּם פְּרִיטִים, בִּחֲרוּ אֵיךְ לְהַצִּיג אוֹתָם לַכִּיתָּה: כְּ'מַסְלוּל מַסָּע מְמוּסְפָּר' עִם תַּחֲנוֹת בְּרוּרוֹת, בְּ'עַמּוּדוֹת נוֹשֵׂא', אוֹ בְּ'קַנְבָּס חוֹפְשִׁי' הַמְּאַפְשֵׁר גְּרִירָה.",
    actionText: "הַדְגֵּם תְּצוּגַת עַמּוּדוֹת נוֹשֵׂא",
  },
  {
    id: 3,
    title: "3. עִיצּוּב וְהַתְאָמַת הַלּוּחַ",
    subtitle: "מִשְׁבְּצוֹת, שׁוּרוֹת מַחְבֶּרֶת, צְבָעִים וְצִיּוּר",
    guideTip:
      "הַתְאִימוּ אֶת מִשְׁטַח הַזְּכוּכִית שֶׁל הַלּוּחַ לַשִּׁיעוּר: מִשְׁבְּצוֹת לְחֶשְׁבּוֹן, שׁוּרוֹת לִכְתִיבָה, אוֹ הַפְעִילוּ טוּשׁ צִיּוּר לְהַדְגָּשָׁה חוֹפְשִׁית עַל הַלּוּחַ.",
    actionText: "הַדְגֵּם מִשְׁטַח שׁוּרוֹת מַחְבֶּרֶת",
  },
  {
    id: 4,
    title: "4. כְּלֵי כִּיתָּה חַיִּים וְשִׁיתּוּף",
    subtitle: "אוֹתִיּוֹת מְדַבְּרוֹת, לוּחַ הַמֵּאָה, שָׁעוֹן וְהַזְמָנַת תַּלְמִידִים",
    guideTip:
      "הַשְׁלִימוּ אֶת הַשִּׁיעוּר עִם מַעְבְּדוֹת הָעֵזֶר (אוֹתִיּוֹת וְנִיקּוּד, לוּחַ הַמֵּאָה, שָׁעוֹן מְחוֹגִים וְטַיְימֶר) אוֹ הַזְמִינוּ תַּלְמִידִים לַעֲרוֹךְ יַחַד בִּזְמַן אֱמֶת.",
    actionText: "פְּתַח מַעְבָּדַת אוֹתִיּוֹת מְדַבֶּרֶת",
  },
];

export function SmartBoard({
  students,
  userName,
}: {
  students: Student[];
  userName: string;
}) {
  const [subTab, setSubTab] = useState<
    "workspace" | "alphabet" | "hundred" | "tools"
  >("workspace");

  // Journey Station (1..4) — gives a clear starting point & progression
  const [activeStation, setActiveStation] = useState<1 | 2 | 3 | 4>(1);
  const [showGuideTip, setShowGuideTip] = useState(true);

  // Interactive Board Items persisted in localStorage
  const [items, setItems] = useState<BoardItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(BOARD_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        /* ignore */
      }
    }
    return INITIAL_BOARD_ITEMS;
  });

  const [layoutMode, setLayoutMode] = useState<BoardLayoutMode>("journey");
  const [bgMode, setBgMode] = useState<BoardBgMode>("grid");
  const [categoryFilter, setCategoryFilter] = useState<string>("הכל");
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const boardContainerRef = useRef<HTMLDivElement | null>(null);

  // Effortless Quick Add & Curated Collection Tray
  const [quickTitle, setQuickTitle] = useState("");
  const [quickContent, setQuickContent] = useState("");
  const [quickAnswer, setQuickAnswer] = useState("");
  const [quickType, setQuickType] = useState<"note" | "flashcard">("note");
  const [quickCategory, setQuickCategory] = useState<BoardCategory>("שפה וקריאה");
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [showLibraryTray, setShowLibraryTray] = useState(true);

  // Freehand Drawing Overlay
  const [drawMode, setDrawMode] = useState(false);
  const [brushColor, setBrushColor] = useState("#0284c7");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Collaboration & Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState<
    Array<{ id: string; name: string; status: string; color: string }>
  >([
    { id: "c-1", name: userName, status: "עוֹרֵךְ/ת כָּעֵת", color: "#0284c7" },
    { id: "c-2", name: "נוֹעָה כֹּהֵן", status: "מְחוּבֶּרֶת לַלּוּחַ", color: "#db2777" },
    { id: "c-3", name: "אִיתַי לֵוִי", status: "מְחוּבָּר לַלּוּחַ", color: "#d97706" },
  ]);
  const [inviteName, setInviteName] = useState("");

  // Sync with localStorage & BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("iyey_or_smartboard_sync");
    channel.onmessage = (ev) => {
      if (ev.data?.type === "ITEMS_SYNC" && Array.isArray(ev.data.items)) {
        setItems(ev.data.items);
      } else if (ev.data?.type === "BG_SYNC" && ev.data.bgMode) {
        setBgMode(ev.data.bgMode);
      } else if (ev.data?.type === "LAYOUT_SYNC" && ev.data.layoutMode) {
        setLayoutMode(ev.data.layoutMode);
      }
    };
    return () => channel.close();
  }, []);

  const broadcastUpdate = (
    nextItems: BoardItem[],
    nextBg?: BoardBgMode,
    nextLayout?: BoardLayoutMode,
  ) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(nextItems));
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("iyey_or_smartboard_sync");
        channel.postMessage({
          type: "ITEMS_SYNC",
          items: nextItems,
        });
        if (nextBg) channel.postMessage({ type: "BG_SYNC", bgMode: nextBg });
        if (nextLayout)
          channel.postMessage({ type: "LAYOUT_SYNC", layoutMode: nextLayout });
        channel.close();
      }
    } catch {
      /* ignore */
    }
  };

  // Talking Alphabet State
  const [selectedLetter, setSelectedLetter] = useState(HEBREW_ALPHABET[0]);
  const [selectedNikud, setSelectedNikud] = useState(NIKUD_MARKS[0]);

  // 100-Board & Clock State
  const [multipleHighlight, setMultipleHighlight] = useState<number | null>(null);
  const [hiddenNumbers, setHiddenNumbers] = useState<number[]>([]);
  const [clockH, setClockH] = useState(3);
  const [clockM, setClockM] = useState(15);

  // Classroom Tools State
  const [timerSec, setTimerSec] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [pickedStudent, setPickedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!timerRunning) return;
    const iv = setInterval(() => {
      setTimerSec((s) => {
        if (s <= 1) {
          sfx.win();
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [timerRunning]);

  /* ---------- Quick Create & 1-Click Collection Handlers ---------- */

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    sfx.pop();
    const colorMap: Record<BoardCategory, BoardColor> = {
      "שפה וקריאה": "cyan",
      "מתמטיקה": "amber",
      "מדע וחלל": "emerald",
      "משימות כיתה": "violet",
    };
    const emojiMap: Record<BoardCategory, string> = {
      "שפה וקריאה": "🔤",
      "מתמטיקה": "🧮",
      "מדע וחלל": "🔬",
      "משימות כיתה": "⭐",
    };
    const created: BoardItem = {
      id: `item-${Date.now()}`,
      type: quickType,
      title: quickTitle.trim(),
      content:
        quickContent.trim() ||
        "פְּרִיט לְמִידָה שֶׁנּוֹסַף לְמַסְלוּל הַשִּׁיעוּר עַל הַלּוּחַ.",
      answer:
        quickType === "flashcard"
          ? quickAnswer.trim() || "הַתְּשׁוּבָה הַנְּכוֹנָה!"
          : undefined,
      emoji: emojiMap[quickCategory],
      category: quickCategory,
      color: colorMap[quickCategory],
      fontSize: "normal",
      pinned: false,
      x: 50 + ((items.length * 45) % 450),
      y: 50 + ((items.length * 35) % 240),
      author: userName,
    };
    const next = [...items, created];
    setItems(next);
    broadcastUpdate(next);
    setQuickTitle("");
    setQuickContent("");
    setQuickAnswer("");
    setShowMoreFields(false);
  };

  const handleCollectFromLibrary = (
    libItem: Omit<BoardItem, "x" | "y" | "author" | "pinned">,
  ) => {
    const alreadyExists = items.some((it) => it.id === libItem.id);
    if (alreadyExists) {
      sfx.click();
      const next = items.filter((it) => it.id !== libItem.id);
      setItems(next);
      broadcastUpdate(next);
      return;
    }
    sfx.correct();
    const added: BoardItem = {
      ...libItem,
      pinned: false,
      x: 60 + ((items.length * 50) % 460),
      y: 60 + ((items.length * 40) % 220),
      author: userName,
    };
    const next = [...items, added];
    setItems(next);
    broadcastUpdate(next);
  };

  const togglePinItem = (id: string) => {
    sfx.click();
    const next = items.map((it) =>
      it.id === id ? { ...it, pinned: !it.pinned } : it,
    );
    setItems(next);
    broadcastUpdate(next);
  };

  const cycleItemColor = (id: string) => {
    sfx.click();
    const order: BoardColor[] = ["cyan", "pink", "amber", "emerald", "violet"];
    const next = items.map((it) => {
      if (it.id !== id) return it;
      const nextColor = order[(order.indexOf(it.color) + 1) % order.length];
      return { ...it, color: nextColor };
    });
    setItems(next);
    broadcastUpdate(next);
  };

  const toggleItemFontSize = (id: string) => {
    sfx.click();
    const next = items.map((it) =>
      it.id === id
        ? {
            ...it,
            fontSize:
              it.fontSize === "normal" ? ("large" as const) : ("normal" as const),
          }
        : it,
    );
    setItems(next);
    broadcastUpdate(next);
  };

  const deleteItem = (id: string) => {
    sfx.click();
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    broadcastUpdate(next);
  };

  /* ---------- Station Demo Action ---------- */
  const handleStationDemo = (stationId: 1 | 2 | 3 | 4) => {
    sfx.correct();
    if (stationId === 1) {
      const uncollected = CURATED_LIBRARY_ITEMS.find(
        (li) => !items.some((it) => it.id === li.id),
      );
      if (uncollected) {
        handleCollectFromLibrary(uncollected);
        speak(`נאסף ללוח: ${uncollected.title}`);
      } else {
        setShowLibraryTray(true);
        speak("מאגר הפריטים פתוח לאיסוף מהיר!");
      }
    } else if (stationId === 2) {
      const nextLayout = layoutMode === "journey" ? "columns" : "journey";
      setLayoutMode(nextLayout);
      broadcastUpdate(items, undefined, nextLayout);
      speak(
        nextLayout === "columns"
          ? "הפריטים סודרו לפי עמודות נושא"
          : "הפריטים סודרו במסלול מסע ממוספר",
      );
    } else if (stationId === 3) {
      const nextBg = bgMode === "grid" ? "lines" : "grid";
      setBgMode(nextBg);
      broadcastUpdate(items, nextBg);
      speak(
        nextBg === "lines"
          ? "משטח הלוח הוחלף לשורות מחברת"
          : "משטח הלוח הוחלף למשבצות חשבון",
      );
    } else if (stationId === 4) {
      setSubTab("alphabet");
      speak("פתחנו את מעבדת האותיות והניקוד המדברת");
    }
  };

  /* ---------- Free Canvas Dragging ---------- */
  const handlePointerDownItem = (e: React.PointerEvent, item: BoardItem) => {
    if (layoutMode !== "canvas" || drawMode) return;
    const rect = boardContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingId(item.id);
    setDragOffset({
      x: e.clientX - rect.left - item.x,
      y: e.clientY - rect.top - item.y,
    });
  };

  const handlePointerMoveBoard = (e: React.PointerEvent) => {
    if (!draggingId || layoutMode !== "canvas") return;
    const rect = boardContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nextX = Math.max(
      12,
      Math.min(rect.width - 260, e.clientX - rect.left - dragOffset.x),
    );
    const nextY = Math.max(
      12,
      Math.min(rect.height - 160, e.clientY - rect.top - dragOffset.y),
    );
    setItems((prev) =>
      prev.map((it) =>
        it.id === draggingId ? { ...it, x: nextX, y: nextY } : it,
      ),
    );
  };

  const handlePointerUpBoard = () => {
    if (draggingId) {
      setDraggingId(null);
      broadcastUpdate(items);
    }
  };

  /* ---------- Drawing Layer Handlers ---------- */
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sfx.click();
  };

  /* ---------- Frosted Glass Card Themes ---------- */
  const colorClasses: Record<BoardColor, string> = {
    cyan: "bg-gradient-to-br from-white/90 to-sky-50/85 border-sky-200/90 text-slate-800 shadow-sm",
    pink: "bg-gradient-to-br from-white/90 to-pink-50/85 border-pink-200/90 text-slate-800 shadow-sm",
    amber:
      "bg-gradient-to-br from-white/90 to-amber-50/85 border-amber-200/90 text-slate-800 shadow-sm",
    emerald:
      "bg-gradient-to-br from-white/90 to-emerald-50/85 border-emerald-200/90 text-slate-800 shadow-sm",
    violet:
      "bg-gradient-to-br from-white/90 to-violet-50/85 border-violet-200/90 text-slate-800 shadow-sm",
  };

  const badgeAccentClasses: Record<BoardColor, string> = {
    cyan: "text-sky-700",
    pink: "text-pink-700",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    violet: "text-violet-700",
  };

  const bgPatternStyle = (): React.CSSProperties => {
    if (bgMode === "grid") {
      return {
        backgroundImage:
          "linear-gradient(to right, rgba(14, 165, 233, 0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(14, 165, 233, 0.09) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      };
    }
    if (bgMode === "lines") {
      return {
        backgroundImage:
          "linear-gradient(to bottom, transparent 35px, rgba(14, 165, 233, 0.18) 36px)",
        backgroundSize: "100% 36px",
      };
    }
    return {};
  };

  const filteredItems = items
    .filter((it) => categoryFilter === "הכל" || it.category === categoryFilter)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  const currentStationObj =
    JOURNEY_STATIONS.find((s) => s.id === activeStation) || JOURNEY_STATIONS[0];

  const renderCard = (item: BoardItem, stepIndex?: number) => {
    const isRevealed = Boolean(revealedAnswers[item.id]);
    return (
      <div
        key={item.id}
        onPointerDown={(e) => handlePointerDownItem(e, item)}
        style={
          layoutMode === "canvas"
            ? {
                position: "absolute",
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: "295px",
                zIndex: draggingId === item.id ? 30 : 10,
                cursor: drawMode ? "crosshair" : "grab",
              }
            : undefined
        }
        className={`rounded-2xl border p-5 transition-all backdrop-blur-xl flex flex-col justify-between ${
          colorClasses[item.color]
        } ${item.pinned ? "ring-2 ring-sky-400/70" : ""}`}
      >
        <div>
          {/* Top Metadata & Quiet Action Row */}
          <div className="flex items-center justify-between gap-2 mb-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 truncate">
              {typeof stepIndex === "number" && (
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs inline-flex items-center justify-center shrink-0 tabular-nums">
                  {stepIndex + 1}
                </span>
              )}
              <span className="text-lg">{item.emoji}</span>
              <span className={`font-semibold ${badgeAccentClasses[item.color]}`}>
                {item.category}
              </span>
              {item.sourceLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-500">{item.sourceLabel}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => speak(`${item.title}. ${item.content}`)}
                className="p-1.5 rounded-lg hover:bg-slate-200/60 text-sky-600"
                title="הַקְרֵא כַּרְטִיסִיָּה"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => cycleItemColor(item.id)}
                className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500"
                title="שַׁנֵּה גּוֹוֶן כַּרְטִיסִיָּה"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => toggleItemFontSize(item.id)}
                className="px-1.5 py-0.5 rounded-lg hover:bg-slate-200/60 text-[11px] font-bold text-slate-600"
                title="הַגְדֵּל / הַקְטֵן גּוֹפָן"
              >
                א+
              </button>
              <button
                onClick={() => togglePinItem(item.id)}
                className={`p-1.5 rounded-lg hover:bg-slate-200/60 ${
                  item.pinned ? "text-amber-500" : "text-slate-400"
                }`}
                title="נְעַץ בְּרֹאשׁ הַמַּסְלוּל"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500"
                title="הָסֵר מֵהַלּוּחַ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card Title & Content */}
          <h4
            className={`font-bold text-slate-900 mb-1.5 nikud ${
              item.fontSize === "large" ? "text-xl" : "text-base"
            }`}
          >
            {item.title}
          </h4>
          <p
            className={`text-slate-600 nikud leading-relaxed ${
              item.fontSize === "large" ? "text-base" : "text-sm"
            }`}
          >
            {item.content}
          </p>

          {/* Optional Embedded YouTube Video */}
          {item.youtubeEmbedUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900">
              <iframe
                src={item.youtubeEmbedUrl}
                title={item.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Optional External Resource / Drive Link */}
          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>פְּתַח קוֹבֶץ מָקוֹר</span>
            </a>
          )}
        </div>

        {/* Flashcard Interactive Answer Reveal */}
        {item.type === "flashcard" && item.answer && (
          <div className="mt-3.5 pt-3 border-t border-slate-200/70">
            {isRevealed ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between nikud">
                <span>✓ תְּשׁוּבָה: {item.answer}</span>
                <button
                  onClick={() =>
                    setRevealedAnswers((prev) => ({
                      ...prev,
                      [item.id]: false,
                    }))
                  }
                  className="text-slate-500 hover:text-slate-800 underline mr-2 shrink-0"
                >
                  הַסְתֵּר
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  sfx.pop();
                  setRevealedAnswers((prev) => ({ ...prev, [item.id]: true }));
                }}
                className="btn-glow w-full py-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200/90 text-xs font-bold text-sky-700 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>גַּלֵּה תְּשׁוּבָה לַחִידָה</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ====================================================================
         1. VISUAL JOURNEY PATH (נקודת התחלה ברורה ותחושת מסע)
         ==================================================================== */}
      <section className="glass-strong rounded-3xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <div className="text-xs font-bold text-sky-600 flex items-center gap-1.5 mb-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>מַסְלוּל הַלְּמִידָה הַמּוּדְרָךְ · {items.length} פְּרִיטִים בְּאוֹסֶף הַלּוּחַ שֶׁלִּי</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 nikud">
              לוּחַ הַלְּמִידָה הָאִינְטֶרְאַקְטִיבִי
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                sfx.click();
                setShowGuideTip((s) => !s);
              }}
              className={`btn-glow px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                showGuideTip
                  ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                  : "bg-white/80 text-slate-700 border-slate-200 hover:bg-white"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{showGuideTip ? "הַסְתֵּר הַדְרָכָה" : "הַצֵּג מַדְרִיךְ מַסָּע"}</span>
            </button>

            <button
              onClick={() => {
                sfx.click();
                setShowInviteModal(true);
              }}
              className="btn-glow px-3.5 py-2 rounded-xl bg-white/85 border border-slate-200/90 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-sky-600" />
              <span>שִׁיתּוּף כִּיתָּתִי ({activeCollaborators.length})</span>
            </button>
          </div>
        </div>

        {/* 4 Connected Journey Stations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {JOURNEY_STATIONS.map((st) => {
            const isActive = activeStation === st.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  sfx.click();
                  setActiveStation(st.id);
                  if (st.id <= 3) setSubTab("workspace");
                }}
                className={`btn-glow text-right p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white border-sky-400 shadow-md"
                    : "bg-white/75 hover:bg-white border-slate-200/80 text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-xs font-bold ${
                      isActive ? "text-sky-100" : "text-sky-600"
                    }`}
                  >
                    {st.id === 1 ? "★ נְקוּדַת הַתְחָלָה" : `תַּחֲנָה ${st.id}`}
                  </span>
                  {isActive && (
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-md font-bold">
                      כָּאן כָּעֵת
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm nikud">{st.title}</div>
                <div
                  className={`text-xs mt-1 nikud ${
                    isActive ? "text-sky-100" : "text-slate-500"
                  }`}
                >
                  {st.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Gentle Contextual Guide Strip for the Active Station */}
        {showGuideTip && (
          <div className="mt-4 p-4 rounded-2xl bg-sky-50/90 border border-sky-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pop">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center shrink-0 text-sm tabular-nums">
                {currentStationObj.id}
              </div>
              <div>
                <p className="text-sm text-slate-700 leading-relaxed nikud">
                  {currentStationObj.guideTip}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() =>
                  speak(`${currentStationObj.title}. ${currentStationObj.guideTip}`)
                }
                className="btn-glow p-2 rounded-xl bg-white border border-slate-200 text-sky-600"
                title="הַקְרֵא הַדְרָכָה"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStationDemo(currentStationObj.id)}
                className="btn-glow px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentStationObj.actionText}</span>
              </button>
              {activeStation < 4 && (
                <button
                  onClick={() => {
                    sfx.click();
                    setActiveStation((s) =>
                      Math.min(4, s + 1) as 1 | 2 | 3 | 4,
                    );
                  }}
                  className="btn-glow px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 whitespace-nowrap"
                >
                  <span>הַתַּחֲנָה הַבָּאָה</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ====================================================================
         2. EFFORTLESS ITEM CREATION & 1-CLICK COLLECTION (איסוף ויצירה בקלות)
         ==================================================================== */}
      {subTab === "workspace" && (
        <section className="glass-strong rounded-3xl p-5 space-y-4">
          {/* Instant 1-Line Quick Add Bar */}
          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setQuickType("note")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    quickType === "note"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📝 פִּתְקִית לִימּוּד
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickType("flashcard");
                    setShowMoreFields(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    quickType === "flashcard"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ❓ כַּרְטִיסִיַּת חִידָה
                </button>
              </div>

              <select
                value={quickCategory}
                onChange={(e) =>
                  setQuickCategory(e.target.value as BoardCategory)
                }
                aria-label="נושא הפריט"
                className="px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs font-bold text-slate-700"
              >
                <option value="שפה וקריאה">שָׂפָה וּקְרִיאָה</option>
                <option value="מתמטיקה">מָתֵמָטִיקָה</option>
                <option value="מדע וחלל">מַדָּע וְחָלָל</option>
                <option value="משימות כיתה">מְשִׂימוֹת כִּיתָּה</option>
              </select>

              <input
                type="text"
                placeholder="הַקְלִידוּ מוּשָׂג, מִילָּה אוֹ שְׁאֵלָה כְּדֵי לְהוֹסִיף מִיָּד לַלּוּחַ..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl bg-white/95 border border-slate-200/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
              />

              <button
                type="button"
                onClick={() => setShowMoreFields((m) => !m)}
                className="px-3 py-2.5 rounded-xl bg-white/80 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
              >
                {showMoreFields ? "פָּחוֹת פְּרָטִים" : "+ פֵּירוּט / תְּשׁוּבָה"}
              </button>

              <button
                type="submit"
                className="btn-glow px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>הוֹסֵף לַלּוּחַ שֶׁלִּי</span>
              </button>
            </div>

            {showMoreFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 animate-pop">
                <input
                  type="text"
                  placeholder="הֶסְבֵּר מַרְחִיב אוֹ דּוּגְמָה לַכַּרְטִיסִיָּה..."
                  value={quickContent}
                  onChange={(e) => setQuickContent(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-800"
                />
                {quickType === "flashcard" && (
                  <input
                    type="text"
                    placeholder="הַתְּשׁוּבָה הַמּוּסְתֶּרֶת שֶׁתִּתְגַּלֶּה בִּלְחִיצָה..."
                    value={quickAnswer}
                    onChange={(e) => setQuickAnswer(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-slate-800"
                  />
                )}
              </div>
            )}
          </form>

          {/* Curated Ready-to-Collect Treasure Strip */}
          <div className="pt-3 border-t border-slate-200/70">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-700">
                  מַאֲגַר פְּרִיטִים מוּכָנִים לְאִיסּוּף מָהִיר (לִחֲצוּ כְּדֵי לֶאֱסוֹף אוֹ לְהָסִיר מֵהַלּוּחַ):
                </span>
              </div>
              <button
                onClick={() => setShowLibraryTray((t) => !t)}
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                {showLibraryTray ? "הַסְתֵּר מַאֲגָר" : "הַצֵּג מַאֲגָר לְאִיסּוּף"}
              </button>
            </div>

            {showLibraryTray && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                {CURATED_LIBRARY_ITEMS.map((lib) => {
                  const collected = items.some((it) => it.id === lib.id);
                  return (
                    <button
                      key={lib.id}
                      onClick={() => handleCollectFromLibrary(lib)}
                      className={`btn-glow shrink-0 px-3.5 py-2.5 rounded-2xl border text-right transition-all flex items-center gap-2.5 max-w-[260px] ${
                        collected
                          ? "bg-emerald-50/90 border-emerald-300 text-emerald-900"
                          : "bg-white/80 hover:bg-white border-slate-200/90 text-slate-800"
                      }`}
                    >
                      <span className="text-xl shrink-0">{lib.emoji}</span>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate nikud">
                          {lib.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {lib.category}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                          collected
                            ? "bg-emerald-500 text-white"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {collected ? "✓ נֶאֱסַף" : "+ אֱסוֹף"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ====================================================================
         3. CALM VIEW & TOOLS BAR (מעבר בין הלוח ומעבדות העזר)
         ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass rounded-2xl p-2.5">
        {/* Sub-Tabs: Main Board vs Interactive Manipulatives */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              sfx.click();
              setSubTab("workspace");
            }}
            className={`btn-glow px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
              subTab === "workspace"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>הַלּוּחַ שֶׁלִּי ({items.length})</span>
          </button>
          <button
            onClick={() => {
              sfx.click();
              setSubTab("alphabet");
              setActiveStation(4);
            }}
            className={`btn-glow px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
              subTab === "alphabet"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>אוֹתִיּוֹת וְנִיקּוּד מְדַבֵּר</span>
          </button>
          <button
            onClick={() => {
              sfx.click();
              setSubTab("hundred");
              setActiveStation(4);
            }}
            className={`btn-glow px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
              subTab === "hundred"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>לוּחַ הַמֵּאָה וְשָׁעוֹן</span>
          </button>
          <button
            onClick={() => {
              sfx.click();
              setSubTab("tools");
              setActiveStation(4);
            }}
            className={`btn-glow px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
              subTab === "tools"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>טַיְימֶר וְהַגְרָלַת תַּלְמִיד</span>
          </button>
        </div>

        {/* Organization & Surface Controls (only when on workspace) */}
        {subTab === "workspace" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-slate-200/80">
              {(
                [
                  { id: "journey", label: "מַסְלוּל מַסָּע" },
                  { id: "columns", label: "עַמּוּדוֹת" },
                  { id: "grid", label: "רֶשֶׁת" },
                  { id: "canvas", label: "גְּרִירָה חוֹפְשִׁית" },
                ] as const
              ).map((ly) => (
                <button
                  key={ly.id}
                  onClick={() => {
                    sfx.click();
                    setLayoutMode(ly.id);
                    setActiveStation(2);
                    broadcastUpdate(items, undefined, ly.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                    layoutMode === ly.id
                      ? "bg-sky-100 text-sky-800"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {ly.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-slate-200/80">
              {(
                [
                  { id: "grid", label: "מִשְׁבְּצוֹת" },
                  { id: "lines", label: "שׁוּרוֹת" },
                  { id: "clean", label: "זְכוּכִית חֲלָקָה" },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    sfx.click();
                    setBgMode(b.id);
                    setActiveStation(3);
                    broadcastUpdate(items, b.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                    bgMode === b.id
                      ? "bg-amber-100 text-amber-900"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                sfx.click();
                setDrawMode((d) => !d);
                setActiveStation(3);
              }}
              className={`btn-glow px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 whitespace-nowrap ${
                drawMode
                  ? "bg-pink-500 text-white border-pink-400"
                  : "bg-white/80 border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{drawMode ? "סִיּוּם צִיּוּר" : "טוּשׁ הַדְגָּשָׁה"}</span>
            </button>
          </div>
        )}
      </div>

      {/* ====================================================================
         MAIN WORKSPACE SURFACE (משטח זכוכיתי מואר ונקי)
         ==================================================================== */}
      {subTab === "workspace" && (
        <div className="space-y-4">
          {drawMode && (
            <div className="p-3 rounded-2xl glass border border-pink-300 flex flex-wrap items-center justify-between gap-3 animate-pop">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-pink-700">
                  🎨 בִּחֲרוּ צֶבַע טוּשׁ לְסִימּוּן עַל הַלּוּחַ:
                </span>
                {["#0284c7", "#db2777", "#d97706", "#059669", "#7c3aed"].map(
                  (hex) => (
                    <button
                      key={hex}
                      onClick={() => setBrushColor(hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-6 h-6 rounded-full border-2 ${
                        brushColor === hex
                          ? "border-slate-900 scale-115"
                          : "border-white"
                      }`}
                      aria-label={`צבע מברשת ${hex}`}
                    />
                  ),
                )}
              </div>
              <button
                onClick={clearDrawing}
                className="btn-glow px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>נַקֵּה סִימּוּנִים</span>
              </button>
            </div>
          )}

          <div
            ref={boardContainerRef}
            onPointerMove={handlePointerMoveBoard}
            onPointerUp={handlePointerUpBoard}
            style={bgPatternStyle()}
            className="relative min-h-[480px] rounded-3xl glass-strong p-6 overflow-hidden"
          >
            {/* Freehand Drawing Canvas Layer */}
            <canvas
              ref={canvasRef}
              width={1150}
              height={560}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              className={`absolute inset-0 w-full h-full ${
                drawMode
                  ? "z-20 cursor-crosshair pointer-events-auto"
                  : "z-0 pointer-events-none"
              }`}
            />

            {/* Layout 1: Numbered Journey Path ("מסלול מסע") */}
            {layoutMode === "journey" && (
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-2 border-b border-slate-200/70">
                  <span>
                    מַסְלוּל הַשִּׁיעוּר הַמְּמוּסְפָּר שֶׁלִּי ({filteredItems.length} תַּחֲנוֹת תּוֹכֶן)
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>סִינּוּן נוֹשֵׂא:</span>
                    {(
                      [
                        "הכל",
                        "שפה וקריאה",
                        "מתמטיקה",
                        "מדע וחלל",
                        "משימות כיתה",
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded-md font-semibold ${
                          categoryFilter === cat
                            ? "bg-sky-600 text-white"
                            : "hover:bg-slate-200/60 text-slate-600"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredItems.map((item, idx) => renderCard(item, idx))}
                </div>
              </div>
            )}

            {/* Layout 2: Ordered Grid */}
            {layoutMode === "grid" && (
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map((item) => renderCard(item))}
              </div>
            )}

            {/* Layout 3: Topic Columns */}
            {layoutMode === "columns" && (
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(
                  [
                    "שפה וקריאה",
                    "מתמטיקה",
                    "מדע וחלל",
                    "משימות כיתה",
                  ] as BoardCategory[]
                ).map((cat) => {
                  const colItems = filteredItems.filter(
                    (it) => it.category === cat,
                  );
                  return (
                    <div
                      key={cat}
                      className="p-3.5 rounded-2xl bg-white/65 border border-slate-200/80 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                        <h4 className="text-sm font-bold text-slate-800">
                          {cat}
                        </h4>
                        <span className="text-xs font-bold text-sky-700 tabular-nums">
                          {colItems.length}
                        </span>
                      </div>
                      {colItems.map((item) => renderCard(item))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Layout 4: Free Drag Canvas */}
            {layoutMode === "canvas" && (
              <div className="relative z-10 w-full h-[500px]">
                <div className="text-xs text-slate-500 mb-2">
                  ✨ מַצַּב גְּרִירָה חוֹפְשִׁית: גִּרְרוּ כָּל כַּרְטִיסִיָּה לְכָל מָקוֹם עַל מִשְׁטַח הַזְּכוּכִית!
                </div>
                {filteredItems.map((item) => renderCard(item))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
         SUBTAB 2: TALKING ALEF-BET & NIKUD LAB (מעבדת אותיות וניקוד מדברת)
         ==================================================================== */}
      {subTab === "alphabet" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 glass-strong rounded-3xl p-6 text-center flex flex-col justify-between">
            <div>
              <span className="text-xs text-sky-600 font-bold">
                תְּצוּגַת הֲבָרָה חַיָּה
              </span>
              <div className="my-5 py-8 rounded-3xl bg-white/90 border border-sky-200 shadow-inner">
                <div className="text-8xl font-extrabold text-sky-600 nikud mb-3">
                  {selectedLetter.letter}
                  {selectedNikud.mark}
                </div>
                <div className="text-sm text-slate-600">
                  אוֹת <strong>{selectedLetter.name}</strong> +{" "}
                  <strong>{selectedNikud.name}</strong> ({selectedNikud.desc})
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-between mb-6">
                <div className="text-right">
                  <div className="text-xs text-slate-500">מִילָּה לְדוּגְמָה:</div>
                  <div className="text-2xl font-bold text-slate-900 nikud">
                    {selectedLetter.word}
                  </div>
                </div>
                <span className="text-5xl">{selectedLetter.emoji}</span>
              </div>
            </div>

            <button
              onClick={() =>
                speak(
                  `${selectedLetter.letter}${selectedNikud.mark}, כמו במילה ${selectedLetter.word}`,
                  0.8,
                )
              }
              className="btn-glow w-full py-3.5 rounded-xl bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Volume2 className="w-5 h-5" />
              <span>הַשְׁמַע הֲבָרָה וּמִילָּה בְּקוֹל</span>
            </button>
          </div>

          <div className="lg:col-span-7 glass-strong rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3">
                1. בִּחֲרוּ אוֹת מֵהָאָלֶף-בֵּית:
              </h3>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {HEBREW_ALPHABET.map((item) => (
                  <button
                    key={item.letter}
                    onClick={() => {
                      sfx.click();
                      setSelectedLetter(item);
                      speak(`${item.name}, ${item.word}`);
                    }}
                    className={`btn-glow h-12 rounded-xl font-bold text-xl flex items-center justify-center border ${
                      selectedLetter.letter === item.letter
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                        : "bg-white/80 border-slate-200/90 text-slate-800 hover:bg-white"
                    }`}
                  >
                    {item.letter}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3">
                2. בִּחֲרוּ סִימַן נִיקּוּד:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {NIKUD_MARKS.map((nk) => (
                  <button
                    key={nk.id}
                    onClick={() => {
                      sfx.pop();
                      setSelectedNikud(nk);
                      speak(`${selectedLetter.letter}${nk.mark}`);
                    }}
                    className={`btn-glow p-3 rounded-xl border text-right flex items-center justify-between ${
                      selectedNikud.id === nk.id
                        ? "bg-amber-50 border-amber-400 text-slate-900"
                        : "bg-white/80 border-slate-200/90 text-slate-700 hover:bg-white"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 nikud">
                        {nk.name}
                      </div>
                      <div className="text-[11px] text-slate-500">{nk.desc}</div>
                    </div>
                    <span className="text-2xl font-bold text-amber-600 nikud">
                      א{nk.mark}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         SUBTAB 3: 100-BOARD & INTERACTIVE CLOCK (לוח המאה ושעון חי)
         ==================================================================== */}
      {subTab === "hundred" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 glass-strong rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                לוּחַ הַמֵּאָה הָאִינְטֶרְאַקְטִיבִי
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500">הַדְגֵּשׁ כְּפוּלוֹת:</span>
                {[2, 3, 5, 9, 10].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      sfx.click();
                      setMultipleHighlight(multipleHighlight === m ? null : m);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums border ${
                      multipleHighlight === m
                        ? "bg-amber-400 text-slate-950 border-amber-400"
                        : "bg-white/80 text-slate-700 border-slate-200"
                    }`}
                  >
                    ×{m}
                  </button>
                ))}
                <button
                  onClick={() => {
                    sfx.click();
                    setMultipleHighlight(null);
                    setHiddenNumbers([]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-600"
                >
                  אִיפּוּס
                </button>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-1.5" dir="ltr">
              {Array.from({ length: 100 }, (_, i) => {
                const n = i + 1;
                const isMult =
                  multipleHighlight !== null && n % multipleHighlight === 0;
                const isHidden = hiddenNumbers.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() => {
                      sfx.pop();
                      speak(String(n));
                      setHiddenNumbers((prev) =>
                        prev.includes(n)
                          ? prev.filter((x) => x !== n)
                          : [...prev, n],
                      );
                    }}
                    className={`h-9 rounded-lg font-bold text-xs tabular-nums transition-all border ${
                      isHidden
                        ? "bg-pink-100 border-pink-300 text-pink-700"
                        : isMult
                          ? "bg-amber-300 border-amber-400 text-slate-950 scale-105"
                          : "bg-white/85 hover:bg-sky-50 text-slate-800 border-slate-200/80"
                    }`}
                  >
                    {isHidden ? "?" : n}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              💡 לִחֲצוּ עַל כָּל מִסְפָּר כְּדֵי לְהַסְתִּיר אוֹתוֹ לְחִידָה כִּיתָּתִית אוֹ לִשְׁמוֹעַ אוֹתוֹ בְּקוֹל.
            </p>
          </div>

          <div className="lg:col-span-5 glass-strong rounded-3xl p-6 flex flex-col justify-between text-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-sky-600" />
                <span>שָׁעוֹן לִימּוּדִי אִינְטֶרְאַקְטִיבִי</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                כַּוְּנוּ אֶת הַשָּׁעוֹת וְהַדַּקּוֹת לְתַרְגּוּל קְרִיאַת שָׁעוֹן אָנָלוֹגִי וְדִיגִיטָלִי
              </p>

              <div className="my-4">
                <AnalogClockSvg h={clockH} m={clockM} size={185} />
              </div>

              <div
                className="text-3xl font-extrabold text-sky-600 tabular-nums mb-4"
                dir="ltr"
              >
                {String(clockH).padStart(2, "0")}:
                {String(clockM).padStart(2, "0")}
              </div>

              <div className="space-y-3 text-right p-4 rounded-2xl bg-white/80 border border-slate-200/80">
                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1">
                    <span>מְחוֹג שָׁעוֹת (קָצָר - כָּתוֹם):</span>
                    <span className="font-bold tabular-nums">{clockH}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={clockH}
                    onChange={(e) => setClockH(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1">
                    <span>מְחוֹג דַּקּוֹת (אָרוֹךְ - כָּחוֹל):</span>
                    <span className="font-bold tabular-nums">{clockM} דַּקּוֹת</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={55}
                    step={5}
                    value={clockM}
                    onChange={(e) => setClockM(Number(e.target.value))}
                    className="w-full accent-sky-600"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                speak(
                  `השעה היא ${clockH} ו-${clockM === 0 ? "אפס" : clockM} דקות`,
                )
              }
              className="btn-glow mt-4 w-full py-3 rounded-xl bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Volume2 className="w-4 h-4" />
              <span>הַקְרֵא אֶת הַשָּׁעָה בְּקוֹל</span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
         SUBTAB 4: CLASSROOM LIVE TOOLS (טיימר והגרלת תלמיד)
         ==================================================================== */}
      {subTab === "tools" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-strong rounded-3xl p-6 text-center flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                טַיְימֶר פְּעִילוּת כִּיתָּתִי
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                קִבְעוּ זְמַן לַמְּשִׂימָה וְהַפְעִילוּ סְפִירָה לְאָחוֹר עִם צְלִיל סִיּוּם
              </p>

              <div
                className="text-6xl font-extrabold text-sky-600 my-6 tabular-nums"
                dir="ltr"
              >
                {String(Math.floor(timerSec / 60)).padStart(2, "0")}:
                {String(timerSec % 60).padStart(2, "0")}
              </div>

              <div className="flex items-center justify-center gap-2 mb-6">
                {[30, 60, 120, 300].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      sfx.click();
                      setTimerRunning(false);
                      setTimerSec(sec);
                    }}
                    className="btn-glow px-3.5 py-2 rounded-xl bg-white/85 border border-slate-200 text-xs font-bold text-slate-700 tabular-nums"
                  >
                    {sec < 60 ? `${sec} שניות` : `${sec / 60} דקות`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  sfx.click();
                  setTimerRunning((r) => !r);
                }}
                className="btn-glow flex-1 py-3.5 rounded-xl bg-sky-600 text-white font-bold text-sm"
              >
                {timerRunning ? "הַשְׁהֵה טַיְימֶר" : "הַפְעֵל טַיְימֶר"}
              </button>
              <button
                onClick={() => {
                  sfx.click();
                  setTimerRunning(false);
                  setTimerSec(60);
                }}
                className="btn-glow px-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 text-center flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                הַגְרָלַת תַּלְמִיד לַלּוּחַ
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                בְּחִירָה הוֹגֶנֶת וּמְשׂוּחֶקֶת שֶׁל תַּלְמִיד/ה לִפְתִּירַת הַחִידָה עַל הַלּוּחַ
              </p>

              {pickedStudent ? (
                <div className="my-4 p-5 rounded-2xl bg-amber-50/90 border border-amber-300 inline-flex flex-col items-center animate-pop">
                  <AvatarSvg config={pickedStudent.avatar} size={76} />
                  <div className="text-2xl font-bold text-slate-900 mt-2 nikud">
                    {pickedStudent.name}
                  </div>
                  <div className="text-xs text-slate-600">
                    כִּיתָּה {pickedStudent.grade}׳ · {pickedStudent.stars} ⭐
                  </div>
                </div>
              ) : (
                <div className="my-8 text-5xl opacity-60">🎲</div>
              )}
            </div>

            <button
              onClick={() => {
                if (students.length === 0) return;
                sfx.win();
                const chosen =
                  students[Math.floor(Math.random() * students.length)];
                setPickedStudent(chosen);
                speak(`התור של ${chosen.name}!`);
              }}
              className="btn-glow w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              <span>הַגְרֵל תַּלְמִיד/ה כָּעֵת</span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
         COLLABORATION & INVITE MODAL (שיתוף פעולה והזמנת משתמשים)
         ==================================================================== */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-lg w-full border border-white animate-pop">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <span>שִׁיתּוּף פְּעוּלָה בַּלּוּחַ בִּזְמַן אֱמֶת</span>
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              הַלּוּחַ מְסוּנְכְּרָן בִּזְמַן אֱמֶת. הַזְמִינוּ תַּלְמִידִים אוֹ מוֹרִים נוֹסָפִים לֶאֱסוֹף פְּרִיטִים, לְסַדֵּר עַמּוּדוֹת וּלְהוֹסִיף חִידוֹת יַחַד.
            </p>

            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-2 mb-5">
              <span className="text-xs text-sky-700 font-medium truncate" dir="ltr">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/?board=OR-2026`
                  : "https://iyey-or.edu/?board=OR-2026"}
              </span>
              <button
                onClick={() => {
                  sfx.pop();
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/?board=OR-2026`,
                    );
                  }
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="btn-glow px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center gap-1 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>הוּעְתַּק!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>הַעְתֵּק קִישּׁוּר</span>
                  </>
                )}
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!inviteName.trim()) return;
                sfx.correct();
                setActiveCollaborators((prev) => [
                  ...prev,
                  {
                    id: `c-${Date.now()}`,
                    name: inviteName.trim(),
                    status: "הוּזְמַן/ה וּמְחוּבָּר/ת כָּעֵת",
                    color: "#10b981",
                  },
                ]);
                setInviteName("");
              }}
              className="flex gap-2 mb-5"
            >
              <input
                type="text"
                placeholder="הַקְלִידוּ שֵׁם תַּלְמִיד/ה אוֹ מוֹרֶה לְהַזְמָנָה..."
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
              <button
                type="submit"
                className="btn-glow px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs whitespace-nowrap"
              >
                שְׁלַח הַזְמָנָה
              </button>
            </form>

            <div className="space-y-2 mb-4">
              <div className="text-xs font-bold text-slate-700">
                מִשְׁתַּתְּפִים פְּעִילִים בַּלּוּחַ ({activeCollaborators.length}):
              </div>
              {activeCollaborators.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="font-bold text-slate-900">{c.name}</span>
                  </div>
                  <span className="text-slate-500">{c.status}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="btn-glow w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              סְגִירָה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
