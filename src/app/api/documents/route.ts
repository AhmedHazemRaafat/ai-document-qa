import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      fileName: true,
      fileSize: true,
      status: true,
      processingProgress: true,
      errorMessage: true,
      pageCount: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { chunks: true, chatSessions: true },
      },
    },
  });

  return NextResponse.json({ documents });
}

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 20MB size limit." },
        { status: 400 }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Blob storage is not configured." },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const blob = await put(`documents/${session.user.id}/${Date.now()}-${file.name}`, buffer, {
      access: "public",
      contentType: "application/pdf",
    });

    const title = file.name.replace(/\.pdf$/i, "");

    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        title,
        fileName: file.name,
        fileUrl: blob.url,
        fileSize: file.size,
        status: "PROCESSING",
        processingProgress: 0,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message.toLowerCase().includes("invalid")
        ? "The uploaded PDF appears to be corrupt or unreadable."
        : "Failed to upload document.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
