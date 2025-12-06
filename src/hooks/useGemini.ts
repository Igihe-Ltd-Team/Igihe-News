"use client";

import { useState } from "react";
import {
  summarizeAction,
  askAction,
  keypointsAction,
  explainAction,
  recommendAction,
  digestAction,
  searchAction,
  sentimentAction,
  topicsAction,
  // narrationAction
} from "@/actions/gemini";
import { NewsItem } from "@/types/fetchData";

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      return await fn();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,

    summarize: (a:NewsItem) => wrap(() => summarizeAction(a)),
    askQuestion: (a:NewsItem, q:string) => wrap(() => askAction(a, q)),
    getKeyPoints: (a:NewsItem) => wrap(() => keypointsAction(a)),
    explainText: (t:string) => wrap(() => explainAction(t)),
    getRecommendations: (r:NewsItem[], a:NewsItem[]) => wrap(() => recommendAction(r, a)),
    generateDigest: (a:NewsItem[]) => wrap(() => digestAction(a)),
    smartSearch: (q:string, a:NewsItem[]) => wrap(() => searchAction(q, a)),
    analyzeSentiment: (a:NewsItem) => wrap(() => sentimentAction(a)),
    extractTopics: (a:NewsItem) => wrap(() => topicsAction(a)),
    // generateNarration: (a:NewsItem) => wrap(() => narrationAction(a)),
  };
};

