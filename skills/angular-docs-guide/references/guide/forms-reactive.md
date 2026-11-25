# Reactive Forms

> Sources (angular.dev, v22.3 @ bd1e32b): Reactive forms — https://angular.dev/guide/forms/reactive-forms,
> Strictly typed reactive forms — https://angular.dev/guide/forms/typed-forms,
> Building dynamic forms — https://angular.dev/guide/forms/dynamic-forms.

## When to use
- Building a model-driven form whose state lives in the component class (`FormControl`, `FormGroup`, `FormArray`, `FormRecord`).
- Updating form values programmatically, e.g. filling a form from backend data (`setValue`, `patchValue`).
- Adding or removing controls at runtime, such as a growable list of aliases (`FormArray`) or keys unknown up front (`FormRecord`).
- Reacting to value, status, pristine, touched, reset and submit changes from one stream (`events`).
- Getting compile-time type safety on form values and structure (typed forms, `nonNullable`, `NonNullableFormBuilder`).
- Generating questionnaire-style forms from metadata objects instead of hand-written templates.
- See also: template-driven forms and the forms overview comparison → references/guide/forms-template-and-validation.md
- See also: forms overview (choosing a forms approach) → references/guide/forms-signals.md
- See also: full validation guide, dynamic validators → references/guide/forms-template-and-validation.md

## Rules
- MUST add `ReactiveFormsModule` (from `@angular/forms`) to the component's `imports` to get the reactive form directives.
- MUST bind each control created in the class to an element in the template (`[formControl]`, `formControlName`, `[formGroup]`, `formGroupName`, `formArrayName`, `[formArray]`).
- PREFER `setValue()` when replacing the whole value; its value must match the exact shape of the group/array.
- PREFER `patchValue()` when updating only some fields; nested fields must be passed in their nested object (e.g. `{address: {street}}`).
- PREFER `FormBuilder` (via `inject(FormBuilder)`) to cut boilerplate when declaring many controls.
- MUST pass validators as the 2nd (sync) and 3rd (async) items of the builder array: `['', Validators.required]`.
- PREFER `output()` to hand the submitted form value out of the form component, keeping the form encapsulated.
- MUST use a `type="submit"` button inside the `<form>` to trigger `ngSubmit` (also lets users submit with Enter).
- PREFER a typed getter (`get aliases() { return this.form.get('aliases') as FormArray; }`) for repeated access to an array; `get()` returns `AbstractControl`, so an explicit cast is needed to reach `FormArray` methods.
- MUST bind `FormArray` children by index (`[formControlName]="i"`), since array items are unnamed.
- MUST, in zoneless apps, notify change detection after structural model changes (e.g. `push()`) that the template depends on, for example bridging `valueChanges` to `ChangeDetectorRef.markForCheck()`.
- PREFER a single `events` subscription with `instanceof` checks (or RxJS `filter`) over combining `valueChanges` + `statusChanges`.
- PREFER subscribing to the parent's `events` when you need the parent's up-to-date `value` after a child value change.
- PREFER `emitEvent: false` when setting values programmatically that must not trigger reactive side effects (auto-save, circular updates, bulk updates).
- PREFER `onlySelf: true` to keep an update from recalculating parents, then trigger the parent update once yourself.
- PREFER `markAllAsTouched()` on submit of an invalid form to reveal every validation error.
- PREFER `isFormControl` / `isFormGroup` / `isFormRecord` / `isFormArray` type guards inside validators that take an `AbstractControl` but only apply to one kind.
- MUST handle `null` in a typed `FormControl` value unless you set `{nonNullable: true}`.
- MUST give an explicit type parameter when the initial value is `null` (`new FormControl<string | null>(null)`), otherwise it is inferred as `FormControl<null>`.
- MUST declare a typed interface with optional (`?`) members to be able to `addControl`/`removeControl` on a typed `FormGroup`; only optional controls may be added or removed.
- PREFER `FormRecord` for groups whose keys are unknown ahead of time but whose controls share one value type.
- MUST use `UntypedFormArray` for arrays with mixed element types, and `UntypedFormGroup` for groups that are both open-ended and heterogeneous.
- PREFER `getRawValue()` when you need values that include disabled controls.
- PREFER `fb.nonNullable` / `NonNullableFormBuilder` for large forms where every control should be non-nullable.
- PREFER, for metadata-driven forms, a service that turns question objects into a `FormGroup`, and change the question list (not app code) when requirements change.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `ReactiveFormsModule` | Declares reactive form directives | Import in component `imports` |
| `AbstractControl` | Base class of `FormControl`, `FormGroup`, `FormArray` | Holds shared state props/methods used for validation display |
| `FormControl<T>` | One control's value + validity | Maps to `<input>`, `<select>`, etc. Inferred `FormControl<T \| null>` |
| `FormGroup<T>` | Fixed set of named controls | Top-level form is a `FormGroup`; `value` is `Partial<...>` |
| `FormArray<T>` | Numerically indexed, any-length list of controls | Homogeneous element type when typed |
| `FormRecord<T>` | Dynamic keys, all controls same value type | `addControl(key, ctrl)` |
| `FormBuilder` | Injectable factories: `control()`, `group()`, `record()`, `array()` | `group({name: [init, syncV, asyncV]})` |
| `NonNullableFormBuilder` / `fb.nonNullable` | Builder that sets `nonNullable: true` on every control | Injectable by that name |
| `UntypedFormControl` / `UntypedFormGroup` / `UntypedFormArray` | Opt-out of typing | Same semantics as pre-typed forms |
| `new FormControl(v, {nonNullable: true})` | `reset()` restores initial value instead of `null` | Changes runtime behavior |
| `control.value` | Snapshot of current value | |
| `control.valueChanges` / `statusChanges` | Observables of value / status | Use `AsyncPipe` or `subscribe()` |
| `control.status` | `VALID`, `INVALID`, `PENDING`, `DISABLED` (`FormControlStatus`) | |
| `setValue(v, opts?)` | Replace whole value; strict structure check | Strict check catches nesting errors |
| `patchValue(v, opts?)` | Update only given properties | Silently ignores unknown structure |
| `reset()` | Reset control/form | Value becomes `null` unless non-nullable |
| `getRawValue()` | Group value including disabled controls | |
| `get(path)` | Fetch child control | Returns `AbstractControl` |
| `FormArray.push(ctrl \| ctrl[])` | Append one or several controls | |
| `FormArray.clear()` | Remove all controls | `length` becomes 0 |
| `FormGroup.removeControl(name)` / `addControl` | Change typed group structure | Only optional keys |
| `events` | Unified stream of `ControlEvent`s | On all control classes |
| `ValueChangeEvent` | `.value` changed | |
| `StatusChangeEvent` | `.status` changed | |
| `PristineChangeEvent` | `.pristine` changed | |
| `TouchedChangeEvent` | `.touched` changed | |
| `FormResetEvent` | `reset()` or native reset | |
| `FormSubmittedEvent` | Form submitted | |
| `ControlEvent.source` | Control that originated the event | |
| `markAsTouched()` | Mark touched | Propagates to parents by default |
| `markAsUntouched()` | Mark untouched | Cascades to children; parents recalculated |
| `markAsDirty()` | Mark dirty | Propagates to parents by default |
| `markAsPristine()` | Mark pristine | Cascades to children; parents recalculated |
| `markAllAsDirty()` | Control + all descendants dirty | |
| `markAllAsTouched()` | Control + all descendants touched | |
| `{emitEvent}` option | Emit `valueChanges`/`statusChanges` | Default `true` |
| `{onlySelf}` option | Skip parent recalculation | Default `false` |
| `setValidators()` + `updateValueAndValidity()` | Swap validators at runtime | |
| `Validators.required` etc. | Built-in validator functions | Return error object or `null` |
| `isFormControl` / `isFormGroup` / `isFormRecord` / `isFormArray` | Type guards narrowing `AbstractControl` | |
| `FormControlDirective` `[formControl]` | Sync a standalone `FormControl` to an element | |
| `FormControlName` `formControlName` | Sync a control of a parent group/array by name or index | |
| `FormGroupDirective` `[formGroup]` | Sync a `FormGroup` to a DOM element; emits `ngSubmit` | |
| `FormGroupName` `formGroupName` | Sync a nested `FormGroup` | |
| `FormArrayName` `formArrayName` | Sync a nested `FormArray` | |
| `FormArrayDirective` `[formArray]` | Sync a standalone `FormArray` (e.g. on `<form>`) | When the array is the whole model |

## Patterns

### Single control
```ts
import {Component} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-name',
  imports: [ReactiveFormsModule],
  template: `
    <label for="nm">Name</label>
    <input id="nm" type="text" [formControl]="name" />
    <p>Value: {{ name.value }}</p>
    <button type="button" (click)="reset()">Set name</button>
  `,
})
export class NameField {
  name = new FormControl('');
  reset() { this.name.setValue('Nancy'); }
}
```

### Group, nested group, array, submit, validation (FormBuilder)
```ts
import {Component, inject, output} from '@angular/core';
import {FormArray, FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {JsonPipe} from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './profile.html',
})
export class Profile {
  private fb = inject(FormBuilder);
  saved = output<unknown>();

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: [''],
    address: this.fb.group({street: [''], city: ['']}),
    aliases: this.fb.array([this.fb.control('')]),
  });

  get aliases() { return this.form.get('aliases') as FormArray; }
  addAlias() { this.aliases.push(this.fb.control('')); }
  fill() { this.form.patchValue({firstName: 'Nancy', address: {street: '123 Drew St'}}); }
  submit() { this.saved.emit(this.form.value); }
}
```
```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <input id="first" formControlName="firstName" />
  <div formGroupName="address">
    <input id="street" formControlName="street" />
  </div>
  <div formArrayName="aliases">
    <button type="button" (click)="addAlias()">Add alias</button>
    @for (a of aliases.controls; track $index; let i = $index) {
      <label for="alias-{{ i }}">Alias</label>
      <input id="alias-{{ i }}" [formControlName]="i" />
    }
  </div>
  <button type="submit" [disabled]="!form.valid">Submit</button>
</form>
<p>Status: {{ form.status }}</p>
<p>{{ form.value | json }}</p>
```
Equivalent without the builder: `new FormGroup({firstName: new FormControl(''), address: new FormGroup({...})})`.

### Top-level FormArray on a form
```ts
@Component({
  selector: 'app-tags',
  imports: [ReactiveFormsModule],
  template: `
    <form [formArray]="tags">
      @for (c of tags.controls; track $index) { <input [formControlName]="$index" /> }
    </form>`,
})
export class Tags {
  tags = new FormArray([new FormControl('a'), new FormControl('b')]);
}
```

### Zoneless: refresh view after model mutation
```ts
private cdr = inject(ChangeDetectorRef);
constructor() {
  this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
}
```

### Unified events
```ts
form.events.subscribe((e) => {
  if (e instanceof ValueChangeEvent) console.log(e.value);
  if (e instanceof StatusChangeEvent) console.log(e.status);
  if (e instanceof FormSubmittedEvent) console.log('submitted', e.source);
});

ctrl.events.pipe(filter((e) => e instanceof TouchedChangeEvent)).subscribe((e) => console.log(e.touched));
```

### State + emission control
```ts
onSubmit() {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.api.save(this.form.value).subscribe(() => this.form.markAsPristine());
}
restoreDraft(d: {title: string; body: string}) {
  this.form.setValue(d, {emitEvent: false}); // no autosave trigger
}
changeZipRule(us: boolean) {
  const zip = this.form.get('zip')!;
  zip.setValidators([Validators.maxLength(us ? 5 : 7)]);
  zip.updateValueAndValidity({onlySelf: true, emitEvent: false});
}
```

### Type-guard validator
```ts
export function noNegatives(c: AbstractControl) {
  if (!isFormArray(c)) return null;
  return c.controls.some((x) => x.value < 0) ? {noNegatives: true} : null;
}
```

### Typed forms
```ts
const email = new FormControl('a@b.c');            // FormControl<string | null>
const strict = new FormControl('a@b.c', {nonNullable: true}); // reset() -> 'a@b.c'
const maybe = new FormControl<string | null>(null); // explicit type

interface Login { email: FormControl<string>; password?: FormControl<string>; }
const login = new FormGroup<Login>({
  email: new FormControl('', {nonNullable: true}),
  password: new FormControl('', {nonNullable: true}),
});
login.removeControl('password');   // allowed: optional
login.value.email;                 // string | undefined
login.getRawValue();               // includes disabled controls

const homes = new FormRecord<FormControl<string | null>>({});
homes.addControl('Ann', new FormControl('1 Main St'));

const fb = inject(FormBuilder);
const f = fb.nonNullable.group({email: '', password: ''});
const r = fb.record({Ann: '1 Main St'});

const list = new FormArray([new FormControl('x')]);
list.push([new FormControl('y'), new FormControl('z')]);
list.clear();
```

### Metadata-driven (dynamic) form
```ts
export class Question<T> {
  value: T | undefined; key: string; label: string; required: boolean;
  order: number; controlType: string; type: string; options: {key: string; value: string}[];
  constructor(o: Partial<Question<T>> = {}) { /* copy with defaults: order 1, strings '' */ }
}
export class TextboxQuestion extends Question<string> { override controlType = 'textbox'; }
export class DropdownQuestion extends Question<string> { override controlType = 'dropdown'; }

@Injectable()
export class QuestionControls {
  toFormGroup(qs: Question<string>[]) {
    const group: Record<string, FormControl> = {};
    for (const q of qs) {
      group[q.key] = q.required
        ? new FormControl(q.value || '', Validators.required)
        : new FormControl(q.value || '');
    }
    return new FormGroup(group);
  }
}

@Component({
  selector: 'app-dyn-form',
  providers: [QuestionControls],
  imports: [ReactiveFormsModule, QuestionField],
  template: `
    <form [formGroup]="form()" (ngSubmit)="onSubmit()">
      @for (q of questions(); track q) { <app-question [question]="q" [form]="form()" /> }
      <button type="submit" [disabled]="!form().valid">Save</button>
    </form>`,
})
export class DynForm {
  private qc = inject(QuestionControls);
  questions = input<Question<string>[] | null>([]);
  form = computed(() => this.qc.toFormGroup(this.questions() ?? []));
  payload = '';
  onSubmit() { this.payload = JSON.stringify(this.form().getRawValue()); }
}
```
```html
<!-- app-question: inputs question() and form() -->
<div [formGroup]="form()">
  <label [attr.for]="question().key">{{ question().label }}</label>
  @switch (question().controlType) {
    @case ('textbox') {
      <input [id]="question().key" [type]="question().type" [formControlName]="question().key" />
    }
    @case ('dropdown') {
      <select [id]="question().key" [formControlName]="question().key">
        @for (o of question().options; track o) { <option [value]="o.key">{{ o.value }}</option> }
      </select>
    }
  }
  @if (!form().controls[question().key].valid) { <div>{{ question().label }} is required</div> }
</div>
```
The host passes questions (e.g. `[questions]="questions$ | async"` from a `QuestionService` returning an observable sorted by `order`).

## Pitfalls
- `setValue()` checks the value against the group/array structure strictly, catching nesting errors; `patchValue()` fails silently on the same mistakes.
- `patchValue()` only touches properties the model defines; nested fields must be wrapped in their parent group object.
- Adding a required validator makes the control, and therefore its parent group, start out `INVALID`.
- `form.get(...)` is typed `AbstractControl`; without a cast you cannot call `FormArray` methods like `push()`.
- Zoneless: mutating the model (e.g. `FormArray.push()`) does not schedule change detection on its own; templates reading `controls` can go stale.
- A child's `ValueChangeEvent` fires before the parent's value is updated, so reading `parent.value` in that callback may return the old value.
- Typed `FormControl` values include `null` because `reset()` sets them to `null`; `nonNullable` changes this runtime reset behavior, so flip it carefully.
- `new FormControl(null)` infers `FormControl<null>`; a later `setValue('text')` is a type error.
- Disabled controls are excluded from a group's `value`, so its type is `Partial<...>` and each field may be `undefined` (enforced under `strictNullChecks`).
- On a typed `FormGroup`, only optional keys can be added or removed.
- A `FormArray` cannot be typed for mixed element types; a group that is both dynamic and heterogeneous gets no extra type safety.
- Typed forms apply to reactive forms only, not template-driven forms.

## Version notes
- Reactive forms are strictly typed by default since Angular 14; the `Untyped*` classes keep the earlier untyped semantics and allow incremental migration.
- No developer preview, experimental, or deprecated labels are stated in these docs.
