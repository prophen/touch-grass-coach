export class RequestLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();
  private limit: number;
  private windowMs: number;
  private capacity: number;
  constructor(limit = 6, windowMs = 60_000, capacity = 1000) { this.limit = limit; this.windowMs = windowMs; this.capacity = capacity; }
  check(key: string, now = Date.now()): number {
    for (const [id, bucket] of this.buckets) if (bucket.resetAt <= now) this.buckets.delete(id);
    let bucket = this.buckets.get(key);
    if (!bucket) {
      // A bounded map must not evict live limits when flooded with new identities.
      if (this.buckets.size >= this.capacity) return Math.max(1, Math.ceil((Math.min(...Array.from(this.buckets.values(), b => b.resetAt)) - now) / 1000));
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
    }
    if (bucket.count >= this.limit) return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    bucket.count++;
    return 0;
  }
}

export async function readSmallJson(req: Request, limit = 4096): Promise<unknown> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("Missing body");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("Body too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(body));
}
