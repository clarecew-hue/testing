import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import Card from "../components/Card";
import { useAppData } from "../context/AppContext";
import {
  bucketTotals,
  daysBetween,
  fullDateRange,
  safeToSpendPerWeek,
  topLeaks,
  totalSpending,
  unbucketedCount,
} from "../lib/calc";
import { money, moneyPrecise, pct } from "../lib/format";
import { BUCKET_COLORS, type Bucket, type ResetScorecard } from "../types";

const SPENDING_BUCKETS: Exclude<Bucket, "" | "Income">[] = ["Needs", "Wants", "Debt", "Future You"];

const WEEK3_ITEMS = [
  "Know my weekly spendable number (see Your One Number above)",
  "Moved that amount to a separate account or card for the week",
  "Spent guilt-free from ONLY that account — nothing else",
  "When it hit $0, stopped until next week — no judgment",
  "Used the 24-hour rule on any unplanned purchase over $50",
];

const WEEK4_ITEMS = [
  "Reviewed the month and noted which bucket surprised me most",
  "Picked ONE leak category and set a specific cap for next month",
  "Named my savings account after its purpose",
  "Put a monthly Money Date on the calendar — same day, every month",
  "Thought about what I want my money to build, long-term",
];

export default function Dashboard() {
  const { transactions, checklist, setChecklist, beforeReset, setBeforeReset } = useAppData();
  const fullRange = useMemo(() => fullDateRange(transactions), [transactions]);

  const [from, setFrom] = useState(fullRange.from);
  const [to, setTo] = useState(fullRange.to);

  // Keep the range in sync when a fresh import changes the available data and
  // the user hasn't customized it yet.
  const effectiveFrom = from || fullRange.from;
  const effectiveTo = to || fullRange.to;

  const totals = useMemo(
    () => bucketTotals(transactions, effectiveFrom, effectiveTo),
    [transactions, effectiveFrom, effectiveTo]
  );
  const spending = totalSpending(totals);
  const weeklySafe = safeToSpendPerWeek(totals, effectiveFrom, effectiveTo);
  const leaks = useMemo(
    () => topLeaks(transactions, effectiveFrom, effectiveTo),
    [transactions, effectiveFrom, effectiveTo]
  );
  const missingBuckets = unbucketedCount(transactions);

  const donutData = SPENDING_BUCKETS.map((b) => ({ name: b, value: totals[b] })).filter((d) => d.value > 0);

  const leftToSpend = totals.Income - totals.Needs - totals.Debt - totals["Future You"];
  const weeksInRange = daysBetween(effectiveFrom, effectiveTo) / 7;
  const weeksLabel = weeksInRange % 1 === 0 ? String(weeksInRange) : weeksInRange.toFixed(1);

  const scorecardRows: { key: keyof ResetScorecard; label: string; after: number }[] = [
    { key: "needs", label: "Needs", after: totals.Needs },
    { key: "wants", label: "Wants", after: totals.Wants },
    { key: "debt", label: "Debt", after: totals.Debt },
    { key: "futureYou", label: "Future You", after: totals["Future You"] },
    { key: "weeklySpendable", label: "Weekly spendable number", after: weeklySafe },
  ];

  function updateBeforeReset(key: keyof ResetScorecard, value: string) {
    setBeforeReset((prev) => ({ ...prev, [key]: value === "" ? "" : parseFloat(value) }));
  }

  function toggleWeek(week: "week3" | "week4", index: number) {
    setChecklist((prev) => ({
      ...prev,
      [week]: { ...(prev[week] ?? {}), [index]: !prev[week]?.[index] },
    }));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#0D4A4B]">Your 30-Day Picture</h1>
          <p className="text-[#0D4A4B]/70">The four numbers that tell you where your money actually goes.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#0D4A4B]">
          <label className="flex items-center gap-2">
            From
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-2 py-1.5"
            />
          </label>
          <label className="flex items-center gap-2">
            To
            <input
              type="date"
              value={effectiveTo}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-black/10 bg-white px-2 py-1.5"
            />
          </label>
        </div>
      </div>

      <StatusBanner transactionCount={transactions.length} missingBuckets={missingBuckets} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {SPENDING_BUCKETS.map((b) => (
          <BucketCard key={b} bucket={b} total={totals[b]} percent={spending > 0 ? (totals[b] / spending) * 100 : 0} />
        ))}
        <Card className="border-black/5" style={{ backgroundColor: BUCKET_COLORS.Income.bg }}>
          <div className="text-sm font-semibold" style={{ color: BUCKET_COLORS.Income.text }}>
            Income
          </div>
          <div className="mt-1 text-2xl font-bold" style={{ color: BUCKET_COLORS.Income.text }}>
            {money(totals.Income)}
          </div>
          <div className="mt-1 text-xs opacity-70" style={{ color: BUCKET_COLORS.Income.text }}>
            total in range
          </div>
        </Card>
      </div>

      <Card className="text-center text-white" style={{ backgroundColor: "#00787F" }}>
        <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Your One Number</div>
        <div className="mt-2 text-5xl font-bold">{money(weeklySafe)}</div>
        <div className="mt-2 text-white/90">safe to spend on Wants each week</div>

        <div className="mx-auto mt-6 max-w-xs rounded-xl bg-white/10 p-4 text-left text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/70">
            Week 3: here's the math
          </p>
          <MathRow label="Income" value={totals.Income} />
          <MathRow label="− Needs" value={totals.Needs} />
          <MathRow label="− Debt" value={totals.Debt} />
          <MathRow label="− Future You" value={totals["Future You"]} />
          <MathRow label="= Left to spend" value={leftToSpend} divider bold />
          <MathRow label={`÷ ${weeksLabel} weeks in range`} />
          <MathRow label="= Weekly number" value={weeklySafe} divider bold />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-[#0D4A4B]">Spending by bucket</h2>
          {donutData.length === 0 ? (
            <p className="text-[#0D4A4B]/60">Nothing bucketed in this date range yet.</p>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-56 w-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="60%"
                      outerRadius="95%"
                      paddingAngle={2}
                      stroke="#FCF8F1"
                      strokeWidth={2}
                    >
                      {donutData.map((d) => (
                        <Cell key={d.name} fill={BUCKET_COLORS[d.name].solid} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [moneyPrecise(Number(value)), String(name)]}
                      contentStyle={{ borderRadius: 12, borderColor: "#00000015", fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: BUCKET_COLORS[d.name].solid }}
                      />
                      <span className="font-medium text-[#0D4A4B]">{d.name}</span>
                    </div>
                    <div className="text-[#0D4A4B]/80">
                      {money(d.value)} · {pct(spending > 0 ? (d.value / spending) * 100 : 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-semibold text-[#0D4A4B]">Top Leaks</h2>
          <p className="mb-3 text-sm text-[#0D4A4B]/60">
            Circle your top 3. These are where the money is quietly disappearing.
          </p>
          {leaks.length === 0 ? (
            <p className="text-[#0D4A4B]/60">No Wants transactions in this date range yet.</p>
          ) : (
            <div className="space-y-2">
              {leaks.map((leak, i) => (
                <div
                  key={leak.category}
                  className="flex items-center justify-between gap-3 rounded-lg bg-[#FDF3C0]/50 p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {i < 3 && (
                      <span className="rounded-full bg-[#FF6B6B] px-2 py-0.5 text-xs font-bold text-white">
                        LEAK
                      </span>
                    )}
                    <span className="font-medium text-[#0D4A4B]">{leak.category}</span>
                  </div>
                  <div className="text-right text-[#0D4A4B]/80">
                    <div className="font-semibold text-[#0D4A4B]">{money(leak.total)}</div>
                    <div className="text-xs">
                      {leak.count}× · avg {moneyPrecise(leak.average)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-1 text-lg font-semibold text-[#0D4A4B]">Your Reset Scorecard</h2>
        <p className="mb-3 text-sm text-[#0D4A4B]/60">
          Week 4: fill in what things looked like before you started — "After Reset" updates itself from
          your data above.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-[#0D4A4B]/60">
                <th className="py-2 pr-2">Bucket</th>
                <th className="py-2 pr-2">Before Reset</th>
                <th className="py-2">After Reset</th>
              </tr>
            </thead>
            <tbody>
              {scorecardRows.map((row) => (
                <tr key={row.key} className="border-b border-black/5 last:border-0">
                  <td className="py-2 pr-2 font-medium text-[#0D4A4B]">{row.label}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step="0.01"
                      value={beforeReset[row.key]}
                      onChange={(e) => updateBeforeReset(row.key, e.target.value)}
                      placeholder="$"
                      className="w-28 rounded-lg border border-black/10 bg-white px-2 py-1.5"
                    />
                  </td>
                  <td className="py-2 font-semibold text-[#0D4A4B]">{money(row.after)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card style={{ backgroundColor: "rgba(253,243,192,0.4)" }}>
          <h2 className="text-lg font-semibold text-[#0D4A4B]">Week 3 Checklist</h2>
          <p className="mb-3 text-sm text-[#0D4A4B]/60">One Number to Live By</p>
          <div className="space-y-2">
            {WEEK3_ITEMS.map((item, i) => (
              <label key={i} className="flex cursor-pointer items-start gap-3 rounded-lg bg-white/60 p-3">
                <input
                  type="checkbox"
                  checked={!!checklist.week3?.[i]}
                  onChange={() => toggleWeek("week3", i)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#F7D20D]"
                />
                <span className={`text-[#0D4A4B] ${checklist.week3?.[i] ? "line-through opacity-60" : ""}`}>
                  {item}
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card style={{ backgroundColor: "rgba(255,220,220,0.4)" }}>
          <h2 className="text-lg font-semibold text-[#0D4A4B]">Week 4 Checklist</h2>
          <p className="mb-3 text-sm text-[#0D4A4B]/60">Protect It</p>
          <div className="space-y-2">
            {WEEK4_ITEMS.map((item, i) => (
              <label key={i} className="flex cursor-pointer items-start gap-3 rounded-lg bg-white/60 p-3">
                <input
                  type="checkbox"
                  checked={!!checklist.week4?.[i]}
                  onChange={() => toggleWeek("week4", i)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#FF6B6B]"
                />
                <span className={`text-[#0D4A4B] ${checklist.week4?.[i] ? "line-through opacity-60" : ""}`}>
                  {item}
                </span>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MathRow({
  label,
  value,
  divider = false,
  bold = false,
}: {
  label: string;
  value?: number;
  divider?: boolean;
  bold?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1 ${divider ? "mt-1 border-t border-white/25 pt-2" : ""}`}>
      <span className={bold ? "font-semibold" : "text-white/85"}>{label}</span>
      {value !== undefined && <span className={bold ? "font-semibold" : ""}>{money(value)}</span>}
    </div>
  );
}

function BucketCard({
  bucket,
  total,
  percent,
}: {
  bucket: Exclude<Bucket, "" | "Income">;
  total: number;
  percent: number;
}) {
  const c = BUCKET_COLORS[bucket];
  return (
    <Card style={{ backgroundColor: c.bg }} className="border-black/5">
      <div className="text-sm font-semibold" style={{ color: c.text }}>
        {bucket}
      </div>
      <div className="mt-1 text-2xl font-bold" style={{ color: c.text }}>
        {money(total)}
      </div>
      <div className="mt-1 text-xs opacity-70" style={{ color: c.text }}>
        {pct(percent)} of spending
      </div>
    </Card>
  );
}

function StatusBanner({
  transactionCount,
  missingBuckets,
}: {
  transactionCount: number;
  missingBuckets: number;
}) {
  if (transactionCount === 0) {
    return (
      <div className="rounded-xl bg-[#FDF3C0] p-4 text-center font-semibold text-[#6b5900]">
        No transactions imported yet — head to Upload to see your picture.
      </div>
    );
  }
  if (missingBuckets > 0) {
    return (
      <div className="rounded-xl bg-[#FFDCDC] p-4 text-center font-semibold text-[#8a2323]">
        {missingBuckets} transaction{missingBuckets === 1 ? "" : "s"} still need{missingBuckets === 1 ? "s" : ""} a
        bucket — your picture isn't complete yet.
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-[#E4EDC9] p-4 text-center font-semibold text-[#3d4f01]">
      ✓ Your picture is complete.
    </div>
  );
}
