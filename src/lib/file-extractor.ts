// Extract textual content from user-uploaded files in the browser.
// For images, returns a base64 data URL that the edge function can pass to a multimodal model.

import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure pdf.js worker via CDN (matches installed version)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ExtractedFile {
  kind: "text" | "image" | "unsupported";
  text?: string;
  imageDataUrl?: string;
  mimeType: string;
  note?: string;
}

const TEXT_EXTS = ["txt", "md", "markdown", "csv", "json", "xml", "html", "htm", "yaml", "yml", "log", "tsv"];

function extOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function extractPdf(file: File): Promise<string> {
  const buf = await readAsArrayBuffer(file);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = await (pdfjsLib as any).getDocument({ data: buf }).promise;
  const pages: string[] = [];
  const maxPages = Math.min(pdf.numPages, 50);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = content.items.map((it: any) => it.str).join(" ");
    pages.push(text);
  }
  return pages.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const buf = await readAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}

export async function extractFile(file: File): Promise<ExtractedFile> {
  const ext = extOf(file.name);
  const mime = file.type || "application/octet-stream";

  // Text-like files
  if (TEXT_EXTS.includes(ext) || mime.startsWith("text/") || mime === "application/json") {
    const text = await readAsText(file);
    return { kind: "text", text, mimeType: mime };
  }

  if (ext === "pdf" || mime === "application/pdf") {
    const text = await extractPdf(file);
    if (!text.trim()) {
      return { kind: "unsupported", mimeType: mime, note: "PDF appears to contain no extractable text (likely scanned)." };
    }
    return { kind: "text", text, mimeType: mime };
  }

  if (ext === "docx" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const text = await extractDocx(file);
    return { kind: "text", text, mimeType: mime };
  }

  if (mime.startsWith("image/")) {
    const dataUrl = await readAsDataUrl(file);
    return { kind: "image", imageDataUrl: dataUrl, mimeType: mime };
  }

  return {
    kind: "unsupported",
    mimeType: mime,
    note: `File type "${ext || mime}" is not supported for content extraction. Supported: text, markdown, CSV, JSON, PDF, DOCX, and images.`,
  };
}
