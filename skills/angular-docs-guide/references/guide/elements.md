# Custom Elements

> Sources (angular.dev, v22.3 @ bd1e32b): Custom Elements — https://angular.dev/guide/elements.

## When to use
- Packaging an Angular component as a framework-agnostic custom element (Web Component) usable as a plain HTML tag.
- Adding a component to the page at runtime without hand-wiring change detection, inputs, outputs and cleanup.
- Exposing component inputs as element attributes/properties and outputs as DOM `CustomEvent`s.
- Getting TypeScript type checking and autocomplete for Angular-built custom elements returned by DOM APIs.
- See also: rendering components programmatically with `createComponent` → references/guide/components.md

## Rules
- MUST install the `@angular/elements` package before using `createCustomElement()` (`npm install @angular/elements`; yarn/pnpm/bun `add` also work).
- MUST convert the component with `createCustomElement(Component, {injector})`, then register the returned constructor with the browser via `customElements.define(tagName, ctor)`.
- AVOID using the component's `selector` as the custom element tag name: Angular would create two component instances for the same DOM element (one regular component, one via the custom element).
- PREFER a custom element over manual `createComponent` when adding a component at runtime; the element supplies the host-view attachment, input setting, output subscription and teardown for you, leaving only event handling to you.
- PREFER a cast to `NgElement & WithProperties<{...}>` for quick, one-off typing of an element returned by `document.createElement()` / `querySelector()`.
- PREFER augmenting the global `HTMLElementTagNameMap` when the same custom element is typed in many places, so each element type is declared once.
- AVOID destroying and re-attaching Angular custom elements without care, because of known problems with the `disconnect()` callback.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `createCustomElement(component, {injector})` | Turn a component (plus its dependencies) into a class the browser can register | From `@angular/elements`; result implements `NgElementConstructor` and yields self-bootstrapping instances |
| `NgElementConstructor` | Interface of the configured constructor class | Produced by the conversion |
| `customElements.define(tag, ctor)` | Browser API registering the tag/constructor pair in the `CustomElementRegistry` | Browser then instantiates the class whenever it meets the tag |
| `NgElement` | Base type of Angular custom elements | Extends `HTMLElement`; exported from `@angular/elements` |
| `WithProperties<P>` | Adds typed properties (one per component input) to an element type | Exported from `@angular/elements`; combine as `NgElement & WithProperties<P>` |
| `HTMLElementTagNameMap` (global interface) | Map tag names to element types for DOM-method inference | Augment inside `declare global { ... }` |

### Input/output mapping
| Component side | Custom element side |
| --- | --- |
| `input()` property | Element attribute, name converted to dash-separated lowercase (attributes are case-insensitive) |
| `x = input('', {alias: 'myInputProp'})` | Attribute `my-input-prop` (alias is what gets converted) |
| Each input | Also a property on the element of the input's type (e.g. `message: string`) |
| `valueChanged = output()` | `CustomEvent` named `valueChanged`; emitted value lives on `event.detail` |
| `x = output<string>({alias: 'myClick'})` | `CustomEvent` named `myClick` (alias wins) |

## Patterns

### Lifecycle facts
- Custom elements start themselves when inserted into the DOM and are destroyed when removed.
- Once in the DOM they behave like any built-in element; consumers need no Angular knowledge.
- Content comes from the component's template (Angular template syntax), rendered from component and DOM data.

### Define and register an element
```ts
import {Component, Injector, inject, input, output} from '@angular/core';
import {createCustomElement} from '@angular/elements';

@Component({
  selector: 'app-toast', // NOT reused as the custom-element tag
  template: `
    <span>{{ text() }}</span>
    <button type="button" (click)="dismissed.emit()">Close</button>
  `,
})
export class Toast {
  readonly text = input('');
  readonly dismissed = output<void>();
}

@Component({selector: 'app-root', template: `...`})
export class App {
  constructor() {
    const ToastElement = createCustomElement(Toast, {injector: inject(Injector)});
    customElements.define('toast-element', ToastElement);
  }
}
```

### Use it in markup
```html
<toast-element text="Saved!" />
```

### Add it at runtime from a service
```ts
import {Injectable} from '@angular/core';
import {NgElement, WithProperties} from '@angular/elements';

@Injectable()
export class ToastService {
  showAsElement(text: string) {
    const el = document.createElement('toast-element') as NgElement & WithProperties<{text: string}>;
    el.addEventListener('dismissed', () => document.body.removeChild(el)); // output -> DOM event
    el.setAttribute('text', text); // input -> attribute
    document.body.appendChild(el); // self-bootstraps on insertion
  }
}
```

### Same thing with `createComponent` (for comparison: you own the plumbing)
```ts
import {ApplicationRef, createComponent, EnvironmentInjector, inject, Injectable} from '@angular/core';

@Injectable()
export class ToastDynamicService {
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);

  showAsComponent(text: string) {
    const host = document.createElement('toast-component');
    const ref = createComponent(Toast, {environmentInjector: this.envInjector, hostElement: host});
    this.appRef.attachView(ref.hostView); // so change detection runs
    ref.instance.dismissed.subscribe(() => {
      document.body.removeChild(host);
      this.appRef.detachView(ref.hostView);
    });
    ref.setInput('text', text);
    document.body.appendChild(host);
  }
}
```

### Typing option 1: cast at each call site
```ts
const dlg = document.createElement('my-dialog') as NgElement & WithProperties<{content: string}>;
dlg.content = 'Hi';   // OK
dlg.content = 42;     // type error: must be string
dlg.title2 = 'x';     // type error: unknown property
```

### Typing option 2: declare once via `HTMLElementTagNameMap`
```ts
declare global {
  interface HTMLElementTagNameMap {
    'my-dialog': NgElement & WithProperties<{content: string}>;
    'my-badge': NgElement & WithProperties<{tone: 'info'}>;
  }
}

document.createElement('my-dialog');  // NgElement & WithProperties<{content: string}>
document.querySelector('my-badge');   // NgElement & WithProperties<{tone: 'info'}>
document.querySelector('unknown-x');  // Element (unknown tag)
```

## Pitfalls
- Reusing the component selector as the element tag produces two component instances on one DOM node and unexpected behavior.
- Without typings, `document.createElement('popup-element')` and similar calls return a generic `HTMLElement`, so TypeScript cannot see the element's input properties.
- The per-call-site cast works but becomes repetitive when the element is used in many places; switch to `HTMLElementTagNameMap` augmentation.
- Known `disconnect()` callback issues when destroying then re-attaching an Angular custom element, e.g.:
  - rendering it inside AngularJS `ng-if` or `ng-repeat`;
  - manually detaching an element from the DOM and attaching it again.
- Manual `createComponent` usage requires attaching the host view to `ApplicationRef` (or change detection will not run), setting inputs, subscribing to outputs, and detaching/cleaning up on removal; forgetting any step is on you.

## Version notes
- None stated in the docs.
