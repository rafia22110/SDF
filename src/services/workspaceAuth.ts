import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

export const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students",
  "https://www.googleapis.com/auth/gmail.send",
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: "select_account",
});

let isSigningIn = false;
// Keep access token strictly in memory per workspace-integration skill
let cachedAccessToken: string | null = null;

type AuthListener = (user: User | null, token: string | null) => void;
const authListeners = new Set<AuthListener>();

function notifyAuthListeners(user: User | null, token: string | null) {
  authListeners.forEach((cb) => {
    try {
      cb(user, token);
    } catch {
      /* ignore */
    }
  });
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void,
) => {
  const sub: AuthListener = (u, t) => {
    if (u && t) {
      onAuthSuccess?.(u, t);
    } else if (!isSigningIn) {
      onAuthFailure?.();
    }
  };
  authListeners.add(sub);

  const unsubFirebase = onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });

  return () => {
    authListeners.delete(sub);
    unsubFirebase();
  };
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Firebase Auth");
    }
    cachedAccessToken = credential.accessToken;
    notifyAuthListeners(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  notifyAuthListeners(null, null);
};

/* ---------- Google Workspace API Helpers ---------- */

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
}

/**
 * Extracts a Google Drive / Docs / Slides / Sheets / Forms File ID from any share link
 */
export function extractGoogleDriveFileIdFromUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /docs\.google\.com\/(?:document|presentation|spreadsheets|forms|drawings)\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
    /\/drive\/folders\/([a-zA-Z0-9_-]{10,})/,
  ];
  for (const rx of patterns) {
    const m = trimmed.match(rx);
    if (m?.[1]) return m[1];
  }
  return null;
}

export async function fetchDriveFiles(
  accessToken: string,
  searchQuery?: string,
): Promise<DriveFileItem[]> {
  const qParts = [
    "trashed = false",
    "mimeType != 'application/vnd.google-apps.folder'",
  ];
  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    qParts.push(`name contains '${escaped}'`);
  }
  const qParam = encodeURIComponent(qParts.join(" and "));
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&includeItemsFromAllDrives=true&supportsAllDrives=true&q=${qParam}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,size,modifiedTime)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`שגיאה בטעינת קבצים מ-Google Drive (${res.status})`);
  }
  const data = (await res.json()) as { files?: DriveFileItem[] };
  return data.files || [];
}

export async function fetchDriveFileMetadataById(
  accessToken: string,
  fileId: string,
): Promise<DriveFileItem | null> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,mimeType,webViewLink,iconLink,thumbnailLink,size,modifiedTime`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as DriveFileItem;
  } catch {
    return null;
  }
}

/**
 * Downloads a binary file from Google Drive as a real `File` object so it can be
 * parsed by `processAnyFileToBoardItems` (PDF, Word, PowerPoint, Excel, Images, Audio, Video).
 */
export async function downloadDriveBinaryAsFile(
  accessToken: string,
  df: DriveFileItem,
): Promise<File | null> {
  try {
    // Only non-google-apps native binaries can be downloaded with alt=media
    if (df.mimeType.startsWith("application/vnd.google-apps.")) {
      return null;
    }
    const mediaUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(df.id)}?alt=media&supportsAllDrives=true`;
    const res = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], df.name, {
      type: df.mimeType || blob.type || "application/octet-stream",
    });
  } catch (err) {
    console.warn("Drive binary download fallback:", err);
    return null;
  }
}

export async function extractDriveFileRealContent(
  accessToken: string,
  df: DriveFileItem,
): Promise<{
  extractedText: string;
  fullText?: string;
  embedIframeUrl: string;
  tableData?: string[][];
  downloadedFile?: File | null;
}> {
  let embedIframeUrl = `https://drive.google.com/file/d/${df.id}/preview`;
  if (df.mimeType === "application/vnd.google-apps.document") {
    embedIframeUrl = `https://docs.google.com/document/d/${df.id}/preview`;
  } else if (df.mimeType === "application/vnd.google-apps.presentation") {
    embedIframeUrl = `https://docs.google.com/presentation/d/${df.id}/preview`;
  } else if (df.mimeType === "application/vnd.google-apps.spreadsheet") {
    embedIframeUrl = `https://docs.google.com/spreadsheets/d/${df.id}/preview`;
  } else if (df.mimeType === "application/vnd.google-apps.form") {
    embedIframeUrl = `https://docs.google.com/forms/d/${df.id}/viewform?embedded=true`;
  }

  try {
    // 1. Google Docs or Google Slides -> export as plain text
    if (
      df.mimeType === "application/vnd.google-apps.document" ||
      df.mimeType === "application/vnd.google-apps.presentation"
    ) {
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(df.id)}/export?mimeType=text/plain`;
      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const rawText = (await res.text()).replace(/^\uFEFF/, "").trim();
        if (rawText) {
          return {
            extractedText: rawText.replace(/\s+/g, " ").slice(0, 600),
            fullText: rawText.slice(0, 8000),
            embedIframeUrl,
          };
        }
      }
    }

    // 2. Google Sheets -> export as CSV and parse into live table
    if (df.mimeType === "application/vnd.google-apps.spreadsheet") {
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(df.id)}/export?mimeType=text/csv`;
      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const csvText = await res.text();
        const rows = csvText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 25)
          .map((line) =>
            line.split(",").map((c) => c.replace(/^"|"$/g, "").trim()),
          );
        return {
          extractedText:
            rows.length > 0
              ? `טבלת Google Sheets חיה (${rows.length} שורות): ${rows[0].join(" | ")}`
              : `גיליון נתונים מיובא מ-Google Sheets (${df.name})`,
          fullText: csvText.slice(0, 5000),
          embedIframeUrl,
          tableData: rows.length > 0 ? rows : undefined,
        };
      }
    }

    // 3. Non-Google-Apps files stored in Drive (PDF, Word .docx, PowerPoint .pptx, Excel .xlsx, Images, Audio, Video, Text)
    const downloadedFile = await downloadDriveBinaryAsFile(accessToken, df);
    if (downloadedFile) {
      return {
        extractedText: `קובץ "${df.name}" הורד ונקרא ישירות מתוך Google Drive.`,
        embedIframeUrl,
        downloadedFile,
      };
    }
  } catch (err) {
    console.warn("Drive content export fallback:", err);
  }

  return {
    extractedText: `קובץ לימודי חי מ-Google Drive (${df.name}). מוצג בתצוגה מקדימה אינטראקטיבית בכרטיסייה.`,
    embedIframeUrl,
  };
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  alternateLink?: string;
}

export async function fetchClassroomCourses(
  accessToken: string,
): Promise<ClassroomCourse[]> {
  const res = await fetch(
    "https://classroom.googleapis.com/v1/courses?pageSize=15",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok) {
    throw new Error(`שגיאה בטעינת קורסים מ-Google Classroom (${res.status})`);
  }
  const data = (await res.json()) as { courses?: ClassroomCourse[] };
  return data.courses || [];
}

export async function createClassroomCourseWork(
  accessToken: string,
  courseId: string,
  title: string,
  description: string,
): Promise<{ id: string; title: string }> {
  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        workType: "ASSIGNMENT",
        state: "PUBLISHED",
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`שגיאה ביצירת מטלה ב-Google Classroom (${res.status})`);
  }
  return (await res.json()) as { id: string; title: string };
}

export async function sendGmailMessage(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string,
): Promise<void> {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${utf8Subject}`,
    "",
    bodyText,
  ];
  const rawMessage = messageParts.join("\r\n");
  const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encoded }),
    },
  );
  if (!res.ok) {
    throw new Error(`שגיאה בשליחת אימייל דרך Gmail (${res.status})`);
  }
}
