import { ANSWERS, FILL, answer, blank, solve } from "../solver.js";

const CAST_OF = { GC1: "gc1", GC2: "gc2" };

const group = (parts, source) => ({
	texts: parts.map((part) => part.text),
	sources: source ? [source] : [],
});

function exdeathGroups(parts, window, state, derived) {
	return parts.map((part) => {
		if (part.text.startsWith(FILL)) {
			const cast = Object.keys(derived.wlWindow).find((key) => derived.wlWindow[key] === window);
			const rf = cast ? state[cast + "rf"] : null;
			const source = rf ? { mechanic: answer("water", rf) === "STACK" ? "water" : "light", rf, cast } : null;
			return group([part], source);
		}
		const cast = CAST_OF[part.src];
		const mechanic = ANSWERS.bomb.includes(part.text) ? "bomb" : state[cast + "wl"];
		return group([part], { mechanic, rf: state[cast + "rf"], cast });
	});
}

function gazeGroups(parts, cast, state) {
	return parts.length ? [group(parts, { mechanic: "gaze", rf: state[cast + "rf"], cast })] : [];
}

function chaosGroups(parts, mechanic, state) {
	const cast = state.c1elem === mechanic ? "c1" : "c2";
	return parts.length ? [group(parts, { mechanic, rf: state[cast + "rf"], cast })] : [];
}

function storedGroups(parts) {
	return parts.map((part) => {
		const mechanic = ["line", "cone"].find((key) => ANSWERS[key].includes(part.text));
		return group([part], { mechanic, rf: part.text === ANSWERS[mechanic][1] ? "fake" : "real" });
	});
}

export function resolutionRows(state, role = null) {
	const current = { ...blank(), ...state };
	const { timeline, derived } = solve(current, role);
	return [
		exdeathGroups(timeline.exShort, "short", current, derived),
		gazeGroups(timeline.shrieksShort, "gc1", current),
		chaosGroups(timeline.inferno, "fire", current),
		exdeathGroups(timeline.exLong, "long", current, derived),
		gazeGroups(timeline.shrieksLong, "gc2", current),
		[...chaosGroups(timeline.tsunami, "fluid", current), ...storedGroups(timeline.stored)],
	];
}
