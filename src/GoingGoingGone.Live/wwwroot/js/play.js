/* Phone view: one student, one collector. Shows what a lot is worth to *you* before you bid. */
(async function () {
  "use strict";
  const { ART, money, esc, img, avatar, worthTo, sameGroup, byGroup } = GGG;
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  let S = null, me = JSON.parse(localStorage.getItem("ggg-player") || "null"), wasLeading = false, lastLot = null, raf = 0, busy = false;

  await GGG.loadArt();
  if (params.get("room")) $("code").value = params.get("room").toUpperCase();
  if (me && params.get("room") && me.code !== params.get("room").toUpperCase()) me = null;

  const conn = GGG.connect((s) => { GGG.sync(s); S = s; render(); });
  conn.onreconnecting(() => $("offline").classList.remove("hidden"));
  conn.onreconnected(async () => { $("offline").classList.add("hidden"); if (me) await conn.invoke("Rejoin", me.code, me.id); });
  await conn.start();
  if (me && !(await conn.invoke("Rejoin", me.code, me.id))) { me = null; localStorage.removeItem("ggg-player"); }
  if (!me) setTimeout(() => ($("code").value ? $("name") : $("code")).focus(), 50);

  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "joinForm") return;
    e.preventDefault();
    const r = await conn.invoke("Join", $("code").value, $("name").value);
    if (r.error) { $("joinErr").textContent = r.error; return; }
    me = { code: r.code, id: r.id };
    localStorage.setItem("ggg-player", JSON.stringify(me));
    history.replaceState(null, "", `?room=${r.code}`);
    render();
  });

  function toast(t) { const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
  const buzz = (ms) => navigator.vibrate && navigator.vibrate(ms);

  $("main").addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-raise]"); if (!b || busy) return;
    busy = true; b.disabled = true;
    try { const err = await conn.invoke("Bid", me.code, me.id, +b.dataset.raise); if (err) toast(err); else buzz(20); }
    finally { busy = false; }
  });

  function render() {
    if (!S || !me) return;
    const p = S.players.find((x) => x.id === me.id);
    if (!p) return;
    $("top").innerHTML = `${avatar(p, "lg")}<div class="me"><b>${esc(p.name)}</b><small>Room ${S.code} · art ${money(p.artValue)}</small></div><div class="cash"><b>${money(p.cash)}</b><small>cash</small></div>`;
    const ph = S.phase;
    let h = "";
    if (ph === "Lobby") h = `<div class="card"><h2>You're in!</h2><p>Watch the big screen. When the game starts you get <b>$1.5B</b> and <b>3 artworks</b>.</p><p class="muted">${S.players.length} collector${S.players.length === 1 ? "" : "s"} in the room.</p></div>`;
    else if (ph === "Idle") h = `<div class="card"><h2>Next lot coming up…</h2><p class="muted">Look at your collection below. Which group are you close to completing?</p></div>`;
    else if (ph === "Ended") h = finale(p);
    else h = lotView(p);
    $("main").innerHTML = h + collection(p);
    if (ph === "Going1" || ph === "Going2") countdown();
    // feedback when someone outbids you
    const leading = !!(S.high && S.high.playerId === p.id);
    if (S.lot !== lastLot) { wasLeading = false; lastLot = S.lot; }
    if (wasLeading && !leading && (ph === "Open" || ph.startsWith("Going"))) buzz([80, 60, 80]);
    wasLeading = leading;
  }

  function lotView(p) {
    const a = ART[S.lot], ph = S.phase, high = S.high, leading = high && high.playerId === p.id;
    const leader = high && S.players.find((x) => x.id === high.playerId);
    if (ph === "Sold") {
      const s = S.lastSale;
      if (s && s.playerId === p.id) return `<div class="card won" style="background:var(--sun)"><div class="big">You got it!</div><img class="art" src="${img(a.id)}" alt="" style="margin:10px 0"><p><b>${esc(a.title)}</b> for ${money(s.amount)}</p>${s.note ? `<p><b>${esc(s.note)}</b></p>` : ""}</div>`;
      return `<div class="card"><h2>${s && s.who ? `Sold to ${esc(s.who.name)}` : "No sale"}</h2><p>${esc(a.title)}${s && s.who ? ` went for <b>${money(s.amount)}</b>` : " goes back to the deck"}.</p>${s && s.note ? `<p class="muted">${esc(s.note)}</p>` : ""}</div>`;
    }
    const next = high ? high.amount + 10 : a.reserve;
    const worth = worthTo(p.cards, a), owned = sameGroup(p.cards, a.group).length;
    const why = owned === 2 ? `You own 2 ${a.groupName}. This makes <b>3</b>: all three double.` : owned === 3 ? `You own 3 ${a.groupName}. This completes the set: all four <b>triple</b>.` : `It adds its Estimate (${money(a.estimate)}) to your collection.`;
    const rivals = S.players.filter((x) => x.id !== p.id && sameGroup(x.cards, a.group).length >= 2).map((x) => esc(x.name));
    const status = leading ? `<div class="status win">You're the top bidder<span class="num">${money(high.amount)}</span></div>`
      : high ? `<div class="status ${wasLeading ? "lose" : "neutral"}">${avatar(leader)} ${wasLeading ? "Outbid by" : ""} ${esc(leader.name)}<span class="num">${money(high.amount)}</span></div>`
      : `<div class="status neutral">No bids yet<span class="num">opens ${money(a.reserve)}</span></div>`;
    const going = ph === "Going1" || ph === "Going2";
    const raises = high ? [10, 20, 50, 100] : [0, 20, 50, 100];
    const btn = (r, i) => { const amt = high ? high.amount + r : a.reserve + r; const dis = leading || amt > p.cash; return `<button class="btn ${i === 0 ? "primary main" : ""}" data-raise="${r}" ${dis ? "disabled" : ""}>${i === 0 ? `Bid ${money(amt)}` : `${money(amt)}<small>+${money(r)}</small>`}</button>`; };
    return `<div class="card" style="display:flex;flex-direction:column;gap:12px">
      <div class="lot"><img class="art" src="${img(a.id)}" alt=""><div><span class="chip" style="background:${a.groupColor}">${esc(a.groupName)}</span><h3 style="margin-top:6px">${esc(a.title)}</h3><p class="muted">${esc(a.artist)}</p><p>Estimate ${money(a.estimate)}</p></div></div>
      ${going ? `<div><b style="color:var(--salmon);font-family:var(--display);font-size:1.4rem">${ph === "Going1" ? "Going…" : "Going… going…"}</b><div class="going" id="going"><i></i></div></div>` : ""}
      ${status}
      <div class="help"><div>Worth to you: <span class="worth">+${money(worth)}</span></div><p>${why}</p>
        ${next > worth ? `<p class="warn">The next bid (${money(next)}) is more than it adds to your score.</p>` : `<p>Any price up to ${money(worth)} still raises your final score.</p>`}
        ${rivals.length ? `<p>Watch out: <b>${rivals.join(", ")}</b> also ${rivals.length === 1 ? "has" : "have"} 2+ ${esc(a.groupName)}.</p>` : ""}</div>
      <div class="bids">${raises.map(btn).join("")}</div>
      ${leading ? "" : `<p class="muted" style="margin:0;text-align:center">After this bid you'd have ${money(Math.max(0, p.cash - next))} cash.</p>`}
    </div>`;
  }

  function finale(p) {
    const rank = S.players.slice().sort((a, b) => b.total - a.total).findIndex((x) => x.id === p.id) + 1;
    return `<div class="card won"><div class="big">${rank === 1 ? "You win!" : `You came #${rank}`}</div><p>Artwork ${money(p.artValue)} + cash ${money(p.cash)} = <b>${money(p.total)}</b></p></div>`;
  }

  function collection(p) {
    const groups = byGroup(p.cards);
    if (!groups.length) return "";
    return `<div class="card coll"><h2 style="font-size:1.2rem;margin-bottom:6px">Your collection</h2>${groups.map((g) => `<div class="g"><span class="sw" style="--c:${g.color}"></span><b>${esc(g.name)}</b><span class="pips" aria-label="${g.cards.length} of 4">${"●".repeat(g.cards.length)}${"○".repeat(4 - g.cards.length)}</span><span class="v">${money(g.value)}${g.cards.length >= 3 ? ` (×${g.cards.length === 4 ? 3 : 2})` : ""}</span></div>`).join("")}
      <div class="thumbs">${p.cards.map((id) => `<img src="${img(id)}" alt="${esc(ART[id].title)}" title="${esc(ART[id].title)}">`).join("")}</div></div>`;
  }

  function countdown() {
    cancelAnimationFrame(raf);
    const bar = document.querySelector("#going i"); if (!bar) return;
    (function f() { const left = GGG.remaining(S.stepEndsAt); bar.style.width = 100 * (1 - left / 1600) + "%"; if (left > 0) raf = requestAnimationFrame(f); })();
  }
})();
