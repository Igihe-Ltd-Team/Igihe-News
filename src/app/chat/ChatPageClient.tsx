"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import NewsAgentPanel from "@/components/news/NewsAgentPanel";
import { useChatStore } from "@/stores/chatStore";

// Keeps a live viewport-height custom property so the page stays exactly the
// visible height on iOS/Android when the on-screen keyboard opens/closes —
// dvh alone doesn't track the keyboard reliably on iOS Safari.
function useVisualViewportHeight() {
  useEffect(() => {
    const root = document.documentElement;

    const setVvh = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--vvh", `${height}px`);
    };

    setVvh();
    window.visualViewport?.addEventListener("resize", setVvh);
    window.visualViewport?.addEventListener("scroll", setVvh);
    window.addEventListener("resize", setVvh);

    return () => {
      window.visualViewport?.removeEventListener("resize", setVvh);
      window.visualViewport?.removeEventListener("scroll", setVvh);
      window.removeEventListener("resize", setVvh);
      root.style.removeProperty("--vvh");
    };
  }, []);
}

export default function ChatPageClient() {
  const router = useRouter();
  const article = useChatStore((s) => s.article);

  useVisualViewportHeight();

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  // Android/back-swipe hardware back is handled natively via popstate since
  // this is a real route; nothing extra to wire up here.

  return (
    <div className="igihe-chat-page">
      <style>{`
        .igihe-chat-page {
          position: fixed;
          inset: 0;
          height: 100dvh;
          height: var(--vvh, 100dvh);
          display: flex;
          flex-direction: column;
          background: #0d0f14;
          overscroll-behavior: contain;
        }
      `}</style>
      <NewsAgentPanel
        article={article}
        active={true}
        variant="page"
        onClose={handleBack}
      />
    </div>
  );
}
