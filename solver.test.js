import { test, expect, describe } from "bun:test";
import { solve, blank, apply, toggle } from "./solver.js";

const flat = (parts) => parts.map((p) => (p.src ? p.text + " (" + p.src + ")" : p.text));

const pull = (over) => ({ ...blank(), ...over });

describe("empty state", () => {
	test("every row is unresolved", () => {
		const { timeline } = solve(blank());
		for (const row of Object.values(timeline)) expect(row).toEqual([]);
	});

	test("focus is the first judgement", () => {
		expect(solve(blank()).derived.focus).toBe("gc1rf");
	});
});

describe("wtfdig pull — GC1 real, GC1 w/l short, GC1 accel long", () => {
	const s = pull({
		gc1rf: "real",
		c1elem: "fire",
		c1rf: "fake",
		gc2rf: "fake",
		c2rf: "fake",
		gc1wl: "light",
		wlTimer: "short",
		gc1bomb: "long",
	});

	test("short window is the GC1 lightning spread", () => {
		expect(flat(solve(s).timeline.exShort)).toEqual(["SPREAD (GC1)"]);
	});

	test("long window mixes casts: no w/l, plus the GC1 bomb", () => {
		expect(flat(solve(s).timeline.exLong)).toEqual(["FILL A STACK", "💣 STOP (GC1)"]);
	});

	test("shrieks stay keyed to their own cast", () => {
		expect(flat(solve(s).timeline.shrieksShort)).toEqual(["LOOK AWAY (GC1)"]);
		expect(flat(solve(s).timeline.shrieksLong)).toEqual(["LOOK AT IT (GC2)"]);
	});

	test("chaos resolves fire first, water second", () => {
		expect(flat(solve(s).timeline.inferno)).toEqual(["IN (donut)"]);
		expect(flat(solve(s).timeline.tsunami)).toEqual(["OUT (circle)"]);
	});

	test("role decorates only the position wording", () => {
		const r = solve(s, "sup").timeline;
		expect(flat(r.exShort)).toEqual(["SPREAD West (GC1)"]);
		expect(flat(r.exLong)).toEqual(["FILL A STACK North", "💣 STOP (GC1)"]);
		expect(flat(r.shrieksShort)).toEqual(["LOOK AWAY (GC1)"]);
	});
});

describe("bomb is independent of water/lightning", () => {
	test("bomb and w/l can land in the same window from different casts", () => {
		const s = pull({ gc1rf: "real", gc2rf: "fake", gc2wl: "water", wlTimer: "long", gc1bomb: "long" });
		expect(flat(solve(s).timeline.exLong)).toEqual(["SPREAD (GC2)", "💣 STOP (GC1)"]);
		expect(flat(solve(s).timeline.exShort)).toEqual(["FILL A STACK"]);
	});

	test("a cast can give a bomb and no water/lightning", () => {
		const s = pull({ gc1rf: "fake", gc2rf: "real", gc2wl: "water", wlTimer: "short", gc1bomb: "short" });
		expect(flat(solve(s).timeline.exShort)).toEqual(["STACK (GC2)", "💣 KEEP MOVING (GC1)"]);
		expect(flat(solve(s).timeline.exLong)).toEqual(["FILL A STACK"]);
	});

	test("a shriek rides on top of whatever that cast gave you", () => {
		const s = pull({ gc1rf: "real", gc1gaze: true, gc1bomb: "short", gc2rf: "real", gc2wl: "light", wlTimer: "long" });
		expect(flat(solve(s).timeline.shrieksShort)).toEqual(["👁 GO UNDER BOSS", "LOOK AWAY (GC1)"]);
		expect(flat(solve(s).timeline.exShort)).toEqual(["FILL A STACK", "💣 STOP (GC1)"]);
	});
});

describe("one cast never gives both a w/l and a bomb", () => {
	test("picking a bomb clears that cast's water/lightning", () => {
		const s = toggle(pull({ gc1wl: "water" }), "gc1bomb", "short");
		expect(s.gc1bomb).toBe("short");
		expect(s.gc1wl).toBe(null);
	});

	test("picking water/lightning clears that cast's bomb", () => {
		const s = toggle(pull({ gc2bomb: "long" }), "gc2wl", "light");
		expect(s.gc2wl).toBe("light");
		expect(s.gc2bomb).toBe(null);
	});

	test("naming your w/l cast implies the bomb is on the other one", () => {
		const d = solve(pull({ gc1wl: "water" })).derived;
		expect(d.locked.gc1bomb).toBe(true);
		expect(d.locked.gc2bomb).toBe(false);
	});

	test("naming your bomb cast implies where your water/lightning is", () => {
		const d = solve(pull({ gc1bomb: "short", wlTimer: "long" })).derived;
		expect(d.wlHolder).toBe("gc2");
		expect(d.wlWindow).toEqual({ gc1: "short", gc2: "long" });
	});

	test("a gaze implies a bomb on that cast, so the w/l is on the other", () => {
		const d = solve(pull({ gc1gaze: true, wlTimer: "short" })).derived;
		expect(d.wlHolder).toBe("gc2");
		expect(d.wlWindow).toEqual({ gc1: "long", gc2: "short" });
	});
});

describe("partial input", () => {
	test("a window stays empty until its cast is judged", () => {
		const s = pull({ gc1wl: "water", wlTimer: "short" });
		expect(solve(s).timeline.exShort).toEqual([]);
	});

	test("FILL shows as soon as the w/l window is known, without any cast judged", () => {
		const s = pull({ wlTimer: "short" });
		expect(flat(solve(s).timeline.exLong)).toEqual(["FILL A STACK"]);
	});

	test("an unjudged bomb cast hides the bomb line but keeps the position", () => {
		const s = pull({ gc1wl: "water", gc1rf: "real", wlTimer: "short", gc2bomb: "short" });
		expect(flat(solve(s).timeline.exShort)).toEqual(["STACK (GC1)"]);
	});
});

describe("stored combo", () => {
	test("fake release inverts the stored cast", () => {
		const s = pull({ linerf: "real", linerel: "fake", conerf: "real", conerel: "real" });
		expect(flat(solve(s).timeline.stored)).toEqual(["STAND IN LINE", "AVOID CONE"]);
	});

	test("one element alone still renders", () => {
		expect(flat(solve(pull({ conerf: "fake" })).timeline.stored)).toEqual(["STAND IN CONE"]);
	});
});

describe("picking moves a debuff instead of blocking", () => {
	test("a gaze cannot sit on both casts", () => {
		const s = toggle(pull({ gc1gaze: true }), "gc2gaze", true);
		expect(s.gc2gaze).toBe(true);
		expect(s.gc1gaze).toBe(null);
	});

	test("a bomb on the other cast reassigns rather than needing a clear first", () => {
		const s = toggle(pull({ gc1bomb: "short" }), "gc2bomb", "long");
		expect(s.gc2bomb).toBe("long");
		expect(s.gc1bomb).toBe(null);
	});

	test("water/lightning reassigns across casts too", () => {
		const s = toggle(pull({ gc1wl: "water" }), "gc2wl", "light");
		expect(s.gc2wl).toBe("light");
		expect(s.gc1wl).toBe(null);
	});

	test("pressing the same pick again clears it", () => {
		const s = toggle(pull({ gc1bomb: "short" }), "gc1bomb", "short");
		expect(s.gc1bomb).toBe(null);
	});

	test("clearing one side never revives the other", () => {
		const s = toggle(toggle(pull({ gc1gaze: true }), "gc2gaze", true), "gc2gaze", true);
		expect(s.gc1gaze).toBe(null);
		expect(s.gc2gaze).toBe(null);
	});

	test("unpaired fields are untouched by the rule", () => {
		const s = apply(pull({ gc1wl: "water" }), "wlTimer", "short");
		expect(s.wlTimer).toBe("short");
		expect(s.gc1wl).toBe("water");
	});

	test("apply never mutates the state it is given", () => {
		const before = pull({ gc1bomb: "short" });
		apply(before, "gc2bomb", "long");
		expect(before.gc1bomb).toBe("short");
		expect(before.gc2bomb).toBe(null);
	});
});

describe("derived state for the UI", () => {
	test("a gaze on one cast marks the other as taken", () => {
		const d = solve(pull({ gc2gaze: true })).derived;
		expect(d.locked.gc1gaze).toBe(true);
		expect(d.locked.gc2gaze).toBe(false);
	});

	test("picking w/l on one cast locks the other", () => {
		const d = solve(pull({ gc1wl: "water" })).derived;
		expect(d.wlCast).toBe("gc1");
		expect(d.locked.gc2wl).toBe(true);
		expect(d.locked.gc1wl).toBe(false);
	});

	test("picking a bomb on one cast locks the other", () => {
		const d = solve(pull({ gc2bomb: "long" })).derived;
		expect(d.bombCast).toBe("gc2");
		expect(d.locked.gc1bomb).toBe(true);
	});

	test("each cast's w/l window follows from yours", () => {
		const d = solve(pull({ gc2wl: "light", wlTimer: "short" })).derived;
		expect(d.wlWindow).toEqual({ gc1: "long", gc2: "short" });
	});

	test("chaos 2 element is the other one", () => {
		expect(solve(pull({ c1elem: "fire" })).derived.c2elem).toBe("fluid");
		expect(solve(pull({ c1elem: "fluid" })).derived.c2elem).toBe("fire");
	});

	test("focus walks the judgements in boss order", () => {
		const s = pull({ gc1rf: "real", c1rf: "fake" });
		expect(solve(s).derived.focus).toBe("gc2rf");
	});
});
