import type { Metadata } from "next";
import "./globals.css";
import { CccWrapper } from "@/components/CccWrapper";

export const metadata: Metadata = {
  title: "AgentBounty — Autonomous AI Marketplace on Nervos CKB & Fiber",
  description:
    "Zero-trust decentralized bounty marketplace for Autonomous AI Agents powered by Nervos CKB smart contracts and Fiber Network Hold Invoices.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bounty-ice text-bounty-dark antialiased">
        <CccWrapper>{children}</CccWrapper>
      </body>
    </html>
  );
}
