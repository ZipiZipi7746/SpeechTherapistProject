import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { ConfigGuard } from "@/components/layout/ConfigGuard";
import { Footer } from "@/components/layout/Footer";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SelectionProvider } from "@/components/providers/SelectionProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { SelectionBar } from "@/components/words/SelectionBar";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "SpeechSearch — מצאי את המילה המושלמת לטיפול", template: "%s · SpeechSearch" },
  description: "חיפוש פונולוגי חכם, תמונות מותאמות וסטים שניתן להוריד — הכול במקום אחד, לקלינאיות תקשורת.",
  openGraph: { type: "website", locale: "he_IL", siteName: "SpeechSearch", title: "SpeechSearch — מצאי את המילה המושלמת לטיפול", description: "חיפוש פונולוגי חכם, תמונות מותאמות וסטים להדפסה לקלינאיות תקשורת." },
};
export const viewport: Viewport = { themeColor: "#7c4dcf", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-dvh">
        <ConfigGuard>
        <ToastProvider>
          <AuthProvider>
            <SelectionProvider>
              <a href="#main" className="no-print sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">דלגי לתוכן</a>
              <DemoBanner />
              <Navbar />
              <main id="main" className="min-h-[60vh] pb-12">{children}</main>
              <Footer />
              <SelectionBar />
              <BottomNav />
            </SelectionProvider>
          </AuthProvider>
        </ToastProvider>
        </ConfigGuard>
      </body>
    </html>
  );
}
