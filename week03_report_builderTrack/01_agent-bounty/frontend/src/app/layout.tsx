import type { Metadata } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/HeroVideo";
import { CccWrapper } from "@/components/CccWrapper";

export const metadata: Metadata = {
  title: "AgentBounty — Good work. Show your proof.",
  description:
    "A builder workspace for agent-assisted code reviews and technical research. Inspect task outputs and explore simulated CKB payments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <MotionProvider>
          <CccWrapper>{children}</CccWrapper>
        </MotionProvider>
      </body>
    </html>
  );
}
