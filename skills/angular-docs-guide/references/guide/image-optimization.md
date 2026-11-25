# Image optimization with NgOptimizedImage

> Sources (angular.dev, v22.3 @ bd1e32b): Optimizing images with NgOptimizedImage — https://angular.dev/guide/image-optimization.

## When to use
- Speeding up the Largest Contentful Paint (LCP) image with `priority` (fetchpriority, eager loading, preload under SSR).
- Preventing layout shift and distortion by giving images `width`/`height`, or `fill` when the size is unknown.
- Replacing a CSS `background-image` with an `<img ngSrc ... fill>` inside a positioned container.
- Serving correctly sized images through automatic `srcset`, `sizes`, custom breakpoints or `ngSrcset`.
- Wiring an image CDN via a built-in loader (Cloudflare, Cloudinary, ImageKit, Imgix, Netlify) or a custom `IMAGE_LOADER`.
- Showing blurred low-resolution placeholders while images load.
- See also: server-side rendering (preload links for `priority` images) → references/guide/ssr.md

## Rules
- MUST import `NgOptimizedImage` from `@angular/common` and add it to the `imports` of the standalone component (or NgModule).
- MUST use `ngSrc` instead of `src` to activate the directive; plain `src` lets the browser start downloading before the directive can adjust `loading`.
- MUST omit the base URL from `ngSrc` when using a built-in third-party loader; the loader prepends it.
- MUST mark the page's LCP image with `priority`; more than one image may need it since the LCP element can change with screen size.
- MUST set `width` and `height` on every non-`fill` image.
- MUST use the image file's intrinsic size for `width`/`height` on responsive images, and also set `sizes`.
- MUST use the intended rendered size for `width`/`height` on fixed-size images, keeping the intrinsic aspect ratio.
- NEVER set `width`/`height` together with `fill`.
- MUST give the parent of a `fill` image `position: relative`, `fixed` or `absolute`, or it will not render correctly.
- PREFER `fill` mode when you do not know the image dimensions, or when `width`/`height` attributes block the CSS sizing you want (style the parent instead).
- PREFER fixing an aspect-ratio distortion warning by adding `height: auto` or `width: auto` to the image styles.
- MUST provide an image loader before using the boolean `placeholder` attribute; with no loader an error is thrown.
- PREFER base64 data-URL placeholders only when a loader is impossible; keep them under 4KB and use them only on critical images.
- MUST manually add `<link rel="preconnect" href="...">` in the `<head>` of `index.html` when the image origin cannot be detected (no loader, or the loader base URL passed as a variable).
- MUST pass the CDN base URL to a built-in loader as a string literal so static analysis can generate the preconnect link.
- NEVER put file names in `ngSrcset`; only width (`100w`) or density (`1x`) descriptors — the file comes from `ngSrc`.
- MUST make a custom loader honor `config.width` (even though it is optional) so that requesting multiple widths, and therefore `ngSrcset`, works.
- PREFER a single custom loader that reads a `loaderParams` flag to pick between CDNs when one page uses multiple image domains.
- PREFER publishing a loader for an unsupported CDN as a third-party package; no new built-in loaders are planned.
- PREFER mobile emulation in addition to desktop when locating the LCP element in Chrome DevTools.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `NgOptimizedImage` (`@angular/common`) | Directive enabling image best practices | Stable since v15; also stable in 13.4.0 and 14.3.0 (backport) |
| `ngSrc` | Image source; triggers the directive | Replaces `src` |
| `width` / `height` | Dimensions, required unless `fill` | Fixed: rendered size; responsive: intrinsic size |
| `priority` | Mark LCP image | Sets `fetchpriority=high`, `loading=eager`, `decoding="sync"`; SSR adds a preload `<link>` |
| `fill` | Image fills its positioned parent | No `width`/`height`; tune with `object-fit` / `object-position` |
| `sizes` | Responsive sizing hint used to build `srcset` | Lazy images get `auto` prepended; non-lazy (e.g. `priority`) keep the value as given |
| `ngSrcset` | Manual srcset descriptors | e.g. `"100w, 200w"` or `"1x, 2x"`; no file names |
| `disableOptimizedSrcset` | Turn off srcset generation for one image | Boolean attribute |
| `loading` | Override default lazy loading on non-priority images | `eager` / `auto` / `lazy`; default `lazy` unless `priority` |
| `decoding` | Image decoding strategy | `auto` (default) / `async` / `sync`; priority images always `sync` |
| `placeholder` | Boolean: loader-generated blurred low-res placeholder; or a `data:image/...;base64,...` string | Boolean form requires a loader |
| `[placeholderConfig]` | Placeholder options | `{blur: false}` disables the default CSS blur |
| `[loaderParams]` | Arbitrary object forwarded to the loader as `config.loaderParams` | Does nothing by itself |
| `loaderParams.transform` | CDN-specific transformations (string or object) | Cloudinary, Cloudflare, ImageKit, Imgix only; not Netlify |
| `IMAGE_CONFIG` | DI token for global image settings | `placeholderResolution` (default 30px wide), `breakpoints` |
| `IMAGE_LOADER` | DI token for a custom loader function | `(config: ImageLoaderConfig) => string` (absolute URL) |
| `ImageLoaderConfig` (`@angular/common`) | Loader argument | `src` required; `width`, `height`, `loaderParams` optional |
| `PRECONNECT_CHECK_BLOCKLIST` | Silence preconnect warnings for given origin(s) | Provide with `useValue` |
| `provideCloudflareLoader(baseUrl)` | Cloudflare Image Resizing loader | |
| `provideCloudinaryLoader(baseUrl)` | Cloudinary loader | |
| `provideImageKitLoader(baseUrl)` | ImageKit loader | |
| `provideImgixLoader(baseUrl)` | Imgix loader | |
| `provideNetlifyLoader(baseUrl)` | Netlify loader | No `transform` support |

### Loader types
| Loader | Behavior |
| --- | --- |
| Generic (default, no code needed) | Returns the `src` unchanged; meant for images served by the Angular app itself |
| Built-in third-party | Builds URLs following that image service's API conventions |
| Custom (`IMAGE_LOADER`) | Developer-defined; use when your service has no built-in loader |

Typical base URL shapes for built-in loaders: `https://yoursite.yourcdn.com`, `https://subdomain.yoursite.com`, `https://subdomain.yourcdn.com/yoursite`.

### Defaults
- Non-priority images: `loading=lazy`, `decoding="auto"`.
- Placeholder resolution: 30px wide.
- Responsive breakpoints: `[16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]`.
- Preconnect links: generated automatically only for domains passed literally to a loader.

## Patterns

### Basic setup and LCP image
```ts
import {Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-hero',
  imports: [NgOptimizedImage],
  template: `
    <img ngSrc="banner.jpg" width="1200" height="600" priority />
    <img ngSrc="thumb.jpg" width="300" height="200" />
  `,
})
export class Hero {}
```

### Fill mode (background-image replacement)
```html
<div class="card" style="position: relative; height: 320px">
  <img ngSrc="bg.jpg" fill style="object-fit: cover" />
</div>
```
Migration steps: remove `background-image` from the container; give it `position: relative|fixed|absolute`; add a child `<img ngSrc ... fill>` without `width`/`height`; add `priority` if it may be the LCP element.

### Responsive images and srcset
```html
<!-- Fixed size: srcset with 1x/2x generated from width/height -->
<img ngSrc="logo.png" width="400" height="200" />

<!-- Fills the viewport -->
<img ngSrc="wide.jpg" width="1600" height="900" sizes="100vw" />

<!-- Single column on small screens, two columns otherwise -->
<img ngSrc="tile.jpg" width="400" height="200" sizes="(max-width: 768px) 100vw, 50vw" />

<!-- Manual descriptors -->
<img ngSrc="hero.jpg" ngSrcset="100w, 200w, 300w" sizes="50vw" />

<!-- Opt out of srcset generation -->
<img ngSrc="about.jpg" disableOptimizedSrcset />
```

### Loading and decoding overrides
```html
<img ngSrc="below-fold.jpg" width="400" height="200" loading="eager" />
<img ngSrc="preview.jpg" width="600" height="400" decoding="async" />
<img ngSrc="hero.jpg" width="1600" height="900" decoding="sync" />
```

### Placeholders
```html
<!-- Loader-generated, blurred -->
<img ngSrc="photo.jpg" width="400" height="200" placeholder />

<!-- Inline data URL (no loader required) -->
<img ngSrc="photo.jpg" width="400" height="200" placeholder="data:image/png;base64,iVBORw0K..." />

<!-- No blur -->
<img ngSrc="photo.jpg" width="400" height="200" placeholder [placeholderConfig]="{blur: false}" />
```
To hide blurry edges, wrap the image in a `<div>` with `overflow: hidden` sized to the image (e.g. `width: fit-content`).

### Global image config
```ts
export const appConfig = {
  providers: [
    {
      provide: IMAGE_CONFIG,
      useValue: {
        placeholderResolution: 40,
        breakpoints: [16, 48, 96, 128, 384, 640, 750, 828, 1080, 1200, 1920],
      },
    },
  ],
};
```

### Built-in loader and transforms
```ts
providers: [provideImgixLoader('https://assets.example.com/')],
```
```html
<img ngSrc="pic.jpg" width="400" height="300" [loaderParams]="{transform: 'e_grayscale,r_10'}" />
<img ngSrc="pic.jpg" width="400" height="300" [loaderParams]="{transform: {e: 'grayscale', r: 10}}" />
```

### Custom loader with loaderParams
```ts
import {ImageLoaderConfig} from '@angular/common';

const cdnLoader = (config: ImageLoaderConfig): string => {
  const params: string[] = [];
  if (config.width) params.push(`w=${config.width}`);
  if (config.height) params.push(`h=${config.height}`);
  if (config.loaderParams?.['rounded']) params.push('mask=corners&corner-radius=5');
  return `https://img.example.com/${config.src}?${params.join('&')}`;
};

providers: [{provide: IMAGE_LOADER, useValue: cdnLoader}],
```
```html
<img ngSrc="avatar.jpg" width="300" height="300" [loaderParams]="{rounded: true}" />
```
(`rounded` is an invented key; `loaderParams` content is entirely up to your loader.)

### Manual preconnect and silencing the warning
```html
<!-- index.html <head> -->
<link rel="preconnect" href="https://img.example.com" />
```
```ts
providers: [{provide: PRECONNECT_CHECK_BLOCKLIST, useValue: 'https://img.example.com'}],
```

## Pitfalls
- Dev-mode warning if the LCP element is an image without `priority`.
- Dev-mode warning if no preconnect link is found for the LCP image and its origin cannot be detected automatically.
- Warnings are emitted when `width`/`height` are set incorrectly or the styling renders the image at a distorted aspect ratio.
- `placeholder` (boolean) without a configured loader throws an error.
- Large base64 placeholders bloat bundles and slow page load; at tiny resolutions, image format and save parameters strongly affect size.
- A `fill` image whose parent is not `relative`/`fixed`/`absolute` positioned does not render properly.
- Including the base URL in `ngSrc` with a built-in loader duplicates it (the loader prepends it).
- Passing the loader base URL via a variable, or using no loader, prevents automatic preconnect generation (static analysis only).
- A custom loader that ignores `width` breaks `ngSrcset` / multi-width requests.
- `transform` in `loaderParams` is ignored by the Netlify loader.
- `background-image` in CSS is not supported directly; migrate to `fill` mode.
- The `<picture>` element is not supported.
- Chrome DevTools LCP detection (Performance tab → reload profiling → "LCP" in Timings → "related node") only covers the tested viewport; also test with mobile emulation.

## Version notes
- `NgOptimizedImage` became stable in v15 and was backported as stable to 13.4.0 and 14.3.0.
- No developer preview, experimental or deprecated labels are stated in the docs.
