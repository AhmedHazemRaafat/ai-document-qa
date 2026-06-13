"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface DocumentListItem {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  status: "PROCESSING" | "READY" | "FAILED";
  processingProgress: number;
  errorMessage: string | null;
  pageCount: number | null;
  createdAt: string;
  _count: {
    chunks: number;
    chatSessions: number;
  };
}

interface DocumentLibraryProps {
  documents: DocumentListItem[];
  onRefresh: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusBadge(status: DocumentListItem["status"]) {
  switch (status) {
    case "READY":
      return <Badge className="bg-emerald-600">Ready</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Processing</Badge>;
  }
}

export function DocumentLibrary({ documents, onRefresh }: DocumentLibraryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "PROCESSING");
    if (!hasProcessing) return;

    const interval = setInterval(onRefresh, 2500);
    return () => clearInterval(interval);
  }, [documents, onRefresh]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Delete failed");
      }

      toast.success("Document deleted");
      setDeleteId(null);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No documents yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a PDF to start asking questions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {documents.map((document) => (
          <Card key={document.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-base">{document.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {document.fileName} · {formatFileSize(document.fileSize)}
                  {document.pageCount ? ` · ${document.pageCount} pages` : ""}
                </p>
              </div>
              {statusBadge(document.status)}
            </CardHeader>
            <CardContent className="space-y-4">
              {document.status === "PROCESSING" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Embedding chunks…
                    </span>
                    <span>{document.processingProgress}%</span>
                  </div>
                  <Progress value={document.processingProgress} />
                </div>
              )}

              {document.status === "FAILED" && document.errorMessage && (
                <p className="text-sm text-destructive">{document.errorMessage}</p>
              )}

              <div className="flex items-center gap-2">
                {document.status === "READY" && (
                  <Button asChild size="sm">
                    <Link href={`/documents/${document.id}`}>Ask questions</Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteId(document.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              This will permanently remove the PDF, embeddings, and chat history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
