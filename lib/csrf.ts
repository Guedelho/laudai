import "server-only";

export function isSameOriginRequest(req: Request): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";
  // Fallback for non-browser clients: require explicit fetch sentinel.
  return req.headers.get("x-requested-with") === "fetch";
}
