'use server';

import { ApiService } from "@/services/apiService";

export async function fetchArticlesAnnounc(page: number) {
  return await ApiService.fetchOtherPosts({ 
    postType:'announcement',
    page 
  }).catch(() => null);
}