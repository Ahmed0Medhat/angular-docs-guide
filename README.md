# angular-docs-guide

An agent skill that distills the official Angular documentation (angular.dev, **v22.3**, commit `bd1e32b`) into short, docs-backed rules and references that an AI coding agent loads only when it needs them. It covers every page of the **In-depth Guides**, **Developer Tools**, **Best Practices** and **Extended Ecosystem** sections: 199 pages (about 269k words) condensed into 46 reference files plus a short `SKILL.md` with core rules and a routing table.

## Install

Claude Code:

```
/plugin marketplace add Ahmed0Medhat/angular-docs-guide
/plugin install angular-docs-guide@angular-docs-guide
```

Other agents (Codex, Cursor, Copilot, Gemini CLI, …):

```bash
npx skills add https://github.com/Ahmed0Medhat/angular-docs-guide
```

## What's inside

`SKILL.md` first checks the project's Angular version, lists ~30 core rules, then routes the agent to one reference file per task. Every reference file has the same sections: When to use · Rules · API cheat-sheet · Patterns · Pitfalls · Version notes.

| Task | Open |
|---|---|
| Binding static or dynamic ARIA attributes and element-reference ARIA properties in templates; Building custom components (buttons, links, text inputs, progress bars) that stay accessible; Managing focus after router navigation and marking the active link for screen readers | [references/best-practices/a11y.md](skills/angular-docs-guide/references/best-practices/a11y.md) |
| Deciding where errors should be handled (call site vs. global handler); Providing a custom `ErrorHandler` to report fatal errors to logging/analytics; Understanding which errors Angular catches for you and which it does not | [references/best-practices/error-handling.md](skills/angular-docs-guide/references/best-practices/error-handling.md) |
| Choosing what to optimize for slow initial load vs. slow interactions after load; Understanding when `OnPush` components are (and are not) checked during change detection; Fixing expensive template expressions or lifecycle hooks found while profiling | [references/best-practices/performance.md](skills/angular-docs-guide/references/best-practices/performance.md) |
| Naming files, tests, and component template/style files; Laying out a project's folders (`src`, `main.ts`, feature-based directories); Writing components and directives consistently: injection, selectors, member order, visibility, `readonly` | [references/best-practices/style-guide.md](skills/angular-docs-guide/references/best-practices/style-guide.md) |
| Checking which Angular version a project currently uses; Finding out what the latest stable Angular release is; Planning and running an upgrade of an app or library to a newer Angular version | [references/best-practices/update.md](skills/angular-docs-guide/references/best-practices/update.md) |
| Reading an Observable's latest value as a signal anywhere in the app, as a more flexible alternative to the `async` pipe; Feeding a signal into an RxJS pipeline (e.g. `switchMap` to an HTTP call when a query signal changes); Loading async data with a resource whose source is an Observable (`rxResource`) | [references/ecosystem/rxjs-interop.md](skills/angular-docs-guide/references/ecosystem/rxjs-interop.md) |
| Adding basic offline support / turning an app into a PWA with `ng add @angular/pwa`; Configuring what gets cached (`ngsw-config.json`: asset groups, data groups, navigation handling); Detecting, prompting for and applying app updates with `SwUpdate` | [references/ecosystem/service-workers.md](skills/angular-docs-guide/references/ecosystem/service-workers.md) |
| Moving CPU-heavy work (CAD drawing generation, heavy geometry math) off the main thread so the UI stays responsive; Scaffolding a worker file and its caller with the Angular CLI; Making worker-based code still work where workers are unavailable (e.g. server-side rendering) | [references/ecosystem/web-workers.md](skills/angular-docs-guide/references/ecosystem/web-workers.md) |
| Maintaining existing code built on the deprecated `@angular/animations` DSL (`trigger`, `state`, `transition`, `animate`).; Animating an element between named states (e.g. `open` / `closed`) driven by a component property.; Animating elements inserted into or removed from the DOM with `:enter` / `:leave` (or `void`). | [references/guide/animations-legacy.md](skills/angular-docs-guide/references/guide/animations-legacy.md) |
| Animating an element as it is inserted into or removed from the DOM (`@if`, `@for`, dynamic content) with `animate.enter` / `animate.leave`.; Driving enter/leave motion from JavaScript or a third-party library (GSAP, anime.js, …) through the `(animate.enter)` / `(animate.leave)` event syntax.; Building open/closed state transitions, auto-height expanders, increment/decrement pulses, staggered or parallel sequences, and reordering lists in plain CSS. | [references/guide/animations.md](skills/angular-docs-guide/references/guide/animations.md) |
| Building a design system or shared enterprise component library whose widgets need WAI-ARIA keyboard, focus and screen-reader behavior but fully custom styling.; Implementing dropdowns: select, multiselect, autocomplete/typeahead, datepicker or dialog popups on top of the `ngCombobox` primitive plus `ngListbox` / `ngGrid`.; Building menus, context menus, menubars and formatting toolbars with arrow-key navigation and RTL support. | [references/guide/aria.md](skills/angular-docs-guide/references/guide/aria.md) |
| Defining a component (class + template + selector), importing it into another component, and composing a component tree.; Picking a selector (element vs. attribute on a native element) and scoping or namespacing component CSS.; Passing data in (`input`, `model` for two-way binding) and raising custom events out (`output`). | [references/guide/components.md](skills/angular-docs-guide/references/guide/components.md) |
| Deciding where a provider should live (root/environment, route, component, directive) and who can see it.; Scoping a service to one component subtree, or giving each component instance its own private copy (edit sessions, form state).; Swapping in a more specialized implementation of a service deeper in the component tree. | [references/guide/di-hierarchy.md](skills/angular-docs-guide/references/guide/di-hierarchy.md) |
| Sharing logic, state, data clients, auth, logging or utilities across components via a singleton service (`@Service`, `inject()`).; Supplying non-class values (config objects, functions, browser APIs, flags) through DI (`InjectionToken`).; Scoping a service to a component tree or route, or swapping implementations (`providers`, `useClass` / `useValue` / `useFactory` / `useExisting`). | [references/guide/di.md](skills/angular-docs-guide/references/guide/di.md) |
| Packaging a behavior (tooltip, autofocus, hover highlight) once and reusing it on many elements or components.; Reading or writing the host element's DOM, attributes or classes from a reusable class.; Adding behavior to a third-party component without editing its source. | [references/guide/directives.md](skills/angular-docs-guide/references/guide/directives.md) |
| Making a box, card or panel freely draggable around the page with `cdkDrag`.; Building a reorderable list (vertical, horizontal or wrapping) and syncing the new order back to your array.; Moving or copying items between several lists (kanban columns, product list → shopping cart). | [references/guide/drag-drop.md](skills/angular-docs-guide/references/guide/drag-drop.md) |
| Packaging an Angular component as a framework-agnostic custom element (Web Component) usable as a plain HTML tag.; Adding a component to the page at runtime without hand-wiring change detection, inputs, outputs and cleanup.; Exposing component inputs as element attributes/properties and outputs as DOM `CustomEvent`s. | [references/guide/elements.md](skills/angular-docs-guide/references/guide/elements.md) |
| Building a model-driven form whose state lives in the component class (`FormControl`, `FormGroup`, `FormArray`, `FormRecord`).; Updating form values programmatically, e.g. filling a form from backend data (`setValue`, `patchValue`).; Adding or removing controls at runtime, such as a growable list of aliases (`FormArray`) or keys unknown up front (`FormRecord`). | [references/guide/forms-reactive.md](skills/angular-docs-guide/references/guide/forms-reactive.md) |
| Attaching per-field reactive data (help text, currency symbol, severity, parsed value) that built-in state like `valid()`/`disabled()` does not cover (`createMetadataKey`, `metadata`).; Combining contributions from several schema rules into one value per field (`MetadataReducer`).; Giving each field its own lifecycle-bound object such as an `httpResource()` or `effect()` (`createManagedMetadataKey`). | [references/guide/forms-signals-advanced.md](skills/angular-docs-guide/references/guide/forms-signals-advanced.md) |
| Attaching built-in or custom validation rules to Signal Forms fields (required, email, ranges, dates, lengths, regex); Validating one field against another (password confirmation, date ranges, conditional requirements) or a whole group with `validateTree()`; Disabling, hiding, making readonly, debouncing, or attaching metadata to fields reactively | [references/guide/forms-signals-validation.md](skills/angular-docs-guide/references/guide/forms-signals-validation.md) |
| Choosing between Signal Forms, Reactive Forms and Template-driven Forms for a new or existing app.; Building a signal-based form: a writable model signal, `form()`, and `[formField]` bindings.; Designing a form model (empty values, static shape, arrays) and translating it to/from a domain model. | [references/guide/forms-signals.md](skills/angular-docs-guide/references/guide/forms-signals.md) |
| Building a small or simple form whose bindings and validation live in the template (`FormsModule`, `[(ngModel)]`).; Showing validation messages only after the user has edited or left a field (`dirty` / `touched` / `pristine`).; Styling controls by state with the `ng-*` CSS classes (valid, touched, dirty, pending, submitted). | [references/guide/forms-template-and-validation.md](skills/angular-docs-guide/references/guide/forms-template-and-validation.md) |
| Calling a backend API (GET/POST/PUT/...) with typed results, URL params, headers and timeouts (`HttpClient`).; Loading data reactively from signals, with loading/error/value exposed as signals (`httpResource`).; Configuring the client: interceptors, XHR backend, XSRF, child-injector chaining (`provideHttpClient` + `with*` features). | [references/guide/http.md](skills/angular-docs-guide/references/guide/http.md) |
| Adding `@angular/localize` and marking template text, attributes and TypeScript strings for translation (`i18n`, `i18n-*`, `$localize`).; Handling plurals, gender/select alternates and nested ICU expressions so each locale can phrase them correctly.; Extracting a source message file (XLIFF, XMB, JSON, ARB) and producing per-locale translation files. | [references/guide/i18n.md](skills/angular-docs-guide/references/guide/i18n.md) |
| Speeding up the Largest Contentful Paint (LCP) image with `priority` (fetchpriority, eager loading, preload under SSR).; Preventing layout shift and distortion by giving images `width`/`height`, or `fill` when the size is unknown.; Replacing a CSS `background-image` with an `<img ngSrc ... fill>` inside a positioned container. | [references/guide/image-optimization.md](skills/angular-docs-guide/references/guide/image-optimization.md) |
| Reading or maintaining existing code built around `@NgModule`; Declaring non-standalone components, directives and pipes and sharing them through `exports`; Understanding which consumers can inject a module's `providers` | [references/guide/ngmodules.md](skills/angular-docs-guide/references/guide/ngmodules.md) |
| Testing routed components, guards, outlets, nested routes and query params with `RouterTestingHarness`.; Binding path/query/matrix params, route data and route resources straight into component `input()`s.; Adding a 404 page, building link parameter arrays, or switching to hash-style URLs / configuring `<base href>`. | [references/guide/routing-advanced.md](skills/angular-docs-guide/references/guide/routing-advanced.md) |
| Allowing or blocking entry to a route, a whole subtree of child routes, or leaving a route with unsaved edits (`canActivate`, `canActivateChild`, `canDeactivate`).; Choosing between several route definitions for one path based on a feature flag or role (`canMatch`).; Loading data before a route renders (`resolve` + `ResolveFn`) or reactively and in parallel with signal-based route resources (`resources`, `nonBlocking()`). | [references/guide/routing-data.md](skills/angular-docs-guide/references/guide/routing-data.md) |
| Mapping URL paths (static, parameterized, wildcard) to components and registering them with `provideRouter`.; Splitting route code into lazy chunks with `loadComponent` / `loadChildren`.; Rendering routed content with `<router-outlet>`, including nested child routes and named (secondary) outlets. | [references/guide/routing.md](skills/angular-docs-guide/references/guide/routing.md) |
| Rendering user- or attacker-influenced data safely (interpolation, `[innerHTML]`, `[href]`, `[src]`, style bindings).; Deliberately trusting a value Angular would otherwise sanitize (`DomSanitizer.bypassSecurityTrust*`) or sanitizing manually before raw DOM access.; Setting up a Content Security Policy with nonces (`ngCspNonce`, `CSP_NONCE`) or hash-based `security.autoCsp` for static hosting. | [references/guide/security.md](skills/angular-docs-guide/references/guide/security.md) |
| Holding reactive local or service state and deriving read-only values from it (`signal`, `computed`).; Keeping writable state that must reset or re-derive when other state changes (`linkedSignal`).; Loading async data (HTTP, WebSocket, SSE) into signal-based code with status tracking (`resource`, `httpResource`). | [references/guide/signals.md](skills/angular-docs-guide/references/guide/signals.md) |
| Adding SSR / prerendering (SSG) to a new or existing app and choosing a render mode per route (`ServerRoute`, `RenderMode`).; Prerendering parameterized routes at build time and choosing a fallback for paths not prerendered.; Writing components and services that run safely on both server and browser (`afterNextRender`, `DOCUMENT`, platform-specific providers, `REQUEST` / `RESPONSE_INIT`). | [references/guide/ssr.md](skills/angular-docs-guide/references/guide/ssr.md) |
| Adding Tailwind CSS to an existing Angular CLI project in one step with `ng add tailwindcss`.; Wiring Tailwind up by hand (packages, PostCSS config, stylesheet import) instead of using the schematic.; Importing Tailwind into a global stylesheet written in plain CSS or in SCSS. | [references/guide/tailwind.md](skills/angular-docs-guide/references/guide/tailwind.md) |
| Rendering component state as text, DOM properties, attributes, ARIA attributes, CSS classes and inline styles.; Reacting to DOM, keyboard and global (`window`/`document`/`body`) events, or adding custom event syntax via an event plugin.; Syncing a value between a parent and a child component or a form control (`[(...)]`, `model()`, `ngModel`). | [references/guide/templates.md](skills/angular-docs-guide/references/guide/templates.md) |
| Interacting with a third-party or shared widget (menu, dialog, slider) in a unit test without depending on its DOM structure or CSS classes (test author).; Reusing one interaction API across `TestBed` unit tests and WebDriver end-to-end tests.; Publishing a harness alongside a reusable component library so consumers get a supported testing API (harness author). | [references/guide/testing-harnesses.md](skills/angular-docs-guide/references/guide/testing-harnesses.md) |
| Moving an existing Karma + Jasmine project onto Vitest (the CLI default for new projects).; Rewriting Jasmine spec syntax (`fit`, `spyOn`, `jasmine.createSpy`, ...) into Vitest APIs with the `refactor-jasmine-vitest` schematic.; Running Vitest tests in a real browser (Playwright, WebdriverIO, Preview providers) instead of DOM emulation. | [references/guide/testing-runners.md](skills/angular-docs-guide/references/guide/testing-runners.md) |
| Asserting that template bindings render the expected text after change detection (`fixture.whenStable()`).; Driving inputs/outputs of a component under test: `setInput`, `inputBinding`/`outputBinding`, or a dedicated test host component.; Replacing service dependencies (root or component-level) with stubs, spies or HTTP mocks. | [references/guide/testing-scenarios.md](skills/angular-docs-guide/references/guide/testing-scenarios.md) |
| Running and configuring unit tests in an Angular CLI project (`ng test`, Vitest, `angular.json` `test` options, global providers, CI, real-browser mode).; Writing component tests with `TestBed`, `ComponentFixture`, `DebugElement` and `By` predicates.; Testing services, replacing their dependencies with stubs and asserting calls with spies. | [references/guide/testing.md](skills/angular-docs-guide/references/guide/testing.md) |
| Confirming an app runs zoneless (the default since v21) or turning it on in a v20 app.; Stripping `zone.js` out of `angular.json` polyfills, `polyfills.ts` and `package.json`.; Auditing components and libraries so every state change notifies Angular (signals, `markForCheck`, `AsyncPipe`, listeners). | [references/guide/zoneless.md](skills/angular-docs-guide/references/guide/zoneless.md) |
| Moving an existing app off the deprecated webpack `browser` builder to `application` (or `browser-esbuild`).; Using build-system features: `define` value replacement, `loader` per extension or per import, import/export conditions, dev-server HMR and prebundling.; Writing, registering, running and testing a custom Architect builder (`createBuilder`, `builders.json`, `ng run`). | [references/tools/cli-builders.md](skills/angular-docs-guide/references/tools/cli-builders.md) |
| Fixing template type errors that appear under strict template checking; Silencing false positives from third-party library typings without turning off all checks; Tuning individual template strictness flags in `angularCompilerOptions` | [references/tools/cli-compiler.md](skills/angular-docs-guide/references/tools/cli-compiler.md) |
| Running a schematic from a collection other than the default one (`ng generate <collection>:<schematic>`), or changing generation defaults.; Writing a custom schematic (rule factory, `Tree` edits, templates) to enforce your team's conventions or scaffold common UI patterns.; Adding interactive `x-prompt` questions to a schematic's option schema. | [references/tools/cli-schematics.md](skills/angular-docs-guide/references/tools/cli-schematics.md) |
| Installing the `ng` CLI and scaffolding a workspace with `ng new`, then running it locally.; Passing boolean, array and key/value flags to `ng` commands correctly.; Building for production, setting size budgets, allowing CommonJS deps, tuning browser targets. | [references/tools/cli.md](skills/angular-docs-guide/references/tools/cli.md) |
| Inspecting the component/directive tree of a running app and editing component state live.; Finding which components make a change detection cycle slow, or checking whether `OnPush` components were skipped.; Visualizing environment and element injector hierarchies and the path DI walks to resolve a token. | [references/tools/devtools.md](skills/angular-docs-guide/references/tools/devtools.md) |
| Getting completions, diagnostics, hover info and go-to-definition inside Angular templates (inline or external HTML); Turning on the newest editor features through `strictTemplates`; Installing the Language Service in VS Code (and VS Code-based editors), Visual Studio, WebStorm, Sublime Text, Eclipse, Neovim or Zed | [references/tools/language-service.md](skills/angular-docs-guide/references/tools/language-service.md) |
| Extracting reusable components/services from an app into a library project (`ng generate library`).; Defining a library's public API, primary and secondary entry points (`"exports"`, `ng generate entry-point`).; Building and publishing a library to npm (partial-Ivy, `production` config), shipping Sass/CSS assets. | [references/tools/libraries.md](skills/angular-docs-guide/references/tools/libraries.md) |

## How it was built

1. **Inventory** — `scripts/inventory.mjs` sparse-checks-out `angular/angular` at the pinned commit, parses the angular.dev navigation, and writes `sources.json` (every page, its URL, word count, embedded example files and the reference file it maps to).
2. **Distill** — each reference file was written from its full source pages and examples with one fixed prompt (`docs/distill-prompt.md`): docs-backed facts only, rewritten in new words, stability labels kept.
3. **Gate** — `scripts/lint-references.mjs` (structure, length, sources block, no copied 12-word runs) and `scripts/check-coverage.mjs` (every page mapped and cited).
4. **Review** — each file was checked against its sources for invented APIs, missing sections and label mismatches.

Design: [docs/specs/2026-11-24-angular-docs-guide-design.md](docs/specs/2026-11-24-angular-docs-guide-design.md).

## Updating to a newer Angular

```bash
npm run sync-check -- --ref main
```

This lists changed, added and removed pages and the reference file each belongs to. Re-distill only those files, then refresh the inventory and run the gates:

```bash
node scripts/inventory.mjs --ref <commit-sha>
npm run check
node scripts/build-skill-index.mjs
```

## Development

```bash
npm test        # unit tests for the scripts
npm run check   # coverage + lint of all reference files and SKILL.md
```

Requires Node.js 20+.

## License

- Code (scripts, tests, manifests): [MIT](LICENSE).
- Distilled documentation under `skills/angular-docs-guide/`: [CC BY 4.0](LICENSE-docs), derived from angular.dev © Google LLC.
- Angular is a trademark of Google LLC. This project is not affiliated with or endorsed by Google.

## بالعربي

الـ skill دي ملخّص لكل صفحات الـ developer guide بتاعة angular.dev (إصدار 22.3)، متحوّلة لقواعد ومراجع قصيرة بيقراها الـ AI agent بس وقت ما يحتاجها وهو بيكتب أو بيراجع كود Angular.

- التثبيت في Claude Code: `/plugin marketplace add Ahmed0Medhat/angular-docs-guide` وبعدها `/plugin install angular-docs-guide@angular-docs-guide`.
- لأي agent تاني: `npx skills add https://github.com/Ahmed0Medhat/angular-docs-guide`.
- الـ skill بتشوف إصدار Angular في المشروع الأول، وبتطبّق القواعد حسبه.
- للتحديث لإصدار أحدث: شغّل `npm run sync-check -- --ref main` عشان تعرف الصفحات اللي اتغيرت، وعدّل ملفات الـ reference بتاعتها بس، وبعدين `npm run check`.
