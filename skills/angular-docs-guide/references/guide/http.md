# HTTP client

> Sources (angular.dev, v22.3 @ bd1e32b): Overview — https://angular.dev/guide/http,
> Setting up HttpClient — https://angular.dev/guide/http/setup,
> Making requests — https://angular.dev/guide/http/making-requests,
> Reactive data fetching with httpResource — https://angular.dev/guide/http/http-resource,
> Intercepting requests and responses — https://angular.dev/guide/http/interceptors,
> Testing — https://angular.dev/guide/http/testing.

## When to use
- Calling a backend API (GET/POST/PUT/...) with typed results, URL params, headers and timeouts (`HttpClient`).
- Loading data reactively from signals, with loading/error/value exposed as signals (`httpResource`).
- Configuring the client: interceptors, XHR backend, XSRF, child-injector chaining (`provideHttpClient` + `with*` features).
- Adding cross-cutting behavior to every request: auth headers, logging, caching, retries, redirect/CORS inspection (interceptors).
- Tuning fetch-level behavior: `keepalive`, HTTP cache, priority, CORS mode, redirects, credentials, referrer, integrity.
- Unit-testing HTTP code and interceptors with a mocked backend (`provideHttpClientTesting`, `HttpTestingController`).
- See also: the generic `resource` API behind `httpResource` → references/guide/signals.md
- See also: SSR response body size limit (`maxResponseBodySize`) → references/guide/ssr.md
- See also: `takeUntilDestroyed` for cleaning up requests → references/ecosystem/rxjs-interop.md
- See also: XSRF and other security guidance → references/guide/security.md

## Rules
- PREFER relying on the default `HttpClient` (injectable without setup since v21); add `provideHttpClient(...)` only to configure features such as interceptors or XSRF.
- PREFER functional interceptors (`withInterceptors`) over DI-based class interceptors; their ordering is predictable.
- MUST call `withInterceptorsFromDi()` for class-based `HTTP_INTERCEPTORS` providers to run at all.
- MUST have an `HttpClient` configured in a parent injector before using `withRequestsMadeViaParent()`; otherwise it throws at runtime.
- NEVER use `withXhr()` in SSR apps; keep the default `fetch` backend on the server.
- AVOID JSONP (`withJsonpSupport`, `.jsonp()`); use regular requests with CORS for cross-domain data.
- PREFER `provideHttpClient` over `HttpClientModule`, especially when several injectors configure HTTP.
- MUST treat the generic on `get<T>()` etc. as an unchecked type assertion; prefer `unknown` when the payload shape is uncertain, or validate it.
- MUST keep `responseType` and `observe` as literal types (`'text' as const`, `'response' as const`) when the options object is not an inline literal.
- MUST `.subscribe()` to mutation requests (POST/PUT/...); a cold `Observable` sends nothing until subscribed.
- MUST create new `HttpParams` / `HttpHeaders` from the return value of `set()` / `append()`; instances are immutable.
- MUST set `withXhr()` if you need upload progress; the fetch backend throws when `reportUploadProgress` is set.
- PREFER `priority: 'high'` for requests that affect LCP and `'low'` for requests that do not shape the first view.
- PREFER `mode: 'same-origin'` in the browser for sensitive requests that must never leave the origin.
- AVOID combining `credentials` with `withCredentials`; `withCredentials: true` always wins and forces `'include'`.
- PREFER `referrer: ''` and conservative `referrerPolicy` values (`'no-referrer'`, `'origin'`, `'strict-origin-when-cross-origin'`) for privacy-sensitive calls.
- PREFER cleaning up subscriptions when the owning component is destroyed; `async` pipe and `toSignal` do it for you.
- PREFER wrapping `HttpClient` calls in injectable services rather than calling it straight from components.
- AVOID `httpResource` for mutations (`POST`, `PUT`); call `HttpClient` directly.
- MUST guard `resource.value()` reads with `hasValue()`; reading `value` in error state throws.
- MUST clone (`req.clone({...})`) to change a request or response in an interceptor; never mutate it in place.
- MUST make body-mutating interceptors safe to run more than once on the same request (bodies are not deep-protected).
- MUST list `provideHttpClient(...)` before `provideHttpClientTesting()` in test providers.
- PREFER testing one interceptor at a time; call `HttpTestingController.verify()` (e.g. in `afterEach`) to catch stray requests.

## API cheat-sheet
| API | Purpose | Notes / version tag |
|---|---|---|
| `HttpClient` (`@angular/common/http`) | Verb methods returning cold `Observable`s | Injectable by default in v21+ |
| `provideHttpClient(...features)` | Configure client in `ApplicationConfig` or NgModule `providers` | Overrides parent-injector config unless `withRequestsMadeViaParent()` |
| `withXhr()` | Switch from `fetch` (default) to `XMLHttpRequest` | Needed for upload progress; server XHR **deprecated**, removal planned for Angular 23 |
| `withInterceptors([fn, ...])` | Register functional interceptors | Run in listed order |
| `withInterceptorsFromDi()` | Enable class interceptors from `HTTP_INTERCEPTORS` | Run in provider-registration order |
| `withRequestsMadeViaParent()` | After local interceptors, hand request to parent's `HttpClient` | Parent `HttpClient` required |
| `withJsonpSupport()` / `.jsonp()` | JSONP GET | **Deprecated** (XSS risk) |
| `withXsrfConfiguration(...)` | Customize built-in XSRF protection | |
| `withNoXsrfProtection()` | Turn XSRF protection off | |
| `HttpClientModule` | Legacy = `provideHttpClient(withInterceptorsFromDi(), withXhr())` | **Deprecated** |
| `HttpClientJsonpModule` | Legacy = `withJsonpSupport()` | **Deprecated** |
| `HttpClientXsrfModule.withOptions()` / `.disable()` | Legacy = `withXsrfConfiguration()` / `withNoXsrfProtection()` | **Deprecated** |
| `get<T>(url, opts?)` | GET; untyped result is `Object` | Generic is not runtime-checked |
| `post<T>(url, body, opts?)` | POST with body before options | Body serialization table below |
| `HttpParams` / `HttpParameterCodec` | Query params; custom encoding via `new HttpParams({encoder})` | Default codec `HttpUrlEncodingCodec`; immutable |
| `HttpHeaders` | Header builder | Immutable |
| `HttpContext` / `HttpContextToken<T>(() => default)` | Per-request metadata for interceptors | Context is **mutable** (survives retries) |
| `HttpRequest.clone({...})` | Produce a modified request | |
| `HttpResponse` | Build synthetic responses (`new HttpResponse({body})`) | |
| `HttpErrorResponse` | All failures, via the error channel | `status` 0 for network/timeout |
| `HttpEventType` | `Sent`, `UploadProgress`, `ResponseHeader`, `DownloadProgress`, `Response`, `User` | `User` = custom interceptor event |
| `HttpHandlerFn` | `next` in functional interceptors | |
| `HttpInterceptor` / `HttpHandler` / `HTTP_INTERCEPTORS` | Class-based interceptor (`intercept(req, handler)` → `handler.handle(req)`) | `multi: true` provider |
| `httpResource(() => url \| request, opts?)` | Eager, signal-driven GET-style fetch | JSON by default |
| `httpResource.text` / `.blob` / `.arrayBuffer` | Alternate `value()` types | |
| `httpResource` option `parse` | Validate/transform response; its return type types `value` | e.g. Zod `schema.parse` |
| `httpResource` option `injector` | Create outside an injection context (e.g. tests) | |
| resource `progress` signal | Latest `HttpProgressEvent` when `reportProgress: true` | Download progress only |
| `provideHttpClientTesting()` (`@angular/common/http/testing`) | Swap real network for a test backend; provides `HttpTestingController` | |
| `HttpTestingController.expectOne(match, desc?)` | Assert exactly one matching request; returns `TestRequest` | Fails if >1 match |
| `.match(match)` | Return all matching requests (removed from later matching) | You flush/verify them |
| `.expectNone(match)` | Assert no match | |
| `.verify()` | Assert no outstanding requests | |
| `TestRequest.flush(body, {status, statusText}?)` / `.error(ProgressEvent)` | Answer with data/backend error, or simulate network error | |

### Request options (`HttpClient`)
| Option | Values / default | Notes |
|---|---|---|
| `responseType` | `'json'` (default), `'text'`, `'arraybuffer'`, `'blob'` | Literal type required |
| `observe` | body (default), `'response'`, `'events'` | Literal type required |
| `params` / `headers` | object literal or `HttpParams` / `HttpHeaders` | |
| `context` | `HttpContext` | Read by interceptors |
| `reportUploadProgress` / `reportDownloadProgress` | off by default (performance cost) | Upload needs `withXhr()` |
| `timeout` | ms | Backend request only; interceptor delays not counted |
| `keepalive` | boolean | Request can outlive the page (analytics/logging) |
| `cache` | e.g. `'force-cache'`, `'no-cache'`, `'only-if-cached'` | Browser HTTP cache interaction |
| `priority` | `'high'`, `'low'`, `'auto'` (default) | |
| `mode` | `'same-origin'`, `'cors'` (default), `'no-cors'` (opaque) | |
| `redirect` | `'follow'` (default), `'error'`, `'manual'` | |
| `credentials` | `'omit'`, `'same-origin'` (default), `'include'` | Overridden by `withCredentials: true` |
| `withCredentials` | boolean | Legacy, still supported; `true` ⇒ `'include'` |
| `referrer` | URL, `''` (none), `'about:client'` (default) | |
| `referrerPolicy` | `no-referrer`, `no-referrer-when-downgrade`, `origin`, `origin-when-cross-origin`, `same-origin`, `strict-origin`, `strict-origin-when-cross-origin` (browser default), `unsafe-url` | `unsafe-url` may leak data |
| `integrity` | `'sha256-...'` etc. | Mismatch ⇒ network error |

Fetch options (`keepalive` through `integrity`) apply to the fetch backend, which is the default.

### Body serialization
| `body` | Sent as |
|---|---|
| string | plain text |
| number, boolean, array, plain object | JSON |
| `ArrayBuffer` | raw bytes |
| `Blob` | raw bytes using the Blob's content type |
| `FormData` | `multipart/form-data` |
| `HttpParams` / `URLSearchParams` | `application/x-www-form-urlencoded` |

### Fetch-backend response extras (seen in interceptors)
- `redirected`: true when the response came via a redirect; `url` is the final URL.
- `responseType`: `'basic'` (same-origin), `'cors'`, `'opaque'` (no-CORS, limited data), `'opaqueredirect'`, `'error'` (network failure).

## Patterns

### Configure and inject
```ts
export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([logInterceptor, authInterceptor]))],
};

@Service()
export class ProductApi {
  private http = inject(HttpClient);
  load(id: string): Observable<Product> {
    return this.http.get<Product>(`/api/products/${id}`);
  }
}
```

### Options: params, headers, full response, literal types
```ts
const params = new HttpParams().set('sort', 'asc').set('page', '2'); // chain return values
http.get<Product[]>('/api/products', {params, headers: {'X-Trace': 'on'}, timeout: 5000});

const opts = {observe: 'response' as const, responseType: 'text' as const};
http.get('/api/health', opts).subscribe((res) => console.log(res.status, res.body));

http.post('/api/products', draft).subscribe(); // must subscribe to send
```

### Download progress events
```ts
http.get('/api/export', {reportDownloadProgress: true, observe: 'events'}).subscribe((ev) => {
  if (ev.type === HttpEventType.DownloadProgress) console.log(ev.loaded, ev.total);
  if (ev.type === HttpEventType.Response) console.log('done');
});
```

### Error handling
```ts
http.get<Product>('/api/products/1').pipe(
  retry(2),                                   // transient failures
  catchError((err: HttpErrorResponse) => of(null)), // status 0 = network/timeout
);
```

### httpResource
```ts
productId = input.required<string>();
product = httpResource<Product>(() => `/api/products/${this.productId()}`);
report = httpResource.blob(() => ({url: `/api/reports/${this.productId()}`, reportProgress: true}));
received = computed(() => this.report.progress()?.loaded ?? 0);
checked = httpResource(() => `/api/people/${this.productId()}`, {parse: personSchema.parse});
```
```html
@if (product.hasValue()) {
  <product-card [product]="product.value()" />
} @else if (product.error()) {
  <p>Failed to load</p>
} @else if (product.isLoading()) {
  <p>Loading…</p>
}
```

### Functional interceptor with context token
```ts
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  if (req.context.get(SKIP_AUTH)) return next(req);
  const token = inject(TokenStore).current();             // injection context available
  return next(req.clone({headers: req.headers.append('X-Auth', token)})).pipe(
    tap((ev) => {
      if (ev.type === HttpEventType.Response && ev.redirected) console.log('redirected to', ev.url);
    }),
  );
}

http.get('/public', {context: new HttpContext().set(SKIP_AUTH, true)});
```

### Class-based interceptor
```ts
@Injectable()
export class TimingInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, handler: HttpHandler): Observable<HttpEvent<unknown>> {
    return handler.handle(req);
  }
}
// providers: provideHttpClient(withInterceptorsFromDi()),
//            {provide: HTTP_INTERCEPTORS, useClass: TimingInterceptor, multi: true}
```

### Testing a service
```ts
TestBed.configureTestingModule({
  providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
});
const backend = TestBed.inject(HttpTestingController);
const result = firstValueFrom(TestBed.inject(ProductApi).load('7'));

const req = backend.expectOne({method: 'GET', url: '/api/products/7'}, 'load product');
expect(req.request.headers.has('X-Auth')).toBe(true);
req.flush({id: '7'});                 // or req.flush('x', {status: 500, statusText: 'Server Error'})
                                      // or req.error(new ProgressEvent('offline'))
expect(await result).toEqual({id: '7'});

afterEach(() => TestBed.inject(HttpTestingController).verify());
```

### Testing an httpResource
```ts
const id = signal(0);
const res = httpResource(() => `/items/${id()}`, {injector: TestBed.inject(Injector)});
TestBed.tick();                                        // runs the effect that fires the request
backend.expectOne('/items/0').flush(42);
await TestBed.inject(ApplicationRef).whenStable();     // propagate into the resource
expect(res.value()).toEqual(42);
```

## Pitfalls
- `HttpClient` observables are cold: each subscription is a separate request; nothing is sent without one. `httpResource` instead fires eagerly.
- Unsubscribing aborts the in-flight request (useful with `async` pipe and `switchMap`); `httpResource` likewise cancels a pending request when its signals change.
- `HttpClient` observables normally complete after the response, but interceptors can change that.
- If the injector providing `HttpClient` (fetch backend) is destroyed (aborted SSR request, destroyed child `EnvironmentInjector`), in-flight requests are aborted with neither `complete` nor `error`: a `firstValueFrom`/`lastValueFrom` promise never settles and its `finally` never runs. Register cleanup with `DestroyRef.onDestroy()` or pipe `takeUntilDestroyed()` before converting.
- Failure shapes in `HttpErrorResponse`: timeout → `status` 0, `error` is a `DOMException` named `TimeoutError`; network → `status` 0, `error` is what `fetch` threw (a `ProgressEvent` with `withXhr()`); backend → real status and the response body as `error`.
- `timeout` does not cover the interceptor chain, only the backend call.
- Setting `reportUploadProgress` on the fetch backend throws; fetch emits no upload progress.
- Server-side XHR (`xhr2`) can leak `Authorization` headers across cross-origin redirects and is open to redirect-loop DoS.
- During SSR on Node.js (Undici fetch): CORS is not enforced, so `mode: 'same-origin'` restricts nothing — allowlist user-influenced URLs; `credentials: 'include'` does not forward the browser's cookies; explicitly added `Cookie`/`Authorization` headers are kept, and Undici allows some browser-forbidden headers — forward credentials only to trusted origins.
- During SSR, `integrity` checking buffers the whole body before `maxResponseBodySize` is enforced, so that limit does not cap it.
- `HttpClientModule` in multiple injectors gives poorly defined interceptor behavior that depends on import/provider order.
- DI-based interceptors follow provider registration order, which is hard to predict in deep injector hierarchies.
- Request/response bodies are not deeply immutable; `HttpContext` is mutable and changes persist across retries of the same request.
- `HttpContextToken` defaults come from a factory so object/array defaults are per request.
- `httpResource` uses `reportProgress` (download only), unlike `HttpClient`.
- `expectOne` fails on more than one match; expectation APIs match the full URL including query string.
- Putting `provideHttpClientTesting()` before `provideHttpClient()` can break tests, since the testing provider overrides parts of it.

## Version notes
- [v21+] `HttpClient` can be injected by default without calling `provideHttpClient`.
- [deprecated] XHR on the server (`withXhr()` in SSR); intended for removal in Angular 23.
- [deprecated] `withJsonpSupport`, `HttpClientJsonpModule`, `HttpClient.jsonp()`.
- [deprecated] `HttpClientModule`, `HttpClientXsrfModule`.
- [deprecated] `reportProgress` on `HttpClient`, replaced by `reportUploadProgress` / `reportDownloadProgress` (still the option name on `httpResource`).
- `withCredentials` is described as the legacy approach, still supported.
