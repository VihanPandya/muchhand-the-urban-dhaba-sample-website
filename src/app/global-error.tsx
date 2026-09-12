"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
        <p style={{ color: "#584b44", marginBottom: "1.5rem" }}>
          The site hit an unexpected error. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#e08c07",
            color: "#fff",
            border: 0,
            borderRadius: 999,
            padding: "0.85rem 1.6rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {error.digest ? <p style={{ marginTop: "1.5rem", fontSize: 12, color: "#a89689" }}>Reference: {error.digest}</p> : null}
      </body>
    </html>
  );
}
