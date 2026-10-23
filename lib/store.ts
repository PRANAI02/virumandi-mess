/**
 * Tiny key/value store with two drivers.
 *
 *  - Upstash Redis over REST when KV_REST_API_URL / KV_REST_API_TOKEN are set
 *    (this is what Vercel's Upstash integration injects). Durable.
 *  - An in-process Map otherwise, so the site runs end-to-end with no setup.
 *    On Vercel each request is its own instance, so that fallback cannot carry
 *    an order from checkout to the kitchen — it is for local use only.
 */

const URL_ = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;

export const isDurable = Boolean(URL_ && TOKEN);

/**
 * Held on globalThis, not as a module-level const: Next gives route handlers
 * and page components separate module instances, so a plain `new Map()` here
 * means an order written by /api/orders is invisible to /order/[id].
 */
const globalStore = globalThis as typeof globalThis & {
  __vmMemoryStore?: Map<string, string>;
  __vmMemoryLists?: Map<string, string[]>;
};
const memory = (globalStore.__vmMemoryStore ??= new Map<string, string>());
const memoryLists = (globalStore.__vmMemoryLists ??= new Map<string, string[]>());

async function upstash(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${URL_}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`store: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { result?: unknown };
  return body.result;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (!isDurable) {
    const raw = memory.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  const result = await upstash(`get/${encodeURIComponent(key)}`);
  return parse<T>(result);
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const raw = JSON.stringify(value);
  if (!isDurable) {
    memory.set(key, raw);
    return;
  }
  await upstash(`set/${encodeURIComponent(key)}`, { method: "POST", body: raw });
}

/**
 * Read, transform, write. NOT atomic, so only use it where a lost concurrent
 * update is acceptable (the catalogue, which one person edits at a time).
 * Orders deliberately avoid this — see lib/orders.ts.
 */
export async function kvUpdate<T>(
  key: string,
  fallback: T,
  fn: (current: T) => T
): Promise<T> {
  const current = (await kvGet<T>(key)) ?? fallback;
  const next = fn(current);
  await kvSet(key, next);
  return next;
}

/** Prepend to a list. Atomic on Redis, so simultaneous orders can't clobber. */
export async function kvListPush(key: string, member: string): Promise<void> {
  if (!isDurable) {
    const list = memoryLists.get(key) ?? [];
    list.unshift(member);
    memoryLists.set(key, list);
    return;
  }
  await upstash(`lpush/${encodeURIComponent(key)}/${encodeURIComponent(member)}`, {
    method: "POST",
  });
}

export async function kvListRange(
  key: string,
  start: number,
  stop: number
): Promise<string[]> {
  if (!isDurable) {
    return (memoryLists.get(key) ?? []).slice(start, stop + 1);
  }
  const result = await upstash(`lrange/${encodeURIComponent(key)}/${start}/${stop}`);
  return Array.isArray(result) ? result.map(String) : [];
}

/** Trim a list to its most recent `keep` entries. */
export async function kvListTrim(key: string, keep: number): Promise<void> {
  if (!isDurable) {
    const list = memoryLists.get(key) ?? [];
    memoryLists.set(key, list.slice(0, keep));
    return;
  }
  await upstash(`ltrim/${encodeURIComponent(key)}/0/${keep - 1}`, { method: "POST" });
}

export async function kvMGet<T>(keys: string[]): Promise<(T | null)[]> {
  if (!keys.length) return [];
  if (!isDurable) return keys.map((k) => parse<T>(memory.get(k) ?? null));

  // Upstash's REST MGET puts every key in the URL path, so a long index would
  // build a URL past the server's limit. Fetch in batches instead.
  const BATCH = 40;
  const out: (T | null)[] = [];
  for (let i = 0; i < keys.length; i += BATCH) {
    const slice = keys.slice(i, i + BATCH);
    const path = slice.map((k) => encodeURIComponent(k)).join("/");
    const result = await upstash(`mget/${path}`);
    if (!Array.isArray(result)) out.push(...slice.map(() => null));
    else out.push(...result.map((r) => parse<T>(r)));
  }
  return out;
}

function parse<T>(raw: unknown): T | null {
  if (raw == null) return null;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return null;
  }
}
