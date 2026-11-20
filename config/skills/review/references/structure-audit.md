# Structure Audit

Ask one question of every piece of code: **should these pieces change together?** There are
three ways to get it wrong: pieces that must change together where nothing shows it, pieces
tied together that change for different reasons, and pieces with no reason of their own to
change. Fixing them lets agents read less per change, break less without noticing, and find
root causes faster.

Run this when the user asks for a structure audit or to untangle code, or points an agent at
this file. Good times to suggest it to the user: every few features, or on a feature's area
after it lands. It is an audit: findings only, until fixes are approved (see the last
section).

## How to run it

- **Scope.** The path the user names, or the whole repository. After a feature: its files,
  what imports them, and what they import.
- **Which passes.** Passes 1-5 always run; 6 and 7 only when asked.
- **One pass at a time, in order.** Start each pass by rereading its own section of this
  file, run its checks over the whole scope, and write its log before running any command or
  reading any file for the next pass. Reading the same files again in a later pass is
  expected. When you spot something that belongs to a later pass, add one line under
  `Later passes:` in the current log; that pass checks it then. Do not fix during passes, and
  do not merge passes to save time: one narrow lens at a time finds what a long checklist
  read once misses.
- **Each finding:** `path:line`, what is wrong, the pass and check it breaks (`Bug` for a bug
  you notice), and the P0-P3 label and scope classification `code-review.md` requires under
  Findings. When a check cannot apply (no imports in a prose repository), say so in one line
  and move on.
- **Keep the log where the parent says,** normally the task's folder in `agent-memory/plans/`
  under `git rev-parse --path-format=absolute --git-common-dir`, never inside the work tree.
  It survives compaction, so a later agent can resume at the next pass. Pass 1 logs
  evidence; the others log findings. When a role or harness rule stops you writing the log,
  put each pass's log in your report as its own `Pass N` section, and the parent saves it.
- **Large scope:** the Pass 1 skeleton does not fit in context. Run Pass 1 once over the whole
  scope, writing only the skeleton per area. When the packet grants nesting, split Passes 2-7
  by independent area through `super-agent`, give each worker the Pass 1 log, and merge
  findings before the next pass, checking co-change pairs and facts that cross areas.
  Otherwise list the areas in the log for the parent to split, then stop and report them;
  the passes wait for that split.

## Pass 1: Evidence

Collect facts first; later passes cite them.

- **Skeleton.** Fit the codebase in context: CodeGraph (`codegraph_files`,
  `codegraph_context`) first, otherwise a script that prints only file names and signatures.
  When it does not fit, write one per area (see Large scope); every other step below still
  runs once over the whole scope.
- **Import graph.** Which file imports which, and every cycle: the language's import tool or
  a short script. CodeGraph (`codegraph_callers`, `codegraph_impact`) adds call edges, not
  imports. Rerun it after fixes.
- **Renames.** Old and new paths count separately in the churn and co-change commands below.
  List the renames first, then map old names to new before reading the numbers:
  `git log --since=6.months --no-merges -M --diff-filter=R --name-status --format=`. For a
  path scope, make the `grep` below match the old and new paths together, as in
  `grep -E 'old/|new/'`, or every row under the old name drops out.
- **Churn.** A file that changes in most commits usually mixes several reasons to change.
  For a path scope, run this and the co-change command over the whole repo and add
  `| grep '<path>'` before `head -30`, so partners outside the path stay visible; `-- <path>`
  would hide them. Write the path relative to the repository root, as git prints it, with no
  `./` or absolute prefix; the Renames grep follows the same rule. End a folder path with
  `/` so siblings such as `review-plan/` do not match. A whole-repo run needs no filter:

  ```bash
  git log --since=6.months --no-merges --name-only --format= | sort | uniq -c | sort -rn | head -30
  ```

- **Co-change.** File pairs that landed in the same commit 3 or more times; commits over 20
  files are skipped as noise. Ignore generated and binary files. A pair far apart in the
  tree is a hidden-link lead:

  ```bash
  git log --since=6.months --no-merges --name-only --format=format:@@ | awk '
  function flush() { if (n > 1 && n <= 20) for (i = 1; i <= n; i++) for (j = i + 1; j <= n; j++) c[f[i] < f[j] ? f[i] "  " f[j] : f[j] "  " f[i]]++; n = 0 }
  /^@@$/ { flush(); next }
  NF { f[++n] = $0 }
  END { flush(); for (p in c) if (c[p] >= 3) print c[p], p }' | sort -rn | head -30
  ```

- **Common changes.** Read the last 50 commits with the files each touched
  (`git log --no-merges -50 --format='%h %s' --stat=200`), group them by kind (a new
  command, field, provider, or page), and for the three biggest groups note the files per
  commit. For a path scope add `--full-diff -- <path>` (old and new paths after a rename);
  without `--full-diff`, the stat lists only files inside the path. That turns "a typical
  change lands in one place" into a number.

## Pass 2: Hidden links

Pieces that must change together, where nothing shows it.

- **Copies.** The same logic, value, list, or schema in two places that must change for the
  same reason, including the same rule applied differently and the same failure handled two
  ways. Copies that change for different reasons may stay (`code-quality`).
- **One fact, many places.** A rule or number stated in several docs, prompts, config files,
  or comments. Name the one owner the others should point to.
- **Shared state.** A module that reads a global, file, or cache entry another module sets.
- **Two writers.** Two places writing the same file, table, or key, each with its own rules.
- **Call order.** A convention callers just have to know: call `init()` first, close before
  reopening, pass the list sorted.
- **Parallel lists.** Adding one item means editing a registry, a switch, a menu, and a test
  list by hand.
- **Split features.** One feature spread over folders by layer (`controllers/`, `services/`,
  `models/`), so one change touches them all. Propose moving it together only when the
  co-change data backs it; new code otherwise follows the existing layout (`code-quality`).
- **Names.** One concept with several names, or one name for several concepts.
- **Hand-synced copies.** Generated, vendored, or mirrored files someone keeps in step by hand.

## Pass 3: Needless links

Pieces tied together that change for different reasons.

- **Reaching into internals.** Callers that use another module's private fields or file
  layout instead of its interface.
- **Wrong dependency direction.** Stable code importing more volatile code (core logic
  importing UI, a vendor SDK, or a script), and every import cycle.
- **Vendor leaks.** An external service's types, errors, or IDs spread past the one module that
  talks to it, like `if (order.provider === "paypal")` across checkout and refunds.
- **Caller vocabulary.** A general function with a parameter or flag only one workflow
  understands.
- **Shallow modules.** An interface about as complex as the code behind it, so callers change
  whenever its insides do.
- **Config read deep inside.** Settings or environment variables read in the middle of the
  logic instead of once at the edge and passed in.
- **Import-time side effects.** A module that does I/O, registers itself, or reads config when
  imported.
- **Grab-bag modules.** `utils`, `helpers`, or `common` files holding unrelated things, which
  ties everything that uses one of them to all of them.

## Pass 4: Surplus

Pieces with no reason of their own to change.

- **Pass-through wrappers** that only forward to what they wrap.
- **Extension points for things that never vary:** an interface with one implementation, an
  option nobody sets, a flag that is always on.
- **Dead code,** after the whole-repository grep the whole-repo audit in `code-review.md`
  requires, not only the scope: code used from outside the path is not dead.
- **Stale flags and compatibility paths** whose old side is gone.

## Pass 5: Special cases

Code that exists for one situation instead of following from how the system works. Each is a
requirement the design never planned for. List every one; never fix them one by one.

- An `if` that singles out one hard-coded ID, name, customer, or input the general rule
  should cover (`if (userId === 4182)`), not an ordinary branch on state.
- A swallowed or blanket-caught exception.
- A retry, sleep, or timeout that waits for something to be ready.
- A disabled or skipped test.
- A lint suppression, or a `TODO`, `HACK`, or "temporary" comment.

Record the count, together with Pass 3's caller-vocabulary flags; the next audit compares
against it.

## Pass 6: Comments (when asked)

- **Restates the code:** remove it, including a why the next two lines already make plain
  (`// sort first so the binary search works` right above a sort and a binary search). Keep a
  why the code cannot show (`code-quality`).
- **About something outside the code:** keep it (`// the proxy drops websockets, so we poll`).
- **Explains a workaround:** it goes when a fix removes the workaround's cause, not before.

## Pass 7: Tests (when asked, always last)

Tests are the safety net for every other fix, so they change last. Use `test-audit`'s Junk
patterns as the checks and its Value bar and Retention bar to judge each test, as findings
only; skip its parallel lanes, and its edit and landing steps wait for approval like every
other fix.

## Turn findings into fixes

- **Find the one fix behind several problems.** It often looks nothing like any of them; see
  the example under Report.
- **Design as if today's requirements were known from the start.** Drop the special cases a
  fix makes unnecessary; keep those the system still needs.
- **Ask every fix the same question:** pieces that change together end up together, pieces
  that do not are not tied, and everything depends on what changes less.
- **Do not hunt bugs.** A bug you notice becomes its own numbered fix, tagged `Bug` in place
  of a pass and check; P0 and P1 bugs go above all structural fixes. Do not go looking for
  others.

## Report

Use the whole-repo audit's frame from `code-review.md`, starting with `What this repo does:`.
In place of its findings list, write each fix first, numbered so the user can approve by
number, with the problems it solves underneath:

```md
1. Keep one list of supported file types in `formats.ts` that upload, preview, and export
   all read. Size: small.
   - P2 in-scope, Pass 2 Parallel lists: `upload/validate.ts:12` keeps its own list of
     allowed extensions.
   - P2 in-scope, Pass 2 Parallel lists: `preview/render.ts:40` switches on the extension and
     has no case for `.webp`.
   - P2 in-scope, Pass 2 Parallel lists: `export/menu.ts:8` lists formats by hand and still
     offers `.bmp`, which upload rejects.
```

- **Order by leverage:** P0 and P1 bugs first, then problems removed, then how often the
  files change. At most 10 fixes, replacing the whole-repo audit's 20-finding cap; say how
  many smaller ones were left out. The passes replace its "Also look for" list.
- **Name the safety net:** for each fix, which behavior a test covers and which only a manual
  or live check would catch.
- **Size each fix:** `Size: small`, `medium`, or `large`, the value the `workflow` coding loop
  reads for each slice.
- **Then the numbers:** special cases, caller-vocabulary flags, files per common change, and
  import cycles. They are the baseline the next audit compares against.
- **Close with the frame's lines,** in this order: `Verdict:`, `Lean:` (when lean findings
  exist), and `Not checked:`.

## Applying approved fixes

Fixes start only after the user approves them by number.

- Record the test and live-check baseline before the first change. Write the plan in the log
  folder, one slice per approved fix in the slice fields `refine-plan` lists: its `Size:`,
  the default review preset, its safety net as the checks, and as acceptance evidence that
  safety net plus "behavior unchanged, apart from listed bugs a fix removes". Add the
  baseline; the coding loop runs from it.
- Run the fixes through the `workflow` coding loop (`workflow/references/coding-loop.md`) and
  rerun the baseline after each round. Inside a workflow, a fix outside the approved plan
  still goes to the user.
- Behavior stays the same apart from bugs a fix removes; list each one.
- At the end, recount import cycles, Pass 3's caller-vocabulary flags, and Pass 5's special
  cases on the fixed tree. Churn, co-change, and files per change move only after commits
  land; compare them at the next audit.

Ideas adapted, in new wording and examples, from caldoai's MIT-licensed `untangle-codebase`
skill: <https://github.com/caldoai/skills>.
