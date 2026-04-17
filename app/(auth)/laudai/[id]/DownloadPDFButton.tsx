"use client";

export default function DownloadPDFButton({ laudoId }: { laudoId: string }) {
  function handleClick() {
    const tab = window.open("", "_blank");
    if (tab) {
      tab.document.write(
        [
          "<!DOCTYPE html><html><head><title>Laudai</title><style>",
          "*{margin:0;padding:0;box-sizing:border-box}",
          "body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif}",
          ".c{text-align:center;animation:fadeIn .4s ease-out}",
          ".s{width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#2563eb;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}",
          "h1{font-size:18px;font-weight:600;color:#111827;margin-bottom:6px}",
          "p{font-size:14px;color:#6b7280;animation:pulse 2s ease-in-out infinite}",
          "@keyframes spin{to{transform:rotate(360deg)}}",
          "@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
          "@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}",
          '</style></head><body><div class="c"><div class="s"></div><h1>Laudai</h1><p>Preparando PDF...</p></div></body></html>',
        ].join(""),
      );
      tab.location.href = `/api/laudos/${laudoId}/pdf`;
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors print:hidden"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 7.131s0 0 0 0"
        />
      </svg>
      Imprimir
    </button>
  );
}
