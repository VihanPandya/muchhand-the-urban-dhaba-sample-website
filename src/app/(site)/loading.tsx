export default function Loading() {
  return (
    <div className="container-x py-14" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="skeleton mb-4 h-10 w-2/3 max-w-md" />
      <div className="skeleton mb-10 h-5 w-1/2 max-w-sm" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="card overflow-hidden">
            <div className="skeleton aspect-[4/3] rounded-none" />
            <div className="space-y-3 p-4">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-9 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
