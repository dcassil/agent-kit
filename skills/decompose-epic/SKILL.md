---
name: decompose-epic
description: Use when the user wants to break an Epic into Features. Reads the Epic, checks existing child Features first (dedup), investigates the codebase/design, determines the right set of independently deliverable Features that cover the Epic with no overlaps, gets sign-off, then creates Feature tickets parented to the Epic.
---

# Decompose Epic

Break an **Epic** (`10009`) into **Feature** tickets (`10013`, project **SCA**), each parented to the Epic via the native `parent` field. Features are the base tier; they later decompose into **Subtasks** (`decompose-feature`). See [`../_reference.md`](../_reference.md) for IDs, tools, hierarchy, and global gates.

## Steps

1. **Read the Epic** (`getJiraIssue`) and any linked design docs (Figma/Confluence). **Stub gate (FIRST):** if the Epic carries `incomplete-ticket`, **STOP** — it is a placeholder, not ready. Tell the user it must be finished (template fully filled) and the `incomplete-ticket` label removed before decomposing; do not claim it. Otherwise apply the **Work claim & lifecycle protocol** (see [`../_reference.md`](../_reference.md)): if a `decomposing-*` label owned by another handle is present, or a `decomposed` label is present, **STOP** (someone is on it / it's already done — ask the user); otherwise claim it by adding `decomposing-<your-handle>` and reconcile the race. **Board gate:** if the Epic is still in the `Needs Visual Design` backlog, move it onto the board (`To Do`, id `21`) before decomposing — don't decompose something still in the backlog.
2. **List EXISTING children first (GATE — mandatory).** `searchJiraIssuesUsingJql`: `parent = <EPIC-KEY>` plus a text search for the same concepts. Do NOT create Features that duplicate existing children. **If a child bears `incomplete-ticket` and covers scope you were about to create, finish that stub instead of creating a new Feature.** Reconcile overlaps non-destructively (link `Duplicate`, comment, recommend keep/close) and surface to the user.
3. **Investigate the codebase.** Validate the Epic's "Likely Areas Affected" against reality (`Explore`/`general-purpose` agents; Supabase/Vercel MCP). Identify seams, patterns, and open decisions.
4. **Determine the Features.** Vertical, independently deliverable. **Isolate blocking product/architecture decisions into a small set of Features** so the rest can proceed. Present the proposed list (title + outcome + covered acceptance criteria + which are blocked/why) and get sign-off before creating.
5. **Load the live Feature template** (`getJiraIssueTypeMetaWithFields`, `10013`); cross-check `FEATURE.md`.
6. **Create each Feature** — fill completely, `createJiraIssue` (SCA, `Feature`, `parent: <EPIC-KEY>`), reference the Epic acceptance criteria each covers; record blocking decisions in Open Questions and in `.agents/DECISIONS-NEEDED.md`. **Then set status to `To Do`** (`transitionJiraIssue`, id `21`) so it doesn't linger in the `Needs Visual Design` default — unless it genuinely needs design first (use `Needs Visual Design`, id `11`). See the Status-transitions table in [`../_reference.md`](../_reference.md).
7. **Release the claim** (per [`../_reference.md`](../_reference.md)): in one `editJiraIssue`, remove `decomposing-<your-handle>` and add `decomposed`. On abort/failure instead, just remove your `decomposing-<handle>` (do not add `decomposed`).
8. **Report** the Epic + created Feature keys/URLs; log per `AGENTS.md`.

## Gates specific to this skill
- **Never decompose a stub** — an Epic carrying `incomplete-ticket` must be finished and the label removed first (see `_reference.md`).
- **Claim before decomposing, release after** — never decompose an item locked by another `decomposing-*` handle or already marked `decomposed` (see `_reference.md`).
- **Check existing children before creating** — no duplicate Features; finish a matching `incomplete-ticket` stub instead of creating a new one.
- Investigation precedes creation; blocking decisions isolated to few Features.
- Every Feature parented to the Epic (native `parent`) and references its acceptance criteria.
- Features are independently deliverable vertical cuts, not layers. If one is too big, it becomes multiple sibling Features — never a slice sub-tier.
