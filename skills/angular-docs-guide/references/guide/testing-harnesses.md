# Component Test Harnesses

> Sources (angular.dev, v22.3 @ bd1e32b): Component harnesses overview — https://angular.dev/guide/testing/component-harnesses-overview,
> Using component harnesses in tests — https://angular.dev/guide/testing/using-component-harnesses,
> Creating harnesses for your components — https://angular.dev/guide/testing/creating-component-harnesses,
> Adding harness support for additional testing environments — https://angular.dev/guide/testing/component-harnesses-testing-environments.

## When to use
- Interacting with a third-party or shared widget (menu, dialog, slider) in a unit test without depending on its DOM structure or CSS classes (test author).
- Reusing one interaction API across `TestBed` unit tests and WebDriver end-to-end tests.
- Publishing a harness alongside a reusable component library so consumers get a supported testing API (harness author).
- Finding overlay/pop-up content attached to `document.body`, outside the fixture or host element.
- Controlling change detection timing while an async action is in flight (`manualChangeDetection`, `parallel`).
- Plugging harnesses into a testing environment other than TestBed or WebDriver (harness environment author).
- See also: content projection with `ng-content` → references/guide/components.md
- See also: change detection and runtime performance → references/best-practices/performance.md

## Rules
- MUST install `@angular/cdk` (`ng add @angular/cdk`) before using or writing harnesses.
- PREFER creating harnesses for shared, interactive components used in many places (widget libraries, common app components).
- AVOID writing harnesses for components that live in a single place (e.g. one app page); tests may lean on implementation details there, unless the harness would serve both unit and e2e tests.
- MUST extend `ComponentHarness` and define a static `hostSelector` in every custom harness.
- PREFER making `hostSelector` identical to the selector of the matching `Component`/`Directive`.
- PREFER adding a static `with()` method to each harness that returns a `HarnessPredicate` for that class.
- MUST extend `BaseHarnessFilters` (adding optional properties) when a harness needs extra filter options beyond `selector`/`ancestor`.
- MUST perform all DOM interaction inside harnesses through `TestElement`; `document.querySelector()` and similar do not work across environments.
- NEVER expose `TestElement` instances for internal elements to harness users; only expose elements the consumer defines directly (such as the host element).
- PREFER narrow, user-action/state methods (`toggle()`, `isOpen()`) over returning raw elements; keep element locators `protected`.
- PREFER storing `locatorFor*` results as functions and calling them on demand; never cache found elements, since `@if` and similar can replace DOM nodes.
- MUST use `loader` for elements inside the fixture root and `documentRootLoader` for elements appended outside it (e.g. CDK `Overlay` content).
- PREFER `await` on every harness call for readable tests; nearly all harness methods return a `Promise`.
- PREFER `parallel(() => [...])` over sequential awaits when reading several values at once; it batches change detection.
- PREFER `ContentContainerComponentHarness` (or `harnessLoaderFor*`) for components with `<ng-content>` so users can load harnesses for projected content.
- MUST use `documentRootLocatorFactory()` inside a harness to reach content the component renders outside its host (overlay).
- MUST call `waitForTasksOutsideAngular()` explicitly when tasks were scheduled with `NgZone.runOutsideAngular()`; it is not automatic.
- MUST (environment authors) implement `TestElement` and a `HarnessEnvironment<E>` subclass with every abstract member.
- PREFER (environment authors) a protected constructor plus a static `loader(...)` returning a `HarnessLoader`.
- MUST (environment authors) keep a mapping from `TestKey` codes to the environment's own key codes for `sendKeys`.
- MUST (environment authors) install an auto change detection handler to support `manualChangeDetection` and `parallel`.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `ComponentHarness` | Abstract base class for all harnesses | Requires static `hostSelector` |
| `static hostSelector` | CSS selector matching the harness to component instances in the DOM | Usually equals the component selector |
| `static with(options)` | Harness-provided factory returning a `HarnessPredicate` | Convention, not required |
| `host()` | Gets the component host as a `TestElement` | Async |
| `locatorFor(q)` | Creates a function that finds the first match | Accepts a selector, harness class, or `HarnessPredicate` |
| `locatorForOptional(q)` | Creates a function that finds the first match, if any (falsy when absent) | Same query kinds |
| `locatorForAll(q)` | Creates a function that finds all matches | Same query kinds |
| `harnessLoaderFor(sel)` / `harnessLoaderForOptional(sel)` / `harnessLoaderForAll(sel)` | Create `HarnessLoader`s scoped to inner elements (e.g. the `<ng-content>` wrapper) | On `ComponentHarness` and `LocatorFactory` |
| `documentRootLocatorFactory()` | `LocatorFactory` rooted at the document root | For overlay/pop-up content |
| `forceStabilize()` | Runs an extra change detection + `NgZone` stabilization round | Needed by some animations |
| `waitForTasksOutsideAngular()` | Waits for tasks outside `NgZone` | Not done automatically |
| `ContentContainerComponentHarness<S>` | Base class adding loader support for projected content | `S` = selector string type |
| `TestElement` | Environment-agnostic element: `click()`, `blur()`, `getAttribute()`, `text()`, `sendKeys()`, ... | All methods async |
| `TestKey` | Enum of key codes for `sendKeys` | Environments map to native codes |
| `HarnessLoader.getHarness(q)` | First matching harness | `q` = harness class or `HarnessPredicate` |
| `HarnessLoader.getAllHarnesses(q)` | All matching harnesses | |
| `HarnessLoader.getHarnessAtIndex(q, i)` | Match at a given index | |
| `HarnessLoader.countHarnesses(q)` | Number of matches | |
| `HarnessLoader.hasHarness(q)` | Whether at least one match exists | |
| `HarnessLoader.getChildLoader(sel)` / `getAllChildLoaders(sel)` | Loaders rooted at the first / every matching child element | |
| `HarnessPredicate(HarnessClass, options)` | Query filtering harness instances | Base filters: `selector`, `ancestor` |
| `HarnessPredicate.addOption(name, value, fn)` / `.add(...)` | Attach filter conditions | Convenience methods |
| `HarnessPredicate.stringMatches(value, pattern)` | Compare text against `string` or `RegExp` | Static helper |
| `BaseHarnessFilters` | Base filter interface (`selector`, `ancestor`) | Extend for custom options |
| `TestbedHarnessEnvironment.loader(fixture)` | Loader at the fixture's root element | `@angular/cdk/testing/testbed` |
| `TestbedHarnessEnvironment.documentRootLoader(fixture)` | Loader at the document root | For elements outside the fixture |
| `TestbedHarnessEnvironment.harnessForFixture(fixture, Harness)` | Harness for the fixture root component directly | |
| `UnitTestElement` | TestBed `TestElement` implementation | Reference implementation |
| `SeleniumWebDriverHarnessEnvironment.loader(driver)` | Loader for the current document in WebDriver e2e tests | `@angular/cdk/testing/selenium-webdriver` |
| `SeleniumWebDriverElement` | WebDriver `TestElement` implementation | Reference implementation |
| `manualChangeDetection(fn)` | Disables automatic harness change detection inside `fn` | |
| `parallel(() => promises)` | Like `Promise.all` with optimized change detection | |
| `HarnessEnvironment<E>` | Abstract base for environments; `E` = raw element type (`Element` in unit tests) | For environment authors |
| `handleAutoChangeDetectionStatus(handler)` | Start receiving `AutoChangeDetectionStatus` (`isDisabled`, `onDetectChangesNow()`) | For environment authors |
| `stopHandlingAutoChangeDetectionStatus()` | Stop handling the status | For environment authors |

### `HarnessEnvironment<E>` abstract members
| Member | Must do |
| --- | --- |
| `getDocumentRoot(): E` | Return the environment root element (e.g. `document.body`) |
| `createTestElement(element: E): TestElement` | Wrap a raw element |
| `createEnvironment(element: E): HarnessEnvironment` | Create an environment rooted at a raw element |
| `getAllRawElements(selector: string): Promise<E[]>` | Find all raw elements under the root matching a selector |
| `forceStabilize(): Promise<void>` | Resolve when `NgZone` is stable; also trigger stabilization if possible (e.g. `flush()` in `fakeAsync`) |
| `waitForTasksOutsideAngular(): Promise<void>` | Resolve when the parent zone of `NgZone` is stable |

## Patterns

### Unit test: fixture loader, document-root loader, and fixture harness
```ts
let fixture: ComponentFixture<ShareButton>;
let loader: HarnessLoader;
let rootLoader: HarnessLoader;

beforeEach(() => {
  fixture = TestBed.createComponent(ShareButton);
  loader = TestbedHarnessEnvironment.loader(fixture);
  rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
});

it('opens the share sheet', async () => {
  const share = await TestbedHarnessEnvironment.harnessForFixture(fixture, ShareButtonHarness);
  const btn = await loader.getHarness(AppButtonHarness);       // inside fixture
  await btn.click();
  const sheet = await rootLoader.getHarness(ShareSheetHarness); // appended to body
  expect(await sheet.isOpen()).toBe(true);
});
```

### WebDriver e2e loader
```ts
const driver: webdriver.WebDriver = createDriver();
const loader = SeleniumWebDriverHarnessEnvironment.loader(driver);
const toolbar = await loader.getHarness(ToolbarHarness);
```

### Querying, child loaders, and filtering
```ts
const first = await loader.getHarness(ChipHarness);
const all = await loader.getAllHarnesses(ChipHarness);
const third = await loader.getHarnessAtIndex(ChipHarness, 2);
const n = await loader.countHarnesses(ChipHarness);
const any = await loader.hasHarness(ChipHarness);

const sidebar = await loader.getChildLoader('.sidebar');
const panels = await loader.getAllChildLoaders('.panel');

const disabled = await loader.getHarness(
  new HarnessPredicate(ChipHarness, {selector: '[disabled]'}),
);
const saveBtn = await loader.getHarness(AppButtonHarness.with({selector: '#save'}));
```

### Change detection control and parallel reads
```ts
await manualChangeDetection(async () => {
  await submitHarness.click();
  fixture.detectChanges();
  expect(spinnerShown()).toBe(true);   // mid-operation
  await fixture.whenStable();
  expect(spinnerShown()).toBe(false);
});

const [checked, indeterminate] = await parallel(() => [
  box.isChecked(),
  box.isIndeterminate(),
]);
```

### Writing a harness: locators and user-level methods
```ts
// Component: selector 'app-toggle-panel', renders <button> and, when open, .panel-body
class TogglePanelHarness extends ComponentHarness {
  static hostSelector = 'app-toggle-panel';

  protected trigger = this.locatorFor('button');
  protected body = this.locatorForOptional('.panel-body');

  async toggle(): Promise<void> {
    return (await this.trigger()).click();
  }

  async isOpen(): Promise<boolean> {
    return !!(await this.body());
  }
}
```

### Sub-harnesses, filters, and `with()`
```ts
interface OptionFilters extends BaseHarnessFilters {
  label?: string | RegExp;
}

class OptionHarness extends ComponentHarness {
  static hostSelector = 'app-option';

  static with(options: OptionFilters): HarnessPredicate<OptionHarness> {
    return new HarnessPredicate(OptionHarness, options).addOption(
      'label', options.label,
      (h, label) => HarnessPredicate.stringMatches(h.getLabel(), label),
    );
  }

  async getLabel(): Promise<string> {
    return (await this.host()).text();
  }
}

class PickerHarness extends ComponentHarness {
  static hostSelector = 'app-picker';

  protected panel = this.locatorFor(TogglePanelHarness); // sub-harness

  async getOptions(filters: OptionFilters = {}): Promise<OptionHarness[]> {
    return this.locatorForAll(OptionHarness.with(filters))();
  }

  async open(): Promise<void> {
    return (await this.panel()).toggle();
  }
}
```

### Content projection and overlay content
```ts
// Users can load harnesses for anything projected into <ng-content>
class CardHarness extends ContentContainerComponentHarness<string> {
  static hostSelector = 'app-card';
}

// Content rendered via CDK Overlay lives outside the host element
class TooltipHarness extends ComponentHarness {
  static hostSelector = 'app-tooltip';

  async getContentLoader(): Promise<HarnessLoader> {
    return this.documentRootLocatorFactory().harnessLoaderFor('app-tooltip-content');
  }
}
```

### Environment authors: skeleton
```ts
class MyEnvHarnessEnvironment extends HarnessEnvironment<MyRawElement> {
  protected constructor(raw: MyRawElement) { super(raw); }

  static loader(/* env-specific args */): HarnessLoader { /* ... */ }

  getDocumentRoot(): MyRawElement { /* ... */ }
  createTestElement(el: MyRawElement): TestElement { /* map TestKey -> native keys in sendKeys */ }
  createEnvironment(el: MyRawElement): HarnessEnvironment<MyRawElement> { /* ... */ }
  async getAllRawElements(selector: string): Promise<MyRawElement[]> { /* ... */ }
  async forceStabilize(): Promise<void> { /* ... */ }
  async waitForTasksOutsideAngular(): Promise<void> { /* ... */ }
}
// Call handleAutoChangeDetectionStatus(handler) to support manualChangeDetection/parallel;
// stopHandlingAutoChangeDetectionStatus() when done.
```

## Pitfalls
- Elements appended directly to `document.body` (CDK `Overlay`, dialogs, pop-ups) are not found by the fixture `loader`; use `documentRootLoader` (tests) or `documentRootLocatorFactory()` (harnesses).
- Harness behavior can differ between environments: simulated unit-test events are not identical to real user interaction; the CDK only normalizes as far as it can.
- By default harnesses run change detection before reading and after interacting with the DOM, so mid-flight async state is invisible unless you wrap the block in `manualChangeDetection`.
- Forgetting `await` on harness calls: almost every harness method is async (needed for e2e support and to insulate tests from async changes).
- `locatorFor*` return finder functions, not elements; holding onto a found element risks a stale reference after the DOM re-renders.
- Using `document.querySelector()` or other direct DOM access inside a harness breaks in non-TestBed environments.
- Returning internal `TestElement`s from a harness couples consumers to the component's private DOM.
- Some Angular animations need a second change detection + `NgZone` stabilization pass; call `forceStabilize()` when events are not fully flushed.
- Work scheduled via `NgZone.runOutsideAngular()` is not awaited automatically; call `waitForTasksOutsideAngular()`.
- Filtering options beyond `selector`/`ancestor` are harness-specific; check each harness's own docs.
- Environment authors: `TestKey` codes probably do not match the target environment's key codes; `sendKeys` needs a translation map.

## Version notes
- None stated in the docs.
