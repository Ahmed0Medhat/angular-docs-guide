# Component Testing Scenarios

> Sources (angular.dev, v22.3 @ bd1e32b): Component testing scenarios — https://angular.dev/guide/testing/components-scenarios,
> Zone.js Testing Utilities — https://angular.dev/guide/testing/zone-js-testing-utilities.

## When to use
- Asserting that template bindings render the expected text after change detection (`fixture.whenStable()`).
- Driving inputs/outputs of a component under test: `setInput`, `inputBinding`/`outputBinding`, or a dedicated test host component.
- Replacing service dependencies (root or component-level) with stubs, spies or HTTP mocks.
- Testing async services with Vitest fake timers (or legacy zone.js `fakeAsync`/`tick`).
- Testing routing and routed components with `RouterTestingHarness`, and checking `RouterLink` wiring.
- Shallow-testing a component with deep child trees (stub components, `NO_ERRORS_SCHEMA`) and organizing DOM access with a `Page` object.
- See also: lifecycle hooks run during the first data binding → references/guide/components.md
- See also: mocking HTTP with `HttpTestingController` → references/guide/http.md
- See also: `TestBed` / `ComponentFixture` API summary and `MetadataOverride` → references/guide/testing.md
- See also: adding the `zone.js/plugins/vitest-patch` polyfill → references/guide/testing-runners.md

## Rules
- MUST wait for change detection (`await fixture.whenStable()`) before asserting on bound DOM content; `TestBed.createComponent` does not bind synchronously.
- PREFER changing component state (e.g. `component.title.set(...)`) before the first `whenStable()` when a test needs non-default initial state; data binding and lifecycle hooks have not run yet.
- MUST call `dispatchEvent(new Event('input'))` after setting a native `<input>`'s `value`; Angular does not read the property until that event fires.
- PREFER `TestBed.inject(Service)` to get a service when the only provider is the root/testing module; it is shorter than going through the fixture.
- MUST get a service from the component's own injector (`fixture.debugElement.injector.get(...)` / `routeDebugElement.injector.get(...)`) when the component provides it itself; that is the approach that always works.
- PREFER test doubles only sparingly: they make the test diverge from production behavior.
- AVOID making real remote-server calls from tests; emulate them instead.
- PREFER returning mock responses at the HTTP layer with `HttpTestingController` when the async service is built on `HttpClient`.
- PREFER a stubbed service class (via `{provide, useClass}`) or spies when HTTP-level mocking is not possible.
- PREFER native async testing or Vitest/Jasmine fake timers (mock clocks) over `fakeAsync`, which is no longer recommended.
- MUST load `zone.js` to use `fakeAsync`; under Vitest add the `zone.js/plugins/vitest-patch` polyfill.
- MUST reset fake timers with `vi.useRealTimers()` at the end of a test that called `vi.useFakeTimers()`.
- PREFER testing a child component either standalone (set inputs, subscribe to outputs) or inside a small test host, rather than through its real parent.
- PREFER a reusable `click()` helper so clicks on buttons, anchors and other elements are triggered consistently.
- MUST pass a realistic event object (e.g. `{button: 0}`) to `triggerEventHandler` for handlers that read it, such as `RouterLink`.
- MUST import (or stub) every component used in a template, or the compiler errors on unknown tags such as `<app-banner>` or `<router-outlet>`.
- PREFER stub components with matching selectors and empty templates for irrelevant children; give them minimal templates/classes if the test must interact with them.
- AVOID overusing `NO_ERRORS_SCHEMA`; it is the simplest shallow-testing option but hides typos and missing components.
- PREFER combining stubs and `NO_ERRORS_SCHEMA` in one setup in practice.
- MUST override component-level providers with `TestBed.overrideComponent(...)`; `configureTestingModule({providers})` only configures the fixture-level injector.
- PREFER a `Page` class with lazy getter properties to centralize element queries and setters in complex templates.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `TestBed.createComponent(Cmp, {bindings?})` | Creates the component and returns a `ComponentFixture` | Does not run change detection synchronously; `bindings` accepts `inputBinding`/`outputBinding` |
| `fixture.whenStable()` | Await until change detection has run | Use before DOM assertions |
| `fixture.componentInstance` | The component class instance | |
| `fixture.nativeElement` | Host DOM element; use `querySelector` | |
| `fixture.debugElement` | `DebugElement` for the host | `.injector`, `.query`, `.queryAll` |
| `fixture.componentRef.setInput(name, value)` | Set an input as a parent would | Works with `input.required()` |
| `inputBinding(name, signal)` | Bind a signal to an input at creation | From `@angular/core` |
| `outputBinding(name, fn)` | Listen to an output at creation | From `@angular/core` |
| `TestBed.inject(Token)` | Resolve from the root test injector | Not for component-provided services |
| `debugElement.injector.get(Token)` | Resolve from that element's injector (component or directive instance) | Always reaches component-level providers |
| `debugElement.query(By.css(sel))` / `queryAll(...)` | Find `DebugElement`s by CSS | |
| `By.directive(Dir)` | Find elements with a given directive attached | Returns `DebugElement` wrappers |
| `debugElement.triggerEventHandler(name, eventObj?)` | Invoke any data-bound event handler by event name | 2nd arg is the event object passed to the handler |
| `HTMLElement.click()` | Native click | Fine when the handler ignores the event |
| `OutputEmitterRef.subscribe(fn)` | Listen to an `output()` in a test | Notifies synchronously |
| `TestBed.configureTestingModule({providers})` | Fixture-level providers (stubs, `provideRouter`, `provideHttpClientTesting()`) | Cannot replace component `providers` |
| `TestBed.overrideComponent(Cmp, MetadataOverride)` | Replace/add/remove component metadata (`imports`, `providers`, `schemas`, …) | Callable multiple times, for one or many components |
| `MetadataOverride<T>` | `{add?: Partial<T>; remove?: Partial<T>; set?: Partial<T>}` | `set` resets the whole property |
| `TestBed.overrideDirective` / `overrideModule` / `overridePipe` | Same idea for directives, NgModules, pipes | |
| `NO_ERRORS_SCHEMA` | Compiler ignores unknown elements and attributes | Unknown tags render empty |
| `RouterTestingHarness.create()` | Harness to navigate and render routed components | `await` it |
| `harness.navigateByUrl(url, Cmp)` | Navigate and return the activated component instance | |
| `harness.routeDebugElement` / `routeNativeElement` | Debug/native element of the routed component | Nullable (`!`) |
| `harness.fixture` / `harness.detectChanges()` | Underlying fixture; run change detection | |
| `HttpTestingController.expectOne(urlOrMatch).flush(body)` | Assert a pending request and answer it | Matcher may be `{method, url}` |
| `Router.url` / `Router.resetConfig(routes)` | Read current URL; swap route config in a test | |
| `vi.useFakeTimers()` / `vi.runAllTimersAsync()` / `vi.useRealTimers()` | Vitest mock clock: flush timers and promises | Rendering is async under fake timers, so flush |
| `vi.fn(impl)` | Spy method in a stub | Assert with `toHaveBeenCalledTimes` |
| `expect(value, label)` | Optional 2nd arg labels a failing expectation | Vitest appends it to the failure message |
| `waitForAsync(fn)` | Test completes only once no micro/macrotasks remain in the test zone | zone.js |
| `fakeAsync(fn)` | Runs the test body in a fakeAsync zone for linear-style async code | zone.js; no longer recommended |
| `tick(ms?)` | Advance the virtual clock, flushing timer and microtask queues | zone.js; inside `fakeAsync` only |
| `discardPeriodicTasks()` | Drop periodic tasks (e.g. `setInterval`) created in the fakeAsync zone | zone.js |
| `flushMicrotasks()` | Flush the microtask queue so expected pending promises don't fail the test | zone.js |

## Patterns

### Wait for binding, optionally mutate state first
```ts
beforeEach(() => {
  fixture = TestBed.createComponent(Banner);
  comp = fixture.componentInstance;
  heading = fixture.nativeElement.querySelector('h1');
});

it('is empty before change detection', () => {
  expect(heading.textContent).toEqual('');
});

it('renders a custom title', async () => {
  comp.title.set('Custom');
  await fixture.whenStable();
  expect(heading.textContent).toContain('Custom');
});
```

### Signal inputs / outputs at creation
```ts
import {inputBinding, outputBinding, signal} from '@angular/core';

const value = signal(1);
const fixture = TestBed.createComponent(Counter, {
  bindings: [inputBinding('value', value), outputBinding('valueChange', (v) => log.push(v))],
});
```

### Simulating typing into an input
```ts
const input: HTMLInputElement = fixture.nativeElement.querySelector('input')!;
input.value = 'quick BROWN  fOx';
input.dispatchEvent(new Event('input')); // let Angular see the new value
await fixture.whenStable();
expect(fixture.nativeElement.querySelector('span')!.textContent).toBe('Quick Brown  Fox');
```

### Getting injected services
```ts
// root / testing-module provider
auth = TestBed.inject(AuthState);
// whatever instance the component actually received (works for component providers too)
auth = fixture.debugElement.injector.get(AuthState);

it('asks to log in when logged out', async () => {
  auth.isLoggedIn.set(false); // before first render
  await fixture.whenStable();
  expect(el.textContent, 'login prompt').toMatch(/log in/i);
});
```

### Stub service via `useClass`
```ts
class QuotesStub implements Quotes {
  getQuote() { return of('Test Quote'); } // synchronous observable
  // ...rest of the API
}

TestBed.configureTestingModule({providers: [{provide: Quotes, useClass: QuotesStub}]});
fixture = TestBed.createComponent(QuoteView);
await fixture.whenStable();
```

### Async errors with Vitest fake timers
```ts
it('shows an error when the service fails', async () => {
  class FailingQuotes implements Quotes {
    getQuote() {
      return defer(() => new Promise<string>((_, reject) => setTimeout(() => reject('boom failure'))));
    }
  }
  TestBed.configureTestingModule({providers: [{provide: Quotes, useClass: FailingQuotes}]});

  vi.useFakeTimers();
  const fixture = TestBed.createComponent(QuoteView);
  await vi.runAllTimersAsync(); // flush render + timers

  expect(fixture.nativeElement.querySelector('.error')!.textContent).toMatch(/failure/);
  expect(fixture.nativeElement.querySelector('.quote')!.textContent).toBe('...');
  vi.useRealTimers();
});
```

### Controlled emissions with a Subject-backed mock
```ts
class ControlledQuotes implements Quotes {
  private subject = new Subject<string>();
  getQuote() { return this.subject.asObservable(); }
  emit(v: string) { this.subject.next(v); }
}

vi.useFakeTimers();
TestBed.configureTestingModule({providers: [{provide: Quotes, useClass: ControlledQuotes}]});
const fixture = TestBed.createComponent(QuoteView);
const quotes = TestBed.inject(Quotes) as ControlledQuotes;
await vi.runAllTimersAsync();
expect(fixture.nativeElement.querySelector('.quote').textContent).toBe('...'); // placeholder
quotes.emit('Real quote');
await vi.runAllTimersAsync();
vi.useRealTimers();
```

### Standalone child: set input, catch output
```ts
beforeEach(async () => {
  fixture = TestBed.createComponent(HeroCard);
  comp = fixture.componentInstance;
  cardDe = fixture.debugElement.query(By.css('.hero'));
  fixture.componentRef.setInput('hero', expected);
  await fixture.whenStable();
});

it('emits selected on click', () => {
  let picked: Hero | undefined;
  comp.selected.subscribe((h) => (picked = h));
  cardDe.triggerEventHandler('click'); // or cardDe.nativeElement.click()
  expect(picked).toBe(expected);
});
```

### Reusable click helper (sample code, not an Angular API)
```ts
export const ButtonClickEvents = {left: {button: 0}, right: {button: 2}};

export function click(el: DebugElement | HTMLElement, eventObj: any = ButtonClickEvents.left): void {
  if (el instanceof HTMLElement) el.click();
  else el.triggerEventHandler('click', eventObj);
}
```

### Test host component
```ts
@Component({
  imports: [HeroCard],
  template: `<hero-card [hero]="hero" (selected)="onSelected($event)" />`,
})
class Host {
  hero: Hero = {id: 42, name: 'Test Name'};
  picked: Hero | undefined;
  onSelected(h: Hero) { this.picked = h; }
}

beforeEach(async () => {
  fixture = TestBed.createComponent(Host); // also creates HeroCard
  host = fixture.componentInstance;
  cardEl = fixture.nativeElement.querySelector('.hero');
  await fixture.whenStable();
});

it('bubbles selection to host', () => {
  click(cardEl);
  expect(host.picked).toBe(host.hero);
});
```

### Routing component with `RouterTestingHarness`
```ts
beforeEach(async () => {
  TestBed.configureTestingModule({
    providers: [provideRouter([{path: '**', component: Dashboard}]), provideHttpClientTesting(), HeroService],
  });
  harness = await RouterTestingHarness.create();
  comp = await harness.navigateByUrl('/', Dashboard);
  TestBed.inject(HttpTestingController).expectOne('api/heroes').flush(testHeroes);
});

it('navigates on hero select', () => {
  const de = harness.routeDebugElement!.query(By.css('dashboard-hero'));
  de.triggerEventHandler('selected', comp.heroes[0]);
  expect(TestBed.inject(Router).url).toEqual(`/heroes/${comp.heroes[0].id}`);
});
```

### Routed component reading params
```ts
constructor() {
  // id may change during the component's lifetime: subscribe
  this.route.paramMap.subscribe((p) => this.load(p.get('id')));
}
// test: drive different ids via harness.navigateByUrl(`/heroes/${id}`, HeroDetail)
```

### Shallow testing: stubs, schema, or both
```ts
@Component({selector: 'app-banner', template: ''}) class BannerStub {}
@Component({selector: 'router-outlet', template: ''}) class OutletStub {}

// stubs only: `set` replaces ALL imports, so re-list real deps too
TestBed.configureTestingModule({providers: [provideRouter([]), AuthState]})
  .overrideComponent(App, {set: {imports: [RouterLink, BannerStub, OutletStub]}});

// schema only
TestBed.overrideComponent(App, {set: {imports: [], schemas: [NO_ERRORS_SCHEMA]}});

// combined: remove the heavy children, ignore their tags
TestBed.overrideComponent(App, {
  remove: {imports: [RouterOutlet, Welcome]},
  set: {schemas: [NO_ERRORS_SCHEMA]},
});
```

### Checking `RouterLink`s via `By.directive`
```ts
beforeEach(async () => {
  await fixture.whenStable();
  linkDes = fixture.debugElement.queryAll(By.directive(RouterLink));
  links = linkDes.map((de) => de.injector.get(RouterLink));
});

it('has the expected hrefs', () => {
  expect(links.map((l) => l.href)).toEqual(['/dashboard', '/heroes', '/about']);
});

it('navigates on click', async () => {
  TestBed.inject(Router).resetConfig([{path: '**', children: []}]);
  linkDes[1].triggerEventHandler('click', {button: 0});
  await fixture.whenStable();
  expect(TestBed.inject(Router).url).toBe('/heroes');
});
```

### `Page` object
```ts
class Page {
  // getters query lazily, at access time
  get buttons() { return this.all<HTMLButtonElement>('button'); }
  get saveBtn() { return this.buttons[0]; }
  get nameInput() { return this.one<HTMLInputElement>('input'); }
  private one<T>(sel: string) { return harness.routeNativeElement!.querySelector(sel)! as T; }
  private all<T>(sel: string) { return harness.routeNativeElement!.querySelectorAll(sel) as any as T[]; }
}

async function setup(id: number) {
  harness = await RouterTestingHarness.create();
  component = await harness.navigateByUrl(`/heroes/${id}`, HeroDetail);
  page = new Page();
  TestBed.inject(HttpTestingController).expectOne(`api/heroes/?id=${id}`).flush(found ? [found] : []);
  await harness.fixture.whenStable();
}
```

### Overriding component-level providers with a spy stub
```ts
class DetailServiceSpy {
  testHero: Hero = {...testHero};
  getHero = vi.fn(() => asyncData({...this.testHero}));
  saveHero = vi.fn((h: Hero) => asyncData(Object.assign(this.testHero, h)));
}

beforeEach(async () => {
  await TestBed.configureTestingModule({
    providers: [
      provideRouter([{path: 'heroes/:id', component: HeroDetail}]),
      {provide: HeroDetailService, useValue: {}}, // ignored by the component
    ],
  }).overrideComponent(HeroDetail, {
    set: {providers: [{provide: HeroDetailService, useClass: DetailServiceSpy}]},
  });

  harness = await RouterTestingHarness.create();
  component = await harness.navigateByUrl(`/heroes/${testHero.id}`, HeroDetail);
  spy = harness.routeDebugElement!.injector.get(HeroDetailService) as any;
  harness.detectChanges();
});

it('loads once', () => expect(spy.getHero).toHaveBeenCalledTimes(1));
```

## Pitfalls
- Asserting right after `createComponent` sees an empty DOM (e.g. `expected '' to contain ...`): no change detection has happened yet.
- Setting `input.value` without dispatching an `input` event leaves Angular unaware of the change.
- Providers passed to `configureTestingModule` do not reach services listed in a component's own `providers`: the component gets a child injector and keeps creating real instances; such tests can fail or time out if the real service calls a remote server.
- `TestBed.inject()` cannot see component-level providers; read them from the component's `DebugElement` injector.
- `triggerEventHandler('click')` without an event object breaks handlers that need one; `RouterLink` throws when the event (with a `button` field) is missing.
- `overrideComponent(..., {set: {imports}})` replaces every import: re-list real dependencies (e.g. `RouterLink`) alongside stubs, or use `add`/`remove`.
- `NO_ERRORS_SCHEMA` silences errors for misspelled or accidentally omitted components/attributes, which can cost hours of debugging.
- A stub returning `of(...)` emits synchronously, unlike the real async service; with async stubs most tests must be async too.
- Under Vitest fake timers, rendering is not synchronous: flush with `await vi.runAllTimersAsync()` before asserting.
- With an `AsyncPipe` + `startWith('...')`, the first render shows the placeholder until the observable emits.
- A `fakeAsync` test that ends with pending microtasks (e.g. unresolved promises) fails with an explicit error; call `flushMicrotasks()` when they are expected.
- The `click()` helper is sample code from the guide, not one of the Angular testing utilities.

## Version notes
- `fakeAsync` (zone.js): no longer recommended; prefer native async tests or Vitest/Jasmine fake timers.
- No API on these pages carries a developer preview, experimental or deprecated label.
