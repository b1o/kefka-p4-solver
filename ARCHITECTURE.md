# Code notes

Both source files are kept comment-free; the non-obvious *why* lives here. The mechanic rules
themselves (real/fake table, debuff distribution, resolution order) are in
[MECHANIC.md](MECHANIC.md); usage and keys are in [README.md](README.md).

Refs: [P4 in a nutshell](https://raidplan.io/plan/j33r35wvfp5xg7dd) ·
[UMAD p4 extended](https://raidplan.io/plan/guufe9q559evt7pj) ·
[original tool](https://aweiyourdog.github.io/ff14-kfk-p4/ff14kfkp4) ·
[wtfdig p4 helper](https://wtfdig.info/tools/p4-helper)

## The split

- **[solver.js](solver.js)** — every mechanic rule, as one pure function `solve(state, role)`. No
  DOM, no globals, no I/O. This is the only file that knows what a debuff means.
- **[index.html](index.html)** — input capture and painting. It writes fields on `S` and renders
  what `solve()` hands back. It must never decide a mechanic itself.
- **[solver.test.js](solver.test.js)** — `bun test`. The suite exists because the rules were wrong
  once (see *The bomb correction*) and the old code could not be tested without a browser.

`solver.js` is an ES module, so the page has to be served over http(s). That was already a
requirement for the pop-out, and the tool is hosted on GitHub Pages.

## State

- **`S`** — the pull state: every input for one attempt (`blank()` in `solver.js` lists the fields).
  RESET restores `blank()`; `HIST` stores JSON snapshots so `undo()` / Backspace can rewind.
- **`ROLE`** — SUP/DPS, held **outside `S` on purpose**. Your role doesn't change between pulls, so
  RESET must not clear it; it persists to `localStorage` (`umad-role`) across reloads. It is passed
  to `solve()` as an argument rather than stored, which keeps the solver free of ambient state.
- Both grand crosses use the same field names with a `gc1`/`gc2` prefix (`gc1wl`, `gc1bomb`,
  `gc1gaze`), so `render()` can loop over the two cards instead of duplicating the block.

## The timer correction

The first version modelled the debuff as a 3-way exclusive pick (💧 / ⚡ / 💣) with **one timer per
player**, complementary across the casts. The exclusivity was right; the timer was not. Per
[the wtfdig guide](https://wtfdig.info/ultimates/umad):

> "Each player gets 1 Accel Bomb with a short or long timer. Neo Exdeath applies 2x Short and 2x
> Long per cast."

Three rules follow, all now regression tests:

1. **The bomb carries its own timer**, independent of the water/lightning set. It is the only free
   roll in the mechanic. The old code derived it as the complement of your other debuff.
2. **One resolution window can be governed by two casts.** Your water/lightning comes from one cast
   and your bomb from the other, so a window needs two answers judged by two different real/fake
   values. The old `winAns(c)` took one cast object per window and could not express it.
3. **The water/lightning timer is a property of the cast, not of you** — "one cast will have Short
   timer, other will be Long". So it is one input for the whole pull, and `render()` shows the
   SHORT/LONG pair on a single card (`derived.wlOwner`) with the other card showing the mirrored
   value as a tag. Showing the pair on both cards made one shared fact look like two personal picks
   that were mysteriously stuck together.

The gaze needs **no** timer input — "1st applied Shriek has short timer, 2nd has long timer" — so
the cast that applied it fixes its window. That is why rows 2 and 5 are keyed to GC1 and GC2
directly.

## How we know

No guide states whether a single Grand Cross can give you **both** a water/lightning and an accel
bomb, and the counting argument for it (4 + 4 debuffs over 8 players) assumes an even spread. The
constraint was briefly removed for that reason, then measured and restored.

[tools/fflogs-survey.js](tools/fflogs-survey.js) answers it from public FFLogs report data with no
API key — the report pages fetch the same `summary-events` JSON themselves. Over 35 phase-4 pulls
(560 player-casts) there were zero violations, and one extra rule fell out: every Cursed Shriek rode
on an Acceleration Bomb holder, 140 for 140. `derived.wlHolder` uses that, so a gaze alone is enough
to place your water/lightning on the other cast. It feeds display only — `locked` ignores it, so if
that rule ever fails you can still click the pick it would have ruled out.

The survey also justifies the input set. Across all 35 pulls exactly **one** thing varied: which
cast owns the short water/lightning set. Bomb durations and both shriek durations were identical
every time. So `wlTimer` and the bomb's SHORT/LONG earn their keystrokes, and the gaze correctly has
no timer control.

The full result table is in [MECHANIC.md](MECHANIC.md). Re-run the survey before changing `CLEARS` —
the counting argument alone is not evidence, and this was got wrong in both directions once each.

## Solver shape

`solve()` returns `{ timeline, derived }`.

- **`timeline`** — one entry per resolution row, each an **array of `{ text, src }` parts**. An
  empty array means "not known yet". Partial input therefore needs no special path: the same code
  produces a partial answer, which matters because inputs arrive *during* the mechanic.
- **`derived`** — everything the UI would otherwise have to work out: `focus`, `locked` (which picks
  to grey out), `wlWindow`, `c2elem`. Keeping these here is what stops rules leaking back into
  `render()`.

Rules worth knowing:

- **`FILL A STACK`** appears whenever your water/lightning resolves in the *other* window. You still
  take a position, whether or not a bomb is due.
- **Shrieks** — GC1's always resolve first (short), GC2's second (long); `GO UNDER BOSS` added when
  the gaze is yours.
- **Chaos** — fire always resolves before water regardless of cast order; the real/fake comes from
  whichever cast carried that element.
- **Stored line/cone** — final answer = cast real/fake XOR fake-release.
- **`place()`** decorates only the STACK/SPREAD/FILL wording with a direction (SUP: N/W, DPS: S/E).
  No mechanic branches on role. Unset role ⇒ plain STACK/SPREAD, so a wrong default can never point
  you the wrong way.

## R/F focus

The 8 real/fake judgements (`JUDGEMENTS`) are a fixed sequence in boss order. `derived.focus` is the
first unset one; R/F always act on it and the highlight (a static ring, no animation) advances.
Focus is *derived*, not stored — undo rewinds it for free.

## Picks, and why nothing is disabled

`data-act="s"` sets a field. `data-act="pick"` toggles it, so pressing `3` twice clears a mispressed
bomb. There is no explicit NONE state: `null` is "none or not entered yet". A confirmed NONE would
be a third value that every truthiness check in the solver would have to special-case, for no gain —
the greyed-out row already reads `💣 NONE` once the other cast has your bomb.

Your 💧/⚡, your 💣 and your 👁 are one per pull, and the first two are also exclusive *within* a
cast, so writes cascade: setting `gc1wl` clears both `gc2wl` (one per pull) and `gc1bomb` (one per
cast). That is the `CLEARS` map in `solver.js`, and every write goes through `apply()` / `toggle()`.
Two consequences, both deliberate:

- **`derived.locked` is styling only.** A locked pick is dimmed but stays clickable, and clicking it
  *moves* the debuff to that cast. During a pull you fix a mispress by pressing the right key once —
  making the correct button inert would force clear-then-repress, which is the opposite of what a
  mid-mechanic tool should do.
- **The rule lives in the solver, not in `render()`.** `index.html` never clears a field itself, so
  the invariant cannot drift between the keyboard path and the click path.

`commit()` is the single funnel: it snapshots `S` into `HIST`, swaps in the returned state, and
re-renders. `apply()` returns a new object rather than mutating, which is what keeps the `HIST`
snapshots honest.

## Pop-out overlay (Document Picture-in-Picture)

`popout()` moves the whole `#app` subtree into a real always-on-top window that floats over a
borderless-windowed game. Two structural rules make that possible; **breaking either re-breaks the
overlay**:

1. **No inline `onclick`.** All interaction is event delegation on `clickHandler` (keyed on
   `data-act` / `data-k` / `data-v`), bound to *both* documents. Inline handlers would resolve
   against the wrong window's globals once the DOM is moved to the PiP document.
2. **`DOC` indirection.** `el = id => DOC.getElementById(id)`; `DOC` points at whichever document
   currently holds the panel (main page, or the PiP window). Every lookup goes through `el()` so
   `render()` follows the panel automatically.

Other details: on popout we clone the `<style>` into the PiP head and add `<base href>` so relative
icon URLs still resolve. `keydown` is re-bound on the PiP window. `pagehide` fires when the user
closes the PiP window's X — `dockBack()` reparents `#app` to the main page **before** the PiP
document is torn down (otherwise the subtree is destroyed). While popped, the in-document header is
hidden (`#app.popped .bar`) as redundant chrome; RESET/DOCK live in the slim `.overlay-ctl` strip.

Limits, on purpose: the browser's own PiP **title bar** is the one frame web code can't remove, and
browsers can't make the window see-through to the desktop. A truly frameless / transparent /
click-through overlay would need a native shell (Electron/Tauri) wrapping this same HTML.

Requires Chrome/Edge 116+ served over http(s) or localhost (not a `file://` path); anything else
falls back to an explanatory alert.
