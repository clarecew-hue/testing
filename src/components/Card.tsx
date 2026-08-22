import type { CSSProperties, ReactNode } from "react";

export default function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`rounded-2xl border border-black/5 bg-white/70 p-5 shadow-sm ${className}`} style={style}>
      {children}
    </div>
  );
}
