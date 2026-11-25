# Test Runners: Vitest and Karma

> Sources (angular.dev, v22.3 @ bd1e32b): Migrating from Karma to Vitest — https://angular.dev/guide/testing/migrating-to-vitest,
> Testing with Karma and Jasmine — https://angular.dev/guide/testing/karma.

## When to use
- Moving an existing Karma + Jasmine project onto Vitest (the CLI default for new projects).
- Rewriting Jasmine spec syntax (`fit`, `spyOn`, `jasmine.createSpy`, ...) into Vitest APIs with the `refactor-jasmine-vitest` schematic.
- Running Vitest tests in a real browser (Playwright, WebdriverIO, Preview providers) instead of DOM emulation.
- Supplying a custom Vitest config file through `runnerConfig`.
- Creating or keeping a project on Karma + Jasmine, customizing `karma.conf.js`, enforcing coverage thresholds, running in CI, or debugging specs in the browser.
- See also: Vitest fake timers instead of `fakeAsync` → references/guide/testing-scenarios.md
- See also: testing setup overview → references/guide/testing.md

## Rules
- MUST treat migrating an existing project to Vitest as experimental; it also MUST use the `application` build system (default for new projects).
- MUST update the project manually (dependencies, `angular.json`, Karma cleanup) before running the refactoring schematic; the schematic does none of that.
- MUST install `vitest` plus a DOM emulation library (`happy-dom` or `jsdom`); one of them is required. The CLI picks `happy-dom` when present, else `jsdom`.
- MUST set the `test` target `builder` to `@angular/build:unit-test`.
- MUST move test-only build options (`polyfills`, `assets`, `styles`, ...) out of the `test` target into a dedicated build configuration referenced by `buildTarget` when they differ from `development`; `unit-test` does not accept them in the `test` target. If they already match `development`, nothing to do.
- MUST review `karma.conf.js` for custom settings before deleting it; they are not migrated automatically.
- PREFER configuring Vitest reporters in `angular.json` under `test.options.reporters`; use a custom `vitest.config.ts` only for advanced setups.
- PREFER the built-in coverage support (`ng test --coverage`) over looking for a Karma coverage plugin replacement.
- MUST replace custom Karma browser launchers with the `browsers` option plus an installed browser provider package.
- MUST install a browser provider and set `browsers` in `angular.json` to run Vitest in a real browser.
- MUST review every change made by `refactor-jasmine-vitest` (experimental, may miss patterns); pay extra attention to complex spies and mocks, then run `ng test`.
- PREFER planning to convert suites to native `async` plus Vitest fake timers; the `zone.js` Vitest patch is only a bridge.
- AVOID relying on Angular team support for custom Vitest config contents or third-party plugins inside it.
- MUST (Karma, existing project) install the Karma/Jasmine packages, set `runner: "karma"` on the `unit-test` builder, and add `"jasmine"` to `types` in `tsconfig.spec.json`.
- MUST (Karma CI) pass `--no-watch --no-progress --browsers=ChromeHeadless` so the run executes once, exits cleanly, and needs no GUI.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `@angular/build:unit-test` | Unit-test builder for the `test` target | Runner defaults to Vitest; set `runner: "karma"` for Karma |
| `tsConfig` (unit-test option) | TS config for tests | Default `"tsconfig.spec.json"` |
| `buildTarget` (unit-test option) | Build config the tests compile with | Default `"::development"`; point to e.g. a `testing` config if needed |
| `runner` (unit-test option) | Selects test runner | `"karma"` for Karma + Jasmine |
| `runnerConfig` (unit-test option) | Custom Vitest config | Path (e.g. `"vitest.config.ts"`) or `true` to auto-search `vitest-base.config.*` in project and workspace roots |
| `browsers` (unit-test option) | Run in real browsers | Name depends on provider: `chromium` (Playwright), `chrome` (WebdriverIO) |
| `reporters` (unit-test option) | Vitest-compatible reporters | Replace Karma reporters |
| `@vitest/browser-playwright` | Browser provider | Chromium, Firefox, WebKit |
| `@vitest/browser-webdriverio` | Browser provider | Chrome, Firefox, Safari, Edge |
| `@vitest/browser-preview` | Browser provider | WebContainer environments (e.g. StackBlitz) |
| `ng test` | Builds in watch mode and launches the configured runner | Watch on by default in an interactive terminal not on CI |
| `ng test --coverage` | Code coverage | First-class CLI feature |
| `ng g @schematics/angular:refactor-jasmine-vitest` | Rewrites Jasmine specs to Vitest | [experimental]; default project, all test files |
| `--project <name>` | Schematic: pick project in a multi-project workspace | e.g. `--project=my-lib` |
| `--include <path>` | Schematic: limit to one file or directory | |
| `--file-suffix <suffix>` | Schematic: non-default spec suffix | e.g. `.test.ts` |
| `--add-imports` | Schematic: add explicit `vitest` imports | Use when globals are disabled in Vitest config |
| `--verbose` | Schematic: log every transformation | |
| `--browser-mode` | Schematic: target browser-mode tests | |
| `zone.js/plugins/vitest-patch` | Polyfill enabling `fakeAsync`, `flush`, `waitForAsync` under Vitest | Add to test target `polyfills` |
| `ng new <app> --test-runner=karma` | New project preconfigured with Karma + Jasmine | |
| `ng generate config karma` | Generates a `karma.conf.js` to customize | |
| `coverageReporter.check.global` | Karma minimum coverage (`statements`, `branches`, `functions`, `lines`) | In `karma.conf.js`; run fails below threshold |

### Schematic transformations (Jasmine → Vitest)
| Jasmine | Vitest |
| --- | --- |
| `fit` / `fdescribe` | `it.only` / `describe.only` |
| `xit` / `xdescribe` | `it.skip` / `describe.skip` |
| `spyOn` | `vi.spyOn` |
| `jasmine.objectContaining` | `expect.objectContaining` |
| `jasmine.any` | `expect.any` |
| `jasmine.createSpy` | `vi.fn` |
| `beforeAll` / `beforeEach` / `afterAll` / `afterEach` | Vitest equivalents |
| `fail()` | `expect.fail()` |
| Expectations | Adjusted to Vitest APIs |
| Unconvertible code | Gets a to-do marker comment for manual follow-up |

## Patterns

### Install Vitest (npm; yarn/pnpm/bun equivalents exist)
```shell
npm install --save-dev vitest jsdom
```

### Switch the test target to the unit-test builder
```json
{
  "projects": {
    "my-app": {
      "architect": {
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "runnerConfig": "vitest.config.ts"
          }
        }
      }
    }
  }
}
```

### Remove Karma (packages from a default CLI project; yours may have more)
```shell
rm karma.conf.js src/test.ts
npm uninstall karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core
```

### Browser mode
```shell
npm install --save-dev @vitest/browser-playwright
```
```json
{
  "test": {
    "builder": "@angular/build:unit-test",
    "options": { "browsers": ["chromium"] }
  }
}
```

### Run the refactor schematic
```shell
ng g @schematics/angular:refactor-jasmine-vitest
ng g @schematics/angular:refactor-jasmine-vitest --include=src/app/cart --add-imports
```

### Keep zone-based helpers working under Vitest
Add `zone.js/plugins/vitest-patch` to the test target's `polyfills` in `angular.json` so `fakeAsync`, `flush` and `waitForAsync` work; then plan a move to native `async` and Vitest fake timers.

### Karma: add to an existing project
```shell
npm install --save-dev karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core @types/jasmine
```
```json
{
  "test": {
    "builder": "@angular/build:unit-test",
    "options": { "runner": "karma" }
  }
}
```
```json
{ "compilerOptions": { "types": ["jasmine"] } }
```

### Karma: coverage threshold in `karma.conf.js`
```javascript
coverageReporter: {
  dir: require('path').join(__dirname, './coverage/my-app'),
  subdir: '.',
  reporters: [{ type: 'html' }, { type: 'text-summary' }],
  check: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
},
```

### Karma: CI run
```shell
ng test --no-watch --no-progress --browsers=ChromeHeadless
```

### Karma: debugging a spec in the browser
1. Bring up the Karma browser window and click **DEBUG** (opens a new tab, reruns tests).
2. Open DevTools (Windows `Ctrl-Shift-I`, macOS `Command-Option-I`) → **Sources**.
3. `Control/Command-P`, type the spec file name, set a breakpoint, refresh the page.

In the Karma Jasmine HTML reporter, clicking a test row reruns that single test; clicking a description reruns that suite. Saving a source file reruns tests and refreshes the browser.

## Pitfalls
- The `unit-test` builder rejects build options (`polyfills`, `assets`, `styles`) inside the `test` target that `@angular/build:karma` used to accept.
- If the `development` build configuration is missing, the default `buildTarget` (`::development`) cannot be used; create and reference a dedicated config (e.g. `testing`).
- The schematic does NOT install `vitest`/deps, edit `angular.json`, move build options, delete `karma.conf.js`/`test.ts`, or handle complex/nested spies.
- The CLI overrides `test.projects` and `test.include` even when a custom Vitest config sets them.
- Vitest browser mode runs headless only when the `CI` env var is set or the browser name contains "Headless" (e.g. `ChromeHeadless`); otherwise a headed browser opens.
- If Vitest globals are disabled in your config, run the schematic with `--add-imports` so specs get explicit `vitest` imports.
- Karma in CI without `--no-watch --no-progress` may not run once and exit cleanly; without `ChromeHeadless` it needs a GUI.
- Karma coverage `check` thresholds fail the whole test run when not met.

## Version notes
- [experimental] Migrating an existing project from Karma to Vitest.
- [experimental] `refactor-jasmine-vitest` schematic.
- Vitest is the default unit test runner for new CLI projects; Karma remains supported.
