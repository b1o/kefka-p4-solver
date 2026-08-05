export const ANSWERS = {
	water: ["STACK", "SPREAD"],
	light: ["SPREAD", "STACK"],
	bomb: ["💣 STOP", "💣 KEEP MOVING"],
	gaze: ["LOOK AWAY", "LOOK AT IT"],
	fire: ["OUT (circle)", "IN (donut)"],
	fluid: ["IN (donut)", "OUT (circle)"],
	line: ["AVOID LINE", "STAND IN LINE"],
	cone: ["AVOID CONE", "STAND IN CONE"],
};

export const FILL = "FILL A STACK";
export const GOBOSS = "👁 GO UNDER BOSS";

export const DIR = {
	sup: { stack: "North", spread: "West" },
	dps: { stack: "South", spread: "East" },
};

export const JUDGEMENTS = ["gc1rf", "c1rf", "gc2rf", "c2rf", "linerf", "conerf", "linerel", "conerel"];

export const TIMELINE = [
	{ id: "exShort", n: 1 },
	{ id: "shrieksShort", n: 2 },
	{ id: "inferno", n: 3 },
	{ id: "exLong", n: 4 },
	{ id: "shrieksLong", n: 5 },
	{ id: "tsunami", n: 6 },
	{ id: "stored", n: 7 },
];

export const blank = () => ({
	gc1rf: null,
	gc2rf: null,
	c1rf: null,
	c2rf: null,
	c1elem: null,
	gc1wl: null,
	gc2wl: null,
	wlTimer: null,
	gc1bomb: null,
	gc2bomb: null,
	gc1gaze: null,
	gc2gaze: null,
	linerf: null,
	linerel: null,
	conerf: null,
	conerel: null,
});

const CLEARS = {
	gc1wl: ["gc2wl", "gc1bomb"],
	gc2wl: ["gc1wl", "gc2bomb"],
	gc1bomb: ["gc2bomb", "gc1wl"],
	gc2bomb: ["gc1bomb", "gc2wl"],
	gc1gaze: ["gc2gaze"],
	gc2gaze: ["gc1gaze"],
};

export function apply(state, key, value) {
	const next = { ...state, [key]: value };
	if (value && CLEARS[key]) CLEARS[key].forEach((k) => (next[k] = null));
	return next;
}

export function toggle(state, key, value) {
	return apply(state, key, state[key] === value ? null : value);
}

const RF_OF = { gc1: "gc1rf", gc2: "gc2rf" };
const TAG_OF = { gc1: "GC1", gc2: "GC2" };
const OTHER_WINDOW = { short: "long", long: "short" };
const OTHER_ELEMENT = { fire: "fluid", fluid: "fire" };

function place(text, role) {
	if (!role || !DIR[role]) return text;
	if (text === "STACK") return "STACK " + DIR[role].stack;
	if (text === "SPREAD") return "SPREAD " + DIR[role].spread;
	if (text === FILL) return FILL + " " + DIR[role].stack;
	return text;
}

export function answer(mech, rf, role) {
	if (!ANSWERS[mech] || !rf) return null;
	return place(ANSWERS[mech][rf === "real" ? 0 : 1], role);
}

function part(text, cast) {
	return cast ? { text, src: TAG_OF[cast] } : { text };
}

export function wlCastOf(s) {
	if (s.gc1wl) return "gc1";
	if (s.gc2wl) return "gc2";
	return null;
}

export function bombCastOf(s) {
	if (s.gc1bomb) return "gc1";
	if (s.gc2bomb) return "gc2";
	return null;
}

function exdeathWindow(s, win, role) {
	const parts = [];
	const wlCast = wlCastOf(s);

	if (s.wlTimer === win) {
		const text = wlCast ? answer(s[wlCast + "wl"], s[RF_OF[wlCast]], role) : null;
		if (text) parts.push(part(text, wlCast));
	} else if (s.wlTimer) {
		parts.push(part(place(FILL, role), null));
	}

	const bombCast = bombCastOf(s);
	if (bombCast && s[bombCast + "bomb"] === win) {
		const text = answer("bomb", s[RF_OF[bombCast]], role);
		if (text) parts.push(part(text, bombCast));
	}

	return parts;
}

function shrieks(s, cast) {
	const parts = [];
	if (s[cast + "gaze"]) parts.push(part(GOBOSS, null));
	const text = answer("gaze", s[RF_OF[cast]], null);
	if (text) parts.push(part(text, cast));
	return parts;
}

function chaos(s, elem) {
	if (!s.c1elem) return [];
	const rf = s.c1elem === elem ? s.c1rf : s.c2rf;
	const text = answer(elem, rf, null);
	return text ? [part(text, null)] : [];
}

function storedOne(s, mech) {
	const cast = s[mech + "rf"];
	if (!cast) return null;
	const release = s[mech + "rel"];
	const effective = release === "fake" ? (cast === "real" ? "fake" : "real") : cast;
	return answer(mech, effective, null);
}

function stored(s) {
	return [storedOne(s, "line"), storedOne(s, "cone")].filter(Boolean).map((t) => part(t, null));
}

export function solve(state, role = null) {
	const s = { ...blank(), ...state };
	const wlCast = wlCastOf(s);
	const bombCast = bombCastOf(s);
	const other = (c) => (c === "gc1" ? "gc2" : "gc1");
	const wlHolder = wlCast || (bombCast ? other(bombCast) : s.gc1gaze ? "gc2" : s.gc2gaze ? "gc1" : null);
	const wlWindow = { gc1: null, gc2: null };
	if (wlHolder && s.wlTimer) {
		wlWindow[wlHolder] = s.wlTimer;
		wlWindow[other(wlHolder)] = OTHER_WINDOW[s.wlTimer];
	}

	return {
		timeline: {
			exShort: exdeathWindow(s, "short", role),
			shrieksShort: shrieks(s, "gc1"),
			inferno: chaos(s, "fire"),
			exLong: exdeathWindow(s, "long", role),
			shrieksLong: shrieks(s, "gc2"),
			tsunami: chaos(s, "fluid"),
			stored: stored(s),
		},
		derived: {
			wlCast,
			bombCast,
			wlWindow,
			bombWindow: { gc1: s.gc1bomb, gc2: s.gc2bomb },
			c2elem: s.c1elem ? OTHER_ELEMENT[s.c1elem] : null,
			otherWlTimer: s.wlTimer ? OTHER_WINDOW[s.wlTimer] : null,
			focus: JUDGEMENTS.find((k) => !s[k]) || null,
			wlHolder,
			wlOwner: wlHolder || "gc1",
			locked: {
				gc1wl: wlCast === "gc2" || bombCast === "gc1",
				gc2wl: wlCast === "gc1" || bombCast === "gc2",
				gc1bomb: bombCast === "gc2" || wlCast === "gc1",
				gc2bomb: bombCast === "gc1" || wlCast === "gc2",
				gc1gaze: !!s.gc2gaze,
				gc2gaze: !!s.gc1gaze,
			},
		},
	};
}
