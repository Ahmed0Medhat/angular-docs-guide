# Keeping Angular projects up to date

> Sources (angular.dev, v22.3 @ bd1e32b): Keeping up-to-date — https://angular.dev/update.

## When to use
- Checking which Angular version a project currently uses
- Finding out what the latest stable Angular release is
- Planning and running an upgrade of an app or library to a newer Angular version
- Finding release announcements, the change log and versioning/support policy

## Rules
- MUST run `ng version` inside the project directory to see the project's Angular version.
- PREFER `ng update` with no arguments to list available updates and the recommended steps toward the latest version.
- PREFER plain `ng update` for simple updates; it is all the docs say you need in that case.
- PREFER the interactive Angular Update Guide (angular.dev/update-guide) for non-trivial upgrades: it builds instructions from your current and target versions, with basic and advanced paths, troubleshooting and recommended manual changes.
- MUST consult "Angular versioning and releases" (reference/releases) for what level of change a version number implies, the supported update paths, and support/deprecation practices and release schedule.
- MUST treat AngularJS (all v1.x) separately; upgrading from it has its own guide (angular.io/guide/upgrade).

## API cheat-sheet
| API | Purpose | Notes / version tag |
|---|---|---|
| `ng version` | Shows the project's Angular version | Run from the project directory |
| `ng update` | Lists available updates and recommended steps; performs updates | No arguments = list mode |
| npm `@angular/core` "Version" | Latest stable release number | e.g. `16.2.4` as the docs' example |
| Angular Update Guide (`update-guide`) | Per-version-pair update instructions | Basic and advanced paths |
| Angular change log (GitHub `CHANGELOG.md`) | Full list of changes per version | — |
| Angular blog / @angular on X | Release announcements and notifications | — |
| `reference/releases` | Versioning, support, deprecation and release schedule | — |

## Patterns

### Check and update
```shell
ng version   # current project versions
ng update    # list available updates + recommended steps
```

## Pitfalls
- Running `ng update` without arguments only lists updates; it does not change the project by itself.
- AngularJS (v1.x) apps cannot follow this path; they need the dedicated upgrade guide.

## Version notes
- None stated in the docs.
