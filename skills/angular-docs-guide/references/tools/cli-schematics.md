# Angular CLI schematics: generating, authoring, and shipping with libraries

> Sources (angular.dev, v22.3 @ bd1e32b): Generating code using schematics — https://angular.dev/tools/cli/schematics,
> Authoring schematics — https://angular.dev/tools/cli/schematics-authoring,
> Schematics for libraries — https://angular.dev/tools/cli/schematics-for-libraries.

## When to use
- Running a schematic from a collection other than the default one (`ng generate <collection>:<schematic>`), or changing generation defaults.
- Writing a custom schematic (rule factory, `Tree` edits, templates) to enforce your team's conventions or scaffold common UI patterns.
- Adding interactive `x-prompt` questions to a schematic's option schema.
- Making a library installable with `ng add`, generatable with `ng generate`, and migratable with `ng update`.
- Compiling and bundling a library's schematics into its `dist/` output, then testing them locally via `npm link`.

## Rules
- MUST know that `ng generate` and `ng add` use the `@schematics/angular` collection by default; sub-commands like `ng generate component` are short names for its schematics.
- MUST treat the schematic's JSON schema as the source of CLI options and their defaults; command-line values override those defaults.
- MUST give every schematic in a collection a unique name.
- MUST declare each schematic in `collection.json` with a `description` and a `factory` (`<path>/index#<exportedFn>`); `schema` and `aliases` are optional.
- PREFER creating a library's schematic files directly inside the library project in the workspace, not with the Schematics CLI (that is the most common use case).
- PREFER `x-prompt` short form (question text only) in most cases; switch to the long form only when you need a custom type, labels, or item lists.
- PREFER relying on schema constraints instead of re-validating prompt answers in code; the prompt runtime re-asks until the answer satisfies the schema.
- MUST add a `"schematics"` entry pointing to `collection.json` in the library's `package.json`, or the CLI cannot locate your schematics.
- MUST wrap every external symbol with `external(name, module)` inside a `code` tagged template passed to `addRootImport`, so the right import statements get generated.
- MUST build the schematics only after the library build, so the output lands in the correct directory.
- MUST provide a dedicated `tsconfig.schematics.json` (next to `tsconfig.lib.json`) plus `build`/`postbuild` scripts in the library `package.json` to compile and copy schematics into the bundle.
- MUST install `copyfiles` and `typescript` (as dev deps) before running the `build`/`postbuild` scripts.
- MUST resolve which workspace project the schematic targets (user-supplied or defaulted) and throw a `SchematicsException` when it cannot be found.
- MUST return a `Rule` from a rule factory (for example via `chain([...])`).
- MUST `npm link` the built library from `dist/` into `node_modules` before running its schematic with `ng generate`.
- AVOID forcing an update of every dependency by default with `ng update`; update specific packages first.
- PREFER shipping an update schematic whenever a new library release contains breaking changes, so `ng update` can migrate user code automatically.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `ng generate <collection>:<schematic>` | Long form to run any named schematic | e.g. `ng generate @angular/material:table <name>` |
| `ng add <pkg>` | Installs the package via the package manager, then runs its `ng-add` schematic | Supplied by the library |
| `ng update` (no args / `--help`) | Inspects the workspace and lists packages that can be updated | |
| `ng update <pkg...>` | Updates the listed packages, their peer deps, and peers depending on them; runs matching update schematics | Errors and changes nothing on unmatchable peer ranges |
| Auto-formatting | CLI formats only files created/changed by schematics and `ng update` migrations | Only when Prettier or Oxfmt is installed in the workspace |
| `npm install -g @angular-devkit/schematics-cli` | Installs the `schematics` executable | |
| `schematics blank --name=<n>` | New collection folder + first schematic (same name, in `src/<n>`); inside an existing collection, adds a schematic | Also writes `index.ts`, a spec, and the `collection.json` entry |
| `schematics <path>:<name> --<opt>=<v>` | Runs a schematic from a collection folder | Path absolute or relative to cwd; e.g. `schematics .:hello-world` |
| `Tree` | Virtual file system: a _base_ (existing files) + a _staging area_ (pending changes) | Edits go to staging, never directly to base |
| `Rule` | Function `Tree -> Tree` applying transformations | `index.ts` defines the rules |
| `RuleFactory` | Higher-order function returning a `Rule`; the schematic entry point | Need not be the default export; several per file allowed |
| `Action` | A single transformation | Kinds: `Create`, `Rename`, `Overwrite`, `Delete` |
| `SchematicContext` | Per-run context: utilities, metadata, logging API, merge strategy | Merge strategy accepts, ignores, or throws on a change |
| `SchematicsException` | Error type to throw from schematic code | |
| `tree.read/overwrite/exists/getDir` | Read, write, and inspect workspace files during a run | Used to build a `WorkspaceHost` |
| `workspaces.readWorkspace('/', host)` | Reads `angular.json` | Needs a `workspaces.WorkspaceHost` built from the `Tree` |
| `workspace.projects.get(name)` | Project config (`sourceRoot`, `extensions.projectType`) | |
| `apply(source, rules[])` | Runs rules over a source, returns the transformed source | |
| `url('./files')` | Loads template files relative to the schematic | |
| `applyTemplates({...})` | Exposes functions/values to template contents and file names; returns a `Rule` | Define `classify`, `dasherize`, `name` here |
| `strings.classify` | `my service` -> `MyService` | From `@angular-devkit/core` |
| `strings.dasherize` | `MyService` -> `my-service` | From `@angular-devkit/core` |
| `move(path)` | Places generated files at their destination | Wrap path with `normalize()` |
| `mergeWith(source)` | Merges a templated source into the tree | |
| `chain(rules[])` | Combines several rules into one | |
| `addRootImport(project, cb)` | Adds an import to the app root | From `@schematics/angular/utility`; `cb` receives `{code, external}` |
| `@angular-devkit/core` helpers | `JsonAstObject`, `JsonObject`, `JsonValue`, `Path`, `normalize`, `parseJsonAst`, `strings`, `virtualFs`, `workspaces` | `@schematics/angular` also offers helpers for modules, deps, TS/AST, JSON, workspaces |

### `collection.json` fields
| Field | Meaning |
| --- | --- |
| `$schema` | Devkit collection schema used for validation (`.../@angular-devkit/schematics/collection-schema.json`) |
| `schematics` | Map of named schematics in the collection |
| `description` | Plain-text description |
| `factory` | Entry function, e.g. `./hello-world/index#helloWorld` |
| `schema` (optional) | JSON schema file defining the schematic's CLI options |
| `aliases` (optional) | Extra invocation names (the CLI's `generate` has alias `g`) |

### Per-schematic files
| File | Role |
| --- | --- |
| `index.ts` | Transformation logic |
| `schema.json` | Option definitions (types, defaults, prompts) |
| `schema.d.ts` / `schema.ts` | TypeScript interface for the options |
| `files/` | Optional templates to copy and fill in |

### Option schema keys (`schema.json`)
| Key | Meaning |
| --- | --- |
| `$id` | Unique ID of the schema in the collection |
| `title` | Human-readable description |
| `type` | Shape of the properties (`"object"`) |
| `properties` | Options; each has a type, description, optional alias |
| `required` | Mandatory options |
| `default` | Static default value |
| `$default: {"$source": "projectName"}` | Defaults to the current project |
| `$default: {"$source": "workingDirectory"}` | Defaults to the cwd (used for `path`) |
| `"format": "path"`, `"visible": false` | Used on the hidden `path` option in the example |
| `x-prompt` | Interactive question (string or object) |

### `x-prompt` types
| Type | Use | Short-form inference |
| --- | --- | --- |
| `confirmation` | Yes/no | `"type": "boolean"` (yes = `true`, no = `false`) |
| `input` | Free text | `"type": "string"`; `"number"`/`"integer"` accept valid numbers only |
| `list` | Fixed choices | Any `"enum"` (members become menu items) |

Long form object: `type` (optional, auto in short form), `message` (string, required), `items` (strings and/or `{label, value}` with `value` required; only with `list`).

### `ng-add.save` (library `package.json`)
| Value | Effect |
| --- | --- |
| `false` | Package not written to `package.json` |
| `true` | Added to `dependencies` |
| `"dependencies"` | Added to `dependencies` |
| `"devDependencies"` | Added to `devDependencies` |

### `tsconfig.schematics.json` key options
| Option | Meaning |
| --- | --- |
| `rootDir` | `schematics` folder holds the sources to compile |
| `outDir` | Library output folder (default library output is `dist/my-lib` at the workspace root; example uses `../../dist/my-lib/schematics`) |

### Schematic types a library can ship
| Type | Command | Purpose |
| --- | --- | --- |
| Add | `ng add` | Install and set up the library; may change config, add deps (e.g. polyfills), scaffold init code |
| Generation | `ng generate` | Scaffold library-defined artifacts, add config and scripts |
| Update | `ng update` | Bump deps and migrate code across breaking changes |

## Patterns

### Blank rule factory
```ts
import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';

export function greet(_opts: unknown): Rule {
  return (tree: Tree, _ctx: SchematicContext) => tree;
}
```

### Option schema with prompts (short and long form)
```json
{
  "properties": {
    "who": {"type": "string", "minLength": 1, "default": "world", "x-prompt": "Who should be greeted?"},
    "colored": {"type": "boolean", "x-prompt": "Use colored output?"},
    "style": {
      "type": "string",
      "default": "css",
      "enum": ["css", "scss"],
      "x-prompt": {
        "message": "Pick a stylesheet format",
        "type": "list",
        "items": [{"value": "css", "label": "CSS"}, {"value": "scss", "label": "SCSS"}]
      }
    }
  }
}
```

### Library wiring: `collection.json` + `package.json`
```json
// projects/acme-ui/schematics/collection.json
{
  "$schema": "../../../node_modules/@angular-devkit/schematics/collection-schema.json",
  "schematics": {
    "ng-add": {"description": "Install acme-ui.", "factory": "./ng-add/index#ngAdd", "schema": "./ng-add/schema.json"},
    "data-service": {"description": "Create a data service.", "factory": "./data-service/index#dataService", "schema": "./data-service/schema.json"}
  }
}
```
```json
// projects/acme-ui/package.json (excerpt)
{
  "scripts": {
    "build": "tsc -p tsconfig.schematics.json",
    "postbuild": "copyfiles schematics/*/schema.json schematics/*/files/** schematics/collection.json ../../dist/acme-ui/"
  },
  "schematics": "./schematics/collection.json",
  "ng-add": {"save": "devDependencies"},
  "devDependencies": {"copyfiles": "file:../../node_modules/copyfiles", "typescript": "file:../../node_modules/typescript"}
}
```

### `ng-add` schematic
```ts
import {Rule} from '@angular-devkit/schematics';
import {addRootImport} from '@schematics/angular/utility';
import {Schema} from './schema'; // { project: string } with $default projectName

export function ngAdd(opts: Schema): Rule {
  return addRootImport(opts.project, ({code, external}) => code`${external('AcmeUiModule', 'acme-ui')}`);
}
```

### `tsconfig.schematics.json` (essentials)
```json
{
  "compilerOptions": {
    "rootDir": "schematics",
    "outDir": "../../dist/acme-ui/schematics",
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "es6",
    "declaration": true,
    "noEmitOnError": true
  },
  "include": ["schematics/**/*"],
  "exclude": ["schematics/*/files/**/*"]
}
```

### Template file: `files/__name@dasherize__.service.ts.template`
```ts
import {Service, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Service()
export class <%= classify(name) %>Service {
  private http = inject(HttpClient);
}
```

### Generation schematic (project lookup + templating)
```ts
import {Rule, Tree, SchematicsException, apply, url, applyTemplates, move, chain, mergeWith} from '@angular-devkit/schematics';
import {strings, normalize, virtualFs, workspaces} from '@angular-devkit/core';
import {Schema} from './schema'; // { name: string; path?: string; project?: string }

function hostFor(tree: Tree): workspaces.WorkspaceHost {
  return {
    async readFile(p) {
      const buf = tree.read(p);
      if (!buf) throw new SchematicsException('File not found.');
      return virtualFs.fileBufferToString(buf);
    },
    async writeFile(p, data) { tree.overwrite(p, data); },
    async isDirectory(p) { return !tree.exists(p) && tree.getDir(p).subfiles.length > 0; },
    async isFile(p) { return tree.exists(p); },
  };
}

export function dataService(opts: Schema): Rule {
  return async (tree: Tree) => {
    const {workspace} = await workspaces.readWorkspace('/', hostFor(tree));
    const project = opts.project != null ? workspace.projects.get(opts.project) : null;
    if (!project) throw new SchematicsException(`Invalid project name: ${opts.project}`);

    const kind = project.extensions.projectType === 'application' ? 'app' : 'lib';
    if (opts.path === undefined) opts.path = `${project.sourceRoot}/${kind}`;

    const source = apply(url('./files'), [
      applyTemplates({classify: strings.classify, dasherize: strings.dasherize, name: opts.name}),
      move(normalize(opts.path)),
    ]);
    return chain([mergeWith(source)]);
  };
}
```

### Build, link, run
```shell
ng build acme-ui                 # from workspace root, library first
cd projects/acme-ui && npm run build   # then schematics
cd ../.. && npm link dist/acme-ui
ng generate acme-ui:data-service --name orders
# CREATE src/app/orders.service.ts
```

### Standalone collection with the Schematics CLI
```shell
schematics blank --name=greeter
cd greeter && npm install && npm run build
schematics .:greeter
schematics blank --name=farewell   # run inside the collection to add another
```

## Pitfalls
- Creating a file that already exists is an error; if applied immediately it would throw away every change made so far. The virtual `Tree` records changes in memory and commits to disk only after they validate.
- `ng update` throws and leaves the workspace untouched when peer dependencies cannot be satisfied by a simple semver range.
- `ng update <pkg>` may also update that package's dependencies (e.g. `@angular/material` pulls `@angular/cdk`) and runs any update schematic covering the version jump in either package.
- Short-form prompts infer the prompt type from the property schema; an `enum` always becomes a `list`, a boolean a `confirmation`.
- `items` in a long-form `x-prompt` is only valid with type `list`; `message` is required.
- The `path` option defaults to the current working directory; if it is still `undefined`, compute it from the project's `sourceRoot` and `projectType`.
- Exclude `schematics/*/files/**` from the schematics `tsconfig`; `.template` files are copied by `postbuild`, not compiled.
- Building schematics before the library puts them in the wrong place; always build the library first.
- Without `npm link dist/<lib>`, `ng generate <lib>:<schematic>` cannot find the local collection.
- The CLI installs the latest library version on `ng add` by itself; extra setup (like adding a root import) must come from your `ng-add` schematic.

## Version notes
- None stated in the docs.
