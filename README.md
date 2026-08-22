# The 30-Day Spending Reset

*The Bridge Builder · Clarece Weinraub Financial Services*

A no-shame plan to find your money and put it back to work.

Clients upload CSV exports from their bank and credit card accounts, sort every
transaction into four buckets — **Needs**, **Wants**, **Debt**, and **Future You**
(plus auto-detected **Income**) — and get a dashboard showing exactly where their
money goes. Everything runs client-side: all data is stored in the browser's
`localStorage` and nothing is ever sent to a server.

## Program

- **Week 1 — See It**: upload every account, categorize every transaction, look
  at the four numbers. No changes yet — awareness only.
- **Week 2 — Automate the Important**: list every bill, put them on autopay, set
  an automatic payday transfer to savings, cancel unused subscriptions.

## Pages

- **Start Here** — program overview and the bucket legend.
- **Upload** — drag-and-drop multiple CSVs; columns are auto-detected.
- **Transactions** — bucket & categorize every row; the table highlights each
  row in its bucket's color the moment it's set.
- **Rules** — editable keyword → bucket → category rules used by Auto-Categorize.
- **Dashboard** — the five bucket totals, "Your One Number" (safe weekly Wants
  spending), Top Leaks, and a spending-by-bucket chart.
- **Bills** — bill list, autopay tracking, and the Week 2 checklist.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
```

Built with React, TypeScript, Vite, Tailwind CSS, Papa Parse, and Recharts.
