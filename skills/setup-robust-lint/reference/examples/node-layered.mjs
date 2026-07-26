// EXAMPLE — reference exemplar for the setup-robust-lint skill. Adapt to the target
// repo's real layers; do not copy verbatim. Shape: a linear layered Node service with
// dependencies flowing strictly downward (daemon → runner → plugins → graph → domain
// → contracts → utils) enforced by boundaries + an env fence. Requires
// eslint-plugin-boundaries@^5 (see ../packages-and-pitfalls.md — v7 silently disarms it).

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import boundaries from 'eslint-plugin-boundaries'
import importPlugin from 'eslint-plugin-import'

/**
 * shore-runner ESLint config — architecture & quality guard rails.
 *
 * This is a layered Node service. Dependencies flow STRICTLY downward:
 *
 *   daemon → runner → plugins → graph → domain → contracts → utils
 *   (entry)  (orch.)  (adapters)(algos) (models) (seam DTOs) (leaf)
 *
 *   • utils    — pure leaf helpers (logger, dates, exclude). Import nothing internal.
 *   • contracts— zod DTOs for the Shore seam (ScanMetrics, …). Import: contracts, utils.
 *   • domain   — scan/repo/metric models & logic over the DTOs. Import: domain, contracts, utils.
 *   • graph    — dependency-graph algorithms. Import: graph, domain, contracts, utils.
 *   • plugins  — tool/access adapters + registries. Import: plugins, graph, domain, contracts, utils.
 *   • runner   — ScanRunner orchestration + aggregation. Import: runner, plugins, graph, domain, contracts, utils, config.
 *   • daemon   — long-running entrypoint + seam client. Import: runner, plugins, domain, contracts, utils, config.
 *   • config   — the ONLY env-reading boundary (process.env lives here).
 *
 * NUMERIC-CAP REMEDIES (ESLint core rules below cannot carry a custom message,
 * so the fixes live here — read this when one trips):
 *   • max-lines        → the file does too much. Split by responsibility into
 *                        sibling files (e.g. `aggregator.ts` + `aggregator.merge.ts`),
 *                        or extract pure helpers into `utils/`.
 *   • complexity       → too many branches. Replace nested if/else with early
 *                        returns, a lookup table/registry, or strategy functions.
 *   • max-depth        → nesting > 3. Invert conditions & return early; extract
 *                        the inner block into a named helper.
 *   • max-statements   → the function is a procedure. Extract cohesive steps into
 *                        named helpers that each say what they do.
 *   • max-params       → pass a single typed options object instead of a param list.
 */

// ---- reusable rich messages (rules that DO support custom text) ----
const BARREL_MSG =
  'Barrel files (`export *`) are banned in shore-runner. They hide the real ' +
  'dependency graph, defeat tree-shaking, and create import cycles. Export ' +
  'named symbols from the file that defines them and import from that file directly.'

const INDEX_MSG =
  '`index.ts` re-export hubs are banned. They centralize imports into a cycle-prone ' +
  'chokepoint. Name the file for what it contains (e.g. `registry.ts`, `scan.ts`) ' +
  'and import it directly by that name.'

const ENV_MSG =
  'process.env may only be read in `src/config.ts` (the env boundary). Everywhere ' +
  'else, accept the resolved value as a typed argument (see DaemonConfig) so units ' +
  'stay pure and testable. Need a new setting? Add it to loadConfig() and thread it in.'

const boundaryMsg = (extra) =>
  '${file.type} may not import ${dependency.type}. ' +
  'Dependencies must flow downward (daemon→runner→plugins→graph→domain→contracts→utils). ' +
  extra

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.config.mjs', '*.config.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------- global rules (all source) ----------
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { boundaries, import: importPlugin },
    settings: {
      'boundaries/include': ['src/**/*.ts'],
      'boundaries/elements': [
        // NOTE: order matters — most specific first.
        { type: 'config', pattern: 'src/config.ts', mode: 'file' },
        { type: 'utils', pattern: 'src/utils/**' },
        { type: 'domain', pattern: 'src/domain/**' },
        { type: 'contracts', pattern: 'src/contracts/**' },
        { type: 'graph', pattern: 'src/graph/**' },
        { type: 'plugins', pattern: 'src/plugins/**' },
        { type: 'runner', pattern: 'src/runner/**' },
        { type: 'daemon', pattern: 'src/daemon/**' },
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

      // ---- no import cycles ----
      'import/no-cycle': ['error', { maxDepth: Infinity }],

      // ---- barrel ban (runner has no public/ surface — never allowed) ----
      'no-restricted-syntax': ['error', { selector: 'ExportAllDeclaration', message: BARREL_MSG }],

      // ---- layered boundaries: strictly downward ----
      'boundaries/element-types': ['error', {
        default: 'disallow',
        message: boundaryMsg('If you need something from a higher layer, invert the ' +
          'dependency: pass it in as an argument or move the shared type down into `domain`/`contracts`.'),
        rules: [
          { from: ['utils'], allow: ['utils'] },
          { from: ['contracts'], allow: ['contracts', 'utils'] },
          { from: ['domain'], allow: ['domain', 'contracts', 'utils'] },
          { from: ['graph'], allow: ['graph', 'domain', 'contracts', 'utils'] },
          { from: ['plugins'], allow: ['plugins', 'graph', 'domain', 'contracts', 'utils'] },
          { from: ['runner'], allow: ['runner', 'plugins', 'graph', 'domain', 'contracts', 'utils', 'config'] },
          { from: ['daemon'], allow: ['daemon', 'runner', 'plugins', 'domain', 'contracts', 'utils', 'config'] },
          { from: ['config'], allow: ['config', 'contracts', 'domain', 'utils'] },
        ],
      }],

      // ---- env fence: process.env only in config.ts ----
      'no-restricted-properties': ['error', { object: 'process', property: 'env', message: ENV_MSG }],
    },
  },

  // ---------- config.ts is the env boundary ----------
  { files: ['src/config.ts'], rules: { 'no-restricted-properties': 'off' } },

  // ---------- ban index / re-export hub files everywhere ----------
  {
    files: ['src/**/index.ts'],
    rules: { 'no-restricted-syntax': ['error', { selector: 'Program', message: INDEX_MSG }] },
  },

  // ---------- per-layer LOC caps (a file over cap is doing too much — split it) ----------
  { files: ['src/utils/**/*.ts', 'src/domain/**/*.ts'],
    rules: { 'max-lines': ['error', { max: 120, skipBlankLines: true, skipComments: true }] } },
  { files: ['src/graph/**/*.ts', 'src/plugins/**/*.ts', 'src/runner/**/*.ts', 'src/daemon/**/*.ts'],
    rules: { 'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }] } },
  // contracts are declarative zod schemas — a higher cap, still bounded.
  { files: ['src/contracts/**/*.ts'],
    rules: { 'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }] } },

  // ---------- tests: relaxed caps, no complexity gate ----------
  { files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'max-lines': ['error', { max: 500 }],
      complexity: 'off',
      'max-statements': 'off',
      'boundaries/element-types': 'off',
    } },
)
