# Rich messages & the numeric-cap remedy header

Every rule that *can* carry a message should explain **what broke** and **suggest the pattern**
to fix it. A good message names the architectural intent and points to the escape hatch (move
code down a layer, go through `public/`, split the file, pass an options object). Terse defaults
like "may not import" waste the teachable moment.

## Message-capable rules — write them fully

- **`boundaries/element-types`** — supports `${file.type}` / `${dependency.type}` interpolation
  in a top-level `message`. Say which element may not import which, then the remedy:
  > `${file.type} may not import ${dependency.type}. Route cross-module access through the
  > target module's `public/` surface, keep components pure (props in), and confine raw DB
  > access to `data/`. To share code, move it into `helpers/`/`types/` (same module) or
  > `kernel/` (global).`

- **`no-restricted-imports`** (the module-to-module DAG) — use the object form
  `patterns: [{ group: [...], message: '…' }]` so each layer gets a tailored message naming what
  it *may* reach and reminding that cross-module use goes through `public/`.

- **`no-restricted-syntax`** (barrel + index bans) — explain the cycle/tree-shaking cost and the
  alternative (export named symbols from the defining file; expose a module via its `public/`
  surface).

- **`no-restricted-properties`** (env fence) — name the single allowed reader (`@/kernel/env` or
  `config.ts`) and how to add a new setting.

Factor repeated messages into named `const`s at the top of the config for readability.

## Numeric-cap remedies — put them in a header block

These five rules ignore a `message` option, so document the fixes in a comment at the top of
`eslint.config.mjs`. Reusable text:

```
 * NUMERIC-CAP REMEDIES (ESLint core rules cannot carry a custom message):
 *   • max-lines      → the file does too much. For a component, split into a PURE view + a
 *                      backing hook file. For data/server, split by domain/feature into sibling
 *                      files. Extract pure logic into helpers/.
 *   • complexity     → too many branches. Use early returns, a lookup map/registry, or strategy
 *                      functions; push branchy pure logic into helpers/.
 *   • max-depth      → nesting > limit. Invert conditions & return early; extract the inner
 *                      block into a named helper.
 *   • max-statements → the function is a procedure. Extract cohesive steps into named helpers
 *                      (or a custom hook for component logic).
 *   • max-params     → pass a single typed options/props object instead of a positional list.
```

## Suggested caps (tune per project)

- `complexity` 8, `max-depth` 3, `max-params` 4, `max-statements` 15.
- LOC per file-type override (skipBlankLines + skipComments): components ~150, hooks/context
  ~100, data/server/workflows ~120, helpers ~80; `types/`+`public/` exempt; tests ~500 with
  `complexity`/`max-statements` off. For a linear service: leaf/domain ~120, mid layers ~150,
  declarative contracts ~200.
- Always relax caps **and** turn off `boundaries/element-types` for `**/*.test.*`.
