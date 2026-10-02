/* Academy: visual-novel lesson select + Python sandbox (Pyodide, loaded on demand).
   Needs window.LESSONS, window.Shinobi. Opened by menu.js via window.Academy.open(). */
(function () {
  "use strict";
  var S = window.Shinobi, L = window.LESSONS;
  var acad = document.getElementById("academy"), menu = document.getElementById("acad-menu");
  var vnText = document.getElementById("vn-text"), vnNext = document.getElementById("vn-next");
  var wrap = document.getElementById("acad-wrap"), code = document.getElementById("sb-code"), out = document.getElementById("sb-out");
  var status = document.getElementById("sb-status"), runBtn = document.getElementById("sb-run"), submitBtn = document.getElementById("sb-submit");
  var current = null, openTopic = null, py = null, pyLoading = null;

  var PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/";
  var PYODIDE_LOCAL = new URL("vendor/pyodide/", location.href).href;

  function sfx(id, vol) { var a = document.getElementById(id).cloneNode(); var m = document.getElementById("audio"); a.volume = vol * (m.muted ? 0 : m.volume); a.play().catch(function () {}); }
  function done(id) { return !!(S.profile && S.profile.academy && S.profile.academy[id]); }

  /* ---------- Iruka's dialogue: typewriter, queue of lines ---------- */
  var queue = [], typing = null;
  function say(lines) {
    queue = [].concat(lines); next();
  }
  function next() {
    if (typing) { clearInterval(typing); typing = null; vnText.textContent = vnText.dataset.full; vnNext.hidden = queue.length === 0; return; }
    if (!queue.length) { vnNext.hidden = true; return; }
    var line = queue.shift(), i = 0;
    vnText.dataset.full = line; vnText.textContent = ""; vnNext.hidden = true;
    typing = setInterval(function () {
      vnText.textContent = line.slice(0, ++i);
      if (i >= line.length) { clearInterval(typing); typing = null; vnNext.hidden = queue.length === 0; }
    }, 18);
  }
  vnNext.addEventListener("click", next);
  document.getElementById("vn").addEventListener("click", function (e) { if (e.target !== vnNext && (typing || queue.length)) next(); });

  /* ---------- lesson menu ---------- */
  function renderMenu() {
    menu.innerHTML = "";
    L.forEach(function (topic) {
      var solved = topic.problems.filter(function (p) { return done(p.id); }).length;
      var b = document.createElement("button"); b.type = "button"; b.className = "lesson" + (openTopic === topic.id ? " open" : "") + (solved === topic.problems.length ? " lesson-done" : "");
      b.innerHTML = '<span class="lesson-k">' + topic.kanji + '</span><span class="lesson-t">' + topic.title + '</span><span class="lesson-p">' + solved + "/" + topic.problems.length + "</span>";
      b.addEventListener("click", function () {
        sfx("sfx-hover", 0.9);
        openTopic = openTopic === topic.id ? null : topic.id;
        renderMenu();
        if (openTopic) say([topic.intro, "Pick a problem from the list."]);
      });
      menu.appendChild(b);
      if (openTopic === topic.id) {
        var list = document.createElement("div"); list.className = "problems";
        topic.problems.forEach(function (p, i) {
          var pb = document.createElement("button"); pb.type = "button"; pb.className = "problem" + (done(p.id) ? " done" : "");
          pb.innerHTML = "<span>" + (i + 1) + ". " + p.title + "</span>";
          pb.addEventListener("click", function () { sfx("sfx-select", 0.8); openProblem(topic, p); });
          list.appendChild(pb);
        });
        menu.appendChild(list);
      }
    });
  }

  /* ---------- sandbox ---------- */
  function openProblem(topic, p) {
    current = p;
    document.getElementById("sb-title").textContent = topic.title + " · " + p.title;
    document.getElementById("sb-task").innerHTML = p.task.replace(/`([^`]+)`/g, "<code>$1</code>");
    code.value = p.starter; out.textContent = ""; status.textContent = "";
    wrap.hidden = false;
    say([p.say]);
    loadPy().then(function () { status.textContent = ""; }, function () { status.textContent = "Couldn't load the Python runtime."; });
    code.focus();
  }
  function closeSandbox() { wrap.hidden = true; }
  wrap.querySelector(".panel-x").addEventListener("click", closeSandbox);
  wrap.addEventListener("click", function (e) { if (e.target === wrap) closeSandbox(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !wrap.hidden) { e.stopPropagation(); closeSandbox(); } }, true);
  document.getElementById("sb-reset").addEventListener("click", function () { if (current) { code.value = current.starter; out.textContent = ""; } });
  code.addEventListener("keydown", function (e) {           // Tab inserts 4 spaces; Ctrl/Cmd+Enter runs
    if (e.key === "Tab") { e.preventDefault(); var s = code.selectionStart; code.setRangeText("    ", s, code.selectionEnd, "end"); }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(false); }
  });

  function loadPy() {
    if (py) return Promise.resolve(py);
    if (pyLoading) return pyLoading;
    status.textContent = "Loading Python…";
    pyLoading = new Promise(function (resolve, reject) {
      function attempt(base, fallback) {
        var s = document.createElement("script"); s.src = base + "pyodide.js";
        s.onload = function () {
          window.loadPyodide({ indexURL: base }).then(function (p) { py = p; resolve(py); }, function (e) { fallback ? attempt(fallback, null) : reject(e); });
        };
        s.onerror = function () { fallback ? attempt(fallback, null) : reject(new Error("pyodide script failed")); };
        document.head.appendChild(s);
      }
      attempt(PYODIDE_CDN, PYODIDE_LOCAL);
    });
    return pyLoading;
  }

  // Runs the student's code in a fresh namespace; returns { out, error, ns }
  function execute(src) {
    var ns = py.globals.get("dict")();
    py.runPython("import sys, io\nsys.stdout = io.StringIO()\nsys.stderr = sys.stdout");
    var error = null;
    try { py.runPython(src, { globals: ns }); }
    catch (e) {
      // keep only the student's part of the traceback
      var lines = String(e.message || e).split("\n"), keep = [], inUser = false;
      lines.forEach(function (l) { if (/File "<exec>"/.test(l)) inUser = true; if (inUser && l.trim() && l.trim() !== "PythonError") keep.push(l.replace(/File "<exec>", /, "")); });
      error = keep.length ? keep.join("\n") : lines.filter(function (l) { return l.trim(); }).slice(-2, -1)[0];
    }
    var text = py.runPython("sys.stdout.getvalue()");
    py.runPython("sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__");
    return { out: text, error: error, ns: ns };
  }
  function run(submit) {
    if (!current) return;
    sfx("sfx-tap", 0.8);
    status.textContent = "Running…"; out.textContent = "";
    loadPy().then(function () {
      var r = execute(code.value);
      out.textContent = r.out;
      if (r.error) { var e = document.createElement("div"); e.className = "err"; e.textContent = r.error; out.appendChild(e); }
      if (!submit) { status.textContent = r.error ? "Error" : "Ran OK"; return; }
      if (r.error) { status.textContent = "Fix the error first."; say(["There's an error in your jutsu. Read the message, fix it, and try again."]); return; }
      r.ns.set("_out", r.out); r.ns.set("_src", code.value);
      var verdict = document.createElement("div");
      try {
        py.runPython(current.check, { globals: r.ns });
        verdict.className = "ok"; verdict.textContent = "✓ PASS"; status.textContent = "Passed!";
        S.saveAcademy(current.id).then(renderMenu);
        say(["Excellent! That's exactly it.", "Choose another problem when you're ready."]);
      } catch (e) {
        var msg = String(e.message || e); var m = msg.match(/AssertionError: (.*)$/m);
        var reason = m ? m[1] : (msg.split("\n").filter(function (l) { return l.trim() && l.trim() !== "PythonError"; }).slice(-1)[0] || "Check the output and try again.");
        verdict.className = "fail"; verdict.textContent = "✗ FAIL — " + reason;
        status.textContent = "Not yet.";
        say(["Not quite. " + reason]);
      }
      out.appendChild(verdict);
    }, function () { status.textContent = "Python runtime unavailable."; });
  }
  runBtn.addEventListener("click", function () { run(false); });
  submitBtn.addEventListener("click", function () { run(true); });

  S.onChange(function () { if (!acad.hidden) renderMenu(); });
  window.Academy = {
    open: function () {
      acad.hidden = false; openTopic = null; renderMenu(); closeSandbox();
      var name = S.profile && S.profile.name ? S.profile.name : "shinobi";
      say(["Welcome to the Academy, " + name + ".", "Here you'll drill the fundamentals until they're reflex. Pick a lesson on the right."]);
    },
    close: function () { closeSandbox(); acad.hidden = true; }
  };
})();
