# ChronoShift — Options Clarity

<!-- linear-source:b7e2fb0e-0564-47bb-ba7b-add41b63c6ba -->

Migrated from Linear on 8 October 2026. This preserves the original specification and dated history; historical workflow instructions and earlier pending statuses describe their original context. Current work is tracked in [GitHub Issues](https://github.com/Tien-Lam/time-to-local/issues) and [Projects](https://github.com/users/Tien-Lam/projects/1).

## User report

“Source time zone and reference date seem useless.”

“Date and time format options are fine but their labels are inconsistent.”

## Outcome

Make conversion options understandable and proportionate to the task. Address the source timezone/reference date feedback without silently changing how missing zones, relative dates or DST are interpreted. Retain the existing date-order and clock-format choices, with consistent, accurate labels.

## Scope

Three focused tickets: simplify source timezone/reference date interaction and explain their purposes, standardize date/time option wording, and remove raw start/end tags plus other implementation-only result labels. The user confirmed “simplify and make their purposes clear”; preserve useful correction capabilities and make their defaults and effects understandable.

## Completion evidence

Verify the reported experience in browser/DevTools, including keyboard interaction and narrow layouts. Preserve offline/local-only behavior, source/target independence and input/results through resizing. For substantial implementation, follow the repository's two independent reviewer workflow and keep full evidence under .work/<ticket-id>/.

Implementation delivered for [TIE-379](https://github.com/Tien-Lam/time-to-local/issues/103), [TIE-380](https://github.com/Tien-Lam/time-to-local/issues/104) and [TIE-381](https://github.com/Tien-Lam/time-to-local/issues/105) by three parallel ticket agents in [Tien-Lam/ChronoShift#45](https://github.com/Tien-Lam/time-to-local/pull/45). Two independent reviewers approve exact head bf9f487; [full hosted verification](https://github.com/Tien-Lam/time-to-local/actions/runs/37490236156) passes 147 unit tests, 349 browser checks and repository-subpath acceptance. Artifact checksum and exact source tree verified. Full reports are retained locally under .work; concise acceptance evidence is on each ticket and PR. Tickets remain In Review and project In Progress pending merge/publication, which have not been performed.

Completed 7 October 2026 (Sydney): approved [Tien-Lam/ChronoShift#45](https://github.com/Tien-Lam/time-to-local/pull/45) merged as 3cab83ba8f3861f11cb9f2bcb1b90068d883d14d. [Main-only serialized publication](https://github.com/Tien-Lam/time-to-local/actions/runs/37543896961) succeeded with checksum and exact-tree verified PR artifact. All four post-publication desktop/phone-emulation hosted checks pass, plus live overnight range/copy/options acceptance. [TIE-379](https://github.com/Tien-Lam/time-to-local/issues/103), [TIE-380](https://github.com/Tien-Lam/time-to-local/issues/104) and [TIE-381](https://github.com/Tien-Lam/time-to-local/issues/105) are Done with verified acceptance checklists and full local evidence. Completion is engineering/browser scope; physical-device and screen-reader exclusions and unknown historical conditions remain qualified.

Original summary: Clarify conversion controls, standardize date/time labels and remove confusing technical result tags.

<details>
<summary>Original metadata and resource index</summary>

```json
{
  "id": "P-TIE-24",
  "uuid": "b7e2fb0e-0564-47bb-ba7b-add41b63c6ba",
  "icon": null,
  "color": "#f2c94c",
  "name": "ChronoShift — Options Clarity",
  "summary": "Clarify conversion controls, standardize date/time labels and remove confusing technical result tags.",
  "url": "https://linear.app/tienlam/project/chronoshift-options-clarity-c42d89f339ae",
  "resourceCount": 0,
  "createdAt": "2026-10-06T14:39:08.371Z",
  "updatedAt": "2026-10-06T23:03:58.122Z",
  "startedAt": "2026-10-06T14:45:26.552Z",
  "completedAt": "2026-10-06T23:03:58.019Z",
  "canceledAt": null,
  "startDate": "2026-10-06",
  "startDateResolution": null,
  "targetDate": null,
  "targetDateResolution": null,
  "priority": {
    "value": 3,
    "name": "Medium"
  },
  "labels": [],
  "initiatives": [
    {
      "id": "0b5f8e78-6d80-476a-9659-535aa5f0e8f4",
      "name": "ChronoShift — Simple Offline Web App"
    }
  ],
  "lead": {},
  "leadTeam": {
    "id": "7a88d71d-eac6-404e-a83d-f3b37d5c6efa",
    "name": "Tien's Team",
    "key": "TIE"
  },
  "status": {
    "id": "61cb7c98-0b4a-4f7f-87f7-5b5e1a318774",
    "name": "Completed",
    "type": "completed"
  },
  "teams": [
    {
      "id": "7a88d71d-eac6-404e-a83d-f3b37d5c6efa",
      "name": "Tien's Team",
      "key": "TIE"
    }
  ],
  "members": [],
  "milestones": []
}
```

</details>
