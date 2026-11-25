# Angular coding style guide

> Sources (angular.dev, v22.3 @ bd1e32b): Style Guide — https://angular.dev/style-guide.

## When to use
- Naming files, tests, and component template/style files
- Laying out a project's folders (`src`, `main.ts`, feature-based directories)
- Writing components and directives consistently: injection, selectors, member order, visibility, `readonly`
- Choosing between `class`/`style` bindings and `NgClass`/`NgStyle`
- Naming event handlers and structuring lifecycle hooks
- See also: component selectors, input/output naming, queries, lifecycle → references/guide/components.md
- See also: template expressions and class/style bindings → references/guide/templates.md
- See also: `computed` signals → references/guide/signals.md

## Rules
Scope: Angular-specific conventions only (not required for Angular to work); for general TypeScript style use Google's TypeScript style guide.

General
- PREFER consistency within a file over these rules when an existing file uses a different style.

Naming
- MUST separate words in file names with hyphens: `UserProfile` → `user-profile.ts`.
- MUST name unit-test files after the code file with `.spec.ts`: `user-profile.spec.ts`.
- PREFER file names that reflect the class they contain; with several primary identifiers, name the common theme; split files with no common theme.
- AVOID generic file names such as `helpers.ts`, `utils.ts`, `common.ts`.
- PREFER the same base name for a component's TS, template and style files (`user-profile.ts/.html/.css`); extra style files append descriptive words (`user-profile-settings.css`).

Project structure
- MUST keep all UI code (TS, HTML, styles) under `src`; keep config files and scripts outside it.
- MUST bootstrap the app from `main.ts` directly inside `src`.
- PREFER keeping a component's TS, template and styles in one directory, with its unit tests alongside.
- AVOID a single shared `tests` directory for unrelated tests.
- PREFER feature-area subdirectories; AVOID type-based folders such as `components`, `directives`, `services`.
- PREFER splitting a directory into sub-directories once it holds too many files to navigate.
- PREFER one concept per file (usually one component, directive or service); small classes forming one concept may share a file; when unsure choose smaller files.

Dependency injection
- PREFER the `inject()` function over constructor-parameter injection (readability with many deps, easier comments, better type inference, and with ES2022+ `useDefineForClassFields` fields can be declared and initialized together).

Components and directives
- MUST give directives the same application-specific selector prefix as components; attribute selectors use camelCase (e.g. `[mrTooltip]` for app "MovieReel").
- PREFER grouping Angular-specific properties (injected deps, inputs, outputs, queries) near the top of the class, before methods.
- PREFER keeping components/directives focused on presentation; move UI-independent logic (validation rules, data transforms) to separate functions/classes.
- AVOID complex template logic; move it to TypeScript, usually a `computed`. Simple expressions in templates are fine.
- PREFER `protected` for members only read by the template; public members form an API reachable via DI and queries.
- PREFER `readonly` for properties Angular initializes: `input`, `model`, `output`, and queries. With decorator APIs, apply it to `@Output` and queries but NOT to `@Input` properties.
- PREFER `[class...]` / `[style...]` bindings over `NgClass` / `NgStyle` (simpler, HTML-like syntax; the directives cost extra performance).
- PREFER naming event handlers for what they do (`saveUserData()`), not the trigger (`handleClick()`); a generic `handleKeydown` that delegates is fine for long, complex key logic.
- AVOID long logic in lifecycle hooks; call well-named methods from them instead.
- PREFER implementing the lifecycle interfaces (`OnInit`, …) so hook names are checked.

## API cheat-sheet
| API | Purpose | Notes / version tag |
|---|---|---|
| `inject()` | Preferred DI style | Automated migration to `inject` exists (reference/migrations/inject-function) |
| `protected` members | Template-only members | Keeps them out of the public API |
| `readonly` on `input()` / `model()` / `output()` / queries | Prevent overwriting Angular-set values | Not for decorator `@Input` |
| `[class.x]` / `[class]="{...}"` | Class bindings | Preferred over `NgClass` |
| `[style.prop]` / `[style]="{...}"` | Style bindings | Preferred over `NgStyle` |
| `(keydown.control.enter)` | Key event modifiers | Pair with action-named handlers |
| `OnInit` etc. | Lifecycle hook interfaces | `implements OnInit` |

## Patterns

### Project layout by feature
```
src/
├─ main.ts
├─ cinema/
│ ├─ schedule/
│ │ ├─ film-calendar/
│ ├─ booking/
│ │ ├─ checkout/
```

### Component conventions
```ts
@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.html',
  styleUrl: './user-card.css',
})
export class UserCard implements OnInit {
  private readonly api = inject(UserApi);
  readonly first = input<string>();
  readonly last = input<string>();
  readonly saved = output<void>();

  protected fullName = computed(() => `${this.first()} ${this.last()}`);

  ngOnInit() {
    this.loadPreferences();
  }

  protected saveProfile() { /* ... */ }
  private loadPreferences() { /* ... */ }
}
```

### Bindings and handler names
```html
<!-- prefer -->
<div [class.admin]="isAdmin" [style.color]="textColor"></div>
<button (click)="saveProfile()">Save</button>
<textarea (keydown.control.enter)="commitNotes()"></textarea>

<!-- avoid -->
<div [ngClass]="{admin: isAdmin}" [ngStyle]="{color: textColor}"></div>
<button (click)="handleClick()">Save</button>
```

## Pitfalls
- Mixing conventions inside one file is more confusing than deviating from the guide.
- Public component members are reachable through DI and queries, so template-only state leaks into the API unless `protected`.
- `NgClass` / `NgStyle` carry extra runtime cost compared with native `class` / `style` bindings.
- Lifecycle hook names say when code runs, not what it does; inline logic there is hard to read.

## Version notes
- None stated in the docs.
