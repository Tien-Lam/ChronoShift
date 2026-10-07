# ChronoShift — Web Delivery

<!-- linear-source:302fdd5f-a683-490b-9c4b-71073e0dd834 -->

Migrated from Linear on 8 October 2026. This preserves the original specification and dated history; historical workflow instructions and earlier pending statuses describe their original context. Current work is tracked in [GitHub Issues](https://github.com/Tien-Lam/time-to-local/issues) and [Projects](https://github.com/users/Tien-Lam/projects/1).

## Completed — 6 October 2026

All delivery tickets are Done except [TIE-322](https://github.com/Tien-Lam/time-to-local/issues/87), canceled when native Android maintenance was retired. The user explicitly approved closing [TIE-370](https://github.com/Tien-Lam/time-to-local/issues/96) with the historical cause documented as unknown: original controller/cache state was never uploaded and cannot be reconstructed. Shipped mitigation and improved diagnostic retention retain independent review and matching acceptance evidence; this decision does not claim proof of the original cause. All project milestones are complete within the previously amended browser/DevTools scope. Earlier In Progress notes below are historical and superseded by this disposition.

## Delivery status — 6 October 2026

Release validation and publication are complete within the user's amended browser/DevTools scope. [TIE-317](https://github.com/Tien-Lam/time-to-local/issues/82), [TIE-318](https://github.com/Tien-Lam/time-to-local/issues/83) and [TIE-320](https://github.com/Tien-Lam/time-to-local/issues/85) are Done. [TIE-370](https://github.com/Tien-Lam/time-to-local/issues/96) remains In Progress solely for the lost historical controller/cache diagnosis; no cause is inferred from current successful runs. [Tien-Lam/ChronoShift#42](https://github.com/Tien-Lam/time-to-local/pull/42) is merged and published; gate136units/274first-attempt browser passes/9CDPskips/subpath passes, with no failed attempts/retries. Main d7b3d4 and tested e11e579 share reviewed tree c72b1b7. Ticket descriptions contain matching acceptance evidence and limitations.

Physical hardware/install/OS-share/screen-reader and unavailable actual zoom are excluded or unclaimed, not certified. Public cached reopen/update evidence is network-enabled; separate stopped-origin offline proof and five-profile/subpath automation provide offline evidence. Full QA/reviews remain ignored locally by ticket. Historical physical acceptance language below is superseded by the user’s current scope.

Establish reproducible Bun/mise web CI, exact browser correctness and performance checks, local-only data handling, and GitHub Pages static publishing with rollback. The user has explicitly retired native Android development: remove its source/build/model/release tooling now, preserve history and standalone web fixtures, and cancel native-suite maintenance. Remaining physical-device/browser acceptance is web work and does not block removal of the native application.

Original summary: Web-only Pages delivery complete. All active tickets Done; native maintenance canceled. Historical offline CI cause documented as unknown with explicit user-approved closure.

## Linked resources

- [ChronoShift repository](https://github.com/Tien-Lam/time-to-local)

<details>
<summary>Original metadata and resource index</summary>

```json
{
  "id": "P-TIE-17",
  "uuid": "302fdd5f-a683-490b-9c4b-71073e0dd834",
  "icon": null,
  "color": "#f7c8c1",
  "name": "ChronoShift — Web Delivery",
  "summary": "Web-only Pages delivery complete. All active tickets Done; native maintenance canceled. Historical offline CI cause documented as unknown with explicit user-approved closure.",
  "url": "https://linear.app/tienlam/project/chronoshift-web-delivery-dab90fb49a74",
  "resourceCount": 1,
  "createdAt": "2026-10-03T12:26:53.008Z",
  "updatedAt": "2026-10-06T07:32:10.517Z",
  "startedAt": "2026-10-03T13:34:25.421Z",
  "completedAt": "2026-10-06T07:32:10.461Z",
  "canceledAt": null,
  "startDate": "2026-10-03",
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
  "milestones": [
    {
      "id": "dd4052cc-9fd3-4bc9-8366-d9921b9f7f19",
      "name": "Web release candidate",
      "description": "Web CI, exact browser fixtures, offline checks, browser/DevTools accessibility, amended desktop performance budgets and privacy audit pass. Physical hardware/phone benchmarks are excluded or unclaimed. [TIE-370](https://linear.app/tienlam/issue/TIE-370/diagnose-offline-update-ci-flake-and-retain-retry-diagnostics) is Done by explicit user approval: completed mitigation/diagnostics shipped, original historical cause remains unknown because its runtime state was never retained. Closure documents the limitation rather than proving that cause.",
      "targetDate": null,
      "progress": "100%"
    },
    {
      "id": "897e485b-5c7b-4ee1-8769-df0af789a3aa",
      "name": "Web-only delivery",
      "description": "The repository is web-only, user/developer docs describe the web product, native app/build/model/dependency workflows are retired, and GitHub Pages publishing/rollback remain verified. Historical commits/releases and standalone conversion fixtures remain available.",
      "targetDate": null,
      "progress": "100%"
    }
  ],
  "resources": [
    {
      "type": "link",
      "id": "1e619145-d59f-4f88-a820-e95d1839e4fb",
      "label": "ChronoShift repository",
      "url": "https://github.com/Tien-Lam/ChronoShift",
      "createdAt": "2026-10-03T12:26:53.951Z"
    }
  ]
}
```

</details>

## Dated status updates

### 2026-10-04T02:40:34.076Z — Tien Long Lam

<!-- linear-source:f71b763c-db77-46cd-b864-6d3927d7a87f -->

The modern Glass Command app is published on GitHub Pages; native maintenance remains removed. TIE-317 remains for real Android Chrome/iPhone Safari offline restart/zone/copy; TIE-318 for named-phone cold/warm and p95/editing/Clear assessment; TIE-320 for actual installed production offline restart with new input. Refreshed desktop performance reports retain the WebKit offline outlier and cannot certify phone budgets.

[PR #22](https://github.com/Tien-Lam/time-to-local/pull/22) is merged as main88c4457. [Web gate](https://github.com/Tien-Lam/time-to-local/actions/runs/37197579724) passes108 units,118 browser scenarios and the Pages-path check. [Pages publication](https://github.com/Tien-Lam/time-to-local/actions/runs/37197795794) reused the digest/tree-verified tested artifact641c5c23; four live HTTPS checks pass. Actual browser-side-panel update preserved the draft and reconverted correctly. Both independent code/adversarial agents approved final source/evidence with no blockers.

Final equivalent successful PR+main pair:37.5% fewer rounded runner minutes,40.39% less runner time and74.96% lower projected artifact byte-hours against the recorded baseline. This is a paired repository sample, not account-wide monthly billing; failed/canceled/debug runs are not counted as savings.

[Browser evidence](https://github.com/Tien-Lam/time-to-local/blob/main/docs/qa/glass-command-2026-10-04/README.md) · [Acceptance gaps](https://github.com/Tien-Lam/time-to-local/blob/main/docs/planning/web-acceptance.md).

Changes recorded with this update:

**Status**: In Progress
**Priority**: Medium
**Start date** set to Oct 3rd

_Progress since Oct 3_:
— **Web release candidate** added: 25%
— **Web-only delivery** added: 25%

<details>
<summary>Update provenance</summary>

```json
{
  "id": "f71b763c-db77-46cd-b864-6d3927d7a87f",
  "health": "onTrack",
  "url": "https://linear.app/tienlam/project/chronoshift-web-delivery-dab90fb49a74/activity#project-update-f71b763c",
  "createdAt": "2026-10-04T02:40:34.076Z",
  "updatedAt": "2026-10-04T11:15:49.969Z",
  "editedAt": "2026-10-04T11:15:49.934Z",
  "archivedAt": null,
  "isDiffHidden": false,
  "user": {
    "id": "9eae46f7-c527-49bc-8d6a-465118651013",
    "name": "Tien Long Lam"
  },
  "type": "project",
  "project": {
    "id": "302fdd5f-a683-490b-9c4b-71073e0dd834",
    "name": "ChronoShift — Web Delivery"
  }
}
```

</details>
