import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/providers/motion-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-body",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "ECAMPUS Buzz",
  description: "Futuristic, mobile-first campus social ecosystem"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
