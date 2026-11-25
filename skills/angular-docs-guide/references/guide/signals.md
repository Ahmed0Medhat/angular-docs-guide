# Signals

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/signals,
> Dependent state with linkedSignal — https://angular.dev/guide/signals/linked-signal,
> Async reactivity with resources — https://angular.dev/guide/signals/resource,
> Debounced signals — https://angular.dev/guide/signals/debounced,
> Side effects for non-reactives APIs — https://angular.dev/guide/signals/effect.

## When to use
- Holding reactive local or service state and deriving read-only values from it (`signal`, `computed`).
- Keeping writable state that must reset or re-derive when other state changes (`linkedSignal`).
- Loading async data (HTTP, WebSocket, SSE) into signal-based code with status tracking (`resource`, `httpResource`).
- Debouncing user input before fetching (`debounced`).
- Syncing signal state to imperative, non-signal APIs: logging, storage, canvas/charts, manual DOM work (`effect`, `afterRenderEffect`).
- Reading a signal without making it a dependency (`untracked`).

## Rules
- MUST read a signal by calling it as a getter (`count()`); this is how Angular records where it is used.
- PREFER exposing service state through `asReadonly()` on a private `WritableSignal` so consumers cannot `set`/`update` it.
- MUST NOT rely on a readonly signal to stop deep mutation of its value; it only blocks `set()`/`update()`.
- PREFER `computed` for derived values; expensive derivations (e.g. array filtering) are fine because computeds are lazy and memoized.
- PREFER `linkedSignal` over `signal` when the state's valid value depends on other state, and over `effect` for values that are both derived and manually settable.
- MUST pass explicit generic arguments `linkedSignal<SourceT, ResultT>` when the computation uses the `previous` parameter.
- MUST read every signal an async reactive function depends on before the first `await` (passing it as an argument to the awaited call counts).
- PREFER `untracked(...)` for incidental signal reads or for calling external code inside `effect`/`computed` that should not become a dependency.
- PREFER passing the calling function to `assertNotInReactiveContext(fn)` so the error names the right API entry point.
- PREFER `chain(otherResource)` in `params` over reading `otherResource.value()` directly, so loading/error states propagate.
- MUST return the chained value itself (not wrapped in an object) from `params` so an `undefined` value makes the resource go idle.
- PREFER `computed` over `chain` when you only derive a value synchronously from a resource; use `chain` only when the dependent resource does its own async work.
- MUST use `hasValue()` before reading `value()` when the resource can be in error (it also narrows away `undefined`).
- MUST give `resource` an `id` that is unique app-wide and identical on server and client when caching through SSR.
- AVOID setting a resource `id` for data specific to the user who triggered the server render, especially if the HTML can be cached or shared.
- PREFER `stream` for continuously updating sources (WebSockets, SSE, Firestore `onSnapshot`) and `loader` for one-shot async operations.
- MUST call `debounced` and `effect` inside an injection context, or pass `{injector}` in their options.
- AVOID `effect` as a default tool: treat it as the last resort; prefer `computed()` / `linkedSignal()`. Copying one signal into another via an effect means the source of truth should move up.
- NEVER use effects to propagate state changes; model dependent state with `computed`.
- MUST destroy effects created with `manualCleanup` yourself via `EffectRef.destroy()` once they are no longer needed.
- PREFER registering `onCleanup` in effects that start long-running work (timers, requests) so it is cancelled on re-run or destroy.
- PREFER `afterRenderEffect` over `effect` when the work needs the DOM after Angular has rendered (e.g. updating a 3rd-party chart).
- PREFER `ResizeObserver`, `MutationObserver`, `IntersectionObserver` over `effect`/`afterRenderEffect` for detecting DOM changes when possible.
- PREFER specifying `afterRenderEffect` phases; NEVER read the DOM in `write`, NEVER write the DOM in `read`; use `mixedReadWrite` only when work cannot be split; use `read` instead of `earlyRead` if reading can wait.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `signal(initial, {equal?})` | Create a `WritableSignal` | Default equality is `Object.is` (referential) |
| `sig.set(v)` / `sig.update(fn)` | Replace value / compute new value from previous | Only on writable signals |
| `sig.asReadonly()` | Read-only view that tracks the original | No deep-mutation protection |
| `computed(fn, {equal?})` | Read-only derived `Signal` | Lazy, memoized, dynamic dependencies; `.set()` is a compile error |
| `linkedSignal(fn, {equal?, set?})` | Writable signal reset to `fn()` whenever the computation changes | Shorthand form |
| `linkedSignal({source, computation, equal?, set?})` | Writable signal recomputed when `source` or signals read in `computation` change | `computation(newSource, previous)`; `previous.source`, `previous.value` |
| `linkedSignal` `set: (value, rawSet) => …` | Redirect `set`/`update` (e.g. write back to a source of truth) | `rawSet` writes the internal value directly, skipping the computation |
| `untracked(sigOrFn)` | Read a signal / run code without tracking | Usable in `computed`/`effect` |
| `assertNotInReactiveContext(fn)` | Throw if called inside a reactive context | Pass the caller for a clearer error |
| `isSignal(x)` / `isWritableSignal(x)` | Runtime type checks | `computed` is a signal but not writable |
| `resource({params, loader})` | Async data as signals | `loader({params, previous, abortSignal})`; `previous.status` is the prior `ResourceStatus` |
| `resource({stream})` | Source producing many values over time | `stream` returns a signal that keeps updating |
| `resource({..., id})` | Reuse SSR result via `TransferState` | Client starts in `'resolved'` |
| `resource({..., defaultValue})` | Value shown before any data arrives | Otherwise `undefined` |
| `params: ({chain}) => chain(res)?.x` | Depend on another resource's value | Mirrors upstream idle/loading/error |
| `res.value()` | Latest value or default | Throws when status is `'error'` |
| `res.hasValue()` | Whether a value is present | Type guard; safe in error state |
| `res.error()` | Latest loader error or `undefined` | |
| `res.isLoading()` | Loader currently running | |
| `res.status()` | `ResourceStatus` string | See status table in Pitfalls |
| `res.reload()` | Re-run loader programmatically | Status becomes `'reloading'` |
| `res.set()` / `res.update()` | Set value locally | Status becomes `'local'` |
| `res.snapshot` | Signal of `ResourceSnapshot` (`status` + `value` or `error`) | |
| `resourceFromSnapshots(signalOfSnapshots)` | Build a `Resource` from snapshots (compose with `computed`/`linkedSignal`) | [experimental] |
| `httpResource(...)` | `HttpClient` wrapper exposing status/response as signals | Goes through the HTTP stack incl. interceptors; `@angular/common/http` |
| `debounced(source, ms \| waitFn, {equal?, injector?})` | `Resource` holding the settled value of `source` | [experimental]; `waitFn(value, lastSnapshot)` returns `Promise<void>` or nothing (see `DebounceTimer` type) |
| `effect(fn, {injector?, manualCleanup?})` | Run side effect whenever tracked signals change | Returns `EffectRef` (`destroy()`); `fn(onCleanup)` |
| `afterRenderEffect(fn \| phases)` | Effect that runs after DOM is rendered/committed | Phases: `earlyRead`, `write`, `mixedReadWrite`, `read`; client only |
| `afterNextRender({write})` | One-time post-render callback | Shown with `afterRenderEffect` for chart setup |

## Patterns

### Writable, readonly and computed
```ts
@Service()
export class CartState {
  private readonly _items = signal<Item[]>([]);
  readonly items = this._items.asReadonly();
  readonly total = computed(() => this._items().reduce((s, i) => s + i.price, 0));

  add(item: Item) {
    this._items.update((list) => [...list, item]);
  }
}
```

### Dynamic dependencies
```ts
const verbose = signal(false);
const hits = signal(0);
const label = computed(() => (verbose() ? `Hits: ${hits()}` : 'hidden'));
// While verbose() is false, changing hits does not recompute label.
```

### Custom equality
```ts
import isEqual from 'lodash/isEqual';
const tags = signal(['a'], {equal: isEqual});
tags.set(['a']); // deep-equal: no notification
```

### Untracked reads
```ts
effect(() => {
  const user = currentUser();               // tracked
  const n = untracked(counter);            // not tracked
  untracked(() => this.logger.log(user, n)); // signals read by logger not tracked
});
```

### Async reactive context
```ts
effect(async () => {
  const t = theme();            // read BEFORE await -> tracked
  const data = await loadUser();
  console.log(data.name, t);
});
```

### linkedSignal: reset on change
```ts
const methods = signal(['Ground', 'Air', 'Sea']);
const chosen = linkedSignal(() => methods()[0]);
chosen.set('Sea');
methods.set(['Email', 'Pickup']); // chosen() -> 'Email'
```

### linkedSignal: keep previous selection if still valid
```ts
chosen = linkedSignal<Method[], Method>({
  source: this.methods,
  computation: (next, prev) => next.find((m) => m.id === prev?.value.id) ?? next[0],
});
```

### linkedSignal: equality and write-back
```ts
const draft = linkedSignal(() => user(), {equal: (a, b) => a.id === b.id});

const celsius = signal(0);
const fahrenheit = linkedSignal(() => (celsius() * 9) / 5 + 32, {
  set: (f) => celsius.set(((f - 32) * 5) / 9),
});

const method = linkedSignal(() => order().method, {
  set: (m) => order.update((o) => ({...o, method: m})), // immutable write-back
});
```

### resource with abort and safe reads
```ts
const profile = resource({
  params: () => ({id: userId()}),
  loader: ({params, abortSignal}) =>
    fetch(`users/${params.id}`, {signal: abortSignal}).then((r) => r.json()),
});

const name = computed(() => (profile.hasValue() ? profile.value().name : undefined));
profile.reload();
```

### Streaming resource
```ts
const live = signal({value: 'Alice'});
const feed = resource({stream: () => live});
live.set({value: 'Bob'});
```

### SSR caching
```ts
const profile = resource({
  params: () => ({id: userId()}),
  loader: ({params}) => fetchUser(params),
  id: 'profile', // unique, same on server and client
});
```

### Chaining
```ts
const company = resource({
  params: ({chain}) => chain(profile)?.companyId, // NOT {companyId: ...}
  loader: ({params: companyId}) => fetchCompany(companyId),
});
```

### Keep previous value while reloading (experimental)
```ts
function keepPrevious<T>(src: Resource<T>): Resource<T> {
  const snaps = linkedSignal<ResourceSnapshot<T>, ResourceSnapshot<T>>({
    source: src.snapshot,
    computation: (snap, prev) =>
      snap.status === 'loading' && prev && prev.value.status !== 'error'
        ? {status: 'loading' as const, value: prev.value.value}
        : snap,
  });
  return resourceFromSnapshots(snaps);
}

user = keepPrevious(httpResource(() => `/user/${this.userId()}`));
```

### Debounced search (experimental)
```angular-ts
@Component({
  template: `
    <input (input)="term.set($event.target.value)" />
    @if (hits.isLoading()) { <p>Searching…</p> }
    @for (h of hits.value(); track h.id) { <li>{{ h.name }}</li> }
  `,
})
export class Finder {
  term = signal('');
  settled = debounced(this.term, 300);
  hits = resource({
    params: () => this.settled.value(),
    loader: ({params}) => search(params),
  });
}
```

### Debounced with custom wait / equality / injector
```ts
settled = debounced(term, (value, last) => {
  if (last.status === 'error') return; // no wait after an error
  return new Promise<void>((r) => setTimeout(r, value.length < 3 ? 500 : 200));
});

filterDeb = debounced(filter, 200, {equal: (a, b) => a.category === b.category});

make(q: Signal<string>) {
  return debounced(q, 300, {injector: this.injector});
}
```

### effect: injection context, injector option, cleanup
```ts
export class Ticker {
  readonly n = signal(0);
  private injector = inject(Injector);

  constructor() {
    effect(() => console.log(this.n())); // constructor = injection context
  }

  startLater() {
    effect(() => console.log(this.n()), {injector: this.injector});
  }
}

effect((onCleanup) => {
  const u = currentUser();
  const id = setTimeout(() => console.log(u), 1000);
  onCleanup(() => clearTimeout(id));
});
```

### afterRenderEffect with a 3rd-party chart
```ts
export class Chart {
  data = input.required<ChartData>();
  host = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  chart!: ChartInstance;

  constructor() {
    afterNextRender({write: () => (this.chart = createChart(this.host().nativeElement, this.data()))});
    afterRenderEffect(() => this.chart.updateData(this.data()));
  }
}
```

### afterRenderEffect phases
```ts
afterRenderEffect({
  earlyRead: (onCleanup) => measure(),
  write: (measured, onCleanup) => applyLayout(measured()),
  mixedReadWrite: (prev, onCleanup) => { /* only if unavoidable */ },
  read: (prev, onCleanup) => readBack(),
});
```

## Pitfalls
- Calling `.set()` on a `computed` fails at compile time; it is not a `WritableSignal`.
- Computed dependencies are dynamic: signals not read in the last run are not tracked, and dependencies can be dropped as well as added.
- Reactive contexts are entered when running `effect`/`afterRenderEffect` callbacks, evaluating `computed`, `linkedSignal`, a `resource` params function, and rendering templates (including host bindings). Changes re-run consumers *eventually*, not synchronously.
- Signal reads after an `await` (or any async boundary) are not tracked.
- An effect that reads two signals re-runs on either; wrap the incidental one in `untracked`.
- Equality functions apply to writable and computed signals (and `linkedSignal`, `debounced`); with deep equality, setting an equal new instance triggers nothing.
- Reading a signal in an `OnPush` template makes it a dependency; changes mark the component for check on the next change detection.
- A `linkedSignal` without `previous` logic snaps back to its computation result whenever dependencies change, discarding the user's value.
- `resource`: if `params` returns `undefined`, the loader does not run and status becomes `'idle'`.
- `resource`: a `params` change during loading aborts the in-flight load; use `abortSignal` to cancel the underlying request.
- `resource.value()` throws in `'error'` status; guard with `hasValue()`.
- Resource statuses:

  | Status | `value()` | Meaning |
  | --- | --- | --- |
  | `'idle'` | `undefined` | No valid request; loader not run |
  | `'error'` | throws | Loader failed |
  | `'loading'` | `undefined` | Loader running because `params` changed |
  | `'reloading'` | previous value | Loader running because of `reload()` |
  | `'resolved'` | resolved value | Loader finished |
  | `'local'` | locally set value | Set via `.set()` / `.update()` |
- `chain`: upstream idle -> downstream idle; loading/reloading -> downstream `loading` and loader skipped (no previous value returned during `reloading`); error -> downstream error; resolved/local -> returns value (which may be `undefined`). When a status is propagated, the rest of `params` does not run.
- Wrapping a chained value (`{companyId: undefined}`) is a defined params value, so the loader runs with `undefined` instead of idling.
- Reading `otherResource.value()` in `params` instead of `chain` makes the downstream resource idle rather than mirroring upstream loading/error.
- SSR-cached resource values are serialized into the HTML, so user-specific data with an `id` can leak via cached/shared pages.
- `debounced`: while the timer runs after a resolved value, status is `'loading'` and `value()` returns the previous resolved value; it then settles to `'resolved'`.
- `debounced`: if the source throws, status goes to `'error'` at once, `value()` throws, and no timer runs; once the source recovers it stays `'error'` until the new wait completes.
- `debounced` custom wait: a source change before the promise settles discards it and starts a new one. Default equality is `Object.is`.
- `debounced` resources and pending timers are destroyed with their injector.
- Using effects to propagate state can cause `ExpressionChangedAfterItHasBeenChecked`, infinite circular updates, or extra change detection cycles.
- By default `effect` can only be created in an injection context; elsewhere pass `{injector}`.
- Effects run at least once, always asynchronously during change detection, tracking only signals read in the latest run.
- View effects (created during component instantiation, incl. services on component injectors) run before that component is checked and are destroyed with it; root effects (root-provided services) run before all components are checked and are destroyed with the app. Either re-runs before change detection continues if a dependency changed during its run.
- `effect` runs before Angular updates the DOM; use `afterRenderEffect` for post-render DOM work.
- `afterRenderEffect` without phases runs in `mixedReadWrite`, which can add DOM reflows (marked CRITICAL in the docs).
- `afterRenderEffect` phase order: `earlyRead` -> `write` -> `mixedReadWrite` -> `read`. `earlyRead` gets only the cleanup fn; later phases get the previous phase's return value as a Signal plus cleanup. Changing a tracked signal in a phase re-runs the affected phases. Cleanups run on destroy or before phases re-run.
- `afterRenderEffect` (like `afterNextRender`/`afterEveryRender`) runs only on the client, and components may not yet be hydrated when it runs — touch DOM/layout carefully.

## Version notes
- [experimental] `resourceFromSnapshots`.
- [experimental] `debounced`.
- No other stability labels are stated for the signal APIs on these pages.
