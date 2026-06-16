import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "CareerPath AI",
    template: "%s | CareerPath AI",
  },
  description: "AI-powered career guidance platform — personalized recommendations, roadmaps, and opportunities tailored to your goals.",
  keywords: ["career guidance", "AI career", "job seeker", "higher education", "exam prep"],
  openGraph: {
    title: "CareerPath AI",
    description: "AI-powered career guidance platform",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-surface-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
