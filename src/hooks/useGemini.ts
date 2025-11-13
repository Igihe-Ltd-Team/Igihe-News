// hooks/useGemini.ts
import { useState } from 'react'
import { GeminiService } from '@/services/geminiService'
import { NewsItem } from '@/types/fetchData'

export const useGemini = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wrap = async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Operation failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,

    summarize: (article: NewsItem) => wrap(() => GeminiService.summarizeArticle(article)),
    askQuestion: (article: NewsItem, q: string) => wrap(() => GeminiService.askAboutArticle(article, q)),
    getKeyPoints: (article: NewsItem) => wrap(() => GeminiService.getKeyTakeaways(article)),
    explainText: (text: string) => wrap(() => GeminiService.explainSimply(text)),
    getRecommendations: (read: NewsItem[], available: NewsItem[]) =>
      wrap(() => GeminiService.getRecommendations(read, available)),
    generateDigest: (articles: NewsItem[]) => wrap(() => GeminiService.generateDailyDigest(articles)),
    smartSearch: (query: string, articles: NewsItem[]) =>
      wrap(() => GeminiService.semanticSearch(query, articles)),
    analyzeSentiment: (article: NewsItem) => wrap(() => GeminiService.analyzeSentiment(article)),
    extractTopics: (article: NewsItem) => wrap(() => GeminiService.extractTopics(article)),
  }
}