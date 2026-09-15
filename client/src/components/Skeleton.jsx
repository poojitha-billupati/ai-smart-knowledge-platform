export function SkeletonTiles({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-surface p-5 shadow-card">
          <div className="skeleton h-2.5 w-24 rounded-full" />
          <div className="skeleton mt-3 h-9 w-16 rounded-lg" />
          <div className="skeleton mt-3 h-2.5 w-32 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-surface p-2 shadow-card">
          <div className="skeleton h-40 w-full rounded-xl" />
          <div className="px-2 pb-1.5 pt-3">
            <div className="skeleton h-2.5 w-16 rounded-full" />
            <div className="skeleton mt-2.5 h-4 w-3/4 rounded-full" />
            <div className="skeleton mt-2.5 h-3 w-full rounded-full" />
            <div className="skeleton mt-1.5 h-3 w-2/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 4 }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-card" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-t border-rule-soft px-4 py-3 first:border-t-0"
        >
          <div className="skeleton h-3 w-1/3 rounded-full" />
          <div className="skeleton h-3 w-1/4 rounded-full" />
        </div>
      ))}
    </div>
  );
}
