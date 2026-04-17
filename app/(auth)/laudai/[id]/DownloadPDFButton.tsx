export default function DownloadPDFButton({ laudoId }: { laudoId: string }) {
  return (
    <a
      href={`/api/laudos/${laudoId}/pdf`}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-400 print:hidden"
    >
      Imprimir
    </a>
  );
}
