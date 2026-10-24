import type { Metadata } from "next";
import { AboutContent } from "@/components/site/pages/AboutContent";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <AboutContent />;
}
