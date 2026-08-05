# UMAD P4 — mechanic spec

Rebuild-from-scratch reference for the real/fake cheat sheet. 8 players: 4 supports (N), 4 DPS (S).

## Core rule

Every boss cast is either **real (🔵)** or **fake (❓)** — one judgement per cast bar, checked
during the cast. The judgement applies to *everything* that cast gives. Fake = do the opposite of
the stated mechanic.

## Cast timeline (inputs, in order)

| Time | Cast | What it does |
|---|---|---|
| 0:23 | Grand Cross 1 | applies Exdeath debuffs, set 1 |
| 0:28 | Chaos cast 1 | Inferno 🔥 or Tsunami 🌊 (whole raid, one element) |
| 0:38 | Grand Cross 2 | applies Exdeath debuffs, set 2 |
| 0:43 | Chaos cast 2 | always the *other* element |
| 1:23 | Thunder III | line AoE, **stored** by Kefka |
| 1:40 | Blizzard III | cone AoE, **stored** by Kefka |
| ~1:45 | Mana Release ×2 | one per stored element: real = keep it, fake = invert its real/fake |

## Grand Cross debuffs

Sourced from the [wtfdig UMAD P4 guide](https://wtfdig.info/ultimates/umad), corroborated by
[Materia Raiding](https://materiaraiding.com/ultimate/dmu) and
[Icy Veins](https://www.icy-veins.com/ffxiv/dancing-mad-ultimate-phase-4-guide). Real debuff names:
Compressed Water, Forked Lightning, Acceleration Bomb, Cursed Shriek.

| Per cast | Count | Timer |
|---|---|---|
| 💧 Compressed Water + ⚡ Forked Lightning | 2 + 2 (1 DPS + 1 support each) | **one timer for the whole set.** "One cast will have Short timer, other will be Long" |
| 💣 Acceleration Bomb | 4 | **split 2 short + 2 long**, per cast |
| 👁 Cursed Shriek | 2, riding on top | fixed by cast: "1st applied Shriek has short timer, 2nd has long timer" |

A GC1 short and a GC2 short expire together, so there are exactly two resolution windows. Measured
durations are in the table below.

Per player across both casts:
- Exactly **one 💧/⚡**. Its window is that cast's set timer, not a personal roll.
- Exactly **one 💣**, with **its own** short/long — the one genuinely free timer in the mechanic.
- **At most one 👁**, riding on top of that cast's 💣 — never on a water/lightning holder, never
  alone. 4 shrieks over 8 players, so half the raid has none.
- Your 💧/⚡ and your 💣 always come from **different casts**. Each cast fills its 8 players with
  2 water + 2 lightning + 4 bombs, and the two groups never overlap.

Because of those two, a 👁 on a cast implies your 💣 is on that cast, which implies your 💧/⚡ is on
the other one.

### Measured, not assumed

Checked against FFLogs with [tools/fflogs-survey.js](tools/fflogs-survey.js), which needs no API
key. Sample: **35 phase-4 pulls across 14 public reports, 560 player-casts.**

| Check | Violations |
|---|---|
| A player holding both 💧/⚡ and 💣 from one cast | **0 / 560** |
| Water/lightning durations not uniform within a cast | **0 / 70 casts** |
| Bombs not exactly 2 short + 2 long per cast | **0 / 70 casts** |
| Not exactly 2 water + 2 lightning per cast | **0 / 70 casts** |
| Players without exactly one 💧/⚡ across the pull | **0 / 280** |
| Players without exactly one 💣 across the pull | **0 / 280** |
| Players with more than one 👁 | **0 / 280** |
| 👁 landing on a non-bomb holder | **0 / 140 shrieks** |

### Exact durations

Every pull was identical apart from one coin flip. Grand Cross 1 lands 24s into the phase, Grand
Cross 2 at 39s.

| | 💧/⚡ (2 water + 2 lightning) | 💣 Accel Bomb ×4 | 👁 Shriek ×2 |
|---|---|---|---|
| **GC1** | 4 × **51s** *or* 4 × **76s** | 2 × 51s + 2 × 76s | 2 × 60s |
| **GC2** | 4 × **61s** *or* 4 × **36s** (always opposite GC1) | 2 × 36s + 2 × 61s | 2 × 69s |

Everything lands in two windows. 51s-from-GC1 and 36s-from-GC2 both expire at **75s**; 76s-from-GC1
and 61s-from-GC2 both expire at **100s**. Shrieks expire at 84s and 108s, after each window.

The **only** thing that varies between pulls is which cast owns the short water/lightning set — 20
pulls had GC1 short, 15 had GC1 long. That single coin flip is exactly what the tool's `S`/`L` input
records. The bomb split and both shriek timers never varied at all, which is why the bomb needs its
own input and the gaze needs none.

That split is what makes the positions work. The short window holds one cast's 4 water/lightning
holders **plus** the 4 short bombs: per role group that is 1 water + 2 bombs filling a 3-person
stack, and 1 lightning spreading.

**Derivable:** which cast holds your 💧/⚡ (the one that did not give you your 💣 — or your 👁);
the other cast's set timer (the opposite); your gaze's window (fixed by its cast). **Not derivable:**
your element, your 💧/⚡ set timer, your bomb's cast and timer, and whether you have a gaze.

## Real/fake answer table

| Debuff | Real 🔵 | Fake ❓ |
|---|---|---|
| 💧 Water | 3-person stack | spread |
| ⚡ Lightning | spread | 3-person stack |
| 💣 Bomb | stop all actions on expiry | keep moving on expiry |
| 👁 Gaze/shriek | look away | look at it |
| 🔥 Inferno | circle (go out) | donut (go in) |
| 🌊 Tsunami | donut (go in) | circle (go out) |
| ⚡ Line / ❄️ cone | avoid it | stand in it |

Chaos note: real/fake is judged per element cast; fire **always resolves first** regardless of
cast order (fire = the short chaos debuff, water = long). Puddles drop mid, explode ~5s after the
debuff expires; Inferno resolution is preceded by a raidwide (Ultima Upsurge) — on a donut, wait,
don't get baited.

Stored note: final line/cone answer = cast real/fake **XOR** release (fake release flips it).

## Resolution timeline (fixed order, outputs)

Positions for 1 & 4: **supports stack N / spread W, DPS stack S / spread E**; per group 3 stack +
1 spread. The tool's SUP/DPS toggle only appends that letter to the stack/spread wording — no
mechanic branches on it.

1. **Exdeath SHORT** — everything of yours on a short timer resolves together. Your 💧/⚡ if its
   set is short → stack/spread per table; otherwise **fill a stack**. Your 💣 if it is short →
   bomb action, **on top**. A window can therefore carry two answers from two different casts, each
   judged by its own cast's real/fake.
2. **Short shrieks** — GC1's real/fake decides look away/at; if your gaze came from GC1, go under
   the boss.
3. **Inferno** resolves.
4. **Exdeath LONG** — same as 1 for everything of yours on a long timer.
5. **Long shrieks** — GC2's real/fake; GC2 gaze holders go under the boss. Align N/S to see both.
6. **Tsunami** resolves.
7. **Stored combo** — dodge line + cone (post-release values). Enrage at 25% HP.

## Tool shape

The mechanic lives in [solver.js](solver.js) as one pure function, `solve(state, role)`. It has no
DOM access, so [solver.test.js](solver.test.js) drives it directly (`bun test`). `index.html` only
writes state and paints what comes back.

Inputs, per Grand Cross: real/fake, 💧/⚡ pick, 💣 SHORT/LONG, 👁 toggle, plus **one** 💧⚡
SHORT/LONG for the pull. That last one is a fact about the *cast*, not about you, so it is rendered
on a single card — the one holding your water/lightning — and the other card shows the opposite as
a tag. The gaze needs no timer at all: its cast fixes it.

Your 💧/⚡, your 💣 and your 👁 are each one-per-pull, and the first two are also mutually exclusive
within a cast, so naming any one of them narrows the rest. Picking one greys the others out — but a
greyed control still works and moves the debuff over, because mid-pull you correct a mispress by
pressing the right key, not by undoing first. Then: Chaos1 element + real/fake, Chaos2 real/fake,
line & cone real/fake + release real/fake each.

Output: the 7 rows above, each an array of `{ text, src }` parts. An empty array means "not known
yet", so partial input gives partial answers with no special path.

The 8 real/fake judgements (`gc1rf, c1rf, gc2rf, c2rf, linerf, conerf, linerel, conerel`) form a
fixed sequence in boss order; the tool highlights the first unset one and `R`/`F` act on it. That
focus is *derived*, not stored — no advance logic, and undo rewinds it for free. The debuff/element
keys are deliberately global rather than scoped to the highlighted card, because GC1's debuffs land
after its cast bar has already been judged (i.e. after focus has moved on). See README for the map.

Icons (xivapi.com/i/215000/`<id>`.png): water 215696, lightning 215623, bomb 215727, gaze 215588,
Inferno 215902, Tsunami 215903. Lightning and bomb icons look similar — color-code them.

Sources: raidplan.io/plan/j33r35wvfp5xg7dd (overview), raidplan.io/plan/guufe9q559evt7pj
(extended). Raidplan pages embed all plan data in the `__NEXT_DATA__` JSON if re-extraction is
ever needed.
