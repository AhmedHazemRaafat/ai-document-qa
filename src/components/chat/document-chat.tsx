"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import type { Citation } from "@/lib/ai/rag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface StoredMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: Citation[] | null;
  createdAt: string;
}

interface ChatSessionSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: StoredMessage[];
}

interface DocumentChatProps {
  documentId: string;
  documentTitle: string;
  initialSessions: ChatSessionSummary[];
}

function toUiMessages(messages: StoredMessage[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    parts: [{ type: "text", text: message.content }],
    metadata:
      message.citations && message.citations.length > 0
        ? { citations: message.citations }
        : undefined,
  }));
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function getMessageCitations(message: UIMessage): Citation[] {
  const metadata = message.metadata as { citations?: Citation[] } | undefined;
  return metadata?.citations ?? [];
}

export function DocumentChat({
  documentId,
  documentTitle,
  initialSessions,
}: DocumentChatProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessions[0]?.id ?? null
  );
  const [input, setInput] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const sessionIdRef = useRef<string | null>(activeSessionId);

  useEffect(() => {
    sessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const activeSession = sessions.find((session) => session.id === activeSessionId);

  const initialMessages = useMemo(
    () => (activeSession ? toUiMessages(activeSession.messages) : []),
    [activeSession]
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: {
            ...body,
            messages,
            documentId,
            sessionId: sessionIdRef.current,
          },
        }),
      }),
    [documentId]
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id: activeSessionId ?? "new-chat",
    messages: initialMessages,
    transport,
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createSession = async (): Promise<string | null> => {
    setIsCreatingSession(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Chat about ${documentTitle}` }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create chat session");
      }

      const newSession: ChatSessionSummary = {
        ...data.session,
        messages: [],
      };

      setSessions((current) => [newSession, ...current]);
      setActiveSessionId(newSession.id);
      sessionIdRef.current = newSession.id;
      setMessages([]);
      return newSession.id;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start chat");
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSessionChange = (sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    setActiveSessionId(sessionId);
    setMessages(session ? toUiMessages(session.messages) : []);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || status === "streaming" || status === "submitted") return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await createSession();
    }

    if (!sessionId) {
      return;
    }

    sessionIdRef.current = sessionId;

    setInput("");
    await sendMessage({ text: question });
  };

  const isBusy = status === "streaming" || status === "submitted";

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Chat history</CardTitle>
          <Button size="sm" variant="outline" disabled={isCreatingSession} onClick={createSession}>
            New
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => handleSessionChange(session.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  session.id === activeSessionId
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
              >
                <p className="font-medium line-clamp-2">
                  {session.title ?? "Untitled chat"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {session.messages.length} messages
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="flex min-h-[640px] flex-col">
        <CardHeader>
          <CardTitle className="text-base">Ask about {documentTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <ScrollArea className="h-[420px] rounded-lg border p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask a question about this document. Answers include page citations from the source PDF.
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const citations = getMessageCitations(message);
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`rounded-lg px-4 py-3 ${
                        isUser ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{getMessageText(message)}</p>

                      {!isUser && citations.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                          <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                            Sources
                          </p>
                          {citations.map((citation) => (
                            <div
                              key={`${citation.chunkId}-${citation.pageNumber}`}
                              className="rounded-md bg-background/60 p-2 text-xs"
                            >
                              <div className="mb-1 flex items-center gap-2">
                                <Badge variant="outline">Page {citation.pageNumber}</Badge>
                                <span className="text-muted-foreground">
                                  {(citation.similarity * 100).toFixed(1)}% match
                                </span>
                              </div>
                              <p className="text-muted-foreground">{citation.snippet}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isBusy && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating answer…
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question about this document…"
              className="min-h-[80px] resize-none"
              disabled={isBusy}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit(event);
                }
              }}
            />
            <Button type="submit" disabled={isBusy || !input.trim()} className="self-end">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
