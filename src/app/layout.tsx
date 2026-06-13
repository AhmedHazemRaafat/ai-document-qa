import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "DocuMind — RAG Document Q&A",
  description:
    "Upload PDFs and ask questions with retrieval-augmented generation, pgvector search, and source citations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
