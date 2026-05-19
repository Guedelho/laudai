import "server-only";

// Vercel's log drain parses JSON-on-stderr into structured fields searchable
// in the dashboard. Use this for anything we'd want to alert/aggregate on.
export function logError(message: string, error: unknown, context: Record<string, unknown> = {}): void {
  const err =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };
  console.error(JSON.stringify({ level: "error", message, ...context, error: err }));
}

export function logWarn(message: string, context: Record<string, unknown> = {}): void {
  console.warn(JSON.stringify({ level: "warn", message, ...context }));
}

export function logInfo(message: string, context: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ level: "info", message, ...context }));
}
