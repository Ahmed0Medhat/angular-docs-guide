# Components

> Sources (angular.dev, v22.3 @ bd1e32b): Anatomy of components — https://angular.dev/guide/components,
> Selectors — https://angular.dev/guide/components/selectors,
> Styling — https://angular.dev/guide/components/styling,
> Accepting data with input properties — https://angular.dev/guide/components/inputs,
> Custom events with outputs — https://angular.dev/guide/components/outputs,
> Content projection with ng-content — https://angular.dev/guide/components/content-projection,
> Host elements — https://angular.dev/guide/components/host-elements,
> Lifecycle — https://angular.dev/guide/components/lifecycle,
> Referencing component children with queries — https://angular.dev/guide/components/queries,
> Using DOM APIs — https://angular.dev/guide/components/dom-apis,
> Inheritance — https://angular.dev/guide/components/inheritance,
> Programmatically rendering components — https://angular.dev/guide/components/programmatic-rendering,
> Advanced configuration — https://angular.dev/guide/components/advanced-configuration.

## When to use
- Defining a component (class + template + selector), importing it into another component, and composing a component tree.
- Picking a selector (element vs. attribute on a native element) and scoping or namespacing component CSS.
- Passing data in (`input`, `model` for two-way binding) and raising custom events out (`output`).
- Building container components with `<ng-content>` slots, and binding to the host element via `host`.
- Running code at lifecycle points, reading child components/elements with signal queries, and doing post-render DOM work.
- Creating components at runtime (`NgComponentOutlet`, `ViewContainerRef.createComponent`, `createComponent`) and choosing change detection / schemas.
- See also: template syntax, bindings, two-way binding, pipes, event key modifiers, template variables, `@defer` → references/guide/templates.md
- See also: directives and host directives → references/guide/directives.md
- See also: NgModule-based (`standalone: false`) components → references/guide/ngmodules.md
- See also: dependency injection and injection context → references/guide/di.md
- See also: `providers` vs `viewProviders` → references/guide/di-hierarchy.md
- See also: signals and reactive contexts → references/guide/signals.md
- See also: outputs ↔ RxJS → references/ecosystem/rxjs-interop.md
- See also: `Renderer2` and animation properties/events → references/guide/animations.md
- See also: XSS and `innerHTML` safeguards → references/guide/security.md

## Rules
- MUST give each component a TypeScript class, a template, and a CSS selector, declared through `@Component` metadata.
- MUST add a component, directive or pipe to the host component's `imports` before using it in that template (standalone is the default; for `standalone: false` components import their NgModule).
- NEVER prefix your own selectors with `ng` (reserved by the framework); PREFER a short, consistent project prefix (CLI default `app-`).
- PREFER custom element names containing a hyphen as selectors for most components.
- PREFER an attribute selector (e.g. `button[yt-upload]`) when the component should sit on a native element so consumers keep its native API (notably ARIA attributes); use lowercase dash-case attribute names.
- AVOID `::ng-deep` in new code (strongly discouraged; kept only for backwards compatibility).
- MUST fully understand Shadow DOM side effects (event propagation, `<slot>`, devtools display) before choosing `ViewEncapsulation.ShadowDom`.
- MUST give every app sharing a page its own `APP_ID` when using `provideCssVarNamespacing`, or the prefixes collide.
- MUST review custom properties that cross between global stylesheets and components before enabling namespacing in an existing app.
- PREFER `[style.--name]` bindings for custom properties; when using DOM APIs, pass the authored name to `CssVarNamespacer.namespace()`.
- MUST write `--global--name` (two hyphens after `global`) to opt a custom property out of namespacing; AVOID names starting `--global-` followed by anything other than a second hyphen.
- MUST call `input`, `output` (and `model`) only in property initializers of components/directives.
- PREFER the signal-based `input()` / `output()` / query functions for new code; decorator APIs remain supported.
- MUST keep input transform functions statically analyzable and pure.
- AVOID aliasing inputs/outputs except to rename while keeping an old name, or to dodge native DOM property/event names.
- AVOID input/output names that collide with DOM element properties/events, and AVOID selector-style prefixes on them.
- MUST use camelCase output names; AVOID an `on` prefix.
- PREFER `model()` when a component exists to edit a value via user interaction (e.g. custom form controls like date pickers, comboboxes).
- PREFER input transforms over `@Input` getters/setters; AVOID expensive setters (Angular may call them several times).
- NEVER wrap `<ng-content>` in `@if`, `@for` or `@switch`; use template fragments (`ng-template`) for conditional content.
- MUST use static attributes/classes on projected elements when a `select` relies on them.
- ALWAYS prefer the `host` property over `@HostBinding` / `@HostListener` (decorators exist only for backwards compatibility).
- AVOID binding the same DOM property/attribute dynamically in both the template and host bindings.
- AVOID state changes in the middle of change-detection traversal; each component is visited exactly once.
- AVOID `ngDoCheck`, `ngAfterContentChecked`, `ngAfterViewChecked` unless no alternative exists (run very often, costly).
- AVOID changing non-signal state already rendered by a template inside `ngAfterContentInit/Checked` or `ngAfterViewInit/Checked` (NG0100 risk).
- MUST call `afterEveryRender` / `afterNextRender` in an injection context (typically the constructor).
- PREFER `write` and `read` phases; AVOID `earlyRead` and `mixedReadWrite` when possible.
- NEVER rely on an observed lifecycle-hook order between a component and directives on the same element.
- AVOID direct DOM manipulation; express structure in templates and update via bindings.
- NEVER touch the DOM in lifecycle hooks other than render callbacks.
- NEVER set `innerHTML` directly (XSS risk); template bindings to `innerHTML` are safeguarded.
- AVOID inserting/removing/modifying DOM elements yourself; legitimate DOM uses are focus, geometry measurement, reading text, native observers.
- MUST keep a single source of truth for state shared between components; AVOID writing state into children and NEVER write into parents/ancestors via queries.
- MUST forward constructor-injected base-class dependencies to `super(...)`; property-initializer `inject()` needs no forwarding.
- MUST call `super.ngOnInit()` (etc.) in an overriding lifecycle method to keep the base behavior.
- PREFER `@defer` over manual programmatic rendering for lazy-loading components.
- MUST check a library's docs before projecting content into components that manage their children (menus, tabs, lists).

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `@Component({selector, template \| templateUrl, styles \| styleUrl, imports})` | Declare a component | `templateUrl`/`styleUrl` resolve relative to the component's folder |
| `standalone` | Standalone flag | Default `true`; before v19.0.0 defaulted to `false` |
| Selector types | Type `tag`, attribute `[attr]` / `[attr="v"]`, class `.cls`, `:not(...)`, concatenation, comma list | No combinators, namespaces, other pseudo-classes, or attribute operators besides `=` |
| `encapsulation: ViewEncapsulation.X` | Style scoping | `Emulated` (default), `ShadowDom`, `ExperimentalIsolatedShadowDom`, `None` |
| `:host`, `:host-context()` | Host styling in Emulated mode | Compiled to attributes; `::shadow`, `::part` unsupported |
| `::ng-deep` | Drop encapsulation for the rest of the selector | Strongly discouraged |
| `provideCssVarNamespacing(prefix?)` | Prefix component custom properties (`--x` → `--<APP_ID>_x`) | `@angular/platform-browser`; underscore appended for you |
| `CssVarNamespacer.namespace('--x')` | Namespaced name for DOM APIs | Returns name unchanged when no namespace configured |
| `input(default?, {alias?, transform?})` | Signal input → `InputSignal<T>` | No default ⇒ `T \| undefined`; read-only |
| `input.required<T>()` | Required input | Build-time error if unset; no implicit `undefined` |
| `booleanAttribute` / `numberAttribute` | Built-in transforms | `"false"` → `false`; unparsable → `NaN` |
| `model(default?)` / `model.required()` | Writable two-way input | Implicit `<name>Change` output emitted on `set`/`update`; no transforms; supports `alias`/required |
| `output<T>({alias?})` | Custom event → `OutputEmitterRef` | `.emit(value)`; does not bubble |
| `outputRef.subscribe(fn)` | Programmatic listener | Returns `OutputRefSubscription` (`unsubscribe()`); auto-cleaned on destroy |
| `@Input({required?, alias?, transform?})` / `@Input('alias')` | Decorator input | Getter/setter and setter-only inputs allowed |
| `@Output('alias') x = new EventEmitter<T>()` | Decorator output | |
| `inputs: ['prop: alias']`, `outputs: [...]` | Declare inherited members as inputs/outputs | Useful with base classes |
| `<ng-content select="sel">fallback</ng-content>` | Projection slot | Same selector support as components; fallback shown when nothing matches |
| `ngProjectAs="sel"` | Match a slot as if element were `sel` | Static values only |
| `host: {...}` | Host attrs, `[prop]`, `[attr.x]`, `[class.x]`, `[style.x]`, `(event)` | Global event targets: `document:`, `window:`, `body:` |
| `@HostBinding` / `@HostListener(evt, args?)` | Decorator host bindings | Backwards compatibility only |
| `inject(new HostAttributeToken('name'))` | Read static host attribute | Throws if missing unless optional |
| Lifecycle methods | `ngOnChanges`, `ngOnInit`, `ngDoCheck`, `ngAfterContentInit/Checked`, `ngAfterViewInit/Checked`, `ngOnDestroy` | Interfaces drop `ng` (`OnInit`) |
| `SimpleChanges<T>` | `ngOnChanges` arg; `previousValue`, `currentValue`, `firstChange` | Keyed by TS property name, not alias |
| `inject(DestroyRef).onDestroy(fn)` / `.destroyed` | Cleanup registration / destroyed check | Passable to outside code |
| `afterNextRender` / `afterEveryRender(fn \| phases)` | App-wide render callbacks | Phases order: `earlyRead`, `write`, `mixedReadWrite` (default), `read`; phase return passes to next |
| `viewChild(loc, {read?})` / `viewChildren` | Query own template | Signal; single may be `undefined`; multiple → array |
| `contentChild(loc, {read?, descendants?})` / `contentChildren` | Query projected content | `contentChild` descends by default; `contentChildren` direct children only unless `descendants: true` |
| `viewChild.required` / `contentChild.required` | Must match | Error if missing; no `undefined` in type |
| Locators | Component/directive class, template ref name string, any `ProviderToken` | CSS selectors not supported |
| `read:` | `ElementRef`, `TemplateRef`, `Injector`, etc. | `Injector` gives the element's node injector |
| `@ViewChild/@ContentChild(loc, {static?})` | Decorator single queries | Available in `ngAfterViewInit` / `ngAfterContentInit`; `static: true` ⇒ in `ngOnInit`, never updates |
| `@ViewChildren/@ContentChildren` | Decorator multi queries → `QueryList` | `map`, `reduce`, `forEach`, `toArray()`, `changes` |
| `inject(ElementRef).nativeElement` | Host DOM element | |
| `Renderer2` | DOM ops tied to style encapsulation and animations (`setProperty`, `listen`) | Otherwise same as native DOM |
| `*ngComponentOutlet="cmp; inputs: obj; content: nodes; injector: inj"` | Template-driven dynamic component | `@angular/common`; `#o="ngComponentOutlet"` → `o.componentInstance` (null before render) |
| `vcr.createComponent(Cmp, {bindings?, directives?, onError?})` | Insert component as next sibling of injecting node | Returns `ComponentRef` |
| `createComponent(Cmp, {environmentInjector, hostElement?, bindings?, directives?, onError?})` | Create detached component | Attach with `appRef.attachView(ref.hostView)` |
| `inputBinding(name, sigOrFn)`, `outputBinding<T>(name, fn)`, `twoWayBinding(name, signal)` | Creation-time bindings | Also usable in `directives: [{type, bindings}]` |
| `onError: (err, details: ErrorDetails) => …` | Handle render/CD errors of a dynamic component | [developer preview] |
| `changeDetection` | `ChangeDetectionStrategy.OnPush` (default since v22) or `.Eager` | |
| `preserveWhitespaces: true` | Keep template whitespace | Default collapses it |
| `schemas: [CUSTOM_ELEMENTS_SCHEMA]` / `NO_ERRORS_SCHEMA` | Allow unknown elements / any element and property | |

## Patterns

### Component, styles and imports
```ts
@Component({
  selector: 'app-avatar',
  template: `<img src="avatar.png" alt="User avatar" />`,
  styles: `img { border-radius: 50%; }`,
})
export class Avatar {}

@Component({ imports: [Avatar], template: `<app-avatar />` })
export class AccountCard {}
```

### Inputs, models, outputs
```ts
export class RangeInput {
  min = input(0, {transform: numberAttribute});
  disabled = input(false, {transform: booleanAttribute});
  label = input.required<string>();
  caption = input('', {transform: (v: string | undefined) => v?.trim() ?? ''});
  value = model(0);                         // also exposes (valueChange)
  committed = output<number>({alias: 'valueCommitted'});

  bump() { this.value.update((v) => v + 1); this.committed.emit(this.value()); }
}
```
```html
<app-range label="Volume" [(value)]="volume" (valueCommitted)="save($event)" />
```
`volume` may be a `signal` (pass the instance, not its value) or a plain property.

### Projection with slots and fallback
```html
<!-- app-panel template -->
<ng-content select="panel-title">Untitled</ng-content>
<ng-content />  <!-- everything not matched above -->

<!-- usage -->
<app-panel>
  <h2 ngProjectAs="panel-title">Settings</h2>
  <p>Body</p>
</app-panel>
```

### Host bindings and host attributes
```ts
@Component({
  selector: 'app-knob',
  host: {
    role: 'slider',
    '[attr.aria-valuenow]': 'level()',
    '[tabIndex]': 'disabled() ? -1 : 0',
    '[style.--knob-color]': 'color()',
    '(keydown)': 'onKey($event)',
  },
})
export class Knob {
  size = inject(new HostAttributeToken('size'));
  /* level, disabled, color signals; onKey handler */
}
```

### Lifecycle, cleanup and render phases
```ts
export class Chart implements OnChanges {
  data = input<number[]>([]);
  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    inject(DestroyRef).onDestroy(() => {/* teardown */});
    afterNextRender({
      write: () => { host.style.minHeight = '200px'; return true; },
      read: (wrote) => { if (wrote) this.height = host.getBoundingClientRect().height; },
    });
  }
  height = 0;
  ngOnChanges(changes: SimpleChanges<Chart>) {
    if (changes.data?.firstChange) {/* ... */}
  }
}
```

### Signal queries
```ts
export class Tabs {
  tabs = contentChildren(TabItem, {descendants: true});
  firstTpl = contentChild(TabItem, {read: TemplateRef});
  saveBtn = viewChild<ElementRef<HTMLButtonElement>>('save');
  header = viewChild.required(TabsHeader);
  titles = computed(() => this.tabs().map((t) => t.title));
}
```

### Inheritance
```ts
@Component({selector: 'base-list', template: '', host: {'(keydown)': 'onKey($event)'}})
export class ListBase {
  protected el = inject(ElementRef);       // inherited, no super() forwarding
  ngOnInit() {/* base setup */}
  onKey(e: KeyboardEvent) {}
}

@Component({selector: 'app-list', template: '', host: {'(click)': 'focus()'}})
export class AppList extends ListBase {     // gets both listeners and all inputs/outputs
  override ngOnInit() { super.ngOnInit(); }
  focus() {}
}
```

### Dynamic rendering
```html
<ng-container *ngComponentOutlet="panel(); inputs: panelInputs(); injector: panelInjector" />
<ng-container [ngComponentOutlet]="counterCmp" #out="ngComponentOutlet" />
<button (click)="out.componentInstance?.increment()">+</button>
```
```ts
// Lazy-load when @defer does not fit
async loadExtra() {
  const {ExtraPanel} = await import('./extra-panel');
  this.extra = ExtraPanel; // rendered by *ngComponentOutlet="extra"
}

// Creation-time bindings
this.vcr.createComponent(Notice, {
  bindings: [
    inputBinding('dismissible', this.dismissible),
    twoWayBinding('open', this.open),
    outputBinding<boolean>('closed', (ok) => this.onClosed(ok)),
  ],
  directives: [FocusTrap, {type: Themed, bindings: [inputBinding('theme', () => 'warn')]}],
  onError: (err, details) => this.fallback(err), // developer preview
});

// Overlay outside the view tree
const host = document.createElement('toast-host');
const ref = createComponent(Toast, {
  environmentInjector: this.envInjector,
  hostElement: host,
  bindings: [outputBinding('closed', () => {
    host.remove(); this.appRef.detachView(ref.hostView); ref.destroy();
  })],
});
this.appRef.attachView(ref.hostView);
document.body.appendChild(host);
```

### CSS custom property namespacing
```ts
providers: [{provide: APP_ID, useValue: 'shop'}, provideCssVarNamespacing()]
// --accent → --shop_accent; provideCssVarNamespacing('x_') → --x__accent
```
```css
:host { --global--brand: navy; color: var(--global--theme-fg); } /* not namespaced */
```

## Pitfalls
- Selectors are matched at compile time; runtime DOM or binding changes never add/remove components. Matching two component selectors on one element is an error. Selectors, input names and output names are case-sensitive.
- Unknown custom tags error by default, but unknown attributes do not: forgetting to import an attribute-selector component silently renders nothing.
- Emulated encapsulation still lets global styles reach inside the component. In `Emulated`/`ShadowDom`, component styles are not guaranteed to beat equal-specificity outside styles.
- `ExperimentalIsolatedShadowDom` blocks global styles too; `None` makes component styles global.
- `<style>` in a template follows the component's encapsulation but cannot contain bindings. `<link>` and `@import` styles are external and ignore emulated encapsulation.
- `::ng-deep` scope: `::ng-deep p a` is global; `p ::ng-deep a` needs only `<p>` in the own template; `:host ::ng-deep p a` limits both to descendants of the host.
- Namespacing is not applied to: static `style="--x: …"` (including host `style`), object/string `[style]` bindings and `ngStyle` (including host `[style]`), `var(--x)` inside binding values, `Renderer2.setStyle`, and runtime-loaded stylesheets (global build stylesheets, non-inlined external styles). Mismatches fail silently (fallback or inherited/initial value).
- Namespacing also affects installed libraries; a library reading a theme variable from a global stylesheet silently loses it. Default `APP_ID` is `ng`. `--global--` is stripped in every app, even without namespacing.
- Input transform parameter type defines what templates may bind (e.g. `number` in, `string` out). Transforms cannot be set conditionally.
- Required inputs missing in a template ⇒ build-time error.
- Outputs (custom events) do not bubble through the DOM.
- `<ng-content>` is compiler-processed: no directives, styles or arbitrary attributes on it; projected content is always instantiated even if its slot is hidden.
- Dynamic `[class.x]` bindings are invisible to `select`. Without a catch-all `<ng-content>`, unmatched children are dropped.
- Projected content belongs to the parent view: it is checked with the parent even under an `OnPush` receiver, and resolves DI from the parent's injector, not the receiver's `viewProviders`.
- Projecting wrapped items into child-managing library components (e.g. extra wrapper around `mat-menu-item` in `mat-menu`) can silently break keyboard navigation and screen reader support.
- Host binding precedence for class/style: template bindings > static template values > directive host bindings > component host bindings > static host values. `undefined` falls through; `null` removes.
- Static attribute in both template and host: template wins. Static vs. dynamic: dynamic wins. Duplicate dynamic bindings are not reconciled (order-dependent overwrites).
- `(keydown.enter)` matches `KeyboardEvent.key` (layout-dependent); use `(keydown.code.Enter)` for physical keys.
- `HostAttributeToken` throws when the attribute is absent unless injected optionally.
- `ngOnChanges` first runs before `ngOnInit`; `ngDoCheck` first runs after `ngOnInit`. Render callbacks never run during SSR or build-time prerendering.
- Use `destroyRef.destroyed` in async code to avoid `NG0911: View has already been destroyed`.
- Queries never cross component boundaries. Single queries are `undefined` when the target is absent or hidden by `@if`/`@for`; required queries error instead. Duplicate template ref names: first match wins.
- Decorator query results are `undefined` before `ngAfterViewInit` / `ngAfterContentInit` (or `ngOnInit` with `static: true`); `static` is not available on `@ViewChildren`/`@ContentChildren`.
- Server DOM lacks browser-only APIs (layout measurement, observers) even though `Renderer2` and native DOM work there.
- A child lifecycle method overrides the base one unless `super` is called. Subclasses get the union of ancestor inputs, outputs and host bindings; selector and template are overridden.
- Hydration cannot project DOM nodes built with native DOM APIs (`ngComponentOutletContent`) — NG0503; use Angular APIs or `ngSkipHydration`.
- `ViewContainerRef.createComponent` inserts as the next sibling of the injecting component/directive; standalone `createComponent` attaches nothing until you place the host and call `attachView`.
- `onError` catches rendering and change-detection errors only; constructor errors throw synchronously from the create call.
- `OnPush` checks a component when: a template-bound input changes, its own listener runs, it is marked for check (`markForCheck`, `AsyncPipe`), or a signal read in its template changes. The first three also check ancestors; signal changes refresh only reading components.

## Version notes
- [v19+] `standalone` defaults to `true` (before 19.0.0 it defaulted to `false`).
- [v22+] `ChangeDetectionStrategy.OnPush` is the default; `ChangeDetectionStrategy.Eager` is opt-in.
- [developer preview] `onError` option and its `ErrorDetails` parameter for `ViewContainerRef.createComponent` / `createComponent`.
- `ViewEncapsulation.ExperimentalIsolatedShadowDom`: experimental by name only; the page attaches no stability label.
- `:host-context()` is deprecated in modern browsers (not an Angular deprecation); Angular's compiler still fully supports it in Emulated mode.
- Planned: a future major version is expected to reject `--global-` names not followed by a second hyphen at build time.
