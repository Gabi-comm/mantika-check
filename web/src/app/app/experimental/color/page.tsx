import type { Metadata } from "next";
import { ColorAnalyzer } from "@/features/color/ColorAnalyzer";

export const metadata: Metadata = { title: "Color Analyzer (Experimental)" };

export default function ColorAnalyzerPage() {
  return <ColorAnalyzer />;
}
