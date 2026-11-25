/* Shared helpers for the projector (host) and the phones (play). */
window.GGG = (function () {
  "use strict";
  const ART = {};
  const money = (m) => (m >= 1000 ? "$" + (m / 1000).toFixed(2).replace(/\.?0+$/, "") + "B" : "$" + m + "M");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  async function loadArt() {
    const list = await (await fetch("/api/artworks")).json();
    list.forEach((a) => (ART[a.id] = a));
    return ART;
  }
  const img = (id) => (window.PIXART ? PIXART.url(id) : "");
  /* Same scoring as the server: 3 of a group double, all 4 triple. */
  function groupValue(cards) { const s = cards.reduce((t, a) => t + a.estimate, 0); return s * (cards.length >= 4 ? 3 : cards.length === 3 ? 2 : 1); }
  function sameGroup(ids, group) { return ids.map((id) => ART[id]).filter((a) => a && a.group === group); }
  function worthTo(ids, lot) { const same = sameGroup(ids, lot.group); return groupValue(same.concat([lot])) - groupValue(same); }
  function byGroup(ids) {
    const g = {};
    ids.forEach((id) => { const a = ART[id]; if (a) (g[a.group] = g[a.group] || []).push(a); });
    return Object.keys(g).sort((a, b) => a - b).map((k) => ({ group: +k, name: g[k][0].groupName, color: g[k][0].groupColor, cards: g[k], value: groupValue(g[k]) }));
  }
  function initials(name) { return name.replace(/\(bot\)/i, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"; }
  function avatar(p, cls) { return `<span class="av ${cls || ""}" style="--c:${p.color}" aria-hidden="true">${esc(initials(p.name))}</span>`; }
  function connect(onState) {
    const c = new signalR.HubConnectionBuilder().withUrl("/hub").withAutomaticReconnect([0, 1000, 2000, 4000, 8000, 8000, 15000]).build();
    c.on("state", onState);
    return c;
  }
  /* Countdown progress using the server clock, corrected for clock skew. */
  let skew = 0;
  function sync(state) { if (state.serverNow) skew = state.serverNow - Date.now(); }
  function remaining(endsAt) { return endsAt ? Math.max(0, endsAt - (Date.now() + skew)) : 0; }
  return { ART, money, esc, loadArt, img, worthTo, sameGroup, byGroup, groupValue, avatar, initials, connect, sync, remaining };
})();
