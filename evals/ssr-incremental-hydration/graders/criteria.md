---
type: llm
weight: 1
---

Grade the response against each criterion. Pass only if all are met.

1. Relies on `provideClientHydration()` for hydration, which turns on incremental hydration by default in v22 (no `withNoIncrementalHydration()`); an extra `withIncrementalHydration()` call is not required — references/guide/ssr.md.
2. Wraps the reviews section in a `@defer` block with the `hydrate on viewport` trigger — references/guide/ssr.md.
3. Leaves the header outside any `@defer` block so it hydrates with the rest of the page — references/guide/ssr.md.
4. Does not add a separate `withEventReplay()` (incremental hydration already enables event replay; it is only needed with `withNoIncrementalHydration()`), or notes it is redundant — references/guide/ssr.md.
5. The deferred reviews component is standalone and not referenced elsewhere in the same file, so it is actually split out — references/guide/templates.md.
