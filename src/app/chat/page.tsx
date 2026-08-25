import type { Metadata } from "next";
import ChatPageClient from "./ChatPageClient";

export const metadata: Metadata = {
  title: "Ask IGIHE — AI News Assistant",
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return <ChatPageClient />;
}
