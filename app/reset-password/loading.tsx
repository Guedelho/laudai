export default function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 animate-pulse">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm space-y-6">
        <div className="h-7 w-44 bg-gray-200 rounded" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
        <div className="h-10 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
