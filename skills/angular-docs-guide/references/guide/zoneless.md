# Zoneless change detection

> Sources (angular.dev, v22.3 @ bd1e32b): Zoneless — https://angular.dev/guide/zoneless.

## When to use
- Confirming an app runs zoneless (the default since v21) or turning it on in a v20 app.
- Stripping `zone.js` out of `angular.json` polyfills, `polyfills.ts` and `package.json`.
- Auditing components and libraries so every state change notifies Angular (signals, `markForCheck`, `AsyncPipe`, listeners).
- Replacing `NgZone.onStable` / `onMicrotaskEmpty` / `onUnstable` / `isStable` usages.
- Keeping SSR serialization waiting on async work with `PendingTasks` / `pendingUntilEvent`.
- Writing or migrating `TestBed` tests and catching missed notifications with `provideCheckNoChangesConfig`.
- See also: `OnPush` and skipping component subtrees → references/best-practices/performance.md

## Rules
- MUST NOT do anything extra to enable zoneless on v21+; MUST verify `provideZoneChangeDetection` is not registered anywhere, since it overrides the default.
- MUST add `provideZonelessChangeDetection()` to bootstrap providers (standalone `bootstrapApplication` or the root `NgModule`) when on Angular v20.
- PREFER removing ZoneJS from the build entirely: drop `zone.js` and `zone.js/testing` from the `polyfills` option of both the `build` and `test` targets in `angular.json`.
- MUST delete `import 'zone.js';` and `import 'zone.js/testing';` from an explicit `polyfills.ts` if the project has one.
- PREFER uninstalling the package afterwards (`npm uninstall zone.js`) once nothing in the build loads it.
- MUST trigger change detection only through notifying APIs: `ChangeDetectorRef.markForCheck` (also invoked by `AsyncPipe`), `ComponentRef.setInput`, setting a signal that a template reads, bound host/template listener callbacks, or attaching a view already marked dirty by one of these.
- PREFER `ChangeDetectionStrategy.OnPush` for application components as a step toward zoneless compatibility; it is recommended, not required.
- AVOID `OnPush` on a library component that hosts user components (e.g. created via `ViewContainerRef.createComponent`), because a non-`OnPush`-compatible child relying on ZoneJS would never refresh. Content projection or a template-ref input does not count as hosting.
- MAY keep `ChangeDetectionStrategy.Eager` on a component as long as it notifies Angular itself (`markForCheck`, signals, `AsyncPipe`, etc.).
- MUST remove usages of `NgZone.onMicrotaskEmpty`, `NgZone.onUnstable` and `NgZone.onStable` from apps and libraries; NEVER gate logic on `NgZone.isStable`.
- PREFER `afterNextRender` to wait for one change detection pass, `afterEveryRender` when the condition may take several rounds, and direct DOM APIs such as `MutationObserver` when you are really waiting for a DOM state.
- NEVER strip out `NgZone.run` / `NgZone.runOutsideAngular` just for zoneless — they are compatible, and removing them can slow down libraries used by apps that still run ZoneJS.
- MUST register async work that should block SSR serialization with the `PendingTasks` service when not using ZoneJS; serialization proceeds the first moment no pending task remains.
- PREFER `PendingTasks.run(asyncFn)` for the simple case; use `add()` plus calling the returned cleanup function in a `finally` block for complex flows.
- MUST connect reactive-forms state used by a template to a notification (e.g. `ChangeDetectorRef.markForCheck()`) or expose it through signals the template reads.
- PREFER `await fixture.whenStable()` over `fixture.detectChanges()` in new tests so Angular, not the test, decides when to synchronize.
- AVOID rewriting existing suites solely to replace `fixture.detectChanges()`; it is usually not worth it.
- MUST fix production components flagged by `TestBed` (missing notification) by moving state to signals or calling `ChangeDetectorRef.markForCheck()`.
- MAY use `ChangeDetectionStrategy.Eager` plus `fixture.changeDetectorRef.markForCheck()` only for a wrapper component that exists purely for tests.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `provideZonelessChangeDetection()` | Enables zoneless change detection | Needed in v20; zoneless is the default in v21+. Optional in `TestBed` (forces zoneless behavior). |
| `provideZoneChangeDetection()` | Opts back into ZoneJS-based change detection | Overrides the zoneless default; add to `TestBed` providers to test with zones. |
| `ChangeDetectorRef.markForCheck()` | Notifies Angular a view needs checking | Called automatically by `AsyncPipe`. |
| `ComponentRef.setInput()` | Sets an input and notifies | One of the change-detection notifications. |
| `ChangeDetectionStrategy.OnPush` | Restricts checks to notified views | Recommended for app components. |
| `ChangeDetectionStrategy.Eager` | Non-`OnPush` strategy | Fine if the component notifies Angular itself. |
| `NgZone.onMicrotaskEmpty` / `onStable` / `onUnstable` | Zone stability observables | Never emit when zoneless — remove. |
| `NgZone.isStable` | Zone stability flag | Always `true` when zoneless — do not branch on it. |
| `NgZone.run` / `NgZone.runOutsideAngular` | Run inside/outside the zone | Compatible with zoneless; keep them. |
| `afterNextRender` | Run once after the next render | Replacement for waiting on a single change detection. |
| `afterEveryRender` | Run after every render | Replacement when a condition spans multiple rounds. |
| `PendingTasks` | Marks app unstable until async work finishes (SSR serialization) | `run(asyncFn)`; `add()` returns a cleanup function. Used internally by Router navigation and `HttpClient` requests, among others. |
| `pendingUntilEvent()` | RxJS operator from `rxjs-interop` | Keeps the app unstable until the observable emits, completes, errors or is unsubscribed. |
| `fixture.whenStable()` | Await Angular-scheduled synchronization in tests | Preferred over `detectChanges()`. |
| `fixture.changeDetectorRef` | Fixture host view's change detector | Its `markForCheck()` does not refresh an `OnPush` component's template. |
| `provideCheckNoChangesConfig({exhaustive: true, interval: ms})` | Periodically verifies no binding changed without a notification | [developer preview]; throws `ExpressionChangedAfterItHasBeenCheckedError` on a missed update. |

## Patterns

Enable zoneless on Angular v20:

```ts
// Standalone
bootstrapApplication(RootCmp, {providers: [provideZonelessChangeDetection()]});

// NgModule
@NgModule({providers: [provideZonelessChangeDetection()]})
export class RootModule {}
platformBrowser().bootstrapModule(RootModule);
```

Drop ZoneJS from the build:

```shell
# after removing zone.js / zone.js/testing from angular.json polyfills (build + test)
npm uninstall zone.js
```

Replace zone stability observables:

```ts
// Before: ngZone.onStable.pipe(take(1)).subscribe(() => measure());
afterNextRender(() => measure());          // one render
afterEveryRender(() => { if (ready()) measure(); }); // condition across several renders
```

Block SSR serialization on async work:

```ts
const tasks = inject(PendingTasks);

// simple
tasks.run(async () => {
  this.profile.set(await loadProfile());
});

// manual
const done = tasks.add();
try {
  await loadProfile();
} catch {
  // handle failure
} finally {
  done();
}

// observable
readonly items$ = items$.pipe(pendingUntilEvent());
```

Reactive forms state shown in a zoneless template:

```ts
private readonly cdr = inject(ChangeDetectorRef);
constructor() {
  this.form.valueChanges.subscribe(() => this.cdr.markForCheck());
}
// ...or mirror the needed values into signals the template reads
```

Zoneless `TestBed` test:

```ts
TestBed.configureTestingModule({
  providers: [provideZonelessChangeDetection()], // optional; zoneless is already the default
});
const fixture = TestBed.createComponent(ProfileCmp);
await fixture.whenStable();
```

Debug check for missed notifications:

```ts
providers: [provideCheckNoChangesConfig({exhaustive: true, interval: 1000})]
```

## Pitfalls
- With zoneless active, `onMicrotaskEmpty`, `onStable` and `onUnstable` simply never fire, and `isStable` is permanently `true` — code waiting on them silently stalls or misbehaves.
- Reactive forms methods (`setValue`, `patchValue`, `FormArray.push`, etc.) update state and emit observables but do not schedule component change detection on their own.
- SSR without ZoneJS will serialize as soon as no pending task exists; async work not tracked by `PendingTasks` / `pendingUntilEvent` can be missing from the rendered output.
- `TestBed` runs zoneless by default even if `zone.js` is still in the test polyfills; add `provideZoneChangeDetection()` to get zone behavior.
- `TestBed` enforces `OnPush` compatibility of the fixture's component and throws `ExpressionChangedAfterItHasBeenCheckedError` when a template value changed with no notification (e.g. assigning `fixture.componentInstance.someValue` directly).
- `fixture.detectChanges()` forces a pass Angular might not have scheduled, masking missing notifications that would break in production.
- `fixture.changeDetectorRef.markForCheck()` targets the fixture's host view, so it will not refresh an `OnPush` component; needing it usually means the component is not fully reactive or not zoneless compatible.
- `provideCheckNoChangesConfig` throws `ExpressionChangedAfterItHasBeenCheckedError` for any binding that zoneless change detection would not have refreshed.

## Version notes
- [v21+] Zoneless change detection is the default; no provider needed.
- [v20] Enable via `provideZonelessChangeDetection()` at bootstrap.
- [developer preview] `provideCheckNoChangesConfig`.
