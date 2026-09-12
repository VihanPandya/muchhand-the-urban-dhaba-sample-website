import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="text-4xl md:text-5xl">This page is off the menu</h1>
      <p className="mt-3 max-w-md text-ink-500">
        The page you were looking for doesn&apos;t exist, or it moved. The food, however, is exactly where you left it.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/menu" className="btn btn-primary">
          Browse the menu
        </Link>
        <Link href="/" className="btn btn-outline">
          Back home
        </Link>
      </div>
    </div>
  );
}
