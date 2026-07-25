---
name: decompose-feature
description: Use when the user wants to break a Feature into Subtasks — the lowest-level, code-ready tickets handed directly to an implementing agent. Investigates the codebase in depth, then creates fully-specified Subtask tickets parented to the Feature using the Subtask template.
---

# Decompose Feature

Break a **Feature** (`10013`) into **Subtask** tickets (issue type `Subtask`, id `10010`, project **SCA**), each parented to the Feature via the native `parent` field. Subtasks are the leaf tier — handed directly to a coding agent, so they must be concrete and self-contained. See [`../_reference.md`](../_reference.md) for IDs, tools, hierarchy, and global gates.

> There is no "Feature Slice" tier. If a Feature is too large to decompose cleanly, that's a signal to split it into sibling Features first (`decompose-epic`/`create-feature`), then decompose each.

## Steps

1. **Read the Feature** (`getJiraIssue`) — acceptance criteria, scope, affected areas, testing notes, and any blocking decisions (skip blocked scope; isolate it). **Stub gate (FIRST):** if the Feature carries `incomplete-ticket`, **STOP** — it is a placeholder, not ready. Tell the user it must be finished (template fully filled) and the `incomplete-ticket` label removed before decomposing; do not claim it. Otherwise apply the **Work claim & lifecycle protocol** (see [`../_reference.md`](../_reference.md)): if a `decomposing-*` label owned by another handle is present, or a `decomposed` label is present, **STOP** (someone is on it / it's already done — ask the user); otherwise claim it by adding `decomposing-<your-handle>` and reconcile the race.
2. **Investigate the codebase in depth (required).** Locate the exact files, functions, components, tests, and patterns involved (`Explore`/`general-purpose`; Supabase/Vercel MCP). Resolve unknowns now — a code-ready Subtask should have no blocking open questions.
3. **Determine the Subtasks.** Size each to ~1–2 days / one focused agent run, ordered by dependency. Each maps to concrete testable outcomes and names the files/areas it touches. Propose the list; get sign-off before creating.
4. **Load the live Subtask template** (`getJiraIssueTypeMetaWithFields`, `10010`); cross-check `../../../templates/jira/SUBTASK.md`; flag drift.
5. **Create each Subtask** — fill completely (precise scope, concrete acceptance criteria, named files, pattern to follow, explicit verification/testing). `createJiraIssue` (SCA, `Subtask`, `parent: <FEATURE-KEY>`). No raw placeholders.
6. **Release the claim** (per [`../_reference.md`](../_reference.md)): in one `editJiraIssue`, remove `decomposing-<your-handle>` and add `decomposed`. On abort/failure instead, just remove your `decomposing-<handle>` (do not add `decomposed`).
7. **Report** the Feature + created Subtask keys/URLs; log per `AGENTS.md`.

## Gates specific to this skill
- **Never decompose a stub** — a Feature carrying `incomplete-ticket` must be finished and the label removed first (see `_reference.md`).
- **Claim before decomposing, release after** — never decompose an item locked by another `decomposing-*` handle or already marked `decomposed` (see `_reference.md`).
- In-depth codebase investigation precedes creation; Subtasks name the actual files/areas.
- No blocking open questions remain in a code-ready Subtask (blocked scope is isolated/deferred).
- Each Subtask is independently implementable + testable, parented to the Feature (native `parent`), with explicit verification steps.
- Sizing ~1–2 days; dependencies stated so the orchestrator can sequence.
