# Forms overview and Signal Forms

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/forms,
> Overview — https://angular.dev/guide/forms/signals/overview,
> Form models — https://angular.dev/guide/forms/signals/models,
> Form model design — https://angular.dev/guide/forms/signals/model-design,
> Field state management — https://angular.dev/guide/forms/signals/field-state-management,
> Comparison with other form systems — https://angular.dev/guide/forms/signals/comparison,
> Migrating from Reactive Forms — https://angular.dev/guide/forms/signals/migration.

## When to use
- Choosing between Signal Forms, Reactive Forms and Template-driven Forms for a new or existing app.
- Building a signal-based form: a writable model signal, `form()`, and `[formField]` bindings.
- Designing a form model (empty values, static shape, arrays) and translating it to/from a domain model.
- Reading and reacting to field state: validity, errors, pending, touched, dirty, disabled, hidden, readonly.
- Submitting, resetting, and focusing the first invalid control of a signal form.
- Migrating incrementally between Reactive Forms and Signal Forms (`compatForm`, `SignalFormControl`, `NG_STATUS_CLASSES`).
- See also: reactive forms and dynamic forms → references/guide/forms-reactive.md
- See also: template-driven forms and classic form validation → references/guide/forms-template-and-validation.md
- See also: defining Signal Forms validation rules → references/guide/forms-signals-validation.md
- See also: custom Signal Form controls (`FormValueControl`, `FormCheckboxControl`) → references/guide/forms-signals-advanced.md
- See also: `linkedSignal` previous state → references/guide/signals.md

## Rules

### Choosing an approach
- PREFER Signal Forms for new, signal-based apps (Angular v22+), when you want model-inferred types and schema validation, and when the team knows signals.
- PREFER Reactive Forms when forms are central to the app, when you already use reactive patterns, for complex dynamic forms, observable-based patterns, fine-grained control, or an existing reactive codebase; the docs still call reactive forms a solid choice for existing apps.
- PREFER Template-driven Forms only for very basic forms (sign-up, login, contact, search) whose logic fits in the template, for rapid prototypes, or in an existing template-driven codebase; they scale and reuse worse.
- In Reactive Forms the `FormControl` model is the source of truth; in Template-driven Forms the template is, and `NgModel` manages the `FormControl` for you.
- Reactive custom validators are functions taking a control; template-driven validators MUST be wrapped in custom validator directives.

### Signal Forms setup and models
- MUST import `FormField` into every component that binds fields to inputs with `[formField]`.
- MUST create the form model as a writable `signal()` holding an object; it is distinct from the component `model()` input.
- PREFER explicit interfaces/types for models (better IntelliSense, compile-time errors, self-documentation).
- MUST give every field an initial value; a missing key means no field in the tree and no `form.x` access.
- NEVER put `undefined` values or optional properties (`prop?: T`) in a form model; `undefined` means "no field". Use an empty value instead: `''` for text inputs, `null` often for custom controls.
- MUST use `''` (not `null`) as the empty value for native text controls (`<input type=text>`, `<textarea>`).
- MUST keep the structural layer (objects/arrays walked by the form) as plain objects and arrays; NEVER use class instances, `Map` or `Set` there. Convert domain classes to plain objects at the form boundary.
- PREFER leaf values that are primitives or `null`; `Date` is fine for native `date`/`month`/`time`/`week` inputs; custom controls may accept any type they understand.
- PREFER one focused model per form or cohesive data set; create several forms for unrelated data.
- PREFER grouping fields that validate together (e.g. new/confirm password) to make cross-field validation natural.
- MUST match model types to the bound control: `<select>` works with strings (model numeric-looking options as `string`), `<input type="number">` works with numbers.
- PREFER a form model shaped for the input UI rather than reusing the domain model.
- AVOID models whose shape depends on their value (unions of differently-shaped objects, object | primitive, `Model | null` for a whole new-entity form). Use a static shape with all branches present and `hidden()`/`disabled()` for unavailable parts; dynamic shapes lose subfields and can discard user data.
- Exceptions where dynamic structure is fine: arrays (variable length, but every item MUST share the same shape), and values a control treats atomically (it replaces the whole object and never binds subfields, e.g. `Location | null`).
- PREFER flat models when fields lack natural groups, you want short access paths, or rules cross groups; PREFER nested models for clear groups (address), API-matching structure, or validating a group as a unit.

### Field state and templates
- PREFER `invalid()` over `!valid()` when "has errors" must be distinguished from "still validating": both are `false` while async validators are pending.
- PREFER showing errors only when `touched() && invalid()`, and styling with `[class.x]` bound to `touched()` plus validity.
- MUST NOT rely on `error.message`; it is optional. Map `kind` to your own text when validators supply no message.
- PREFER `@if (!field().hidden())` to remove hidden fields from the template; `hidden()` does not hide anything by itself.
- AVOID redundant `[disabled]`/`[readonly]` bindings next to `[formField]`; the directive already sets those attributes from field state.
- MUST track `@for` loops over array fields by the field itself (`track field`); fields keep a stable identity.
- PREFER form-level state (root `form()`) for submit/save buttons, overall validity and unsaved-change warnings; field-level state for per-field messages, styling and availability.
- PREFER calling `markAsTouched()` on a section field to reveal its errors (descendants included by default); pass `{skipDescendants: true}` only to touch that field alone.
- MUST check `pending()` then `invalid()` before submitting manually, so only fully validated data reaches the API.
- PREFER the `FormRoot` directive (`[formRoot]`) plus a `submission.action` option to simplify submission; call `submit(form, ...)` directly when not using the directive.
- PREFER `f().reset(value)` after a successful submit to clear touched/dirty and restore initial values.
- PREFER focusing the first invalid control on failed submit (`errorSummary()[0].fieldTree().focusBoundControl()`) for accessibility.
- MUST implement a `focus()` method on custom controls that should support `focusBoundControl()`.

### Translating form and domain models
- PREFER `linkedSignal({source, computation})` to derive the writable form model from an `input()` domain model or a resource value, falling back to an empty form model.
- PREFER disabling (or hiding) the form while the domain data is loading.
- PREFER converting form model to domain model inside `submit()` for save-on-submit, or in an `effect` that writes only when the form is `valid()` for auto-save. Converting on the server is also acceptable.
- PREFER `linkedSignal(() => service.model(), {set: v => service.sync(v)})` to keep a form model synchronized with a service-held model.

### Migration and interop
- PREFER `compatForm` (top-down) to keep existing `FormControl`/`FormGroup` instances (complex async logic, unported RxJS operators, third-party integrations) inside a signal form.
- PREFER `SignalFormControl` (bottom-up) to move leaf controls to Signal Forms while the parent `FormGroup` stays reactive.
- MUST bind a `SignalFormControl` with `[formField]="ctrl.fieldTree"`; NEVER with `formControlName` or `[formControl]`.
- NEVER call `enable()`/`disable()`, `addValidators()`/`removeValidators()`/`setValidators()`, `setErrors()` or `markAsPending()` on a `SignalFormControl`; use `disabled(p, {when})`, `applyWhen(...)` and schema validation rules instead.
- PREFER `provideSignalFormsConfig({classes: NG_STATUS_CLASSES})` to keep `.ng-valid`/`.ng-dirty`-style classes, which Signal Forms does not add by default.
- NEVER implement both `ControlValueAccessor` and `FormValueControl`/`FormCheckboxControl` on one component; pick one. Signal Form custom controls already work with Reactive and Template-driven forms.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `FormControl` / `FormGroup` / `FormArray` | Track value + validation status of one control / a group / an array | Shared base of Reactive and Template-driven forms (`@angular/forms`) |
| `ControlValueAccessor` | Bridge between `FormControl` and DOM elements | Used by both classic approaches |
| `[formControl]` | Link an explicit `FormControl` to an element | `ReactiveFormsModule`; synchronous data flow |
| `[(ngModel)]` (`NgModel`) | Implicit `FormControl` managed by a directive | `FormsModule`; asynchronous data flow |
| `control.valueChanges` | Observable of new values | Emitted on view and model changes |
| `control.setValue(v)` | Programmatic model update | Reactive forms |
| `form(model, schema?, options?)` | Create a field tree from a writable signal | `@angular/forms/signals`; schema runs once at creation |
| `FormField` / `[formField]="f.x"` | Two-way bind an element to a field | Also binds `disabled`/`readonly` attributes |
| `FormRoot` / `[formRoot]="f"` | Submit handling on `<form>` | Prevents default browser submit, sets `novalidate`, calls `submit()` when `submission` is configured |
| `form(..., {submission: {action}})` | Default submit action | `action` receives the field tree |
| `submit(f, action \| FormSubmitOptions)` | Mark all fields touched, run action only if valid | Options override the form's `submission` |
| `FieldTree<T>` | Navigable (`f.a.b`, `f.items[0]`) and callable field | Non-existent property is a compile error |
| `f.x()` → `FieldState` | Signals for one field | Root `f()` aggregates all children |
| `value()` | `WritableSignal` of the field value | `.set()`/`.update()` propagate to the model |
| `valid()` / `invalid()` | Passes all rules with nothing pending / has errors | Both `false` while pending |
| `errors()` / `getError(kind)` | Array of errors / one error by kind | Error: `kind`, optional `message`, `fieldTree` |
| `errorSummary()` | Summary list of the form's errors | `[0].fieldTree` locates the first invalid field |
| `pending()` | Async validation running | |
| `touched()` / `dirty()` | Focused+blurred (or marked) / modified by user | `dirty` stays `true` if value reverts |
| `disabled()` / `hidden()` / `readonly()` | Availability state | Non-interactive; excluded from parent validity, touched, dirty; value unchanged |
| `markAsTouched({skipDescendants?})` | Programmatically touch a field | `skipDescendants` defaults to `false`; no effect on hidden/disabled/readonly |
| `reset(value?)` | Clear touched/dirty, optionally set model | Call on field state, e.g. `f().reset(v)` |
| `focusBoundControl({preventScroll?})` | Focus the element bound to the field | Calls a custom control's `focus()` if defined |
| `required`, `email`, `minLength(path, n, opts)` | Built-in validators in the schema | `{message}` option |
| `disabled(path, {when})` / `hidden(path, {when})` / `readonly(path)` | Availability rules | `when` gets a `FieldContext` (`valueOf(otherPath)`, `value()`) |
| `schema<T>(fn)` | Declare schema rules outside `form()` | Shown with `hidden()` in the model-design guide |
| `applyWhen(path, cond, schemaFn)` | Apply rules conditionally | Replaces imperative validator add/remove |
| `FieldState<T>` (type) | Whole field state as a value | e.g. input to a sparse-update converter |
| `compatForm(model, schema?)` | Signal form whose model may nest `FormControl`/`FormGroup` | `@angular/forms/signals/compat` |
| `f.group().control()` | Underlying reactive control of a compat field | Bind children with `[formControl]` |
| `CompatValidationError` | Error from a reactive validator | No `message`; validator's error object is in `context` |
| `extractValue(form)` | Whole value with reactive controls unwrapped | `@angular/forms/signals/compat` |
| `new SignalFormControl(value, schema?)` | Expose a signal form as a `FormControl` | Takes a raw value; bi-directional sync |
| `ctrl.fieldTree` / `ctrl.sourceValue()` | Field tree to bind / internal model signal | |
| `provideSignalFormsConfig({classes})` | Status CSS classes on bound controls | Class map: `name: ({state}) => boolean` |
| `NG_STATUS_CLASSES` | Preset reproducing `ng-*` classes | `@angular/forms/signals/compat` |

## Patterns

### Choosing: same control in each classic approach
```ts
// Reactive: explicit model, synchronous
@Component({
  template: `Color: <input [formControl]="color" />`,
  imports: [ReactiveFormsModule],
})
export class ColorReactive { color = new FormControl(''); }

// Template-driven: NgModel owns the FormControl, asynchronous
@Component({
  template: `Color: <input [(ngModel)]="color" />`,
  imports: [FormsModule],
})
export class ColorTemplate { color = signal(''); }
```

### Testing classic forms
```ts
// Reactive: no change detection needed
input.value = 'Red';
input.dispatchEvent(new Event('input'));
expect(cmp.color.value).toEqual('Red');
cmp.color.setValue('Blue');
expect(input.value).toBe('Blue');

// Template-driven: wait for the async update in both directions
input.value = 'Red';
input.dispatchEvent(new Event('input'));
await fixture.whenStable();
expect(cmp.color()).toEqual('Red');
```

### Minimal signal form with submit
```ts
import {email, form, FormField, FormRoot, minLength, required, submit} from '@angular/forms/signals';

@Component({
  imports: [FormField, FormRoot],
  template: `
    <form [formRoot]="login" (submit)="send()">
      <input type="email" [formField]="login.email" />
      @if (login.email().touched() && login.email().invalid()) {
        <span>{{ login.email().errors()[0].message }}</span>
      }
      <input type="password" [formField]="login.password" />
      <button type="submit" [disabled]="login().invalid()">Sign in</button>
    </form>`,
})
export class Login {
  model = signal({email: '', password: ''});
  login = form(this.model, (p) => {
    required(p.email, {message: 'Email is required'});
    email(p.email, {message: 'Enter a valid email'});
    minLength(p.password, 8, {message: 'At least 8 characters'});
  });
  send() {
    submit(this.login, async (f) => console.log(f().value()));
  }
}
```

### Updating values
```ts
this.userModel.set({name: 'Alice', email: 'a@x.dev', age: 30}); // whole model (load/reset)
this.userForm.email().value.set('');                            // one field
this.userForm.age().value.update((n) => n + 1);
const len = computed(() => this.userForm.password().value().length);
```

### Static model with conditional branches
```ts
interface PayModel {
  method: {type: string; card: {number: string}; bank: {account: string}};
}
const paySchema = schema<PayModel>((p) => {
  hidden(p.method.card, {when: ({valueOf}) => valueOf(p.method.type) !== 'card'});
  hidden(p.method.bank, {when: ({valueOf}) => valueOf(p.method.type) !== 'bank'});
});
// Switching type keeps data typed into the other branch.
```

### Availability rules
```ts
orderForm = form(this.orderModel, (p) => {
  disabled(p.coupon, {when: ({valueOf}) => valueOf(p.total) < 50});
  hidden(p.shippingAddress, {when: ({valueOf}) => !valueOf(p.needsShipping)});
  readonly(p.username);
});
```
```html
@if (!orderForm.shippingAddress().hidden()) {
  <input [formField]="orderForm.shippingAddress" />
}
@for (item of orderForm.emails; track item) {
  <input [formField]="item" />
}
```

### Section validation before continuing
```ts
next() {
  this.checkout.shipping().markAsTouched(); // touches shipping + descendants
  if (this.checkout.shipping().invalid()) return;
  this.step.set('payment');
}
```

### Submission option, reset and focus
```ts
contact = form(this.model, {
  submission: {
    action: async (f) => {
      await this.api.send(this.model());
      f().reset({...EMPTY});
    },
  },
});

onSubmit() {
  const first = this.contact().errorSummary()[0];
  if (first?.fieldTree) first.fieldTree().focusBoundControl({preventScroll: true});
}
```
```ts
// Custom control: make focusBoundControl() work
export class PasswordInput implements FormValueControl<string> {
  readonly value = model('');
  readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');
  focus() { this.box().nativeElement.focus(); }
}
```

### Domain model ↔ form model
```ts
readonly domain = input<Account>();
private readonly formModel = linkedSignal({
  source: this.domain,
  computation: (d) => (d ? toFormModel(d) : EMPTY_ACCOUNT_FORM),
});
protected readonly accountForm = form(this.formModel, (root) => {
  disabled(root, {when: () => this.resource.isLoading()}); // when loaded via a resource
});

save() {
  submit(this.accountForm, async () => {
    await this.svc.update(toDomain(this.accountForm().value()));
  });
}

// Auto-save variant
readonly out = model.required<Account>();
constructor() {
  effect(() => {
    if (this.accountForm().valid()) this.out.set(toDomain(this.accountForm().value()));
  });
}
```

### Top-down: reactive controls inside a signal form
```ts
const pwd = new FormControl('', {validators: [Validators.required, corpValidator()], nonNullable: true});
const address = new FormGroup({street: new FormControl('', Validators.required)});
const f = compatForm(signal({email: '', password: pwd, address}), (p) => required(p.email));

f.password().valid();          // proxied reactive state
f().value();                   // {email, password: FormControl, address: FormGroup}
const plain = computed(() => extractValue(f)); // controls unwrapped

errorText(e: ValidationError) {
  if (e instanceof CompatValidationError) {
    return (e.context as {message?: string} | null)?.message ?? e.kind;
  }
  return e.message ?? e.kind;
}
```
```html
<input [formField]="f.password" type="password" />
@let street = f.address().control().controls.street;
<input [formControl]="street" />
```

### Bottom-up: signal control inside a FormGroup
```ts
readonly busy = signal(false);
readonly strict = signal(false);
readonly emailCtrl = new SignalFormControl('', (p) => {
  required(p);
  disabled(p, {when: () => this.busy()});
  applyWhen(p, () => this.strict(), (q) => { email(q); });
});
readonly group = new FormGroup({name: new FormControl(''), email: this.emailCtrl});

// Sync both ways
this.emailCtrl.fieldTree().value.set('a@x.dev'); // group.value.email updates
this.group.patchValue({email: 'b@x.dev'});       // fieldTree().value() updates
```
```html
<form [formGroup]="group">
  <input formControlName="name" />
  <input [formField]="emailCtrl.fieldTree" />
</form>
```

### Status classes
```ts
bootstrapApplication(App, {
  providers: [provideSignalFormsConfig({classes: NG_STATUS_CLASSES})],
  // or custom: classes: {'is-bad': ({state}) => state().invalid()}
});
```

## Pitfalls
- Template-driven data flow is asynchronous: `NgModel` sets its `FormControl` value on the next tick (a second change detection, to avoid `ExpressionChangedAfterItHasBeenChecked`), so tests need `await fixture.whenStable()`.
- Template-driven two-way binding mutates the component property, giving change detection no unique changes to track; reactive forms emit a new value per change.
- A missing or `undefined` model key yields no field: `{value: undefined}` acts like `{}` and `form.value` is `undefined`, not a `FieldTree`.
- A `Model | null` initial value produces a form with no subfields; initialize every leaf with an empty value instead.
- Discriminated-union models drop the inactive branch's data when the user switches options and back.
- Class instances, `Map` and `Set` are accepted by TypeScript and not checked at runtime, but break: classes lose their prototype (methods, getters, `instanceof`) on the first write because parents are shallow-copied; frozen/non-extensible objects in arrays throw when a tracking symbol is attached; `Map`/`Set` give empty field trees (children come from `Object.keys`).
- `valid()` and `invalid()` can both be `false` during async validation; `!valid()` is not "has errors".
- `dirty()` never reverts to `false` when the user restores the original value; use `reset()`.
- Hidden, disabled and readonly fields don't become touched or dirty (even via `markAsTouched()`) and don't count toward parent validity, so a required-but-hidden field won't block submit.
- `disabled`, `hidden`, `readonly` never change the field's value.
- `focusBoundControl()` on a custom control without `focus()` targets the host element, which usually cannot take focus.
- Signal Forms do not add `ng-valid`/`ng-dirty` classes unless configured.
- `CompatValidationError` has no `message`; read `context` instead. `compatForm`'s root `value()` still contains the `FormControl` objects (the JSON pipe cannot serialize them); use `extractValue` or per-field `value()`.
- `SignalFormControl` takes a raw value, not a signal (it creates the signal internally to deliver the synchronous updates reactive forms expect); its imperative `enable`/`disable`, validator add/remove/set, `setErrors` and `markAsPending` throw or are unsupported.

## Version notes
- Signal Forms require Angular v21 or higher (signals overview prerequisite).
- Comparison table lists Signal Forms status as "Stable (v22+)" and recommends it for new signal-based apps on Angular v22+; Reactive and Template-driven forms are listed as stable.
- No API in these pages is labeled developer preview, experimental or deprecated.
