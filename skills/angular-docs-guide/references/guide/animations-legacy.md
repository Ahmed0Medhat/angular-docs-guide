# Legacy Animations (`@angular/animations`)

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/legacy-animations,
> Transition and Triggers — https://angular.dev/guide/legacy-animations/transition-and-triggers,
> Complex Sequences — https://angular.dev/guide/legacy-animations/complex-sequences,
> Reusable Animations — https://angular.dev/guide/legacy-animations/reusable-animations.

## When to use
- Maintaining existing code built on the deprecated `@angular/animations` DSL (`trigger`, `state`, `transition`, `animate`).
- Animating an element between named states (e.g. `open` / `closed`) driven by a component property.
- Animating elements inserted into or removed from the DOM with `:enter` / `:leave` (or `void`).
- Choreographing child elements with `query()`, `stagger()`, `group()` and `sequence()` (lists, grids, filters).
- Sharing parameterized animations across components with `animation()` + `useAnimation()`.
- Turning animations off for a subtree or the whole app (e.g. during E2E tests) with `@.disabled`.
- See also: native CSS `animate.enter` / `animate.leave` (recommended for new code) and migrating off this package → references/guide/animations.md
- See also: route transition animations → references/guide/routing-advanced.md
- See also: view encapsulation modes → references/guide/components.md

## Rules
- AVOID `@angular/animations` in new code: the package is deprecated; the Angular team recommends native CSS with `animate.enter` / `animate.leave` and offers a migration guide.
- MUST enable the animation engine: add `provideAnimationsAsync()` (from `@angular/platform-browser/animations/async`) to the `bootstrapApplication` providers.
- PREFER `provideAnimations()` (from `@angular/platform-browser/animations`) **instead of** `provideAnimationsAsync()` when an animation has to run right as the app loads; it loads the animations module eagerly. Use one or the other, not both.
- MUST import `BrowserAnimationsModule` into the root `NgModule` for NgModule-based apps.
- MUST import the DSL functions (`trigger`, `state`, `style`, `animate`, `transition`, …) from `@angular/animations`.
- MUST declare triggers in the `animations:` array of the `@Component()` decorator of the component that owns the animated element.
- MUST attach a trigger in that component's template as `[@triggerName]="expr"`; the animation runs when `expr` changes to a new state value.
- MUST write dashed CSS property names in `style()` either in camelCase (`backgroundColor`) or quoted (`'background-color'`).
- MUST give each `state()` a unique name plus a `style()`; state styles are the end styles and stay applied after the animation finishes.
- PREFER putting intermediate (in-motion) styles in `transition()`; `state()` holds the resting styles.
- MUST list specific transitions **before** a catch-all `* => *`; transitions are matched in definition order.
- PREFER wildcard (`*`) states when an element can move between many states, so new states don't each need their own transition.
- PREFER `:enter` / `:leave` to target elements being inserted/removed; `state()` is not needed for them.
- PREFER `:increment` / `:decrement` to react to a numeric binding that goes up or down.
- PREFER binding a boolean and matching `true`/`false` (or `1`/`0`) in `transition()` as an alternative to two named states.
- MUST, for a child trigger to play while a parent animates, have the parent `query()` the child elements and run them with `animateChild()`; otherwise the parent wins and children are blocked.
- PREFER `@.disabled` (bound to `true`) on an element to switch off its animations and all nested ones; put it as a host binding on the root component to disable animations app-wide (useful for E2E tests).
- MUST include an `offset` on every keyframe step once you use it on any step.
- MUST supply numeric style values with units as quoted strings (`'50px'`, `'3em'`, `'100%'`); a bare number means pixels (`50` = `'50px'`).
- PREFER `style({prop: '*'})` when a dimension (height/width) is only known at runtime; Angular computes it and feeds it into the animation.
- PREFER `query(selector, steps, {optional: true})` when the selector may match nothing, as the documented filter example does for `:enter`.
- MUST, when animating items of a repeated list whose order can change at runtime, give the repeater a tracking function (`TrackByFunction` on `NgForOf`) so the right element gets the right animation.
- AVOID applying animations to views containing components that use `ViewEncapsulation.ShadowDom` or `ViewEncapsulation.ExperimentalIsolatedShadowDom`.
- PREFER defining reusable animations with `animation()` in a separate `.ts` file, exported as a `const`, and invoking them with `useAnimation()`; parts such as a whole `trigger()` can also be exported.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `provideAnimationsAsync()` | Enables animations, lazy-loading the module | From `@angular/platform-browser/animations/async`; goes in `bootstrapApplication` providers |
| `provideAnimations()` | Enables animations, loaded eagerly | From `@angular/platform-browser/animations`; replaces the async provider when animations must run at startup |
| `BrowserAnimationsModule` | Enables animations in NgModule apps | From `@angular/platform-browser/animations` |
| `animations: [...]` | `@Component()` metadata holding triggers | — |
| `trigger(name, [...])` | Names an animation and contains its states/transitions | Template binds `[@name]`; one state per element per trigger at a time; several triggers can be active together |
| `state(name, style(...))` | Named set of end styles | Persist after the transition; cannot be skipped when animations are disabled |
| `style({...})` | Set of CSS styles (object syntax) | camelCase or quoted dashed names; `'*'` value = current/computed value |
| `transition(expr, steps)` | Steps to run between states | `expr`: `a => b`, `a <=> b`, `*`, `void`, `:enter`, `:leave`, `:increment`, `:decrement`, `true`/`false`, `1`/`0`; comma-separate several pairs |
| `animate(timings, style?/keyframes?)` | Timing of a step plus target styles | `timings`: number (ms) or `'duration delay easing'`; duration required |
| `keyframes([...style])` | Several style changes inside one `animate()` | Each `style()` may carry `offset` (0–1); omitted offsets are spaced evenly |
| `group([...])` | Runs steps in parallel | Groups steps, not elements; finishes when all inner steps finish; used in `sequence()` or `transition()` |
| `sequence([...])` | Runs steps one after another | Steps are `style()` (instant) or `animate()` (over time) |
| `query(selector, steps, opts?)` | Finds inner elements to animate | Selector tokens: `:enter`, `:leave`, `:animating`, `@*`, `@triggerName`, `:self`; `{optional: true}` |
| `stagger(delay, steps)` | Cascading delay between queried elements | e.g. `stagger(30, [...])` |
| `animation([...])` | Defines a reusable animation | Supports `{{ param }}` placeholders replaced at runtime |
| `useAnimation(ref, {params})` | Runs a reusable animation | Pairs with `animation()` |
| `animateChild()` | Lets queried child animations run with the parent | Child triggers are otherwise blocked by the parent |
| `[@.disabled]="bool"` | Turns off animations on an element and its descendants | Also usable as a host binding (`@HostBinding('@.disabled')`) |
| `(@name.start)` / `(@name.done)` | Animation start/finish callbacks | `$event` is an `AnimationEvent` |
| `AnimationEvent` | Callback payload | `triggerName`, `phaseName` (`start`/`done`), `totalTime` (ms), `fromState`, `toState`, `element` |

### Timing strings
| Value | Meaning |
| --- | --- |
| `100` / `'100ms'` / `'0.1s'` | 100 ms duration (number = ms; strings need a unit) |
| `'0.2s 100ms'` | 100 ms delay, then 200 ms run (delay uses the same syntax as duration) |
| `'0.2s 100ms ease-out'` | Delay, run, decelerating curve |
| `'0.2s ease-in-out'` | No delay; slow start, faster middle, slow end |
| `'0.2s ease-in'` | No delay; slow start, ends at full speed |
| `'500ms cubic-bezier(0.35, 0, 0.25, 1)'` | Custom easing curve |

### Transition expressions
| Expression | Fires when |
| --- | --- |
| `open => closed` | One direction only |
| `open <=> closed` | Either direction |
| `open => *` | Leaving `open` for anything |
| `* => *` | Any state change (use last, as fallback) |
| `void => *` / `:enter` | Element is added to the view |
| `* => void` / `:leave` | Element is removed from the view |
| `:increment` / `:decrement` | Bound number grows / shrinks |
| `on => off, off => void` | Several pairs in one transition |

## Patterns

### Bootstrapping
```ts
import {bootstrapApplication} from '@angular/platform-browser';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

bootstrapApplication(App, {providers: [provideAnimationsAsync()]});
// Need animations at first paint? use provideAnimations() from
// '@angular/platform-browser/animations' in its place.
```

```ts
// NgModule apps
@NgModule({imports: [BrowserModule, BrowserAnimationsModule]})
export class AppModule {}
```

### State-based trigger
```ts
import {Component} from '@angular/core';
import {trigger, state, style, animate, transition} from '@angular/animations';

@Component({
  selector: 'app-panel',
  animations: [
    trigger('expand', [
      state('open', style({height: '200px', opacity: 1, backgroundColor: 'yellow'})),
      state('closed', style({height: '100px', opacity: 0.8, backgroundColor: 'blue'})),
      transition('open => closed', [animate('1s')]),
      transition('closed => open', [animate('0.5s')]),
      // or: transition('open <=> closed', [animate('0.5s')]),
      // keep the catch-all last:
      transition('* => *', [animate('1s')]),
    ]),
  ],
  template: `
    <button type="button" (click)="isOpen = !isOpen">Toggle</button>
    <div [@expand]="isOpen ? 'open' : 'closed'">Box is {{ isOpen ? 'open' : 'closed' }}</div>
  `,
})
export class Panel {
  isOpen = true;
}
```

Wildcard style value (animate to whatever opacity is current):
```ts
transition('* => open', [animate('1s', style({opacity: '*'}))]);
```

### Boolean binding
```ts
trigger('collapse', [
  state('true', style({height: '*'})),
  state('false', style({height: '0px'})),
  transition('false <=> true', animate(500)),
]);
```
```html
<div [@collapse]="isOpen ? true : false">…</div>
```

### Enter / leave
```ts
trigger('fade', [
  transition(':enter', [style({opacity: 0}), animate('100ms', style({opacity: 1}))]),
  transition(':leave', [animate('100ms', style({opacity: 0}))]),
]);
```
```html
@if (visible) {
  <div @fade>Inserted box</div>
}
```

Explicit `void` form (slide in from left, out to right):
```ts
trigger('slide', [
  state('in', style({transform: 'translateX(0)'})),
  transition('void => *', [style({transform: 'translateX(-100%)'}), animate(100)]),
  transition('* => void', [animate(100, style({transform: 'translateX(100%)'}))]),
]);
```

Runtime-computed height on removal:
```ts
trigger('shrink', [
  state('in', style({height: '*'})),
  transition('* => void', [style({height: '*'}), animate(250, style({height: 0}))]),
]);
```

### Keyframes
```ts
transition('* => active', [
  animate('2s', keyframes([
    style({backgroundColor: 'blue', offset: 0}),
    style({backgroundColor: 'red', offset: 0.8}),
    style({backgroundColor: '#754600', offset: 1.0}),
  ])),
]);
// Without offsets, three steps get 0, 0.5 and 1 automatically.
```

### Callbacks
```html
<div
  [@expand]="isOpen ? 'open' : 'closed'"
  (@expand.start)="onAnim($event)"
  (@expand.done)="onAnim($event)">
</div>
```
```ts
import {AnimationEvent} from '@angular/animations';

onAnim(e: AnimationEvent) {
  console.warn(e.triggerName, e.phaseName, e.totalTime, e.fromState, e.toState, e.element);
}
```

### Disabling animations
```html
<div [@.disabled]="isDisabled">
  <div [@childAnim]="isOpen ? 'open' : 'closed'">…</div> <!-- won't run while disabled -->
</div>
```
```ts
// App-wide: host binding on the topmost component
export class App {
  @HostBinding('@.disabled') animationsDisabled = false;
}
```

### Staggered list on page enter
```ts
trigger('pageEnter', [
  transition(':enter', [
    query('.item', [
      style({opacity: 0, transform: 'translateY(-100px)'}),
      stagger(30, [
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({opacity: 1, transform: 'none'})),
      ]),
    ]),
  ]),
]);
```

### Filter list driven by a count (`:increment` / `:decrement`)
```html
<ul [@filter]="total">
  @for (item of items; track item) { <li>{{ item.name }}</li> }
</ul>
```
```ts
trigger('filter', [
  transition(':enter, * => 0, * => -1', []), // skip first render and resets
  transition(':increment', [
    query(':enter', [
      style({opacity: 0, width: 0}),
      stagger(50, [animate('300ms ease-out', style({opacity: 1, width: '*'}))]),
    ], {optional: true}),
  ]),
  transition(':decrement', [
    query(':leave', [stagger(50, [animate('300ms ease-out', style({opacity: 0, width: 0}))])]),
  ]),
]);
```
The component updates `total` when the filtered length changes and sets it back to `-1` when the search is cleared and the count is unchanged.

### Parallel steps with `group()`
```ts
trigger('fly', [
  state('in', style({width: '*', transform: 'translateX(0)', opacity: 1})),
  transition(':enter', [
    style({width: 10, transform: 'translateX(50px)', opacity: 0}),
    group([
      animate('0.3s 0.1s ease', style({transform: 'translateX(0)', width: '*'})),
      animate('0.3s ease', style({opacity: 1})),
    ]),
  ]),
  transition(':leave', [
    group([
      animate('0.3s ease', style({transform: 'translateX(50px)', width: 10})),
      animate('0.3s 0.2s ease', style({opacity: 0})),
    ]),
  ]),
]);
```

### Reusable, parameterized animation
```ts
// animations.ts
import {animation, style, animate, trigger, transition, useAnimation} from '@angular/animations';

export const fadeResize = animation([
  style({height: '{{ height }}', opacity: '{{ opacity }}', backgroundColor: '{{ backgroundColor }}'}),
  animate('{{ time }}'),
]);

// a whole trigger can be exported too
export const expandTrigger = trigger('expand', [
  transition('open => closed', [
    useAnimation(fadeResize, {params: {height: 0, opacity: 1, backgroundColor: 'red', time: '1s'}}),
  ]),
]);
```
```ts
// consumer component
import {transition, trigger, useAnimation} from '@angular/animations';
import {fadeResize} from './animations';

@Component({
  animations: [
    trigger('expand', [
      transition('open => closed', [
        useAnimation(fadeResize, {params: {height: 0, opacity: 1, backgroundColor: 'red', time: '1s'}}),
      ]),
    ]),
  ],
})
```

## Pitfalls
- Without a `transition()`, changing state applies the new styles instantly with no visible motion.
- When animations are disabled, `transition()` styles may be skipped but `state()` styles are still applied.
- An element is in only one state per trigger at a time; multiple triggers may run at once.
- Transition order matters: a `* => *` declared first would shadow more specific transitions declared after it.
- Wildcard `*` also matches `void`.
- Entering/leaving is not always intuitive: anything Angular adds to the DOM goes through `:enter`, but only elements Angular removes **directly** go through `:leave`; an element removed because its parent was removed does not.
- Not every child counts as entering/leaving for `query(':enter' / ':leave')`; check the `query` API docs when results surprise you.
- Parent animations take priority and block child triggers unless the parent uses `query()` + `animateChild()`.
- `@.disabled` disables everything inside the element; you cannot switch off just some of several animations on one element. Inside a disabled area, children can still animate if a parent `query()`s them, or queries them and runs `animateChild()`.
- A numeric value without units is treated as pixels, but the string `"50"` (no unit) is not valid.
- Keyframe offsets are all-or-nothing: once one step has an `offset`, give every step one.
- Reordering a repeated list without a tracking function makes Angular lose element identity and break the animations.
- `ViewEncapsulation.Emulated` behaves like `ViewEncapsulation.None` for animations: a `query()` at the top of a tree can reach elements at any depth. `ShadowDom` / `ExperimentalIsolatedShadowDom` hide elements in `ShadowRoot`s, which parts of the animation engine don't handle.
- The filter-style animation only narrows elements already in the DOM, so skip it on the initial render (e.g. `transition(':enter, * => 0, * => -1', [])`).

## Version notes
- [deprecated] The `@angular/animations` package (every DSL function in this file comes from it). The docs recommend native CSS with `animate.enter` / `animate.leave` for all new code.
