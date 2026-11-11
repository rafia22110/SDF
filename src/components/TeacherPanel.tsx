import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  CheckCircle2,
  ClipboardList,
  Trash2,
  Play,
  Target,
  Calendar,
  Clock,
  Upload,
  FolderOpen,
  Youtube,
  Mail,
  BookOpen,
  Send,
  Sparkles,
  LogOut,
  FileText,
  ExternalLink,
  Check,
  AlertCircle,
  UserCheck,
  Link2,
  Gamepad2,
  Eye,
  Search,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  ClassState,
  Grade,
  IslandId,
  Mission,
  PartyRole,
  Question,
  QuestType,
  Student,
} from "../types";
import {
  GAMES,
  GRADES,
  getCustomQuestionsMap,
  addCustomQuestionsForGame,
  deleteCustomQuestionForGame,
} from "../data/content";
import { sfx } from "../audio";
import { AvatarSvg } from "./AvatarSvg";
import {
  BoardCategory,
  BoardItem,
  pushItemToSmartBoard,
  pushMultipleItemsToSmartBoard,
} from "./SmartBoard";
import { FlexibleTimetable } from "./FlexibleTimetable";
import {
  initAuth,
  googleSignIn,
  logout,
  fetchDriveFiles,
  extractDriveFileRealContent,
  fetchClassroomCourses,
  createClassroomCourseWork,
  sendGmailMessage,
  DriveFileItem,
  ClassroomCourse,
} from "../services/workspaceAuth";
import {
  processAnyFileToBoardItems,
  processDriveFileItemToBoardItems,
  createBoardItemFromExternalLinkAsync,
} from "../services/fileProcessor";
import { Pdf3DModelStudio } from "./Pdf3DModelStudio";

interface TeacherPanelProps {
  classState: ClassState;
  onUpdateClass: (next: ClassState) => void;
  onLaunchGame: (gameId: string) => void;
  onSelectIsland?: (islandId: IslandId) => void;
  onSwitchToBoard?: () => void;
}

interface TeacherProfile {
  name: string;
  school: string;
  email: string;
  homeroomGrade: Grade;
  registered: boolean;
}

interface AgendaItem {
  id: string;
  time: string;
  title: string;
  notes: string;
  done: boolean;
}

const DEFAULT_AGENDA: AgendaItem[] = [
  { id: "ag-1", time: "08:00", title: "מִפְגַּשׁ בּוֹקֶר וְסֶבֶב מָה שְׁלוֹמִי", notes: "שִׂיחַ כִּיתָּתִי וּבְדִיקַת נוֹכְחוּת", done: true },
  { id: "ag-2", time: "08:30", title: "שִׁיעוּר שָׂפָה: אוֹתִיּוֹת, נִיקּוּד וְאוֹצַר מִילִּים", notes: "עֲבוֹדָה מְשׁוּתֶּפֶת עַל לוּחַ הַלְּמִידָה", done: false },
  { id: "ag-3", time: "09:45", title: "הַפְסָקַת אוֹכֶל וַהֲפָגָה פְּעִילָה בֶּחָצֵר", notes: "לֹא לִשְׁכּוֹחַ שְׁתִיַּת מַיִם", done: false },
  { id: "ag-4", time: "10:15", title: "מַעְבָּדַת חֶשְׁבּוֹן: לוּחַ הַמֵּאָה וּקְרִיאַת שָׁעוֹן", notes: "תַּרְגּוּל בְּזוּגוֹת וּמִשְׂחַק בָּלוֹנִים", done: false },
  { id: "ag-5", time: "11:45", title: "מַעְבָּדַת מַדָּע וְסִיכּוּם הַיּוֹם", notes: "חֲלוּקַת כּוֹכְבֵי אוֹר וּמְשִׂימָה לַבַּיִת", done: false },
];

const CURATED_REPOSITORY_PACKS = [
  {
    id: "repo-1",
    title: "עֶרְכַּת שִׁיעוּר: מַסָּע בְּמַעֲרֶכֶת הַשֶּׁמֶשׁ",
    category: "מדע וחלל" as BoardCategory,
    emoji: "🪐",
    content: "8 כּוֹכְבֵי הַלֶּכֶת לְפִי סֵדֶר מֶרְחָקָם מֵהַשֶּׁמֶשׁ: חַמָּה, נוֹגַהּ, כַּדּוּר הָאָרֶץ, מַאֲדִים, צֶדֶק, שַׁבְּתַאי, אוּרָנוּס וְנֶפְּטוּן.",
    answer: "כּוֹכַב הַלֶּכֶת הַגָּדוֹל בְּיוֹתֵר הוּא צֶדֶק!",
  },
  {
    id: "repo-2",
    title: "עֶרְכַּת שִׁיעוּר: חוּקֵּי הַכֶּפֶל וְהַחִילּוּף",
    category: "מתמטיקה" as BoardCategory,
    emoji: "🧮",
    content: "חוֹק הַחִילּוּף (a × b = b × a) וְחוֹק הַפִּילּוּג מְסַיְּיעִים לָנוּ לְחַשֵּׁב תַּרְגִּילִים גְּדוֹלִים בְּקַלּוּת עַל לוּחַ הַמֵּאָה.",
    answer: "לְדוּגְמָה: 12 × 5 = (10 × 5) + (2 × 5) = 60",
  },
  {
    id: "repo-3",
    title: "עֶרְכַּת שִׁיעוּר: פִּתְגָּמִים וְנִיבִים בְּעִבְרִית",
    category: "שפה וקריאה" as BoardCategory,
    emoji: "📖",
    content: "'טוֹבִים הַשְּׁנַיִם מִן הָאֶחָד' — עֲבוֹדָה בְּשִׁיתּוּף פְּעוּלָה מְבִיאָה לְתוֹצָאוֹת טוֹבוֹת יוֹתֵר מֵעֲבוֹדָה לְבַד.",
    answer: "מוּשָׂג: שִׁיתּוּף פְּעוּלָה וְעֶזְרָה הֲדָדִית",
  },
  {
    id: "repo-4",
    title: "עֶרְכַּת שִׁיעוּר: מַחְזוֹר הַמַּיִם בַּטֶּבַע",
    category: "מדע וחלל" as BoardCategory,
    emoji: "🌧️",
    content: "הִתְאַדּוּת מֵהַיָּם -> הִתְעַבּוּת לַעֲנָנִים -> יְרִידַת מִשְׁקָעִים (גֶּשֶׁם וְשֶׁלֶג) -> זְרִימָה בַּנְּחָלִים חֲזָרָה לַיָּם.",
    answer: "4 שְׁלַבִּים מַחְזוֹרִיִּים בַּטֶּבַע",
  },
  {
    id: "repo-5",
    title: "מַצֶּגֶת שִׁבְעַת יְמֵי הַבְּרִיאָה — מַסָּע חָזוּתִי",
    category: "שפה וקריאה" as BoardCategory,
    emoji: "🌍",
    content: "יוֹם א׳: אוֹר וָחוֹשֶׁךְ · יוֹם ב׳: רָקִיעַ וְשָׁמַיִם · יוֹם ג׳: יַבָּשָׁה וּצְמָחִים · יוֹם ד׳: שֶׁמֶשׁ, יָרֵחַ וְכּוֹכָבִים · יוֹם ה׳: דָּגִים וְעוֹפוֹת · יוֹם ו׳: חַיּוֹת וְאָדָם · יוֹם ז׳: שַׁבָּת מְנוּחָה.",
    answer: "שִׁבְעָה שְׁלַבִּים שֶׁל יְצִירָה וְסֵדֶר בָּעוֹלָם",
  },
  {
    id: "repo-6",
    title: "חִינוּךְ גּוּפָנִי וּמַדָּע: קְפִיצָה לָרוֹחַק מוּל גּוֹבַהּ",
    category: "מדע וחלל" as BoardCategory,
    emoji: "🏃",
    content: "הַשְׁוָואַת זָווִית הַניתּוּר, תְּנוּפַת הָרִיצָה וּמֶרְכַּז הַכּוֹבֶד בִּקְפִיצָה לָרוֹחַק לְעוּמַּת קְפִיצָה לַגּוֹבַהּ.",
    answer: "שִׁילּוּב בֵּין כּוֹחַ מִתְפּוֹצֵץ לְטֶכְנִיקַת נְחִיתָה בְּטוּחָה",
  },
];

const CURATED_YOUTUBE_VIDEOS = [
  {
    id: "yt-1",
    title: "מַעֲרֶכֶת הַשֶּׁמֶשׁ וְכּוֹכְבֵי הַלֶּכֶת — סִרְטוֹן הַדְגָּמָה מַדָּעִי",
    embedUrl: "https://www.youtube.com/embed/libKVRa01L8",
    category: "מדע וחלל" as BoardCategory,
    question: "אֵיזֶה כּוֹכַב לֶכֶת הוּא הַקָּרוֹב בְּיוֹתֵר לַשֶּׁמֶשׁ?",
  },
  {
    id: "yt-2",
    title: "הֲבָנַת שְׁבָרִים וְחֲלוּקָה שָׁוָה — הַדְגָּמָה חָזוּתִית",
    embedUrl: "https://www.youtube.com/embed/n0FZhQ_GkKw",
    category: "מתמטיקה" as BoardCategory,
    question: "מָה מְסַמֵּל הַמְּכַנֶּה בְּשֶׁבֶר פָּשׁוּט?",
  },
];

function extractYoutubeEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes("youtube.com/embed/")) return trimmed;
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  return null;
}

export function TeacherPanel({
  classState,
  onUpdateClass,
  onLaunchGame,
  onSelectIsland,
  onSwitchToBoard,
}: TeacherPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "schedule" | "content" | "workspace" | "students"
  >("schedule");

  // Teacher Registration / Profile State
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("iyey_or_teacher_profile");
        if (saved) return JSON.parse(saved);
      } catch {
        /* ignore */
      }
    }
    return {
      name: "הַמּוֹרָה רותם",
      school: "בֵּית סֵפֶר אִיֵּי אוֹר",
      email: "rotem@iyey-or.edu",
      homeroomGrade: "ב",
      registered: true,
    };
  });
  const [editingTeacher, setEditingTeacher] = useState(false);

  // Google OAuth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Live Board Items Preview State (synced with SmartBoard)
  const [liveBoardItems, setLiveBoardItems] = useState<BoardItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("iyey_or_board_items_v1");
        if (raw) return JSON.parse(raw) as BoardItem[];
      } catch {
        /* ignore */
      }
    }
    return [];
  });

  useEffect(() => {
    const syncBoard = () => {
      try {
        const raw = localStorage.getItem("iyey_or_board_items_v1");
        if (raw) setLiveBoardItems(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    };
    const onCustomBoardUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<BoardItem[]>).detail;
      if (Array.isArray(detail)) {
        setLiveBoardItems(detail);
      } else {
        syncBoard();
      }
    };
    window.addEventListener("iyey_or_board_updated", onCustomBoardUpdate);
    window.addEventListener("storage", syncBoard);
    return () => {
      window.removeEventListener("iyey_or_board_updated", onCustomBoardUpdate);
      window.removeEventListener("storage", syncBoard);
    };
  }, []);

  useEffect(() => {
    const unsub = initAuth(
      (u, tok) => {
        setGoogleUser(u);
        setAccessToken(tok);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      },
    );
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 5000);
  };

  // Daily Agenda State
  const [agenda, setAgenda] = useState<AgendaItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("iyey_or_agenda");
        if (raw) return JSON.parse(raw);
      } catch {
        /* ignore */
      }
    }
    return DEFAULT_AGENDA;
  });
  const [newAgendaTime, setNewAgendaTime] = useState("12:30");
  const [newAgendaTitle, setNewAgendaTitle] = useState("");
  const [newAgendaNotes, setNewAgendaNotes] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("iyey_or_agenda", JSON.stringify(agenda));
    } catch {
      /* ignore */
    }
  }, [agenda]);

  // Content Studio State (Universal Multi-Format Upload, Drive, YouTube, 3-Click Presentation, Custom Quiz Creator)
  const [uploadedItemsCount, setUploadedItemsCount] = useState(0);
  const [uploadCategory, setUploadCategory] = useState<BoardCategory>("מדע וחלל");
  const [splitUploadSlides, setSplitUploadSlides] = useState(true);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [recentlyUploadedNames, setRecentlyUploadedNames] = useState<string[]>([]);

  const [ytTitle, setYtTitle] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ytQuestion, setYtQuestion] = useState("");
  const [ytCategory, setYtCategory] = useState<BoardCategory>("מדע וחלל");

  const [nbTitle, setNbTitle] = useState("");
  const [nbSourceText, setNbSourceText] = useState("");
  const [nbCategory, setNbCategory] = useState<BoardCategory>("מדע וחלל");

  // Direct Drive / Docs / Slides / Web URL Import
  const [directLinkTitle, setDirectLinkTitle] = useState("");
  const [directLinkUrl, setDirectLinkUrl] = useState("");
  const [directLinkNotes, setDirectLinkNotes] = useState("");
  const [directLinkCategory, setDirectLinkCategory] = useState<BoardCategory>("מדע וחלל");

  // Custom Playable Game Question Creator State
  const [customQuizGameId, setCustomQuizGameId] = useState("science-lab");
  const [customQuizPrompt, setCustomQuizPrompt] = useState("");
  const [customQuizOpt0, setCustomQuizOpt0] = useState("");
  const [customQuizOpt1, setCustomQuizOpt1] = useState("");
  const [customQuizOpt2, setCustomQuizOpt2] = useState("");
  const [customQuizOpt3, setCustomQuizOpt3] = useState("");
  const [customQuizCorrect, setCustomQuizCorrect] = useState(0);
  const [customQuizExplain, setCustomQuizExplain] = useState("");
  const [customQuestionsMap, setCustomQuestionsMap] = useState<
    Record<string, Question[]>
  >(() => getCustomQuestionsMap());

  // Google Drive & Classroom & Gmail State
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState("");
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [importingDriveId, setImportingDriveId] = useState<string | null>(null);
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [cwTitle, setCwTitle] = useState("");
  const [cwDesc, setCwDesc] = useState("");

  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("עדכון יומי וסדר יום - איי אור");
  const [emailBody, setEmailBody] = useState("");

  // Mandatory Explicit User Confirmation Modal for Mutating Workspace API calls
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Student Roster & Quests State
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState<Grade>("ב");
  const [newStudentRole, setNewStudentRole] = useState<PartyRole>("dps");
  const [missionGameId, setMissionGameId] = useState(GAMES[0].id);
  const [missionStudentId, setMissionStudentId] = useState("all");
  const [missionQuestType, setMissionQuestType] = useState<QuestType>("main");
  const [missionBossName, setMissionBossName] = useState("הָאַרְכִי-בּוֹס מֵתוֹדִיקָה 🐉");
  const [missionBossWeakness, setMissionBossWeakness] = useState(
    "שימוש בנוסחה הנכונה ובדיקת שלבי הפתרון!",
  );
  const [missionNote, setMissionNote] = useState("");

  /* ---------- Handlers ---------- */

  const handleSaveTeacherProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.correct();
    const updated = { ...teacherProfile, registered: true };
    setTeacherProfile(updated);
    localStorage.setItem("iyey_or_teacher_profile", JSON.stringify(updated));
    setEditingTeacher(false);
    showToast("פרופיל המורה נשמר בהצלחה!");
  };

  const handleGoogleLogin = async (): Promise<string | null> => {
    setAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        setTeacherProfile((prev) => ({
          ...prev,
          name: res.user.displayName || prev.name,
          email: res.user.email || prev.email,
        }));
        sfx.win();
        showToast("התחברת בהצלחה ל-Google Drive, Classroom ו-Gmail!");
        // Automatically load Drive files right after sign-in so they appear immediately
        fetchDriveFiles(res.accessToken)
          .then((files) => setDriveFiles(files))
          .catch(() => {});
        return res.accessToken;
      }
      return null;
    } catch (err) {
      console.error(err);
      showToast("ההתחברות לחשבון Google בוטלה או נכשלה.");
      return null;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    setCourses([]);
    showToast("התנתקת מחשבון Google Workspace.");
  };

  /* ---------- Agenda Handlers ---------- */

  const handleAddAgendaItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgendaTitle.trim()) return;
    sfx.pop();
    setAgenda((prev) => [
      ...prev,
      {
        id: `ag-${Date.now()}`,
        time: newAgendaTime,
        title: newAgendaTitle.trim(),
        notes: newAgendaNotes.trim() || "פעילות כיתתית",
        done: false,
      },
    ]);
    setNewAgendaTitle("");
    setNewAgendaNotes("");
  };

  const handlePublishAgendaToBoard = () => {
    sfx.win();
    const summaryLines = agenda
      .map((a) => `${a.time} — ${a.title} (${a.done ? "בוצע ✓" : "בתכנון"})`)
      .join(" · ");
    const newItem: BoardItem = {
      id: `agenda-board-${Date.now()}`,
      type: "note",
      title: "📋 סֵדֶר הַיּוֹם הַכִּיתָּתִי שֶׁלָּנוּ",
      content: summaryLines,
      emoji: "🌅",
      category: "משימות כיתה",
      color: "amber",
      fontSize: "normal",
      pinned: true,
      x: 40,
      y: 40,
      author: teacherProfile.name,
      sourceLabel: "סדר יום",
    };
    pushItemToSmartBoard(newItem);
    showToast("סדר היום הכיתתי פורסם לראש לוח הלמידה!");
  };

  /* ---------- Universal Multi-Format File Upload, Drive, YouTube, Links ---------- */

  const handleUniversalFilesSelected = async (
    fileList: FileList | File[] | null,
  ) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessingFiles(true);
    try {
      const filesArray = Array.from(fileList);
      let allNewItems: BoardItem[] = [];
      let lastSummary = "";
      const names: string[] = [];

      for (const file of filesArray) {
        const res = await processAnyFileToBoardItems(file, {
          category: uploadCategory,
          author: teacherProfile.name,
          splitIntoSlides: splitUploadSlides,
        });
        names.push(file.name);
        lastSummary = res.summaryMessage;
        if (res.items.length > 0) {
          allNewItems = [...allNewItems, ...res.items];
        }
      }

      if (allNewItems.length > 0) {
        pushMultipleItemsToSmartBoard(allNewItems);
      }

      setUploadedItemsCount((c) => c + filesArray.length);
      setRecentlyUploadedNames((prev) => [...names, ...prev].slice(0, 8));
      sfx.win();

      showToast(
        filesArray.length === 1 && lastSummary
          ? lastSummary
          : `הועלו ועובדו ${filesArray.length} קבצים (${allNewItems.length} כרטיסיות חיות) אל הלוח החכם!`,
      );
    } catch (err) {
      console.error(err);
      showToast("אירעה שגיאה בעיבוד הקובץ. נסו שנית.");
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleNotebookFileImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFiles(true);
    try {
      const res = await processAnyFileToBoardItems(file, {
        category: nbCategory,
        author: teacherProfile.name,
        splitIntoSlides: true,
      });
      if (res.items.length > 0) {
        const itemsWithCustomTitle = nbTitle.trim()
          ? res.items.map((it, idx) => ({
              ...it,
              title:
                res.items.length > 1
                  ? `שְׁקוּפִית ${idx + 1}: ${nbTitle.trim()}`
                  : `✨ ${nbTitle.trim()} (${file.name})`,
            }))
          : res.items;
        pushMultipleItemsToSmartBoard(itemsWithCustomTitle);
        sfx.win();
        showToast(
          `הקובץ "${file.name}" פורק אוטומטית ל-${itemsWithCustomTitle.length} שקופיות חיות על הלוח!`,
        );
      }
    } catch (err) {
      console.error(err);
      showToast("לא ניתן לעבד את הקובץ למצגת.");
    } finally {
      setIsProcessingFiles(false);
      e.target.value = "";
    }
  };

  const handleLoadDriveFiles = async (queryOverride?: string) => {
    let token = accessToken;
    if (!token) {
      token = await handleGoogleLogin();
      if (!token) return;
    }
    setLoadingDrive(true);
    try {
      const q =
        queryOverride !== undefined ? queryOverride : driveSearchQuery;
      const files = await fetchDriveFiles(token, q);
      setDriveFiles(files);
      sfx.click();
      showToast(
        files.length > 0
          ? `נטענו ${files.length} קבצים מ-Google Drive!`
          : "החיבור ל-Google Drive פעיל (לא נמצאו קבצים תואמים).",
      );
    } catch (err) {
      console.error(err);
      showToast("לא ניתן לטעון קבצים מ-Google Drive כעת.");
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleImportDriveFileToBoard = async (df: DriveFileItem) => {
    let token = accessToken;
    if (!token) {
      token = await handleGoogleLogin();
      if (!token) return;
    }
    setImportingDriveId(df.id);
    try {
      const processed = await processDriveFileItemToBoardItems(token, df, {
        author: teacherProfile.name,
        category: uploadCategory,
        splitIntoSlides: splitUploadSlides,
      });
      if (processed.items.length > 0) {
        sfx.win();
        pushMultipleItemsToSmartBoard(processed.items);
        setUploadedItemsCount((c) => c + 1);
        setRecentlyUploadedNames((prev) => [df.name, ...prev].slice(0, 8));
        showToast(processed.summaryMessage);
      }
    } catch (err) {
      console.error(err);
      showToast("שגיאה בייבוא הקובץ מ-Google Drive.");
    } finally {
      setImportingDriveId(null);
    }
  };

  const handleAddDirectExternalLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directLinkUrl.trim()) return;
    const item = await createBoardItemFromExternalLinkAsync({
      title: directLinkTitle.trim() || undefined,
      url: directLinkUrl.trim(),
      questionOrNotes: directLinkNotes.trim(),
      category: directLinkCategory,
      author: teacherProfile.name,
    });
    if (!item) {
      showToast("נא להזין כתובת קישור תקינה.");
      return;
    }
    sfx.win();
    pushItemToSmartBoard(item);
    setDirectLinkTitle("");
    setDirectLinkUrl("");
    setDirectLinkNotes("");
    showToast("הקישור / המסמך חובר והוטמע בכרטיסייה חיה על הלוח החכם!");
  };

  const handleAddCustomQuizQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuizPrompt.trim() || !customQuizOpt0.trim() || !customQuizOpt1.trim()) {
      showToast("נא למלא את השאלה ולפחות 2 אפשרויות תשובה.");
      return;
    }
    const opts = [
      customQuizOpt0.trim(),
      customQuizOpt1.trim(),
      customQuizOpt2.trim(),
      customQuizOpt3.trim(),
    ].filter(Boolean);
    const safeAnswerIdx = Math.min(customQuizCorrect, opts.length - 1);
    const hintText =
      customQuizExplain.trim() ||
      `התשובה הנכונה היא: ${opts[safeAnswerIdx]}`;
    const newQ: Question = {
      prompt: customQuizPrompt.trim(),
      options: opts,
      answer: safeAnswerIdx,
      display: { kind: "emoji", value: "🌟" },
      speak: customQuizPrompt.trim(),
      hint: hintText,
    };
    const updatedList = addCustomQuestionsForGame(customQuizGameId, [newQ]);
    setCustomQuestionsMap((prev) => ({
      ...prev,
      [customQuizGameId]: updatedList,
    }));

    // Also push as a flashcard to the SmartBoard so students can practice it on the board too!
    const gameMeta = GAMES.find((g) => g.id === customQuizGameId);
    pushItemToSmartBoard({
      id: `quiz-card-${Date.now()}`,
      type: "flashcard",
      title: `🎮 חִידָה חֲדָשָׁה (${gameMeta?.title || "מִשְׂחָק"}):`,
      content: `${newQ.prompt}\nאפשרויות: ${opts.map((o, i) => `${i + 1}. ${o}`).join(" | ")}`,
      answer: `${opts[safeAnswerIdx]} — ${hintText}`,
      emoji: gameMeta?.emoji || "🎯",
      category: "משימות כיתה",
      color: "amber",
      fontSize: "normal",
      pinned: true,
      x: 65,
      y: 65,
      author: teacherProfile.name,
      sourceLabel: `חידון ${gameMeta?.title || ""}`,
    });

    sfx.win();
    setCustomQuizPrompt("");
    setCustomQuizOpt0("");
    setCustomQuizOpt1("");
    setCustomQuizOpt2("");
    setCustomQuizOpt3("");
    setCustomQuizExplain("");
    showToast("השאלה נוספה למשחק האי וגם נשלחה ככרטיסיית חידה ללוח החכם!");
  };

  const handleAddYoutubeToBoard = (e: React.FormEvent) => {
    e.preventDefault();
    const embed = extractYoutubeEmbedUrl(ytUrl);
    if (!embed || !ytTitle.trim()) {
      showToast("אנא הזינו כותרת וקישור תקין לסרטון YouTube.");
      return;
    }
    sfx.win();
    const newItem: BoardItem = {
      id: `yt-${Date.now()}`,
      type: ytQuestion.trim() ? "flashcard" : "note",
      title: `🎬 ${ytTitle.trim()}`,
      content: ytQuestion.trim() || "צפו בסרטון הלימודי ודונו בנקודות המרכזיות בכיתה.",
      answer: ytQuestion.trim() ? "דיון כיתתי פתוח בעקבות הסרטון!" : undefined,
      emoji: "▶️",
      category: ytCategory,
      color: "pink",
      fontSize: "normal",
      pinned: true,
      x: 80,
      y: 80,
      author: teacherProfile.name,
      youtubeEmbedUrl: embed,
      sourceLabel: "YouTube לימודי",
    };
    pushItemToSmartBoard(newItem);
    setYtTitle("");
    setYtUrl("");
    setYtQuestion("");
    showToast("סרטון ה-YouTube הוטמע בכרטיסייה חדשה על לוח הלמידה!");
  };

  /* ---------- Google Classroom & Gmail Handlers ---------- */

  const handleLoadClassroomCourses = async () => {
    let token = accessToken;
    if (!token) {
      token = await handleGoogleLogin();
      if (!token) return;
    }
    setLoadingCourses(true);
    try {
      const list = await fetchClassroomCourses(token);
      setCourses(list);
      if (list.length > 0 && !selectedCourseId) {
        setSelectedCourseId(list[0].id);
      }
      showToast(
        list.length > 0
          ? `נטענו ${list.length} קורסים מ-Google Classroom!`
          : "החיבור ל-Classroom פעיל (לא נמצאו קורסים).",
      );
    } catch (err) {
      console.error(err);
      showToast("לא ניתן לטעון קורסים מ-Google Classroom.");
    } finally {
      setLoadingCourses(false);
    }
  };

  const requestPublishCourseWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedCourseId || !cwTitle.trim()) return;
    const courseName =
      courses.find((c) => c.id === selectedCourseId)?.name || selectedCourseId;
    setConfirmModal({
      title: "אישור פרסום מטלה ב-Google Classroom",
      description: `האם ברצונך ליצור ולפרסם את המטלה "${cwTitle.trim()}" בקורס "${courseName}" ב-Google Classroom?`,
      onConfirm: async () => {
        await createClassroomCourseWork(
          accessToken,
          selectedCourseId,
          cwTitle.trim(),
          cwDesc.trim() || "מטלה מתוך לוח הלמידה איי אור",
        );
        sfx.win();
        setCwTitle("");
        setCwDesc("");
        showToast("המטלה פורסמה בהצלחה ב-Google Classroom!");
      },
    });
  };

  const requestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !emailTo.trim() || !emailSubject.trim()) return;
    setConfirmModal({
      title: "אישור שליחת אימייל דרך Gmail",
      description: `האם ברצונך לשלוח אימייל אל "${emailTo.trim()}" בנושא "${emailSubject.trim()}"?`,
      onConfirm: async () => {
        await sendGmailMessage(
          accessToken,
          emailTo.trim(),
          emailSubject.trim(),
          emailBody.trim() || "שלום רב, מצורף עדכון מלוח הלמידה הכיתתי איי אור.",
        );
        sfx.win();
        setEmailTo("");
        showToast("האימייל נשלח בהצלחה דרך Gmail!");
      },
    });
  };

  const fillEmailWithDailyAgenda = () => {
    sfx.click();
    const lines = agenda
      .map((a) => `• ${a.time} - ${a.title}: ${a.notes}`)
      .join("\n");
    setEmailSubject(`סדר היום הכיתתי - ${classState.name}`);
    setEmailBody(
      `שלום לתלמידים ולהורים,\n\nלהלן סדר היום והנושאים שנלמד היום בכיתה (${classState.name}):\n\n${lines}\n\nבברכה,\n${teacherProfile.name}\n${teacherProfile.school}`,
    );
  };

  /* ---------- Student & Mission Handlers ---------- */

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    sfx.pop();
    const st: Student = {
      id: `st-${Date.now()}`,
      name: newStudentName.trim(),
      grade: newStudentGrade,
      avatar: {
        shape: classState.students.length % 5,
        color: classState.students.length % 6,
        accessory: null,
      },
      stars: 10,
      gamesPlayed: 0,
      lastActive: "הַיּוֹם",
      isLocal: true,
      partyRole: newStudentRole,
      level: 1,
    };
    onUpdateClass({
      ...classState,
      students: [...classState.students, st],
    });
    setNewStudentName("");
  };

  const handleAssignMission = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.correct();
    const xpMap: Record<QuestType, number> = {
      daily: 60,
      main: 100,
      side: 80,
      boss: 150,
    };
    const m: Mission = {
      id: `m-${Date.now()}`,
      gameId: missionGameId,
      studentId: missionStudentId,
      assignedAt: Date.now(),
      done: false,
      questType: missionQuestType,
      xpReward: xpMap[missionQuestType],
      bossName:
        missionQuestType === "boss"
          ? missionBossName.trim() || "הָאַרְכִי-בּוֹס מֵתוֹדִיקָה 🐉"
          : undefined,
      bossWeakness:
        missionQuestType === "boss"
          ? missionBossWeakness.trim() || "נְקוּדַת תּוֹרְפָּה: שִׁימּוּשׁ בַּכֵּלִים שֶׁלָּמַדְנוּ בַּשִּׁיעוּר!"
          : undefined,
      note:
        missionNote.trim() ||
        (missionQuestType === "boss"
          ? "קְרַב בּוֹס מְסַכֵּם — יַשְּׂמוּ אֶת הַמְּיוּמָנוּיוֹת שֶׁאָסַפְתֶּם כְּדֵי לְנַצֵּחַ!"
          : "קְווֶסְט תַּרְגּוּל כִּיתָּתִי לַעֲלִיַּית שָׁלָב (Level Up)"),
    };
    onUpdateClass({
      ...classState,
      missions: [m, ...classState.missions],
    });
    setMissionNote("");
    showToast("הקווסט החדש נשלח ללוח הקווסטים של הגילדה!");
  };

  const totalClassStars = classState.students.reduce(
    (acc, s) => acc + s.stars,
    0,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Status Toast Banner with Instant Jump to SmartBoard */}
      {statusToast && (
        <div className="fixed bottom-6 left-6 z-50 glass-strong border-2 border-sky-400 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold text-slate-900 flex flex-wrap items-center gap-3 animate-pop">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusToast}</span>
          {onSwitchToBoard && (
            <button
              type="button"
              onClick={() => {
                sfx.click();
                onSwitchToBoard();
              }}
              className="btn-glow px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>צְפֵה בַּלּוּחַ הַחָכָם ⬅</span>
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
         TOP TEACHER REGISTRATION & GOOGLE WORKSPACE CONNECTION BAR
         ==================================================================== */}
      <section className="glass-strong rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
              👩‍🏫
            </div>
            <div>
              <div className="text-xs font-bold text-sky-600">
                הָאֵזוֹר הַנִּיהוּלִי שֶׁל הַמּוֹרֶה · {teacherProfile.school}
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 nikud">
                {teacherProfile.name} · {classState.name} (כִּיתָּה {teacherProfile.homeroomGrade}׳)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                קוֹד כִּיתָּה: <strong className="text-sky-700 tabular-nums">{classState.code}</strong> · {classState.students.length} תַּלְמִידִים · {totalClassStars} ⭐ כּוֹכְבֵי כִּיתָּה · {liveBoardItems.length} כַּרְטִיסִיּוֹת חַיּוֹת בַּלּוּחַ
              </p>
            </div>
          </div>

          {/* Teacher Registration Edit + Jump to SmartBoard + GitHub Repo Sync + Official Google Workspace Sign-In */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onSwitchToBoard && (
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  onSwitchToBoard();
                }}
                className="btn-glow px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs"
              >
                <Eye className="w-4 h-4" />
                <span>פְּתַח אֶת הַלּוּחַ הַחָכָם ({liveBoardItems.length})</span>
              </button>
            )}

            <button
              onClick={() => setEditingTeacher((e) => !e)}
              className="btn-glow px-3.5 py-2.5 rounded-xl bg-white/85 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>{editingTeacher ? "סְגוֹר פְּרָטֵי מוֹרֶה" : "רִישּׁוּם / פְּרָטֵי מוֹרֶה"}</span>
            </button>

            {googleUser && accessToken ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>מְחוּבָּר ל-Google ({googleUser.email})</span>
                <button
                  onClick={handleGoogleLogout}
                  className="p-1 rounded hover:bg-emerald-100 text-slate-600"
                  title="התנתק"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="btn-glow px-4 py-2.5 rounded-xl bg-white border border-slate-300 shadow-xs hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>
                  {authLoading
                    ? "מִתְחַבֵּר..."
                    : "Sign in with Google (Drive, Classroom, Gmail)"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Teacher Registration Form Drawer */}
        {editingTeacher && (
          <form
            onSubmit={handleSaveTeacherProfile}
            className="mt-5 pt-5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-pop"
          >
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                שֵׁם הַמּוֹרֶה:
              </label>
              <input
                type="text"
                value={teacherProfile.name}
                onChange={(e) =>
                  setTeacherProfile({ ...teacherProfile, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                שֵׁם בֵּית הַסֵּפֶר:
              </label>
              <input
                type="text"
                value={teacherProfile.school}
                onChange={(e) =>
                  setTeacherProfile({ ...teacherProfile, school: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                שֵׁם הַכִּיתָּה:
              </label>
              <input
                type="text"
                value={classState.name}
                onChange={(e) =>
                  onUpdateClass({ ...classState, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                שִׁכְבַת גִּיל:
              </label>
              <select
                value={teacherProfile.homeroomGrade}
                onChange={(e) =>
                  setTeacherProfile({
                    ...teacherProfile,
                    homeroomGrade: e.target.value as Grade,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    כִּיתָּה {g}׳
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="btn-glow w-full py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
              >
                שְׁמוֹר פְּרָטֵי מוֹרֶה
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ====================================================================
         TEACHER HUB NAVIGATION TABS (4 Productive Areas)
         ==================================================================== */}
      <div className="flex flex-wrap items-center gap-2 glass rounded-2xl p-2">
        <button
          onClick={() => {
            sfx.click();
            setActiveSubTab("schedule");
          }}
          className={`btn-glow px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "schedule"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>1. מַעֲרֶכֶת שָׁעוֹת וְסֵדֶר הַיּוֹם</span>
        </button>

        <button
          onClick={() => {
            sfx.click();
            setActiveSubTab("content");
          }}
          className={`btn-glow px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "content"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>2. הַעֲלָאַת כָּל סוּגֵי הַקְּבָצִים וִיצִירַת תּוֹכֶן חַי</span>
        </button>

        <button
          onClick={() => {
            sfx.click();
            setActiveSubTab("workspace");
          }}
          className={`btn-glow px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "workspace"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>3. קְלָאסְרוּם כִּיתָּתִי וְדִיוּוּר בְּמֵייל</span>
        </button>

        <button
          onClick={() => {
            sfx.click();
            setActiveSubTab("students");
          }}
          className={`btn-glow px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "students"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. תַּלְמִידִים וּמְשִׂימוֹת ({classState.students.length})</span>
        </button>
      </div>

      {/* ====================================================================
         TAB 1: FLEXIBLE WEEKLY TIMETABLE & DAILY AGENDA (מערכת שעות גמישה וסדר היום)
         ==================================================================== */}
      {activeSubTab === "schedule" && (
        <div className="space-y-6">
          {/* Flexible Timetable Component with Island Association */}
          <FlexibleTimetable
            teacherName={teacherProfile.name}
            onNavigateToIsland={onSelectIsland}
            onLaunchGame={onLaunchGame}
            onNotify={showToast}
          />

          {/* Daily Agenda Checklist */}
          <div className="glass-strong rounded-3xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>סֵדֶר הַיּוֹם הַכִּיתָּתִי וּמְשִׂימוֹת שׁוֹטְפוֹת</span>
              </h3>
              <button
                onClick={handlePublishAgendaToBoard}
                className="btn-glow px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>שַׁגֵּר אֶת סֵדֶר הַיּוֹם לַלּוּחַ הַחָכָם</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-2.5">
                {agenda.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      item.done
                        ? "bg-emerald-50/80 border-emerald-300 text-slate-700"
                        : "bg-white/85 border-slate-200/90 text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          sfx.click();
                          setAgenda((prev) =>
                            prev.map((a) =>
                              a.id === item.id ? { ...a, done: !a.done } : a,
                            ),
                          );
                        }}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          item.done
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        {item.done && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-sky-700 tabular-nums">
                            {item.time}
                          </span>
                          <span
                            className={`text-sm font-bold nikud ${
                              item.done ? "line-through text-slate-500" : ""
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 nikud">
                          {item.notes}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setAgenda((prev) =>
                          prev.filter((a) => a.id !== item.id),
                        )
                      }
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Agenda Item Form */}
              <form
                onSubmit={handleAddAgendaItem}
                className="lg:col-span-5 p-4 rounded-2xl bg-white/85 border border-slate-200/90 space-y-3"
              >
                <div className="text-xs font-extrabold text-slate-800">
                  + הוֹסָפַת פְּעִילוּת לְסֵדֶר הַיּוֹם:
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newAgendaTime}
                    onChange={(e) => setNewAgendaTime(e.target.value)}
                    className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 tabular-nums"
                  />
                  <input
                    type="text"
                    placeholder="שֵׁם הַפְּעִילוּת (למשל: מעבדת קריאה)..."
                    value={newAgendaTitle}
                    onChange={(e) => setNewAgendaTitle(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="דְּגָשִׁים אוֹ הֶעָרוֹת לַתַּלְמִידִים..."
                    value={newAgendaNotes}
                    onChange={(e) => setNewAgendaNotes(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                  />
                  <button
                    type="submit"
                    className="btn-glow px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs whitespace-nowrap"
                  >
                    הוֹסֵף
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         TAB 2: CONTENT STUDIO (Universal Multi-Format Upload, Presentation, Drive, YouTube, Quiz Creator)
         ==================================================================== */}
      {activeSubTab === "content" && (
        <div className="space-y-6">
          {/* Live SmartBoard Items Strip so the Teacher immediately sees everything created/uploaded */}
          <div className="glass-strong rounded-3xl p-5 border border-sky-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📺 תְּצוּגָה חַיָּה שֶׁל לוּחַ הַמַּסָּע וְהָאִיסּוּף הַכִּיתָּתִי ({liveBoardItems.length} פְּרִיטִים פְּעִילִים)</span>
                </h3>
                <p className="text-xs text-slate-600">
                  כָּל קוֹבֶץ שֶׁתַּעֲלוּ, מַצֶּגֶת שֶׁתִּיצְרוּ אוֹ סִרְטוֹן שֶׁתַּטְמִיעוּ מוֹפִיעַ כָּאן בִּזְמַן אֱמֶת וּמוּצָג מִיָּד לַתַּלְמִידִים עַל הַלּוּחַ הַחָכָם!
                </p>
              </div>
              {onSwitchToBoard && (
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    onSwitchToBoard();
                  }}
                  className="btn-glow px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>עֲבוֹר לַלּוּחַ הַחָכָם לִצְפִיָּה מְלֵאָה וְהַצָּגָה ⬅</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
              {liveBoardItems.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className="min-w-[230px] max-w-[250px] p-3 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs shrink-0 flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-sky-700 mb-1">
                      <span className="truncate">{item.category}</span>
                      {item.sourceLabel && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-800 truncate">
                          {item.sourceLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 truncate nikud">
                      {item.emoji} {item.title}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 nikud">
                      {item.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>{item.attachmentType ? `📎 ${item.attachmentType}` : item.type === "flashcard" ? "❓ חידה" : "📝 פתק"}</span>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.click();
                        const next = liveBoardItems.filter((x) => x.id !== item.id);
                        localStorage.setItem("iyey_or_board_items_v1", JSON.stringify(next));
                        window.dispatchEvent(
                          new CustomEvent("iyey_or_board_updated", { detail: next }),
                        );
                      }}
                      className="text-rose-500 hover:underline font-bold"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* COLUMN 1: Universal Multi-Format File Upload + 3-Click Presentation Studio + Curated Repo (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* UNIVERSAL MULTI-FORMAT FILE UPLOAD CARD */}
              <div className="glass-strong rounded-3xl p-6 space-y-4 border-2 border-emerald-300/90">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-emerald-600" />
                    <span>הַעֲלָאַת קְבָצִים אוּנִיבֶרְסָלִית — כָּל הַפּוֹרְמָטִים!</span>
                  </h3>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-extrabold">
                    PDF · Word · PPTX · Excel · תמונות · שמע · וידאו
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  הַעֲלוּ אוֹ גִּרְרוּ לְכָאן <strong>כָּל קוֹבֶץ מֵהַמַּחְשֵׁב אוֹ הַטֶּלֶפוֹן</strong>: מַצָּגוֹת PowerPoint (<code dir="ltr">.pptx</code>), מִסְמְכֵי Word (<code dir="ltr">.docx</code>), קִבְצֵי <code dir="ltr">PDF</code>, גִּלְיוֹנוֹת Excel/CSV (<code dir="ltr">.xlsx, .csv</code>), תְּמוּנוֹת (<code dir="ltr">.png, .jpg, .svg, .webp</code>), קִבְצֵי שֵׁמַע (<code dir="ltr">.mp3, .wav, .m4a</code>), סִרְטוֹנֵי וִידֵאוֹ (<code dir="ltr">.mp4, .webm</code>), קִבְצֵי <code dir="ltr">ZIP / JSON / HTML / TXT</code> וְעוֹד!
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/85 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">קָטֵגוֹרְיָה בַּלּוּחַ:</span>
                    <select
                      value={uploadCategory}
                      onChange={(e) =>
                        setUploadCategory(e.target.value as BoardCategory)
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-900"
                    >
                      <option value="מדע וחלל">מדע וחלל</option>
                      <option value="מתמטיקה">מתמטיקה</option>
                      <option value="שפה וקריאה">שפה וקריאה</option>
                      <option value="משימות כיתה">משימות כיתה</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={splitUploadSlides}
                      onChange={(e) => setSplitUploadSlides(e.target.checked)}
                      className="rounded accent-emerald-600 w-4 h-4"
                    />
                    <span>פָּרֵק מַצָּגוֹת וּמִסְמָכִים אֲרוּכִּים לְכַּרְטִיסִיּוֹת שְׁקוּפִיּוֹת</span>
                  </label>
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingUpload(true);
                  }}
                  onDragLeave={() => setIsDraggingUpload(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingUpload(false);
                    handleUniversalFilesSelected(e.dataTransfer.files);
                  }}
                  className={`btn-glow cursor-pointer border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                    isDraggingUpload
                      ? "border-emerald-500 bg-emerald-100/80 scale-[1.01]"
                      : "border-emerald-400 hover:border-emerald-600 bg-emerald-50/60 hover:bg-emerald-50"
                  }`}
                >
                  <Upload className="w-9 h-9 text-emerald-600 mb-2" />
                  <span className="text-sm font-extrabold text-slate-900">
                    {isProcessingFiles
                      ? "⏳ מְעַבֵּד וּמְחַלֵּץ אֶת הַקְּבָצִים לַלּוּחַ הַחָכָם..."
                      : "לִחֲצוּ לִבְחִירַת קְבָצִים מִכָּל פּוֹרְמָט (אוֹ גִּרְרוּ קְבָצִים לְכָאן)"}
                  </span>
                  <span className="text-xs text-slate-600 mt-1">
                    תּוֹמֵךְ בְּהַעֲלָאַת מִסְפַּר קְבָצִים בְּמַקְבִּיל — הַקְּבָצִים נִשְׁמָרִים וּמוּצָגִים חַיִּים עַל הַלּוּחַ!
                  </span>
                  <input
                    type="file"
                    accept="*/*"
                    multiple
                    onChange={(e) => {
                      handleUniversalFilesSelected(e.target.files);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>

                {recentlyUploadedNames.length > 0 && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="font-bold text-emerald-950 truncate">
                      ✅ הוּעֲלוּ לָאַחֲרוֹנָה ({uploadedItemsCount}):{" "}
                      {recentlyUploadedNames.join(" , ")}
                    </div>
                    {onSwitchToBoard && (
                      <button
                        type="button"
                        onClick={onSwitchToBoard}
                        className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold shrink-0"
                      >
                        צְפֵה בַּלּוּחַ ⬅
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 3-Click Lesson & Presentation Generator (NotebookLM Studio / Presentation.git Vision) */}
              <div className="glass-strong rounded-3xl p-6 space-y-4 border border-sky-200">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-sky-600" />
                    <span>מְחוֹלֵל מַצֶּגֶת וְשִׁיעוּר בְּ-3 לְחִיצוֹת (NotebookLM Studio)</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-800 text-[11px] font-bold">
                    Presentation Studio
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  הַדְבִּיקוּ סִיכּוּם מִמַּחְבֶּרֶת NotebookLM אוֹ הַעֲלוּ קוֹבֶץ מַצֶּגֶת / מִסְמָךְ — הַמַּעֲרֶכֶת תְּפָרֵק אוֹתָם אוֹטוֹמָטִית לְסִדְרַת כַּרְטִיסִיּוֹת שְׁקוּפִיּוֹת חַיּוֹת עַל הַלּוּחַ הַחָכָם!
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!nbTitle.trim() || !nbSourceText.trim()) return;
                    sfx.win();
                    const paragraphs = nbSourceText
                      .split(/\n+/)
                      .map((p) => p.trim())
                      .filter(Boolean);
                    const slides =
                      paragraphs.length > 0
                        ? paragraphs.slice(0, 10)
                        : [nbSourceText.trim()];
                    const createdSlides: BoardItem[] = slides.map(
                      (slideText, idx) => ({
                        id: `nb-${Date.now()}-${idx}`,
                        type: "flashcard",
                        title:
                          slides.length > 1
                            ? `שְׁקוּפִית ${idx + 1}: ${nbTitle.trim()}`
                            : `✨ ${nbTitle.trim()}`,
                        content: slideText,
                        answer: `נקודה מרכזית מתוך המצגת "${nbTitle.trim()}"`,
                        emoji: "🎓",
                        category: nbCategory,
                        color: "cyan",
                        fontSize: "normal",
                        pinned: true,
                        x: 55 + idx * 10,
                        y: 55 + idx * 10,
                        author: teacherProfile.name,
                        sourceLabel: "NotebookLM / Presentation",
                      }),
                    );
                    pushMultipleItemsToSmartBoard(createdSlides);
                    setNbTitle("");
                    setNbSourceText("");
                    showToast(
                      `נוצרו ${slides.length} שקופיות מצגת חדשות ושוגרו ללוח הלמידה!`,
                    );
                  }}
                  className="space-y-2.5"
                >
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      required
                      value={nbTitle}
                      onChange={(e) => setNbTitle(e.target.value)}
                      placeholder="1. נוֹשֵׂא הַמַצֶּגֶת / הַשִּׁיעוּר (למשל: מחזור המים / ימי הבריאה)..."
                      className="flex-1 min-w-[180px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                    <select
                      value={nbCategory}
                      onChange={(e) =>
                        setNbCategory(e.target.value as BoardCategory)
                      }
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <option value="מדע וחלל">מדע וחלל</option>
                      <option value="מתמטיקה">מתמטיקה</option>
                      <option value="שפה וקריאה">שפה וקריאה</option>
                      <option value="משימות כיתה">משימות כיתה</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={nbSourceText}
                    onChange={(e) => setNbSourceText(e.target.value)}
                    placeholder="2. הַדְבִּיקוּ כָּאן פִּסְקָאוֹת מִתּוֹךְ NotebookLM (כָּל שׁוּרָה תֵּיהָפֵךְ לִשְׁקוּפִית כַּרְטִיסִיָּה עַל הַלּוּחַ)..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="btn-glow flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>3. צוֹר מַצֶּגֶת חַיָּה מֵהַטֶּקְסְט</span>
                    </button>

                    <label className="btn-glow cursor-pointer py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-bold text-xs flex items-center justify-center gap-1.5">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>אוֹ הַעֲלֵה קוֹבֶץ מַצֶּגֶת (.pptx / .docx / .txt)</span>
                      <input
                        type="file"
                        accept="*/*"
                        onChange={handleNotebookFileImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </form>
              </div>

              {/* Curated Pedagogical Repository */}
              <div className="glass-strong rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                  <span>מַאֲגַר עֶרְכּוֹת שִׁיעוּר מוּכָנוֹת</span>
                </h3>
                <p className="text-xs text-slate-600">
                  בִּחֲרוּ עֶרְכַּת תּוֹכֶן מוּכָנָה מֵהַמַּאֲגָר הַפֵּדָגוֹגִי כְּדֵי לְשַׁגֵּר אוֹתָהּ יְשִׁירוֹת לְלוּחַ הַלְּמִידָה הַכִּיתָּתִי:
                </p>

                <div className="space-y-2.5">
                  {CURATED_REPOSITORY_PACKS.map((pack) => (
                    <div
                      key={pack.id}
                      className="p-3.5 rounded-2xl bg-white/85 border border-slate-200/90 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{pack.emoji}</span>
                        <div>
                          <div className="text-sm font-bold text-slate-900 nikud">
                            {pack.title}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 nikud">
                            {pack.content}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          sfx.correct();
                          pushItemToSmartBoard({
                            id: `${pack.id}-${Date.now()}`,
                            type: "flashcard",
                            title: pack.title,
                            content: pack.content,
                            answer: pack.answer,
                            emoji: pack.emoji,
                            category: pack.category,
                            color: "violet",
                            fontSize: "normal",
                            pinned: true,
                            x: 60,
                            y: 60,
                            author: teacherProfile.name,
                            sourceLabel: "מאגר פדגוגי",
                          });
                          showToast(`"${pack.title}" נוסף ללוח הלמידה!`);
                        }}
                        className="btn-glow px-3.5 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs shrink-0 whitespace-nowrap"
                      >
                        + יַבֵּא לַלּוּחַ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 2: Google Drive Live Importer + Direct Link/Docs Embedder + YouTube + Playable Quiz Creator (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Google Drive Picker / Browser + Direct Google Docs/Slides/Drive URL */}
              <div className="glass-strong rounded-3xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-sky-600" />
                    <span>יְבוּא תְּכָנִים חַיִּים מ-Google Drive</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleLoadDriveFiles()}
                    disabled={loadingDrive}
                    className="btn-glow px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs whitespace-nowrap"
                  >
                    {loadingDrive
                      ? "טוֹעֵן קְבָצִים..."
                      : accessToken
                        ? "טְעַן / רַעֲנֵן מֵהַדְּרַייב"
                        : "הִתְחַבֵּר וּטְעַן מ-Drive"}
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  טַעֲנוּ מִסְמָכִים (Google Docs), מַצָּגוֹת (Slides), גִּלְיוֹנוֹת (Sheets) וְקִבְצֵי PDF מֵה-Drive שֶׁלָּכֶם — הַתּוֹכֶן יְחוּלַּץ וְהַמִּסְמָךְ יוּטְמַע כְּחַלּוֹן חַי עַל הַלּוּחַ!
                </p>

                {accessToken && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={driveSearchQuery}
                      onChange={(e) => setDriveSearchQuery(e.target.value)}
                      placeholder="חַפְּשׂוּ קוֹבֶץ לְפִי שֵׁם בְּ-Google Drive..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleLoadDriveFiles(driveSearchQuery)}
                      className="btn-glow px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>חַפֵּשׂ</span>
                    </button>
                  </div>
                )}

                {driveFiles.length > 0 ? (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {driveFiles.map((df) => (
                      <div
                        key={df.id}
                        className="p-3 rounded-2xl bg-white/85 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate">
                            {df.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {df.mimeType}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {df.webViewLink && (
                            <a
                              href={df.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900"
                              title="פתח ב-Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={importingDriveId === df.id}
                            onClick={() => handleImportDriveFileToBoard(df)}
                            className="btn-glow px-3 py-1.5 rounded-xl bg-sky-600 disabled:opacity-50 text-white font-bold"
                          >
                            {importingDriveId === df.id
                              ? "מְיַבֵּא..."
                              : "+ יַבֵּא תּוֹכֶן חַי לַלּוּחַ"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-white/65 border border-slate-200/80 text-xs text-slate-500 text-center">
                    לִחֲצוּ עַל &quot;טְעַן מ-Drive&quot; לְהַצָּגַת הַקְּבָצִים שֶׁלָּכֶם אוֹ הַדְבִּיקוּ קִישּׁוּר יָשִׁיר לְמַטָּה:
                  </div>
                )}

                {/* Direct Google Drive / Docs / Slides / Sheets / Web Link Embedder */}
                <form
                  onSubmit={handleAddDirectExternalLink}
                  className="pt-3 border-t border-slate-200/80 space-y-2.5"
                >
                  <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-sky-600" />
                    <span>הַטְמָעָה מְהִירָה מִקִּישּׁוּר יָשִׁיר (Google Docs, Slides, Sheets, Drive, PDF אוֹ אֲתַר):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="כּוֹתֶרֶת הַפְּרִיט..."
                      value={directLinkTitle}
                      onChange={(e) => setDirectLinkTitle(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      required
                      dir="ltr"
                      placeholder="https://docs.google.com/... או drive.google.com/... או כל קישור"
                      value={directLinkUrl}
                      onChange={(e) => setDirectLinkUrl(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="הֶעָרוֹת אוֹ הַנְחָיָה לַתַּלְמִידִים (אופציונלי)..."
                      value={directLinkNotes}
                      onChange={(e) => setDirectLinkNotes(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                    <select
                      value={directLinkCategory}
                      onChange={(e) =>
                        setDirectLinkCategory(e.target.value as BoardCategory)
                      }
                      className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <option value="מדע וחלל">מדע וחלל</option>
                      <option value="מתמטיקה">מתמטיקה</option>
                      <option value="שפה וקריאה">שפה וקריאה</option>
                      <option value="משימות כיתה">משימות כיתה</option>
                    </select>
                    <button
                      type="submit"
                      className="btn-glow px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs whitespace-nowrap"
                    >
                      + הַטְמַע קִישּׁוּר
                    </button>
                  </div>
                </form>
              </div>

              {/* YouTube Educational Video Connector */}
              <div className="glass-strong rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-rose-600" />
                  <span>חִיבּוּר ל-YouTube לִימּוּדִי</span>
                </h3>
                <p className="text-xs text-slate-600">
                  הַדְבִּיקוּ קִישּׁוּר לְסִרְטוֹן YouTube (כּוֹלֵל Shorts) אוֹ בִּחֲרוּ סִרְטוֹן מוּכָן — הַסִּרְטוֹן יוּטְמַע כְּנַגָּן חַי בְּתוֹךְ כַּרְטִיסִיָּה עַל לוּחַ הַלְּמִידָה!
                </p>

                <form onSubmit={handleAddYoutubeToBoard} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="כּוֹתֶרֶת הַסִּרְטוֹן לַתַּלְמִידִים..."
                      value={ytTitle}
                      onChange={(e) => setYtTitle(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="קישור YouTube (למשל https://youtu.be/...)"
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      dir="ltr"
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="שְׁאֵלָה מַנְחָה לַצְּפִיָּה (אופציונלי)..."
                      value={ytQuestion}
                      onChange={(e) => setYtQuestion(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                    <select
                      value={ytCategory}
                      onChange={(e) =>
                        setYtCategory(e.target.value as BoardCategory)
                      }
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <option value="מדע וחלל">מדע וחלל</option>
                      <option value="מתמטיקה">מתמטיקה</option>
                      <option value="שפה וקריאה">שפה וקריאה</option>
                      <option value="משימות כיתה">משימות כיתה</option>
                    </select>
                    <button
                      type="submit"
                      className="btn-glow px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs whitespace-nowrap"
                    >
                      + הַטְמַע בַּלּוּחַ
                    </button>
                  </div>
                </form>

                <div className="pt-2 border-t border-slate-200/70 space-y-2">
                  <div className="text-xs font-bold text-slate-600">
                    אוֹ בִּחֲרוּ סִרְטוֹן לְדוּגְמָה לְשִׁיגּוּר מָהִיר לַלּוּחַ:
                  </div>
                  {CURATED_YOUTUBE_VIDEOS.map((vid) => (
                    <div
                      key={vid.id}
                      className="p-3 rounded-2xl bg-white/85 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 nikud">
                          ▶️ {vid.title}
                        </div>
                        <div className="text-[11px] text-slate-500 nikud">
                          שְׁאֵלַת צְפִיָּה: {vid.question}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          sfx.win();
                          pushItemToSmartBoard({
                            id: `${vid.id}-${Date.now()}`,
                            type: "flashcard",
                            title: vid.title,
                            content: `צפו בסרטון וענו: ${vid.question}`,
                            answer: "כל הכבוד על הצפייה והדיון הכיתתי!",
                            emoji: "🎬",
                            category: vid.category,
                            color: "pink",
                            fontSize: "normal",
                            pinned: true,
                            x: 70,
                            y: 70,
                            author: teacherProfile.name,
                            youtubeEmbedUrl: vid.embedUrl,
                            sourceLabel: "YouTube לימודי",
                          });
                          showToast(`הסרטון "${vid.title}" הוטמע בלוח הלמידה!`);
                        }}
                        className="btn-glow px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold shrink-0"
                      >
                        + שַׁגֵּר לַלּוּחַ
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* REAL PLAYABLE ISLAND QUIZ QUESTION CREATOR */}
              <div className="glass-strong rounded-3xl p-6 space-y-4 border border-amber-300">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-amber-600" />
                    <span>מְחוֹלֵל שְׁאֵלוֹת חַיּוֹת לְמִשְׂחֲקֵי הָאִיִּים</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => onLaunchGame(customQuizGameId)}
                    className="btn-glow px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>שַׂחֵק כָּעֵת בַּמִּשְׂחָק עִם הַשְּׁאֵלוֹת שֶׁלִּי</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  צְרוּ שְׁאֵלָה חֲדָשָׁה עֲבוּר אֶחָד מִמִּשְׂחֲקֵי הָאִיִּים — הַשְּׁאֵלָה מִתְווֹסֶפֶת מִיָּד לְתוֹךְ מָנוֹעַ הַמִּשְׂחָק וְגַם נִשְׁלַחַת כְּכַרְטִיסִיַּת חִידָה לַלּוּחַ הַחָכָם!
                </p>

                <form onSubmit={handleAddCustomQuizQuestion} className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      בִּחֲרוּ מִשְׂחַק אִי לְהוֹסָפַת הַשְּׁאֵלָה:
                    </label>
                    <select
                      value={customQuizGameId}
                      onChange={(e) => setCustomQuizGameId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                    >
                      {GAMES.filter((g) =>
                        [
                          "letters-quiz",
                          "syllable-builder",
                          "numbers-quiz",
                          "words-quiz",
                          "rhyme-time",
                          "science-lab",
                          "animal-homes",
                        ].includes(g.id),
                      ).map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.emoji} {g.title} ({g.skills})
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    required
                    value={customQuizPrompt}
                    onChange={(e) => setCustomQuizPrompt(e.target.value)}
                    placeholder="נוֹסַח הַשְּׁאֵלָה לַתַּלְמִידִים..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={customQuizOpt0}
                      onChange={(e) => setCustomQuizOpt0(e.target.value)}
                      placeholder="אפשרות 1 (חובה)"
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      required
                      value={customQuizOpt1}
                      onChange={(e) => setCustomQuizOpt1(e.target.value)}
                      placeholder="אפשרות 2 (חובה)"
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      value={customQuizOpt2}
                      onChange={(e) => setCustomQuizOpt2(e.target.value)}
                      placeholder="אפשרות 3 (אופציונלי)"
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      value={customQuizOpt3}
                      onChange={(e) => setCustomQuizOpt3(e.target.value)}
                      placeholder="אפשרות 4 (אופציונלי)"
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={customQuizCorrect}
                      onChange={(e) => setCustomQuizCorrect(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-950"
                    >
                      <option value={0}>תשובה נכונה: אפשרות 1</option>
                      <option value={1}>תשובה נכונה: אפשרות 2</option>
                      <option value={2}>תשובה נכונה: אפשרות 3</option>
                      <option value={3}>תשובה נכונה: אפשרות 4</option>
                    </select>
                    <input
                      type="text"
                      value={customQuizExplain}
                      onChange={(e) => setCustomQuizExplain(e.target.value)}
                      placeholder="הסבר קצר לתשובה הנכונה..."
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-glow w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs"
                  >
                    + הוֹסֵף שְׁאֵלָה חַיָּה לַמִּשְׂחָק וְלַלּוּחַ הַחָכָם
                  </button>
                </form>

                {(customQuestionsMap[customQuizGameId] || []).length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <div className="text-xs font-bold text-slate-700">
                      שְׁאֵלוֹת מוּתְאָמוֹת שֶׁנּוֹסְפוּ לַמִּשְׂחָק הַזֶּה ({(customQuestionsMap[customQuizGameId] || []).length}):
                    </div>
                    {(customQuestionsMap[customQuizGameId] || []).map((q, qIdx) => (
                      <div
                        key={`${q.prompt}-${qIdx}`}
                        className="p-2.5 rounded-xl bg-white/85 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-bold text-slate-800 truncate">
                          {q.prompt} (תשובה: {q.options[q.answer]})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = deleteCustomQuestionForGame(
                              customQuizGameId,
                              qIdx,
                            );
                            setCustomQuestionsMap((prev) => ({
                              ...prev,
                              [customQuizGameId]: next,
                            }));
                          }}
                          className="text-rose-500 hover:text-rose-700 font-bold shrink-0"
                        >
                          מחק
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* FULL-WIDTH ROW: 3D PDF Model & Quest Studio */}
            <div className="lg:col-span-12">
              <Pdf3DModelStudio authorName={teacherProfile.name} />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         TAB 3: GOOGLE CLASSROOM & GMAIL COMMUNICATION
         ==================================================================== */}
      {activeSubTab === "workspace" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Google Classroom Course & Assignment Sync (6 cols) */}
          <div className="lg:col-span-6 glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>סִנְכְּרוּן Google Classroom כִּיתָּתִי</span>
              </h3>
              <button
                onClick={handleLoadClassroomCourses}
                disabled={loadingCourses}
                className="btn-glow px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs whitespace-nowrap"
              >
                {loadingCourses
                  ? "טוֹעֵן קוּרְסִים..."
                  : accessToken
                    ? "טְעַן קוּרְסִים מ-Classroom"
                    : "הִתְחַבֵּר ל-Classroom"}
              </button>
            </div>
            <p className="text-xs text-slate-600">
              צְפוּ בַּקּוּרְסִים הַכִּיתָּתִיִּים שֶׁלָּכֶם ב-Google Classroom וּפַרְסְמוּ מַטָּלָה חֲדָשָׁה יְשִׁירוֹת לַתַּלְמִידִים.
            </p>

            {courses.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  בִּחֲרוּ קוּרְס פָּעִיל ב-Classroom:
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section ? `(${c.section})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form
              onSubmit={requestPublishCourseWork}
              className="p-4 rounded-2xl bg-white/85 border border-slate-200 space-y-3"
            >
              <div className="text-xs font-bold text-slate-800">
                פִּרְסוּם מַטָּלָה חֲדָשָׁה ל-Google Classroom:
              </div>
              <input
                type="text"
                required
                placeholder="כּוֹתֶרֶת הַמַּטָּלָה (למשל: תרגול שברים בלוח איי אור)..."
                value={cwTitle}
                onChange={(e) => setCwTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
              <textarea
                rows={3}
                placeholder="הַנְחָיוֹת וּפֵירוּט הַמַּטָּלָה לַתַּלְמִידִים..."
                value={cwDesc}
                onChange={(e) => setCwDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
              <button
                type="submit"
                disabled={!accessToken || !selectedCourseId}
                className="btn-glow w-full py-2.5 rounded-xl bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>פַּרְסֵם מַטָּלָה ב-Classroom</span>
              </button>
            </form>
          </div>

          {/* Gmail Update Sender (6 cols) */}
          <div className="lg:col-span-6 glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-sky-600" />
                <span>שְׁלִיחַת עִדְכּוּן כִּיתָּתִי בְּמֵייל (Gmail)</span>
              </h3>
              <button
                type="button"
                onClick={fillEmailWithDailyAgenda}
                className="btn-glow px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs"
              >
                מַלֵּא אוֹטוֹמָטִית מִסֵּדֶר הַיּוֹם
              </button>
            </div>
            <p className="text-xs text-slate-600">
              שִׁלְחוּ עִדְכּוּן יוֹמִי, סִיכּוּם שִׁיעוּר אוֹ מְשִׂימָה לַהּוֹרִים וְלַתַּלְמִידִים יְשִׁירוֹת דֶּרֶךְ Gmail.
            </p>

            <form onSubmit={requestSendEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  נִמְעָן (כְּתוֹבֶת אִימֵייל):
                </label>
                <input
                  type="email"
                  required
                  placeholder="parent@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  dir="ltr"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  נוֹשֵׂא הַהוֹדָעָה:
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  תּוֹכֶן הָאִימֵייל:
                </label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="כִּתְבוּ אֶת תּוֹכֶן הָעִדְכּוּן אוֹ לִחֲצוּ עַל 'מַלֵּא אוֹטוֹמָטִית מִסֵּדֶר הַיּוֹם'..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <button
                type="submit"
                disabled={!accessToken}
                className="btn-glow w-full py-2.5 rounded-xl bg-sky-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {accessToken
                    ? "שְׁלַח אִימֵייל דֶּרֶךְ Gmail"
                    : "הִתְחַבְּרוּ ל-Google לְמַעְלָה כְּדֵי לִשְׁלוֹחַ מֵייל"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
         TAB 4: STUDENT ROSTER & MISSIONS (תלמידים ומשימות כיתה)
         ==================================================================== */}
      {activeSubTab === "students" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 glass-strong rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <span>רְשִׁימַת תַּלְמִידִים וְהִתְקַדְּמוּת</span>
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <Target className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-600 font-bold">יַעַד יוֹמִי:</span>
                {[3, 5, 8].map((goal) => (
                  <button
                    key={goal}
                    onClick={() => {
                      sfx.click();
                      onUpdateClass({ ...classState, dailyGoal: goal });
                    }}
                    className={`px-2 py-0.5 rounded font-bold tabular-nums border ${
                      classState.dailyGoal === goal
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddStudent} className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="שֵׁם שַׂחְקָן/תַּלְמִיד חָדָשׁ..."
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="flex-1 min-w-[160px] px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
              <select
                value={newStudentGrade}
                onChange={(e) => setNewStudentGrade(e.target.value as Grade)}
                aria-label="בחירת כיתה"
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-bold"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    כִּיתָּה {g}׳
                  </option>
                ))}
              </select>
              <select
                value={newStudentRole}
                onChange={(e) =>
                  setNewStudentRole(e.target.value as PartyRole)
                }
                aria-label="תפקיד בפלאטון"
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-bold"
              >
                <option value="tank">🛡️ טַנְק מוֹבִיל (Tank)</option>
                <option value="healer">💚 הִילֶר תּוֹמֵךְ (Healer)</option>
                <option value="dps">⚔️ אַלּוּף בִּיצּוּעַ (DPS)</option>
              </select>
              <button
                type="submit"
                className="btn-glow px-4 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>הוֹסֵף לַפְּלָאטוֹן</span>
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 px-2">שַׂחְקָן / תַּלְמִיד</th>
                    <th className="py-2.5 px-2">תַּפְקִיד קוֹ-אוֹפּ (Guild)</th>
                    <th className="py-2.5 px-2">רָמָה (Level)</th>
                    <th className="py-2.5 px-2">שָׁלָל כּוֹכָבִים</th>
                    <th className="py-2.5 px-2">פְּעִילוּת</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {classState.students.map((st, idx) => {
                    const role: PartyRole =
                      st.partyRole ||
                      (["tank", "healer", "dps"][idx % 3] as PartyRole);
                    const roleBadge =
                      role === "tank"
                        ? "🛡️ טַנְק מוֹבִיל"
                        : role === "healer"
                          ? "💚 הִילֶר תּוֹמֵךְ"
                          : "⚔️ אַלּוּף בִּיצּוּעַ";
                    const lvl =
                      st.level || Math.max(2, Math.floor(st.stars / 12));
                    return (
                      <tr key={st.id} className="hover:bg-white/60">
                        <td className="py-2.5 px-2 flex items-center gap-2.5">
                          <AvatarSvg config={st.avatar} size={36} />
                          <div>
                            <div className="font-bold text-slate-900 nikud">
                              {st.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              כיתה {st.grade}׳
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-xs font-bold text-sky-800">
                          {roleBadge}
                        </td>
                        <td className="py-2.5 px-2 text-xs font-extrabold text-indigo-700 tabular-nums">
                          Level {lvl}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-amber-600 tabular-nums">
                          {st.stars} ⭐
                        </td>
                        <td className="py-2.5 px-2 text-xs text-slate-500">
                          {st.lastActive}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 glass-strong rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                <span>הַקְצָאַת קְווֶסְטִים וּקְרָבוֹת בּוֹס</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  sfx.win();
                  pushItemToSmartBoard({
                    id: `buff-${Date.now()}`,
                    type: "note",
                    title: "✨ בָּאף כִּיתָּתִי מֵהַמּוֹרֶה (Class Buff)!",
                    content:
                      "חִיזּוּק מְיוּחָד לַפְּלָאטוֹן: כָּל מִי שֶׁמְּסַיֵּיעַ לְחָבֵר אוֹ מְנַסֶּה שׁוּב מֵהַצֶּ'קְפּוֹינְט (Try Again) מְקַבֵּל בּוֹנוּס +25 XP!",
                    emoji: "⚡",
                    category: "משימות כיתה",
                    color: "violet",
                    fontSize: "large",
                    pinned: true,
                    x: 50,
                    y: 50,
                    author: teacherProfile.name,
                    sourceLabel: "בָּאף כִּיתָּתִי (Buff)",
                  });
                  showToast("באף כיתתי שוגר ללוח הלמידה!");
                }}
                className="btn-glow px-3 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs"
              >
                + שַׁגֵּר בָּאף (Buff) לַלּוּחַ
              </button>
            </div>

            <form
              onSubmit={handleAssignMission}
              className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-slate-600 font-semibold mb-1">
                    סוּג הַקְּווֶסְט (Quest Type):
                  </label>
                  <select
                    value={missionQuestType}
                    onChange={(e) =>
                      setMissionQuestType(e.target.value as QuestType)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                  >
                    <option value="daily">⚡ קְווֶסְט יוֹמִי (Daily Quest)</option>
                    <option value="main">🏆 מְשִׂימָה רָאשִׁית (Main Quest)</option>
                    <option value="side">🌟 מְשִׂימַת צַד (Side Quest)</option>
                    <option value="boss">🐉 קְרַב בּוֹס (Boss Fight)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 font-semibold mb-1">
                    עֲבוּר מִי בַּגִּילְדָּה:
                  </label>
                  <select
                    value={missionStudentId}
                    onChange={(e) => setMissionStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                  >
                    <option value="all">כָּל הַפְּלָאטוֹן (Co-op Party)</option>
                    {classState.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (כיתה {s.grade}׳)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-semibold mb-1">
                  בִּחֲרוּ שָׁלָב מֵעֵץ הַמְּיוּמָנוּיוֹת:
                </label>
                <select
                  value={missionGameId}
                  onChange={(e) => setMissionGameId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                >
                  {GAMES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.emoji} {g.title} ({g.skills})
                    </option>
                  ))}
                </select>
              </div>

              {missionQuestType === "boss" && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2 animate-pop">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-0.5">
                      🐉 שֵׁם הַבּוֹס (האנשה משעשעת לאתגר):
                    </label>
                    <input
                      type="text"
                      value={missionBossName}
                      onChange={(e) => setMissionBossName(e.target.value)}
                      placeholder="למשל: הארכי-בוס מתודיקה / דרקון הדקדוק"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-0.5">
                      🎯 נְקוּדַת הַתּוֹרְפָּה שֶׁל הַבּוֹס (הטיפ הפדגוגי לניצחון):
                    </label>
                    <input
                      type="text"
                      value={missionBossWeakness}
                      onChange={(e) => setMissionBossWeakness(e.target.value)}
                      placeholder="למשל: שימוש בחוק החילוף ופירוק לעשרות!"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-600 font-semibold mb-1">
                  תִּדְרוּךְ הַקְּווֶסְט לַשַּׂחְקָנִים:
                </label>
                <input
                  type="text"
                  placeholder="לְמָשָׁל: הַשְׁלִימוּ אֶת הַשָּׁלָב וְקַבְּלוּ +100 XP וְשָׁלָל..."
                  value={missionNote}
                  onChange={(e) => setMissionNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="btn-glow w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
              >
                ⚔️ שַׁגֵּר קְווֶסְט חָדָשׁ לַגִּילְדָּה
              </button>
            </form>

            <div className="space-y-2.5">
              {classState.missions.map((m) => {
                const g = GAMES.find((x) => x.id === m.gameId);
                const st = classState.students.find(
                  (s) => s.id === m.studentId,
                );
                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      m.done
                        ? "bg-emerald-50 border-emerald-300"
                        : m.questType === "boss"
                          ? "bg-rose-50/80 border-rose-300"
                          : "bg-white/80 border-slate-200/80"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 nikud">
                        <span>{m.questType === "boss" ? "🐉" : g?.emoji}</span>
                        <span>
                          {m.bossName ? `${m.bossName} · ` : ""}
                          {g?.title}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 nikud">
                        {m.note} · עֲבוּר: {st ? st.name : "כָּל הַפְּלָאטוֹן"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onLaunchGame(m.gameId)}
                        className="p-2 rounded-xl bg-sky-100 text-sky-700 hover:bg-sky-200"
                        title="הַפְעֵל קְווֶסְט"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          sfx.click();
                          onUpdateClass({
                            ...classState,
                            missions: classState.missions.map((x) =>
                              x.id === m.id ? { ...x, done: !x.done } : x,
                            ),
                          });
                        }}
                        className={`p-2 rounded-xl border ${
                          m.done
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white text-slate-500 border-slate-200"
                        }`}
                        title="סַמֵּן כְּבוּצַע"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          sfx.click();
                          onUpdateClass({
                            ...classState,
                            missions: classState.missions.filter(
                              (x) => x.id !== m.id,
                            ),
                          });
                        }}
                        className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100"
                        title="מְחַק קְווֶסְט"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         MANDATORY EXPLICIT CONFIRMATION MODAL FOR MUTATING WORKSPACE CALLS
         ==================================================================== */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-white animate-pop space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <span>{confirmModal.title}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {confirmModal.description}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                בִּיטּוּל
              </button>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={async () => {
                  setConfirmBusy(true);
                  try {
                    await confirmModal.onConfirm();
                    setConfirmModal(null);
                  } catch (err) {
                    console.error(err);
                    showToast("הפעולה נכשלה. בדקו את ההרשאות ונסו שוב.");
                  } finally {
                    setConfirmBusy(false);
                  }
                }}
                className="btn-glow px-5 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
              >
                {confirmBusy ? "מְבַצֵּעַ..." : "אִישּׁוּר וּבִיצּוּעַ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
