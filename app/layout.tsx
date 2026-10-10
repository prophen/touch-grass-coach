import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://touch-grass-coach.vercel.app"),
  title: "Touch Grass Coach",
  description: "Log your screen time. Get roasted by an open-weight model. Go outside.",
  openGraph: {
    title: "Touch Grass Coach",
    description: "Log your screen time. Get roasted by Gemma. Grow your chaotic garden, one outdoor mission at a time.",
    url: "https://touch-grass-coach.vercel.app",
    siteName: "Touch Grass Coach",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Touch Grass Coach",
    description: "Get roasted by Gemma. Go outside. Grow your chaotic garden.",
    images: [{ url: "/opengraph-image", alt: "Sprig welcomes you to Touch Grass Coach: Get roasted. Go outside. Grow something." }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
