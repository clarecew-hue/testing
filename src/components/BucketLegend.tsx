import { BUCKET_COLORS, BUCKETS } from "../types";

const DESCRIPTIONS: Record<string, string> = {
  Needs: "Housing, utilities, groceries, insurance, transportation",
  Wants: "Dining out, delivery, subscriptions, retail, the “little” Amazon orders",
  Debt: "Minimums and extra payments",
  "Future You": "Savings, retirement, investments",
  Income: "Deposits, paychecks — auto-detected",
};

export default function BucketLegend() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {BUCKETS.map((bucket) => {
        const c = BUCKET_COLORS[bucket];
        return (
          <div
            key={bucket}
            className="flex items-start gap-3 rounded-xl border border-black/5 p-3"
            style={{ backgroundColor: c.bg }}
          >
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: c.solid }}
              aria-hidden
            />
            <div>
              <div className="font-semibold" style={{ color: c.text }}>
                {bucket}
              </div>
              <div className="text-sm opacity-80" style={{ color: c.text }}>
                {DESCRIPTIONS[bucket]}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
