import type { Metadata } from "next";
import { MethodologyContent } from "@/components/site/pages/MethodologyContent";

export const metadata: Metadata = { title: "Methodology" };

export default function Page() {
  return <MethodologyContent />;
}
