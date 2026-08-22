export function money(n: number, opts: Intl.NumberFormatOptions = {}) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  });
}

export function moneyPrecise(n: number) {
  return money(n, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function pct(n: number) {
  return `${Math.round(n)}%`;
}

export function formatDateShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
