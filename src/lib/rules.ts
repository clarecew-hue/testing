import type { Rule } from "../types";

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `rule-${Date.now()}-${idCounter}`;
}

// [keyword, bucket, category]
const DEFAULT_RULE_DATA: [string, Rule["bucket"], string][] = [
  ["RENT", "Needs", "Housing"],
  ["MORTGAGE", "Needs", "Housing"],
  ["ELECTRIC", "Needs", "Utilities"],
  ["WATER", "Needs", "Utilities"],
  ["INTERNET", "Needs", "Utilities"],
  ["COMCAST", "Needs", "Utilities"],
  ["SPECTRUM", "Needs", "Utilities"],
  ["AT&T", "Needs", "Phone"],
  ["VERIZON", "Needs", "Phone"],
  ["T-MOBILE", "Needs", "Phone"],
  ["KROGER", "Needs", "Groceries"],
  ["WALMART", "Needs", "Groceries"],
  ["ALDI", "Needs", "Groceries"],
  ["TRADER JOE", "Needs", "Groceries"],
  ["COSTCO", "Needs", "Groceries"],
  ["SAFEWAY", "Needs", "Groceries"],
  ["VONS", "Needs", "Groceries"],
  ["RALPHS", "Needs", "Groceries"],
  ["SHELL", "Needs", "Transportation"],
  ["CHEVRON", "Needs", "Transportation"],
  ["EXXON", "Needs", "Transportation"],
  ["ARCO", "Needs", "Transportation"],
  ["METRO", "Needs", "Transportation"],
  ["GEICO", "Needs", "Insurance"],
  ["STATE FARM", "Needs", "Insurance"],
  ["PROGRESSIVE", "Needs", "Insurance"],
  ["ALLSTATE", "Needs", "Insurance"],
  ["CVS", "Needs", "Health"],
  ["WALGREENS", "Needs", "Health"],
  ["PHARMACY", "Needs", "Health"],
  ["DOORDASH", "Wants", "Food Delivery"],
  ["UBER EATS", "Wants", "Food Delivery"],
  ["GRUBHUB", "Wants", "Food Delivery"],
  ["POSTMATES", "Wants", "Food Delivery"],
  ["INSTACART", "Wants", "Food Delivery"],
  ["MCDONALD", "Wants", "Dining Out"],
  ["STARBUCKS", "Wants", "Dining Out"],
  ["CHIPOTLE", "Wants", "Dining Out"],
  ["CHICK-FIL-A", "Wants", "Dining Out"],
  ["RESTAURANT", "Wants", "Dining Out"],
  ["CAFE", "Wants", "Dining Out"],
  ["NETFLIX", "Wants", "Subscriptions"],
  ["HULU", "Wants", "Subscriptions"],
  ["SPOTIFY", "Wants", "Subscriptions"],
  ["DISNEY", "Wants", "Subscriptions"],
  ["APPLE.COM/BILL", "Wants", "Subscriptions"],
  ["AUDIBLE", "Wants", "Subscriptions"],
  ["PARAMOUNT", "Wants", "Subscriptions"],
  ["PELOTON", "Wants", "Subscriptions"],
  ["AMAZON", "Wants", "Impulse Retail"],
  ["AMZN", "Wants", "Impulse Retail"],
  ["TARGET", "Wants", "Impulse Retail"],
  ["TEMU", "Wants", "Impulse Retail"],
  ["SHEIN", "Wants", "Impulse Retail"],
  ["ETSY", "Wants", "Impulse Retail"],
  ["SEPHORA", "Wants", "Personal Care"],
  ["ULTA", "Wants", "Personal Care"],
  ["NAILS", "Wants", "Personal Care"],
  ["CREDIT CRD", "Debt", "Card Payment"],
  ["CARD PAYMENT", "Debt", "Card Payment"],
  ["CARDMEMBER", "Debt", "Card Payment"],
  ["NELNET", "Debt", "Student Loan"],
  ["MOHELA", "Debt", "Student Loan"],
  ["SALLIE MAE", "Debt", "Student Loan"],
  ["NAVIENT", "Debt", "Student Loan"],
  ["AFFIRM", "Debt", "BNPL"],
  ["KLARNA", "Debt", "BNPL"],
  ["AFTERPAY", "Debt", "BNPL"],
  ["TRANSFER TO SAV", "Future You", "Savings"],
  ["SAVINGS", "Future You", "Savings"],
  ["ACORNS", "Future You", "Investing"],
  ["ROBINHOOD", "Future You", "Investing"],
  ["FIDELITY", "Future You", "Investing"],
  ["VANGUARD", "Future You", "Investing"],
  ["SCHWAB", "Future You", "Investing"],
  ["401K", "Future You", "Retirement"],
  ["IRA", "Future You", "Retirement"],
  ["PAYROLL", "Income", "Paycheck"],
  ["DIRECT DEP", "Income", "Paycheck"],
];

export function defaultRules(): Rule[] {
  return DEFAULT_RULE_DATA.map(([keyword, bucket, category]) => ({
    id: nextId(),
    keyword,
    bucket,
    category,
  }));
}

export function newRule(partial: Partial<Rule> = {}): Rule {
  return {
    id: nextId(),
    keyword: "",
    bucket: "Needs",
    category: "",
    ...partial,
  };
}

/** Longest matching keyword wins (case-insensitive substring match). */
export function matchRule(description: string, rules: Rule[]): Rule | null {
  const desc = description.toUpperCase();
  let best: Rule | null = null;
  for (const rule of rules) {
    const kw = rule.keyword.trim().toUpperCase();
    if (!kw) continue;
    if (desc.includes(kw)) {
      if (!best || kw.length > best.keyword.trim().length) {
        best = rule;
      }
    }
  }
  return best;
}
