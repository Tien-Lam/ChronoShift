# Merge rules

Time to Local keeps ambiguous interpretations visible so users can choose the correct one. It does not guess a source timezone from geography or hide DST alternatives.

## Stable identity

`web/src/engine/convert.ts` merges results by exact instant (or a date-only value), normalized source timezone and range endpoint. Matching formatted hours are not sufficient. Duplicate mentions retain their occurrence count.

Equivalent explicit numeric offsets normalize to the same source identity. An explicit source label may upgrade an otherwise equivalent assumed source. Different instants, dates, source contexts or range endpoints remain separate.

## Ambiguity and dates

- CST, IST, BST and AST produce the supported fixed-offset alternatives listed in the product contract.
- Regional zones use the event date's DST rule. A repeated local clock time retains both valid instants; a nonexistent time requires correction.
- Fixed EST/PST inputs do not turn into a geographic region merely to obtain a display label.
- Date-only values remain dates, with no invented noon timestamp.
- Range endpoints remain ordered and retain overnight day changes.

Exact expected results are specified in `tests/fixtures/temporal.json` and run through the real production worker. The larger input corpus is supplementary resilience evidence, not an accuracy oracle.
