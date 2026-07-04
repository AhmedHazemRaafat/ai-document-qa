import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  FileSearch,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: UploadCloud,
    title: "PDF upload & processing",
    description:
      "Drag and drop PDFs up to 20MB. Text is parsed, chunked, and embedded automatically.",
  },
  {
    icon: FileSearch,
    title: "Semantic retrieval",
    description:
      "Questions are embedded and matched against document chunks with pgvector cosine search.",
  },
  {
    icon: MessageSquareText,
    title: "Streaming answers",
    description:
      "GPT-4o-mini streams responses in a chat UI, grounded only in your uploaded documents.",
  },
  {
    icon: BookOpenCheck,
    title: "Source citations",
    description:
      "Every answer includes page numbers and text snippets so you can verify claims instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Hallucination guard",
    description:
      "If no chunk scores above 0.75 similarity, the app refuses to guess and says so clearly.",
  },
  {
    icon: Sparkles,
    title: "Chat history",
    description:
      "Conversations are saved per document so you can revisit past Q&A sessions anytime.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload a PDF",
    description: "Store the file in Vercel Blob and track processing progress in real time.",
  },
  {
    step: "02",
    title: "Chunk & embed",
    description: "Split text into 500-token segments with 50-token overlap, then embed with OpenAI.",
  },
  {
    step: "03",
    title: "Ask questions",
    description: "Retrieve the top 5 relevant chunks and generate a cited answer with GPT-4o-mini.",
  },
];

const stack = [
  "Next.js 14",
  "OpenAI",
  "pgvector",
  "Neon Postgres",
  "Prisma",
  "NextAuth",
  "Vercel Blob",
  "AI SDK",
];

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5" />
            DocuMind
          </Link>
          <nav className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button asChild>
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
            <div className="space-y-6">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                RAG Document Q&A
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Ask questions about your PDFs — with answers you can verify.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                DocuMind is a production-style retrieval-augmented generation app. Upload a PDF,
                embed it into a vector database, and chat with grounded answers that cite exact
                pages and source snippets.
              </p>
              <div className="flex flex-wrap gap-3">
                {isLoggedIn ? (
                  <Button asChild size="lg">
                    <Link href="/dashboard">
                      Go to your documents
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link href="/register">
                        Create a free account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href="/login">Sign in</Link>
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Built for portfolio demos and real document workflows — no account needed to
                understand the product.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Product preview</p>
                  <p className="text-xs text-muted-foreground">Chat with citations</p>
                </div>
                <Badge>Ready</Badge>
              </div>

              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <div className="ml-8 rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground">
                  What is the refund policy mentioned in this document?
                </div>
                <div className="mr-4 space-y-3 rounded-lg bg-background px-4 py-3 text-sm shadow-sm">
                  <p>
                    Customers may request a full refund within 14 days of purchase if the service
                    has not been fully delivered.
                  </p>
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Sources
                    </p>
                    <div className="rounded-md border bg-muted/40 p-2 text-xs">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline">Page 4</Badge>
                        <span className="text-muted-foreground">91.2% match</span>
                      </div>
                      <p className="text-muted-foreground">
                        “A full refund is available within fourteen (14) days of purchase…”
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Document status</p>
                  <p className="mt-1 text-sm font-medium">employee-handbook.pdf</p>
                  <Badge className="mt-2 bg-emerald-600">Ready</Badge>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Retrieval</p>
                  <p className="mt-1 text-sm font-medium">Top 5 chunks</p>
                  <p className="mt-2 text-xs text-muted-foreground">Cosine similarity via pgvector</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/20 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight">What you can do</h2>
              <p className="mt-3 text-muted-foreground">
                A full-stack RAG workflow from upload to cited answers — designed to show real
                engineering choices, not just a chat demo.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-muted-foreground/10">
                  <CardHeader className="space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
              <p className="mt-3 text-muted-foreground">
                The pipeline follows a classic production RAG architecture end to end.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((item) => (
                <div key={item.step} className="rounded-2xl border bg-card p-6">
                  <p className="text-sm font-semibold text-muted-foreground">{item.step}</p>
                  <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/20 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight">Built with modern AI stack</h2>
              <p className="mt-3 text-muted-foreground">
                Deployed on Vercel with managed Postgres, blob storage, and OpenAI models.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stack.map((item) => (
                <Badge key={item} variant="outline" className="px-3 py-1 text-sm">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-3xl border bg-card px-6 py-12 text-center shadow-sm sm:px-12">
              <h2 className="text-3xl font-bold tracking-tight">
                Ready to try the full experience?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Create an account to upload a PDF, watch embeddings process, and ask questions with
                page-level citations. Sign-in is only required for the interactive app.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {isLoggedIn ? (
                  <Button asChild size="lg">
                    <Link href="/dashboard">Open dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link href="/register">Get started</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href="/login">Sign in</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>DocuMind — RAG document Q&A portfolio project</p>
          <p>Next.js · OpenAI · pgvector · Vercel</p>
        </div>
      </footer>
    </div>
  );
}
