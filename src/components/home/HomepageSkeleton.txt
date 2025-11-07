export function HomepageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="h-8 w-32 bg-gray-300 rounded"></div>
            <div className="flex space-x-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-6 w-20 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-12">
        {/* Breaking News Skeleton */}
        <div className="bg-gray-300 h-12 rounded"></div>

        {/* Featured Articles Skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-300 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-gray-300 rounded"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Section Skeleton */}
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-300 rounded"></div>
          <div className="flex space-x-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export function FeaturedArticlesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-300 rounded animate-pulse"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-gray-300 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-300 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  )
}