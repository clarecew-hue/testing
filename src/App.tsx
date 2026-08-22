import { useRef, useState } from "react";
import { AppProvider, useAppData } from "./context/AppContext";
import StartHere from "./pages/StartHere";
import Upload from "./pages/Upload";
import Transactions from "./pages/Transactions";
import Rules from "./pages/Rules";
import Dashboard from "./pages/Dashboard";
import Bills from "./pages/Bills";
import { readAll, writeAll } from "./lib/storage";

type Tab = "start" | "upload" | "transactions" | "rules" | "dashboard" | "bills";

const TABS: { id: Tab; label: string }[] = [
  { id: "start", label: "Start Here" },
  { id: "upload", label: "Upload" },
  { id: "transactions", label: "Transactions" },
  { id: "rules", label: "Rules" },
  { id: "dashboard", label: "Dashboard" },
  { id: "bills", label: "Bills" },
];

function AppShell() {
  const [tab, setTab] = useState<Tab>("start");
  const { resetAll } = useAppData();
  const importInputRef = useRef<HTMLInputElement>(null);

  function exportData() {
    const data = readAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `spending-reset-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data !== "object" || data === null) throw new Error("Invalid file");
      writeAll(data);
      window.location.reload();
    } catch {
      alert("That file doesn't look like a valid Spending Reset export.");
    }
  }

  function startOver() {
    const confirmed = window.confirm(
      "This clears all imported transactions, bills, and your progress on this device. Rules reset to the defaults. This can't be undone — export your data first if you want a backup. Continue?"
    );
    if (!confirmed) return;
    resetAll();
    setTab("start");
  }

  return (
    <div className="min-h-screen bg-[#FCF8F1]">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-[#FCF8F1]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={() => setTab("start")}
            className="text-left font-serif text-lg font-semibold text-[#0D4A4B]"
          >
            The 30-Day Spending Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={exportData}
              className="rounded-full border border-[#00787F]/30 px-3 py-1.5 text-xs font-semibold text-[#00787F] hover:bg-[#D5EAEB]/40"
            >
              Export my data
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className="rounded-full border border-[#00787F]/30 px-3 py-1.5 text-xs font-semibold text-[#00787F] hover:bg-[#D5EAEB]/40"
            >
              Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={startOver}
              className="rounded-full border border-[#FF6B6B]/40 px-3 py-1.5 text-xs font-semibold text-[#8a2323] hover:bg-[#FFDCDC]/50"
            >
              Start Over
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-4 py-2 font-semibold transition ${
                tab === t.id ? "bg-[#00787F] text-white" : "text-[#0D4A4B]/70 hover:bg-[#D5EAEB]/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="px-4 pt-8">
        {tab === "start" && <StartHere onGetStarted={() => setTab("upload")} />}
        {tab === "upload" && <Upload />}
        {tab === "transactions" && <Transactions />}
        {tab === "rules" && <Rules />}
        {tab === "dashboard" && <Dashboard />}
        {tab === "bills" && <Bills />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-6 text-center text-xs text-[#0D4A4B]/50">
        Your data never leaves your device — everything is stored locally in this browser.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
