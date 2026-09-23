import { describe, expect, test } from "bun:test";
import { resolutionRows } from "./resolution-view.js";

test("empty input has six empty rows", () => {
	expect(resolutionRows({})).toEqual([[], [], [], [], [], []]);
});

test("water/lightning and bomb retain separate sources and the original action text", () => {
	const rows = resolutionRows({
		gc1rf: "fake",
		gc1wl: "light",
		wlTimer: "short",
		gc2rf: "real",
		gc2bomb: "short",
	}, "sup");
	expect(rows[0]).toEqual([
		{ texts: ["STACK North"], sources: [{ mechanic: "light", rf: "fake", cast: "gc1" }] },
		{ texts: ["💣 STOP"], sources: [{ mechanic: "bomb", rf: "real", cast: "gc2" }] },
	]);
});

describe("FILL uses the active cast's stack mechanic", () => {
	test.each([
		["gc1", "gc2", "short", 3, "fake", "light"],
		["gc1", "gc2", "long", 0, "real", "water"],
		["gc2", "gc1", "short", 3, "real", "water"],
		["gc2", "gc1", "long", 0, "fake", "light"],
	])("personal %s and active %s with %s timer", (personal, active, timer, row, rf, mechanic) => {
		const rows = resolutionRows({ [personal + "wl"]: "water", [personal + "rf"]: "real", [active + "rf"]: rf, wlTimer: timer }, "dps");
		expect(rows[row]).toEqual([
			{ texts: ["FILL A STACK South"], sources: [{ mechanic, rf, cast: active }] },
		]);
	});

	test("the bomb can identify the active stack cast before personal water/lightning is entered", () => {
		expect(resolutionRows({ gc1bomb: "short", gc1rf: "fake", wlTimer: "long" })[0][0]).toEqual({
			texts: ["FILL A STACK"], sources: [{ mechanic: "light", rf: "fake", cast: "gc1" }],
		});
	});

	test("unknown active cast or judgement leaves the existing FILL action without a badge", () => {
		for (const state of [{ wlTimer: "short" }, { gc1wl: "light", gc1rf: "fake", wlTimer: "short" }]) {
			expect(resolutionRows(state)[3]).toEqual([{ texts: ["FILL A STACK"], sources: [] }]);
		}
	});
});

describe("gaze sources", () => {
	test.each([
		["gc1", 1, "real", "LOOK AWAY"],
		["gc2", 4, "fake", "LOOK AT IT"],
	])("%s groups the holder action and direction", (cast, row, rf, direction) => {
		expect(resolutionRows({ [cast + "gaze"]: true, [cast + "rf"]: rf })[row]).toEqual([
			{ texts: ["👁 GO UNDER BOSS", direction], sources: [{ mechanic: "gaze", rf, cast }] },
		]);
	});

	test("a holder action keeps an unknown judgement distinct from real", () => {
		expect(resolutionRows({ gc2gaze: true })[4]).toEqual([
			{ texts: ["👁 GO UNDER BOSS"], sources: [{ mechanic: "gaze", rf: null, cast: "gc2" }] },
		]);
	});

	test("a player without gaze still sees the cast's direction and source", () => {
		expect(resolutionRows({ gc1rf: "fake" })[1]).toEqual([
			{ texts: ["LOOK AT IT"], sources: [{ mechanic: "gaze", rf: "fake", cast: "gc1" }] },
		]);
	});
});

test("Tsunami first uses Chaos 1 while Inferno uses Chaos 2", () => {
	const rows = resolutionRows({ c1elem: "fluid", c1rf: "fake", c2rf: "real" });
	expect(rows[2]).toEqual([{ texts: ["OUT (circle)"], sources: [{ mechanic: "fire", rf: "real", cast: "c2" }] }]);
	expect(rows[5]).toEqual([{ texts: ["OUT (circle)"], sources: [{ mechanic: "fluid", rf: "fake", cast: "c1" }] }]);
});

describe("stored source markers follow the displayed effective result", () => {
	test.each([
		["real", "real", "real", "AVOID"],
		["real", "fake", "fake", "STAND IN"],
		["fake", "real", "fake", "STAND IN"],
		["fake", "fake", "real", "AVOID"],
	])("%s cast and %s release produce a %s source", (castRF, releaseRF, rf, action) => {
		const rows = resolutionRows({ linerf: castRF, linerel: releaseRF, conerf: castRF, conerel: releaseRF });
		expect(rows[5]).toEqual([
			{ texts: [action + " LINE"], sources: [{ mechanic: "line", rf }] },
			{ texts: [action + " CONE"], sources: [{ mechanic: "cone", rf }] },
		]);
	});

	test("an unreleased cone retains the original provisional answer and source", () => {
		expect(resolutionRows({ conerf: "fake" })[5]).toEqual([
			{ texts: ["STAND IN CONE"], sources: [{ mechanic: "cone", rf: "fake" }] },
		]);
	});
});
