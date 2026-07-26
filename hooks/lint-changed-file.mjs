#!/usr/bin/env node
/**
 * agent-kit PostToolUse hook — realtime ESLint feedback for agents.
 *
 * After an Edit/Write/MultiEdit, lint just the changed file against whichever
 * app owns it (nearest ancestor eslint.config.mjs) and, if it has violations,
 * hand the messages back to the agent so it can fix them immediately instead of
 * discovering them at CI time.
 *
 * Repo-agnostic by design: it resolves the owning app by walking up from the
 * edited file to the nearest `eslint.config.mjs`, so it works in single-app and
 * multi-app repos alike, with zero per-repo configuration. Enabling agent-kit is
 * all that's required (the harness auto-discovers hooks/hooks.json).
 *
 * Uses the owning app's local `eslint_d` (warm daemon) for near-instant single-
 * file lints; falls back to `eslint` if the daemon binary is absent.
 *
 * Exit codes: 0 = clean/skip (silent). 2 = violations found — for PostToolUse,
 * exit 2 surfaces stderr to the agent as actionable feedback (the edit already
 * ran; this just informs the fix).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

// Read the hook payload from stdin (JSON).
let payload = {}
try {
  payload = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const filePath = payload?.tool_input?.file_path
if (!filePath || !/\.(ts|tsx)$/.test(filePath)) process.exit(0)

// Walk up from the file to find the app root (dir with an eslint.config.mjs).
function findAppRoot(startFile) {
  let dir = dirname(resolve(startFile))
  const stop = resolve('/')
  while (dir !== stop) {
    if (existsSync(join(dir, 'eslint.config.mjs'))) return dir
    dir = dirname(dir)
  }
  return null
}

const appRoot = findAppRoot(filePath)
if (!appRoot) process.exit(0)

const eslintD = join(appRoot, 'node_modules', '.bin', 'eslint_d')
const eslint = join(appRoot, 'node_modules', '.bin', 'eslint')
const bin = existsSync(eslintD) ? eslintD : existsSync(eslint) ? eslint : null
if (!bin) process.exit(0)

const res = spawnSync(bin, ['--no-warn-ignored', '--format', 'stylish', filePath], {
  cwd: appRoot,
  encoding: 'utf8',
})

// eslint exits non-zero when there are lint errors.
if (res.status && res.status !== 0) {
  const out = `${res.stdout || ''}${res.stderr || ''}`.trim()
  process.stderr.write(
    `ESLint found issues in ${filePath}. Fix them before moving on ` +
      `(each message includes the pattern to use):\n\n${out}\n`,
  )
  process.exit(2)
}

process.exit(0)
