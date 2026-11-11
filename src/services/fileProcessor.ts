import JSZip from "jszip";
import type { BoardCategory, BoardColor, BoardItem } from "../components/SmartBoard";
import {
  buildPdf3DModelFromFile,
  extractReadableTextFromPdf,
  PDF_3D_THEME_META,
} from "./pdf3dModelBuilder";
import {
  extractGoogleDriveFileIdFromUrl,
  fetchDriveFileMetadataById,
  extractDriveFileRealContent,
  getAccessToken,
  DriveFileItem,
} from "./workspaceAuth";

const DB_NAME = "iyey_or_files_db_v1";
const STORE_NAME = "files";

export interface StoredFileRecord {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  blob: Blob;
  createdAt: number;
}

function openFilesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const memoryBlobUrls = new Map<string, string>();
const memoryBlobs = new Map<string, { blob: Blob; name: string; mimeType: string }>();

export async function saveFileToDb(
  id: string,
  file: File | Blob,
  fileName?: string,
): Promise<string> {
  const name = fileName || (file instanceof File ? file.name : "file");
  const mimeType = file.type || guessMimeTypeFromName(name);
  const typedBlob =
    file.type === mimeType ? file : new Blob([file], { type: mimeType });
  const blobUrl = URL.createObjectURL(typedBlob);
  memoryBlobUrls.set(id, blobUrl);
  memoryBlobs.set(id, { blob: typedBlob, name, mimeType });

  try {
    const db = await openFilesDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const rec: StoredFileRecord = {
        id,
        name,
        mimeType,
        size: typedBlob.size,
        blob: typedBlob,
        createdAt: Date.now(),
      };
      store.put(rec);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Fallback to in-memory blob URL:", err);
  }
  return blobUrl;
}

export async function getFileBlobUrl(id: string): Promise<string | null> {
  if (memoryBlobUrls.has(id)) {
    return memoryBlobUrls.get(id)!;
  }
  try {
    const db = await openFilesDb();
    const record = await new Promise<StoredFileRecord | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () =>
          resolve(req.result as StoredFileRecord | undefined);
        req.onerror = () => reject(req.error);
      },
    );
    if (record?.blob) {
      const url = URL.createObjectURL(record.blob);
      memoryBlobUrls.set(id, url);
      memoryBlobs.set(id, {
        blob: record.blob,
        name: record.name,
        mimeType: record.mimeType,
      });
      return url;
    }
  } catch (err) {
    console.warn("Could not read file from IndexedDB:", err);
  }
  return null;
}

export async function downloadStoredFile(
  id: string,
  fallbackName = "file",
): Promise<void> {
  const url = await getFileBlobUrl(id);
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = fallbackName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function guessMimeTypeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    avif: "image/avif",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    flac: "audio/flac",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ppt: "application/vnd.ms-powerpoint",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    json: "application/json",
    html: "text/html",
    htm: "text/html",
    md: "text/markdown",
    txt: "text/plain",
    rtf: "application/rtf",
    xml: "application/xml",
    zip: "application/zip",
    odt: "application/vnd.oasis.opendocument.text",
    odp: "application/vnd.oasis.opendocument.presentation",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
  };
  return map[ext] || "application/octet-stream";
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Smart Hebrew & Multilingual Text Reader:
 * Automatically detects UTF-8, UTF-16LE/BE BOM, and Windows-1255 (Hebrew ANSI)
 * so Hebrew .txt and .csv files from Windows never produce replacement characters!
 */
export async function readSmartHebrewText(file: Blob): Promise<string> {
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes.length >= 2) {
      if (bytes[0] === 0xff && bytes[1] === 0xfe) {
        return new TextDecoder("utf-16le").decode(bytes.subarray(2));
      }
      if (bytes[0] === 0xfe && bytes[1] === 0xff) {
        return new TextDecoder("utf-16be").decode(bytes.subarray(2));
      }
    }
    try {
      const strictUtf8 = new TextDecoder("utf-8", { fatal: true }).decode(
        bytes,
      );
      return strictUtf8.replace(/^\uFEFF/, "");
    } catch {
      try {
        return new TextDecoder("windows-1255").decode(bytes);
      } catch {
        return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      }
    }
  } catch {
    return await file.text();
  }
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

function stripXmlTags(xml: string): string {
  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(xml, "text/html");
      const text = doc.body?.innerText || doc.documentElement?.textContent || "";
      if (text.trim()) {
        return text.replace(/\s+/g, " ").trim();
      }
    } catch {
      /* fallback to regex */
    }
  }
  return decodeXmlEntities(
    xml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/**
 * Extracts readable Hebrew & English text from legacy .doc, .ppt, .xls, or .rtf files
 */
async function extractLegacyOfficeOrRtfText(file: File): Promise<string[]> {
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const segments: string[] = [];

    // 1. Check UTF-16LE runs (used by Microsoft Word .doc and PowerPoint .ppt)
    let currentUtf16: string[] = [];
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      const code = bytes[i] | (bytes[i + 1] << 8);
      if (
        (code >= 0x0590 && code <= 0x05ff) ||
        (code >= 0x0020 && code <= 0x007e) ||
        code === 0x000a ||
        code === 0x000d
      ) {
        currentUtf16.push(
          code === 0x000a || code === 0x000d
            ? "\n"
            : String.fromCharCode(code),
        );
      } else {
        if (currentUtf16.length >= 6) {
          const text = currentUtf16.join("").replace(/\s+/g, " ").trim();
          if (
            /[\u0590-\u05FF]{2,}/.test(text) ||
            /[a-zA-Z]{4,}\s+[a-zA-Z]{3,}/.test(text)
          ) {
            if (
              !/^(Microsoft|Normal|Default|Times New Roman|Arial|Calibri|PowerPoint|Word\.Document|SummaryInformation|Root Entry)/i.test(
                text,
              ) &&
              !segments.includes(text)
            ) {
              segments.push(text);
            }
          }
        }
        currentUtf16 = [];
      }
      if (segments.length >= 30) break;
    }

    // 2. Check RTF or Windows-1255 / UTF-8 text runs
    const rawStr = await readSmartHebrewText(file);
    // Decode RTF hex escapes \'e0..\'fa (Windows-1255 Hebrew in RTF: 0xE0 = א = 0x05D0)
    const rtfDecoded = rawStr.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => {
      const byteVal = parseInt(hex, 16);
      if (byteVal >= 0xe0 && byteVal <= 0xfa) {
        return String.fromCharCode(0x05d0 + (byteVal - 0xe0));
      }
      return " ";
    });

    const hebMatches =
      rtfDecoded.match(
        /[\u0590-\u05FF][\u0590-\u05FF0-9\s,.:;!?״׳()-]{6,260}/g,
      ) || [];
    for (const m of hebMatches) {
      const clean = m.replace(/\s+/g, " ").trim();
      if (clean.length >= 6 && !segments.includes(clean)) {
        segments.push(clean);
      }
      if (segments.length >= 30) break;
    }

    return segments;
  } catch {
    return [];
  }
}

/**
 * Extract real paragraphs from a .docx or .odt file using JSZip
 */
async function extractDocxParagraphs(file: File): Promise<string[]> {
  try {
    const zip = await JSZip.loadAsync(file);
    const docXmlFile = zip.file("word/document.xml") || zip.file("content.xml");
    if (!docXmlFile) return [];
    const xmlText = await docXmlFile.async("string");
    const paragraphs: string[] = [];

    const pMatches =
      xmlText.match(/<(w:p|text:p)\b[^>]*>[\s\S]*?<\/(w:p|text:p)>/g) || [];
    for (const pXml of pMatches) {
      const tMatches =
        pXml.match(/<(w:t|text:span)\b[^>]*>([\s\S]*?)<\/(w:t|text:span)>/g) ||
        [];
      const line = decodeXmlEntities(
        tMatches
          .map((t) => t.replace(/<[^>]+>/g, ""))
          .join("")
          .replace(/\s+/g, " ")
          .trim(),
      );
      if (line) paragraphs.push(line);
    }

    if (paragraphs.length === 0) {
      const fallback = stripXmlTags(xmlText);
      if (fallback) return [fallback];
    }
    return paragraphs;
  } catch (err) {
    console.warn("DOCX parse error:", err);
    return [];
  }
}

/**
 * Extract real slides from a .pptx or .odp presentation file using JSZip
 */
async function extractPptxSlides(
  file: File,
): Promise<Array<{ slideNumber: number; title: string; content: string }>> {
  try {
    const zip = await JSZip.loadAsync(file);
    const slideFiles = Object.keys(zip.files)
      .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
        return numA - numB;
      });

    const slides: Array<{ slideNumber: number; title: string; content: string }> =
      [];
    for (let i = 0; i < slideFiles.length; i++) {
      const path = slideFiles[i];
      const xmlText = await zip.files[path].async("string");
      const pBlocks = xmlText.match(/<a:p\b[^>]*>[\s\S]*?<\/a:p>/g) || [];
      const lines: string[] = [];
      for (const p of pBlocks) {
        const tMatches = p.match(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g) || [];
        const line = decodeXmlEntities(
          tMatches
            .map((t) => t.replace(/<[^>]+>/g, ""))
            .join("")
            .replace(/\s+/g, " ")
            .trim(),
        );
        if (line) lines.push(line);
      }
      if (lines.length > 0) {
        const title = lines[0];
        const content = lines.slice(1).join("\n") || lines[0];
        slides.push({
          slideNumber: i + 1,
          title,
          content,
        });
      }
    }
    return slides;
  } catch (err) {
    console.warn("PPTX parse error:", err);
    return [];
  }
}

/**
 * Extract real rows & columns from an .xlsx Excel file using JSZip
 */
async function extractXlsxTable(file: File): Promise<string[][]> {
  try {
    const zip = await JSZip.loadAsync(file);
    const sharedStrings: string[] = [];
    const sharedFile = zip.file("xl/sharedStrings.xml");
    if (sharedFile) {
      const sharedXml = await sharedFile.async("string");
      const siBlocks = sharedXml.match(/<si\b[^>]*>[\s\S]*?<\/si>/g) || [];
      for (const si of siBlocks) {
        const tMatches = si.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) || [];
        sharedStrings.push(
          decodeXmlEntities(
            tMatches
              .map((t) => t.replace(/<[^>]+>/g, ""))
              .join("")
              .trim(),
          ),
        );
      }
    }

    const sheetPath =
      Object.keys(zip.files)
        .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(p))
        .sort()[0] || "";
    if (!sheetPath) return [];

    const sheetXml = await zip.files[sheetPath].async("string");
    const rowBlocks = sheetXml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g) || [];
    const table: string[][] = [];

    for (const rXml of rowBlocks.slice(0, 30)) {
      const cells = rXml.match(/<c\b[^>]*>[\s\S]*?<\/c>/g) || [];
      const rowValues: string[] = [];
      for (const cXml of cells) {
        const isShared = /t="s"/.test(cXml);
        const vMatch = cXml.match(/<v>([\s\S]*?)<\/v>/);
        const inlineMatch = cXml.match(/<t\b[^>]*>([\s\S]*?)<\/t>/);
        if (inlineMatch) {
          rowValues.push(
            decodeXmlEntities(inlineMatch[1].replace(/<[^>]+>/g, "").trim()),
          );
        } else if (vMatch) {
          const rawVal = vMatch[1].trim();
          if (isShared) {
            const idx = parseInt(rawVal, 10);
            rowValues.push(sharedStrings[idx] ?? rawVal);
          } else {
            rowValues.push(rawVal);
          }
        } else {
          rowValues.push("");
        }
      }
      if (rowValues.some((cell) => cell.trim() !== "")) {
        table.push(rowValues);
      }
    }
    return table;
  } catch (err) {
    console.warn("XLSX parse error:", err);
    return [];
  }
}

/**
 * Parse CSV / TSV text into a 2D table array
 */
export function parseCsvToTable(text: string): string[][] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const delimiter = lines[0].includes("\t")
    ? "\t"
    : lines[0].includes(";") && !lines[0].includes(",")
      ? ";"
      : ",";
  return lines.slice(0, 30).map((line) =>
    line
      .split(delimiter)
      .map((cell) => cell.replace(/^["']|["']$/g, "").trim()),
  );
}

export interface ProcessedFileResult {
  items: BoardItem[];
  summaryMessage: string;
}

/**
 * Universal Multi-Format File Processor:
 * Handles Images, PDFs, Audio, Video, PowerPoint (.pptx/.ppt), Word (.docx/.doc),
 * Excel (.xlsx/.xls/.csv), JSON, HTML, Markdown, Text, RTF, ZIP, and ANY arbitrary file.
 */
export async function processAnyFileToBoardItems(
  file: File,
  options: {
    author: string;
    category?: BoardCategory;
    splitIntoSlides?: boolean;
  },
): Promise<ProcessedFileResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type || guessMimeTypeFromName(file.name);
  const fileDbId = `filedb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const sizeLabel = formatFileSize(file.size);
  const category: BoardCategory = options.category || "שפה וקריאה";
  const colorMap: Record<BoardCategory, BoardColor> = {
    "שפה וקריאה": "cyan",
    "מתמטיקה": "amber",
    "מדע וחלל": "emerald",
    "משימות כיתה": "violet",
  };
  const baseColor = colorMap[category] || "emerald";

  // Always save original file to IndexedDB + memory so user can preview & download it anytime
  await saveFileToDb(fileDbId, file, file.name);

  // 1. IMAGE FILES (.png, .jpg, .jpeg, .gif, .webp, .svg, .bmp, .avif)
  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(ext)
  ) {
    let previewDataUrl = "";
    if (file.size <= 4 * 1024 * 1024) {
      previewDataUrl = await readAsDataUrl(file);
    }
    const item: BoardItem = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "note",
      title: `🖼️ ${file.name}`,
      content: `תמונה לימודית שהועלתה ללוח (${sizeLabel}). לחצו על התמונה להגדלה במסך מלא או להורדה.`,
      emoji: "🖼️",
      category,
      color: "cyan",
      fontSize: "normal",
      pinned: true,
      x: 60,
      y: 60,
      author: options.author,
      sourceLabel: `תמונה (${ext.toUpperCase() || "IMG"} · ${sizeLabel})`,
      attachmentType: "image",
      fileDbId,
      fileName: file.name,
      fileMimeType: mime,
      fileSizeLabel: sizeLabel,
      mediaDataUrl: previewDataUrl || undefined,
    };
    return {
      items: [item],
      summaryMessage: `התמונה "${file.name}" נקראה ומוצגת כעת על לוח הלמידה!`,
    };
  }

  // 2. PDF DOCUMENTS (.pdf) -> Decompressed PDF Text Extraction + Live Viewer + 3D Model & 3D Quest!
  if (mime === "application/pdf" || ext === "pdf") {
    const extractedSegments = await extractReadableTextFromPdf(file, file.name);
    const pdf3dModel = await buildPdf3DModelFromFile(file, {
      authorName: options.author,
      category,
      fileDbId,
    });
    const themeMeta = PDF_3D_THEME_META[pdf3dModel.theme];
    const fullText =
      extractedSegments.length > 0
        ? extractedSegments.join("\n\n")
        : pdf3dModel.nodes.map((n) => `${n.title}\n${n.fact}`).join("\n\n");

    const item: BoardItem = {
      id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "flashcard",
      title: `📕🧊 ${file.name}`,
      content:
        extractedSegments.length > 0
          ? `📄 תוכן שנקרא מתוך ה-PDF:\n${extractedSegments.slice(0, 3).join(" · ").slice(0, 380)}`
          : `${pdf3dModel.summary}\n✨ נוצר אוטומטית גם מודל תלת־ממדי חי (${themeMeta.name})!`,
      answer: `לחצו על "פתח קורא קובץ מלא" לקריאת כל העמודים או על "שגר למעבדה 3D" כדי לחקור את המודל התלת־ממדי של "${file.name}"!`,
      emoji: "📕",
      category: pdf3dModel.category || category,
      color: "pink",
      fontSize: "normal",
      pinned: true,
      x: 65,
      y: 65,
      author: options.author,
      sourceLabel: `PDF + מודל 3D (${sizeLabel})`,
      attachmentType: "pdf",
      fileDbId,
      fileName: file.name,
      fileMimeType: "application/pdf",
      fileSizeLabel: sizeLabel,
      pdf3dModelId: pdf3dModel.id,
      fullExtractedText: fullText,
      extractedSections:
        extractedSegments.length > 0
          ? extractedSegments
          : pdf3dModel.nodes.map((n) => `${n.title}: ${n.fact}`),
    };
    return {
      items: [item],
      summaryMessage: `מסמך ה-PDF "${file.name}" נקרא במלואו, הוטמע בלוח ונוצר ממנו מודל תלת־ממדי חי (${themeMeta.name})!`,
    };
  }

  // 3. AUDIO FILES (.mp3, .wav, .ogg, .m4a, .aac, .flac)
  if (
    mime.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)
  ) {
    const item: BoardItem = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "note",
      title: `🎧 ${file.name}`,
      content: `קובץ שמע לימודי (${sizeLabel}). לחצו על כפתור הניגון להאזנה כיתתית.`,
      emoji: "🎧",
      category,
      color: "violet",
      fontSize: "normal",
      pinned: true,
      x: 70,
      y: 70,
      author: options.author,
      sourceLabel: `קובץ שמע (${ext.toUpperCase() || "AUDIO"})`,
      attachmentType: "audio",
      fileDbId,
      fileName: file.name,
      fileMimeType: mime,
      fileSizeLabel: sizeLabel,
    };
    return {
      items: [item],
      summaryMessage: `קובץ השמע "${file.name}" הועלה עם נגן אודיו חי ללוח הלמידה!`,
    };
  }

  // 4. VIDEO FILES (.mp4, .webm, .mov, .mkv, .avi)
  if (
    mime.startsWith("video/") ||
    ["mp4", "webm", "mov", "mkv", "avi"].includes(ext)
  ) {
    const item: BoardItem = {
      id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "note",
      title: `🎬 ${file.name}`,
      content: `סרטון וידאו לימודי שהועלה מהמחשב (${sizeLabel}). ניתן לצפות ישירות בכרטיסייה.`,
      emoji: "🎬",
      category,
      color: "pink",
      fontSize: "normal",
      pinned: true,
      x: 75,
      y: 75,
      author: options.author,
      sourceLabel: `וידאו (${ext.toUpperCase() || "VIDEO"})`,
      attachmentType: "video",
      fileDbId,
      fileName: file.name,
      fileMimeType: mime,
      fileSizeLabel: sizeLabel,
    };
    return {
      items: [item],
      summaryMessage: `סרטון הווידאו "${file.name}" הועלה עם נגן וידאו חי ללוח הלמידה!`,
    };
  }

  // 5. POWERPOINT PRESENTATIONS (.pptx, .ppt, .odp)
  if (
    ext === "pptx" ||
    ext === "ppt" ||
    ext === "odp" ||
    mime.includes("presentation") ||
    mime.includes("powerpoint")
  ) {
    let slides = await extractPptxSlides(file);
    if (slides.length === 0) {
      const legacy = await extractLegacyOfficeOrRtfText(file);
      slides = legacy.slice(0, 12).map((text, idx) => ({
        slideNumber: idx + 1,
        title: `שקופית ${idx + 1}`,
        content: text,
      }));
    }

    const allSlideSections = slides.map(
      (s) => `שקופית ${s.slideNumber} — ${s.title}:\n${s.content}`,
    );
    const fullText = allSlideSections.join("\n\n");

    if (slides.length > 0 && (options.splitIntoSlides ?? true)) {
      const createdSlides: BoardItem[] = slides.slice(0, 12).map((sl, idx) => ({
        id: `pptx-${Date.now()}-${idx}`,
        type: "flashcard",
        title: `📊 שְׁקוּפִית ${sl.slideNumber}: ${sl.title.slice(0, 75)}`,
        content: sl.content.slice(0, 480),
        answer: `שקופית ${sl.slideNumber} מתוך ${slides.length} במצגת "${file.name}"`,
        emoji: "📊",
        category,
        color: (["cyan", "amber", "emerald", "violet", "pink"][
          idx % 5
        ] as BoardColor),
        fontSize: "normal",
        pinned: idx === 0,
        x: 50 + idx * 18,
        y: 50 + idx * 14,
        author: options.author,
        sourceLabel: `מצגת (${file.name})`,
        attachmentType: "document",
        fileDbId,
        fileName: file.name,
        fileMimeType: mime,
        fileSizeLabel: sizeLabel,
        fullExtractedText: fullText,
        extractedSections: allSlideSections,
      }));
      return {
        items: createdSlides,
        summaryMessage: `המצגת "${file.name}" נקראה ופורקה ל-${createdSlides.length} שקופיות חיות על הלוח!`,
      };
    }

    const summaryText =
      slides.length > 0
        ? slides
            .map((s) => `שקופית ${s.slideNumber}: ${s.title} — ${s.content}`)
            .join("\n")
            .slice(0, 500)
        : `קובץ מצגת PowerPoint (${sizeLabel}) מוכן לקריאה ולהצגה בכיתה.`;
    return {
      items: [
        {
          id: `ppt-${Date.now()}`,
          type: "note",
          title: `📊 ${file.name}`,
          content: summaryText,
          emoji: "📊",
          category,
          color: "amber",
          fontSize: "normal",
          pinned: true,
          x: 60,
          y: 60,
          author: options.author,
          sourceLabel: `מצגת (${ext.toUpperCase()} · ${sizeLabel})`,
          attachmentType: "document",
          fileDbId,
          fileName: file.name,
          fileMimeType: mime,
          fileSizeLabel: sizeLabel,
          fullExtractedText: fullText || summaryText,
          extractedSections:
            allSlideSections.length > 0 ? allSlideSections : [summaryText],
        },
      ],
      summaryMessage: `המצגת "${file.name}" נקראה והועלתה ללוח הלמידה!`,
    };
  }

  // 6. WORD DOCUMENTS (.docx, .doc, .odt, .rtf)
  if (
    ext === "docx" ||
    ext === "doc" ||
    ext === "odt" ||
    ext === "rtf" ||
    mime.includes("word") ||
    mime.includes("rtf")
  ) {
    let paragraphs =
      ext === "docx" || ext === "odt" ? await extractDocxParagraphs(file) : [];
    if (paragraphs.length === 0) {
      paragraphs = await extractLegacyOfficeOrRtfText(file);
    }
    const fullText = paragraphs.join("\n\n");

    if (paragraphs.length > 1 && options.splitIntoSlides) {
      const chunks: string[] = [];
      let current = "";
      for (const p of paragraphs) {
        if ((current + " " + p).length > 320 && current) {
          chunks.push(current.trim());
          current = p;
        } else {
          current = current ? `${current}\n${p}` : p;
        }
      }
      if (current.trim()) chunks.push(current.trim());

      const items: BoardItem[] = chunks.slice(0, 8).map((chunk, idx) => ({
        id: `docx-${Date.now()}-${idx}`,
        type: "note",
        title: `📝 ${file.name} (חֵלֶק ${idx + 1})`,
        content: chunk,
        emoji: "📄",
        category,
        color: baseColor,
        fontSize: "normal",
        pinned: idx === 0,
        x: 55 + idx * 15,
        y: 55 + idx * 15,
        author: options.author,
        sourceLabel: `מסמך (${file.name})`,
        attachmentType: "document",
        fileDbId,
        fileName: file.name,
        fileMimeType: mime,
        fileSizeLabel: sizeLabel,
        fullExtractedText: fullText || chunk,
        extractedSections: chunks,
      }));
      return {
        items,
        summaryMessage: `המסמך "${file.name}" נקרא במלואו ופוצל ל-${items.length} כרטיסיות תוכן על הלוח!`,
      };
    }

    const summaryContent =
      paragraphs.length > 0
        ? paragraphs.slice(0, 6).join("\n").slice(0, 520)
        : `מסמך לימודי (${sizeLabel}) זמין לקריאה ולהורדה.`;
    return {
      items: [
        {
          id: `docx-${Date.now()}`,
          type: "note",
          title: `📝 ${file.name}`,
          content: summaryContent,
          emoji: "📄",
          category,
          color: baseColor,
          fontSize: "normal",
          pinned: true,
          x: 60,
          y: 60,
          author: options.author,
          sourceLabel: `מסמך (${ext.toUpperCase()} · ${sizeLabel})`,
          attachmentType: "document",
          fileDbId,
          fileName: file.name,
          fileMimeType: mime,
          fileSizeLabel: sizeLabel,
          fullExtractedText: fullText || summaryContent,
          extractedSections:
            paragraphs.length > 0 ? paragraphs : [summaryContent],
        },
      ],
      summaryMessage: `המסמך "${file.name}" נקרא ונוסף עם קורא מסמכים חי ללוח הלמידה!`,
    };
  }

  // 7. EXCEL / SPREADSHEET / CSV / TSV (.xlsx, .xls, .csv, .tsv, .ods)
  if (
    ["xlsx", "xls", "csv", "tsv", "ods"].includes(ext) ||
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime === "text/csv"
  ) {
    let tableData: string[][] = [];
    if (ext === "xlsx" || ext === "ods") {
      tableData = await extractXlsxTable(file);
    } else {
      const text = await readSmartHebrewText(file);
      tableData = parseCsvToTable(text);
    }
    const rowCount = tableData.length;
    const previewSummary =
      rowCount > 0
        ? `טבלת נתונים חיה (${rowCount} שורות): ${tableData[0].join(" | ")}`
        : `גיליון נתונים (${sizeLabel})`;
    const fullText =
      rowCount > 0
        ? tableData.map((r) => r.join("  |  ")).join("\n")
        : previewSummary;

    const item: BoardItem = {
      id: `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "note",
      title: `📊 ${file.name}`,
      content: previewSummary,
      emoji: "📉",
      category: options.category || "מתמטיקה",
      color: "emerald",
      fontSize: "normal",
      pinned: true,
      x: 60,
      y: 60,
      author: options.author,
      sourceLabel: `גיליון נתונים (${ext.toUpperCase()} · ${rowCount} שורות)`,
      attachmentType: "table",
      tableData: tableData.length > 0 ? tableData.slice(0, 20) : undefined,
      fileDbId,
      fileName: file.name,
      fileMimeType: mime,
      fileSizeLabel: sizeLabel,
      fullExtractedText: fullText,
    };
    return {
      items: [item],
      summaryMessage: `גיליון הנתונים "${file.name}" (${rowCount} שורות) נקרא והועלה כטבלה חיה ללוח הלמידה!`,
    };
  }

  // 8. ZIP ARCHIVES (.zip) -> Also extract readable text files inside the ZIP!
  if (ext === "zip" || mime === "application/zip") {
    try {
      const zip = await JSZip.loadAsync(file);
      const entryNames = Object.keys(zip.files).filter(
        (k) => !zip.files[k].dir,
      );
      const extractedZipNotes: string[] = [
        `קבצים בארכיון (${entryNames.length}): ${entryNames.join(", ")}`,
      ];
      for (const entryName of entryNames.slice(0, 5)) {
        if (/\.(txt|md|csv|json|html)$/i.test(entryName)) {
          const txt = await zip.files[entryName].async("string");
          if (txt.trim()) {
            extractedZipNotes.push(
              `--- ${entryName} ---\n${txt.trim().slice(0, 600)}`,
            );
          }
        }
      }
      const item: BoardItem = {
        id: `zip-${Date.now()}`,
        type: "note",
        title: `📦 ארכיון ${file.name}`,
        content: `מכיל ${entryNames.length} קבצים: ${entryNames.slice(0, 8).join(", ")}${
          entryNames.length > 8 ? "..." : ""
        }`,
        emoji: "📦",
        category,
        color: "amber",
        fontSize: "normal",
        pinned: true,
        x: 65,
        y: 65,
        author: options.author,
        sourceLabel: `ארכיון ZIP (${sizeLabel})`,
        attachmentType: "document",
        fileDbId,
        fileName: file.name,
        fileMimeType: mime,
        fileSizeLabel: sizeLabel,
        fullExtractedText: extractedZipNotes.join("\n\n"),
        extractedSections: extractedZipNotes,
      };
      return {
        items: [item],
        summaryMessage: `ארכיון ה-ZIP "${file.name}" (${entryNames.length} קבצים) נקרא והועלה ללוח!`,
      };
    } catch {
      /* continue to generic handler */
    }
  }

  // 9. TEXT / MARKDOWN / JSON / HTML / XML / CODE (and any text-readable file)
  const rawText = await readSmartHebrewText(file);
  const looksLikeReadableText =
    mime.startsWith("text/") ||
    [
      "txt",
      "md",
      "json",
      "html",
      "htm",
      "xml",
      "js",
      "ts",
      "tsx",
      "py",
      "css",
      "log",
      "ini",
      "yaml",
      "yml",
    ].includes(ext) ||
    /[\u0590-\u05FF]{3,}|[a-zA-Z]{5,}/.test(rawText.slice(0, 500));

  if (looksLikeReadableText && rawText.trim().length > 0) {
    // Check if JSON is a board export or array of items
    if (ext === "json") {
      try {
        const parsed = JSON.parse(rawText);
        if (
          Array.isArray(parsed.smartBoardItems) &&
          parsed.smartBoardItems.length > 0
        ) {
          return {
            items: parsed.smartBoardItems,
            summaryMessage: `שוחזרו ${parsed.smartBoardItems.length} כרטיסיות מתוך קובץ הגיבוי "${file.name}"!`,
          };
        }
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed[0].title &&
          parsed[0].content
        ) {
          const imported: BoardItem[] = parsed
            .slice(0, 15)
            .map((entry: Record<string, unknown>, i: number) => ({
              id: `json-${Date.now()}-${i}`,
              type: entry.answer ? "flashcard" : "note",
              title: String(entry.title || `פריט ${i + 1}`),
              content: String(entry.content || ""),
              answer: entry.answer ? String(entry.answer) : undefined,
              emoji: String(entry.emoji || "📌"),
              category: (entry.category as BoardCategory) || category,
              color: baseColor,
              fontSize: "normal",
              pinned: i === 0,
              x: 50 + i * 15,
              y: 50 + i * 15,
              author: options.author,
              sourceLabel: `יובא מ-${file.name}`,
            }));
          return {
            items: imported,
            summaryMessage: `יובאו ${imported.length} כרטיסיות מתוך הקובץ "${file.name}"!`,
          };
        }
      } catch {
        /* treat as regular text */
      }
    }

    const cleanText =
      ext === "html" || ext === "htm"
        ? stripXmlTags(
            rawText
              .replace(/<script[\s\S]*?<\/script>/gi, "")
              .replace(/<style[\s\S]*?<\/style>/gi, ""),
          )
        : rawText.replace(/\0/g, "").trim();

    const blocks = cleanText
      .split(/\n{2,}|(?=^#{1,3}\s)/m)
      .map((b) => b.trim())
      .filter(Boolean);

    if (options.splitIntoSlides && blocks.length > 1) {
      const items: BoardItem[] = blocks.slice(0, 10).map((b, idx) => {
        const lines = b
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        const heading =
          lines[0]?.replace(/^#+\s*/, "") || `${file.name} - חלק ${idx + 1}`;
        const body = lines.slice(1).join("\n") || heading;
        return {
          id: `txt-${Date.now()}-${idx}`,
          type: "flashcard",
          title: `📑 ${heading.slice(0, 75)}`,
          content: body.slice(0, 460),
          answer: `מתוך הקובץ "${file.name}" (חלק ${idx + 1} מתוך ${blocks.length})`,
          emoji: "📑",
          category,
          color: (["cyan", "emerald", "amber", "violet", "pink"][
            idx % 5
          ] as BoardColor),
          fontSize: "normal",
          pinned: idx === 0,
          x: 50 + idx * 16,
          y: 50 + idx * 16,
          author: options.author,
          sourceLabel: `${file.name} (${sizeLabel})`,
          attachmentType: "document",
          fileDbId,
          fileName: file.name,
          fileMimeType: mime,
          fileSizeLabel: sizeLabel,
          fullExtractedText: cleanText.slice(0, 10000),
          extractedSections: blocks,
        };
      });
      return {
        items,
        summaryMessage: `הקובץ "${file.name}" נקרא ופוצל ל-${items.length} כרטיסיות תוכן על הלוח!`,
      };
    }

    const item: BoardItem = {
      id: `txt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "note",
      title: `📄 ${file.name}`,
      content: cleanText.slice(0, 550) || `קובץ טקסט (${sizeLabel})`,
      emoji: "📄",
      category,
      color: baseColor,
      fontSize: "normal",
      pinned: true,
      x: 60,
      y: 60,
      author: options.author,
      sourceLabel: `קובץ (${ext.toUpperCase() || "TXT"} · ${sizeLabel})`,
      attachmentType: "document",
      fileDbId,
      fileName: file.name,
      fileMimeType: mime,
      fileSizeLabel: sizeLabel,
      fullExtractedText: cleanText.slice(0, 10000),
      extractedSections: blocks.length > 0 ? blocks : [cleanText],
    };
    return {
      items: [item],
      summaryMessage: `הקובץ "${file.name}" נקרא במלואו ונוסף ללוח הלמידה!`,
    };
  }

  // 10. FALLBACK FOR ANY OTHER BINARY FILE FORMAT (*.*)
  const legacySegments = await extractLegacyOfficeOrRtfText(file);
  const fallbackText =
    legacySegments.length > 0
      ? legacySegments.join("\n\n")
      : `קובץ מצורף מסוג ${ext.toUpperCase() || mime} (${sizeLabel}). לחצו על "פתח קורא קובץ" או "הורד קובץ מקור".`;

  const fallbackItem: BoardItem = {
    id: `any-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "note",
    title: `📎 ${file.name}`,
    content: fallbackText.slice(0, 500),
    emoji: "📎",
    category,
    color: baseColor,
    fontSize: "normal",
    pinned: true,
    x: 60,
    y: 60,
    author: options.author,
    sourceLabel: `קובץ (${ext.toUpperCase() || "FILE"} · ${sizeLabel})`,
    attachmentType: "document",
    fileDbId,
    fileName: file.name,
    fileMimeType: mime,
    fileSizeLabel: sizeLabel,
    fullExtractedText: fallbackText,
    extractedSections:
      legacySegments.length > 0 ? legacySegments : [fallbackText],
  };

  return {
    items: [fallbackItem],
    summaryMessage: `הקובץ "${file.name}" (${sizeLabel}) נקרא וצורף ללוח הלמידה!`,
  };
}

/**
 * Helper to convert a Google Drive File (`DriveFileItem`) into one or more rich `BoardItem`s,
 * downloading and parsing PDF/DOCX/PPTX/XLSX/Images if binary, or exporting Google Docs/Slides/Sheets.
 */
export async function processDriveFileItemToBoardItems(
  accessToken: string,
  df: DriveFileItem,
  options: {
    author: string;
    category: BoardCategory;
    splitIntoSlides?: boolean;
  },
): Promise<ProcessedFileResult> {
  const extracted = await extractDriveFileRealContent(accessToken, df);

  // If it's a downloadable binary (PDF, Word, PowerPoint, Excel, Image, Audio, Video), run it through our universal processor!
  if (extracted.downloadedFile) {
    const processed = await processAnyFileToBoardItems(
      extracted.downloadedFile,
      {
        author: options.author,
        category: options.category,
        splitIntoSlides: options.splitIntoSlides,
      },
    );
    const enrichedItems = processed.items.map((it) => ({
      ...it,
      externalUrl:
        df.webViewLink || `https://drive.google.com/file/d/${df.id}/view`,
      embedIframeUrl: it.embedIframeUrl || extracted.embedIframeUrl,
      sourceLabel: `Google Drive חי (${df.name})`,
    }));
    return {
      items: enrichedItems,
      summaryMessage: `הקובץ "${df.name}" יובא מ-Google Drive, נקרא במלואו ונוסף ללוח החכם!`,
    };
  }

  const sections = extracted.fullText
    ? extracted.fullText
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [extracted.extractedText];

  const newItem: BoardItem = {
    id: `drive-${df.id}-${Date.now()}`,
    type: "note",
    title: `☁️ ${df.name}`,
    content: extracted.extractedText,
    emoji: df.mimeType.includes("presentation")
      ? "📊"
      : df.mimeType.includes("spreadsheet")
        ? "📈"
        : df.mimeType.includes("document")
          ? "📝"
          : "📁",
    category: options.category,
    color: "cyan",
    fontSize: "normal",
    pinned: true,
    x: 70,
    y: 70,
    author: options.author,
    externalUrl:
      df.webViewLink || `https://drive.google.com/file/d/${df.id}/view`,
    embedIframeUrl: extracted.embedIframeUrl,
    tableData: extracted.tableData,
    fileName: df.name,
    fileMimeType: df.mimeType,
    sourceLabel: "Google Drive חי",
    attachmentType: extracted.tableData ? "table" : "document",
    fullExtractedText: extracted.fullText || extracted.extractedText,
    extractedSections: sections,
  };

  return {
    items: [newItem],
    summaryMessage: `"${df.name}" יובא מ-Google Drive עם תוכן חי ותצוגה מקדימה אל הלוח החכם!`,
  };
}

/**
 * Smart External Link / URL Converter:
 * Turns YouTube, Google Drive, Google Docs, Google Slides, Google Sheets,
 * direct PDFs/Images/Videos, or any web link into a live interactive BoardItem.
 */
export function createBoardItemFromExternalLink(params: {
  url: string;
  title?: string;
  questionOrNotes?: string;
  category: BoardCategory;
  author: string;
}): BoardItem | null {
  const rawUrl = params.url.trim();
  if (!rawUrl) return null;
  const normalizedUrl = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : `https://${rawUrl}`;

  // 1. Check YouTube
  let ytId: string | null = null;
  const shortMatch = normalizedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  const watchMatch = normalizedUrl.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  const shortsMatch = normalizedUrl.match(
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
  );
  const embedMatch = normalizedUrl.match(
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
  );
  if (shortMatch) ytId = shortMatch[1];
  else if (watchMatch) ytId = watchMatch[1];
  else if (shortsMatch) ytId = shortsMatch[1];
  else if (embedMatch) ytId = embedMatch[1];

  if (ytId) {
    const embedUrl = `https://www.youtube.com/embed/${ytId}`;
    return {
      id: `yt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: params.questionOrNotes?.trim() ? "flashcard" : "note",
      title: `🎬 ${params.title?.trim() || "סרטון YouTube לימודי"}`,
      content:
        params.questionOrNotes?.trim() ||
        "צפו בסרטון הלימודי ישירות מתוך הכרטיסייה ודונו בנקודות המרכזיות.",
      answer: params.questionOrNotes?.trim()
        ? "נקודה לדיון כיתתי בעקבות הצפייה בסרטון!"
        : undefined,
      emoji: "▶️",
      category: params.category,
      color: "pink",
      fontSize: "normal",
      pinned: true,
      x: 70,
      y: 70,
      author: params.author,
      youtubeEmbedUrl: embedUrl,
      externalUrl: normalizedUrl,
      sourceLabel: "YouTube חי",
    };
  }

  // 2. Check Google Docs / Slides / Sheets / Forms / Drive (any URL format!)
  const docsMatch = normalizedUrl.match(
    /docs\.google\.com\/(document|presentation|spreadsheets|forms)\/d\/([a-zA-Z0-9_-]{10,})/,
  );
  if (docsMatch) {
    const docType = docsMatch[1];
    const docId = docsMatch[2];
    const typeLabel =
      docType === "presentation"
        ? "מצגת Google Slides"
        : docType === "spreadsheets"
          ? "גיליון Google Sheets"
          : docType === "forms"
            ? "טופס Google Forms"
            : "מסמך Google Docs";
    const previewUrl =
      docType === "forms"
        ? `https://docs.google.com/forms/d/${docId}/viewform?embedded=true`
        : `https://docs.google.com/${docType}/d/${docId}/preview`;
    return {
      id: `gdoc-${Date.now()}`,
      type: "note",
      title: `☁️ ${params.title?.trim() || typeLabel}`,
      content:
        params.questionOrNotes?.trim() ||
        `${typeLabel} מחובר ומוטמע חי על הלוח. ניתן לעיין בתוכן ישירות בכרטיסייה או במסך מלא.`,
      emoji:
        docType === "presentation"
          ? "📊"
          : docType === "spreadsheets"
            ? "📉"
            : "📄",
      category: params.category,
      color: "cyan",
      fontSize: "normal",
      pinned: true,
      x: 65,
      y: 65,
      author: params.author,
      embedIframeUrl: previewUrl,
      externalUrl: normalizedUrl,
      sourceLabel: typeLabel,
      attachmentType: "document",
    };
  }

  const driveId = extractGoogleDriveFileIdFromUrl(normalizedUrl);
  if (
    driveId &&
    (normalizedUrl.includes("drive.google.com") ||
      normalizedUrl.includes("docs.google.com"))
  ) {
    const isFolder = normalizedUrl.includes("/folders/");
    const previewUrl = isFolder
      ? `https://drive.google.com/embeddedfolderview?id=${driveId}#grid`
      : `https://drive.google.com/file/d/${driveId}/preview`;
    return {
      id: `gdrive-${Date.now()}`,
      type: "note",
      title: `☁️ ${params.title?.trim() || (isFolder ? "תיקיית Google Drive" : "קובץ מ-Google Drive")}`,
      content:
        params.questionOrNotes?.trim() ||
        "משאב מחובר מתוך Google Drive. ניתן לצפות בתצוגה המקדימה החיה בכרטיסייה או במסך מלא.",
      emoji: "📁",
      category: params.category,
      color: "cyan",
      fontSize: "normal",
      pinned: true,
      x: 65,
      y: 65,
      author: params.author,
      embedIframeUrl: previewUrl,
      externalUrl: normalizedUrl,
      sourceLabel: "Google Drive",
      attachmentType: "document",
    };
  }

  // 3. Direct Image URL
  if (/\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(normalizedUrl)) {
    return {
      id: `link-img-${Date.now()}`,
      type: "note",
      title: `🖼️ ${params.title?.trim() || "תמונה מהרשת"}`,
      content:
        params.questionOrNotes?.trim() || "תמונה לימודית מתוך קישור ישיר.",
      emoji: "🖼️",
      category: params.category,
      color: "cyan",
      fontSize: "normal",
      pinned: true,
      x: 60,
      y: 60,
      author: params.author,
      attachmentType: "image",
      mediaDataUrl: normalizedUrl,
      externalUrl: normalizedUrl,
      sourceLabel: "תמונה מקישור",
    };
  }

  // 4. Direct PDF URL
  if (/\.pdf(\?.*)?$/i.test(normalizedUrl)) {
    return {
      id: `link-pdf-${Date.now()}`,
      type: "note",
      title: `📕 ${params.title?.trim() || "מסמך PDF מקישור"}`,
      content:
        params.questionOrNotes?.trim() || "מסמך PDF מתוך קישור חיצוני.",
      emoji: "📕",
      category: params.category,
      color: "pink",
      fontSize: "normal",
      pinned: true,
      x: 60,
      y: 60,
      author: params.author,
      embedIframeUrl: normalizedUrl,
      externalUrl: normalizedUrl,
      sourceLabel: "PDF מקישור",
      attachmentType: "pdf",
    };
  }

  // 5. General Educational Link (Wikipedia, Canva, Kahoot, Padlet, etc.)
  return {
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "note",
    title: `🔗 ${params.title?.trim() || normalizedUrl}`,
    content:
      params.questionOrNotes?.trim() ||
      `קישור לימודי מחובר: ${normalizedUrl}. לחצו לפתיחת המשאב או לתצוגה מקדימה.`,
    emoji: "🌐",
    category: params.category,
    color: "violet",
    fontSize: "normal",
    pinned: true,
    x: 65,
    y: 65,
    author: params.author,
    externalUrl: normalizedUrl,
    sourceLabel: "קישור חיצוני",
  };
}

/**
 * Async version of External Link Converter:
 * If the pasted URL is a Google Drive / Docs / Slides / Sheets link and the user has
 * an active Google OAuth token (or signs in), it automatically fetches the real file metadata
 * and content from Google Drive!
 */
export async function createBoardItemFromExternalLinkAsync(params: {
  url: string;
  title?: string;
  questionOrNotes?: string;
  category: BoardCategory;
  author: string;
}): Promise<BoardItem | null> {
  const baseItem = createBoardItemFromExternalLink(params);
  if (!baseItem) return null;

  const driveId = extractGoogleDriveFileIdFromUrl(params.url);
  const token = await getAccessToken();
  if (driveId && token && !params.url.includes("/folders/")) {
    const meta = await fetchDriveFileMetadataById(token, driveId);
    if (meta) {
      const processed = await processDriveFileItemToBoardItems(token, meta, {
        author: params.author,
        category: params.category,
        splitIntoSlides: false,
      });
      if (processed.items.length > 0) {
        const enriched = processed.items[0];
        return {
          ...enriched,
          title: params.title?.trim()
            ? `☁️ ${params.title.trim()}`
            : enriched.title,
          content: params.questionOrNotes?.trim()
            ? `${params.questionOrNotes.trim()}\n\n${enriched.content}`
            : enriched.content,
        };
      }
    }
  }
  return baseItem;
}
