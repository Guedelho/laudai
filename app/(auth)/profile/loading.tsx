export default function ProfileLoading() {
  return (
    <main className="flex items-start justify-center px-4 py-10 animate-pulse">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-lg space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        {/* Logo placeholder */}
        <div className="h-48 w-full rounded border border-dashed border-gray-200 bg-gray-50" />
        {/* Form fields */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
        {/* Signature section */}
        <div className="space-y-2">
          <div className="h-4 w-36 bg-gray-100 rounded" />
          <div className="h-20 w-full bg-gray-50 rounded-lg border border-gray-200" />
        </div>
        <div className="h-10 w-20 bg-gray-200 rounded-lg" />
      </div>
    </main>
  );
}
