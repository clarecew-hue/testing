import type { Bucket, Transaction } from "../types";
import { BUCKETS } from "../types";

export function inRange(date: string, from: string, to: string) {
  return date >= from && date <= to;
}

export function bucketTotals(transactions: Transaction[], from: string, to: string) {
  const totals: Record<Exclude<Bucket, "">, number> = {
    Needs: 0,
    Wants: 0,
    Debt: 0,
    "Future You": 0,
    Income: 0,
  };
  for (const t of transactions) {
    if (!t.bucket) continue;
    if (!inRange(t.date, from, to)) continue;
    totals[t.bucket] += t.amount;
  }
  return totals;
}

export function daysBetween(from: string, to: string) {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  const diff = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, diff + 1);
}

export function safeToSpendPerWeek(totals: Record<Exclude<Bucket, "">, number>, from: string, to: string) {
  const net = totals.Income - totals.Needs - totals.Debt - totals["Future You"];
  const weeks = daysBetween(from, to) / 7;
  return Math.max(0, net) / weeks;
}

export interface LeakRow {
  category: string;
  total: number;
  count: number;
  average: number;
}

export function topLeaks(transactions: Transaction[], from: string, to: string): LeakRow[] {
  const byCategory = new Map<string, { total: number; count: number }>();
  for (const t of transactions) {
    if (t.bucket !== "Wants") continue;
    if (!inRange(t.date, from, to)) continue;
    const cat = t.category.trim() || "Uncategorized";
    const entry = byCategory.get(cat) ?? { total: 0, count: 0 };
    entry.total += t.amount;
    entry.count += 1;
    byCategory.set(cat, entry);
  }
  return Array.from(byCategory.entries())
    .map(([category, { total, count }]) => ({ category, total, count, average: total / count }))
    .sort((a, b) => b.total - a.total);
}

export function totalSpending(totals: Record<Exclude<Bucket, "">, number>) {
  return totals.Needs + totals.Wants + totals.Debt + totals["Future You"];
}

export function unbucketedCount(transactions: Transaction[]) {
  return transactions.filter((t) => !t.bucket).length;
}

export function fullDateRange(transactions: Transaction[]): { from: string; to: string } {
  if (transactions.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    return { from: today, to: today };
  }
  let min = transactions[0].date;
  let max = transactions[0].date;
  for (const t of transactions) {
    if (t.date < min) min = t.date;
    if (t.date > max) max = t.date;
  }
  return { from: min, to: max };
}

export const BUCKET_ORDER = BUCKETS;
