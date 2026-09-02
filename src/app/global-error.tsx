"use client";

// Catches errors thrown by the root layout itself, which a regular error.tsx
// can't do (it renders *inside* the layout, so it's no help if the layout is
// what broke). This replaces the whole <html>/<body>, so it can't rely on
// globals.css/Bootstrap from the layout that failed — hence inline styles.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ textAlign: "center", padding: "4rem 1rem", fontFamily: "sans-serif" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
            Something went wrong!
          </h2>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>{error.message}</p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1.5rem",
              cursor: "pointer",
              background: "#0d6efd",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
