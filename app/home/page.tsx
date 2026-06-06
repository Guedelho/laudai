import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laudai — Gerador de laudos veterinários",
  description: "Transforme achados ditados em laudos estruturados, em segundos.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Laudai</h1>
        <p className="mt-4 text-lg text-gray-600">Gerador de laudos veterinários</p>
        <p className="mt-2 text-sm text-gray-500">Transforme achados ditados em laudos estruturados, em segundos.</p>
        <a
          href="https://app.laudai.vet/login"
          className="mt-8 inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Entrar
        </a>
      </div>
    </main>
  );
}
