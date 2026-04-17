const buckets = new Map<string, Map<string, number[]>>();

function getBucket(name: string): Map<string, number[]> {
  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = new Map();
    buckets.set(name, bucket);
  }
  return bucket;
}

export function checkRateLimit(name: string, userId: string, maxPerMinute: number): boolean {
  const bucket = getBucket(name);
  const now = Date.now();
  const timestamps = (bucket.get(userId) ?? []).filter(t => now - t < 60_000);
  bucket.set(userId, timestamps);
  return timestamps.length < maxPerMinute;
}

export function recordRateLimit(name: string, userId: string): void {
  const bucket = getBucket(name);
  const now = Date.now();
  const timestamps = (bucket.get(userId) ?? []).filter(t => now - t < 60_000);
  timestamps.push(now);
  bucket.set(userId, timestamps);
}
