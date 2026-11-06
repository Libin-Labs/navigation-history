export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export interface Entry {
  key: string;
  location: string;
  state: Json;
}
export interface HistoryOptions {
  capacity?: number;
  duplicate?: 'allow' | 'ignore' | 'replace';
}
export interface NavigationHistory {
  push(location: string, state?: Json): Entry;
  replace(location: string, state?: Json): Entry;
  go(delta: number): Entry;
  back(): Entry;
  forward(): Entry;
  snapshot(): { entries: Entry[]; index: number; canBack: boolean; canForward: boolean };
}

function clone(value: Json, seen = new Set<object>(), depth = 0): Json {
  if (depth > 100) throw new RangeError('State nesting exceeds 100');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || seen.has(value)) throw new TypeError('State must be JSON');
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    throw new TypeError('State must be plain JSON');
  seen.add(value);
  let result: Json;
  if (Array.isArray(value)) {
    result = Array.from(value, (v) => clone(v, seen, depth + 1));
  } else {
    result = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, clone(v, seen, depth + 1)]),
    );
  }
  seen.delete(value);
  return result;
}

export function createHistory(
  initial: { location: string; state?: Json },
  options: HistoryOptions = {},
): NavigationHistory {
  const capacity = options.capacity ?? 100;
  const duplicate = options.duplicate ?? 'allow';
  if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 100000)
    throw new RangeError('Invalid capacity');
  if (!['allow', 'ignore', 'replace'].includes(duplicate))
    throw new TypeError('Invalid duplicate policy');
  let sequence = 0;
  function entry(location: string, state: Json): Entry {
    if (typeof location !== 'string' || !location || location.length > 8192)
      throw new TypeError('Invalid location');
    const detached = clone(state);
    return { key: String(++sequence), location, state: detached };
  }
  const copy = (e: Entry): Entry => ({ ...e, state: clone(e.state) });
  let entries = [entry(initial.location, initial.state ?? null)];
  let index = 0;
  function replace(location: string, state: Json = null): Entry {
    const next = entry(location, state);
    next.key = entries[index]!.key;
    entries[index] = next;
    return copy(next);
  }
  function go(delta: number): Entry {
    if (!Number.isSafeInteger(delta)) throw new TypeError('Delta must be an integer');
    index = Math.max(0, Math.min(entries.length - 1, index + delta));
    return copy(entries[index]!);
  }
  return {
    replace,
    go,
    back: () => go(-1),
    forward: () => go(1),
    push(location, state = null) {
      const next = entry(location, state);
      if (entries[index]!.location === location && duplicate !== 'allow') {
        return duplicate === 'ignore' ? copy(entries[index]!) : replace(location, state);
      }
      entries = entries.slice(0, index + 1);
      entries.push(next);
      if (entries.length > capacity) entries.shift();
      index = entries.length - 1;
      return copy(next);
    },
    snapshot: () => ({
      entries: entries.map(copy),
      index,
      canBack: index > 0,
      canForward: index < entries.length - 1,
    }),
  };
}
