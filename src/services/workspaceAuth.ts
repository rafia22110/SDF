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

let isSigningIn = false;
// Keep access token strictly in memory
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void,
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
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

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
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

export async function fetchDriveFiles(
  accessToken: string,
  searchQuery?: string,
): Promise<DriveFileItem[]> {
  const qParts = ["trashed = false"];
  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/'/g, "\\'");
    qParts.push(`name contains '${escaped}'`);
  }
  const qParam = encodeURIComponent(qParts.join(" and "));
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=24&q=${qParam}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,size,modifiedTime)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`שגיאה בטעינת קבצים מ-Google Drive (${res.status})`);
  }
  const data = (await res.json()) as { files?: DriveFileItem[] };
  return data.files || [];
}

export async function extractDriveFileRealContent(
  accessToken: string,
  df: DriveFileItem,
): Promise<{
  extractedText: string;
  embedIframeUrl: string;
  tableData?: string[][];
}> {
  let embedIframeUrl = `https://drive.google.com/file/d/${df.id}/preview`;
  if (df.mimeType === "application/vnd.google-apps.document") {
    embedIframeUrl = `https://docs.google.com/document/d/${df.id}/preview`;
  } else if (df.mimeType === "application/vnd.google-apps.presentation") {
    embedIframeUrl = `https://docs.google.com/presentation/d/${df.id}/preview`;
  } else if (df.mimeType === "application/vnd.google-apps.spreadsheet") {
    embedIframeUrl = `https://docs.google.com/spreadsheets/d/${df.id}/preview`;
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
        const text = (await res.text()).replace(/\s+/g, " ").trim();
        if (text) {
          return {
            extractedText: text.slice(0, 500),
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
          .slice(0, 12)
          .map((line) => line.split(",").map((c) => c.replace(/^"|"$/g, "").trim()));
        return {
          extractedText:
            rows.length > 0
              ? `טבלת Google Sheets חיה (${rows.length} שורות): ${rows[0].join(" | ")}`
              : `גיליון נתונים מיובא מ-Google Sheets (${df.name})`,
          embedIframeUrl,
          tableData: rows.length > 0 ? rows : undefined,
        };
      }
    }

    // 3. Plain text / CSV / Markdown / JSON files stored in Drive
    if (
      df.mimeType.startsWith("text/") ||
      df.mimeType === "application/json"
    ) {
      const mediaUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(df.id)}?alt=media`;
      const res = await fetch(mediaUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const text = (await res.text()).replace(/\s+/g, " ").trim();
        if (text) {
          return {
            extractedText: text.slice(0, 500),
            embedIframeUrl,
          };
        }
      }
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
    "https://classroom.googleapis.com/v1/courses?pageSize=10",
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
