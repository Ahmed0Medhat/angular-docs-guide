# Build system, CLI builders & custom build pipelines

> Sources (angular.dev, v22.3 @ bd1e32b): Migrating to new build system — https://angular.dev/tools/cli/build-system-migration,
> Angular CLI builders — https://angular.dev/tools/cli/cli-builder,
> Custom build pipeline — https://angular.dev/ecosystem/custom-build-pipeline.

## When to use
- Moving an existing app off the deprecated webpack `browser` builder to `application` (or `browser-esbuild`).
- Using build-system features: `define` value replacement, `loader` per extension or per import, import/export conditions, dev-server HMR and prebundling.
- Writing, registering, running and testing a custom Architect builder (`createBuilder`, `builders.json`, `ng run`).
- Making a builder watch for changes, report progress/status, or schedule other builders/targets.
- Deciding whether a non-CLI pipeline (Vite via AnalogJS, Rspack via Nx) is justified.
- See also: schematics (same options/context split as builders) → references/tools/cli-schematics.md
- See also: named build configurations (`--configuration`) → references/tools/cli.md
- See also: publishing a builder package to npm → references/tools/libraries.md
- See also: adding SSR after migrating to `application` → references/guide/ssr.md

## Rules
### Build system migration
- PREFER migrating to the esbuild/Vite build system; the webpack build system and the `browser` builder are deprecated (staying on them is a temporary opt-out).
- MUST know new apps already use the `application` builder (`@angular/build:application`) by default.
- PREFER the automated migration: `ng update @angular/cli --name use-application-builder` (offered during major `ng update` since v18, optional, re-runnable any time).
- MUST try `ng build` after migrating and fix any new errors; the automated step does not guarantee a clean build.
- MUST review the Known Issues (below) before migrating.
- MUST make SSR server code ESM-compatible: drop `require`, `__filename`, `__dirname` and other CommonJS module-scope constructs (third-party dependencies are exempt).
- PREFER `application` over `browser-esbuild`: it improves SSR builds and eases later SSR adoption; choose `browser-esbuild` when `application` is too hard to adopt (most perf gains, fewer breaking changes).
- For `browser-esbuild`, MUST change only the `builder` field (`@angular-devkit/build-angular:browser-esbuild`); options stay as-is.
- For a manual switch to `application`, MUST change the `builder` and then adjust options (see the option table below).
- MUST review `npm`/other scripts that call `ng build`, since CLI flags may differ per builder; with `application` + SSR/prerender, extra `ng run` steps can often be removed.
- No change is needed to the `dev-server` builder config or `ng serve` flags; it detects the new build system automatically.
- PREFER `prebundle.exclude` for specific packages over `prebundle: false` (disabling prebundling increases rebuild times).
- MUST exclude a Node.js package from prebundling if you import a file from it with a `loader` import attribute under the dev server.
- MUST set `builderMode: "application"` on `@angular-devkit/build-angular:karma` to get `application`-builder features there; `@angular/build:karma` and `@angular/build:unit-test` always use `application`.
- PREFER `define` in `angular.json` for constant values committed to source control; PREFER `--define` on the CLI for per-run values (git hash, env vars).
- MUST declare types for every `define` identifier (e.g. `declare const API_HOST: string;` in `src/types.d.ts`) to avoid type-check errors.
- MUST write `define` values as strings; wrap a value in single quotes inside the string to make it a string literal.
- PREFER the `loader` build option for an entire unsupported file type; use the `loader` import attribute only for individual files.
- MUST set TypeScript `module` to `esnext` or `preserve` to use import attributes (new projects default to `preserve`).
- MUST pass a string literal as `loader` in dynamic `import(..., {with: {loader}})`; non-literals trigger a warning.
- PREFER import/export conditions plus `package.json` subpath `imports` over `fileReplacements` where it fits.
- PREFER enabling `esModuleInterop` and using default imports (`import moment from 'moment'`) for CommonJS-style packages.
- AVOID modules with non-local side effects (other than polyfills), regardless of build system.

### Custom builders
- MUST return a `BuilderOutput` (`{success: boolean; error?: string}`) from every builder, whether sync, `Promise` or `Observable`.
- MUST export the handler wrapped in `createBuilder()` as the default export.
- MUST describe inputs in a JSON schema; Architect validates resolved `options` against it before calling the builder.
- MUST link implementation + schema in `builders.json` and point to it via a `builders` key in the package's `package.json`.
- MUST define a target in `angular.json` (`architect` section) to run a builder via a CLI command or `ng run`.
- PREFER logging via `context.logger` so failures are understandable and the builder can run in a separate process with stdout/stderr disabled.
- PREFER integration tests via the Architect scheduler; use unit tests for the logic the builder executes.
- MUST return an `Observable` for watch-mode builders and emit a `BuilderOutput` after every run.
- MUST call `context.reportRunning()` when an external event restarts the work, so Architect doesn't stop the builder when another run is scheduled.
- MUST put cleanup in the `Observable`'s teardown; it runs on `BuilderRun.stop()` or completion.
- Use `targetFromTargetString()` (`@angular-devkit/architect`) to parse a target string your builder receives.

### Custom build pipeline
- PREFER the Angular CLI; a non-CLI pipeline is for rare cases only (adding Angular to another toolchain, hard dependency on module federation that rules out native federation, short-lived experiments).
- MUST accept manual maintenance with community plugins: no automated update experience.
- PREFER Rspack (`@nx/angular-rspack`) when tightly tied to custom webpack configuration; PREFER the AnalogJS Vite plugin (`@analogjs/vite-plugin-angular`) for Vite-based projects or frameworks.

## API cheat-sheet
### Builders (package:name)
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `@angular/build:application` | Full app build: client bundle, optional SSR server, build-time prerendering | Default for new apps; also in `@angular-devkit/build-angular:application`; replaces `app-shell`, `prerender`, `server`, `ssr-dev-server` |
| `@angular-devkit/build-angular:browser-esbuild` | Client-only, option-compatible replacement for `browser` | Stable; often drop-in |
| `@angular-devkit/build-angular:browser` | Webpack-based client build | [deprecated] |
| `@angular/build:dev-server` | `ng serve`; new build system in memory, served via Vite | Vite not directly configurable |
| `@angular/build:karma`, `@angular/build:unit-test` | Test builders | Always use `application` |
| `@angular-devkit/build-angular:karma` | Karma test builder | Uses `browser` internally; opt in with `builderMode: "application"` |
| `@angular/ssr` | SSR package | Works with both `browser` and `application`; added by `ng update` replacing `@nguniversal` |

### `browser` → `application` option changes
| `browser` option | Action for `application` |
| --- | --- |
| `main` | Rename to `browser` |
| `polyfills` | Must be an array |
| `buildOptimizer` | Remove (covered by `optimization`) |
| `resourcesOutputPath` | Remove (always `media`) |
| `vendorChunk`, `commonChunk` | Remove (no longer needed) |
| `ngswConfigPath` | Rename to `serviceWorker` |

### What the automated migration does
| Change |
| --- |
| `browser` / `browser-esbuild` targets become `application`; old SSR builders removed; config updated |
| `tsconfig.server.json` merged into `tsconfig.app.json`; adds `"esModuleInterop": true` |
| Server code updated for new bootstrapping and output layout |
| Removes webpack-only stylesheet syntax (`~` / `^` in `@import`/`url()`) with equivalent config |
| Switches to the lighter `@angular/build` package when nothing else uses `@angular-devkit/build-angular` |

### Build/serve options
| Option | Purpose | Notes / version tag |
| --- | --- | --- |
| `define` / `--define ID=VALUE` | Build-time identifier replacement (like webpack `DefinePlugin`) | CLI and `angular.json` values merge; CLI wins on same key; not applied inside Angular decorator metadata |
| `loader` (`{".ext": "<type>"}`) | Loader per file extension | `application` builder only |
| `with {loader: '...'}` import attribute | Loader per import (static or dynamic) | Overrides JS/TS handling and the `loader` option |
| `hmr` (`ng serve --no-hmr`) | Toggle HMR | On by default; global styles, component styles, templates (inline + file) |
| `prebundle` (`true` default) / `prebundle.exclude: [...]` | Vite dependency prebundling in dev server | `false` disables entirely |
| `optimization` / `optimization.scripts` | Decides "optimized" build for conditions | New project: `ng build` optimized, `ng serve` not |

### Loader types
| Value | Default export | Option / attribute |
| --- | --- | --- |
| `text` | Content as `string` | both |
| `binary` | Content as `Uint8Array` | both |
| `file` | Runtime path of emitted file (hashed in production, e.g. `media/image-<hash>.webp`) | both |
| `dataurl` | Full data URL | both |
| `base64` | Base64 string | both |
| `empty` | Nothing bundled (e.g. drop `import 'x.css'` side-effect imports) | `loader` option only |

### Automatic import/export conditions
| Condition | When |
| --- | --- |
| `production` | Optimized builds |
| `development` | Non-optimized builds |
| `browser` | Browser output code |

### Architect API (`@angular-devkit/architect`)
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `createBuilder(handler)` | Wraps `(options: JsonObject, context: BuilderContext)` handler | Handler returns value, `Promise` or `Observable` of `BuilderOutput` |
| `BuilderOutput` | `{success: boolean; error?: string}` | Required return shape |
| `context.logger` | `Logger` (e.g. `.error()`) | |
| `context.reportProgress(current, total?, status?)` | Progress hint | `total` is any number; status kept unless a new string is passed |
| `context.reportStatus(text)` | Status string of any length | May be truncated by UI; `''` clears it |
| `context.reportRunning()` | Signal a watch-mode restart | |
| `context.scheduleTarget(target, overrides?)` | Run a target | Resolves options through `angular.json` |
| `context.scheduleBuilder(name, options)` | Run a builder directly | Options validated against schema, no config resolution |
| `BuilderRun` (`.result`, `.stop()`) | Handle from scheduling | Builder runs only after this is returned; `stop()` ends watch mode and triggers teardown |
| `targetFromTargetString(str)` | Parse `project:target[:configuration]` | |
| `Architect`, `TestingArchitectHost` (`/testing`), `schema.CoreSchemaRegistry` (`@angular-devkit/core`) | Integration testing | `TestingArchitectHost` = in-memory `ArchitectHost` |
| `ng run project:target[:configuration] [--opt=value]` | Run any target | |

### Builder package files
| File | Role |
| --- | --- |
| `src/<name>.ts` | Builder implementation |
| `src/<name>.spec.ts` | Tests |
| `src/schema.json` | Input options schema |
| `builders.json` | Maps builder name → `implementation`, `schema`, `description` |
| `package.json` | Dependencies + `"builders": "builders.json"` |
| `tsconfig.json` | TypeScript config |

### Option resolution order (`scheduleTarget`)
1. Target `options` in `angular.json` → 2. selected `configurations.<name>` → 3. overrides (CLI flags) → validated against the schema.

## Patterns
### Switching to the `application` builder
```json
"architect": {
  "build": {
    "builder": "@angular/build:application",
    "options": {
      "browser": "src/main.ts",
      "polyfills": ["zone.js"],
      "serviceWorker": "ngsw-config.json"
    }
  }
}
```

### `define`: config, CLI and typings
```json
"options": {
  "define": {
    "MAX_ITEMS": "5",
    "APP_NAME": "'Demo app'",
    "CONFIG_REF": "globalThis.appConfig"
  }
}
```
```shell
ng build --define MAX_ITEMS=10 --define "APP_NAME='Override'"
ng build --define BUILD_SHA=\'$GIT_SHA\'
```
```ts
// src/types.d.ts
declare const MAX_ITEMS: number;
declare const APP_NAME: string;
declare const BUILD_SHA: string;
```

### Loaders
```json
"options": { "loader": { ".svg": "text" } }
```
```ts
// src/types.d.ts
declare module '*.svg' {
  const markup: string;
  export default markup;
}
// usage
import iconMarkup from './icon.svg';

// per-file via import attribute (TS has no attribute-based typings yet)
// @ts-expect-error
import photoUrl from './photo.webp' with {loader: 'file'};

async function readNotes(): Promise<string> {
  // @ts-expect-error
  return import('./notes.md', {with: {loader: 'text'}}).then((m) => m.default);
}
```

### Conditions with subpath imports
```json
{
  "imports": {
    "#log": { "development": "./src/log/verbose.ts", "default": "./src/log/silent.ts" },
    "#reporter": { "browser": "./src/report/client.ts", "default": "./src/report/server.ts" }
  }
}
```
```ts
import {log} from '#log';
```

### Dev-server prebundling
```json
"serve": {
  "builder": "@angular/build:dev-server",
  "options": { "prebundle": { "exclude": ["legacy-lib"] } }
}
```

### A custom builder
```ts
import {BuilderContext, BuilderOutput, createBuilder} from '@angular-devkit/architect';
import {JsonObject} from '@angular-devkit/core';
import {promises as fs} from 'fs';

interface CopyOptions extends JsonObject {
  source: string;
  destination: string;
}

export default createBuilder(copy);

async function copy(opts: CopyOptions, ctx: BuilderContext): Promise<BuilderOutput> {
  ctx.reportStatus(`Copying ${opts.source} -> ${opts.destination}`);
  try {
    await fs.copyFile(opts.source, opts.destination);
  } catch (e) {
    ctx.logger.error('Copy failed.');
    return {success: false, error: (e as Error).message};
  }
  ctx.reportStatus('Done.');
  return {success: true};
}
```

### Registering the builder
```json
// src/schema.json
{ "$schema": "https://json-schema.org/schema", "type": "object",
  "properties": { "source": {"type": "string"}, "destination": {"type": "string"} } }

// builders.json
{ "builders": { "copy": {
  "implementation": "./dist/my-builder.js",
  "schema": "./src/schema.json",
  "description": "Copies a file." } } }

// package.json  -> builder id becomes "@acme/copy-file:copy"
{ "name": "@acme/copy-file", "builders": "builders.json",
  "dependencies": { "@angular/build": "^21.2.0" } }
```

### Target + running
```json
"architect": {
  "copy-pkg": {
    "builder": "@acme/copy-file:copy",
    "options": { "source": "package.json", "destination": "package-copy.json" }
  }
}
```
```shell
ng run my-app:copy-pkg
ng run my-app:copy-pkg --destination=package-alt.json   # source keeps its default
```

### Integration test
```ts
import {Architect} from '@angular-devkit/architect';
import {TestingArchitectHost} from '@angular-devkit/architect/testing';
import {schema} from '@angular-devkit/core';
import {join} from 'path';

let architect: Architect;
let host: TestingArchitectHost;

beforeEach(async () => {
  const registry = new schema.CoreSchemaRegistry();
  registry.addPostTransform(schema.transforms.addUndefinedDefaults);
  host = new TestingArchitectHost(__dirname, __dirname); // workspace root, current dir
  architect = new Architect(host, registry);
  await host.addBuilderFromPackage(join(__dirname, '..')); // package name or dir with package.json
});

it('copies', async () => {
  const run = await architect.scheduleBuilder('@acme/copy-file:copy', {
    source: 'package.json',
    destination: 'package-copy.json',
  });
  const output = await run.result; // next BuilderOutput
  await run.stop();                // release Architect's in-memory builder state
  expect(output.success).toBe(true);
});
```

### Watch-mode phases
| Phase | Ends when |
| --- | --- |
| Running | Work (e.g. compile) finishes and a `BuilderOutput` is emitted |
| Watching | An external event restarts work and `context.reportRunning()` is called |
| Completion | Task fully done or `BuilderRun.stop()` called; Architect runs teardown and unsubscribes |

## Pitfalls
- Default (namespace) import mismatch: `import * as moment from 'moment'; moment()` crashes at runtime; the build warns `call-import-namespace`. Fix with `esModuleInterop` + default import.
- Web Workers (`new Worker(new URL('./w', import.meta.url))`) work, but worker code is not type-checked and nested workers are not processed.
- Order-dependent side-effectful imports shared by several lazy modules may run top-level code out of order (bundler defect; not for `polyfills`).
- Output moves to `dist/<project>/browser` (was `dist/<project>`); toolchains expecting the old path break — configure the output path.
- General JavaScript HMR is unsupported; only styles and templates hot-replace.
- A brief flash of unstyled content may appear when `ng serve` starts (stylesheet processing is deferred); production builds are unaffected.
- `define` does not replace identifiers inside Angular metadata (e.g. `@Component` / `@Directive` decorators).
- After adding a `.d.ts` for `define` or loaders, a customized tsconfig may need to include it.
- TypeScript can't type imports by attribute: use `@ts-expect-error`/`@ts-ignore` or a per-file `.d.ts` (only if that file is always imported with the same loader).
- New `application`-builder features don't work with `@angular-devkit/build-angular:karma` unless `builderMode: "application"` is set.
- New warnings/errors after the first `ng build` often include suggested fixes; webpack-specific features are a common cause.
- `context.scheduleBuilder()` skips `angular.json` configuration/override resolution; only `scheduleTarget()` applies it.
- Long `reportStatus()` strings may be truncated by the UI.
- Not calling `run.stop()` in tests leaves Architect holding builder state, since builders keep waiting to be scheduled.
- Architect may reuse a builder's `Observable` when scheduled again with identical arguments.
- Running the `.spec.ts` test needs `ts-node`; renaming it to `.spec.js` avoids that.
- Custom (non-Angular) builders: check that builder's own docs for migration options.

## Version notes
- [v17+] New esbuild/Vite build system available; stable and fully supported.
- [v18+] Major `ng update` prompts to run the `use-application-builder` migration.
- [deprecated] The webpack-based build system and the `browser` builder.
- `browser-esbuild` and `application` manual migration paths are both stable.
