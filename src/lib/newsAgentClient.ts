import { NewsItem } from "@/types/fetchData";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export type NewsAgentOptions = {
  article?: NewsItem;
  sourceSite: string;
  language: "en" | "fr" | "rw";
};

export type StreamCallbacks = {
  onChunk: (chunk: string) => void;
  onReset: () => void;
};

const DIRECT_AI_API_URL = "https://ai.inoventyk.rw";

const PROXY_ERROR_PATTERNS = [
  /IGIHE AI service .*returned/i,
  /IGIHE AI service .*reachable/i,
  /couldn'?t connect to the IGIHE AI service/i,
  /upstream error/i,
  /Please try again in a moment/i,
];

const DIRECT_CHUNK_SIZE = 420;

export const QUICK_PROMPTS = [
  { icon: "🌍", label: "Today's headlines", cmd: "What are the top headlines today?" },
  { icon: "🇷🇼", label: "Rwanda news", cmd: "What's the latest news about Rwanda?" },
  { icon: "⚽", label: "Sports update", cmd: "What's the latest sports news?" },
  { icon: "💼", label: "Business & Economy", cmd: "Tell me about recent business and economy news" },
  { icon: "🌐", label: "International", cmd: "What's happening internationally?" },
];

export const ARTICLE_QUICK_PROMPTS = [
  { icon: "🧾", label: "Summarize", cmd: "Summarize this article in a few clear points." },
  { icon: "✅", label: "Key takeaways", cmd: "What are the key takeaways from this article?" },
  { icon: "❓", label: "Explain simply", cmd: "Explain this article in simple terms." },
  { icon: "🧭", label: "Why it matters", cmd: "Why does this article matter?" },
  { icon: "🔎", label: "Facts only", cmd: "List the main facts stated in this article." },
];

export const TYPING_PHRASES = [
  "Searching IGIHE database…",
  "Reading latest articles…",
  "Analyzing results…",
  "Preparing response…",
];

export const ARTICLE_TYPING_PHRASES = [
  "Reading this article…",
  "Checking the stored text…",
  "Grounding the answer…",
  "Preparing response…",
];

export function plainText(value?: string) {
  return (value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function articleTitle(article?: NewsItem) {
  return plainText(article?.title?.rendered) || "this article";
}

export function resolveSourceSite() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || "https://en.igihe.com";
  }
  return window.location.origin || process.env.NEXT_PUBLIC_APP_URL || "https://en.igihe.com";
}

export function resolveLanguage(sourceSite: string): "en" | "fr" | "rw" {
  const site = sourceSite.toLowerCase();
  if (site.includes("fr.igihe.com")) return "fr";
  if (site.includes("igihe.com") && !site.includes("en.igihe.com") && !site.includes("fr.igihe.com")) return "rw";
  return "en";
}

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

  for (let i = 0; i < text.length; i += DIRECT_CHUNK_SIZE) {
    callbacks.onChunk(text.slice(i, i + DIRECT_CHUNK_SIZE));
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

export async function chatWithNewsAgent(
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
