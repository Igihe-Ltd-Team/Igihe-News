// "use server";

// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { NewsItem } from "@/types/fetchData";
// import { stripHtml } from "@/lib/utils";

// const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GERMINI_API;
// const WP_API = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
// if (!GEMINI_API_KEY) console.warn("GEMINI_API_KEY is not set – Gemini will not work");

// const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
// const model = genAI?.getGenerativeModel({ model: "gemini-3-flash-preview" });

// // const WP_API = "https://new.igihe.com/english/wp-json/wp/v2";

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




// web gemini service
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NewsItem } from "@/types/fetchData";
import { stripHtml } from "@/lib/utils";


const GEMINI_KEYS = [
  process.env.NEXT_PUBLIC_GERMINI_API,
  process.env.NEXT_PUBLIC_GERMINI_API2,
  process.env.NEXT_PUBLIC_GERMINI_API3,
  process.env.NEXT_PUBLIC_GERMINI_API4,
].filter(Boolean) as string[];


if (GEMINI_KEYS.length === 0) {
  console.warn("[AI] No Gemini API keys configured. Add GEMINI_API_KEY_1 to .env");
}

// Track which keys are exhausted for this process lifetime
// (resets when the server restarts, which is fine — daily quota resets too)


const keyCooldowns = new Map<string, number>();
const keyFailCounts = new Map<string, number>();
const COOLDOWN_MS = 60_000;
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;
const QUEUE_DELAY_MS = 1000; // 1 second between batches



const userRateLimits = new Map<string, { count: number; resetTime: number }>();
const USER_RATE_LIMIT = 5; // requests per minute per user
const USER_RATE_WINDOW = 60_000; // 1 minute
const keyQueues = new Map<string, Array<() => Promise<void>>>();

let processingKeyQueues = false;

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = userRateLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    userRateLimits.set(userId, { count: 1, resetTime: now + USER_RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= USER_RATE_LIMIT) {
    return false; // Rate limited
  }

  userLimit.count++;
  return true;
}


GEMINI_KEYS.forEach(key => {
  keyQueues.set(key, []);
});

function markExhausted(key: string) {
  const fails = (keyFailCounts.get(key) ?? 0) + 1;
  keyFailCounts.set(key, fails);

  // Exponential backoff: 60s, 120s, 240s, 480s
  const cooldown = COOLDOWN_MS * Math.pow(2, fails - 1);
  const until = Date.now() + cooldown;
  keyCooldowns.set(key, until);

  const available = GEMINI_KEYS.filter(k => Date.now() > (keyCooldowns.get(k) ?? 0)).length;
  console.warn(`[AI] Key ...${key.slice(-6)} cooling down for ${cooldown / 1000}s (failure #${fails}). ${available} key(s) still available.`);

  // Reset fail count after 5 minutes of no failures
  setTimeout(() => {
    keyFailCounts.delete(key);
  }, 5 * 60 * 1000);
}

// ─── Core generate() with queue and retry ───────────────────────────────────


function getAvailableKey(): string | null {
  const now = Date.now();

  const availableKeys = GEMINI_KEYS.filter(k => {
    const cooldownUntil = keyCooldowns.get(k) ?? 0;
    return now > cooldownUntil;
  });

  if (availableKeys.length === 0) return null;

  // Prefer keys with fewer recent failures AND shorter queues
  availableKeys.sort((a, b) => {
    const aFails = keyFailCounts.get(a) ?? 0;
    const bFails = keyFailCounts.get(b) ?? 0;
    if (aFails !== bFails) return aFails - bFails;

    // If fail counts equal, prefer shorter queue
    const aQueue = keyQueues.get(a)?.length ?? 0;
    const bQueue = keyQueues.get(b)?.length ?? 0;
    return aQueue - bQueue;
  });

  return availableKeys[0];
}


async function processAllKeyQueues() {
  if (processingKeyQueues) return;
  processingKeyQueues = true;

  try {
    while (true) {
      // Collect available tasks from all queues
      const tasks: Array<() => Promise<void>> = [];

      for (const key of GEMINI_KEYS) {
        const queue = keyQueues.get(key)!;
        // Take up to 1 task per key (since each key can handle 1 request at a time)
        if (queue.length > 0) {
          const task = queue.shift();
          if (task) tasks.push(task);
        }
      }

      if (tasks.length === 0) break; // No more tasks

      // Process all tasks in parallel (one per key)
      await Promise.allSettled(tasks.map(task => task()));

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, QUEUE_DELAY_MS));
    }
  } finally {
    processingKeyQueues = false;
  }
}


async function actualGenerate(prompt: string, fallback?: string): Promise<string> {
  const maxWaitMs = 90_000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const key = getAvailableKey();

    if (!key) {
      // Find soonest key to recover
      const cooldowns = [...keyCooldowns.values()];
      if (cooldowns.length === 0) break;

      const soonest = Math.min(...cooldowns);
      const waitMs = Math.max(0, soonest - Date.now()) + 500;
      console.log(`[AI] All keys cooling down. Waiting ${Math.ceil(waitMs / 1000)}s...`);
      await new Promise(res => setTimeout(res, waitMs));
      continue;
    }

    try {
      const client = new GoogleGenerativeAI(key);
      const model = client.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) {
        // Success! Reset fail count
        keyFailCounts.delete(key);
        return text;
      }
    } catch (err: any) {
      const isQuota =
        err?.status === 429 ||
        String(err?.message).toLowerCase().includes("quota") ||
        String(err?.message).toLowerCase().includes("rate limit") ||
        String(err?.message).toLowerCase().includes("resource exhausted") ||
        String(err?.message).toLowerCase().includes("too many requests");

      if (isQuota) {
        markExhausted(key);
        continue;
      }

      console.error("[AI] Gemini error:", err?.message);
      break;
    }
  }

  if (fallback !== undefined) return fallback;
  throw new Error("All Gemini API keys are temporarily exhausted. Please wait a minute and try again.");
}
function getCacheKey(prompt: string): string {
  // Create deterministic cache key from prompt
  return prompt.slice(0, 200) + prompt.slice(-50);
}

async function generate(prompt: string, fallback?: string): Promise<string> {
  // Check cache first
  const cacheKey = getCacheKey(prompt);
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[AI] Cache hit! Skipping API call.");
    return cached.response;
  }

  return new Promise((resolve, reject) => {
    const task = async () => {
      try {
        const result = await actualGenerate(prompt, fallback);
        // Store in cache
        responseCache.set(cacheKey, { response: result, timestamp: Date.now() });
        resolve(result);
      } catch (err) {
        if (fallback !== undefined) {
          console.warn("[AI] Using fallback:", fallback.substring(0, 100));
          resolve(fallback);
        } else {
          reject(err);
        }
      }
    };

    // Add to the least loaded key's queue
    const key = getAvailableKey() || GEMINI_KEYS[0]; // Fallback to first key even if cooling down
    keyQueues.get(key)!.push(task);
    processAllKeyQueues();
  });
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
}, 5 * 60 * 1000);


// ─── WordPress fetchers ───────────────────────────────────────────────────────
const WP_API = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
// const WP_API = "https://new.igihe.com/english/wp-json/wp/v2";
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

// Maps user words → best WP search terms (kept tight — 1 or 2 per word)
const SYNONYMS: Record<string, string[]> = {
  // Government
  "government": ["Govt"],
  "govt":       ["government"],
  "leta":       ["Govt", "government"],
  // Budget / Finance
  "budget":     ["budget"],
  "ingengo":    ["budget"],
  "framework":  ["budget framework"],
  // Economy
  "economy":    ["economy", "economic"],
  "economic":   ["economy"],
  "isoko":      ["economy", "business"],
  "ubucuruzi":  ["business"],
  // Changes
  "increase":   ["increase", "growth"],
  "rise":       ["increase", "growth"],
  "ikuze":      ["growth", "increase"],
  "decrease":   ["decrease", "reduction"],
  "drop":       ["decrease", "fall"],
  "fall":       ["decrease", "drop"],
  // People
  "president":  ["president", "Kagame"],
  "perezida":   ["president", "Kagame"],
  "minister":   ["minister", "ministry"],
  "minisitiri": ["minister"],
  // Institutions
  "hospital":   ["hospital", "health"],
  "indwara":    ["health", "disease"],
  "ubuzima":    ["health"],
  "police":     ["police", "RNP"],
  "polisi":     ["police", "RNP"],
  "army":       ["military", "RDF"],
  "ingabo":     ["military", "RDF"],
  "school":     ["school", "education"],
  "amashuri":   ["school", "education"],
  "kaminuza":   ["university"],
  "university": ["university", "kaminuza"],
  // Specific orgs
  "bnr":        ["BNR", "bank"],
  "bank":       ["bank", "BNR"],
  "banki":      ["bank"],
  "rra":        ["RRA", "tax"],
  "tax":        ["tax", "RRA"],
  "umusoro":    ["tax", "RRA"],
  "election":   ["election", "amatora"],
  "amatora":    ["election", "vote"],
  "road":       ["road", "infrastructure"],
  "energy":     ["energy", "electricity"],
  "electricity":["electricity", "energy", "REG"],
  "reg":        ["REG", "energy"],
  "water":      ["water", "WASAC"],
  "amazi":      ["water", "WASAC"],
  "wasac":      ["WASAC", "water"],
  "internet":   ["internet", "digital"],
  "digital":    ["digital", "ICT"],
  "ict":        ["ICT", "digital"],
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
  // Priority buckets — higher priority fills slots first
  const p1 = new Set<string>(); // quoted phrases & proper nouns — most precise
  const p2 = new Set<string>(); // synonym expansions — handles abbreviation variance
  const p3 = new Set<string>(); // topic map — broad category terms
  const p4 = new Set<string>(); // individual meaningful words — catch-all

  const cleanMsg = msg.replace(/[^\w\s\u00C0-\u024F]/g, " ");
  const words = cleanMsg.toLowerCase().split(/\s+/).filter(Boolean);

  // P1 — Quoted phrases (exact match intent)
  [...msg.matchAll(/"([^"]+)"/g)].forEach(m => p1.add(m[1]));

  // P1 — Proper noun sequences (e.g. "Paul Kagame", "National Bank")
  [...msg.matchAll(/\b([A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÙÚÛÜ][a-zàáâãäåèéêëìíîïòóôõùúûü]{1,}(?:\s[A-ZÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÙÚÛÜ][a-zàáâãäåèéêëìíîïòóôõùúûü]{1,})*)\b/g)]
    .forEach(m => p1.add(m[1]));

  // P1 — ALL-CAPS abbreviations typed by user (RDF, BNR, EAC...)
  [...msg.matchAll(/\b([A-Z]{2,6})\b/g)]
    .forEach(m => p1.add(m[1]));

  // P2 — Synonym expansion for every word in the message
  words.forEach(word => {
    const syns = SYNONYMS[word];
    if (syns) syns.forEach(s => p2.add(s));
  });

  // P3 — Topic map (broad category)
  for (const { patterns, terms } of TOPIC_MAP) {
    if (patterns.test(msg)) terms.forEach(t => p3.add(t));
  }

  // P4 — Individual meaningful words (min 4 chars to reduce noise)
  words
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
    .forEach(w => p4.add(w));

  // Merge by priority, cap at 8 total searches
  const final = new Set<string>();
  for (const bucket of [p1, p2, p3, p4]) {
    for (const term of bucket) {
      if (final.size >= 8) break;
      final.add(term);
    }
    if (final.size >= 8) break;
  }

  // Fallback if nothing was found at all
  if (final.size === 0) {
    final.add(cleanMsg.trim().slice(0, 60));
  }

  return {
    searches: [...final],
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


// function formatArticles(articles: NewsItem[]): string {
//   return articles.map((a, i) => {
//     const excerpt = stripHtml(a.excerpt?.rendered || a.content?.rendered || "").slice(0, 400);
//     const date = new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
//     return `[${i + 1}] (${date}) ${a.title.rendered}\nExcerpt: ${excerpt}\nSlug: ${a.slug}`;
//   }).join("\n\n");
// }
function formatArticles(articles: NewsItem[]): string {
  return articles.map((a, i) => {
    const excerpt = stripHtml(a.excerpt?.rendered || "").slice(0, 200);
    const content = stripHtml(a.content?.rendered || "").slice(0, 1500); // full content, trimmed for token budget
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

// ─── Rule-based fallback (0 AI calls) ────────────────────────────────────────
// Shown when all Gemini keys are exhausted. Still useful — shows real articles.


function ruleBasedSummary(articles: NewsItem[]): string {
  if (articles.length === 0) {
    return "I couldn't find articles matching your query. Please try different keywords.";
  }

  const lines = articles.slice(0, 5).map((a) => {
    const date = new Date(a.date).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric"
    });
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


export async function chatWithNewsAgent(messages: AgentMessage[],
  userId?: string
): Promise<string> {
  const lastUser = [...messages].reverse().find(m => m.role === "user");
  if (userId && !checkUserRateLimit(userId)) {
    return "You're sending messages too quickly. Please wait a moment before trying again.";
  }

  if (!lastUser) return "Please ask me something!";

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Step 1 — JS search plan (free, 0 Gemini calls)
  const plan = buildSearchPlan(lastUser.content);

  // Step 2 — WP fetches in parallel (free, 0 Gemini calls)
  const fetches: Promise<NewsItem[]>[] = plan.searches.map(q => wpSearch(q, 20));
  if (plan.needsRecent) fetches.push(wpRecent(25));
  if (plan.dateAfter) fetches.push(wpByDate(plan.dateAfter, undefined, 20));
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
Be conversational and informative.

IMPORTANT: Each article below includes a "Full Content" field. Always summarize from the Full Content, NOT the Excerpt.

When summarizing or mentioning an article, follow this exact format:

**Article Title**
(Date) 2–3 sentence summary written from the Full Content.
[Read more →](full_article_link)

---

Never mention an article without including its "Read more →" link at the end.
Always use the Link field provided for each article — never guess or construct URLs.
Never invent facts — only use what's in the Full Content below.
If the retrieved articles don't fully answer the question, say so honestly.

=== RETRIEVED ARTICLES (${articles.length} found) ===
${newsContext}

=== CONVERSATION ===
${history}
Assistant:`,
  ruleBasedSummary(articles)
);
}
