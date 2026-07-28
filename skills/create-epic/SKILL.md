---
name: create-epic
description: Use when the user wants to create a new top-tier Epic in Jira (a complete product/initiative like Shore Guard or Shore Code). Fills out the Epic template completely, verifies no duplicate/overlapping Epic already exists, then creates it via the Jira API.
---

# Create Epic

Create a top-tier **Epic** (issue type `Epic`, id `10009`, project **SCA**). The Epic is the product/top tier — the only issue type above base level, so it is what Features hang off. See [`../_reference.md`](../_reference.md) for IDs, tools, hierarchy, the mandatory active-ticket overlap check, and global gates (all apply).

## Steps

1. **Load the live template.** `getJiraIssueTypeMetaWithFields` (cloudId, projectIdOrKey `SCA`, issueTypeId `10009`, `requiredFieldsOnly:false`). Use the description `defaultValue` as source of truth; cross-check `../../templates/jira/EPIC.md` and flag drift.
2. **Active-ticket overlap check (GATE).** Run the `check-existing-tickets` skill using the proposed Epic scope and expected child Feature areas. Review the returned JSON for overlapping active tickets. If any `high` or `medium` overlap candidates exist, fetch each full description with `getJiraIssue` and work interactively with the user to merge, split, link, close, or align scope before creating anything.
3. **Dedup search (GATE).** `searchJiraIssuesUsingJql` for existing Epics + `search`/`getTeamworkGraphContext` for semantic overlap. If a plausible duplicate exists, STOP and ask. **Also check for a stub:** if a match carries `incomplete-ticket`, finish that stub instead of creating a new Epic (fill the template, then remove `incomplete-ticket`). See "Stub / placeholder tickets" in `../_reference.md`.
4. **Fill the template completely** — no raw `{{ }}`; sanctioned fallbacks only.
5. **Review gate.** Show the rendered ticket; get approval before writing (unless told to proceed).
6. **Create.** `createJiraIssue` (SCA, `Epic`) with summary + completed ADF description. **Then set status to `To Do`** (`transitionJiraIssue`, id `21`) so it doesn't linger in the `Needs Visual Design` default. See the Status-transitions table in [`../_reference.md`](../_reference.md).
7. **Report** key + URL; log per `AGENTS.md`.

## Gates specific to this skill
- No creation if an equivalent Epic exists.
- Must run `check-existing-tickets` before creating; full-read likely overlaps and resolve with the user.
- Every REQUIRED template section populated.
- Epic is top tier: no parent. Note which Features are expected under it (feeds `create-feature` / `decompose-epic`).
