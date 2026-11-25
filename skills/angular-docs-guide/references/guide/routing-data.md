# Routing data, guards, errors and events

> Sources (angular.dev, v22.3 @ bd1e32b): Control route access with guards — https://angular.dev/guide/routing/route-guards,
> Route data resolvers — https://angular.dev/guide/routing/data-resolvers,
> Data fetching with resources — https://angular.dev/guide/routing/data-fetching-with-resources,
> Error boundaries — https://angular.dev/guide/routing/error-boundaries,
> Lifecycle and events — https://angular.dev/guide/routing/lifecycle-and-events.

## When to use
- Allowing or blocking entry to a route, a whole subtree of child routes, or leaving a route with unsaved edits (`canActivate`, `canActivateChild`, `canDeactivate`).
- Choosing between several route definitions for one path based on a feature flag or role (`canMatch`).
- Loading data before a route renders (`resolve` + `ResolveFn`) or reactively and in parallel with signal-based route resources (`resources`, `nonBlocking()`).
- Showing a fallback view when a routed component fails, without breaking the app shell (`errorComponent`, `withErrorBoundaries`).
- Reacting to navigation phases: progress bars, page-view analytics, error banners, or debugging the event sequence (`Router.events`, `withDebugTracing`).
- See also: route-level providers available to guards and resolvers → references/guide/di.md
- See also: `chain()` and the `Resource` API → references/guide/signals.md
- See also: template `@boundary` blocks for errors inside a component's template → references/guide/templates.md
- See also: outlets, redirects and `RedirectCommand` basics → references/guide/routing.md
- See also: other router tasks → references/guide/routing-advanced.md

## Rules
### Guards
- NEVER treat client-side guards as your only access control; browser code can be altered, so authorization MUST also be enforced on the server.
- MUST make every guard produce a value. An `Observable` that completes without emitting (e.g. `EMPTY`, `Observable<never>`) fails the navigation with an RxJS `EmptyError`; add `defaultIfEmpty(false)` if the source may finish empty (common when an interceptor cancels a request).
- MUST redirect from a guard by returning a `UrlTree` or `RedirectCommand`. NEVER return `false` and then call `navigate` yourself.
- NEVER make one guard depend on side effects of an earlier guard in the same array (e.g. loading the current user): async guards run concurrently. Share that work through a service both guards use, or merge the checks into one guard.
- PREFER `canMatch` for feature flags, A/B tests, conditional loading, or serving different components on the same path.
- When a route can show an `errorComponent`, MUST write `canDeactivate` guards so they tolerate receiving the error component instance (check the component type first).

### Resolvers
- PREFER route resources over resolvers when the app uses signals and you want reactive or non-blocking loading.
- MUST handle resolver errors (centrally via `withNavigationErrorHandler`, via `NavigationError` events, or inside the resolver); an unhandled failure raises `NavigationError` and the navigation fails.
- PREFER lightweight resolvers that fetch only the data the page truly needs.
- PREFER caching resolved data for performance.
- MUST give users feedback (e.g. a loading bar) while resolvers run, because navigation is blocked until they finish.
- AVOID resolvers that can hang forever; set reasonable timeouts.
- PREFER typed interfaces for resolved data.
- PREFER route resources over chains of nested resolvers when child routes do not need parent data; nested resolvers run one level after another (network waterfall).

### Route resources [developer preview]
- MUST add `withRouterResources()` to `provideRouter` to enable the `resources` route property.
- PREFER also enabling `withComponentInputBinding()` so resource values bind straight to component inputs.
- MUST read only the specific param inside `params` (e.g. `ctx.params()['id']`), not the whole `ctx.params()` object; the router builds a new object every navigation, which would refetch even when values are the same.
- NEVER read or destructure `ctx.resources()` synchronously in the outer body of the `resources` function; ancestor resources are not ready during setup, so it throws and the navigation fails. MUST read it reactively inside a resource's `params` function.
- MUST cast an inherited resource to its value type (e.g. `as Resource<User>`) since `ctx.resources()` is typed as a record of `Resource<unknown>`.
- PREFER `chain()` in a child `params` function to depend on an ancestor resource instead of waiting for the ancestor route.
- PREFER wrapping a resource in `nonBlocking()` when the UI should render loading/error states itself.
- MUST throw a `RedirectCommand` from a blocking resource loader to redirect (e.g. not-found).
- MUST read the `Resource` instance from `ActivatedRoute` / `ActivatedRouteSnapshot` `resources` when you need `.reload()` or status signals for a blocking resource (its input only carries the value).
- PREFER forwarding the loader's `abortSignal` to async calls such as `fetch` so superseded or rolled-back requests are aborted.

### Error boundaries [developer preview]
- MUST enable `withErrorBoundaries()` in `provideRouter`; otherwise `errorComponent` is ignored.
- MUST load `errorComponent` eagerly (there is no lazy equivalent of `loadComponent` for it).
- PREFER `onError` in `withErrorBoundaries` for telemetry.
- MUST use `withNavigationErrorHandler` (not error boundaries) for failures in guards or resolvers; boundaries only cover view-layer errors.

### Events
- MUST narrow `router.events` with `instanceof` checks against specific event classes.
- PREFER `takeUntilDestroyed()` (or `takeUntilDestroyed(destroyRef)` outside a constructor) to clean up event subscriptions.
- PREFER `withDebugTracing()` to log every router event when diagnosing navigation problems.

## API cheat-sheet
### Guards
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `ng generate guard NAME` | Scaffolds a guard file | Prompts for the guard type; creates `NAME-guard.ts` (`-guard.ts` suffix is the convention) |
| Guard return types | `boolean`, `UrlTree`, `RedirectCommand`, `Promise<T>`, `Observable<T>` | `true` = allow, `false` = block; `UrlTree`/`RedirectCommand` = redirect; first emitted value is used, then unsubscribed |
| `CanActivateFn` | Can this route be entered? | Args: `route: ActivatedRouteSnapshot`, `state: RouterStateSnapshot` (target state, not current; use `Router.routerState` for current) |
| `CanActivateChildFn` | Can child routes be entered? | Args: `childRoute: ActivatedRouteSnapshot` (future child snapshot), `state`; runs once for every child at every level |
| `CanDeactivateFn<T>` | Can the user leave? | Args: `component: T`, `currentRoute`, `currentState`, `nextState` |
| `CanMatchFn` | Can this route config match? | Args: `route: Route`, `segments: UrlSegment[]` (unconsumed), `currentSnapshot: PartialMatchRouteSnapshot`; `false` tries the next matching route instead of blocking |
| `canActivate` / `canActivateChild` / `canDeactivate` / `canMatch` | Route config arrays | Started in array order, async ones run concurrently; first non-`true` result by array position wins |

### Resolvers
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `ResolveFn<T>` | Function that fetches data before activation | Args: `ActivatedRouteSnapshot`, `RouterStateSnapshot`; can use `inject()` and route-level providers |
| `resolve: {key: fn}` | Attach resolvers to a route | Results land in `ActivatedRoute.data` under each key |
| `toSignal(route.data, {requireSync: true})` | Read resolved data as a signal | Then `computed(() => data().key as T)` |
| `withComponentInputBinding()` | Bind resolved keys to inputs of the same name | Use `input()` / `input.required()`; avoids injecting `ActivatedRoute` |
| `withNavigationErrorHandler(fn)` | Central handler for navigation errors, including resolvers | Callback receives the error; can `inject(Router)` |
| `NavigationError` | Event emitted when navigation fails | Has `url` and `error` |
| `RedirectCommand` | Redirect result | `new RedirectCommand(router.parseUrl('/users'))`; resolver type `ResolveFn<T \| RedirectCommand>` |
| `Router.currentNavigation()` | Signal of the in-flight navigation | `!!router.currentNavigation()` = navigating |
| `route.parent?.data['key']` | Parent resolved data inside a child resolver | Parent resolvers finish first |

### Route resources [developer preview]
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `withRouterResources()` | Enables `resources` on routes | [developer preview] |
| `resources: (ctx) => ({name: Resource})` | Declare resources for a route | Runs in an injection context; may be `async` / return a `Promise` (pass `injector` to `resource()` after `await`) |
| `ResourceContext` (`ctx`) | Input to `resources` | Signals `params`, `queryParams`, `fragment`, `data`; `resources` = signal of ancestor resources (raw, always live) |
| Supported resources | `resource()`, `rxResource()`, custom `Resource` | `rxResource` uses `stream` (Observable) instead of `loader` |
| `nonBlocking(resource)` | Activate route immediately | From `@angular/router`; input type is `Resource<T>`; errors surface via `error()` |
| Blocking resource (default) | Router waits for data | Input type is `T`; error cancels navigation with `NavigationError` |
| `params: ({chain}) => chain(parentRes).field` | Depend on an ancestor resource | Propagates state: ancestor error -> `ResourceDependencyError`; ancestor `idle` -> `idle` |
| `ActivatedRoute.resources` / `ActivatedRouteSnapshot.resources` | Router-managed, read-only resources | Own + ancestor resources; frozen while a navigation is pending; `reload()` allowed, `set()`/`update()` not |
| `resource.reload()` | Refetch without renavigating | Returns `false` during an active navigation or rollback recovery |
| `abortSignal` (loader arg) | Cancel stale requests | Pass to `fetch(url, {signal: abortSignal})` |

### Error boundaries [developer preview]
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `errorComponent` (route) | Fallback rendered in the outlet if the route view throws | Must be eager; [developer preview] |
| `withErrorBoundaries(options?)` | Turns boundaries on | [developer preview] |
| `defaultErrorComponent: Type<unknown>` | Fallback for routes without their own `errorComponent` | Option of `withErrorBoundaries` |
| `onError: (error: Error, details?: ErrorDetails) => void` | Called for every error a boundary catches | Option of `withErrorBoundaries`; can `inject()` |
| `error` input | Receives the caught `Error` | `input<Error>()`; wins over params/query/data named `error` |
| Param/data inputs on error component | Contextual info in fallback | Requires `withComponentInputBinding()` |

### Router events
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `Router.events` | Observable of all router events | Narrow with `instanceof` |
| `Event` (from `@angular/router`) | Union type of router events | Not the DOM `Event`, and not the same as `RouterEvent` |
| `withDebugTracing()` | Logs all router events to the console | `provideRouter` feature |
| `NavigationCancel` | Navigation cancelled | Has `reason`, `code`; `NavigationCancellationCode.GuardRejected` when a guard said no |
| `NavigationStart` | Navigation begins | Carries the requested `url` |
| `NavigationEnd` | Successful completion; URL updated | Use for page-view tracking |
| `NavigationSkipped` | Navigation skipped (e.g. same URL) | Completion event |

Event order (navigation): `NavigationStart` -> `RouteConfigLoadStart` -> `RouteConfigLoadEnd` -> `RoutesRecognized` -> `GuardsCheckStart` -> `GuardsCheckEnd` -> `ResolveStart` -> `ResolveEnd`.

| Category | Events | Meaning |
| --- | --- | --- |
| Lazy config | `RouteConfigLoadStart`, `RouteConfigLoadEnd` | Before / after a lazy route config loads |
| Recognition | `RoutesRecognized` | Matching route state is known |
| Guards | `GuardsCheckStart`, `GuardsCheckEnd` | Guard phase; end carries allowed/denied result |
| Resolve | `ResolveStart`, `ResolveEnd` | Resolvers and resources fetch; at end, required data and blocking resources are ready |
| Activation (per route in tree) | `ChildActivationStart`, `ActivationStart`, `ActivationEnd`, `ChildActivationEnd` | Start events fire in the guard phase before that route's guards; end events after activation |
| Completion (exactly one per navigation) | `NavigationEnd`, `NavigationCancel`, `NavigationError`, `NavigationSkipped` | Success / cancelled / unexpected failure / skipped |
| Other | `Scroll` | Scrolling, outside the main navigation lifecycle |

## Patterns
### Guards
```ts
export const authGuard: CanActivateFn = (route, state) =>
  inject(AuthService).isAuthenticated();

export const adminChildGuard: CanActivateChildFn = (childRoute, state) =>
  inject(AuthService).hasRole('admin');

export const leaveGuard: CanDeactivateFn<EditForm> = (cmp, currentRoute, currentState, nextState) =>
  cmp.hasUnsavedChanges() ? confirm('Discard changes?') : true;

export const flagGuard: CanMatchFn = (route, segments, currentSnapshot) =>
  inject(FeatureFlags).isOn('newDashboard');
```

```ts
const routes: Routes = [
  {path: 'admin', component: Admin, canActivate: [authGuard, adminGuard]},
  {path: 'profile', component: Profile, canActivate: [authGuard], canDeactivate: [leaveGuard]},
  {
    path: 'users', // '/users' itself is not guarded
    canActivateChild: [authGuard],
    children: [
      {path: 'list', component: UserList},
      {path: 'detail/:id', component: UserDetail},
    ],
  },
  // Same path, different component: first route whose canMatch passes wins
  {path: 'dashboard', component: AdminDashboard, canMatch: [adminGuard]},
  {path: 'dashboard', component: UserDashboard, canMatch: [userGuard]},
  // Fallback when the flag is off
  {path: 'beta', component: Beta, canMatch: [flagGuard]},
  {path: 'beta', component: ComingSoon},
];
```

### Resolvers
```ts
export const userResolver: ResolveFn<User> = (route, state) =>
  inject(UserStore).getUser(route.paramMap.get('id')!);

export const routes: Routes = [
  {path: 'user/:id', component: UserDetail, resolve: {user: userResolver, settings: settingsResolver}},
];
```

```ts
// Option A: ActivatedRoute.data as a signal
export class UserDetail {
  private data = toSignal(inject(ActivatedRoute).data, {requireSync: true});
  user = computed(() => this.data().user as User);
}

// Option B: provideRouter(routes, withComponentInputBinding())
export class UserDetail {
  user = input.required<User>();
  settings = input.required<Settings>();
}
```

```ts
// Central error handling
provideRouter(
  routes,
  withNavigationErrorHandler((err) => {
    const router = inject(Router);
    if (err.error?.message) console.error(err.error.message);
    router.navigate(['/error']);
  }),
);

// In-resolver recovery via redirect
export const safeUserResolver: ResolveFn<User | RedirectCommand> = (route) => {
  const router = inject(Router);
  return inject(UserStore).getUser(route.paramMap.get('id')!).pipe(
    catchError(() => of(new RedirectCommand(router.parseUrl('/users')))),
  );
};
```

```ts
// Event-based handling with retry
export class App {
  private router = inject(Router);
  private failedUrl = signal('');
  errorMessage = toSignal(
    this.router.events.pipe(
      map((e) => {
        if (e instanceof NavigationError) {
          this.failedUrl.set(e.url);
          return 'Navigation failed.';
        }
        return '';
      }),
    ),
    {initialValue: ''},
  );
  retry() {
    if (this.failedUrl()) this.router.navigateByUrl(this.failedUrl());
  }
}
```

```ts
// Child resolver reading parent resolved data
{
  path: 'users/:id',
  resolve: {user: userResolver},
  children: [{
    path: 'posts',
    component: UserPosts,
    resolve: {
      posts: (route: ActivatedRouteSnapshot) =>
        inject(PostService).getPostByUser((route.parent?.data['user'] as User).id),
    },
  }],
}
```

### Loading indicator (resolvers / any navigation)
```angular-ts
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    @if (isNavigating()) { <div class="loading-bar">Loading...</div> }
    <router-outlet />
  `,
})
export class App {
  private router = inject(Router);
  isNavigating = computed(() => !!this.router.currentNavigation());
}
```

### Route resources [developer preview]
```ts
bootstrapApplication(App, {
  providers: [provideRouter(routes, withComponentInputBinding(), withRouterResources())],
});
```

```angular-ts
const routes: Routes = [
  {
    path: 'user/:id',
    component: UserProfile,
    resources: (ctx) => {
      const users = inject(UserService);
      return {
        user: resource({
          params: () => ctx.params()['id'], // read just the value you need
          loader: ({params: id, abortSignal}) => users.getUser(id, {signal: abortSignal}),
        }),
      };
    },
  },
];

@Component({
  template: `<p>{{ user().name }}</p><button (click)="refresh()">Refresh</button>`,
})
export class UserProfile {
  user = input.required<User>(); // blocking: value only
  private userRes = inject(ActivatedRoute).resources?.['user'];
  refresh() {
    this.userRes?.reload(); // no renavigation, guards do not rerun
  }
}
```

```ts
// rxResource and async setup
resources: (ctx) => ({
  user: rxResource({params: () => ctx.params()['id'], stream: ({params: id}) => user$(id)}),
}),

resources: async (ctx) => {
  const injector = inject(Injector);
  const {loadUser} = await import('./user-api');
  return {user: resource({params: () => ctx.params()['id'], loader: ({params}) => loadUser(params), injector})};
},
```

```ts
// Chaining off an ancestor resource; children bind both inherited and own resources
{
  path: 'user/:id',
  resources: (ctx) => ({
    user: resource({params: () => ctx.params()['id'], loader: ({params}) => fetchUser(params)}),
  }),
  children: [{
    path: 'details',
    component: UserDetails, // inputs: user, details
    resources: (ctx) => ({
      details: resource({
        params: ({chain}) => chain(ctx.resources()['user'] as Resource<User>).role,
        loader: ({params: role}) => fetchRoleDetails(role),
      }),
    }),
  }],
}
```

```angular-ts
// Non-blocking resource: component handles loading/error
const routes: Routes = [
  {
    path: 'reports',
    component: Reports,
    resources: () => ({report: nonBlocking(resource({loader: () => fetchReport()}))}),
  },
];

@Component({
  template: `
    @if (report().isLoading()) { <p>Loading...</p> }
    @else if (report().error()) { <p>Could not load report.</p> }
    @else if (report().hasValue()) { <report-view [data]="report().value()" /> }
  `,
})
export class Reports {
  report = input.required<Resource<ReportData>>();
}
```

```ts
// Redirect from a blocking resource
resources: (ctx) => {
  const router = inject(Router);
  return {
    user: resource({
      params: () => ctx.params()['id'],
      loader: async ({params: id}) => {
        const user = await fetchUser(id);
        if (!user) throw new RedirectCommand(router.parseUrl('/not-found'));
        return user;
      },
    }),
  };
},
```

### Error boundaries [developer preview]
```ts
export const routes: Routes = [
  {path: 'products/:id', component: ProductDetails, errorComponent: ProductError},
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withErrorBoundaries({
        defaultErrorComponent: AppErrorFallback,
        onError: (error, details) => inject(Telemetry).logException(error, details),
      }),
    ),
  ],
};
```

```angular-ts
@Component({
  selector: 'app-product-error',
  template: `
    <h3>Product #{{ id() }} failed to load</h3>
    <p>{{ error()?.message }}</p>
  `,
})
export class ProductError {
  readonly id = input<string>();     // route param (needs withComponentInputBinding)
  readonly error = input<Error>();   // the caught error
}
```

```ts
// A component (or route resource) can throw RedirectCommand to navigate away
export class UserProfile {
  private router = inject(Router);
  data = resource({
    loader: async () => {
      const res = await fetch('/api/user');
      if (res.status === 401) throw new RedirectCommand(this.router.parseUrl('/login'));
      return res.json();
    },
  });
}
```

### Router events
```ts
export class NavLogger {
  private router = inject(Router);
  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((e: Event) => {
      if (e instanceof NavigationStart) console.log('start', e.url);
      if (e instanceof NavigationEnd) console.log('end', e.url);
    });
  }
}

// Service: pass DestroyRef when not in a constructor injection context
@Service()
export class PageViews {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  start() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((e) => {
      if (e instanceof NavigationEnd) track(e.url);
    });
  }
}

// Error banner
this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => {
  if (e instanceof NavigationStart) this.msg.set('');
  else if (e instanceof NavigationError) this.msg.set('Page failed to load.');
  else if (e instanceof NavigationCancel && e.code === NavigationCancellationCode.GuardRejected) {
    this.msg.set('Access denied.');
  }
});

// Debug
provideRouter(routes, withDebugTracing());
```

## Pitfalls
- A guard `Observable` that completes with no value (e.g. after an interceptor cancels the request) yields an `EmptyError` and the navigation fails.
- Guards in one array are not sequential: the router starts them in order without awaiting each, so async guards overlap. The result used is the first non-`true` one by array position, even if a later guard settled sooner.
- `canMatch` returning `false` does not block; the router keeps looking for another matching route.
- `canActivateChild` executes for each child level, so nested children trigger it more than once.
- The `state` argument of `CanActivate`/`CanActivateChild` is the destination state, not the current one.
- Resolvers block navigation; slow requests delay the route appearing after a click.
- Nested resolvers form a waterfall: a 200ms parent plus a 300ms child blocks for 500ms, while resources in the same hierarchy finish in about 300ms.
- Unhandled resolver failures produce a `NavigationError` and the navigation is dropped.
- Calling `ctx.resources()` synchronously in the `resources` function body throws and fails the navigation.
- Returning the whole `ctx.params()` / `ctx.queryParams()` object from `params` refetches on every navigation; read individual keys so unrelated changes (`?sort=`, `?page=`) do not reload.
- For a blocking resource the component never sees `loading` or `error`: the input is the plain value, and errors cancel the navigation (`NavigationError`). Use `nonBlocking()` for in-component states.
- When a chained ancestor errors, the dependent resource fails with `ResourceDependencyError`; if it is blocking, the navigation is cancelled.
- Input binding precedence: resource names beat route `data` (including resolved values), path params and query params.
- A route resource with the same name as an ancestor's shadows the inherited one.
- Resources on `ActivatedRoute` are read-only (no `set()`/`update()`) even if the underlying resource is writable, and stay frozen during a pending navigation: a reused component keeps showing old data until the new data arrives, then switches without a loading flash. Raw `ctx.resources()` are always live.
- `reload()` returns `false` while a navigation is active or during rollback recovery.
- If a navigation is cancelled (e.g. by a guard), the state tree reverts, params can revert and a resource may reload for the old values; the router keeps the previous snapshot visible until it settles.
- Refetching with resolvers needs a full renavigation (e.g. `onSameUrlNavigation: 'reload'`), which rematches routes and reruns guards and resolvers.
- `errorComponent` does nothing unless `withErrorBoundaries()` is provided, and it cannot be lazy-loaded.
- An `error` param, query param or data key is overridden by the caught `Error` on the error component's `error` input.
- If the `errorComponent` itself throws, the outlet does not catch it again; it goes to the root `ErrorHandler` or an enclosing template `@boundary` (avoids infinite loops).
- Boundary scope: view-layer errors (constructors, DI, lifecycle hooks such as `ngOnInit`, template expressions, component `resource()` loaders) show the `errorComponent`. Guard (`canActivate`/`canMatch`) and `resolve` failures are navigation-pipeline errors that stop before the outlet; handle them with `withNavigationErrorHandler`.
- Thrown `RedirectCommand`: the outlet catches it and navigates; with nested outlets or template boundaries it is deduplicated so navigation fires once; the error component (if any) renders during the transition. With no `errorComponent`, the error is swallowed so `ErrorHandler` does not log a crash.
- `canDeactivate` still runs when leaving a route showing its `errorComponent`, and receives the error component instance as `component`.
- The router `Event` type shares its name with the global DOM `Event` but is a different type, and also differs from `RouterEvent`.
- `NavigationCancel` is frequently caused by a guard returning `false`; `NavigationError` can come from invalid routes, resolver errors or rejected blocking resources.

## Version notes
- [developer preview] Route resources: `resources` route property, `withRouterResources()`, `nonBlocking()`, `ResourceContext`, `ActivatedRoute.resources`.
- [developer preview] Router error boundaries: `errorComponent`, `withErrorBoundaries()` (`defaultErrorComponent`, `onError`).
- Guards, resolvers and router events carry no stability label in the docs.
