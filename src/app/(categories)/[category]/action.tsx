'use server';

import { ApiService } from "@/services/apiService";

export async function fetchArticlesByCategory(category: number, page: number,per_page?:number,offset?:number) {
  return await ApiService.fetchArticles({ 
    categories: [category],
    page,
    per_page,
    offset
  }).catch(() => null);
}


export async function fetchArticlesByTaHighlight(tag:number,category: number) {
  return await ApiService.fetchArticles({ tags: [tag], categories: [category], per_page: 7 }).catch(() => null);
}
