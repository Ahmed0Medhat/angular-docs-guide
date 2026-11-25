# Tailwind CSS

> Sources (angular.dev, v22.3 @ bd1e32b): Tailwind — https://angular.dev/guide/tailwind.

## When to use
- Adding Tailwind CSS to an existing Angular CLI project in one step with `ng add tailwindcss`.
- Wiring Tailwind up by hand (packages, PostCSS config, stylesheet import) instead of using the schematic.
- Importing Tailwind into a global stylesheet written in plain CSS or in SCSS.
- Styling component templates with Tailwind utility classes.

## Rules
- PREFER the automated route: run `ng add tailwindcss` from the project root; it installs the packages, configures the project and inserts the Tailwind `@import` into your styles.
- MAY use utility classes in component templates straight after `ng add tailwindcss` finishes; no further setup is described.
- MUST, for a manual setup, install three packages: `tailwindcss`, `@tailwindcss/postcss` and `postcss` (npm, yarn, pnpm and bun are all shown).
- MUST, for a manual setup, create `.postcssrc.json` at the project root that registers the `@tailwindcss/postcss` plugin.
- MUST, for a manual setup with CSS, put `@import 'tailwindcss';` in `src/styles.css`.
- MUST, for a manual setup with SCSS, put `@use 'tailwindcss';` in `src/styles.scss` instead of the CSS `@import`.
- PREFER verifying a manual setup by running `ng serve` and checking that a utility-styled element renders styled.

## API cheat-sheet
| API | Purpose | Notes / version tag |
| --- | --- | --- |
| `ng add tailwindcss` | Schematic that installs `tailwindcss` plus peer deps, configures the project, and adds the Tailwind `@import` to styles | Recommended automated setup |
| `npm install tailwindcss @tailwindcss/postcss postcss` | Manual install of Tailwind and its PostCSS integration | Equivalents: `yarn add …`, `pnpm add …`, `bun add …` with the same three packages |
| `.postcssrc.json` | PostCSS config file at the project root | Must list `"@tailwindcss/postcss": {}` under `"plugins"` |
| `@import 'tailwindcss';` | Pulls Tailwind into a CSS global stylesheet | Goes in `src/styles.css` |
| `@use 'tailwindcss';` | Pulls Tailwind into an SCSS global stylesheet | Goes in `src/styles.scss` |

## Patterns

Automated setup (run in the project root):

```shell
ng add tailwindcss
```

Manual setup, step by step:

```shell
ng new demo-app
cd demo-app
npm install tailwindcss @tailwindcss/postcss postcss
```

`.postcssrc.json` (project root):

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

```css
/* src/styles.css */
@import 'tailwindcss';
```

```scss
// src/styles.scss (SCSS projects)
@use 'tailwindcss';
```

Using utility classes in a component template (e.g. `app.html`):

```html
<h1 class="text-3xl font-bold underline">Welcome</h1>
```

## Pitfalls
- The manual setup needs both pieces: the `@tailwindcss/postcss` plugin in `.postcssrc.json` and the Tailwind import in the global stylesheet; the docs list them as separate required steps.
- SCSS projects use `@use 'tailwindcss';` in `styles.scss`, not the `@import` form shown for `styles.css`.
- `.postcssrc.json` belongs in the project root, not under `src/`.

## Version notes
- None stated in the docs.
