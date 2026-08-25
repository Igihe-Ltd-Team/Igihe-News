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

// Caps how many messages a conversation keeps: the DOM (every bubble stays
// mounted forever) and the request payload (the full history is resent on
// every new message) both grow unboundedly with conversation length
// otherwise — fine for a few exchanges, but a real source of slowdown/OOM
// crashes on mobile once a conversation runs long. Oldest messages age out;
// this only affects how much history is kept, not the live streaming update
// of the current message (same array length, so it never triggers a trim).
const MAX_MESSAGES = 30

function capMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.length > MAX_MESSAGES ? messages.slice(messages.length - MAX_MESSAGES) : messages
}

interface ChatState {
  // The article the assistant is currently grounded in (undefined = general site assistant).
  article: NewsItem | undefined
  messages: ChatMessage[]

  // Call when the chat modal becomes active for a given article. Resets the
  // conversation only when the article context actually changes, so
  // reopening the assistant for the same article/page preserves it.
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
      messages: capMessages(typeof updater === 'function' ? updater(state.messages) : updater),
    }))
  },

  resetMessages: () => set({ messages: [] }),
}))
