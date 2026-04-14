export default function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </main>
    </div>
  );
}
