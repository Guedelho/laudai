const LOADING_HTML = [
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
].join("");

/**
 * Fetch the PDF from the current tab (BotID headers attached) then hand the
 * bytes to a new tab as a blob URL. A naked window.open('/api/.../pdf') breaks
 * because the new tab has no Next.js JS loaded yet, so no BotID headers.
 */
export async function openReportPdfTab(reportId: string): Promise<void> {
  const tab = window.open("", "_blank");
  if (!tab) return;
  tab.document.write(LOADING_HTML);

  try {
    const response = await fetch(`/api/reports/${reportId}/pdf`);
    if (!response.ok) throw new Error(`PDF fetch failed: ${response.status}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    tab.location.href = url;
  } catch (err) {
    tab.close();
    throw err;
  }
}
