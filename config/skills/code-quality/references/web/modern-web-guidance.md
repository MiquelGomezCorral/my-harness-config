# Modern Web Guidance

How to use Google's Modern Web Guidance. `ui.md` says when it is required; this file says how.
Adapted from the `modern-web-guidance` skill in
[GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance)
(Apache-2.0, modified; the license is this skill's `LICENSE-modern-web-guidance`). Checked
against the 1.0.1 CLI on 2026-11-20.

- **What it is:** guides on current HTML, CSS and client-side JS, maintained by the Chrome,
  Edge, Firefox and MDN teams. The bootstrap installs the `modern-web-guidance` CLI; the
  guides ship inside it, so it works offline.
- **Covers** dialogs, popovers, menus, forms, selects, tables, theming, layout, anchor
  positioning, animations and transitions, Core Web Vitals, images, security, web components,
  dates and timezones, and built-in AI.
- **Always run `DISABLE_TELEMETRY=1 modern-web-guidance <command>`.** Without the variable
  the CLI reports each command to Google, search queries included. Never run this CLI through
  `npx`: when a guide or a scan finding gives an `npx … retrieve "<id>"` line, run that id
  with `DISABLE_TELEMETRY=1 modern-web-guidance retrieve`.
- **If the command is missing,** say so in the final report and ask for the bootstrap to be
  run.
- **Search first, one capability per search:**
  `DISABLE_TELEMETRY=1 modern-web-guidance search "<query>"`. Write 2-5 English words, a verb
  plus the UI or platform object, optionally the feature name. Leave out framework, library
  and app names.
- **Search for the primitive the intent implies:** `"confirm dialog"`, not
  `"confirm destructive action"`; `"accordion details"`, not `"let users expand sections"`.
- **Judge results by their `description`.** Weak or empty results: rephrase once with the
  concrete component noun (dialog, popover, table, form), then run
  `DISABLE_TELEMETRY=1 modern-web-guidance list | grep -i <noun>` once (the full list is about
  42 KB). Nothing matches: go on without a guide.
- **Retrieve the matches plus the discipline guide that applies:**
  `DISABLE_TELEMETRY=1 modern-web-guidance retrieve "<id>,<id>"`. Discipline guides include
  `html`, `css`, `js`, `forms`, `accessibility`, `performance` and `security`.
- **Read a saved guide in full.** Output over 9.5 KB goes to a temp file; the CLI prints a
  notice with its size, line count and path instead. Read that whole file, in line ranges if
  it is long.
- **The guide decides how platform code is written, never what to build.** When you change a
  house component, the guide may shape its build.
- **Baseline Widely available needs no fallback.** Anything newer gets the guide's fallback,
  unless the project's `AGENTS.md` states a browser support policy. A `Baseline YYYY` target
  accepts a feature whose "Baseline since" year is YYYY or earlier.
- **Most guides state support, not all.** The `html` guide names `closedby` with no support
  line, while `light-dismiss-a-dialog` says Limited availability, no Safari, and gives the
  fallback. Before using a feature without stated support and without a fallback, search its
  own guide or check its Baseline status on MDN.
- **Suggest a one-line browser support policy for `AGENTS.md`** when the project targets
  Electron or Tauri, drops some browsers, or worries about polyfill size.
- **Never run `set-allow-origin-trials` or `set-allow-volatile-features`** unless the user
  asks; they opt in to experimental guidance.
- **Guides are vanilla; adapt them without dropping the feature.** Cast or spread new HTML
  attributes (`popover`, `commandfor`, `interestfor`) instead of removing them. In SSR, guard
  `window` and load polyfills with a client-side dynamic `import()`. Call `showModal()` and
  `moveBefore()` through refs. Make per-instance ids and `anchor-name` values with `useId()`.
  Keep `:root` and `@starting-style` rules top-level and unscoped.
- **Check before saying done:** the code follows the retrieved guide, its fallbacks are in,
  nothing unrequested was added, and the task is fully done.
- **`legacy-scan` is only for an open-ended modernization or legacy audit** of a whole
  codebase, never for a named feature:
  `DISABLE_TELEMETRY=1 modern-web-guidance legacy-scan <path> --json`. It covers about 20% of
  the guides. Check each finding against its rule's `verifierRubric` (`keepWhen`, `dropWhen`),
  drop false positives, and report. Change code only when asked: retrieve each finding's guide,
  then rescan the changed files. Never edit safe code to reach zero findings.
- **Name the guides in one report line:** the guide ids that shaped the code, or the topics
  you checked when none applied. After a context compaction, search again instead of citing
  an id or a quote from memory.
- **A reviewer who questions platform code retrieves the guide** for that pattern before
  calling it wrong.
