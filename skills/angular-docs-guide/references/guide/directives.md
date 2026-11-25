# Directives

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/directives,
> Attribute directives — https://angular.dev/guide/directives/attribute-directives,
> Structural directives — https://angular.dev/guide/directives/structural-directives,
> Directive composition API — https://angular.dev/guide/directives/directive-composition-api.

## When to use
- Packaging a behavior (tooltip, autofocus, hover highlight) once and reusing it on many elements or components.
- Reading or writing the host element's DOM, attributes or classes from a reusable class.
- Adding behavior to a third-party component without editing its source.
- Gating or feeding template content with custom rendering logic that `@if` / `@for` / `@switch` cannot express (permission checks, data loaded from an external source) via a structural directive.
- Composing several directive behaviors onto a component or directive host from TypeScript (`hostDirectives`).
- Disabling interpolation and bindings for a subtree (`ngNonBindable`).
- See also: components (directives with their own template), inputs, host element bindings → references/guide/components.md
- See also: class/style/property bindings, event listeners, control flow, `<ng-template>` → references/guide/templates.md
- See also: injecting dependencies such as `ElementRef` → references/guide/di.md
- See also: template type checking → references/tools/cli-compiler.md
- See also: `ng generate directive` → references/tools/cli-schematics.md

## Rules
- PREFER a component (a directive that has a template) when you must render your own markup or own a piece of UI.
- PREFER plain template bindings (class/style, property/attribute, event listeners) for one-off changes to a single element; reach for an attribute directive only to make that behavior reusable.
- MUST mark a custom directive class with `@Directive()` and give it a `selector`; wrap the name in square brackets (`'[appHighlight]'`) to match by attribute.
- PREFER prefixing selectors (e.g. `app`) to avoid name clashes.
- NEVER use XML-style namespaces in directive attributes (`app:Highlight` is invalid).
- PREFER the `host` metadata object for listening to host events and binding host properties/styles (declarative); `inject(ElementRef)` + `nativeElement` is the imperative alternative.
- MUST import the directive class into the consuming component's `imports` array before using its selector.
- PREFER naming an input after the selector so one binding (`[appHighlight]="color"`) both activates the directive and supplies its value.
- PREFER reading inputs as signals (`this.appHighlight()`) and falling back to defaults with `||`.
- PREFER leaving square brackets off an input bound to a static string (`defaultColor="violet"`).
- PREFER built-in control flow (`@if`, `@for`, `@switch`) for everyday conditional/repeated rendering; write a structural directive only for reusable rendering behavior it does not cover.
- PREFER prefixing every structural directive input with the directive's selector (`selectFrom` for `[select]`) so microsyntax keys map to it.
- MUST inject `TemplateRef` and `ViewContainerRef` in a structural directive and render via `viewContainerRef.createEmbeddedView(templateRef, context)`.
- PREFER `input.required()` for a structural directive input the directive cannot work without.
- PREFER `$implicit` in the context object for the value that a bare `let x` / `let-x` should receive.
- MUST use only one `*` structural directive per element; nest with `<ng-container>` when several must wrap the same element.
- PREFER adding template guards (`ngTemplateGuard_<input>`, `ngTemplateContextGuard`) so the template type checker catches mistakes at compile time.
- MUST list host directive inputs/outputs explicitly in `hostDirectives` if consumers should bind them; they are hidden by default.
- NEVER use a directive declared with `standalone: false` in `hostDirectives`.
- MUST expose a shared host directive's input/output under the same alias (or not at all) on every path that merges it, or compilation fails with NG8024.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `@Directive({selector, host, hostDirectives})` | Declare a directive class | `[attr]` selector matches by attribute |
| `host: {'(event)': 'handler()'}` | Listen to host element events | e.g. `mouseenter`, `mouseleave` |
| `host: {'[style.prop]': 'expr'}` | Bind a host style/property | `null` removes the style |
| `host: {'[attr.name]': 'expr'}` | Bind a host attribute | Used in the de-dup example (`data-trigger-id`) |
| `inject(ElementRef).nativeElement` | Imperative access to the host DOM element | e.g. `.style.backgroundColor = ...` |
| `input(default)` / `input.required<T>()` | Directive inputs, read as signals | Same API as components |
| `ngNonBindable` | Turn off interpolation, bindings and directives in an element's children | Directives on the element itself still run |
| `TemplateRef` | Content of the `<ng-template>` the structural directive sits on | Inject it |
| `ViewContainerRef` | DOM location where the template can be rendered | Inject it |
| `vcr.createEmbeddedView(tpl, ctx)` | Render the template with a context object | `ctx.$implicit` feeds bare `let x` |
| `*dir="..."` | Shorthand (microsyntax) that wraps the element in `<ng-template>` | One per element |
| `static ngTemplateGuard_<input>(dir, expr): expr is T` | Narrow the bound expression via a type assertion | Body unused at runtime; `return true` |
| `static ngTemplateGuard_<input>: 'binding'` | Narrow by truthiness of the bound expression | For "render when truthy" directives |
| `static ngTemplateContextGuard<T>(dir, ctx): ctx is Ctx<T>` | Type the template context from the directive type | Useful for generic directives |
| `hostDirectives: [Dir]` | Apply directives to the host from a component/directive class | Inputs/outputs not exposed by default |
| `hostDirectives: [{directive, inputs, outputs}]` | Expose chosen inputs/outputs | Alias with `'name: alias'` |
| `ng generate directive` | Scaffold a directive plus test file | CLI |

### Microsyntax grammar
```ts
_: prefix = "( :let | :expression ) (';' | ',')? ( :let | :as | :keyExp )_";   // shown exactly as on angular.dev
as     = :export "as" :local ";"?
keyExp = :key ":"? :expression ("as" :local)? ";"?
let    = "let" :local "=" :export ";"?
```

| Term | Meaning |
| --- | --- |
| `prefix`, `key` | HTML attribute key |
| `local` | Template-local variable name |
| `export` | Value the directive exports under a name |
| `expression` | Regular Angular expression |

| Shorthand part | Becomes |
| --- | --- |
| `prefix` + bare `expression` | `[prefix]="expression"` |
| `keyExp` | `[prefixKey]="expression"` (key PascalCased, selector prepended) |
| `let local` | `let-local="export"` (no assignment → `$implicit`) |

| Shorthand | Long form |
| --- | --- |
| `*myDir="let item of [1,2,3]"` | `<ng-template myDir let-item [myDirOf]="[1,2,3]">` |
| `*myDir="let item of [1,2,3] as items; trackBy: myTrack; index as i"` | `<ng-template myDir let-item [myDirOf]="[1,2,3]" let-items="myDirOf" [myDirTrackBy]="myTrack" let-i="index">` |
| `*ngComponentOutlet="cmp"` | `<ng-template [ngComponentOutlet]="cmp">` |
| `*ngComponentOutlet="cmp; inputs: myInputs"` | `<ng-template [ngComponentOutlet]="cmp" [ngComponentOutletInputs]="myInputs">` |
| `*myDir="exp as value"` | `<ng-template [myDir]="exp" let-value="myDir">` |

## Patterns

### Attribute directive with host bindings
```ts
import {Directive, signal} from '@angular/core';

@Directive({
  selector: '[appHover]',
  host: {
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
    '[style.background-color]': 'hovered() ? "yellow" : null',
  },
})
export class HoverDirective {
  protected hovered = signal(false);
}
```
```angular-html
<p appHover>Hover me</p>
```

### Imperative host access with inputs and fallbacks
```ts
import {Directive, ElementRef, inject, input} from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: {'(mouseenter)': 'paint(appHighlight() || fallback() || "red")', '(mouseleave)': 'paint("")'},
})
export class HighlightDirective {
  private el = inject(ElementRef);
  appHighlight = input('');   // same name as selector
  fallback = input('');

  paint(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }
}
```
```ts
@Component({selector: 'app-root', templateUrl: './app.html', imports: [HighlightDirective]})
export class App { color = ''; }
```
```angular-html
<p appHighlight>default red</p>
<p appHighlight="orange">static value</p>
<p [appHighlight]="'yellow'">literal expression</p>
<p [appHighlight]="color" fallback="violet">bound + static fallback</p>
```

### ngNonBindable
```angular-html
<p ngNonBindable>Shown literally: {{ 1 + 1 }}</p>
<!-- appHighlight still applies to the div; the interpolation inside is not evaluated -->
<div ngNonBindable [appHighlight]="'yellow'">{{ 1 + 1 }}</div>
```

### Structural directive
```ts
import {Directive, TemplateRef, ViewContainerRef, inject, input} from '@angular/core';

export interface DataSource<T> { load(): Promise<T>; }
export interface LoadContext<T> { $implicit: T; }

@Directive({selector: '[load]'})
export class LoadDirective<T> {
  private tpl = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);
  loadFrom = input.required<DataSource<T>>();   // `load` prefix → `from` key

  async ngOnInit() {
    const value = await this.loadFrom().load();
    this.vcr.createEmbeddedView(this.tpl, {$implicit: value});
  }

  static ngTemplateContextGuard<T>(d: LoadDirective<T>, ctx: any): ctx is LoadContext<T> {
    return true;
  }
}
```
```angular-html
<!-- shorthand -->
<p class="view" *load="let value; from: source">{{ value }}</p>
<!-- equivalent long form: only the directive and its bindings move to ng-template -->
<ng-template load let-value [loadFrom]="source">
  <p class="view">{{ value }}</p>
</ng-template>
```

### Input template guards
```ts
@Directive({selector: '[ifUser]'})
class IfUser {
  ifUser = input<User | Robot>();
  static ngTemplateGuard_ifUser(d: IfUser, e: User | Robot): e is User { return true; }
}

@Directive({selector: '[when]'})
class When {
  when = input.required<boolean>();
  static ngTemplateGuard_when: 'binding';   // bound expression treated as truthy inside
}
```

### Host directives with exposed and aliased API
```ts
@Component({
  selector: 'admin-menu',
  templateUrl: './admin-menu.html',
  hostDirectives: [
    {directive: MenuBehavior, inputs: ['menuId: id'], outputs: ['menuClosed: closed']},
  ],
})
export class AdminMenu {}
```
```angular-html
<admin-menu id="top" (closed)="onClosed()"></admin-menu>
```

### Composing directives transitively
```ts
@Directive({hostDirectives: [Tooltip, Menu]})
export class MenuWithTooltip {}

@Directive({hostDirectives: [MenuWithTooltip]})
export class FancyMenu {}   // creates Tooltip, Menu and MenuWithTooltip on its host
```

### Shared host directive (diamond) merged into one instance
```ts
@Directive({host: {'[attr.data-trigger-id]': 'triggerId()'}})
export class TriggerRef {
  readonly triggerId = input(`trigger-${crypto.randomUUID()}`);
}

@Directive({selector: '[popoverTrigger]', hostDirectives: [TriggerRef]})
export class PopoverTrigger { readonly ref = inject(TriggerRef); }

@Directive({selector: '[dropdownTrigger]', hostDirectives: [TriggerRef]})
export class DropdownTrigger { readonly ref = inject(TriggerRef); }
```
```angular-html
<!-- one TriggerRef instance, injected by both -->
<button popoverTrigger dropdownTrigger>Actions</button>
```

## Pitfalls
- Elements inside an `<ng-template>` with no structural directive on it are never rendered.
- `ngNonBindable` only disables binding for the element's descendants; directives on the element carrying it keep working. On a parent, it turns off interpolation, property binding and event binding for all children.
- Shorthand allows a single structural directive per element: there is just one generated `<ng-template>`, and the nesting order of several would be ambiguous.
- With shorthand, only the structural directive and its bindings move onto the `<ng-template>`; other attributes and bindings stay on the original element.
- A structural directive that calls `createEmbeddedView` once in `ngOnInit` does not re-render when its bound data source changes later.
- Template guard bodies are never executed; they exist only for the type checker (`return true` just satisfies TypeScript).
- A truthiness check cannot be modelled by a type assertion function; use the `'binding'` literal type instead.
- Host directives are attached statically at compile time; you cannot add them at runtime.
- The `selector` of a directive used in `hostDirectives` is ignored.
- Host directive inputs/outputs are not part of the host's public API unless listed.
- Host directives run constructors, input setting (`ngOnInit`) and host bindings before the component/directive they are applied to, and the order extends through nested chains (innermost first). So the host class can override any host binding a host directive sets.
- Both a class and its host directives may inject each other; when both provide the same token, the providers of the class declaring `hostDirectives` win.
- If a directive matches an element by template selector and also as a host directive, only the template match (full public API) is kept; host directive matches act like a `Partial` exposing only listed inputs/outputs.
- The same directive reached several times as a host directive becomes one instance; its input/output mappings are combined.
- Exposing the same input/output of a merged host directive under different aliases throws NG8024 at compile time.

## Version notes
- None stated in the docs.
