# P4 helper v2

Open `/v2/` through the same web server as the original helper.
The original page contains one link to this version.

This version follows the original layout, colors, controls, and selection behavior.
It uses the unchanged `../solver.js` and the existing local icons.
The default layout uses one narrow column, with a maximum width of 540 pixels.
Horizontal layout places resolutions beside inputs, with a maximum width of 1100 pixels.
Windows at 720 pixels or less use one column in either layout.

- Each Grand Cross keeps its debuffs, durations, gaze control, and status tags together.
- The water/lightning duration appears on its source card. The other card shows the inferred duration.
- The bomb uses its game icon, with a BOMB label above it. Lightning keeps its existing label.
- Chaos 1 has the only element selector. Chaos 2 shows the opposite element automatically.
- Stored cast controls sit side by side.
- Release controls place Thunder above Blizzard, matching the rings above the boss.
- Each release retains an independent real/fake choice.
- The release labels and controls stay close together at the left.
- Resolution 6 combines Tsunami and both stored spells. It preserves all original partial answers.
- Resolution rows show a step number, actions, and source icons at the right.
- Fake sources have a red border and a question mark. Real sources show the icon alone.
- A fill action shows the source of the active stack, including a cast that gave the player no water/lightning debuff.
- Stored spell icons show the effective result after release. Their provisional results follow the original behavior.
- Cast timestamps and custom hotkeys are removed.
- Undo remains available as a button, including in the floating window.
- Hints, role selection, and the floating window follow the original behavior.
- Settings offer vertical/horizontal layout, icon sizes from 24 to 42 pixels, and text sizes from 85% to 130%.
- The settings preview updates immediately. Restore display defaults changes only display settings.
- Inputs, role, display settings, and the last 100 Undo entries persist through refresh in separate storage for v2.
- Reset clears the phase inputs. It preserves the role and display settings, and Undo can reverse it.
- Settings remain available in the floating window. Its initial size follows the selected layout.

Real/fake, Chaos element, and water/lightning duration selections use the original idempotent behavior.
Debuff selections retain the original toggle behavior.
Dimmed debuff controls remain available for corrections.

Run `bun test` from the project directory.
All 63 tests pass: 33 original solver tests, 18 source mapping tests, and 12 settings and persistence tests.
Browser checks cover a full input sequence, partial answers, both gaze sources, corrections, Reset, and Undo.
Refresh checks cover saved inputs, display settings, Reset, and Undo history.
The largest icon and text sizes fit at a width of 320 pixels without horizontal overflow.
Horizontal layout also passes the layout check at a width of 1120 pixels.
