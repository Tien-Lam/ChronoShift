# Original-report clarification delta — same tab after hard refresh

This focused review supplements, and does not replace, `/tmp/chronoshift-uncontrolled-code.md` and `/tmp/chronoshift-uncontrolled-code-final.md`. No runtime changes or verification-gate repeats were requested or performed. Candidate implementation remains63c9cdc442eac03c30dbae7871d1452b1049c7b0; the independent implementation approval and recorded test limits remain unchanged.

## Clarified scope

The user explicitly clarified that the warning during normal browsing occurred in the **same tab, hard-refreshed earlier**. The earlier final report treated that phrase as potentially describing an independent ordinary fresh-navigation occurrence and kept that broader possibility unresolved. That interpretation is superseded by this direct user clarification. Both reported descriptions now identify the same supported history: an already activated registration, force-refreshed uncontrolled document, then ordinary focus/conversion within that retained tab. Normal interaction does not navigate the document or rerun worker activation, so the original code keeps the same absent controller and reaches its startup deadline.

## Matching existing evidence

My independent previous-behavior hard-refresh journey recorded active activated, no controller at0/1/4/16sec, and the15sec warning; the exact63c9cdc isolated candidate recovered control, preserved same-tab input/conversion through a deliberately delayed handshake, remained warning-free at16sec, and supported offline reopen. These results and identity limitations remain as originally recorded.

For the clarified report-level sequence, I additionally inspected the already saved complementary adversarial evidence and its harness, without rerunning it: `docs/qa/uncontrolled-client-2026-10-05/hosted-probe.ts`, `adversarial-hosted-before.json`, `adversarial-final.md` and `transition-after.json`. The exact previous live artifact (source15b8accd00efd019921e3aef6df62e8ce4b30dd1; worker3ac0e622535455b5) was hard-refreshed, target focus/change occurred about+12sec, conversion completed about+13sec with result9:20, and the same tab was inspected after+17sec with absent controller/activated registration/readiness false and startup warning. Thus ordinary same-tab conversion and a subsequent warning beyond the deadline coexist exactly as in the available report. This is complementary evidence, not a newly claimed independent timing measurement.

The archived exact candidate's older-worker transition also retained same-tab conversion/draft beyond18sec, left the new worker waiting until explicit Update now, then restored the draft/control/readiness. With candidate active, another hard refresh recovered without automatic reload and remained warning-free at17sec; offline fresh conversion succeeded. Unsupported legacy active workers correctly retain readiness false with an actionable normal-reload instruction and an available explicit update, rather than falsely claiming current-tab offline readiness.

## Revised separate verdicts

Implementation: APPROVED within the unchanged scope, no new blockers; required delivery gates remain implementer-owned.

Original report, incorporating **both** confirmed hard-refresh and later normal-use-in-that-same-tab descriptions: equivalent lifecycle REPRODUCED on the previous implementation and PREVENTED/RECOVERED by the exact local candidate after the explicit legacy-worker update. The clarification removes the earlier separate fresh-normal-browsing cause gap; it does not establish general behavior for unreported unrelated browsing histories.

Hosted publication and matching exact published-candidate acceptance are STILL PENDING. Keep closure pending that delivery evidence. Historical user Chrome version, exact worker/cache identity and physical-device capabilities remain unverified as recorded previously.
