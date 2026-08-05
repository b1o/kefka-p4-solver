# UMAD P4 — Real/Fake Cheat Sheet

Personal tool for The Unending Dance of Madness (Ultimate) phase 4. Tab out, press what the boss
cast, read the computed resolution timeline. `index.html` + `solver.js` + `icons/`, no runtime
dependencies and no build step.

Full mechanic spec (rebuild-from-scratch reference): [MECHANIC.md](MECHANIC.md).
Both files are kept comment-free; the design rationale is in [ARCHITECTURE.md](ARCHITECTURE.md).

The mechanic itself is one pure function in [solver.js](solver.js), so it can be tested without a
browser:

```bash
bun test
```

## Keys

Built for alt-tab → press → tab back, so every input is one keypress. `R` / `F` judge **the
highlighted cast** (real / fake) and the highlight advances to the next one the boss will hand you
— during a pull that's the only thing you need to aim at. The rest are printed on the buttons
themselves, so nothing needs memorising:

Digits are grouped by cast: `1`–`5` is everything Grand Cross 1 can hand you, `6`–`0` the same for
Grand Cross 2. Pressing a pick again clears it. Your 💧/⚡, your 💣 and your 👁 are one per pull, so
pressing one on the other cast **moves** it there — a mispress costs one keypress to fix, not an
undo.

| Key | Does |
|---|---|
| `R` `F` | real / fake on the highlighted cast, then advance |
| `1` `2` | GC1: my 💧 / ⚡ |
| `3` `4` | GC1: my 💣 accel bomb is SHORT / LONG |
| `5` | toggle 👁 gaze on GC1 |
| `6` `7` | GC2: my 💧 / ⚡ |
| `8` `9` | GC2: my 💣 accel bomb is SHORT / LONG |
| `0` | toggle 👁 gaze on GC2 |
| `S` `L` | this pull's 💧⚡ set timer: SHORT / LONG (shown on one card only) |
| `I` `T` | Chaos 1 element: 🔥 Inferno / 🌊 Tsunami |
| `Backspace` | undo last input (repeatable) |

`?` toggles the explanations and the per-step positioning hints; they're hidden by default so a
pull fits on one screen. Layout is two columns (inputs \| timeline) at ≥800px wide, one column
below that.

**SUP / DPS** in the header appends your direction to the stack/spread wording — support stacks N
and spreads W, DPS stacks S and spreads E. It's config, not pull state: RESET leaves it alone and
it persists across reloads. Left unset it just says `STACK` / `SPREAD` like before, so a stale
default can never point you the wrong way. Nothing else branches on it.

Lightning and bomb carry their name on the button border because the two icons are near-identical
at a glance under a cast bar; water's droplet doesn't need it.

## Overlay pop-out (⧉)

⧉ in the header moves the whole panel into an **always-on-top floating window** that stays above
the game when it's in **borderless-windowed** mode — the overlay behaviour. It uses the
[Document Picture-in-Picture API](https://developer.chrome.com/docs/web-platform/document-picture-in-picture),
so it needs **Chrome/Edge 116+** and the page **served over http(s) or localhost** (a `file://`
path won't work — see Hosting). Keyboard and every input keep working in the floating window;
closing it (or the **DOCK** button) snaps the panel back into the tab.

In the pop-out the in-document header is hidden and the framing lines/scrollbar are removed to keep
outside elements minimal — a slim `DIM · RESET · DOCK` strip is all that sits above the casts. The
one frame that stays is the browser's own PiP title bar: no web API can hide it, so a truly
frameless always-on-top window would need a native wrapper.

The **DIM** slider fades the panel toward its dark background so it's less distracting between
mechanics. It can't make the window *see-through to the game* — browsers paint their windows
opaquely to the desktop, and true click-through/transparency needs a native wrapper (Tauri,
Electron, OverlayPlugin). For a small panel parked in a corner, always-on-top + dim is usually
enough. On a browser without Document PiP the button just explains why it's unavailable.

Refs: [P4 in a nutshell](https://raidplan.io/plan/j33r35wvfp5xg7dd) ·
[UMAD p4 extended](https://raidplan.io/plan/guufe9q559evt7pj) ·
[original tool](https://aweiyourdog.github.io/ff14-kfk-p4/ff14kfkp4)

## Inputs (boss cast order)

Per Grand Cross: 2 water + 2 lightning sharing **one** timer for the whole set, 4 💣 accel bombs
split **2 short + 2 long**, and 2 gazes riding on top. Across both casts you get exactly one 💧/⚡,
exactly one 💣 and at most one 👁. The bomb's timer is the one free roll; it does **not** follow the
💧⚡ set timer. The gaze needs no timer: GC1's are the short shrieks, GC2's the long ones.

Your 💧/⚡ and your 💣 always come from **different** casts, and a 👁 always rides on a 💣 — so
naming any one of the three settles where the others are. That is not in any guide; it was measured
from FFLogs over 35 pulls with [tools/fflogs-survey.js](tools/fflogs-survey.js), which needs no API
key. Results and exact debuff durations are in [MECHANIC.md](MECHANIC.md).

1. **Grand Cross 1 (0:23)** — 🔵/❓, then whatever landed on you: 💧/⚡, 💣 SHORT/LONG, 👁. Set
   SHORT/LONG for the window your 💧/⚡ resolves in.
2. **Chaos Cast 1 (0:28)** — element (🔥/🌊) + 🔵/❓.
3. **Grand Cross 2 (0:38)** — 🔵/❓, same picks. Anything the *other* cast already gave you is greyed
   out here, and the greyed 💣 row reads NONE. Greyed does not mean dead: press it and the debuff
   moves to this cast. Picks on the same card never block each other.
4. **Chaos Cast 2 (0:43)** — element auto (the other one), 🔵/❓.
5. **Thunder III line (1:23) / Blizzard III cone (1:40)** — 🔵/❓ + Mana Release 🔵/❓ per element
   (real release keeps, fake inverts). Shown as one cast × release matrix, since that's the shape
   of the mechanic. Keyboard order is line cast → cone cast → line release → cone release; if the
   two releases ever land the other way round, just click them — each row is labelled.

## Timeline (computed)

Fixed order: Exdeath SHORT → short shrieks → Inferno → Exdeath LONG → long shrieks → Tsunami →
stored combo. Each debuff resolves once, in its own window. A window shows your 💧/⚡ answer, or
"FILL A STACK" when that debuff lands in the other window, plus your 💣 answer on top when the bomb
is due. The two can come from **different casts**, so each part carries its own GC1/GC2 tag and is
judged by that cast's real/fake. GC1's gazes are always the short shrieks.

Answer table: water real=stack/fake=spread · lightning real=spread/fake=stack ·
bomb real=stop/fake=move · gaze real=look away/fake=look at · fire real=out/fake=in (resolves 1st) ·
water(chaos) real=in/fake=out (resolves 2nd) · line/cone real=avoid/fake=stand, XOR'd with release.

## Hosting

Any static host. GitHub Pages: `git init && git add . && git commit -m x`, `gh repo create ... --push`,
enable Pages. Cloudflare: `npx wrangler pages deploy .`. LAN: `python -m http.server 8080`.

`solver.js` is an ES module, so the page must be **served** over http(s) — a `file://` path fails
on the import. That was already true for the pop-out.

Icons from `https://xivapi.com/i/215000/<id>.png`. FFXIV assets © SQUARE ENIX.
