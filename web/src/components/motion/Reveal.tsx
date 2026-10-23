"use client";

import { useEffect, useRef, useState, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "@/frontend/format";

/** Fades content up as it scrolls into view. Content stays visible without JS or with reduced motion. */
export function Reveal({ children, className, delay = 0, as: As = "div", style, ...rest }: HTMLAttributes<HTMLElement> & { children: ReactNode; delay?: number; as?: ElementType }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    setShown(false);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <As ref={ref} {...rest} data-shown={shown === undefined ? undefined : String(shown)} className={cx("reveal", className)} style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}>
      {children}
    </As>
  );
}
