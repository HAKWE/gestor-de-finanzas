import { GlobalWorkerOptions, getDocument, version as pdfjsVersion } from "pdfjs-dist";
import type { MappedTransaction } from "./csvImporter";

GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

export interface PdfParseResult {
  transactions: MappedTransaction[];
  detectedFormat: string;
  rawText: string;
  pageCount: number;
}

function cleanAmount(raw: string): number {
  return parseFloat(raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")) || 0;
}

function parseDate(raw: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const iso = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  const dmy = raw.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return today;
}

function detectFormat(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("orange money")) return "Orange Money";
  if (lower.includes("wave")) return "Wave";
  if (lower.includes("mtn") && (lower.includes("momo") || lower.includes("mobile money"))) return "MTN MoMo";
  if (lower.includes("ecobank")) return "Ecobank";
  if (lower.includes("uba")) return "UBA";
  if (lower.includes("sgbci") || lower.includes("société générale")) return "Société Générale";
  if (lower.includes("coris") || lower.includes("corisbank")) return "Coris Bank";
  if (lower.includes("atb") || lower.includes("atlantic bank")) return "Atlantic Bank";
  return "Generic PDF";
}

function detectPaymentMethod(text: string, format: string): string {
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
  } else {
    if (/achat|stock|fourniture|commande/i.test(lower)) return "Achat stock";
    if (/transport|taxi|moto|bus|car/i.test(lower)) return "Transport";
    if (/loyer|bail|rent/i.test(lower)) return "Loyer";
    if (/eau|electricit|courant|lumière/i.test(lower)) return "Eau/Électricité";
    if (/nourriture|repas|manger|food/i.test(lower)) return "Nourriture";
    return "Autre";
  }
}

// Try to parse transactions from raw PDF text
function parseTransactions(text: string, format: string): MappedTransaction[] {
  const transactions: MappedTransaction[] = [];
  const paymentMethod = detectPaymentMethod(text, format);
  const defaultCurrency = /ngn|naira/i.test(text) ? "NGN" : /ghs|ghana/i.test(text) ? "GHS" : /xaf|cameroun|cameroon/i.test(text) ? "XAF" : "XOF";

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Pattern 1: Lines with date + amount (common in tabular bank statements)
  // e.g. "15/03/2024  Transfert Orange Money  5 000  -  25 000"
  const tableLinePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\s+(.+?)\s+([\d\s,.]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)?$/i;

  // Pattern 2: Line with credit/debit split columns
  // e.g. "15/03/2024  Paiement  -  5.000  25.000"
  const debitCreditPattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\s+(.+?)\s+([\d\s,.]+)?\s+([\d\s,.]+)?$/;

  // Pattern 3: Amount-only lines after a description line (mobile money app exports)
  const amountOnlyPattern = /^([\d\s,.]{3,})\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)?$/i;

  // Pattern 4: Full transaction lines in mobile money statement format
  // "Reçu 5 000 FCFA de Moussa Diallo le 15/03/2024"
  const mobileMoneySentencePattern = /(re[çc]u|envoy[eé]|transfert|retrait|dépôt|paiement)\s+([\d\s,.]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)?\s*(?:de|à|vers|from|to)?\s*([^0-9\n]*?)\s*(?:le\s+)?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})?/gi;

  // Try mobile money sentence patterns first (high accuracy)
  let match;
  const mobileMatches: MappedTransaction[] = [];
  const fullText = text;
  mobileMoneySentencePattern.lastIndex = 0;

  while ((match = mobileMoneySentencePattern.exec(fullText)) !== null) {
    const action = match[1].toLowerCase();
    const amount = cleanAmount(match[2]);
    const party = (match[3] || "").trim().replace(/\s+/g, " ").slice(0, 60);
    const dateStr = match[4] || "";

    if (amount <= 0) continue;

    const isIncome = /re[çc]u|re[çc]eiv|credit|dépôt|deposit/i.test(action);
    const type: "income" | "expense" = isIncome ? "income" : "expense";

    mobileMatches.push({
      type,
      amount,
      currency: defaultCurrency,
      category: autoCategory(action + " " + party, type),
      paymentMethod,
      referenceNote: party || action,
      date: dateStr ? parseDate(dateStr) : new Date().toISOString().slice(0, 10),
      rawRow: {},
    });
  }

  if (mobileMatches.length > 0) return mobileMatches;

  // Try table line patterns (bank statements)
  for (const line of lines) {
    const m = tableLinePattern.exec(line);
    if (m) {
      const dateStr = m[1];
      const description = m[2].trim();
      const amount = cleanAmount(m[3]);
      if (amount <= 0) continue;

      const lower = line.toLowerCase();
      const isExpense = /débit|debit|retrait|paiement|achat|sortie|withdrawal|sent|envoy/i.test(lower);
      const type: "income" | "expense" = isExpense ? "expense" : "income";

      transactions.push({
        type,
        amount,
        currency: defaultCurrency,
        category: autoCategory(description, type),
        paymentMethod,
        referenceNote: description.slice(0, 200),
        date: parseDate(dateStr),
        rawRow: {},
      });
    }
  }

  if (transactions.length > 0) return transactions;

  // Fallback: look for any line containing date + amount near income/expense keywords
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasDate = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/.test(line);
    const hasCurrency = /FCFA|XOF|XAF|NGN|GHS|CFA/i.test(line);
    const hasAmount = /\b\d[\d\s,.]{1,12}\b/.test(line);

    if (hasDate && (hasCurrency || hasAmount)) {
      const amountMatch = line.match(/([\d][\d\s,.]*)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)?/i);
      if (!amountMatch) continue;
      const amount = cleanAmount(amountMatch[1]);
      if (amount <= 0 || amount > 100000000) continue;

      const dateMatch = line.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/);
      const dateStr = dateMatch ? dateMatch[0] : "";

      const description = line.replace(amountMatch[0], "").replace(dateMatch?.[0] || "", "").trim();
      const isExpense = /débit|debit|retrait|paiement|sortie|withdrawal|envoy|sent/i.test(line);
      const type: "income" | "expense" = isExpense ? "expense" : "income";

      transactions.push({
        type,
        amount,
        currency: defaultCurrency,
        category: autoCategory(description, type),
        paymentMethod,
        referenceNote: description.slice(0, 200),
        date: dateStr ? parseDate(dateStr) : new Date().toISOString().slice(0, 10),
        rawRow: {},
      });
    }
  }

  return transactions;
}

export async function parsePdfFile(file: File): Promise<PdfParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  const rawText = pageTexts.join("\n");
  const detectedFormat = detectFormat(rawText);
  const transactions = parseTransactions(rawText, detectedFormat);

  return { transactions, detectedFormat, rawText, pageCount };
}
