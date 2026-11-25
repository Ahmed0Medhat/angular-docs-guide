# Hierarchical Dependency Injection and DI Debugging

> Sources (angular.dev, v22.3 @ bd1e32b): Hierarchical injectors — https://angular.dev/guide/di/hierarchical-dependency-injection,
> Debugging and troubleshooting DI — https://angular.dev/guide/di/debugging-and-troubleshooting-di.

## When to use
- Deciding where a provider should live (root/environment, route, component, directive) and who can see it.
- Scoping a service to one component subtree, or giving each component instance its own private copy (edit sessions, form state).
- Swapping in a more specialized implementation of a service deeper in the component tree.
- Controlling lookup with `inject()` options `optional`, `self`, `skipSelf`, `host` (or the matching constructor decorators).
- Choosing between `providers` and `viewProviders`, and letting projected content reach a view-level service.
- Diagnosing `NG0201` (no provider), `NG0203` (no injection context), `NG0200` (circular dependency) and unexpected multiple instances.
- See also: provider basics, injection context and `assertInInjectionContext` → references/guide/di.md
- See also: `LocationStrategy` setup and automatic cleanup of route injectors → references/guide/routing-advanced.md
- See also: functional guards, resolvers and route resources as injection contexts → references/guide/routing-data.md
- See also: inspecting the injector tree in Angular DevTools → references/tools/devtools.md
- See also: testing with DI (TestBed, mocks) → references/guide/testing.md

## Rules
- PREFER `@Service()` over listing a service in `ApplicationConfig.providers`: it allows tree-shaking of unused services (especially valuable in libraries).
- PREFER `@Service()` for app-wide singletons and for anything shared across lazy-route boundaries; it is available everywhere, including before a lazy route loads.
- MUST use `@Service({autoProvided: false})` (or `@Injectable()` without `providedIn`) when the service must not be app-wide; then list it in some `providers` array.
- MUST put a service in a component's `providers` when each component instance needs its own isolated instance (e.g. one editing session per open component).
- PREFER providing a service only in the component that owns it (instead of root) to stop unrelated parts of the app from coupling to it.
- MUST provide a service at or above every consumer: lookup only walks up the tree, never into children.
- AVOID adding a would-be singleton to several components' `providers`; each component instance gets a separate copy.
- MUST place resolution modifiers at the injection point (`inject(Token, {...})`), not on the provider declaration.
- NEVER combine `host` with `self`, or `skipSelf` with `self`; every other combination is allowed.
- PREFER pairing `self` (and `skipSelf`/`host`) with `optional` when the token may legitimately be absent, so the result is `null` instead of an error.
- PREFER `providers` by default; use `viewProviders` only to hide an internal service from content projected via `<ng-content>`.
- MUST import the one exported `InjectionToken` instance everywhere; NEVER create a second token with the same description.
- MUST use an `InjectionToken` (not an interface) as the token for interface-typed values; interfaces are erased at runtime.
- MUST call `inject()` synchronously in an injection context: field initializers, the constructor, provider/token factories, `runInInjectionContext`, `provideAppInitializer`, `provideEnvironmentInitializer`, functional guards/resolvers, route resources.
- PREFER capturing dependencies at class level; use a captured `Injector` with `injector.get()` for deferred lookups, and `runInInjectionContext()` only when other code (e.g. a callback) must itself call `inject()`.
- MUST always decorate services with `@Service()` (or `@Injectable()`), even when a zero-argument constructor would work without it.
- PREFER, for circular dependencies, in this order: extract shared logic into a third service → replace direct calls with events (e.g. a `Subject`) → defer one side with `Injector.get()` (last resort).
- NEVER use `forwardRef()` to fix a circular dependency between services; it only addresses circular imports in standalone component configuration.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `@Service()` | Marks a class as a service and provides it in the root `EnvironmentInjector` | Tree-shakable |
| `@Service({autoProvided: false})` | Service that is not auto-provided at root | Must be added to a `providers` array |
| `@Injectable()` | Marks a service class | No `providedIn` → must be provided explicitly |
| `@Injectable({providedIn: 'root' \| 'platform'})` | Provide in root or platform injector | Listed for `NgModule`-based apps |
| `ApplicationConfig.providers` | Configures the root `EnvironmentInjector` (via `bootstrapApplication(App, appConfig)`) | Overrides a `root` provider declared in `@Injectable()` metadata |
| `platformBrowser(extraProviders)` | Adds platform-level providers | Platform injector is created or reused by `bootstrapApplication` |
| `@NgModule({providers, imports})` | Configures a `ModuleInjector` (flattened over imports, recursively) | `NgModule` apps; lazy modules create child `ModuleInjector`s |
| Route `providers` | Child `EnvironmentInjector` for a route | Exists only after the route loads; persists after leaving by default |
| `@Component/@Directive({providers})` | Configures the element's `ElementInjector` | Visible to the template and to projected content |
| `@Component({viewProviders})` | Provider visible only inside the component's own view | Not visible to `<ng-content>` content |
| `inject(T, {optional: true})` | Return `null` instead of throwing when unresolved | Constructor form: `@Optional()` |
| `inject(T, {self: true})` | Look only in the current element's `ElementInjector` | `@Self()` |
| `inject(T, {skipSelf: true})` | Begin the search at the parent `ElementInjector` | `@SkipSelf()` |
| `inject(T, {host: true})` | Make the host component's view the last stop | `@Host()` |
| `inject(Injector)` + `injector.get(T)` | Retrieve a service outside an injection context | Deferred lookup |
| `runInInjectionContext(injector, fn)` | Run `fn` in a temporary injection context so it may call `inject()` | For callbacks / external code |
| `assertInInjectionContext()` | Verify code runs in an injection context | Useful in reusable `inject()`-based helpers |
| `new InjectionToken<T>(desc, {factory})` | Runtime token for non-class values | Matched by object identity, not description |
| `NgTemplateOutlet` + `ngTemplateOutletInjector` | Render a template with an explicit injector | Lets projected templates see `viewProviders` |
| `contentChild.required(TemplateRef)` | Query a projected `<ng-template>` | Used with the outlet pattern above |

### Injector hierarchies
| Hierarchy | How it is configured |
| --- | --- |
| `EnvironmentInjector` | `@Service()` or `ApplicationConfig.providers`; the Router (and dynamically loaded components) can create child environment injectors |
| `ElementInjector` | Implicit per DOM element; empty unless a `@Component`/`@Directive` declares `providers`/`viewProviders` |
| `ModuleInjector` (`NgModule` apps) | `@Service()`, `@Injectable({providedIn})`, `@NgModule.providers`/`imports` |

Chain above root (bottom → top): `root` `EnvironmentInjector` (from `ApplicationConfig`) → platform `EnvironmentInjector` (Angular-configured, e.g. `PlatformLocation`, `providedIn: 'platform'`) → `NullInjector` (always throws unless optional, then `null`).

### Error codes
| Code | Meaning |
| --- | --- |
| `NG0200` | Circular dependency; message shows the cycle path |
| `NG0201` | `NullInjectorError`: no provider for a token; message shows the dependency path |
| `NG0203` | `inject()` called outside an injection context |
| `NG0204` | Cannot resolve all parameters (missing `@Injectable()`) |
| `NG0205` | Injector already destroyed (service used after component destruction) |
| `NG0207` | `EnvironmentProviders` in the wrong place (e.g. `provideHttpClient()` in component `providers`) |

## Patterns

### Resolution order
1. Current element's `ElementInjector` (for a component, starting at its own view so `viewProviders` count), then parent element injectors upward.
2. If no element injector has it, return to the requesting element and search the `EnvironmentInjector` chain (route → root → platform); `NgModule` apps search the `ModuleInjector` chain.
3. Reaching `NullInjector` throws (`NG0201`) unless `optional` is set.
- The first matching provider found wins; a local provider shadows any higher one.

### Modifiers
```ts
@Component({
  selector: 'app-leaf',
  template: '…',
  providers: [{provide: LeafStore, useValue: {icon: 'maple'}}],
})
export class LeafPanel {
  own = inject(LeafStore, {self: true});                       // 'maple' (local only)
  inherited = inject(LeafStore, {skipSelf: true});             // parent's value
  maybe = inject(ExtraStore, {self: true, optional: true});    // null if not on this element
  capped = inject(PetStore, {host: true, optional: true});     // stops at host view
}

// Recursive structure: find an ancestor of the same type, if any
class TreeNode {
  parent = inject(TreeNode, {optional: true, skipSelf: true});
}

// Constructor-injection equivalent
export class Legacy {
  constructor(@Self() @Optional() public leaf?: LeafStore) {}
}
```

### Logical tree (`<#VIEW>` is a mental-model pseudo-element)
```html
<app-root>              <!-- component: providers live here -->
  <#VIEW>               <!-- component's viewProviders live here -->
    <app-child>
      <#VIEW> … </#VIEW>
    </app-child>
  </#VIEW>
</app-root>
```
- A component's lookup starts at its own `<#VIEW>` (it has `viewProviders`); a directive on the same element does not.
- Components and directives on the same element share one injector.

### `providers` vs `viewProviders` with projection
```ts
@Component({
  selector: 'app-panel',
  template: `<ng-content /> <app-probe />`,
  providers: [{provide: PlantStore, useValue: {icon: 'sunflower'}}],
  viewProviders: [{provide: PetStore, useValue: {icon: 'dog'}}],
  imports: [Probe],
})
export class Panel {}
// In App's template: <app-panel><app-probe /></app-panel>
// projected <app-probe>: PlantStore = sunflower, PetStore = root value
// <app-probe> inside Panel's template: PlantStore = sunflower, PetStore = dog
```
- DI follows where markup is declared, not where it renders: projected content resolves from the declaring template, so it skips the projector's `viewProviders` but still reaches root.

### Modifier outcomes from the docs' example
| Child injects | Child provides | Result |
| --- | --- | --- |
| `PlantStore` (`providers`) | sunflower | sunflower |
| `PlantStore, {skipSelf}` | sunflower | root value |
| `PlantStore, {skipSelf, host, optional}` | sunflower | `null` (host caps at child's view) |
| `PetStore` (`viewProviders`) | dog | dog |
| `PetStore, {skipSelf}` | dog | root value |
| `PetStore, {host}` | dog | dog |
| `PetStore, {skipSelf, host}` with parent `viewProviders` = hedgehog | dog | hedgehog (found in parent `<#VIEW>`) |

### Projected template reaching `viewProviders`
```ts
@Component({
  selector: 'app-panel',
  viewProviders: [PetStore],
  imports: [NgTemplateOutlet],
  template: `<ng-container [ngTemplateOutlet]="body()" [ngTemplateOutletInjector]="injector" />`,
})
export class Panel {
  readonly body = contentChild.required(TemplateRef);
  readonly injector = inject(Injector);
}
```
```html
<app-panel>
  <ng-template><app-probe /></ng-template>
</app-panel>
```
- Costs a bit more markup on both sides than `<ng-content>`.

### Per-instance service (isolation / edit sessions)
```ts
@Service({autoProvided: false})
export class DraftStore {
  private original!: Draft;
  private current!: Draft;
  private api = inject(DraftApi);           // app-wide singleton
  set draft(d: Draft) { this.original = d; this.current = d.clone(); }
  get draft() { return this.current; }
  restore() { this.draft = this.original; }
  save() { this.draft = this.current; this.api.save(this.current).subscribe(); }
}

@Component({selector: 'app-draft-editor', templateUrl: './draft-editor.html', providers: [DraftStore]})
export class DraftEditor {
  readonly draft = input.required<Draft>();
  private store = inject(DraftStore);
  constructor() { effect(() => { this.store.draft = this.draft(); }); }
}
```
- Each `DraftEditor` instance gets its own `DraftStore`; it lives and dies with that instance.

### Specialized providers
- Root provides generic `CarService`, `EngineService`, `TiresService`; component B re-provides `CarService2`, `EngineService2`; nested component C re-provides `CarService3`. Resolving from C yields the car from C, the engine from B, tires from root.

### App-wide override
```ts
export const appConfig: ApplicationConfig = {
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}],
};
```

### Deferred lookup and callbacks
```ts
export class Loader {
  private injector = inject(Injector);
  private users = inject(UserApi);                     // preferred: capture at class level
  onLoad = input<() => void>();

  later() { setTimeout(() => this.injector.get(UserApi).fetch(), 1000); }
  run() { const cb = this.onLoad(); if (cb) runInInjectionContext(this.injector, cb); }
}
```

### Shared token
```ts
// config.token.ts
export interface ApiConfig { baseUrl: string }
export const API_CONFIG = new InjectionToken<ApiConfig>('api config');
// app.config.ts
providers: [{provide: API_CONFIG, useValue: {baseUrl: '/api'}}]
// consumer
protected config = inject(API_CONFIG);   // import the same instance
```

### Debug helpers
```ts
@Service()
export class UserApi {
  constructor() { console.log('UserApi created'); console.trace(); }  // count creations, see injection site
}

@Component({selector: 'app-probe', template: '…', providers: [UserApi]})
export class Probe {
  local = inject(UserApi, {self: true, optional: true});
  parent = inject(UserApi, {skipSelf: true, optional: true});
  available = inject(UserApi, {optional: true}) !== null;
}
```

### Debugging workflow
1. Read the error: code (`NG0200`, `NG0203`, …), the dependency path, the failing token. For `Path: A -> B -> C`, start investigating at the last entry (`C`).
2. Check basics: decorator present, `providedIn` correct when using `@Injectable`, imports correct, file is compiled.
3. Check injection context: no `inject()` after `await`, in `setTimeout`/`Promise.then`, in lifecycle hooks, or after destroy.
4. Use tools: Angular DevTools injector tree (is it provided? at which level? appearing in several component injectors means it is not a true singleton), constructor logs, optional injection.
5. Simplify: remove dependencies one at a time, test in a minimal component, check each injector level, build a reproduction.

## Pitfalls
- A service in a child component's `providers` is invisible to its parent and siblings; injecting it there fails.
- Services in a lazy route's `providers` do not exist for eagerly loaded components (the child injector is created only when the route loads).
- Route injectors and their services stay alive after navigating away until the app closes, unless automatic cleanup of unused route injectors is enabled.
- `inject()` inside `ngOnInit`, `ngAfterViewInit`, `ngOnDestroy`, after `await`, or inside timers/promise callbacks throws `NG0203`.
- Injecting an interface type fails: no runtime token exists.
- Two `InjectionToken`s with identical descriptions are distinct; a provider for one never satisfies the other.
- `@Injectable()` with no `providedIn` (and no `providers` entry) yields `NG0201`; so does an undecorated class or a standalone component relying on a service that is neither `@Service` nor in a reachable `providers` array.
- `self` plus `optional` returns `null` even when an ancestor provides the token, because the search never leaves the current element.
- `skipSelf` ignores the component's own `providers`/`viewProviders` entry for that token.
- Adding `host` to `skipSelf` for a token provided via `providers` returns `null`: the provider sits on the element, outside the child's `<#VIEW>` where `host` stops.
- `viewProviders` entries are hidden from `<ng-content>` children; they then fall back to whatever ancestors (e.g. root) provide.
- Destroying a component also destroys the service instances provided by it.
- A service provided per component is a singleton only relative to that component instance; multiple instances mean multiple services, which breaks shared-state expectations.
- `NG0200` arises from direct (A → B → A) or indirect (A → B → C → A) cycles, and from import cycles in files that also carry service dependencies.
- Providing `EnvironmentProviders` such as `provideHttpClient()` in component `providers` raises `NG0207`.

## Version notes
- No developer preview, experimental, or deprecated labels appear on these pages.
- The debugging page frames the "standalone components must import or provide their dependencies" requirement as applying to Angular v20+.
- `NgModule`/`ModuleInjector`, `@Injectable({providedIn})` and constructor decorators (`@Optional()`, `@Self()`, `@SkipSelf()`, `@Host()`) are documented as the `NgModule`-based / constructor-injection equivalents of `@Service()` and `inject()` options.
