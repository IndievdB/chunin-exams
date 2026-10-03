/* Residence page: rank, name/clan editing, stats, and the character creator.
   Needs window.Shinobi (account.js) and window.Avatar (avatar.js). Opened by menu.js via window.Residence.open(). */
(function () {
  "use strict";
  var S = window.Shinobi, AV = window.Avatar;
  var res = document.getElementById("residence");
  var wrap = document.getElementById("panel-wrap"), roomMe = document.getElementById("room-me");
  var nameEl = document.getElementById("res-name"), clanEl = document.getElementById("res-clan");
  var avatarEl = document.getElementById("res-avatar");
  var form = document.getElementById("res-form"), nameIn = document.getElementById("res-name-in"), clanIn = document.getElementById("res-clan-in");
  var preview = document.getElementById("creator-preview"), controls = document.getElementById("creator-controls"), status = document.getElementById("creator-status");
  var draft = Object.assign({}, AV.DEFAULT);

  function cfgOf(p) { return Object.assign({}, AV.DEFAULT, (p && p.avatar) || {}); }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
  function fillStats(p) {
    var R = window.Ranks.progress(p);
    document.getElementById("res-rank").textContent = R.rank.name; document.getElementById("res-rank-jp").textContent = R.rank.jp;
    var up = document.getElementById("rank-up");
    up.innerHTML = '<div class="rank-now"><span class="rank-badge">' + R.rank.name + '</span> <span class="rank-jp">' + R.rank.jp + '</span>' +
      '<span class="rank-total">' + R.solved + ' / ' + R.total + ' problems solved</span></div>' +
      (R.next ? '<div class="rank-bar"><i style="--v:' + Math.round(100 * R.toNext) + '%"></i></div><p class="rank-next">' +
        (R.need === 1 ? '1 more problem' : R.need + ' more problems') + ' to <b>' + R.next.name + '</b> <span class="rank-jp">' + R.next.jp + '</span> (' + R.nextAt + ' solved)</p>'
        : '<div class="rank-bar"><i style="--v:100%"></i></div><p class="rank-next">You have reached the top. The village is in your debt.</p>');
    var box = document.getElementById("area-stats"); box.innerHTML = "";
    R.areas.forEach(function (a) {
      var d = document.createElement("div"); d.className = "area" + (a.solved === a.total ? " area-done" : "");
      d.innerHTML = '<div class="area-head"><span class="lesson-k">' + a.kanji + '</span><b>' + esc(a.title) + '</b><span class="area-p">' + a.solved + ' / ' + a.total + ' · ' + pct(a.solved, a.total) + '%</span></div>' +
        '<ul class="stat-list">' + a.ranks.map(function (r) { return '<li><span><b>' + r.rank + '</b> ' + esc(r.title) + '</span><i style="--v:' + pct(r.solved, r.total) + '%"></i><em>' + r.solved + '/' + r.total + '</em></li>'; }).join("") + '</ul>';
      box.appendChild(d);
    });
    var l = document.createElement("div"); l.className = "area area-locked";
    l.innerHTML = R.locked.map(function (a) { return '<span class="locked-pill"><span class="lesson-k">' + a.kanji + '</span>' + esc(a.title) + ' · coming soon</span>'; }).join("");
    box.appendChild(l);
  }
  function fill() {
    var p = S.profile || {};
    fillStats(p);
    nameEl.textContent = p.name || "—";
    clanEl.textContent = p.clan && p.clan !== "No clan" ? p.clan + " clan" : "No clan";
    nameIn.value = p.name || ""; clanIn.value = p.clan || "No clan";
    avatarEl.innerHTML = AV.render(cfgOf(p));
    roomMe.innerHTML = AV.render(cfgOf(p));
  }
  function openPanel(name) {
    wrap.hidden = false;
    wrap.querySelectorAll(".panel").forEach(function (el) { el.hidden = el.dataset.panel !== name; });
    if (name === "look") { draft = cfgOf(S.profile); status.textContent = ""; paint(); }
    var f = wrap.querySelector(".panel:not([hidden]) input, .panel:not([hidden]) button:not(.panel-x)");
    if (f) f.focus();
  }
  function closePanel() { wrap.hidden = true; }
  res.querySelectorAll(".hotspot").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = document.getElementById("sfx-select").cloneNode(); a.volume = 0.8 * (document.getElementById("audio").muted ? 0 : document.getElementById("audio").volume); a.play().catch(function () {});
      openPanel(b.dataset.panel);
    });
  });
  wrap.querySelectorAll(".panel-x").forEach(function (b) { b.addEventListener("click", closePanel); });
  wrap.addEventListener("click", function (e) { if (e.target === wrap) closePanel(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !wrap.hidden) { e.stopPropagation(); closePanel(); } }, true);
  function paint() { preview.innerHTML = AV.render(draft); renderControls(); }

  function renderControls() {
    controls.innerHTML = "";
    Object.keys(AV.OPTIONS).forEach(function (key) {
      var opts = AV.OPTIONS[key];
      var box = document.createElement("div"); box.className = "ctl";
      var lab = document.createElement("div"); lab.className = "ctl-label"; lab.textContent = AV.LABELS[key]; box.appendChild(lab);
      if (opts[0][0] === "#") {               // colour swatches
        var row = document.createElement("div"); row.className = "swatches";
        opts.forEach(function (c, i) {
          var b = document.createElement("button"); b.type = "button"; b.className = "swatch"; b.style.background = c;
          b.setAttribute("aria-label", AV.LABELS[key] + " " + (i + 1)); b.setAttribute("aria-pressed", String(draft[key] === i));
          b.addEventListener("click", function () { draft[key] = i; paint(); });
          row.appendChild(b);
        });
        box.appendChild(row);
      } else {                                 // prev / value / next
        var row2 = document.createElement("div"); row2.className = "ctl-row";
        var prev = document.createElement("button"); prev.type = "button"; prev.textContent = "‹"; prev.setAttribute("aria-label", "Previous " + AV.LABELS[key]);
        var next = document.createElement("button"); next.type = "button"; next.textContent = "›"; next.setAttribute("aria-label", "Next " + AV.LABELS[key]);
        var val = document.createElement("span"); val.className = "ctl-value"; val.textContent = AV.pick(opts, draft[key]);
        prev.addEventListener("click", function () { draft[key] = (draft[key] - 1 + opts.length) % opts.length; paint(); });
        next.addEventListener("click", function () { draft[key] = (draft[key] + 1) % opts.length; paint(); });
        row2.appendChild(prev); row2.appendChild(val); row2.appendChild(next); box.appendChild(row2);
      }
      controls.appendChild(box);
    });
  }

  document.getElementById("creator-random").addEventListener("click", function () { draft = AV.random(); paint(); });
  document.getElementById("creator-save").addEventListener("click", function () {
    status.textContent = "Saving…";
    S.saveAvatar(draft).then(function () { status.textContent = "Look saved."; fill(); })
      .catch(function (e) { status.textContent = S.describe(e); });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = form.querySelector(".login-error");
    var name = nameIn.value.trim().replace(/\s+/g, " ");
    if (name.length < 2) { err.textContent = "A shinobi needs a name of at least two characters."; return; }
    err.textContent = "";
    S.saveProfile(name, clanIn.value || "No clan").then(function () { err.textContent = ""; fill(); })
      .catch(function (x) { err.textContent = S.describe(x); });
  });

  S.onChange(function () { if (!res.hidden) fill(); });
  window.Residence = {
    open: function () { draft = cfgOf(S.profile); fill(); status.textContent = ""; closePanel(); res.hidden = false; res.scrollTop = 0; },
    close: function () { closePanel(); res.hidden = true; }
  };
})();
