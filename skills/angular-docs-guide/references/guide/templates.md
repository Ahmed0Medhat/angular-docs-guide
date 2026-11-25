# Templates

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/templates,
> Binding dynamic text, properties and attributes — https://angular.dev/guide/templates/binding,
> Adding event listeners — https://angular.dev/guide/templates/event-listeners,
> Two-way binding — https://angular.dev/guide/templates/two-way-binding,
> Control flow — https://angular.dev/guide/templates/control-flow,
> Pipes — https://angular.dev/guide/templates/pipes,
> Slotting child content with ng-content — https://angular.dev/guide/templates/ng-content,
> Create template fragments with ng-template — https://angular.dev/guide/templates/ng-template,
> Grouping elements with ng-container — https://angular.dev/guide/templates/ng-container,
> Variables in templates — https://angular.dev/guide/templates/variables,
> Deferred loading with @defer — https://angular.dev/guide/templates/defer,
> Error boundaries with @boundary — https://angular.dev/guide/templates/error-boundaries,
> Expression syntax — https://angular.dev/guide/templates/expression-syntax,
> Whitespace in templates — https://angular.dev/guide/templates/whitespace.

## When to use
- Rendering component state as text, DOM properties, attributes, ARIA attributes, CSS classes and inline styles.
- Reacting to DOM, keyboard and global (`window`/`document`/`body`) events, or adding custom event syntax via an event plugin.
- Syncing a value between a parent and a child component or a form control (`[(...)]`, `model()`, `ngModel`).
- Showing, hiding, repeating and switching markup with `@if` / `@for` / `@switch`, and naming values with `@let`.
- Formatting values with built-in or custom pipes.
- Declaring reusable fragments (`<ng-template>`), grouping without a wrapper element (`<ng-container>`), projecting content (`<ng-content>`).
- Lazy-loading heavy parts of a view with `@defer`, and isolating rendering failures with `@boundary`.
- See also: signals that drive template updates → references/guide/signals.md
- See also: components, content projection, queries, programmatic rendering → references/guide/components.md
- See also: directives and structural directives → references/guide/directives.md
- See also: why `<script>` is unsupported / template security → references/guide/security.md
- See also: ARIA properties with structured values → references/best-practices/a11y.md
- See also: locale-aware pipe output → references/guide/i18n.md
- See also: dependency injection → references/guide/di.md
- See also: rendering `@defer` content on the server (incremental hydration) → references/guide/ssr.md

## Rules
- PREFER reading signals in bindings for anything that changes over time; plain fields are not guaranteed to refresh the view.
- MUST assign a new array/object to `[class]` or `[style]` (and to pure pipe inputs) when contents change; Angular compares with `===`, so in-place mutation is not seen.
- MUST use `attr.` for attributes with no DOM property counterpart (e.g. SVG attributes); bind to `null`/`undefined` to remove the attribute.
- PREFER a standard property binding (not the string ARIA binding) when an ARIA feature takes structured values such as element references.
- PREFER calling `event.preventDefault()` explicitly over relying on a handler that evaluates to `false`.
- MUST import `FormsModule` and use `[(ngModel)]` for two-way binding on native form controls.
- MUST declare the child property with `model()` for component two-way binding; the parent passes a property or a signal inside `[(name)]`.
- MUST give every `@for` a `track` expression; PREFER a unique id (`id`, `uuid`); add one to the data model if missing.
- PREFER `track $index` only for static collections that never change.
- AVOID `track item` (identity tracking) unless nothing else is available; it can make updates much slower.
- PREFER `@let` to capture a signal value when using `@switch` exhaustiveness checking (narrowing only works on variables).
- MUST use parentheses whenever pipe precedence could be ambiguous (e.g. around ternaries).
- MUST give custom pipes a camelCase `name` (no hyphens) and a PascalCase class name ending in `Pipe`.
- MUST implement `PipeTransform` on custom pipes.
- AVOID impure pipes (`pure: false`) unless absolutely necessary; convention is to include `Impure` in the pipe name and class.
- NEVER inject a pipe class into services or other classes; move logic into a plain function that `transform()` delegates to, and call that function elsewhere.
- PREFER `formatDate`, `formatCurrency`, `formatNumber`, `formatPercent` from `@angular/common` instead of injecting `DatePipe`, `CurrencyPipe`, `DecimalPipe`, `PercentPipe`.
- PREFER applying `NgTemplateOutlet` on an `<ng-container>`.
- PREFER declaring a template variable only once per template so its runtime value stays predictable.
- MUST make `@defer` dependencies standalone and not referenced elsewhere in the same file (including `ViewChild` queries), or they load eagerly.
- MUST import deferred components from their own file, not through a barrel `index.ts`, or no separate chunk is produced.
- PREFER different triggers on nested `@defer` blocks to avoid cascading simultaneous loads.
- AVOID deferring content visible in the initial viewport (CLS); if unavoidable, AVOID `immediate`, `timer`, `viewport` and custom `when` triggers there.
- PREFER wrapping `@defer` in an `aria-live="polite" aria-atomic="true"` element so screen readers announce state transitions.
- MUST order `@error` blocks of a `@boundary` from most to least specific; a final `@error` without `when` is the catch-all.
- MUST wrap the wrapper component plus its projected children in the parent's `@boundary`; a `@boundary` around `<ng-content>` does not catch errors from projected content.
- PREFER migrating code away from `$safeNavigationMigration` by removing reliance on `null` vs `undefined`.
- AVOID `preserveWhitespaces: true` unless absolutely necessary; it creates many more nodes and slows rendering.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `{{ expr }}` | Text interpolation | Value stringified; `null`/`undefined` → empty string; objects/arrays via `toString` |
| `prop="text {{ x }}"` | Interpolation inside a property/attribute | Treated as a property binding |
| `[prop]="expr"` | Bind DOM element property, component input or directive input | e.g. `[disabled]`, `[ngSrc]` |
| `[attr.name]="expr"` | Set HTML attribute via `setAttribute` | `null`/`undefined` → `removeAttribute` |
| `[class.name]="cond"` | Toggle one class on truthiness | No space-separated names in one key |
| `[class]="v"` | Bind many classes | `string` (whitespace-split, empty ignored), `string[]`, `Record<string, any>` |
| `[style.prop]` / `[style.prop.px]` | One style property, optional unit suffix | |
| `[style]="v"` | Many styles | `string` of declarations or `Record<string, any>` |
| `[aria-label]="expr"` | String ARIA attribute binding | `null`/`undefined` removes it |
| `(event)="stmt"` | Event listener; `$event` is the event object | Any native event |
| `(keyup.enter)`, `(keyup.shift.enter)` | Key filter with modifiers | Modifiers: `alt`, `control`, `meta`, `shift`; matches `key` values by default |
| `(keydown.code.alt.shift.shiftleft)` | Filter by `KeyboardEvent.code` | Physical key, consistent across OSes |
| `(window:evt)`, `(document:evt)`, `(body:evt)` | Global targets (e.g. in `host`) | Only these 3 |
| `EVENT_MANAGER_PLUGINS` + `EventManagerPlugin` | Custom event syntax (e.g. `click.debounce.500`) | Override `supports(name)` and `addEventListener(el, name, handler)` returning cleanup; provide `multi: true`; works in templates and `host` |
| `[(x)]` | Two-way binding ("banana-in-a-box") | `[(ngModel)]` needs `FormsModule`; components need `model()` |
| `@if (c) {} @else if (c2) {} @else {}` | Conditional rendering | `@if (expr; as v)` stores the result |
| `@for (i of list; track key; let idx = $index) {} @empty {}` | Repeat over any iterable | Extra optimizations for `Array`; no `break`/`continue` |
| `$count`, `$index`, `$first`, `$last`, `$even`, `$odd` | `@for` context variables | Alias with `let a = $index, b = $even` |
| `@switch (v) { @case (x) {} @default {} }` | Match by `===` | No fallthrough; stacked `@case`s share a body; no match + no default → nothing |
| `@default never;` / `@default never(expr);` | Exhaustive union check at compile time | Use `never(expr)` when the switched value is nested in a union |
| `@let name = expr;` | Read-only template local | One variable per block; multi-line expr allowed; `;` required |
| `#ref` / `#ref="exportAsName"` | Template reference variable | Element → `HTMLElement`; component → instance; `<ng-template>` → `TemplateRef`; directive needs `exportAs` |
| `value \| pipe : arg1 : arg2` | Pipe with params | Chained pipes run left→right |
| `@Pipe({name, pure?})` + `PipeTransform.transform(value, ...args)` | Custom pipe | `pure` defaults to `true` |
| `AsyncPipe` | Value from `Promise` / `Observable` | `@angular/common` |
| `CurrencyPipe`, `DatePipe`, `DecimalPipe`, `PercentPipe` | Locale-aware number/date formatting | Functions: `formatCurrency`, `formatDate`, `formatNumber`, `formatPercent` |
| `I18nPluralPipe`, `I18nSelectPipe` | Locale plural mapping / key→value selection | |
| `JsonPipe` | `JSON.stringify` output | Meant for debugging |
| `KeyValuePipe` | Object or `Map` → array of key/value pairs | |
| `LowerCasePipe`, `UpperCasePipe`, `TitleCasePipe` | Change text case | |
| `SlicePipe` | Subset of an array or string | |
| `<ng-content />` | Slot for parent-supplied markup | Renders no DOM element |
| `<ng-template>` | Declare a fragment (not rendered by itself) | Ref via `#var`, `viewChild(TemplateRef)` / `viewChild('name')`, or `inject(TemplateRef)` in a directive on it |
| `let-local="ctxKey"` | Fragment parameter from context | `$implicit` for the default |
| `NgTemplateOutlet` | Render a `TemplateRef` as a sibling | Inputs `ngTemplateOutletContext`, `ngTemplateOutletInjector` (an `Injector` or `'outlet'`); micro-syntax `context:` / `injector:` |
| `ViewContainerRef.createEmbeddedView(tpl, ctx?, {injector?})` | Render a fragment from code | Inserted as next sibling of the host |
| `*dir` | Structural directive shorthand | Wraps element in `<ng-template dir>` |
| `<ng-container>` | Group / placeholder with no DOM element | Hosts directives, `NgComponentOutlet`, `NgTemplateOutlet` |
| `NgComponentOutlet` | Render a component class dynamically | `[ngComponentOutlet]="cmp()"` |
| `@defer (triggers) {} @placeholder (minimum t) {} @loading (after t; minimum t) {} @error {}` | Lazy-load block | Default trigger `on idle`; times in `ms` or `s` |
| `on idle` / `on idle(ms)` | Load when browser is idle (`requestIdleCallback`) | Optional timeout; default trigger |
| `provideIdleServiceWith(Service)` + `IdleService` | Custom idle scheduling | Implement `requestOnIdle`, `cancelOnIdle` |
| `on viewport` / `on viewport(ref)` / `on viewport({trigger, rootMargin, ...})` | Load on entering viewport (IntersectionObserver) | Object takes any IO option except `root`; target must be passed as `trigger` |
| `on interaction` / `on interaction(ref)` | Load on `click` or `keydown` | |
| `on hover` / `on hover(ref)` | Load on `mouseover` or `focusin` | |
| `on immediate` | Load right after non-deferred content renders | |
| `on timer(500ms)` | Load after a duration | Unit `ms` or `s` required |
| `when expr` | Load once expr becomes truthy | One-shot; never reverts |
| `prefetch on ...` / `prefetch when ...` | Fetch JS before showing | Separated from main trigger by `;` |
| `TestBed.configureTestingModule({deferBlockBehavior: DeferBlockBehavior.Manual})` | Step through defer states in tests | `fixture.getDeferBlocks()`, `block.render(DeferBlockState.Loading \| Complete)` |
| `@boundary {} @error (let e; reset = $reset; when cond) {}` | Catch render/CD errors and show fallback | [developer preview]; `$error`, `$reset()` implicit in `@error` |
| `ErrorHandler.onViewError(error, details: ErrorDetails)` | Global hook for boundary-caught errors | Optional; `details.boundary` |
| `$any`, `undefined` | Only globals allowed in expressions | |
| `this.member` | Disambiguate a member shadowed by a template variable | `this` is otherwise implicit |
| `$safeNavigationMigration(a?.b)` | Keep pre-v22 `?.` → `null` semantics | Temporary migration aid, may be removed; not callable from TS |
| `preserveWhitespaces: true` | Keep template whitespace | `@Component` option |
| `&ngsp;` | Single space kept in compiled output | Angular-only entity |
| `&commat;` / `&#64;` | Literal `@` in templates | |

## Patterns

Bindings, classes and styles:
```angular-ts
@Component({
  template: `
    <p>Mode: {{ mode() }}</p>
    <img [ngSrc]="avatarUrl()" alt="Avatar of {{ userName() }}" />
    <ul [attr.role]="listRole()" class="list" [class]="variant()" [class.open]="isOpen()"></ul>
    <section [style.height.px]="panelHeight()" [style]="extraStyles()"></section>
    <button type="button" [aria-label]="saveLabel()" [disabled]="!canSave()">Save</button>
  `,
})
export class Panel {
  mode = signal('dark');
  variant = signal(['boxed', 'raised']);        // replace the array to update
  extraStyles = signal({ 'font-weight': 'bold' }); // replace the object to update
  // ...other signals
}
```

Events, key filters and global listeners:
```angular-ts
@Component({
  template: `
    <input (keyup.enter)="submit($event)" (keydown.code.alt.shift.shiftleft)="shortcut()" />
    <a href="#more" (click)="openMore($event)">More</a>
  `,
  host: { '(document:click)': 'closeMenus()' },
})
export class SearchBox {
  openMore(e: PointerEvent) {
    e.preventDefault(); // explicit, rather than returning false
  }
}
```

Custom event plugin:
```ts
@Injectable()
export class ThrottlePlugin extends EventManagerPlugin {
  constructor() { super(document); }
  override supports(name: string) { return /throttle/.test(name); }
  override addEventListener(el: HTMLElement, name: string, handler: Function) {
    const [evt, , ms = '300'] = name.split('.');
    // attach listener on `evt`...
    return () => { /* remove listener, clear timers */ };
  }
}
// bootstrapApplication(App, { providers: [{ provide: EVENT_MANAGER_PLUGINS, useClass: ThrottlePlugin, multi: true }] });
// Template: (input.throttle.500)="onType($event)"
```

Two-way binding with `model()`:
```angular-ts
@Component({ selector: 'qty-picker', template: `<button (click)="step(1)">+</button> {{ qty() }}` })
export class QtyPicker {
  qty = model(0);
  step(d: number) { this.qty.update((v) => v + d); }
}

@Component({
  imports: [QtyPicker, FormsModule],
  template: `<qty-picker [(qty)]="amount" /> <input [(ngModel)]="note" />`,
})
export class Cart { amount = 3; note = ''; }
```

Control flow and `@let`:
```angular-html
@let user = user$ | async;
@if (user?.settings?.theme; as theme) { <p>Theme: {{ theme }}</p> } @else { <p>Default</p> }

@for (row of rows(); track row.id; let i = $index, last = $last) {
  <li>{{ i }}: {{ row.label }} @if (last) { (end) }</li>
} @empty {
  <li>Nothing here.</li>
}

@let status = status();   <!-- signal captured into a variable so narrowing works -->
@switch (status) {
  @case ('idle') { <p>Idle</p> }
  @case ('busy')
  @case ('saving') { <spinner /> }
  @default never;
}
```
For a nested union (`state: {kind: 'a'} | {kind: 'b'; n: number}`), write `@switch (state.kind) { ... @default never(state); }`.

Pipes:
```angular-html
{{ price | currency }}  {{ when | date: 'hh:mm' : 'UTC' }}  {{ when | date | uppercase }}
{{ (ok ? 'yes' : 'no') | uppercase }}   <!-- parentheses needed -->
{{ first + last | uppercase }}          <!-- concatenation happens first -->
```
```ts
export function toSlug(v: string) { return v.toLowerCase().replace(/ /g, '-'); }

@Pipe({ name: 'slug' })
export class SlugPipe implements PipeTransform {
  transform(v: string): string { return toSlug(v); } // reuse toSlug() in services
}

@Pipe({ name: 'sumImpure', pure: false }) // re-runs on every check; last resort
export class SumImpurePipe implements PipeTransform {
  transform(xs: number[]) { return xs.reduce((a, b) => a + b, 0); }
}

@Service()
export class Prices {
  private locale = inject(LOCALE_ID);
  show(v: number) { return formatNumber(v, this.locale, '1.2-2'); } // not inject(DecimalPipe)
}
```

Fragments, outlets and context:
```angular-html
<ng-template #card let-title let-tag="label">
  <h3>{{ title }} ({{ tag }})</h3>
</ng-template>

<ng-container *ngTemplateOutlet="card; context: {$implicit: 'Intro', label: 'new'}" />
<ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{$implicit: 'Next', label: 'old'}" />
<ng-container *ngTemplateOutlet="card; context: ctx; injector: 'outlet'" />  <!-- inherit outlet's injector -->
<ng-container [ngComponentOutlet]="widgetType()" />
```
```ts
export class Host {
  card = viewChild<TemplateRef<unknown>>('card');
  private vcr = inject(ViewContainerRef);
  show(tpl: TemplateRef<unknown>) {
    this.vcr.createEmbeddedView(tpl, { $implicit: 'Intro', label: 'x' }, { injector: this.customInjector });
  }
}
```

Providing a value to a template region via a directive on `<ng-container>`:
```angular-html
<ng-container theme="dark">  <!-- Theme directive; descendants can inject it -->
  <profile-pic />
</ng-container>
```

Template reference variables:
```angular-html
<input #query />
<my-datepicker #start />
<section dropZone #zone="dropZone">...</section>   <!-- requires exportAs: 'dropZone' -->
<button (click)="search(query.value)">Go</button>
```

Deferred loading:
```angular-html
@defer (on viewport; prefetch on idle) {
  <heavy-chart />
} @placeholder (minimum 300ms) {
  <div>Chart preview</div>   <!-- single root element: it is the viewport target -->
} @loading (after 100ms; minimum 1s) {
  <p>Loading...</p>
} @error {
  <p>Could not load chart.</p>
}

<div #anchor>Reviews</div>
@defer (on interaction(anchor); on timer(5s)) { <reviews /> }   <!-- OR conditions -->
@defer (on viewport({trigger: anchor, rootMargin: '100px', threshold: 0.5})) { <reviews /> }
@defer (when isReady()) { <report /> }
```
```ts
// import { HeavyChart } from './heavy-chart';   // direct file, not './index'
bootstrapApplication(App, { providers: [provideIdleServiceWith(MyIdleService)] });
```

Testing defer states:
```ts
TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual });
const fixture = TestBed.createComponent(Host);
const [block] = await fixture.getDeferBlocks();
await block.render(DeferBlockState.Loading);
await block.render(DeferBlockState.Complete);
```

Error boundaries [developer preview]:
```angular-html
@boundary {
  <app-wrapper><sales-chart /></app-wrapper>
} @error (let err; reset = $reset; when isNetworkError(err)) {
  <p>Offline.</p> <button (click)="reset()">Retry</button>
} @error {
  <p>Failed: {{ $error.message }}</p> <button (click)="$reset()">Try again</button>
}
```
```ts
@Injectable()
export class AppErrors implements ErrorHandler {
  handleError(error: unknown) { /* uncaught */ }
  onViewError(error: Error, details: ErrorDetails) { report(error, details.boundary); }
}
```

## Pitfalls
- A plain (non-signal) class field read in a template may not update the rendered output when it changes.
- Mutating an object/array bound to `[class]`/`[style]`, or passed to a pure pipe, does nothing visible; replace the reference. For space-separated keys or mutated objects in class bindings the docs point to `ngClass`.
- Rendered class order is not guaranteed; duplicate class/style bindings are resolved by Angular's style precedence order.
- `<script>` elements are not supported in templates; `@` must be escaped (`&commat;` / `&#64;`) to appear literally; template comments are not rendered.
- `@for` reuses views: if a tracked item keeps its reference but its data changes, bindings and inputs update instead of the element being recreated (differs from `*ngFor`).
- `@switch` exhaustiveness does not work when switching on a function call or signal call such as `state()`.
- `@let` values cannot be reassigned (e.g. `(click)="v = v + 1"` is invalid), are not hoisted, and are invisible to parent or sibling views; control flow, `@defer`, structural directives and component boundaries create new views.
- Template reference variables declared inside `@if`/`@for`/`<ng-template>`/structural directives cannot be read from outside that scope; inner scopes can read outer ones.
- A directive without `exportAs` cannot be assigned to a template variable.
- Fragment expressions resolve against the declaring component, and a fragment's injector comes from where it is declared, not where it renders (override with an injector or `'outlet'`).
- On `<ng-container>`, class/style bindings, DOM event listeners and static attributes are ignored (even from directives); attribute bindings throw; property bindings only reach directive inputs.
- Pipe precedence: lower than `+ - * / % && || ??`, higher than the ternary, so `a ? b : c | p` pipes only `c`.
- Template expressions have no bitwise operators (`|` is the pipe), no BigInt, no `new`, no destructuring, no comma operator, no declarations, and no globals other than `undefined` and `$any` (so no `Number`, `parseInt`, `NaN`, ...).
- Assignment and `++`/`--` are compile errors in bindings/interpolation except inside an arrow function; arrow functions need an expression body; pipes cannot appear inside arrow functions (an arrow function may be a pipe argument).
- Event handler statements allow assignment (not destructuring) but not pipes.
- A template variable with the same name as a class member shadows it; use `this.name` to reach the member.
- `@defer`: non-standalone dependencies, ones also used outside the block in the same file, or ones in `ViewChild` queries load eagerly; dependencies of `@placeholder`, `@loading` and `@error` are always eager; import order of deferred deps is not guaranteed.
- `viewport`, `interaction` and `hover` triggers without a reference need a `@placeholder` with exactly one root element; a referenced element must be in the same template.
- With HMR active every defer chunk loads eagerly regardless of triggers; serve with `--no-hmr` to restore trigger behavior.
- In SSR/SSG, defer blocks render only the `@placeholder` (or nothing) and triggers do not fire until the client; use incremental hydration with `hydrate` triggers to render main content on the server.
- Screen readers may not announce when deferred content replaces placeholder/loading content without a live region.
- An exception thrown inside an `@error` block goes to the next outer `@boundary`, or becomes an unhandled application error.
- Since v22, `?.` returns `undefined` (standard JS) instead of `null`.
- `preserveWhitespaces: true` noticeably increases DOM nodes and slows rendering.

## Version notes
- [developer preview] `@boundary` error boundaries (with `@error`, `$error`, `$reset`, `when` clauses).
- [v22+] Optional chaining (`?.`) in template expressions follows standard JavaScript and yields `undefined`; earlier versions yielded `null`.
- [v22+] `ng update` to v22 wraps existing expressions in `$safeNavigationMigration(...)` to keep the old behavior; it is a temporary aid that may be removed in a future version.
