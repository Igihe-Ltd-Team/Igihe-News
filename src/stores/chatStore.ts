import { create } from 'zustand'
import { NewsItem } from '@/types/fetchData'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
  isTyping?: boolean
}

type MessagesUpdater = ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])

interface ChatState {
  // The article the assistant is currently grounded in (undefined = general site assistant).
  article: NewsItem | undefined
  messages: ChatMessage[]

  // Call when a chat surface (modal or full page) becomes active for a given article.
  // Resets the conversation only when the article context actually changes, so reopening
  // the assistant for the same article/page preserves the existing conversation.
  setArticleContext: (article: NewsItem | undefined) => void
  setMessages: (updater: MessagesUpdater) => void
  resetMessages: () => void
}

export const useChatStore = create<ChatState>()((set, get) => ({
  article: undefined,
  messages: [],

  setArticleContext: (article) => {
    const currentId = get().article?.id ?? null
    const nextId = article?.id ?? null
    if (currentId !== nextId) {
      set({ article, messages: [] })
    } else {
      set({ article })
    }
  },

  setMessages: (updater) => {
    set((state) => ({
      messages: typeof updater === 'function' ? updater(state.messages) : updater,
    }))
  },

  resetMessages: () => set({ messages: [] }),
}))
