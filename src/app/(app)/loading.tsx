export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Chargement"
      className="space-y-6"
    >
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-brand-navy/10" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-brand-navy/5" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-brand-navy/5"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-2xl bg-brand-navy/5"
          />
        ))}
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
