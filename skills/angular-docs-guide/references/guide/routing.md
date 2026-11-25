# Routing

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/routing,
> Define routes — https://angular.dev/guide/routing/define-routes,
> Route Loading Strategies — https://angular.dev/guide/routing/loading-strategies,
> Show routes with Outlets — https://angular.dev/guide/routing/show-routes-with-outlets,
> Navigate to routes — https://angular.dev/guide/routing/navigate-to-routes,
> Read route state — https://angular.dev/guide/routing/read-route-state,
> Redirecting routes — https://angular.dev/guide/routing/redirecting-routes.

## When to use
- Mapping URL paths (static, parameterized, wildcard) to components and registering them with `provideRouter`.
- Splitting route code into lazy chunks with `loadComponent` / `loadChildren`.
- Rendering routed content with `<router-outlet>`, including nested child routes and named (secondary) outlets.
- Navigating declaratively (`routerLink`) or from code (`Router.navigate`, `Router.navigateByUrl`).
- Reading route params, query params, matrix params and route `data` via `ActivatedRoute`, and highlighting the active link.
- Redirecting legacy or default URLs, conditionally or imperatively (`redirectTo`, `RedirectCommand`).
- See also: route-level providers and hierarchical injection → references/guide/di.md
- See also: route resources, resolvers and error boundaries (`errorComponent`) → references/guide/routing-data.md

## Rules
- MUST register routes by adding `provideRouter(routes)` to the application `providers` (CLI projects keep routes in `src/app/app.routes.ts`).
- MUST order routes from most to least specific: matching is first-match-wins, so later candidates are never checked once one matches.
- PREFER placing the `**` wildcard route last in its routes array.
- MUST start route parameter names with a letter; only letters, digits, `_` and `-` are allowed after that.
- MUST give every route a meaningful `title`; page titles are required for an accessible experience.
- MUST add a `<router-outlet>` to a parent component's template for its `children` routes to render.
- MUST give each outlet on a page a unique `name`.
- PREFER eager loading (`component`) for the main landing page(s) and lazy loading (`loadComponent` / `loadChildren`) for everything else.
- PREFER calling `inject()` inside `loadComponent` / `loadChildren` loaders for context-aware loading; they run in the current route's injection context (route, inherited parent and global providers).
- PREFER a `default` export in lazily loaded files so the loader can return `import()` directly without `.then`.
- PREFER relative links over absolute ones; they stay maintainable because they do not depend on their position in the routing hierarchy.
- PREFER the string form of `routerLink` for plain paths; use the array form when segments include dynamic values.
- MUST put every `..` segment inside the first command string when navigating several levels up (`['../../settings']`).
- NEVER start the first command with `/` when passing `relativeTo`; the navigation becomes absolute and `relativeTo` is ignored.
- PREFER `navigateByUrl` when you hold a complete URL string (absolute navigation, external URLs, deep links).
- MUST set `ariaCurrentWhenActive` alongside `routerLinkActive`; the CSS class alone does not set `aria-current`.
- MUST use `pathMatch: 'full'` on a redirect from the empty (root) path; with the default `prefix` every URL gets redirected.
- PREFER adding a redirect for modified or removed routes so stale bookmarks land somewhere useful instead of a not-found page.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `Routes` / `Route` | Array / object of route definitions | From `@angular/router`; `children` takes `Route[]` |
| `provideRouter(routes)` | Adds the router to app providers | Placed in `ApplicationConfig.providers` |
| `path` | URL pattern | Static (`'admin'`), params (`'user/:id'`), empty (`''`), wildcard (`'**'`) |
| `component` | Eagerly loaded component for the route | Bundled with the route config |
| `loadComponent: () => import(...)` | Lazy component loaded when the route activates | Loader returns a Promise of a component; any async function works |
| `loadChildren: () => import(...)` | Lazy child routes loaded during matching | Loader returns a Promise of routes; can be combined with `loadComponent` |
| `title` | Document title on activation | String or a `ResolveFn<string>` |
| `TitleStrategy` | Abstract class/token to centralize title composition | Default is `DefaultTitleStrategy`; override `updateTitle(snapshot)`, use `buildTitle(snapshot)` |
| `providers` (on a route) | DI providers visible only to that route and its children | Siblings outside the subtree cannot inject them |
| `data` | Static metadata (analytics ids, permissions...) | Read via `ActivatedRoute` |
| `errorComponent` | Fallback rendered if the route component throws during init/render | See error boundaries guide |
| `children` | Nested routes | Parent needs its own `<router-outlet>` |
| `outlet` | Targets a named outlet | Must equal the outlet's `name` |
| `redirectTo` | Redirect instead of rendering | String (may reuse `:params`) or `RedirectFunction` |
| `pathMatch` | `'prefix'` (default) or `'full'` | `full` = whole path must match |
| `RedirectCommand` | Thrown from routed component / route resource loader to redirect | `new RedirectCommand(router.parseUrl('/login'))` |
| `RouterOutlet` / `<router-outlet>` | Placeholder for routed content | `name` defaults to `'primary'`; name is bindable |
| outlet outputs | `activate`, `deactivate`, `attach`, `detach` | attach/detach are driven by `RouteReuseStrategy` |
| `routerOutletData` input | Pass contextual data to routed components | Read with `inject(ROUTER_OUTLET_DATA)` as a `Signal`; `undefined` when unset |
| `RouterLink` / `routerLink` | Declarative navigation on `<a>` | String or array; leading `/` = from root |
| `routerLink` `browserUrl` input | Address-bar URL differs from the matched route | String or `UrlTree` |
| `routerLink` `scroll` input | Per-link scroll behavior | `'after-transition'` (default) or `'manual'` |
| `Router.navigate(commands, extras?)` | Programmatic navigation from a commands array | Extras: `queryParams`, `queryParamsHandling`, `relativeTo`; object in array = matrix params |
| `Router.navigateByUrl(url, extras?)` | Navigate with a full URL string | Extras: `replaceUrl`, `browserUrl`, `scroll` |
| `Router.createUrlTree(commands)` / `parseUrl(url)` | Build a `UrlTree` | Used for `browserUrl` / `RedirectCommand` |
| `withInMemoryScrolling({scrollPositionRestoration})` | Router scroll restoration | `'enabled'` or `'top'` scrolls to top after link clicks |
| `ActivatedRoute` | Info about the current route | Observables: `url`, `data`, `params`, `queryParams`; `resources` (needs `withRouterResources()`) |
| `ActivatedRoute.snapshot` | Static point-in-time state | `paramMap.get()`, `params`, `queryParams`, `url`; does not update |
| `queryParamsHandling: 'merge'` | Keep existing query params while setting new ones | See `QueryParamsHandling` |
| `withComponentInputBinding` | Binds params (incl. matrix) to component inputs | Alternative to `ActivatedRoute` |
| `RouterLinkActive` / `routerLinkActive` | Adds classes when a link is active | Space-separated string or array; works on an ancestor element |
| `routerLinkActiveOptions` | Matching options | `{exact: true}` or full `IsActiveMatchOptions` |
| `ariaCurrentWhenActive` | Sets `aria-current` on the active link | e.g. `"page"` |
| `isActive(url, router, options)` | Computed signal: is the URL active | Updates automatically with router state |

## Patterns

### Route config and bootstrap
```ts
import {Routes, provideRouter, ResolveFn} from '@angular/router';

const tabTitle: ResolveFn<string> = (route) => route.queryParams['id'];

export const routes: Routes = [
  {path: '', component: Home, title: 'Home'},
  {path: 'items/new', component: NewItem},            // specific first
  {path: 'items/:id', component: ItemDetail, title: tabTitle},
  {path: 'items', component: ItemList},
  {path: 'old-items', redirectTo: '/items'},
  {path: 'about', component: About, data: {analyticsId: 'a1'}},
  {
    path: 'admin',
    providers: [AdminApi, {provide: ADMIN_KEY, useValue: 'k'}], // scoped to admin subtree
    children: [{path: 'users', component: AdminUsers}],
  },
  {path: 'item/:id', component: ItemPage, errorComponent: ItemError},
  {path: '**', component: NotFound},                   // always last
];

export const appConfig: ApplicationConfig = {providers: [provideRouter(routes)]};
```

### Custom title strategy
```ts
@Injectable()
export class SuffixTitles extends TitleStrategy {
  private title = inject(Title);
  private fallback = this.title.getTitle(); // capture once, before it gets prefixed
  updateTitle(snapshot: RouterStateSnapshot) {
    this.title.setTitle(`Shop - ${this.buildTitle(snapshot) || this.fallback}`);
  }
}
// providers: [provideRouter(routes), {provide: TitleStrategy, useClass: SuffixTitles}]
```

### Lazy loading (incl. injection context)
```ts
export const routes: Routes = [
  {path: 'login', loadComponent: () => import('./login/login-page')}, // default export
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-shell'),
    loadChildren: () => import('./admin/admin.routes'),
  },
  {
    path: 'dash',
    loadComponent: () =>
      inject(Plan).isPro ? import('./dash/pro-dash') : import('./dash/free-dash'),
  },
];
```

### Outlets: nested, named, data
```angular-html
<!-- Settings component -->
<nav><a routerLink="profile">Profile</a> <a routerLink="security">Security</a></nav>
<router-outlet [routerOutletData]="{layout: 'sidebar'}" (activate)="onActivate($event)" />
<router-outlet name="aside" />
```
```ts
// route: {path: 'tips/:id', component: Tips, outlet: 'aside'}
export class Profile {
  outletData = inject(ROUTER_OUTLET_DATA) as Signal<{layout: string}>;
}
```

### Links
```angular-html
<a routerLink="notifications">Relative</a>
<a [routerLink]="['/team', teamId, 'user', userId]">Dynamic</a>
<a [routerLink]="['/dashboard']" [browserUrl]="'/home'">Shows /home</a>
<a routerLink="/products/42" [queryParams]="{tab: 'reviews'}" scroll="manual">Reviews</a>
<a routerLink="/about" routerLinkActive="is-active" ariaCurrentWhenActive="page"
   [routerLinkActiveOptions]="{exact: true}">About</a>
```

### Programmatic navigation
```ts
private router = inject(Router);
private route = inject(ActivatedRoute);

go() {
  this.router.navigate(['/users', id]);
  this.router.navigate(['/search'], {queryParams: {q: 'books'}});
  this.router.navigate(['/products', {featured: true}]);           // matrix params
  this.router.navigate(['edit'], {relativeTo: this.route});        // child of current
  this.router.navigate(['../../settings'], {relativeTo: this.route}); // all '..' in first item
  this.router.navigate([], {queryParams: {sort}, queryParamsHandling: 'merge'});
  this.router.navigateByUrl('/checkout', {replaceUrl: true});
  this.router.navigateByUrl('/not-found', {browserUrl: '/products/missing'});
  this.router.navigateByUrl('/products/42?tab=reviews', {scroll: 'manual'});
}
```

### Reading route state
```ts
export class ItemDetail {
  private route = inject(ActivatedRoute);
  id = this.route.snapshot.paramMap.get('id'); // one-time read
  sort = signal('price');
  constructor() {
    this.route.params.subscribe((p) => console.log(p['id'], p['view'])); // route + matrix params
    this.route.queryParams.subscribe((q) => this.sort.set(q['sort'] || 'price'));
  }
  isSettings = isActive('/settings', inject(Router), {
    paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored',
  });
}
```

### Redirects
```ts
export const routes: Routes = [
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
  {path: 'legacy-user/:id', redirectTo: 'users/:id'},
  {path: 'news', redirectTo: 'blog'}, // prefix: /news/a -> /blog/a
  {
    path: 'shop/:city/menu',
    pathMatch: 'full',
    redirectTo: (snap) => `/shop/${snap.params['city']}/menu/${snap.queryParams['meal'] ?? 'lunch'}`,
  },
];

// From a routed component or route resource loader:
data = resource({
  loader: async () => {
    const res = await fetch('/api/me');
    if (res.status === 401) throw new RedirectCommand(this.router.parseUrl('/login'));
    return res.json();
  },
});
```

## Pitfalls
- Route parameters (`:id`) are not query-string parameters; they are separate concepts read through different properties.
- A less specific route placed earlier shadows later ones: `/users/new` never reaches `users/:id` if `users/new` comes first, and vice versa.
- Redirects default to `pathMatch: 'prefix'`, so `{path: 'news', redirectTo: 'blog'}` also rewrites `/news/...` sub-paths; use `'full'` to redirect only the exact path.
- An empty-path redirect without `pathMatch: 'full'` redirects every URL.
- A `RedirectFunction` sees only part of `ActivatedRouteSnapshot`: values not yet known at matching time (resolved titles, lazy components) are unavailable. It may return a string, `UrlTree`, Observable or Promise.
- `RedirectCommand` is intercepted only when thrown in a routed component constructor, lifecycle hook, or route resource loader.
- In a custom `TitleStrategy`, read the original `index.html` title once (e.g. in a field initializer); after the first update `getTitle()` returns the already-prefixed title.
- `<router-outlet>` stays in the DOM; routed components are inserted after it as siblings, not inside it.
- Changing a bound outlet `name` destroys the current component and renders whatever route matches the new name (if any).
- `routerOutletData` that is not set yields an injected signal whose value is `undefined`.
- With `relativeTo`, only the first command is parsed for `..`; later array items like `'..'` are literal segments.
- `browserUrl` changes only the address bar; matching and rendering use the real target route.
- With `withInMemoryScrolling` set to `'enabled'` or `'top'`, clicking a link scrolls to top even if only a query param changed; opt out per link/navigation with `scroll: 'manual'`.
- Snapshots are static: `route.snapshot` does not reflect later navigations; subscribe to the observables for changes.
- By default `routerLinkActive` treats ancestor routes as matches (`/user/jane` is active on `/user/jane/role/admin`); use `{exact: true}`.
- `exact: true` equals `{paths: 'exact', queryParams: 'exact', fragment: 'ignored', matrixParams: 'ignored'}`; `exact: false` equals `paths`/`queryParams` `'subset'` with fragment and matrix params ignored.
- Lazy routes trim the initial bundle but add later requests; several levels of nested lazy loading can noticeably hurt performance.
- Eager routes enlarge the initial download/parse but make subsequent navigations smoother.

## Version notes
- None stated in the docs.
