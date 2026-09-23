import { blank } from "../solver.js";

export const defaultSettings = Object.freeze({ layout: "vertical", iconSize: 30, fontScale: 1 });

const SESSION_KEY = "kefka-v2-session";
const ROLE_KEY = "kefka-v2-role";
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const roleOf = (value) => (value === "sup" || value === "dps" ? value : null);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function sanitizeSettings(value) {
	const source = isRecord(value) ? value : {};
	return {
		layout: source.layout === "horizontal" ? "horizontal" : "vertical",
		iconSize: Number.isFinite(source.iconSize) ? clamp(Math.round(source.iconSize), 24, 42) : defaultSettings.iconSize,
		fontScale: Number.isFinite(source.fontScale)
			? Math.round(clamp(source.fontScale, 0.85, 1.3) * 20) / 20
			: defaultSettings.fontScale,
	};
}

function sanitizeState(value) {
	const state = blank();
	if (!isRecord(value)) return state;
	for (const key of Object.keys(state)) {
		const candidate = value[key];
		if (key.endsWith("rf") || key.endsWith("rel")) {
			if (candidate === "real" || candidate === "fake") state[key] = candidate;
		} else if (key.endsWith("wl")) {
			if (candidate === "water" || candidate === "light") state[key] = candidate;
		} else if (key.endsWith("bomb") || key === "wlTimer") {
			if (candidate === "short" || candidate === "long") state[key] = candidate;
		} else if (key.endsWith("gaze")) {
			if (candidate === true) state[key] = true;
		} else if (key === "c1elem") {
			if (candidate === "fire" || candidate === "fluid") state[key] = candidate;
		}
	}
	return state;
}

function sanitizeSession(value) {
	const source = isRecord(value) ? value : {};
	return {
		state: sanitizeState(source.state),
		role: roleOf(source.role),
		settings: sanitizeSettings(source.settings),
		history: Array.isArray(source.history) ? source.history.filter(isRecord).slice(-100).map(sanitizeState) : [],
	};
}

function read(storage, key) {
	try {
		return storage.getItem(key);
	} catch {
		return null;
	}
}

export function loadSession(storage) {
	let payload = null;
	try {
		payload = JSON.parse(read(storage, SESSION_KEY));
	} catch {}
	const session = sanitizeSession(payload);
	const hasSavedRole = isRecord(payload) && Object.hasOwn(payload, "role") && (payload.role === null || roleOf(payload.role));
	if (!hasSavedRole) session.role = roleOf(read(storage, ROLE_KEY));
	return session;
}

export function saveSession(storage, session) {
	try {
		storage.setItem(SESSION_KEY, JSON.stringify(sanitizeSession(session)));
		return true;
	} catch {
		return false;
	}
}
