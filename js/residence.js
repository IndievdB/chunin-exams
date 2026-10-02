/* Residence page: rank, name/clan editing, stats, and the character creator.
   Needs window.Shinobi (account.js) and window.Avatar (avatar.js). Opened by menu.js via window.Residence.open(). */
(function () {
  "use strict";
  var S = window.Shinobi, AV = window.Avatar;
  var res = document.getElementById("residence");
  var nameEl = document.getElementById("res-name"), clanEl = document.getElementById("res-clan");
  var avatarEl = document.getElementById("res-avatar");
  var form = document.getElementById("res-form"), nameIn = document.getElementById("res-name-in"), clanIn = document.getElementById("res-clan-in");
  var preview = document.getElementById("creator-preview"), controls = document.getElementById("creator-controls"), status = document.getElementById("creator-status");
  var draft = Object.assign({}, AV.DEFAULT);

  function cfgOf(p) { return Object.assign({}, AV.DEFAULT, (p && p.avatar) || {}); }
  function fill() {
    var p = S.profile || {};
    nameEl.textContent = p.name || "—";
    clanEl.textContent = p.clan && p.clan !== "No clan" ? p.clan + " clan" : "No clan";
    nameIn.value = p.name || ""; clanIn.value = p.clan || "No clan";
    avatarEl.innerHTML = AV.render(cfgOf(p));
  }
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
    open: function () { draft = cfgOf(S.profile); fill(); paint(); status.textContent = ""; res.hidden = false; res.scrollTop = 0; },
    close: function () { res.hidden = true; }
  };
})();
