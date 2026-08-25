"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NewsItem } from "@/types/fetchData";
import { useChatStore, ChatMessage } from "@/stores/chatStore";
import {
  AgentMessage,
  ARTICLE_QUICK_PROMPTS,
  ARTICLE_TYPING_PHRASES,
  QUICK_PROMPTS,
  TYPING_PHRASES,
  articleTitle,
  chatWithNewsAgent,
  resolveLanguage,
  resolveSourceSite,
} from "@/lib/newsAgentClient";

const STREAM_FLUSH_MS = 100;

/**
 * Shared chat logic for both the desktop modal and the mobile full-page view.
 * `active` gates the greeting/focus effects (modal: isOpen, page: always true).
 * Conversation + article context live in the Zustand store so they survive the
 * mobile hand-off from trigger tap -> /chat navigation, and viewport resizes.
 */
export function useNewsAgentChat(article: NewsItem | undefined, active: boolean) {
  const isArticleMode = Boolean(article);
  const sourceSite = resolveSourceSite();
  const language = resolveLanguage(sourceSite);
  const quickPrompts = isArticleMode ? ARTICLE_QUICK_PROMPTS : QUICK_PROMPTS;
  const typingPhrases = isArticleMode ? ARTICLE_TYPING_PHRASES : TYPING_PHRASES;

  const messages = useChatStore((s) => s.messages);
  const setMessages = useChatStore((s) => s.setMessages);
  const setArticleContext = useChatStore((s) => s.setArticleContext);
  const resetMessages = useChatStore((s) => s.resetMessages);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingPhase, setTypingPhase] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Adopt this article as the active context; resets the conversation only if it changed.
  useEffect(() => {
    if (!active) return;
    setArticleContext(article);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, article?.id]);

  // Greeting
  useEffect(() => {
    if (active && messages.length === 0) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
      setMessages([{
        id: "init",
        role: "assistant",
        timestamp: new Date(),
        text: article
          ? `${greeting}! I'm focused on **${articleTitle(article)}**.\n\nAsk me to summarize it, extract key takeaways, explain details, or answer questions using this article only.`
          : `${greeting}! I'm your IGIHE news assistant for this site.\n\nAsk about headlines, Rwanda, sports, business, international news, or any current IGIHE topic and I'll search the right source for you.\n\nWhat would you like to know?`,
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, messages.length, article]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input
  useEffect(() => {
    if (active) setTimeout(() => inputRef.current?.focus(), 350);
  }, [active]);

  // Typing phase cycle
  useEffect(() => {
    if (loading) {
      setTypingPhase(0);
      phaseTimer.current = setInterval(() =>
        setTypingPhase(p => Math.min(p + 1, typingPhrases.length - 1)), 1800);
    } else {
      if (phaseTimer.current) clearInterval(phaseTimer.current);
    }
    return () => { if (phaseTimer.current) clearInterval(phaseTimer.current); };
  }, [loading, typingPhrases.length]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const now = Date.now();
    const userMsg: ChatMessage = { id: String(now), role: "user", text: trimmed, timestamp: new Date() };
    const assistantId = String(now + 1);
    const history: AgentMessage[] = [
      ...messages.filter(m => !m.isTyping).map(m => ({ role: m.role, content: m.text })),
      { role: "user", content: trimmed },
    ];

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", text: "", timestamp: new Date() },
    ]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);

    let pendingText = "";
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flushPendingText = () => {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      if (!pendingText) return;
      const nextText = pendingText;
      pendingText = "";
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, text: m.text + nextText } : m)
      );
    };

    const queueAssistantText = (chunk: string) => {
      if (!chunk) return;
      pendingText += chunk;
      if (flushTimer) return;
      flushTimer = setTimeout(flushPendingText, STREAM_FLUSH_MS);
    };

    const resetAssistantText = () => {
      pendingText = "";
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, text: "" } : m)
      );
    };

    try {
      await chatWithNewsAgent(history, { article, sourceSite, language }, {
        onChunk: queueAssistantText,
        onReset: resetAssistantText,
      });
    } catch {
      resetAssistantText();
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, text: "I'm sorry — I ran into a problem. Please try again in a moment." }
            : m
        )
      );
    } finally {
      flushPendingText();
      setLoading(false);
    }
  }, [messages, loading, article, sourceSite, language, setMessages]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const handleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.onstart = () => setIsListening(true);
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e: any) => {
        const transcript = e?.results?.[0]?.[0]?.transcript;
        if (typeof transcript === "string") setInput(transcript);
      };
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  const clear = useCallback(() => {
    resetMessages();
  }, [resetMessages]);

  const showQuickPrompts = messages.filter(m => m.role === "user").length === 0;

  return {
    isArticleMode,
    quickPrompts,
    typingPhrases,
    messages,
    input,
    loading,
    typingPhase,
    isListening,
    showQuickPrompts,
    inputRef,
    bottomRef,
    send,
    handleKey,
    handleInput,
    handleVoice,
    clear,
  };
}
