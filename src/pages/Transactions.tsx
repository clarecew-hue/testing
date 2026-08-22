import { useMemo, useState } from "react";
import Card from "../components/Card";
import { useAppData } from "../context/AppContext";
import { matchRule } from "../lib/rules";
import { BUCKET_COLORS, BUCKETS, type Bucket, type Transaction } from "../types";
import { formatDateShort, moneyPrecise } from "../lib/format";

export default function Transactions() {
  const { transactions, setTransactions, rules, accounts } = useAppData();

  const [accountFilter, setAccountFilter] = useState("");
  const [bucketFilter, setBucketFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    rules.forEach((r) => r.category && set.add(r.category));
    transactions.forEach((t) => t.category && set.add(t.category));
    return Array.from(set).sort();
  }, [rules, transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => !accountFilter || t.account === accountFilter)
      .filter((t) => !bucketFilter || (bucketFilter === "Unbucketed" ? !t.bucket : t.bucket === bucketFilter))
      .filter((t) => !fromFilter || t.date >= fromFilter)
      .filter((t) => !toFilter || t.date <= toFilter)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [transactions, accountFilter, bucketFilter, fromFilter, toFilter]);

  const unbucketedCount = transactions.filter((t) => !t.bucket).length;

  function updateTransaction(id: string, patch: Partial<Transaction>) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function autoCategorize() {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.bucketSetByUser) return t;
        const match = matchRule(t.description, rules);
        if (!match) return t;
        return { ...t, bucket: match.bucket, category: t.category || match.category };
      })
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[#0D4A4B]">Transactions</h1>
          <p className="text-[#0D4A4B]/70">Sort each one into a bucket. Watch the highlighter do its thing.</p>
        </div>
        <button
          onClick={autoCategorize}
          className="rounded-full bg-[#00787F] px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#0D4A4B]"
        >
          ✨ Auto-Categorize
        </button>
      </div>

      <div
        className={`rounded-xl p-3 text-center font-semibold ${
          unbucketedCount > 0 ? "bg-[#FFDCDC] text-[#8a2323]" : "bg-[#E4EDC9] text-[#3d4f01]"
        }`}
      >
        {unbucketedCount > 0
          ? `${unbucketedCount} transaction${unbucketedCount === 1 ? "" : "s"} still need a bucket.`
          : "Every transaction has a bucket. Nice work."}
      </div>

      <Card className="flex flex-wrap gap-3">
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#0D4A4B]"
        >
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={bucketFilter}
          onChange={(e) => setBucketFilter(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#0D4A4B]"
        >
          <option value="">All buckets</option>
          <option value="Unbucketed">Unbucketed</option>
          {BUCKETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[#0D4A4B]">
          From
          <input
            type="date"
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-2 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-[#0D4A4B]">
          To
          <input
            type="date"
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-2 py-2"
          />
        </label>
        {(accountFilter || bucketFilter || fromFilter || toFilter) && (
          <button
            onClick={() => {
              setAccountFilter("");
              setBucketFilter("");
              setFromFilter("");
              setToFilter("");
            }}
            className="text-sm font-semibold text-[#00787F] underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto self-center text-sm text-[#0D4A4B]/60">
          {filtered.length} of {transactions.length} transactions
        </span>
      </Card>

      {transactions.length === 0 ? (
        <Card className="text-center text-[#0D4A4B]/70">
          No transactions yet. Head to Upload to import your first CSV.
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white/70 shadow-sm">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-[#0D4A4B]/60">
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3">Account</th>
                <th className="px-3 py-3">Bucket</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const colors = t.bucket ? BUCKET_COLORS[t.bucket] : null;
                return (
                  <tr
                    key={t.id}
                    className="border-b border-black/5 transition-colors last:border-0"
                    style={{ backgroundColor: colors?.bg }}
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-[#0D4A4B]/80">
                      {formatDateShort(t.date)}
                    </td>
                    <td className="px-3 py-2 text-[#0D4A4B]">{t.description}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-[#0D4A4B]">
                      {moneyPrecise(t.amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[#0D4A4B]/80">{t.account}</td>
                    <td className="px-3 py-2">
                      <select
                        value={t.bucket}
                        onChange={(e) =>
                          updateTransaction(t.id, {
                            bucket: e.target.value as Bucket,
                            bucketSetByUser: true,
                          })
                        }
                        className="w-full rounded-lg border border-black/10 bg-white/90 px-2 py-1.5 text-sm"
                      >
                        <option value="">Choose…</option>
                        {BUCKETS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        list="category-options"
                        value={t.category}
                        onChange={(e) => updateTransaction(t.id, { category: e.target.value })}
                        placeholder="Category"
                        className="w-full rounded-lg border border-black/10 bg-white/90 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={t.notes}
                        onChange={(e) => updateTransaction(t.id, { notes: e.target.value })}
                        placeholder="Notes"
                        className="w-full rounded-lg border border-black/10 bg-white/90 px-2 py-1.5 text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <datalist id="category-options">
            {categoryOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      )}
    </div>
  );
}
