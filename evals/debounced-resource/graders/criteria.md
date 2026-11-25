---
type: llm
weight: 1
---

Grade the response against each criterion. Pass only if all are met.

1. Holds the query in a `signal` and debounces it with signal APIs (`debounced(query, 300)`, marked experimental) or via `toObservable` + RxJS `debounceTime` + `toSignal` — references/guide/signals.md, references/ecosystem/rxjs-interop.md.
2. Fetches reactively with `httpResource` (or `resource`/`rxResource`) driven by the debounced value — references/guide/http.md.
3. Guards reads of `value()` with `hasValue()` — references/guide/http.md.
4. Renders loading (`isLoading()`) and error (`error()`) states with built-in control flow (`@if`) — references/guide/http.md, references/guide/templates.md.
5. Uses `@for` with a `track` expression for the results list — references/guide/templates.md.
6. Encodes the query parameter safely (e.g. `encodeURIComponent` or `params`) rather than raw concatenation, or skips the request when the query is empty — references/guide/http.md.
