# Initial measurement setup correction

The initial render probe expected the UTC result's label to include an explicit zero offset. The production formatter's UTC zone label is `UTC`; the fixed expected time/date were correct. The first baseline setup assertion failed before any measured row was saved. This is a probe oracle error, not an App defect or candidate regression. Exact original source, log and raw error/asset/clock observations are retained under initial-render-probe/. The owned browsers and both preview servers stopped through finally cleanup.

The corrected probe retains a fixed independent `UTC` label for both baseline/candidate. Its expected six UTC times and date remain unchanged; all measurements use the same corrected assertions. No failed measured attempts will be discarded or counted as passes.
