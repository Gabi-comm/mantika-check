import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";
import { SettingsProvider, settingsBootScript } from "@/frontend/settings";

// Self-hosted (fontsource builds) so builds and offline use never depend on a font CDN.
const jakarta = localFont({
  variable: "--font-jakarta",
  display: "swap",
  src: [
    { path: "../fonts/plus-jakarta-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/plus-jakarta-sans-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/plus-jakarta-sans-latin-700-normal.woff2", weight: "700" },
    { path: "../fonts/plus-jakarta-sans-latin-800-normal.woff2", weight: "800" },
  ],
});
const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  src: [
    { path: "../fonts/inter-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/inter-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/inter-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/inter-latin-700-normal.woff2", weight: "700" },
  ],
});
const mono = localFont({
  variable: "--font-jetbrains",
  display: "swap",
  src: [
    { path: "../fonts/jetbrains-mono-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/jetbrains-mono-latin-500-normal.woff2", weight: "500" },
  ],
});

export const metadata: Metadata = {
  title: { default: "MANTIKA CHECK: Cooking-oil monitoring workspace", template: "%s | MANTIKA CHECK" },
  description: "Track cooking-oil usage, record visible warning signs, and manage oil batches in one practical monitoring workspace. Research prototype.",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#11634A", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsBootScript }} />
      </head>
      <body>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
