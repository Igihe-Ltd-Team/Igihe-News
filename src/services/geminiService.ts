"use server";

import { NewsItem } from "@/types/fetchData";
import { stripHtml } from "@/lib/utils";
import { ApiService } from "./apiService";

// ─── Local AI server ──────────────────────────────────────────────────────────

const AI_API_URL = process.env.NEWS_AI_API_URL || "http://igihe.local";

async function callAI<T = Record<string, unknown>>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${AI_API_URL}/api/v1/news-ai${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`[AI] ${endpoint} → ${res.status}: ${msg}`);
  }
  return res.json();
}

async function callAIGet<T = Record<string, unknown>>(endpoint: string): Promise<T> {
  const res = await fetch(`${AI_API_URL}/api/v1/news-ai${endpoint}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`[AI] GET ${endpoint} → ${res.status}: ${msg}`);
  }
  return res.json();
}

// ─── User rate limiting (per IP) ─────────────────────────────────────────────

const userRateLimits = new Map<string, { count: number; resetTime: number }>();
const USER_RATE_LIMIT = 5;
const USER_RATE_WINDOW = 60_000;

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = userRateLimits.get(userId);
  if (!userLimit || now > userLimit.resetTime) {
    userRateLimits.set(userId, { count: 1, resetTime: now + USER_RATE_WINDOW });
    return true;
  }
  if (userLimit.count >= USER_RATE_LIMIT) return false;
  userLimit.count++;
  return true;
}

// ─── WordPress fetchers ───────────────────────────────────────────────────────

const ARTICLE_FIELDS = [
  "id", "date", "title", "excerpt", "content",
  "featured_image", "categories", "bylines", "link", "slug",
].join(",");

async function wpSearch(query: string, perPage = 20): Promise<NewsItem[]> {
  try {
    const res = await ApiService.fetchArticles({
      _fields: ARTICLE_FIELDS,
      per_page: perPage,
      search: encodeURIComponent(query),
      orderby: "relevance",
    });
    return res.data || [];
  } catch { return []; }
}

async function wpRecent(perPage = 30): Promise<NewsItem[]> {
  try {
    const res = await ApiService.fetchArticles({
      _fields: ARTICLE_FIELDS,
      per_page: perPage,
      orderby: "date",
      order: "desc",
    });
    return res.data || [];
  } catch { return []; }
}

async function wpByDate(after: string, _before?: string, perPage = 30): Promise<NewsItem[]> {
  try {
    const res = await ApiService.fetchArticles({
      after,
      per_page: perPage,
      _fields: ARTICLE_FIELDS,
      orderby: "date",
      order: "desc",
    });
    return res.data || [];
  } catch { return []; }
}

export async function fetchLatestArticles(): Promise<NewsItem[]> {
  return wpRecent(50);
}

// ─── Search plan (no AI calls) ────────────────────────────────────────────────

interface SearchPlan {
  searches: string[];
  needsRecent: boolean;
  dateAfter?: string;
}

const TOPIC_MAP: Array<{ patterns: RegExp; terms: string[] }> = [
  { patterns: /polit|gouvern|ministe|preside|parlement|senat|inteko|leta|gov't|govt|pm\b|president|government/i, terms: ["Govt", "government"] },
  { patterns: /sport|football|soccer|nba|nfl|epl|caf|afcon|tennis|athletics|ikipe|umupira|bal\b|fut\b/i, terms: ["sport", "football"] },
  { patterns: /econom|business|finance|bank|bnr|frw|usd|franc|dollar|isoko|ubucuruzi|gdp|imf|world bank/i, terms: ["economy", "business"] },
  { patterns: /health|hospital|disease|covid|hiv|aids|\btb\b|ubuzima|indwara|chuk/i, terms: ["health", "ubuzima"] },
  { patterns: /educat|school|univ\b|reb\b|tvet|kaminuza|amashuri/i, terms: ["education", "amashuri"] },
  { patterns: /securit|police|military|rdf\b|rnp\b|ingabo|umutekano|crime/i, terms: ["security", "RDF"] },
  { patterns: /kagame|perezida/i, terms: ["Kagame"] },
  { patterns: /africa|afrique|\bau\b|union africaine|eac\b|comesa/i, terms: ["Africa", "EAC"] },
  { patterns: /rwanda|kigali|intara|akarere/i, terms: ["Rwanda"] },
  { patterns: /culture|music|art|umuco|muziki|film|cinema/i, terms: ["culture", "umuco"] },
  { patterns: /tech|technolog|internet|digital|\bai\b|ikoranabuhanga|ict\b|risa\b/i, terms: ["technology", "ICT"] },
  { patterns: /environment|ibidukikije|climate|ikirere|rema\b|energy/i, terms: ["environment", "energy"] },
  { patterns: /justice|gacaca|inkiko|tribunal|court/i, terms: ["justice", "inkiko"] },
  { patterns: /transport|road|trafic|bus|moto|\bcar\b|rtda\b/i, terms: ["transport", "RTDA"] },
  { patterns: /agri|farm|ubuhinzi|crop|harvest|minagri|naeb/i, terms: ["agriculture", "ubuhinzi"] },
];

const STOP_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","have","has","had",
  "do","does","did","will","would","could","should","may","might","can",
  "what","who","how","when","where","why","which","that","this","these",
  "those","i","me","my","we","our","you","your","he","she","it","they",
  "them","their","and","or","but","in","on","at","to","for","of","with",
  "about","tell","show","find","get","give","news","article",
  "ndashaka","nifuza","mpabaze","jyandikira","ambwire","mbwire",
  "set","also","just","some","more","than","its","been","said",
]);

const SYNONYMS: Record<string, string[]> = {
  "government": ["Govt"], "govt": ["government"], "leta": ["Govt","government"],
  "budget": ["budget"], "ingengo": ["budget"], "framework": ["budget framework"],
  "economy": ["economy","economic"], "economic": ["economy"], "isoko": ["economy","business"],
  "ubucuruzi": ["business"], "increase": ["increase","growth"], "rise": ["increase","growth"],
  "ikuze": ["growth","increase"], "decrease": ["decrease","reduction"], "drop": ["decrease","fall"],
  "fall": ["decrease","drop"], "president": ["president","Kagame"], "perezida": ["president","Kagame"],
  "minister": ["minister","ministry"], "minisitiri": ["minister"], "hospital": ["hospital","health"],
  "indwara": ["health","disease"], "ubuzima": ["health"], "police": ["police","RNP"],
  "polisi": ["police","RNP"], "army": ["military","RDF"], "ingabo": ["military","RDF"],
  "school": ["school","education"], "amashuri": ["school","education"],
  "kaminuza": ["university"], "university": ["university","kaminuza"],
  "bnr": ["BNR","bank"], "bank": ["bank","BNR"], "banki": ["bank"],
  "rra": ["RRA","tax"], "tax": ["tax","RRA"], "umusoro": ["tax","RRA"],
  "election": ["election","amatora"], "amatora": ["election","vote"],
  "road": ["road","infrastructure"], "energy": ["energy","electricity"],
  "electricity": ["electricity","energy","REG"], "reg": ["REG","energy"],
  "water": ["water","WASAC"], "amazi": ["water","WASAC"], "wasac": ["WASAC","water"],
  "internet": ["internet","digital"], "digital": ["digital","ICT"], "ict": ["ICT","digital"],
};

const RECENCY_RE = /today|uyu munsi|aujourd|latest|breaking|now|just|recent|this week|iki cyumweru|dernier|maintenant/i;

function extractDateAfter(msg: string): string | undefined {
  const today = new Date();
  const shift = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };
  if (/yesterday|ejo/i.test(msg)) return shift(-1);
  if (/this week|iki cyumweru|cette semaine/i.test(msg)) return shift(-7);
  if (/last week|icyumweru gishize/i.test(msg)) return shift(-14);
  if (/this month|uku kwezi|ce mois/i.test(msg)) {
    const d = new Date(today); d.setDate(1); return d.toISOString().split("T")[0];
  }
  if (/last month|ukwezi gushize/i.test(msg)) {
    const d = new Date(today); d.setMonth(d.getMonth() - 1); d.setDate(1);
    return d.toISOString().split("T")[0];
  }
  const yr = msg.match(/\b(20\d{2})\b/);
  if (yr) return `${yr[1]}-01-01`;
  return undefined;
}

function buildSearchPlan(msg: string): SearchPlan {
  const p1 = new Set<string>();
  const p2 = new Set<string>();
  const p3 = new Set<string>();
  const p4 = new Set<string>();

  const cleanMsg = msg.replace(/[^\w\sÀ-ɏ]/g, " ");
  const words = cleanMsg.toLowerCase().split(/\s+/).filter(Boolean);

  [...msg.matchAll(/"([^"]+)"/g)].forEach(m => p1.add(m[1]));
  [...msg.matchAll(/\b([A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÙÚÛÜ][a-zàáâãäåèéêëìíîïòóôõùúûü]{1,}(?:\s[A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÙÚÛÜ][a-zàáâãäåèéêëìíîïòóôõùúûü]{1,})*)\b/g)].forEach(m => p1.add(m[1]));
  [...msg.matchAll(/\b([A-Z]{2,6})\b/g)].forEach(m => p1.add(m[1]));
  words.forEach(word => { const syns = SYNONYMS[word]; if (syns) syns.forEach(s => p2.add(s)); });
  for (const { patterns, terms } of TOPIC_MAP) { if (patterns.test(msg)) terms.forEach(t => p3.add(t)); }
  words.filter(w => w.length >= 4 && !STOP_WORDS.has(w)).forEach(w => p4.add(w));

  const final = new Set<string>();
  for (const bucket of [p1, p2, p3, p4]) {
    for (const term of bucket) { if (final.size >= 8) break; final.add(term); }
    if (final.size >= 8) break;
  }
  if (final.size === 0) final.add(cleanMsg.trim().slice(0, 60));

  return { searches: [...final], needsRecent: RECENCY_RE.test(msg), dateAfter: extractDateAfter(msg) };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatArticles(articles: NewsItem[]): string {
  return articles.map((a, i) => {
    const excerpt = stripHtml(a.excerpt?.rendered || "").slice(0, 200);
    const content = stripHtml(a.content?.rendered || "").slice(0, 1500);
    const date = new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return [
      `[${i + 1}] (${date}) ${a.title.rendered}`,
      `Excerpt: ${excerpt}`,
      `Full Content: ${content}`,
      `Link: ${process.env.NEXT_PUBLIC_APP_URL}/news/article/${a.slug}`,
    ].join("\n");
  }).join("\n\n");
}

function dedup(batches: NewsItem[][]): NewsItem[] {
  const seen = new Set<number>();
  const out: NewsItem[] = [];
  for (const batch of batches) {
    for (const a of batch) {
      if (!seen.has(a.id)) { seen.add(a.id); out.push(a); }
    }
  }
  return out;
}

function articlePayload(article: NewsItem) {
  return {
    id: article.id,
    title: article.title?.rendered ?? "",
    content: stripHtml(article.content?.rendered || ""),
    excerpt: stripHtml(article.excerpt?.rendered || ""),
    date: article.date,
    slug: article.slug,
    link: article.link,
  };
}

function ruleBasedSummary(articles: NewsItem[]): string {
  if (articles.length === 0) return "I couldn't find articles matching your query. Please try different keywords.";
  const lines = articles.slice(0, 5).map(a => {
    const date = new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const excerpt = stripHtml(a.excerpt?.rendered || "").slice(0, 400).trim();
    return [
      `${a.title.rendered}`,
      `(${date}) ${excerpt ? excerpt + "…" : ""}`,
      `[Read more →](${process.env.NEXT_PUBLIC_APP_URL}/news/article/${a.slug})`,
      `---`,
    ].join("\n");
  });
  return `Here are the most relevant articles I found:\n\n${lines.join("\n\n")}\n\n_AI summarisation is temporarily unavailable._`;
}

// ─── Article-level AI actions ─────────────────────────────────────────────────

export async function summarizeArticle(article: NewsItem): Promise<string> {
  try {
    const data = await callAI<{ summary?: string; text?: string; result?: string }>(
      "/article/summarize",
      { article: articlePayload(article) }
    );
    return data.summary ?? data.text ?? data.result ?? "";
  } catch (err) {
    console.error("[AI] summarizeArticle:", err);
    return stripHtml(article.excerpt?.rendered || "").slice(0, 300) + "…";
  }
}

export async function askAboutArticle(article: NewsItem, question: string): Promise<string> {
  try {
    const data = await callAI<{ answer?: string; text?: string; result?: string }>(
      "/article/ask",
      { article: articlePayload(article), question }
    );
    return data.answer ?? data.text ?? data.result ?? "AI is temporarily unavailable.";
  } catch (err) {
    console.error("[AI] askAboutArticle:", err);
    return "AI is temporarily unavailable. Please read the full article for details.";
  }
}

export async function getKeyTakeaways(article: NewsItem): Promise<string[]> {
  try {
    const data = await callAI<{ takeaways?: string[]; points?: string[]; text?: string }>(
      "/article/takeaways",
      { article: articlePayload(article) }
    );
    if (Array.isArray(data.takeaways)) return data.takeaways;
    if (Array.isArray(data.points)) return data.points;
    if (typeof data.text === "string") {
      return data.text.split("\n").map(l => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
    }
    return [];
  } catch (err) {
    console.error("[AI] getKeyTakeaways:", err);
    return [stripHtml(article.excerpt?.rendered || "").slice(0, 200)].filter(Boolean);
  }
}

export async function analyzeSentiment(article: NewsItem) {
  try {
    const data = await callAI<{ sentiment?: string; label?: string; explanation?: string; description?: string }>(
      "/article/sentiment",
      { article: articlePayload(article) }
    );
    return {
      sentiment: (data.sentiment ?? data.label ?? "neutral") as string,
      explanation: (data.explanation ?? data.description ?? "No explanation available") as string,
    };
  } catch (err) {
    console.error("[AI] analyzeSentiment:", err);
    return { sentiment: "neutral", explanation: "AI analysis temporarily unavailable." };
  }
}

export async function extractTopics(article: NewsItem): Promise<string[]> {
  try {
    const data = await callAI<{ topics?: string[]; tags?: string[]; text?: string }>(
      "/article/topics",
      { article: articlePayload(article) }
    );
    if (Array.isArray(data.topics)) return data.topics;
    if (Array.isArray(data.tags)) return data.tags;
    if (typeof data.text === "string") {
      return data.text.split("\n").map(t => t.trim()).filter(Boolean);
    }
    return [];
  } catch (err) {
    console.error("[AI] extractTopics:", err);
    return [article.title?.rendered ?? ""].filter(Boolean);
  }
}

export async function explainSimply(text: string): Promise<string> {
  try {
    const data = await callAI<{ explanation?: string; text?: string; result?: string }>(
      "/explain",
      { text }
    );
    return data.explanation ?? data.text ?? data.result ?? text;
  } catch (err) {
    console.error("[AI] explainSimply:", err);
    return text;
  }
}

export async function generateDailyDigest(articles: NewsItem[]): Promise<string> {
  try {
    const data = await callAI<{ digest?: string; text?: string; summary?: string }>(
      "/digest",
      { articles: articles.map(articlePayload) }
    );
    return data.digest ?? data.text ?? data.summary ?? `Today's top stories:\n${articles.map(a => `- ${a.title.rendered}`).join("\n")}`;
  } catch (err) {
    console.error("[AI] generateDailyDigest:", err);
    return `Today's top stories:\n${articles.map(a => `- ${a.title.rendered}`).join("\n")}`;
  }
}

export async function semanticSearch(query: string, articles: NewsItem[]): Promise<NewsItem[]> {
  try {
    const data = await callAI<{ results?: NewsItem[]; articles?: NewsItem[]; indices?: number[] }>(
      "/search",
      { query, articles: articles.map(articlePayload) }
    );
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.articles)) return data.articles;
    if (Array.isArray(data.indices)) {
      return data.indices.filter(n => !isNaN(n) && n < articles.length).map(i => articles[i]);
    }
    return [];
  } catch (err) {
    console.error("[AI] semanticSearch:", err);
    return [];
  }
}

export async function getRecommendations(read: NewsItem[], available: NewsItem[]): Promise<number[]> {
  try {
    const data = await callAI<{ recommendations?: number[]; indices?: number[]; text?: string }>(
      "/recommendations",
      { read: read.map(articlePayload), available: available.map(articlePayload) }
    );
    const raw = data.recommendations ?? data.indices;
    if (Array.isArray(raw)) return raw.filter(n => !isNaN(n) && n < available.length).slice(0, 5);
    if (typeof data.text === "string") {
      return data.text.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n < available.length).slice(0, 5);
    }
    return [0, 1, 2, 3, 4].slice(0, available.length);
  } catch (err) {
    console.error("[AI] getRecommendations:", err);
    return [0, 1, 2, 3, 4].slice(0, available.length);
  }
}

// ─── AI News Agent ────────────────────────────────────────────────────────────

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithNewsAgent(messages: AgentMessage[], userId?: string): Promise<string> {
  if (userId && !checkUserRateLimit(userId)) {
    return "You're sending messages too quickly. Please wait a moment before trying again.";
  }

  if (!messages.some(m => m.role === "user")) return "Please ask me something!";

  const data = await callAI<{ text?: string; response?: string; message?: string; answer?: string }>(
    "/chat",
    { messages }
  );
  return data.text ?? data.response ?? data.message ?? data.answer ?? "No response from AI.";
}
