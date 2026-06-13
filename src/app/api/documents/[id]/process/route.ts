import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { processDocument } from "@/lib/documents/process";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

interface RouteContext {
  params: { id: string };
}

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  if (document.status === "READY") {
    return NextResponse.json({ document });
  }

  try {
    const response = await fetch(document.fileUrl);
    if (!response.ok) {
      throw new Error("Failed to download PDF from storage");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await processDocument(document.id, buffer);

    const updated = await prisma.document.findUnique({ where: { id: document.id } });
    return NextResponse.json({ document: updated });
  } catch (error) {
    const updated = await prisma.document.findUnique({ where: { id: document.id } });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Document processing failed",
        document: updated,
      },
      { status: 500 }
    );
  }
}
