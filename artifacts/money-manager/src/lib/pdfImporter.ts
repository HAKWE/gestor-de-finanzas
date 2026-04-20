import { GlobalWorkerOptions, getDocument, version as pdfjsVersion } from "pdfjs-dist";
import type { MappedTransaction } from "./csvImporter";

GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

export interface PdfParseResult {
  transactions: MappedTransaction[];
  detectedFormat: string;
  rawText: string;
  reconstructedLines: string[];
  pageCount: number;
  ocrUsed: boolean;
}

export type PdfProgressCallback = (stage: string, percent: number) => void;

// ─── helpers ────────────────────────────────────────────────────────────────

function cleanAmount(raw: string): number {
  const s = raw.trim().replace(/^[+\-]/, "").replace(/[\s\t]/g, "");
  const dotIdx = s.lastIndexOf(".");
  const comIdx = s.lastIndexOf(",");
  let normalised: string;
  if (dotIdx > comIdx) {
    normalised = s.replace(/,/g, "");
  } else if (comIdx > dotIdx) {
    normalised = s.replace(/\./g, "").replace(",", ".");
  } else {
    normalised = s;
  }
  return parseFloat(normalised) || 0;
}

function parseDate(raw: string, docYear?: number): string {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const year = docYear ?? now.getFullYear();

  const iso = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];

  const dmy = raw.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const yr = y.length === 2 ? `20${y}` : y;
    return `${yr}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const monthNames: Record<string, string> = {
    jan: "01", fév: "02", fev: "02", feb: "02", mar: "03", avr: "04", apr: "04",
    mai: "05", may: "05", jun: "06", jui: "07", jul: "07", aoû: "08", aou: "08",
    aug: "08", sep: "09", oct: "10", nov: "11", déc: "12", dec: "12",
  };

  const textMonthYear = raw.match(/\b(\d{1,2})\s+([a-zéûîà]{3})[a-z]*\.?\s+(\d{4})\b/i);
  if (textMonthYear) {
    const m = monthNames[textMonthYear[2].toLowerCase().slice(0, 3)] ?? "01";
    return `${textMonthYear[3]}-${m}-${textMonthYear[1].padStart(2, "0")}`;
  }

  const textMonthOnly = raw.match(/\b(\d{1,2})\s+([a-zéûîà]{3})[a-z]*\.?\b/i);
  if (textMonthOnly) {
    const m = monthNames[textMonthOnly[2].toLowerCase().slice(0, 3)] ?? "01";
    return `${year}-${m}-${textMonthOnly[1].padStart(2, "0")}`;
  }

  const dm = raw.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/);
  if (dm) return `${year}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;

  return today;
}

function extractRelativeDate(text: string): string | null {
  const lower = text.toLowerCase();
  const now = new Date();

  if (/aujourd'?hui|today/i.test(lower)) return now.toISOString().slice(0, 10);

  if (/\bhier\b|yesterday/i.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  const daysAgo = lower.match(/il y a (\d+) jour/);
  if (daysAgo) {
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(daysAgo[1]));
    return d.toISOString().slice(0, 10);
  }

  if (/il y a \d+ h(?:eure)?s?/i.test(lower)) return now.toISOString().slice(0, 10);

  return null;
}

function detectFormat(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("orange money")) return "Orange Money";
  if (lower.includes("wave")) return "Wave";
  if ((lower.includes("mtn") && lower.includes("momo")) || lower.includes("mobile money")) return "MTN MoMo";
  if (lower.includes("ecobank")) return "Ecobank";
  if (lower.includes("uba")) return "UBA";
  if (lower.includes("société générale") || lower.includes("sgbci")) return "Société Générale";
  if (lower.includes("coris")) return "Coris Bank";
  if (lower.includes("atlantic")) return "Atlantic Bank";
  if (lower.includes("bicis") || lower.includes("bnp")) return "BICIS/BNP";
  return "Generic PDF";
}

function detectPaymentMethod(format: string): string {
  if (format === "Orange Money") return "Orange Money";
  if (format === "Wave") return "Wave";
  if (format === "MTN MoMo") return "MTN MoMo";
  return "Other";
}

function autoCategory(description: string, type: "income" | "expense"): string {
  const lower = description.toLowerCase();
  if (type === "income") {
    if (/orange\s*money/i.test(lower)) return "Orange Money reçu";
    if (/wave/i.test(lower)) return "Wave reçu";
    if (/mtn|momo/i.test(lower)) return "MTN MoMo reçu";
    if (/coiff|salon|beauty|tress/i.test(lower)) return "Service coiffure";
    return "Vente produit";
  }
  if (/achat|stock|fourniture|commande/i.test(lower)) return "Achat stock";
  if (/transport|taxi|moto|bus/i.test(lower)) return "Transport";
  if (/loyer|bail|rent/i.test(lower)) return "Loyer";
  if (/eau|electricit|courant/i.test(lower)) return "Eau/Électricité";
  if (/nourriture|repas|manger|food/i.test(lower)) return "Nourriture";
  return "Autre";
}

const DATE_RE = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
const DATE_RE_SHORT = /\b(\d{1,2}[\/\-]\d{1,2})\b/;
const AMT_FULL_RE = /([-+]?\d[\d\s\t,.]*(?:[.,]\d{1,3})?)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)\b/gi;
const AMT_F_RE = /([-+]?\d[\d\s\t,.]*(?:[.,]\d{1,3})?)\s*\bF\b/g;
const AMT_BARE_RE = /([-+]?\d[\d\s,.]{2,})/g;

// ─── coordinate-based row reconstruction ─────────────────────────────────────

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
}

function reconstructLines(items: TextItem[]): string[] {
  if (items.length === 0) return [];

  const Y_TOLERANCE = 6;
  const rows: TextItem[][] = [];

  for (const item of items) {
    if (!item.str.trim()) continue;
    const existing = rows.find((row) => Math.abs(row[0].y - item.y) <= Y_TOLERANCE);
    if (existing) {
      existing.push(item);
    } else {
      rows.push([item]);
    }
  }

  rows.sort((a, b) => b[0].y - a[0].y);

  return rows.map((row) => {
    row.sort((a, b) => a.x - b.x);
    let line = "";
    for (let i = 0; i < row.length; i++) {
      if (i === 0) {
        line = row[i].str;
      } else {
        const prevItem = row[i - 1];
        const prevWidth = prevItem.width > 0 ? prevItem.width : prevItem.str.length * 6;
        const gap = row[i].x - (prevItem.x + prevWidth);
        const prevEndsDigit = /[\d,.]$/.test(prevItem.str.trim());
        const currStartsDigit = /^[\d,.\-+]/.test(row[i].str.trim());
        if (gap > 15 && !(prevEndsDigit && currStartsDigit)) {
          line += "\t" + row[i].str;
        } else {
          line += " " + row[i].str;
        }
      }
    }
    return line.trim();
  }).filter(Boolean);
}

function detectDocYear(text: string): number {
  const m = text.match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1]) : new Date().getFullYear();
}

function findAmountInText(text: string): { amount: number; isNegative: boolean } | null {
  AMT_FULL_RE.lastIndex = 0;
  let m = AMT_FULL_RE.exec(text);
  if (m) {
    const raw = m[1];
    return { amount: cleanAmount(raw), isNegative: raw.trim().startsWith("-") };
  }
  AMT_F_RE.lastIndex = 0;
  m = AMT_F_RE.exec(text);
  if (m) {
    const raw = m[1];
    return { amount: cleanAmount(raw), isNegative: raw.trim().startsWith("-") };
  }
  AMT_BARE_RE.lastIndex = 0;
  m = AMT_BARE_RE.exec(text);
  if (m) {
    const raw = m[1];
    const amt = cleanAmount(raw);
    if (amt >= 100) return { amount: amt, isNegative: raw.trim().startsWith("-") };
  }
  return null;
}

// ─── OCR via Tesseract.js ────────────────────────────────────────────────────

async function ocrPdfPages(
  pdf: Awaited<ReturnType<typeof getDocument>["promise"]>,
  onProgress?: PdfProgressCallback
): Promise<string> {
  const { createWorker } = await import("tesseract.js");

  onProgress?.("Chargement OCR...", 5);

  // Initialize Tesseract with French + English
  const worker = await createWorker(["fra", "eng"], 1, {
    logger: () => {}, // suppress logs
  });

  const pageTexts: string[] = [];
  const pageCount = pdf.numPages;

  for (let i = 1; i <= pageCount; i++) {
    onProgress?.(
      `Lecture page ${i}/${pageCount}...`,
      5 + Math.round(((i - 1) / pageCount) * 85)
    );

    const page = await pdf.getPage(i);
    // Scale at 2x for better OCR accuracy
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx as any, viewport }).promise;

    const { data } = await worker.recognize(canvas);
    pageTexts.push(data.text);
  }

  onProgress?.("Finalisation...", 95);
  await worker.terminate();

  return pageTexts.join("\n");
}

// ─── parsers ─────────────────────────────────────────────────────────────────

const SENTENCE_RE = /(re[çc]u[e]?|envoy[eé][e]?|transfert|retrait|d[eé]p[oô]t|paiement|pay[eé]|retir[eé])\s+([-+]?[\d\s,.]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA|F)?\s*(?:de|à|vers|from|to|chez)?\s*([^0-9\n]*?)\s*(?:le\s+)?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}-\d{2}-\d{2})?/gi;

function parseSentenceStyle(text: string, format: string): MappedTransaction[] {
  const results: MappedTransaction[] = [];
  const pm = detectPaymentMethod(format);
  const defCurrency = /ngn|naira/i.test(text) ? "NGN" : /ghs|ghana/i.test(text) ? "GHS" : /xaf|cameroun/i.test(text) ? "XAF" : "XOF";
  const docYear = detectDocYear(text);

  SENTENCE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SENTENCE_RE.exec(text)) !== null) {
    const action = m[1].toLowerCase();
    const amount = cleanAmount(m[2]);
    const party = (m[3] || "").trim().replace(/\s+/g, " ").slice(0, 80);
    const dateStr = m[4] || "";
    if (amount <= 0 || amount > 1_000_000_000) continue;
    const isIncome = /re[çc]u|credit|d[eé]p[oô]t|deposit|received/i.test(action);
    const type: "income" | "expense" = isIncome ? "income" : "expense";
    results.push({
      type, amount,
      currency: defCurrency,
      category: autoCategory(action + " " + party, type),
      paymentMethod: pm,
      referenceNote: party || action,
      date: dateStr ? parseDate(dateStr, docYear) : new Date().toISOString().slice(0, 10),
      rawRow: {},
    });
  }
  return results;
}

function parseTableRows(lines: string[], format: string): MappedTransaction[] {
  const results: MappedTransaction[] = [];
  const pm = detectPaymentMethod(format);
  const allText = lines.join(" ");
  const defCurrency = /ngn|naira/i.test(allText) ? "NGN" : /ghs|ghana/i.test(allText) ? "GHS" : /xaf|cameroun/i.test(allText) ? "XAF" : "XOF";
  const docYear = detectDocYear(allText);

  let debitFirst = false;
  for (const line of lines.slice(0, 10)) {
    const l = line.toLowerCase();
    if (l.includes("débit") || l.includes("debit") || l.includes("sortie")) { debitFirst = true; break; }
  }

  for (const line of lines) {
    const dateMatch = line.match(DATE_RE) || line.match(DATE_RE_SHORT);
    if (!dateMatch) continue;

    const parts = line.split(/\t+|\s{2,}/).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) continue;

    const numericParts = parts.filter(p => /^[-+]?[\d][\d\s,.]*$/.test(p));
    const descParts = parts.filter(p =>
      !DATE_RE.test(p) && !DATE_RE_SHORT.test(p) &&
      !/^[-+]?[\d][\d\s,.]+$/.test(p) &&
      !/^(?:FCFA|XOF|XAF|NGN|GHS|CFA|F)$/i.test(p) && p.length > 1
    );
    const description = descParts.join(" ").trim();
    let amount = 0;
    let type: "income" | "expense" = "income";
    const lineL = line.toLowerCase();
    const isDebitLine = /débit|debit|sortie|retrait|envoy|sent|paiement/i.test(lineL);
    const isCreditLine = /crédit|credit|entrée|re[çc]u|received|dépôt|deposit/i.test(lineL);

    if (numericParts.length >= 2 && (debitFirst || isCreditLine || isDebitLine)) {
      const v1 = cleanAmount(numericParts[0]);
      const v2 = cleanAmount(numericParts[1]);
      if (isDebitLine || (debitFirst && v1 > 0 && v2 === 0)) { amount = v1 || v2; type = "expense"; }
      else if (isCreditLine || (!debitFirst && v2 > 0)) { amount = v2 || v1; type = "income"; }
      else { amount = v1 || v2; }
    } else if (numericParts.length === 1) {
      const raw = numericParts[0];
      amount = cleanAmount(raw);
      if (raw.startsWith("-")) type = "expense";
      else if (isDebitLine) type = "expense";
      else if (isCreditLine) type = "income";
    } else if (numericParts.length > 2) {
      const v1 = cleanAmount(numericParts[numericParts.length - 3] || "0");
      const v2 = cleanAmount(numericParts[numericParts.length - 2] || "0");
      if (v1 > 0 && v2 === 0) { amount = v1; type = "expense"; }
      else if (v2 > 0 && v1 === 0) { amount = v2; type = "income"; }
      else { amount = Math.max(v1, v2); type = isDebitLine ? "expense" : "income"; }
    } else {
      const found = findAmountInText(line);
      if (found) { amount = found.amount; type = found.isNegative ? "expense" : (isDebitLine ? "expense" : "income"); }
    }

    if (amount <= 0 || amount > 1_000_000_000) continue;
    results.push({
      type, amount,
      currency: defCurrency,
      category: autoCategory(description || lineL, type),
      paymentMethod: pm,
      referenceNote: description.slice(0, 200),
      date: parseDate(dateMatch[0], docYear),
      rawRow: {},
    });
  }
  return results;
}

function parseBlocks(lines: string[], format: string): MappedTransaction[] {
  const results: MappedTransaction[] = [];
  const pm = detectPaymentMethod(format);
  const allText = lines.join(" ");
  const defCurrency = /ngn|naira/i.test(allText) ? "NGN" : /ghs|ghana/i.test(allText) ? "GHS" : /xaf|cameroun/i.test(allText) ? "XAF" : "XOF";
  const docYear = detectDocYear(allText);
  const today = new Date().toISOString().slice(0, 10);

  const blocks: string[][] = [];
  let cur: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const isHeader = /^(transfert\s+(envoy[eé]|re[çc]u)|paiement|retrait|dépôt)$/i.test(trimmed);
    if (trimmed.length < 2 || isHeader) {
      if (cur.length > 0) { blocks.push(cur); cur = []; }
      if (isHeader) cur = [trimmed];
    } else {
      cur.push(trimmed);
    }
  }
  if (cur.length > 0) blocks.push(cur);

  for (const block of blocks) {
    if (block.length === 0) continue;
    const blockText = block.join(" ");
    const blockL = blockText.toLowerCase();
    const found = findAmountInText(blockText);
    if (!found) continue;
    const { amount, isNegative } = found;
    if (amount <= 0 || amount > 1_000_000_000) continue;

    const dateMatch = blockText.match(DATE_RE) || blockText.match(DATE_RE_SHORT);
    const relDate = extractRelativeDate(blockText);
    const date = relDate ?? (dateMatch ? parseDate(dateMatch[0], docYear) : today);

    const isExpense = isNegative || /envoy[eé]|retrait|débit|debit|sortie|paiement|achat|sent/i.test(blockL);
    const isIncome = /re[çc]u|crédit|credit|entrée|dépôt|deposit|received/i.test(blockL);
    const type: "income" | "expense" = (isExpense && !isIncome) ? "expense" : "income";

    const desc = block
      .filter(l => !(/^\s*([-+]?\d[\d\s,.]*\s*(?:FCFA|XOF|XAF|F)\s*)$/i.test(l)))
      .join(" ").replace(DATE_RE, "").replace(/\s+/g, " ").trim().slice(0, 200);

    results.push({
      type, amount,
      currency: defCurrency,
      category: autoCategory(desc || blockL, type),
      paymentMethod: pm,
      referenceNote: desc,
      date,
      rawRow: {},
    });
  }
  return results;
}

function parseLoose(lines: string[], format: string): MappedTransaction[] {
  const results: MappedTransaction[] = [];
  const pm = detectPaymentMethod(format);
  const allText = lines.join(" ");
  const defCurrency = /ngn|naira/i.test(allText) ? "NGN" : /ghs|ghana/i.test(allText) ? "GHS" : /xaf|cameroun/i.test(allText) ? "XAF" : "XOF";
  const docYear = detectDocYear(allText);
  const today = new Date().toISOString().slice(0, 10);

  for (const line of lines) {
    const dateMatch = line.match(DATE_RE) || line.match(DATE_RE_SHORT);
    const found = findAmountInText(line);
    if (!found) continue;
    const { amount, isNegative } = found;
    if (amount <= 0 || amount > 1_000_000_000) continue;

    const lineL = line.toLowerCase();
    const isExpense = isNegative || /débit|debit|retrait|envoy|sortie|paiement|achat|sent/i.test(lineL);
    const type: "income" | "expense" = isExpense ? "expense" : "income";

    const description = line
      .replace(DATE_RE, "").replace(DATE_RE_SHORT, "")
      .replace(/[-+]?\d[\d\s\t,.]*\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA|F)\b/gi, "")
      .replace(/[-+]?\d[\d\s\t,.]{2,}/g, "")
      .trim().replace(/\s+/g, " ").slice(0, 200);

    results.push({
      type, amount,
      currency: defCurrency,
      category: autoCategory(description, type),
      paymentMethod: pm,
      referenceNote: description,
      date: dateMatch ? parseDate(dateMatch[0], docYear) : today,
      rawRow: {},
    });
  }
  return results;
}

function parseCurrencyAnchored(rawText: string, format: string): MappedTransaction[] {
  const results: MappedTransaction[] = [];
  const pm = detectPaymentMethod(format);
  const defCurrency = /ngn|naira/i.test(rawText) ? "NGN" : /ghs|ghana/i.test(rawText) ? "GHS" : /xaf|cameroun/i.test(rawText) ? "XAF" : "XOF";
  const docYear = detectDocYear(rawText);
  const today = new Date().toISOString().slice(0, 10);

  const pattern = /([-+]?\d[\d\s,.]{1,12})\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA|\bF\b)/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(rawText)) !== null) {
    const amount = cleanAmount(m[1]);
    if (amount <= 0 || amount > 1_000_000_000) continue;

    const start = Math.max(0, m.index - 200);
    const end = Math.min(rawText.length, m.index + m[0].length + 100);
    const ctx = rawText.slice(start, end);
    const dateMatch = ctx.match(DATE_RE) || ctx.match(DATE_RE_SHORT);
    const relDate = extractRelativeDate(ctx);
    const date = relDate ?? (dateMatch ? parseDate(dateMatch[0], docYear) : today);

    const ctxL = ctx.toLowerCase();
    const isNeg = m[1].trim().startsWith("-");
    const isExpense = isNeg || /débit|debit|retrait|envoy|sortie|paiement|achat|sent/i.test(ctxL);
    const type: "income" | "expense" = isExpense ? "expense" : "income";

    const desc = ctx
      .replace(/[-+]?\d[\d\s,.]+\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA|F)\b/gi, "")
      .replace(DATE_RE, "").replace(/\s+/g, " ").trim().slice(0, 150);

    results.push({
      type, amount,
      currency: defCurrency,
      category: autoCategory(desc, type),
      paymentMethod: pm,
      referenceNote: desc,
      date,
      rawRow: {},
    });
  }
  return results;
}

function runParsers(rawText: string, reconstructedLines: string[], format: string): MappedTransaction[] {
  let transactions = parseSentenceStyle(rawText, format);
  if (transactions.length === 0) transactions = parseTableRows(reconstructedLines, format);
  if (transactions.length === 0) transactions = parseBlocks(reconstructedLines, format);
  if (transactions.length === 0) transactions = parseLoose(reconstructedLines, format);
  if (transactions.length === 0) transactions = parseCurrencyAnchored(rawText, format);

  const seen = new Set<string>();
  return transactions.filter((tx) => {
    const key = `${tx.date}|${tx.amount}|${tx.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── main export ──────────────────────────────────────────────────────────────

export async function parsePdfFile(
  file: File,
  onProgress?: PdfProgressCallback
): Promise<PdfParseResult> {
  onProgress?.("Lecture du PDF...", 0);

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;
  const allItems: TextItem[] = [];
  const rawTextParts: string[] = [];

  onProgress?.("Extraction du texte...", 10);

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    content.items.forEach((item) => {
      if (!("str" in item)) return;
      const str = item.str;
      if (!str.trim()) return;
      const tx = (item as any).transform as number[] | undefined;
      const x = tx ? tx[4] : 0;
      const y = tx ? tx[5] : 0;
      const width = (item as any).width as number ?? 0;
      allItems.push({ str, x, y, width });
      rawTextParts.push(str);
    });

    allItems.push({ str: "\n", x: 0, y: -9999 - i, width: 0 });
  }

  let rawText = rawTextParts.join(" ");
  let reconstructedLines = reconstructLines(allItems.filter(it => it.str !== "\n"));
  let ocrUsed = false;

  // If no embedded text, fall back to OCR
  if (rawText.trim().length < 20) {
    ocrUsed = true;
    onProgress?.("PDF scanné — démarrage OCR...", 15);
    try {
      const ocrText = await ocrPdfPages(pdf, onProgress);
      rawText = ocrText;
      reconstructedLines = ocrText
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);
    } catch (err) {
      console.error("OCR failed:", err);
    }
    onProgress?.("Analyse des transactions...", 97);
  } else {
    onProgress?.("Analyse des transactions...", 40);
  }

  const detectedFormat = detectFormat(rawText);
  const transactions = runParsers(rawText, reconstructedLines, detectedFormat);

  onProgress?.("Terminé", 100);

  return { transactions, detectedFormat, rawText, reconstructedLines, pageCount, ocrUsed };
}
