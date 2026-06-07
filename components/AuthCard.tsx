export default function AuthCard({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div
        className={`bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm${center ? " text-center" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
