import type { Metadata } from "next";
import { AboutContent } from "@/components/site/pages/AboutContent";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return (
    <div className="-mx-4 -mt-5 sm:-mx-6 lg:-mx-8 lg:-mt-2">
      <AboutContent inApp />
    </div>
  );
}
