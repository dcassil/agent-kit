---
name: teamwork-orchestration
description: Use when executing a multi-step plan, initiative, or set of implementation tasks that could be parallelized across agents. The main session acts as ORCHESTRATOR — it dispatches sub/codex agents to write code (parallel where file-disjoint, serial where they share files), owns all git and verification, and commits directly to the working branch. Use whenever the user says "orchestrate", "run the team", "teamwork", "dispatch agents", or hands you a plan/initiative to execute.
---

# Teamwork Orchestration

A strategy for executing a plan by **coordinating a team of agents** instead of writing all
the code in one session. The main session is the **orchestrator**: it decomposes the work,
dispatches implementing agents, and owns integration. Implementing agents only write files.

This keeps one coordinator responsible for integration so concurrent agents don't collide.

## Roles

**Orchestrator (main session)**
- Owns **ALL git**: staging, verification, merges, and commits. Commit **directly to the
  working branch** (`main` in `shore_works`) — no PRs or worktrees unless the project says so.
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
   re-dispatches anything broken, then **commits directly to the working branch**. Only the
   orchestrator touches git.

7. **Advance** to the next wave and repeat until the plan is done.

## Guardrails

- One coordinator owns integration — agents never merge, commit, or push.
- Disjoint files → parallel; shared files → serial. When unsure, serialize.
- Keep the work-log authoritative; update claims as waves start and finish.
- Verification is the orchestrator's job, run once per wave, never inside a racing agent.

## Project note (shore_works)

Daniel overrode the `.agents` default of PRs/worktrees for this repo: commit **directly to
`main`** yourself as the orchestrator. Coordination scratch lives at the orchestration-root
`.agents/` (`work-log.md`, `agents-registry.md`, `DECISIONS-NEEDED.md`, `PRODUCT-DECISIONS.md`).
