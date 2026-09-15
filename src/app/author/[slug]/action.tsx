'use server';

import { ApiService } from "@/services/apiService";
import { getAuthorBylineIds } from "@/lib/sitemap/authors";

export async function fetchArticlesAuthor(author: number | number[], page: number) {
    return await ApiService.fetchArticles({
        bylines: author,
        page
    }).catch(() => null);
}

export async function getAuthor(slug: string, page: number = 1) {
    try {
        const author = await ApiService.fetchAuthorBySlug(slug)

        if (!author) return null

        // Merged spellings of the same byline (src/data/authorAliases.ts)
        // contribute their articles to the canonical author page.
        const bylineIds = getAuthorBylineIds(slug, author.id)

        const posts = await ApiService.fetchArticles({
            bylines: bylineIds,
            page,
            per_page: 10
        })

        return { author, bylineIds, postsData: posts }
    } catch (error) {
        console.log('❌ Fetch error:', error)
        return null
    }
}
