"use server";

import { analyzeSentiment, askAboutArticle, explainSimply, extractTopics, generateDailyDigest, getKeyTakeaways, getRecommendations, semanticSearch, summarizeArticle } from "@/services/geminiService";
// import { GeminiService } from "@/services/geminiService";
import { NewsItem } from "@/types/fetchData";

// Summaries
export async function summarizeAction(a: NewsItem) {
  return await summarizeArticle(a);
}

// Q&A
export async function askAction(a: NewsItem, q: string) {
  return await askAboutArticle(a, q);
}

// Key points
export async function keypointsAction(a: NewsItem) {
  return await getKeyTakeaways(a);
}

// Explain text
export async function explainAction(text: string) {
  return await explainSimply(text);
}

// Recommendations
export async function recommendAction(read: NewsItem[], available: NewsItem[]) {
  return await getRecommendations(read, available);
}

// Daily digest
export async function digestAction(articles: NewsItem[]) {
  return await generateDailyDigest(articles);
}

// Semantic search
export async function searchAction(query: string, articles: NewsItem[]) {
  return await semanticSearch(query, articles);
}

// Sentiment analysis
export async function sentimentAction(a: NewsItem) {
  return await analyzeSentiment(a);
}

// Topics extraction  (YOUR ERROR WAS HERE)
export async function topicsAction(a: NewsItem) {
  return await extractTopics(a);
}

// Narration script (optional)
// export async function narrationAction(a: NewsItem) {
//   return await generateNarrationText(a);
// }