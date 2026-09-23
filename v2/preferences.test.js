import { describe, expect, test } from "bun:test";
import { blank } from "../solver.js";
import { defaultSettings, loadSession, sanitizeSettings, saveSession } from "./preferences.js";

const memoryStorage = (entries = {}) => {
	const values = new Map(Object.entries(entries));
	return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

const emptySession = () => ({ state: blank(), role: null, settings: { ...defaultSettings }, history: [] });

describe("session persistence", () => {
	test("restores inputs, role, settings, and undo history after refresh", () => {
		const storage = memoryStorage();
		const previous = { ...blank(), gc1rf: "fake", gc1gaze: true };
		const session = {
			state: { ...previous, gc1bomb: "long", gc2wl: "light", wlTimer: "short", c1elem: "fluid", linerel: "real" },
			role: "dps",
			settings: { layout: "horizontal", iconSize: 36, fontScale: 1.15 },
			history: [blank(), previous],
		};
		expect(saveSession(storage, session)).toBe(true);
		expect(loadSession(storage)).toEqual(session);
	});

	test("returns defaults when storage is empty or unavailable", () => {
		expect(loadSession(memoryStorage())).toEqual(emptySession());
		expect(loadSession(undefined)).toEqual(emptySession());
		expect(loadSession({ getItem() { throw new Error("blocked"); } })).toEqual(emptySession());
	});

	test("recovers from damaged JSON and invalid session shapes", () => {
		for (const payload of ["{broken", "null", "true", "42", '"text"', "[]"]) {
			expect(loadSession(memoryStorage({ "kefka-v2-session": payload }))).toEqual(emptySession());
		}
	});

	test("migrates a valid role without replacing a valid session role", () => {
		const storage = memoryStorage({ "kefka-v2-role": "sup" });
		expect(loadSession(storage).role).toBe("sup");
		saveSession(storage, { ...emptySession(), role: "dps" });
		expect(loadSession(storage).role).toBe("dps");
		expect(loadSession(memoryStorage({ "kefka-v2-role": "tank" })).role).toBeNull();
	});

	test("preserves an intentional empty role instead of restoring the legacy role", () => {
		const storage = memoryStorage({ "kefka-v2-role": "dps" });
		saveSession(storage, emptySession());
		expect(loadSession(storage).role).toBeNull();
	});

	test("migrates the legacy role when the session role is absent or invalid", () => {
		for (const payload of [{ state: blank() }, { state: blank(), role: "tank" }]) {
			const storage = memoryStorage({ "kefka-v2-role": "dps", "kefka-v2-session": JSON.stringify(payload) });
			expect(loadSession(storage).role).toBe("dps");
		}
	});

	test("reports write failures without throwing", () => {
		expect(saveSession(undefined, emptySession())).toBe(false);
		expect(saveSession({ setItem() { throw new Error("quota"); } }, emptySession())).toBe(false);
	});

	test("accepts only known fields and their permitted values", () => {
		const storage = memoryStorage({ "kefka-v2-session": JSON.stringify({
			state: { gc1rf: "fake", c1rf: "water", gc2wl: "light", gc1wl: "fire", gc1bomb: "short", gc2bomb: 1,
				wlTimer: "long", gc1gaze: true, gc2gaze: "true", c1elem: "fluid", linerf: "real", conerel: "fake", unknown: "real" },
			role: "invalid", settings: { extra: true }, history: "invalid", unknown: true,
		}) });
		expect(loadSession(storage)).toEqual({
			...emptySession(),
			state: { ...blank(), gc1rf: "fake", gc2wl: "light", gc1bomb: "short", wlTimer: "long", gc1gaze: true,
				c1elem: "fluid", linerf: "real", conerel: "fake" },
		});
	});

	test("limits undo history to the last 100 valid state objects", () => {
		const storage = memoryStorage();
		const states = Array.from({ length: 105 }, (_, index) => ({ ...blank(), gc1rf: index % 2 ? "real" : "fake" }));
		saveSession(storage, { ...emptySession(), history: [null, false, [], ...states, { gc1rf: "invalid", unknown: true }] });
		const history = loadSession(storage).history;
		expect(history).toHaveLength(100);
		expect(history).toEqual([...states.slice(-99), blank()]);
	});

	test("saving sanitized inputs does not modify the caller's objects", () => {
		const storage = memoryStorage();
		const session = { state: { gc1rf: "fake", other: "ignored" }, settings: { iconSize: 99 }, history: [{ gc1gaze: true }] };
		const before = structuredClone(session);
		expect(saveSession(storage, session)).toBe(true);
		expect(session).toEqual(before);
		expect(loadSession(storage).state).toEqual({ ...blank(), gc1rf: "fake" });
	});
});

describe("display preferences", () => {
	test("uses defaults for invalid settings", () => {
		for (const settings of [undefined, null, [], "horizontal", { layout: "other", iconSize: "36", fontScale: Infinity }]) {
			expect(sanitizeSettings(settings)).toEqual(defaultSettings);
		}
	});

	test("clamps sizes and rounds to the settings control steps", () => {
		expect(sanitizeSettings({ layout: "horizontal", iconSize: 2, fontScale: 0.3 })).toEqual({ layout: "horizontal", iconSize: 24, fontScale: 0.85 });
		expect(sanitizeSettings({ iconSize: 100, fontScale: 9 })).toEqual({ layout: "vertical", iconSize: 42, fontScale: 1.3 });
		expect(sanitizeSettings({ iconSize: 30.6, fontScale: 1.12 })).toEqual({ layout: "vertical", iconSize: 31, fontScale: 1.1 });
	});
});
