# UMAD P4 — Real/Fake Cheat Sheet

Personal tool for The Unending Dance of Madness (Ultimate) phase 4. Tab out, press what the boss
cast, read the computed resolution timeline. Single `index.html` + `icons/`, no dependencies.

Full mechanic spec (rebuild-from-scratch reference): [MECHANIC.md](MECHANIC.md)

## Keys

Built for alt-tab → press → tab back, so every input is one keypress. `R` / `F` judge **the
highlighted cast** (real / fake) and the highlight advances to the next one the boss will hand you
— during a pull that's the only thing you need to aim at. The rest are printed on the buttons
themselves, so nothing needs memorising:

| Key | Does |
|---|---|
| `R` `F` | real / fake on the highlighted cast, then advance |
| `1` `2` `3` | GC1: my debuff is 💧 / ⚡ / 💣 |
| `S` `L` | GC1: my timer is SHORT / LONG |
| `8` `9` | toggle 👁 gaze on GC1 / GC2 |
| `4` `5` | Chaos 1 element: 🔥 Inferno / 🌊 Tsunami |
| `6` `7` | GC2: my debuff is 💧 / ⚡ (only when 💣 came first) |
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

Refs: [P4 in a nutshell](https://raidplan.io/plan/j33r35wvfp5xg7dd) ·
[UMAD p4 extended](https://raidplan.io/plan/guufe9q559evt7pj) ·
[original tool](https://aweiyourdog.github.io/ff14-kfk-p4/ff14kfkp4)

## Inputs (boss cast order)

Debuff distribution per Grand Cross: 2 water, 2 lightning, 4 bombs (+2 gazes on top). Across both
casts every player gets exactly one 💣 and exactly one 💧/⚡, opposite timers; a gaze can ride on
top of either.

1. **Grand Cross 1 (0:23)** — 🔵/❓, pick your debuff (one of 💧⚡💣), toggle 👁 if you also got a
   gaze, set your SHORT/LONG timer.
2. **Chaos Cast 1 (0:28)** — element (🔥/🌊) + 🔵/❓.
3. **Grand Cross 2 (0:38)** — 🔵/❓. Your debuff: 💣 auto if you had 💧/⚡ first; if you had 💣
   first, pick which of 💧/⚡ you got (not derivable). Timer auto-opposite; 👁 manual.
4. **Chaos Cast 2 (0:43)** — element auto (the other one), 🔵/❓.
5. **Thunder III line (1:23) / Blizzard III cone (1:40)** — 🔵/❓ + Mana Release 🔵/❓ per element
   (real release keeps, fake inverts). Shown as one cast × release matrix, since that's the shape
   of the mechanic. Keyboard order is line cast → cone cast → line release → cone release; if the
   two releases ever land the other way round, just click them — each row is labelled.

## Timeline (computed)

Fixed order: Exdeath SHORT → short shrieks → Inferno → Exdeath LONG → long shrieks → Tsunami →
stored combo. Each debuff resolves once, in its cast's window (your SHORT/LONG input decides
which). A bomb window shows "FILL A STACK + 💣 …" since you still take a position while it pops.
GC1's gazes are always the short shrieks. Answers are personal with a GC1/GC2 source tag.

Answer table: water real=stack/fake=spread · lightning real=spread/fake=stack ·
bomb real=stop/fake=move · gaze real=look away/fake=look at · fire real=out/fake=in (resolves 1st) ·
water(chaos) real=in/fake=out (resolves 2nd) · line/cone real=avoid/fake=stand, XOR'd with release.

## Hosting

Any static host. GitHub Pages: `git init && git add . && git commit -m x`, `gh repo create ... --push`,
enable Pages. Cloudflare: `npx wrangler pages deploy .`. LAN: `python -m http.server 8080`.

Icons from `https://xivapi.com/i/215000/<id>.png`. FFXIV assets © SQUARE ENIX.
