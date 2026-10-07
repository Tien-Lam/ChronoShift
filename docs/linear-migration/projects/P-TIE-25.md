# ChronoShift — Design Exploration

<!-- linear-source:cc49c8c3-43c1-4bb0-aafe-8c14017981b3 -->

Migrated from Linear on 8 October 2026. This preserves the original specification and dated history; historical workflow instructions and earlier pending statuses describe their original context. Current work is tracked in [GitHub Issues](https://github.com/Tien-Lam/time-to-local/issues) and [Projects](https://github.com/users/Tien-Lam/projects/1).

Research and prototype selection are complete. User approved the final compact-header A/B pair on 7 October 2026 and requested tickets with docs.

[TIE-382](https://github.com/Tien-Lam/time-to-local/issues/106): completed research of AI labs/infrastructure sites and Linear application controls.
[TIE-383](https://github.com/Tien-Lam/time-to-local/issues/107): completed prototypes and user-selected A/B refinement.
[TIE-384](https://github.com/Tien-Lam/time-to-local/issues/108): parent production delivery ticket.
[TIE-385](https://github.com/Tien-Lam/time-to-local/issues/109): approved workspace/header/controls/theme implementation.
[TIE-386](https://github.com/Tien-Lam/time-to-local/issues/110): integrated regression/accessibility/offline/PWA verification and independent reviews; blocked on [TIE-385](https://github.com/Tien-Lam/time-to-local/issues/109).

[Approved spec](https://github.com/Tien-Lam/time-to-local/blob/main/docs/linear-migration/documents/e0a57819-2bcd-460c-91ea-207585eb6b1d.md) is the source of truth for the current design. It includes final screenshots and a downloadable source/built preview. Earlier research/iteration records remain supporting history.

Coordinate with Options Clarity [TIE-379](https://github.com/Tien-Lam/time-to-local/issues/103)/380/381 (PR #45); preserve their corrections and avoid duplicate implementation. Production implementation/publication remain outstanding. Keep input local/transient, ambiguity explicit, source and target independent and update activation user-controlled. Follow repository full lifecycle/review/main-only serialized publishing gates for delivery.

## Production delivery complete — 7 October 2026

[TIE-384](https://github.com/Tien-Lam/time-to-local/issues/108)/385/386 completed after two independent final approvals, exact full gate (147unit/494browser passed,9existingCDP-only skips,zero failed/retry attempts,1subpath), conditional [Tien-Lam/ChronoShift#46](https://github.com/Tien-Lam/time-to-local/pull/46) merge, serialized main-only publication with digest/full-tree/14file payload verification,10hosted checks and older-tab explicit-update draft preservation. [Live app](https://tien-lam.github.io/ChronoShift/). Fulltree68437270/main4eef61bc/tested source3d3677df; detailed durable acceptance on tickets/PR, full raw reports/recordings local ignored. Browser/DevTools scope only; no physical-device/screen-reader/phone-performance claim. Original historical Linux CI event causes remain unverified; feature completion does not label them resolved.

## New follow-up work — 7 October 2026

[TIE-387](https://github.com/Tien-Lam/time-to-local/issues/111) is now in progress for user-reported blue rectangular tap feedback, clarified Android/Chrome. Prior redesign delivery remains complete; this follow-up is separate. Browser-emulated default blue tap color is observed, but native overlay pixels/original handset history remain unverified. Minimal rounded visible touch feedback and independent lifecycle/accessibility reviews are underway before conditional merge/publication.

## Mobile tap-feedback follow-up accepted

[TIE-387](https://github.com/Tien-Lam/time-to-local/issues/111) is Done after independent code/adversarial approvals, full CI and matching exact published Android Chromium evidence. [Tien-Lam/ChronoShift#47](https://github.com/Tien-Lam/time-to-local/pull/47) merged/published; 147 unit tests, 500 browser checks, subpath verification and ten hosted checks pass. Native blue overlay is replaced by rounded theme feedback; explicit update preserves draft/results. Original handset/version/cache history stays unknown and physical testing remains excluded. All six ChronoShift project inventories refreshed after closure: no unfinished tickets. Prior redesign acceptance remains unchanged.

## Reopened for UI foundations follow-up

New parentTIE-388 and childrenTIE-389/390 are now in progress with parallel owners. Work covers the newly reported desktop Paste/Clear alignment and a reusable component/gallery/semantic verification workflow. Prior completed redesign and mobile-tap acceptance remain unchanged. Project completion awaits matching new-ticket evidence.

7 October 2026: [TIE-388](https://github.com/Tien-Lam/time-to-local/issues/112)/389/390 delivered and accepted through independently approved PR48/49, full gates, trusted exact-tree publication and matching hosted acceptance. Portable UI quality guidance and separate ChronoShift adoption/gallery workflows are linked on the parent and project documents. Full evidence limits and rollout record: [https://github.com/Tien-Lam/time-to-local/pull/49#issuecomment-6031739693](https://github.com/Tien-Lam/time-to-local/pull/49#issuecomment-6031739693)

Original summary: Approved A/B design with compact header and Linear-inspired controls; documented implementation and validation tickets are ready.

## Linked resources

- [AI lab & infrastructure design research — ChronoShift directions](https://github.com/Tien-Lam/time-to-local/blob/main/docs/linear-migration/documents/df858fa8-e96d-40d6-8f7c-27be40ed31ef.md)
- [Approved final design spec](https://github.com/Tien-Lam/time-to-local/blob/main/docs/linear-migration/documents/e0a57819-2bcd-460c-91ea-207585eb6b1d.md)
- [AI lab & infrastructure design research](https://github.com/Tien-Lam/time-to-local/blob/main/docs/linear-migration/documents/df858fa8-e96d-40d6-8f7c-27be40ed31ef.md)

<details>
<summary>Original metadata and resource index</summary>

```json
{
  "id": "P-TIE-25",
  "uuid": "cc49c8c3-43c1-4bb0-aafe-8c14017981b3",
  "icon": null,
  "color": "#f7c8c1",
  "name": "ChronoShift — Design Exploration",
  "summary": "Approved A/B design with compact header and Linear-inspired controls; documented implementation and validation tickets are ready.",
  "url": "https://linear.app/tienlam/project/chronoshift-design-exploration-901688cabf38",
  "resourceCount": 3,
  "createdAt": "2026-10-06T14:50:37.138Z",
  "updatedAt": "2026-10-07T05:40:43.349Z",
  "startedAt": "2026-10-06T14:50:37.192Z",
  "completedAt": "2026-10-07T05:40:43.282Z",
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
  "milestones": [],
  "resources": [
    {
      "type": "document",
      "id": "df858fa8-e96d-40d6-8f7c-27be40ed31ef",
      "title": "AI lab & infrastructure design research — ChronoShift directions",
      "icon": null,
      "color": null,
      "url": "https://linear.app/tienlam/document/ai-lab-and-infrastructure-design-research-chronoshift-directions-cd3fd8f4a1f0",
      "createdAt": "2026-10-06T14:58:12.345Z",
      "updatedAt": "2026-10-06T23:08:17.248Z"
    },
    {
      "type": "link",
      "id": "3c03b2ec-8792-4e85-8a07-4da25fdb6fa4",
      "label": "Approved final design spec",
      "url": "https://linear.app/tienlam/document/approved-chronoshift-redesign-ab-design-and-implementation-spec-bae2c486f7ba",
      "createdAt": "2026-10-06T23:01:02.418Z"
    },
    {
      "type": "link",
      "id": "61d36a5a-4a4b-463b-96ec-5b552df39c3f",
      "label": "AI lab & infrastructure design research",
      "url": "https://linear.app/tienlam/document/ai-lab-and-infrastructure-design-research-chronoshift-directions-cd3fd8f4a1f0",
      "createdAt": "2026-10-06T15:13:07.131Z"
    }
  ]
}
```

</details>
