/* Hokage Tower: the Third Hokage's office, with every shinobi's Ninja Info Card and progress.
   Signed-in Hokage (admin email, see account.js) gets an Admin toggle to grant or remove
   progress and to pin a rank. Opened by menu.js via window.HokageTower.open(). */
(function () {
  "use strict";
  var S = window.Shinobi, AV = window.Avatar, R = window.Ranks;
  var root = document.getElementById("hokage");
  root.innerHTML =
    '<div class="acad-bg" aria-hidden="true" style="background-image:url(assets/images/locations/hokage.jpg)"></div>' +
    '<header class="res-head acad-head"><div><p class="kicker">火影の執務室</p><h2 class="res-h">Hokage Tower</h2></div>' +
    '<a class="go res-back acad-back" href="#"><i aria-hidden="true">火</i>Back to the village</a></header>' +
    '<div class="acad-body"><img class="iruka sprite" src="assets/images/characters/hiruzen.png" alt="">' +
      '<div class="menu-box hk-list" aria-label="Shinobi of the village"><div class="hk-tools"><span class="hk-count"></span><button class="hk-admin" type="button" aria-pressed="false" hidden>Admin</button></div><div class="hk-cards"></div></div></div>' +
    '<div class="vn"><div class="vn-name">Hiruzen Sarutobi</div><p class="vn-text"></p><button class="vn-next" type="button" aria-label="Continue">▼</button></div>';
  var $ = function (sel) { return root.querySelector(sel); };
  var cards = $(".hk-cards"), count = $(".hk-count"), adminBtn = $(".hk-admin"), vnText = $(".vn-text"), vnNext = $(".vn-next");
  var admin = false, roster = [];

  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
  function sfx(id, vol) { var a = document.getElementById(id).cloneNode(); var m = document.getElementById("audio"); a.volume = vol * (m.muted ? 0 : m.volume); a.play().catch(function () {}); }

  /* ---------- dialogue (same typewriter as the dojos) ---------- */
  var queue = [], typing = null;
  function say(lines) { queue = [].concat(lines); next(); }
  function next() {
    if (typing) { clearInterval(typing); typing = null; vnText.textContent = vnText.dataset.full; vnNext.hidden = queue.length === 0; return; }
    if (!queue.length) { vnNext.hidden = true; return; }
    var line = queue.shift(), i = 0;
    vnText.dataset.full = line; vnText.textContent = ""; vnNext.hidden = true;
    typing = setInterval(function () { vnText.textContent = line.slice(0, ++i); if (i >= line.length) { clearInterval(typing); typing = null; vnNext.hidden = queue.length === 0; } }, 18);
  }
  vnNext.addEventListener("click", next);
  $(".vn").addEventListener("click", function (e) { if (e.target !== vnNext && (typing || queue.length)) next(); });

  /* ---------- cards ---------- */
  function card(p) {
    var pr = R.progress(p), me = S.user && (p.uid === S.user.uid || p.uid === "local");
    var el = document.createElement("article"); el.className = "hk-card" + (me ? " me" : "");
    el.innerHTML =
      '<div class="hk-avatar">' + AV.render(Object.assign({}, AV.DEFAULT, p.avatar || {})) + '</div>' +
      '<div><div class="hk-name"><b>' + esc(p.name || "Unnamed shinobi") + '</b><span>' + esc(p.clan && p.clan !== "No clan" ? p.clan + " clan" : "No clan") + (me ? " · you" : "") + '</span></div>' +
      '<div class="hk-rank"><span class="rank-badge">' + pr.rank.name + '</span><span class="rank-jp">' + pr.rank.jp + '</span>' + (pr.pinned ? '<span class="hk-pinned">set by the Hokage</span>' : "") +
        '<span class="hk-status">' + pr.solved + ' / ' + pr.total + ' solved' + (pr.next ? ' · ' + pr.need + ' to ' + pr.next.name : "") + '</span></div>' +
      '<div class="hk-bar"><i style="--v:' + pct(pr.solved, pr.total) + '%"></i></div>' +
      '<div class="hk-areas">' + pr.areas.map(function (a) { return '<span><b>' + a.kanji + '</b> ' + esc(a.title) + ' ' + a.solved + '/' + a.total + '</span>'; }).join("") + '</div></div>';
    if (admin) el.appendChild(editor(p, pr));
    return el;
  }

  /* ---------- admin editor ---------- */
  function editor(p, pr) {
    var box = document.createElement("div"); box.className = "hk-edit";
    var status = document.createElement("span"); status.className = "hk-status";
    function busy(promise, label) {
      status.textContent = label + "…";
      return promise.then(function () { status.textContent = "Saved."; return reload(); }, function (e) { status.textContent = S.describe(e); });
    }
    // rank pin
    var row = document.createElement("div"); row.className = "hk-row";
    row.innerHTML = '<label>Rank</label>';
    var sel = document.createElement("select");
    sel.innerHTML = '<option value="">Earned (automatic)</option>' + R.TIERS.map(function (t) { return '<option value="' + t.name + '"' + (p.rankOverride === t.name ? " selected" : "") + '>' + t.name + ' ' + t.jp + '</option>'; }).join("");
    sel.addEventListener("change", function () { busy(S.adminSetRank(p.uid, sel.value || null), "Setting rank"); });
    row.appendChild(sel); row.appendChild(status); box.appendChild(row);
    // per area, per rank
    R.AREAS.forEach(function (a) {
      var done = p[a.id] || {};
      a.lessons().forEach(function (rank) {
        var ids = []; rank.topics.forEach(function (t) { t.problems.forEach(function (q) { ids.push(q); }); });
        var n = ids.filter(function (q) { return done[q.id]; }).length;
        var r = document.createElement("div"); r.className = "hk-rankrow";
        r.innerHTML = '<span><b>' + a.kanji + ' ' + rank.rank + '</b> ' + esc(rank.title) + '</span><span class="hk-status">' + n + ' / ' + ids.length + '</span>';
        var grant = document.createElement("button"); grant.type = "button"; grant.className = "hk-mini"; grant.textContent = "Grant all";
        var clear = document.createElement("button"); clear.type = "button"; clear.className = "hk-mini"; clear.textContent = "Clear";
        var each = document.createElement("button"); each.type = "button"; each.className = "hk-mini"; each.textContent = "Problems…";
        grant.addEventListener("click", function () { busy(S.adminSetProblems(p.uid, a.id, ids.map(function (q) { return q.id; }), true), "Granting " + rank.title); });
        clear.addEventListener("click", function () { busy(S.adminSetProblems(p.uid, a.id, ids.map(function (q) { return q.id; }), false), "Clearing " + rank.title); });
        var list = document.createElement("div"); list.className = "hk-problems"; list.hidden = true;
        ids.forEach(function (q) {
          var b = document.createElement("button"); b.type = "button"; b.className = "hk-p" + (done[q.id] ? " on" : ""); b.textContent = q.title; b.title = q.id;
          b.addEventListener("click", function () { busy(S.adminSetProblems(p.uid, a.id, [q.id], !done[q.id]), (done[q.id] ? "Removing " : "Granting ") + q.title); });
          list.appendChild(b);
        });
        each.addEventListener("click", function () { list.hidden = !list.hidden; });
        r.appendChild(grant); r.appendChild(clear); r.appendChild(each); r.appendChild(list); box.appendChild(r);
      });
    });
    return box;
  }

  function render() {
    cards.innerHTML = "";
    if (!roster.length) { cards.innerHTML = '<p class="hk-empty">No shinobi on record yet.</p>'; return; }
    var sorted = roster.slice().sort(function (a, b) { return R.progress(b).solved - R.progress(a).solved || String(a.name || "").localeCompare(String(b.name || "")); });
    sorted.forEach(function (p) { cards.appendChild(card(p)); });
    count.textContent = roster.length + (roster.length === 1 ? " shinobi" : " shinobi") + " on record";
  }
  function reload() {
    return S.listShinobi().then(function (list) { roster = list; render(); }, function (e) { cards.innerHTML = '<p class="hk-empty">' + esc(S.describe(e)) + '</p>'; });
  }
  adminBtn.addEventListener("click", function () {
    sfx("sfx-tap", 0.8);
    admin = !admin; adminBtn.setAttribute("aria-pressed", String(admin)); render();
    say(admin ? ["The Hokage's seal is yours. Grant rank or revoke it as you see fit — the records change at once."] : ["Records sealed again."]);
  });

  S.onChange(function () { if (!root.hidden) reload(); });
  window.HokageTower = {
    open: function () {
      root.hidden = false; admin = false; adminBtn.setAttribute("aria-pressed", "false"); adminBtn.hidden = !S.isAdmin();
      cards.innerHTML = '<p class="hk-empty">Fetching the village records…</p>';
      var name = S.profile && S.profile.name ? S.profile.name : "young one";
      say(["Ah, " + name + ". Come in, come in. These are the records of every shinobi training in the village.",
           S.isAdmin() ? "As Hokage, you may amend them. Use the seal wisely." : "Every problem solved is written here. Keep at it, and your rank will follow."]);
      reload();
    },
    close: function () { root.hidden = true; }
  };
})();
