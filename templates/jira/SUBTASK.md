<!--
HIERARCHY (Jira-native, this project): Epic → Feature → Subtask.
- Subtask = leaf implementation unit, parented to a Feature (native `parent` field).
- This is the ticket handed to a coding agent; it must be concrete and self-contained.
THIS TEMPLATE IS FOR THE **SUBTASK** TIER.
-->

AGENT_TICKET_INDEX_START
Summary:
{{ What this task is for. }}
{{ Why this task should exist. }}
{{ Expected implementation outcome. }}

Features:
- {{ Technical capability added or changed }}
- {{ Behavior or workflow this enables }}
- {{ Required validation or guardrail }}

Areas:
- {{ File module package or service }}
- {{ Component endpoint table or helper }}
- {{ Test surface or validation area }}
AGENT_TICKET_INDEX_END

# {{ Subtask Title }}

## Objective — REQUIRED

{{ Describe the single technical outcome this task must produce. }}

**Parent Feature:** {{ Jira link or key }}

---

## Implementation Scope — REQUIRED

**Do**

* {{ Specific change }}
* {{ Specific change }}
* {{ Required tests or validation }}

**Do Not**

* {{ Out-of-scope change }}
* {{ Unrelated refactor or deferred behavior }}

---

## Requirements — REQUIRED

* {{ Behavior or technical requirement }}
* {{ Validation, permission, or error requirement }}
* {{ Compatibility or architecture constraint }}

**Related Slice Requirements:** {{ SR-1, SR-2 }}
**Related Acceptance Criteria:** {{ AC-1, AC-2 }}

---

## Likely Files / Areas — REQUIRED

* `{{ file/module/package }}` — {{ Expected change }}
* `{{ file/module/package }}` — {{ Expected change }}

Use `Investigation required` when exact files are unknown.

---

## Technical Approach — REQUIRED

{{ Describe the expected implementation approach, existing pattern to follow, important interfaces, and data flow. }}

**Existing pattern/reference:** {{ File, component, endpoint, or None }}

---

## Inputs and Outputs — WHEN APPLICABLE

**Inputs**

* {{ Request, props, event, data, or state }}

**Outputs**

* {{ Response, UI state, persisted data, event, or side effect }}

---

## Edge Cases and Failure Handling — REQUIRED

* {{ Invalid or missing input }}
* {{ Unauthorized or unavailable state }}
* {{ API, database, or service failure }}
* {{ Duplicate, stale, or conflicting data }}

---

## Testing — REQUIRED

* [ ] {{ Unit test }}
* [ ] {{ Integration test }}
* [ ] {{ Error or edge-case test }}
* [ ] {{ Existing related tests remain passing }}

**Validation command(s):**

```bash
{{ test, lint, typecheck, or build commands }}
```

---

## Completion Criteria — REQUIRED

* [ ] The defined implementation outcome is complete.
* [ ] Requirements and referenced acceptance criteria are satisfied.
* [ ] Tests are added or updated and passing.
* [ ] Lint, type-check, and build checks pass where applicable.
* [ ] No unrelated changes were introduced.
* [ ] Any deviations or newly discovered follow-up work are documented.

---

## Agent Notes — OPTIONAL

{{ Known risks, sequencing notes, constraints, migration details, or implementation hints. }}
