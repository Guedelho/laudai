export default function ProfileLoading() {
  return (
    <main className="flex animate-pulse flex-col items-center gap-6 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="h-7 w-44 rounded bg-gray-200" />
      </div>
      <div className="w-full max-w-lg space-y-3 rounded-xl border border-gray-200 bg-white p-8">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="h-4 w-64 rounded bg-gray-100" />
        <div className="h-48 w-full rounded border border-dashed border-gray-200 bg-gray-50" />
      </div>
      <div className="w-full max-w-lg space-y-6 rounded-xl border border-gray-200 bg-white p-8">
        <div className="h-5 w-20 rounded bg-gray-200" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-9 w-full rounded-lg bg-gray-100" />
          </div>
        ))}
        <div className="h-9 w-24 rounded-lg bg-gray-200" />
      </div>
      <div className="w-full max-w-lg space-y-3 rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-5 w-28 rounded bg-gray-200" />
        <div className="h-4 w-48 rounded bg-gray-100" />
        <div className="h-4 w-36 rounded bg-gray-100" />
      </div>
    </main>
  );
}
