export function CardSkeleton() {
  return (
    <div className="glass-card animate-pulse overflow-hidden rounded-2xl">
      <div className="h-44 bg-emerald-100/60 dark:bg-emerald-900/30" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-1/3 rounded bg-emerald-100 dark:bg-emerald-900/40" />
        <div className="h-5 w-3/4 rounded bg-emerald-100 dark:bg-emerald-900/40" />
        <div className="h-3 w-full rounded bg-emerald-100/80 dark:bg-emerald-900/30" />
        <div className="h-3 w-2/3 rounded bg-emerald-100/80 dark:bg-emerald-900/30" />
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      <p className="text-sm text-stone-500 dark:text-stone-400">Loading Sustainable Heritage...</p>
    </div>
  );
}
