import type { Metadata } from "next";
import { FeaturesContent } from "@/components/site/pages/FeaturesContent";

export const metadata: Metadata = { title: "Features" };

export default function Page() {
  return (
    <div className="-mx-4 -mt-5 sm:-mx-6 lg:-mx-8 lg:-mt-2">
      <FeaturesContent inApp />
    </div>
  );
}
