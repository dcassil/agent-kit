// EXAMPLE — reference exemplar for the setup-robust-lint skill. Adapt to the target
// repo's real modules/layers; do not copy verbatim. Shape: a Next.js app with a
// per-module element matrix (components/hooks/server/data/public/…) plus a
// module-to-module layer DAG. Requires eslint-plugin-boundaries@^5 (see
// ../packages-and-pitfalls.md — v7 silently disarms the matrix).

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'
import boundaries from 'eslint-plugin-boundaries'
import importPlugin from 'eslint-plugin-import'

/**
 * shore-guard-web ESLint config — architecture & quality guard rails.
 *
 * SHAPE: kernel (shared substrate) + feature modules. Inside a module, code is
 * split into ELEMENTS with a strict import matrix (see boundaries/element-types):
 *
 *   app → public (cross-module door) → { components, hooks, context, server,
 *          workflows, data, helpers, types }  and everything may use `kernel`.
 *
 *   • components — PURE where possible (props in). May use their OWN module's
 *                  hooks/context/helpers/types. Cross-module data goes via public.
 *   • hooks/context — the backing state for components; call server/data.
 *   • server     — server actions / RPC orchestration per feature.
 *   • data       — the ONLY place the raw Supabase client is touched, and only in
 *                  the data/auth/connections modules. One file per domain/feature.
 *   • public     — the module's cross-module surface (the ONLY place `export *` is legal).
 *   • kernel/env — the ONLY place process.env may be read.
 *
 * Between modules, imports flow along a layer DAG (see the per-module
 * no-restricted-imports blocks at the bottom):
 *   marketing ┐
 *   portal   ─┼→ (auth, workque, scanner, connections) → (data, scoring) → kernel
 *             app composes only public + kernel.
 *   data & scoring are independent leaves (neither imports the other).
 *
 * NUMERIC-CAP REMEDIES (ESLint core rules cannot carry a custom message, so the
 * fixes live here — read this when one trips):
 *   • max-lines      → the file does too much. For a component, split into a PURE
 *                      view + a backing hook file. For data/server, split by
 *                      domain/feature into sibling files. Extract pure logic to helpers/.
 *   • complexity     → too many branches. Use early returns, a lookup map, or
 *                      strategy functions; push branchy pure logic into helpers/.
 *   • max-depth      → nesting > 3. Invert conditions & return early; extract the
 *                      inner block into a named helper.
 *   • max-statements → the function is a procedure. Extract cohesive steps into
 *                      named helpers (or a custom hook for component logic).
 *   • max-params     → pass one typed options/props object instead of a param list.
 */

// ---- reusable rich messages (rules that DO support custom text) ----
const BARREL_MSG =
  '`export *` (barrel) is only allowed inside a module `public/` folder. Barrels ' +
  'elsewhere hide the dependency graph, break tree-shaking, and invite import ' +
  'cycles. Re-export named symbols from the module\'s `public/` surface instead, ' +
  'and import from that surface.'

const INDEX_MSG =
  '`index.*` files are banned. They become cycle-prone re-export hubs. Name the ' +
  'file for what it contains, and expose a module to others via its `public/` surface.'

const ENV_MSG =
  'Read env only via `@/kernel/env`. Direct `process.env` access scatters config ' +
  'and skips validation. Add/read the value in `src/kernel/env` and import the typed ' +
  'accessor so every consumer gets a validated, single-sourced value.'

const ELEMENT_TYPES_MSG =
  '${file.type} may not import ${dependency.type}. Respect the element matrix: keep ' +
  'components pure (props in), route cross-module access through the target module\'s ' +
  '`public/` surface, and confine raw DB access to `data/`. If two elements need to ' +
  'share code, move it into `helpers/` or `types/` (same module) or `kernel/` (global).'

// Per-module DAG message: what a module in `layer` may/may not reach.
const dagMsg = (layer, may) =>
  `Layer violation: \`${layer}\` may not import this module. ${may} Cross-module use ` +
  'always goes through the target module\'s `public/` surface — never its internals. ' +
  'If you need shared code lower down, move it into `data`/`scoring` or `kernel`.'

export default tseslint.config(
  {
    ignores: [
      '.next/**', 'node_modules/**', 'supabase/**', 'next-env.d.ts', '**/*.js', '**/*.mjs',
      // Root-level build/tooling config, not architecture source.
      '*.config.ts',
      // TEMP: legacy Basejump code — linted once migrated into modules (blueprint §8).
      'src/app/**', 'src/components/**', 'src/lib/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------- global rules (all source) ----------
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
      boundaries,
      import: importPlugin,
    },
    settings: {
      'boundaries/include': ['src/**/*.{ts,tsx}'],
      'boundaries/elements': [
        // NOTE: order matters — most specific first.
        { type: 'kernel-supabase', pattern: 'src/kernel/supabase/**' },
        { type: 'kernel-env', pattern: 'src/kernel/env/**' },
        { type: 'kernel', pattern: 'src/kernel/**' },
        { type: 'public', pattern: 'src/modules/*/public/**', capture: ['module'] },
        { type: 'data', pattern: 'src/modules/*/data/**', capture: ['module'] },
        { type: 'server', pattern: 'src/modules/*/server/**', capture: ['module'] },
        { type: 'workflows', pattern: 'src/modules/*/workflows/**', capture: ['module'] },
        { type: 'components', pattern: 'src/modules/*/components/**', capture: ['module'] },
        { type: 'hooks', pattern: 'src/modules/*/hooks/**', capture: ['module'] },
        { type: 'context', pattern: 'src/modules/*/context/**', capture: ['module'] },
        { type: 'helpers', pattern: 'src/modules/*/helpers/**', capture: ['module'] },
        { type: 'types', pattern: 'src/modules/*/types/**', capture: ['module'] },
        { type: 'app', pattern: 'src/app/**' },
      ],
      'import/resolver': { typescript: { project: './tsconfig.json' } },
    },
    rules: {
      // ---- quality caps (see NUMERIC-CAP REMEDIES header for how to fix) ----
      complexity: ['error', 8],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'max-statements': ['error', 15],

      // ---- type-safety ----
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // ---- react ----
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ---- no import cycles ----
      'import/no-cycle': ['error', { maxDepth: Infinity }],

      // barrel ban (allowed only under public/, re-enabled in the public override below)
      'no-restricted-syntax': ['error', { selector: 'ExportAllDeclaration', message: BARREL_MSG }],

      // element-type matrix: pure components, public-only cross-module door, supabase fence
      'boundaries/element-types': ['error', {
        default: 'disallow',
        message: ELEMENT_TYPES_MSG,
        rules: [
          { from: ['kernel', 'kernel-env', 'kernel-supabase'], allow: ['kernel', 'kernel-env'] },
          { from: ['types'], allow: ['kernel', 'kernel-env', ['types', { module: '${from.module}' }]] },
          { from: ['helpers'], allow: ['kernel', 'kernel-env',
            ['types', { module: '${from.module}' }], ['helpers', { module: '${from.module}' }]] },
          // components: prefer PURE (props in), but may use their OWN module's hooks
          // (colocated backing hook is idiomatic React). Cross-module hooks still go
          // via public. Striving for purity without hard-lining it.
          { from: ['components'], allow: ['kernel', 'kernel-env',
            ['types', { module: '${from.module}' }],
            ['helpers', { module: '${from.module}' }],
            ['hooks', { module: '${from.module}' }],
            ['context', { module: '${from.module}' }],
            ['components', { module: '${from.module}' }]] },
          { from: ['hooks', 'context'], allow: ['kernel', 'kernel-env',
            ['data', { module: '${from.module}' }],
            ['server', { module: '${from.module}' }],
            ['hooks', { module: '${from.module}' }],
            ['context', { module: '${from.module}' }],
            ['helpers', { module: '${from.module}' }],
            ['types', { module: '${from.module}' }],
            ['public', { module: '!${from.module}' }]] },
          { from: ['server'], allow: ['kernel', 'kernel-env',
            ['data', { module: '${from.module}' }],
            ['server', { module: '${from.module}' }],
            ['helpers', { module: '${from.module}' }],
            ['types', { module: '${from.module}' }],
            ['public', { module: '!${from.module}' }]] },
          { from: ['workflows'], allow: ['kernel', 'kernel-env',
            ['server', { module: '${from.module}' }],
            ['helpers', { module: '${from.module}' }],
            ['types', { module: '${from.module}' }],
            ['public', { module: '!${from.module}' }]] },
          // data element: only in data + auth + connections modules; only these may touch the raw client
          { from: [['data', { module: 'data' }], ['data', { module: 'auth' }], ['data', { module: 'connections' }]], allow: [
            'kernel', 'kernel-env', 'kernel-supabase',
            ['data', { module: '${from.module}' }],
            ['helpers', { module: '${from.module}' }],
            ['types', { module: '${from.module}' }]] },
          // public: may import its own module's internals (any element) + kernel + OTHER public
          { from: ['public'], allow: ['kernel', 'kernel-env',
            ['public', { module: '!${from.module}' }],
            ['components', { module: '${from.module}' }],
            ['hooks', { module: '${from.module}' }],
            ['context', { module: '${from.module}' }],
            ['server', { module: '${from.module}' }],
            ['data', { module: '${from.module}' }],
            ['workflows', { module: '${from.module}' }],
            ['helpers', { module: '${from.module}' }],
            ['types', { module: '${from.module}' }]] },
          // app composes only public + kernel
          { from: ['app'], allow: ['kernel', 'kernel-env', 'public'] },
        ],
      }],

      // env fence: process.env only in kernel-env (handled by override below)
      'no-restricted-properties': ['error', { object: 'process', property: 'env', message: ENV_MSG }],
    },
  },

  // ---------- public/ may barrel ----------
  {
    files: ['src/modules/*/public/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': 'off' },
  },

  // ---------- kernel/env may read process.env ----------
  {
    files: ['src/kernel/env/**/*.{ts,tsx}'],
    rules: { 'no-restricted-properties': 'off' },
  },

  // ---------- ban index / re-export files everywhere ----------
  {
    files: ['src/**/index.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', { selector: 'Program', message: INDEX_MSG }],
    },
  },

  // ---------- per-file-type LOC caps (over cap = the file does too much; see header) ----------
  { files: ['src/modules/*/components/**/*.{ts,tsx}'],
    rules: { 'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }] } },
  { files: ['src/modules/*/hooks/**/*.{ts,tsx}', 'src/modules/*/context/**/*.{ts,tsx}'],
    rules: { 'max-lines': ['error', { max: 100, skipBlankLines: true, skipComments: true }] } },
  { files: ['src/modules/*/data/**/*.{ts,tsx}', 'src/modules/*/server/**/*.{ts,tsx}', 'src/modules/*/workflows/**/*.{ts,tsx}'],
    rules: { 'max-lines': ['error', { max: 120, skipBlankLines: true, skipComments: true }] } },
  { files: ['src/modules/*/helpers/**/*.{ts,tsx}'],
    rules: { 'max-lines': ['error', { max: 80, skipBlankLines: true, skipComments: true }] } },
  // types/ and public/ exempt from max-lines (no rule = inherits none)
  { files: ['src/modules/*/types/**/*.{ts,tsx}', 'src/modules/*/public/**/*.{ts,tsx}'],
    rules: { 'max-lines': 'off' } },
  { files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'supabase/tests/**'],
    rules: { 'max-lines': ['error', { max: 500 }], complexity: 'off', 'max-statements': 'off' } },

  // ---------- layer DAG direction (module-to-module) ----------
  // marketing (top): may go down to auth/data/scoring only; not portal/workque/scanner/connections/app.
  { files: ['src/modules/marketing/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{
      group: [
        '@/modules/portal/*', '@/modules/portal/**',
        '@/modules/workque/*', '@/modules/workque/**',
        '@/modules/scanner/*', '@/modules/scanner/**',
        '@/modules/connections/*', '@/modules/connections/**',
        '@/app/*', '@/app/**',
      ],
      message: dagMsg('marketing', 'A marketing page may only reach `auth` and the `data`/`scoring` leaves.'),
    }] }] } },
  // portal (top): may go down to auth/workque/scanner/connections/data/scoring; not marketing/app.
  { files: ['src/modules/portal/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{
      group: ['@/modules/marketing/*', '@/modules/marketing/**', '@/app/*', '@/app/**'],
      message: dagMsg('portal', 'Portal sits at the top; it may reach the mid + leaf modules but not `marketing` (a sibling top) or `app`.'),
    }] }] } },
  // mid layer (auth, workque, scanner, connections): down to data/scoring/kernel; not each other/top/app.
  { files: ['src/modules/auth/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{
      group: [
        '@/modules/marketing/**', '@/modules/portal/**',
        '@/modules/workque/**', '@/modules/scanner/**', '@/modules/connections/**', '@/app/**',
      ],
      message: dagMsg('auth', 'Mid-layer modules may reach `data`/`scoring`/`kernel` only — never a sibling mid module or a top module.'),
    }] }] } },
  { files: ['src/modules/workque/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{
      group: [
        '@/modules/marketing/**', '@/modules/portal/**',
        '@/modules/auth/**', '@/modules/scanner/**', '@/modules/connections/**', '@/app/**',
      ],
      message: dagMsg('workque', 'Mid-layer modules may reach `data`/`scoring`/`kernel` only — never a sibling mid module or a top module.'),
    }] }] } },
  { files: ['src/modules/scanner/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{
      group: [
        '@/modules/marketing/**', '@/modules/portal/**',
        '@/modules/auth/**', '@/modules/workque/**', '@/modules/connections/**', '@/app/**',
      ],
      message: dagMsg('scanner', 'Mid-layer modules may reach `data`/`scoring`/`kernel` only — never a sibling mid module or a top module.'),
    }] }] } },
  { files: ['src/modules/connections/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{
      group: [
        '@/modules/marketing/**', '@/modules/portal/**',
        '@/modules/auth/**', '@/modules/workque/**', '@/modules/scanner/**', '@/app/**',
      ],
      message: dagMsg('connections', 'Mid-layer modules may reach `data`/`scoring`/`kernel` only — never a sibling mid module or a top module.'),
    }] }] } },
  // scoring (leaf): pure scoring engine — no module imports at all, only kernel.
  { files: ['src/modules/scoring/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{
      group: [
        '@/modules/marketing/**', '@/modules/portal/**', '@/modules/auth/**',
        '@/modules/workque/**', '@/modules/scanner/**', '@/modules/connections/**',
        '@/modules/data/**', '@/app/**',
      ],
      message: dagMsg('scoring', 'Scoring is a pure leaf: it computes scores from inputs handed to it and imports nothing but `kernel` (not even `data`).'),
    }] }] } },
  // data (leaf): no module imports at all, only kernel.
  { files: ['src/modules/data/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{
      group: [
        '@/modules/marketing/**', '@/modules/portal/**', '@/modules/auth/**',
        '@/modules/workque/**', '@/modules/scanner/**', '@/modules/connections/**',
        '@/modules/scoring/**', '@/app/**',
      ],
      message: dagMsg('data', 'Data is a leaf: it owns persistence and imports nothing but `kernel` (not even `scoring`).'),
    }] }] } },
)
