import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocalStorage } from "../lib/storage";
import { defaultRules } from "../lib/rules";
import type { Bill, ChecklistState, Rule, Transaction } from "../types";

interface AppContextValue {
  transactions: Transaction[];
  setTransactions: (t: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  rules: Rule[];
  setRules: (r: Rule[] | ((prev: Rule[]) => Rule[])) => void;
  bills: Bill[];
  setBills: (b: Bill[] | ((prev: Bill[]) => Bill[])) => void;
  checklist: ChecklistState;
  setChecklist: (c: ChecklistState | ((prev: ChecklistState) => ChecklistState)) => void;
  accounts: string[];
  resetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_CHECKLIST: ChecklistState = { week1: {}, week2: {} };

export function AppProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", []);
  const [rules, setRules] = useLocalStorage<Rule[]>("rules", defaultRules());
  const [bills, setBills] = useLocalStorage<Bill[]>("bills", []);
  const [checklist, setChecklist] = useLocalStorage<ChecklistState>("checklist", EMPTY_CHECKLIST);

  const accounts = useMemo(() => {
    const set = new Set(transactions.map((t) => t.account));
    return Array.from(set).sort();
  }, [transactions]);

  function resetAll() {
    setTransactions([]);
    setRules(defaultRules());
    setBills([]);
    setChecklist(EMPTY_CHECKLIST);
  }

  const value: AppContextValue = {
    transactions,
    setTransactions,
    rules,
    setRules,
    bills,
    setBills,
    checklist,
    setChecklist,
    accounts,
    resetAll,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppData must be used within AppProvider");
  return ctx;
}
