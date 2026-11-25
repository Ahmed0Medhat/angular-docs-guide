# Angular CLI: setup, build, serve, deploy, e2e, environments

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/tools/cli,
> Local set-up — https://angular.dev/tools/cli/setup-local,
> Building Angular apps — https://angular.dev/tools/cli/build,
> Serving Angular apps for development — https://angular.dev/tools/cli/serve,
> Deployment — https://angular.dev/tools/cli/deployment,
> End-to-End Testing — https://angular.dev/tools/cli/end-to-end,
> Build environments — https://angular.dev/tools/cli/environments.

## When to use
- Installing the `ng` CLI and scaffolding a workspace with `ng new`, then running it locally.
- Passing boolean, array and key/value flags to `ng` commands correctly.
- Building for production, setting size budgets, allowing CommonJS deps, tuning browser targets.
- Running the dev server and proxying `/api` calls to a local backend.
- Deploying with `ng deploy` or by copying `dist/` output to a static host / Node server.
- Adding an e2e runner with `ng e2e`, and defining per-environment configurations (`development`, `staging`).
- See also: SSR and `outputMode` → references/guide/ssr.md
- See also: writing custom builders (`deploy`, `e2e`) and the `browser-esbuild` compatibility builder → references/tools/cli-builders.md
- See also: schematics → references/tools/cli-schematics.md
- See also: Tailwind setup → references/guide/tailwind.md
- See also: AOT compilation → references/tools/cli-compiler.md
- See also: `<base href>` and router 404 pages → references/guide/routing-advanced.md
- See also: Angular DevTools → references/tools/devtools.md
- See also: Angular Package Format for libraries → references/tools/libraries.md

## Rules
- MUST install an active LTS or maintenance LTS release of Node.js before installing the CLI (npm ships with it).
- MUST run workspace-scoped commands such as `ng add` and `ng generate` from inside a workspace; MUST run `ng new` outside any workspace.
- PREFER native ES modules for the app and its dependencies; CommonJS bundles less efficiently and triggers CLI warnings.
- PREFER asking for ESM support, contributing it, or switching packages before silencing a CommonJS warning; list the module in `allowedCommonJsDependencies` only when CommonJS is truly the best choice.
- MUST add polyfills for missing Web APIs yourself via the `polyfills` option in `angular.json`; the CLI transforms syntax/CSS for target browsers but never injects API polyfills.
- AVOID widening the browserslist beyond Angular's supported set; only narrow it (fewer browsers or versions), since Angular itself may not run on extra targets.
- MUST restart `ng serve` after editing the proxy config file for the changes to take effect.
- MUST configure the web server to fall back to `index.html` for unknown paths when the app uses the router, so deep links and refreshes work.
- MUST use `index.csr.html` (not `index.html`) as the fallback when prerendering with `outputMode: "static"`.
- MUST fix CORS errors on the remote server; nothing in Angular or the client can resolve them.
- PREFER `<base href>` over `--deploy-url`, because `--deploy-url` is baked in at build time while `<base href>` is set once at runtime.
- NEVER put secrets (API keys, etc.) in `src/environments/` files; they ship in the client bundle. Use a server-side proxy or a secrets manager.
- MUST import the original `environments/environment` file (never a target-specific variant) so file replacements can swap it per configuration.
- PREFER verifying that production optimizations still apply before deploying if you customized build configurations.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `@angular/cli` | npm package providing the `ng` binary | Install globally with npm/pnpm/bun `install -g` or `yarn global add` |
| `ng new <name>` | Create workspace + starter app in a same-named directory | Prompts for features; installs packages (can take minutes) |
| `ng serve` | Compile without heavy optimizations, start dev server, rebuild + live reload | Runs the `serve` target; stop with `Ctrl+C`; default URL `http://localhost:4200/` |
| `ng serve --open` / `-o` | Also opens the browser | |
| `ng build` | Compile TS to JS, optimize, bundle, minify | Runs the `build` target of the default project; uses `production` config by default |
| `ng build --configuration a,b,c` | Apply named configurations | Applied in order; last one wins on conflicts |
| `ng build --deploy-url <path>` | Compile-time base path for assets, scripts, styles, lazy chunks | Overlaps with `<base href>`; prefer the latter |
| `ng deploy` | Run the project's `deploy` builder | Added to `angular.json` by a deploy package via `ng add` |
| `ng e2e` | Run the `e2e` builder; if absent, prompt to install a runner | Any custom builder named `e2e` works |
| `ng generate environments` | Create `src/environments/` and set up `fileReplacements` | |
| `ng generate config browserslist` | Emit `.browserslistrc` matching Angular's supported browsers | Overrides the CLI's internal list |
| `ng generate library` | Generate a library | Uses `@angular/build:library` by default |
| `@angular/build:application` | Default app builder (ng new): client bundle, Node server, build-time prerendering, esbuild | Output `dist/<project>` by default; change via `outputPath` |
| `@angular/build:library` | Builds libraries in Angular Package Format | |
| `@angular-devkit/build-angular:browser-esbuild` | Browser-only bundle via esbuild | Compatibility builder |
| `@angular-devkit/build-angular:browser` | Browser-only bundle via webpack | |
| `@angular/build:dev-server` | Most common and default `serve` builder | Supports `proxyConfig`, `buildTarget` |
| `budgets` | Size thresholds per configuration in `angular.json` | Warns/errors when a part reaches or exceeds the limit |
| `allowedCommonJsDependencies` | Silence CommonJS warnings for listed modules | `build` target `options` |
| `polyfills` | Add polyfills for missing Web APIs | `angular.json` |
| `proxyConfig` / `--proxy-config` | File of proxy rules for the dev server | Vite-style proxy options |
| `fileReplacements` | Swap a source file for a target-specific one at build time | None by default; `ng generate environments` adds it |
| `configurations` | Per-builder named option overrides | Works on any CLI builder |
| `defaultConfiguration` | Configuration used when none is passed | If unset, `options` are used unmodified |
| `buildTarget` | Point a `serve` configuration at a `build` configuration | e.g. `my-app:build:production` |
| Critical CSS inlining | Inline above-the-fold CSS into HTML to improve FCP; rest loads async | On by default (Beasties); disable via `styles` optimization options |

### Option syntax
| Kind | Forms |
| --- | --- |
| Boolean | `--flag` (true), `--no-flag` (false), `--flag=true` / `--flag=false`; omitted = documented default |
| Array | `--opt a b` or `--opt a --opt b` |
| Key/value (e.g. `--define`) | `--define 'K1="v1"' K2=true` or `--define 'K1="v1"' --define K2=true` |
| File paths | Absolute, or relative to the current working directory (usually workspace or project root) |

### Budget entry properties
| Property | Meaning |
| --- | --- |
| `type` | `bundle` (one named bundle, lazy ones included), `initial` (bootstrap JS+CSS = "Initial Total"; default warn 500kb / error 1mb), `allScript`, `all` (whole app), `anyComponentStyle` (any single component stylesheet; default warn 4kb / error 8kb), `anyScript`, `any` (any file) |
| `name` | Bundle name for `type: "bundle"`, as reported by the builder (not the output filename) |
| `baseline` | Reference size; defaults to `0` |
| `maximumWarning` / `maximumError` | Upper thresholds relative to baseline |
| `minimumWarning` / `minimumError` | Lower thresholds relative to baseline |
| `warning` / `error` | Thresholds relative to baseline applied both min and max |

Size values: `123` or `123b` (bytes), `123kb`, `123mb`, `12%` (relative to baseline; not allowed for `baseline` itself).

### Production configuration features
| Feature | Effect |
| --- | --- |
| AOT compilation | Templates precompiled |
| Production mode | Best runtime performance; dev-only code stripped |
| Bundling | Fewer deployed files |
| Minification | Strips whitespace, comments, optional tokens |
| Mangling | Short arbitrary identifiers |
| Dead code elimination | Drops unreferenced modules/code |

Development config (used by `ng serve`) adds: extra checks such as NG0100 (expression changed after checked), richer error messages, the global `ng` debugging helpers and Angular DevTools support.

### Deployment packages (`ng add` / setup)
| Target | Setup |
| --- | --- |
| Firebase hosting | `ng add @angular/fire` |
| Vercel | `vercel init angular` |
| Netlify | `ng add @netlify-builder/deploy` |
| GitHub Pages | `ng add angular-cli-ghpages` |
| Amazon S3 | `ng add @jefiozie/ngx-aws-deploy` |

### E2E packages offered by `ng e2e`
Playwright (`playwright-ng-schematics`), Cypress (`@cypress/schematic`), Nightwatch (`@nightwatch/schematics`), WebdriverIO (`@wdio/schematics`), Puppeteer (`@puppeteer/ng-schematics`). Others can be added manually with `ng add`.

## Patterns

Setup and first run:

```shell
npm install -g @angular/cli
ng new shop
cd shop
ng serve -o
```

Budgets, including a lazy bundle and a baseline-relative budget:

```json
"configurations": {
  "production": {
    "budgets": [
      { "type": "initial", "maximumWarning": "250kb", "maximumError": "500kb" },
      { "type": "bundle", "name": "reports", "maximumWarning": "250kb", "maximumError": "300kb" },
      { "type": "bundle", "name": "main", "baseline": "200kb", "maximumWarning": "10%", "maximumError": "20%" }
    ]
  }
}
```

The last entry warns above 220kb and errors above 240kb.

Allow a CommonJS dependency:

```json
"build": {
  "builder": "@angular/build:application",
  "options": { "allowedCommonJsDependencies": ["lodash"] }
}
```

Dev-server proxy (`src/proxy.conf.json`) wired into `serve`:

```json
{ "/api/**": { "target": "http://localhost:3000", "secure": false } }
```

```json
"serve": {
  "builder": "@angular/build:dev-server",
  "options": { "proxyConfig": "src/proxy.conf.json" }
}
```

Proxy path keys:

| Key | Matches | Does not match |
| --- | --- | --- |
| `/api` | `/api`, `/api/users/123`, `/api-docs` (any prefix match) | |
| `/api/*` | `/api/users` | `/api`, `/api/users/123` |
| `/api/**` | `/api`, `/api/users`, `/api/users/123` | `/api-docs` |

Named configurations and selecting them:

```json
"build": {
  "builder": "@angular/build:application",
  "options": { "sourceMap": false },
  "configurations": { "debug": { "sourceMap": true } }
}
```

```shell
ng build --configuration debug
ng build --configuration debug,production,customer-facing
```

Environment files:

```ts
// src/environments/environment.ts (base = production defaults)
export const environment = { production: true, apiUrl: 'http://my-prod-url' };

// src/environments/environment.staging.ts
export const environment = { production: false, apiUrl: 'http://my-staging-url' };
```

```ts
// always import the base file
import {environment} from '../environments/environment';

fetch(environment.apiUrl);
```

```json
"configurations": {
  "staging": {
    "fileReplacements": [
      { "replace": "src/environments/environment.ts", "with": "src/environments/environment.staging.ts" }
    ]
  }
}
```

Make `ng serve` follow a build configuration:

```json
"serve": {
  "builder": "@angular/build:dev-server",
  "configurations": {
    "development": { "buildTarget": "my-app:build:development" },
    "production": { "buildTarget": "my-app:build:production" }
  },
  "defaultConfiguration": "development"
}
```

Manual deployment by render mode:

| Mode | What to ship | How to run |
| --- | --- | --- |
| CSR or `outputMode: "static"` | `dist/my-app/browser/` | Serve that directory from a web server or CDN |
| `outputMode: "server"` | `dist/my-app/browser/` and `dist/my-app/server/` | `node dist/my-app/server/server.mjs` |

Automated deploy (Firebase example; interactive, needs a Firebase account and project selection):

```shell
ng add @angular/fire
ng deploy
```

## Pitfalls
- `ng build` and `ng serve` only run the `build` / `serve` target of the default project defined in `angular.json`.
- Windows: a global npm install can fail because PowerShell script execution is off by default; set `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` and read the resulting message before accepting.
- Unix: global installs may fail with permission errors when global scripts belong to root; `sudo` works but understand the implications of running as root.
- A budget `name` matches the builder's bundle name, so wildcard or regex patterns like `admin.*.js` do not work.
- `%` size values are not valid for `baseline`.
- Without an `index.html` fallback, servers answer deep links (`/users/42`) with 404 on reload or direct entry; real unknown routes are still handled by router-defined 404 pages without extra server config.
- With `outputMode: "static"` prerendering, `index.html` holds the prerendered root route; using it as the SPA fallback is wrong.
- The CLI warns whenever a browser app depends on CommonJS modules.
- Dev-only features (NG0100 checks, `ng` global, DevTools support) are absent in the default `production` build.
- `--deploy-url` is hard-coded at build time and cannot be changed at runtime.
- Without `defaultConfiguration`, the target's `options` apply directly with no configuration overlay.
- Each deploy package's `ng deploy` may need different command-line options.

## Version notes
- None stated in the docs.
