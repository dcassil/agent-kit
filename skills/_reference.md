# Jira Reference (Shore Works)

Shared constants, tools, and conventions used by every Jira skill in this kit
(`create-epic`, `create-feature`, `decompose-epic`, `decompose-feature`). Skills link here
instead of repeating this.

## Site / IDs

| Thing | Value |
|-------|-------|
| Site | `shoreworks.atlassian.net` |
| `cloudId` | `445d377e-62bf-40ae-95d6-fc55967a8b19` |
| Primary project | **SCA** (id `10001`) — "Shore Code - Agentic" |
| Secondary project | **SCRUM** (id `10000`) — "shore works" |

### SCA issue types (the hierarchy we use)

| Type | id | Hierarchy level | Used by skill |
|------|----|----|----|
| Epic | `10009` | 1 | top / product tier (create-epic) |
| Feature | `10013` | 0 | mid tier, `parent` = Epic (create-feature) |
| Subtask | `10010` | -1 | leaf / code-ready, `parent` = Feature (decompose-feature) |
| Product | `10011` | 0 | NOT USED as a tier (base level can't parent Features) |
| Feature Slice | `10014` | 0 | NOT USED (no slice tier — split big Features instead) |
| Task | `10015` | 0 | NOT USED as the leaf tier (use Subtask; Task can't be parented below a Feature) |
| Bug | `10012` | 0 | standalone |

**Hierarchy (decided 2026-07-23, "Option A" — Jira-native):**
**Epic → Feature → Subtask.**
- Only **Epic** is above base level, so it is the top/product tier. `Feature.parent = Epic`
  (native). `Subtask.parent = Feature` (native). This is the max native depth (3 tiers).
- **No "Feature Slice" tier.** If a Feature is too big, split it into multiple sibling
  Features under the same Epic — never an intermediate level.
- The `Product`, `Feature Slice`, and `Task` issue types are NOT used as tiers (all are
  base-level and can't be parented below a Feature). Leaf work = **Subtask**.
- Everything below Epic uses the **native `parent` field** — NOT issue links. (Issue links
  like `Duplicate`/`Relates` are only for cross-references, not the tier tree.)
- Templates: `../templates/jira/{EPIC,FEATURE,SUBTASK}.md`.

## Available Atlassian MCP tools (`Atlassian-Rovo-MCP`)

Load schemas on demand with ToolSearch (`select:<name>`), then call.

**Discovery / read**
- `getAccessibleAtlassianResources` — resolve cloudId
- `getVisibleJiraProjects` — projects + issue types
- `getJiraProjectIssueTypesMetadata` — issue types for a project
- `getJiraIssueTypeMetaWithFields` — **createmeta**; returns required fields and
  the description `defaultValue` (the template) BEFORE creating anything
- `getJiraIssue` — read an existing issue
- `searchJiraIssuesUsingJql` — dedup / existence search
- `search` — Rovo/Teamwork cross-product search (natural language)
- `getTeamworkGraphContext` / `getTeamworkGraphObject` — relationships between
  work items, goals, teams (use for "is there something similar?")
- `getIssueLinkTypes`, `getTransitionsForJiraIssue`, `lookupJiraAccountId`

**Write**
- `createJiraIssue` — create Product/Feature/Slice/Task
- `editJiraIssue` — amend fields after creation
- `createIssueLink` — link child ↔ parent / related
- `addCommentToJiraIssue`, `transitionJiraIssue`, `addWorklogToJiraIssue`

## Other relevant tools/skills in this repo

- **Metis** MCP + skills — local Flight-Levels planning. Jira is the shared
  system of record; Metis is optional local decomposition scratch space.
- **Supabase** / **Vercel** MCP — for codebase investigation during decompose
  steps (schema, deployments).
- `Explore` / `general-purpose` agents — for codebase investigation fan-out.

## Querying / listing issues (avoid huge payloads)

`searchJiraIssuesUsingJql`'s default field set includes `description` (ADF), so
listing a backlog or board returns hundreds of KB and can blow the token limit —
even a `status`-only query returns rich status objects. **Rule: whenever you list
more than one issue, pass an explicit thin `fields` array and
`responseContentFormat: "markdown"`; only pull `description` (or `*all`) for the
handful of issues you then need to read closely (via `getJiraIssue` or a second
narrow JQL).**

Status names in SCA (exact): `To Do`, `Needs Visual Design` (= "waiting on
design"), `Defered`, `In Progress`, `In Review`, `Done`. The three canonical
recipes below cover the common asks. All use `cloudId`
`445d377e-62bf-40ae-95d6-fc55967a8b19`, project **SCA**.

### 1. Backlog + board, actionable only, THIN — "what should I work next?"

Use this when asked to look at Jira for next tickets to work, what to do next, or
any general request to look at ticket**s** (plural) in Jira — to get a thinner
result set, then request details for the tickets you need to look at more closely.

```
searchJiraIssuesUsingJql({
  cloudId, maxResults: 100, responseContentFormat: "markdown",
  jql: 'project = SCA AND status IN ("To Do", "Needs Visual Design") ORDER BY updated DESC',
  fields: ["summary", "status", "issuetype", "labels", "parent"]
})
```
(No `description`, no `issuelinks` — just enough to pick. Then `getJiraIssue` the
one(s) you'll act on.)

### 2. Board / active queue, actionable, WITH description — "what's on the board?"

Use this when asked to look at or for tickets on the board / active sprint / queued
for work, etc. Same filter as #1 but includes body text for a fuller read.

```
searchJiraIssuesUsingJql({
  cloudId, maxResults: 50, responseContentFormat: "markdown",
  jql: 'project = SCA AND status IN ("To Do", "Needs Visual Design") ORDER BY updated DESC',
  fields: ["summary", "status", "issuetype", "labels", "parent", "description"]
})
```
Keep `maxResults` modest (≤50) since `description` is the heavy field; page with
`nextPageToken` if needed.

### 3. Everything, any status, THIN — "research / what's related?"

Use this when asked to research tickets, look up what other tickets are related to
some task / feature, survey the whole project, etc. No status filter; thin fields
plus `issuelinks` so related tickets (key + summary) come back inline.

```
searchJiraIssuesUsingJql({
  cloudId, maxResults: 100, responseContentFormat: "markdown",
  jql: 'project = SCA ORDER BY updated DESC',
  fields: ["summary", "status", "issuetype", "labels", "parent", "issuelinks"]
})
```
`issuelinks` gives each linked issue's `key` + `fields.summary` and the link type,
so you get related-ticket numbers and titles without expanding each one. Then
`getJiraIssue` only the specific tickets you need in full.

## Global gates (apply to ALL jira skills)

1. **Read the live template first.** Always fetch
   `getJiraIssueTypeMetaWithFields` for the target issue type and use its
   description `defaultValue` as the source of truth. The files in
   `../templates/jira/` are the human-readable mirror; if they disagree,
   the Jira createmeta wins — flag the drift.
2. **No placeholders survive.** A created ticket must have every `{{ ... }}`
   replaced. If a value is genuinely unknown, write the template's sanctioned
   fallback (e.g. "Unknown — investigation required", "Not Applicable",
   "None"), never a raw `{{ }}`.
3. **Dedup before create.** Never create a Product/Feature without first
   searching for an existing same/similar item (JQL + Rovo/Teamwork Graph). If
   a likely duplicate exists, STOP and ask the user.
4. **Confirm before write.** Creating/linking Jira issues is outward-facing.
   Show the fully-rendered ticket body and get explicit approval before calling
   `createJiraIssue`, unless the user has said to proceed without asking.
5. **Correct project + type.** Default to project **SCA** and the issue-type id
   named in each skill. Confirm if the user implies a different project.
6. **Link to parent.** Child tickets (Feature, Feature Slice, Task) must be
   linked to their parent on creation. Verify the link resolved.
7. **Report the key + URL** of anything created, and log it per `AGENTS.md`
   work-claim conventions when running alongside other agents.

## Work claim & lifecycle protocol (applies to `decompose-*` skills and to working any item)

Agents share one Jira account, so `assignee` can't distinguish them. Claims are made
with **owner-encoded labels** carrying a *primary handle* (the same handle registered
in `.agents/agents-registry.md`). This gives cross-team mutual exclusion (two teams
never work the same item at once) and a visible lifecycle on every item.

### Ownership is at the TEAM (primary) level

The handle on every label is the **primary's handle**, never a worker's. In an
orchestrator+worker run, the **primary is the sole writer of Jira labels** — workers
only write code. So a subtask a worker is implementing carries `working-<primary>`,
set and cleared by the primary. Which specific worker is on which task is tracked in
`.agents/agents-registry.md` (the child-agent row names its Jira key), NOT in Jira.

### Two kinds of label

- **Locks** (exclusive, carry handle): `decomposing-<handle>`, `working-<handle>`.
  Only one team may hold a given lock on an item.
- **Markers** (persistent, no handle): `decomposed`, `finished`. They accumulate and
  record that a phase completed.
- **Stub marker** (persistent, no handle): `incomplete-ticket`. Marks a ticket created
  as a deliberate **placeholder** whose body is intentionally not fully filled per the
  template. See "Stub / placeholder tickets" below.

### Stub / placeholder tickets (`incomplete-ticket`)

Sometimes we create a ticket now to record intent for later work whose details are still
coupled to unbuilt/undecided things (e.g. a dashboard state that depends on the scan
pipeline). Such a ticket is created with the **`incomplete-ticket`** label and is the one
sanctioned exception to global gate #2 ("No placeholders survive"): it may leave REQUIRED
template sections stubbed, but must carry a clear **"⚠️ INCOMPLETE — stub"** note at the
top of its description stating what is missing and what must happen before it can proceed.

Rules enforced by the `create-*` and `decompose-*` skills:

- **Before creating (dedup extension):** in the dedup search, also look for an existing
  ticket bearing `incomplete-ticket` that already covers this scope. If one exists, do
  **NOT** create a new ticket — **finish the existing stub** instead: fully fill out its
  template, then remove the `incomplete-ticket` label (same `editJiraIssue`). Only create
  anew if no stub covers it.
- **Before decomposing OR working (hard gate):** if the target item carries
  `incomplete-ticket`, **STOP**. A stub is not ready. Tell the user it must be finished
  (template fully filled) and the `incomplete-ticket` label removed before it can be
  decomposed or worked. Do not claim `decomposing-*` / `working-*` on a stub.
- Removing `incomplete-ticket` is the act of "promoting" the stub to a real ticket.

### Lifecycle by item type

- **Epic:** `decomposing-<h>` → `decomposed`.
- **Feature:** `decomposing-<h>` → `decomposed` → `working-<h>` → `finished`.
- **Subtask (leaf):** `working-<h>` → `finished` (never decomposed).

### Claiming a phase (GATE — before decomposing OR before working an item)

`getJiraIssue` and inspect labels:
- A matching lock (`decomposing-*` / `working-*`) present that is **not yours** →
  STOP; another team owns it.
- The terminal marker for the phase already present (`decomposed` before decomposing,
  `finished` before working) → STOP and ask the user (don't redo).
- Otherwise → **claim:** `editJiraIssue` to add `decomposing-<your-handle>` (to
  decompose) or `working-<your-handle>` (to work it).

**Reconcile the race:** immediately re-read the issue. If two or more locks of the
same kind now exist (two teams raced the check→claim window), the **lowest-sorted
handle wins**; every other owner removes its own lock and backs off. (No
compare-and-swap exists in the API — this reconciliation closes the gap.)

### Transitions (each is ONE `editJiraIssue`, remove + add together)

- Finish decomposing: remove `decomposing-<h>`, add `decomposed`.
- Start work (e.g. primary hands a subtask to a worker): add `working-<h>`
  (the `decomposed` marker, if present, stays).
- Finish work (after the primary verifies + merges the worker's output): remove
  `working-<h>`, add `finished`.

**On abort/failure of a phase:** remove your lock (`decomposing-<h>` / `working-<h>`)
so the item isn't left falsely locked; do **not** add the terminal marker.
