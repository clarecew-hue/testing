import Card from "../components/Card";
import { useAppData } from "../context/AppContext";
import { money } from "../lib/format";
import type { Bill } from "../types";

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `bill-${Date.now()}-${idCounter}`;
}

function newBill(): Bill {
  return { id: nextId(), name: "", amount: 0, dueDay: "", autopay: false, paidFrom: "", notes: "" };
}

const WEEK2_ITEMS = [
  "Every bill listed with due date and amount",
  "Every bill on autopay (or one bill-pay day chosen)",
  "Automatic transfer to savings set for payday — even $25",
  "Unused subscriptions from Top Leaks canceled or paused",
  "Called any provider I'm behind with and asked about a payment plan",
];

export default function Bills() {
  const { bills, setBills, checklist, setChecklist } = useAppData();

  function update(id: string, patch: Partial<Bill>) {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function remove(id: string) {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }

  function add() {
    setBills((prev) => [...prev, newBill()]);
  }

  const totalMonthly = bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const onAutopay = bills.filter((b) => b.autopay).length;

  function toggleWeek2(index: number) {
    setChecklist((prev) => ({
      ...prev,
      week2: { ...prev.week2, [index]: !prev.week2[index] },
    }));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[#0D4A4B]">Bills — Week 2</h1>
          <p className="text-[#0D4A4B]/70">List every bill, then automate it so willpower is never the plan.</p>
        </div>
        <button
          onClick={add}
          className="rounded-full bg-[#00787F] px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#0D4A4B]"
        >
          + Add bill
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="text-center">
          <div className="text-sm font-semibold text-[#0D4A4B]/70">Total Monthly Bills</div>
          <div className="mt-1 text-3xl font-bold text-[#0D4A4B]">{money(totalMonthly)}</div>
        </Card>
        <Card className="text-center">
          <div className="text-sm font-semibold text-[#0D4A4B]/70">On Autopay</div>
          <div className="mt-1 text-3xl font-bold text-[#0D4A4B]">
            {onAutopay} of {bills.length}
          </div>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-[#0D4A4B]/60">
              <th className="px-2 py-2">Bill</th>
              <th className="px-2 py-2">Amount</th>
              <th className="px-2 py-2">Due Day</th>
              <th className="px-2 py-2 text-center">Autopay</th>
              <th className="px-2 py-2">Paid From</th>
              <th className="px-2 py-2">Notes</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id} className="border-b border-black/5 last:border-0">
                <td className="px-2 py-1.5">
                  <input
                    value={bill.name}
                    onChange={(e) => update(bill.id, { name: e.target.value })}
                    placeholder="e.g. Rent"
                    className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={bill.amount || ""}
                    onChange={(e) => update(bill.id, { amount: parseFloat(e.target.value) || 0 })}
                    className="w-24 rounded-lg border border-black/10 bg-white px-2 py-1.5"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={bill.dueDay}
                    onChange={(e) =>
                      update(bill.id, { dueDay: e.target.value === "" ? "" : parseInt(e.target.value, 10) })
                    }
                    className="w-16 rounded-lg border border-black/10 bg-white px-2 py-1.5"
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={bill.autopay}
                    onChange={(e) => update(bill.id, { autopay: e.target.checked })}
                    className="h-5 w-5 accent-[#00787F]"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={bill.paidFrom}
                    onChange={(e) => update(bill.id, { paidFrom: e.target.value })}
                    placeholder="Account"
                    className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={bill.notes}
                    onChange={(e) => update(bill.id, { notes: e.target.value })}
                    className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    onClick={() => remove(bill.id)}
                    className="rounded-full px-2 py-1 text-[#8a2323] hover:bg-[#FFDCDC]"
                    aria-label={`Delete ${bill.name || "bill"}`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && (
          <p className="py-6 text-center text-[#0D4A4B]/60">No bills yet — add one above.</p>
        )}
      </Card>

      <Card style={{ backgroundColor: "rgba(228,237,201,0.4)" }}>
        <h2 className="text-lg font-semibold text-[#0D4A4B]">Week 2 Checklist</h2>
        <div className="mt-3 space-y-2">
          {WEEK2_ITEMS.map((item, i) => (
            <label key={i} className="flex cursor-pointer items-start gap-3 rounded-lg bg-white/60 p-3">
              <input
                type="checkbox"
                checked={!!checklist.week2[i]}
                onChange={() => toggleWeek2(i)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#718E02]"
              />
              <span className={`text-[#0D4A4B] ${checklist.week2[i] ? "line-through opacity-60" : ""}`}>
                {item}
              </span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
