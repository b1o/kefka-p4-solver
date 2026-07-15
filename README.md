# UMAD P4 — Real/Fake Cheat Sheet

Personal tool for The Unending Dance of Madness (Ultimate) phase 4. Tab out, press what the boss
cast, read the computed resolution timeline. Single `index.html` + `icons/`, no dependencies.

Full mechanic spec (rebuild-from-scratch reference): [MECHANIC.md](MECHANIC.md)

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
   (real release keeps, fake inverts).

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
