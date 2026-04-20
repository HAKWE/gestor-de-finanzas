import Papa from "papaparse";

export interface CsvRow {
  [key: string]: string;
}

export interface MappedTransaction {
  type: "income" | "expense";
  amount: number;
  currency: string;
  category: string;
  paymentMethod: string;
  referenceNote: string;
  date: string;
  rawRow: CsvRow;
  error?: string;
}

export interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
  detectedFormat?: string;
  suggestedMapping?: ColumnMapping;
}

export interface ColumnMapping {
  date?: string;
  amount?: string;
  type?: string;
  description?: string;
  reference?: string;
  debit?: string;
  credit?: string;
  currency?: string;
  paymentMethod?: string;
}

// Parse the raw CSV file
export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete(results) {
        const headers = results.meta.fields ?? [];
        const rows = results.data as CsvRow[];

        resolve({
          headers,
          rows,
          detectedFormat: detectFormat(headers),
          suggestedMapping: autoMap(headers),
        });
      },
      error(err) {
        reject(new Error(err.message));
      },
    });
  });
}

// Try to detect known statement formats
function detectFormat(headers: string[]): string {
  const lower = headers.map((h) => h.toLowerCase());
  if (lower.some((h) => h.includes("mtn") || h.includes("momo"))) return "MTN MoMo";
  if (lower.some((h) => h.includes("wave"))) return "Wave";
  if (lower.some((h) => h.includes("orange"))) return "Orange Money";
  return "Generic";
}

// Auto-map columns based on common header names
export function autoMap(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const lower = headers.map((h) => h.toLowerCase().trim());

  const find = (keywords: string[]) =>
    headers[lower.findIndex((h) => keywords.some((kw) => h.includes(kw)))] ?? undefined;

  mapping.date = find(["date", "datum", "jour"]);
  mapping.amount = find(["amount", "montant", "sum", "total"]);
  mapping.type = find(["type", "nature", "sens"]);
  mapping.description = find(["description", "detail", "label", "libelle", "libellé", "note", "memo"]);
  mapping.reference = find(["ref", "reference", "transaction id", "txnid", "id"]);
  mapping.debit = find(["debit", "débit", "out", "sortie", "withdrawal", "sent"]);
  mapping.credit = find(["credit", "crédit", "in", "entrée", "received", "deposit"]);
  mapping.currency = find(["currency", "devise", "monnaie"]);
  mapping.paymentMethod = find(["method", "mode", "canal", "channel", "moyen"]);

  return mapping;
}

// Apply mapping to convert rows into transaction objects
export function mapRows(
  rows: CsvRow[],
  mapping: ColumnMapping,
  defaultCurrency = "XOF",
  defaultPaymentMethod = "Other"
): MappedTransaction[] {
  return rows.map((row): MappedTransaction => {
    try {
      // Determine amount and type
      let amount = 0;
      let type: "income" | "expense" = "income";

      if (mapping.debit && mapping.credit) {
        // Separate debit/credit columns
        const credit = parseFloat((row[mapping.credit] ?? "").replace(/[\s,.]/g, "").replace(",", ".")) || 0;
        const debit = parseFloat((row[mapping.debit] ?? "").replace(/[\s,.]/g, "").replace(",", ".")) || 0;
        if (credit > 0) {
          amount = credit;
          type = "income";
        } else if (debit > 0) {
          amount = debit;
          type = "expense";
        }
      } else if (mapping.amount) {
        const raw = (row[mapping.amount] ?? "").replace(/\s/g, "").replace(",", ".");
        amount = Math.abs(parseFloat(raw)) || 0;

        // Use type column or infer from sign
        if (mapping.type) {
          const t = (row[mapping.type] ?? "").toLowerCase();
          type = /credit|income|re[çc]u|received|entrée|in|deposit/i.test(t) ? "income" : "expense";
        } else {
          type = (parseFloat(raw) ?? 0) >= 0 ? "income" : "expense";
        }
      }

      if (amount <= 0) {
        return { type, amount, currency: defaultCurrency, category: "", paymentMethod: defaultPaymentMethod, referenceNote: "", date: "", rawRow: row, error: "Amount is zero or missing" };
      }

      // Date
      let date = new Date().toISOString().slice(0, 10);
      if (mapping.date && row[mapping.date]) {
        const raw = row[mapping.date].trim();
        // Try ISO
        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
          date = raw.slice(0, 10);
        } else {
          // Try DD/MM/YYYY or DD-MM-YYYY
          const m = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
          if (m) {
            const year = m[3].length === 2 ? `20${m[3]}` : m[3];
            date = `${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
          } else {
            // Try MM/DD/YYYY
            const d = new Date(raw);
            if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
          }
        }
      }

      // Description / reference
      const desc = (mapping.description && row[mapping.description]) ?? "";
      const ref = (mapping.reference && row[mapping.reference]) ?? "";
      const referenceNote = [ref, desc].filter(Boolean).join(" - ").slice(0, 200);

      // Currency
      const currency = (mapping.currency && row[mapping.currency]) ? row[mapping.currency].trim().toUpperCase() : defaultCurrency;

      // Payment method
      const pm = (mapping.paymentMethod && row[mapping.paymentMethod]) ?? defaultPaymentMethod;

      // Auto-categorize from description
      const lower = desc.toLowerCase();
      let category = type === "income" ? "Vente produit" : "Autre";
      if (/achat|stock|fourniture/i.test(lower) && type === "expense") category = "Achat stock";
      if (/transport|taxi|moto|bus/i.test(lower)) category = "Transport";
      if (/loyer|bail/i.test(lower)) category = "Loyer";
      if (/eau|electricit|courant/i.test(lower)) category = "Eau/Électricité";
      if (/nourriture|repas|food/i.test(lower)) category = "Nourriture";

      return { type, amount, currency, category, paymentMethod: pm, referenceNote, date, rawRow: row };
    } catch {
      return {
        type: "income", amount: 0, currency: defaultCurrency, category: "",
        paymentMethod: defaultPaymentMethod, referenceNote: "", date: "", rawRow: row,
        error: "Failed to parse row",
      };
    }
  }).filter((t) => !t.error && t.amount > 0);
}
