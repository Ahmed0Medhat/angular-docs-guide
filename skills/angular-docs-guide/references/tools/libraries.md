# Angular libraries: creating, consuming, and the Angular Package Format

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/tools/libraries,
> Creating Libraries — https://angular.dev/tools/libraries/creating-libraries,
> Using Libraries — https://angular.dev/tools/libraries/using-libraries,
> Angular Package Format — https://angular.dev/tools/libraries/angular-package-format.

## When to use
- Extracting reusable components/services from an app into a library project (`ng generate library`).
- Defining a library's public API, primary and secondary entry points (`"exports"`, `ng generate entry-point`).
- Building and publishing a library to npm (partial-Ivy, `production` config), shipping Sass/CSS assets.
- Consuming a workspace library, or linking a standalone library into an external app with `npm link` / `pnpm link`.
- Installing, typing, and updating third-party libraries (`ng add`, `@types/*`, `typings.d.ts`, `ng update`), or loading legacy global scripts.
- Understanding APF package layout (FESM2022, bundled `.d.ts`, `sideEffects`, `tslib`) or running the Angular linker outside the CLI.
- See also: reactive forms → references/guide/forms-reactive.md
- See also: service worker / PWA → references/ecosystem/service-workers.md
- See also: Angular elements for non-Angular apps → references/guide/elements.md
- See also: AOT compiler → references/tools/cli-compiler.md
- See also: tree-shakable providers and lightweight injection tokens → references/guide/di.md
- See also: schematics and schematics for libraries → references/tools/cli-schematics.md

## Rules
- MUST import a library into an application to use it; a library is an Angular project that cannot run by itself.
- PREFER Angular custom elements (not a library) when the goal is adding Angular features to a non-Angular web app.
- PREFER a library only when code is reused by several apps; it costs more to manage, maintain and update than in-app code.
- AVOID library names starting with `ng-` (reserved for Angular itself); PREFER the `ngx-` prefix to signal Angular compatibility. Choose names carefully before publishing publicly.
- MUST define a public API in the library's `public-api.ts`; only what it exports is visible to consumers. Consumers should reach public functionality through one import path per entry point.
- PREFER shipping docs (typically a README) covering installation and maintenance.
- PREFER entry points for the smallest logically connected sets of code (as Angular Material does per component); a single-purpose library should usually ship one entry point.
- PREFER stateless declarations (components, pipes) when refactoring into a library; for any state, decide whether it belongs to the app or the library.
- MUST clean up internal observable subscriptions within the component lifecycle.
- PREFER inputs for context and outputs for events as a component's interaction surface.
- MUST migrate every internal dependency (classes, interfaces, services) the library code relies on, and configure dependencies on other libraries (e.g. Angular Material).
- PREFER services that declare their own providers (tree-shakable) over providers in an NgModule or component.
- PREFER exposing a `provideXYZ()` function when registering global service providers.
- PREFER the lightweight token pattern for optional services so unused ones can be tree-shaken.
- PREFER shipping schematics: an install schematic for `ng add`, generation schematics for `ng generate`, an update schematic for `ng update` migrations. The more complex the customization, the better a schematic fits versus a dynamic component.
- MUST build for distribution with the `production` configuration (the `ng build` default); it emits partial-Ivy (`"compilationMode": "partial"`).
- MUST publish APF libraries in partial compilation mode; PREFER partial-Ivy for npm.
- AVOID full-Ivy output for npm: its instructions depend on the compiler ABI, which can change between minor versions.
- MUST build the application with an Angular version equal to or newer than the version used to build every library it depends on.
- MUST list every `@angular/*` dependency as a `peerDependencies` entry, never `dependencies`.
- MUST build a workspace library before importing it in an app (no publishing needed).
- MUST point TypeScript path mappings at the built library output, NEVER at the library's source `.ts` files.
- MUST expose extra assets (Sass mixins, prebuilt CSS) in the library `package.json` `"exports"` field.
- PREFER the monorepo workflow when the library and app share a workspace; use package-manager linking only for a standalone library or an app outside the workspace.
- PREFER declaring `"sideEffects": false` in packages and following the Angular Style Guide so code has no non-local side effects.
- PREFER bundled (flattened) `.d.ts` type definitions (recommended since APF v8).
- MUST list `tslib` as a direct dependency when compiled output imports its helpers (recommended since APF v10); `@angular/build:library` adds it to the generated `package.json` automatically.
- PREFER `ng add <lib_name>` to install most published Angular libraries.
- NEVER `import` a library in TypeScript after loading it via the `scripts` array; install its `@types` package and add it to `types` in `tsconfig.app.json` instead.
- AVOID deep imports (from non-entry-point modules); they are treated as private and may change.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `ng new <ws> --no-create-application` | Empty workspace for libraries | Then `ng generate library <name>` |
| `ng generate library <name>` | Creates `projects/<name>` (with a component) | Adds `projectType: "library"`, `prefix: "lib"`, builder `@angular/build:library` to `angular.json`; adds tsconfig path |
| `ng build <lib>` | Build library (always AOT) | Default config `production` → partial-Ivy; `--configuration development` available |
| `ng build <lib> --watch` | Incremental rebuilds of changed files | Run in background during development |
| `ng test <lib>` / `ng lint <lib>` | Test / lint the library | |
| `ng generate entry-point <path> --project <lib>` | Add secondary entry point | Nested paths allowed (`testing/harness`) |
| `@angular/build:library` | Library builder: ngc + Rolldown → `fesm2022/` | Differs from app builder `@angular/build:application` |
| `public-api.ts` | Public API of an entry point | Exports become public on import |
| `package.json` `"exports"` | Declares entry points (`"."` primary, `"./sub"` secondary) and extra assets | Builder merges custom subpaths/conditions (`sass`, `style`) with generated ones |
| `angular.json` build `assets` | Copy extra files into dist | Strings or `{glob, input, output}` objects |
| `tsconfig` `angularCompilerOptions.compilationMode` | `"partial"` for libraries | Partial code is linked to full during the app build |
| `preserveSymlinks: true` | App build follows package-manager symlinks | Avoids duplicate copies of node packages |
| `sourceMap.vendor: true` | Debug linked library code | In app `development` config |
| `prebundle.exclude: ["<lib>"]` | Dev-server: watch/rebuild linked library | `@angular/build:dev-server` option |
| `@angular/compiler-cli/linker/babel` | Angular linker as a Babel plugin | For non-CLI builds; supports caching. CLI includes it automatically |
| `ng add <lib>` | Install package + run its install schematics | Adds imports, fonts, themes etc. |
| `ng update <lib>` | Update a library to latest published version | Updates `package.json`; plain `ng update` checks for updates |
| `npm install @types/<lib> --save-dev` | Typings for untyped libraries | Auto-picked from `node_modules/@types` |
| `src/typings.d.ts` | Manual/global type declarations | Included automatically as global types |
| `angular.json` `scripts` / `styles` | Load legacy libs into the global scope | Restart `ng serve` after changes |

### Distribution formats
| Format | Details |
| --- | --- |
| Partial-Ivy (recommended) | Portable; consumable by Ivy apps built with Angular v12 or later. Stable between patch versions. |
| Full-Ivy | Uses private Ivy instructions; compiler ABI stable across patches, may change between minors. Library and app must share the same minor version. Fits all-from-source builds or microfrontends. |

### APF package layout (e.g. `@angular/core`)
| File / key | Purpose |
| --- | --- |
| `README.md` | Shown on npm and GitHub |
| `package.json` | Metadata, `"exports"` for every entry point and format |
| `fesm2022/*.mjs` (+ `.map`) | Flattened ES2022 code per entry point, with source maps |
| `types/*.d.ts` | Bundled type definitions per public entry point |
| `"type": "module"` | Declares ESM, not CommonJS |
| `"exports"` conditions | `types` → `.d.ts`; `default` → flattened ES2022 code |
| `"module"`, `"typings"` | Legacy resolution keys for tools without `"exports"` support [deprecated] |
| `"sideEffects": false` | Lets bundlers tree-shake more aggressively |

## Patterns

### Workspace + library scaffolding
```shell
ng new acme-ws --no-create-application
cd acme-ws
ng generate library ngx-acme
ng generate entry-point button --project ngx-acme
```

### Entry points in the library `package.json`
```json
{
  "name": "ngx-acme",
  "version": "0.0.1",
  "exports": {
    ".": "./src/public-api.ts",
    "./button": "./button/src/public-api.ts"
  }
}
```
```ts
import {ThemeService} from 'ngx-acme';
import {AcmeButton} from 'ngx-acme/button';
```
`ng generate entry-point` creates `button/src/` (its own `public-api.ts` plus component and spec files), registers `"./button"` in `"exports"`, and adds a one-time wildcard path to the workspace `tsconfig.json`:
```json
{ "compilerOptions": { "paths": {
  "ngx-acme": ["./dist/ngx-acme"],
  "ngx-acme/*": ["./dist/ngx-acme/*"]
} } }
```
At build time the builder reads `"exports"`, compiles/bundles each entry point, and writes `types` + `default` conditions into `dist/ngx-acme/package.json`.

### Shipping assets and exposing them
```json
// angular.json → projects.ngx-acme.architect.build.options
"assets": [
  "projects/ngx-acme/CHANGELOG.md",
  "projects/ngx-acme/_index.scss",
  "projects/ngx-acme/prebuilt-themes",
  { "glob": "**/*.scss", "input": "projects/ngx-acme/src/theming", "output": "theming" }
]
```
```json
// projects/ngx-acme/package.json
"exports": {
  ".": { "sass": "./_index.scss", "default": "./src/public-api.ts" },
  "./theming": { "sass": "./theming/_theming.scss" },
  "./prebuilt-themes/indigo-pink.css": { "style": "./prebuilt-themes/indigo-pink.css" }
}
```

### Build and publish
```shell
ng build ngx-acme        # production config → partial-Ivy
cd dist/ngx-acme
npm publish
```
Partial compilation in `tsconfig`:
```json
{ "angularCompilerOptions": { "compilationMode": "partial" } }
```

### Linking a standalone library into an external app (`angular.json`)
```json
"build": {
  "builder": "@angular/build:application",
  "options": { "preserveSymlinks": true },
  "configurations": {
    "development": { "sourceMap": { "scripts": true, "styles": true, "vendor": true } }
  }
},
"serve": {
  "builder": "@angular/build:dev-server",
  "options": { "prebundle": { "exclude": ["ngx-acme"] } }
}
```

### Angular linker in a custom webpack build
```js
import linkerPlugin from '@angular/compiler-cli/linker/babel';

export default {
  module: {
    rules: [{
      test: /\.m?js$/,
      use: {
        loader: 'babel-loader',
        options: {plugins: [linkerPlugin], compact: false, cacheDirectory: true},
      },
    }],
  },
};
```

### Typings for a library without `@types`
```ts
// src/typings.d.ts
declare module 'url-kit' {
  export interface Parsed { hostname?: string; pathname?: string; }
  export function parse(url: string, query?: string): Parsed;
}
```
```ts
import * as urlKit from 'url-kit';
const parsed = urlKit.parse('https://angular.dev');
```
With `@types` available: `npm install d3 --save` then `npm install @types/d3 --save-dev`.

### Runtime-global (legacy) library
```json
"scripts": [
  "node_modules/jquery/dist/jquery.slim.js",
  "node_modules/popper.js/dist/umd/popper.js",
  "node_modules/bootstrap/dist/js/bootstrap.js"
],
"styles": ["node_modules/bootstrap/dist/css/bootstrap.css", "src/styles.css"]
```
```ts
// src/typings.d.ts
declare var someGlobalLib: any;
interface JQuery { myPlugin(options?: any): any; }
```

## Pitfalls
- A library is unusable until built; after cloning and `npm install`, the editor flags library imports as missing until you run `ng build <lib>`.
- App imports resolve via `node_modules` for installed packages but via `tsconfig` `paths` for workspace libraries (the CLI adds these on generation).
- Library build output (APF) differs from app output, so mapping paths to library source `.ts` files breaks things.
- Putting `@angular/core` in `dependencies` instead of `peerDependencies` can load a second Angular copy and break the app.
- Building an app with an older Angular than its libraries is unsupported.
- Full-Ivy libraries require identical minor Angular versions between library and app.
- Partial-Ivy code in `node_modules` cannot be bundled as-is; it needs the linker. Non-CLI builds must add the Babel plugin manually.
- Without `preserveSymlinks: true`, linked libraries may pull in duplicate copies of node packages; without `prebundle.exclude`, linked source may not be watched/rebuilt.
- The library builder by default copies only `README.md` and `LICENSE*` and inlines relative `url()` assets in component styles as data URLs; other files need the `assets` option.
- Importing a `scripts`-loaded library with an `import` statement yields two copies (global + module); with plugin-based libraries like jQuery each copy has different plugins.
- Missing typings for script-added extensions produce an IDE error such as "Property 'myPlugin' does not exist on type 'JQuery'".
- An IDE may complain when a package lacks typings; install `@types/<lib>` or declare them manually.
- `"sideEffects": false` can break code that has genuine non-local side effects (uncommon; usually a design smell).
- With a single flat ES module per entry point, most build tools cannot split one entry point into multiple chunks; lazy-loading granularity equals entry-point granularity.
- FESM files may still depend on chunks shared between entry points; shared `.d.ts` files are likewise emitted for types used by several entry points.
- When updating Angular, keep all libraries current; interdependent libraries may need updating in a specific order.
- Publishing to npm requires an npm user account.

## Version notes
- [deprecated] Legacy `package.json` resolution keys (`"module"`, `"typings"`) for tools that do not understand `"exports"`; may be removed as `"exports"` support spreads.
- APF is versioned with Angular and changes each major; bundled `.d.ts` recommended as of APF v8; `tslib` as a direct dependency recommended as of APF v10.
- Partial-Ivy libraries work with Ivy apps on Angular v12 and later.
- ES2022 is the default language level consumed by the CLI; it down-levels for target browsers during the app build.
