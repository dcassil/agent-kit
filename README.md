# agent-kit

Reusable **agent skills and templates** shared across Daniel's repos. This repo is the single
source of truth; individual projects consume it as a **git submodule** mounted at
`.agents/shared/`.

## What's in here

```
skills/      # agent skills (procedures an agent follows). Currently: skills/jira/
templates/   # human-readable mirrors of live templates. Currently: templates/jira/
```

- `skills/jira/` — create/decompose Epics, Features, and Subtasks in Jira, with the shared
  work-claim & lifecycle protocol in `skills/jira/_reference.md`.
- `templates/jira/` — `EPIC.md`, `FEATURE.md`, `SUBTASK.md` reference copies.

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
