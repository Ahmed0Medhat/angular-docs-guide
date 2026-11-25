---
type: llm
weight: 1
---

Grade the response against each criterion. Pass only if all are met.

1. Writes a functional interceptor (`HttpInterceptorFn`) and registers it with `provideHttpClient(withInterceptors([...]))`, not a class-based `HTTP_INTERCEPTORS` provider — references/guide/http.md.
2. Reads the AuthService with `inject()` inside the interceptor function — references/guide/http.md, references/guide/di.md.
3. Flags requests to skip auth with an `HttpContextToken` (default via factory) set through `HttpContext` on the request — references/guide/http.md.
4. Adds the header on a copy made with `req.clone(...)`, never mutating the request — references/guide/http.md.
5. Retries only GET requests, up to 2 times (e.g. RxJS `retry(2)` guarded by `req.method === 'GET'`) — references/guide/http.md.
