# Advanced Routing

> Sources (angular.dev, v22.3 @ bd1e32b): Testing routing and navigation — https://angular.dev/guide/routing/testing,
> Other routing tasks — https://angular.dev/guide/routing/common-router-tasks,
> Creating custom route matches — https://angular.dev/guide/routing/routing-with-urlmatcher,
> Rendering strategies — https://angular.dev/guide/routing/rendering-strategies,
> Customizing route behavior — https://angular.dev/guide/routing/customizing-route-behavior,
> Router reference — https://angular.dev/guide/routing/router-reference,
> Route transition animations — https://angular.dev/guide/routing/route-transition-animations.

## When to use
- Testing routed components, guards, outlets, nested routes and query params with `RouterTestingHarness`.
- Binding path/query/matrix params, route data and route resources straight into component `input()`s.
- Adding a 404 page, building link parameter arrays, or switching to hash-style URLs / configuring `<base href>`.
- Matching URLs that plain `path` patterns cannot express (handles like `/@name`, versions, locales, product IDs) with a `UrlMatcher`.
- Tuning router behavior: canceled navigations, same-URL reloads, param inheritance, URL update timing, query param defaults, trailing slashes.
- Keeping component state alive across navigations (`RouteReuseStrategy`), preloading lazy routes, sharing the URL space with a legacy app, and animating route changes with view transitions.
- Picking CSR, SSG or SSR per route.
- See also: Vitest/TestBed basics → references/guide/testing.md
- See also: wildcard routes, matrix params, lazy loading and route definitions → references/guide/routing.md
- See also: guards, resolvers and route resources (incl. resource inheritance and reload) → references/guide/routing-data.md
- See also: SSR, prerendering, hydration and incremental hydration → references/guide/ssr.md
- See also: providers and injection context → references/guide/di.md
- See also: component style scoping (view encapsulation) → references/guide/components.md

## Rules
### Testing
- PREFER `RouterTestingHarness` for routed components: no test host component needed, direct access to the routed instance, built-in navigation, better typing.
- PREFER a custom host component instead of the harness when a scenario (such as named outlets) does not fit it.
- NEVER mock the Angular `Router`; supply real route configs via `provideRouter` and navigate with the harness. Mocks can hide breaking router changes.
- PREFER real dependencies; fall back to fakes that mimic real behavior; use mocks/stubs only as a last resort.
- MUST `await` navigations: routing is asynchronous.
- PREFER asserting both the navigation and resulting state (URL, rendered component).
- PREFER covering failure paths too: unknown routes, failed navigations, guard rejections.
- PREFER mocking a guard's dependencies and asserting where navigation ends up when testing guards.
- PREFER testing both initial values and reactive updates for query params, since they can change without a route change.

### Component input binding
- MUST enable `withComponentInputBinding()` (or `bindToComponentInputs` with `RouterModule.forRoot`) before route values can feed `input()`s.
- MUST name the `input()` the same as the route parameter / data key.
- PREFER including `undefined` in an input's type when the route may not supply it (e.g. an optional query param).
- PREFER an input `transform` or a `linkedSignal` to apply a default value.

### Navigation, URLs and `<base href>`
- MUST place the `**` wildcard (404) route last; it catches any URL not matched earlier.
- MUST add `<base href>` to `index.html` (right after `<head>`) for `pushState` routing; without it, deep links may fail to load CSS, images and scripts.
- PREFER the `<base href>` element as the way to configure path-style routing.
- If you cannot edit `<head>`/`index.html`: provide `APP_BASE_HREF` and reference all web resources (CSS, images, scripts, template HTML) by root URLs that include an authority.
- MUST end the `<base href>` path with `/`; browsers drop anything after the right-most `/`.

### Custom strategies (reuse, preloading, URL handling, matchers)
- PREFER the default router behavior; only customize after confirming defaults fall short. Custom strategies add complexity and can raise memory use.
- MUST destroy a `DetachedRouteHandle` you drop without reattaching (cache limit, expiry) using `destroyDetachedRouteHandle`, or it leaks.
- AVOID keying stored handles by route path when `canMatch` guards are involved; duplicates can result.
- MUST implement `shouldDestroyInjector` when using `withAutoCleanupInjectors()` with a custom strategy that does not extend `BaseRouteReuseStrategy`.
- MUST implement `retrieveStoredRouteHandles()` if such a strategy stores handles, so the router keeps the injectors those handles need.
- PREFER opting routes into reuse/preload through route `data` flags so the logic stays outside components.
- PREFER `PreloadAllModules` for small/medium apps; large apps may want a selective strategy.
- MUST keep matchers cheap: they run on every navigation attempt until a match. Return early, skip API calls and heavy regexes, cache repeated patterns.
- PREFER standard `path` matching; reserve custom matchers for cases where it genuinely cannot work.

### View transitions
- MUST put view-transition CSS (`::view-transition-old/new`, keyframes) in global styles; component styles are encapsulated and cannot reach the pseudo-elements.
- PREFER handling `prefers-reduced-motion` yourself (subtler animation or `skipTransition()`); the router does not check it.

### Rendering strategies
- PREFER CSR (default) for dashboards, admin panels, real-time apps, internal tools without SEO needs, SPAs with heavy client state.
- PREFER SSG for marketing/landing pages, blogs, docs, stable product catalogs, content identical for every user.
- PREFER SSR for e-commerce product pages, news/social feeds, frequently changing personalized content.
- AVOID CSR for public SEO content or load-critical pages; AVOID SSG for user-specific, frequently changing or real-time data; AVOID SSR for static content (use SSG) or when server cost matters.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `RouterTestingHarness.create()` | Creates a harness for routed-component tests | From `@angular/router/testing`; async |
| `harness.navigateByUrl(url, Cmp?)` | Navigates by URL string | Resolves to the routed component instance when its type is passed |
| `harness.navigate(commands, extras, Cmp?)` | Navigate with commands + `NavigationExtras` (`queryParams`, `fragment`) | Returns component instance |
| `harness.routeNativeElement` | DOM of the activated route | Nullable; use `?.` |
| `withComponentInputBinding(opts?)` | Bind route values to component inputs | Options type `ComponentInputBindingOptions` |
| `queryParams: false` | Stop binding query params to inputs | Option of `withComponentInputBinding` |
| `unmatchedInputBehavior: 'undefinedIfStale'` | Don't reset inputs never supplied for this instance | Default resets unmatched inputs to `undefined` |
| `bindToComponentInputs` | Same as above for `RouterModule.forRoot` | NgModule apps |
| `withRouterConfig({...})` / `RouterModule.forRoot(routes, {...})` | Pass `RouterConfigOptions` | See options table below |
| `withHashLocation()` | Use `HashLocationStrategy` | NgModule: `RouterModule.forRoot(routes, {useHash: true})` |
| `PathLocationStrategy` | HTML5 pushState URLs | Default |
| `HashLocationStrategy` | `#/path` URLs | Opt-in |
| `TrailingSlashPathLocationStrategy` | Always write a trailing slash | From `@angular/common`; provide as `LocationStrategy` |
| `NoTrailingSlashPathLocationStrategy` | Never write a trailing slash | From `@angular/common`; provide as `LocationStrategy` |
| `APP_BASE_HREF` | Base href when `<base>` can't be added | Authority in value makes Angular links ignore `<base href>` |
| `matcher: UrlMatcher` | Custom route matching function | `(segments, group, route) => UrlMatchResult \| null` |
| `UrlMatchResult` | `{consumed: UrlSegment[], posParams: {name: UrlSegment}}` | `posParams` become route params |
| `RouteReuseStrategy` | Detach/store/reattach component trees | Provide with `{provide: RouteReuseStrategy, useClass}` |
| `BaseRouteReuseStrategy` | Base class for reuse strategies | Extending it gets injector cleanup for free |
| `DetachedRouteHandle` | Opaque stored component + view tree | Cannot be destroyed directly |
| `destroyDetachedRouteHandle(handle)` | Destroy a discarded handle | From `@angular/router` |
| `withAutoCleanupInjectors()` | Destroy injectors of detached routes no longer stored | Off by default |
| `withPreloading(strategy)` | Set the preloading strategy | |
| `NoPreloading` | No preloading | Default |
| `PreloadAllModules` | Preload every lazy route after first navigation | |
| `PreloadingStrategy` | Interface: `preload(route, load): Observable<any>` | Return `load()` to preload, `of(null)` to skip |
| `UrlHandlingStrategy` | Choose which URLs Angular handles | Methods `shouldProcessUrl`, `extract`, `merge` |
| `withViewTransitions(opts?)` | Run route changes inside `document.startViewTransition` | NgModule: `{enableViewTransitions: true}` |
| `onViewTransitionCreated` | Callback with `ViewTransitionInfo` (`transition`, from/to `ActivatedRouteSnapshot`) | Runs in an injection context |
| `transition.skipTransition()` | Skip the animation, navigation still completes | |
| `isActive(url, router, options)` | Checks whether a URL is the active one | Result is invoked as a function; options are `Partial<IsActiveMatchOptions>` |
| `router.currentNavigation()` | Current navigation (e.g. `finalUrl`) | |
| `withDebugTracing()` | Log router events to the console | |

### `RouteReuseStrategy` methods
| Method | Role |
| --- | --- |
| `shouldDetach(route)` | Keep this route for later when leaving it? |
| `store(route, handle)` | Save the handle (called when `shouldDetach` is true) |
| `shouldAttach(route)` | Reattach a stored route on arrival? |
| `retrieve(route)` | Return the stored handle or `null` |
| `shouldReuseRoute(future, curr)` | Reuse current instance instead of destroying it |
| `shouldDestroyInjector(route)` | Destroy the injector of a detached route no longer stored |
| `retrieveStoredRouteHandles()` | Report stored handles so their injectors survive cleanup |

### `RouterConfigOptions`
| Option | Default | Alternatives / effect |
| --- | --- | --- |
| `canceledNavigationResolution` | `'replace'` (rolls back via `location.replaceState`, overwriting the history entry) | `'computed'`: keeps history index in sync; canceling a Back nav triggers a forward nav and vice versa. Useful with `urlUpdateStrategy: 'eager'` or guards that often cancel popstate navigations |
| `onSameUrlNavigation` | `'ignore'` | `'reload'`: run same-URL navigations through the pipeline. Also per call: `router.navigate([...], {onSameUrlNavigation: 'reload'})`. Guard/resolver reruns follow `runGuardsAndResolvers`; component reuse follows the reuse strategy |
| `paramsInheritanceStrategy` | `'always'` (children inherit params, data, resolved values, matrix params) | `'emptyOnly'` (legacy): inherit only if child path is empty or parent has no component |
| `urlUpdateStrategy` | `'deferred'` (update URL after success) | `'eager'`: update at navigation start; exposes attempted URL on failure but may briefly show an in-progress URL |
| `defaultQueryParamsHandling` | `'replace'` | `'merge'` combines with current; `'preserve'` keeps current and ignores passed `queryParams`. Applies to `Router.createUrlTree` calls without `queryParamsHandling` |

### Input binding priority (highest first)
1. Route `resources` (blocking: unwrapped `resource.value()`; non-blocking: the `Resource` instance).
2. Static `data` and `resolve` results.
3. Path params and matrix params.
4. Query params.

### Router events (`Router.events`, in order)
| Event | Fires when |
| --- | --- |
| `NavigationStart` | Navigation begins |
| `RouteConfigLoadStart` / `RouteConfigLoadEnd` | Before / after lazy-loading a route config |
| `RoutesRecognized` | URL parsed and routes recognized |
| `GuardsCheckStart` | Guard phase begins |
| `ChildActivationStart` / `ActivationStart` | Activation of a route's children / a route begins |
| `GuardsCheckEnd` | Guard phase finished successfully |
| `ResolveStart` / `ResolveEnd` | Resolve phase begins / finishes successfully |
| `ActivationEnd` / `ChildActivationEnd` | Route / children activation finished |
| `NavigationEnd` | Navigation succeeded |
| `NavigationCancel` | Navigation canceled (guard returned `false`, or redirected with `UrlTree` / `RedirectCommand`) |
| `NavigationError` | Unexpected error |
| `Scroll` | Scrolling event |

### Router terminology
| Term | Meaning |
| --- | --- |
| `Router` | Shows the component for the active URL; manages navigation |
| `provideRouter` / `RouterModule` | Providers (and, for the NgModule, directives) for routing |
| `Routes` / `Route` | Route array / one route (path, component, children, guards, resolvers, resources) |
| `RouterOutlet` | `<router-outlet>`: where routed views render |
| `RouterLink` | Navigates on click; bound to a string or link parameters array |
| `RouterLinkActive` | Toggles classes when its link is active; can set `aria-current` |
| `ActivatedRoute` | Per-route service: params, static/resolved data, resources, global query params and fragment |
| `RouterState` | Tree of activated routes plus traversal helpers |
| Link parameters array | Routing instruction for `RouterLink` or `Router.navigate` |
| Routing component | Component containing a `RouterOutlet` |

### Rendering strategies
| Strategy | SEO | Initial load | Interactive | Server |
| --- | --- | --- | --- | --- |
| CSR (default) | Poor until JS runs | Slower | Immediately once loaded | Minimal; simplest setup |
| SSG / prerender | Excellent | Fastest | After hydration | None to serve (CDN); longer builds; content change needs rebuild + redeploy |
| SSR | Excellent | Fast | After hydration | Required; higher cost (renders initial request per route); full user context |
| Hybrid | Mix | | | Different strategy per route |

After SSR/SSG hydration, the app behaves as an SPA: later navigations and API calls stay client-side. Hydration modes: full (default), incremental (via `@defer`), event replay (captures clicks before hydration).

## Patterns
### Test a routed component with params
```ts
TestBed.configureTestingModule({
  providers: [provideRouter([{path: 'user/:id', component: UserProfile}])],
});
const harness = await RouterTestingHarness.create();
await harness.navigateByUrl('/user/7', UserProfile);
expect(harness.routeNativeElement?.textContent).toContain('7');
```

### Test a guard by its outcome
```ts
TestBed.configureTestingModule({
  providers: [
    {provide: AuthStore, useValue: {isAuthenticated: vi.fn().mockReturnValue(false)}},
    provideRouter([
      {path: 'secret', component: Secret, canActivate: [authGuard]},
      {path: 'login', component: Login},
    ]),
  ],
});
const harness = await RouterTestingHarness.create();
await harness.navigateByUrl('/secret', Login); // expect redirect to Login
```

### Test query params and fragment
```ts
const cmp = await harness.navigate(['/search'], {queryParams: {q: 'ng'}, fragment: 'top'}, Search);
expect(cmp.term()).toBe('ng');
expect(TestBed.inject(Router).url).toBe('/search?q=ng#top');
```
Outlet and nested-route tests: import the host (`App`/`Parent`), navigate, then assert `routeNativeElement` contains both parent and child content.

### Route values as inputs
```ts
provideRouter(routes, withComponentInputBinding({queryParams: false, unmatchedInputBehavior: 'undefinedIfStale'}));

export class ItemEditor {
  id = input.required({transform: (v: string | undefined) => v ?? '0'});
  // or
  page = input<string | undefined>();
  currentPage = linkedSignal(() => this.page() ?? '1');
}
```
With `queryParams: false` + `'undefinedIfStale'`, inputs keep their initial values unless the router supplies them; matrix params removed in a later navigation still reset to `undefined`.

### 404 route and link arrays
```ts
const routes: Routes = [
  {path: 'home', component: Home},
  {path: '**', component: NotFound},
];
```
```angular-html
<a [routerLink]="['/team', member.id]">{{ member.name }}</a>
<a [routerLink]="['/crisis-center', {foo: 'foo'}]">Crises</a> <!-- matrix params -->
<a [routerLink]="['/crisis-center', 1]">Crisis 1</a> <!-- /crisis-center/1 -->
```

### Base href and hash URLs
```html
<base href="/" />
```
```ts
provideRouter(routes, withHashLocation());
providers: [{provide: LocationStrategy, useClass: TrailingSlashPathLocationStrategy}];
```

### Custom `UrlMatcher`
```ts
export const routes: Routes = [
  {
    matcher: (url) =>
      url.length === 1 && /^@\w+$/.test(url[0].path)
        ? {consumed: url, posParams: {handle: new UrlSegment(url[0].path.slice(1), {})}}
        : null,
    component: Profile, // handle = input.required<string>() with withComponentInputBinding
  },
];

export function versionMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length >= 2 && /^v\d+(\.\d+)*$/.test(segments[0].path)) {
    return {consumed: segments.slice(0, 2), posParams: {version: segments[0], section: segments[1]}};
  }
  return null;
}
```
A matcher may consume nothing (`consumed: []`) and still emit params, e.g. a default locale.

### Route reuse strategy
```ts
@Injectable()
export class KeepAliveStrategy implements RouteReuseStrategy {
  private cache = new Map<Route | null, DetachedRouteHandle>();
  shouldDetach(r: ActivatedRouteSnapshot) { return r.data['reuse'] === true; }
  store(r: ActivatedRouteSnapshot, h: DetachedRouteHandle | null) {
    if (h && r.data['reuse'] === true) this.cache.set(r.routeConfig, h);
  }
  shouldAttach(r: ActivatedRouteSnapshot) { return r.data['reuse'] === true && this.cache.has(r.routeConfig); }
  retrieve(r: ActivatedRouteSnapshot) { return r.data['reuse'] === true ? (this.cache.get(r.routeConfig) ?? null) : null; }
  shouldReuseRoute(f: ActivatedRouteSnapshot, c: ActivatedRouteSnapshot) { return f.routeConfig === c.routeConfig; }
  evict(key: Route) {
    const h = this.cache.get(key);
    if (h) { destroyDetachedRouteHandle(h); this.cache.delete(key); }
  }
}
// routes: {path: 'products', component: ProductList, data: {reuse: true}}
providers: [provideRouter(routes), {provide: RouteReuseStrategy, useClass: KeepAliveStrategy}];
```

### Selective preloading
```ts
@Injectable()
export class OptInPreload implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>) {
    return route.data?.['preload'] ? load() : of(null);
  }
}
// {path: 'dashboard', loadChildren: () => import('./dashboard/routes'), data: {preload: true}}
provideRouter(routes, withPreloading(OptInPreload));
```

### URL handling strategy
```ts
@Injectable()
export class PartialUrlHandling implements UrlHandlingStrategy {
  shouldProcessUrl(url: UrlTree) { return url.toString().startsWith('/app'); }
  extract(url: UrlTree) { return url; }
  merge(part: UrlTree, raw: UrlTree) { return part; }
}
providers: [provideRouter(routes), {provide: UrlHandlingStrategy, useClass: PartialUrlHandling}];
```

### View transitions
```ts
provideRouter(routes, withViewTransitions({
  onViewTransitionCreated: ({transition}) => {
    const router = inject(Router);
    const target = router.currentNavigation()!.finalUrl!;
    const sameView = isActive(target, router, {paths: 'exact', matrixParams: 'exact', fragment: 'ignored', queryParams: 'ignored'});
    if (sameView() || matchMedia('(prefers-reduced-motion: reduce)').matches) transition.skipTransition();
  },
}));
```
```css
/* global styles.css */
::view-transition-old(count), ::view-transition-new(count) { animation-duration: 200ms; }
::view-transition-old(count) { animation-name: -ua-view-transition-fade-out, rotate-out; }
```
Give animated elements a `view-transition-name`; different DOM elements sharing a name transition into each other.

## Pitfalls
- `RouterTestingHarness` is a poor fit for named-outlet tests; use a custom host component.
- Without `withComponentInputBinding`, route values never reach inputs. With it, the router sets every input from the current route and assigns `undefined` when no key matches (to avoid stale data).
- Key collisions across sources follow the priority list: a path `:id` beats `?id=`, and a resource named `id` beats both.
- With `paramsInheritanceStrategy: 'emptyOnly'`, a deeply nested child must read ancestor params through `route.parent?.parent?...`.
- `onSameUrlNavigation: 'reload'` alone does not rerun guards/resolvers or recreate components; those depend on `runGuardsAndResolvers` and the reuse strategy. Route resources can refresh via `.reload()` or param signals without any navigation.
- `urlUpdateStrategy: 'eager'` with long-running guards can briefly show a URL that never completes.
- Trailing-slash strategies only change written URLs; `Location.path()` and `Location.normalize()` still strip trailing slashes on read (the default `Location` behavior).
- `<base href>` details: a `query` in it is only used when a link's path is empty with no query (so only with `HashLocationStrategy`); root URLs with an authority ignore it; its fragment is never kept.
- Inherited route resources break if a custom `RouteReuseStrategy` detaches a route without also detaching the ancestors that own those resources.
- By default Angular never destroys injectors of detached routes, even ones no longer stored; opt in with `withAutoCleanupInjectors()`. With no custom strategy, or one extending `BaseRouteReuseStrategy`, injectors are then destroyed when the route is inactive.
- Detached routes keep components, children and state in memory; unbounded caches leak.
- Preloading costs bandwidth and memory (notably on metered mobile), can compete with images/API calls right after load, and can queue behind the browser's concurrent-connection limit; service workers can help control caching.
- A custom matcher runs before the route's `path` is evaluated; returning `null` lets the router try the next route. Matcher routes still support children and lazy loading.
- The router never delays a view transition to wait for content; there is no API for it.
- View transitions are a progressive enhancement: unsupported browsers just update the DOM without animation.
- The router starts view transitions even when the user prefers reduced motion.
- SSR/SSG pages are not interactive until hydration finishes.

## Version notes
- [deprecated] Switching view transition styles through a class name on the view transition root. The other documented technique for per-navigation styles is view transition types.
- `paramsInheritanceStrategy: 'emptyOnly'` is described as the legacy behavior; `'always'` is the default.
