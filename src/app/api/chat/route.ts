import { NextRequest, NextResponse } from "next/server";
import { LocalRateLimiter } from "@/lib/rateLimit";

const chatRateLimiter = new LocalRateLimiter({ limit: 10, windowMs: 60_000 });
const MAX_MESSAGES = 20;
const MAX_USER_MESSAGE_LENGTH = 2_000;
const MAX_ASSISTANT_MESSAGE_LENGTH = 20_000;

const AI_API_URL = process.env.NEWS_AI_API_URL || "https://ai.inoventyk.rw";

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

  let messages: Array<{ role: string; content: string }>;
  try {
    const body = await req.json();
    messages = body.messages;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages.some(
      (m) =>
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
        const aiRes = await fetch(`${AI_API_URL}/api/v1/news-ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
          cache: "no-store",
        });

        if (!aiRes.ok) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        }

        controller.close();
      } catch (err) {
        console.error("[/api/chat]", err instanceof Error ? err.message : err);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
