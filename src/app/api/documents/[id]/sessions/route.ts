import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  const sessions = await prisma.chatSession.findMany({
    where: {
      documentId: params.id,
      userId: session.user.id,
      ...(sessionId ? { id: sessionId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id, status: "READY" },
    select: { id: true, title: true },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Document not found or not ready for chat." },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const title = body.title ? String(body.title) : `Chat about ${document.title}`;

  const chatSession = await prisma.chatSession.create({
    data: {
      documentId: document.id,
      userId: session.user.id,
      title,
    },
  });

  return NextResponse.json({ session: chatSession }, { status: 201 });
}
