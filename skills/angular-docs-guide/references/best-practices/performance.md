# Performance (loading and runtime)

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/best-practices/performance,
> Overview — https://angular.dev/best-practices/runtime-performance,
> Slow computations — https://angular.dev/best-practices/slow-computations,
> Skipping component subtrees — https://angular.dev/best-practices/skipping-subtrees,
> Zone pollution — https://angular.dev/best-practices/zone-pollution,
> Chrome DevTools profiling — https://angular.dev/best-practices/profiling-with-chrome-devtools.

## When to use
- Choosing what to optimize for slow initial load vs. slow interactions after load
- Understanding when `OnPush` components are (and are not) checked during change detection
- Fixing expensive template expressions or lifecycle hooks found while profiling
- Stopping third-party libraries and timers from triggering needless change detection in zone-based apps
- Recording Angular-aware profiles in the Chrome DevTools performance panel
- See also: zoneless change detection → references/guide/zoneless.md
- See also: `@defer` and pure pipes → references/guide/templates.md
- See also: lazy-loaded services (`injectAsync`) → references/guide/di.md
- See also: image optimization (`NgOptimizedImage`) → references/guide/image-optimization.md
- See also: SSR, hydration, incremental hydration → references/guide/ssr.md
- See also: Angular DevTools profiler → references/tools/devtools.md

## Rules
Where to start
- PREFER profiling first (Chrome DevTools Angular track) to find the actual bottleneck before optimizing.
- Slow initial load: PREFER `@defer` to split large components out of the main bundle, `NgOptimizedImage` for above-the-fold images, and SSR for faster content.
- Slow interactions: check zoneless is enabled, look for slow computations in templates/hooks, and consider `OnPush`.

Loading techniques
| Technique | Effect | Use when |
|---|---|---|
| Lazy-loaded routes | Route components load on navigation; smaller initial bundle | Many routes, not all needed at start |
| `@defer` | Components split into on-demand bundles | Not visible initially, heavy third-party libs, below the fold |
| `injectAsync` lazy services | Rarely used services in separate chunks | Services backed by large libraries / rare features |
| Image optimization | Prioritize LCP image, lazy-load others, responsive `srcset` | Any app showing images |
| SSR (+ hydration, incremental hydration) | Faster first paint, better SEO | Content-heavy, SEO-indexed pages |

Runtime techniques
| Technique | Effect | Use when |
|---|---|---|
| Zoneless change detection | No ZoneJS overhead; CD only on signal/event notifications | New apps (default in v21+) or apps ready to migrate |
| Fix slow computations | Optimize expensive expressions/hooks | Profiling shows specific slow components |
| `OnPush` subtrees | Skip unchanged trees | Need finer CD control |
| Zone pollution fixes | Avoid CD from timers / third-party libs | Zone-based apps with excessive CD cycles |

Slow computations
- PREFER optimizing the underlying algorithm (recommended first choice).
- PREFER moving heavy template computations into a pure pipe (re-evaluated only when its inputs change).
- PREFER memoization when several results must be cached; weigh its memory cost when called often with varied arguments (pure pipes keep only the last result).
- AVOID operations that force reflow/repaint inside lifecycle hooks that run on every CD cycle.

OnPush
- MUST call `ChangeDetectorRef.markForCheck()` after changing an `@Input` of an `OnPush` component imperatively (e.g. via `@ViewChild`/`@ContentChild`); Angular will not check it otherwise.
- MUST pass a new object reference (not mutate) when an `OnPush` input must trigger a check; inputs are compared with `Object.is`.

Zone pollution
- PREFER `NgZone.runOutsideAngular` for timers (`setInterval`, `setTimeout`, `requestAnimationFrame`) and third-party library setup that do not change app state.
- MUST re-enter the zone with `NgZone.run` (or run CD manually) when a handler registered outside the zone must update views or emit to parents.

Profiling
- PREFER calling `enableProfiling()` before `bootstrapApplication` to capture startup work; or run `ng.enableProfiling()` in the console.
- AVOID updating state during change detection (visible as more than one synchronization pass); it slows updates and can loop infinitely.

## API cheat-sheet
| API | Purpose | Notes / version tag |
|---|---|---|
| `OnPush` strategy | Check a subtree only on new inputs, handled events, mark-for-check or template signal changes | Default strategy since v22 |
| `Eager` strategy | Component checked on every CD pass | Contrast with OnPush |
| `ChangeDetectorRef.markForCheck()` | Schedule CD for an OnPush component | Also triggered by `AsyncPipe` |
| `NgZone.runOutsideAngular(fn)` | Run tasks without triggering CD | Handlers registered inside also run outside |
| `NgZone.run(fn)` | Re-enter the Angular zone | To emit outputs / update views |
| `NgZone.isInAngularZone()` | Check current zone | Debug helper |
| `enableProfiling()` | Adds the Angular track to Chrome DevTools profiles | From `@angular/core`; dev mode only |
| `ng.enableProfiling()` | Same, from the browser console | Dev mode only |
| `angular-devtools://component/...` | Summary-tab link opening the component in Angular DevTools | Needs Angular DevTools for Chrome + flag `chrome://flags/#enable-devtools-deep-link-via-extensibility-api` (an experimental Chrome flag) |

When an `OnPush` subtree is checked:
- Its root gets a new input from a template binding (`Object.is` comparison).
- An event (event binding, output binding, `@HostListener`) is handled in its root or any descendant (OnPush or not).
- A component in it is marked for check (`markForCheck`, `AsyncPipe`).
- A signal read in a template inside it changes (only components reading that signal refresh).

Event scenarios:
| Event handled in | Result |
|---|---|
| `Eager` component | Whole tree checked except OnPush subtrees without new inputs |
| OnPush component | Whole tree checked; other OnPush subtrees outside it without new inputs are skipped |
| Descendant of an OnPush component | That component's ancestors (even OnPush ones) are checked too |
| Parent passes new input to OnPush child | Child checked; its OnPush children skipped unless they get new inputs |

Chrome flame-chart colors (Angular track):
| Color | Meaning |
|---|---|
| Blue | Developer TypeScript (services, constructors, lifecycle hooks) |
| Purple | Developer templates compiled by Angular |
| Green | Entry points / reasons code ran |

## Patterns

### Timer outside the zone
```ts
export class Dashboard implements OnInit {
  private zone = inject(NgZone);
  ngOnInit() {
    this.zone.runOutsideAngular(() => setInterval(poll, 500));
  }
}
```

### Third-party lib outside, events back inside
```ts
export class Chart implements OnInit {
  private zone = inject(NgZone);
  pointClick = output<ClickEvent>();

  ngOnInit() {
    this.zone.runOutsideAngular(() => this.init());
  }

  private async init() {
    const chart = await ChartLib.create('chart', data);
    chart.on('click', (e: ClickEvent) => this.zone.run(() => this.pointClick.emit(e)));
  }
}
```

### Profile from startup
```ts
import {enableProfiling} from '@angular/core';
enableProfiling();
bootstrapApplication(App);
```

## Pitfalls
- Angular evaluates all template expressions and runs `ngDoCheck`, `ngAfterContentChecked`, `ngAfterViewChecked`, `ngOnChanges` synchronously and sequentially each cycle; one slow computation slows the whole cycle.
- Mutating an object passed to an OnPush input keeps the same reference, so no check happens.
- Setting an `@Input` from TypeScript on an OnPush component does not trigger CD by itself.
- Event listeners added by code run outside the zone also fire outside the zone; emitting outputs there will not update views unless you re-enter the zone.
- Triggering CD manually from outside the zone can create/update views outside the zone.
- Zone pollution often shows in the profiler as consecutive CD bars sourced from `setTimeout`, `setInterval`, `requestAnimationFrame` or event handlers, frequently from non-Angular third-party components.
- Profiling data only appears in development mode.

## Version notes
- [v22+] `OnPush` is the default change detection strategy.
- [v21+] Zoneless change detection is the default for new applications.
- Deep-linking from Chrome profiles to Angular DevTools relies on an experimental Chrome flag.
