import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cleaning Works Report Generator",
  description:
    "Generate polished, client-ready cleaning & restoration reports with before / during / after photo evidence — PDF and Word.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Cleaning Works",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/brand/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F6F3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
