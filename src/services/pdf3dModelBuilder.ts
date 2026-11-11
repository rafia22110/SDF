import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDocFromServer,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import type { BoardCategory } from "../components/SmartBoard";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firestoreDbId =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  "ai-studio-d3815652-beaf-4394-bb75-4bc7994c7893";
export const db = getFirestore(app, firestoreDbId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

/* ============================================================================
   3D PDF MODEL ARCHETYPES & KNOWLEDGE NODES
   ============================================================================ */

export type Pdf3DTheme =
  | "solar-system"
  | "water-cycle"
  | "geometry-crystal"
  | "hebrew-temple"
  | "human-cell"
  | "robot-lab";

export interface Pdf3DKnowledgeNode {
  id: string;
  title: string;
  fact: string;
  question: string;
  options: string[];
  correctIndex: number;
  pageNumber: number;
  colorHex: string;
}

export interface Pdf3DModelData {
  id: string;
  title: string;
  fileName: string;
  theme: Pdf3DTheme;
  category: BoardCategory;
  summary: string;
  nodes: Pdf3DKnowledgeNode[];
  authorName: string;
  createdAtMs: number;
  fileDbId?: string;
}

export const PDF_3D_THEME_META: Record<
  Pdf3DTheme,
  {
    name: string;
    subtitle: string;
    emoji: string;
    category: BoardCategory;
    accentHex: string;
    skyTop: string;
    skyBottom: string;
  }
> = {
  "solar-system": {
    name: "מַעֲרֶכֶת הַשֶּׁמֶשׁ וְחֵקֶר הֶחָלָל 3D",
    subtitle: "שֶׁמֶשׁ זוֹהֶרֶת, כּוֹכְבֵי לֶכֶת בְּמַסְלוּל, טַבְּעוֹת שַׁבְּתַאי וְטֵלֶסְקוֹפּ חָלָל",
    emoji: "🪐",
    category: "מדע וחלל",
    accentHex: "#38bdf8",
    skyTop: "#060b1e",
    skyBottom: "#172554",
  },
  "water-cycle": {
    name: "מַחְזוֹר הַמַּיִם וְהַטֶּבַע הַחַי 3D",
    subtitle: "הָרִים מוּשְׁלָגִים, מַפַּל מַיִם זוֹרֵם, הִתְאַדּוּת מֵהַיָּם וַעֲנָנֵי גֶּשֶׁם",
    emoji: "🌧️",
    category: "מדע וחלל",
    accentHex: "#10b981",
    skyTop: "#0c4a6e",
    skyBottom: "#0ea5e9",
  },
  "geometry-crystal": {
    name: "מַעְבָּדַת הַנְדָּסָה וְגוּפִים תְּלַת־מֵמַדִּיִּים 3D",
    subtitle: "מִנְסָרָה מְשׁוּשָּׁה, פִּירָמִידָה, תּוֹרוּס, פֵּאוֹנִים מְשׁוּכְלָלִים וּמְדִידַת נֶפַח",
    emoji: "📐",
    category: "מתמטיקה",
    accentHex: "#f59e0b",
    skyTop: "#1e1b4b",
    skyBottom: "#312e81",
  },
  "hebrew-temple": {
    name: "הֵיכַל הָאוֹתִיּוֹת וּמְגִילַּת הָאוֹר 3D",
    subtitle: "עַמּוּדֵי שַׁיִשׁ מְפוּסָּלִים, מְגִילָּה עַתִּיקָה מְרַחֶפֶת וְאַבְנֵי חוֹשֶׁן זוֹהֲרוֹת",
    emoji: "🏛️",
    category: "שפה וקריאה",
    accentHex: "#ec4899",
    skyTop: "#2e1065",
    skyBottom: "#4c1d95",
  },
  "human-cell": {
    name: "מַעְבָּדַת הַבִּיּוֹלוֹגְיָה וְהַתָּא הַחַי 3D",
    subtitle: "סְלִיל DNA כָּפוּל, גַּרְעִין הַתָּא, מִיטוֹכוֹנְדְּרִיָּה וּבוּעוֹת אֵנֶרְגְּיָה",
    emoji: "🧬",
    category: "מדע וחלל",
    accentHex: "#22d3ee",
    skyTop: "#042f2e",
    skyBottom: "#115e59",
  },
  "robot-lab": {
    name: "מַעְבָּדַת הָרוֹבּוֹטִיקָה וְהָאַלְגּוֹרִיתְם 3D",
    subtitle: "רוֹבּוֹט אוֹר מִפְרָקִי, מַעְגָּלִים חַשְׁמַלִּיִּים וְשַׁעֲרֵי לוֹגִיקָה חַיִּים",
    emoji: "🤖",
    category: "משימות כיתה",
    accentHex: "#a78bfa",
    skyTop: "#0f172a",
    skyBottom: "#1e293b",
  },
};

export const LOCAL_PDF_3D_MODELS_KEY = "iyey_or_pdf_3d_models_v1";

export const BUILT_IN_PDF_3D_MODELS: Pdf3DModelData[] = [
  {
    id: "pdf3d-demo-solar",
    title: "מַסָּע בְּמַעֲרֶכֶת הַשֶּׁמֶשׁ — מוֹדֶל PDF חַי 3D",
    fileName: "מערכת-השמש-וחקר-החלל.pdf",
    theme: "solar-system",
    category: "מדע וחלל",
    summary:
      "מוֹדֶל תְּלַת־מֵמַדִּי אִינְטֶרְאַקְטִיבִי שֶׁנּוֹצַר מִמִּסְמַךְ PDF לִימּוּדִי: חִקְרוּ אֶת הַשֶּׁמֶשׁ, מַסְלוּל כַּדּוּר הָאָרֶץ וְהַיָּרֵחַ, כּוֹכַב הַלֶּכֶת הָאָדוֹם מַאֲדִים וְטַבְּעוֹת הַקֶּרַח שֶׁל שַׁבְּתַאי!",
    authorName: "הַמּוֹרָה רותם",
    createdAtMs: Date.now() - 3600_000,
    nodes: [
      {
        id: "node-1",
        title: "עַמּוּד 1: הַשֶּׁמֶשׁ — לֵב הַמַּעֲרֶכֶת",
        fact: "הַשֶּׁמֶשׁ הִיא כּוֹכָב עֲנָק שֶׁל פְּלַזְמָה לוֹהֶטֶת הַמְּהַוֶּה 99.8% מִכָּל הַמָּסָה בְּמַעֲרֶכֶת הַשֶּׁמֶשׁ וּמְסַפֵּק אוֹר וָחוֹם לְכָל כּוֹכְבֵי הַלֶּכֶת.",
        question: "מַהִי הַשֶּׁמֶשׁ בְּמַעֲרֶכֶת הַשֶּׁמֶשׁ שֶׁלָּנוּ?",
        options: [
          "כּוֹכָב לוֹהֵט הַמְּסַפֵּק אוֹר וְאֵנֶרְגְּיָה",
          "כּוֹכַב לֶכֶת קָפוּא מִקֶּרַח",
          "לוויין מְלָאכוּתִי",
          "אַסְטֶרוֹאִיד קָטָן",
        ],
        correctIndex: 0,
        pageNumber: 1,
        colorHex: "#fbbf24",
      },
      {
        id: "node-2",
        title: "עַמּוּד 2: כַּדּוּר הָאָרֶץ וְהַיָּרֵחַ",
        fact: "כַּדּוּר הָאָרֶץ מַקִּיף אֶת הַשֶּׁמֶשׁ בְּ-365 יָמִים, וְסוֹבֵב סְבִיב צִירוֹ בְּ-24 שָׁעוֹת — כָּךְ נוֹצָרִים הַיּוֹם וְהַלַּיְלָה!",
        question: "כַּמָּה זְמַן לוֹקֵחַ לְכַדּוּר הָאָרֶץ לְהַשְׁלִים סִיבּוּב אֶחָד סְבִיב צִירוֹ?",
        options: ["24 שָׁעוֹת (יְמָמָה)", "365 שָׁנִים", "שָׁעָה אַחַת", "חוֹדֶשׁ שָׁלֵם"],
        correctIndex: 0,
        pageNumber: 2,
        colorHex: "#38bdf8",
      },
      {
        id: "node-3",
        title: "עַמּוּד 3: מַאֲדִים — כּוֹכַב הַלֶּכֶת הָאָדוֹם",
        fact: "צִבְעוֹ הָאָדוֹם שֶׁל מַאֲדִים נוֹבֵעַ מִתַּחְמוֹצֶת בַּרְזֶל (חֲלוּדָה) בַּקַּרְקַע שֶׁלּוֹ, וְנִמְצָא בּוֹ הַר הַגַּעַשׁ הַגָּבוֹהַּ בְּיוֹתֵר בְּמַעֲרֶכֶת הַשֶּׁמֶשׁ — אוֹלִימְפּוּס מוֹנְס!",
        question: "מַדּוּעַ מַאֲדִים נִרְאֶה אָדוֹם?",
        options: [
          "בִּגְלַל תַּחְמוֹצֶת בַּרְזֶל בְּאַדְמָתוֹ",
          "בִּגְלַל יַמִּים שֶׁל לָבָה נוֹזְלִית",
          "בִּגְלַל עֵצִים אֲדוּמִּים",
          "בִּגְלַל טַבְּעוֹת זָהָב",
        ],
        correctIndex: 0,
        pageNumber: 3,
        colorHex: "#f43f5e",
      },
      {
        id: "node-4",
        title: "עַמּוּד 4: שַׁבְּתַאי וְטַבְּעוֹת הַקֶּרַח",
        fact: "שַׁבְּתַאי הוּא עֲנַק גַּזִּים הַמּוּקָּף בְּמַעֲרֶכֶת טַבָּעוֹת מַרְהִיבָה הַמּוּרְכֶּבֶת מִמִּילְיַארְדֵי גּוּשֵׁי קֶרַח וָאֲבָק הַמַּקִּיפִים אוֹתוֹ בִּמְהִירוּת.",
        question: "מִמָּה מוּרְכָּבוֹת הַטַּבָּעוֹת שֶׁל שַׁבְּתַאי?",
        options: [
          "מִגּוּשֵׁי קֶרַח, סְלָעִים וָאֲבָק",
          "מִפַּסֵּי פְּלָדָה וּבַרְזֶל",
          "מֵעֲנָנִים שֶׁל מַיִם חַמִּים",
          "מֵאוֹר שֶׁל פָּנָסִים",
        ],
        correctIndex: 0,
        pageNumber: 4,
        colorHex: "#a78bfa",
      },
    ],
  },
  {
    id: "pdf3d-demo-water",
    title: "מַחְזוֹר הַמַּיִם בַּטֶּבַע — סִימוּלַצְיַת PDF חַיָּה 3D",
    fileName: "מחזור-המים-בטבע.pdf",
    theme: "water-cycle",
    category: "מדע וחלל",
    summary:
      "הֲפִיכַת דַּף עֲבוֹדָה בְּ-PDF לְאִי תְּלַת־מֵמַדִּי חַי: עִקְבוּ אַחַר הִתְאַדּוּת הַמַּיִם מֵהַיָּם, הִתְעַבּוּת הָעֲנָנִים בַּפִּסְגָּה, יְרִידַת הַגֶּשֶׁם וּזְרִימַת הַנָּחַל חֲזָרָה לָאוֹקְיָינוֹס!",
    authorName: "הַמּוֹרָה רותם",
    createdAtMs: Date.now() - 7200_000,
    nodes: [
      {
        id: "wc-1",
        title: "עַמּוּד 1: הִתְאַדּוּת (Evaporation)",
        fact: "חוֹם הַשֶּׁמֶשׁ מְחַמֵּם אֶת פְּנֵי הַיָּם וְהוֹפֵךְ מַיִם נוֹזְלִיִּים לְאֵדֵי מַיִם שְׁקוּפִים הָעוֹלִים מַעְלָה אֶל הָאַטְמוֹסְפֵירָה.",
        question: "מָה גּוֹרֵם לַמַּיִם בַּיָּם לְהִתְאַדּוֹת וְלַעֲלוֹת מַעְלָה?",
        options: [
          "חוֹם הַשֶּׁמֶשׁ",
          "רוּחַ קָרָה מֵהַיָּרֵחַ",
          "גַּלִּים גְּבוֹהִים בִּלְבַד",
          "דָּגִים הַשּׂוֹחִים בַּמַּיִם",
        ],
        correctIndex: 0,
        pageNumber: 1,
        colorHex: "#38bdf8",
      },
      {
        id: "wc-2",
        title: "עַמּוּד 2: הִתְעַבּוּת לַעֲנָנִים (Condensation)",
        fact: "כַּאֲשֶׁר אֵדֵי הַמַּיִם עוֹלִים לְגוֹבַהּ רַב שֶׁבּוֹ הָאֲוִיר קַר, הֵם מִתְקָרְרִים וְהוֹפְכִים לְטִיפּוֹת מַיִם זְעִירוֹת הַיּוֹצְרוֹת עֲנָנִים.",
        question: "כֵּיצַד נוֹצָרִים עֲנָנִים בַּשָּׁמַיִם?",
        options: [
          "אֵדֵי הַמַּיִם מִתְקָרְרִים בַּגּוֹבַהּ וּמִתְעַבִּים לְטִיפּוֹת זְעִירוֹת",
          "הֶעָשָׁן מֵהָאֲרוּבּוֹת עוֹלֶה לַשָּׁמַיִם",
          "הָרוּחַ אוֹסֶפֶת שֶׁלֶג מֵהֶהָרִים",
          "הַשֶּׁמֶשׁ מְקָרֶרֶת אֶת הַיָּם",
        ],
        correctIndex: 0,
        pageNumber: 2,
        colorHex: "#f8fafc",
      },
      {
        id: "wc-3",
        title: "עַמּוּד 3: מִשְׁקָעִים — גֶּשֶׁם וְשֶׁלֶג",
        fact: "כְּשֶׁהַטִּיפּוֹת בֶּעָנָן מִתְחַבְּרוֹת וְנַעֲשׂוֹת כְּבֵדוֹת מִדַּי, הֵן יוֹרְדוֹת לַקַּרְקַע כְּגֶשֶׁם, בָּרָד אוֹ שֶׁלֶג עַל פִּסְגּוֹת הֶהָרִים.",
        question: "מָתַי יוֹרֵד גֶּשֶׁם מֵהֶעָנָן?",
        options: [
          "כְּשֶׁטִּיפּוֹת הַמַּיִם בֶּעָנָן מִתְלַכְּדוֹת וְנַעֲשׂוֹת כְּבֵדוֹת",
          "רַק כְּשֶׁיֵּשׁ קֶשֶׁת בֶּעָנָן",
          "כְּשֶׁהֶעָנָן קָרוֹב לַשֶּׁמֶשׁ",
          "בְּכָל פַּעַם שֶׁנּוֹשֶׁבֶת רוּחַ",
        ],
        correctIndex: 0,
        pageNumber: 3,
        colorHex: "#60a5fa",
      },
      {
        id: "wc-4",
        title: "עַמּוּד 4: נֶגֶר עִילִּי וּמֵי תְּהוֹם",
        fact: "מֵי הַגְּשָׁמִים זוֹרְמִים בַּנְּחָלִים וּבַנְּהָרוֹת אוֹ מְחַלְחְלִים לְמֵי הַתְּהוֹם — וְחוֹזְרִים לַיָּם כְּדֵי לְהַתְחִיל אֶת הַמַּחְזוֹר מֵחָדָשׁ!",
        question: "לְאָן זוֹרְמִים מֵי הַנְּחָלִים בְּסוֹף הַמַּסְלוּל?",
        options: [
          "חֲזָרָה אֶל הַיָּם וְהָאוֹקְיָינוֹס וּלְמֵי הַתְּהוֹם",
          "יָשִׁיר אֶל הֶעָנָן בְּלִי הִתְאַדּוּת",
          "נֶעֱלָמִים בֶּחָלָל",
          "הוֹפְכִים לְסֶלַע",
        ],
        correctIndex: 0,
        pageNumber: 4,
        colorHex: "#10b981",
      },
    ],
  },
  {
    id: "pdf3d-demo-geometry",
    title: "מַעְבָּדַת הַנְדָּסַת הַמֶּרְחָב — מוֹדֶל PDF חַי 3D",
    fileName: "הנדסת-המרחב-וגופים-תלת-ממדיים.pdf",
    theme: "geometry-crystal",
    category: "מתמטיקה",
    summary:
      "מִדַּף הַנּוֹסְחָאוֹת בְּ-PDF לְמַעְבָּדָה תְּלַת־מֵמַדִּית חַיָּה: סוֹבְבוּ וּפָרְקוּ גּוּפִים הַנְדָּסִיִּים (מִנְסָרָה, פִּירָמִידָה, גָּלִיל וּפֵּאוֹן מְשׁוּכְלָל) וְגַלּוּ פֵּאוֹת, מִקְצוֹעוֹת וְקָדְקוֹדִים!",
    authorName: "הַמּוֹרָה רותם",
    createdAtMs: Date.now() - 10800_000,
    nodes: [
      {
        id: "geo-1",
        title: "עַמּוּד 1: פֵּאוֹת, מִקְצוֹעוֹת וְקָדְקוֹדִים",
        fact: "בְּתֵיבָה וּבְקוּבִּיָּה יֵשׁ 6 פֵּאוֹת, 12 מִקְצוֹעוֹת (צְלָעוֹת) וְ-8 קָדְקוֹדִים. נוֹסְחַת אוֹיְלֶר קוֹבַעַת: פֵּאוֹת + קָדְקוֹדִים - מִקְצוֹעוֹת = 2!",
        question: "כַּמָּה פֵּאוֹת וְכַמָּה קָדְקוֹדִים יֵשׁ לְקוּבִּיָּה?",
        options: [
          "6 פֵּאוֹת וְ-8 קָדְקוֹדִים",
          "4 פֵּאוֹת וְ-4 קָדְקוֹדִים",
          "8 פֵּאוֹת וְ-12 קָדְקוֹדִים",
          "6 פֵּאוֹת וְ-6 קָדְקוֹדִים",
        ],
        correctIndex: 0,
        pageNumber: 1,
        colorHex: "#fbbf24",
      },
      {
        id: "geo-2",
        title: "עַמּוּד 2: מִנְסָרָה יְשָׁרָה (Prism)",
        fact: "לְמִנְסָרָה יֵשׁ שְׁנֵי בְּסִיסִים חוֹפְפִים וּמַקְבִּילִים, וְהַמַּעֲטֶפֶת שֶׁלָּהּ מוּרְכֶּבֶת מִמַּלְבְּנִים. נֶפַח הַמִּנְסָרָה שָׁוֶה לְשֶׁטַח הַבָּסִיס כָּפוּל הַגּוֹבַהּ!",
        question: "מֵאֵילוּ צוּרוֹת מוּרְכֶּבֶת הַמַּעֲטֶפֶת שֶׁל מִנְסָרָה יְשָׁרָה?",
        options: ["מִמַּלְבְּנִים", "מֵעִיגּוּלִים", "מִמְּשׁוּשִּׁים בִּלְבַד", "מִקַּוִּים עֲקוּמִּים"],
        correctIndex: 0,
        pageNumber: 2,
        colorHex: "#22d3ee",
      },
      {
        id: "geo-3",
        title: "עַמּוּד 3: פִּירָמִידָה וְחָרוּט",
        fact: "בְּפִירָמִידָה כָּל הפֵּאוֹת הַצְּדָדִיּוֹת הֵן מְשׁוּלָּשִׁים הַנִּפְגָּשִׁים בְּקָדְקוֹד רֹאשׁ אֶחָד. נֶפַח פִּירָמִידָה הוּא שְׁלִישׁ (1/3) מִנֶּפַח מִנְסָרָה עִם אוֹתוֹ בָּסִיס וְגוֹבַהּ!",
        question: "אֵילוּ צוּרוֹת מַרְכִּיבוֹת אֶת הַפֵּאוֹת הַצְּדָדִיּוֹת שֶׁל פִּירָמִידָה?",
        options: ["מְשׁוּלָּשִׁים הַנִּפְגָּשִׁים בְּקָדְקוֹד הָרֹאשׁ", "מַלְבְּנִים", "עִיגּוּלִים", "מְעוּיָּנִים"],
        correctIndex: 0,
        pageNumber: 3,
        colorHex: "#f472b6",
      },
      {
        id: "geo-4",
        title: "עַמּוּד 4: גּוּפֵי סִיבּוּב — גָּלִיל וְכַדּוּר",
        fact: "גָּלִיל נוֹצָר מִסִּיבּוּב מַלְבֵּן סְבִיב אַחַת מִצְּלָעָיו, וְכַדּוּר נוֹצָר מִסִּיבּוּב חֲצִי עִיגּוּל בַּמֶּרְחָב!",
        question: "אֵיזֶה גּוּף תְּלַת־מֵמַדִּי מִתְקַבֵּל כְּשֶׁמְּסוֹבְבִים מַלְבֵּן סְבִיב צַלְעוֹ?",
        options: ["גָּלִיל", "קוּבִּיָּה", "מְשׁוּלָּשׁ", "מְשׁוּשֶּׁה"],
        correctIndex: 0,
        pageNumber: 4,
        colorHex: "#34d399",
      },
    ],
  },
];

/* ============================================================================
   REAL PDF BINARY / STREAM TEXT EXTRACTOR & 3D MODEL GENERATOR
   ============================================================================ */

/**
 * Helper to decompress a zlib / deflate PDF stream using browser-native DecompressionStream
 */
async function tryDecompressPdfStream(
  rawStreamBytes: Uint8Array,
): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === "undefined") return null;
  for (const format of ["deflate", "deflate-raw"] as const) {
    try {
      const ds = new DecompressionStream(format);
      const writer = ds.writable.getWriter();
      const inputSlice =
        format === "deflate-raw" && rawStreamBytes.length > 2
          ? rawStreamBytes.subarray(2)
          : rawStreamBytes;
      writer.write(new Uint8Array(inputSlice)).catch(() => {});
      writer.close().catch(() => {});

      const reader = ds.readable.getReader();
      const chunks: Uint8Array[] = [];
      let totalLen = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          totalLen += value.length;
          if (totalLen > 300_000) break;
        }
      }
      if (totalLen > 0) {
        const out = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          out.set(c, offset);
          offset += c.length;
        }
        return out;
      }
    } catch {
      /* try next format */
    }
  }
  return null;
}

function decodePdfTextCandidatesFromBuffer(
  bytes: Uint8Array,
  outSegments: string[],
) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  let win1255 = "";
  try {
    win1255 = new TextDecoder("windows-1255", { fatal: false }).decode(bytes);
  } catch {
    win1255 = utf8;
  }

  for (const source of [utf8, win1255]) {
    // 1. Extract text inside PDF parentheses (...) Tj / TJ
    const parenRegex = /\(([^()]{3,240})\)/g;
    let match: RegExpExecArray | null;
    while (
      (match = parenRegex.exec(source)) !== null &&
      outSegments.length < 40
    ) {
      const candidate = match[1]
        .replace(/\\[nrtbf]/g, " ")
        .replace(/\\([()\\])/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
      if (
        /[\u0590-\u05FF]{2,}/.test(candidate) ||
        (/[a-zA-Z]{4,}/.test(candidate) &&
          !/^(Type|Font|Page|Catalog|Metadata|FlateDecode|Identity|Adobe|ObjStm|XObject|Resources|Subtype|Creator|Producer|Parent|MediaBox|Length|Filter)/i.test(
            candidate,
          ))
      ) {
        if (!outSegments.includes(candidate)) {
          outSegments.push(candidate);
        }
      }
    }

    // 2. Scan for contiguous Hebrew phrases
    const hebrewMatches =
      source.match(
        /[\u0590-\u05FF][\u0590-\u05FF0-9\s,.:;!?״׳()-]{6,220}/g,
      ) || [];
    for (const heb of hebrewMatches) {
      const clean = heb.replace(/\s+/g, " ").trim();
      if (clean.length >= 8 && !outSegments.includes(clean)) {
        outSegments.push(clean);
      }
      if (outSegments.length >= 40) break;
    }
  }

  // 3. Scan for UTF-16BE strings (<FEFF...> or binary \xFE\xFF)
  const latin1 = new TextDecoder("latin1").decode(bytes);
  const hexUtf16Regex = /<FEFF([0-9A-Fa-f\s]{8,400})>/gi;
  let hexMatch: RegExpExecArray | null;
  while (
    (hexMatch = hexUtf16Regex.exec(latin1)) !== null &&
    outSegments.length < 40
  ) {
    const hex = hexMatch[1].replace(/\s+/g, "");
    const chars: string[] = [];
    for (let i = 0; i + 3 < hex.length; i += 4) {
      const code = parseInt(hex.slice(i, i + 4), 16);
      if (
        (code >= 0x0590 && code <= 0x05ff) ||
        (code >= 0x0020 && code <= 0x007e)
      ) {
        chars.push(String.fromCharCode(code));
      }
    }
    const decoded = chars.join("").replace(/\s+/g, " ").trim();
    if (decoded.length >= 4 && !outSegments.includes(decoded)) {
      outSegments.push(decoded);
    }
  }

  for (let i = 0; i < bytes.length - 10; i++) {
    if (bytes[i] === 0xfe && bytes[i + 1] === 0xff) {
      const chars: string[] = [];
      for (let j = i + 2; j < Math.min(i + 240, bytes.length - 1); j += 2) {
        const code = (bytes[j] << 8) | bytes[j + 1];
        if (code === 0 || code === 0x29) break;
        if (
          (code >= 0x0590 && code <= 0x05ff) ||
          (code >= 0x0020 && code <= 0x007e)
        ) {
          chars.push(String.fromCharCode(code));
        } else {
          break;
        }
      }
      const str = chars.join("").replace(/\s+/g, " ").trim();
      if (str.length >= 4 && !outSegments.includes(str)) {
        outSegments.push(str);
      }
    }
  }
}

/**
 * Extracts readable Hebrew & English text segments directly from a PDF File's binary buffer,
 * including decompressing FlateDecode zlib streams via DecompressionStream.
 */
export async function extractReadableTextFromPdf(
  file: File | Blob,
  fallbackName = "document.pdf",
): Promise<string[]> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const latin1 = new TextDecoder("latin1").decode(bytes);
    const extractedSegments: string[] = [];

    // 1. Scan raw uncompressed bytes first
    decodePdfTextCandidatesFromBuffer(bytes, extractedSegments);

    // 2. Locate and decompress up to 18 FlateDecode `stream ... endstream` blocks
    const streamRegex = /stream\r?\n([\s\S]{10,65000}?)\r?\nendstream/g;
    let sMatch: RegExpExecArray | null;
    let streamCount = 0;
    while (
      (sMatch = streamRegex.exec(latin1)) !== null &&
      streamCount < 18 &&
      extractedSegments.length < 36
    ) {
      streamCount++;
      const rawStr = sMatch[1];
      const rawBytes = new Uint8Array(rawStr.length);
      for (let i = 0; i < rawStr.length; i++) {
        rawBytes[i] = rawStr.charCodeAt(i) & 0xff;
      }
      const decompressed = await tryDecompressPdfStream(rawBytes);
      if (decompressed && decompressed.length > 0) {
        decodePdfTextCandidatesFromBuffer(decompressed, extractedSegments);
      }
    }

    // 3. Count approximate /Type /Page occurrences to know page count
    const pageCountMatch = latin1.match(/\/Type\s*\/Page\b/g);
    const approxPages = pageCountMatch ? pageCountMatch.length : 1;
    const displayFileName =
      file instanceof File ? file.name : fallbackName;

    if (extractedSegments.length === 0 && approxPages > 0) {
      extractedSegments.push(
        `מסמך PDF בעל ${approxPages} עמודים (${displayFileName.replace(/\.pdf$/i, "")})`,
      );
    }

    return extractedSegments;
  } catch (err) {
    console.warn("PDF text extraction fallback:", err);
    return [];
  }
}

/**
 * Automatically selects the best 3D theme from the PDF filename, category, and extracted text
 */
export function detectPdf3DTheme(
  fileName: string,
  extractedText: string,
  category?: BoardCategory,
): Pdf3DTheme {
  const combined = `${fileName} ${extractedText}`.toLowerCase();
  if (
    /שמש|חלל|כוכב|ירח|מאדים|שבתאי|אסטרו|גלקס|solar|space|planet/.test(combined)
  ) {
    return "solar-system";
  }
  if (/מים|גשם|ענן|נחל|טבע|אקלים|סביבה|water|rain|nature/.test(combined)) {
    return "water-cycle";
  }
  if (/תא|גוף|ביולוגיה|דנא|dna|לב|מוח|צמח|חי|cell|bio/.test(combined)) {
    return "human-cell";
  }
  if (
    /רובוט|קוד|מחשב|לוגיקה|אלגוריתם|תכנות|בינה|robot|code|tech/.test(combined)
  ) {
    return "robot-lab";
  }
  if (
    /חשבון|מתמטיקה|הנדסה|שבר|כפל|משולש|קובייה|נפח|גופים|math|geometry/.test(
      combined,
    ) ||
    category === "מתמטיקה"
  ) {
    return "geometry-crystal";
  }
  if (
    /שפה|עברית|אותיות|ניקוד|סיפור|מגילה|תנך|בראשית|היסטוריה|קריאה|מילים/.test(
      combined,
    ) ||
    category === "שפה וקריאה"
  ) {
    return "hebrew-temple";
  }
  if (category === "מדע וחלל") return "solar-system";
  if (category === "משימות כיתה") return "robot-lab";
  return "solar-system";
}

/**
 * Builds a complete, interactive `Pdf3DModelData` from an uploaded PDF file (or custom topic),
 * generating 4 rich 3D knowledge stations & quiz questions tailored to the PDF's content.
 */
export async function buildPdf3DModelFromFile(
  file: File,
  options: {
    authorName: string;
    category?: BoardCategory;
    preferredTheme?: Pdf3DTheme;
    customTitle?: string;
    customNotes?: string;
    fileDbId?: string;
  },
): Promise<Pdf3DModelData> {
  const segments = await extractReadableTextFromPdf(file);
  const cleanBaseName = file.name
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const combinedText = [options.customTitle, options.customNotes, ...segments]
    .filter(Boolean)
    .join(" · ");

  const theme: Pdf3DTheme =
    options.preferredTheme ||
    detectPdf3DTheme(file.name, combinedText, options.category);
  const themeMeta = PDF_3D_THEME_META[theme];
  const category: BoardCategory = options.category || themeMeta.category;

  const title =
    options.customTitle?.trim() ||
    `🧊 מוֹדֶל 3D חַי: ${cleanBaseName || themeMeta.name}`;

  const colors = ["#38bdf8", "#fbbf24", "#34d399", "#f472b6", "#a78bfa"];

  // Build 4 interactive 3D knowledge nodes from extracted PDF segments or theme template
  const templateModel =
    BUILT_IN_PDF_3D_MODELS.find((m) => m.theme === theme) ||
    BUILT_IN_PDF_3D_MODELS[0];

  const nodes: Pdf3DKnowledgeNode[] = [0, 1, 2, 3].map((idx) => {
    const seg = segments[idx];
    const fallbackNode =
      templateModel.nodes[idx % templateModel.nodes.length];
    if (seg && seg.length >= 12) {
      return {
        id: `pdf-node-${Date.now()}-${idx}`,
        title: `עַמּוּד ${idx + 1}: ${cleanBaseName.slice(0, 32)} — חֵלֶק ${idx + 1}`,
        fact: seg.slice(0, 240),
        question: `מָה נִלְמַד בְּחֵלֶק ${idx + 1} מִתּוֹךְ הַמִּסְמָךְ "${cleanBaseName}"?`,
        options: [
          seg.slice(0, 75),
          fallbackNode.options[1] || "נושא שאינו מופיע במסמך זה",
          fallbackNode.options[2] || "פרט משני שאינו קשור ליחידת הלימוד",
          fallbackNode.options[3] || "אף אחת מהתשובות אינה נכונה",
        ],
        correctIndex: 0,
        pageNumber: idx + 1,
        colorHex: colors[idx % colors.length],
      };
    }
    return {
      ...fallbackNode,
      id: `pdf-node-${Date.now()}-${idx}`,
      title: `עַמּוּד ${idx + 1} בְּ-"${cleanBaseName.slice(0, 26)}": ${fallbackNode.title.replace(/^עַמּוּד \d+:\s*/, "")}`,
      colorHex: colors[idx % colors.length],
    };
  });

  const summary =
    options.customNotes?.trim() ||
    (segments.length > 0
      ? `חולץ מתוך הקובץ "${file.name}": ${segments.slice(0, 3).join(" · ").slice(0, 360)}`
      : `מודל תלת־ממדי חי ומשחק חקר אינטראקטיבי שנוצרו מתוך מסמך ה-PDF "${file.name}" (${themeMeta.name}).`);

  const modelData: Pdf3DModelData = {
    id: `pdf3d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: title.slice(0, 115),
    fileName: file.name.slice(0, 155),
    theme,
    category,
    summary: summary.slice(0, 750),
    nodes,
    authorName: (options.authorName || "המורה").slice(0, 75),
    createdAtMs: Date.now(),
    fileDbId: options.fileDbId,
  };

  await savePdf3DModel(modelData);
  return modelData;
}

/* ============================================================================
   LOCAL + FIRESTORE PERSISTENCE FOR 3D PDF MODELS
   ============================================================================ */

export function getLocalPdf3DModels(): Pdf3DModelData[] {
  if (typeof window === "undefined") return BUILT_IN_PDF_3D_MODELS;
  try {
    const raw = localStorage.getItem(LOCAL_PDF_3D_MODELS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Pdf3DModelData[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return BUILT_IN_PDF_3D_MODELS;
}

function saveLocalPdf3DModelsList(list: Pdf3DModelData[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_PDF_3D_MODELS_KEY, JSON.stringify(list));
    window.dispatchEvent(
      new CustomEvent("iyey_or_pdf3d_updated", { detail: list }),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Saves a 3D PDF model locally AND persists it to Firestore `/pdf3dModels/{modelId}`
 * when the user is authenticated with a verified Google account.
 */
export async function savePdf3DModel(model: Pdf3DModelData): Promise<void> {
  const current = getLocalPdf3DModels();
  const filtered = current.filter((m) => m.id !== model.id);
  const updated = [model, ...filtered];
  saveLocalPdf3DModelsList(updated);

  const user = auth.currentUser;
  if (user && user.emailVerified) {
    const safeId = model.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
    const path = `pdf3dModels/${safeId}`;
    const serializedNodes = model.nodes
      .slice(0, 8)
      .map((n) => `${n.title} | ${n.fact}`.slice(0, 290));
    if (serializedNodes.length === 0) {
      serializedNodes.push(model.title.slice(0, 200));
    }

    try {
      await setDoc(doc(db, "pdf3dModels", safeId), {
        title: model.title.slice(0, 120),
        fileName: model.fileName.slice(0, 160),
        theme: model.theme,
        category: model.category,
        summary: model.summary.slice(0, 800),
        nodes: serializedNodes,
        ownerId: user.uid,
        authorName: (model.authorName || user.displayName || "מורה").slice(0, 80),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, path);
      } catch {
        /* local save already succeeded; do not block PDF upload */
      }
    }
  }
}

export async function deletePdf3DModel(modelId: string): Promise<void> {
  const current = getLocalPdf3DModels();
  const updated = current.filter((m) => m.id !== modelId);
  saveLocalPdf3DModelsList(
    updated.length > 0 ? updated : BUILT_IN_PDF_3D_MODELS,
  );

  const user = auth.currentUser;
  if (user && user.emailVerified) {
    const safeId = modelId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
    const path = `pdf3dModels/${safeId}`;
    try {
      await deleteDoc(doc(db, "pdf3dModels", safeId));
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, path);
      } catch {
        /* local delete already succeeded */
      }
    }
  }
}

export async function fetchUserCloudPdf3DModels(): Promise<number> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return 0;
  const path = "pdf3dModels";
  try {
    const q = query(
      collection(db, "pdf3dModels"),
      where("ownerId", "==", user.uid),
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
