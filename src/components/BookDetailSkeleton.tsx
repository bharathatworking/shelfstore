import { Skeleton } from './ui/Skeleton'

export function BookDetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-12 md:gap-12">
      <div className="flex flex-col gap-5 md:col-span-4">
        <Skeleton className="mx-auto aspect-3/4 w-3/5 md:w-full" />
        <Skeleton className="h-40 rounded-md" />
      </div>
      <div className="flex flex-col gap-4 md:col-span-8">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-44" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-10 w-44" />
      </div>
    </div>
  )
}
