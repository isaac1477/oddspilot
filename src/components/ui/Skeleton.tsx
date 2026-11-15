export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="h-4 w-20 rounded-md shimmer-bg" />
        <div className="h-4 w-12 rounded-md shimmer-bg" />
      </div>
      <div className="h-5 w-3/4 rounded-md shimmer-bg" />
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-lg shimmer-bg" />
        <div className="h-8 flex-1 rounded-lg shimmer-bg" />
      </div>
      <div className="flex justify-between">
        <div className="h-3 w-16 rounded shimmer-bg" />
        <div className="h-3 w-16 rounded shimmer-bg" />
      </div>
    </div>
  );
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
