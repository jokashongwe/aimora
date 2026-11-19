export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-navy/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-gold transition-all duration-500"
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}