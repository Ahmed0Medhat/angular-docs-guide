# Animations

> Sources (angular.dev, v22.3 @ bd1e32b): Enter and Leave animations — https://angular.dev/guide/animations,
> Complex Animations with CSS — https://angular.dev/guide/animations/css,
> Migrating to Native CSS Animations — https://angular.dev/guide/animations/migration.

## When to use
- Animating an element as it is inserted into or removed from the DOM (`@if`, `@for`, dynamic content) with `animate.enter` / `animate.leave`.
- Driving enter/leave motion from JavaScript or a third-party library (GSAP, anime.js, …) through the `(animate.enter)` / `(animate.leave)` event syntax.
- Building open/closed state transitions, auto-height expanders, increment/decrement pulses, staggered or parallel sequences, and reordering lists in plain CSS.
- Disabling animations (per element, globally, or for reduced-motion users) and reacting to native animation/transition events.
- Migrating components off the deprecated `@angular/animations` package (`trigger`, `state`, `transition`, `query`, `stagger`, `group`, `AnimationPlayer`).
- Turning animations on or off in `TestBed`.
- See also: toggling classes/styles with `[class.x]` / `[style.x]` bindings → references/guide/templates.md
- See also: route transition animations (view transitions) → references/guide/routing-advanced.md

## Rules
- PREFER `animate.enter` / `animate.leave` for DOM insertion/removal animations. They are syntax handled by the compiler, not directives, and work directly on elements or as host bindings.
- MAY pass either a space-separated class string or an array of class strings to `animate.enter` / `animate.leave`; static (`animate.enter="cls"`) and bound (`[animate.enter]="sig()"`) forms are both supported, alongside control flow and signals.
- MUST pair transition-based `animate.enter` classes with `@starting-style`: with transitions, the enter class describes the *target* state and the element's base CSS is the resting state, so `@starting-style` must supply the *from* state.
- MUST call `event.animationComplete()` inside an `(animate.leave)` handler; Angular only removes the element after it is called (or after the timeout fallback).
- PREFER placing `animate.leave` on the removed element itself, or on descendants of it in the same component template, so the children animate before the parent leaves.
- MUST put `animate.leave` on a child component's host element in the parent template (or trigger it programmatically in the child and delay the parent's removal) if a nested component must animate on removal.
- NEVER mix legacy `@angular/animations` triggers with `animate.enter` / `animate.leave` in the same component, nor across content projection between a legacy-animated component and an `animate.*` component. Mixing them at the application level in separate components is fine.
- PREFER shared `@keyframes` in a common CSS file for reusable animations; apply them by adding a class.
- PREFER toggling CSS classes or styles (e.g. `[class.open]`) to trigger state animations; removing the class returns the element to its base CSS.
- PREFER CSS Grid (`grid-template-rows: 0fr` → `1fr`) to animate to auto height; consider `calc-size()` if broad browser support is not a concern.
- PREFER `animation-delay` / `transition-delay` (e.g. driven by a `--index` custom property) for staggered lists.
- PREFER the `animation` shorthand with comma-separated entries for parallel animations; each entry gets its own duration and delay.
- MUST sequence animations yourself (delays, or `animationend` / `transitionend` handlers adding the next class) — native CSS animations in a component have no priority and do not block each other.
- MUST apply increment/decrement classes programmatically; nothing adds them automatically when a value rises or falls.
- PREFER `Element.getAnimations()` and the native `Animation` API (`cancel()`, `play()`, `pause()`, `reverse()`, …) for programmatic control instead of `AnimationPlayer`.
- PREFER plain CSS selectors plus class/style bindings instead of `query()` for targeting specific child elements.
- MUST set `animationsEnabled: true` in `TestBed.configureTestingModule` when a browser/e2e test needs animations to actually run; TestBed disables them by default.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `animate.enter="a b"` / `[animate.enter]="expr"` | Adds classes while an element enters the DOM; removed when the animation ends | Accepts string (space-separated) or string array. Classes stay until the longest animation/transition finishes. Introduced v20.2 |
| `animate.leave="a b"` / `[animate.leave]="expr"` | Adds classes when an element is removed; Angular removes the element after the animation | Waits for the longest of multiple animations/transitions. Introduced v20.2 |
| `(animate.enter)="fn($event)"` / `(animate.leave)="fn($event)"` | Calls a component function (e.g. a JS animation library) on enter/leave | `$event` is `AnimationCallbackEvent` |
| `AnimationCallbackEvent` | Event passed to the function form | `target` = the element; `animationComplete()` signals the animation is done (required for leave). Import from `@angular/core` |
| `MAX_ANIMATION_TIMEOUT` | Token setting how long Angular waits before auto-calling `animationComplete()` for leave | Milliseconds; default fallback is 4 seconds |
| `TestBed.configureTestingModule({animationsEnabled: true})` | Runs animations normally in tests | Animations are disabled in TestBed by default |
| `@starting-style` (CSS) | Defines the from-state of an element as it first renders | Needed for transition-based enter animations; also used for `@for` items re-added on reorder |
| `@keyframes` + `animation` / `animation-duration` / `-delay` / `-timing-function` | Keyframe animations and timing | Shorthand: `animation: name 1s ease-in-out 500ms` |
| `transition` / `transition-property` / `-duration` / `-delay` / `-timing-function` | Non-keyframe animations and timing | Shorthand: `transition: margin-right 1s ease-in-out 500ms` |
| `animationstart` / `animationend` / `animationiteration` / `animationcancel` | Native keyframe animation events | Bubble from children to parents |
| `transitionstart` / `transitionrun` / `transitionend` / `transitioncancel` | Native transition events | Bubble from children to parents |
| `Element.getAnimations()` | Returns every `Animation` on an element | Replaces `AnimationPlayer` (`cancel()`, `play()`, `pause()`, `reverse()`, …) |
| `@angular/animations` (`trigger`, `state`, `style`, `animate`, `transition`, `keyframes`, `animation`/`useAnimation`, `query`, `stagger`, `group`, `animateChild`, `AnimationPlayer`) | Legacy animation DSL | [deprecated] since v20.2 |

### Legacy → native mapping
| `@angular/animations` | Native replacement |
| --- | --- |
| `animation()` in a shared TS file | `@keyframes` + class in a shared CSS file |
| `state('open', style(...))` | A CSS class (`.open`) with its styles and a `transition` |
| `trigger()` + `[@trigger]` binding | Toggle a class/style; no trigger needed |
| `animate('1s ...')` timing | `animation-*` / `transition-*` properties or shorthands |
| `open => closed`, `* => closed`, `void => *`, `* => void` | Not needed: choose classes/styles; use `@starting-style` for first paint |
| `height: '*'` (auto) | CSS Grid `0fr`/`1fr` or `calc-size()` |
| `:enter` / `:leave` | `animate.enter` / `animate.leave` (or `@starting-style` for entry) |
| `:increment` / `:decrement` | Add/remove classes yourself, clear on `animationend` |
| `query()` | CSS selectors on sub-classes + class/style bindings |
| `stagger()` | `animation-delay` / `transition-delay` per item |
| `group()` | Multiple comma-separated entries in `animation` |
| `query()` + `animateChild()` across components | Not available: nested component animations do not run on parent removal |
| `AnimationPlayer` | `Element.getAnimations()` + `Animation` API |
| Animation callbacks (`AnimationEvent`) | Native `animation*` / `transition*` DOM events |

## Patterns

### Enter with a keyframe class
```ts
@Component({
  selector: 'app-panel',
  template: `
    <button type="button" (click)="visible.update(v => !v)">Toggle</button>
    @if (visible()) {
      <div class="panel" animate.enter="slide-in">Hello</div>
    }
  `,
  styles: `
    .slide-in { animation: slide-in 1s; }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `,
})
export class Panel {
  visible = signal(false);
}
```

### Bound enter/leave classes
```html
@if (visible()) {
  <div class="card" [animate.enter]="enterCls()" [animate.leave]="leaveCls()">…</div>
}
```
```ts
enterCls = signal('slide-in');
leaveCls = signal(['fade-out', 'drop']); // array form also accepted
```

### Leave with a transition (base state + `@starting-style`)
```css
.card {
  opacity: 1;
  transition: opacity 200ms ease-in;
  @starting-style { opacity: 0; }   /* from-state on first render */
}
.fade-out {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 500ms ease-out, transform 500ms ease-out;
}
```
```html
@if (visible()) { <div class="card" animate.leave="fade-out">Bye</div> }
```

### Child animates before parent is removed (same template)
```html
@if (visible()) {
  <section>
    <div class="card" animate.leave="fade-out">Bye</div> <!-- runs first -->
  </section>
}
```

### Nested component on removal — animate its host in the parent template
```html
@if (visible()) {
  <app-item animate.leave="fade-out" />
}
```

### Function / third-party library
```ts
import {AnimationCallbackEvent, Component, signal} from '@angular/core';

@Component({
  selector: 'app-js-leave',
  template: `@if (visible()) { <div (animate.leave)="onLeave($event)">Bye</div> }`,
})
export class JsLeave {
  visible = signal(true);
  onLeave(event: AnimationCallbackEvent) {
    // e.g. gsap.to(event.target, { x: 100, onComplete: () => event.animationComplete() });
    event.animationComplete(); // required, or Angular waits for the timeout
  }
}
```

### Change the leave timeout
```ts
providers: [{ provide: MAX_ANIMATION_TIMEOUT, useValue: 6000 }]
```

### Open/closed state by toggling a class
```html
<div class="box" [class.open]="isOpen()">…</div>
```
```css
.box  { height: 100px; opacity: .8; transition-property: height, opacity; transition-duration: 1s; }
.open { height: 200px; opacity: 1; transition-duration: .5s; }
```

### Auto height with CSS Grid
```css
.wrap { display: grid; grid-template-rows: 0fr; overflow: hidden; transition: grid-template-rows 1s; }
.wrap.open { grid-template-rows: 1fr; }
.wrap .inner { min-height: 0; overflow: hidden; visibility: hidden; transition: visibility 1s; }
.wrap.open .inner { visibility: visible; }
```

### Increment / decrement (classes added manually)
```ts
export class Counter {
  count = signal(0);
  el = viewChild<ElementRef<HTMLElement>>('el');

  change(delta: number) {
    this.count.update(v => v + delta);
    this.el()?.nativeElement.classList.add(delta > 0 ? 'up' : 'down');
  }
  // listen for 'animationend' on the element; check ev.animationName,
  // then classList.remove('up', 'down') so the next change re-triggers
}
```

### Stagger a list
```html
@for (item of items; track $index) {
  <li class="item" style="--index: {{ $index }}">{{ item }}</li>
}
```
```css
.item {
  transition-property: opacity, transform;
  transition-duration: 500ms;
  transition-delay: calc(200ms * var(--index));
  @starting-style { opacity: 0; transform: translateX(-10px); }
}
```

### Parallel animations
```css
.target { animation: rotate 3s, fade-in 2s; }
```

### Reordering list
```html
@for (item of items; track item) {
  <li class="item" animate.leave="fade">{{ item }}</li>  <!-- entry via @starting-style on .item -->
}
```

### Disabling animations
```css
.no-animation { animation: none !important; transition: none !important; }
```
- Or wrap animation rules in a `prefers-reduced-motion` media query, or simply avoid adding animation classes in code.

### Tests
```ts
TestBed.configureTestingModule({ animationsEnabled: true });
```

## Pitfalls
- `animate.leave` classes/handlers inside a *child component's* template do not run when an ancestor element is removed; only same-template descendants animate before removal.
- Mixing legacy `@angular/animations` with `animate.enter` / `animate.leave` in one component (or via content projection between them) leaves enter classes stuck on elements or leaving nodes never removed — unsupported.
- Forgetting `animationComplete()` in an `(animate.leave)` function delays removal until the timeout (4 s by default, configurable via `MAX_ANIMATION_TIMEOUT`).
- A transition-based enter class without `@starting-style` has no from-state, so nothing visibly animates.
- Enter classes are removed (and leaving elements removed) only after the *longest* animation or transition on the element finishes.
- Forcing `animation: none` / `transition: none` also suppresses animation events; if element removal waits on those events it breaks — use 1 ms durations instead.
- Native animation/transition events bubble from children to parents; stop propagation or check `animationName` / the transitioned property to confirm the event target.
- Some test environments never emit `animationstart` / `animationend` or the transition equivalents; CSS animations need a real browser.
- Items in a `@for` are removed and re-added on reorder, which fires entry animations (`@starting-style` or `animate.enter`) again.

## Version notes
- [deprecated] `@angular/animations` package — deprecated as of v20.2.
- v20.2 introduced `animate.enter` and `animate.leave`.
- Removing `@angular/animations` can noticeably shrink the JS bundle; native CSS animations can use hardware acceleration.
