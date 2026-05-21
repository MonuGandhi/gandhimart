export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <Skeleton className="w-full aspect-square rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="px-4">
      <Skeleton className="w-full h-40 rounded-2xl" />
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="w-16 h-16 rounded-2xl" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}
