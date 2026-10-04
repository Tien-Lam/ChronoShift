# First published acceptance harness failure

Command: bun /tmp/chronoshift-uncontrolled-adversarial-hosted-after.ts 4a771b9d102dbcaf3a807f096fb26861bbfa8e5f. Actual Chrome154; published source identity check passed. Result exit1, `TimeoutError: waitForFunction: Timeout 30000ms exceeded`.

First helper source preserved at /tmp/chronoshift-uncontrolled-adversarial-hosted-after-first-harness.ts. The helper used en-AU locale with device time format, while exact conversion assertion expected `.hero-time` text strictly `9:20`. Independent follow-up captures /tmp/chronoshift-uncontrolled-adversarial-hosted-debug.json show app readiness true, no warnings, successful conversion with text `9:20 am`, worker1daf9e89c308221a. This is an assertion/locale mismatch in the harness, not evidence of service-worker failure. The first helper did not save failure-state diagnostics, so its absent step-level record remains an instrumentation limitation. The follow-up reproduces and explains the concrete erroneous assertion.

Corrected only the helper's independent output expectation to accept exact `9:20` or `9:20 am` (same intended time in chosen format). No runtime changes. Full matching journey rerun required before publication verdict.
