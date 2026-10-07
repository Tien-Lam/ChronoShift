# ChronoShift — Web Conversion Foundations

<!-- linear-source:1b014dbc-997d-43eb-8348-8e3423366fe9 -->

Migrated from Linear on 8 October 2026. This preserves the original specification and dated history; historical workflow instructions and earlier pending statuses describe their original context. Current work is tracked in [GitHub Issues](https://github.com/Tien-Lam/time-to-local/issues) and [Projects](https://github.com/users/Tien-Lam/projects/1).

Port the conversion specification to TypeScript, replace Android-only parser plumbing, and establish exact behavioral fixtures. Preserve correct timezone semantics rather than blindly matching current display bugs. Ship deterministic parsing without requiring ML Kit or an LLM. The separate AI feasibility ticket is optional and does not block first release.

Original summary: Build a tested browser conversion engine from the existing parsing rules and corpus.

## Linked resources

- [Reviewed redesign and ML feasibility](https://github.com/Tien-Lam/time-to-local/pull/22)
- [ChronoShift repository](https://github.com/Tien-Lam/time-to-local)

<details>
<summary>Original metadata and resource index</summary>

```json
{
  "id": "P-TIE-14",
  "uuid": "1b014dbc-997d-43eb-8348-8e3423366fe9",
  "icon": null,
  "color": "#5e6ad2",
  "name": "ChronoShift — Web Conversion Foundations",
  "summary": "Build a tested browser conversion engine from the existing parsing rules and corpus.",
  "url": "https://linear.app/tienlam/project/chronoshift-web-conversion-foundations-39a0ab099497",
  "resourceCount": 2,
  "createdAt": "2026-10-03T12:26:16.049Z",
  "updatedAt": "2026-10-04T11:11:07.225Z",
  "startedAt": "2026-10-03T12:33:32.268Z",
  "completedAt": "2026-10-04T11:11:07.224Z",
  "canceledAt": null,
  "startDate": "2026-10-03",
  "startDateResolution": null,
  "targetDate": null,
  "targetDateResolution": null,
  "priority": {
    "value": 2,
    "name": "High"
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
      "id": "563034f1-6adb-4c03-8656-cba38ec9b8df",
      "name": "Contract & browser baseline",
      "description": "Conversion/UX contract recorded, reproducible web scaffold builds, portable exact fixtures exist, and the timezone adapter works on the target browser matrix.",
      "targetDate": null,
      "progress": "100%"
    },
    {
      "id": "4a977be3-d961-4b27-b91c-045d0e34d1c1",
      "name": "Conversion parity",
      "description": "Real browser parser passes the approved fixture set: date context/ranges/order, fixed offsets vs IANA DST, supported cities and Unix seconds, ambiguity and deduplication. Cancellation and input limits are verified.",
      "targetDate": null,
      "progress": "100%"
    }
  ],
  "resources": [
    {
      "type": "link",
      "id": "b4667a46-d660-4b4d-85fa-240709d116a8",
      "label": "Reviewed redesign and ML feasibility",
      "url": "https://github.com/Tien-Lam/ChronoShift/pull/22",
      "createdAt": "2026-10-04T11:11:08.168Z"
    },
    {
      "type": "link",
      "id": "5c828d92-c905-4cd3-acc5-31d42881334e",
      "label": "ChronoShift repository",
      "url": "https://github.com/Tien-Lam/ChronoShift",
      "createdAt": "2026-10-03T12:26:16.946Z"
    }
  ]
}
```

</details>

## Dated status updates

### 2026-10-04T06:06:50.135Z — Tien Long Lam

<!-- linear-source:2d6ae4c9-5062-4484-9d32-862870cd8fa8 -->

**Foundations Completed**: all11 tickets TIE-292–302 are Done; both engineering milestones are100%. TIE-302 closes as measured feasibility/deferral: actual pinned GLiNER/native-ONNX/browser-WASM inference, frozen exact comparison and measured assets. Defer shipping ML: quantized graph60.83MB and no incremental conversion benefit over the parsing-rule control in this bounded sample. No trained product, phone/memory/cache/window result or production ML deployment is claimed.

[PR #22](https://github.com/Tien-Lam/time-to-local/pull/22) is merged as main88c4457. [Web gate](https://github.com/Tien-Lam/time-to-local/actions/runs/37197579724) passes108 units,118 browser scenarios and the Pages-path check. [Pages publication](https://github.com/Tien-Lam/time-to-local/actions/runs/37197795794) reused the digest/tree-verified tested artifact641c5c23; four live HTTPS checks pass. Actual browser-side-panel update preserved the draft and reconverted correctly. Both independent code/adversarial agents approved final source/evidence with no blockers.

Final equivalent successful PR+main pair:37.5% fewer rounded runner minutes,40.39% less runner time and74.96% lower projected artifact byte-hours against the recorded baseline. This is a paired repository sample, not account-wide monthly billing; failed/canceled/debug runs are not counted as savings.

[Browser evidence](https://github.com/Tien-Lam/time-to-local/blob/main/docs/qa/glass-command-2026-10-04/README.md) · [Acceptance gaps](https://github.com/Tien-Lam/time-to-local/blob/main/docs/planning/web-acceptance.md).

Changes recorded with this update:

**Status**: In Progress
**Priority**: High
**Start date** set to Oct 3rd

_Progress since Oct 3_:
— **Contract & browser baseline** added: 100%
— **Conversion parity** added: 100%

<details>
<summary>Update provenance</summary>

```json
{
  "id": "2d6ae4c9-5062-4484-9d32-862870cd8fa8",
  "health": "onTrack",
  "url": "https://linear.app/tienlam/project/chronoshift-web-conversion-foundations-39a0ab099497/activity#project-update-2d6ae4c9",
  "createdAt": "2026-10-04T06:06:50.135Z",
  "updatedAt": "2026-10-04T11:15:35.651Z",
  "editedAt": "2026-10-04T11:15:35.622Z",
  "archivedAt": null,
  "isDiffHidden": false,
  "user": {
    "id": "9eae46f7-c527-49bc-8d6a-465118651013",
    "name": "Tien Long Lam"
  },
  "type": "project",
  "project": {
    "id": "1b014dbc-997d-43eb-8348-8e3423366fe9",
    "name": "ChronoShift — Web Conversion Foundations"
  }
}
```

</details>
