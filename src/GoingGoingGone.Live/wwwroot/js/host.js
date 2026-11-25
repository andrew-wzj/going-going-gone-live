/* Projector view: the teacher runs the auction from here. */
(async function () {
  "use strict";
  const { ART, money, esc, img, avatar, byGroup } = GGG;
  const $ = (id) => document.getElementById(id);
  let S = null, room = null, joinBase = location.origin, lastSeq = 0, timerRaf = 0;

  await GGG.loadArt();
  try { joinBase = (await (await fetch("/api/info")).json()).joinBase; } catch (e) { /* keep origin */ }

  const conn = GGG.connect((s) => { GGG.sync(s); const prev = S; S = s; render(prev); });
  conn.onreconnected(() => hostJoin());
  await conn.start();

  async function hostJoin() {
    const saved = JSON.parse(localStorage.getItem("ggg-host") || "null");
    if (saved && (await conn.invoke("HostJoin", saved.code, saved.hostKey))) { room = saved; return; }
    await newRoom();
  }
  async function newRoom() {
    const r = await conn.invoke("CreateRoom");
    room = { code: r.code, hostKey: r.hostKey };
    localStorage.setItem("ggg-host", JSON.stringify(room));
  }
  await hostJoin();

  const act = (a) => conn.invoke("Host", room.code, room.hostKey, a);

  /* ---------- controls ---------- */
  function controls() {
    const p = S.phase, b = (label, a, cls, key, dis) => `<button class="btn ${cls || ""}" data-a="${a}" ${dis ? "disabled" : ""}>${label}${key ? `<kbd>${key}</kbd>` : ""}</button>`;
    const bots = S.players.some((x) => x.isBot);
    let h = "";
    if (p === "Lobby") h = b("Add 3 bots", "bots", "", "", S.players.filter((x) => x.isBot).length >= 6) + b("Start game ▶", "start", "primary", "", S.players.length === 0);
    else if (p === "Idle" || p === "Sold") h = b("Next artwork ▶", "next", "primary", "N", !S.deckLeft) + (bots ? "" : b("Add 3 bots", "bots")) + b("End game", "end");
    else if (p === "Open") h = (S.high ? b("Going, going…", "going", "hot", "Space") : b("No bids: back to deck", "cancel")) + b("Undo last bid", "undo", "", "U", !S.high) + b(`Auto call: ${S.autoCall ? "on" : "off"}`, "auto");
    else if (p === "Going1" || p === "Going2") h = b("Undo last bid", "undo", "", "U");
    else if (p === "Ended") h = b("New room", "new", "primary");
    $("ctl").innerHTML = h;
  }
  $("ctl").addEventListener("click", async (e) => {
    const t = e.target.closest("button[data-a]"); if (!t) return;
    if (t.dataset.a === "new") { localStorage.removeItem("ggg-host"); await newRoom(); return; }
    act(t.dataset.a);
  });
  document.addEventListener("keydown", (e) => {
    if (!S || e.target.closest("input")) return;
    const k = e.key.toLowerCase();
    if (k === "n" && (S.phase === "Idle" || S.phase === "Sold")) act("next");
    else if ((k === " " || k === "g") && S.phase === "Open" && S.high) { e.preventDefault(); act("going"); }
    else if (k === "u" && S.high) act("undo");
  });

  /* ---------- render ---------- */
  function render(prev) {
    controls();
    const humans = S.players.filter((p) => !p.isBot).length;
    $("stats").innerHTML = `<span class="chip">Room <b>${S.code}</b></span><span class="chip">${S.players.length} player${S.players.length === 1 ? "" : "s"}${humans !== S.players.length ? ` (${humans} people)` : ""}</span>` + (S.phase === "Lobby" ? "" : `<span class="chip">${S.deckLeft} left in deck</span>`);
    const leadId = S.high && S.high.playerId;
    $("players").innerHTML = S.players.map((p) => `<div class="pl ${p.id === leadId ? "lead" : ""} ${p.connected ? "" : "off"}">${avatar(p)}<div><b>${esc(p.name)}</b><small>${money(p.cash)} · ${p.cards.length} works</small></div></div>`).join("") || `<span class="muted">Nobody has joined yet.</span>`;
    const ph = S.phase;
    if (ph === "Lobby") return lobby(prev);
    if (ph === "Idle") return idle();
    if (ph === "Ended") return ended();
    auction(prev);
  }

  function lobby(prev) {
    const url = `${joinBase}/play.html?room=${S.code}`;
    if (!prev || prev.phase !== "Lobby" || prev.code !== S.code) {
      const qr = qrcode(0, "M"); qr.addData(url); qr.make();
      $("stage").innerHTML = `<div class="lobby">
        <div class="join"><h2>Join on your phone</h2><div class="qr">${qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true })}</div>
          <div class="url">${esc(url.replace(/^https?:\/\//, ""))}</div><div class="muted" style="margin-top:14px">Room code</div><div class="code">${S.code}</div></div>
        <div class="roster"><h2 id="count"></h2><div class="grid" id="roster"></div>
          <p class="muted" style="font-size:1.1rem;margin-top:18px">Everyone starts with <b>$1.5B</b> and <b>3 artworks</b>. Trying it alone? Add 3 bots.</p></div></div>`;
    }
    $("count").textContent = S.players.length ? `${S.players.length} collector${S.players.length === 1 ? "" : "s"} in the room` : "Waiting for collectors…";
    $("roster").innerHTML = S.players.map((p) => `<div class="who">${avatar(p, "lg")}<span>${esc(p.name)}</span></div>`).join("");
  }

  function idle() {
    $("stage").innerHTML = `<div class="center"><h2>Ready for the next lot</h2><p class="muted" style="font-size:1.4rem">Press <b>Next artwork</b> (or N) to put the top card up for auction.</p>${board(5)}</div>`;
  }

  function ended() {
    $("stage").innerHTML = `<div class="center"><h2>Game over!</h2><p class="muted" style="font-size:1.3rem">Artwork value + cash</p>${board(10)}</div>`;
  }

  function board(n) {
    const rows = S.players.slice().sort((a, b) => b.total - a.total).slice(0, n);
    return `<div class="board">${rows.map((p, i) => `<div class="row ${i === 0 ? "first" : ""}"><span class="rank">${i + 1}</span>${avatar(p, "lg")}<div><b>${esc(p.name)}</b><div class="muted" style="font-size:.7em">art ${money(p.artValue)} + cash ${money(p.cash)}</div></div><span class="tot">${money(p.total)}</span></div>`).join("")}</div>`;
  }

  function auction(prev) {
    const a = ART[S.lot], ph = S.phase, who = S.players.find((p) => S.high && p.id === S.high.playerId);
    const newLot = !prev || prev.lot !== S.lot || !document.getElementById("lotcard");
    if (newLot) {
      $("stage").innerHTML = `<div class="auction">
        <div class="lotcard" id="lotcard" style="--c:${a.groupColor}">
          <img class="art" src="${img(a.id)}" alt="${esc(a.title)}">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="chip grp">${esc(a.groupName)}</span><span class="chip">Reserve ${money(a.reserve)}</span><span class="chip">Estimate ${money(a.estimate)}</span><span class="chip">Set of 3: ${money(a.estimate * 2)} each</span></div>
          <h2>${esc(a.title)}</h2><p class="artist">${esc(a.artist)}</p><p class="story">${esc(a.story)}</p>
          <div class="stampwrap" id="stampwrap"></div>
        </div>
        <div class="panel"><div class="callout" id="callout"></div><div class="bignum" id="bignum"></div><div class="leader" id="leader"></div>
          <div class="timer" id="timer"><i></i></div><div id="sale"></div><div class="feed" id="feed"></div></div></div>`;
    }
    const call = { Open: S.high ? "Bidding open" : "Who'll open?", Going1: "Going…", Going2: "Going… going…", Sold: S.high ? "Gone!" : "No sale" }[ph];
    const co = $("callout");
    if (co.textContent !== call) { co.textContent = call; }
    const revived = S.events[0] && S.events[0].type === "revive" && S.events[0].seq !== lastSeq;
    if (revived) { co.textContent = "New bid! Still open"; co.classList.remove("alive"); void co.offsetWidth; co.classList.add("alive"); }
    lastSeq = S.events[0] ? S.events[0].seq : lastSeq;
    $("bignum").textContent = S.high ? money(S.high.amount) : money(a.reserve);
    $("leader").innerHTML = who ? `${avatar(who, "lg")}<span>${esc(who.name)}</span>` : `<span class="muted">Opens at the Reserve</span>`;
    $("timer").classList.toggle("hidden", !(ph === "Going1" || ph === "Going2"));
    $("stampwrap").innerHTML = ph === "Sold" && S.high ? `<div class="stamp">GONE!</div>` : "";
    const s = S.lastSale;
    $("sale").innerHTML = ph === "Sold" && s && s.who ? `<div class="sale">${avatar(s.who, "xl")}<div><b>${esc(s.who.name)} buys it for ${money(s.amount)}</b>${s.note ? `<div style="font-size:1.2rem;margin-top:6px">${esc(s.note)}</div>` : ""}</div></div>` : "";
    $("feed").innerHTML = S.events.filter((e) => e.type !== "join").slice(0, 9).map((e) => { const p = S.players.find((x) => x.id === e.playerId); return `<p>${p ? avatar(p) : ""}<span>${esc(e.text)}</span></p>`; }).join("");
    tick();
  }

  function tick() {
    cancelAnimationFrame(timerRaf);
    const bar = document.querySelector("#timer i");
    if (!bar || !(S.phase === "Going1" || S.phase === "Going2")) return;
    const total = 1600;
    (function f() { const left = GGG.remaining(S.stepEndsAt); bar.style.width = (100 * (1 - left / total)) + "%"; if (left > 0) timerRaf = requestAnimationFrame(f); })();
  }
})();
