# Angular Language Service

> Sources (angular.dev, v22.3 @ bd1e32b): Language Service — https://angular.dev/tools/language-service.

## When to use
- Getting completions, diagnostics, hover info and go-to-definition inside Angular templates (inline or external HTML)
- Turning on the newest editor features through `strictTemplates`
- Installing the Language Service in VS Code (and VS Code-based editors), Visual Studio, WebStorm, Sublime Text, Eclipse, Neovim or Zed
- Wiring `ngserver` into coc.nvim or the built-in Neovim LSP
- Understanding how template completions are resolved (HTML AST, expression AST, TypeScript Language Service)

## Rules
- PREFER setting `angularCompilerOptions.strictTemplates: true` in `tsconfig.json` to unlock the latest Language Service features.
- MUST install the VS Code extension `Angular.ng-template` from the Marketplace for VS Code and VS Code-based editors (e.g. Cursor, Antigravity); the Angular team maintains it.
- MUST report problems with non-VS Code integrations to their own maintainers (editor vendors or community), not the Angular team.
- MUST, in Visual Studio, install the `TypeScriptTeam.AngularLanguageService` extension (Extensions > Manage Extensions); Microsoft maintains it with Angular team help.
- MUST, in WebStorm, enable the "Angular and AngularJS" plugin.
- NEVER keep `@angular/language-service` in `package.json` for WebStorm 2019.1 or later; remove it, it is no longer needed.
- MUST, in Sublime Text, install `typescript` and `@angular/language-service` locally as dev dependencies, register the plugin under `compilerOptions.plugins`, and point `typescript-tsdk` at the local `node_modules/typescript/lib`.
- MUST, in Eclipse IDE, use the "Eclipse IDE for Web and JavaScript developers" package (bundles the Angular Language Server) or install Eclipse Wild Web Developer via Help > Eclipse Marketplace.
- PREFER coc.nvim (Conquer of Completion) for vim/Neovim when you want the most complete tsserver + Angular Language Service support.
- MUST, with coc.nvim, set `--tsProbeLocations` / `--ngProbeLocations` to your actual global `node_modules` folders containing `tsserver` and `ngserver`.
- MUST, for the built-in Neovim LSP, install nvim-lspconfig and configure its `angularls` server.
- MUST, in Zed, install the community-maintained Angular extension from the Zed extensions marketplace.

## API cheat-sheet
| API | Purpose | Notes / version tag |
|---|---|---|
| `angularCompilerOptions.strictTemplates` | Enables the latest Language Service features | Set to `true` in `tsconfig.json` |
| Completions | Context-aware suggestions in interpolations and elements; Tab accepts | Component selectors appear as element completions |
| AOT diagnostics | Flags template errors, e.g. an unknown identifier | Shown as you edit |
| Quick info | Hover reveals the origin of components, directives, modules | — |
| Go to definition | Jump to a symbol's declaration | Click or press F12 |
| `Angular.ng-template` | VS Code Marketplace extension | Maintained by the Angular team |
| `TypeScriptTeam.AngularLanguageService` | Visual Studio extension | Maintained by Microsoft with Angular team help |
| "Angular and AngularJS" plugin | WebStorm support | `@angular/language-service` not required since WebStorm 2019.1 |
| `@angular/language-service` | TypeScript plugin package (Sublime Text) | Register in `compilerOptions.plugins`; inline templates only |
| `ngserver` | Language server binary used by coc.nvim | Args: `--stdio`, `--tsProbeLocations`, `--ngProbeLocations` |
| `angularls` | nvim-lspconfig server name for built-in Neovim LSP | Requires nvim-lspconfig |
| Eclipse Wild Web Developer | Eclipse Marketplace package with Angular support | Or use the Web/JavaScript Eclipse package |

## Patterns

### Enable strict templates (`tsconfig.json`)
```json
"angularCompilerOptions": {
  "strictTemplates": true
}
```

### Sublime Text setup (inline templates)
```shell
npm install --save-dev typescript
npm install --save-dev @angular/language-service
```
```json
// tsconfig.json → "compilerOptions"
"plugins": [{ "name": "@angular/language-service" }]
```
```json
// Sublime user preferences (Cmd+, / Ctrl+,)
"typescript-tsdk": "<project>/node_modules/typescript/lib"
```

### coc.nvim (`:CocConfig` → `coc-settings.json`)
```json
{
  "languageserver": {
    "angular": {
      "command": "ngserver",
      "args": [
        "--stdio",
        "--tsProbeLocations", "<global node_modules>/typescript/lib",
        "--ngProbeLocations", "<global node_modules>/@angular/language-server/bin"
      ],
      "filetypes": ["ts", "typescript", "html"],
      "trace.server.verbosity": "verbose"
    }
  }
}
```

### How completion resolution works
- Editor runs the language service as a separate process and talks to it over RPC using the Language Server Protocol; edits are streamed so it tracks project state.
- The service reads `tsconfig.json`, discovers every template in the app, and serves any template you open.
- In element context: template → HTML AST → Angular compiler determines module, scope, component selector and cursor position → candidate symbols.
- In an interpolation such as `{{user.}}`: the HTML AST only sees text, so the template parser builds an expression AST inside the template AST; the service then asks the TypeScript Language Service for the members of `user`.

## Pitfalls
- Sublime Text's plugin handles inline templates only; completions in separate HTML files need a custom or modified Sublime plugin.
- The Sublime plugin route depends on TypeScript's plugin model (TypeScript 2.3+); it provides diagnostics and completions in `.ts` files.
- tsserver does not follow the LSP spec exactly, so generic LSP clients in vim/Neovim may give partial support; coc.nvim ports VS Code's tsserver handling.
- The sample `/usr/local/lib/node_modules/...` paths for `ngserver` probes are placeholders; your global module location may differ.
- Leftover `@angular/language-service` in `package.json` is unnecessary for WebStorm 2019.1+.

## Version notes
- None stated in the docs.
