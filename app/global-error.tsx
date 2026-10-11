"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Manpower error] Root layout crashed", error);
  }, [error]);
  return (
    <html lang="en">
      <body>
        <div
          className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center"
          style={{
            fontFamily: "system-ui, sans-serif",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100dvh",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "3rem" }}>⚠️</span>
          <div>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
              The app hit a critical error. Try reloading.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                background: "#111827",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                background: "transparent",
                color: "#111827",
                border: "1px solid #d1d5db",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
