import NewsSkeleton from "@/components/NewsSkeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 ">
          <NewsSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}