// "use server";

// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { NewsItem } from "@/types/fetchData";
// import { stripHtml } from "@/lib/utils";

// const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GERMINI_API;
// const WP_API = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
// if (!GEMINI_API_KEY) console.warn("GEMINI_API_KEY is not set – Gemini will not work");

// const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
// const model = genAI?.getGenerativeModel({ model: "gemini-3-flash-preview" });

// // const WP_API = "https://new.igihe.com/wp-json/wp/v2";

// const ARTICLE_FIELDS = [
//   "id", "date", "title", "excerpt", "content",
//   "featured_image", "categories", "bylines", "link", "slug",
// ].join(",");

// // ─── WordPress fetchers ───────────────────────────────────────────────────────

// /**
//  * Search the full igihe.com database by keyword.
//  * The WP REST API `search` param queries post titles and content.
//  */
// async function wpSearch(query: string, perPage = 20): Promise<NewsItem[]> {
//   const url = `${WP_API}/posts?search=${encodeURIComponent(query)}&per_page=${perPage}&_fields=${ARTICLE_FIELDS}&orderby=relevance`;
//   const res = await fetch(url, { next: { revalidate: 60 } });
//   if (!res.ok) return [];
//   return res.json();
// }

// /**
//  * Fetch the N most recent posts (used for "what's happening today" style queries).
//  */
// async function wpRecent(perPage = 30): Promise<NewsItem[]> {
//   const url = `${WP_API}/posts?per_page=${perPage}&_fields=${ARTICLE_FIELDS}&orderby=date&order=desc`;
//   const res = await fetch(url, { next: { revalidate: 120 } });
//   if (!res.ok) return [];
//   return res.json();
// }

// /**
//  * Fetch posts from a specific date range (YYYY-MM-DD).
//  */
// async function wpByDate(after: string, before?: string, perPage = 30): Promise<NewsItem[]> {
//   let url = `${WP_API}/posts?after=${after}T00:00:00&per_page=${perPage}&_fields=${ARTICLE_FIELDS}&orderby=date&order=desc`;
//   if (before) url += `&before=${before}T23:59:59`;
//   const res = await fetch(url, { next: { revalidate: 120 } });
//   if (!res.ok) return [];
//   return res.json();
// }

// /**
//  * Fetch posts by category ID.
//  */
// async function wpByCategory(categoryId: number, perPage = 20): Promise<NewsItem[]> {
//   const url = `${WP_API}/posts?categories=${categoryId}&per_page=${perPage}&_fields=${ARTICLE_FIELDS}&orderby=date&order=desc`;
//   const res = await fetch(url, { next: { revalidate: 120 } });
//   if (!res.ok) return [];
//   return res.json();
// }

// /**
//  * Fetch a single post by ID.
//  */
// export async function fetchArticleById(id: number): Promise<NewsItem> {
//   const res = await fetch(`${WP_API}/posts/${id}`, { next: { revalidate: 300 } });
//   if (!res.ok) throw new Error(`WP API error: ${res.status}`);
//   return res.json();
// }

// /**
//  * Fetch the 50 most recent posts (used by other AI actions).
//  */
// export async function fetchLatestArticles(): Promise<NewsItem[]> {
//   return wpRecent(50);
// }

// // ─── Internal helpers ─────────────────────────────────────────────────────────

// async function generate(prompt: string): Promise<string> {
//   if (!model) throw new Error("Gemini API key not configured");
//   const result = await model.generateContent(prompt);
//   return result.response.text().trim();
// }

// function detectLang(article: NewsItem): string {
//   const lang = (article as any).lang || (article as any).language || (article as any).locale;
//   return lang ? lang.split("_")[0] : "auto";
// }

// function langDirective(article: NewsItem): string {
//   const lang = detectLang(article);
//   return lang === "auto"
//     ? "Always respond in the same language as the article content."
//     : `Always respond in language code: ${lang}.`;
// }

// function formatArticles(articles: NewsItem[]): string {
//   return articles
//     .map((a, i) => {
//       const excerpt = stripHtml(a.excerpt?.rendered || a.content?.rendered || "").slice(0, 400);
//       const date = new Date(a.date).toLocaleDateString("en-GB", {
//         day: "numeric", month: "short", year: "numeric",
//       });
//       return `[${i + 1}] (${date}) ${a.title.rendered}\n${excerpt}\nURL: ${a.link}`;
//     })
//     .join("\n\n");
// }

// // ─── Article-level AI actions ─────────────────────────────────────────────────

// export async function summarizeArticle(article: NewsItem): Promise<string> {
//   const content = stripHtml(article.content?.rendered || "");
//   return generate(`
// ${langDirective(article)}
// Summarize this article in 3–4 sentences.
// Title: ${article.title.rendered}
// Content: ${content}
// Summary:`);
// }

// export async function askAboutArticle(article: NewsItem, q: string): Promise<string> {
//   const content = stripHtml(article.content?.rendered || "");
//   return generate(`
// ${langDirective(article)}
// Answer the question based ONLY on the article below.
// Title: ${article.title.rendered}
// Content: ${content}
// Question: ${q}
// Answer:`);
// }

// export async function getKeyTakeaways(article: NewsItem): Promise<string[]> {
//   const content = stripHtml(article.content?.rendered || "");
//   const text = await generate(`
// ${langDirective(article)}
// Extract 3–5 key takeaways as bullet points.
// Title: ${article.title.rendered}
// Content: ${content}
// Return one per line:`);
//   return text.split("\n").map((l) => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
// }

// export async function explainSimply(text: string, article?: NewsItem): Promise<string> {
//   const lang = article ? langDirective(article) : "Respond in the same language as the text.";
//   return generate(`${lang}\nExplain this in simple terms:\n"${text}"\nExplanation:`);
// }

// export async function getRecommendations(read: NewsItem[], available: NewsItem[]): Promise<number[]> {
//   const readTitles = read.map((a) => a.title.rendered).join(", ");
//   const list = available.map((a, i) => `${i}: ${a.title.rendered}`).join("\n");
//   const text = await generate(`
// User read: ${readTitles}
// Recommend 5 from the list below matching their interests and language(s):
// ${list}
// Return ONLY comma-separated indices:`);
//   return text.split(",").map((n) => parseInt(n.trim())).filter((n) => !isNaN(n) && n < available.length).slice(0, 5);
// }

// export async function generateDailyDigest(articles: NewsItem[]): Promise<string> {
//   const hint = detectLang(articles[0]);
//   const lang = hint === "auto" ? "Respond in the same language as the article titles." : `Respond in language code: ${hint}.`;
//   const titles = articles.map((a) => `- ${a.title.rendered}`).join("\n");
//   return generate(`${lang}\nWrite a 2–3 paragraph daily news digest covering:\n${titles}\nDigest:`);
// }

// export async function semanticSearch(query: string, articles: NewsItem[]): Promise<NewsItem[]> {
//   const list = articles.map((a, i) => `${i}: ${a.title.rendered}`).join("\n");
//   const text = await generate(`
// Search query: "${query}"
// Find semantically matching articles, including cross-language matches.
// ${list}
// Return comma-separated indices:`);
//   return text.split(",").map((n) => parseInt(n.trim())).filter((n) => !isNaN(n) && n < articles.length).map((i) => articles[i]);
// }

// export async function analyzeSentiment(article: NewsItem) {
//   const content = stripHtml(article.content?.rendered || "");
//   const text = await generate(`
// ${langDirective(article)}
// Analyze sentiment:
// Title: ${article.title.rendered}
// Content: ${content}
// Return exactly:
// SENTIMENT: positive/negative/neutral
// EXPLANATION: one sentence`);
//   return {
//     sentiment: text.match(/SENTIMENT:\s*(positive|negative|neutral)/i)?.[1] ?? "neutral",
//     explanation: text.match(/EXPLANATION:\s*(.+)/i)?.[1] ?? "No explanation available",
//   };
// }

// export async function extractTopics(article: NewsItem) {
//   const content = stripHtml(article.content?.rendered || "");
//   const text = await generate(`
// ${langDirective(article)}
// Extract 3–5 topics:
// ${article.title.rendered}
// ${content}
// Topics:`);
//   return text.split("\n").map((t) => t.trim()).filter(Boolean);
// }

// // ─── AI News Agent — full database access ────────────────────────────────────

// export interface AgentMessage {
//   role: "user" | "assistant";
//   content: string;
// }

// /**
//  * Step 1 — Ask the model to produce a structured search plan based on the user's message.
//  * Returns: { intent, searches: string[], needsRecent: boolean, dateAfter?: string }
//  */
// async function planSearches(userMessage: string, today: string): Promise<{
//   intent: string;
//   searches: string[];
//   needsRecent: boolean;
//   dateAfter?: string;
// }> {
//   const raw = await generate(`
// Today's date: ${today}

// The user asked: "${userMessage}"

// Analyze this and produce a JSON search plan to retrieve relevant articles from the IGIHE WordPress database.
// Return ONLY valid JSON with these fields:
// {
//   "intent": "brief description of what the user wants",
//   "searches": ["keyword1", "keyword2"],   // 1–4 short WP search queries (English or Kinyarwanda)
//   "needsRecent": true/false,              // true if user wants latest/today's news
//   "dateAfter": "YYYY-MM-DD or null"       // if user references a specific date or period
// }

// Rules:
// - Keep searches short (1–3 words), specific, and varied to maximize coverage
// - If the user asks about "today" or "latest", set needsRecent: true
// - If they mention a specific topic (politics, sport, Rwanda, etc.) add a matching search term
// - Return ONLY the JSON object, no markdown, no extra text`);

//   try {
//     return JSON.parse(raw.replace(/```json|```/g, "").trim());
//   } catch {
//     // Fallback plan
//     return { intent: userMessage, searches: [userMessage.slice(0, 50)], needsRecent: true };
//   }
// }

// /**
//  * The main agent. For every user message it:
//  * 1. Plans which searches to run against the full igihe.com database
//  * 2. Executes those searches in parallel (WP REST API search + optional recent/date fetch)
//  * 3. Deduplicates results
//  * 4. Answers using the fetched articles + full conversation history
//  *
//  * This gives it access to ALL articles, not just the latest N.
//  */
// export async function chatWithNewsAgent(messages: AgentMessage[]): Promise<string> {
//   const lastUser = [...messages].reverse().find((m) => m.role === "user");
//   if (!lastUser) return "Please ask me something!";

//   const today = new Date().toISOString().split("T")[0];
//   const todayFormatted = new Date().toLocaleDateString("en-GB", {
//     weekday: "long", day: "numeric", month: "long", year: "numeric",
//   });

//   // ── Step 1: plan ──
//   const plan = await planSearches(lastUser.content, today);

//   // ── Step 2: fetch in parallel ──
//   const fetches: Promise<NewsItem[]>[] = plan.searches.map((q) => wpSearch(q, 15));
//   if (plan.needsRecent) fetches.push(wpRecent(30));
//   if (plan.dateAfter) fetches.push(wpByDate(plan.dateAfter, undefined, 20));

//   const batches = await Promise.all(fetches);

//   // ── Step 3: deduplicate by id ──
//   const seen = new Set<number>();
//   const articles: NewsItem[] = [];
//   for (const batch of batches) {
//     for (const a of batch) {
//       if (!seen.has(a.id)) {
//         seen.add(a.id);
//         articles.push(a);
//       }
//     }
//   }

//   // ── Step 4: answer ──
//   const newsContext = articles.length > 0
//     ? formatArticles(articles)
//     : "No articles found for this query in the database.";

//   const history = messages
//     .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
//     .join("\n");

//   return generate(`
// You are the AI news assistant for IGIHE (new.igihe.com), a leading Rwandan news outlet.
// You have access to IGIHE's full article database — you just searched it and retrieved the most relevant results below.
// Today is ${todayFormatted}.

// Always respond in the same language the user is writing in (English, Kinyarwanda, French, etc.).
// Be conversational and informative. Reference article titles naturally in your answers.
// If the retrieved articles don't fully answer the question, say so and suggest the user refine their query.
// Never invent facts — only use what's in the articles below.

// === RETRIEVED ARTICLES (${articles.length} found) ===
// ${newsContext}

// === CONVERSATION ===
// ${history}
// Assistant:`);
// }





"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NewsItem } from "@/types/fetchData";
import { stripHtml } from "@/lib/utils";


const GEMINI_KEYS = [
  process.env.NEXT_PUBLIC_GERMINI_API,
  process.env.NEXT_PUBLIC_GERMINI_API2,
  // process.env.GEMINI_API_KEY_2,
  // process.env.GEMINI_API_KEY_3,
  // process.env.GEMINI_API_KEY_4,
  // process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[];

if (GEMINI_KEYS.length === 0) {
  console.warn("[AI] No Gemini API keys configured. Add GEMINI_API_KEY_1 to .env");
}

// Track which keys are exhausted for this process lifetime
// (resets when the server restarts, which is fine — daily quota resets too)
const exhaustedKeys = new Set<string>();

function getAvailableKey(): string | null {
  return GEMINI_KEYS.find(k => !exhaustedKeys.has(k)) ?? null;
}

function markExhausted(key: string) {
  exhaustedKeys.add(key);
  const remaining = GEMINI_KEYS.length - exhaustedKeys.size;
  console.warn(`[AI] Key ...${key.slice(-6)} exhausted. ${remaining} key(s) remaining.`);
}

// ─── Core generate() with key rotation ───────────────────────────────────────

async function generate(prompt: string, fallback?: string): Promise<string> {
  // Try each available key in order
  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const key = getAvailableKey();
    if (!key) break; // all keys exhausted

    try {
      const client = new GoogleGenerativeAI(key);
      const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err: any) {
      const isQuota =
        err?.status === 429 ||
        String(err?.message).toLowerCase().includes("quota") ||
        String(err?.message).toLowerCase().includes("rate limit") ||
        String(err?.message).toLowerCase().includes("resource exhausted") ||
        String(err?.message).toLowerCase().includes("too many requests");

      if (isQuota) {
        markExhausted(key);
        continue; // try next key
      }

      // Real error (bad prompt, network, etc.) — don't rotate, just fail
      console.error("[AI] Gemini error:", err?.message);
      break;
    }
  }

  // All keys exhausted or failed — use rule-based fallback
  if (fallback !== undefined) return fallback;
  throw new Error("All Gemini API keys are exhausted. Please try again tomorrow or add more keys.");
}

// ─── WordPress fetchers ───────────────────────────────────────────────────────
const WP_API = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
// const WP_API = "https://new.igihe.com/wp-json/wp/v2";
const ARTICLE_FIELDS = [
  "id", "date", "title", "excerpt", "content",
  "featured_image", "categories", "bylines", "link", "slug",
].join(",");

async function wpSearch(query: string, perPage = 20): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `${WP_API}/posts?search=${encodeURIComponent(query)}&per_page=${perPage}&_fields=${ARTICLE_FIELDS}&orderby=relevance`,
      { next: { revalidate: 60 } }
    );
    return res.ok ? res.json() : [];
  } catch { return []; }
}

async function wpRecent(perPage = 30): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `${WP_API}/posts?per_page=${perPage}&_fields=${ARTICLE_FIELDS}&orderby=date&order=desc`,
      { next: { revalidate: 120 } }
    );
    return res.ok ? res.json() : [];
  } catch { return []; }
}

async function wpByDate(after: string, before?: string, perPage = 30): Promise<NewsItem[]> {
  try {
    let url = `${WP_API}/posts?after=${after}T00:00:00&per_page=${perPage}&_fields=${ARTICLE_FIELDS}&orderby=date&order=desc`;
    if (before) url += `&before=${before}T23:59:59`;
    const res = await fetch(url, { next: { revalidate: 120 } });
    return res.ok ? res.json() : [];
  } catch { return []; }
}

export async function fetchArticleById(id: number): Promise<NewsItem> {
  const res = await fetch(`${WP_API}/posts/${id}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`WP API error: ${res.status}`);
  return res.json();
}

export async function fetchLatestArticles(): Promise<NewsItem[]> {
  return wpRecent(50);
}

// ─── Pure-JS search planner (0 AI calls) ─────────────────────────────────────

interface SearchPlan {
  searches: string[];
  needsRecent: boolean;
  dateAfter?: string;
}

const TOPIC_MAP: Array<{ patterns: RegExp; terms: string[] }> = [
  { patterns: /polit|gouvern|ministe|preside|parlement|senat|inteko|leta/i,    terms: ["politique", "gouvernement"] },
  { patterns: /sport|football|soccer|nba|tennis|athletics|ikipe|umupira/i,     terms: ["sport", "football"] },
  { patterns: /econom|business|finance|bank|franc|dollar|isoko|ubucuruzi/i,    terms: ["economie", "business"] },
  { patterns: /health|hospital|disease|covid|ubuzima|indwara/i,                terms: ["sante", "ubuzima"] },
  { patterns: /educat|school|university|kaminuza|amashuri/i,                   terms: ["education", "amashuri"] },
  { patterns: /securit|police|military|ingabo|umutekano|crime/i,               terms: ["securite", "umutekano"] },
  { patterns: /kagame|perezida/i,                                               terms: ["Kagame"] },
  { patterns: /africa|afrique|continental|union africaine/i,                   terms: ["Afrique"] },
  { patterns: /rwanda|kigali|intara|akarere/i,                                 terms: ["Rwanda"] },
  { patterns: /culture|music|art|umuco|muziki/i,                               terms: ["culture", "umuco"] },
  { patterns: /technolog|internet|digital|ikoranabuhanga/i,                    terms: ["technologie"] },
  { patterns: /environment|ibidukikije|climate|ikirere/i,                      terms: ["environnement", "ibidukikije"] },
];

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
  const searches = new Set<string>();
  for (const { patterns, terms } of TOPIC_MAP) {
    if (patterns.test(msg)) terms.forEach(t => searches.add(t));
  }
  [...msg.matchAll(/"([^"]+)"/g)].forEach(m => searches.add(m[1]));
  [...msg.matchAll(/\b([A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÙÚÛÜ][a-zàáâãäåèéêëìíîïòóôõùúûü]{2,}(?:\s[A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÙÚÛÜ][a-zàáâãäåèéêëìíîïòóôõùúûü]{2,})*)\b/g)]
    .forEach(m => searches.add(m[1]));
  if (searches.size === 0) {
    searches.add(msg.replace(/[^\w\s\u00C0-\u024F]/g, " ").trim().slice(0, 60));
  }
  return {
    searches: [...searches].slice(0, 4),
    needsRecent: RECENCY_RE.test(msg),
    dateAfter: extractDateAfter(msg),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectLang(article: NewsItem): string {
  const lang = (article as any).lang || (article as any).language || (article as any).locale;
  return lang ? lang.split("_")[0] : "auto";
}

function langDirective(article: NewsItem): string {
  const lang = detectLang(article);
  return lang === "auto"
    ? "Always respond in the same language as the article content."
    : `Always respond in language code: ${lang}.`;
}

function formatArticles(articles: NewsItem[]): string {
  return articles.map((a, i) => {
    const excerpt = stripHtml(a.excerpt?.rendered || a.content?.rendered || "").slice(0, 400);
    const date = new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `[${i + 1}] (${date}) ${a.title.rendered}\n${excerpt}\nURL: ${a.link}`;
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

// ─── Rule-based fallback (0 AI calls) ────────────────────────────────────────
// Shown when all Gemini keys are exhausted. Still useful — shows real articles.

function ruleBasedSummary(articles: NewsItem[]): string {
  if (articles.length === 0) {
    return "I couldn't find articles matching your query. Please try different keywords.";
  }
  const lines = articles.slice(0, 5).map((a, i) => {
    const date = new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const excerpt = stripHtml(a.excerpt?.rendered || "").slice(0, 120).trim();
    return `${i + 1}. **${a.title.rendered}** (${date})${excerpt ? `\n   ${excerpt}…` : ""}`;
  });
  return `Here are the most relevant articles I found:\n\n${lines.join("\n\n")}\n\n_AI summarisation is temporarily unavailable — showing raw results from the database._`;
}

// ─── Article-level AI actions ─────────────────────────────────────────────────

export async function summarizeArticle(article: NewsItem): Promise<string> {
  const content = stripHtml(article.content?.rendered || "");
  return generate(
    `${langDirective(article)}\nSummarize this article in 3–4 sentences.\nTitle: ${article.title.rendered}\nContent: ${content}\nSummary:`,
    stripHtml(article.excerpt?.rendered || content).slice(0, 300) + "…"
  );
}


export async function semanticSearch(
  query: string,
  articles: NewsItem[]
): Promise<NewsItem[]> {
  const list = articles.map((a, i) => `${i}: ${a.title.rendered}`).join("\n");

  const text = await generate(`
Search query: "${query}"

From list:
${list}

Return top matching indices:
    `);

  return text
    .split(",")
    .map((n) => parseInt(n.trim()))
    .filter((n) => !isNaN(n) && n < articles.length)
    .map((i) => articles[i]);
}

export async function askAboutArticle(article: NewsItem, q: string): Promise<string> {
  const content = stripHtml(article.content?.rendered || "");
  return generate(
    `${langDirective(article)}\nAnswer the question based ONLY on the article below.\nTitle: ${article.title.rendered}\nContent: ${content}\nQuestion: ${q}\nAnswer:`,
    "AI is temporarily unavailable. Please read the full article for details."
  );
}

export async function getKeyTakeaways(article: NewsItem): Promise<string[]> {
  const content = stripHtml(article.content?.rendered || "");
  const text = await generate(
    `${langDirective(article)}\nExtract 3–5 key takeaways as bullet points.\nTitle: ${article.title.rendered}\nContent: ${content}\nReturn one per line:`,
    stripHtml(article.excerpt?.rendered || "").slice(0, 200)
  );
  return text.split("\n").map(l => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
}

export async function explainSimply(text: string, article?: NewsItem): Promise<string> {
  const lang = article ? langDirective(article) : "Respond in the same language as the text.";
  return generate(`${lang}\nExplain this in simple terms:\n"${text}"\nExplanation:`, text);
}

export async function getRecommendations(read: NewsItem[], available: NewsItem[]): Promise<number[]> {
  const readTitles = read.map(a => a.title.rendered).join(", ");
  const list = available.map((a, i) => `${i}: ${a.title.rendered}`).join("\n");
  const text = await generate(
    `User read: ${readTitles}\nRecommend 5 from the list below matching their interests:\n${list}\nReturn ONLY comma-separated indices:`,
    "0,1,2,3,4"
  );
  return text.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n < available.length).slice(0, 5);
}

export async function generateDailyDigest(articles: NewsItem[]): Promise<string> {
  const hint = detectLang(articles[0]);
  const lang = hint === "auto" ? "Respond in the same language as the article titles." : `Respond in language code: ${hint}.`;
  const titles = articles.map(a => `- ${a.title.rendered}`).join("\n");
  return generate(
    `${lang}\nWrite a 2–3 paragraph daily news digest covering:\n${titles}\nDigest:`,
    `Today's top stories:\n${titles}`
  );
}

export async function analyzeSentiment(article: NewsItem) {
  const content = stripHtml(article.content?.rendered || "");
  const text = await generate(
    `${langDirective(article)}\nAnalyze sentiment:\nTitle: ${article.title.rendered}\nContent: ${content}\nReturn exactly:\nSENTIMENT: positive/negative/neutral\nEXPLANATION: one sentence`,
    "SENTIMENT: neutral\nEXPLANATION: AI analysis temporarily unavailable."
  );
  return {
    sentiment: text.match(/SENTIMENT:\s*(positive|negative|neutral)/i)?.[1] ?? "neutral",
    explanation: text.match(/EXPLANATION:\s*(.+)/i)?.[1] ?? "AI analysis temporarily unavailable.",
  };
}

export async function extractTopics(article: NewsItem) {
  const content = stripHtml(article.content?.rendered || "");
  const text = await generate(
    `${langDirective(article)}\nExtract 3–5 topics:\n${article.title.rendered}\n${content}\nTopics:`,
    article.title.rendered
  );
  return text.split("\n").map(t => t.trim()).filter(Boolean);
}

// ─── AI News Agent ────────────────────────────────────────────────────────────

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithNewsAgent(messages: AgentMessage[]): Promise<string> {
  const lastUser = [...messages].reverse().find(m => m.role === "user");
  if (!lastUser) return "Please ask me something!";

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Step 1 — JS search plan (free, 0 Gemini calls)
  const plan = buildSearchPlan(lastUser.content);

  // Step 2 — WP fetches in parallel (free, 0 Gemini calls)
  const fetches: Promise<NewsItem[]>[] = plan.searches.map(q => wpSearch(q, 15));
  if (plan.needsRecent) fetches.push(wpRecent(25));
  if (plan.dateAfter)   fetches.push(wpByDate(plan.dateAfter, undefined, 20));
  const articles = dedup(await Promise.all(fetches));

  // Step 3 — one Gemini call, with rule-based fallback if all keys exhausted
  const newsContext = articles.length > 0 ? formatArticles(articles) : "No articles found.";
  const history = messages
    .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return generate(
    `You are the AI news assistant for IGIHE (new.igihe.com), a leading Rwandan news outlet.
You have access to IGIHE's full article database — you just searched it and retrieved the most relevant results.
Today is ${todayFormatted}.

Always respond in the same language the user writes in (English, Kinyarwanda, French, etc.).
Be conversational and informative. Reference article titles naturally in your answers.
If the retrieved articles don't fully answer the question, say so honestly.
Never invent facts — only use what's in the articles below.

=== RETRIEVED ARTICLES (${articles.length} found) ===
${newsContext}

=== CONVERSATION ===
${history}
Assistant:`,
    ruleBasedSummary(articles) // fallback: show raw articles if all keys exhausted
  );
}
