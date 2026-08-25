"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NewsItem } from "@/types/fetchData";
import { useResponsive } from "@/hooks/useResponsive";
import { useChatStore } from "@/stores/chatStore";
import NewsAgentPanel from "./news/NewsAgentPanel";

export default function NewsAgent({ article }: { article?: NewsItem }) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);
  const setArticleContext = useChatStore((s) => s.setArticleContext);

  const openChat = () => {
    if (isMobile) {
      // Mobile: never mount the modal — hand off context and navigate to the
      // dedicated full-screen page instead (avoids the modal crash/instability).
      setArticleContext(article);
      router.push("/chat");
      return;
    }
    setIsOpen(true);
  };

  // Defensive: if the viewport becomes mobile-sized while the modal is open
  // (e.g. rotating a device or resizing a window), close it rather than let
  // it keep rendering on a mobile viewport.
  useEffect(() => {
    if (isOpen && isMobile) setIsOpen(false);
  }, [isMobile, isOpen]);

  // Esc to close (modal only)
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen]);

  return (
    <>
      <style>{`
        .igihe-trigger {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 1050;
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: var(--igihe-accent, #1076BA);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(59,130,246,0.4), 0 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
        }
        .igihe-trigger:hover {
          transform: scale(1.08);
          box-shadow: 0 12px 40px rgba(59,130,246,0.5), 0 4px 12px rgba(0,0,0,0.5);
        }
        .igihe-trigger:active { transform: scale(0.96); }
        .igihe-trigger__pulse {
          position: absolute;
          top: -2px; right: -2px;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--igihe-green, #10b981);
          border: 2.5px solid #0d0f14;
        }
        .igihe-trigger__pulse::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: var(--igihe-green, #10b981);
          opacity: 0.4;
          animation: pulse-ring 2s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .igihe-overlay {
          position: fixed;
          inset: 0;
          z-index: 9990;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: overlay-in 0.25s ease-out;
        }
        @keyframes overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .igihe-panel {
          width: 100%;
          max-width: 860px;
          height: 100%;
          height: 92dvh;
          max-height: 92vh;
          max-height: 92dvh;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--igihe-border-bright, rgba(255,255,255,0.13));
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
          animation: panel-in 0.3s cubic-bezier(.16,1,.3,1);
        }
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 640px) {
          .igihe-overlay { padding: 0; }
          .igihe-panel {
            border-radius: 0;
            height: 100vh;
            height: 100dvh;
            max-height: 100vh;
            max-height: 100dvh;
            border: none;
          }
        }
      `}</style>

      {/* ── Floating trigger ── */}
      <button
        className="igihe-trigger"
        onClick={openChat}
        aria-label="Open AI news assistant"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
          <circle cx="9" cy="12" r="1" fill="white" stroke="none" />
          <circle cx="15" cy="12" r="1" fill="white" stroke="none" />
        </svg>
        <span className="igihe-trigger__pulse" />
      </button>

      {/* ── Desktop modal (never mounted on mobile) ── */}
      {isOpen && !isMobile && (
        <div className="igihe-overlay" onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}>
          <div className="igihe-panel">
            <NewsAgentPanel
              article={article}
              active={isOpen}
              variant="modal"
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
