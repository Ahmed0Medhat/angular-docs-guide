# Server-side rendering, hybrid rendering & hydration

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/performance,
> Server-side and hybrid-rendering — https://angular.dev/guide/ssr,
> Hydration — https://angular.dev/guide/hydration,
> Incremental Hydration — https://angular.dev/guide/incremental-hydration.

## When to use
- Adding SSR / prerendering (SSG) to a new or existing app and choosing a render mode per route (`ServerRoute`, `RenderMode`).
- Prerendering parameterized routes at build time and choosing a fallback for paths not prerendered.
- Writing components and services that run safely on both server and browser (`afterNextRender`, `DOCUMENT`, platform-specific providers, `REQUEST` / `RESPONSE_INIT`).
- Reusing server HTTP responses in the browser and tuning or disabling the HTTP transfer cache.
- Enabling, debugging and working around hydration (event replay, `ngSkipHydration`, stability, i18n).
- Deferring hydration of page sections with `@defer` hydrate triggers (incremental hydration).
- See also: app shell pattern → references/ecosystem/service-workers.md
- See also: `@defer` blocks and regular triggers → references/guide/templates.md
- See also: preventing SSRF / configuring allowed hosts → references/guide/security.md
- See also: inspecting hydration status and overlay in Angular DevTools → references/tools/devtools.md

## Rules
- MUST know the defaults: apps are client-rendered (CSR) unless SSR is added; once added, Angular prerenders the whole app and also emits a server file.
- MUST set `outputMode: "static"` in `angular.json` if you want a fully static site with no server; MUST switch server routes to `RenderMode.Server` to get request-time SSR.
- PREFER `RenderMode.Prerender` for pages identical for every user; NEVER use it for pages that need user-specific data (everything must be known at build time).
- PREFER `RenderMode.Server` for pages that need per-user or per-request data; PREFER `RenderMode.Client` when code must assume a browser, when server cost matters, or for offline service-worker apps.
- MUST keep `getPrerenderParams` free of browser-specific and server-specific APIs; it always executes at build time.
- MUST call `inject` synchronously inside `getPrerenderParams` — never after an `await` or inside an async callback.
- NEVER touch browser globals (`window`, `document`, `navigator`, `location`, some `HTMLElement` properties) in code that runs on the server; run browser-only code in `afterNextRender` / `afterEveryRender` (browser-only hooks).
- PREFER separate browser/server service implementations (registered in `app.config.ts` and overridden in `app.config.server.ts`) over runtime `isPlatformBrowser` / `isPlatformServer` checks.
- AVOID `@if` (or any conditional) driven by `isPlatformBrowser` that renders different markup on server vs. client; keep rendered content identical and do browser setup in `afterNextRender`.
- PREFER injecting the `DOCUMENT` token over referencing the global `document`; use the `Meta` service for meta tags.
- MUST use `useFactory` (not `useValue`) for server-side providers that need a fresh value per request — top-level `useValue` values live until the server restarts.
- MUST guard against `REQUEST`, `RESPONSE_INIT` and `REQUEST_CONTEXT` being `null` (build, CSR, SSG, dev route extraction).
- PREFER `RESPONSE_INIT` for headers/status computed at runtime; use the `headers` / `status` fields of `ServerRoute` for static ones.
- PREFER keeping `maxResponseBodySize` as small as possible and moving large downloads out of server rendering.
- AVOID putting sensitive headers (e.g. auth tokens) in `includeHeaders` of the transfer cache.
- MUST only set `includePostRequests: true` when the POST calls are idempotent reads (e.g. GraphQL queries) safe to reuse across server and client.
- MUST only enable `includeRequestsWithAuthHeaders` / `includeRequestsWithCredentials` / `includeNonCacheableRequests` when the response is not user-specific / is safe to cache / you deliberately bypass cache-control.
- PREFER excluding endpoints with user-specific or dynamic data via `filter` or per-request `transferCache: false`.
- MUST include `provideClientHydration()` in the providers that bootstrap the app on the server as well as the browser (CLI-generated SSR setups already do this).
- MUST produce the same DOM (including whitespace and Angular's comment nodes) on server and client; NEVER alter the server HTML before hydration.
- AVOID direct DOM manipulation (`innerHTML`, `outerHTML`, `appendChild`, querying/moving/detaching nodes via native APIs); refactor to Angular APIs, use `ngSkipHydration` only until refactored.
- MUST write valid HTML in templates; always declare `<tbody>` explicitly in tables.
- PREFER leaving `preserveWhitespaces` at its default `false`; if you set it, set it only in `tsconfig.app.json` (inherited by `tsconfig.server.json`) so both builds match.
- AVOID `ngSkipHydration` except as a last resort; treat hydration-breaking components as bugs; NEVER put it on the root component unless you intend to disable hydration app-wide.
- AVOID delaying application stability (timeouts, intervals, unresolved promises, pending microtasks); hydration waits for stability.
- PREFER deferring third-party DOM-mutating scripts (ads, analytics) until after hydration, e.g. with `afterNextRender`.
- MUST add `withI18nSupport()` if components with i18n blocks should be hydrated instead of re-rendered.
- PREFER removing an explicit `withEventReplay()` when incremental hydration is on — it already enables event replay.
- MUST still provide `@placeholder` blocks on `@defer` blocks that use hydrate triggers; they render on later client-side navigations.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `ng new --ssr` / `ng add @angular/ssr` | Create / add hybrid rendering | Hydration setup is included by the CLI |
| `ServerRoute[]` (`@angular/ssr`) | Per-route server config | Usually in `app.routes.server.ts`; fields `path`, `renderMode`, `headers`, `status`, `fallback`, `getPrerenderParams` |
| `RenderMode.Server` / `.Client` / `.Prerender` | SSR per request / browser render (Angular default) / build-time SSG | |
| `provideServerRendering(options?, ...features)` | Register server rendering in `app.config.server.ts` | Options object e.g. `{maxResponseBodySize}` |
| `withRoutes(serverRoutes)` | Feature: attach server routes | |
| `withAppShell(Component)` | Feature: app shell component for CSR routes | Required with the App shell pattern |
| `getPrerenderParams(): Promise<Record<string,string>[]>` | Which param values to prerender | Prerender only; build time; `inject` allowed synchronously; catch-all key is `'**'` (value like `'foo/bar'`) |
| `PrerenderFallback.Server` / `.Client` / `.None` | Handling of non-prerendered paths | `Server` is the default |
| `headers`, `status` on `ServerRoute` | Static response headers / status code | |
| `afterNextRender(fn)` / `afterEveryRender(fn)` | Browser-only post-render code | Skipped on the server |
| `DOCUMENT` (`@angular/core`) | Platform-agnostic document | |
| `REQUEST` (`@angular/core`) | Current Web API `Request` | `null` outside request-time SSR |
| `RESPONSE_INIT` (`@angular/core`) | Web API `ResponseInit` to set headers/status at runtime | `null` outside request-time SSR |
| `REQUEST_CONTEXT` (`@angular/core`) | Extra context passed as 2nd arg of `AngularAppEngine#handle` | `null` outside request-time SSR |
| `outputMode: "static"` (`angular.json` build options) | Prerendered files only, no server file | |
| `prerender.format`: `"directory"` / `"file"` | `about/index.html` (default) vs `about.html` | Only used when no server is produced |
| `maxResponseBodySize` | Byte cap per server-side `HttpClient` fetch response body | Default 1 MB; global; exceeding → NG02825 |
| `provideClientHydration(...features)` (`@angular/platform-browser`) | Enable hydration | Also enables incremental hydration + event replay by default |
| `withHttpTransferCacheOptions({...})` | Tune HTTP transfer cache | Options below |
| `includeHeaders: string[]` | Response headers kept in cache entries | None by default |
| `filter: (req) => boolean` | Choose which requests are cached | |
| `includePostRequests` | Cache POST too | Default: only GET, HEAD, QUERY |
| `includeRequestsWithAuthHeaders` | Cache requests with `Authorization` / `Proxy-Authorization` / `Cookie` | Excluded by default |
| `includeRequestsWithCredentials` | Cache `withCredentials` / fetch `credentials: include \| same-origin` requests | Excluded by default |
| `includeNonCacheableRequests` | Cache despite `no-store`/`no-cache`/`private`, `Set-Cookie`, or fetch `cache: no-store \| no-cache` | Excluded by default |
| `transferCache` request option | Per-request override (`false` or `{includeHeaders}`) | `http.get(url, {transferCache: false})` |
| `withNoHttpTransferCache()` | Disable transfer cache globally | |
| `HTTP_TRANSFER_CACHE_ORIGIN_MAP` | Map server origins to client origins so cached requests match | |
| `withEventReplay()` | Replay pre-hydration events | Only needed with `withNoIncrementalHydration()` |
| `withNoIncrementalHydration()` | Opt out of incremental hydration | |
| `withI18nSupport()` | Hydrate components with i18n blocks | Otherwise they are skipped and re-rendered |
| `ngSkipHydration` attribute / `host: {ngSkipHydration: 'true'}` | Skip hydrating a component subtree | Component host nodes only, else error |
| `provideStabilityDebugging()` (`@angular/core`) | Log `PendingTasks` when app is slow to stabilize | Auto in dev mode with `provideClientHydration`; stays in prod bundles if added |
| `zone.js/plugins/task-tracking` | Stack traces of macrotasks blocking zone stability | Zone.js apps; not stripped from prod |
| `AngularNodeAppEngine`, `createNodeRequestHandler`, `writeResponseToNodeResponse` (`@angular/ssr/node`) | Node.js / Express server integration | |
| `AngularAppEngine`, `createRequestHandler` (`@angular/ssr`) | Non-Node servers via Web `Request`/`Response` | `handle(req)` resolves to `Response \| null` |
| `@defer (hydrate on idle[(ms)])` | Hydrate when browser idle (`requestIdleCallback`) | Optional timeout in ms |
| `@defer (hydrate on viewport)` | Hydrate when content enters viewport (IntersectionObserver) | |
| `@defer (hydrate on interaction)` | Hydrate on `click` / `keydown` | |
| `@defer (hydrate on hover)` | Hydrate on `mouseover` / `focusin` | |
| `@defer (hydrate on immediate)` | Hydrate once non-deferred content has rendered | |
| `@defer (hydrate on timer(500ms))` | Hydrate after a duration | Unit `ms` or `s` required |
| `@defer (hydrate when expr)` | Hydrate when expression is truthy | Only for the top-most dehydrated block |
| `@defer (hydrate never)` | Keep content dehydrated (static) on initial load | Blocks hydration of the whole nested subtree |

## Patterns

### Server routes and render modes
```ts
// app.routes.server.ts
import {RenderMode, PrerenderFallback, ServerRoute} from '@angular/ssr';
import {inject} from '@angular/core';

export const serverRoutes: ServerRoute[] = [
  {path: '', renderMode: RenderMode.Client},
  {path: 'pricing', renderMode: RenderMode.Prerender},
  {path: 'account', renderMode: RenderMode.Server, headers: {'X-Kind': 'account'}, status: 200},
  {
    path: 'article/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client, // default would be Server
    async getPrerenderParams() {
      const articles = inject(ArticleApi); // before any await
      const slugs = await articles.listSlugs();
      return slugs.map((slug) => ({slug}));
    },
  },
  {
    path: 'docs/:v/**',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return [{v: '1', '**': 'intro/setup'}]; // → /docs/1/intro/setup
    },
  },
  {path: '**', renderMode: RenderMode.Server},
];
```

### Server config
```ts
// app.config.server.ts
import {provideServerRendering, withRoutes, withAppShell} from '@angular/ssr';
import {ApplicationConfig} from '@angular/core';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(
      {maxResponseBodySize: 5 * 1024 * 1024}, // bytes
      withRoutes(serverRoutes),
      withAppShell(ShellCmp), // only with the App shell pattern
    ),
    {provide: Tracker, useClass: ServerTracker}, // overrides browser impl
  ],
};
```

### Browser-only code and platform-specific services
```ts
@Component({selector: 'app-box', template: `<div #box>{{ text() }}</div>`})
export class Box {
  box = viewChild.required<ElementRef>('box');
  constructor() {
    afterNextRender(() => console.log(this.box().nativeElement.offsetWidth)); // browser only
  }
}

export abstract class Tracker { abstract track(name: string): void; }
@Injectable() export class BrowserTracker implements Tracker { track(name: string) { /* 3rd-party SDK */ } }
@Injectable() export class ServerTracker implements Tracker { track(name: string) { /* server log */ } }
// app.config.ts: providers: [{provide: Tracker, useClass: BrowserTracker}]
```

### DOCUMENT and request tokens
```ts
import {inject, DOCUMENT, REQUEST, RESPONSE_INIT, Service} from '@angular/core';

@Service()
export class SeoLinks {
  private doc = inject(DOCUMENT);
  addCanonical(href: string) {
    const link = this.doc.createElement('link');
    link.rel = 'canonical';
    link.href = href;
    this.doc.head.appendChild(link);
  }
}

// in a component/service constructor
const req = inject(REQUEST); // may be null
console.log(req?.url);
```

### Static output (`angular.json`)
```json
{ "projects": { "my-app": { "architect": { "build": { "options": {
  "outputMode": "static",
  "prerender": { "format": "file" }
} } } } } }
```

### Hydration + transfer cache
```ts
import {
  bootstrapApplication, provideClientHydration, withHttpTransferCacheOptions, withI18nSupport,
} from '@angular/platform-browser';

bootstrapApplication(App, {
  providers: [
    provideClientHydration(
      withHttpTransferCacheOptions({
        includeHeaders: ['ETag'],
        filter: (req) => !req.url.includes('/api/me'),
        includePostRequests: true, // idempotent reads only
      }),
      withI18nSupport(),
    ),
  ],
});

// per request
http.get('/api/me', {transferCache: false});
http.get('/api/feed', {transferCache: {includeHeaders: ['X-Page']}});
```
- Disable globally: `provideClientHydration(withNoHttpTransferCache())`.
- Opt out of incremental hydration but keep replay: `provideClientHydration(withNoIncrementalHydration(), withEventReplay())`.
- NgModule apps: add `provideClientHydration()` to the root module `providers`.

### Skipping hydration
```html
<app-chart ngSkipHydration />
<app-contact ngSkipHydration><a href="tel:...">Call</a></app-contact>
```
```ts
@Component({selector: 'app-chart', host: {ngSkipHydration: 'true'}, template: ''})
class Chart {}
```

### Stability debugging
```ts
import {provideStabilityDebugging} from '@angular/core';
import 'zone.js/plugins/task-tracking'; // only for Zone.js apps (provideZoneChangeDetection)

bootstrapApplication(App, {providers: [provideStabilityDebugging()]});
```

### Servers
```ts
// server.ts (Node / Express)
import {AngularNodeAppEngine, createNodeRequestHandler, writeResponseToNodeResponse} from '@angular/ssr/node';
import express from 'express';

const app = express();
const engine = new AngularNodeAppEngine();
app.use((req, res, next) => {
  engine.handle(req).then((r) => (r ? writeResponseToNodeResponse(r, res) : next())).catch(next);
});
export const reqHandler = createNodeRequestHandler(app); // used by CLI dev-server and build

// server.ts (non-Node)
import {AngularAppEngine, createRequestHandler} from '@angular/ssr';
const ng = new AngularAppEngine();
export const reqHandler = createRequestHandler(async (req: Request) => {
  const res: Response | null = await ng.handle(req);
  // ...
});
```

### Incremental hydration triggers
```html
@defer (hydrate on viewport) {
  <reviews-panel />
} @placeholder {
  <div>Reviews</div>
}

@defer (on idle; hydrate on interaction) { <!-- regular trigger used on later CSR navigations -->
  <comments-list />
} @placeholder {
  <div>Comments</div>
}

@defer (hydrate on idle(500); hydrate when ready()) { <!-- any trigger fires hydration -->
  <side-widget />
} @placeholder { <div>Widget</div> }

@defer (on viewport; hydrate never) { <!-- static on first load; CSR loads on viewport -->
  <footer-links />
} @placeholder { <div>Footer</div> }

@defer (hydrate on interaction) {
  <outer-cmp />
  @defer (hydrate on hover) { <inner-cmp /> } @placeholder { <div>Inner</div> }
} @placeholder { <div>Outer</div> }
<!-- hovering inner hydrates outer first, then inner -->
```

## Pitfalls
- CSR: slower first content (JS must download/parse/run, plus follow-up data requests) and possible SEO loss since crawlers limit JS execution.
- SSR and prerendering both forbid relying strictly on browser APIs and limit browser-only libraries; SSR runs Angular per request, which can raise hosting cost.
- Prerendering can lengthen builds; generating many pages via `getPrerenderParams` grows deployment size and slows deployments.
- With the Angular service worker, only the first request is server-rendered; later ones are rendered client-side by the worker.
- Redirects (`redirectTo`): SSR sends real HTTP redirects (301/302); prerendered pages get soft redirects via `<meta http-equiv="refresh">`.
- `PrerenderFallback.None`: Angular will not handle requests for paths that were not prerendered.
- `useValue` providers on the server persist across requests until restart — accidental cross-request state.
- `REQUEST` / `RESPONSE_INIT` / `REQUEST_CONTEXT` are `null` during the build, in the browser (CSR), during SSG, and during dev route extraction.
- `HttpClient` on the server: response bodies over 1 MB (fetch backend default) fail with NG02825. Raising `maxResponseBodySize` increases memory use and denial-of-service exposure.
- CRITICAL: during SSR, Fetch buffers the full body to verify `integrity` before Angular applies `maxResponseBodySize`, so the limit does not bound that buffering.
- Transfer cache: in the browser the cache is used only during initial rendering and is dropped once the app is stable. Default caching covers only GET/HEAD/QUERY without auth headers, credentials, forbidding `Cache-Control`, fetch `cache: no-store|no-cache`, or `Set-Cookie` responses.
- Adding `Cache-Control` to `includeHeaders` only exposes it on the hydrated response; eligibility checks of `Cache-Control` happen anyway.
- Different API origins on server and client prevent cache hits unless mapped with `HTTP_TRANSFER_CACHE_ORIGIN_MAP`.
- Without hydration, an SSR app destroys and re-renders its DOM (visible flicker, worse LCP, layout shift). Hydration works only for SSR apps.
- Server/client DOM mismatches throw DOM mismatch errors; the most common cause is native DOM manipulation; invalid HTML (`<table>` without `<tbody>`, `<div>` in `<p>`, nested `<a>`) also triggers them.
- `preserveWhitespaces: true` is not yet fully supported with hydration; mismatched values between `tsconfig.server.json` and `tsconfig.app.json` break hydration.
- Custom or noop Zone.js implementations are not yet supported: changed `onStable` timing can run server serialization or client cleanup too early/late.
- `ngSkipHydration` on a non-host node throws; on a component it destroys and re-renders that whole subtree (no hydration benefits).
- NG0506 "Application remains unstable": app did not become stable within 10 seconds; hydration and post-hydration steps wait for stability.
- `provideStabilityDebugging` and `zone.js/plugins/task-tracking` are not stripped from production bundles — use them only temporarily.
- Components with i18n blocks are skipped and re-rendered by default.
- Third-party libraries that render via DOM manipulation (e.g. D3 charts) can cause mismatches — wrap with `ngSkipHydration`.
- Third-party scripts (ads, analytics) and browser extensions (click-to-call, translators, password managers) can mutate HTML before hydration; extension errors appear only for some users.
- CDN HTML rewriting breaks hydration and usually shows only in production: features that strip comments/whitespace, or Cloudflare Email Address Obfuscation (on by default, rewrites emails/`mailto:` into `<span class="__cf_email__">`). Fix with `ngSkipHydration` on the surrounding component host (it cannot go on the `<a>` itself) or turn the CDN feature off. `<!--email_off-->` comments do not help since the compiler drops template comments.
- Event replay captures native browser events (`click`, `mouseover`, `focusin`, …) before hydration and replays them after; listeners are not attached until hydration completes.
- Hydrate triggers apply only to the initial server-rendered load; later client-side renders use the regular `@defer` triggers (even with `hydrate never`).
- `hydrate when` cannot fire while its parent `@defer` block is still dehydrated — the condition lives in the parent component.
- `hydrate never` stops every `hydrate` trigger in nested content.
- Hydrating a nested `@defer` block first hydrates every dehydrated ancestor, top-down.
- Incremental hydration has the same constraints as full hydration (no direct DOM manipulation, valid HTML).
- A `@defer` with a hydrate trigger renders its main template on the server (dependencies loaded during SSR), so it can be used above the fold without layout shift.

## Version notes
- Incremental hydration (and with it event replay) is on by default with `provideClientHydration()`; opt out via `withNoIncrementalHydration()`.
- `preserveWhitespaces: true` with hydration and custom/noop Zone.js are described as "not yet fully supported" configurations.
- No developer preview / experimental / deprecated labels are stated in these pages.
