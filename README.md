# agent-kit

Reusable **agent skills and templates** shared across Daniel's repos. This repo is the single
source of truth. It is consumed two ways:

- as a **Claude Code plugin** (`.claude-plugin/plugin.json`) — skills become first-class,
  invocable slash commands; and
- as a **git submodule** mounted at `.agents/shared/` for agents/tools that read the files
  directly.

Both consumption modes use the same files — the plugin manifest is purely additive.

## What's in here

```
.claude-plugin/   # plugin.json (manifest) + marketplace.json (self-hosting marketplace)
hooks/            # plugin hooks, auto-registered when the plugin is enabled
  hooks.json                  # PostToolUse (Edit|Write|MultiEdit) → lint the changed file
  lint-changed-file.mjs       # realtime ESLint feedback for agents (repo-agnostic)
skills/           # agent skills (procedures an agent follows) — each a top-level dir
  _reference.md               # shared Jira constants/tools, linked by the jira skills
  create-epic/                # create a top-tier Epic
  create-feature/             # create a Feature under an Epic
  decompose-epic/             # break an Epic into Features
  decompose-feature/          # break a Feature into Subtasks
  teamwork-orchestration/     # multi-agent orchestration strategy
  setup-robust-lint/          # stand up architecture-enforcing ESLint (guided authoring)
templates/        # human-readable mirrors of live templates. Currently: templates/jira/
```

Skills are **top-level dirs** under `skills/` (Claude Code plugin discovery only scans one
level deep — `skills/<name>/SKILL.md`).

- `create-epic` / `create-feature` / `decompose-epic` / `decompose-feature` — create and
  decompose Epics, Features, and Subtasks in Jira, sharing the work-claim & lifecycle protocol
  and IDs in `skills/_reference.md`.
- `teamwork-orchestration` — orchestrator-owns-integration strategy for executing a plan
  across a team of dispatched agents.
- `setup-robust-lint` — guided authoring of architecture-enforcing ESLint (boundaries matrix /
  layer DAG, quality caps, barrel/index bans, env fence) with rich pattern-suggesting messages,
  on-save wiring, and an enforcement-verification gate. Carries the hard-won gotchas (the
  `eslint-plugin-boundaries` **v5-not-v7** pin, `engine-strict`, resolvable-import probing).
- `templates/jira/` — `EPIC.md`, `FEATURE.md`, `SUBTASK.md` reference copies.

## Bundled hook — realtime lint feedback for agents

`hooks/hooks.json` registers a **PostToolUse** hook (matcher `Edit|Write|MultiEdit`) that runs
`hooks/lint-changed-file.mjs` on every edited `.ts`/`.tsx`. The script walks up from the edited
file to the nearest `eslint.config.mjs`, lints just that file with the owning app's `eslint_d`,
and (on violations) returns the messages to the agent so it fixes them immediately. It is
**repo-agnostic and zero-config** — enabling the plugin auto-registers it; no per-repo
`.claude/settings.json` edits. Pairs naturally with `setup-robust-lint`, but works with any repo
that has a flat ESLint config.

## Using agent-kit as a Claude Code plugin

This repo doubles as a single-plugin marketplace. Add it once, then install:

```
/plugin marketplace add dcassil/agent-kit
/plugin install agent-kit@agent-kit
```

Skills are then invocable as slash commands (`/create-epic`, `/create-feature`,
`/decompose-epic`, `/decompose-feature`, `/teamwork-orchestration`) and auto-trigger from
their descriptions. Restart / reload Claude Code after installing so skills are scanned.

Paths **inside** this repo are self-contained: skills reference templates by relative path
(e.g. `../../../templates/jira/EPIC.md`), so they resolve wherever the kit is mounted.

### Project-side files this kit expects (NOT included here)

Some skills refer to per-project **coordination scratch** that lives in the *consuming*
project, not in this kit. Keep these at the project's orchestration-root `.agents/` (one level
up from this submodule):

- `.agents/agents-registry.md` — who owns which agent/worktree (see the concurrency model).
- `.agents/DECISIONS-NEEDED.md` — blocking decisions surfaced during decomposition.

These are project state and intentionally stay out of the shared kit.

---

## Using agent-kit in another repo

### 1. Add the submodule (one-time, per repo)

From the **git repo root** of the consuming project:

```bash
git submodule add git@github.com:dcassil/agent-kit.git .agents/shared
git commit -m "chore(agents): add agent-kit as .agents/shared submodule"
```

(Use the HTTPS URL `https://github.com/dcassil/agent-kit.git` if you don't use SSH.)

### 2. Point your agent instructions at it

Add (or extend) these files at the repo root so Claude, Codex, and other agents discover it:

- **`CLAUDE.md`** (Claude Code):
  ```markdown
  Shared agent skills/templates live in `.agents/shared/` (the agent-kit submodule).
  Project-specific instructions live in `.agents/AGENTS.md`.
  @.agents/AGENTS.md
  ```
- **`AGENTS.md`** (Codex / other agents):
  ```markdown
  Read `.agents/AGENTS.md` and everything it links, including the shared kit under
  `.agents/shared/` (skills/ and templates/), and follow them.
  ```
- In your project's `.agents/AGENTS.md`, reference kit skills as `.agents/shared/skills/...`
  and templates as `.agents/shared/templates/...`. Keep coordination scratch
  (`agents-registry.md`, `DECISIONS-NEEDED.md`) alongside `AGENTS.md` at `.agents/`.

### 3. Tell an agent to wire it up (copy/paste prompt)

> Add the `agent-kit` submodule to this repo: run
> `git submodule add git@github.com:dcassil/agent-kit.git .agents/shared`, then create/extend
> `CLAUDE.md` and `AGENTS.md` at the repo root to point at `.agents/shared/` and
> `.agents/AGENTS.md` per the agent-kit README. Update any existing references to jira skills
> or templates so they resolve to `.agents/shared/skills/...` and `.agents/shared/templates/...`.

### 4. Cloning a repo that already uses it

```bash
git clone --recurse-submodules <repo-url>
# or, in an existing clone:
git submodule update --init --recursive
```

### Updating to the latest kit

```bash
git -C .agents/shared pull origin main
git add .agents/shared && git commit -m "chore(agents): bump agent-kit"
```

The submodule is pinned to a commit per consuming repo, so updates are deliberate.

---

## Contributing changes back

Edit skills/templates **inside this repo** (or inside a project's `.agents/shared/` working
copy, then push from there), commit, and push to `main`. Bump the submodule pointer in each
consuming repo when you want the change to land there.
