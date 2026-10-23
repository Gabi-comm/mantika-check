import type { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={["card", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "ok" | "warn" | "error" | "neutral" | "sample"; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
