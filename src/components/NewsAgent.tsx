"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { NewsItem } from "@/types/fetchData";
import Image from "next/image";

import DOMPurify from 'isomorphic-dompurify';
import { ThemedText } from "./ThemedText";
interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}
 
interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

const DIRECT_AI_API_URL = "https://ai.inoventyk.rw";

const PROXY_ERROR_PATTERNS = [
  /IGIHE AI service .*returned/i,
  /IGIHE AI service .*reachable/i,
  /couldn'?t connect to the IGIHE AI service/i,
  /upstream error/i,
  /Please try again in a moment/i,
];

function toAgentArticle(article: NewsItem | undefined, language: "en" | "fr" | "rw") {
  if (!article) return undefined;
  return {
    source_id: String(article.id),
    title: plainText(article.title?.rendered),
    excerpt: plainText(article.excerpt?.rendered),
    content: plainText(article.content?.rendered),
    link: article.link,
    url: article.link,
    language,
    slug: article.slug,
  };
}

type NewsAgentOptions = {
  article?: NewsItem;
  sourceSite: string;
  language: "en" | "fr" | "rw";
};

type StreamCallbacks = {
  onChunk: (chunk: string) => void;
  onReset: () => void;
};

function isProxyErrorText(text: string) {
  return PROXY_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

function parseSsePayload(payload: string): string {
  try {
    const parsed = JSON.parse(payload);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") {
      const token = (parsed as { token?: unknown; text?: unknown; response?: unknown }).token;
      if (typeof token === "string") return token;
      const text = (parsed as { text?: unknown; response?: unknown }).text;
      if (typeof text === "string") return text;
      const response = (parsed as { response?: unknown }).response;
      if (typeof response === "string") return response;
    }
  } catch {
    // Some deployments/proxies may send plain text after "data:".
  }
  return payload;
}

async function readProxyStream(response: Response, callbacks: StreamCallbacks): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    callbacks.onChunk(text);
    return text;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return fullText;
      if (!payload) continue;
      const chunk = parseSsePayload(payload);
      if (!chunk || chunk === "[DONE]") continue;
      fullText += chunk;
      callbacks.onChunk(chunk);
    }
  }

  if (buffer.trim().startsWith("data:")) {
    const payload = buffer.trim().slice(5).trim();
    if (payload && payload !== "[DONE]") {
      const chunk = parseSsePayload(payload);
      fullText += chunk;
      callbacks.onChunk(chunk);
    }
  }

  return fullText;
}

async function callDirectNewsAi(
  messages: AgentMessage[],
  options: NewsAgentOptions,
  callbacks: StreamCallbacks
): Promise<void> {
  const article = toAgentArticle(options.article, options.language);
  const endpoint = article ? "/api/v1/news-ai/article/ask" : "/api/v1/news-ai/chat";
  const question = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const body = article
    ? { article, question, source_site: options.sourceSite }
    : {
        messages,
        language: options.language,
        source_site: options.sourceSite,
        limit: 9,
      };

  const response = await fetch(`${DIRECT_AI_API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Direct IGIHE AI request failed (${response.status})`);
  }

  const data = await response.json().catch(() => null);
  const text =
    (typeof data?.response === "string" && data.response) ||
    (typeof data?.answer === "string" && data.answer) ||
    (typeof data?.text === "string" && data.text) ||
    "";

  if (!text.trim()) {
    throw new Error("Direct IGIHE AI returned an empty response");
  }

  const tokens = text.split(/(\s+)/).filter(Boolean);
  for (const token of tokens) {
    callbacks.onChunk(token);
    await new Promise((resolve) => setTimeout(resolve, 8));
  }
}

async function chatWithNewsAgent(
  messages: AgentMessage[],
  options: NewsAgentOptions,
  callbacks: StreamCallbacks
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      article: toAgentArticle(options.article, options.language),
      source_site: options.sourceSite,
      language: options.language,
    }),
  });

  if (!response.ok) {
    callbacks.onReset();
    await callDirectNewsAi(messages, options, callbacks);
    return;
  }

  const fullText = await readProxyStream(response, callbacks);
  if (!fullText.trim() || isProxyErrorText(fullText)) {
    callbacks.onReset();
    await callDirectNewsAi(messages, options, callbacks);
  }
}

const QUICK_PROMPTS = [
  { icon: "🌍", label: "Today's headlines", cmd: "What are the top headlines today?" },
  { icon: "🇷🇼", label: "Rwanda news", cmd: "What's the latest news about Rwanda?" },
  { icon: "⚽", label: "Sports update", cmd: "What's the latest sports news?" },
  { icon: "💼", label: "Business & Economy", cmd: "Tell me about recent business and economy news" },
  { icon: "🌐", label: "International", cmd: "What's happening internationally?" },
];

const ARTICLE_QUICK_PROMPTS = [
  { icon: "🧾", label: "Summarize", cmd: "Summarize this article in a few clear points." },
  { icon: "✅", label: "Key takeaways", cmd: "What are the key takeaways from this article?" },
  { icon: "❓", label: "Explain simply", cmd: "Explain this article in simple terms." },
  { icon: "🧭", label: "Why it matters", cmd: "Why does this article matter?" },
  { icon: "🔎", label: "Facts only", cmd: "List the main facts stated in this article." },
];

const TYPING_PHRASES = [
  "Searching IGIHE database…",
  "Reading latest articles…",
  "Analyzing results…",
  "Preparing response…",
];

const ARTICLE_TYPING_PHRASES = [
  "Reading this article…",
  "Checking the stored text…",
  "Grounding the answer…",
  "Preparing response…",
];

function resolveSourceSite() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || "https://en.igihe.com";
  }
  return window.location.origin || process.env.NEXT_PUBLIC_APP_URL || "https://en.igihe.com";
}

function resolveLanguage(sourceSite: string): "en" | "fr" | "rw" {
  const site = sourceSite.toLowerCase();
  if (site.includes("fr.igihe.com")) return "fr";
  if (site.includes("igihe.com") && !site.includes("en.igihe.com") && !site.includes("fr.igihe.com")) return "rw";
  return "en";
}

function plainText(value?: string) {
  return (value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function articleTitle(article?: NewsItem) {
  return plainText(article?.title?.rendered) || "this article";
}



const parseCustomMarkup = (content: string) => {
  if (!content) return '';

  return content
    .replace(/\n/g, '<br />')
    .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")   // opening single quote
    .replace(/&#8220;/g, '"')   // opening double quote
    .replace(/&#8221;/g, '"')   // closing double quote
    .replace(/&#8211;/g, '–')   // en dash
    .replace(/&#8212;/g, '—')   // em dash
    .replace(/&#038;/g, '&')    // ampersand
    .replace(/&amp;/g, '&')     // ampersand (named)
    .replace(/\[([^\]]+)->([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
};



function TypingIndicator({ phase, phrases }: { phase: number; phrases: string[] }) {
  return (
    <div className="igihe-typing">
      <div className="igihe-typing__dots">
        <span /><span /><span />
      </div>
      <span className="igihe-typing__label">{phrases[phase]}</span>
    </div>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function NewsAgent({ article }: { article?: NewsItem }) {
  const isArticleMode = Boolean(article);
  const sourceSite = resolveSourceSite();
  const language = resolveLanguage(sourceSite);
  const quickPrompts = isArticleMode ? ARTICLE_QUICK_PROMPTS : QUICK_PROMPTS;
  const typingPhrases = isArticleMode ? ARTICLE_TYPING_PHRASES : TYPING_PHRASES;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingPhase, setTypingPhase] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
      setMessages([{
        id: "init",
        role: "assistant",
        timestamp: new Date(),
        text: article
          ? `${greeting}! I'm focused on **${articleTitle(article)}**.\n\nAsk me to summarize it, extract key takeaways, explain details, or answer questions using this article only.`
          : `${greeting}! I'm your IGIHE news assistant for this site.\n\nAsk about headlines, Rwanda, sports, business, international news, or any current IGIHE topic and I'll search the right source for you.\n\nWhat would you like to know?`,
      }]);
    }
  }, [isOpen, messages.length, article]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Typing phase cycle
  useEffect(() => {
    if (loading) {
      setTypingPhase(0);
      phaseTimer.current = setInterval(() =>
        setTypingPhase(p => Math.min(p + 1, typingPhrases.length - 1)), 1800);
    } else {
      if (phaseTimer.current) clearInterval(phaseTimer.current);
    }
    return () => { if (phaseTimer.current) clearInterval(phaseTimer.current); };
  }, [loading, typingPhrases.length]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setShowQuickPrompts(false);
    const now = Date.now();
    const userMsg: Message = { id: String(now), role: "user", text: trimmed, timestamp: new Date() };
    const assistantId = String(now + 1);
    const history: AgentMessage[] = [
      ...messages.filter(m => !m.isTyping).map(m => ({ role: m.role, content: m.text })),
      { role: "user", content: trimmed },
    ];

    // Add user message + empty assistant bubble immediately
    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", text: "", timestamp: new Date() },
    ]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);

    try {
      await chatWithNewsAgent(history, { article, sourceSite, language }, {
        onChunk: (chunk) => {
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, text: m.text + chunk } : m)
          );
        },
        onReset: () => {
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, text: "" } : m)
          );
        },
      });
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, text: "I'm sorry — I ran into a problem. Please try again in a moment." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, [messages, loading, article, sourceSite, language]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const handleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.onstart = () => setIsListening(true);
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e: any) => {
        const transcript = e?.results?.[0]?.[0]?.transcript;
        if (typeof transcript === "string") setInput(transcript);
      };
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <>
      <style>{`
        :root {
          --igihe-bg: #0d0f14;
          --igihe-surface: #13161d;
          --igihe-surface2: #1a1e27;
          --igihe-border: rgba(255,255,255,0.07);
          --igihe-border-bright: rgba(255,255,255,0.13);
          --igihe-text: #e8eaf0;
          --igihe-text-muted: rgba(232,234,240,0.45);
          --igihe-accent: #1076BA;
          --igihe-accent-dim: rgba(59,130,246,0.15);
          --igihe-accent-glow: rgba(59,130,246,0.25);
          --igihe-green: #10b981;
          --igihe-user-bg: #1d4ed8;
          --radius: 18px;
          --radius-sm: 10px;
        }

        .igihe-trigger {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 1050;
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: var(--igihe-accent);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(59,130,246,0.4), 0 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
        }
        .igihe-trigger:hover {
          transform: scale(1.08);
          box-shadow: 0 12px 40px rgba(59,130,246,0.5), 0 4px 12px rgba(0,0,0,0.5);
        }
        .igihe-trigger:active { transform: scale(0.96); }
        .igihe-trigger__pulse {
          position: absolute;
          top: -2px; right: -2px;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--igihe-green);
          border: 2.5px solid #0d0f14;
        }
        .igihe-trigger__pulse::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: var(--igihe-green);
          opacity: 0.4;
          animation: pulse-ring 2s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .igihe-overlay {
          position: fixed;
          inset: 0;
          z-index: 9990;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: overlay-in 0.25s ease-out;
        }
        @keyframes overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .igihe-panel {
          width: 100%;
          max-width: 860px;
          height: 100%;
          height: 92dvh;
          max-height: 92vh;
          max-height: 92dvh;
        //   background: var(--igihe-bg);
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--igihe-border-bright);
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
          animation: panel-in 0.3s cubic-bezier(.16,1,.3,1);
        }
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Header ── */
        .igihe-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 24px;
          border-bottom: 1px solid var(--igihe-border);
        //   background: var(--igihe-surface);
        background:#1076ba3d;
          flex-shrink: 0;
        }
        .igihe-avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: var(--igihe-accent-dim);
          border: 1.5px solid rgba(59,130,246,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          position: relative;
        }
        .igihe-avatar__dot {
          position: absolute;
          bottom: 1px; right: 1px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: var(--igihe-green);
          border: 2px solid var(--igihe-surface);
        }
        .igihe-header__name {
          font-size: 15px;
          font-weight: 600;
          color: var(--igihe-text);
          letter-spacing: -0.01em;
        }
        .igihe-header__sub {
          font-size: 11.5px;
          color: var(--igihe-text-muted);
          margin-top: 1px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .igihe-header__sub-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--igihe-green);
          display: inline-block;
        }
        .igihe-header-actions {
          margin-left: auto;
          display: flex;
          gap: 8px;
        }
        .igihe-icon-btn {
          width: 34px; height: 34px;
          border-radius: 8px;
          border: 1px solid var(--igihe-border-bright);
          background: transparent;
          color: var(--igihe-text-muted);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          transition: all 0.15s;
        }
        .igihe-icon-btn:hover {
          background: var(--igihe-surface2);
          color: var(--igihe-text);
          border-color: var(--igihe-border-bright);
        }

        /* ── Messages ── */
        .igihe-messages {
          flex: 1;
          overflow-y: auto;
          padding: 28px 28px 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          scroll-behavior: smooth;
        }
        .igihe-messages::-webkit-scrollbar { width: 4px; }
        .igihe-messages::-webkit-scrollbar-track { background: transparent; }
        .igihe-messages::-webkit-scrollbar-thumb { background: var(--igihe-border-bright); border-radius: 4px; }

        .igihe-msg {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          animation: msg-in 0.28s cubic-bezier(.16,1,.3,1);
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .igihe-msg--user { flex-direction: row-reverse; }

        .igihe-msg__avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .igihe-msg__avatar--ai {
          background: var(--igihe-accent-dim);
          border: 1px solid rgba(59,130,246,0.3);
          color: var(--igihe-accent);
        }
        .igihe-msg__avatar--user {
          background: var(--igihe-accent);
          color: white;
        }

        .igihe-msg__body { display: flex; flex-direction: column; gap: 4px; max-width: 72%; }
        .igihe-msg--user .igihe-msg__body { align-items: flex-end; }

        .igihe-msg__bubble {
          padding: 13px 17px;
          border-radius: 18px;
          font-size: 14.5px;
          line-height: 1.65;
          color: var(--igihe-text);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .igihe-msg__bubble--ai {
        //   background: var(--igihe-surface);
        background:#1076ba3d;
          border: 1px solid var(--igihe-border);
          border-bottom-left-radius: 5px;
        }
        .igihe-msg__bubble--user {
          background: var(--igihe-accent);
          border-bottom-right-radius: 5px;
          color: #fff;
        }

        .igihe-msg__time {
          font-size: 10.5px;
          color: var(--igihe-text-muted);
          padding: 0 4px;
        }

        /* ── Typing ── */
        .igihe-typing {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 17px;
          background: var(--igihe-surface);
          border: 1px solid var(--igihe-border);
          border-radius: 18px;
          border-bottom-left-radius: 5px;
        }
        .igihe-typing__dots { display: flex; gap: 4px; align-items: center; }
        .igihe-typing__dots span {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--igihe-accent);
          animation: dot-bounce 1.2s ease-in-out infinite;
        }
        .igihe-typing__dots span:nth-child(2) { animation-delay: 0.2s; }
        .igihe-typing__dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .igihe-typing__label {
          font-size: 12px;
          color: var(--igihe-text-muted);
          transition: opacity 0.4s;
        }

        /* ── Quick prompts ── */
        .igihe-quick {
          padding: 12px 20px 8px;
          border-top: 1px solid var(--igihe-border);
          background: var(--igihe-surface);
          flex-shrink: 0;
        }
        .igihe-quick__label {
          font-size: 11px;
          color: var(--igihe-text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 8px;
          padding: 0 2px;
        }
        .igihe-quick__chips {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .igihe-quick__chips::-webkit-scrollbar { display: none; }
        .igihe-chip {
          flex-shrink: 0;
          padding: 7px 13px;
          border-radius: 100px;
          background: var(--igihe-surface2);
          border: 1px solid var(--igihe-border-bright);
          color: var(--igihe-text);
          font-size: 12.5px;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .igihe-chip:hover {
          background: var(--igihe-accent-dim);
          border-color: rgba(59,130,246,0.4);
          color: #93c5fd;
        }
        .igihe-chip:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Input ── */
        .igihe-input-area {
          padding: 16px 20px;
          border-top: 1px solid var(--igihe-border);
        //   background: var(--igihe-bg);
        background:#1076ba3d;
          flex-shrink: 0;
        }
        .igihe-input-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          background: var(--igihe-surface);
          border: 1px solid var(--igihe-border-bright);
          border-radius: 14px;
          padding: 10px 12px;
          transition: border-color 0.2s;
        }
        .igihe-input-row:focus-within {
          border-color: rgba(59,130,246,0.5);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .igihe-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--igihe-text);
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          padding: 2px 0;
          min-height: 22px;
          max-height: 140px;
        }
        .igihe-textarea::placeholder { color: var(--igihe-text-muted); }

        .igihe-voice-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--igihe-text-muted);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .igihe-voice-btn:hover { color: var(--igihe-text); background: var(--igihe-surface2); }
        .igihe-voice-btn--listening { color: #f87171; animation: mic-pulse 1s ease-in-out infinite alternate; }
        @keyframes mic-pulse { from { opacity: 1; } to { opacity: 0.5; } }

        .igihe-send-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          border: none;
          background: var(--igihe-accent);
          color: white;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
          transition: all 0.15s cubic-bezier(.34,1.56,.64,1);
          box-shadow: 0 2px 8px rgba(59,130,246,0.3);
        }
        .igihe-send-btn:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 4px 14px rgba(59,130,246,0.45); }
        .igihe-send-btn:active:not(:disabled) { transform: scale(0.94); }
        .igihe-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .igihe-input-hint {
          font-size: 11px;
          color: var(--igihe-text-muted);
          text-align: center;
          margin-top: 8px;
        }

        .igihe-divider {
          text-align: center;
          font-size: 11px;
          color: var(--igihe-text-muted);
          position: relative;
        }
        .igihe-divider::before, .igihe-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 35%;
          height: 1px;
          background: var(--igihe-border);
        }
        .igihe-divider::before { left: 0; }
        .igihe-divider::after { right: 0; }

        @media (max-width: 640px) {
          .igihe-overlay { padding: 0; }
          .igihe-panel {
            border-radius: 0;
            height: 100vh;
            height: 100dvh;
            max-height: 100vh;
            max-height: 100dvh;
            border: none;
          }
          .igihe-messages { padding: 16px 16px 12px; }
          .igihe-msg__body { max-width: 85%; }
        }
      `}</style>

      {/* ── Floating trigger ── */}
      <button
        className="igihe-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI news assistant"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
          <circle cx="9" cy="12" r="1" fill="white" stroke="none" />
          <circle cx="15" cy="12" r="1" fill="white" stroke="none" />
        </svg>
        <span className="igihe-trigger__pulse" />
      </button>

      {/* ── Full screen modal ── */}
      {isOpen && (
        <div className="igihe-overlay" onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}>
          <div className="igihe-panel">

            {/* Header */}
            <div className="igihe-header">
              <div className="igihe-avatar">
                <Image src={"/assets/igiheIcon.png"} alt={""} height={30} width={30} />
                <span className="igihe-avatar__dot" />
              </div>
              <div>
                <div className="igihe-header__name">Ask IGIHE</div>
                <div className="igihe-header__sub">
                  <span className="igihe-header__sub-dot" />
                  Online
                </div>
              </div>
              <div className="igihe-header-actions">
                <button
                  className="igihe-icon-btn"
                  title="Clear conversation"
                  onClick={() => { setMessages([]); setShowQuickPrompts(true); }}
                >
                  ↺
                </button>
                <button
                  className="igihe-icon-btn"
                  title="Close (Esc)"
                  onClick={() => setIsOpen(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="igihe-messages">

              {messages.map((m, i) => (
                <div key={m.id}>
                  {/* Date divider for first message */}
                  {i === 0 && (
                    <div className="igihe-divider" style={{ marginBottom: 20 }}>
                      {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                  )}
                  <div className={`igihe-msg ${m.role === "user" ? "igihe-msg--user" : ""}`}>
                    {m.role === "user" ?
                      <div className={`igihe-msg__avatar igihe-msg__avatar--user`}>
                        👤
                      </div> :
                      <div className={`igihe-msg__avatar igihe-msg__avatar--ai`}>
                        <Image src={"/assets/igiheIcon.png"} alt={""} height={18} width={18} />
                      </div>
                    }

                    {/* <div className={`igihe-msg__avatar ${m.role === "user" ? "igihe-msg__avatar--user" : "igihe-msg__avatar--ai"}`}>
                      {m.role === "user" ? "👤" : "🤖"}
                    </div> */}

                    <div className="igihe-msg__body">
                      {/* <div className={`igihe-msg__bubble ${m.role === "user" ? "igihe-msg__bubble--user" : "igihe-msg__bubble--ai"}`}>
                        {parseCustomMarkup(m.text)}
                      </div> */}
                      <div
                        className={`igihe-msg__bubble ${m.role === "user" ? "igihe-msg__bubble--user" : "igihe-msg__bubble--ai"}`}
                      >
                        <ThemedText dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parseCustomMarkup(m.text) || '') }} />
                        {loading && m.role === "assistant" && m.text.length > 0 && messages[messages.length - 1]?.id === m.id && (
                          <span className="igihe-cursor" />
                        )}
                      </div>

                      <div className="igihe-msg__time">{formatTime(m.timestamp)}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* typing indicator only shown while assistant bubble is still empty */}
              {loading && messages[messages.length - 1]?.text === "" && (
                <div className="igihe-msg">
                  <div className="igihe-msg__avatar igihe-msg__avatar--ai">
                    <Image src={"/assets/igiheIcon.png"} alt={""} height={18} width={18} />
                  </div>
                  <div className="igihe-msg__body">
                    <TypingIndicator phase={typingPhase} phrases={typingPhrases} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {showQuickPrompts && !loading && (
              <div className="igihe-quick">
                <ThemedText className="igihe-quick__label">Suggested</ThemedText>
                <div className="igihe-quick__chips">
                  {quickPrompts.map(p => (
                    <button
                      key={p.cmd}
                      className="igihe-chip"
                      disabled={loading}
                      onClick={() => send(p.cmd)}
                    >
                      <span>{p.icon}</span>
                      <ThemedText>{p.label}</ThemedText>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="igihe-input-area">
              <div className="igihe-input-row">
                <button
                  className={`igihe-voice-btn ${isListening ? "igihe-voice-btn--listening" : ""}`}
                  onClick={handleVoice}
                  title="Voice input"
                  disabled={loading}
                >
                  {isListening ? "⏹" : "🎙"}
                </button>
                <textarea
                  ref={inputRef}
                  className="igihe-textarea"
                  rows={1}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKey}
                  placeholder={isArticleMode ? "Ask about this article…" : "Ask about any news story, topic or event…"}
                  disabled={loading}
                />
                <button
                  className="igihe-send-btn"
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  title="Send message"
                >
                  {loading
                    ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
                    : "↑"}
                </button>
              </div>
              <div className="igihe-input-hint">Enter to send · Shift+Enter for new line · Esc to close</div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .igihe-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: currentColor;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 0.8s step-start infinite;
        }
      `}</style>
    </>
  );
}
