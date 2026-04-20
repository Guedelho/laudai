export default function LaudoLoading() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
        <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
        <div className="flex gap-2">
          <div className="h-5 w-36 bg-blue-50 rounded-full" />
          <div className="h-5 w-20 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Info cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="h-3 w-20 bg-gray-100 rounded mb-4" />
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-36 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Report content skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
        </div>
        <div className="p-6 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${85 - i * 5}%` }} />
          ))}
        </div>
      </div>
    </main>
  );
}
