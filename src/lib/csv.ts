import Papa from "papaparse";
import type { Transaction } from "../types";

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `txn-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

const DATE_HEADERS = ["date", "posted", "posted date", "transaction date", "trans date"];
const DESC_HEADERS = ["description", "memo", "payee", "merchant", "name", "details"];
const AMOUNT_HEADERS = ["amount", "transaction amount", "amt"];
const DEBIT_HEADERS = ["debit", "withdrawal", "withdrawals", "payment", "debit amount"];
const CREDIT_HEADERS = ["credit", "deposit", "deposits", "credit amount"];

function norm(s: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function headerMatches(cell: string, candidates: string[]) {
  const c = norm(cell);
  return candidates.some((cand) => c === cand || c.includes(cand));
}

/** Parses a currency-ish string into a signed number, or null if not numeric. */
export function parseAmount(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  let s = raw.trim();
  if (s === "") return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  s = s.replace(/[$,\s]/g, "");
  if (s === "" || !/^-?\d*\.?\d+$/.test(s)) return null;
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}

/** Parses common bank-export date formats into an ISO yyyy-mm-dd string, or null. */
export function parseDate(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (s === "") return null;

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return isoFrom(+m[1], +m[2], +m[3]);

  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return isoFrom(year, +m[1], +m[2]);
  }

  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return isoFrom(year, +m[1], +m[2]);
  }

  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return isoFrom(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  return null;
}

function isoFrom(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

interface ColumnMap {
  dateCol: number;
  descCol: number;
  amountCol?: number;
  debitCol?: number;
  creditCol?: number;
  dataStartRow: number;
}

function detectHeaderRow(rows: string[][]): ColumnMap | null {
  const scanCount = Math.min(10, rows.length);
  for (let r = 0; r < scanCount; r++) {
    const row = rows[r];
    let dateCol = -1;
    let descCol = -1;
    let amountCol = -1;
    let debitCol = -1;
    let creditCol = -1;
    row.forEach((cell, i) => {
      if (dateCol === -1 && headerMatches(cell, DATE_HEADERS)) dateCol = i;
      else if (descCol === -1 && headerMatches(cell, DESC_HEADERS)) descCol = i;
      else if (amountCol === -1 && headerMatches(cell, AMOUNT_HEADERS)) amountCol = i;
      else if (debitCol === -1 && headerMatches(cell, DEBIT_HEADERS)) debitCol = i;
      else if (creditCol === -1 && headerMatches(cell, CREDIT_HEADERS)) creditCol = i;
    });
    const hasAmount = amountCol !== -1 || (debitCol !== -1 && creditCol !== -1);
    if (dateCol !== -1 && descCol !== -1 && hasAmount) {
      return {
        dateCol,
        descCol,
        amountCol: amountCol !== -1 ? amountCol : undefined,
        debitCol: debitCol !== -1 ? debitCol : undefined,
        creditCol: creditCol !== -1 ? creditCol : undefined,
        dataStartRow: r + 1,
      };
    }
  }
  return null;
}

function inferColumns(rows: string[][]): ColumnMap | null {
  if (rows.length === 0) return null;
  const colCount = Math.max(...rows.map((r) => r.length));
  const sample = rows.slice(0, Math.min(50, rows.length));

  const dateScores: number[] = [];
  const numScores: number[] = [];
  const avgLen: number[] = [];

  for (let c = 0; c < colCount; c++) {
    let dateHits = 0;
    let numHits = 0;
    let totalLen = 0;
    let seen = 0;
    for (const row of sample) {
      const cell = row[c];
      if (cell == null || cell.trim() === "") continue;
      seen++;
      if (parseDate(cell)) dateHits++;
      if (parseAmount(cell) != null) numHits++;
      totalLen += cell.trim().length;
    }
    dateScores[c] = seen ? dateHits / seen : 0;
    numScores[c] = seen ? numHits / seen : 0;
    avgLen[c] = seen ? totalLen / seen : 0;
  }

  let dateCol = -1;
  let best = 0.5;
  dateScores.forEach((score, i) => {
    if (score > best) {
      best = score;
      dateCol = i;
    }
  });
  if (dateCol === -1) return null;

  let amountCol = -1;
  best = 0.5;
  numScores.forEach((score, i) => {
    if (i !== dateCol && score > best) {
      best = score;
      amountCol = i;
    }
  });
  if (amountCol === -1) return null;

  let descCol = -1;
  let bestLen = -1;
  avgLen.forEach((len, i) => {
    if (i !== dateCol && i !== amountCol && len > bestLen) {
      bestLen = len;
      descCol = i;
    }
  });
  if (descCol === -1) return null;

  let dataStartRow = 0;
  const first = rows[0];
  const firstIsData =
    first[dateCol] && parseDate(first[dateCol]) && first[amountCol] && parseAmount(first[amountCol]) != null;
  if (!firstIsData) dataStartRow = 1;

  return { dateCol, descCol, amountCol, dataStartRow };
}

export interface ImportResult {
  account: string;
  rowsRead: number;
  newTransactions: Transaction[];
  duplicateCount: number;
  skippedCount: number;
  error?: string;
}

export function parseCsvText(text: string): string[][] {
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  return (result.data as string[][]).filter((r) => r.some((c) => (c ?? "").trim() !== ""));
}

export function buildDedupeKey(t: Pick<Transaction, "date" | "description" | "amount" | "account">) {
  return `${t.date}|${t.description.trim().toLowerCase()}|${t.amount.toFixed(2)}|${t.account}`;
}

export function importCsv(fileName: string, text: string, existingKeys: Set<string>): ImportResult {
  const account = fileName.replace(/\.csv$/i, "");
  const rows = parseCsvText(text);

  if (rows.length === 0) {
    return { account, rowsRead: 0, newTransactions: [], duplicateCount: 0, skippedCount: 0, error: "File is empty." };
  }

  const map = detectHeaderRow(rows) ?? inferColumns(rows);
  if (!map) {
    return {
      account,
      rowsRead: rows.length,
      newTransactions: [],
      duplicateCount: 0,
      skippedCount: rows.length,
      error: "Couldn't find date, description, and amount columns in this file.",
    };
  }

  const dataRows = rows.slice(map.dataStartRow);
  const rowsRead = dataRows.length;

  interface Parsed {
    date: string;
    description: string;
    signedAmount: number;
    isIncomeCol: boolean; // true if this came from a credit column
  }

  const parsed: Parsed[] = [];
  for (const row of dataRows) {
    const date = parseDate(row[map.dateCol]);
    const description = (row[map.descCol] ?? "").trim();
    if (!date || !description) continue;

    if (map.debitCol !== undefined && map.creditCol !== undefined) {
      const debit = parseAmount(row[map.debitCol]);
      const credit = parseAmount(row[map.creditCol]);
      if (debit != null && debit !== 0) {
        parsed.push({ date, description, signedAmount: Math.abs(debit), isIncomeCol: false });
      } else if (credit != null && credit !== 0) {
        parsed.push({ date, description, signedAmount: Math.abs(credit), isIncomeCol: true });
      }
    } else if (map.amountCol !== undefined) {
      const amt = parseAmount(row[map.amountCol]);
      if (amt != null && amt !== 0) {
        parsed.push({ date, description, signedAmount: amt, isIncomeCol: false });
      }
    }
  }

  // For single-amount-column files, determine which sign is the majority (= spending).
  let majoritySign: 1 | -1 = -1;
  if (map.amountCol !== undefined) {
    let pos = 0;
    let neg = 0;
    for (const p of parsed) {
      if (p.signedAmount > 0) pos++;
      else if (p.signedAmount < 0) neg++;
    }
    majoritySign = pos >= neg ? 1 : -1;
  }

  const newTransactions: Transaction[] = [];
  let duplicateCount = 0;
  const seenThisImport = new Set<string>();

  for (const p of parsed) {
    let isIncome: boolean;
    let amount: number;
    if (map.debitCol !== undefined && map.creditCol !== undefined) {
      isIncome = p.isIncomeCol;
      amount = p.signedAmount;
    } else {
      const sign = p.signedAmount >= 0 ? 1 : -1;
      isIncome = sign !== majoritySign;
      amount = Math.abs(p.signedAmount);
    }

    const txn: Transaction = {
      id: nextId(),
      date: p.date,
      description: p.description,
      amount,
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

  const skippedCount = rowsRead - parsed.length;

  return { account, rowsRead, newTransactions, duplicateCount, skippedCount };
}
