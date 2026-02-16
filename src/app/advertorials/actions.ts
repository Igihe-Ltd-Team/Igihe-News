'use server';

import { ApiService } from "@/services/apiService";

export async function fetchArticlesAdvertorials(page: number) {
  return await ApiService.fetchOtherPosts({ 
    postType:'advertorial',
    page 
  }).catch(() => null);
}