import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  // UI-only state
  theme: 'light' | 'dark'
  fontSize: number
  selectedCategory: Category | null
  bookmarks: Bookmark[]
  recentlyViewed: NewsItem[]
  
  // Actions
  toggleTheme: () => void
  setFontSize: (size: number) => void
  setSelectedCategory: (category: Category | null) => void
  toggleBookmark: (item: NewsItem) => void
  addToRecentlyViewed: (item: NewsItem) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      fontSize: 16,
      selectedCategory: null,
      bookmarks: [],
      recentlyViewed: [],

      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      
      setFontSize: (size) => set({ fontSize: Math.max(12, Math.min(24, size)) }),
      
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      
      toggleBookmark: (item) => {
        const { bookmarks } = get()
        const isBookmarked = bookmarks.some(b => b.id === item.id)
        
        if (isBookmarked) {
          set({ bookmarks: bookmarks.filter(b => b.id !== item.id) })
        } else {
          set({ 
            bookmarks: [...bookmarks, { 
              ...item, 
              bookmarkedAt: new Date().toISOString() 
            }] 
          })
        }
      },
      
      addToRecentlyViewed: (item) => {
        const { recentlyViewed } = get()
        const filtered = recentlyViewed.filter(existing => existing.id !== item.id)
        set({ recentlyViewed: [item, ...filtered].slice(0, 50) })
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)