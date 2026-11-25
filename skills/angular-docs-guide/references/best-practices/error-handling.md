# Unhandled errors

> Sources (angular.dev, v22.3 @ bd1e32b): Unhandled errors in Angular — https://angular.dev/best-practices/error-handling.

## When to use
- Deciding where errors should be handled (call site vs. global handler)
- Providing a custom `ErrorHandler` to report fatal errors to logging/analytics
- Understanding which errors Angular catches for you and which it does not
- Making tests fail on (or tolerate) errors caught by the framework
- Catching browser-global or server-process errors with Angular's global listeners
- See also: Angular elements (startup errors) → references/guide/elements.md
- See also: server-side rendering → references/guide/ssr.md

## Rules
- PREFER handling errors at the call site (`try...catch`, RxJS `catchError`) where the failed operation's context is available; avoid overly general error reporting.
- MUST handle errors thrown by APIs your own code calls directly; Angular does not catch those.
- MUST provide a custom `ErrorHandler` in the `ApplicationConfig` passed to `bootstrapApplication`.
- PREFER using `ErrorHandler` mainly to report potentially fatal, unexpected errors to error tracking/logging, not as general error handling.
- PREFER handling global errors in most apps, via `provideBrowserGlobalErrorListeners()` or your own listeners; if you add custom listeners you can drop the provider.
- PREFER keeping TestBed's default rethrow; only set `rethrowApplicationErrors: false` for tests that specifically verify the app survives errors.
- MUST move code that may throw during root module/component creation to run after startup: `setTimeout(...)`, an `APP_BOOTSTRAP_LISTENER`, or define custom elements in `ngDoBootstrap` rather than the root module constructor.

## API cheat-sheet
| API | Purpose | Notes / version tag |
|---|---|---|
| `ErrorHandler` | Receives errors Angular catches (unexpected errors) | Root handler; implement `handleError(error)` |
| `{provide: ErrorHandler, useClass: ...}` | Register a custom handler | In `ApplicationConfig` for `bootstrapApplication` |
| `provideBrowserGlobalErrorListeners()` | Adds window `'error'` and `'unhandledrejection'` listeners forwarding to `ErrorHandler` | Included by default in new CLI apps |
| `TestBed.configureTestingModule({rethrowApplicationErrors: false})` | Stop TestBed rethrowing framework-caught errors | Default is to rethrow |
| `APP_BOOTSTRAP_LISTENER` | Run code after bootstrap | Avoids startup-time error loss |
| `ngDoBootstrap` | Place to define custom elements | Instead of root module constructor |

What reaches `ErrorHandler`:
| Source | Reported? |
|---|---|
| Code the framework calls (constructors, lifecycle hooks of components in templates) | Yes |
| Methods your code calls directly (e.g. a service method) | No; handle yourself |
| Async errors where Angular waits on the result and the error isn't exposed as state (`AsyncPipe`, `PendingTasks.run`) | Yes |
| `resource` errors | No; exposed via `status` and `error` |
| Errors while root module/component is still being created | No; behave as plain uncaught errors |

Global listeners:
| Environment | Listeners |
|---|---|
| Browser (with `provideBrowserGlobalErrorListeners()`) | `'error'`, `'unhandledrejection'` → `ErrorHandler` |
| SSR server process (added automatically) | `'unhandledRejection'` and `'uncaughtException'` → logged to console, server does not crash |
| SSR server process with Zone.js | Only `'unhandledRejection'` (zone errors already go to `ErrorHandler`) |

## Patterns

### Custom ErrorHandler
```ts
export class ReportingErrorHandler implements ErrorHandler {
  private tracker = inject(Telemetry);
  private router = inject(Router);

  handleError(error: any) {
    this.tracker.log({kind: 'exception', where: this.router.url, msg: error?.message ?? 'unknown'});
    console.error(error);
  }
}

bootstrapApplication(App, {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {provide: ErrorHandler, useClass: ReportingErrorHandler},
  ],
});
```

### Handle at the call site
```ts
this.api.loadUser(id).pipe(
  catchError(() => { this.message.set('Could not load user'); return EMPTY; }),
).subscribe(/* ... */);
```

## Pitfalls
- Unhandled errors can cause unexpected behavior and an unresponsive UI.
- Errors reported to `ErrorHandler` may mean the app state is corrupted or unrecoverable.
- Errors thrown before the root instance exists (common with Angular elements whose tag is already in the page, which upgrades immediately and runs constructor/`ngOnInit`) are not sent to `ErrorHandler` and can be lost; `provideBrowserGlobalErrorListeners()` can help catch them.
- Errors reaching global scope may crash non-browser processes, or go unreported in the browser console.

## Version notes
- None stated in the docs.
