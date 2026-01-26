'use server';

import { ApiService } from "@/services/apiService";

export async function fetchArticlesByTag(tag: number, page: number) {
  return await ApiService.fetchArticles({ 
    tags: [tag],
    page 
  }).catch(() => null);
}