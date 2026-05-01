import { Skeleton } from "@/components/ui/skeleton";

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
          <Skeleton className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className={`flex flex-col gap-1 max-w-[70%] ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
            <Skeleton className={`h-10 w-48 rounded-2xl bg-zinc-100 dark:bg-zinc-900 ${i % 2 === 0 ? 'rounded-bl-none' : 'rounded-br-none'}`} />
            <Skeleton className="h-3 w-12 bg-zinc-50 dark:bg-zinc-950" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 border-b border-black/[0.05] dark:border-white/[0.05]">
          <Skeleton className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800" />
              <Skeleton className="h-4 w-12 bg-zinc-100 dark:bg-zinc-900" />
            </div>
            <Skeleton className="h-4 w-full bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
      ))}
    </div>
  );
}
