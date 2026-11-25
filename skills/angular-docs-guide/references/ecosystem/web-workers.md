# Web Workers

> Sources (angular.dev, v22.3 @ bd1e32b): Web workers — https://angular.dev/ecosystem/web-workers.

## When to use
- Moving CPU-heavy work (CAD drawing generation, heavy geometry math) off the main thread so the UI stays responsive
- Scaffolding a worker file and its caller with the Angular CLI
- Making worker-based code still work where workers are unavailable (e.g. server-side rendering)
- See also: server-side rendering → references/guide/ssr.md

## Rules
- PREFER `ng generate web-worker <location>` to add a worker; it also configures the project for workers the first time.
- MUST refactor the generated scaffold so the real computation is exchanged through `postMessage` / `message` events; the scaffold only echoes text.
- MUST guard worker creation with `typeof Worker !== 'undefined'` and provide a fallback that performs the same computation without a worker.
- MUST provide that fallback for platforms without worker support, such as `@angular/platform-server` used for SSR.
- NEVER expect the Angular CLI itself to run inside a web worker; it is not supported.

## API cheat-sheet
| API | Purpose | Notes / version tag |
|---|---|---|
| `ng generate web-worker <location>` | Adds a worker next to `<location>` and wires project config | e.g. `ng generate web-worker app` creates `src/app/app.worker.ts` |
| `new Worker(new URL('./x.worker', import.meta.url))` | Creates the worker from the calling file | Form emitted by the CLI scaffold |
| `worker.postMessage(data)` | Sends data to the worker | — |
| `worker.onmessage = ({data}) => …` | Receives worker replies on the page | — |
| `addEventListener('message', ({data}) => …)` | Receives messages inside the worker file | Reply with `postMessage(result)` |

## Patterns

### Worker file (`src/app/app.worker.ts`)
```ts
addEventListener('message', ({data}) => {
  postMessage(heavyCalculation(data));
});
```

### Caller with fallback (`src/app/app.ts`)
```ts
if (typeof Worker !== 'undefined') {
  const worker = new Worker(new URL('./app.worker', import.meta.url));
  worker.onmessage = ({data}) => this.result.set(data);
  worker.postMessage(input);
} else {
  // No worker support (e.g. platform-server): compute on this thread instead.
  this.result.set(heavyCalculation(input));
}
```

## Pitfalls
- Code that only creates a worker breaks in environments without workers, such as `@angular/platform-server` during SSR; always keep a non-worker path.
- The generated scaffold is a placeholder; leaving it unchanged does not move any work off the main thread.

## Version notes
- None stated in the docs.
