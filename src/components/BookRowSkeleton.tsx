import { Skeleton } from './ui/Skeleton'

export function BookRowSkeleton() {
  return (
    <li className="flex gap-4 px-4 py-4 md:px-5">
      <Skeleton className="aspect-3/4 w-12 md:w-14" />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="mt-1 hidden h-8 w-24 sm:block" />
    </li>
  )
}
