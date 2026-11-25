# RxJS interop (`@angular/core/rxjs-interop`)

> Sources (angular.dev, v22.3 @ bd1e32b): Signals interop — https://angular.dev/ecosystem/rxjs-interop,
> Component output interop — https://angular.dev/ecosystem/rxjs-interop/output-interop,
> Unsubscribing with takeUntilDestroyed — https://angular.dev/ecosystem/rxjs-interop/take-until-destroyed.

## When to use
- Reading an Observable's latest value as a signal anywhere in the app, as a more flexible alternative to the `async` pipe
- Feeding a signal into an RxJS pipeline (e.g. `switchMap` to an HTTP call when a query signal changes)
- Loading async data with a resource whose source is an Observable (`rxResource`)
- Exposing an Observable as a component/directive output, or consuming an output as an Observable
- Auto-unsubscribing from Observables when a component or directive is destroyed
- See also: `resource` and resource loaders → references/guide/signals.md
- See also: component outputs and lifecycle → references/guide/components.md
- See also: injection context → references/guide/di.md

## Rules
- MUST call `toSignal`, `toObservable` and argument-less `takeUntilDestroyed` in an injection context (e.g. constructor or field initializer of a component/service), or pass an explicit `Injector` (`toSignal`/`toObservable`) / `DestroyRef` (`takeUntilDestroyed`).
- AVOID calling `toSignal` repeatedly for the same Observable; each call creates a subscription. Reuse the returned signal.
- PREFER `initialValue` when the Observable does not emit synchronously; otherwise the signal is `undefined` until the first emission.
- PREFER `requireSync: true` for Observables guaranteed to emit on subscribe (e.g. `BehaviorSubject`); the signal type then excludes `undefined`.
- PREFER `manualCleanup: true` only for Observables that complete on their own; it disables auto-unsubscribe on destroy.
- PREFER an `equal` function on `toSignal` when emissions differ by reference but are logically the same; equal values do not update the signal.
- MUST call `outputFromObservable` only in component or directive property initializers.
- PREFER plain `output()` when values can be emitted imperatively instead of `outputFromObservable`.
- PREFER `OutputRef.subscribe` directly over `outputToObservable` when it is enough.
- MUST make the `rxResource` `stream` Observable emit a value or an error before completing (see error NG0991).
- PREFER `takeUntilDestroyed()` over the `takeUntil` + destroy-Subject pattern to avoid subscription leaks.

## API cheat-sheet
| API | Purpose | Notes / version tag |
|---|---|---|
| `toSignal(obs$, opts?)` | Signal tracking an Observable's latest value | Subscribes immediately; auto-unsubscribes when the creating component/service is destroyed |
| `opts.initialValue` | Value before the first emission | Without it the signal reads `undefined` (like `async` returning `null`) |
| `opts.requireSync` | Enforce synchronous emission on subscribe | No `undefined` in the type, no initial value needed |
| `opts.manualCleanup` | Turn off auto-unsubscribe on destroy | For self-completing Observables |
| `opts.equal` | Custom equality between consecutive emissions | Equal → signal not updated |
| `opts.injector` | Injector when outside an injection context | Also on `toObservable` |
| `toObservable(sig, opts?)` | Observable tracking a signal | Uses an `effect` + `ReplaySubject` |
| `rxResource({params, stream})` | Resource whose data comes from an Observable | `stream({params})` returns an Observable; otherwise same API as `resource` |
| `outputFromObservable(obs$)` | Output that emits whenever `obs$` emits | Subscriptions forwarded to `obs$`; stops on destroy |
| `outputToObservable(outputRef)` | Observable from a component output | e.g. `Observable<number>` from `output<number>()` |
| `takeUntilDestroyed(destroyRef?)` | Operator completing the stream on destroy | Omit the arg only in an injection context |

## Patterns

### Observable → signal
```ts
@Component({template: `{{ ticks() }}`})
export class Clock {
  ticks = toSignal(interval(1000), {initialValue: 0});

  reading = toSignal(this.sensor$, {
    initialValue: {celsius: 20},
    equal: (a, b) => a.celsius === b.celsius,
  });
}
```

### Signal → Observable
```ts
export class Search {
  term = inject(SearchState).term;              // Signal<string>
  results$ = toObservable(this.term).pipe(
    switchMap((t) => this.http.get('/search?q=' + t)),
  );
}
```

### rxResource
```ts
export class Profile {
  private api = inject(UserApi);
  userId = input<string>();
  user = rxResource({
    params: () => ({id: this.userId()}),
    stream: ({params}) => this.api.load(params.id),   // must emit before completing
  });
}
```

### Outputs
```ts
@Directive({/* ... */})
class Drag {
  moves$ = pointerMoves();
  moved = outputFromObservable(this.moves$);     // property initializer only
}

outputToObservable(slider.valueChange).pipe(/* ... */).subscribe(/* ... */);
```

### Auto-unsubscribe
```ts
export class Inbox {
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.feed.messages.pipe(takeUntilDestroyed()).subscribe(/* ... */);
  }

  listenLater() {
    // outside an injection context: pass DestroyRef
    this.feed.messages.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(/* ... */);
  }
}
```

## Pitfalls
- `toSignal` subscribes right away, which can trigger the Observable's side effects.
- If the source Observable errors, reading the `toSignal` signal throws that error.
- After the source completes, the signal keeps returning the last emitted value.
- `toObservable` never notifies synchronously on change: several `set` calls in a row emit only the final settled value (the first value on subscribe may be synchronous).
- Calling `toSignal` / `toObservable` / argument-less `takeUntilDestroyed` outside an injection context fails unless an `Injector` / `DestroyRef` is supplied.
- An `rxResource` stream that completes without emitting a value or error triggers NG0991.

## Version notes
- None stated in the docs.
