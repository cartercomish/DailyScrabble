import type { Metadata, Viewport } from "next";
import { Jersey_25, Nunito } from "next/font/google";
import "./globals.css";

const display = Jersey_25({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
});

const ui = Nunito({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Manifest",
  description:
    "A daily harbor word puzzle. Same dock for everyone. Three holds of letters. Beat the quota.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Manifest",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#8ec8f0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
