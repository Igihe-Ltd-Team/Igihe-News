"use client";

import { usePathname } from "next/navigation";

// Routes that render as their own full-screen experience and shouldn't mount
// the site header/footer chrome underneath them (extra weight + off-screen
// interactive elements on a route that's meant to be a lightweight app view).
const FULL_SCREEN_ROUTES = ["/chat"];

export default function ChromeVisibility({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  return (
    <>
      {!isFullScreen && header}
      {children}
      {!isFullScreen && footer}
    </>
  );
}
