// app/api/chat/route.ts  (Next.js App Router)
import { NextRequest, NextResponse } from "next/server";
import { chatWithNewsAgent, AgentMessage } from "@/services/geminiService";
import { LocalRateLimiter } from "@/lib/rateLimit";

const chatRateLimiter = new LocalRateLimiter({ limit: 10, windowMs: 60_000 });
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2_000;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      'anonymous';
    const rateLimit = chatRateLimiter.check(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const messages: AgentMessage[] = body.messages;

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > MAX_MESSAGES ||
      messages.some(message =>
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" ||
        message.content.length === 0 ||
        message.content.length > MAX_MESSAGE_LENGTH
      )
    ) {
      return NextResponse.json(
        { error: "Invalid messages" },
        { status: 400 }
      );
    }

    const response = await chatWithNewsAgent(messages, ip);
    return NextResponse.json({ text: response });
  } catch (err) {
    console.error("[/api/chat] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
