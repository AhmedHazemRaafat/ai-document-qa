"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentLibrary, type DocumentListItem } from "@/components/documents/document-library";
import { DocumentUpload } from "@/components/documents/document-upload";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch("/api/documents");
      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="min-h-screen bg-muted/20">
      <AppHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Q&A</h1>
          <p className="mt-2 text-muted-foreground">
            Upload PDFs, embed them with OpenAI, and ask questions with source citations.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Drag and drop a PDF up to 20MB. Processing runs automatically after upload.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload onUploaded={loadDocuments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. Upload a PDF — stored securely in Vercel Blob.</p>
              <p>2. Text is parsed, chunked (500 tokens, 50 overlap), and embedded.</p>
              <p>3. Ask questions — we retrieve the top 5 chunks via pgvector cosine search.</p>
              <p>4. GPT-4o-mini answers with page-level citations from your document.</p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Your documents</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading documents…</p>
          ) : (
            <DocumentLibrary documents={documents} onRefresh={loadDocuments} />
          )}
        </section>
      </main>
    </div>
  );
}
