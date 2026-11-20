# Worked audit edits

Each example shows a low-value test, the edit, and the proof that remains. They illustrate
the edit shape; they are not a deletion list. Every real candidate still needs its
[candidate evidence](../SKILL.md#candidate-evidence) before the edit.

The code is illustrative TypeScript-style and assumes the public methods it calls already
exist; if one does not, do not add it just for the test, per the production-seam question
in the [authoring gate](../SKILL.md#authoring-gate).

## Expected value copied from the code

The expected value repeats the formula under test, so a wrong formula still passes.
Rewrite it with a value worked out by hand.

```diff
 test("adds VAT", () => {
-  expect(withVat(50, 0.21)).toBe(50 + 50 * 0.21)
+  expect(withVat(50, 0.21)).toBe(60.5)
 })
```

## Private state instead of what callers see

Rewrite it against the public result. The new checks cover exactly one job queued, and
it is the one pushed.

```diff
 test("queues a job", () => {
   const queue = new JobQueue()
   queue.push(job)
-  expect(queue._pending.length).toBe(1)
+  expect(queue.size()).toBe(1)
+  expect(queue.next()).toEqual(job)
 })
```

## Absence checks: delete the leftover, keep the guard

The first check only keeps an old sentence out of a document; restoring it would be a
deliberate choice, not a bug. The second guards one leak path of a security contract from
the retention bar: the thrown error's message never reaches the page.

```diff
-test("legacy export wording is gone", () => {
-  doesNotMatch(read("docs/export.md"), /Legacy export/)
-})
 test("error page hides the error message", async () => {
   const page = await renderErrorPage(new Error("db password rejected"))
   doesNotMatch(page, /db password rejected/)
 })
```

## Duplicate of a stronger test

Delete it only after naming the keeper: here `checkout.test.ts` asserts the same taxed
total through the real checkout path.

```diff
-test("total includes tax", () => {
-  expect(cartTotal([item], { tax: 0.1 })).toBe(11)
-})
```

## Test-only seam

The test reaches into a reset hook and a counter that no production caller and no other
test uses. Delete both with the test; the keeper, "blocks the eleventh request", already
proves the limit through the public `allow()` call under its own key, so it does not
depend on the deleted reset.

```diff
 // limiter.test.ts
-test("reset clears every bucket", () => {
-  _resetBuckets()
-  expect(_bucketCount()).toBe(0)
-})
 // limiter.ts
-export function _resetBuckets() { buckets.clear() }
-export function _bucketCount() { return buckets.size }
```
