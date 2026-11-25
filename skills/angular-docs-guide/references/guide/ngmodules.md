# NgModules (legacy)

> Sources (angular.dev, v22.3 @ bd1e32b): NgModules — https://angular.dev/guide/ngmodules/overview.

## When to use
- Reading or maintaining existing code built around `@NgModule`
- Declaring non-standalone components, directives and pipes and sharing them through `exports`
- Understanding which consumers can inject a module's `providers`
- Using third-party `forRoot` / `forChild` configuration helpers
- Understanding apps started with `bootstrapModule` instead of `bootstrapApplication`
- See also: standalone components → references/guide/components.md
- See also: dependency injection and providers → references/guide/di.md

## Rules
- PREFER standalone components over `NgModule` for all new code; this guide is for understanding existing code.
- PREFER `bootstrapApplication` over `bootstrapModule` for all new code.
- MUST mark any component, directive or pipe with `standalone: false` before it can be listed in an NgModule's `declarations`.
- NEVER declare the same component, directive or pipe in more than one NgModule; Angular reports an error.
- MUST list a declaration's dependencies (other NgModules or standalone components/directives/pipes) in `imports`.
- MUST put declarations in `exports` to make them usable by importers; `exports` may also re-export anything the module imports, including NgModules.
- MUST add `forRoot(...)` providers only at the application root during bootstrap; they load eagerly and grow the initial bundle.
- PREFER `forChild(...)` (where a library offers it) for providers added to components deeper in the hierarchy.
- MUST also declare every component listed in `bootstrap` in that module's `declarations`.

## API cheat-sheet
| API | Purpose | Notes / version tag |
|---|---|---|
| `@NgModule({...})` | Marks a class as an NgModule; metadata drives template compilation and DI | From `@angular/core` |
| `declarations` | Components/directives/pipes owned by the module | Accepts nested arrays; items need `standalone: false` |
| `imports` | Dependencies of the declarations | NgModules and standalone components/directives/pipes |
| `exports` | What importers can use | Declarations plus anything imported |
| `providers` | Injectables added by the module | See visibility below |
| `bootstrap` | Root component(s) rendered at startup | Must also be declared |
| `static forRoot(config)` | Convention: returns providers for the root only | Eagerly loaded |
| `static forChild(config)` | Convention: returns providers for components in the hierarchy | Used in component `providers` |
| `platformBrowser().bootstrapModule(M)` | Starts an app from an NgModule | Also available from `platformServer` |
| `standalone: false` | Opts a component/directive/pipe into NgModule declaration | Required to declare |

Provider visibility for `providers: [X]` on module `M`:
- Declarations of `M` can inject `X`.
- Standalone components/directives/pipes that import `M` can inject `X`.
- Declarations and providers of any other NgModule that imports `M` can inject `X`.
- With `bootstrapModule`, the root module's providers plus those of all its `imports` load eagerly and are injectable app-wide.

## Patterns

### Declare, depend, export, provide
```ts
@Component({selector: 'app-menu', standalone: false, template: '...'})
export class Menu {}

const MENU_PARTS = [Menu, MenuItem];

@NgModule({
  imports: [PopupTrigger],          // deps of the declarations
  declarations: [MENU_PARTS],       // nested arrays allowed
  exports: [MENU_PARTS, PopupTrigger], // re-export an import too
  providers: [OverlayService],
})
export class MenuModule {}
```

### forRoot / forChild
```ts
bootstrapApplication(AppRoot, {
  providers: [MenuModule.forRoot({/* config */})],
});

@Component({providers: [MenuModule.forChild({/* config */})]})
export class Profile {}
```

### Legacy bootstrap
```ts
@NgModule({declarations: [AppShell], bootstrap: [AppShell]})
export class AppShellModule {}

platformBrowser().bootstrapModule(AppShellModule);
```

## Pitfalls
- A component missing `standalone: false` cannot be declared in an NgModule.
- Declaring one class in two NgModules is an error.
- `forRoot` providers are eagerly loaded and increase the initial page's JavaScript.
- A `bootstrap` component that is not also in `declarations` is invalid.
- `bootstrapModule` finds page elements matching the bootstrapped components' selectors and renders into them.

## Version notes
- None stated in the docs. (Standalone components and `bootstrapApplication` are the recommended choice for new code.)
