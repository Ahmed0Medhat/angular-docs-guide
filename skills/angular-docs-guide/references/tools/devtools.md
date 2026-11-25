# Angular DevTools: components, profiler, injectors, signal graph, router tree

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/tools/devtools,
> Components — https://angular.dev/tools/devtools/component,
> Profiler — https://angular.dev/tools/devtools/profiler,
> Injectors — https://angular.dev/tools/devtools/injectors,
> Signals — https://angular.dev/tools/devtools/signals,
> Router Tree — https://angular.dev/tools/devtools/router.

## When to use
- Inspecting the component/directive tree of a running app and editing component state live.
- Finding which components make a change detection cycle slow, or checking whether `OnPush` components were skipped.
- Visualizing environment and element injector hierarchies and the path DI walks to resolve a token.
- Debugging how signals, computeds, effects and resources in a component depend on each other.
- Exploring the configured route tree, its guards/resolvers, and navigating to a route from DevTools.
- Checking hydration status or `@defer` block configuration in a running app.
- See also: Chrome Performance panel integration → references/best-practices/performance.md
- See also: `@defer` blocks → references/guide/templates.md
- See also: hydration → references/guide/ssr.md
- See also: injector hierarchy and resolution rules → references/guide/di-hierarchy.md

## Rules
- MUST run a development build (optimizations disabled) for DevTools to connect; `ng serve` already does this.
- MUST set `"optimization": false` in the build configuration if you need to debug a deployed app with DevTools.
- MUST open DevTools on a normal page, not Chrome's new tab page, where extensions do not run and the Angular tab is missing.
- MUST build with Angular 17 or later to use the Injector Tree tab.
- MUST build with Angular 19 or later, in development mode, to use the signal graph.
- PREFER giving signals, computeds and especially effects a `debugName` option, since graph nodes are labeled with it and effects usually have no class member name.
- PREFER the **Change detection** checkbox in the Profiler flame graph when debugging `OnPush` components, to see only what actually went through change detection.
- PREFER a Chromium-based browser when you need signal breakpoints; they are not available elsewhere.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| Angular DevTools extension | Debugging and profiling browser extension | Chrome Web Store or Firefox Add-ons; appears as the "Angular" tab in browser DevTools |
| Open browser DevTools | `F12` or `Ctrl+Shift+I` (Windows/Linux); `Fn+F12` or `Cmd+Option+I` (Mac) | Then pick the "Angular" tab |
| **Components** tab | Explore components/directives, preview or edit state | Also hosts the signal graph |
| **Profiler** tab | Record and visualize change detection execution | Record, or import a saved JSON profile |
| **Injector Tree** tab | Visualize environment and element injector hierarchy | Angular 17+ |
| **Router Tree** tab | Visualize the app's routing tree | |
| **Transfer State** tab | Shown only when the app uses hydration | |
| Information button (top-right) | Popover with running Angular version and DevTools version, among other info | |
| Component search box | Find a component/directive by name | Above the component tree |
| Double-click a tree node | Jump to its host DOM element | Elements tab (Chrome) / Inspector tab (Firefox) |
| `<>` icon in properties view | Open component source | Sources tab (Chrome) / Debugger tab (Firefox); components only |
| Right-click property value | Edit an input, output or other property | Only for editable value types; `Enter` applies |
| `$ng0`, `$ng1`, `$ng2`, … | Console references to selected instances | `$ng0` = current selection, `$ng1` = previous, and so on |
| **Inspect element** icon (top-left) | Hover the page to select the matching component/directive in the tree | |
| `@defer` node in tree | Shows sub-blocks (`@loading`, `@placeholder`, `@error`), defer/prefetch/hydrate triggers, `minimum`/`after` timings | |
| Hydration status | Per-component hydration status and error messages | Requires hydration on SSR/SSG; optional on-page overlay |
| Profiler **Start recording** / **Stop recording** | Hover/click the circle top-left of the Profiler tab | Interact with the app while recording |
| Profiler **Save Profile** | Export the session to a JSON file | Top-right of a recorded session |
| Profiler **Choose file** | Import a saved JSON profile | Initial Profiler view |
| Profiler **Bar chart** / **Flame graph** | Per-cycle views of directive/component time | Double-click a flame tile to zoom in |
| Profiler **Change detection** checkbox | Show only components that ran change detection | Others shown gray |
| Injector provider list | Shows each provider's token and type; button logs the provider to console | Appears when the selected injector has providers |
| **Show Signal Graph** | Open signal graph for selected component/directive | Property pane header; appears automatically when supported, no setting |
| Per-property signal graph button / **Show in signal graph** | Jump to a specific signal in the graph | Menu item when the property has several actions |
| Graph search icon | Find nodes by name, step through matches | Graph toolbar |
| Node **View source** | Go to the node's definition | Disabled if source location is unknown |
| Node **Set breakpoint** | Pause when the signal updates | Chromium-based browsers only |
| Node **Watch signal** | Log updates and invalidations to console | Click again to stop |
| Node **Highlight upstream / downstream** | Trace dependency or dependant paths | |
| Route **Navigate** icon | Make the app's router navigate to that route's URL | Next to the path in route details |

### Signal graph node types
| Node | Created by |
| --- | --- |
| Signal | `signal()` |
| Computed | `computed()` |
| Effect | `effect()` or `afterRenderEffect()` |
| Linked signal | `linkedSignal()` |
| Template | The component's template reading signals at render |
| Resource | `resource()` / `rxResource()` signals, grouped into a collapsible cluster (click **Expand**) |

Edges link each node to producers it reads (upstream) and dependants that read it (downstream).

### Router Tree route details
| Field | Shown |
| --- | --- |
| Path | Always; replaced by **Matcher** for a custom URL matcher |
| Component | Always; replaced by **Redirect to** for redirects |
| Path Match (`prefix` / `full`) | Only if configured |
| Data (JSON tree) | Only if configured |
| Resolvers (key-value) | Only if configured |
| Guards, grouped as `canActivate`, `canActivateChild`, `canDeactivate`, `canMatch` | Only if configured |
| Providers (route-level) | Only if configured |
| Title | Only if configured |
| RunGuardsAndResolvers | Only if configured |
| Active / Auxiliary (named outlet) / Lazy | Flags |

## Patterns

Label reactive nodes so the signal graph is readable:

```ts
import {Component, computed, effect, signal} from '@angular/core';

@Component({selector: 'app-cart', template: `{{ total() }}`})
export class Cart {
  readonly items = signal<number[]>([], {debugName: 'cartItems'});
  readonly total = computed(() => this.items().reduce((a, b) => a + b, 0), {debugName: 'cartTotal'});

  constructor() {
    effect(() => console.log(this.total()), {debugName: 'logTotal'});
  }
}
```

Disable optimizations to debug a deployed build (in the build configuration of `angular.json`):

```json
{
  "optimization": false
}
```

Grab selected instances from the browser console:

```ts
$ng0; // currently selected component/directive instance
$ng1; // the one selected before it
```

## Pitfalls
- "Angular application not detected": DevTools cannot talk to an Angular app on the page; usually the page has no Angular app. Confirm the right page and that the app is running.
- "We detected an application built with production configuration...": production builds strip the debug hooks DevTools relies on; rebuild with optimizations off.
- The Angular tab does not appear on Chrome's new tab page.
- Property editing only works where an edit control exists for that value type.
- Navigate-to-source is offered for components only.
- Profiler bar height = time spent in change detection for that cycle; an estimated frame rate is shown only when below 60fps.
- Flame graph tiles represent a position in the render tree, so components swapped at the same spot (e.g. logged-out vs logged-in user) share one tile. Color intensity is relative to the slowest tile in the cycle.
- Without the **Change detection** checkbox, the flame graph shows render time for everything, including `OnPush` components that did not re-render.
- For element injectors, the highlighted resolution path also includes environment injectors DI jumps to when the element hierarchy cannot resolve a dependency.
- A component with no signals shows "No signals in this component" instead of a graph.
- Signal breakpoints are unavailable outside Chromium-based browsers; **View source** is disabled without a source location.
- Optional route details (Path Match, Data, Resolvers, Guards, Providers, Title, RunGuardsAndResolvers) are hidden unless configured on that route.

## Version notes
- Injector Tree requires apps built with Angular 17 or higher.
- Signal graph requires Angular 19 or later in development mode.
- No developer preview / experimental / deprecated labels stated in the docs.
