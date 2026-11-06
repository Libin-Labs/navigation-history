# @lp-labs/navigation-history

Explicit bounded navigation entries with detached JSON state and branch-aware back/forward.

Standalone original implementation with zero runtime, peer or sibling dependencies.
Library ID 435. ES2022, strict TypeScript, NodeNext ESM and CommonJS with declarations.

## Install

```bash
npm install @lp-labs/navigation-history
```

CommonJS: `const { createHistory } = require('@lp-labs/navigation-history')`.

## Quickstart

```js
import { createHistory } from '@lp-labs/navigation-history';

const history = createHistory({ location: '/', state: { section: 'home' } });
history.push('/settings', { tab: 2 });
if (history.back().location !== '/') throw new Error('Back failed');
if (history.forward().location !== '/settings') throw new Error('Forward failed');
```

## API, customization and contracts

`createHistory(initial, options?)` starts with exactly one entry at index zero.
Locations are opaque nonempty strings up to 8192 characters. JSON state accepts finite numbers,
strings, booleans, null, dense arrays and plain objects; cycles, holes, undefined, custom
prototypes, functions and depth above 100 are rejected. Shared noncyclic references are copied
independently. State is deeply copied on every input and output; no serializer or global
structuredClone implementation is required.

`push(location, state = null)` truncates the forward branch and appends an entry with a
monotonic string key. Capacity defaults to 100, integer 1..100000; oldest entries are evicted.
Duplicate location policy is 'allow' (default), 'ignore' (return current entry unchanged),
or 'replace' (replace current state/location retaining its key). Only the current location
is compared; state is not compared. State is validated even for an ignored push.
Keys are opaque: duplicate attempts may consume sequence numbers.
`replace(location, state = null)` preserves the current key, index and forward branch.
`go(delta)`, `back()`, `forward()` clamp to available entries and return detached entries.
`snapshot()` returns copied entries, index, canBack and canForward.

Invalid locations/state/policies or noninteger deltas throw TypeError; capacity/depth limits
throw RangeError. Invalid state does not change navigation. JSON properties use ordinary
enumerable string-key semantics; symbols and nonenumerable properties are not preserved.
Operations cost O(entries + state size) worst case; snapshots O(total copied state).
An adapter should call push/replace for application events and apply returned entries to its
own renderer/router; browser popstate wiring and side effects belong entirely to that adapter.

## Complete public declarations

```ts
export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | {
      [key: string]: Json;
    };
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
  snapshot(): {
    entries: Entry[];
    index: number;
    canBack: boolean;
    canForward: boolean;
  };
}
export declare function createHistory(
  initial: {
    location: string;
    state?: Json;
  },
  options?: HistoryOptions,
): NavigationHistory;
```

## Scope and performance

Caller-supplied locations and serializable state, no browser globals, router, URL parser or global history integration.

Complexities and bounds above assume ordinary JavaScript number arithmetic and Map/Set
average constant-time lookup. No runtime or peer dependencies, automatic browser adapters,
global registries or hidden services are included. Importing the module has no browser effects.

## Development

```bash
npm ci --offline --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
