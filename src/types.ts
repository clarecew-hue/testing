export type Bucket = "Needs" | "Wants" | "Debt" | "Future You" | "Income" | "";

export const BUCKETS: Exclude<Bucket, "">[] = [
  "Needs",
  "Wants",
  "Debt",
  "Future You",
  "Income",
];

export const BUCKET_COLORS: Record<Exclude<Bucket, "">, { bg: string; text: string; solid: string }> = {
  Needs: { bg: "#D5EAEB", text: "#0D4A4B", solid: "#00787F" },
  Wants: { bg: "#FDF3C0", text: "#6b5900", solid: "#F7D20D" },
  Debt: { bg: "#FFDCDC", text: "#8a2323", solid: "#FF6B6B" },
  "Future You": { bg: "#E4EDC9", text: "#3d4f01", solid: "#718E02" },
  Income: { bg: "#EDEDED", text: "#3a3a3a", solid: "#6b6b6b" },
};

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // always positive
  account: string;
  bucket: Bucket;
  category: string;
  notes: string;
  bucketSetByUser?: boolean;
}

export interface Rule {
  id: string;
  keyword: string;
  bucket: Exclude<Bucket, "">;
  category: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number | "";
  autopay: boolean;
  paidFrom: string;
  notes: string;
}

export interface ChecklistState {
  week1: Record<number, boolean>;
  week2: Record<number, boolean>;
}

export interface AppData {
  transactions: Transaction[];
  rules: Rule[];
  bills: Bill[];
  checklist: ChecklistState;
  importedAccounts: string[];
}
