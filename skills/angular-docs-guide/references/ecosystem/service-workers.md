# Angular service worker (PWA caching)

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/ecosystem/service-workers,
> Getting started — https://angular.dev/ecosystem/service-workers/getting-started,
> Custom service worker scripts — https://angular.dev/ecosystem/service-workers/custom-service-worker-scripts,
> Configuration file — https://angular.dev/ecosystem/service-workers/config,
> Communicating with the service worker — https://angular.dev/ecosystem/service-workers/communications,
> Push notifications — https://angular.dev/ecosystem/service-workers/push-notifications,
> Service worker devops — https://angular.dev/ecosystem/service-workers/devops,
> App shell pattern — https://angular.dev/ecosystem/service-workers/app-shell.

## When to use
- Adding basic offline support / turning an app into a PWA with `ng add @angular/pwa`
- Configuring what gets cached (`ngsw-config.json`: asset groups, data groups, navigation handling)
- Detecting, prompting for and applying app updates with `SwUpdate`
- Showing push notifications and handling notification clicks with `SwPush`
- Extending the generated worker with custom events (push, background sync)
- Deploying, debugging and safely removing a service worker in production
- Rendering a build-time app shell for a fast first paint
- See also: SSR and prerendering (app shell uses server config) → references/guide/ssr.md
- See also: CLI commands and build configuration → references/tools/cli.md

## Rules
Scope and setup
- MUST treat the Angular service worker as a basic caching utility with limited features; it gets only security fixes, no new features. PREFER native browser APIs for advanced caching/offline needs.
- MUST serve the app over HTTPS for the worker to register (only `localhost` is exempt).
- MUST keep the app working without service-worker support; guard calls with `SwUpdate.isEnabled` (unsupported browsers reject `checkForUpdate()` and never emit `versionUpdates`).
- PREFER `ng add @angular/pwa` to set up: adds `@angular/service-worker`, enables build support, registers the worker in root providers, adds `manifest.webmanifest` link and `theme-color` meta, installs icons, creates `ngsw-config.json`.
- PREFER `ng serve --configuration=production` or `npx http-server -p 8080 -c-1 dist/<project>/browser` to try the worker locally; test in an incognito/private window to avoid leftover state.
- PREFER `enabled: !isDevMode()` in `provideServiceWorker` options.

Configuration (`ngsw-config.json`)
- MUST start every file path with `/` (the deployment directory, usually `dist/<project>`).
- MUST escape a literal `$` in globs yourself (`\\$`); globs are converted to regex without escaping and without `^`/`$` anchors, so they match partially. Add `$` to anchor (e.g. `/foo/bar/*.js$` to exclude `.json`).
- PREFER ordering asset groups and data groups from most to least specific; the first matching group handles the request.
- MUST configure CORS on other origins whose resources the worker should handle.
- MUST use `updateMode: 'lazy'` only together with `installMode: 'lazy'`.
- MUST set a bounded `maxSize` on data caches; unbounded caches can exceed storage quotas and be evicted.
- MUST bump a data group's `version` when its API format changes incompatibly, to discard old entries.
- PREFER the `freshness` strategy for cross-origin resources returning opaque responses when you cannot add CORS.
- PREFER the default `navigationRequestStrategy: 'performance'`; `freshness` increases server requests and latency.
- PREFER widening `assetGroups` globs if the generated limited list of font/image extensions misses yours.

Updates
- PREFER waiting for `ApplicationRef.isStable` before polling for updates (or choose another registration strategy); polling with `setInterval`/`interval()` keeps the app unstable and delays registration up to the 30 s limit.
- PREFER prompting the user and reloading (`document.location.reload()`) on `VERSION_READY` rather than swapping versions silently.
- AVOID `activateUpdate()` unless you are sure it is safe: updating without reload can mismatch the shell and lazy chunks.
- MUST subscribe to `SwUpdate.unrecoverable` and ask the user to reload when it fires.

Custom worker scripts
- MUST `importScripts('./ngsw-worker.js')` first, wrap custom code in an IIFE, use `event.waitUntil()` for async work, handle errors so Angular's logic keeps working, and test in dev and prod.
- MUST add the custom script to the build `assets` in `angular.json` and register it via `provideServiceWorker('custom-sw.js', ...)`.

Deployment and safety
- MUST register with a versioned URL (e.g. `ngsw-worker.js?v=2`) and change it whenever only the worker's response headers (e.g. CSP) change; browsers reinstall only byte-different scripts.
- PREFER `ngsw-bypass` (request header or query param, any value) for requests the worker must not handle, e.g. upload progress reporting.
- MUST, to disable a broken worker fast, rename/delete `ngsw.json` (a `404` makes the worker clear caches and unregister).
- MUST, as a last resort, serve `safety-worker.js` contents at the old worker script URL (never register it directly) and keep serving it until all users unregistered — for most sites, forever.
- NEVER put the worker behind a redirect when moving domains; deactivate the old worker with the fail-safe or safety worker instead.

## API cheat-sheet
| API | Purpose | Notes / version tag |
|---|---|---|
| `ng add @angular/pwa` | Set up service worker + PWA files | Then `ng build` |
| `provideServiceWorker(script, opts)` | Register the worker in app providers | From `@angular/service-worker` |
| `opts.enabled` | Register or not | e.g. `!isDevMode()` |
| `opts.updateViaCache` | HTTP cache use for worker updates | `'imports'` (imports only), `'all'`, `'none'` |
| `opts.type` | Script type | `'classic'` (default, no `import`/`export`) or `'module'` |
| `opts.scope` | URLs the worker controls | Default: directory of the worker script |
| `opts.registrationStrategy` | When to register | `'registerWhenStable:<ms>'` (default `registerWhenStable:30000`; without timeout = immediate), `'registerImmediately'`, `'registerWithDelay:<ms>'`, or `() => Observable` |
| `SwUpdate.versionUpdates` | Update events | `VersionDetectedEvent` (`VERSION_DETECTED`), `NoNewVersionDetectedEvent`, `VersionReadyEvent` (`VERSION_READY`), `VersionInstallationFailedEvent` (`VERSION_INSTALLATION_FAILED`) |
| `SwUpdate.checkForUpdate()` | Ask for an update check | `Promise<boolean>`; rejects on failure |
| `SwUpdate.activateUpdate()` | Switch tab to latest version without reload | Can break the app |
| `SwUpdate.unrecoverable` | `UnrecoverableStateEvent` stream | Has `reason`; reload needed |
| `SwUpdate.isEnabled` | Whether the worker is active | Guard all interactions |
| `SwPush` | Push notification interactions | `notificationClicks` stream |
| `ngsw.json` | Build-generated manifest with file hashes | Changes ⇒ new app version |
| `ngsw/state` | Debug info page | Driver state, hashes, clients, idle queue, debug log |
| `safety-worker.js` | Unregisters itself and removes caches | Ships in `@angular/service-worker` |
| `ng generate app-shell` | Build-time app shell | Adds server config/routes, `app-shell` component, `main.server.ts` |

`ngsw-config.json` top-level keys:
| Key | Meaning | Default |
|---|---|---|
| `appData` | Free data describing the version; included in `SwUpdate` notifications | — |
| `index` | Index page for navigation requests | usually `/index.html` |
| `assetGroups[]` | Versioned app resources | — |
| `dataGroups[]` | Unversioned data/API caching policies | — |
| `navigationUrls` | URLs/globs (with `!` negatives) treated as navigations | `['/**', '!/**/*.*', '!/**/*__*', '!/**/*__*/**']` |
| `navigationRequestStrategy` | `'performance'` (serve index) or `'freshness'` (network first, for 3xx redirects to auth, moved links, status pages) | `'performance'` |
| `applicationMaxAge` | Max age of a version measured from build time; beyond it everything goes to network (no offline) | No limit |

Asset group (`name` required):
| Field | Values / notes | Default |
|---|---|---|
| `installMode` | `prefetch` (fetch all up front) / `lazy` (cache on request) | `prefetch` |
| `updateMode` | `prefetch` (re-cache changed files now) / `lazy` (wait for next request; needs `installMode: lazy`) | same as `installMode` |
| `resources.files` | Globs in the dist directory | — |
| `resources.urls` | Runtime URL patterns (e.g. CDNs); no hashes, cached per HTTP headers; no negative globs, `?` literal | — |
| `cacheQueryOptions.ignoreSearch` | Ignore query params when matching | `false` |

Data group (`name`, `urls`, `cacheConfig` required):
| Field | Values / notes | Default |
|---|---|---|
| `urls` | Patterns; only GET/HEAD cached; no negative globs; `?` literal | — |
| `version` | Integer; bump to drop incompatible cache | `1` |
| `cacheConfig.maxSize` | Max cached responses | — |
| `cacheConfig.maxAge` | Duration (`d h m s u`), e.g. `3d12h` | — |
| `cacheConfig.timeout` | Network wait before cache fallback, e.g. `5s30u` | — |
| `cacheConfig.refreshAhead` | Refresh this long before expiry, e.g. `1h30m` | — |
| `cacheConfig.strategy` | `performance` (cache first) / `freshness` (network first) | `performance` |
| `cacheConfig.cacheOpaqueResponses` | Cache opaque (no-CORS) responses | `true` for freshness, `false` for performance |
| `cacheQueryOptions.ignoreSearch` | As in asset groups | `false` |

Glob syntax: `**` any path segments, `*` any chars except `/`, `?` one char except `/`, `!` prefix negates.

Notification click operations (`data.onActionClick.<action|default>.operation`):
| Operation | Effect |
|---|---|
| `openWindow` | Open a new tab at `url` |
| `focusLastFocusedOrOpen` | Focus last client, else open `url` |
| `navigateLastFocusedOrOpen` | Focus last client and navigate to `url`, else open it |
| `sendRequest` | Background GET to `url` |

Driver states (`ngsw/state`): `NORMAL`; `EXISTING_CLIENTS_ONLY` (no clean latest copy: open tabs use cache, new loads use network, recovers on new `ngsw.json`); `SAFE_MODE` (cache unsafe: all traffic from network). Degraded states last only for the worker instance's lifetime.

## Patterns

### Register
```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
```

### Data group with stale-while-revalidate emulation
```json
{
  "dataGroups": [{
    "name": "api-feed",
    "urls": ["/api/feed"],
    "cacheConfig": {"maxSize": 50, "maxAge": "1d", "strategy": "freshness", "timeout": "0u"}
  }]
}
```

### Poll for updates after the app is stable
```ts
@Service()
export class UpdatePoller {
  private appRef = inject(ApplicationRef);
  private sw = inject(SwUpdate);

  constructor() {
    const stable$ = this.appRef.isStable.pipe(first((s) => s));
    concat(stable$, interval(6 * 60 * 60 * 1000)).subscribe(async () => {
      try { await this.sw.checkForUpdate(); } catch (e) { console.error(e); }
    });
  }
}
```

### Prompt and reload on a ready version; handle broken state
```ts
const sw = inject(SwUpdate);
sw.versionUpdates
  .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
  .subscribe(() => { if (confirm('Update available. Reload?')) document.location.reload(); });

sw.unrecoverable.subscribe((e) => notify(`Please reload: ${e.reason}`));
```

### Custom worker
```js
importScripts('./ngsw-worker.js');
(function () {
  'use strict';
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') event.waitUntil(syncData());
  });
})();
```
Add `"src/custom-sw.js"` to build `assets`, then `provideServiceWorker('custom-sw.js', {...})`.

### Notification with actions
```json
{
  "notification": {
    "title": "Order shipped",
    "actions": [{"action": "track", "title": "Track"}],
    "data": {"onActionClick": {
      "default": {"operation": "openWindow"},
      "track": {"operation": "navigateLastFocusedOrOpen", "url": "/orders"}
    }}
  }
}
```

### App shell
```shell
ng generate app-shell
ng build   # check dist/<app>/browser/index.html for "app-shell works!"
```
Existing apps need `Router` and a `<router-outlet>` first.

## Pitfalls
- After deploying, the first reload still shows the installed old version; the new one installs in the background and is served on the next load.
- Browsers ignore service workers on insecure (non-HTTPS, non-localhost) pages.
- Globs without `$` match partially (`/foo/*.js` also matches `.json`); unescaped `$` makes a pattern unmatchable.
- Cache eviction plus a deployed new version can leave an old version needing a lazy chunk that is gone from both cache and server → `UnrecoverableStateEvent`.
- Hash mismatches (stale intermediate caches, non-atomic deploys, build errors desyncing files and `ngsw.json`) make the worker refetch with cache-busting, then drop the whole version and possibly enter safe mode.
- Unhashed resources (e.g. CDN) are served stale-while-revalidate, honoring HTTP headers.
- New tabs get the latest version, so different tabs may run different versions; versions are cleaned up when no tab uses them.
- Changing only the worker's response headers does not reinstall it without a new script URL; the query param does not affect caches (they follow the registration scope).
- If the server is unreachable the worker returns an error status, e.g. a synthesized `504 Gateway Timeout`.
- With DevTools open, the worker never restarts (behavior differs from users'); the Cache Storage view is often stale — refresh it; stop/start in the Service Worker pane triggers an update check.
- Redirecting the worker script URL fails with "The script resource is behind a redirect, which is disallowed".
- Push notifications: an action without an `onActionClick` entry just closes the notification and notifies `SwPush.notificationClicks`; `url`s resolve against the registration scope (scope used when `url` is missing). In Chrome you can test pushes via DevTools → Application → Service Workers → Push.

## Version notes
- None stated in the docs. (The overview states the service worker receives security fixes only, no new features.)
