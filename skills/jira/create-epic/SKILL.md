---
name: create-epic
description: Use when the user wants to create a new top-tier Epic in Jira (a complete product/initiative like Shore Guard or Shore Code). Fills out the Epic template completely, verifies no duplicate/overlapping Epic already exists, then creates it via the Jira API.
---

# Create Epic

Create a top-tier **Epic** (issue type `Epic`, id `10009`, project **SCA**). The Epic is the product/top tier — the only issue type above base level, so it is what Features hang off. See [`../_reference.md`](../_reference.md) for IDs, tools, hierarchy, and global gates (all apply).

## Steps

1. **Load the live template.** `getJiraIssueTypeMetaWithFields` (cloudId, projectIdOrKey `SCA`, issueTypeId `10009`, `requiredFieldsOnly:false`). Use the description `defaultValue` as source of truth; cross-check `../../../templates/jira/EPIC.md` and flag drift.
2. **Dedup search (GATE).** `searchJiraIssuesUsingJql` for existing Epics + `search`/`getTeamworkGraphContext` for semantic overlap. If a plausible duplicate exists, STOP and ask. **Also check for a stub:** if a match carries `incomplete-ticket`, finish that stub instead of creating a new Epic (fill the template, then remove `incomplete-ticket`). See "Stub / placeholder tickets" in `../_reference.md`.
3. **Fill the template completely** — no raw `{{ }}`; sanctioned fallbacks only.
4. **Review gate.** Show the rendered ticket; get approval before writing (unless told to proceed).
5. **Create.** `createJiraIssue` (SCA, `Epic`) with summary + completed ADF description.
6. **Report** key + URL; log per `AGENTS.md`.

## Gates specific to this skill
- No creation if an equivalent Epic exists.
- Every REQUIRED template section populated.
- Epic is top tier: no parent. Note which Features are expected under it (feeds `create-feature` / `decompose-epic`).
