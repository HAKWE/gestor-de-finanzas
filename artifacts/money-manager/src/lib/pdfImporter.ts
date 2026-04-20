import { GlobalWorkerOptions, getDocument, version as pdfjsVersion } from "pdfjs-dist";
import type { MappedTransaction } from "./csvImporter";

GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

export interface PdfParseResult {
  transactions: MappedTransaction[];
  detectedFormat: string;
  rawText: string;
  reconstructedLines: string[];
  pageCount: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function cleanAmount(raw: string): number {
  // Handle French number formats: 5 000,50 → 5000.50 or 5.000 → 5000
  // Also handle tab-separated digits from PDF reconstruction: "5\t000"
  const s = raw.trim().replace(/[\s\t]/g, " ").trim();
  // Remove all whitespace for pure digit groups (formatted numbers like "5 000")
  const noSpaces = s.replace(/\s/g, "");
  const dotIdx = noSpaces.lastIndexOf(".");
  const comIdx = noSpaces.lastIndexOf(",");
  let normalised: string;
  if (dotIdx > comIdx) {
    normalised = noSpaces.replace(/,/g, "");
  } else if (comIdx > dotIdx) {
    normalised = noSpaces.replace(/\./g, "").replace(",", ".");
  } else {
    normalised = noSpaces;
  }
  return parseFloat(normalised) || 0;
}

function parseDate(raw: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const iso = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  const dmy = raw.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const monthNames: Record<string, string> = {
    jan: "01", fév: "02", feb: "02", mar: "03", avr: "04", apr: "04",
    mai: "05", may: "05", jun: "06", jui: "07", jul: "07", aoû: "08",
    aug: "08", sep: "09", oct: "10", nov: "11", déc: "12", dec: "12",
  };
  const textMonth = raw.match(/\b(\d{1,2})\s+([a-zéûî]{3})[a-z]*\.?\s+(\d{4})\b/i);
  if (textMonth) {
    const m = monthNames[textMonth[2].toLowerCase().slice(0, 3)] ?? "01";
    return `${textMonth[3]}-${m}-${textMonth[1].padStart(2, "0")}`;
  }
  return today;
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

// ─── coordinate-based row reconstruction ────────────────────────────────────

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number; // actual rendered width from pdfjs
}

function reconstructLines(items: TextItem[]): string[] {
  if (items.length === 0) return [];

  // Group items into rows by proximity of y coordinate.
  // Use a higher tolerance (6px) because sub-pixel rendering in PDFs can shift
  // items on the same visual line by more than 3px.
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

  // Sort rows top-to-bottom (higher y = higher on page in pdfjs coords → descending)
  rows.sort((a, b) => b[0].y - a[0].y);

  return rows.map((row) => {
    row.sort((a, b) => a.x - b.x);
    let line = "";
    for (let i = 0; i < row.length; i++) {
      if (i === 0) {
        line = row[i].str;
      } else {
        const prevItem = row[i - 1];
        // Use actual rendered width from pdfjs (falls back to char-length estimate)
        const prevWidth = prevItem.width > 0 ? prevItem.width : prevItem.str.length * 6;
        const gap = row[i].x - (prevItem.x + prevWidth);

        // If both sides look like parts of a number (digits/commas/dots),
        // keep them joined with a space even if gap is large — avoids breaking
        // formatted numbers like "5 000" that become "5\t000".
        const prevEndsDigit = /[\d,.]$/.test(prevItem.str.trim());
        const currStartsDigit = /^[\d,.]/.test(row[i].str.trim());

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

// ─── transaction parsers ─────────────────────────────────────────────────────

const DATE_RE = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
// Flexible amount: digits with optional spaces/tabs as thousands sep, optional decimal
const AMOUNT_RE = /(\d[\d\s\t]*(?:[.,]\d{2,3})?)/;
const CURRENCY_RE = /(?:FCFA|XOF|XAF|NGN|GHS|CFA)\b/i;

// Pattern: sentence-style mobile money ("Vous avez reçu 5 000 FCFA de X")
const SENTENCE_RE = /(re[çc]u[e]?|envoy[eé][e]?|transfert|retrait|d[eé]p[oô]t|paiement|pay[eé]|retir[eé])\s+([\d\s,.]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)?\s*(?:de|à|vers|from|to|chez)?\s*([^0-9\n]*?)\s*(?:le\s+)?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}-\d{2}-\d{2})?/gi;

function parseSentenceStyle(text: string, format: string): MappedTransaction[] {
  const results: MappedTransaction[] = [];
  const pm = detectPaymentMethod(format);
  const defCurrency = /ngn|naira/i.test(text) ? "NGN" : /ghs|ghana/i.test(text) ? "GHS" : /xaf|cameroun/i.test(text) ? "XAF" : "XOF";

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
      type,
      amount,
      currency: defCurrency,
      category: autoCategory(action + " " + party, type),
      paymentMethod: pm,
      referenceNote: party || action,
      date: dateStr ? parseDate(dateStr) : new Date().toISOString().slice(0, 10),
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

  let debitFirst = false;
  for (const line of lines.slice(0, 10)) {
    const l = line.toLowerCase();
    if (l.includes("débit") || l.includes("debit") || l.includes("sortie")) {
      debitFirst = true;
      break;
    }
  }

  for (const line of lines) {
    const dateMatch = line.match(DATE_RE);
    if (!dateMatch) continue;

    const parts = line.split(/\t+|\s{2,}/).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) continue;

    // Match amounts including those with internal spaces (formatted thousands)
    const numericParts = parts.filter(p => /^[-+]?[\d][\d\s,.]*$/.test(p));

    const descParts = parts.filter(p =>
      !DATE_RE.test(p) &&
      !/^[-+]?[\d][\d\s,.]+$/.test(p) &&
      !/^(?:FCFA|XOF|XAF|NGN|GHS|CFA)$/i.test(p) &&
      p.length > 1
    );
    const description = descParts.join(" ").trim();

    let amount = 0;
    let type: "income" | "expense" = "income";

    const lineL = line.toLowerCase();
    const isDebitLine = /débit|debit|sortie|retrait|envoy|sent|paiement\s+effectu/i.test(lineL);
    const isCreditLine = /crédit|credit|entrée|re[çc]u|received|dépôt|deposit/i.test(lineL);

    if (numericParts.length >= 2 && (debitFirst || isCreditLine || isDebitLine)) {
      const v1 = cleanAmount(numericParts[0]);
      const v2 = cleanAmount(numericParts[1]);
      if (isDebitLine || (debitFirst && v1 > 0 && v2 === 0)) {
        amount = v1 || v2;
        type = "expense";
      } else if (isCreditLine || (!debitFirst && v2 > 0)) {
        amount = v2 || v1;
        type = "income";
      } else {
        amount = v1 || v2;
        type = "income";
      }
    } else if (numericParts.length === 1) {
      const raw = numericParts[0];
      amount = cleanAmount(raw);
      if (raw.startsWith("-")) type = "expense";
      else if (isDebitLine) type = "expense";
      else if (isCreditLine) type = "income";
      else type = "income";
    } else if (numericParts.length > 2) {
      const v1 = cleanAmount(numericParts[numericParts.length - 3] || "0");
      const v2 = cleanAmount(numericParts[numericParts.length - 2] || "0");
      if (v1 > 0 && v2 === 0) { amount = v1; type = "expense"; }
      else if (v2 > 0 && v1 === 0) { amount = v2; type = "income"; }
      else { amount = Math.max(v1, v2); type = isDebitLine ? "expense" : "income"; }
    }

    if (amount <= 0 || amount > 1_000_000_000) continue;
    if (/date|libellé|montant|débit|crédit|solde|description/i.test(description) && amount === 0) continue;

    results.push({
      type,
      amount,
      currency: defCurrency,
      category: autoCategory(description || lineL, type),
      paymentMethod: pm,
      referenceNote: description.slice(0, 200),
      date: parseDate(dateMatch[0]),
      rawRow: {},
    });
  }

  return results;
}

// Fallback: scan lines for amount + optional date
function parseLoose(lines: string[], format: string): MappedTransaction[] {
  const results: MappedTransaction[] = [];
  const pm = detectPaymentMethod(format);
  const defCurrency = /ngn|naira/i.test(lines.join(" ")) ? "NGN" : /ghs|ghana/i.test(lines.join(" ")) ? "GHS" : /xaf|cameroun/i.test(lines.join(" ")) ? "XAF" : "XOF";
  const today = new Date().toISOString().slice(0, 10);

  for (const line of lines) {
    const dateMatch = line.match(DATE_RE);
    // Try to find amount + currency first, then fall back to any number ≥ 3 digits
    const amtMatch =
      line.match(new RegExp(AMOUNT_RE.source + "\\s*" + CURRENCY_RE.source, "i")) ||
      line.match(/(\d[\d\s\t,.]{2,})(?=\s|$|\t)/);
    if (!amtMatch) continue;

    const amount = cleanAmount(amtMatch[1]);
    if (amount <= 0 || amount > 1_000_000_000) continue;

    const lineL = line.toLowerCase();
    const type: "income" | "expense" = /débit|debit|retrait|envoy|sortie|paiement|achat|sent/i.test(lineL)
      ? "expense" : "income";

    const description = line
      .replace(DATE_RE, "")
      .replace(amtMatch[0], "")
      .replace(CURRENCY_RE, "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 200);

    results.push({
      type,
      amount,
      currency: defCurrency,
      category: autoCategory(description, type),
      paymentMethod: pm,
      referenceNote: description,
      date: dateMatch ? parseDate(dateMatch[0]) : today,
      rawRow: {},
    });
  }

  return results;
}

// Strategy 4: find any amount+currency in raw text — handles tables where amounts
// appear inline with FCFA/XOF markers but dates may be on a different line.
function parseCurrencyAnchored(rawText: string, format: string): MappedTransaction[] {
  const results: MappedTransaction[] = [];
  const pm = detectPaymentMethod(format);
  const defCurrency = /ngn|naira/i.test(rawText) ? "NGN" : /ghs|ghana/i.test(rawText) ? "GHS" : /xaf|cameroun/i.test(rawText) ? "XAF" : "XOF";
  const today = new Date().toISOString().slice(0, 10);

  // Find all "amount CURRENCY" or "CURRENCY amount" occurrences with surrounding context
  const pattern = /(\d[\d\s,.]{1,12})\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(rawText)) !== null) {
    const amount = cleanAmount(m[1]);
    if (amount <= 0 || amount > 1_000_000_000) continue;

    // Extract a window of context around the match to find date/type clues
    const start = Math.max(0, m.index - 200);
    const end = Math.min(rawText.length, m.index + m[0].length + 100);
    const ctx = rawText.slice(start, end);

    const dateMatch = ctx.match(DATE_RE);
    const ctxL = ctx.toLowerCase();
    const type: "income" | "expense" = /débit|debit|retrait|envoy|sortie|paiement|achat|sent/i.test(ctxL)
      ? "expense" : "income";

    // Description: text near the amount excluding digits/currency
    const desc = ctx
      .replace(/\d[\d\s,.]+(?:FCFA|XOF|XAF|NGN|GHS|CFA)\b/gi, "")
      .replace(DATE_RE, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 150);

    results.push({
      type,
      amount,
      currency: defCurrency,
      category: autoCategory(desc, type),
      paymentMethod: pm,
      referenceNote: desc,
      date: dateMatch ? parseDate(dateMatch[0]) : today,
      rawRow: {},
    });
  }
  return results;
}

// ─── main export ─────────────────────────────────────────────────────────────

export async function parsePdfFile(file: File): Promise<PdfParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;
  const allItems: TextItem[] = [];
  const rawTextParts: string[] = [];

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
      // pdfjs provides actual rendered width on the item object
      const width = (item as any).width as number ?? 0;
      allItems.push({ str, x, y, width });
      rawTextParts.push(str);
    });

    allItems.push({ str: "\n", x: 0, y: -9999 - i, width: 0 });
  }

  const rawText = rawTextParts.join(" ");
  const reconstructedLines = reconstructLines(allItems.filter(it => it.str !== "\n"));
  const detectedFormat = detectFormat(rawText);

  // Strategy 1: sentence-style (mobile money notifications)
  let transactions = parseSentenceStyle(rawText, detectedFormat);

  // Strategy 2: table rows using reconstructed lines
  if (transactions.length === 0) {
    transactions = parseTableRows(reconstructedLines, detectedFormat);
  }

  // Strategy 3: loose scan of reconstructed lines (date optional)
  if (transactions.length === 0) {
    transactions = parseLoose(reconstructedLines, detectedFormat);
  }

  // Strategy 4: currency-anchored scan of raw text
  if (transactions.length === 0) {
    transactions = parseCurrencyAnchored(rawText, detectedFormat);
  }

  // Deduplicate by (date + amount + type)
  const seen = new Set<string>();
  transactions = transactions.filter((tx) => {
    const key = `${tx.date}|${tx.amount}|${tx.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { transactions, detectedFormat, rawText, reconstructedLines, pageCount };
}
