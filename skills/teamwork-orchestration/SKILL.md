---
name: teamwork-orchestration
description: Use when executing a multi-step plan, initiative, or set of implementation tasks that could be parallelized across agents. The main session acts as ORCHESTRATOR — it dispatches sub/codex agents to write code (parallel where file-disjoint, serial where they share files), owns all git and verification, and integrates by merging its branch into the integration branch from a throwaway checkout. Use whenever the user says "orchestrate", "run the team", "teamwork", "dispatch agents", or hands you a plan/initiative to execute.
---

# Teamwork Orchestration

A strategy for executing a plan by **coordinating a team of agents** instead of writing all
the code in one session. The main session is the **orchestrator (primary)**: it decomposes the
work, dispatches implementing agents, and owns integration. Implementing agents only write files.

This keeps one coordinator responsible for integration so concurrent agents don't collide.

## Roles

**Orchestrator (primary / main session)**
- Works in its **own git worktree + branch** under `../.worktrees/<slug>` — never directly in a
  shared working tree.
- Owns **ALL git**: staging, verification, commits, merges, and pushes. Workers never touch git.
- Runs lint / typecheck / build **after** workers finish (agents must not run these).
- Decomposes the plan into self-contained tasks; maintains the work-claim log; resolves
  cross-task dependencies.
- Integrates by merging its branch into the **integration branch** (`develop`) from a throwaway
  checkout (step 7) and pushing `develop` on its own authority once the branch is green. It does
  **not** push the protected/release branch (`main`) — that is promoted only by the human.

**Implementing agents (sub-agents / codex)**
- **Write files only.** Do NOT run git, and do NOT run verification that could race a concurrent
  agent (e.g. an install step vs another agent's typecheck).
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

5. **Dispatch and monitor.** As the **sole writer of Jira labels + status**, for each leaf
   ticket you hand to a worker: first ensure it's **on the board, not the backlog** — a ticket
   still in `Needs Visual Design` is design-blocked and not ready to work. Otherwise, in the same
   beat, add `working-<your-handle>` and transition its status to **In Progress** (`31`), which
   moves it onto the board (see the Status-transitions and Backlog-vs-board notes in
   [`../_reference.md`](../_reference.md)). Then launch the wave and check in on background
   agents about **every 5 minutes** for hangs (use a scheduled wake-up as a fallback;
   completion notifications also fire automatically). Workers never touch Jira.

6. **Integrate each wave.** When a wave completes, run lint / typecheck / build, fix or
   re-dispatch anything broken, then commit the wave to **your feature branch** (in your
   worktree). Only the orchestrator touches git.

7. **Merge to the integration branch from a dedicated throwaway checkout — never the shared
   tree.** When the branch is done and green, merge it into the integration branch (`develop`)
   in a **fresh, disposable git worktree**, then remove it. Do **not** run
   `git checkout <integration-branch>` / merge inside a shared working tree: another primary may
   have it checked out with uncommitted changes, and switching branches or stashing there
   corrupts their state and forces a fragile stash-and-restore. The isolated-worktree flow
   keeps the shared tree completely undisturbed:

   ```sh
   # from the repo root; <branch> is your finished feature branch, develop the integration branch
   git fetch origin
   git worktree add ../.worktrees/merge-<slug> origin/develop
   cd ../.worktrees/merge-<slug>
   git merge --no-ff <branch>
   # run verification (lint/typecheck/test/build) HERE
   git push origin HEAD:develop
   cd -                       # never left your own worktree
   git worktree remove ../.worktrees/merge-<slug>
   ```

   If a merge must happen in a shared tree anyway, first confirm it is clean (`git status`
   empty) and on the expected branch; if not, stop — do not stash another primary's work.

   **After the merge to `develop` is pushed and green**, close out each ticket that shipped in
   this wave: in one `editJiraIssue` remove `working-<your-handle>` and add `finished`, and
   transition status → **In Review** (`41`). (Status becomes **Done** (`51`) only when the
   human promotes `develop` → `main` — never push `main` yourself.)

8. **Advance** to the next wave and repeat until the plan is done.

## Guardrails

- **Always work in a worktree.** Every primary (and any worker that builds or commits
  independently) does its code work in a git worktree + branch under `../.worktrees/<slug>` —
  **never directly in a shared working tree** — unless the user *expressly* says to work on
  `develop` or `main`. This is the default for all work.
- **A primary orchestrator MAY commit and push `develop` itself.** Once its workers are done and
  the merged branch is verified green, the primary integrates and pushes `develop` on its own
  authority — it does not wait for human sign-off to push `develop`. Only the orchestrating
  primary does this; worker agents never merge, commit, or push.
- **The protected/release branch (`main`) is promoted only by the human.** Agents never commit,
  merge, or push to it.
- **Never disturb a shared working tree to integrate.** Branch-switching, stashing, or `reset` in
  a tree another primary is using corrupts their state. Merge in a dedicated throwaway worktree
  and remove it (see Procedure step 7).
- Disjoint files → parallel; shared files → serial. When unsure, serialize.
- Keep the work-log authoritative; update claims as waves start and finish.
- Verification is the orchestrator's job, run once per wave, never inside a racing agent.

## Project conventions

Branch names, protected branches, work-claim/label protocol, and registry locations come from
the host repo's `AGENTS.md` — read it before orchestrating. For `shore_works`: the integration
branch is `develop` (primaries merge there via step 7); `main` is promoted only by the human;
owned agents are registered in `.agents/agents-registry.md`; work is claimed via the Jira
lifecycle labels **and status transitions** in [`../_reference.md`](../_reference.md); and coordination scratch lives at the
orchestration-root `.agents/` (`work-log.md`, `agents-registry.md`, `DECISIONS-NEEDED.md`,
`PRODUCT-DECISIONS.md`).
