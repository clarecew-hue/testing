import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { Transaction } from "../types";
import { buildDedupeKey, parseAmount, parseDate, type ImportResult } from "./csv";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `pdftxn-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

const DATE_TOKEN_RE =
  /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{1,2}-\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,?\s*\d{2,4})?)\b/i;

const AMOUNT_TOKEN_RE = /\(?-?\$?\d{1,3}(?:,\d{3})*\.\d{2}\)?/g;

// Summary/header rows that happen to contain a date and an amount but aren't transactions.
const SKIP_LINE_SUBSTRINGS = [
  "beginning balance",
  "ending balance",
  "previous balance",
  "new balance",
  "opening balance",
  "closing balance",
  "total fees",
  "total interest",
  "minimum payment",
  "statement period",
  "account number",
  "subtotal",
  "page ",
];

// PDF statements rarely mark direction with a sign the way CSVs do, so unsigned
// amounts fall back to keyword matching against common deposit language.
const INCOME_KEYWORDS = ["PAYROLL", "DIRECT DEP", "DEPOSIT", "REFUND", "INTEREST PAID", "REVERSAL", "ACH CREDIT"];

interface PdfLine {
  date: string;
  description: string;
  signedAmount: number;
  hasExplicitSign: boolean;
}

async function extractLines(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const lines: string[] = [];

  interface Item {
    str: string;
    x: number;
    y: number;
  }

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items: Item[] = [];
    for (const raw of content.items as unknown as { str?: string; transform: number[] }[]) {
      if (raw.str && raw.str.trim() !== "") {
        items.push({ str: raw.str, x: raw.transform[4], y: raw.transform[5] });
      }
    }
    // Reconstruct reading order: top-to-bottom, then left-to-right within a line.
    items.sort((a, b) => b.y - a.y || a.x - b.x);

    const rows: Item[][] = [];
    const Y_TOLERANCE = 2.5;
    for (const item of items) {
      const row = rows.find((r) => Math.abs(r[0].y - item.y) < Y_TOLERANCE);
      if (row) row.push(item);
      else rows.push([item]);
    }
    for (const row of rows) {
      row.sort((a, b) => a.x - b.x);
      const text = row
        .map((r) => r.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) lines.push(text);
    }
  }

  return lines;
}

function parseLine(line: string): PdfLine | null {
  const lower = line.toLowerCase();
  if (SKIP_LINE_SUBSTRINGS.some((s) => lower.includes(s))) return null;

  const dateMatch = DATE_TOKEN_RE.exec(line);
  if (!dateMatch || dateMatch.index > 25) return null;
  const date = parseDate(dateMatch[0]);
  if (!date) return null;

  const amountMatches = Array.from(line.matchAll(AMOUNT_TOKEN_RE));
  if (amountMatches.length === 0) return null;

  // Statement rows are typically Date | Description | Amount [| Balance], so the
  // first amount after the description is the transaction; later ones are balance.
  const firstAmountText = amountMatches[0][0];
  const signedAmount = parseAmount(firstAmountText);
  if (signedAmount == null) return null;
  const hasExplicitSign = /^\(.*\)$/.test(firstAmountText) || firstAmountText.trim().startsWith("-");

  let description = line.slice(0, dateMatch.index) + line.slice(dateMatch.index + dateMatch[0].length);
  for (const m of amountMatches) {
    description = description.split(m[0]).join(" ");
  }
  description = description.replace(/\s+/g, " ").trim();
  if (!description) return null;

  return { date, description, signedAmount, hasExplicitSign };
}

export async function importPdf(fileName: string, file: File, existingKeys: Set<string>): Promise<ImportResult> {
  const account = fileName.replace(/\.pdf$/i, "");

  let lines: string[];
  try {
    lines = await extractLines(file);
  } catch {
    return {
      account,
      rowsRead: 0,
      newTransactions: [],
      duplicateCount: 0,
      skippedCount: 0,
      error: "Couldn't read this PDF — it may be a scanned image rather than a text-based statement.",
    };
  }

  const parsedLines = lines.map(parseLine).filter((l): l is PdfLine => l !== null);

  if (parsedLines.length === 0) {
    return {
      account,
      rowsRead: lines.length,
      newTransactions: [],
      duplicateCount: 0,
      skippedCount: lines.length,
      error: "Couldn't find any transaction rows in this PDF. A CSV export, if your bank offers one, will be more reliable.",
    };
  }

  let pos = 0;
  let neg = 0;
  for (const l of parsedLines) {
    if (!l.hasExplicitSign) continue;
    if (l.signedAmount >= 0) pos++;
    else neg++;
  }
  const majoritySign: 1 | -1 = pos >= neg ? 1 : -1;

  const newTransactions: Transaction[] = [];
  let duplicateCount = 0;
  const seenThisImport = new Set<string>();

  for (const l of parsedLines) {
    const isIncome = l.hasExplicitSign
      ? (l.signedAmount >= 0 ? 1 : -1) !== majoritySign
      : INCOME_KEYWORDS.some((kw) => l.description.toUpperCase().includes(kw));

    const txn: Transaction = {
      id: nextId(),
      date: l.date,
      description: l.description,
      amount: Math.abs(l.signedAmount),
      account,
      bucket: isIncome ? "Income" : "",
      category: isIncome ? "Paycheck" : "",
      notes: "",
    };

    const key = buildDedupeKey(txn);
    if (existingKeys.has(key) || seenThisImport.has(key)) {
      duplicateCount++;
      continue;
    }
    seenThisImport.add(key);
    existingKeys.add(key);
    newTransactions.push(txn);
  }

  return {
    account,
    rowsRead: lines.length,
    newTransactions,
    duplicateCount,
    skippedCount: lines.length - parsedLines.length,
  };
}
