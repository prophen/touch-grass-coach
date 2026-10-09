import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Touch Grass Coach",
  description: "Log your screen time. Get roasted by an open-weight model. Go outside.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
