# Angular compiler: AOT and template type checking

> Sources (angular.dev, v22.3 @ bd1e32b): Template type checking — https://angular.dev/tools/cli/template-typecheck,
> Ahead-of-time (AOT) compilation — https://angular.dev/tools/cli/aot-compiler,
> AOT metadata errors — https://angular.dev/tools/cli/aot-metadata-errors.

## When to use
- Fixing template type errors that appear under strict template checking
- Silencing false positives from third-party library typings without turning off all checks
- Tuning individual template strictness flags in `angularCompilerOptions`
- Deciding between JIT and AOT, or understanding what the `aot` build option does
- Writing decorator metadata (providers, templates, declarations) that the AOT compiler can analyze
- Diagnosing AOT metadata errors such as non-exported symbols, uninitialized variables or unsupported syntax
- See also: Improving template type checking for custom directives → references/guide/directives.md
- See also: Building and serving Angular apps → references/tools/cli.md
- See also: NgModules (`RouterModule.forRoot`/`forChild` macros) → references/guide/ngmodules.md

## Rules

### Template type checking
- PREFER keeping strict mode on; it is the default and is active when `strictTemplates` is `true` or absent.
- AVOID `strictTemplates: false` except as a temporary opt-out or last resort; it drops to basic mode, which skips embedded views and types many things as `any`.
- PREFER, for false positives, the narrowest fix first: `$any()` on part of an expression → turn off one specific strictness flag → `strictNullInputTypes: false` (when combining `strictTemplates` with `strictNullChecks`) → basic mode only as last resort.
- MUST file an issue against the Angular repo if an error can only be resolved by falling back to basic mode; the docs say this most likely indicates a type-checker bug.
- PREFER making your own directive input types as specific as possible and adding template-guard functions to the directive definition.
- PREFER (library authors) enabling `strictNullChecks` and including `null` in input types where nullable values are acceptable, so consumers know what they may bind.
- PREFER declaring the setter parameter with the wider type (e.g. `boolean | ''`) instead of a static `ngAcceptInputType_` field; such coercion fields are deprecated.
- MUST, if an `ngAcceptInputType_<field>` override exists, make the setter handle every value of the overridden type.
- PREFER narrowing with a guard (`*ngIf="person && address"`) over the non-null assertion `!`; use `!` sparingly because later refactors can break the invariant it assumes.
- MUST wrap an `async` pipe expression in parentheses before applying `!`: `(obs$ | async)!`.

### AOT compilation and metadata
- PREFER AOT (default since Angular 9; `aot` defaults to `true` for new CLI apps in `angular.json`).
- MUST write decorator metadata using only the collector's supported expression subset (see table below).
- MUST reference only exported symbols in metadata, unless the expression can be folded by the collector.
- MUST keep inputs, outputs and data-bound class members `public` or `protected`; an `input()` property cannot be `private`.
- MUST only call functions or static methods in metadata that consist of a single `return` of an expression (macros).
- MUST only instantiate `InjectionToken` (from `@angular/core`) with `new` inside metadata.
- MUST only use Angular decorators from `@angular/core` in metadata.
- PREFER `strictMetadataEmit: true` when building your own libraries (Angular's own libraries do this) so syntax errors are reported immediately instead of written into `.metadata.json`.
- NEVER use `typeof`, computed/bracket property keys, tagged template literals, destructured variables, numeric property names, or enum members with computed initializers inside metadata.
- NEVER reference ambient types (such as `Window`) in metadata such as constructor parameter types; use an `InjectionToken` + `useFactory` + `@Inject` instead.
- MUST initialize a variable on the same line as its declaration when the compiler needs its value (e.g. `template`); exporting it is not enough.

## API cheat-sheet

### Template type-checking options (`angularCompilerOptions` in `tsconfig.json`)

| API | Purpose | Notes / version tag |
| :-- | :-- | :-- |
| `strictTemplates` | Switches between strict mode and basic mode | Default strict (`true` or unset); `false` = basic mode |
| `strictInputTypes` | Check binding assignability to inputs; also drives directive generic inference | Follows `strictTemplates` |
| `strictNullInputTypes` | Honor `strictNullChecks` when checking input bindings | Follows `strictTemplates`; turn off for libraries not built with `strictNullChecks`; applies app-wide |
| `strictAttributeTypes` | Check input bindings made through plain text attributes (`disabled="true"` vs `[disabled]="true"`) | Follows `strictTemplates` |
| `strictSafeNavigationTypes` | Infer the type of `a?.b` from `a` | Follows `strictTemplates`; off → `any` |
| `strictDomLocalRefTypes` | Give `#ref` on DOM elements its element type | Follows `strictTemplates`; off → `any` |
| `strictOutputEventTypes` | Type `$event` for component/directive outputs and animation events | Follows `strictTemplates`; off → `any` |
| `strictDomEventTypes` | Type `$event` for native DOM events | Follows `strictTemplates`; off → `any` |
| `strictContextGenerics` | Infer generic component type parameters (incl. bounds) | Follows `strictTemplates`; off → `any` |
| `strictLiteralTypes` | Infer types of object/array literals written in templates | Follows `strictTemplates`; off → `any` |
| `strictInputAccessModifiers` | Enforce `private`/`protected`/`readonly` when binding to `@Input()` or `input()` | Independent of `strictTemplates`; inputs only, not outputs; off → only type checked |
| `strictUnclaimedEventNames` | Report event bindings matching no directive output and no known DOM event (case-insensitive vs `GlobalEventHandlersEventMap`) | Independent; default `false` even when `strictTemplates` is `true`; only single camelCase names checked; dash-named events and elements under `CUSTOM_ELEMENTS_SCHEMA` without a matched component are exempt |

### Template helpers

| API | Purpose | Notes / version tag |
| :-- | :-- | :-- |
| `$any(expr)` | Cast part of a binding to `any`, skipping checks for it | Equivalent to `as any` in TypeScript |
| `expr!` | Non-null assertion in templates | Ignores nullability mismatch; wrap pipes: `(x$ \| async)!` |
| `static ngAcceptInputType_<field>` | Let the type checker accept a wider type for an `@Input()` than the field declares | [deprecated]; needs no value; suffix = input field name |

### Compiler / build options

| API | Purpose | Notes / version tag |
| :-- | :-- | :-- |
| `aot` (build config in `angular.json`) | Choose AOT vs JIT for `ng build` / `ng serve` | `true` by default for new CLI apps |
| `strictMetadataEmit` (`angularCompilerOptions`) | Make `ngc` fail on metadata syntax errors instead of emitting error nodes | Recommended for libraries |

### JIT vs AOT

| Mode | When it compiles | Notes |
| :-- | :-- | :-- |
| JIT | In the browser at runtime | Was the default up to Angular 8 |
| AOT | At build time (apps and libraries) | Default from Angular 9 |

AOT benefits per the docs: immediate rendering (no in-browser compile), external templates/CSS inlined into JS (fewer requests), no compiler shipped (roughly half of Angular's size), template binding errors caught at build time, and fewer injection-attack opportunities since no templates are evaluated client-side.

### AOT compilation phases

| # | Phase | What happens |
| :-- | :-- | :-- |
| 1 | Code analysis | TypeScript emits `.d.ts`; the AOT collector records decorator metadata into one `.metadata.json` per `.d.ts`, logging syntax violations without interpreting anything |
| 2 | Code generation | `StaticReflector` interprets collected metadata, validates semantics and throws on restriction violations |
| 3 | Template type checking | Template compiler uses TypeScript to validate bindings; strictness controlled by `strictTemplates` |

The generated code relies on the internal Compiler ABI; Angular keeps it stable across all patch releases within one minor version, so artifacts built with different patches of the same minor can share one runtime.

### Metadata expression syntax (collector subset) and foldability

| Syntax | Example | Foldable? |
| :-- | :-- | :-- |
| Object literal | `{a: true}` | yes |
| Array literal | `['x', 'y']` | yes |
| Spread in array literal | `['x', ...rest]` | no |
| Call | `make(x)` | no |
| `new` | `new Token()` | no |
| Property access | `obj.prop` | yes, if target foldable |
| Array index | `list[0]` | yes, if target and index foldable |
| Identifier reference | `Component` | yes, if it refers to a local |
| Template literal | `` `a ${b}` `` | yes without substitutions; with them only if substitutions foldable |
| String / number / boolean / `null` literal | `'pi'`, `3.14`, `true`, `null` | yes |
| Supported prefix operator | `!flag` | yes, if operand foldable |
| Supported binary operator | `a + b` | yes, if both sides foldable |
| Conditional | `a ? b : c` | yes, if condition foldable |
| Parentheses | `(a + b)` | yes, if inner expression foldable |

- Folding: the collector evaluates module-local `const` and initialized `let`/`var` references and records the result, letting metadata use non-exported locals.
- Non-foldable expressions are written to `.metadata.json` as an AST for the compiler to resolve.

### AOT metadata error catalogue

| Error message (paraphrased) | Cause | Fix |
| :-- | :-- | :-- |
| Expression form not supported | Syntax outside the collector subset (`typeof`, bracket keys, etc.) | Stay within the supported subset in metadata |
| Reference to a local (non-exported) symbol | Metadata uses a local that is neither exported nor initialized | Initialize it (gets folded) or `export` it |
| Only initialized variables and constants can be referenced | Exported variable/static field without an initializer where the value is needed (e.g. `template`), including ones imported from elsewhere | Add the initializer on the declaration line |
| Reference to a non-exported class | Unexported class used in metadata (e.g. as a provider token) | Export the class |
| Destructured variable or constant not supported | Metadata references a name created by destructuring | Use `config.foo` directly |
| Could not resolve type | Ambient type (e.g. `Window`) in a statically analyzed constructor | `InjectionToken` + factory + `useFactory` + `@Inject` |
| Name expected | Numeric property name, e.g. `{0: 'x'}` | Quote it: `{'0': 'x'}` |
| Unsupported enum member name | Enum member with a computed initializer | Avoid such enums in metadata |
| Tagged template expressions are not supported | e.g. `String.raw\`...\`` in metadata | Do not use tag functions in metadata |
| Symbol reference expected | Expression used in a class `extends` clause | No fix stated in the docs |

## Patterns

### Strict vs basic mode: embedded views

```ts
interface Member {
  name: string;
  address: { city: string; state: string };
}
```

```html
<!-- basic mode: neither line is checked; strict mode: member is typed as Member -->
<div *ngFor="let member of members">
  <h2>{{ settings.heading }}</h2>
  <span>City: {{ member.address.city }}</span>
</div>
```

### Input binding checked against `input()` type

```ts
@Component({ selector: 'member-card', template: '{{ member().name }}' })
export class MemberCard {
  member = input.required<Member>();
}

@Component({
  selector: 'app-root',
  template: '<member-card [member]="current" />',
})
export class App {
  current: Member | null = null; // error under strictNullChecks: null not assignable
}
```

### Working around nullable bindings

```html
<member-card [member]="current!" />
<member-card [member]="(member$ | async)!" />
```

```jsonc
// tsconfig.json — disable null checks for input bindings only (whole app)
{
  "angularCompilerOptions": {
    "strictTemplates": true,
    "strictNullInputTypes": false
  }
}
```

### `$any()` to skip checking

```ts
@Component({
  selector: 'profile-view',
  template: '{{ $any(profile).street }}',
})
class ProfileView {
  profile?: Profile;
}
```

### Input setter coercion (deprecated field form)

```ts
class ToggleButton {
  private _off = false;

  @Input()
  get off(): boolean { return this._off; }
  set off(value: boolean) { this._off = value === '' || value; }

  // [deprecated] — prefer typing the setter parameter as boolean | ''
  static ngAcceptInputType_off: boolean | '';
}
```

```html
<toggle-button off></toggle-button>  <!-- same as [off]="''" -->
```

### Type narrowing instead of non-null assertion

```ts
@Component({
  selector: 'address-line',
  template: `<span *ngIf="person && address">
    {{ person.name }} lives on {{ address.street }}
  </span>`,
})
class AddressLine {
  person?: Person;
  address?: Address;
}
```

### Code folding of a local constant

```ts
const markup = '<p>{{ item().label }}</p>'; // not exported, but foldable

@Component({
  selector: 'item-row',
  template: markup + '<p>{{ item().note }}</p>', // folded into one string literal
})
export class ItemRow {
  item = input.required<Item>();
}
```

### Macro function in metadata

```ts
export function asList<T>(value: T): T[] {
  return [value];
}

@NgModule({ declarations: asList(ItemRow) }) // treated as [ItemRow]
export class ItemModule {}
```

### Fixing metadata errors

```ts
// Local symbol: initialize (folded) or export
let retries = 3;               // folded into useValue: 3
export let endpoint: string;   // exported: compiler emits a reference

// Value needed now: initialize on the same line
export let shellTemplate = '<h1>Hello</h1>';
@Component({ selector: 'app-shell', template: shellTemplate })
export class Shell {}

// Non-exported class token: export it
export abstract class SortStrategy {}

// Destructuring: reference properties directly
providers: [{ provide: ApiUrl, useValue: settings.apiUrl }];

// Numeric key: quote it
providers: [{ provide: Lookup, useValue: { '0': 'zero' } }];
```

### Injecting an ambient type

```ts
import { Component, Inject, InjectionToken } from '@angular/core';

export const WIN = new InjectionToken('Window');
export function getWindow() { return window; }

@Component({
  selector: 'win-info',
  template: '',
  providers: [{ provide: WIN, useFactory: getWindow }],
})
export class WinInfo {
  constructor(@Inject(WIN) private win: Window) {}
}
```

The same approach backs `DOCUMENT` from `@angular/common`, injected with `@Inject(DOCUMENT) private doc: Document`.

### Immediate metadata errors for libraries

```json
{
  "angularCompilerOptions": {
    "strictMetadataEmit": true
  }
}
```

## Pitfalls
- Basic mode checks only top-level template expressions: it does not check that `user.address.city` is assignable to the target input, skips embedded views (`@if`, `@for`, `*ngIf`, `*ngFor`, any `<ng-template>`), and does not infer `#ref`, pipe result or `$event` types — these often become `any` and silently disable checking downstream.
- Switching to strict mode can surface new errors; most are real mismatches the old checks missed, and the message points to the template location.
- Typical false positives: library typings missing `null | undefined` (built without `strictNullChecks`), overly narrow boolean inputs used as bare attributes like `<input disabled>`, and `$event.target` on DOM events (event bubbling means it is not typed as you expect).
- The `async` pipe's return type always includes `null` (no value may exist yet), even for Observables that emit synchronously.
- A bare attribute such as `<x disabled>` binds the empty string `''`, which fails strict checking against a `boolean` input.
- Template error file names like `my.component.ts.MyComponent.html` are synthetic and never written to disk; line/column are relative to the inline `template` string. With `templateUrl`, errors point at the real HTML file.
- Error location is the start of the text node holding the failing interpolation, or the attribute for an attribute binding.
- With `strictNullChecks` enabled, an optional property used without a guard additionally reports "Object is possibly 'undefined'".
- Unsupported metadata syntax is recorded as an error node; the compiler only reports it later if it actually needs that metadata (unless `strictMetadataEmit` is set).
- The compiler may reject syntactically valid metadata whose semantics break its rules (phase 2).
- Exporting an uninitialized variable fixes reference-only uses (`providers`, `animations`) but not value uses like `template`, which yields "Only initialized variables and constants can be referenced" — even when imported from another file that never initializes it.
- Factories are generated in a separate module, so they cannot reach non-exported locals or classes in your source file.
- You may use `typeof` and bracket notation freely in ordinary code; the restriction applies only inside metadata expressions.

## Version notes
- [deprecated] Input setter coercion fields (`static ngAcceptInputType_*`) — obsolete since TypeScript 4.3 allows a setter to accept a wider type than its getter.
- AOT is the default compiler starting with Angular 9; JIT was the default up to Angular 8.
- Compiler ABI stability is guaranteed across patch versions within a single minor version.
- `strictUnclaimedEventNames` defaults to `false` even when `strictTemplates` is `true`.
