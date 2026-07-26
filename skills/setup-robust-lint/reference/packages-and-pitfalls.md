# Packages & pitfalls

## Package set

Core (every TS project):

```
eslint typescript-eslint @eslint/js globals
eslint-plugin-boundaries@^5          # architecture matrix / layer direction — SEE PIN BELOW
eslint-plugin-import                 # import/no-cycle + resolver glue
eslint-import-resolver-typescript    # resolve @/… + tsconfig paths for boundaries & no-cycle
eslint_d                             # warm daemon for fast single-file lints (save + agent hook)
```

Add for a Next.js / React app:

```
eslint-plugin-react eslint-plugin-react-hooks @next/eslint-plugin-next
```

Install as dev deps, e.g.:

```
npm i -D typescript-eslint eslint-plugin-boundaries@^5 eslint-plugin-import \
  eslint-import-resolver-typescript eslint_d
```

## PITFALL 1 — `eslint-plugin-boundaries` v7 silently breaks the matrix

The configs this skill teaches use v5-era syntax: the `rules:` option, `${...}` message
templates, and **array micro-selectors** like `['data', { module: '${from.module}' }]`.

On **v7**, those array selectors are **not recognized** — ESLint prints a deprecation warning
(`unrecognized selector shape`) and then **ignores the rule**, so cross-element/cross-module
violations pass and `eslint .` still exits **0**. The guard rail looks installed but enforces
nothing.

**Always pin `eslint-plugin-boundaries` to `^5`** and leave a comment in the config saying why,
so a future `npm update` doesn't silently disarm it. If you deliberately move to v7 later, you
must migrate the whole config to `policies` + `{{...}}` + object selectors and re-run the
enforcement probe (see the skill's step 6).

## PITFALL 2 — `engine-strict` blocks the install

If the repo's `.npmrc` sets `engine-strict=true` and a transitive dependency declares a newer
Node than the repo actually runs (check `.nvmrc`), the whole `npm install` transaction aborts
with `notsup`. Install the lint deps with an override:

```
npm i -D eslint-plugin-boundaries@^5 --engine-strict=false
```

## PITFALL 3 — boundary rules only see RESOLVABLE imports

`boundaries/element-types` classifies a dependency by resolving it to a real file. An import of a
**non-existent** path is skipped silently (no error) — so a probe that imports a made-up file
proves nothing. Path-based `no-restricted-imports` fires on the string regardless, but the
element matrix does not. When verifying enforcement (skill step 6), import a **real** file from a
forbidden layer.

## PITFALL 4 — core numeric rules can't carry custom messages

`complexity`, `max-lines`, `max-depth`, `max-params`, `max-statements` have hard-coded messages;
ESLint ignores a `message` option on them. Put the remedies in a header comment block in the
config instead (see `rich-messages.md`). Everything else (`boundaries/*`, `no-restricted-*`) does
support rich messages — use them fully.

## Speed — `eslint_d`

`eslint_d` keeps a warm ESLint process so single-file lints return in tens of ms instead of
seconds. Use it for the `lint:file` script and it is what the agent edit-hook prefers (falling
back to plain `eslint`). Full-repo `lint` can stay on plain `eslint`.
