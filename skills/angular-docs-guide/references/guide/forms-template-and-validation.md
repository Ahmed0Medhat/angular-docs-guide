# Template-driven Forms and Form Validation

> Sources (angular.dev, v22.3 @ bd1e32b): Template-driven forms — https://angular.dev/guide/forms/template-driven-forms,
> Validate form input — https://angular.dev/guide/forms/form-validation.

## When to use
- Building a small or simple form whose bindings and validation live in the template (`FormsModule`, `[(ngModel)]`).
- Showing validation messages only after the user has edited or left a field (`dirty` / `touched` / `pristine`).
- Styling controls by state with the `ng-*` CSS classes (valid, touched, dirty, pending, submitted).
- Writing a custom sync or async validator and wiring it into a reactive form (function) or a template-driven form (directive).
- Validating two sibling fields together (cross-field validation on the `FormGroup` / `<form>`).
- Adding, removing or replacing validators at runtime in a reactive form, and throttling async validation with `updateOn`.
- See also: two-way binding and template reference variables → references/guide/templates.md
- See also: choosing between template-driven and reactive forms (forms overview) → references/guide/forms-signals.md

## Rules

### Template-driven forms
- PREFER template-driven forms for small/simple forms; the docs position reactive forms as the more scalable choice for complex ones.
- MUST import `FormsModule` (from `@angular/forms`) in the component's `imports` to get `NgModel`, `NgForm` and `NgModelGroup`.
- NEVER add a selector or attribute to activate `NgForm`: once `FormsModule` is imported it attaches itself to every `<form>` element.
- MUST give every element that uses `[(ngModel)]` a `name` attribute; Angular registers the control with the parent `NgForm` under that name. Any unique value works; descriptive names are recommended.
- PREFER an `id` on each input matched by the `<label for="...">` attribute.
- MUST export the directive with `#ref="ngForm"` (form) or `#ref="ngModel"` (control) to read form/control state in the template; the string is the directive's `exportAs` value.
- PREFER hiding a control's error message while it is valid **or** pristine, so a fresh/blank model does not show errors before the user acts.
- PREFER calling the form's `reset()` after swapping in a new model (e.g. `(click)="newModel(); f.reset()"`) to restore pristine/untouched flags.
- MUST use a `type="submit"` button inside the form and listen to `(ngSubmit)` on the `<form>` to handle submission.
- PREFER disabling the submit button by binding to the exported form's validity (`[disabled]="!f.form.valid"`); no further wiring is needed.
- PREFER injecting a data service (or using inputs/outputs) instead of hard-coded demo data in real apps.

### Validation (both form styles)
- MUST, in template-driven forms, add validation via HTML attributes (`required`, `minlength`, ...); Angular maps them to validator functions through directives.
- MUST, in reactive forms, attach validator functions to the control model in the class, not via template attributes.
- PREFER checking `dirty` or `touched` before showing errors, so errors do not appear before the user has had a chance to edit.
- MUST keep the `required` attribute in a reactive form template for accessibility, even though it is not needed for validation there.
- MUST pass sync validators as the 2nd `FormControl` constructor argument and async validators as the 3rd (or via `asyncValidators` in the options object); pass an array for several.
- PREFER getters on the component (e.g. `get name() { return this.form.get('name'); }`) as template shorthand; `get()` on the parent group always works too.
- MUST have a custom validator return `null` when valid, or an error object keyed by the error name (value: arbitrary details for the message).
- MUST, for a custom async validator, return a Promise or Observable; an Observable must complete (the last emitted value is used).
- MUST, to make an infinite Observable finite, pipe it through `first`, `last`, `take` or `takeUntil`.
- MUST, in template-driven forms, wrap a custom validator in a directive that provides `NG_VALIDATORS` (sync) or `NG_ASYNC_VALIDATORS` (async) with `multi: true`, and implements `Validator` / `AsyncValidator`.
- MUST register the validator directive with `useExisting` (with `forwardRef`), NEVER `useClass`: the registered validator has to be the directive instance whose inputs are bound in the template.
- MUST run a cross-field validator on a common ancestor (the `FormGroup`); in reactive forms pass it as `{validators: fn}` (second `FormGroup` argument), in template-driven forms put the wrapping directive on the `<form>` element.
- PREFER `updateOn: 'blur'` or `'submit'` (default `'change'`) for async validators that hit the network, to avoid a request per keystroke.
- MUST pass the very same function reference to `removeValidators` that was given to `addValidators` (matching is by reference) — store reusable validators in a field.
- MUST call `updateValueAndValidity()` after changing a control's validators so its status is recalculated.
- PREFER treating a failed validation request as valid (`catchError(() => of(null))`) when a transport error does not imply invalid input; returning an error object instead is also allowed.
- PREFER `ngNativeValidate` only when you want browser-native validation in addition to Angular's.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `FormsModule` | Provides template-driven directives | Add to component `imports` |
| `NgModel` / `[(ngModel)]` | Two-way binds a control to a model property; tracks value, interaction, validity | Requires `name`; `exportAs: 'ngModel'` |
| `[ngModel]` + `(ngModelChange)` | Split property + event form of `[(ngModel)]` | Shown in example source only |
| `[ngModelOptions]="{updateOn: 'blur'}"` | Change when the control updates/validates | `'change'` (default), `'blur'`, `'submit'` |
| `NgForm` | Creates the top-level `FormGroup` for a `<form>`; tracks aggregate value/validity | Selector matches `form`; `exportAs: 'ngForm'` |
| `NgModelGroup` | Creates and binds a nested `FormGroup` to a DOM element | |
| `(ngSubmit)` | Form submit event of `NgForm` | Fired by `type="submit"` button |
| `ngForm.form.valid` / `.invalid` / `.submitted` / `.value` | Aggregate state on exported form | `submitted` used to swap UI after submit |
| `ngForm.reset()` | Clears value and control flags | Restores pristine state |
| `ngForm.resetForm({})` | Resets the form to the given value | Examples use it for Reset and to leave the post-submit view |
| `ref.valid` / `invalid` / `dirty` / `pristine` / `touched` / `pending` | Control state mirrored from the underlying `FormControl` | Full list: `AbstractControl` API |
| `ref.hasError('key')` / `ref.errors?.['key']` | Check a specific validation error | Works on controls and groups |
| `ReactiveFormsModule` | Reactive form directives (`[formGroup]`, `formControlName`) | |
| `new FormControl(value, syncValidators?, asyncValidators?)` | Control with validators | Single fn or array |
| `new FormControl(value, {asyncValidators, updateOn})` | Options-object form | See `AbstractControlOptions` |
| `new FormGroup(controls, {validators})` | Group-level (cross-field) validation | |
| `Validators.required` / `minLength(n)` / `pattern(re)` | Built-in validator functions | Same set as template attributes |
| `ValidatorFn` | `(control: AbstractControl) => ValidationErrors \| null` | Sync |
| `AsyncValidatorFn` | Returns `Promise`/`Observable` of `ValidationErrors \| null` | Must complete |
| `Validator` / `AsyncValidator` | Interfaces with `validate(control)` for validator classes/directives | |
| `ValidationErrors` | Error map, e.g. `{forbiddenName: {value}}` | |
| `NG_VALIDATORS` | Multi provider token for sync validator directives | `useExisting` + `multi: true` |
| `NG_ASYNC_VALIDATORS` | Multi provider token for async validator directives | `useExisting` + `multi: true` |
| `control.get('child')` | Fetch a child control (e.g. inside a group validator) | |
| `addValidators(v)` / `removeValidators(v)` | Add/remove sync validators at runtime | Matched by reference |
| `setValidators(v)` / `clearValidators()` | Replace all sync validators / remove them | |
| `addAsyncValidators` / `removeAsyncValidators` / `setAsyncValidators` / `clearAsyncValidators` | Async counterparts | Same pattern |
| `updateValueAndValidity(opts?)` | Recompute value and status | `{onlySelf: true, emitEvent: false}` skips parent and events |
| `ngNativeValidate` | Re-enables native browser validation alongside Angular's | Angular adds `novalidate` to forms by default |

### Status CSS classes
| Class pair (true / false) | Meaning |
| --- | --- |
| `ng-touched` / `ng-untouched` | Control was visited (blurred) |
| `ng-dirty` / `ng-pristine` | Value changed by user since init/reset |
| `ng-valid` / `ng-invalid` | Value passes validation |
| `ng-pending` | Async validation in progress |
| `ng-submitted` | Set on the enclosing `<form>` after submit; never on its controls |

## Patterns

### Template-driven form with errors, reset and submit
```ts
import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';

export class Pet {
  constructor(public id: number, public name: string, public kind: string, public owner?: string) {}
}

@Component({
  selector: 'app-pet-form',
  imports: [FormsModule],
  templateUrl: './pet-form.html',
})
export class PetForm {
  kinds = ['Cat', 'Dog', 'Bird'];
  model = new Pet(1, 'Rex', this.kinds[1]);
  submitted = false;
  onSubmit() { this.submitted = true; }
  newPet() { this.model = new Pet(2, '', ''); }
}
```
```html
<div [hidden]="submitted">
  <form (ngSubmit)="onSubmit()" #petForm="ngForm">
    <label for="name">Name</label>
    <input id="name" name="name" required [(ngModel)]="model.name" #nameCtl="ngModel" />
    <div [hidden]="nameCtl.valid || nameCtl.pristine">Name is required</div>

    <label for="owner">Owner</label>
    <input id="owner" name="owner" [(ngModel)]="model.owner" />

    <label for="kind">Kind</label>
    <select id="kind" name="kind" required [(ngModel)]="model.kind">
      @for (k of kinds; track $index) { <option [value]="k">{{ k }}</option> }
    </select>

    <button type="submit" [disabled]="!petForm.form.valid">Submit</button>
    <button type="button" (click)="newPet(); petForm.reset()">New pet</button>
  </form>
</div>
<div [hidden]="!submitted">
  <p>{{ model.name }} ({{ model.kind }})</p>
  <button type="button" (click)="submitted = false">Edit</button>
</div>
```

### State-based styling (global stylesheet, e.g. linked from `index.html`)
```css
.ng-valid[required], .ng-valid.required { border-left: 5px solid #42a948; }
.ng-invalid:not(form) { border-left: 5px solid #a94442; }
```

### Per-error messages (template-driven)
```html
<input id="name" name="name" required minlength="4" appBannedName="admin"
       [(ngModel)]="user.name" #nameCtl="ngModel" />
@if (nameCtl.invalid && (nameCtl.dirty || nameCtl.touched)) {
  @if (nameCtl.hasError('required')) { <p>Name is required.</p> }
  @if (nameCtl.hasError('minlength')) { <p>At least 4 characters.</p> }
  @if (nameCtl.hasError('bannedName')) { <p>That name is not allowed.</p> }
}
```

### Reactive form with built-in + custom validators
```ts
import {Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.html',
})
export class UserForm {
  form = new FormGroup({
    name: new FormControl('Ann', [Validators.required, Validators.minLength(4), bannedNameValidator(/admin/i)]),
    plan: new FormControl('basic', Validators.required),
  });
  get name() { return this.form.get('name'); }
}
```
```html
<form [formGroup]="form">
  <!-- keep `required` for accessibility -->
  <input id="name" formControlName="name" required />
  @if (name.invalid && (name.dirty || name.touched)) {
    @if (name.hasError('required')) { <p>Name is required.</p> }
  }
  <button type="submit" [disabled]="form.invalid">Submit</button>
</form>
```

### Custom sync validator factory + directive wrapper
```ts
import {Directive, forwardRef, input} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';

export function bannedNameValidator(re: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    re.test(control.value) ? {bannedName: {value: control.value}} : null;
}

@Directive({
  selector: '[appBannedName]',
  providers: [{provide: NG_VALIDATORS, useExisting: forwardRef(() => BannedNameDirective), multi: true}],
})
export class BannedNameDirective implements Validator {
  readonly banned = input<string>('', {alias: 'appBannedName'});
  validate(control: AbstractControl): ValidationErrors | null {
    return this.banned() ? bannedNameValidator(new RegExp(this.banned(), 'i'))(control) : null;
  }
}
```

### Cross-field validation
```ts
export const nameNotRoleValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const name = group.get('name');
  const role = group.get('role');
  return name && role && name.value === role.value ? {nameMatchesRole: true} : null;
};

// Reactive: validator on the group
form = new FormGroup(
  {name: new FormControl(), role: new FormControl()},
  {validators: nameNotRoleValidator},
);

// Template-driven: directive placed on <form appNameNotRole>
@Directive({
  selector: '[appNameNotRole]',
  providers: [{provide: NG_VALIDATORS, useExisting: forwardRef(() => NameNotRoleDirective), multi: true}],
})
export class NameNotRoleDirective implements Validator {
  validate(control: AbstractControl) { return nameNotRoleValidator(control); }
}
```
```html
<form #f="ngForm" appNameNotRole>
  ...
  @if (f.hasError('nameMatchesRole') && (f.touched || f.dirty)) {
    <p>Name cannot match role.</p>
  }
</form>
```

### Async validator (service + directive + reactive usage)
```ts
import {Directive, forwardRef, inject, Service} from '@angular/core';
import {AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors} from '@angular/forms';
import {Observable, catchError, map, of} from 'rxjs';

@Service()
export class FreeSlugValidator implements AsyncValidator {
  private readonly slugs = inject(SlugService); // isTaken(slug): Observable<boolean>
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    return this.slugs.isTaken(control.value).pipe(
      map((taken) => (taken ? {slugTaken: true} : null)),
      catchError(() => of(null)), // request failure treated as valid
    );
  }
}

@Directive({
  selector: '[appFreeSlug]',
  providers: [{provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => FreeSlugDirective), multi: true}],
})
export class FreeSlugDirective implements AsyncValidator {
  private readonly inner = inject(FreeSlugValidator);
  validate(control: AbstractControl) { return this.inner.validate(control); }
}

// Reactive usage
export class PostForm {
  private readonly slugValidator = inject(FreeSlugValidator);
  slug = new FormControl('', {
    asyncValidators: [this.slugValidator.validate.bind(this.slugValidator)],
    updateOn: 'blur',
  });
}
```
```html
<!-- Template-driven usage -->
<input name="slug" [(ngModel)]="post.slug" #slugCtl="ngModel"
       [ngModelOptions]="{updateOn: 'blur'}" appFreeSlug />
@if (slugCtl.pending) { <p>Checking...</p> }
@if (slugCtl.hasError('slugTaken')) { <p>Slug already used.</p> }
```

### Changing validators at runtime (reactive)
```ts
private readonly zip5 = Validators.pattern(/^\d{5}$/);

onCountry(country: string) {
  const zip = this.form.get('zip')!;
  if (country === 'US') zip.addValidators([Validators.required, this.zip5]);
  else zip.removeValidators([Validators.required, this.zip5]);
  zip.updateValueAndValidity();
}

setStrict(strict: boolean) {
  const name = this.form.get('name')!;
  strict ? name.setValidators([Validators.required, Validators.minLength(3)]) : name.clearValidators();
  name.updateValueAndValidity({onlySelf: true, emitEvent: false});
}
```

## Pitfalls
- Using `[(ngModel)]` without a `name` attribute: the control cannot register with the enclosing `NgForm`.
- Hiding an error only on `valid` (ignoring `pristine`) makes the message appear immediately for a blank or already-invalid model.
- Replacing the model (e.g. a "new item" button) does not reset control flags: a field the user typed in stays dirty and shows errors until you call `form.reset()`.
- `ng-submitted` is added only to the `<form>` element, not to the controls inside it.
- A `<select>` limited to valid options generally needs no error message even if `required`.
- Async validators run only after all sync validators pass; while running, the control is `pending` (and gets `ng-pending`) until the returned Observable completes.
- An async validator whose Observable never completes leaves the control stuck in `pending`.
- By default every validator runs on each value change; an HTTP-backed async validator then fires a request per keystroke unless `updateOn` is `'blur'` or `'submit'`.
- Registering a validator directive with `useClass` creates a separate instance without the bound inputs (e.g. the forbidden value is missing), so validation silently misbehaves.
- `removeValidators(Validators.pattern(...))` with a newly created function does nothing, because validators are compared by reference.
- Forgetting `updateValueAndValidity()` after changing validators leaves the old status in place.
- Cross-field rules cannot be expressed on a single child control; they must live on the shared parent group / `<form>`.
- Angular adds `novalidate` to forms, so native browser validation UI is off unless you add `ngNativeValidate`.
- In reactive forms, removing the `required` attribute from the template harms accessibility even though validation still works.

## Version notes
- None stated in the docs.
