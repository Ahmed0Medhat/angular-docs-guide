// contentPath prefix → reference file (relative to skills/angular-docs-guide).
// First match wins. {1} = first path segment after the prefix.
// Specific rules split topics whose sources exceed ~15k words; see docs/plans (Task 3, Step 6).
const to = (target, prefixes) => prefixes.map((prefix) => [prefix, target]);

export const REFERENCE_RULES = [
  // Server-side & hybrid rendering
  ...to('references/guide/ssr.md', ['guide/hydration', 'guide/incremental-hydration', 'guide/performance']),

  // Dependency injection
  ...to('references/guide/di-hierarchy.md', [
    'guide/di/hierarchical-dependency-injection',
    'guide/di/debugging-and-troubleshooting-di',
  ]),

  // Routing
  ...to('references/guide/routing-data.md', [
    'guide/routing/route-guards',
    'guide/routing/data-resolvers',
    'guide/routing/data-fetching-with-resources',
    'guide/routing/error-boundaries',
    'guide/routing/lifecycle-and-events',
  ]),
  ...to('references/guide/routing-advanced.md', [
    'guide/routing/testing',
    'guide/routing/common-router-tasks',
    'guide/routing/routing-with-urlmatcher',
    'guide/routing/rendering-strategies',
    'guide/routing/customizing-route-behavior',
    'guide/routing/router-reference',
    'guide/routing/route-transition-animations',
  ]),

  // Forms
  ...to('references/guide/forms-signals.md', [
    'guide/forms/overview',
    'guide/forms/signals/overview',
    'guide/forms/signals/models',
    'guide/forms/signals/designing-your-form-model',
    'guide/forms/signals/field-state-management',
    'guide/forms/signals/comparison',
    'guide/forms/signals/migration',
  ]),
  ...to('references/guide/forms-signals-validation.md', [
    'guide/forms/signals/validation',
    'guide/forms/signals/form-logic',
    'guide/forms/signals/cross-field-logic',
    'guide/forms/signals/schemas',
    'guide/forms/signals/async-operations',
    'guide/forms/signals/form-submission',
  ]),
  ...to('references/guide/forms-signals-advanced.md', ['guide/forms/signals']),
  ...to('references/guide/forms-reactive.md', [
    'guide/forms/reactive-forms',
    'guide/forms/typed-forms',
    'guide/forms/dynamic-forms',
  ]),
  ...to('references/guide/forms-template-and-validation.md', [
    'guide/forms/template-driven-forms',
    'guide/forms/form-validation',
  ]),

  // Testing
  ...to('references/guide/testing-scenarios.md', [
    'guide/testing/components-scenarios',
    'guide/testing/zone-js-testing-utilities',
  ]),
  ...to('references/guide/testing-harnesses.md', [
    'guide/testing/component-harnesses-overview',
    'guide/testing/using-component-harnesses',
    'guide/testing/creating-component-harnesses',
    'guide/testing/component-harnesses-testing-environments',
  ]),
  ...to('references/guide/testing-runners.md', ['guide/testing/migrating-to-vitest', 'guide/testing/karma']),

  // Animations
  ...to('references/guide/animations-legacy.md', [
    'guide/animations/overview',
    'guide/animations/transition-and-triggers',
    'guide/animations/complex-sequences',
    'guide/animations/reusable-animations',
  ]),

  // Angular CLI
  ...to('references/tools/cli-builders.md', [
    'tools/cli/build-system-migration',
    'tools/cli/cli-builder',
    'ecosystem/custom-build-pipeline',
  ]),
  ...to('references/tools/cli-schematics.md', [
    'tools/cli/schematics',
    'tools/cli/schematics-authoring',
    'tools/cli/schematics-for-libraries',
  ]),
  ...to('references/tools/cli-compiler.md', [
    'tools/cli/template-typecheck',
    'tools/cli/aot-compiler',
    'tools/cli/aot-metadata-errors',
  ]),

  // Performance best practices (overview + runtime performance)
  ...to('references/best-practices/performance.md', ['best-practices/performance', 'best-practices/runtime-performance']),

  // Generic: one file per top-level topic folder
  ['guide', 'references/guide/{1}.md'],
  ['best-practices', 'references/best-practices/{1}.md'],
  ['tools', 'references/tools/{1}.md'],
  ['ecosystem', 'references/ecosystem/{1}.md'],
];
