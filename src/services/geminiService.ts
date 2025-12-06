// import { GoogleGenerativeAI } from '@google/generative-ai'
// import { NewsItem } from '@/types/fetchData'
// import { stripHtml } from '@/lib/utils'

// const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GERMINI_API

// if (!GEMINI_API_KEY) {
//     console.warn('NEXT_PUBLIC_GERMINI_API is not set – Gemini features will be disabled')
// }

// const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null
// const model = genAI?.getGenerativeModel({ model: 'gemini-3-pro-preview' }) // or gemini-1.5-pro

// export class GeminiService {
//     private static async generate(prompt: string): Promise<string> {
//         if (!model) throw new Error('Gemini API key not configured')

//         try {
//             const result = await model.generateContent(prompt)
//             const text = result.response.text()
//             return text.trim()
//         } catch (error) {
//             console.error('Gemini API error:', error)
//             throw new Error('Failed to generate content')
//         }
//     }


//     static async summarizeArticle(article: NewsItem): Promise<string> {
//         const content = stripHtml(article.content?.rendered || article.excerpt?.rendered || '')
//         const title = article.title.rendered

//         const prompt = `Summarize this news article in 3-4 sentences. Focus on key facts.

// Title: ${title}

// Content: ${content}

// Summary:`

//         return this.generate(prompt)
//     }

//     static async askAboutArticle(article: NewsItem, question: string): Promise<string> {
//         const content = stripHtml(article.content?.rendered || article.excerpt?.rendered || '')
//         const title = article.title.rendered

//         const prompt = `Answer this question based only on the article.

// Title: ${title}
// Content: ${content}

// Question: ${question}

// Answer:`

//         return this.generate(prompt)
//     }

//     static async getKeyTakeaways(article: NewsItem): Promise<string[]> {
//         const content = stripHtml(article.content?.rendered || article.excerpt?.rendered || '')
//         const title = article.title.rendered

//         const prompt = `Extract 3-5 key takeaways as bullet points.

// Title: ${title}
// Content: ${content}

// Return only the bullet points, one per line, starting with "• ":`

//         const text = await this.generate(prompt)
//         return text
//             .split('\n')
//             .map(line => line.replace(/^[•\-*]\s*/, '').trim())
//             .filter(line => line.length > 0)
//             .slice(0, 10)
//     }

//     static async explainSimply(text: string): Promise<string> {
//         const prompt = `Explain this in simple terms for a general audience:

// "${text}"

// Simple explanation:`
//         return this.generate(prompt)
//     }

//     static async getRecommendations(
//         readArticles: NewsItem[],
//         availableArticles: NewsItem[]
//     ): Promise<number[]> {
//         const readTitles = readArticles.slice(0, 10).map(a => a.title.rendered).join(', ')
//         const available = availableArticles
//             .map((a, i) => `${i}: ${a.title.rendered}`)
//             .join('\n')

//         const prompt = `User has read:
// ${readTitles}

// Recommend 5 articles from this list:
// ${available}

// Return ONLY indices (comma-separated, e.g., "0,3,7"):`

//         try {
//             const text = await this.generate(prompt)
//             return text
//                 .split(',')
//                 .map(n => parseInt(n.trim()))
//                 .filter(n => !isNaN(n) && n >= 0 && n < availableArticles.length)
//                 .slice(0, 5)
//         } catch {
//             return []
//         }
//     }

//     static async generateDailyDigest(articles: NewsItem[]): Promise<string> {
//         const titles = articles.slice(0, 15).map(a => `- ${a.title.rendered}`).join('\n')

//         const prompt = `Create a 2-3 paragraph daily news digest from these headlines:

// ${titles}

// Use a friendly, engaging tone:`

//         return this.generate(prompt)
//     }

//     static async semanticSearch(query: string, articles: NewsItem[]): Promise<NewsItem[]> {
//         const list = articles.map((a, i) => `${i}: ${a.title.rendered}`).join('\n')

//         const prompt = `Search query: "${query}"

// Find top 5 matches from:
// ${list}

// Return ONLY indices (comma-separated):`

//         try {
//             const text = await this.generate(prompt)
//             const indices = text
//                 .split(',')
//                 .map(n => parseInt(n.trim()))
//                 .filter(n => !isNaN(n) && n >= 0 && n < articles.length)

//             return indices.map(i => articles[i])
//         } catch {
//             return []
//         }
//     }

//     static async analyzeSentiment(article: NewsItem): Promise<{
//         sentiment: 'positive' | 'negative' | 'neutral'
//         explanation: string
//     }> {
//         const content = stripHtml(article.content?.rendered || article.excerpt?.rendered || '')
//         const title = article.title.rendered

//         const prompt = `Analyze sentiment.

// Title: ${title}
// Content: ${content}

// Respond:
// SENTIMENT: [positive/negative/neutral]
// EXPLANATION: [1 sentence]`

//         try {
//             const text = await this.generate(prompt)
//             const sentiment = text.match(/SENTIMENT:\s*(positive|negative|neutral)/i)?.[1].toLowerCase() as any
//             const explanation = text.match(/EXPLANATION:\s*(.+)/i)?.[1] || 'No explanation'

//             return {
//                 sentiment: sentiment || 'neutral',
//                 explanation,
//             }
//         } catch {
//             return { sentiment: 'neutral', explanation: 'Analysis failed' }
//         }
//     }

//     static async extractTopics(article: NewsItem): Promise<string[]> {
//         const content = stripHtml(article.content?.rendered || article.excerpt?.rendered || '')
//         const title = article.title.rendered

//         const prompt = `Extract 3-5 main topics from this article.

// Title: ${title}
// Content: ${content}

// Return one topic per line:`

//         try {
//             const text = await this.generate(prompt)
//             return text
//                 .split('\n')
//                 .map(t => t.trim())
//                 .filter(t => t.length > 0)
//                 .slice(0, 5)
//         } catch {
//             return []
//         }
//     }

//     static async generateNarrationText(article: NewsItem): Promise<string> {
//         const content = stripHtml(article.content?.rendered || article.excerpt?.rendered || '')
//         const title = article.title.rendered

//         const prompt = `Write a 2-3 minute podcast narration script.

// Title: ${title}
// Content: ${content}

// Guidelines:
// - Start with a hook
// - Friendly, conversational tone
// - 150-200 words
// - End with a takeaway

// Script:`

//         return this.generate(prompt)
//     }
// }






// src/actions/gemini.ts
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NewsItem } from "@/types/fetchData";
import { stripHtml } from "@/lib/utils";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GERMINI_API;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set – Gemini will not work");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI?.getGenerativeModel({ model: "gemini-1.5-pro" });

async function generate(prompt: string): Promise<string> {
  if (!model) throw new Error("Gemini API key not configured");

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function summarizeArticle(article: NewsItem): Promise<string> {
  const content = stripHtml(article.content?.rendered || "");
  const title = article.title.rendered;

  return generate(`
        Summarize this article in 3–4 sentences.

        Title: ${title}
        Content: ${content}

        Summary:
    `);
}

export async function askAboutArticle(
  article: NewsItem,
  q: string
): Promise<string> {
  const content = stripHtml(article.content?.rendered || "");
  const title = article.title.rendered;

  return generate(`
        Answer question based ONLY on the article:

        Title: ${title}
        Content: ${content}

        Question: ${q}

        Answer:
    `);
}

export async function getKeyTakeaways(article: NewsItem): Promise<string[]> {
  const content = stripHtml(article.content?.rendered || "");
  const title = article.title.rendered;

  const text = await generate(`
        Extract 3–5 key bullet-point takeaways.

        Title: ${title}
        Content: ${content}

        Return one per line:
    `);

  return text
    .split("\n")
    .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
    .filter(Boolean);
}

export async function explainSimply(text: string): Promise<string> {
  return generate(`
        Explain this in simple terms:

        "${text}"

        Explanation:
    `);
}

export async function getRecommendations(
  read: NewsItem[],
  available: NewsItem[]
): Promise<number[]> {
  const readTitles = read.map((a) => a.title.rendered).join(", ");
  const list = available.map((a, i) => `${i}: ${a.title.rendered}`).join("\n");

  const text = await generate(`
        User read: ${readTitles}

        Recommend 5 articles from:
        ${list}

        Return ONLY indices, separated by commas:
    `);

  return text
    .split(",")
    .map((n) => parseInt(n.trim()))
    .filter((n) => !isNaN(n) && n < available.length)
    .slice(0, 5);
}

export async function generateDailyDigest(
  articles: NewsItem[]
): Promise<string> {
  const titles = articles.map((a) => `- ${a.title.rendered}`).join("\n");

  return generate(`
Write a 2–3 paragraph daily news digest:

${titles}

Digest:
    `);
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

export async function analyzeSentiment(article: NewsItem) {
  const content = stripHtml(article.content?.rendered || "");
  const title = article.title.rendered;

  const text = await generate(`
Analyze sentiment:

Title: ${title}
Content: ${content}

Return:
SENTIMENT: positive/negative/neutral
EXPLANATION: one sentence
    `);

  return {
    sentiment:
      text.match(/SENTIMENT:\s*(positive|negative|neutral)/i)?.[1] ??
      "neutral",
    explanation:
      text.match(/EXPLANATION:\s*(.+)/i)?.[1] ?? "No explanation available",
  };
}

export async function extractTopics(article: NewsItem) {
  const content = stripHtml(article.content?.rendered || "");
  const title = article.title.rendered;

  const text = await generate(`
        Extract 3–5 topics:

        ${title}
        ${content}

        Topics:
    `);

  return text.split("\n").map((t) => t.trim()).filter(Boolean);
}