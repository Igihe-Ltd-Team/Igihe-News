// app/api/chat/route.ts  (Next.js App Router)
import { NextRequest, NextResponse } from "next/server";
import { chatWithNewsAgent, AgentMessage } from "@/services/geminiService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: AgentMessage[] = body.messages;
    const userId: string | undefined = body.userId;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const response = await chatWithNewsAgent(messages, userId);
    return NextResponse.json({ text: response });
  } catch (err: any) {
    console.error("[/api/chat] Error:", err?.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}