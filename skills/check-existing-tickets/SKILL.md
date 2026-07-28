---
name: check-existing-tickets
description: Use before creating or decomposing Jira tickets. Pulls every non-Done SCA ticket, extracts the greppable AGENT_TICKET_INDEX block, and returns structured overlap data so agents can detect conflicting or duplicated work before writing tickets.
---

# Check Existing Tickets

Build a structured index of active Jira work before creating or decomposing tickets. This
skill is a mandatory preflight for `create-epic`, `create-feature`, `decompose-epic`, and
`decompose-feature`. See [`../_reference.md`](../_reference.md) for Jira site IDs, issue
types, query rules, and the `AGENT_TICKET_INDEX_*` block contract.

## Steps

1. **Define the proposed scope.** Write a short internal query profile from the user's
   request or parent ticket:
   - target issue type being created or decomposed
   - major features or behavior changes
   - likely code areas, modules, services, data, or workflows
   - parent issue key, if known

2. **Pull every active SCA ticket.** Use `searchJiraIssuesUsingJql` and page until the
   server returns no next page/cursor:

   ```
   searchJiraIssuesUsingJql({
     cloudId: "445d377e-62bf-40ae-95d6-fc55967a8b19",
     maxResults: 100,
     responseContentFormat: "markdown",
     jql: 'project = SCA AND statusCategory != Done ORDER BY updated DESC',
     fields: [
       "summary",
       "status",
       "issuetype",
       "created",
       "updated",
       "labels",
       "parent",
       "issuelinks",
       "description"
     ]
   })
   ```

   Keep only the extracted index block and metadata in your working output. Do not paste
   full descriptions for all issues into the final result.

3. **Extract the greppable block.** For each issue, find text between:
   - `AGENT_TICKET_INDEX_START`
   - `AGENT_TICKET_INDEX_END`

   Parse the block into `summaryLines`, `features`, and `areas` when possible. If a ticket
   has no block, set `indexBlockPresent: false` and keep a short `missingIndexReason`.

4. **Include required metadata.** For every ticket, include:
   - ticket key and URL
   - summary/title
   - status
   - issue type
   - date created
   - date modified
   - parent key/summary when present
   - linked tickets with link type, direction, key, summary, and status when available
   - labels
   - extracted agent ticket index block

5. **Score likely overlap.** Compare the proposed scope against each ticket's index block,
   summary, parent, labels, and linked tickets. Mark candidates as:
   - `high` when features or code areas clearly overlap
   - `medium` when terminology, parent, or workflow overlaps
   - `low` when only broad domain language overlaps
   - `none` when no meaningful overlap appears

6. **Return structured data only.** Return JSON unless the caller requests another structured
   format. Use this shape:

   ```json
   {
     "query": {
       "project": "SCA",
       "statusFilter": "statusCategory != Done",
       "generatedAt": "<ISO timestamp>",
       "proposedScope": {
         "issueType": "<Epic|Feature|Subtask|Unknown>",
         "parentKey": "<key or null>",
         "features": ["<short phrase>"],
         "areas": ["<short phrase>"]
       }
     },
     "overlapCandidates": [
       {
         "key": "SCA-123",
         "url": "https://shoreworks.atlassian.net/browse/SCA-123",
         "overlapScore": "high",
         "overlapReasons": ["<short reason>"]
       }
     ],
     "tickets": [
       {
         "key": "SCA-123",
         "url": "https://shoreworks.atlassian.net/browse/SCA-123",
         "title": "<summary>",
         "issueType": "<type>",
         "status": "<status>",
         "created": "<timestamp>",
         "updated": "<timestamp>",
         "parent": {
           "key": "<key>",
           "summary": "<summary>"
         },
         "linkedTickets": [
           {
             "type": "<link type>",
             "direction": "<inward|outward>",
             "key": "<key>",
             "summary": "<summary>",
             "status": "<status or null>"
           }
         ],
         "labels": ["<label>"],
         "indexBlockPresent": true,
         "agentTicketIndex": {
           "raw": "<text between markers>",
           "summaryLines": ["<line>"],
           "features": ["<bullet text>"],
           "areas": ["<bullet text>"]
         }
       }
     ],
     "missingIndexTickets": ["SCA-456"],
     "nextAction": "<none|fetch-full-overlaps|ask-user>"
   }
   ```

## Gate Behavior

- If `overlapCandidates` contains any `high` or `medium` candidates, fetch each full
  description with `getJiraIssue` before creating or decomposing anything.
- After reading full descriptions, work interactively with the user to decide whether to
  merge scope, split scope, link related tickets, finish an `incomplete-ticket` stub, or
  proceed with explicit non-overlap rationale.
- If a matching candidate has `incomplete-ticket`, do not create a new ticket for that
  scope. Finish the existing stub instead.
- Missing index blocks are not proof of no overlap. Use summary, parent, labels, links, and
  full description fetches when the ticket appears relevant.
