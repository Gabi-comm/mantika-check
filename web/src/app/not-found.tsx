import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="dot-grid grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <Logo height={32} />
        <p className="eyebrow mt-8">Error 404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink">This page does not exist.</h1>
        <p className="mt-2 text-gray">Check the address, or return to a known page.</p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-accent">Website</Link>
          <Link href="/app" className="inline-flex min-h-11 items-center font-semibold text-accent">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
