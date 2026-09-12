"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-[var(--shadow-soft)]">
      <h1 className="font-display text-xl font-semibold text-ink-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-500">
        That screen failed to load. Try again — if it keeps happening, check the server logs.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/admin" className="btn btn-outline">
          Dashboard
        </Link>
      </div>
      {error.digest ? <p className="mt-5 font-mono text-xs text-ink-300">Reference: {error.digest}</p> : null}
    </div>
  );
}
