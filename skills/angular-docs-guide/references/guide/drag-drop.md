# Drag and Drop (Angular CDK)

> Sources (angular.dev, v22.3 @ bd1e32b): Drag and drop — https://angular.dev/guide/drag-drop.

## When to use
- Making a box, card or panel freely draggable around the page with `cdkDrag`.
- Building a reorderable list (vertical, horizontal or wrapping) and syncing the new order back to your array.
- Moving or copying items between several lists (kanban columns, product list → shopping cart).
- Restricting a drag: only via a handle, inside a container, along one axis, after a press delay, or not at all.
- Customizing the drag preview, the placeholder, where the preview is inserted, and the drop/sort animations.
- Making an element you don't own (e.g. an overlay dialog pane) draggable, or restoring a saved drag position.
- Adding sortable behavior to other components, e.g. sortable `MatTable` rows or `MatTabGroup` tabs.
- See also: injection tokens and providers used to configure drag and drop → references/guide/di.md

## Rules
- MUST install the CDK first (`ng add @angular/cdk`) and import only the directives the template needs (`CdkDrag`, `CdkDropList`, `CdkDropListGroup`, `CdkDragHandle`, `CdkDragPreview`, `CdkDragPlaceholder`) into the component's `imports`.
- MUST update your own data in a `(cdkDropListDropped)` handler; the directives only move DOM elements and never touch the model.
- PREFER `moveItemInArray` when `event.previousContainer === event.container`, and `transferArrayItem` (move) or `copyArrayItem` (copy) when the item came from a different list.
- MUST connect lists before items can travel between them: either `cdkDropListConnectedTo` (template reference or element `id`, single value or array) or a wrapping `cdkDropListGroup`.
- PREFER `cdkDropListGroup` when the number of lists is not known up front; lists added later inside the group link to all the others automatically.
- PREFER `cdkDragData` / `cdkDropListData` to attach model objects so drop events tell you where an item came from and went to.
- PREFER `cdkDropListEnterPredicate` to decide which items a list accepts; it runs each time a dragged item enters a new container and must return `true` to allow it.
- PREFER `cdkDropListSortPredicate` to control which index an item may move to; it runs before each index change, and a `false` result keeps the item where it is.
- PREFER `cdkDropListSortingDisabled` on a source list whose items may leave but must not be reordered; an item that isn't dropped somewhere valid returns to its original slot.
- PREFER `cdkDropListHasAnchor` + `cdkDropListSortingDisabled` for "copy from a catalog" lists; the anchor stays behind in the source list.
- PREFER `cdkDropListOrientation="horizontal"` for side-by-side lists; the default assumes a vertical list.
- PREFER `cdkDropListOrientation="mixed"` only for lists that wrap onto multiple lines; it reorders by moving DOM nodes and gives up sort animation.
- PREFER `cdkDragStartDelay` (milliseconds) for large draggable surfaces on touch devices so scrolling doesn't start a drag by accident.
- PREFER `cdkDragFreeDragPosition` to place a standalone (non-list) draggable programmatically, e.g. restoring its position when the user comes back.
- PREFER `cdkDragRootElement="<selector>"` when the element to move is an ancestor you can't put `cdkDrag` on directly (such as `.cdk-overlay-pane`).
- PREFER `cdkDragLockAxis` on a single item, or `cdkDropListLockAxis` on the list to lock all of its items at once.
- PREFER `matchSize` on `*cdkDragPreview` when the custom preview should have the dragged element's size.
- MUST add the `cdkScrollable` directive to a scrollable ancestor (e.g. `overflow: auto`) of draggable items, or auto-scroll while dragging won't happen.
- MUST target the `transform` property in CSS transitions to animate sorting (`.cdk-drag`) and the drop settle (`.cdk-drag-animating`).
- PREFER styling through the CDK classes (`.cdk-drag-*`, `.cdk-drop-list-*`); the directives only apply the styles they need to function.
- PREFER `CDK_DRAG_CONFIG` to set app-wide defaults instead of repeating inputs on every element.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `cdkDrag` (`CdkDrag`) | Makes the host element draggable | Free dragging by default |
| `[cdkDragData]` | Arbitrary data carried by the item | Read back as `item.data` in predicates and drop events |
| `[cdkDragDisabled]` | Turns dragging off for one item | Adds `.cdk-drag-disabled`; config key `draggingDisabled` |
| `cdkDragLockAxis="x" \| "y"` | Allows movement on one axis only | Config key `lockAxis` |
| `cdkDragBoundary="<selector>"` | Nearest matching ancestor becomes the movement boundary | Works inside a `cdkDropList` too; config key `boundaryElement` |
| `[cdkDragStartDelay]="ms"` | Pointer must be held this long before a drag begins | Config key `dragStartDelay` |
| `[cdkDragFreeDragPosition]="{x, y}"` | Sets the position of a draggable outside a list | |
| `cdkDragRootElement="<selector>"` | Nearest matching ancestor is moved instead of the host | Config key `rootElementSelector` |
| `cdkDragPreviewContainer` | Where the preview is inserted | `'global'` (default), `'parent'`, `ElementRef`/`HTMLElement`; config key `previewContainer` (global/parent only) |
| `cdkDragHandle` (`CdkDragHandle`) | Only this child starts a drag | Any number allowed per item; `cdkDragHandleDisabled` turns one off |
| `*cdkDragPreview` (`CdkDragPreview`) | Custom template shown under the cursor | `matchSize` input to copy the original's size |
| `*cdkDragPlaceholder` (`CdkDragPlaceholder`) | Custom element marking the drop slot | Default is a clone of the dragged item |
| `cdkDropList` (`CdkDropList`) | Container that accepts drops and sorts its items | |
| `[cdkDropListData]` | Data attached to the list | Exposed as `event.container.data` / `previousContainer.data` |
| `(cdkDropListDropped)` | Fires with `CdkDragDrop<T>` when a drag ends | Update the model here |
| `[cdkDropListConnectedTo]` | Lists this one can send items to | Template ref(s) or id string(s) |
| `cdkDropListGroup` (`CdkDropListGroup`) | Auto-connects every descendant `cdkDropList` | |
| `[cdkDropListEnterPredicate]` | `(item: CdkDrag<T>) => boolean` gate for entering a list | |
| `[cdkDropListSortPredicate]` | `(index: number, item: CdkDrag<T>) => boolean` gate for a new index | |
| `cdkDropListSortingDisabled` | No reordering inside this list | Config key `sortingDisabled` |
| `cdkDropListHasAnchor` | Leaves an anchor element in the source list (copy semantics) | Anchor styled via `.cdk-drag-anchor`; removed if item returns |
| `cdkDropListOrientation` | `vertical` (default), `horizontal`, `mixed` (wrapping) | Config key `listOrientation` |
| `cdkDropListLockAxis` | Axis lock for every item in the list | |
| `cdkDropListDisabled` | Disables the whole list | Adds `.cdk-drop-list-disabled` |
| `CdkDragDrop<T>` | Drop event: `container`, `previousContainer`, `previousIndex`, `currentIndex` | |
| `moveItemInArray(arr, from, to)` | Reorder within one array | |
| `transferArrayItem(src, dst, from, to)` | Move an item between arrays | |
| `copyArrayItem(src, dst, from, to)` | Copy an item into another array | |
| `CDK_DRAG_CONFIG` / `DragDropConfig` | Global defaults | Keys: `previewContainer`, `rootElementSelector`, `boundaryElement`, `lockAxis`, `dragStartDelay`, `draggingDisabled`, `listOrientation`, `sortingDisabled` |
| `CDK_DROP_LIST`, `CDK_DROP_LIST_GROUP`, `CDK_DRAG_HANDLE`, `CDK_DRAG_PREVIEW`, `CDK_DRAG_PLACEHOLDER` | Injection tokens for the matching directive instances | |
| `cdkScrollable` | Lets the CDK auto-scroll a scrollable container during a drag | Required for custom scroll containers |

### CSS classes
| Class | Applied to |
| --- | --- |
| `.cdk-drop-list` | Every `cdkDropList` container |
| `.cdk-drag` | Every `cdkDrag` element; add a `transform` transition to animate sorting |
| `.cdk-drag-disabled` | Disabled draggables |
| `.cdk-drag-handle` | Host of `cdkDragHandle` |
| `.cdk-drag-preview` | Element following the cursor (a clone unless `*cdkDragPreview` is used) |
| `.cdk-drag-placeholder` | Element in the target slot (a clone unless `*cdkDragPlaceholder` is used) |
| `.cdk-drag-animating` | Draggable while it settles into its final slot, only after the drag stops |
| `.cdk-drop-list-dragging` | List that currently has an item being dragged |
| `.cdk-drop-list-disabled` | Disabled lists |
| `.cdk-drop-list-receiving` | Connected list able to accept the item currently dragged elsewhere |
| `.cdk-drag-anchor` | Anchor left behind when `cdkDropListHasAnchor` is on |

## Patterns

### Setup and free dragging
```shell
ng add @angular/cdk
```
```ts
import {Component} from '@angular/core';
import {CdkDrag} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-free-box',
  imports: [CdkDrag],
  template: `<div class="box" cdkDrag>Drag me</div>`,
})
export class FreeBox {}
```

### Reorderable list
```ts
import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tasks',
  imports: [CdkDropList, CdkDrag],
  template: `
    <div cdkDropList (cdkDropListDropped)="reorder($event)">
      @for (task of tasks; track task) {
        <div cdkDrag>{{ task }}</div>
      }
    </div>`,
})
export class Tasks {
  tasks = ['Write', 'Review', 'Ship'];
  reorder(e: CdkDragDrop<string[]>) {
    moveItemInArray(this.tasks, e.previousIndex, e.currentIndex);
  }
}
```
Use `cdkDropListOrientation="horizontal"` for a row, or `"mixed"` for a wrapping flex list (no sort animation).

### Connected lists (move between)
```html
<!-- by template reference -->
<div cdkDropList #backlog="cdkDropList" [cdkDropListData]="todo"
     [cdkDropListConnectedTo]="[finished]" (cdkDropListDropped)="drop($event)">
  @for (t of todo; track t) { <div cdkDrag>{{ t }}</div> }
</div>
<div cdkDropList #finished="cdkDropList" [cdkDropListData]="done"
     [cdkDropListConnectedTo]="[backlog]" (cdkDropListDropped)="drop($event)">
  @for (t of done; track t) { <div cdkDrag>{{ t }}</div> }
</div>

<!-- or by id -->
<div cdkDropList id="a" [cdkDropListConnectedTo]="['b']"></div>
<div cdkDropList id="b" [cdkDropListConnectedTo]="['a']"></div>

<!-- or automatically, for any number of lists -->
<div cdkDropListGroup>
  @for (col of columns; track col) {
    <div cdkDropList [cdkDropListData]="col" (cdkDropListDropped)="drop($event)">…</div>
  }
</div>
```
```ts
drop(e: CdkDragDrop<string[]>) {
  if (e.previousContainer === e.container) {
    moveItemInArray(e.container.data, e.previousIndex, e.currentIndex);
  } else {
    transferArrayItem(e.previousContainer.data, e.container.data, e.previousIndex, e.currentIndex);
  }
}
```

### Enter and sort predicates
```html
<div id="pool" cdkDropList [cdkDropListData]="pool" cdkDropListConnectedTo="evens"
     [cdkDropListEnterPredicate]="rejectAll" (cdkDropListDropped)="drop($event)">
  @for (n of pool; track n) { <div cdkDrag [cdkDragData]="n">{{ n }}</div> }
</div>
<div id="evens" cdkDropList [cdkDropListData]="evens" cdkDropListConnectedTo="pool"
     [cdkDropListEnterPredicate]="onlyEven" (cdkDropListDropped)="drop($event)">…</div>

<div cdkDropList [cdkDropListSortPredicate]="parityMatches" (cdkDropListDropped)="sort($event)">…</div>
```
```ts
onlyEven(item: CdkDrag<number>) { return item.data % 2 === 0; }
rejectAll() { return false; }                       // nothing may enter this list
parityMatches(index: number, item: CdkDrag<number>) {
  return (index + 1) % 2 === item.data % 2;        // odd values at odd slots, even at even
}
```

### Copy from a catalog into a cart
```html
<div cdkDropList [cdkDropListData]="catalog" [cdkDropListConnectedTo]="[cartList]"
     cdkDropListSortingDisabled cdkDropListHasAnchor>
  @for (p of catalog; track $index) { <div cdkDrag [cdkDragData]="p">{{ p }}</div> }
</div>
<div cdkDropList #cartList="cdkDropList" [cdkDropListData]="cart" (cdkDropListDropped)="drop($event)">
  @for (p of cart; track $index) { <div cdkDrag>{{ p }}</div> }
</div>
```
```ts
drop(e: CdkDragDrop<string[]>) {
  if (e.previousContainer === e.container) {
    moveItemInArray(e.container.data, e.previousIndex, e.currentIndex);
  } else {
    copyArrayItem(e.previousContainer.data, e.container.data, e.previousIndex, e.currentIndex);
  }
}
```

### Handle, preview, placeholder
```html
<div cdkDrag>
  Card body
  <span class="grip" cdkDragHandle>⠿</span>           <!-- import CdkDragHandle -->
</div>

<div cdkDropList (cdkDropListDropped)="drop($event)">
  @for (film of films; track film) {
    <div cdkDrag>
      {{ film.title }}
      <img *cdkDragPreview [src]="film.poster" [alt]="film.title" />  <!-- CdkDragPreview -->
      <div class="slot" *cdkDragPlaceholder></div>                    <!-- CdkDragPlaceholder -->
    </div>
  }
</div>
```

### Constraining a single draggable
```html
<div class="area">
  <div cdkDrag cdkDragBoundary=".area">Stays inside .area</div>
</div>
<div cdkDrag cdkDragLockAxis="y">Vertical only</div>
<div cdkDrag [cdkDragStartDelay]="1000">Hold 1s to drag</div>
<div cdkDrag [cdkDragDisabled]="item.locked">{{ item.label }}</div>
```

### Programmatic position
```ts
@Component({
  imports: [CdkDrag],
  template: `
    <button type="button" (click)="nudge()">Move</button>
    <div cdkDrag [cdkDragFreeDragPosition]="pos">Drag me</div>`,
})
export class Positioned {
  pos = {x: 0, y: 0};
  nudge() { this.pos = {x: this.pos.x + 50, y: this.pos.y + 50}; }
}
```

### Draggable overlay dialog (root element)
```html
<ng-template>
  <div class="dialog" cdkDrag cdkDragRootElement=".cdk-overlay-pane">Drag the dialog</div>
</ng-template>
```
The template is attached to an `Overlay` via a `TemplatePortal`; the drag moves the surrounding `.cdk-overlay-pane`, not the inner `div`.

### Animation CSS
```css
.cdk-drag-placeholder { opacity: 0; }
.cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
.my-list.cdk-drop-list-dragging .my-item:not(.cdk-drag-placeholder) {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}
.my-item.cdk-drag-disabled { cursor: not-allowed; }
```

### Scrollable container
```html
<div class="scroller" cdkScrollable>   <!-- overflow: auto -->
  <div cdkDropList>…</div>
</div>
```

## Pitfalls
- Dropping only rearranges the DOM; if you don't handle `cdkDropListDropped`, your array keeps the old order.
- Lists are isolated unless connected; without `cdkDropListConnectedTo` or `cdkDropListGroup`, items can't leave their list.
- A custom `*cdkDragPreview` does not take on the original element's size unless `matchSize` is set to true.
- The default preview clone has its `id` attribute stripped to avoid duplicate ids, so CSS keyed to that id won't style the preview.
- Default (`global`) preview insertion into `<body>` / the nearest shadow root loses inherited styles; `parent` or a custom element keeps them but the preview can be clipped by `overflow: hidden`, hidden by `z-index`, and can disturb `:nth-child` selectors and flex layouts.
- The `previewContainer` key in `CDK_DRAG_CONFIG` only takes `global` or `parent`; element targets need the `cdkDragPreviewContainer` input.
- `mixed` orientation sorts by moving DOM nodes, so sort animation is unavailable; the default transform-based strategy only works in one direction.
- Without a `cdkScrollable` directive on a custom scroll container, the CDK can't see or drive its scrolling and auto-scroll won't happen.
- `.cdk-drag-animating` exists only after the pointer is released; transitions on it won't run during the drag itself.
- With `cdkDropListHasAnchor`, the anchor disappears automatically if the user drags the item back into its source list.
- Pressing on a `cdkDrag` starts a drag immediately by default, which can hijack scroll gestures on large touch targets; use `cdkDragStartDelay`.

## Version notes
- None stated in the docs.
