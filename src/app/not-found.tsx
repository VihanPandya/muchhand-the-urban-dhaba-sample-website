import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en-IN">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-display text-4xl">Page not found</h1>
          <p className="text-ink-500">That page doesn&apos;t exist.</p>
          <Link href="/" className="btn btn-primary">
            Back home
          </Link>
        </main>
      </body>
    </html>
  );
}
