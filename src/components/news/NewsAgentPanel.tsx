"use client";

import { NewsItem } from "@/types/fetchData";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import { ThemedText } from "../ThemedText";
import { useNewsAgentChat } from "@/hooks/useNewsAgentChat";

type Variant = "modal" | "page";

interface NewsAgentPanelProps {
  article?: NewsItem;
  active: boolean;
  variant: Variant;
  onClose: () => void;
}

const parseCustomMarkup = (content: string) => {
  if (!content) return '';

  return content
    .replace(/\n/g, '<br />')
    .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")   // opening single quote
    .replace(/&#8220;/g, '"')   // opening double quote
    .replace(/&#8221;/g, '"')   // closing double quote
    .replace(/&#8211;/g, '–')   // en dash
    .replace(/&#8212;/g, '—')   // em dash
    .replace(/&#038;/g, '&')    // ampersand
    .replace(/&amp;/g, '&')     // ampersand (named)
    .replace(/\[([^\]]+)->([^\]]+)\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\{\{([^}]+)\}\}/g, '<strong>$1</strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
};

function TypingIndicator({ phase, phrases }: { phase: number; phrases: string[] }) {
  return (
    <div className="igihe-typing">
      <div className="igihe-typing__dots">
        <span /><span /><span />
      </div>
      <span className="igihe-typing__label">{phrases[phase]}</span>
    </div>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function NewsAgentPanel({ article, active, variant, onClose }: NewsAgentPanelProps) {
  const {
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
  } = useNewsAgentChat(article, active);

  const closeTitle = variant === "modal" ? "Close (Esc)" : "Back";
  const closeIcon = variant === "modal" ? "✕" : "←";
  const inputHint = variant === "modal"
    ? "Enter to send · Shift+Enter for new line · Esc to close"
    : "Enter to send · Shift+Enter for new line";

  return (
    <>
      <style>{`
        :root {
          --igihe-bg: #0d0f14;
          --igihe-surface: #13161d;
          --igihe-surface2: #1a1e27;
          --igihe-border: rgba(255,255,255,0.07);
          --igihe-border-bright: rgba(255,255,255,0.13);
          --igihe-text: #e8eaf0;
          --igihe-text-muted: rgba(232,234,240,0.45);
          --igihe-accent: #1076BA;
          --igihe-accent-dim: rgba(59,130,246,0.15);
          --igihe-accent-glow: rgba(59,130,246,0.25);
          --igihe-green: #10b981;
          --igihe-user-bg: #1d4ed8;
          --radius: 18px;
          --radius-sm: 10px;
        }

        /* ── Header ── */
        .igihe-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 24px;
          border-bottom: 1px solid var(--igihe-border);
          background:#1076ba3d;
          flex-shrink: 0;
        }
        .igihe-back-btn {
          width: 34px; height: 34px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--igihe-text);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          margin: -4px 0;
          transition: background 0.15s;
        }
        .igihe-back-btn:hover { background: var(--igihe-surface2); }
        .igihe-avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: var(--igihe-accent-dim);
          border: 1.5px solid rgba(59,130,246,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          position: relative;
        }
        .igihe-avatar__dot {
          position: absolute;
          bottom: 1px; right: 1px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: var(--igihe-green);
          border: 2px solid var(--igihe-surface);
        }
        .igihe-header__name {
          font-size: 15px;
          font-weight: 600;
          color: var(--igihe-text);
          letter-spacing: -0.01em;
        }
        .igihe-header__sub {
          font-size: 11.5px;
          color: var(--igihe-text-muted);
          margin-top: 1px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .igihe-header__sub-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--igihe-green);
          display: inline-block;
        }
        .igihe-header-actions {
          margin-left: auto;
          display: flex;
          gap: 8px;
        }
        .igihe-icon-btn {
          width: 34px; height: 34px;
          border-radius: 8px;
          border: 1px solid var(--igihe-border-bright);
          background: transparent;
          color: var(--igihe-text-muted);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          transition: all 0.15s;
        }
        .igihe-icon-btn:hover {
          background: var(--igihe-surface2);
          color: var(--igihe-text);
          border-color: var(--igihe-border-bright);
        }

        /* ── Messages ── */
        .igihe-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 28px 28px 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          scroll-behavior: smooth;
        }
        .igihe-messages::-webkit-scrollbar { width: 4px; }
        .igihe-messages::-webkit-scrollbar-track { background: transparent; }
        .igihe-messages::-webkit-scrollbar-thumb { background: var(--igihe-border-bright); border-radius: 4px; }

        .igihe-msg {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          animation: msg-in 0.28s cubic-bezier(.16,1,.3,1);
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .igihe-msg--user { flex-direction: row-reverse; }

        .igihe-msg__avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .igihe-msg__avatar--ai {
          background: var(--igihe-accent-dim);
          border: 1px solid rgba(59,130,246,0.3);
          color: var(--igihe-accent);
        }
        .igihe-msg__avatar--user {
          background: var(--igihe-accent);
          color: white;
        }

        .igihe-msg__body { display: flex; flex-direction: column; gap: 4px; max-width: 72%; }
        .igihe-msg--user .igihe-msg__body { align-items: flex-end; }

        .igihe-msg__bubble {
          padding: 13px 17px;
          border-radius: 18px;
          font-size: 14.5px;
          line-height: 1.65;
          color: var(--igihe-text);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .igihe-msg__bubble--ai {
          background:#1076ba3d;
          border: 1px solid var(--igihe-border);
          border-bottom-left-radius: 5px;
        }
        .igihe-msg__bubble--user {
          background: var(--igihe-accent);
          border-bottom-right-radius: 5px;
          color: #fff;
        }

        .igihe-msg__time {
          font-size: 10.5px;
          color: var(--igihe-text-muted);
          padding: 0 4px;
        }

        /* ── Typing ── */
        .igihe-typing {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 17px;
          background: var(--igihe-surface);
          border: 1px solid var(--igihe-border);
          border-radius: 18px;
          border-bottom-left-radius: 5px;
        }
        .igihe-typing__dots { display: flex; gap: 4px; align-items: center; }
        .igihe-typing__dots span {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--igihe-accent);
          animation: dot-bounce 1.2s ease-in-out infinite;
        }
        .igihe-typing__dots span:nth-child(2) { animation-delay: 0.2s; }
        .igihe-typing__dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .igihe-typing__label {
          font-size: 12px;
          color: var(--igihe-text-muted);
          transition: opacity 0.4s;
        }

        /* ── Quick prompts ── */
        .igihe-quick {
          padding: 12px 20px 8px;
          border-top: 1px solid var(--igihe-border);
          background: var(--igihe-surface);
          flex-shrink: 0;
        }
        .igihe-quick__label {
          font-size: 11px;
          color: var(--igihe-text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 8px;
          padding: 0 2px;
        }
        .igihe-quick__chips {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .igihe-quick__chips::-webkit-scrollbar { display: none; }
        .igihe-chip {
          flex-shrink: 0;
          padding: 7px 13px;
          border-radius: 100px;
          background: var(--igihe-surface2);
          border: 1px solid var(--igihe-border-bright);
          color: var(--igihe-text);
          font-size: 12.5px;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .igihe-chip:hover {
          background: var(--igihe-accent-dim);
          border-color: rgba(59,130,246,0.4);
          color: #93c5fd;
        }
        .igihe-chip:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Input ── */
        .igihe-input-area {
          padding: 16px 20px;
          border-top: 1px solid var(--igihe-border);
          background:#1076ba3d;
          flex-shrink: 0;
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
        .igihe-input-row {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          background: var(--igihe-surface);
          border: 1px solid var(--igihe-border-bright);
          border-radius: 14px;
          padding: 10px 12px;
          transition: border-color 0.2s;
        }
        .igihe-input-row:focus-within {
          border-color: rgba(59,130,246,0.5);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .igihe-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--igihe-text);
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          padding: 2px 0;
          min-height: 22px;
          max-height: 140px;
        }
        .igihe-textarea::placeholder { color: var(--igihe-text-muted); }

        .igihe-voice-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--igihe-text-muted);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .igihe-voice-btn:hover { color: var(--igihe-text); background: var(--igihe-surface2); }
        .igihe-voice-btn--listening { color: #f87171; animation: mic-pulse 1s ease-in-out infinite alternate; }
        @keyframes mic-pulse { from { opacity: 1; } to { opacity: 0.5; } }

        .igihe-send-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          border: none;
          background: var(--igihe-accent);
          color: white;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
          transition: all 0.15s cubic-bezier(.34,1.56,.64,1);
          box-shadow: 0 2px 8px rgba(59,130,246,0.3);
        }
        .igihe-send-btn:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 4px 14px rgba(59,130,246,0.45); }
        .igihe-send-btn:active:not(:disabled) { transform: scale(0.94); }
        .igihe-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .igihe-input-hint {
          font-size: 11px;
          color: var(--igihe-text-muted);
          text-align: center;
          margin-top: 8px;
        }

        .igihe-divider {
          text-align: center;
          font-size: 11px;
          color: var(--igihe-text-muted);
          position: relative;
        }
        .igihe-divider::before, .igihe-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 35%;
          height: 1px;
          background: var(--igihe-border);
        }
        .igihe-divider::before { left: 0; }
        .igihe-divider::after { right: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .igihe-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: currentColor;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 0.8s step-start infinite;
        }

        @media (max-width: 640px) {
          .igihe-messages { padding: 16px 16px 12px; }
          .igihe-msg__body { max-width: 85%; }
        }
      `}</style>

      {/* Header */}
      <div className="igihe-header">
        {variant === "page" && (
          <button className="igihe-back-btn" onClick={onClose} aria-label="Back">
            {closeIcon}
          </button>
        )}
        <div className="igihe-avatar">
          <Image src={"/assets/igiheIcon.png"} alt={""} height={30} width={30} />
          <span className="igihe-avatar__dot" />
        </div>
        <div>
          <div className="igihe-header__name">Ask IGIHE</div>
          <div className="igihe-header__sub">
            <span className="igihe-header__sub-dot" />
            Online
          </div>
        </div>
        <div className="igihe-header-actions">
          <button
            className="igihe-icon-btn"
            title="Clear conversation"
            onClick={clear}
          >
            ↺
          </button>
          {variant === "modal" && (
            <button
              className="igihe-icon-btn"
              title={closeTitle}
              onClick={onClose}
            >
              {closeIcon}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="igihe-messages">

        {messages.map((m, i) => (
          <div key={m.id}>
            {/* Date divider for first message */}
            {i === 0 && (
              <div className="igihe-divider" style={{ marginBottom: 20 }}>
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            )}
            <div className={`igihe-msg ${m.role === "user" ? "igihe-msg--user" : ""}`}>
              {m.role === "user" ?
                <div className={`igihe-msg__avatar igihe-msg__avatar--user`}>
                  👤
                </div> :
                <div className={`igihe-msg__avatar igihe-msg__avatar--ai`}>
                  <Image src={"/assets/igiheIcon.png"} alt={""} height={18} width={18} />
                </div>
              }

              <div className="igihe-msg__body">
                <div
                  className={`igihe-msg__bubble ${m.role === "user" ? "igihe-msg__bubble--user" : "igihe-msg__bubble--ai"}`}
                >
                  <ThemedText dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parseCustomMarkup(m.text) || '') }} />
                  {loading && m.role === "assistant" && m.text.length > 0 && messages[messages.length - 1]?.id === m.id && (
                    <span className="igihe-cursor" />
                  )}
                </div>

                <div className="igihe-msg__time">{formatTime(m.timestamp)}</div>
              </div>
            </div>
          </div>
        ))}

        {/* typing indicator only shown while assistant bubble is still empty */}
        {loading && messages[messages.length - 1]?.text === "" && (
          <div className="igihe-msg">
            <div className="igihe-msg__avatar igihe-msg__avatar--ai">
              <Image src={"/assets/igiheIcon.png"} alt={""} height={18} width={18} />
            </div>
            <div className="igihe-msg__body">
              <TypingIndicator phase={typingPhase} phrases={typingPhrases} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {showQuickPrompts && !loading && (
        <div className="igihe-quick">
          <ThemedText className="igihe-quick__label">Suggested</ThemedText>
          <div className="igihe-quick__chips">
            {quickPrompts.map(p => (
              <button
                key={p.cmd}
                className="igihe-chip"
                disabled={loading}
                onClick={() => send(p.cmd)}
              >
                <span>{p.icon}</span>
                <ThemedText>{p.label}</ThemedText>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="igihe-input-area">
        <div className="igihe-input-row">
          <button
            className={`igihe-voice-btn ${isListening ? "igihe-voice-btn--listening" : ""}`}
            onClick={handleVoice}
            title="Voice input"
            disabled={loading}
          >
            {isListening ? "⏹" : "🎙"}
          </button>
          <textarea
            ref={inputRef}
            className="igihe-textarea"
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder={isArticleMode ? "Ask about this article…" : "Ask about any news story, topic or event…"}
            disabled={loading}
          />
          <button
            className="igihe-send-btn"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            title="Send message"
          >
            {loading
              ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
              : "↑"}
          </button>
        </div>
        <div className="igihe-input-hint">{inputHint}</div>
      </div>
    </>
  );
}
