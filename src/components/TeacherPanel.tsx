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
  GitBranch,
  Download,
  Copy,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  ClassState,
  Grade,
  IslandId,
  Mission,
  PartyRole,
  QuestType,
  Student,
} from "../types";
import { GAMES, GRADES } from "../data/content";
import { sfx } from "../audio";
import { AvatarSvg } from "./AvatarSvg";
import {
  BoardCategory,
  BoardItem,
  pushItemToSmartBoard,
} from "./SmartBoard";
import { FlexibleTimetable } from "./FlexibleTimetable";
import {
  initAuth,
  googleSignIn,
  logout,
  fetchDriveFiles,
  fetchClassroomCourses,
  createClassroomCourseWork,
  sendGmailMessage,
  DriveFileItem,
  ClassroomCourse,
} from "../services/workspaceAuth";

interface TeacherPanelProps {
  classState: ClassState;
  onUpdateClass: (next: ClassState) => void;
  onLaunchGame: (gameId: string) => void;
  onSelectIsland?: (islandId: IslandId) => void;
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
  return null;
}

export function TeacherPanel({
  classState,
  onUpdateClass,
  onLaunchGame,
  onSelectIsland,
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
    setTimeout(() => setStatusToast(null), 3500);
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

  // Content Studio State (Local File, Drive, YouTube, 3-Click Presentation Generator)
  const [uploadedItemsCount, setUploadedItemsCount] = useState(0);
  const [ytTitle, setYtTitle] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ytQuestion, setYtQuestion] = useState("");
  const [ytCategory, setYtCategory] = useState<BoardCategory>("מדע וחלל");

  const [nbTitle, setNbTitle] = useState("");
  const [nbSourceText, setNbSourceText] = useState("");
  const [nbCategory, setNbCategory] = useState<BoardCategory>("מדע וחלל");
  const [showRepoSyncModal, setShowRepoSyncModal] = useState(false);

  // Google Drive & Classroom & Gmail State
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
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

  const handleGoogleLogin = async () => {
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
      }
    } catch (err) {
      console.error(err);
      showToast("ההתחברות לחשבון Google בוטלה או נכשלה.");
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

  /* ---------- Content Upload (Local Files, Drive, YouTube, Repository) ---------- */

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const snippet = text
        ? text.slice(0, 260).replace(/\s+/g, " ").trim()
        : `קובץ לימודי שהועלה: ${file.name}`;
      const newItem: BoardItem = {
        id: `file-${Date.now()}`,
        type: "note",
        title: `📄 ${file.name}`,
        content: snippet || `תוכן מיובא מהקובץ ${file.name}`,
        emoji: "📂",
        category: "שפה וקריאה",
        color: "emerald",
        fontSize: "normal",
        pinned: true,
        x: 60,
        y: 60,
        author: teacherProfile.name,
        sourceLabel: "העלאה מקובץ",
      };
      pushItemToSmartBoard(newItem);
      setUploadedItemsCount((c) => c + 1);
      sfx.win();
      showToast(`הקובץ "${file.name}" עובד ונוסף ללוח הלמידה!`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleLoadDriveFiles = async () => {
    if (!accessToken) {
      await handleGoogleLogin();
      return;
    }
    setLoadingDrive(true);
    try {
      const files = await fetchDriveFiles(accessToken);
      setDriveFiles(files);
      sfx.click();
    } catch (err) {
      console.error(err);
      showToast("לא ניתן לטעון קבצים מ-Google Drive כעת.");
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleImportDriveFileToBoard = (df: DriveFileItem) => {
    sfx.correct();
    const newItem: BoardItem = {
      id: `drive-${df.id}-${Date.now()}`,
      type: "note",
      title: `☁️ ${df.name}`,
      content: `קובץ לימודי מיובא מתוך Google Drive של ${teacherProfile.name}.`,
      emoji: "📁",
      category: "משימות כיתה",
      color: "cyan",
      fontSize: "normal",
      pinned: true,
      x: 70,
      y: 70,
      author: teacherProfile.name,
      externalUrl: df.webViewLink || `https://drive.google.com/file/d/${df.id}/view`,
      sourceLabel: "Google Drive",
    };
    pushItemToSmartBoard(newItem);
    showToast(`"${df.name}" יובא מ-Google Drive אל לוח הלמידה!`);
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
    if (!accessToken) {
      await handleGoogleLogin();
      return;
    }
    setLoadingCourses(true);
    try {
      const list = await fetchClassroomCourses(accessToken);
      setCourses(list);
      if (list.length > 0 && !selectedCourseId) {
        setSelectedCourseId(list[0].id);
      }
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
      {/* Status Toast Banner */}
      {statusToast && (
        <div className="fixed bottom-6 left-6 z-50 glass-strong border border-sky-300 px-5 py-3 rounded-2xl shadow-lg text-sm font-bold text-slate-900 flex items-center gap-2 animate-pop">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusToast}</span>
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
                קוֹד כִּיתָּה: <strong className="text-sky-700 tabular-nums">{classState.code}</strong> · {classState.students.length} תַּלְמִידִים · {totalClassStars} ⭐ כּוֹכְבֵי כִּיתָּה
              </p>
            </div>
          </div>

          {/* Teacher Registration Edit + GitHub Repo Sync + Official Google Workspace Sign-In */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                sfx.click();
                setShowRepoSyncModal(true);
              }}
              className="btn-glow px-3.5 py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-800 hover:bg-sky-100 flex items-center gap-1.5"
              title="סנכרון והתאמת מאגר GitHub (rafia22110/Presentation)"
            >
              <GitBranch className="w-4 h-4 text-sky-600" />
              <span>מַאֲגָר GitHub (Presentation)</span>
            </button>

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
          <span>2. הַעֲלָאַת תְּכָנִים (קובץ, מאגר, Drive, YouTube)</span>
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
         TAB 2: CONTENT STUDIO (File Upload, Repository, Google Drive, YouTube)
         ==================================================================== */}
      {activeSubTab === "content" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Local File Upload + 3-Click Lesson/NotebookLM Studio + Curated Repository (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
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
                הַדְבִּיקוּ סִיכּוּם מִמַּחְבֶּרֶת NotebookLM אוֹ ראשי פרקים לְמַצֶּגֶת — הַמַּעֲרֶכֶת תְּפָרֵק אוֹתָם אוֹטוֹמָטִית לְסִדְרַת כַּרְטִיסִיּוֹת לְמִידָה חַיּוֹת עַל הַלּוּחַ הַחָכָם!
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
                  const slides = paragraphs.length > 0 ? paragraphs.slice(0, 4) : [nbSourceText.trim()];
                  slides.forEach((slideText, idx) => {
                    pushItemToSmartBoard({
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
                    });
                  });
                  setNbTitle("");
                  setNbSourceText("");
                  showToast(
                    `נוצרו ${slides.length} כרטיסיות מצגת חדשות ושוגרו ללוח הלמידה!`,
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
                <button
                  type="submit"
                  className="btn-glow w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>3. צוֹר מַצֶּגֶת חַיָּה וְשַׁגֵּר לְלוּחַ הַלְּמִידָה</span>
                </button>
              </form>
            </div>

            {/* Local File Upload Card */}
            <div className="glass-strong rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span>הַעֲלָאַת תְּכָנִים מִקּוֹבֶץ מְקוֹמִי</span>
                </h3>
                {uploadedItemsCount > 0 && (
                  <span className="text-xs font-bold text-emerald-700">
                    הוּעֲלוּ {uploadedItemsCount} קְבָצִים ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                הַעֲלוּ קוֹבֶץ טֶקְסְט, דַּף עֲבוֹדָה אוֹ רְשִׁימַת מוּשָׂגִים (.txt, .csv, .json, .md) — הַתּוֹכֶן יֵיהָפֵךְ אוֹטוֹמָטִית לְכַרְטִיסִיַּת לִימּוּד עַל הַלּוּחַ!
              </p>

              <label className="btn-glow cursor-pointer border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/60 hover:bg-sky-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all">
                <FileText className="w-8 h-8 text-sky-600 mb-2" />
                <span className="text-sm font-bold text-slate-800">
                  לִחֲצוּ לִבְחִירַת קוֹבֶץ מֵהַמַּחְשֵׁב
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  תּוֹמֵךְ בְּקִבְצֵי טֶקְסְט, מַעֲרְכֵי שִׁיעוּר וּדַפֵּי מוּשָׂגִים
                </span>
                <input
                  type="file"
                  accept=".txt,.csv,.json,.md"
                  onChange={handleLocalFileUpload}
                  className="hidden"
                />
              </label>
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

          {/* 2. Google Drive Import + YouTube Educational Video Studio (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Google Drive Picker / Browser */}
            <div className="glass-strong rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-sky-600" />
                  <span>יְבוּא תְּכָנִים מ-Google Drive</span>
                </h3>
                <button
                  onClick={handleLoadDriveFiles}
                  disabled={loadingDrive}
                  className="btn-glow px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs whitespace-nowrap"
                >
                  {loadingDrive
                    ? "טוֹעֵן קְבָצִים..."
                    : accessToken
                      ? "רַעֲנֵן קְבָצִים מֵהַדְּרַייב"
                      : "הִתְחַבֵּר וּטְעַן מ-Drive"}
                </button>
              </div>
              <p className="text-xs text-slate-600">
                טַעֲנוּ מִסְמָכִים, מַצָּגוֹת וְדַפֵּי עֲבוֹדָה מֵה-Google Drive שֶׁלָּכֶם וְהַצְמִידוּ אוֹתָם כְּכַרְטִיסִיּוֹת עַל לוּחַ הַלְּמִידָה.
              </p>

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
                          onClick={() => handleImportDriveFileToBoard(df)}
                          className="btn-glow px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold"
                        >
                          + הוֹסֵף לַלּוּחַ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/65 border border-slate-200/80 text-xs text-slate-500 text-center">
                  לִחֲצוּ עַל &quot;טְעַן מ-Drive&quot; לְהַצָּגַת הַקְּבָצִים שֶׁלָּכֶם וְיְבוּאָם לַלּוּחַ.
                </div>
              )}
            </div>

            {/* YouTube Educational Video Connector */}
            <div className="glass-strong rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Youtube className="w-5 h-5 text-rose-600" />
                <span>חִיבּוּר ל-YouTube לִימּוּדִי</span>
              </h3>
              <p className="text-xs text-slate-600">
                הַדְבִּיקוּ קִישּׁוּר לְסִרְטוֹן YouTube אוֹ בִּחֲרוּ סִרְטוֹן מוּכָן — הַסִּרְטוֹן יוּטְמַע כְּנַגָּן חַי בְּתוֹךְ כַּרְטִיסִיָּה עַל לוּחַ הַלְּמִידָה!
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

      {/* ====================================================================
         GITHUB REPOSITORY SYNC & EXPORT MODAL (rafia22110/Presentation.git)
         ==================================================================== */}
      {showRepoSyncModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 max-w-2xl w-full border border-white animate-pop space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-lg">
                <GitBranch className="w-5 h-5 text-sky-600 shrink-0" />
                <span>הַתְאָמַת מַאֲגָר GitHub: rafia22110/Presentation</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRepoSyncModal(false)}
                className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                סְגוֹר
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              מִבְנֶה הַפְּרוֹיֶקְט הוּתְאַם לַחֲלוּטִין לַמַּאֲגָר{" "}
              <strong className="text-slate-900" dir="ltr">
                https://github.com/rafia22110/Presentation.git
              </strong>{" "}
              וּמַחְלִיף אֶת הַקְּבָצִים הַיְּשָׁנִים בְּאַרְכִיטֶקְטוּרַת React 19 + TypeScript + Vite נְקִיָּה הַכּוֹלֶלֶת אֶת לוּחַ הַלְּמִידָה, 6 אִיֵּי הָאוֹר, מַעֲרֶכֶת הַשָּׁעוֹת הַגְּמִישָׁה וּמְחוֹלֵל הַמַּצָּגוֹת בְּ-3 לְחִיצוֹת.
            </p>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
              <div className="font-extrabold flex items-center justify-between gap-2">
                <span>⚠️ הֵרַצְתֶּם אֶת הַפְּקוּדָה בַּתִּיקִיָּה הָרָאשִׁית שֶׁל הַמַּחְשֵׁב וְהוּא סוֹרֵק אֶת כָּל הַתִּיקִיּוֹת?</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`rmdir /s /q .git`);
                    showToast("פקודת הביטול (ל-CMD) הועתקה! הדביקו בטרמינל והקישו Enter.");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] shrink-0"
                >
                  הַעְתֵּק פְּקוּדַת בִּיטּוּל לְ-CMD
                </button>
              </div>
              <p className="leading-relaxed text-[11px]">
                אַל דְּאָגָה! שׁוּם קוֹבֶץ לֹא נִמְחַק וְלֹא עָלָה לָרֶשֶׁת. אִם פְּתַחְתֶּם טֶרְמִינָל רָגִיל בַּמַּחְשֵׁב (בְּלִי לְהִיכָּנֵס קוֹדֶם לְתִיקִיַּת הַפְּרוֹיֶקְט), הַפְּקוּדָה <code dir="ltr">git add -A</code> סוֹרֶקֶת אֶת תִּיקִיַּת הַמִּשְׁתַּמֵּשׁ שֶׁלָּכֶם.
                כְּדֵי לַעֲצוֹר וּלְבַטֵּל זֹאת מִיָּד (בְּלִי לִפְגּוֹעַ בְּשׁוּם קוֹבֶץ בַּמַּחְשֵׁב!):
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900 text-amber-200 font-mono text-[11px] space-y-1" dir="ltr">
                <div># 1. If still running, stop it immediately:</div>
                <div className="text-white font-bold">Ctrl + C</div>
                <div># 2. Remove ONLY the Git tracking folder (keeps all your files safe!):</div>
                <div className="text-emerald-300 font-bold">rmdir /s /q .git          # In Windows CMD</div>
                <div className="text-sky-300 font-bold">Remove-Item -Recurse -Force .git   # In PowerShell</div>
                <div className="text-purple-300 font-bold">rm -rf .git               # In Git Bash / Mac</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-sky-100 text-xs font-mono space-y-1.5" dir="ltr">
              <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-700">
                <span>פקודה בטוחה (מוסיפה אך ורק את קבצי הפרויקט מתוך תיקיית הפרויקט):</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `git init -b main\ngit remote add origin https://github.com/rafia22110/Presentation.git || git remote set-url origin https://github.com/rafia22110/Presentation.git\ngit add index.html package.json tsconfig.json vite.config.ts metadata.json README.md src\ngit commit -m "feat: complete rewrite to Iyey Or Interactive Learning Board"\ngit push -u --force origin main`,
                    );
                    showToast("הפקודות הבטוחות הועתקו ללוח!");
                  }}
                  className="px-2.5 py-1 rounded bg-sky-600 text-white font-sans font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>העתק פקודות בטוחות</span>
                </button>
              </div>
              <div className="text-amber-300"># Run ONLY inside the downloaded project folder:</div>
              <div>git init -b main</div>
              <div>git remote set-url origin https://github.com/rafia22110/Presentation.git</div>
              <div className="text-emerald-300">git add index.html package.json tsconfig.json vite.config.ts metadata.json README.md src</div>
              <div>git commit -m &quot;feat: complete rewrite to Iyey Or Interactive Learning Board&quot;</div>
              <div>git push -u --force origin main</div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sfx.correct();
                  const payload = {
                    project: "Iyey Or - Presentation & Interactive Learning World",
                    repository: "https://github.com/rafia22110/Presentation.git",
                    exportedAt: new Date().toISOString(),
                    teacherProfile,
                    classState,
                    agenda,
                    flexibleTimetable: localStorage.getItem("iyey_or_flexible_timetable_v2")
                      ? JSON.parse(localStorage.getItem("iyey_or_flexible_timetable_v2")!)
                      : {},
                    smartBoardItems: localStorage.getItem("iyey_or_board_items_v1")
                      ? JSON.parse(localStorage.getItem("iyey_or_board_items_v1")!)
                      : [],
                  };
                  const blob = new Blob([JSON.stringify(payload, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "presentation-iyey-or-state.json";
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast("קובץ הגיבוי של המערכת והמצגות הורד למחשב!");
                }}
                className="btn-glow px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>יַצֵּא קוֹבֶץ גִּיבּוּי מָלֵא שֶׁל הַמַּעֲרֶכֶת (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRepoSyncModal(false)}
                className="btn-glow px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold"
              >
                סִיַּימְתִּי
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
