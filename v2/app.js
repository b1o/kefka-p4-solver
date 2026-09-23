import { solve, blank, apply, toggle, JUDGEMENTS } from "../solver.js";
import { resolutionRows } from "./resolution-view.js";
import { defaultSettings, loadSession, saveSession, sanitizeSettings } from "./preferences.js";

const CARD_OF = {
	gc1rf: "gc1",
	c1rf: "c1",
	gc2rf: "gc2",
	c2rf: "c2",
	linerf: "stored",
	conerf: "stored",
	linerel: "stored",
	conerel: "stored",
};

let storage = null;
try {
	storage = window.localStorage;
} catch (e) {}
const restored = loadSession(storage);
let S = restored.state;
let HIST = restored.history;
let ROLE = restored.role;
let settings = restored.settings;

let DOC = document;
const el = (id) => DOC.getElementById(id);
const appEl = document.getElementById("app");

function persist() {
	el("storage-warning").hidden = saveSession(storage, { state: S, role: ROLE, settings, history: HIST });
}
function applySettings() {
	appEl.dataset.layout = settings.layout;
	appEl.style.setProperty("--icon-size", settings.iconSize + "px");
	appEl.style.setProperty("--font-scale", String(settings.fontScale));
	appEl.querySelectorAll('[data-setting="layout"]').forEach((input) => { input.checked = input.value === settings.layout; });
	el("icon-size").value = settings.iconSize;
	el("font-scale").value = settings.fontScale;
	el("icon-size-value").textContent = settings.iconSize + " px";
	el("font-scale-value").textContent = Math.round(settings.fontScale * 100) + "%";
}
function commit(next) {
	HIST.push(S);
	HIST = HIST.slice(-100);
	S = next;
	persist();
	render();
}
function setS(key, val) {
	commit(apply(S, key, val));
}
function pickS(key, val) {
	commit(toggle(S, key, val));
}
function toggleMy(k) {
	commit(toggle(S, k, true));
}
function resetAll() {
	commit(blank());
}
function undo() {
	if (HIST.length) {
		S = HIST.pop();
		persist();
		render();
	}
}
function setRole(r) {
	ROLE = ROLE === r ? null : r;
	persist();
	render();
}

let pipWin = null;
async function popout() {
	if (pipWin) {
		pipWin.focus();
		return;
	}
	if (!("documentPictureInPicture" in window)) {
		alert(
			"Pop-out needs the Document Picture-in-Picture API — Chrome or Edge 116+, served over http(s) or localhost (not a file:// path). Your browser or context doesn't support it.",
		);
		return;
	}
	try {
		const r = appEl.getBoundingClientRect();
		const horizontal = settings.layout === "horizontal";
		const inputHeight = appEl.querySelector(".wrap > .col").getBoundingClientRect().height;
		pipWin = await documentPictureInPicture.requestWindow({
			width: horizontal ? Math.min(1100, screen.availWidth - 32) : Math.min(Math.max(Math.ceil(r.width) + 16, 320), 640),
			height: Math.min(Math.max(Math.ceil(horizontal ? inputHeight + 44 : r.height + 8), 360), 940),
		});
	} catch (e) {
		pipWin = null;
		alert("Couldn't open the pop-out window: " + e.message);
		return;
	}
	const base = pipWin.document.createElement("base");
	base.href = new URL("./", location.href).href;
	pipWin.document.head.appendChild(base);
	document.querySelectorAll("link[rel=stylesheet]").forEach((n) => {
		pipWin.document.head.appendChild(n.cloneNode(true));
	});
	pipWin.document.title = "UMAD P4";
	pipWin.document.body.appendChild(appEl);
	DOC = pipWin.document;
	appEl.classList.add("popped");
	document.getElementById("docked").hidden = false;
	pipWin.document.addEventListener("click", clickHandler);
	pipWin.addEventListener("pagehide", dockBack, { once: true });
	render();
}
function dockBack() {
	appEl.classList.remove("popped");
	document.body.appendChild(appEl);
	document.getElementById("docked").hidden = true;
	DOC = document;
	const w = pipWin;
	pipWin = null;
	if (w) w.close();
	render();
}

function clickHandler(e) {
	const b = e.target.closest("[data-act]");
	if (!b) return;
	const d = b.dataset;
	switch (d.act) {
		case "s":
			setS(d.k, d.v);
			break;
		case "pick":
			pickS(d.k, d.v);
			break;
		case "toggle":
			toggleMy(d.k);
			break;
		case "role":
			setRole(d.v);
			break;
		case "help":
			appEl.classList.toggle("help");
			el("btn-help").setAttribute("aria-pressed", String(appEl.classList.contains("help")));
			break;
		case "settings":
			el("settings").showModal();
			break;
		case "settings-defaults":
			settings = { ...defaultSettings };
			applySettings();
			persist();
			break;
		case "reset":
			resetAll();
			break;
		case "undo":
			undo();
			break;
		case "pop":
			popout();
			break;
		case "dock":
			dockBack();
			break;
	}
}
document.addEventListener("click", clickHandler);
appEl.addEventListener("input", (event) => {
	const control = event.target;
	const key = control.dataset.setting;
	if (!key) return;
	settings = sanitizeSettings({ ...settings, [key]: key === "layout" ? control.value : Number(control.value) });
	applySettings();
	persist();
});

function paintRF(key) {
	el("b-" + key + "-real").classList.toggle("on", S[key] === "real");
	el("b-" + key + "-fake").classList.toggle("on", S[key] === "fake");
}
function paintTL(n, html) {
	const a = el("tla-" + n),
		row = el("tl-" + n);
	if (html) {
		a.innerHTML = html;
		a.classList.remove("none");
		row.classList.add("ready");
	} else {
		a.textContent = "—";
		a.classList.add("none");
		row.classList.remove("ready");
	}
}

const WINDOW_LBL = { short: "SHORT", long: "LONG" };
const SOURCE_ICONS = {
	water: { id: 215696, name: "Water" },
	light: { id: 215623, name: "Lightning" },
	bomb: { id: 215727, name: "Acceleration bomb" },
	gaze: { id: 215588, name: "Gaze" },
	fire: { id: 215902, name: "Inferno" },
	fluid: { id: 215903, name: "Tsunami" },
	line: { symbol: "⚡", name: "Thunder" },
	cone: { symbol: "❄️", name: "Blizzard" },
};
const CAST_NAMES = { gc1: "Grand Cross 1", gc2: "Grand Cross 2", c1: "Chaos 1", c2: "Chaos 2" };

function paintSource(source) {
	const icon = SOURCE_ICONS[source.mechanic];
	const verdict = source.rf || "unknown";
	const label = [CAST_NAMES[source.cast], icon.name, source.rf || "judgment not entered"].filter(Boolean).join(" · ");
	const picture = icon.id
		? `<img src="../icons/${icon.id}.png" alt="" draggable="false" />`
		: `<span class="source-symbol" aria-hidden="true">${icon.symbol}</span>`;
	const marker = source.rf === "real" ? "" : `<span class="source-verdict" aria-hidden="true">${source.rf === "fake" ? "?" : "—"}</span>`;
	return `<span class="source-icon ${verdict}" role="img" aria-label="${label}" title="${label}">${picture}${marker}</span>`;
}
function paintParts(groups) {
	if (!groups.length) return null;
	return groups.map((group) => {
		const texts = group.texts.map((text) => text.replace(/^[💣👁]\s*/u, ""));
		return `<div class="resolution-part"><span>${texts.join(" + ")}</span><span class="source-icons">${group.sources.map(paintSource).join("")}</span></div>`;
	}).join("");
}
function paintTag(id, text, muted) {
	const t = el(id);
	t.textContent = text;
	t.classList.toggle("off", muted);
}

function render() {
	const { derived } = solve(S, ROLE);

	JUDGEMENTS.forEach(paintRF);
	["sup", "dps"].forEach((r) => el("b-role-" + r).classList.toggle("on", ROLE === r));
	["fire", "fluid"].forEach((v) => el("b-c1elem-" + v).classList.toggle("on", S.c1elem === v));

	["gc1", "gc2"].forEach((c) => {
		["water", "light"].forEach((v) => {
			const b = el("b-" + c + "wl-" + v);
			b.classList.toggle("on", S[c + "wl"] === v);
			b.classList.toggle("lockd", derived.locked[c + "wl"]);
		});
		["short", "long"].forEach((v) => {
			const b = el("b-" + c + "bomb-" + v);
			b.classList.toggle("on", S[c + "bomb"] === v);
			b.classList.toggle("lockd", derived.locked[c + "bomb"]);
			el("b-" + c + "win-" + v).classList.toggle("on", S.wlTimer === v);
		});
		const g = el("b-" + c + "gaze");
		g.classList.toggle("on", !!S[c + "gaze"]);
		g.classList.toggle("lockd", derived.locked[c + "gaze"]);
		const bomb = el("icon-" + c + "bomb");
		bomb.classList.toggle("on", !!S[c + "bomb"]);
		bomb.classList.toggle("lockd", derived.locked[c + "bomb"]);

		const owns = derived.wlOwner === c;
		el("wrap-" + c + "win").style.display = owns ? "" : "none";
		const win = derived.wlWindow[c];
		paintTag(
			c === "gc1" ? "lbl-gc1win" : "lbl-gc2win",
			win ? "💧⚡ " + WINDOW_LBL[win] : "💧⚡ —",
			!win || owns,
		);
		paintTag(
			c === "gc1" ? "lbl-gc1bomb" : "lbl-gc2bomb",
			derived.locked[c + "bomb"] ? "💣 NONE" : S[c + "bomb"] ? "💣 " + WINDOW_LBL[S[c + "bomb"]] : "💣 —",
			!S[c + "bomb"],
		);
	});

	[
		["gc1", "gc1rf"],
		["gc2", "gc2rf"],
		["c1", "c1rf"],
		["c2", "c2rf"],
	].forEach(([h, k]) => {
		el("head-" + h).classList.toggle("real", S[k] === "real");
		el("head-" + h).classList.toggle("fake", S[k] === "fake");
	});

	const step = derived.focus;
	JUDGEMENTS.forEach((k) => el("rf-" + k).classList.toggle("focus", k === step));
	["gc1", "c1", "gc2", "c2", "stored"].forEach((c) =>
		el("card-" + c).classList.toggle("active", !!step && CARD_OF[step] === c),
	);

	paintTag(
		"lbl-c2elem",
		derived.c2elem ? (derived.c2elem === "fire" ? "🔥 INFERNO" : "🌊 TSUNAMI") : "ELEM —",
		!derived.c2elem,
	);

	resolutionRows(S, ROLE).forEach((groups, index) => paintTL(index + 1, paintParts(groups)));
	appEl.querySelectorAll("button[data-act]").forEach((button) => {
		const { act, k, v } = button.dataset;
		if (act === "s" || act === "pick") button.setAttribute("aria-pressed", String(S[k] === v));
		if (act === "toggle") button.setAttribute("aria-pressed", String(!!S[k]));
		if (act === "role") button.setAttribute("aria-pressed", String(ROLE === v));
		if (act === "undo") button.disabled = HIST.length === 0;
	});
}

applySettings();
render();
