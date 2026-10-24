import type { Metadata } from "next";
import { MethodologyContent } from "@/components/site/pages/MethodologyContent";

export const metadata: Metadata = { title: "Methodology" };

export default function Page() {
  return (
    <div className="-mx-4 -mt-5 sm:-mx-6 lg:-mx-8 lg:-mt-2">
      <MethodologyContent />
    </div>
  );
}
