---
name: setup-robust-lint
description: Use when the user wants to set up (or strengthen) strong architecture-enforcing ESLint rules on a TypeScript project — "set up robust lint rules", "add lint guard rails", "enforce module boundaries", "lint on save". Guided authoring: detect the repo's real architecture, install the exact package set (with the boundaries v5 pin), author a tailored flat `eslint.config.mjs` with rich pattern-suggesting messages, wire on-save + agent realtime feedback, then PROVE the boundaries actually enforce.
---

# Setup Robust Lint

Stand up **architecture-enforcing** ESLint on a TypeScript project: not just style, but
boundaries, layer direction, LOC/complexity caps, barrel/index bans, and an env fence — every
message written to teach the fix. Then make the feedback **realtime** for both humans (on save)
and agents (this plugin's edit hook), and **verify** the rules actually bite.

The value here is the *procedure and the gotchas*, not one config. Two real, adaptable
exemplars ship alongside this skill:
- [`reference/examples/web-module-dag.mjs`](reference/examples/web-module-dag.mjs) — a Next.js
  app with per-module element matrix + module-to-module layer DAG.
- [`reference/examples/node-layered.mjs`](reference/examples/node-layered.mjs) — a linear
  layered Node service (daemon → … → utils).

Read these two references before authoring:
- [`reference/packages-and-pitfalls.md`](reference/packages-and-pitfalls.md) — exact deps, the
  **`eslint-plugin-boundaries` v5-not-v7 trap**, `engine-strict`, `eslint_d`.
- [`reference/rich-messages.md`](reference/rich-messages.md) — message style + the ready-made
  numeric-cap remedy text (core numeric rules can't carry custom messages).

## Steps

1. **Detect the architecture (GATE — do not guess).** List the source tree (`src/**` dirs) and
   sample the real import edges (e.g. `grep -rhoE "@/modules/[a-z]+"` or `from '\.\./[a-z]+'`).
   Decide the shape: per-module element matrix (feature modules with internal layers), a linear
   layered service, or flat. Map the intended **downward** dependency direction from what the
   code actually does — let the real edges correct your guess (see step 6; a wrong layer order
   surfaces as boundary errors you then reconcile).

2. **Install packages.** Per [`reference/packages-and-pitfalls.md`](reference/packages-and-pitfalls.md):
   `typescript-eslint eslint-plugin-boundaries@^5 eslint-plugin-import eslint-import-resolver-typescript eslint_d`
   (+ `eslint-plugin-react eslint-plugin-react-hooks @next/eslint-plugin-next` for Next.js).
   **Pin boundaries to `^5`** — v7 silently ignores the `['type', {module}]` selectors and the
   matrix stops enforcing while lint still exits 0. If the repo sets `engine-strict=true` and a
   dep wants a newer Node than the repo runs, install with `--engine-strict=false`.

3. **Author `eslint.config.mjs`** (flat config), adapting the closest exemplar. Include:
   - `boundaries/elements` describing each layer/element, most-specific-first;
   - `boundaries/element-types` (the matrix) and/or per-layer `no-restricted-imports` (the DAG);
   - quality caps: `complexity`, `max-lines`, `max-depth`, `max-params`, `max-statements`
     (per-file-type LOC caps via file-scoped overrides);
   - bans: `no-restricted-syntax` for `export *` (barrels) and for `index.*` files;
   - env fence: `no-restricted-properties` on `process.env`, off only in the env module;
   - `import/no-cycle`, `@typescript-eslint/no-explicit-any`, `consistent-type-imports`.
   - **Rich messages** on every message-capable rule + the **numeric-cap remedy header** block
     (see [`reference/rich-messages.md`](reference/rich-messages.md)). Relax caps + boundaries
     for test files.

4. **Wire on-save (humans).** Copy [`reference/vscode-settings.json`](reference/vscode-settings.json)
   to the repo's `.vscode/settings.json` (fix-on-save, `workingDirectories: [{ mode: auto }]` so a
   multi-app repo lints each app against its own config). Add a `lint:file` script:
   `"lint:file": "eslint_d --no-warn-ignored"`.

5. **Agent realtime feedback (already provided).** This plugin ships a PostToolUse hook
   (`hooks/lint-changed-file.mjs`) that lints each edited `.ts/.tsx` against its owning app and
   returns violations to the agent. If agent-kit is enabled, it is already active — do **not**
   add a duplicate per-repo hook. Just confirm it fires (edit a file with a known violation).

6. **Verify enforcement (GATE — never trust a green exit).** Boundary rules only classify
   **resolvable** imports. Write a throwaway file with a *resolvable* disallowed import (import a
   real file from a forbidden layer) and confirm the boundary rule **errors**; delete it. Then run
   the full lint. Reconcile any boundary errors that reveal the real layer order differs from your
   guess (fix the config to the sound direction, or the code if it's a genuine violation). Finally,
   report remaining violations as **surfaced debt** honestly — do not weaken rules to go green.

## Gates
- **Never loosen a rule to make lint pass.** Numeric-cap or boundary violations in existing code
  are surfaced debt to report, not a reason to raise a cap or disable a rule. No inline disables,
  no `any`/`ts-ignore` workarounds.
- **Prove the matrix bites** (step 6) before claiming success — a config that exits 0 may not be
  enforcing anything.
- **Pin boundaries to v5** and say why in a comment, so a future upgrade doesn't silently break it.
