import { ViewTransition } from "react";

/** Remounts on every navigation, so each section fades in while the previous one fades out. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
