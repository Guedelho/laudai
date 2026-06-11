export default function Loading() {
  return (
    <main className="mx-auto flex h-[calc(100dvh-61px)] w-full max-w-3xl animate-pulse flex-col px-6 md:h-[100dvh]">
      <div className="shrink-0 pt-6 pb-3">
        <div className="h-6 w-36 rounded bg-gray-200" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pb-4">
        <div className="h-16 w-3/4 self-start rounded-2xl bg-gray-100" />
        <div className="h-10 w-1/2 self-end rounded-2xl bg-gray-200" />
        <div className="h-12 w-2/3 self-start rounded-2xl bg-gray-100" />
      </div>
      <div className="shrink-0 border-t border-gray-200 pt-3 pb-4">
        <div className="flex gap-2">
          <div className="h-9 w-11 rounded-lg bg-gray-100" />
          <div className="h-9 flex-1 rounded-lg bg-gray-100" />
          <div className="h-9 w-11 rounded-lg bg-gray-100" />
          <div className="h-9 w-20 rounded-lg bg-gray-200" />
        </div>
      </div>
    </main>
  );
}
