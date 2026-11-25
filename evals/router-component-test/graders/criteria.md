---
type: llm
weight: 1
---

Grade the response against each criterion. Pass only if all are met.

1. Uses Vitest syntax (the CLI default test runner), not Jasmine-only APIs such as `jasmine.createSpy` — references/guide/testing.md.
2. Provides real routes with `provideRouter(routes)` in `TestBed` and does not mock the `Router` — references/guide/routing-advanced.md.
3. Uses `RouterTestingHarness.create()` and `harness.navigateByUrl('/items/42', Component)` to render the routed component — references/guide/routing-advanced.md.
4. Asserts the navigation result through the real router (e.g. `TestBed.inject(Router).url` equals `/items/42/edit`) after clicking the button — references/guide/routing-advanced.md.
5. Configures `TestBed` in `beforeEach()` and never after creating the component — references/guide/testing.md.
6. Waits for rendering/navigation with `await fixture.whenStable()` or the harness's async navigation before asserting — references/guide/testing.md.
