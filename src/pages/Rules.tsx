import Card from "../components/Card";
import { useAppData } from "../context/AppContext";
import { newRule } from "../lib/rules";
import { BUCKETS } from "../types";

export default function Rules() {
  const { rules, setRules } = useAppData();

  function update(id: string, patch: Partial<(typeof rules)[number]>) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function add() {
    setRules((prev) => [...prev, newRule()]);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[#0D4A4B]">Auto-Categorize Rules</h1>
          <p className="text-[#0D4A4B]/70">
            Any transaction description containing a keyword gets that bucket & category.
            Longest matching keyword wins.
          </p>
        </div>
        <button
          onClick={add}
          className="rounded-full bg-[#00787F] px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#0D4A4B]"
        >
          + Add rule
        </button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-[#0D4A4B]/60">
              <th className="px-2 py-2">Keyword</th>
              <th className="px-2 py-2">Bucket</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b border-black/5 last:border-0">
                <td className="px-2 py-1.5">
                  <input
                    value={rule.keyword}
                    onChange={(e) => update(rule.id, { keyword: e.target.value })}
                    className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 uppercase"
                    placeholder="KEYWORD"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={rule.bucket}
                    onChange={(e) => update(rule.id, { bucket: e.target.value as (typeof BUCKETS)[number] })}
                    className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5"
                  >
                    {BUCKETS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={rule.category}
                    onChange={(e) => update(rule.id, { category: e.target.value })}
                    className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5"
                    placeholder="Category"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    onClick={() => remove(rule.id)}
                    className="rounded-full px-2 py-1 text-[#8a2323] hover:bg-[#FFDCDC]"
                    aria-label={`Delete rule ${rule.keyword}`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rules.length === 0 && (
          <p className="py-6 text-center text-[#0D4A4B]/60">No rules yet — add one above.</p>
        )}
      </Card>
    </div>
  );
}
