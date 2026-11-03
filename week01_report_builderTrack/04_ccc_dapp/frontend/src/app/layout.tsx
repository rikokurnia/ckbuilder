import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CccWrapper } from "@/components/CccWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CKB Memo Vault — CCC Core Concepts Demo dApp",
  description:
    "An on-chain memo board built on Nervos CKB demonstrating the 5 core concepts of Common Chain Connector (CCC): Client, Address, Signer, Cell Model, and Transaction.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#FAF7F2] text-[#262320]">
        <CccWrapper>{children}</CccWrapper>
      </body>
    </html>
  );
}
