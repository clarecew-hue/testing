import { useRef, useState } from "react";
import Card from "../components/Card";
import { useAppData } from "../context/AppContext";
import { buildDedupeKey, importCsv, type ImportResult } from "../lib/csv";
import { matchRule } from "../lib/rules";
import type { Transaction } from "../types";

export default function Upload() {
  const { transactions, setTransactions, rules } = useAppData();
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => /\.(csv|pdf)$/i.test(f.name));
    if (files.length === 0) return;

    setBusy(true);
    const existingKeys = new Set(transactions.map(buildDedupeKey));
    const allResults: ImportResult[] = [];
    const allNew: Transaction[] = [];

    for (const file of files) {
      const result = file.name.toLowerCase().endsWith(".pdf")
        ? await (await import("../lib/pdf")).importPdf(file.name, file, existingKeys)
        : importCsv(file.name, await file.text(), existingKeys);
      allResults.push(result);
      allNew.push(...result.newTransactions);
    }

    const categorizedNew = allNew.map((t) => {
      if (t.bucket) return t; // already auto-detected as Income
      const match = matchRule(t.description, rules);
      if (!match) return t;
      return { ...t, bucket: match.bucket, category: t.category || match.category };
    });

    setTransactions((prev) => [...prev, ...categorizedNew]);
    setResults(allResults);
    setBusy(false);
  }

  const totalNew = results?.reduce((sum, r) => sum + r.newTransactions.length, 0) ?? 0;
  const totalDupes = results?.reduce((sum, r) => sum + r.duplicateCount, 0) ?? 0;
  const totalFiles = results?.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-[#0D4A4B]">Upload your statements</h1>
        <p className="mt-1 text-[#0D4A4B]/70">
          Drop in CSV or PDF exports from every account — checking, savings, each credit card. We'll
          figure out the columns automatically.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition ${
          dragging ? "border-[#00787F] bg-[#D5EAEB]/50" : "border-[#00787F]/40 bg-white/50"
        }`}
      >
        <div className="text-4xl">📄</div>
        <p className="mt-3 font-semibold text-[#0D4A4B]">
          Drag & drop CSV or PDF statements here, or click to browse
        </p>
        <p className="mt-1 text-sm text-[#0D4A4B]/60">
          You can select as many files at once as you'd like.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {busy && <p className="text-center text-[#0D4A4B]/70">Reading files…</p>}

      {results && !busy && (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0D4A4B]">Import summary</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-[#D5EAEB]/50 p-3">
              <div className="text-2xl font-bold text-[#0D4A4B]">{totalFiles}</div>
              <div className="text-xs text-[#0D4A4B]/70">files read</div>
            </div>
            <div className="rounded-xl bg-[#E4EDC9]/50 p-3">
              <div className="text-2xl font-bold text-[#0D4A4B]">{totalNew}</div>
              <div className="text-xs text-[#0D4A4B]/70">new transactions</div>
            </div>
            <div className="rounded-xl bg-[#EDEDED]/70 p-3">
              <div className="text-2xl font-bold text-[#0D4A4B]">{totalDupes}</div>
              <div className="text-xs text-[#0D4A4B]/70">duplicates skipped</div>
            </div>
          </div>

          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-black/5 p-3 text-sm">
                <div className="font-semibold text-[#0D4A4B]">{r.account}</div>
                {r.error ? (
                  <div className="text-[#8a2323]">{r.error}</div>
                ) : (
                  <div className="text-[#0D4A4B]/70">
                    {r.rowsRead} rows read · {r.newTransactions.length} new ·{" "}
                    {r.duplicateCount} duplicates
                    {r.skippedCount > 0 ? ` · ${r.skippedCount} unreadable rows skipped` : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="text-sm text-[#0D4A4B]" style={{ backgroundColor: "rgba(253,243,192,0.4)" }}>
          <p className="font-semibold">A tip before you upload credit card statements:</p>
          <p className="mt-1 text-[#0D4A4B]/80">
            Delete or ignore any "payment received" rows on a credit card statement — that payment
            already shows up as spending in your checking account, and counting it twice inflates your
            Income number.
          </p>
        </Card>
        <Card className="text-sm text-[#0D4A4B]" style={{ backgroundColor: "rgba(213,234,235,0.4)" }}>
          <p className="font-semibold">A note on PDF statements:</p>
          <p className="mt-1 text-[#0D4A4B]/80">
            PDFs aren't structured data, so we do our best to read each line — it won't be quite as
            reliable as a CSV. Give the Transactions page a quick look afterward to fix any rows that
            landed wrong. If your bank offers a CSV export, that'll always be the sure bet.
          </p>
        </Card>
      </div>
    </div>
  );
}
