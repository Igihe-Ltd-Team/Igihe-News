'use server';

import { ApiService } from "@/services/apiService";

export async function fetchArticlesAuthor(author: number, page: number) {
    console.log('author', author)
    return await ApiService.fetchArticles({
        // author: author,
        bylines:author,
        page
    }).catch(() => null);
}

export async function getAuthor(slug: string, page: number = 1) { 
    try {
        const author = await ApiService.fetchAuthorBySlug(slug)

        if (!author) return null   // ★ fix 2: null check before accessing .id

        const posts = await ApiService.fetchArticles({
            // user: author.id,
            bylines:author.id,
            page,
            per_page:10
        })

        return { author, postsData: posts }
    } catch (error) {
        console.log('❌ Fetch error:', error)
        return null
    }
}

