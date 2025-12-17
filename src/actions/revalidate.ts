'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateHomePage() {
    try {
        revalidatePath('/')
        return { success: true, timestamp: Date.now() }
    } catch (error) {
        console.error('Revalidation failed:', error)
        return { success: false, error: String(error) }
    }
}