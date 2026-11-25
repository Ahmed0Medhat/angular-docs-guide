# Testing

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/testing,
> Basics of testing components — https://angular.dev/guide/testing/components-basics,
> Testing services — https://angular.dev/guide/testing/services,
> Testing attribute directives — https://angular.dev/guide/testing/attribute-directives,
> Testing pipes — https://angular.dev/guide/testing/pipes,
> Debugging tests — https://angular.dev/guide/testing/debugging,
> Code coverage — https://angular.dev/guide/testing/code-coverage,
> Testing utility APIs — https://angular.dev/guide/testing/utility-apis.

## When to use
- Running and configuring unit tests in an Angular CLI project (`ng test`, Vitest, `angular.json` `test` options, global providers, CI, real-browser mode).
- Writing component tests with `TestBed`, `ComponentFixture`, `DebugElement` and `By` predicates.
- Testing services, replacing their dependencies with stubs and asserting calls with spies.
- Testing attribute directives through a host test component, and pipes as plain classes.
- Debugging failing specs (Node.js or browser) and generating / enforcing code coverage.
- Looking up `TestBed` static methods, fixture members and `DebugElement` members.
- See also: migrating from Karma / Karma setup → references/guide/testing-runners.md
- See also: component testing scenarios (nested components, `whenStable`, injected services) and Zone.js testing utilities → references/guide/testing-scenarios.md
- See also: testing `HttpClient`-based services → references/guide/http.md
- See also: zoneless change detection in `TestBed` → references/guide/zoneless.md
- See also: pipes in templates → references/guide/templates.md

## Rules
- PREFER the CLI default stack: new projects test with Vitest plus `jsdom` in Node.js; Karma remains supported.
- MUST keep the DOM emulator to `jsdom` or `happy-dom` (the only supported ones); to switch, install `happy-dom` and uninstall `jsdom`.
- MUST list new setup/provider TypeScript files (e.g. `src/test-providers.ts`) in the test tsconfig (usually `tsconfig.spec.json`) so they get compiled.
- AVOID expecting Angular team support for a custom `runnerConfig` file or third-party Vitest plugins; the CLI still overrides `test.projects` and `test.include`.
- MUST install a browser provider before using `browsers` / `--browsers`.
- NEVER use the `@vitest/browser-preview` provider in CI/CD; it targets WebContainer environments such as StackBlitz.
- PREFER letting CI set `CI=true` so `ng test` runs once without watch; otherwise pass `--no-watch --no-progress`.
- MUST install `@vitest/coverage-v8` before generating coverage reports.
- PREFER testing the component class alone when that validates the behavior simply; use DOM tests to check rendering, user interaction and parent/child integration.
- NEVER call `configureTestingModule()` or any `override...` method after `createComponent()` (or `TestBed.inject()`); the configuration is frozen for the current spec and `TestBed` throws.
- MUST call `TestBed.compileComponents()` only when tested components contain `@defer` blocks (asynchronously loaded resources); otherwise it is not needed.
- PREFER `await fixture.whenStable()` in `beforeEach` to wait for the initial render, so individual tests can stay synchronous.
- PREFER moving shared `TestBed` setup into `beforeEach()`, or a parameterised `setup()` function when tests need different providers.
- MUST call `TestBed` methods inside `beforeEach()` so each test starts fresh.
- PREFER `DebugElement.query(By.css(...))` when tests might run on a non-browser platform (e.g. server rendering) that may lack `querySelector`; PREFER plain `querySelector()` / `querySelectorAll()` when only checking browser native element properties.
- MUST unwrap a `DebugElement` query result via `.nativeElement` to reach the DOM element.
- PREFER `TestBed.inject(Service)` in `beforeEach` so every test gets a fresh, isolated instance.
- PREFER real dependencies (the `TestBed` default); swap in a stub with `{provide: Dep, useValue: stub}` only when the dependency is complex, slow or unpredictable.
- PREFER typing stubs with Vitest's `Mocked<T>` and creating methods with `vi.fn()`; reset call history (e.g. `mockClear()` in `afterEach`) when the stub is shared across tests.
- PREFER an artificial host test component that applies a directive in every supported way over testing a single real usage or class-only tests (directives touch the DOM).
- PREFER `By.directive(Dir)` to find elements carrying a directive when their element types are unknown.
- PREFER plain unit tests (`new Pipe()`, call `transform`) for pipes; no Angular testing utilities are needed. Add component DOM tests to confirm the pipe works as applied.
- MUST dispatch a DOM event (e.g. `new Event('input')`) after setting an input's value, then await `fixture.whenStable()`, so Angular sees the change.
- PREFER `nativeElement.dispatchEvent(event)` when `triggerEventHandler` finds no listener or otherwise fails.
- MUST call `initTestEnvironment` at most once per run (the testing shims already do it); call `resetTestEnvironment` first to change it mid-run.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `ng test` | Build in watch mode and run Vitest | Re-runs on save |
| `ng test --coverage` | Write coverage report to `coverage/` | Open `coverage/index.html` |
| `ng test --browsers=chromium` | Run in a real browser | Headed by default; headless when `CI` is set or name ends in `Headless` (`chromiumHeadless`, `chromeHeadless`) |
| `ng test --debug` | Start runner waiting for a debugger | Node.js debugger (VS Code, Chrome DevTools for Node) or browser devtools in browser mode |
| `ng test --no-watch --no-progress` | Force single run | For CI without `CI=true` |
| `ng generate config vitest` | Create `vitest-base.config.mts` | Use with `runnerConfig` |
| `include` (angular.json `test`) | Test file globs | Default `['**/*.spec.ts', '**/*.test.ts']` |
| `exclude` | Globs to skip | |
| `setupFiles` | Global setup files (polyfills, global mocks) run before tests | |
| `providersFile` | File default-exporting `(Provider \| EnvironmentProviders)[]` for all tests | e.g. `provideHttpClientTesting()` |
| `coverage` | Enable coverage on every run | Default `false` |
| `browsers` | Browser names for real-browser runs | Needs a provider |
| `runnerConfig` | Custom Vitest config file | Unsupported contents; CLI overrides `test.projects`, `test.include` |
| `coverageThresholds` | `{statements, branches, functions, lines}` minimums | Run fails when below |
| `coverageInclude` / `coverageExclude` | Globs for files in / out of the report | |
| `coverageReporters` | Reporter list, e.g. `["html", "lcov"]` (`json` too) | |
| `coverageWatermarks` | `[low, high]` per metric for HTML reporter colors | |
| `@vitest/browser-playwright` + `playwright` | Browser provider | Chromium, Firefox, WebKit |
| `@vitest/browser-webdriverio` + `webdriverio` | Browser provider | Chrome, Firefox, Safari, Edge |
| `@vitest/browser-preview` | Browser provider | WebContainers only, not CI/CD |
| `TestBed.configureTestingModule(meta)` | Refine the default testing module | `TestModuleMetadata`: `providers?`, `declarations?`, `imports?`, `schemas?` |
| `TestBed.compileComponents()` | Async compile after configuring | Required only with async resources like `@defer` |
| `TestBed.createComponent<T>(C)` | Instantiate component, attach host element to DOM, return `ComponentFixture<T>` | Freezes configuration |
| `TestBed.createDirective()` | Create a directive alone | Returns a `DirectiveFixture` |
| `TestBed.inject(Token, notFound?)` | Get a service from the `TestBed` injector | Second arg returned if no provider (e.g. `null`); freezes configuration |
| `TestBed.overrideComponent/Directive/Pipe/Module` | Replace metadata, even deep in inner modules | Takes `MetadataOverride<T>` = `{add?, remove?, set?}` (each `Partial<T>`) |
| `TestBed.initTestEnvironment` | Set default testing module and `PlatformRef` for the run | Shims call it; non-browser variants in `@angular/platform-<name>/testing` |
| `TestBed.resetTestEnvironment` | Reset env incl. default testing module | |
| `inject` (standalone) | Inject services from the `TestBed` injector into a test function | Cannot get services provided by the component itself; throws if unprovidable |
| `getTestBed()` | Current `TestBed` instance | Rarely needed; exposes a few instance-only members |
| `fixture.componentInstance` | Component class instance | |
| `fixture.nativeElement` | Root DOM element | Typed `any`; shortcut for `debugElement.nativeElement` |
| `fixture.debugElement` | `DebugElement` for the root | Query/walk the tree |
| `fixture.componentRef.setInput(name, v)` | Set a component input | Then `await whenStable()` |
| `fixture.changeDetectorRef` | Host view's `ChangeDetectorRef` (not the component's) | |
| `fixture.detectChanges(checkNoChanges = true)` | Run change detection (first call runs `ngOnInit`) | Runs `checkNoChanges` afterwards unless passed `false` |
| `fixture.autoDetectChanges` | Automatic change detection | Default `true` with zoneless (the `TestBed` default), `false` with Zone-based |
| `fixture.checkNoChanges()` | Throw if changes are pending | |
| `fixture.isStable()` | `false` while async tasks are pending | |
| `fixture.whenStable()` | Promise resolved when stable | Await after async work / async CD |
| `fixture.destroy()` | Destroy the component | |
| `de.nativeElement` | Underlying platform element | Typed `any` |
| `de.query(pred)` / `de.queryAll(pred)` | First / all matching `DebugElement`s at any depth | Predicate: any fn of `DebugElement` returning truthy |
| `de.injector` | Element's host injector | `de.injector.get(Directive)` gets the directive instance |
| `de.componentInstance` | Element's own component, if any | |
| `de.context` | Parent context (often owning component) | In `@for`, a `RepeaterContext` whose `$implicit` is the row item |
| `de.children` / `de.childNodes` | Child `DebugElement`s / `DebugNode`s | Plain nodes usually ignorable |
| `de.parent` | Parent `DebugElement` | `null` at root |
| `de.name` | Tag name | |
| `de.triggerEventHandler(name, eventObj)` | Invoke a listener in `listeners` | |
| `de.listeners` | Callbacks for outputs / element events | |
| `de.providerTokens` | Injector lookup tokens (component + its `providers`) | |
| `de.references` | Template reference variables by name | e.g. `de.references['content']` |
| `de.styles` / `de.properties` | Element styles / properties | Work without a real browser |
| `By.all()` | Match every element | `@angular/platform-browser` |
| `By.css(selector)` | Match CSS selector | Supports `:not(...)` |
| `By.directive(Dir)` | Match elements Angular bound to `Dir` | |

## Patterns

### Global test providers
```ts
// src/test-providers.ts  (reference via "providersFile" in angular.json test options)
import {EnvironmentProviders, Provider} from '@angular/core';
import {provideHttpClientTesting} from '@angular/common/http/testing';

const providers: (Provider | EnvironmentProviders)[] = [provideHttpClientTesting()];
export default providers;
```

### angular.json test target (builder `@angular/build:unit-test`)
```json
{
  "test": {
    "builder": "@angular/build:unit-test",
    "options": {
      "providersFile": "src/test-providers.ts",
      "runnerConfig": "vitest-base.config.mts",
      "coverage": true,
      "coverageReporters": ["html", "lcov"],
      "coverageThresholds": {"statements": 80, "branches": 80, "functions": 80, "lines": 80},
      "coverageWatermarks": {"statements": [50, 80], "branches": [50, 80], "functions": [50, 80], "lines": [50, 80]}
    }
  }
}
```

### Component test basics
```ts
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';

describe('Card', () => {
  let fixture: ComponentFixture<Card>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Card);
    await fixture.whenStable(); // initial render
  });

  it('creates', () => expect(fixture.componentInstance).toBeDefined());

  it('renders text (native)', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('p')!.textContent).toEqual('card works!');
  });

  it('renders text (platform-safe)', () => {
    const pDe: DebugElement = fixture.debugElement.query(By.css('p'));
    expect((pDe.nativeElement as HTMLElement).textContent).toEqual('card works!');
  });
});

// Alternative to beforeEach: customizable setup
function setup(providers?: Provider[]): ComponentFixture<Card> {
  TestBed.configureTestingModule({providers});
  return TestBed.createComponent(Card);
}
```

### Service with stub and spy
```ts
import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it, vi, type Mocked} from 'vitest';

const rateStub: Mocked<RateLookup> = {rate: vi.fn()};

describe('Checkout', () => {
  let checkout: Checkout;

  beforeEach(() => {
    rateStub.rate.mockReturnValue(5);
    TestBed.configureTestingModule({
      providers: [{provide: RateLookup, useValue: rateStub}],
    });
    checkout = TestBed.inject(Checkout); // fresh instance per test
  });

  afterEach(() => rateStub.rate.mockClear());

  it('adds the rate', () => expect(checkout.total(100)).toBe(105));
  it('delegates once', () => {
    checkout.total(100);
    expect(rateStub.rate).toHaveBeenCalledExactlyOnceWith(100);
  });
});
```
Services decorated with `@Service()` are injectable via `TestBed.inject` without extra providers.

### Attribute directive via host test component
```ts
@Component({
  imports: [Highlight],
  template: `
    <h2 highlight="yellow">Yellow</h2>
    <h2 highlight>Default</h2>
    <h2>None</h2>
    <input #box [highlight]="box.value" value="cyan" />
  `,
})
class Host {}

let fixture: ComponentFixture<Host>;
let des: DebugElement[];

beforeEach(async () => {
  fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  des = fixture.debugElement.queryAll(By.directive(Highlight));
});

it('uses default color', () => {
  const dir = des[1].injector.get(Highlight);
  expect(des[1].nativeElement.style.backgroundColor).toBe(dir.defaultColor);
});

it('follows input value', async () => {
  const input = des[2].nativeElement as HTMLInputElement;
  input.value = 'green';
  input.dispatchEvent(new Event('input'));
  await fixture.whenStable();
  expect(input.style.backgroundColor).toBe('green');
});

it('leaves bare h2 alone', () => {
  const bare = fixture.debugElement.query(By.css('h2:not([highlight])'));
  expect(bare.styles.backgroundColor).toBeUndefined();
});
```

### Driving a directive through a host input
```ts
@Component({
  imports: [Highlight],
  template: `<p [highlight]="color()">{{ color() }}</p>`,
})
class Host {
  readonly color = input('');
}

it('applies the given color', async () => {
  const fixture = TestBed.createComponent(Host);
  fixture.componentRef.setInput('color', 'blue');
  await fixture.whenStable();
  expect(fixture.nativeElement.querySelector('p').style.backgroundColor).toBe('blue');
});
```

### Pipe as a plain class
```ts
describe('TitleCasePipe', () => {
  const pipe = new TitleCasePipe(); // pure + stateless: no beforeEach needed
  it('capitalizes words', () => expect(pipe.transform('abc def')).toBe('Abc Def'));
});
```

### Custom DebugElement predicate
```ts
const withContentRef = fixture.debugElement.queryAll((de) => de.references['content']);
```

## Pitfalls
- Reconfiguring `TestBed` after `createComponent` or `TestBed.inject` throws; configuration is locked for the rest of that spec.
- `nativeElement` (fixture and `DebugElement`) is typed `any`; on non-browser platforms it may have a reduced API or not exist.
- `querySelector`-based tests can fail on a server renderer lacking that API; `DebugElement` query methods work on all supported platforms.
- `By.css(...)` returns a `DebugElement`, not the DOM node; unwrap with `.nativeElement`.
- Setting `input.value` alone does not update bindings; dispatch an `input` event and await stability.
- With Zone-based change detection, `autoDetectChanges` defaults to `false`; even when it is on, directly mutating component properties may still need `fixture.detectChanges()`.
- `detectChanges()` follows up with `checkNoChanges`, which throws on pending changes; pass `false` to skip.
- `fixture.changeDetectorRef` belongs to the host view, not the component.
- `TestBed.inject` throws for an unprovided token unless you pass a fallback second argument.
- The standalone `inject` helper cannot reach services the component provides itself; use `debugElement.injector`.
- `triggerEventHandler` only fires listeners registered in `listeners`; fall back to `dispatchEvent` otherwise.
- Calling `initTestEnvironment` twice without `resetTestEnvironment` is unsupported.
- Coverage below `coverageThresholds` makes `ng test` fail.
- A shared `vi.fn()` stub keeps call history across tests unless cleared.
- Testing one real usage of a directive (or every component using it) gives poor coverage and is brittle; class-only directive tests skip the DOM.
- Isolated pipe tests cannot prove the pipe works inside component templates.
- The Testing utility APIs page is partly written for Karma/Jasmine and is still being updated for Vitest.

## Version notes
- None stated in the docs (no developer preview, experimental or deprecated labels on these pages).
- Context: Vitest with `jsdom` is the default for new CLI projects; Karma remains supported.
- Context: `autoDetectChanges` defaults to `true` under zoneless change detection, which is the `TestBed` default.
