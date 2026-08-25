import type { Metadata } from "next";
import ChatPageClient from "./ChatPageClient";

// Chat is inherently per-user/stateful (reads client-only store state for
// its article context) — it must never be statically prerendered/cached.
// Statically generating it froze the "no article" render at build time,
// which real visitors' client-side hydration could then mismatch against
// (e.g. arriving with article context already set from the trigger button),
// producing a hydration-failure crash that only showed up in production.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ask IGIHE — AI News Assistant",
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return <ChatPageClient />;
}
