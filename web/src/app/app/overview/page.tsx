import type { Metadata } from "next";
import { HomeContent } from "@/components/site/pages/HomeContent";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return (
    <div className="-mx-4 -mt-5 sm:-mx-6 lg:-mx-8 lg:-mt-2">
      <HomeContent inApp />
    </div>
  );
}
