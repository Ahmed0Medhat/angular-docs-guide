# Signal Forms: validation, form logic, schemas, submission and async rules

> Sources (angular.dev, v22.3 @ bd1e32b): Validation — https://angular.dev/guide/forms/signals/validation,
> Form logic — https://angular.dev/guide/forms/signals/form-logic,
> Cross-field logic — https://angular.dev/guide/forms/signals/cross-field-logic,
> Form submission — https://angular.dev/guide/forms/signals/form-submission,
> Schemas — https://angular.dev/guide/forms/signals/schemas,
> Async operations — https://angular.dev/guide/forms/signals/async-operations.

## When to use
- Attaching built-in or custom validation rules to Signal Forms fields (required, email, ranges, dates, lengths, regex)
- Validating one field against another (password confirmation, date ranges, conditional requirements) or a whole group with `validateTree()`
- Disabling, hiding, making readonly, debouncing, or attaching metadata to fields reactively
- Packaging rules into reusable schemas and activating them conditionally or per array item
- Checking values against a server (`validateHttp()` / `validateAsync()`) with pending state, debouncing and cancellation
- Submitting a form with `FormRoot` / `submit()`, routing server errors to fields, and gating on validation
- See also: field state signals, error display, models, automatic status classes → references/guide/forms-signals.md
- See also: custom controls, value transformation / parse errors, field metadata keys and reducers → references/guide/forms-signals-advanced.md

## Rules
- MUST declare validation and other rules inside the schema function given as the 2nd argument of `form(model, schemaFn)`; that function executes a single time while the form is created, and the reactive logic passed to rules re-evaluates whenever the signals it reads change.
- MUST return an error object (`kind`, optional `message`) from a `validate()` validator when the value is bad, and `null` or `undefined` when it is fine.
- MUST use the scoped path parameter handed to a nested schema function (`applyWhen`, `applyWhenValue`, `applyEach`, `apply`, `schema`); paths captured from an outer schema are not valid inside it.
- MUST return explicitly `false` (not merely a falsy value) from a `disabled()` `when` function to keep the field enabled; return a string to disable it with a reason.
- MUST render or hide a `hidden()` field yourself (`@if` or CSS): `[formField]` never sets a `hidden` attribute.
- NEVER rely on native validity (`:valid`/`:invalid` pseudo-classes, `element.validity`, `validationMessage`) to observe Signal Forms state; bind classes to field state signals or configure automatic status classes instead.
- NEVER read state in a validator that itself depends on that field's validation (for example, the parent's `valid()`); that forms an infinite loop.
- PREFER `required(path, {when})` over a hand-written `validate()` for conditional requirements: it also publishes required metadata, which drives accessibility (screen readers announce the field as required).
- PREFER `validate()` + `valueOf()` when the error belongs on the field being checked, even if it reads other fields; use `validateTree()` only for logic about a group or when errors must target different children.
- PREFER placing a cross-field error where the user would most likely go to fix it; add a mirrored `validate()` on each field if both should show the error.
- PREFER `applyWhenValue()` with a type-guard predicate for discriminated unions / variant types (rules are typed to the narrowed value).
- PREFER `schema()` only when rules are reused across forms or paths; an inline schema function is fine otherwise.
- PREFER `validateHttp()` for async checks; reach for the lower-level `validateAsync()` only when `validateHttp()` cannot do the job (non-HTTP sources such as WebSocket/IndexedDB/Web Worker, custom caching, custom retry/backoff, full resource lifecycle).
- AVOID async validation for anything checkable on the client; use `pattern()`, `email()` or `validate()` for format and static rules.
- MUST validate format synchronously before the async check (sync rules run first and block the request when they fail).
- PREFER returning `undefined` from `request` (or `params`) to skip async validation for empty or too-short values.
- PREFER friendly `message` text in async error handlers; log technical details (e.g. `console.error`) separately.
- PREFER clear, specific error messages that say how to fix the problem (not "Invalid input").
- PREFER the `touched() && invalid()` template pattern so errors stay hidden until the user interacts with the field.
- PREFER resolving the debouncer promise when its `AbortSignal` fires so pending timers are released.
- AVOID `debounce()` when the field needs instant updates (e.g. calculator inputs), users expect real-time feedback, or the performance gain is negligible.
- MUST put side effects that need data produced by the action (e.g. a server-generated id) inside the `action`; with `FormRoot`, side effects always go in the `action` because `FormRoot` invokes `submit()` itself.
- PREFER `ignoreValidators: 'none'` when async validators must finish before submitting; `'all'` for draft-saving regardless of validity.

## API cheat-sheet
All imported from `@angular/forms/signals` unless noted.

| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `form(model, schemaFn?, options?)` | Create a field tree; `schemaFn(schemaPath: SchemaPathTree)` binds rules | Parameter name is arbitrary; `options.submission` configures `FormRoot` submit |
| `required(path, {message?, when?})` | Field must be non-empty | Empty = `null`, `undefined`, `''`, `false`, `NaN`, `Infinity`, `-Infinity`; `0` and `[]` are non-empty. Sets `REQUIRED` metadata + native `required` |
| `email(path, opts?)` | Standard email-format regex | Rejects `user@`, `@example.com` |
| `min(path, n \| () => n \| ctx => n, opts?)` / `max(...)` | Numeric bounds; value may be computed/reactive | Sets `MIN`/`MAX` metadata + native `min`/`max` |
| `minDate(path, date, opts?)` / `maxDate(...)` | Bounds for `Date` values (e.g. `<input type="date">`) | Also set `min`/`max` attributes and `MIN`/`MAX` metadata |
| `minLength(path, n, opts?)` / `maxLength(...)` | Characters for strings, elements for arrays | Sets `MIN_LENGTH`/`MAX_LENGTH` + native `minlength`/`maxlength` |
| `pattern(path, regex, opts?)` | Regex match | Sets `PATTERN` metadata but NOT the native `pattern` attribute (multiple patterns per field allowed) |
| `validate(path, ctx => err \| null \| undefined)` | Custom single-field rule | Receives `FieldContext` |
| `validateTree(path, ctx => err \| err[] \| null)` | Rule over a subtree; each error may carry `fieldTree` to target a child | Same `FieldContext` as `validate()` |
| `validateHttp(path, {request, onSuccess, onError, options?, debounce?})` | HTTP-backed async rule | `request` returns URL string, `HttpResourceRequest`, or `undefined` (skip); `options.parse` types the response |
| `validateAsync(path, {params, factory, onSuccess, onError, debounce?})` | Resource-based async rule | `params` runs per change (`undefined` skips); `factory(paramsSignal)` runs once and returns a resource |
| `validateStandardSchema(path, schema \| () => schema)` | Standard Schema libraries (Zod, Valibot) | Function form re-validates when signals it reads change |
| `applyEach(arrayPath, schemaOrFn)` | Rules per array item, including items added later | Item path is a scoped `SchemaPathTree` |
| `apply(path, schema)` | Apply a reusable schema to a sub-path | Schema sees only that sub-path |
| `applyWhen(path, ctx => boolean, schemaOrFn)` | Conditionally activate a group of rules | Rules exist always; condition toggles whether they are active |
| `applyWhenValue(path, value => boolean \| typeGuard, schemaOrFn)` | Condition on the field's own raw value | Type guard narrows the schema's type |
| `schema<T>(fn)` | Wrap rules as a reusable `Schema<T>` | Cached per form compilation; runs once per form |
| `disabled(path, {when?})` | Disabled state; `when` returns `true`, a reason string, or `false` | `[formField]` binds `disabled`; reasons accumulate across calls → `disabledReasons()` (`{message}`) |
| `hidden(path, {when?})` | Programmatic hidden state only | No DOM attribute; read `field().hidden()` |
| `readonly(path, {when?})` | Not editable but focusable/selectable | `[formField]` binds `readonly` |
| `debounce(path, ms \| 'blur' \| Debouncer)` | Delay writing UI value to the model | `Debouncer = (ctx, abortSignal) => Promise<void> \| undefined` |
| `metadata(path, KEY, () => value)` | Attach reactive data to a field | Built-in keys: `REQUIRED`, `MIN`, `MAX`, `MIN_LENGTH`, `MAX_LENGTH`, `PATTERN` |
| `submit(fieldTree, actionOrOptions)` | Run the submission flow | `Promise<boolean>`; rejects if action throws |
| `FormRoot` (`[formRoot]`) | Bind form to `<form>` | Adds `novalidate`, prevents default, calls `submit()` when `submission` option exists |
| Field state signals | `valid()`, `invalid()`, `errors()`, `pending()`, `touched()`, `dirty()`, `submitting()`, `errorSummary()`, `disabledReasons()`, `required()`, `min()`, `max()`, `minLength()`, `maxLength()`, `pattern()` | `min?.()` style optional call used in templates |

**Validation error object**: `kind` (rule id, e.g. `'required'`, auto-set by built-ins), `message` (optional), `fieldTree` (optional target, for `validateTree`/submission errors).

**`FieldContext`** (given to validators, `when`, logic functions):

| Member | Type | Use |
| --- | --- | --- |
| `value` | `Signal<TValue>` | Current field value |
| `state` | `FieldState<TValue>` | Current field state |
| `fieldTree` | `FieldTree<TValue>` | Current field tree (child access) |
| `valueOf(path)` | raw value | Most common cross-field read |
| `stateOf(path)` | `FieldState` | Another field's `valid`/`touched`/`dirty`... |
| `fieldTreeOf(path)` | `FieldTree` | Target errors at another field (e.g. in `validateTree`) |
| `pathKeys` | Signal | Keys from root to this field |

Child fields also expose a `key` signal; array item fields expose `key` and `index`.

**Submission options** (`form(..., {submission: {...}})`):

| Option | Meaning |
| --- | --- |
| `action(field, detail)` | Runs with the current value; return nothing/`null`/`undefined` for success, or error(s) to route to fields. `detail` holds `root` and `submitted` field trees |
| `onInvalid(field, detail)` | Called when validation blocks submission, after interactive fields are touched |
| `ignoreValidators` | `'pending'` (default: submit unless something failed), `'none'` (pending blocks), `'all'` (always submit) |

**Debounce layers**:

| Option | Scope |
| --- | --- |
| `debounce()` rule | Whole field waits: sync validation, derived state, submission. Custom callback type: `Debouncer` |
| `validateHttp({debounce})` / `validateAsync({debounce})` | Only that async call waits; model and other rules update per keystroke. Custom callback type: `DebounceTimer` from `@angular/core` (not interchangeable with `Debouncer`) |

**hidden vs disabled vs readonly** (all three skip validation and block editing):

| | `hidden()` | `disabled()` | `readonly()` |
| --- | --- | --- | --- |
| Shown in UI | No | Yes | Yes |
| Focus/select | No | No | Yes |
| In native HTML form submission | No | No | Yes |

## Patterns

Built-ins, conditional required, messages:
```ts
signup = form(this.model, (p) => {
  required(p.email, {message: 'Email is required'});
  email(p.email, {message: 'Enter a valid email'});
  minLength(p.password, 12, {message: 'Use 12+ characters'});
  min(p.seats, () => this.minSeats());               // reactive bound
  required(p.promo, {when: ({valueOf}) => valueOf(p.hasDiscount)});
  pattern(p.zip, /^\d{5}$/, {message: 'Five digits'});
});
```

Dates — build limits at midnight UTC:
```ts
const now = new Date();
const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
minDate(p.checkIn, today, {message: 'No past dates'});
maxDate(p.checkIn, new Date('2026-08-31'));
```

Showing errors (template):
```html
<form [formRoot]="loginForm">
  <input type="email" [formField]="loginForm.email" />
  @if (loginForm.email().touched() && loginForm.email().invalid()) {
    @for (err of loginForm.email().errors(); track err) { <p>{{ err.message }}</p> }
  }
  <button type="submit" [disabled]="loginForm().submitting()">Log in</button>
</form>
```

Custom and reusable rules:
```ts
function httpsUrl(path: SchemaPath<string>, opts?: {message?: string}) {
  validate(path, ({value}) =>
    value().startsWith('https://') ? null : {kind: 'https', message: opts?.message ?? 'Use https://'});
}
f = form(this.model, (p) => httpsUrl(p.site));
```

Cross-field (value and state of another field):
```ts
validate(p.confirm, ({value, valueOf, stateOf}) => {
  if (!stateOf(p.password).touched()) return null;
  return value() === valueOf(p.password) ? null : {kind: 'mismatch', message: 'Passwords differ'};
});
```

`validateTree` routing errors to children:
```ts
validateTree(p, ({value, fieldTreeOf}) => {
  const dupes = findDuplicateCells(value());
  return dupes.length
    ? dupes.map((key) => ({kind: 'duplicate', message: 'Repeated', fieldTree: fieldTreeOf(p[key])}))
    : null;
});
```

Reusable / conditional / per-item schemas:
```ts
const nameRules = schema<{first: string; last: string}>((n) => {
  required(n.first);
  required(n.last);
});
const lineItem = schema<Item>((i) => { required(i.name); min(i.qty, 1); });

orderForm = form(this.model, (p) => {
  apply(p.customer, nameRules);
  applyEach(p.items, lineItem);
  applyWhen(p.address, ({valueOf}) => valueOf(p.country) === 'US', usZipSchema); // valueOf reads any field
  applyWhenValue(p.payment, isCreditCard, (card) => required(card.cardNumber));  // narrowed type
});
```

Form logic rules:
```ts
form(this.model, (p) => {
  disabled(p.systemId);
  disabled(p.coupon, {when: ({valueOf}) => (valueOf(p.total) < 50 ? 'Min $50 order' : false)});
  hidden(p.publicUrl, {when: ({valueOf}) => !valueOf(p.isPublic)});
  readonly(p.title, {when: ({valueOf}) => valueOf(p.locked)});
  debounce(p.query, 300);              // or 'blur', or a Debouncer
  metadata(p.query, PLACEHOLDER, () => 'Search…');
  max(p.qty, ({valueOf}) => (valueOf(p.item) === 'widget' ? 100 : 50)); // reactive MAX metadata
});
```
```html
@if (!f.publicUrl().hidden()) { <input [formField]="f.publicUrl" /> }
@for (r of f.coupon().disabledReasons(); track r) { <p>{{ r.message }}</p> }
<label>Qty (max {{ f.qty().max?.() }})</label>
```

Custom `Debouncer`:
```ts
const adaptive: Debouncer<string> = ({value}, abort) =>
  new Promise((resolve) => {
    const id = setTimeout(resolve, value().length < 3 ? 500 : 200);
    abort.addEventListener('abort', () => { clearTimeout(id); resolve(); }, {once: true});
  });
debounce(p.username, adaptive);
```

Async HTTP validation with skip + per-validator debounce:
```ts
form(this.model, (p) => {
  required(p.username);
  minLength(p.username, 3);              // async waits for these to pass
  validateHttp(p.username, {
    debounce: 300,
    request: ({value}) => (value() ? `/api/users/check?u=${value()}` : undefined),
    // or: request: ({value}) => ({url: '/api/validate', method: 'POST', body: {u: value()}}),
    onSuccess: (res: {available: boolean}) =>
      res.available ? null : {kind: 'usernameTaken', message: 'Taken'},
    onError: () => ({kind: 'serverError', message: 'Could not verify'}),
  });
});
```
```html
@if (f.username().pending()) { <span>Checking…</span> }
<button type="submit" [disabled]="f().pending()">Submit</button>
```

`validateAsync` with a resource factory (`rxResource` from `@angular/core/rxjs-interop` also works):
```ts
checkName = (name: Signal<string | undefined>) =>
  resource({params: () => name(), loader: ({params}) => this.api.check(params)});

validateAsync(p.username, {
  params: ({value}) => (value().length >= 3 ? value() : undefined!),
  factory: this.checkName,
  debounce: 300,
  onSuccess: (r) => (r?.available ? null : {kind: 'usernameTaken', message: 'Taken'}),
  onError: () => ({kind: 'serverError', message: 'Could not verify'}),
});
```

Standard Schema (Zod/Valibot), static or dynamic:
```ts
form(signal({email: '', password: ''}), (p) => validateStandardSchema(p, userZodSchema));
form(this.model, (p) => validateStandardSchema(p, () => this.schemaSignal()));
```

Submission via `FormRoot`:
```ts
contactForm = form(this.model, (p) => { required(p.email); }, {
  submission: {
    action: async (f) => {
      const res = await save(f().value());
      if (res.ok) return;
      return {kind: 'taken', message: res.message, fieldTree: f.email}; // or an array of errors
    },
    onInvalid: (f) => f().errorSummary()[0]?.fieldTree().focusBoundControl(),
    ignoreValidators: 'none',
  },
});
```

Manual submission:
```ts
async onSave() {
  const ok = await submit(this.contactForm, async (f) => { await save(f().value()); });
  if (ok) await this.router.navigate(['/done']);
}
```

## Pitfalls
- Hidden, disabled and readonly fields do not validate; their rules are skipped until the field is interactive again (value is preserved).
- Validators never short-circuit: every rule on a field runs and several errors can coexist (e.g. `email()` and `minLength()` both firing for `"a@"`; an empty field shows only the `required()` error in the docs example).
- Async rules start only after all sync rules pass; while running, `pending()` is `true`, `valid()` and `invalid()` are both `false`, and `errors()` is empty.
- `valid()` is `false` during pending even with no errors; `invalid()` is `true` only when errors exist.
- By default `submit()` does not wait for pending async validators; the action still runs unless `ignoreValidators: 'none'`.
- Pending async requests are cancelled automatically when the value changes; no manual cancellation needed.
- Signal Forms does not run browser constraint validation; mirrored attributes (`required`, `min`, `max`, `minlength`, `maxlength`) exist for input behavior and accessibility only. The browser may still flag inputs invalid as a side effect; this varies and is unsupported.
- Exception: when the browser cannot parse a native input's value (e.g. a half-typed date), Signal Forms reports a parse error through `errors()`.
- `required()` treats `[]` as present; use `minLength()` to require a minimum item count. `false` counts as empty (unchecked checkbox fails), and so do non-finite numbers.
- `<input type="date">` uses midnight UTC. Limits built from local time (`new Date(2026, 5, 1)`, `new Date()`) shift by the UTC offset; the `min`/`max` attribute can be off by a day and the limit date itself rejected. `minDate(path, new Date())` can reject today in UTC and time zones behind it.
- `pattern()` does not set the native `pattern` attribute.
- `hidden()` takes precedence over disabled; disabled blocks editing whatever the readonly state; debounce and metadata apply independently of other state.
- A single cross-field `validate()` re-runs when either field changes but only marks the field it is attached to.
- Without `fieldTree`, `validateTree` errors land on the parent rather than the child.
- The `debounce()` rule flushes immediately when the field is touched (native inputs on blur, or explicitly); clicking submit blurs the focused input, flushing it before the handler. Submission touches fields, which also syncs debounced values.
- With `debounce(path, 'blur')`, sync/async validation, derived signals and rules all see the previous value until touch.
- A `Debouncer`'s `AbortSignal` fires on touch or on a newer value; the pending value is written on touch and discarded when superseded.
- Submission errors clear as soon as the user edits that field and do not come back until the next submit; validation errors recompute on every change. Both appear in `errors()`.
- Errors returned from `action` without `fieldTree` attach to the field tree passed to `submit()`.
- `submit()` resolves `false` when validation fails, the action returns errors, or another submission of the same form (or any descendant) is in progress; it rejects if the action throws.
- `submit()` marks only interactive fields as touched; hidden, disabled and readonly fields are skipped.
- `FormRoot` adds `novalidate` for you; without `FormRoot` the docs examples add `novalidate` and call `event.preventDefault()` manually.
- `FormRoot` only calls `submit()` if the form was created with a `submission` option.
- When calling `submit()` directly, the action is the second argument instead of living in `FormOptions`.

## Version notes
- None stated in the docs.
