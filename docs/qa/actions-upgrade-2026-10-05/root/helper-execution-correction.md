# Audit helper path correction

The first automatic action-audit invocation failed before any audit assertions:
Bun 1.4 treated the string `import.meta.url` as a literal filesystem path.
Root changed only the helper's self-hash file argument to `new URL(import.meta.url)`.
The workflow, deployed source and independent expected pins/conditions are
unchanged. Subsequent output records the actual invoked helper SHA-256.
The original source reports and this failed invocation are retained separately.

Automatic audit used helper SHA-256
`7eba3308672cb69d013eb101448fd1d98c0d4afa15cdd6568d12c3f6d9cbd6f4`.
Its exact bytes are preserved in `action-reuse-invoked.ts`, reconstructed from
the committed helper plus the single recorded path correction and checked
against the runtime report's self-hash. Subsequent formatting changes only
line wrapping; the later manual audit records its own helper hash.
