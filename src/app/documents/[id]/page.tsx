import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { DocumentChat } from "@/components/chat/document-chat";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

interface DocumentPageProps {
  params: { id: string };
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const document = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!document) {
    notFound();
  }

  const sessions = await prisma.chatSession.findMany({
    where: { documentId: document.id, userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const serializedSessions = sessions.map((chatSession) => ({
    ...chatSession,
    createdAt: chatSession.createdAt.toISOString(),
    updatedAt: chatSession.updatedAt.toISOString(),
    messages: chatSession.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
      citations: message.citations as Array<{
        chunkId: string;
        pageNumber: number;
        snippet: string;
        similarity: number;
      }> | null,
    })),
  }));

  return (
    <div className="min-h-screen bg-muted/20">
      <AppHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 px-0">
              <Link href="/">← Back to library</Link>
            </Button>
            <h1 className="text-2xl font-bold">{document.title}</h1>
            <p className="text-sm text-muted-foreground">{document.fileName}</p>
          </div>
          <Badge
            variant={
              document.status === "READY"
                ? "default"
                : document.status === "FAILED"
                  ? "destructive"
                  : "secondary"
            }
          >
            {document.status.toLowerCase()}
          </Badge>
        </div>

        {document.status !== "READY" ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            {document.status === "PROCESSING"
              ? `This document is still processing (${document.processingProgress}%). Refresh the page in a moment.`
              : document.errorMessage ?? "Document processing failed."}
          </div>
        ) : (
          <DocumentChat
            documentId={document.id}
            documentTitle={document.title}
            initialSessions={serializedSessions}
          />
        )}
      </main>
    </div>
  );
}
