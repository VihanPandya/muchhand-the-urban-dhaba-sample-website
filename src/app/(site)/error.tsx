"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[site]", error);
  }, [error]);

  return (
    <div className="container-x flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-3">Something went wrong</p>
      <h1 className="text-3xl md:text-4xl">We dropped that one</h1>
      <p className="mt-3 max-w-md text-ink-500">
        Sorry — that page failed to load. Try again, and if it keeps happening, message us on WhatsApp and we&apos;ll take
        your order directly.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Back home
        </Link>
      </div>
      {error.digest ? <p className="mt-6 font-mono text-xs text-ink-300">Reference: {error.digest}</p> : null}
    </div>
  );
}
