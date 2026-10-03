/* Missions: Kakashi's briefing at the Valley of the End. Teaches building small, real Python
   servers (FastAPI + SQLite). Admin-only while the curriculum is being written; everyone else
   gets the Under Construction overlay from menu.js. window.Missions = { open, close }. */
(function () {
  "use strict";
  var S = window.Shinobi;
  var root = document.getElementById("missions");
  var BOARD = [
    { rank: "D", title: "Hello, server",       blurb: "Your first FastAPI app: one route that answers a request." },
    { rank: "D", title: "Paths and queries",   blurb: "Routes with parameters, query strings and JSON replies." },
    { rank: "D", title: "Request bodies",      blurb: "Accept JSON with a Pydantic model and validate it." },
    { rank: "C", title: "The scroll vault",    blurb: "SQLite: create a table, insert, select." },
    { rank: "C", title: "Create and read",     blurb: "POST that stores a row, GET that lists them." },
    { rank: "C", title: "Update and delete",   blurb: "PUT and DELETE by id, with 404s done right." },
    { rank: "B", title: "A full CRUD service", blurb: "Design the resource, then build all four operations from scratch." },
    { rank: "A", title: "Ship it",             blurb: "Error handling, pagination, and running it for real with uvicorn." }
  ];
  root.innerHTML =
    '<div class="acad-bg" aria-hidden="true" style="background-image:url(assets/images/locations/missions.jpg)"></div>' +
    '<header class="res-head acad-head"><div><p class="kicker">任務</p><h2 class="res-h">Missions</h2></div>' +
    '<a class="go res-back acad-back" href="#"><i aria-hidden="true">火</i>Back to the village</a></header>' +
    '<div class="acad-body"><img class="iruka sprite" src="assets/images/characters/kakashi.png" alt="">' +
      '<nav class="acad-menu menu-box" aria-label="Mission board"><div class="rank-title">Mission board · in preparation</div>' +
      BOARD.map(function (m) { return '<div class="lesson ms-locked"><span class="lesson-k">' + m.rank + '</span><span class="lesson-t">' + m.title + '<small>' + m.blurb + '</small></span><span class="lesson-p">soon</span></div>'; }).join("") +
      '</nav></div>' +
    '<div class="vn"><div class="vn-name">Kakashi Hatake</div><p class="vn-text"></p><button class="vn-next" type="button" aria-label="Continue">▼</button></div>';
  var vnText = root.querySelector(".vn-text"), vnNext = root.querySelector(".vn-next");
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
  root.querySelector(".vn").addEventListener("click", function (e) { if (e.target !== vnNext && (typing || queue.length)) next(); });

  window.Missions = {
    open: function () {
      root.hidden = false;
      var name = S.profile && S.profile.name ? S.profile.name : "shinobi";
      say(["Yo, " + name + ". Sorry I'm late — a black cat crossed my path.",
           "Missions are where you build real things: small Python servers that store and serve data, the kind that run behind actual apps.",
           "The board is still being written up. Come back soon."]);
    },
    close: function () { root.hidden = true; }
  };
})();
