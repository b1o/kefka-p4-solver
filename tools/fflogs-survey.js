// Paste into the DevTools console on any www.fflogs.com page, then call:
//   await survey(["XGYVrK3yABfdn6ha", "..."], 3)
//
// No API key needed. The report pages fetch these same JSON endpoints themselves,
// so this is only what the site already does when you click through a log.
// Zone 76 = Dancing Mad (Ultimate). Rankings there give public report codes:
//   [...document.querySelectorAll("a")].map(a => a.getAttribute("href") || "")
//     .filter(h => /\/reports\/[a-zA-Z0-9]{16}/.test(h))
//
// Phase 4 is `phases` id 4. Every P4 debuff lands in the first ~45s of it.

const WANT = /Compressed Water|Forked Lightning|Acceleration Bomb|Cursed Shriek/i;
const isWL = (a) => /Compressed Water|Forked Lightning/.test(a);
const isBomb = (a) => /Acceleration Bomb/.test(a);
const isShriek = (a) => /Cursed Shriek/.test(a);

async function grab(code, fightId, fp) {
	const f = (fp.fights || []).find((x) => x.id === fightId);
	const p4 = f && f.phases && f.phases.find((p) => p.id === 4);
	if (!p4) return null;
	const start = p4.startTime;
	const end = Math.min(start + 55000, f.end_time);
	const names = {};
	(fp.friendlies || []).forEach((x) => (names[x.id] = x.name));
	let t = start;
	const out = [];
	for (let i = 0; i < 14; i++) {
		const url = `/reports/summary-events/${code}/${fightId}/${t}/${end}/0/0/Any/0/-1.0.-1.-1/0`;
		const j = await (await fetch(url)).json();
		(j.events || []).forEach((e) => {
			if (e.type === "applydebuff" && e.targetIsFriendly && !e.sourceIsFriendly && WANT.test(e.ability.name))
				out.push({ t: e.timestamp - start, ab: e.ability.name, who: names[e.targetID] || "#" + e.targetID, dur: e.duration });
		});
		if (!j.nextPageTimestamp) break;
		t = j.nextPageTimestamp;
	}
	return out;
}

function analyse(rows) {
	if (!rows || rows.length < 16) return { skip: true };
	const times = [...new Set(rows.map((r) => r.t))].sort((a, b) => a - b);
	const groups = [];
	times.forEach((t) => {
		const g = groups.find((g) => Math.abs(g[0] - t) < 3000);
		g ? g.push(t) : groups.push([t]);
	});
	const res = { sameCastBoth: 0, shriekOnBomb: 0, shriekOnWL: 0, shriekAlone: 0, wlUniform: true, bombSplit: true, players: {} };
	for (const c of [1, 2]) {
		const inCast = rows.filter((r) => groups[c - 1] && groups[c - 1].includes(r.t));
		const byPlayer = {};
		inCast.forEach((r) => (byPlayer[r.who] = byPlayer[r.who] || []).push(r));
		const wlDur = [];
		const bDur = [];
		for (const who in byPlayer) {
			const abs = byPlayer[who];
			const w = abs.filter((x) => isWL(x.ab));
			const b = abs.filter((x) => isBomb(x.ab));
			const s = abs.filter((x) => isShriek(x.ab));
			if (w.length && b.length) res.sameCastBoth++;
			if (s.length) b.length ? res.shriekOnBomb++ : w.length ? res.shriekOnWL++ : res.shriekAlone++;
			w.forEach((x) => wlDur.push(x.dur));
			b.forEach((x) => bDur.push(x.dur));
			const p = (res.players[who] = res.players[who] || { wl: 0, b: 0, s: 0 });
			p.wl += w.length;
			p.b += b.length;
			p.s += s.length;
		}
		if (new Set(wlDur).size !== 1) res.wlUniform = false;
		const distinct = [...new Set(bDur)];
		if (distinct.length !== 2 || bDur.length !== 4 || bDur.filter((d) => d === distinct[0]).length !== 2) res.bombSplit = false;
	}
	res.badWL = Object.values(res.players).filter((p) => p.wl !== 1).length;
	res.badBomb = Object.values(res.players).filter((p) => p.b !== 1).length;
	res.badShriek = Object.values(res.players).filter((p) => p.s > 1).length;
	return res;
}

async function survey(codes, perReport = 3) {
	const agg = { pulls: 0, sameCastBoth: 0, shriekOnBomb: 0, shriekOnWL: 0, shriekAlone: 0, wlNotUniform: 0, bombNotSplit: 0, badWL: 0, badBomb: 0, badShriek: 0, fights: [] };
	for (const code of codes) {
		const fp = await (await fetch(`/reports/fights-and-participants/${code}/0?lang=en&`)).json();
		const fights = (fp.fights || []).filter((f) => f.phases && f.phases.some((p) => p.id === 4)).slice(0, perReport);
		for (const f of fights) {
			const a = analyse(await grab(code, f.id, fp));
			if (a.skip) continue;
			agg.pulls++;
			["sameCastBoth", "shriekOnBomb", "shriekOnWL", "shriekAlone", "badWL", "badBomb", "badShriek"].forEach((k) => (agg[k] += a[k]));
			if (!a.wlUniform) agg.wlNotUniform++;
			if (!a.bombSplit) agg.bombNotSplit++;
			agg.fights.push(code.slice(0, 6) + "#" + f.id);
		}
	}
	return agg;
}
