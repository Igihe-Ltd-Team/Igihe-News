'use server';

import { ApiService } from "@/services/apiService";

export async function fetchArticles( page: number,per_page?:number,offset?:number) {
  return await ApiService.fetchArticles({ 
    page,
    per_page,
    offset
  }).catch(() => null);
}