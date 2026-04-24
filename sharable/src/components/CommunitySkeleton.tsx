import { Skeleton } from "@/components/ui/skeleton";

export function CommunitySkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 animate-pulse">
      {/* Image Skeleton */}
      <Skeleton className="w-full h-40 rounded-lg mb-3 bg-zinc-100 dark:bg-zinc-800" />
      
      {/* Title Skeleton */}
      <Skeleton className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 mb-2" />
      
      {/* Description Skeleton */}
      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-full bg-zinc-100 dark:bg-zinc-900" />
        <Skeleton className="h-4 w-5/6 bg-zinc-100 dark:bg-zinc-900" />
      </div>

      {/* Category Skeleton */}
      <Skeleton className="h-5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-900 mb-3" />

      {/* Footer Skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <Skeleton className="h-4 w-24 bg-zinc-100 dark:bg-zinc-900" />
        <Skeleton className="h-6 w-16 bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );
}
