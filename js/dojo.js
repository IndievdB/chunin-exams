/* Dojo: a visual-novel lesson screen (teacher sprite, lesson menu, dialogue box) with a Python
   sandbox (Pyodide, loaded on demand) and multiple-choice / type-the-output panels.
   The Academy and the Training Grounds are both instances: window.Dojo(config) returns { open, close }.
   config: { id, title, kicker, bg, sprite, teacher, lessons, field (profile key), welcome(name) -> lines } */
(function () {
  "use strict";
  var PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/";
  var PYODIDE_LOCAL = new URL("vendor/pyodide/", location.href).href;
  var py = null, pyLoading = null;
  var RANK_NAMES = { D: "D-rank", C: "C-rank", B: "B-rank", A: "A-rank" };

  function sting() { if (window.playSting) window.playSting(); }
  function unsting() { if (window.stopSting) window.stopSting(); }
  function sfx(id, vol) { var a = document.getElementById(id).cloneNode(); var m = document.getElementById("audio"); a.volume = vol * (m.muted ? 0 : m.volume); a.play().catch(function () {}); }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function loadPy(status) {
    if (py) return Promise.resolve(py);
    if (pyLoading) return pyLoading;
    status.textContent = "Loading Python…";
    pyLoading = new Promise(function (resolve, reject) {
      function attempt(base, fallback) {
        var s = document.createElement("script"); s.src = base + "pyodide.js";
        s.onload = function () { window.loadPyodide({ indexURL: base }).then(function (p) { py = p; resolve(py); }, function (e) { fallback ? attempt(fallback, null) : reject(e); }); };
        s.onerror = function () { fallback ? attempt(fallback, null) : reject(new Error("pyodide script failed")); };
        document.head.appendChild(s);
      }
      attempt(PYODIDE_CDN, PYODIDE_LOCAL);
    });
    return pyLoading;
  }
  // Runs prelude (hidden helpers) then the student's code in a fresh namespace.
  function execute(prelude, src) {
    var ns = py.globals.get("dict")();
    py.runPython("import sys, io\nsys.stdout = io.StringIO()\nsys.stderr = sys.stdout");
    var error = null;
    try {
      if (prelude) py.runPython(prelude, { globals: ns });
      py.runPython(src, { globals: ns });
    } catch (e) {
      var lines = String(e.message || e).split("\n"), keep = [], inUser = false;
      lines.forEach(function (l) { if (/File "<exec>"/.test(l)) inUser = true; if (inUser && l.trim() && l.trim() !== "PythonError") keep.push(l.replace(/File "<exec>", /, "")); });
      error = keep.length ? keep.join("\n") : lines.filter(function (l) { return l.trim(); }).slice(-2, -1)[0];
    }
    var text = py.runPython("sys.stdout.getvalue()");
    py.runPython("sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__");
    return { out: text, error: error, ns: ns };
  }
  function failReason(e) {
    var msg = String(e.message || e); var m = msg.match(/AssertionError: (.*)$/m);
    var nm = msg.match(/NameError: name '([^']+)' is not defined/), at = msg.match(/AttributeError: (.*)$/m);
    return m ? m[1] : nm ? "The checker couldn't find `" + nm[1] + "` — define it with exactly that name." : at ? at[1] : (msg.split("\n").filter(function (l) { return l.trim() && l.trim() !== "PythonError"; }).slice(-1)[0] || "Check the output and try again.");
  }

  var TEMPLATE = function (c) { return '' +
    '<div class="acad-bg" aria-hidden="true" style="background-image:url(' + c.bg + ')"></div>' +
    '<header class="res-head acad-head"><div><p class="kicker">' + c.kicker + '</p><h2 class="res-h">' + c.title + '</h2></div>' +
    '<a class="go res-back acad-back" href="#"><i aria-hidden="true">火</i>Back to the village</a></header>' +
    '<div class="acad-body"><img class="iruka sprite" src="' + c.sprite + '" alt=""><nav class="acad-menu menu-box" aria-label="Lessons"></nav></div>' +
    '<div class="vn"><div class="vn-name">' + c.teacher + '</div><p class="vn-text"></p><button class="vn-next" type="button" aria-label="Continue">▼</button></div>' +
    '<div class="panel-wrap acad-wrap" hidden><article class="res-card panel sandbox">' +
      '<button class="panel-x" type="button" aria-label="Close">✕</button>' +
      '<h3 class="sb-title">Problem</h3><p class="sb-task"></p><div class="sb-examples" hidden></div><div class="sb-provided" hidden><div class="sb-label">Provided for you (already defined)</div><pre></pre></div>' +
      '<div class="mc" hidden><pre class="mc-code"></pre><p class="mc-q"></p><div class="mc-choices"></div><p class="mc-explain" hidden></p>' +
        '<div class="creator-actions"><button class="go mc-submit" type="button"><i aria-hidden="true">火</i>Submit</button><button class="btn-ghost mc-solution" type="button">Show solution</button><span class="res-saved mc-status" aria-live="polite"></span></div></div>' +
      '<div class="sb-grid"><div class="sb-editor"><div class="sb-label">main.py</div><textarea class="sb-code" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea></div>' +
        '<div class="sb-output"><div class="sb-label">Output</div><pre class="sb-out"></pre></div></div>' +
      '<div class="creator-actions sb-actions"><button class="btn-ghost sb-run" type="button">▶ Run</button><button class="go sb-submit" type="button"><i aria-hidden="true">火</i>Submit</button>' +
        '<button class="btn-ghost sb-hint" type="button" hidden>Hint</button><button class="btn-ghost sb-solution" type="button">Show solution</button><button class="btn-ghost sb-reset" type="button">Clear</button><span class="res-saved sb-status" aria-live="polite"></span></div>' +
      '<p class="sb-hinttext" hidden></p></article></div>'; };

  window.Dojo = function (c) {
    var S = window.Shinobi, L = c.lessons;
    var root = document.getElementById(c.id); root.innerHTML = TEMPLATE(c);
    var $ = function (sel) { return root.querySelector(sel); };
    var menu = $(".menu-box"), vnText = $(".vn-text"), vnNext = $(".vn-next");
    var wrap = $(".acad-wrap"), code = $(".sb-code"), out = $(".sb-out"), status = $(".sb-status");
    var hintBtn = $(".sb-hint"), hintText = $(".sb-hinttext"), mc = $(".mc"), sbGrid = $(".sb-grid"), mcStatus = $(".mc-status");
    var current = null, openRank = null, openTopic = null;

    function done(id) { return !!(S.profile && S.profile[c.field] && S.profile[c.field][id]); }
    function save(id) { return S.saveProgress(c.field, id); }
    function allProblems(rank) { var r = []; rank.topics.forEach(function (t) { r = r.concat(t.problems); }); return r; }
    function solved(list) { return list.filter(function (p) { return done(p.id); }).length; }

    /* ---------- dialogue ---------- */
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

    /* ---------- menu ---------- */
    function renderMenu() {
      menu.innerHTML = "";
      var tabs = document.createElement("div"); tabs.className = "ranks";
      L.forEach(function (rank) {
        var all = allProblems(rank), n = solved(all);
        var b = document.createElement("button"); b.type = "button";
        b.className = "rank-tab" + (openRank === rank.id ? " open" : "") + (n === all.length ? " rank-done" : "");
        b.innerHTML = "<b>" + rank.rank + "</b><small>" + esc(rank.short || rank.title) + "</small><span class='rank-p'>" + n + "/" + all.length + "</span>";
        b.title = RANK_NAMES[rank.rank] + ": " + rank.title;
        b.addEventListener("click", function () {
          sfx("sfx-hover", 0.9);
          openRank = rank.id; openTopic = rank.topics.length === 1 ? rank.topics[0].id : null;
          renderMenu(); say([rank.intro, rank.topics.length === 1 ? "Pick a problem." : "Pick a topic."]);
        });
        tabs.appendChild(b);
      });
      menu.appendChild(tabs);
      var rank = L.filter(function (r) { return r.id === openRank; })[0];
      if (!rank) return;
      var title = document.createElement("div"); title.className = "rank-title"; title.textContent = RANK_NAMES[rank.rank] + " · " + rank.title; menu.appendChild(title);
      rank.topics.forEach(function (topic) {
        var n = solved(topic.problems);
        var b = document.createElement("button"); b.type = "button";
        b.className = "lesson" + (openTopic === topic.id ? " open" : "") + (n === topic.problems.length ? " lesson-done" : "");
        b.innerHTML = '<span class="lesson-k">' + (topic.kanji || rank.kanji) + '</span><span class="lesson-t">' + esc(topic.title) + '</span><span class="lesson-p">' + n + "/" + topic.problems.length + "</span>";
        b.addEventListener("click", function () { sfx("sfx-hover", 0.9); openTopic = openTopic === topic.id ? null : topic.id; renderMenu(); if (openTopic && topic.intro) say([topic.intro]); });
        menu.appendChild(b);
        if (openTopic === topic.id) {
          var list = document.createElement("div"); list.className = "problems";
          topic.problems.forEach(function (p, i) {
            var pb = document.createElement("button"); pb.type = "button"; pb.className = "problem" + (done(p.id) ? " done" : "");
            pb.innerHTML = "<span>" + (i + 1) + ". " + esc(p.title) + "</span>";
            pb.addEventListener("click", function () { sfx("sfx-tap", 0.8); openProblem(rank, topic, p); });
            list.appendChild(pb);
          });
          menu.appendChild(list);
        }
      });
    }

    /* ---------- problem panel ---------- */
    function openProblem(rank, topic, p) {
      current = p;
      $(".sb-title").textContent = RANK_NAMES[rank.rank] + " · " + p.title;
      var isMC = p.type === "mc" || p.type === "output";
      mc.hidden = !isMC; sbGrid.hidden = isMC; $(".sb-actions").hidden = isMC;
      hintText.hidden = true; hintText.textContent = "";
      var ex = $(".sb-examples"); ex.innerHTML = ""; ex.hidden = true;
      var prov = $(".sb-provided"); prov.hidden = !p.prelude; if (p.prelude) prov.querySelector("pre").textContent = p.prelude.trim();
      if (isMC) {
        $(".sb-task").textContent = p.type === "output" ? "Read the code and type exactly what it prints." : "Read the code and predict the output.";
        $(".mc-code").textContent = p.code; $(".mc-q").textContent = p.question;
        var box = $(".mc-choices"); box.innerHTML = "";
        $(".mc-explain").hidden = true; mcStatus.textContent = "";
        if (p.type === "output") {
          var ta = document.createElement("textarea"); ta.className = "mc-input"; ta.rows = Math.max(2, p.expected.split("\n").length + 1);
          ta.placeholder = "type the output here, one line per print"; ta.spellcheck = false; box.appendChild(ta);
          wrap.hidden = false; say(["Type exactly what this prints, line by line. Spacing and capital letters count."]);
          setTimeout(function () { ta.focus(); }, 50); return;
        }
        p.choices.forEach(function (ch, i) {
          var lab = document.createElement("label"); lab.className = "mc-choice";
          var r = document.createElement("input"); r.type = "radio"; r.name = c.id + "-mc"; r.value = i;
          r.addEventListener("change", function () { box.querySelectorAll(".mc-choice").forEach(function (el) { el.classList.remove("sel"); }); lab.classList.add("sel"); });
          lab.appendChild(r); lab.appendChild(document.createTextNode(ch)); box.appendChild(lab);
        });
        wrap.hidden = false; say(["What does this print? Work it out line by line before you answer."]); return;
      }
      $(".sb-task").innerHTML = esc(p.task).replace(/`([^`]+)`/g, "<code>$1</code>");
      ex.hidden = !(p.examples && p.examples.length);
      (p.examples || []).forEach(function (e) { var pre = document.createElement("pre"); pre.textContent = e; ex.appendChild(pre); });
      code.value = p.starter || ""; out.textContent = ""; status.textContent = "";
      hintBtn.hidden = !p.hint;
      wrap.hidden = false; say([p.say]);
      loadPy(status).then(function () { status.textContent = ""; }, function () { status.textContent = "Couldn't load the Python runtime."; });
      code.focus();
    }
    function closeSandbox() { wrap.hidden = true; }
    $(".panel-x").addEventListener("click", closeSandbox);
    wrap.addEventListener("click", function (e) { if (e.target === wrap) closeSandbox(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !wrap.hidden) { e.stopPropagation(); closeSandbox(); } }, true);
    $(".sb-reset").addEventListener("click", function () { code.value = (current && current.starter) || ""; out.textContent = ""; status.textContent = ""; });
    hintBtn.addEventListener("click", function () { if (current && current.hint) { hintText.textContent = "Hint: " + current.hint; hintText.hidden = false; say([current.hint]); } });
    $(".sb-solution").addEventListener("click", function () {
      if (!current) return;
      code.value = current.solution; out.textContent = ""; status.textContent = "Solution shown — read it, then try to write it yourself.";
      say(["Here's one way to do it. Study it, clear the editor, and write it from memory — that's when it sticks."]);
    });
    code.addEventListener("keydown", function (e) {
      if (e.key === "Tab") { e.preventDefault(); var s = code.selectionStart; code.setRangeText("    ", s, code.selectionEnd, "end"); }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(false); }
    });

    /* ---------- multiple choice / output ---------- */
    function norm(t) { return t.replace(/\r/g, "").split("\n").map(function (l) { return l.replace(/\s+$/, ""); }).join("\n").trim(); }
    $(".mc-submit").addEventListener("click", function () {
      if (!current) return;
      var ex2 = $(".mc-explain");
      if (current.type === "output") {
        var ta = $(".mc-input");
        if (!ta.value.trim()) { mcStatus.textContent = "Type the output first."; return; }
        sfx("sfx-tap", 0.8); ex2.textContent = current.explain; ex2.hidden = false;
        if (norm(ta.value) === norm(current.expected)) { ta.classList.remove("wrong"); ta.classList.add("right"); mcStatus.textContent = "Correct!"; unsting(); save(current.id).then(renderMenu); say(["Correct. " + current.explain, "Next one when you're ready."]); }
        else { sting(); ta.classList.add("wrong"); mcStatus.textContent = "Not quite — it prints:\n" + current.expected; say(["Not quite. " + current.explain]); }
        return;
      }
      var pick = root.querySelector('input[name="' + c.id + '-mc"]:checked');
      if (!pick) { mcStatus.textContent = "Pick an answer first."; return; }
      sfx("sfx-tap", 0.8);
      var i = +pick.value, choices = root.querySelectorAll(".mc-choice");
      choices.forEach(function (el, k) { el.classList.remove("right", "wrong"); if (k === current.answer) el.classList.add("right"); });
      ex2.textContent = current.explain; ex2.hidden = false;
      if (i === current.answer) { mcStatus.textContent = "Correct!"; unsting(); save(current.id).then(renderMenu); say(["Correct. " + current.explain, "Next one when you're ready."]); }
      else { sting(); choices[i].classList.add("wrong"); mcStatus.textContent = "Not quite."; say(["Not quite — the answer is highlighted. " + current.explain]); }
    });
    $(".mc-solution").addEventListener("click", function () {
      if (!current) return;
      var ex3 = $(".mc-explain"); ex3.textContent = current.explain; ex3.hidden = false; mcStatus.textContent = "Solution shown."; say([current.explain]);
      if (current.type === "output") { var ta = $(".mc-input"); ta.value = current.expected; ta.classList.remove("wrong"); ta.classList.add("right"); return; }
      root.querySelectorAll(".mc-choice").forEach(function (el, k) { el.classList.toggle("right", k === current.answer); });
    });

    /* ---------- run / submit ---------- */
    function run(submit) {
      if (!current || current.type === "mc" || current.type === "output") return;
      sfx("sfx-tap", 0.8);
      if (!code.value.trim()) { status.textContent = "Write some code first."; return; }
      status.textContent = "Running…"; out.textContent = "";
      loadPy(status).then(function () {
        var r = execute(current.prelude, code.value);
        out.textContent = r.out;
        if (r.error) { var e = document.createElement("div"); e.className = "err"; e.textContent = r.error; out.appendChild(e); }
        if (!submit) { status.textContent = r.error ? "Error" : "Ran OK"; return; }
        if (r.error) { sting(); status.textContent = "Fix the error first."; say(["There's an error in your jutsu. Read the message, fix it, and try again."]); return; }
        r.ns.set("_out", r.out); r.ns.set("_src", code.value);
        var verdict = document.createElement("div");
        try {
          py.runPython(current.check, { globals: r.ns });
          verdict.className = "ok"; verdict.textContent = "✓ PASS"; status.textContent = "Passed!";
          unsting(); save(current.id).then(renderMenu);
          say([c.praise || "Excellent! That's exactly it.", "Choose another problem when you're ready."]);
        } catch (e) {
          var reason = failReason(e);
          sting();
          verdict.className = "fail"; verdict.textContent = "✗ FAIL — " + reason; status.textContent = "Not yet.";
          say(["Not quite. " + reason]);
        }
        out.appendChild(verdict);
      }, function () { status.textContent = "Python runtime unavailable."; });
    }
    $(".sb-run").addEventListener("click", function () { run(false); });
    $(".sb-submit").addEventListener("click", function () { run(true); });

    S.onChange(function () { if (!root.hidden) renderMenu(); });
    return {
      open: function () {
        root.hidden = false; openRank = null; openTopic = null; renderMenu(); closeSandbox();
        say(c.welcome(S.profile && S.profile.name ? S.profile.name : "shinobi"));
      },
      close: function () { closeSandbox(); root.hidden = true; }
    };
  };
})();
