import { useEffect, useState } from "react";

const PREFIX = "spending-reset:";

export function useLocalStorage<T>(key: string, initial: T) {
  const fullKey = PREFIX + key;
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(fullKey);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch {
      // storage full or unavailable; ignore
    }
  }, [fullKey, value]);

  return [value, setValue] as const;
}

export function readAll(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) {
      try {
        out[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k) || "null");
      } catch {
        // skip
      }
    }
  }
  return out;
}

export function writeAll(data: Record<string, unknown>) {
  for (const [k, v] of Object.entries(data)) {
    localStorage.setItem(PREFIX + k, JSON.stringify(v));
  }
}

export function clearAll() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
