# Signal Forms: metadata, dynamic forms, custom controls, testing

> Sources (angular.dev, v22.3 @ bd1e32b): Field metadata — https://angular.dev/guide/forms/signals/field-metadata,
> Dynamic Forms with JSON — https://angular.dev/guide/forms/signals/dynamic-forms-with-json,
> Custom Controls — https://angular.dev/guide/forms/signals/custom-controls,
> Testing Signal Forms — https://angular.dev/guide/forms/signals/testing.

## When to use
- Attaching per-field reactive data (help text, currency symbol, severity, parsed value) that built-in state like `valid()`/`disabled()` does not cover (`createMetadataKey`, `metadata`).
- Combining contributions from several schema rules into one value per field (`MetadataReducer`).
- Giving each field its own lifecycle-bound object such as an `httpResource()` or `effect()` (`createManagedMetadataKey`).
- Rendering forms whose fields, validation and conditions arrive at runtime as JSON (backend, admin panel, CMS, per-tenant config).
- Building a component (date picker, toggle, rich editor, currency input) that binds with `[formField]` like a native input (`FormValueControl`, `FormCheckboxControl`, `transformedValue`).
- Unit-testing schema logic without a DOM, or component-testing DOM bindings and custom controls.
- See also: `hidden()`, schema composition (`schema`/`apply`/`applyWhen`), native HTML validation → references/guide/forms-signals-validation.md
- See also: form models, initial values, migration/interop of custom controls → references/guide/forms-signals.md

## Rules
### Metadata
- MUST define each metadata key once at module scope and import it; every `createMetadataKey()` call yields a distinct key even with identical type params.
- MUST pass a reducer to `createMetadataKey()` when more than one rule may contribute to the key; without one, the key uses override semantics and earlier contributions are silently dropped.
- PREFER custom metadata over a side `Map<fieldKey, value>` kept next to the form; metadata stays with the schema, is reactive, and follows the field lifecycle.
- MUST gate reads with `hasMetadata(key)` when the key may not be registered (`metadata(key)` is `undefined` then); use `?.()` or `!()` only when a rule is known to register it.
- MUST keep reducers pure: `reduce()` uses only its two arguments and `getInitial()` returns the same value on every call.
- MUST put any reactive behavior of a managed key inside an `effect()`, `resource()` or `httpResource()` created in `create`; `create` itself runs once and is not reactive.
- AVOID confusing `MetadataReducer.min()/max()` (pick smallest/largest contribution) with the `min()`/`max()` validators (enforce bounds).

### Dynamic (JSON) forms
- PREFER a static form when the structure is known at build time (full type checking, simpler testing and tooling).
- PREFER a discriminated union on `kind` for the field config so each variant declares its own options.
- MUST derive both the model and the schema from the same `FieldConfig[]` so they cannot drift apart.
- MUST initialize numeric fields to `null`, not `0`; `0` counts as filled for `required()` and fails any `min()` above zero before user input.
- MUST initialize array fields to `[]` and text fields to `''`.
- MUST validate untrusted configs at the boundary (unique names; `when` targets exist, are not arrays, and `equals` matches the target's type) before building the form.
- PREFER translating conditional config (`when`) into `applyWhen()` and repeating config (`array`) into `applyEach()`; use `hidden()` the same way to gate visibility instead of validation.
- PREFER keeping `as unknown as SchemaPath<…>` / `FieldTree<…>` / `Field<…>` casts scoped inside the matching `kind` branch or a typed accessor, so the runtime invariant stays local and auditable.
- MUST change array length by updating the model signal; the form re-derives item fields automatically.

### Custom controls
- MUST implement `FormValueControl<T>` with a `value` model signal for single-value controls; such a control MUST NOT have a `checked` property.
- MUST implement `FormCheckboxControl` with a `checked` model signal for boolean on/off controls; such a control MUST NOT have a `value` property.
- PREFER implementing only the optional `FormUiControl` inputs the control actually needs.
- PREFER reusing a Signal Forms custom control directly inside Reactive and Template-Driven forms; no extra compatibility layer is needed.
- PREFER binding custom controls with `[formField]` just like native inputs: it detects the implemented interface, binds `value`/`checked` to the field value, and feeds state signals (`disabled()`, `errors()`, …) into matching optional inputs.
- MUST emit a `touch` output on the native `blur` event (NEVER on `focus`) so the field is marked touched and `debounce('blur')` commits values.
- NEVER implement validation in the control; define rules in the schema and only display `invalid()`/`errors()` and constraint inputs.
- PREFER `transformedValue()` over an `effect()` for display/model value conversion; controls MUST NOT register their own effects for state management.
- PREFER returning `{error}` from `parse` when raw input has no valid model value (e.g. would yield `NaN`); return `{value, error}` to update the model and flag a problem.
- PREFER shipping a companion `schema()` with a reusable control and having consumers compose it with `apply()`.
- MUST have consumers initialize every bound field with a defined value (e.g. `''`); `undefined` means the field is absent, not empty.

### Testing
- MUST supply an injection context when calling `form()` in a test: pass `{injector: TestBed.inject(Injector)}` or wrap in `TestBed.runInInjectionContext()`.
- PREFER the explicit `{injector}` option when the test creates the form; use `runInInjectionContext()` when the code under test calls `form()` internally.
- PREFER isolated (no DOM) tests for schema behavior; add component tests only when behavior crosses into the DOM.
- PREFER asserting `errors()` over only `valid()`/`invalid()`; it shows which rule failed.
- PREFER testing cross-field rules by setting one field and asserting another field's state.
- MUST `await fixture.whenStable()` after creating the component, after each DOM change, and after async work (async validators, server calls) before asserting.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `createMetadataKey<TWrite>()` | New unique metadata key | Override semantics by default (last contribution wins) |
| `createMetadataKey<TWrite, TAcc>(reducer)` | Key whose contributions fold into `TAcc` | e.g. `<string, string[]>(MetadataReducer.list())` |
| `metadata(path, key, logic)` | Contribute a value to `key` on a field inside a schema | `logic` ctx: `value` (signal), `state` (`FieldState`), `valueOf(path)`, `stateOf(path)`; reads are reactive dependencies |
| `field().hasMetadata(key)` | `true` if any rule registered `key` on the field | Use before `metadata(key)` when registration is uncertain |
| `field().metadata(key)` | Signal of reduced value, or `undefined` if unregistered | Inner value may still be `undefined` depending on reducer |
| `MetadataReducer.list<T>()` | `T[]`, appends non-`undefined` items | Initial `[]`; accepts `T \| undefined` (only built-in that does) |
| `MetadataReducer.or()` | `boolean`, true if any item is true | Initial `false` |
| `MetadataReducer.and()` | `boolean`, true only if all items are true | Initial `true` |
| `MetadataReducer.min()` / `.max()` | Smallest / largest contributed number | `number \| undefined`; initial `undefined` |
| `MetadataReducer.override()` | Last item replaces previous (default) | `T \| undefined`; initial `undefined` |
| `MetadataReducer.override(fn)` | Same with an initial value | `T`; initial `fn()` |
| `MetadataReducer<TAcc, TItem>` | Custom reducer interface | `{reduce(acc, item): TAcc; getInitial(): TAcc}` |
| `createManagedMetadataKey<TRead, TWrite>(create)` | Key holding a lifecycle-aware object per field | `create(state, dataSignal)` runs once in the field's injection context; return value stored as-is (no `computed()` wrap) |
| `FieldState` getters `required`, `min`, `max`, `minLength`, `maxLength`, `pattern` | Read built-in constraint metadata | Backed by keys below |
| `REQUIRED` | from `required()` | `boolean`, reducer `or()` |
| `MIN` → `MIN_NUMBER` / `MIN_DATE` | from `min()` / `minDate()` | `number`/`Date \| undefined`, reducer `max()`; getter `min` |
| `MAX` → `MAX_NUMBER` / `MAX_DATE` | from `max()` / `maxDate()` | `number`/`Date \| undefined`, reducer `min()`; getter `max` |
| `MIN_LENGTH` / `MAX_LENGTH` | from `minLength()` / `maxLength()` | `number \| undefined`; reducers `max()` / `min()` |
| `PATTERN` | from `pattern()` | `RegExp[]`, reducer `list<RegExp>()`; value must match all |
| `email()`, `validate()` | Non-constraint validators | Do NOT contribute metadata |
| `applyWhen(path, cond, schemaFn)` | Activate rules while `cond` is true | Rules deactivate and validation state clears when false |
| `applyEach(arrayPath, itemSchemaFn)` | Per-item rules for an array field | Runs per item; managed `create` runs once per item |
| `SchemaFn<T>` / `SchemaPath<T>` | Schema function / path types | Cast broad record paths per `kind` |
| `FieldTree<T>` | Navigable, iterable field tree | Needed for `@for` over arrays; items are `FieldTree<string>` |
| `Field<T>` | Callable field signature without iteration | Fine for leaf accessors bound with `[formField]` |
| `FormRoot` / `[formRoot]` | Binds the `<form>` element to the form | Used on the dynamic form example |
| `FormValueControl<T>` | Single-value control contract | Requires `value = model<T>()`; no `checked` |
| `FormCheckboxControl` | Boolean control contract | Requires `checked = model<boolean>()`; no `value` |
| `FormUiControl` | Base of both; all-optional state inputs | See table below |
| `touch = output<void>()` | Report blur/interaction to the form | Required for touched state and `debounce('blur')` |
| `transformedValue(valueModel, {parse, format})` | Writable raw-value signal synced with the model | `format(model) → raw`; `parse(raw) → {value} \| {error} \| {value, error}` |
| `field().reset()` | Reset field | Clears pending parse errors and re-formats the raw value |
| `schema<T>(fn)` / `apply(path, schema)` | Companion schema for reusable controls | `apply` composes with other rules, does not replace them |
| `form(model, schema, {injector})` | Create form with explicit injector | Throws without an injection context |
| `TestBed.runInInjectionContext(fn)` | Ambient injection context for `form()` | For code that calls `form()` internally |

Optional `FormUiControl` inputs:

| Group | Properties |
| --- | --- |
| Interaction | `touched` (user interacted), `dirty` (value changed, even if reverted) |
| Validation | `errors` (array), `invalid`, `pending` (async validation running) |
| Availability | `disabled`, `disabledReasons`, `readonly` (shown, not editable), `hidden` |
| Constraints | `required`, `min`, `max`, `minLength`, `maxLength` (`undefined` = none), `pattern` (array of `RegExp`) |
| Metadata | `name` (field name attribute, unique across forms and apps) |

`disabledReasons` items are `DisabledReason` objects with `fieldTree` and optional `message`. Typed as `readonly WithOptionalFieldTree<DisabledReason>[]`; `errors` as `readonly WithOptionalFieldTree<ValidationError>[]`.

## Patterns
### Custom metadata key with a reducer
```ts
import {createMetadataKey, metadata, MetadataReducer, form} from '@angular/forms/signals';

export const HINTS = createMetadataKey<string, string[]>(MetadataReducer.list());

const f = form(model, (p) => {
  metadata(p.username, HINTS, () => 'Must be unique.');
  metadata(p.username, HINTS, ({value}) => (value().length < 3 ? 'Too short.' : undefined));
});
// f.username().metadata(HINTS)!() -> string[]
```

```angular-html
@if (f.username().hasMetadata(HINTS)) {
  @for (h of f.username().metadata(HINTS)!(); track h) { <p>{{ h }}</p> }
}
```

### Custom reducer
```ts
type Level = 'info' | 'warning' | 'error';
const RANK: Record<Level, number> = {info: 0, warning: 1, error: 2};

const worst: MetadataReducer<Level | undefined, Level> = {
  reduce: (acc, item) => (acc === undefined || RANK[item] > RANK[acc] ? item : acc),
  getInitial: () => undefined,
};
export const LEVEL = createMetadataKey<Level, Level | undefined>(worst);
```

### Managed metadata (resource per field)
```ts
export const PREVIEW = createManagedMetadataKey((_state, url: Signal<string | undefined>) =>
  httpResource<Preview>(() => (url() ? {url: '/api/preview', params: {url: url()!}} : undefined)),
);

linksForm = form(this.linksModel, (p) => {
  applyEach(p.links, (item) => metadata(item.url, PREVIEW, ({value}) => value()));
});
```

```angular-html
@let preview = link.url().metadata(PREVIEW);
@if (preview?.isLoading()) { <p>Loading…</p> }
@else if (preview?.hasValue() && preview.value(); as data) { <h3>{{ data.title }}</h3> }
@else if (preview?.error()) { <p>Preview failed.</p> }
```

### JSON-driven schema (conditional + array)
```ts
type When = {field: string; equals: string | number};
type FieldConfig =
  | {kind: 'text'; name: string; label: string; required?: boolean; when?: When}
  | {kind: 'number'; name: string; label: string; required?: boolean; min?: number; max?: number; when?: When}
  | {kind: 'array'; name: string; label: string; itemRequired?: boolean; when?: When};
type Model = Record<string, string | number | null | string[]>;

const buildModel = (cfgs: FieldConfig[]): Model =>
  Object.fromEntries(cfgs.map((c) => [c.name, c.kind === 'number' ? null : c.kind === 'array' ? [] : '']));

const buildSchema = (cfgs: FieldConfig[]): SchemaFn<Model> => (root) => {
  for (const c of cfgs) {
    const rules = (p: typeof root) => {
      const fp = p[c.name];
      if (c.kind === 'array') {
        if (c.itemRequired) applyEach(fp as unknown as SchemaPath<string[]>, (i) => required(i));
        return;
      }
      if (c.required) required(fp);
      if (c.kind === 'number') {
        const np = fp as unknown as SchemaPath<number | null>;
        if (c.min !== undefined) min(np, c.min);
        if (c.max !== undefined) max(np, c.max);
      }
    };
    if (c.when) {
      const {field, equals} = c.when;
      applyWhen(root, ({valueOf}) => valueOf(root[field]) === equals, rules);
    } else rules(root);
  }
};
```

### JSON-driven rendering
```ts
configs = validateConfigs(rawConfigs); // throw on duplicate names / bad `when`
model = signal(buildModel(this.configs));
dynamicForm = form(this.model, buildSchema(this.configs));

asText(n: string) { return this.dynamicForm[n] as unknown as Field<string>; }
asNumber(n: string) { return this.dynamicForm[n] as unknown as Field<number | null>; }
asArray(n: string) { return this.dynamicForm[n] as unknown as FieldTree<string[]>; }
addItem(n: string) { this.model.update((m) => ({...m, [n]: [...(m[n] as string[]), '']})); }
removeItem(n: string, idx: number) {
  this.model.update((m) => ({...m, [n]: (m[n] as string[]).filter((_, i) => i !== idx)}));
}
```

```angular-html
<form [formRoot]="dynamicForm">
  @for (config of configs; track config.name) {
    @switch (config.kind) {
      @case ('text') { <label>{{ config.label }} <input type="text" [formField]="asText(config.name)" /></label> }
      @case ('number') { <label>{{ config.label }} <input type="number" [formField]="asNumber(config.name)" /></label> }
      @case ('array') {
        <fieldset><legend>{{ config.label }}</legend>
          @for (item of asArray(config.name); track item; let i = $index) {
            <input type="text" [formField]="item" />
            <button type="button" (click)="removeItem(config.name, i)">Remove</button>
          }
          <button type="button" (click)="addItem(config.name)">Add</button>
        </fieldset>
      }
    }
  }
</form>
```

### Custom value control with state inputs
```ts
@Component({
  selector: 'app-text-field',
  template: `
    @if (!hidden()) {
      <input [value]="value()" (input)="value.set($event.target.value)"
        [disabled]="disabled()" [readonly]="readonly()"
        [attr.aria-invalid]="invalid()" (blur)="touch.emit()" />
      @if (invalid()) {
        <div role="alert">@for (e of errors(); track e) { <span>{{ e.message }}</span> }</div>
      }
    }
  `,
})
export class TextField implements FormValueControl<string> {
  value = model('');
  touched = input(false);
  touch = output<void>();
  disabled = input(false);
  readonly = input(false);
  hidden = input(false);
  invalid = input(false);
  errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);
}
```

```ts
// Checkbox-style control
export class Switch implements FormCheckboxControl {
  checked = model(false);
  flip() { this.checked.update((v) => !v); }
}
```

```angular-html
<app-text-field [formField]="signup.email" />
<app-switch [formField]="signup.acceptTerms" />
```

### Value transformation with parse errors
```ts
export class AmountInput implements FormValueControl<number | null> {
  readonly value = model.required<number | null>();
  protected readonly raw = transformedValue(this.value, {
    parse: (s: string) => {
      const n = s ? Number(s) : null;
      return Number.isNaN(n) ? {error: {kind: 'parse', message: `${s} is not a number`}} : {value: n};
    },
    format: (n: number | null) => n?.toString() ?? '',
  });
}
// template: <input [value]="raw()" (input)="raw.set($event.target.value)" />
// parse errors appear in orderForm.amount().errors(); orderForm.amount().reset() clears them
```

### Companion schema for a reusable control
```ts
export const emailSchema = schema<string>((p) => {
  required(p, {message: 'Email is required'});
  email(p, {message: 'Enter a valid email'});
});
// consumer
signupForm = form(this.signupModel, (p) => apply(p.email, emailSchema));
```

### Isolated form test
```ts
it('requires name, plus conditional rule', () => {
  const model = signal({name: '', age: 5});
  const f = form(model, (p) => {
    required(p.name);
    required(p.name, {
      error: (ctx) => ({kind: `required-${ctx.valueOf(p.age)}`}),
      when: ({valueOf}) => valueOf(p.age) > 10,
    });
  }, {injector: TestBed.inject(Injector)});

  expect(f.name().errors()).toEqual([expect.objectContaining({kind: 'required'})]);
  f.age().value.set(15);
  expect(f.name().errors()).toEqual([
    expect.objectContaining({kind: 'required'}),
    expect.objectContaining({kind: 'required-15'}),
  ]);
  f.name().value.set('Ada');
  expect(f.name().valid()).toBe(true);
});

// when form() is created inside the code under test
TestBed.runInInjectionContext(() => { const f = form(model, schemaFn); /* assert */ });
```

### Component-bound test
```ts
const fixture = TestBed.createComponent(ProfileForm); // component calls form() with no injector
await fixture.whenStable();
const el = fixture.nativeElement.querySelector('input') as HTMLInputElement;
expect(el.value).toBe('Ada');            // model -> view
el.value = '';
el.dispatchEvent(new Event('input'));    // view -> model
await fixture.whenStable();
expect(fixture.componentInstance.profileForm.name().valid()).toBe(false);
```

| Verify | Test style |
| --- | --- |
| Validation rules, `errors()`, `valid()`, `invalid()` | Isolated |
| Disabled / required / readonly state | Isolated |
| Cross-field dependencies | Isolated |
| `applyWhen` / `applyWhenValue` conditional schemas | Isolated |
| Values rendered in the DOM; typing updates the model | Component-bound |
| Custom controls with their own templates | Component-bound |
| Focus management, accessibility attributes | Component-bound |

## Pitfalls
- Two `metadata()` rules on an override key: only the last value survives, with no warning.
- `field().metadata(key)` returns `undefined` (not a signal) when no rule registered the key, so guard or optional-chain before calling it.
- Even with `!()`, the inner value can be `undefined` for override/min/max keys.
- Impure reducers produce inconsistent metadata because reductions re-run whenever any contribution's signals change.
- Managed `create` runs once at field construction; logic placed directly in it will not react to signal changes. Cleanup of `resource()`/`effect()`/`DestroyRef` callbacks registered there happens when the field (e.g. a removed array item) is destroyed.
- `min(path, 18)` and `min(path, 21)` both validate independently; `field().min!()` reports the strictest (`21`). `MIN_*` keys use the `max()` reducer and `MAX_*` keys use `min()`.
- `@switch` on `config.kind` does not narrow `dynamicForm[name]` in template type-checking; restate the type with a cast accessor.
- `Record<string, …>` paths are too broad for `applyEach()`, `min()`, `max()` to type-check without a cast.
- Untrusted config failure modes: duplicate `name` overwrites model entries and breaks `track config.name`; a `when` naming a missing field fails at runtime on first evaluation; `when` against an `array` field has no equality semantics; an `equals` of the wrong type silently never matches.
- Arrays of primitives are tracked by position: removing an item shifts later values into earlier slots, which keep their old field state, and the last field is dropped.
- Arrays of objects are tracked by JS object reference: held field refs survive sort/reorder/filter, but removing the item orphans the ref, and replacing the array with freshly deserialized objects (e.g. server reload) loses field state even if ids match.
- New array items start with fresh validation state.
- The dynamic form example assumes the config is available synchronously at component construction.
- A custom control that never emits `touch` is never marked touched, and with `debounce('blur')` its values never reach the model.
- A `parse` that converts bad input (e.g. `Number('abc')` → `NaN`) without returning `{error}` writes the invalid value into the model.
- A field with parse errors is invalid and blocks submission like a failed validator; native inputs (e.g. partial `<input type="date">`) report the same `parse` error kind.
- Calling `form()` in a test without an injector or injection context throws before any assertion runs.
- In component tests, `whenStable()` is what waits for rendering and effects to finish; assert only after awaiting it.

## Version notes
- None stated in the docs.
