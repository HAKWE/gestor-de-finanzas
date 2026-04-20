export interface ParsedSmsTransaction {
  type: "income" | "expense";
  amount: number;
  currency: string;
  paymentMethod: string;
  category: string;
  referenceNote: string;
  date: string;
  confidence: "high" | "medium" | "low";
  rawSms: string;
  detectedService?: string;
}

function cleanAmount(raw: string): number {
  // Remove thousand separators (spaces, dots used as thousands in French)
  // Handle comma as decimal or as thousands
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function parseCurrency(sms: string): string {
  if (/\bXOF\b/i.test(sms)) return "XOF";
  if (/\bXAF\b/i.test(sms)) return "XAF";
  if (/\bNGN\b/i.test(sms)) return "NGN";
  if (/\bGHS\b/i.test(sms)) return "GHS";
  if (/FCFA|CFA/i.test(sms)) return "XOF";
  if (/naira/i.test(sms)) return "NGN";
  return "XOF";
}

function parseDate(sms: string): string {
  const today = new Date().toISOString().slice(0, 10);

  // ISO: YYYY-MM-DD
  const iso = sms.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];

  // French: DD/MM/YYYY or DD/MM/YY
  const dmy = sms.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // DD-MM-YYYY
  const dmy2 = sms.match(/\b(\d{1,2})-(\d{1,2})-(\d{2,4})\b/);
  if (dmy2) {
    const [, d, m, y] = dmy2;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return today;
}

function detectService(sms: string): string {
  const lower = sms.toLowerCase();
  if (lower.includes("orange money") || (lower.includes("orange") && lower.includes("money"))) return "Orange Money";
  if (lower.includes("wave")) return "Wave";
  if (lower.includes("mtn") && (lower.includes("momo") || lower.includes("mobile money"))) return "MTN MoMo";
  if (lower.includes("mtn")) return "MTN MoMo";
  if (lower.includes("momo")) return "MTN MoMo";
  if (lower.includes("airtel")) return "Other";
  if (lower.includes("moov")) return "Other";
  if (lower.includes("free money")) return "Other";
  return "Other";
}

function autoCategory(sms: string, type: "income" | "expense", service: string): string {
  const lower = sms.toLowerCase();
  if (type === "income") {
    if (service === "Orange Money") return "Orange Money reçu";
    if (service === "Wave") return "Wave reçu";
    if (service === "MTN MoMo") return "MTN MoMo reçu";
    if (/coiff|salon|beauty|tress/i.test(lower)) return "Service coiffeuse";
    return "Vente produit";
  } else {
    if (/stock|achat|commande|fourniture/i.test(lower)) return "Achat stock";
    if (/transport|taxi|moto|bus|car/i.test(lower)) return "Transport";
    if (/loyer|bail|rent/i.test(lower)) return "Loyer";
    if (/eau|electricit|courant|lumière|water|electric/i.test(lower)) return "Eau/Électricité";
    if (/nourriture|repas|manger|food|repas/i.test(lower)) return "Nourriture";
    return "Autre";
  }
}

function extractReference(sms: string): string {
  const refs: string[] = [];

  // Reference number
  const refMatch = sms.match(/\bref[:\s#]*([A-Z0-9]{4,})/i) ||
    sms.match(/\btxn[Ii]d[:\s]*([A-Z0-9]+)/i) ||
    sms.match(/\btransaction\s*(?:id|#)[:\s]*([A-Z0-9]+)/i) ||
    sms.match(/\bid[:\s]*([A-Z0-9]{6,})/i);
  if (refMatch) refs.push(refMatch[1]);

  // Counterparty from "de X" or "from X"
  const fromFr = sms.match(/\bde\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåæçèéêëìíîïòóôõöùúûüý]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåæçèéêëìíîïòóôõöùúûüý]+)*)/);
  const fromEn = sms.match(/\bfrom\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  const toFr = sms.match(/\b(?:à|vers)\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåæçèéêëìíîïòóôõöùúûüý]+(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ][a-zàáâãäåæçèéêëìíîïòóôõöùúûüý]+)*)/);
  const toEn = sms.match(/\bto\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);

  const person = fromFr?.[1] || fromEn?.[1] || toFr?.[1] || toEn?.[1];
  if (person && !["vous", "votre", "your", "the", "a"].includes(person.toLowerCase())) {
    refs.push(person);
  }

  return refs.join(" - ");
}

// Amount extraction patterns ordered by specificity
const RECEIVED_PATTERNS: RegExp[] = [
  // French Orange Money / Wave: "vous avez reçu 5 000 FCFA"
  /(?:avez?|avons?)\s+re[çc]u[e]?\s+([\d\s,.]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)/i,
  // French generic received
  /re[çc]u[e]?\s+([\d\s,.]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)/i,
  // English MTN: "You have received GHS 50"
  /(?:you\s+have\s+)?received\s+(?:[A-Z]{3}\s+)?([\d,.\s]+)/i,
  // English: "credited XAF 5,000"
  /credited\s+(?:[A-Z]{3}\s+)?([\d,.\s]+)/i,
  // "incoming transfer of XOF"
  /incoming.*?([\d,.\s]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)/i,
  // "deposit of" 
  /deposit(?:ed)?\s+(?:of\s+)?(?:[A-Z]{3}\s+)?([\d,.\s]+)/i,
  // "paiement reçu de"
  /paiement\s+re[çc]u.*?([\d\s,.]+)\s*(?:FCFA|XOF|XAF)/i,
];

const SENT_PATTERNS: RegExp[] = [
  // French: "vous avez envoyé 5 000 FCFA"
  /(?:avez?|avons?)\s+envoy[eé][e]?\s+([\d\s,.]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)/i,
  // French generic sent
  /envoy[eé][e]?\s+([\d\s,.]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)/i,
  // "transfert de X FCFA"
  /transfert\s+de\s+([\d\s,.]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)/i,
  // "vous avez payé"
  /(?:avez?|avons?)\s+pay[eé][e]?\s+([\d\s,.]+)/i,
  // English: "sent GHS 50"
  /sent\s+(?:[A-Z]{3}\s+)?([\d,.\s]+)/i,
  // "debited XAF 5,000"
  /debited\s+(?:[A-Z]{3}\s+)?([\d,.\s]+)/i,
  // "withdrawal of"
  /withdrawal\s+(?:of\s+)?(?:[A-Z]{3}\s+)?([\d,.\s]+)/i,
  // "achat de X FCFA"
  /achat\s+de\s+([\d\s,.]+)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)/i,
  // "retrait de X"
  /retrait\s+de\s+([\d\s,.]+)/i,
  // "paiement de X FCFA effectué"
  /paiement\s+de\s+([\d\s,.]+)\s*(?:FCFA|XOF|XAF)/i,
];

export function parseSms(rawSms: string): ParsedSmsTransaction | null {
  const sms = rawSms.trim();
  if (!sms) return null;

  let type: "income" | "expense" | null = null;
  let amount: number | null = null;
  let confidence: "high" | "medium" | "low" = "medium";

  // Try received patterns
  for (const pattern of RECEIVED_PATTERNS) {
    const match = sms.match(pattern);
    if (match) {
      const parsed = cleanAmount(match[1]);
      if (parsed > 0) {
        type = "income";
        amount = parsed;
        confidence = "high";
        break;
      }
    }
  }

  // Try sent patterns
  if (!type) {
    for (const pattern of SENT_PATTERNS) {
      const match = sms.match(pattern);
      if (match) {
        const parsed = cleanAmount(match[1]);
        if (parsed > 0) {
          type = "expense";
          amount = parsed;
          confidence = "high";
          break;
        }
      }
    }
  }

  // Fallback: find any amount with currency label
  if (!amount) {
    const amountWithCurrency = sms.match(/([\d][\d\s,.]*)\s*(?:FCFA|XOF|XAF|NGN|GHS|CFA)\b/i);
    if (amountWithCurrency) {
      amount = cleanAmount(amountWithCurrency[1]);
      confidence = "low";
    }
  }

  if (!amount || amount <= 0) return null;

  // Determine type from keywords if still unknown
  if (!type) {
    const lower = sms.toLowerCase();
    const incomeKeywords = /re[çc]u|received|credit|incoming|deposit|paiement.{0,20}re[çc]u/i;
    const expenseKeywords = /envo[yi]|transfert|sent|debit|retrait|paiement|achat|pay[eé]|withdrawal/i;
    if (incomeKeywords.test(lower)) {
      type = "income";
      confidence = confidence === "low" ? "low" : "medium";
    } else if (expenseKeywords.test(lower)) {
      type = "expense";
      confidence = confidence === "low" ? "low" : "medium";
    } else {
      type = "income";
      confidence = "low";
    }
  }

  const service = detectService(sms);

  return {
    type,
    amount,
    currency: parseCurrency(sms),
    paymentMethod: service === "Other" ? "Cash" : service,
    category: autoCategory(sms, type, service),
    referenceNote: extractReference(sms),
    date: parseDate(sms),
    confidence,
    rawSms,
    detectedService: service,
  };
}

// Parse multiple SMS messages (one per line or separated by blank lines)
export function parseMultipleSms(text: string): ParsedSmsTransaction[] {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length > 1) {
    return blocks.map(parseSms).filter(Boolean) as ParsedSmsTransaction[];
  }

  // Single SMS
  const result = parseSms(text);
  return result ? [result] : [];
}
