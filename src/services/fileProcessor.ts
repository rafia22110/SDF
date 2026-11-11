import JSZip from "jszip";
import type { BoardCategory, BoardColor, BoardItem } from "../components/SmartBoard";

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

export async function saveFileToDb(id: string, file: File | Blob, fileName?: string): Promise<string> {
  const name = fileName || (file instanceof File ? file.name : "file");
  const mimeType = file.type || guessMimeTypeFromName(name);
  const blobUrl = URL.createObjectURL(file);
  memoryBlobUrls.set(id, blobUrl);

  try {
    const db = await openFilesDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const rec: StoredFileRecord = {
        id,
        name,
        mimeType,
        size: file.size,
        blob: file,
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
    const record = await new Promise<StoredFileRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as StoredFileRecord | undefined);
      req.onerror = () => reject(req.error);
    });
    if (record?.blob) {
      const url = URL.createObjectURL(record.blob);
      memoryBlobUrls.set(id, url);
      return url;
    }
  } catch (err) {
    console.warn("Could not read file from IndexedDB:", err);
  }
  return null;
}

export async function downloadStoredFile(id: string, fallbackName = "file"): Promise<void> {
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
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function stripXmlTags(xml: string): string {
  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      const textNodes: string[] = [];
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
          textNodes.push(node.nodeValue.trim());
        }
        node.childNodes.forEach(walk);
      };
      walk(doc);
      if (textNodes.length > 0) {
        return textNodes.join(" ");
      }
    } catch {
      /* fallback to regex */
    }
  }
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract real paragraphs from a .docx Word file using JSZip
 */
async function extractDocxParagraphs(file: File): Promise<string[]> {
  try {
    const zip = await JSZip.loadAsync(file);
    const docXmlFile = zip.file("word/document.xml") || zip.file("content.xml");
    if (!docXmlFile) return [];
    const xmlText = await docXmlFile.async("string");
    const paragraphs: string[] = [];

    // Split by <w:p ...> or <text:p ...>
    const pMatches = xmlText.match(/<(w:p|text:p)\b[^>]*>[\s\S]*?<\/(w:p|text:p)>/g) || [];
    for (const pXml of pMatches) {
      const tMatches = pXml.match(/<(w:t|text:span)\b[^>]*>([\s\S]*?)<\/(w:t|text:span)>/g) || [];
      const line = tMatches
        .map((t) => t.replace(/<[^>]+>/g, ""))
        .join("")
        .replace(/\s+/g, " ")
        .trim();
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
 * Extract real slides from a .pptx PowerPoint file using JSZip
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

    const slides: Array<{ slideNumber: number; title: string; content: string }> = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const path = slideFiles[i];
      const xmlText = await zip.files[path].async("string");
      // Extract <a:p> paragraphs inside the slide
      const pBlocks = xmlText.match(/<a:p\b[^>]*>[\s\S]*?<\/a:p>/g) || [];
      const lines: string[] = [];
      for (const p of pBlocks) {
        const tMatches = p.match(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g) || [];
        const line = tMatches
          .map((t) => t.replace(/<[^>]+>/g, ""))
          .join("")
          .replace(/\s+/g, " ")
          .trim();
        if (line) lines.push(line);
      }
      if (lines.length > 0) {
        const title = lines[0];
        const content = lines.slice(1).join(" · ") || lines[0];
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
          tMatches
            .map((t) => t.replace(/<[^>]+>/g, ""))
            .join("")
            .trim(),
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

    for (const rXml of rowBlocks.slice(0, 25)) {
      const cells = rXml.match(/<c\b[^>]*>[\s\S]*?<\/c>/g) || [];
      const rowValues: string[] = [];
      for (const cXml of cells) {
        const isShared = /t="s"/.test(cXml);
        const vMatch = cXml.match(/<v>([\s\S]*?)<\/v>/);
        const inlineMatch = cXml.match(/<t\b[^>]*>([\s\S]*?)<\/t>/);
        if (inlineMatch) {
          rowValues.push(inlineMatch[1].replace(/<[^>]+>/g, "").trim());
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
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  return lines.slice(0, 25).map((line) =>
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
 * Handles Images, PDFs, Audio, Video, PowerPoint (.pptx), Word (.docx),
 * Excel (.xlsx/.csv), JSON, HTML, Markdown, Text, ZIP, and ANY arbitrary file.
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

  // Always save original file to IndexedDB so user can preview & download it anytime
  await saveFileToDb(fileDbId, file, file.name);

  // 1. IMAGE FILES (.png, .jpg, .jpeg, .gif, .webp, .svg, .bmp, .avif)
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) {
    let previewDataUrl = "";
    if (file.size <= 3.5 * 1024 * 1024) {
      previewDataUrl = await readAsDataUrl(file);
    }
    const item: BoardItem = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "note",
      title: `🖼️ ${file.name}`,
      content: `תמונה לימודית שהועלתה ללוח (${sizeLabel}). לחצו על התמונה להגדלה או להורדה.`,
      emoji: "🖼️",
      category,
      color: "cyan",
      fontSize: "normal",
      pinned: true,
      x: 60,
      y: 60,
      author: options.author,
      sourceLabel: `תמונה (${ext.toUpperCase() || "IMG"})`,
      attachmentType: "image",
      fileDbId,
      fileName: file.name,
      fileMimeType: mime,
      fileSizeLabel: sizeLabel,
      mediaDataUrl: previewDataUrl || undefined,
    };
    return {
      items: [item],
      summaryMessage: `התמונה "${file.name}" הועלתה ומוצגת כעת על לוח הלמידה!`,
    };
  }

  // 2. PDF DOCUMENTS (.pdf)
  if (mime === "application/pdf" || ext === "pdf") {
    const item: BoardItem = {
      id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "note",
      title: `📕 ${file.name}`,
      content: `מסמך PDF אינטראקטיבי (${sizeLabel}). ניתן לדפדף במסמך ישירות בתוך הכרטיסייה או לפתוח במסך מלא.`,
      emoji: "📕",
      category,
      color: "pink",
      fontSize: "normal",
      pinned: true,
      x: 65,
      y: 65,
      author: options.author,
      sourceLabel: `מסמך PDF (${sizeLabel})`,
      attachmentType: "pdf",
      fileDbId,
      fileName: file.name,
      fileMimeType: "application/pdf",
      fileSizeLabel: sizeLabel,
    };
    return {
      items: [item],
      summaryMessage: `מסמך ה-PDF "${file.name}" הוטמע עם מציג PDF חי על לוח הלמידה!`,
    };
  }

  // 3. AUDIO FILES (.mp3, .wav, .ogg, .m4a, .aac, .flac)
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
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
  if (mime.startsWith("video/") || ["mp4", "webm", "mov", "mkv", "avi"].includes(ext)) {
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
  if (ext === "pptx" || ext === "odp" || mime.includes("presentation")) {
    const slides = await extractPptxSlides(file);
    if (slides.length > 0 && (options.splitIntoSlides ?? true)) {
      const createdSlides: BoardItem[] = slides.slice(0, 12).map((sl, idx) => ({
        id: `pptx-${Date.now()}-${idx}`,
        type: "flashcard",
        title: `📊 שְׁקוּפִית ${sl.slideNumber}: ${sl.title.slice(0, 75)}`,
        content: sl.content.slice(0, 420),
        answer: `שקופית ${sl.slideNumber} מתוך המצגת "${file.name}"`,
        emoji: "📊",
        category,
        color: (["cyan", "amber", "emerald", "violet", "pink"][idx % 5] as BoardColor),
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
      }));
      return {
        items: createdSlides,
        summaryMessage: `המצגת "${file.name}" פורקה בהצלחה ל-${createdSlides.length} שקופיות אינטראקטיביות על הלוח!`,
      };
    }

    const summaryText =
      slides.length > 0
        ? slides.map((s) => `שקופית ${s.slideNumber}: ${s.title} — ${s.content}`).join(" | ").slice(0, 500)
        : `קובץ מצגת PowerPoint (${sizeLabel}) מוכן להורדה ולהצגה בכיתה.`;
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
          sourceLabel: `מצגת (${ext.toUpperCase()})`,
          attachmentType: "document",
          fileDbId,
          fileName: file.name,
          fileMimeType: mime,
          fileSizeLabel: sizeLabel,
        },
      ],
      summaryMessage: `המצגת "${file.name}" הועלתה ללוח הלמידה!`,
    };
  }

  // 6. WORD DOCUMENTS (.docx, .doc, .odt)
  if (ext === "docx" || ext === "odt" || mime.includes("wordprocessingml")) {
    const paragraphs = await extractDocxParagraphs(file);
    if (paragraphs.length > 1 && options.splitIntoSlides) {
      // Group paragraphs into slide chunks
      const chunks: string[] = [];
      let current = "";
      for (const p of paragraphs) {
        if ((current + " " + p).length > 260 && current) {
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
        sourceLabel: `מסמך Word (${file.name})`,
        attachmentType: "document",
        fileDbId,
        fileName: file.name,
        fileMimeType: mime,
        fileSizeLabel: sizeLabel,
      }));
      return {
        items,
        summaryMessage: `מסמך ה-Word "${file.name}" נקרא ופוצל ל-${items.length} כרטיסיות תוכן על הלוח!`,
      };
    }

    const fullText =
      paragraphs.length > 0
        ? paragraphs.join(" · ").slice(0, 520)
        : `מסמך Word לימודי (${sizeLabel}) זמין להורדה ולצפייה.`;
    return {
      items: [
        {
          id: `docx-${Date.now()}`,
          type: "note",
          title: `📝 ${file.name}`,
          content: fullText,
          emoji: "📄",
          category,
          color: baseColor,
          fontSize: "normal",
          pinned: true,
          x: 60,
          y: 60,
          author: options.author,
          sourceLabel: `מסמך Word (${sizeLabel})`,
          attachmentType: "document",
          fileDbId,
          fileName: file.name,
          fileMimeType: mime,
          fileSizeLabel: sizeLabel,
        },
      ],
      summaryMessage: `מסמך ה-Word "${file.name}" חולץ ונוסף ללוח הלמידה!`,
    };
  }

  // 7. EXCEL / SPREADSHEET / CSV / TSV (.xlsx, .xls, .csv, .tsv, .ods)
  if (["xlsx", "xls", "csv", "tsv", "ods"].includes(ext) || mime.includes("spreadsheet") || mime === "text/csv") {
    let tableData: string[][] = [];
    if (ext === "xlsx") {
      tableData = await extractXlsxTable(file);
    } else {
      const text = await file.text();
      tableData = parseCsvToTable(text);
    }
    const rowCount = tableData.length;
    const previewSummary =
      rowCount > 0
        ? `טבלת נתונים חיה (${rowCount} שורות): ${tableData[0].join(" | ")}`
        : `גיליון נתונים (${sizeLabel})`;

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
      sourceLabel: `גיליון נתונים (${ext.toUpperCase()})`,
      attachmentType: "table",
      tableData: tableData.length > 0 ? tableData.slice(0, 12) : undefined,
      fileDbId,
      fileName: file.name,
      fileMimeType: mime,
      fileSizeLabel: sizeLabel,
    };
    return {
      items: [item],
      summaryMessage: `גיליון הנתונים "${file.name}" (${rowCount} שורות) הועלה כטבלה חיה ללוח הלמידה!`,
    };
  }

  // 8. ZIP ARCHIVES (.zip)
  if (ext === "zip" || mime === "application/zip") {
    try {
      const zip = await JSZip.loadAsync(file);
      const entryNames = Object.keys(zip.files).filter((k) => !zip.files[k].dir);
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
      };
      return {
        items: [item],
        summaryMessage: `ארכיון ה-ZIP "${file.name}" (${entryNames.length} קבצים) הועלה ללוח!`,
      };
    } catch {
      /* continue to generic handler */
    }
  }

  // 9. TEXT / MARKDOWN / JSON / HTML / XML / CODE
  if (
    mime.startsWith("text/") ||
    ["txt", "md", "json", "html", "htm", "xml", "rtf", "js", "ts", "py", "css"].includes(ext)
  ) {
    const rawText = await file.text();

    // Check if JSON is a board export or array of items
    if (ext === "json") {
      try {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed.smartBoardItems) && parsed.smartBoardItems.length > 0) {
          return {
            items: parsed.smartBoardItems,
            summaryMessage: `שוחזרו ${parsed.smartBoardItems.length} כרטיסיות מתוך קובץ הגיבוי "${file.name}"!`,
          };
        }
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title && parsed[0].content) {
          const imported: BoardItem[] = parsed.slice(0, 15).map((entry: Record<string, unknown>, i: number) => ({
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
        ? stripXmlTags(rawText.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, ""))
        : rawText.trim();

    if (options.splitIntoSlides) {
      const blocks = cleanText
        .split(/\n{2,}|(?=^#{1,3}\s)/m)
        .map((b) => b.trim())
        .filter(Boolean);
      if (blocks.length > 1) {
        const items: BoardItem[] = blocks.slice(0, 10).map((b, idx) => {
          const lines = b.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          const heading = lines[0]?.replace(/^#+\s*/, "") || `${file.name} - חלק ${idx + 1}`;
          const body = lines.slice(1).join(" · ") || heading;
          return {
            id: `txt-${Date.now()}-${idx}`,
            type: "flashcard",
            title: `📑 ${heading.slice(0, 75)}`,
            content: body.slice(0, 420),
            answer: `מתוך הקובץ "${file.name}" (שקופית ${idx + 1})`,
            emoji: "📑",
            category,
            color: (["cyan", "emerald", "amber", "violet", "pink"][idx % 5] as BoardColor),
            fontSize: "normal",
            pinned: idx === 0,
            x: 50 + idx * 16,
            y: 50 + idx * 16,
            author: options.author,
            sourceLabel: file.name,
            attachmentType: "document",
            fileDbId,
            fileName: file.name,
            fileMimeType: mime,
            fileSizeLabel: sizeLabel,
          };
        });
        return {
          items,
          summaryMessage: `הקובץ "${file.name}" פוצל ל-${items.length} כרטיסיות לימוד על הלוח!`,
        };
      }
    }

    const item: BoardItem = {
      id: `txt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "note",
      title: `📄 ${file.name}`,
      content: cleanText.slice(0, 500) || `קובץ טקסט (${sizeLabel})`,
      emoji: "📄",
      category,
      color: baseColor,
      fontSize: "normal",
      pinned: true,
      x: 60,
      y: 60,
      author: options.author,
      sourceLabel: `קובץ (${ext.toUpperCase() || "TXT"})`,
      attachmentType: "document",
      fileDbId,
      fileName: file.name,
      fileMimeType: mime,
      fileSizeLabel: sizeLabel,
    };
    return {
      items: [item],
      summaryMessage: `הקובץ "${file.name}" נקרא ונוסף ללוח הלמידה!`,
    };
  }

  // 10. FALLBACK FOR ANY OTHER FILE FORMAT (*.*)
  const fallbackItem: BoardItem = {
    id: `any-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "note",
    title: `📎 ${file.name}`,
    content: `קובץ מצורף מסוג ${ext.toUpperCase() || mime} (${sizeLabel}). לחצו על כפתור ההורדה/פתיחה למטה כדי לפתוח את הקובץ.`,
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
  };

  return {
    items: [fallbackItem],
    summaryMessage: `הקובץ "${file.name}" (${sizeLabel}) הועלה וצורף ללוח הלמידה!`,
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
  const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  // 1. Check YouTube
  let ytId: string | null = null;
  const shortMatch = normalizedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  const watchMatch = normalizedUrl.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  const shortsMatch = normalizedUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
  const embedMatch = normalizedUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
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

  // 2. Check Google Drive / Docs / Slides / Sheets / Forms
  const driveFileMatch = normalizedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const docsMatch = normalizedUrl.match(/docs\.google\.com\/(document|presentation|spreadsheets|forms)\/d\/([a-zA-Z0-9_-]+)/);

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
        `${typeLabel} מוטמע חי על הלוח. ניתן לעיין בתוכן ישירות או לפתוח בחלון חדש.`,
      emoji: docType === "presentation" ? "📊" : docType === "spreadsheets" ? "📉" : "📄",
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
    };
  }

  if (driveFileMatch) {
    const fileId = driveFileMatch[1];
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    return {
      id: `gdrive-${Date.now()}`,
      type: "note",
      title: `☁️ ${params.title?.trim() || "קובץ מ-Google Drive"}`,
      content:
        params.questionOrNotes?.trim() ||
        "קובץ מוטמע מתוך Google Drive. ניתן לצפות בתצוגה המקדימה החיה בכרטיסייה.",
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
    };
  }

  // 3. Direct Image URL
  if (/\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(normalizedUrl)) {
    return {
      id: `link-img-${Date.now()}`,
      type: "note",
      title: `🖼️ ${params.title?.trim() || "תמונה מהרשת"}`,
      content: params.questionOrNotes?.trim() || "תמונה לימודית מתוך קישור ישיר.",
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
      content: params.questionOrNotes?.trim() || "מסמך PDF מתוך קישור חיצוני.",
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
    };
  }

  // 5. General Educational Link (Wikipedia, Canva, Kahoot, Padlet, etc.)
  return {
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: "note",
    title: `🔗 ${params.title?.trim() || normalizedUrl}`,
    content:
      params.questionOrNotes?.trim() ||
      `קישור לימודי מצורף: ${normalizedUrl}. לחצו על הכפתור לפתיחת המשאב.`,
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
