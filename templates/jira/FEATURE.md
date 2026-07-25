<!--
HIERARCHY (Jira-native, this project): Epic → Feature → Subtask.
- Feature = base-level issue, parented to an Epic (native `parent` field). Every Feature
  must belong to an Epic.
- Decompose a Feature into **Subtasks** (parented to the Feature) for implementation.
- There is NO "Feature Slice" tier: if this Feature is too large, split it into multiple
  sibling Features under the same Epic — do not create an intermediate level.
THIS TEMPLATE IS FOR THE **FEATURE** TIER.
-->

# {{ Feature Title }}

## Feature Overview — REQUIRED

**Detail level:** 2–4 sentences.

Summarize:

* What is being added or changed
* Who it is for
* Why it matters
* The expected outcome

{{ Concise overview of the feature and its intended value. }}

---

## Feature Description — REQUIRED

**Detail level:** 3–8 paragraphs or a concise bullet list.

Describe the intended behavior and experience in enough detail that an agent can understand the feature without inventing major requirements.

Include where relevant:

* Primary user workflow
* Key capabilities
* Important business rules
* Expected success and failure behavior
* Major edge cases
* What is explicitly out of scope

{{ Describe how the feature should work. }}

### In Scope

* {{ Included capability }}
* {{ Included capability }}

### Out of Scope

* {{ Excluded or deferred capability }}
* {{ Excluded or deferred capability }}

---

## Acceptance Criteria — REQUIRED

**Detail level:** 3–10 testable outcomes.

* [ ] {{ Observable outcome }}
* [ ] {{ Observable outcome }}
* [ ] {{ Error, permission, or edge-case behavior }}
* [ ] {{ Existing behavior that must remain unchanged }}

Acceptance criteria should describe behavior, not implementation steps.

---

## Feature Design — REQUIRED WHEN APPLICABLE

Provide links, screenshots, wireframes, workflow diagrams, or written descriptions.

* **Design links:** {{ Figma, document, screenshot, or Not Applicable }}
* **Workflow description:** {{ Brief explanation or Not Applicable }}
* **Content requirements:** {{ Required labels, messages, or copy guidance }}
* **Responsive or accessibility considerations:** {{ Requirements or Not Applicable }}

An implementation agent should not invent substantial UX or final user-facing copy when the design is unresolved.

---

## Likely Areas Affected — REQUIRED

List the applications, modules, packages, services, repositories, or major components likely to be touched.

| Area                       | Expected Change                           |
| -------------------------- | ----------------------------------------- |
| `{{ app/module/package }}` | {{ Brief description of likely changes }} |
| `{{ app/module/package }}` | {{ Brief description of likely changes }} |

Use `Unknown — investigation required` when the affected area is not yet known.

This list is directional and should be validated against the current codebase before implementation.

---

## Architecture Impact — REQUIRED

### Does this introduce new architecture needs or decisions?

**Answer:** Yes / No / Possibly / Investigation Required

{{ Describe any new boundaries, patterns, integrations, data flows, ownership decisions, or architectural questions. }}

### Decisions Required

* {{ Architecture or product decision }}
* {{ Architecture or product decision }}
* {{ None }}

Unresolved decisions that materially affect implementation should be resolved before dependent work begins.

---

## New Application, Module, or Package — REQUIRED

### Is a new application, module, package, or service expected?

**Answer:** Yes / No / Possibly / Investigation Required

If yes or possibly:

* **Proposed name:** `{{ name or TBD }}`
* **Purpose:** {{ Responsibility }}
* **Why existing components are insufficient:** {{ Explanation }}
* **Expected owner or boundary:** {{ Application, domain, team, or TBD }}

Do not create a new package or service solely for organizational convenience when an existing boundary is appropriate.

---

## Infrastructure and Data Impact — REQUIRED

### Will this require new infrastructure, servers, databases, queues, storage, or external services?

**Answer:** Yes / No / Possibly / Investigation Required

| Resource                                                                            | New or Modified | Description           |
| ----------------------------------------------------------------------------------- | --------------- | --------------------- |
| {{ Database, table, queue, service, job, bucket, API, environment variable, etc. }} | New / Modified  | {{ Expected change }} |

Consider:

* Database schema or migrations
* Background jobs or queues
* Serverless functions or workers
* External APIs or vendors
* Secrets and environment variables
* Storage
* Authentication or permissions
* Monitoring and alerts
* Deployment or hosting changes

Use `No infrastructure changes expected` when applicable.

---

## Dependencies and Constraints — REQUIRED WHEN APPLICABLE

### Dependencies

* {{ Related epic, feature, API, migration, team, or external service }}
* {{ None }}

### Constraints

* {{ Required technology, compatibility rule, performance limit, or delivery constraint }}
* {{ None }}

---

## Open Questions and Assumptions — REQUIRED

### Open Questions

* **Blocking:** {{ Question that must be answered before implementation }}
* **Non-blocking:** {{ Question that can be resolved during implementation }}
* {{ None }}

### Assumptions

* {{ Assumption currently being treated as true }}
* {{ None }}

Agents must not silently convert assumptions into confirmed requirements.

---

## Implementation Notes — OPTIONAL

Use this section for known guidance that will help decomposition or implementation.

* {{ Existing pattern to follow }}
* {{ Relevant files or prior implementations }}
* {{ Suggested sequencing }}
* {{ Known technical risk }}
* {{ Migration or rollout consideration }}

This section may guide implementation but does not override acceptance criteria.

---

## Testing Notes — REQUIRED

Describe the minimum validation expected.

* **Unit:** {{ Logic or components requiring tests }}
* **Integration:** {{ APIs, database, services, or module interactions }}
* **End-to-end:** {{ Critical user workflow }}
* **Regression:** {{ Existing behavior that must remain intact }}
* **Manual validation:** {{ Required checks or Not Applicable }}

---

## Agent Decomposition Guidance — REQUIRED

When turning this epic into stories and tasks, the agent should:

1. Validate the likely affected areas against the current repository.
2. Identify unresolved blocking decisions before creating implementation tasks.
3. Create stories around independently testable outcomes.
4. Prefer vertical feature slices over file-by-file or layer-by-layer stories.
5. Separate infrastructure, migration, and investigation work when independently deliverable.
6. Reference the relevant acceptance criteria in each story.
7. Avoid unrelated refactoring.
8. Surface contradictions, missing requirements, and risky assumptions rather than inventing answers.
9. Include testing, observability, permissions, and failure handling where relevant.
10. Mark the epic complete only when its acceptance criteria have been validated.
