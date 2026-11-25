# Angular Aria (headless accessible directives)

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/aria/overview,
> Accordion — https://angular.dev/guide/aria/accordion,
> Autocomplete — https://angular.dev/guide/aria/autocomplete,
> Combobox — https://angular.dev/guide/aria/combobox,
> Grid — https://angular.dev/guide/aria/grid,
> Listbox — https://angular.dev/guide/aria/listbox,
> Menu — https://angular.dev/guide/aria/menu,
> Menubar — https://angular.dev/guide/aria/menubar,
> Multiselect — https://angular.dev/guide/aria/multiselect,
> Select — https://angular.dev/guide/aria/select,
> Tabs — https://angular.dev/guide/aria/tabs,
> Toolbar — https://angular.dev/guide/aria/toolbar,
> Tree — https://angular.dev/guide/aria/tree.

## When to use
- Building a design system or shared enterprise component library whose widgets need WAI-ARIA keyboard, focus and screen-reader behavior but fully custom styling.
- Implementing dropdowns: select, multiselect, autocomplete/typeahead, datepicker or dialog popups on top of the `ngCombobox` primitive plus `ngListbox` / `ngGrid`.
- Building menus, context menus, menubars and formatting toolbars with arrow-key navigation and RTL support.
- Organizing content with accordions, tabs, trees (file explorers, nav sidebars) and two-dimensional grids (data tables, calendars, pill lists).
- Testing these widgets with the component harnesses under `@angular/aria/*/testing`.
- See also: wrapping an Aria widget as a custom Signal Forms control → references/guide/forms-signals.md

## Rules
General
- MUST install the package first: `npm install @angular/aria` (or `yarn add` / `pnpm add` / `bun add`).
- MUST supply your own markup, CSS and business logic; the directives only handle keyboard interaction, ARIA attributes, focus management and screen-reader support.
- PREFER Angular Material when you want components that look finished without custom styling, and pre-styled libraries for fast prototyping.
- PREFER native `<button>` / `<input type="radio">` for simple forms; they are already accessible.
- PREFER styling state via the attributes the directives write, as the examples do: `aria-expanded`, `aria-selected`, `aria-disabled`, `aria-current`, `data-active`, `data-visible`, `inert`.
- MUST wrap a widget in an element with `dir="rtl"` (examples import `Dir` from `@angular/cdk/bidi`) for right-to-left; arrow-key direction then flips automatically.
- PREFER `softDisabled` (default `true` on accordion group, toolbar) when disabled items should stay focusable; set `[softDisabled]="false"` to make arrow keys skip them.

Accordion
- MUST pair each `ngAccordionTrigger` with an `ngAccordionPanel` via `[panel]="panelRef"` inside an `ngAccordionGroup`.
- MUST set `[multiExpandable]="false"` explicitly for one-open-at-a-time behavior; the input defaults to `true`.
- PREFER `<ng-template ngAccordionContent>` for heavy panel content so it is created only on expand.
- AVOID accordions for navigation menus (use Menu), tabbed UIs (use Tabs), a lone collapsible section (use a disclosure) or content users must compare side by side.

Combobox / Autocomplete / Select / Multiselect
- MUST place the popup content inside `<ng-template ngComboboxPopup [combobox]="comboRef">` and mark the interactive popup root (listbox, grid, dialog) with `ngComboboxWidget`.
- MUST implement filtering yourself: keep the query in a signal and derive the visible options with `computed()`.
- PREFER Autocomplete when the list is long (more than ~20 items) or users know what to type; AVOID it under ~10 options, for browsing/discovery, or with unfamiliar values.
- PREFER Select for fixed lists under ~20 familiar items; AVOID it for 2–3 options (radio buttons), searchable lists (Autocomplete) or multiple choices (Multiselect).
- MUST block typing in select-style triggers by putting `ngCombobox` on a non-input host (`div`/`button`) or adding the native `readonly` attribute to the input.
- MUST add `multi` to `ngListbox` for Multiselect; AVOID multiselect when almost every option ends up selected (use a checklist) or choices are independent booleans (use checkboxes).
- PREFER CDK Overlay (`cdkConnectedOverlay`) for popup positioning; it handles viewport edges and scrolling.
- PREFER a dialog popup (combobox + dialog layout + a focus trap such as `cdkTrapFocus`) only when the overlay needs modal or backdrop behavior.
- PREFER the documented Autocomplete/Select/Multiselect patterns; use `ngCombobox` directly only for custom filtering, custom selection widgets, or tree/grid/dialog popups.

Listbox
- PREFER the Select/Multiselect/Autocomplete patterns for dropdowns; use a bare `ngListbox` for lists shown inline on the page or unusual integrations.
- NEVER use a listbox for navigation menus or command lists; use Menu.
- PREFER `selectionMode="follow"` for single-select dropdowns and `"explicit"` when accidental selection while arrowing must be avoided.

Grid
- MUST mark the container with `ngGrid`, each row with `ngGridRow` and each cell with `ngGridCell`; focusable controls inside cells get `ngGridCellWidget`.
- PREFER `focusMode="roving"` for simple grids and `"activedescendant"` for virtual scrolling.
- AVOID grids for read-only tables (use semantic `<table>`), single-column lists (Listbox), hierarchies (Tree) or ordinary forms.
- PREFER a layout grid to collapse many buttons/checkboxes into a single tab stop.

Menu / Menubar
- MUST wrap menu items in `<ng-template ngMenuContent>` inside `ngMenu`; attach submenus with `[submenu]` on an `ngMenuItem`.
- MUST open dropdown menus from an `ngMenuTrigger` with `[menu]="menuRef"`.
- AVOID menus for site navigation (use navigation landmarks), form selects (Select), panel switching (Tabs) or collapsible content (Accordion).
- PREFER a menubar for persistent desktop-style command bars (File/Edit/View); AVOID it for single dropdowns, context menus, simple action lists, narrow mobile layouts or sidebar/header navigation.

Tabs
- MUST connect `ngTab` and `ngTabPanel` by giving both the same `value`, inside `ngTabs` / `ngTabList`.
- PREFER `selectionMode="explicit"` for heavy panels so arrowing does not render each one; `"follow"` suits lightweight content.
- AVOID tabs for wizards (stepper), page-to-page navigation (router), a single section, or more than about 7–8 tabs.

Toolbar
- MUST put `ngToolbarWidget` on each control; PREFER an `aria-label` on `ngToolbar` (every example has one).
- MUST manage selection state yourself: bind `aria-pressed` (toggles) or `role="radio"` + `aria-checked` (inside `ngToolbarWidgetGroup role="radiogroup"`) from your signals.
- AVOID toolbars for 2–3 unrelated buttons, unrelated controls, or deep hierarchies (use menus).

Tree
- MUST register every item with its parent: `[parent]` is the `ngTree` ref at the root and the `ngTreeItemGroup` ref for nested levels.
- PREFER `[nav]="true"` when activating items navigates; the tree then marks the current item with `aria-current` instead of selection.
- AVOID trees for flat lists (Listbox), tables (Grid), simple dropdowns (Select) or breadcrumbs.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `AccordionGroup` — `ngAccordionGroup` | Container of trigger/panel pairs | `[multiExpandable]` (default `true`), `[softDisabled]` (default `true`); whole group can be disabled |
| `AccordionTrigger` — `ngAccordionTrigger` | Toggle button for a panel | `[panel]`, `[expanded]`, `disabled`; exportAs `ngAccordionTrigger` exposes `expanded()` |
| `AccordionPanel` — `ngAccordionPanel` | Content region | exportAs `ngAccordionPanel`; optional `panelId` |
| `AccordionContent` — `ng-template ngAccordionContent` | Lazily rendered panel body | removed on collapse unless `[preserveContent]="true"` |
| `Combobox` — `ngCombobox` | Coordinates a trigger (input, button, div) with a popup | `[(value)]`, `[(expanded)]`, `[preserveContent]`, `disabled`, `[inlineSuggestion]`, `[alwaysExpanded]`; exportAs `ngCombobox` (`element`, `expanded()`) |
| `ComboboxPopup` — `ng-template ngComboboxPopup` | Declares the popup | `[combobox]` ref; `popupType="dialog"` for a grid/dialog popup |
| `ComboboxWidget` — `ngComboboxWidget` | Marks the popup's interactive root | `[activeDescendant]` (bind `listbox.activeDescendant()`) |
| `Listbox` — `ngListbox` | Option list (`role="listbox"`) | `[(value)]` (array), `multi`, `orientation` (`horizontal`/vertical), `selectionMode` (`follow`/`explicit`), `focusMode="activedescendant"`; `activeDescendant()`, `scrollActiveItemIntoView()` |
| `Option` — `ngOption` | One option | `[value]`, `[label]`, `[disabled]` |
| `Grid` — `ngGrid` | 2-D keyboard navigation | `[enableSelection]`, `selectionMode` (`follow`/`explicit`), `[multi]`, `focusMode` (`roving`/`activedescendant`), `colWrap` / `rowWrap` (`continuous`/`loop`/`nowrap`), `[softDisabled]` |
| `GridRow` — `ngGridRow` | Row | — |
| `GridCell` — `ngGridCell` | Cell | `[(selected)]`, `disabled`, `[rowSpan]`, `[colSpan]` |
| `GridCellWidget` — `ngGridCellWidget` | Focusable control in a cell | `widgetType="editable"`, `(activated)` / `(deactivated)`, `isActivated()`, `activate()`, `element` |
| `Menu` — `ngMenu` | Menu surface | exportAs `ngMenu` (`visible()`); `(itemSelected)` emits the item value; `softDisabled` |
| `MenuBar` — `ngMenuBar` | Persistent horizontal menubar | top-level items are `ngMenuItem` with `[submenu]`; `softDisabled` |
| `MenuItem` — `ngMenuItem` | Item | `value`, `[submenu]`, `[disabled]`; exportAs `ngMenuItem` (`expanded()`) |
| `MenuTrigger` — `ngMenuTrigger` | Opens a menu | `[menu]`; exportAs `ngMenuTrigger` (`expanded()`, `open()`, `close()`) |
| `MenuContent` — `ng-template ngMenuContent` | Lazily rendered menu items | — |
| `Tabs` / `TabList` — `ngTabs` / `ngTabList` | Tab container / tab strip | `selectionMode` (`follow`/`explicit`), `selectedTab` / `[(selectedTab)]`, `orientation="vertical"`, `[softDisabled]` |
| `Tab` / `TabPanel` — `ngTab` / `ngTabPanel` | Tab and its panel | matched by `value`; `disabled` on tab; `[preserveContent]` on panel |
| `TabContent` — `ng-template ngTabContent` | Lazily rendered panel body | removed when hidden unless `[preserveContent]="true"` |
| `Toolbar` — `ngToolbar` | Roving-tabindex control group | `orientation="vertical"`, `[softDisabled]` (default `true`) |
| `ToolbarWidget` — `ngToolbarWidget` | One control | `value`, `disabled`; native activation kept |
| `ToolbarWidgetGroup` — `ngToolbarWidgetGroup` | Sub-group (e.g. `role="radiogroup"`) | `disabled` disables the whole group |
| `Tree` — `ngTree` | Hierarchical list | `[(value)]`, `[multi]` (default `false`), `selectionMode` (`explicit`/`follow`), `[nav]`, `[softDisabled]`; exportAs `ngTree` |
| `TreeItem` — `ngTreeItem` | Node | `[parent]`, `[value]`, `[label]`, `[disabled]`, `[(expanded)]`, `[selectable]`; exportAs `ngTreeItem` |
| `TreeItemGroup` — `ng-template ngTreeItemGroup` | Children container | `[ownedBy]="treeItemRef"`; place in `<ul role="group">`; exportAs `ngTreeItemGroup` |
| `AccordionGroupHarness` | `@angular/aria/accordion/testing` | `getAccordions()`, `isExpanded()`, `expand()` |
| `ComboboxHarness` | `@angular/aria/combobox/testing` | `open()`, `close()`, `isOpen()`, `setValue()`, `getValue()`, `getPopupWidget(ListboxHarness)` |
| `ListboxHarness` | `@angular/aria/listbox/testing` | `isMulti()`, `getOptions({text})`; option `click()`, `isSelected()`, `getText()` |
| `GridHarness` | `@angular/aria/grid/testing` | `getCellTextByIndex()`, `getCells({text})`; cell `isSelected()`, `isActive()`, `focus()`, `isFocused()` |
| `MenuHarness` / `MenuItemHarness` | `@angular/aria/menu/testing` | `with({triggerText})` / `with({selector: '[ngMenuBar]'})`, `open()`, `isOpen()`, `isMenuBar()`, `getItems()`; item `hasSubmenu()`, `getSubmenu()` |
| `TabsHarness` | `@angular/aria/tabs/testing` | `getTabs()`; tab `isSelected()`, `select()`, `getHarness()` scoped to its panel |
| `ToolbarHarness` | `@angular/aria/toolbar/testing` | `getWidgets()`; widget `click()`, `isSelected()` |
| `TreeHarness` | `@angular/aria/tree/testing` | `getTreeStructure()`, `getItems()`; item `isExpanded()`, `click()` |

Keyboard summary: listbox/select/autocomplete — arrows move, Enter (or Space in listbox) selects, Escape closes, typing jumps (type-ahead). Accordion/tabs/toolbar — arrows, Home, End. Grid — arrows, Home, End, Page Up/Down; Space/click selects in `explicit` mode. Tree — Right/Left or Enter expand/collapse, Space selects, Shift+Arrow extends multi-selection. Menubar — Left/Right between top items, Enter or Down opens, hover opens after the first click/keyboard interaction.

## Patterns
Toolbar with a toggle group and a radio group (selection is your state)
```angular-html
<div ngToolbar aria-label="Formatting">
  <button ngToolbarWidget type="button" value="bold"
          [attr.aria-pressed]="bold()" (click)="bold.set(!bold())">Bold</button>
  <div class="separator" role="separator"></div>
  <div ngToolbarWidgetGroup role="radiogroup" aria-label="Alignment">
    @for (a of aligns; track a) {
      <button ngToolbarWidget role="radio" type="button" [value]="a"
              [attr.aria-checked]="align() === a" (click)="align.set(a)">{{ a }}</button>
    }
  </div>
</div>
```

Accordion (single-open, lazy body, disabled item)
```angular-html
<div ngAccordionGroup [multiExpandable]="false">
  <h3>
    <span ngAccordionTrigger [panel]="p1" #t1="ngAccordionTrigger" [expanded]="true">
      Shipping <span aria-hidden="true" [class.open]="t1.expanded()"></span>
    </span>
  </h3>
  <div ngAccordionPanel #p1="ngAccordionPanel">
    <ng-template ngAccordionContent><app-shipping-info /></ng-template>
  </div>
  <h3><span ngAccordionTrigger [panel]="p2" disabled>Returns</span></h3>
  <div ngAccordionPanel #p2="ngAccordionPanel">
    <ng-template ngAccordionContent>…</ng-template>
  </div>
</div>
```

Select: non-editable combobox + listbox + CDK overlay
```ts
import {Combobox, ComboboxPopup, ComboboxWidget} from '@angular/aria/combobox';
import {Listbox, Option} from '@angular/aria/listbox';
import {OverlayModule} from '@angular/cdk/overlay';

@Component({
  selector: 'app-label-select',
  templateUrl: 'label-select.html',
  imports: [Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option, OverlayModule],
})
export class LabelSelect {
  readonly listbox = viewChild(Listbox);
  readonly picked = signal<string[]>([]);
  readonly open = signal(false);
  readonly display = computed(() => this.picked()[0] ?? 'Choose a label');
  readonly labels = ['Work', 'Personal', 'Travel'];
  constructor() {
    afterRenderEffect(() => this.listbox()?.scrollActiveItemIntoView());
  }
}
```
```angular-html
<div ngCombobox #cb="ngCombobox" [(expanded)]="open" [preserveContent]="true">
  {{ display() }}
</div>
<ng-template [cdkConnectedOverlay]="{origin: cb.element, usePopover: 'inline', matchWidth: true}"
             [cdkConnectedOverlayOpen]="open()">
  <ng-template ngComboboxPopup [combobox]="cb">
    <div ngListbox ngComboboxWidget #lb="ngListbox" [tabindex]="-1"
         focusMode="activedescendant" selectionMode="explicit"
         [activeDescendant]="lb.activeDescendant()" [(value)]="picked"
         (click)="open.set(false)" (keydown.enter)="open.set(false)">
      @for (l of labels; track l) { <div ngOption [value]="l" [label]="l">{{ l }}</div> }
    </div>
  </ng-template>
</ng-template>
```
- Disabled select: add `disabled` to the `ngCombobox` host.
- Multiselect: add `[multi]="true"` to `ngListbox`, drop the close-on-click handlers (popup stays open while Space toggles), and render a summary such as `first + N more`.
- Capping selections: give each option `[disabled]="isOff(value)"` where `isOff` returns true for unselected values once the limit is reached.

Autocomplete (editable input, user-space filtering)
```angular-html
<div #origin>
  <input ngCombobox #cb="ngCombobox" [(value)]="query" [(expanded)]="open"
         (click)="open.set(true)" placeholder="Country" />
  <button type="button" aria-label="Clear" (mousedown)="$event.preventDefault()" (click)="clear()">×</button>
</div>
<div aria-live="polite" class="cdk-visually-hidden">
  {{ matches().length === 0 ? 'No results for ' + query() : '' }}
</div>
<ng-template [cdkConnectedOverlay]="{origin, usePopover: 'inline', matchWidth: true}"
             [cdkConnectedOverlayOpen]="open()">
  <ng-template ngComboboxPopup [combobox]="cb">
    <div ngListbox ngComboboxWidget #lb="ngListbox" [tabindex]="-1"
         focusMode="activedescendant" [activeDescendant]="lb.activeDescendant()"
         [(value)]="picked" (click)="commit()" (keydown.enter)="commit()">
      @for (c of matches(); track c) { <div ngOption [value]="c" [label]="c">{{ c }}</div> }
    </div>
  </ng-template>
</ng-template>
```
```ts
query = signal('');
picked = signal<string[]>([]);
open = signal(false);
matches = computed(() => ALL.filter((c) => c.toLowerCase().startsWith(this.query().toLowerCase())));
commit() {
  this.query.set(this.picked()[0] ?? '');
  this.open.set(false);
  this.combobox()?.element.focus(); // return focus to the input
}
```
- Auto-select mode: the docs example omits `selectionMode` on the listbox; the input is updated to the first filtered match as the user types, and commit copies the selection into the query.
- Manual mode: add `selectionMode="explicit"`; the typed text stays until Enter/click.
- Highlight mode: bind `[inlineSuggestion]="query() || navigated() ? picked()[0] : undefined"` on the input and set `navigated` on ArrowUp/ArrowDown (reset it when the popup closes).
- Signal Forms: build a component implementing `FormValueControl<string>` (`value = model.required<string>()`, `touched`/`invalid`/`errors` inputs, `touch` output), bind it with `[formField]="form.country"`, and emit `touch` on commit.

Combobox with a dialog or grid popup
```angular-html
<!-- Outer non-editable trigger opening a dialog that holds a search combobox -->
<div ngCombobox #outer="ngCombobox" [(expanded)]="open">…</div>
<ng-template [cdkConnectedOverlay]="{origin: outer.element, usePopover: 'inline'}"
             [cdkConnectedOverlayOpen]="open()" [cdkConnectedOverlayDisableClose]="true">
  <ng-template ngComboboxPopup [combobox]="outer">
    <div ngComboboxWidget class="dialog">
      <input ngCombobox #inner="ngCombobox" [alwaysExpanded]="true" … />
      <ng-template ngComboboxPopup [combobox]="inner"><!-- ngListbox ngComboboxWidget --></ng-template>
    </div>
  </ng-template>
</ng-template>
```
- Datepicker: `<ng-template ngComboboxPopup [combobox]="cb" popupType="dialog">`, wrap the calendar in `<div ngComboboxWidget cdkTrapFocus [cdkTrapFocusAutoCapture]="false">`, and put an `ngGrid` table inside; return focus to the input and close on date pick or Escape.

Listbox on the page
```angular-html
<div ngListbox aria-label="Amenities" orientation="horizontal" selectionMode="explicit" multi>
  @for (a of amenities; track a) { <div ngOption [value]="a" [label]="a">{{ a }}</div> }
</div>
```

Grid: table, layout pills, editable cell
```angular-html
<table ngGrid [enableSelection]="true" selectionMode="explicit" colWrap="continuous" rowWrap="nowrap">
  <tr ngGridRow>
    <td ngGridCell [(selected)]="day.selected"><button ngGridCellWidget>{{ day.n }}</button></td>
    <td ngGridCell disabled>31</td>
  </tr>
</table>

<div ngGrid colWrap="continuous">
  @for (tag of tags(); track $index) {
    <div ngGridRow>
      <span ngGridCell>{{ tag }}</span>
      <span ngGridCell><button ngGridCellWidget aria-label="remove tag" (click)="remove($index)">×</button></span>
    </div>
  }
</div>

<td ngGridCell>
  <div ngGridCellWidget widgetType="editable" #w="ngGridCellWidget"
       (activated)="beginEdit($event, input)" (deactivated)="endEdit($event)">
    <span [class.hidden]="w.isActivated()">{{ name }}</span>
    <input #input [class.hidden]="!w.isActivated()" />
  </div>
</td>
```

Menu with trigger and submenu
```angular-html
<button ngMenuTrigger #origin #trig="ngMenuTrigger" [menu]="actions()">Actions</button>
<ng-template [cdkConnectedOverlay]="{origin, usePopover: 'inline'}"
             [cdkConnectedOverlayOpen]="trig.expanded()" cdkAttachPopoverAsChild>
  <div ngMenu #actions="ngMenu">
    <ng-template ngMenuContent>
      <div ngMenuItem value="Archive">Archive</div>
      <div ngMenuItem value="Snooze" [disabled]="true">Snooze</div>
      <div role="separator"></div>
      <div ngMenuItem value="Move" #moveEl [submenu]="moveMenu()">Move</div>
      <ng-template [cdkConnectedOverlay]="{origin: moveEl, usePopover: 'inline'}"
                   [cdkConnectedOverlayOpen]="actions.visible()" cdkAttachPopoverAsChild>
        <div ngMenu #moveMenu="ngMenu">
          <ng-template ngMenuContent><div ngMenuItem value="Inbox">Inbox</div></ng-template>
        </div>
      </ng-template>
    </ng-template>
  </div>
</ng-template>
```
```ts
actions = viewChild<Menu<string>>('actions');
moveMenu = viewChild<Menu<string>>('moveMenu');
```
- Context menu: listen to `(contextmenu)`, `preventDefault()`, store `clientX/clientY`, move a hidden `position: fixed` `ngMenuTrigger` element there and call `trigger().open()`; close with `trigger().close()` on backdrop click or Escape; react to `(itemSelected)` on `ngMenu`.
- Standalone menu: an `ngMenu` with no trigger stays visible on the page.
- Menubar: `<div ngMenuBar>` whose top-level `ngMenuItem`s carry `[submenu]`; examples render each overlay once the bar gets focus and open nested overlays with `!!item.expanded()`; add `dir="rtl"` for RTL.

Tabs
```angular-html
<div ngTabs>
  <div ngTabList selectionMode="explicit" [(selectedTab)]="tab">
    <div ngTab value="details">Details</div>
    <div ngTab value="reviews" disabled>Reviews</div>
  </div>
  <div ngTabPanel value="details"><ng-template ngTabContent><app-details /></ng-template></div>
  <div ngTabPanel value="reviews" [preserveContent]="true">
    <ng-template ngTabContent><app-video /></ng-template>
  </div>
</div>
```

Tree (recursive template)
```angular-html
<ul ngTree #tree="ngTree" [(value)]="selected" [multi]="false">
  <ng-template [ngTemplateOutlet]="level" [ngTemplateOutletContext]="{nodes, parent: tree}" />
</ul>
<ng-template #level let-nodes="nodes" let-parent="parent">
  @for (n of nodes; track n.value) {
    <li ngTreeItem #item="ngTreeItem" [parent]="parent" [value]="n.value" [label]="n.name"
        [disabled]="n.disabled" [(expanded)]="n.expanded">{{ n.name }}</li>
    @if (n.children) {
      <ul role="group">
        <ng-template ngTreeItemGroup [ownedBy]="item" #group="ngTreeItemGroup">
          <ng-template [ngTemplateOutlet]="level"
                       [ngTemplateOutletContext]="{nodes: n.children, parent: group}" />
        </ng-template>
      </ul>
    }
  }
</ng-template>
```
- Nav tree: `[nav]="true"`, use `<a ngTreeItem href=…>` and `[selectable]="!n.children"` so folders only expand.
- Follow focus: `selectionMode="follow"`; multi: `[multi]="true"` (Space toggles, Shift+Arrow selects ranges).

Harness test
```ts
const loader = TestbedHarnessEnvironment.loader(fixture);
const cb = await loader.getHarness(ComboboxHarness);
await cb.setValue('ap');
const lb = await cb.getPopupWidget(ListboxHarness);
await (await lb.getOptions())[0].click();
expect(await cb.isOpen()).toBe(false);
```

## Pitfalls
- `multiExpandable` defaults to `true`: an accordion without `[multiExpandable]="false"` lets several panels open at once.
- `softDisabled` is documented as defaulting to `true` for accordion and toolbar: disabled items stay focusable but inert. Tabs, menu, menubar, tree and grid expose the same input; set `[softDisabled]="false"` wherever arrow keys should skip disabled items.
- Lazy `ngAccordionContent` / `ngTabContent` is destroyed when collapsed/hidden; state such as video playback resets unless `[preserveContent]="true"`.
- Combobox does not filter for you; options come from your own `computed()`.
- An `<input>` host for `ngCombobox` makes the field editable; selects must use a non-input host or `readonly`.
- Popup placement is not built in; examples rely on `cdkConnectedOverlay` with `usePopover: 'inline'` and `cdkAttachPopoverAsChild` for menus.
- After committing a choice, examples close the popup and move focus back to `combobox.element`; clear buttons call `preventDefault()` on `mousedown` so the input keeps focus.
- Empty results are not announced automatically; examples add an `aria-live="polite"` visually hidden region.
- Active-option scrolling is manual: call `listbox.scrollActiveItemIntoView()` from `afterRenderEffect`.
- Toolbar widget groups do not track which radio is checked; bind `aria-checked` / `aria-pressed` yourself.
- Menubar submenus open on hover only after the first click or key press; the menubar itself is never dismissed.
- RTL reverses arrow keys (Left = next) and submenus open to the left; adjust overlay offsets (examples flip `offsetX` sign).
- In `activedescendant` focus mode focus stays on the container and `aria-activedescendant` points at the active cell/option.
- `MenuHarness` for a menubar uses selector `'[ngMenuBar]'` and always reports `isOpen()` as `true`.
- The basic listbox text mentions `selectionMode="explicit"`, but the basic listbox example sets no `selectionMode`; check the API reference for the default.

## Version notes
- None stated in the docs.
