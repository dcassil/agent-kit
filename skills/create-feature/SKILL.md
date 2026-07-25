---
name: create-feature
description: Use when the user wants to create a new Feature in Jira under an Epic. Fills out the Feature template completely, verifies no duplicate/overlapping feature already exists, links it to its parent Epic via the native parent field, then creates it via the Jira API.
---

# Create Feature

Create a **Feature** (issue type `Feature`, id `10013`, project **SCA**) as a child of an Epic. See [`../_reference.md`](../_reference.md) for IDs, tools, hierarchy, and global gates (all apply).

## Steps

1. **Load the live template.** `getJiraIssueTypeMetaWithFields` (SCA, issueTypeId `10013`, `requiredFieldsOnly:false`). Source of truth = description `defaultValue`; cross-check `../../templates/jira/FEATURE.md`; flag drift.
2. **Resolve parent Epic.** Find it via `searchJiraIssuesUsingJql`/`getJiraIssue`; confirm it's the right one.
3. **Dedup search (GATE).** Check existing Features (especially `parent = <EPIC>`) + semantic overlap. If a duplicate/overlap exists, STOP and ask. **Also check for a stub:** if a match carries `incomplete-ticket`, do NOT create a new Feature — **finish that stub** instead (fill the template, then remove `incomplete-ticket` in the same `editJiraIssue`). See "Stub / placeholder tickets" in `../_reference.md`.
4. **Fill the template completely** — no raw `{{ }}`.
5. **Review gate.** Show the rendered ticket; get approval before writing.
6. **Create + parent.** `createJiraIssue` (SCA, `Feature`, `parent: <EPIC-KEY>` — native parent field). Verify the parent resolved.
7. **Report** key + URL; log per `AGENTS.md`.

## Gates specific to this skill
- Must be parented to an Epic (native `parent`).
- No creation if an equivalent Feature exists — and if a matching `incomplete-ticket` stub exists, finish it instead of creating a new one.
- Every REQUIRED template section populated — unless deliberately creating a stub, which MUST carry the `incomplete-ticket` label and a "⚠️ INCOMPLETE — stub" note (see `../_reference.md`).
- If the feature is too large, prefer splitting into multiple sibling Features under the Epic — there is no slice tier.
