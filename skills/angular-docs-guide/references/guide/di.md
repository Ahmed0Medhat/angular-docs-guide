# Dependency Injection

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/di,
> Creating and using services — https://angular.dev/guide/di/creating-and-using-services,
> Lazy loading services — https://angular.dev/guide/di/lazy-loading-services,
> Defining dependency providers — https://angular.dev/guide/di/defining-dependency-providers,
> Injection context — https://angular.dev/guide/di/dependency-injection-context,
> Optimizing injection tokens — https://angular.dev/guide/di/lightweight-injection-tokens,
> DI in action — https://angular.dev/guide/di/di-in-action.

## When to use
- Sharing logic, state, data clients, auth, logging or utilities across components via a singleton service (`@Service`, `inject()`).
- Supplying non-class values (config objects, functions, browser APIs, flags) through DI (`InjectionToken`).
- Scoping a service to a component tree or route, or swapping implementations (`providers`, `useClass` / `useValue` / `useFactory` / `useExisting`).
- Deferring a heavy, rarely used service until first use (`injectAsync`, `onIdle`, custom `PrefetchTrigger`).
- Calling `inject()` from helper functions, guards or arbitrary methods (`runInInjectionContext`, `assertInInjectionContext`).
- Writing library APIs that tree-shake well (`provideX()`/`withX()` functions, lightweight abstract-class tokens).
- See also: creating services with `ng generate service` → references/tools/cli.md
- See also: content queries (`contentChild` / `contentChildren`) → references/guide/components.md
- See also: component naming conventions (no `Component` suffix) → references/best-practices/style-guide.md

## Rules
- PREFER `@Service()` for most services: it registers the class as an app-wide singleton at the root injector (shorthand for `@Injectable({providedIn: 'root'})`).
- PREFER `@Service` for new singleton classes whose dependencies come from `inject()`.
- MUST use `@Injectable` instead of `@Service` when you need constructor-parameter injection, `useClass`/`useValue`/`useExisting`/`useFactory`, or a non-root scope such as `providedIn: 'platform'`.
- MUST obtain dependencies with `inject()` only inside an injection context: constructor body, field initializer, `useFactory` / `@Injectable` factory, `InjectionToken` `factory`, `@Service({factory})`, or a stack frame that Angular runs in context (e.g. router guards like `CanActivateFn`).
- MUST add a `@Service({autoProvided: false})` class or a plain `@Injectable()` class (no `providedIn`) to a `providers` array yourself.
- MUST make a service auto-provided (`@Service()` or `@Injectable({providedIn: 'root'})`) before loading it with `injectAsync`; otherwise Angular cannot build it after the chunk arrives.
- NEVER use a TypeScript interface or type as a provider key or as a provided value; they do not exist at runtime. Use an `InjectionToken<T>` instead.
- PREFER an `InjectionToken` with a `factory` for global non-class values; it is root-provided by default, tree-shakable and can `inject()` other dependencies.
- MUST NOT confuse `useExisting` (alias returning the same instance) with `useClass` (creates a separate instance).
- MUST set `multi: true` on every provider that contributes to a shared token; injection then yields an array of all contributions.
- PREFER bootstrap (`bootstrapApplication` providers) for app-wide services with side effects, required configuration (e.g. routes), or the `provideSomething` pattern (`provideRouter`, `provideHttpClient`).
- PREFER component/directive `providers` for per-instance state (form validators, modal state, component caches) and reusable self-contained components.
- PREFER route `providers` for feature-only services, lazily loaded feature dependencies and per-area configuration.
- PREFER exporting `provideX(config)` functions (plus composable `withX()` features) from libraries instead of making consumers wire raw providers; keep config tokens internal.
- MUST (library authors) use tree-shakable, root-level providers for all library services rather than component- or module-level ones.
- PREFER a small abstract class as a lightweight token when a library component would otherwise appear in a value position (`contentChild(X)`, `inject(X)`); bind it with `{provide: XToken, useExisting: X}` in the component's `providers`.
- MUST declare abstract methods on the lightweight token class for any method the parent calls, and check the queried child exists before calling it.
- PREFER naming a lightweight token `<ComponentBaseName>Token` (e.g. `LibHeaderToken`).
- PREFER passing the calling function to `assertInInjectionContext(fn)` so the thrown error names the correct API entry point.
- PREFER making `inject(HOST_TAG_NAME)` optional when the host may lack a tag name (`ng-container`, `ng-template`).
- AVOID direct DOM access in general; inject `ElementRef` only when a visual effect or third-party tool needs the element.
- PREFER one class per file; use `forwardRef(() => X)` only when a circular or self reference is unavoidable (e.g. a component listing itself in its own `providers`).

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `@Service()` | Mark a class injectable and root-provide it as a singleton | Shorthand for `@Injectable({providedIn: 'root'})`; `inject()` only, no constructor DI |
| `@Service({factory: () => …})` | Control how the singleton is built (e.g. pick a subclass per environment) | Factory runs in an injection context; replaces `useClass`/`useValue`/`useExisting`/`useFactory` |
| `@Service({autoProvided: false})` | Skip root registration; provide manually | Needed to scope to a route/component |
| `@Injectable()` | Injectable class with no automatic provider | Must be listed in some `providers` |
| `@Injectable({providedIn: 'root' \| 'platform'})` | Auto-provided class at the given scope | Supports constructor-based DI |
| `inject(token, {optional?: true})` | Retrieve a dependency | Only in injection context; returns an instance only if resolvable; NG0203 outside context |
| `injectAsync(loader, {prefetch?})` | Lazily import and resolve a service; returns a function giving a `Promise` of the instance | Chunk fetched once; promise reused; `default` export unwrapped automatically |
| `onIdle` / `onIdle({timeout})` | Built-in prefetch trigger firing when the browser is idle | `timeout` caps the wait |
| `PrefetchTrigger` | Type: function returning a `Promise`; loader starts when it resolves | For custom triggers (hover, scheduler) |
| `new InjectionToken<T>(desc, {providedIn?, factory?})` | Unique runtime key for any value | `desc` is debug-only; with `factory`, `providedIn` defaults to `'root'` |
| `{provide, useClass}` | Provide a class (possibly a different implementation) | `providers: [X]` is shorthand for `{provide: X, useClass: X}` |
| `{provide, useValue}` | Provide a static value | Strings, numbers, objects, etc. |
| `{provide, useFactory, deps?}` | Provide a value computed by a function | `deps` lists factory arguments; `[new Optional(), Dep]` marks one optional; factory may also call `inject()` |
| `{provide, useExisting}` | Alias to an already provided token | Same instance for both tokens |
| `{…, multi: true}` | Several providers contribute to one token | Injection returns an array |
| `Provider` / `Provider[]` | Type for provider configs | Return type of `provideX()` functions |
| `bootstrapApplication(App, {providers})` | App-level providers | Always bundled, even if never injected |
| `@Component`/`@Directive` `providers` | Element-level providers for that subtree | Instance destroyed with the component |
| `Route.providers` | Route-level providers | Visible to the route's components, directives, guards and resolvers |
| `runInInjectionContext(injector, fn)` | Run `fn` inside an injection context | Needs an injector, e.g. `inject(EnvironmentInjector)` |
| `EnvironmentInjector` | Injector usable with `runInInjectionContext` | Inject it during construction |
| `assertInInjectionContext(fn)` | Throw a clear error when not in an injection context | Also throws NG0203 outside context |
| `ElementRef` | Host DOM element of a component/directive (`.nativeElement`) | |
| `HOST_TAG_NAME` | Host element's tag name string | Make optional for `ng-container`/`ng-template` hosts |
| `forwardRef(() => X)` | Indirect reference resolved later | For circular/self references |
| `ng generate service NAME` | CLI scaffold | Creates `NAME.ts` under `src` |

## Patterns

### Root singleton service and injection
```ts
import {Component, Service, inject} from '@angular/core';

@Service()
export class TodoStore {
  private items: string[] = [];
  add(item: string) { this.items.push(item); }
  list() { return [...this.items]; }
}

@Component({
  selector: 'app-todos',
  template: `<button (click)="store.add('x')">Add</button>`,
})
export class Todos {
  store = inject(TodoStore);           // field initializer
  private other: TodoStore;
  constructor() { this.other = inject(TodoStore); } // constructor body
}

// Functional guard: runs in an injection context
export const authGuard = () => inject(AuthService).isAuthenticated();
```

### `@Service` factory and opting out of auto-provision
```ts
@Service({
  factory: () => (inject(TRACKING_ON) ? new RemoteTracker() : new Tracker()),
})
export class Tracker {
  track(name: string) {} // no-op default
}
class RemoteTracker extends Tracker {
  override track(name: string) { /* send to backend */ }
}

@Service({autoProvided: false})
export class ScopedLogger {}
// later: providers: [ScopedLogger] on a route or component
```

### Lazy service with prefetch
```ts
import {Component, injectAsync, onIdle, PrefetchTrigger} from '@angular/core';

@Component({selector: 'app-report', template: `<button (click)="run()">Export</button>`})
export class Report {
  private exporter = injectAsync(
    () => import('./csv-exporter').then((m) => m.CsvExporter),
    {prefetch: () => onIdle({timeout: 1_000})},
  );
  // default export: injectAsync(() => import('./csv-exporter'))
  async run() {
    (await this.exporter()).export();
  }
}

export function onHover(el: HTMLElement): PrefetchTrigger {
  return () => new Promise<void>((resolve) =>
    el.addEventListener('pointerenter', () => resolve(), {once: true}));
}
```

### InjectionToken: plain, root factory, browser API
```ts
export const API_URL = new InjectionToken<string>('api.url');

export interface Settings { apiUrl: string; version: string; }
export const SETTINGS = new InjectionToken<Settings>('settings', {
  factory: () => ({apiUrl: '/api', version: '1.0.0'}), // providedIn: 'root' by default
});

export const STORAGE = new InjectionToken<Storage>('storage', {
  factory: () => window.localStorage,
});

export const LOG = new InjectionToken<(m: string) => void>('log', {
  providedIn: 'root',
  factory: () => {
    const s = inject(SETTINGS);
    return (m) => console.log(`[${s.version}] ${m}`);
  },
});
```

### Provider shapes
```ts
providers: [
  Logger,                                             // = {provide: Logger, useClass: Logger}
  {provide: Logger, useClass: TimestampLogger},       // substitute implementation
  {provide: Store, useClass: isProd ? CloudStore : LocalStore},
  {provide: API_URL, useValue: 'https://api.example.com'},
  {provide: Client, useFactory: (cfg: Settings) => new Client(cfg.apiUrl), deps: [SETTINGS]},
  {provide: Svc, useFactory: (a: A, b?: B) => new Svc(a, b ?? new DefaultB()),
    deps: [A, [new Optional(), B]]},
  {provide: Client2, useFactory: () => new Client2(inject(HttpClient))}, // inject() in factory
  NewLogger,
  {provide: OldLogger, useExisting: NewLogger},       // same instance
  {provide: HOOKS, useClass: AuthHook, multi: true},
  {provide: HOOKS, useClass: RetryHook, multi: true}, // inject(HOOKS) -> [AuthHook, RetryHook]
];
```

### Where providers go
```ts
// App-wide
bootstrapApplication(App, {
  providers: [{provide: API_URL, useValue: '/api'}, {provide: ErrorHandler, useClass: AppErrorHandler}],
});

// Per component instance (destroyed with the component)
@Component({selector: 'app-editor', providers: [EditorState, {provide: FORM_OPTS, useValue: {strict: true}}]})
export class Editor { state = inject(EditorState); }

// Per route (also visible to guards/resolvers)
export const routes: Routes = [
  {path: 'admin', providers: [AdminApi], loadChildren: () => import('./admin/admin.routes')},
];
```

### Library `provide` function with features
```ts
const CHART_CONFIG = new InjectionToken<ChartConfig>('chart.config'); // internal

export interface ChartFeature { kind: string; providers: Provider[]; }

export function provideCharts(config: ChartConfig, ...features: ChartFeature[]): Provider[] {
  return [{provide: CHART_CONFIG, useValue: config}, ChartService, ...features.flatMap((f) => f.providers)];
}
export function withExport(): ChartFeature {
  return {kind: 'export', providers: [ChartExporter]};
}

bootstrapApplication(App, {providers: [provideCharts({theme: 'dark'}, withExport())]});
```

### Injection context helpers
```ts
@Service()
export class Reports {
  private envInjector = inject(EnvironmentInjector);
  refresh() {
    runInInjectionContext(this.envInjector, () => inject(Fetcher).run());
  }
}

export function injectHostEl<T extends Element>(): T {
  assertInInjectionContext(injectHostEl);
  return inject(ElementRef).nativeElement;
}
// OK in a field initializer; throws when called from a click handler.
```

### Lightweight injection token (library)
```ts
abstract class LibBadgeToken {
  abstract highlight(): void;
}

@Component({
  selector: 'lib-badge',
  providers: [{provide: LibBadgeToken, useExisting: LibBadge}],
})
class LibBadge extends LibBadgeToken {
  highlight() { /* real implementation */ }
}

@Component({selector: 'lib-tile'})
class LibTile implements AfterContentInit {
  readonly badge = contentChild(LibBadgeToken); // no reference to LibBadge
  ngAfterContentInit() {
    this.badge()?.highlight();
  }
}
```

### DOM element, host tag name, forwardRef
```ts
@Directive({selector: '[appTint]'})
export class Tint {
  private el = inject(ElementRef);
  private tag = inject(HOST_TAG_NAME);
  paint() {
    if (this.tag === 'button') this.el.nativeElement.style.color = 'red';
  }
}

@Component({
  selector: 'app-menu-item',
  providers: [{provide: PARENT_ITEM, useExisting: forwardRef(() => MenuItem)}],
})
export class MenuItem {}
```

## Pitfalls
- Calling `inject()` or `assertInInjectionContext()` outside an injection context (e.g. in an event handler or ordinary method) throws error NG0203; wrap with `runInInjectionContext` if needed.
- `inject()` returns an instance only when the injector can resolve the token.
- `@Service` does not support constructor parameter injection, `useClass`/`useValue`/`useExisting`/`useFactory`, or non-root scopes; its only provider hook is `factory`.
- `@Service({autoProvided: false})` and `@Injectable()` without `providedIn` fail to resolve unless some `providers` array lists them.
- `injectAsync` cannot construct a service that is not auto-provided.
- Without `prefetch`, the lazy chunk downloads only when the returned function is first called. Prefetch is best-effort: if the user acts first, loading starts immediately.
- The `InjectionToken` description string is debug-only; Angular matches tokens by object reference, never by that string.
- Interfaces/types vanish after compilation, so `{provide: SomeInterface, …}` and `inject(SomeInterface)` do not work.
- `useClass` gives a new, separate instance; use `useExisting` when the alias must share the instance.
- Listing a root-provided service in a component's `providers` creates a separate instance tied to that component's lifetime instead of the shared root one.
- Bootstrap-level providers are always in the bundle even if never injected; element-level providers ship in the component/directive's bundle even if never injected.
- Element-level providers mean a new instance per component (more memory, no shared state) and must be repeated wherever needed.
- When several directives on one element provide the same token, one wins but which one is undefined.
- Route-level services are created independently of the route's components and have no direct access to route-specific information.
- An element can provide values only to its own descendants; a sibling subtree cannot see them.
- A component used in a value position (`contentChild(X)`, `contentChildren(X)`, `inject(X)`) is retained in the bundle even if never rendered; type-position references are erased.
- Lightweight tokens are only useful for components.
- `forwardRef` is needed for a class referencing itself in its own decorator (e.g. `providers`), because the decorator is evaluated before the class is defined.

## Version notes
- None stated in the docs.
