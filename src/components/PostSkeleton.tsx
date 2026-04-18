import { Skeleton } from "@/components/ui/skeleton";

export function PostSkeleton() {
  return (
    <div className="w-full bg-white dark:bg-black border-b border-black/[0.05] dark:border-white/[0.05] animate-pulse">
      <div className="px-4 pt-4 pb-2">
        {/* Header: Avatar, Name/Badge/Username, Menu */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Avatar Skeleton - 40px */}
            <Skeleton className="w-10 h-10 rounded-full shrink-0 bg-zinc-200 dark:bg-zinc-800" />
            
            {/* Name, Badge, Username on same line */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              <Skeleton className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-4 w-20 bg-zinc-100 dark:bg-zinc-900" />
            </div>
          </div>
          
          {/* Three-dot Menu Skeleton */}
          <Skeleton className="w-6 h-6 rounded-full shrink-0 bg-zinc-100 dark:bg-zinc-900 ml-2" />
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 pb-4">
        {/* Content Lines: 1st line ~60%, 2nd line 100%, 3rd line ~50% */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-[60%] bg-zinc-100 dark:bg-zinc-900" />
          <Skeleton className="h-4 w-full bg-zinc-100 dark:bg-zinc-900" />
          <Skeleton className="h-4 w-[50%] bg-zinc-100 dark:bg-zinc-900" />
        </div>
      </div>

      {/* Interaction Buttons */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-black/[0.05] dark:border-white/[0.05]">
        {/* Like Button */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-6 h-6 bg-zinc-100 dark:bg-zinc-900" />
          <Skeleton className="h-4 w-6 bg-zinc-100 dark:bg-zinc-900" />
        </div>

        {/* Comment Button */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-6 h-6 bg-zinc-100 dark:bg-zinc-900" />
          <Skeleton className="h-4 w-6 bg-zinc-100 dark:bg-zinc-900" />
        </div>

        {/* Repost Button */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-6 h-6 bg-zinc-100 dark:bg-zinc-900" />
          <Skeleton className="h-4 w-6 bg-zinc-100 dark:bg-zinc-900" />
        </div>

        {/* Share Button */}
        <Skeleton className="w-6 h-6 bg-zinc-100 dark:bg-zinc-900" />

        {/* Save Button (Right side) */}
        <Skeleton className="w-6 h-6 bg-zinc-100 dark:bg-zinc-900 ml-auto" />
      </div>
    </div>
  );
}
