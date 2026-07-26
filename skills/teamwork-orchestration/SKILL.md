---
name: teamwork-orchestration
description: Use when executing a multi-step plan, initiative, or set of implementation tasks that could be parallelized across agents. The main session acts as ORCHESTRATOR — it dispatches sub/codex agents to write code (parallel where file-disjoint, serial where they share files), owns all git and verification, and integrates by merging to the shared branch from a throwaway checkout. Use whenever the user says "orchestrate", "run the team", "teamwork", "dispatch agents", or hands you a plan/initiative to execute.
---

# Teamwork Orchestration

A strategy for executing a plan by **coordinating a team of agents** instead of writing all
the code in one session. The main session is the **orchestrator**: it decomposes the work,
dispatches implementing agents, and owns integration. Implementing agents only write files.

This keeps one coordinator responsible for integration so concurrent agents don't collide.

## Roles

**Orchestrator (main session)**
- Owns **ALL git**: staging, verification, merges, and commits. Works in its **own worktree +
  branch** (`../.worktrees/<slug>`) and integrates by merging to the shared integration branch
  (`develop` in `shore_works`) from a **throwaway checkout** (step 7) — never in the shared tree.
- Runs lint / typecheck / build **after** agents finish. Agents must not run these.
- Decomposes the plan into self-contained tasks and assigns them to agents.
- Maintains the work-claim log and resolves cross-task dependencies.

**Implementing agents (sub-agents / codex)**
- **Write files only.** Instruct them explicitly: do NOT run git, and do NOT run verification
  that could race a concurrent agent (e.g. `yarn install` vs another agent's typecheck).
- Have **zero prior context** — every task must be fully self-contained.

## Procedure

1. **Read the plan.** Identify the discrete tasks and the files each one touches.

2. **Split into waves by file-disjointness.**
   - **Parallel** when agents touch *different* files — dispatch them in one batch.
   - **Serial** when tasks share a file (e.g. every edit to `eslint.config.mjs`) — sequence
     them so only one agent writes a given file at a time.

3. **Maintain a work-claim log** at the project's `.agents/work-log.md` with an exclusive
   file claim per agent. Never let two in-flight agents claim the same file.

4. **Write fully self-contained task prompts.** Each dispatched agent gets: the exact plan
   file + task number, the specific files to create/edit, the acceptance criteria, and the
   explicit "no git, no verification" constraint. Assume it knows nothing else.

5. **Dispatch and monitor.** Launch a wave, then check in on background agents about
   **every 5 minutes** for hangs (use a scheduled wake-up as a fallback; completion
   notifications also fire automatically).

6. **Integrate.** When a wave completes, the orchestrator runs lint/typecheck/build, fixes or
   re-dispatches anything broken, then commits. Only the orchestrator touches git.

7. **Merge from a dedicated throwaway checkout — never the shared tree.** When merging a
   finished branch into a shared integration branch (e.g. `develop`), do the checkout →
   merge → verify → push in a **fresh, disposable git worktree**, then remove it. Do **not**
   run `git checkout <integration-branch>` / merge inside the main (shared) working tree:
   another primary may have that tree checked out with uncommitted changes, and switching
   branches or stashing there corrupts their state and forces a fragile stash-and-restore.
   The isolated-worktree flow keeps the shared tree completely undisturbed:

   ```sh
   # from the repo root; <branch> is the finished feature branch, develop the target
   git fetch origin
   git worktree add ../.worktrees/merge-<slug> origin/develop
   cd ../.worktrees/merge-<slug>
   git merge --no-ff <branch>
   # run verification (lint/typecheck/test/build) HERE
   git push origin HEAD:develop
   cd -                       # never left the shared tree
   git worktree remove ../.worktrees/merge-<slug>
   ```

   If a merge must happen in a shared tree anyway, first confirm it is clean
   (`git status` empty) and on the expected branch; if not, stop — do not stash another
   primary's work.

8. **Advance** to the next wave and repeat until the plan is done.

## Guardrails

- **Always work in a worktree.** Every primary (and any worker that builds or commits
  independently) does its code work in a git worktree + branch under `../.worktrees/<slug>` —
  **never directly in a shared `main`/`develop` working tree** — unless the user *expressly*
  says to work on `develop` or `main`. This is the default for all work.
- **A primary orchestrator MAY commit and push to `develop` itself.** Once its workers are
  done and the merged branch is verified green, the primary integrates and pushes `develop`
  on its own authority — it does not wait for human sign-off to push `develop`. `main` is
  promoted only by the human. (Worker agents still never merge, commit, or push — only the
  orchestrating primary does.)
- Disjoint files → parallel; shared files → serial. When unsure, serialize.
- Keep the work-log authoritative; update claims as waves start and finish.
- Verification is the orchestrator's job, run once per wave, never inside a racing agent.
- **Never disturb the shared working tree to merge.** Branch-switching, stashing, or
  `reset` in a tree another primary is using corrupts their state. Merge in a dedicated
  throwaway worktree and remove it (see Procedure step 7).

## Project note (shore_works)

Per `AGENTS.md`, each **primary** agent works in its own git worktree + branch under
`../.worktrees/<slug>` — never directly in the shared main working tree — and integrates by
**merging to `develop`** (via the throwaway-checkout flow in step 7), not to `main`. `main`
stays untouched until Daniel promotes it. Register owned agents in `.agents/agents-registry.md`
and claim work via the Jira lifecycle labels described in `AGENTS.md` / `skills/jira/_reference.md`.
Coordination scratch lives at the orchestration-root `.agents/` (`work-log.md`,
`agents-registry.md`, `DECISIONS-NEEDED.md`, `PRODUCT-DECISIONS.md`).
