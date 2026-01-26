'use server';

import { ApiService } from "@/services/apiService";

export async function fetchArticlesOpinions(tag: number, page: number) {
  return await ApiService.fetchOtherPosts({ 
    postType:'opinion',
    page 
  }).catch(() => null);
}