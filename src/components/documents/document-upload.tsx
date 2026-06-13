"use client";

import { useCallback, useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onUploaded: () => void;
}

export function DocumentUpload({ onUploaded }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Only PDF files are supported.");
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error("File exceeds the 20MB limit.");
        return;
      }

      setIsUploading(true);
      setUploadProgress(15);

      try {
        const formData = new FormData();
        formData.append("file", file);

        setUploadProgress(45);

        const response = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        setUploadProgress(85);

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Upload failed");
        }

        setUploadProgress(95);

        void fetch(`/api/documents/${data.document.id}/process`, {
          method: "POST",
        });

        setUploadProgress(100);
        toast.success(`${file.name} uploaded. Embedding in progress…`);
        onUploaded();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onUploaded]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files?.[0];
      if (file) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">Drag and drop a PDF here</p>
        <p className="mt-1 text-xs text-muted-foreground">Maximum file size: 20MB</p>

        <label className="mt-4">
          <Button type="button" variant="secondary" disabled={isUploading} asChild>
            <span>Browse files</span>
          </Button>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            disabled={isUploading}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) {
                await uploadFile(file);
              }
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading PDF…</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}
    </div>
  );
}
