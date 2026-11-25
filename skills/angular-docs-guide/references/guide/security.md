# Security

> Sources (angular.dev, v22.3 @ bd1e32b): Security — https://angular.dev/best-practices/security.

## When to use
- Rendering user- or attacker-influenced data safely (interpolation, `[innerHTML]`, `[href]`, `[src]`, style bindings).
- Deliberately trusting a value Angular would otherwise sanitize (`DomSanitizer.bypassSecurityTrust*`) or sanitizing manually before raw DOM access.
- Setting up a Content Security Policy with nonces (`ngCspNonce`, `CSP_NONCE`) or hash-based `security.autoCsp` for static hosting.
- Enforcing Trusted Types and choosing which Angular Trusted Types policies to allow.
- Configuring `HttpClient` XSRF/CSRF cookie/header names, or disabling the built-in XSRF handling; understanding XSSI prefix stripping.
- Hardening SSR against header-based SSRF (`allowedHosts`, `trustProxyHeaders`, `NG_ALLOWED_HOSTS`, `NG_TRUST_PROXY_HEADERS`).
- See also: building forms dynamically without compiling user data into templates → references/guide/forms-reactive.md
- See also: critical CSS inlining (`optimization.styles.inlineCritical`) and build options → references/tools/cli.md

## Rules
- MUST stay on current Angular releases; updates can ship security fixes (check the changelog for security entries).
- AVOID maintaining a private, modified fork of Angular; it drifts behind and misses fixes. Contribute changes upstream instead.
- AVOID APIs that the docs flag as "_Security Risk_" (for example the `bypassSecurityTrust*` family) unless the value is truly vetted.
- NEVER build templates by concatenating user input with template syntax; templates are treated as trusted, executable code.
- MUST use the default AOT template compiler in production; dynamically compiling templates (especially with user data) via JIT defeats Angular's protections and is an anti-pattern.
- PREFER enabling both a Content Security Policy and Trusted Types enforcement as extra, DOM-level defense layers (strongly encouraged).
- PREFER Angular templates over direct DOM manipulation (`document`, `ElementRef.nativeElement`, DOM-touching third-party libraries); browser DOM APIs do not sanitize unless Trusted Types are enforced.
- MUST, when raw DOM access is unavoidable, sanitize untrusted values with `DomSanitizer.sanitize(context, value)` using the correct `SecurityContext`.
- MUST pick the `bypassSecurityTrust*` method that matches the binding's context; safety is context-dependent.
- PREFER building trusted (`SafeValue`) objects in a component method, as close to the raw input as possible, so reviewers can verify safety easily.
- MUST make CSP nonces unique per request and unguessable; predictable nonces let attackers bypass CSP.
- AVOID generating nonces at the origin server when a CDN caches HTML; generate them at the edge (CDN) just before delivery.
- NEVER hard-code a static nonce in `index.html` on static hosts without edge rewriting; use `autoCsp` or a build with no inline scripts instead.
- NEVER use the `CSP_NONCE` token when inlining critical CSS; use `security.autoCsp` or the `ngCspNonce` attribute instead.
- MUST configure Trusted Types headers in production serving, in `ng serve` (`headers` in `angular.json`), and in Karma `ng test` (`customHeaders` in `karma.config.js`).
- MUST, on the server, use a templating language that auto-escapes values, and NEVER generate Angular templates server-side with a templating language.
- MUST implement the server half of XSRF: set a JS-readable `XSRF-TOKEN` cookie (page load or first GET) and verify the `X-XSRF-TOKEN` header on eligible requests; otherwise the client protection is useless.
- MUST make the XSRF token per-user and server-verifiable; PREFER a salted digest of the auth cookie.
- PREFER a distinct XSRF cookie name per app when several Angular apps share a domain or subdomain.
- PREFER prefixing JSON responses with `")]}',\n"` server-side to block XSSI; `HttpClient` strips it automatically.
- PREFER an explicit `allowedHosts` list for SSR; AVOID `'*'` unless another layer (load balancer, reverse proxy) validates `Host` and `X-Forwarded-Host`.
- MUST only enable `trustProxyHeaders` behind a trusted proxy that strictly validates or overwrites those headers.
- MUST audit Angular apps like any web app; review every use of APIs marked security-sensitive, such as `bypassSecurityTrust*`.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| :-- | :-- | :-- |
| `DomSanitizer` (`@angular/platform-browser`) | Sanitize values or mark them trusted | Obtain via `inject(DomSanitizer)` |
| `DomSanitizer.sanitize(ctx, value)` | Manually sanitize for a `SecurityContext` | Returns trusted (`bypass*`) values unchanged |
| `bypassSecurityTrustHtml(v)` | Trust a value as HTML | Security risk; needs `angular#unsafe-bypass` under Trusted Types |
| `bypassSecurityTrustScript(v)` | Trust a value as script | Security risk |
| `bypassSecurityTrustStyle(v)` | Trust a value as CSS | Security risk |
| `bypassSecurityTrustUrl(v)` → `SafeUrl` | Trust a URL (e.g. `javascript:`) for `href` | Security risk |
| `bypassSecurityTrustResourceUrl(v)` → `SafeResourceUrl` | Trust a resource URL (`<iframe src>`, `<script src>`) | Security risk |
| `SecurityContext` | HTML, Style, URL, Resource URL contexts | Resource URLs cannot be sanitized, only trusted |
| `ngCspNonce="..."` attribute | Give Angular the CSP nonce on the root element | Use with server-side templating of `index.html`; works with critical CSS inlining |
| `CSP_NONCE` (`@angular/core`) | Provide the nonce via DI at bootstrap | Lets `index.html` be cached; incompatible with critical CSS inlining |
| `security.autoCsp: true` (angular.json build options) | Hash inline scripts, emit CSP `<meta>` | Scripts only; not with SSR |
| `provideHttpClient(withXsrfConfiguration({cookieName, headerName}))` | Rename XSRF cookie/header | Defaults `XSRF-TOKEN` / `X-XSRF-TOKEN` |
| `provideHttpClient(withNoXsrfProtection())` | Turn off built-in XSRF interceptor | Only if the mechanism doesn't fit your app |
| `security.allowedHosts` (angular.json build options) | SSR hostname allowlist | Wildcards like `*.example.com`; `*` allows all (discouraged) |
| `new AngularAppEngine({allowedHosts, trustProxyHeaders})` | Same, at engine creation | — |
| `new AngularNodeAppEngine({allowedHosts, trustProxyHeaders})` | Node variant | Also reads `NG_ALLOWED_HOSTS`, `NG_TRUST_PROXY_HEADERS` (comma-separated) |
| `trustProxyHeaders` | Which proxy headers to keep | `['forwarded']`, a list of `x-forwarded-*` names, or `true` (Forwarded + all X-Forwarded-*); default: none trusted |

### Security contexts
| Context | Applies to | Angular behavior |
| :-- | :-- | :-- |
| HTML | Interpreting a value as HTML, e.g. `[innerHtml]` | Sanitized |
| Style | CSS bound to the `style` property | — |
| URL | URL properties like `<a href>` | Sanitized |
| Resource URL | URLs loaded and run as code, e.g. `<script src>`, `<iframe src>` | Cannot be sanitized; must be explicitly trusted |

### Trusted Types policies
| Policy | Enable when |
| :-- | :-- |
| `angular` | Always (required for Angular to run under enforcement); covers inline template values and Angular-sanitized content |
| `angular#bundler` | Lazy chunks created by the CLI bundler (lazy loading) |
| `angular#unsafe-bypass` | App calls any `DomSanitizer` bypass method, e.g. `bypassSecurityTrustHtml` |
| `angular#unsafe-jit` | App uses the JIT compiler directly or runs in JIT mode via `platformBrowserDynamic` |
| `angular#unsafe-upgrade` | AngularJS hybrid using `@angular/upgrade` |

### Minimal CSP directives (nonce-based)
| Directive | Meaning |
| :-- | :-- |
| `default-src 'self'` | Load all resources from same origin |
| `style-src 'self' 'nonce-…'` | Same-origin global styles plus styles Angular inserts with the nonce |
| `script-src 'self' 'nonce-…'` | Same-origin JS plus CLI-inserted inline scripts; only needed with critical CSS inlining or subresource integrity |

## Patterns

### Interpolation vs. `[innerHTML]`
```ts
@Component({
  selector: 'app-snippet',
  template: `
    <p>{{ markup }}</p>            <!-- escaped: tags shown as text -->
    <p [innerHTML]="markup"></p>   <!-- sanitized: <script> dropped, <b> kept -->
  `,
})
export class Snippet {
  // e.g. attacker-controlled, read from the URL
  markup = 'Hi <script>alert("x")</script> <b>there</b>';
}
```

### Trusting a URL and a resource URL
```ts
import {Component, inject} from '@angular/core';
import {DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-trusted',
  template: `
    <a [href]="rawLink">sanitized</a>
    <a [href]="trustedLink">trusted</a>
    <iframe [src]="embedUrl" title="video"></iframe>
  `,
})
export class Trusted {
  private sanitizer = inject(DomSanitizer);
  rawLink = 'javascript:alert("hi")';
  trustedLink: SafeUrl = this.sanitizer.bypassSecurityTrustUrl(this.rawLink);
  embedUrl!: SafeResourceUrl;

  setVideo(id: string) {
    // Build the SafeValue right next to the input so its safety is easy to verify.
    const url = 'https://www.youtube.com/embed/' + id;
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
```
Binding a plain string to `<iframe [src]>` is refused (resource URL context); only the trusted value loads.

### CSP nonce
```html
<!-- index.html rendered per request by server-side templating -->
<app ngCspNonce="RANDOM"></app>
```
```ts
import {CSP_NONCE} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';

bootstrapApplication(App, {
  providers: [{provide: CSP_NONCE, useValue: globalThis.myRandomNonceValue}],
});
```
```txt
default-src 'self'; style-src 'self' 'nonce-RANDOM'; script-src 'self' 'nonce-RANDOM';
```
- No nonce possible at all: add `'unsafe-inline'` to `style-src`.
- Edge can rewrite cached HTML (SSI, ESI, edge function): ship `<app ngCspNonce="__CSP_NONCE__">` and substitute a fresh nonce per response.

### Static hosting without nonces
- `autoCsp`: CLI hashes every inline script (including those from critical CSS inlining and SRI), swaps `<script src>` for a hashed loader, and prepends a `<meta>` CSP like:
  ```txt
  script-src 'strict-dynamic' 'sha256-...' https: 'unsafe-inline'; object-src 'none'; base-uri 'self';
  ```
  `index.html` stays cacheable; browsers supporting hashes + `'strict-dynamic'` ignore the `https:`/`'unsafe-inline'` fallbacks. Then send in the HTTP header only `style-src 'self' 'unsafe-inline'` (no `default-src`, no `script-src`).
- No inline scripts: set `optimization.styles.inlineCritical: false` and keep `subresourceIntegrity` off, then send:
  ```txt
  default-src 'self'; style-src 'self' 'unsafe-inline';
  ```
  (`script-src 'self'` is enough for scripts.)
- Either way, runtime component `<style>` elements and the critical-CSS `<style>` need `'unsafe-inline'` in `style-src` without a per-response nonce; app code or libraries may need more directives.

### Trusted Types headers
```txt
Content-Security-Policy: trusted-types angular; require-trusted-types-for 'script';
Content-Security-Policy: trusted-types angular angular#unsafe-bypass; require-trusted-types-for 'script';
Content-Security-Policy: trusted-types angular angular#unsafe-jit; require-trusted-types-for 'script';
Content-Security-Policy: trusted-types angular angular#bundler; require-trusted-types-for 'script';
```
(Plain, with bypass methods, with JIT, with lazy loading, respectively.)

### XSRF configuration
```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withXsrfConfiguration({cookieName: 'MY_XSRF', headerName: 'X-My-Xsrf'}),
    ),
    // or: provideHttpClient(withNoXsrfProtection())
  ],
};
```

### SSR host allowlist and proxy headers
```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "security": {"allowedHosts": ["example.com", "*.example.com"]}
          }
        }
      }
    }
  }
}
```
```ts
const engine = new AngularAppEngine({
  allowedHosts: ['example.com', '*.trusted-example.com'],
  trustProxyHeaders: ['x-forwarded-host', 'x-forwarded-proto'],
});
const nodeEngine = new AngularNodeAppEngine({trustProxyHeaders: true});
```
```bash
export NG_ALLOWED_HOSTS="example.com,*.trusted-example.com"
export NG_TRUST_PROXY_HEADERS="X-FORWARDED-HOST,X-FORWARDED-PREFIX"
```

## Pitfalls
- XSS vectors go beyond `<script>`: attributes such as `onerror` on `<img>` and `javascript:` URLs in `href` also execute code.
- Interpolation always escapes; markup only renders when bound to an HTML property like `innerHTML`, and binding attacker-controlled data there is normally an XSS hole (Angular sanitizes it, removing `<script>`).
- Sanitization often leaves a value unchanged; when it does alter a value in development mode, Angular logs a console warning.
- `DomSanitizer.sanitize` does not sanitize values already marked trusted via `bypassSecurityTrust*`.
- Trusting a value that might be malicious introduces a vulnerability; when unsure, get a professional security review.
- Using any bypass method under Trusted Types requires the `angular#unsafe-bypass` policy; JIT needs `angular#unsafe-jit`; lazy chunks need `angular#bundler`; AngularJS hybrids need `angular#unsafe-upgrade`.
- In browsers without Trusted Types support, the app still works and is protected by `DomSanitizer` alone.
- A CDN caching an origin-generated nonce gives every visitor the same value, letting attackers learn and bypass it.
- `autoCsp` limits: covers scripts only (configure `style-src` yourself); browsers ignore `frame-ancestors`, `report-uri`, `sandbox` in `<meta>` CSP (send those as an HTTP header); multiple policies are all enforced, so omit `script-src` and `default-src` from any extra CSP header; cannot be combined with SSR.
- Disabling critical CSS inlining can slow first render; disabling subresource integrity drops script integrity checks.
- The `script-src` nonce is only required when critical CSS inlining or subresource integrity (which emits an import map) adds inline scripts.
- `HttpClient` sends the XSRF header only on mutating requests (e.g. `POST`) to relative or same-origin URLs, never on `GET`/`HEAD`; GET responses are shielded by the same-origin policy.
- `HttpClient` handles only the client half of XSRF; without server cookie setup and header verification the protection does nothing.
- XSSI only works when the JSON response is executable as JavaScript (relevant on older browsers).
- SSR header validation: `Host`, `X-Forwarded-Host` and the `Forwarded` `host` parameter are allowlist-checked and may not contain path separators; `X-Forwarded-Port` must be numeric; `X-Forwarded-Proto` / `Forwarded` `proto` must be `http` or `https`; `X-Forwarded-Prefix` must start with `/` and use only alphanumerics, `-`, `_` with single slashes.
- By default `Forwarded` and all `X-Forwarded-*` headers are stripped; invalid headers are logged as errors; unknown hostnames get `400 Bad Request`.
- When `Forwarded` is trusted, its `host`/`proto` override `x-forwarded-host`/`x-forwarded-proto`.
- `allowedHosts: ['*']` exposes the app to host header injection and SSRF (see GHSA-x288-3778-4hhx); many cloud/CDN providers validate these headers upstream, which reduces but does not remove the risk.
- Trusting proxy headers without a validating proxy lets attackers spoof them for SSRF.

## Version notes
- None stated in the docs.
