"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="btn btn-light border-0 p-2"
      style={{
        borderRadius: "50%",
        boxShadow: "0 0 4px rgba(0,0,0,0.1)",
        height:14,
        width:14,
        justifyContent:'center',
        alignItems:'center',
        display:'flex'
      }}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <i className="bi bi-moon-stars-fill fs-6 text-dark"></i>
      ) : (
        <i className="bi bi-brightness-high-fill fs-6 text-warning"></i>
      )}
    </button>
  );
}
