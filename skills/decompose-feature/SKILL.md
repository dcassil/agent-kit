---
name: decompose-feature
description: Use when the user wants to break a Feature into Subtasks — the lowest-level, code-ready tickets handed directly to an implementing agent. Investigates the codebase in depth, then creates fully-specified Subtask tickets parented to the Feature using the Subtask template.
---

# Decompose Feature

Break a **Feature** (`10013`) into **Subtask** tickets (issue type `Subtask`, id `10010`, project **SCA**), each parented to the Feature via the native `parent` field. Subtasks are the leaf tier — handed directly to a coding agent, so they must be concrete and self-contained. See [`../_reference.md`](../_reference.md) for IDs, tools, hierarchy, the mandatory active-ticket overlap check, and global gates.

> There is no "Feature Slice" tier. If a Feature is too large to decompose cleanly, that's a signal to split it into sibling Features first (`decompose-epic`/`create-feature`), then decompose each.

## Steps

1. **Read the Feature** (`getJiraIssue`) — acceptance criteria, scope, affected areas, testing notes, and any blocking decisions (skip blocked scope; isolate it). **Stub gate (FIRST):** if the Feature carries `incomplete-ticket`, **STOP** — it is a placeholder, not ready. Tell the user it must be finished (template fully filled) and the `incomplete-ticket` label removed before decomposing; do not claim it. Otherwise apply the **Work claim & lifecycle protocol** (see [`../_reference.md`](../_reference.md)): if a `decomposing-*` label owned by another handle is present, or a `decomposed` label is present, **STOP** (someone is on it / it's already done — ask the user); otherwise claim it by adding `decomposing-<your-handle>` and reconcile the race. **Board gate:** if the Feature is still in the `Needs Visual Design` backlog, move it onto the board (`To Do`, id `21`) before decomposing — don't decompose something still in the backlog.
2. **Active-ticket overlap check (GATE).** Run the `check-existing-tickets` skill using the parent Feature scope, likely Subtask scopes, and likely affected files/areas. Review the returned JSON before decomposing. If any `high` or `medium` overlap candidates exist, fetch each full description with `getJiraIssue` and work interactively with the user to merge, split, link, close, or align scope before creating Subtasks.
3. **Investigate the codebase in depth (required).** Locate the exact files, functions, components, tests, and patterns involved (`Explore`/`general-purpose`; Supabase/Vercel MCP). Resolve unknowns now — a code-ready Subtask should have no blocking open questions.
4. **Determine the Subtasks.** Size each to ~1–2 days / one focused agent run, ordered by dependency. Each maps to concrete testable outcomes and names the files/areas it touches. Propose the list; get sign-off before creating.
5. **Load the live Subtask template** (`getJiraIssueTypeMetaWithFields`, `10010`); cross-check `../../templates/jira/SUBTASK.md`; flag drift.
6. **Create each Subtask** — fill completely (precise scope, concrete acceptance criteria, named files, pattern to follow, explicit verification/testing), including the top `AGENT_TICKET_INDEX_START` / `AGENT_TICKET_INDEX_END` block from `../_reference.md`. `createJiraIssue` (SCA, `Subtask`, `parent: <FEATURE-KEY>`). No raw placeholders. **Then set status to `To Do`** (`transitionJiraIssue`, id `21`) so it doesn't linger in the `Needs Visual Design` default — unless it genuinely needs design first (leave/move to `Needs Visual Design`, id `11`). See the Status-transitions table in [`../_reference.md`](../_reference.md).
7. **Release the claim** (per [`../_reference.md`](../_reference.md)): in one `editJiraIssue`, remove `decomposing-<your-handle>` and add `decomposed`. On abort/failure instead, just remove your `decomposing-<handle>` (do not add `decomposed`).
8. **Report** the Feature + created Subtask keys/URLs; log per `AGENTS.md`.

## Gates specific to this skill
- **Never decompose a stub** — a Feature carrying `incomplete-ticket` must be finished and the label removed first (see `_reference.md`).
- **Claim before decomposing, release after** — never decompose an item locked by another `decomposing-*` handle or already marked `decomposed` (see `_reference.md`).
- Must run `check-existing-tickets` before decomposing; full-read likely overlaps and resolve with the user.
- In-depth codebase investigation precedes creation; Subtasks name the actual files/areas.
- Every created Subtask must include the top `AGENT_TICKET_INDEX_*` block with short summary, feature bullets, and code-area bullets.
- No blocking open questions remain in a code-ready Subtask (blocked scope is isolated/deferred).
- Each Subtask is independently implementable + testable, parented to the Feature (native `parent`), with explicit verification steps.
- Sizing ~1–2 days; dependencies stated so the orchestrator can sequence.
