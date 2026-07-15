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

Per cast: **2 water, 2 lightning, 4 bombs** (water/lightning = 1 DPS + 1 support each; bomb =
everyone else), plus **2 gazes** applied *on top of* a main debuff.

Per player across both casts:
- Exactly **one 💣** and exactly **one 💧/⚡**, with **opposite timers** (one short, one long).
- Timer is per player — one cast hands out both short and long (short ≈ 51s/36s, long ≈ 75s/60s
  depending on cast). Read your own debuff bar.
- Gaze 👁 does **not** follow the complement rule — it can ride on any main debuff, either cast.
- GC1's gazes are always the **short** shrieks, GC2's the **long** ones (fixed order).

**Derivable:** got 💧/⚡ on cast 1 → cast 2 gives 💣, opposite timer. **Not derivable:** got 💣 on
cast 1 → cast 2 gives 💧 *or* ⚡ (must ask); whether you have a gaze (must ask, per cast).

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

1. **Exdeath SHORT** — your short-timer debuff resolves: 💧/⚡ → stack/spread per table;
   💣 → fill a stack + bomb action. Each debuff resolves exactly once.
2. **Short shrieks** — GC1's real/fake decides look away/at; if your gaze came from GC1, go under
   the boss.
3. **Inferno** resolves.
4. **Exdeath LONG** — same as 1 with your long-timer debuff.
5. **Long shrieks** — GC2's real/fake; GC2 gaze holders go under the boss. Align N/S to see both.
6. **Tsunami** resolves.
7. **Stored combo** — dodge line + cone (post-release values). Enrage at 25% HP.

## Tool shape

Inputs (in cast order): GC1 real/fake + my debuff (radio 💧⚡💣) + 👁 toggle + my timer
(SHORT/LONG); Chaos1 element + real/fake; GC2 real/fake (+ 💧/⚡ pick only if bomb came first,
+ 👁 toggle); Chaos2 real/fake; line & cone real/fake + release real/fake each.
Everything else is derived. Output: the 7 rows above with personal answers, each tagged with its
source cast (GC1/GC2).

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
