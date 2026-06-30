import { NextRequest, NextResponse } from "next/server";
import { LocalRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const chatRateLimiter = new LocalRateLimiter({ limit: 10, windowMs: 60_000 });
const MAX_MESSAGES = 20;
const MAX_USER_MESSAGE_LENGTH = 2_000;
const MAX_ASSISTANT_MESSAGE_LENGTH = 20_000;
const MAX_ARTICLE_TEXT_LENGTH = 80_000;
const DEFAULT_AI_API_URL = "https://ai.inoventyk.rw";

function normalizeAiApiUrl(raw?: string): string {
  const value = (raw || DEFAULT_AI_API_URL).trim();
  try {
    const url = new URL(value);
    const isLocal =
      ["localhost", "127.0.0.1", "0.0.0.0", "igihe.local"].includes(url.hostname) ||
      url.hostname.endsWith(".local");

    if (isLocal && process.env.NODE_ENV === "production") {
      return DEFAULT_AI_API_URL;
    }

    if (url.pathname.startsWith("/api/v1")) {
      url.pathname = "";
    }
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_AI_API_URL;
  }
}

const AI_API_URL = normalizeAiApiUrl(process.env.NEWS_AI_API_URL);

type AgentMessage = {
  role: "user" | "assistant";
  content: string;
};

type ArticlePayload = {
  source_id?: string;
  title?: string;
  content?: string;
  excerpt?: string;
  link?: string;
  url?: string;
  language?: string;
};

function stripHtml(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function inferSourceSite(req: NextRequest, explicit?: unknown): string {
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return (
    req.headers.get("origin") ||
    req.headers.get("referer") ||
    req.headers.get("host") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "en.igihe.com"
  );
}

function inferLanguage(sourceSite: string, explicit?: unknown): "en" | "fr" | "rw" {
  const site = sourceSite.toLowerCase();
  if (site.includes("fr.igihe.com")) return "fr";
  if (site.includes("igihe.com") && !site.includes("en.igihe.com") && !site.includes("fr.igihe.com")) return "rw";
  if (explicit === "fr" || explicit === "rw" || explicit === "en") return explicit;
  return "en";
}

function normalizeArticle(raw: any, language: string): ArticlePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const title = stripHtml(raw.title?.rendered ?? raw.title);
  const content = stripHtml(raw.content?.rendered ?? raw.content).slice(0, MAX_ARTICLE_TEXT_LENGTH);
  const excerpt = stripHtml(raw.excerpt?.rendered ?? raw.excerpt).slice(0, 2_000);
  const link = typeof raw.link === "string" ? raw.link : typeof raw.url === "string" ? raw.url : undefined;

  if (!title && !content && !excerpt && !link) return null;

  return {
    source_id: raw.id ? String(raw.id) : raw.source_id,
    title,
    content,
    excerpt,
    link,
    url: link,
    language,
  };
}

function lastUserQuestion(messages: AgentMessage[]): string {
  return [...messages].reverse().find((message) => message.role === "user")?.content || "";
}

function sseText(encoder: TextEncoder, text: string): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(text)}\n\n`);
}

function sseDone(encoder: TextEncoder): Uint8Array {
  return encoder.encode("data: [DONE]\n\n");
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "anonymous";

  const rateLimit = chatRateLimiter.check(ip);
  if (!rateLimit.allowed) {
    return new Response(
      `data: [DONE]\n\n`,
      {
        status: 429,
        headers: {
          "Content-Type": "text/event-stream",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  let messages: AgentMessage[];
  let article: ArticlePayload | null = null;
  let sourceSite = "";
  let language: "en" | "fr" | "rw" = "en";
  try {
    const body = await req.json();
    sourceSite = inferSourceSite(req, body.source_site ?? body.sourceSite);
    language = inferLanguage(sourceSite, body.language);
    messages = body.messages;
    article = normalizeArticle(body.article, language);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages.some(
      (m: AgentMessage) =>
        !m ||
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string" ||
        m.content.length === 0 ||
        (m.role === "user" && m.content.length > MAX_USER_MESSAGE_LENGTH) ||
        (m.role === "assistant" && m.content.length > MAX_ASSISTANT_MESSAGE_LENGTH)
    )
  ) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const question = lastUserQuestion(messages);
        const endpoint = article ? "/api/v1/news-ai/article/ask" : "/api/v1/news-ai/chat";
        const payload = article
          ? { article, question, source_site: sourceSite }
          : { messages, language, limit: 9, source_site: sourceSite };

        const aiRes = await fetch(`${AI_API_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
          signal: AbortSignal.timeout(45_000),
        });

        if (!aiRes.ok) {
          console.error("[/api/chat] upstream failed", {
            status: aiRes.status,
            endpoint,
            aiBase: AI_API_URL,
          });
          controller.enqueue(
            sseText(
              encoder,
              "I'm sorry — the IGIHE AI service is reachable but returned an error. Please try again in a moment."
            )
          );
          controller.enqueue(sseDone(encoder));
          controller.close();
          return;
        }

        const contentType = aiRes.headers.get("content-type") || "";

        if (contentType.includes("text/event-stream") && aiRes.body) {
          // Server supports real SSE — pipe straight through
          const reader = aiRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } else {
          // Regular JSON — fake-stream word by word
          const data = await aiRes.json();
          const text: string =
            data.text ?? data.response ?? data.message ?? data.answer ?? "";

          const tokens = text.split(/(\s+)/);
          for (const token of tokens) {
            if (token === "") continue;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(token)}\n\n`)
            );
            await new Promise((r) => setTimeout(r, 18));
          }
          controller.enqueue(sseDone(encoder));
        }

        controller.close();
      } catch (err) {
        console.error("[/api/chat]", err instanceof Error ? err.message : err);
        controller.enqueue(
          sseText(
            encoder,
            "I'm sorry — I couldn't connect to the IGIHE AI service from this deployment. Please try again in a moment."
          )
        );
        controller.enqueue(sseDone(encoder));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
