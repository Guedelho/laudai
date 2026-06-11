export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl animate-pulse px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-gray-200" />
        <div className="h-8 w-44 rounded-lg bg-gray-200" />
      </div>
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="h-4 w-40 rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="space-y-1">
                  <div className="h-3 w-20 rounded bg-gray-100" />
                  <div className="h-9 w-full rounded-lg bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="h-12 w-full rounded-xl bg-gray-200" />
      </div>
    </main>
  );
}
