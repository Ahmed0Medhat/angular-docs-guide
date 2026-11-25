---
type: llm
weight: 1
---

Grade the response against each criterion. Pass only if all are met.

1. Uses the Signal Forms API from `@angular/forms/signals` (`form()` over a writable model `signal()`), not FormGroup/FormControl or ngModel — references/guide/forms-signals.md.
2. Imports `FormField` into the component and binds inputs with `[formField]` — references/guide/forms-signals.md.
3. The model gives every field an initial empty string; no `undefined` values or optional properties — references/guide/forms-signals.md.
4. Uses schema validators such as `required`, `email` and `minLength`, and validates confirm password against password with a cross-field rule — references/guide/forms-signals-validation.md.
5. Shows error messages only when the field is `touched()` and `invalid()`, reading `errors()` — references/guide/forms-signals.md.
6. Submits via `submit()` or `[formRoot]` with a `submission` action so all fields are marked touched and the action runs only when valid — references/guide/forms-signals.md.
