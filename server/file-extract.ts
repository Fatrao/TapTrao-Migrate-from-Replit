/**
 * file-extract.ts — Generalised file extraction utilities
 *
 * Shared module for extracting text/images from uploaded files (PDF, images, HTML).
 * Used by:
 *   - lc-extract.ts (LC document checker)
 *   - doc-validate.ts (Phase 4 requirement-driven validation)
 *
 * Provides per-page text, image extraction, SHA-256 hashing, and multi-format support.
 */

import { readFileSync } from "fs";
import { createHash } from "crypto";
import { readFile } from "fs/promises";

// ── Types ──

export type SourceTextMethod = "pdf_text" | "ocr" | "hybrid" | "direct_text";

export type FileContentPage = {
  pageIndex: number;
  text: string;
};

export type FileContent = {
  pages: FileContentPage[];
  images: Buffer[];
  totalPageCount: number;
  sourceTextMethod: SourceTextMethod;
  error: string | null;
};

// ── Low-level PDF extraction (used by lc-extract.ts) ──

/**
 * Extract all text from a PDF file using pdf-parse.
 * Returns the full text as a single string.
 */
export async function extractTextFromPdf(filePath: string): Promise<string> {
  // pdf-parse has no default export in all module systems; handle both
  const mod = await import("pdf-parse");
  const pdfParse = (mod as any).default ?? mod;
  const buffer = readFileSync(filePath);
  const data = await (pdfParse as any)(buffer);
  return (data.text ?? "").trim();
}

/**
 * Extract per-page text from a PDF file.
 * Uses pdf-parse's pagerender callback to capture each page separately.
 */
export async function extractTextFromPdfPerPage(filePath: string): Promise<FileContentPage[]> {
  const mod = await import("pdf-parse");
  const pdfParse = (mod as any).default ?? mod;
  const buffer = readFileSync(filePath);

  const pages: FileContentPage[] = [];

  // pdf-parse supports a pagerender callback that receives each page's text content
  const options = {
    pagerender: (pageData: any) => {
      // pageData.getTextContent() returns a promise with the text items
      return pageData.getTextContent().then((textContent: any) => {
        const text = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();
        return text;
      });
    },
  };

  const data = await (pdfParse as any)(buffer, options);

  // pdf-parse returns numpages — build per-page from the rendered text
  // The pagerender callback modifies data.text to be page-separated
  // But for reliability, we split the full text by page markers if needed
  if (data.text) {
    // pdf-parse concatenates pages with form-feed or double-newline
    // Split heuristically on form-feed characters or large whitespace gaps
    const rawText: string = data.text;
    const pageSplits = rawText.split(/\f/);

    if (pageSplits.length > 1) {
      // Form-feed separated
      for (let i = 0; i < pageSplits.length; i++) {
        const text = pageSplits[i].trim();
        if (text.length > 0) {
          pages.push({ pageIndex: i, text });
        }
      }
    } else {
      // Single block — treat as page 0
      pages.push({ pageIndex: 0, text: rawText.trim() });
    }
  }

  return pages;
}

/**
 * Convert a PDF to images (one image per page).
 * Returns an array of PNG buffers.
 */
export async function pdfToImages(filePath: string): Promise<Buffer[]> {
  const { pdf } = await import("pdf-to-img");
  const images: Buffer[] = [];
  const document = await pdf(filePath, { scale: 2 });
  for await (const page of document) {
    images.push(Buffer.from(page));
  }
  return images;
}

// ── Generalised file content extraction ──

/**
 * Extract content from any supported file type.
 *
 * Supports:
 *   - PDF (text extraction + fallback to OCR images)
 *   - Images (jpg, png, webp → single image for OCR)
 *   - HTML/text files → direct text extraction
 *
 * Returns per-page text, images for vision processing, and metadata.
 */
export async function extractFileContent(
  filePath: string,
  mimeType: string,
): Promise<FileContent> {
  const normalizedMime = mimeType.toLowerCase().trim();

  // ── PDF ──
  if (normalizedMime === "application/pdf" || filePath.toLowerCase().endsWith(".pdf")) {
    return extractPdfContent(filePath);
  }

  // ── Images (jpg, png, webp, tiff, gif) ──
  if (normalizedMime.startsWith("image/")) {
    return extractImageContent(filePath, normalizedMime);
  }

  // ── HTML ──
  if (normalizedMime === "text/html" || filePath.toLowerCase().endsWith(".html") || filePath.toLowerCase().endsWith(".htm")) {
    return extractHtmlContent(filePath);
  }

  // ── Plain text ──
  if (normalizedMime.startsWith("text/") || normalizedMime === "application/json") {
    return extractPlainTextContent(filePath);
  }

  // ── Unsupported format ──
  return {
    pages: [],
    images: [],
    totalPageCount: 0,
    sourceTextMethod: "direct_text",
    error: `Unsupported file type: ${mimeType}`,
  };
}

/**
 * Extract content from a PDF file.
 * Tries text extraction first; falls back to image extraction for scanned docs.
 */
async function extractPdfContent(filePath: string): Promise<FileContent> {
  let pages: FileContentPage[] = [];
  let images: Buffer[] = [];
  let sourceTextMethod: SourceTextMethod = "pdf_text";

  // Step 1: Try per-page text extraction
  try {
    pages = await extractTextFromPdfPerPage(filePath);
  } catch {
    // pdf-parse failed — will try images
  }

  // Calculate total extracted text length
  const totalTextLength = pages.reduce((sum, p) => sum + p.text.length, 0);

  // Step 2: If text is too short (likely scanned), try image conversion
  if (totalTextLength < 50) {
    try {
      images = await pdfToImages(filePath);
      if (totalTextLength > 0 && images.length > 0) {
        sourceTextMethod = "hybrid";
      } else if (images.length > 0) {
        sourceTextMethod = "ocr";
      }
    } catch (err: any) {
      if (totalTextLength === 0) {
        return {
          pages: [],
          images: [],
          totalPageCount: 0,
          sourceTextMethod: "pdf_text",
          error: "Could not read PDF. The file may be corrupted or password-protected.",
        };
      }
      // Text exists but image conversion failed — proceed with text
    }
  }

  const totalPageCount = Math.max(pages.length, images.length, 1);

  return {
    pages,
    images,
    totalPageCount,
    sourceTextMethod,
    error: null,
  };
}

/**
 * Extract content from an image file.
 * Returns the image buffer for OCR processing.
 */
async function extractImageContent(filePath: string, mimeType: string): Promise<FileContent> {
  try {
    const buffer = readFileSync(filePath);

    // Validate it's a reasonable size (< 20MB)
    if (buffer.length > 20 * 1024 * 1024) {
      return {
        pages: [],
        images: [],
        totalPageCount: 0,
        sourceTextMethod: "ocr",
        error: "Image file exceeds 20MB limit.",
      };
    }

    return {
      pages: [{ pageIndex: 0, text: "" }], // No text yet — needs OCR via AI
      images: [buffer],
      totalPageCount: 1,
      sourceTextMethod: "ocr",
      error: null,
    };
  } catch (err: any) {
    return {
      pages: [],
      images: [],
      totalPageCount: 0,
      sourceTextMethod: "ocr",
      error: `Could not read image file: ${err.message?.substring(0, 100)}`,
    };
  }
}

/**
 * Extract content from an HTML file.
 * Strips tags and returns plain text.
 */
async function extractHtmlContent(filePath: string): Promise<FileContent> {
  try {
    const raw = await readFile(filePath, "utf-8");

    // Simple HTML tag stripping (no dependency on cheerio)
    const text = raw
      .replace(/<script[\s\S]*?<\/script>/gi, "") // Remove scripts
      .replace(/<style[\s\S]*?<\/style>/gi, "")   // Remove styles
      .replace(/<[^>]+>/g, " ")                     // Remove tags
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")                         // Collapse whitespace
      .trim();

    return {
      pages: [{ pageIndex: 0, text }],
      images: [],
      totalPageCount: 1,
      sourceTextMethod: "direct_text",
      error: null,
    };
  } catch (err: any) {
    return {
      pages: [],
      images: [],
      totalPageCount: 0,
      sourceTextMethod: "direct_text",
      error: `Could not read HTML file: ${err.message?.substring(0, 100)}`,
    };
  }
}

/**
 * Extract content from a plain text file.
 */
async function extractPlainTextContent(filePath: string): Promise<FileContent> {
  try {
    const text = await readFile(filePath, "utf-8");

    return {
      pages: [{ pageIndex: 0, text: text.trim() }],
      images: [],
      totalPageCount: 1,
      sourceTextMethod: "direct_text",
      error: null,
    };
  } catch (err: any) {
    return {
      pages: [],
      images: [],
      totalPageCount: 0,
      sourceTextMethod: "direct_text",
      error: `Could not read text file: ${err.message?.substring(0, 100)}`,
    };
  }
}

// ── Hashing ──

/**
 * Compute SHA-256 hash of a file for tamper evidence and deduplication.
 */
export async function computeFileSha256(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

// ── Helpers ──

/**
 * Merge per-page text into a single string.
 * Useful for backward compatibility with code expecting a single text blob.
 */
export function mergePageText(pages: FileContentPage[]): string {
  return pages.map((p) => p.text).join("\n\n");
}

/**
 * Get a bounded subset of page text for LLM prompts.
 * Returns text from the first N pages, capped at maxChars.
 */
export function getBoundedText(
  pages: FileContentPage[],
  maxChars: number = 15000,
  maxPages: number = 20,
): string {
  let result = "";
  const limit = Math.min(pages.length, maxPages);

  for (let i = 0; i < limit; i++) {
    const pageText = pages[i].text;
    if (result.length + pageText.length + 10 > maxChars) {
      // Add truncated remainder
      const remaining = maxChars - result.length - 20;
      if (remaining > 100) {
        result += `\n\n--- Page ${pages[i].pageIndex + 1} ---\n${pageText.slice(0, remaining)}...[truncated]`;
      }
      break;
    }
    result += `\n\n--- Page ${pages[i].pageIndex + 1} ---\n${pageText}`;
  }

  return result.trim();
}
