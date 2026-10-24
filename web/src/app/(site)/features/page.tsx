import type { Metadata } from "next";
import { FeaturesContent } from "@/components/site/pages/FeaturesContent";

export const metadata: Metadata = { title: "Features" };

export default function Page() {
  return <FeaturesContent />;
}
