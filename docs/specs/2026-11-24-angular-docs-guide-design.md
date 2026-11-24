# angular-docs-guide — Design Spec

- **Date:** 2026-11-24
- **Owner:** Ahmed0Medhat
- **Status:** Draft, awaiting review

## 1. Goal

A general, reusable agent skill that makes coding agents (Claude Code first, plus any
tool supported by `npx skills add`) write Angular code exactly as the official
angular.dev documentation prescribes for **Angular v22**.

It is a **page-by-page reference** of four angular.dev sections, distilled into
rules, API cheat-sheets, patterns and pitfalls. It complements — does not copy —
the official `angular/skills` (`angular-developer`), which is shorter and less deep.

### Success criteria

1. Every content page in the four in-scope sections is read in full (including the
   example files it embeds) and is covered by exactly one reference file.
   `sources.json` proves it, and a check script fails if any page is uncovered.
2. On a fixed set of realistic Angular tasks, an agent using the skill produces
   output that follows v22 docs guidance where the same agent without the skill
   does not (baseline vs. with-skill comparison, see §8).
3. The repo is public at `github.com/Ahmed0Medhat/angular-docs-guide` and installs via
   both `/plugin marketplace add Ahmed0Medhat/angular-docs-guide` and
   `npx skills add https://github.com/Ahmed0Medhat/angular-docs-guide`.
4. `scripts/sync-check.mjs` lists exactly which pages changed, were added, or were
   removed between the pinned commit and any newer Angular ref.

### Decisions already made (with the user)

| Topic | Decision |
|---|---|
| Docs version | Angular v22 (angular.dev), not v17 |
| Scope | In-depth Guides, Best Practices, Developer Tools, Extended Ecosystem |
| Shape | One skill: small `SKILL.md` + per-topic `references/` |
| Distribution | Claude Code plugin marketplace **and** skills.sh compatible |
| Updates | Manifest + sync-check script (manual run, no CI) |
| Name | `angular-docs-guide` (repo and skill) |
| Language / license | English content; code MIT; distilled docs CC BY 4.0 with attribution |

## 2. Source of truth

- Repo `angular/angular`, branch `22.3.x`, pinned commit
  **`bd1e32b55c38392c93e1a073a18b346cd2162e31`** — the exact commit angular.dev is
  built from (site footer: `v22.3.0+sha-bd1e32b`).
- Pages: `adev/src/content/**/*.md`. These markdown files are what angular.dev renders,
  so reading them is reading the pages. Embedded examples (`<docs-code path=...>`,
  `<docs-code-multifile>`) are resolved from `adev/src/content/examples/**` and read too.
- Page membership and order: `adev/src/app/routing/navigation-entries/index.ts`
  (`DOCS_SUB_NAVIGATION_DATA`). Only entries with a `contentPath` count as pages.
  Link-only entries (external sites such as AngularFire, Material) are recorded as
  `external` and not summarized.
- **The nav file is parsed as text, never executed** (no `eval`, no import of
  downloaded code). Downloaded Angular source is treated as data only.

Measured size at the pinned commit (folder-level, approximate):
guide ≈150 pages / 212k words, tools ≈26 / 36k, ecosystem ≈13 / 13k,
best-practices ≈10 / 8k → **≈199 pages, ≈270k words**. The exact list is produced by
the inventory step (§7, step 1) and stored in `sources.json`.

## 3. Repository layout

Location on disk: `/Volumes/Computer/MacDev/web projects/angular-docs-guide`
(separate from any app project).

```
angular-docs-guide/
├── .claude-plugin/
│   ├── marketplace.json        # marketplace "angular-docs-guide" → plugin at "./"
│   └── plugin.json             # name, version, description, author, license
├── skills/
│   └── angular-docs-guide/
│       ├── SKILL.md
│       └── references/
│           ├── guide/*.md
│           ├── best-practices/*.md
│           ├── tools/*.md
│           └── ecosystem/*.md
├── sources.json                # manifest (see §6)
├── scripts/
│   ├── inventory.mjs           # text-parses nav + hashes pages → sources.json skeleton
│   ├── check-coverage.mjs      # every page mapped, every reference file exists & lists its pages
│   └── sync-check.mjs          # diff pinned commit vs newer ref
├── tests/
│   └── scenarios.md            # evaluation tasks + expected docs-backed behaviors (§8)
├── docs/specs/                 # this spec
├── README.md                   # English, with a short Arabic section
├── LICENSE                     # MIT (scripts, structure)
└── LICENSE-docs                # CC BY 4.0 notice + attribution to Google LLC / angular.dev
```

Scripts: Node ≥ 20, ESM, zero dependencies, use only `node:` built-ins and the
`git` CLI.

## 4. `SKILL.md`

Frontmatter:

```yaml
name: angular-docs-guide
description: Use when writing, reviewing, refactoring or upgrading Angular code
  (components, signals, templates, DI, routing, forms incl. Signal Forms, HTTP,
  SSR/hydration, testing, i18n, animations, Aria, CLI, libraries, performance,
  security, accessibility). Page-by-page distillation of the angular.dev v22 docs.
```

Body (target ≤ 300 lines):

1. **Version gate.** Read `@angular/core` from the project's `package.json`.
   - `22.x` → apply as written.
   - `< 22` → still useful, but before using any API tagged `[v22+]` / `[v21+]` / etc.
     in a reference file, check it exists in the project's version; prefer the
     older documented alternative noted in the same file.
   - `> 22` → tell the user the skill was distilled from v22.3 and may be stale;
     suggest running `sync-check`.
2. **Core rules** (~30): the non-negotiable v22 defaults, each one line, each traced to a
   reference file (e.g. standalone default, `inject()`, `input()/output()/model()`,
   native control flow, signals for state, Signal Forms for new forms, zoneless,
   `@defer`, `NgOptimizedImage`, `class`/`style` bindings over `ngClass`/`ngStyle`,
   AXE/WCAG AA, Vitest-based testing as documented, etc. — final list taken from the
   docs, not from memory).
3. **Routing table**: task → reference file(s) to open. One row per reference file,
   phrased as tasks ("adding an HTTP interceptor", "debouncing a signal",
   "lazy-loading a route", "writing a component harness test").
4. **How to use the references**: open only the files the task needs; when a rule
   conflicts with project-level instructions (CLAUDE.md/AGENTS.md), the project wins.
5. **Attribution line** + link to angular.dev.

## 5. Reference files

### Granularity

One file per coherent topic, grouping sibling pages; a file covers 1–8 pages and stays
under ~600 lines (split if larger). Expected ≈45 files. Indicative grouping (final
mapping is decided in the plan from the actual inventory):

- **guide/**: `signals`, `components` (may split: anatomy/inputs-outputs/content
  projection/lifecycle/queries/host/styling), `templates` (bindings, control flow,
  `@defer`, `@let`, pipes, events), `directives`, `di`, `routing` (may split:
  define/navigate/guards+resolvers/lazy+loading/rendering strategies),
  `forms-signal`, `forms-reactive`, `forms-template` + validation, `http`
  (setup/requests/interceptors/testing), `ssr` + `hydration` + `incremental-hydration`,
  `testing` (may split: setup/components/services/harnesses/router/http),
  `aria`, `i18n`, `animations`, `drag-drop`, `elements`, `zoneless`, `image-optimization`,
  `security`, `tailwind`, `performance`, `ngmodules` (legacy).
- **best-practices/**: `style-guide`, `security`, `accessibility`, `error-handling`,
  `performance`, `update`.
- **tools/**: `cli` (may split: commands/builders/schematics/config), `libraries`,
  `devtools`, `language-service`.
- **ecosystem/**: `rxjs-interop`, `service-workers-pwa`, `web-workers`,
  `custom-build-pipeline`, `legacy-animations`.

Where the same page sits in two nav sections it is summarized once and cross-linked.

### Template (every file)

```markdown
# <Topic>

> Sources (angular.dev, v22.3 @ bd1e32b): <page title> — https://angular.dev/<path>, ...

## When to use
## Rules
- MUST ... / PREFER ... / AVOID ... (each actionable, no prose)
## API cheat-sheet
| API | Purpose | Notes / version tag |
## Patterns
<short TypeScript/HTML examples, rewritten, minimal, compile-plausible>
## Pitfalls
## Version notes
- [v22+] / [v21+] / [deprecated] / [developer preview] / [experimental] items as the docs state them
```

### Content rules

- **Read fully, write distilled.** Every sentence of every page and its embedded
  examples is read; the file keeps every actionable fact (APIs, options, defaults,
  constraints, warnings) and drops narrative.
- **No verbatim copying** of prose. Code examples are rewritten/minimized; very short
  API signatures may match the docs because they must.
- **Docs-backed only.** Nothing is added from model memory. If something seems missing
  from the docs, it is left out (or flagged in the review notes, not in the skill).
- Stability labels (`developer preview`, `experimental`, `deprecated`) are preserved
  exactly as the docs state them.

## 6. `sources.json` (manifest)

```json
{
  "angular": { "repo": "angular/angular", "ref": "22.3.x",
               "commit": "bd1e32b55c38392c93e1a073a18b346cd2162e31" },
  "navBlob": "<git blob sha of navigation-entries/index.ts>",
  "pages": [
    {
      "section": "In-depth Guides",
      "group": "Signals",
      "title": "Dependent state with linkedSignal",
      "url": "https://angular.dev/guide/signals/linked-signal",
      "contentPath": "guide/signals/linked-signal",
      "blob": "<git blob sha of the .md>",
      "examples": [{ "path": "examples/...", "blob": "..." }],
      "reference": "references/guide/signals.md"
    }
  ],
  "external": [{ "section": "Extended Ecosystem", "title": "AngularFire", "url": "..." }]
}
```

Blob SHAs come from `git ls-tree` — no content download needed to compare.

## 7. Build process

1. **Inventory** — `inventory.mjs` sparse-clones `angular/angular` at the pinned commit
   (`--filter=blob:none --sparse`, `adev/src/content` + nav file), text-parses the nav,
   records every page + embedded example with blob SHAs → `sources.json` with
   `reference` empty.
2. **Mapping** — assign each page a reference file (the plan fixes this table).
3. **Distill** — ~8 parallel subagents, one per batch of reference files. Each reads
   its pages and examples in full from the pinned checkout and writes its files using the
   §5 template. Each returns a list of pages read.
4. **Review** — the orchestrator reviews every file against its sources: coverage of
   actionable facts, no invented APIs, no verbatim prose, labels correct.
5. **SKILL.md** — written last, from the finished references (core rules + routing table).
6. **Coverage check** — `check-coverage.mjs` must pass: every page has a `reference`,
   every reference file exists and lists exactly its mapped pages in its Sources line,
   no orphan reference files.
7. **Evaluate** (§8), fix gaps, re-run.
8. **Publish** — `git init`, commit, `gh repo create Ahmed0Medhat/angular-docs-guide
   --public --source . --push`; then verify both install paths.

## 8. Evaluation

`tests/scenarios.md` holds 5 tasks, each with expected docs-backed behaviors, e.g.:

1. Build a registration form with validation (expect Signal Forms + schema validation
   per docs, accessible errors).
2. Add an auth HTTP interceptor and a retry policy (expect functional interceptors,
   `provideHttpClient(withInterceptors(...))`, `HttpContext` usage as documented).
3. Make a product page SSR'd with incremental hydration and `@defer` (expect correct
   triggers and hydration APIs).
4. Debounced search over a signal feeding a `resource` (expect the documented
   debounced-signal / resource APIs).
5. Write tests for a component with a router dependency (expect the documented test
   setup and harnesses).

For each: a fresh subagent solves it once **without** the skill (baseline) and once
**with** it; the orchestrator scores each expected behavior hit/miss. Ship when the
with-skill run hits all expected behaviors and baseline misses at least some (proving
the skill adds value). Misses with the skill → fix the reference or routing table.

## 9. Sync-check (`scripts/sync-check.mjs`)

```
node scripts/sync-check.mjs [--ref main|22.4.x|<sha>]
```

- Sparse, blob-less clone of the target ref into a temp dir (cleaned up afterwards).
- Text-parses the nav at the target ref; compares pages and blob SHAs with `sources.json`.
- Prints three lists — **changed**, **added**, **removed** — each with URL, and for
  changed/removed the affected reference file. Exit code `0` if identical, `1` if drift.
- Does not edit skill content. Updating is done by an agent on the listed files only,
  then `sources.json` is rewritten with the new commit and SHAs.

## 10. Out of scope

- Tutorials, Introduction/Essentials, Build with AI, Developer Events, API reference,
  error/diagnostic reference pages.
- Non-English docs.
- Scheduled CI for sync (manual run only).
- Translating skill content to Arabic.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Subagents paraphrase loosely or invent APIs | Mandatory per-file orchestrator review against source; "docs-backed only" rule |
| Skill too large for context | Progressive disclosure: SKILL.md ≤300 lines, references loaded on demand, ≤600 lines each |
| Nav file format changes upstream | Text parser fails loudly with the unparsed line; fix parser, not data |
| Overlap/conflict with project CLAUDE.md | SKILL.md states project instructions win |
| Licensing | Docs are CC BY 4.0 → attribution in every Sources line, README and LICENSE-docs |
