/* Academy: visual-novel lesson select + Python sandbox (Pyodide, loaded on demand) + multiple choice.
   Needs window.LESSONS (ranks → topics → problems), window.Shinobi. Opened by menu.js via window.Academy.open(). */
(function () {
  "use strict";
  var S = window.Shinobi, L = window.LESSONS;
  var acad = document.getElementById("academy"), menu = document.getElementById("acad-menu");
  var vnText = document.getElementById("vn-text"), vnNext = document.getElementById("vn-next");
  var wrap = document.getElementById("acad-wrap"), code = document.getElementById("sb-code"), out = document.getElementById("sb-out");
  var status = document.getElementById("sb-status"), runBtn = document.getElementById("sb-run"), submitBtn = document.getElementById("sb-submit");
  var hintBtn = document.getElementById("sb-hint"), hintText = document.getElementById("sb-hinttext");
  var mc = document.getElementById("mc"), sbGrid = document.getElementById("sb-grid"), mcStatus = document.getElementById("mc-status");
  var current = null, openRank = null, openTopic = null, py = null, pyLoading = null;

  var PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/";
  var PYODIDE_LOCAL = new URL("vendor/pyodide/", location.href).href;
  var RANK_NAMES = { D: "D-rank", C: "C-rank", B: "B-rank", A: "A-rank" };

  function sfx(id, vol) { var a = document.getElementById(id).cloneNode(); var m = document.getElementById("audio"); a.volume = vol * (m.muted ? 0 : m.volume); a.play().catch(function () {}); }
  function done(id) { return !!(S.profile && S.profile.academy && S.profile.academy[id]); }
  function allProblems(rank) { var r = []; rank.topics.forEach(function (t) { r = r.concat(t.problems); }); return r; }
  function solved(list) { return list.filter(function (p) { return done(p.id); }).length; }

  /* ---------- Iruka's dialogue: typewriter, queue of lines ---------- */
  var queue = [], typing = null;
  function say(lines) { queue = [].concat(lines); next(); }
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

  /* ---------- menu: rank tabs → topics → problems ---------- */
  function renderMenu() {
    menu.innerHTML = "";
    var tabs = document.createElement("div"); tabs.className = "ranks";
    L.forEach(function (rank) {
      var all = allProblems(rank), n = solved(all);
      var b = document.createElement("button"); b.type = "button";
      b.className = "rank-tab" + (openRank === rank.id ? " open" : "") + (n === all.length ? " rank-done" : "");
      b.innerHTML = "<b>" + rank.rank + "</b><small>" + rank.title.split(" ")[0] + "</small><span class='rank-p'>" + n + "/" + all.length + "</span>";
      b.title = RANK_NAMES[rank.rank] + ": " + rank.title;
      b.addEventListener("click", function () {
        sfx("sfx-hover", 0.9);
        openRank = rank.id; openTopic = rank.topics.length === 1 ? rank.topics[0].id : null;
        renderMenu();
        say([rank.intro, rank.topics.length === 1 ? "Pick a problem." : "Pick a topic."]);
      });
      tabs.appendChild(b);
    });
    menu.appendChild(tabs);
    var rank = L.filter(function (r) { return r.id === openRank; })[0];
    if (!rank) return;
    var title = document.createElement("div"); title.className = "rank-title"; title.textContent = RANK_NAMES[rank.rank] + " · " + rank.title; menu.appendChild(title);
    rank.topics.forEach(function (topic) {
      var n = solved(topic.problems);
      if (rank.topics.length > 1) {
        var b = document.createElement("button"); b.type = "button";
        b.className = "lesson" + (openTopic === topic.id ? " open" : "") + (n === topic.problems.length ? " lesson-done" : "");
        b.innerHTML = '<span class="lesson-k">' + rank.kanji + '</span><span class="lesson-t">' + topic.title + '</span><span class="lesson-p">' + n + "/" + topic.problems.length + "</span>";
        b.addEventListener("click", function () { sfx("sfx-hover", 0.9); openTopic = openTopic === topic.id ? null : topic.id; renderMenu(); });
        menu.appendChild(b);
      }
      if (openTopic === topic.id) {
        var list = document.createElement("div"); list.className = "problems";
        topic.problems.forEach(function (p, i) {
          var pb = document.createElement("button"); pb.type = "button"; pb.className = "problem" + (done(p.id) ? " done" : "");
          pb.innerHTML = "<span>" + (i + 1) + ". " + p.title + "</span>";
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
    document.getElementById("sb-title").textContent = RANK_NAMES[rank.rank] + " · " + p.title;
    var isMC = p.type === "mc" || p.type === "output";
    mc.hidden = !isMC; sbGrid.hidden = isMC;
    document.getElementById("sb-actions").hidden = isMC;
    hintText.hidden = true; hintText.textContent = "";
    if (isMC) {
      document.getElementById("sb-task").textContent = p.type === "output" ? "Read the code and type exactly what it prints." : "Read the code and predict the output.";
      document.getElementById("mc-code").textContent = p.code;
      document.getElementById("mc-q").textContent = p.question;
      var box = document.getElementById("mc-choices"); box.innerHTML = "";
      if (p.type === "output") {
        var ta = document.createElement("textarea"); ta.id = "mc-input"; ta.className = "mc-input"; ta.rows = Math.max(2, p.expected.split("\n").length + 1);
        ta.placeholder = "type the output here, one line per print"; ta.spellcheck = false;
        box.appendChild(ta);
        document.getElementById("mc-explain").hidden = true; mcStatus.textContent = "";
        wrap.hidden = false; say(["Type exactly what this prints, line by line. Spacing and capital letters count."]);
        setTimeout(function () { ta.focus(); }, 50);
        return;
      }
      p.choices.forEach(function (c, i) {
        var lab = document.createElement("label"); lab.className = "mc-choice";
        var r = document.createElement("input"); r.type = "radio"; r.name = "mc"; r.value = i;
        r.addEventListener("change", function () { box.querySelectorAll(".mc-choice").forEach(function (el) { el.classList.remove("sel"); }); lab.classList.add("sel"); });
        lab.appendChild(r); lab.appendChild(document.createTextNode(c));
        box.appendChild(lab);
      });
      document.getElementById("mc-explain").hidden = true; mcStatus.textContent = "";
      wrap.hidden = false;
      say(["What does this print? Work it out line by line before you answer."]);
      return;
    }
    document.getElementById("sb-task").innerHTML = p.task.replace(/`([^`]+)`/g, "<code>$1</code>");
    code.value = p.starter || ""; out.textContent = ""; status.textContent = "";
    hintBtn.hidden = !p.hint;
    wrap.hidden = false;
    say([p.say]);
    loadPy().then(function () { status.textContent = ""; }, function () { status.textContent = "Couldn't load the Python runtime."; });
    code.focus();
  }
  function closeSandbox() { wrap.hidden = true; }
  wrap.querySelector(".panel-x").addEventListener("click", closeSandbox);
  wrap.addEventListener("click", function (e) { if (e.target === wrap) closeSandbox(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !wrap.hidden) { e.stopPropagation(); closeSandbox(); } }, true);
  document.getElementById("sb-reset").addEventListener("click", function () { code.value = (current && current.starter) || ""; out.textContent = ""; status.textContent = ""; });
  hintBtn.addEventListener("click", function () { if (current && current.hint) { hintText.textContent = "Hint: " + current.hint; hintText.hidden = false; say([current.hint]); } });
  document.getElementById("sb-solution").addEventListener("click", function () {
    if (!current) return;
    code.value = current.solution; out.textContent = ""; status.textContent = "Solution shown — read it, then try to write it yourself.";
    say(["Here's one way to do it. Study it, clear the editor, and write it from memory — that's when it sticks."]);
  });
  code.addEventListener("keydown", function (e) {
    if (e.key === "Tab") { e.preventDefault(); var s = code.selectionStart; code.setRangeText("    ", s, code.selectionEnd, "end"); }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(false); }
  });

  /* ---------- multiple choice ---------- */
  function norm(t) { return t.replace(/\r/g, "").split("\n").map(function (l) { return l.replace(/\s+$/, ""); }).join("\n").trim(); }
  document.getElementById("mc-submit").addEventListener("click", function () {
    if (!current) return;
    if (current.type === "output") {
      var ta = document.getElementById("mc-input"), ex2 = document.getElementById("mc-explain");
      if (!ta.value.trim()) { mcStatus.textContent = "Type the output first."; return; }
      sfx("sfx-tap", 0.8);
      ex2.textContent = current.explain; ex2.hidden = false;
      if (norm(ta.value) === norm(current.expected)) {
        ta.classList.remove("wrong"); ta.classList.add("right"); mcStatus.textContent = "Correct!";
        S.saveAcademy(current.id).then(renderMenu);
        say(["Correct. " + current.explain, "Next one when you're ready."]);
      } else {
        ta.classList.add("wrong"); mcStatus.textContent = "Not quite — it prints:\n" + current.expected;
        say(["Not quite. " + current.explain]);
      }
      return;
    }
    var pick = document.querySelector('input[name="mc"]:checked');
    if (!pick) { mcStatus.textContent = "Pick an answer first."; return; }
    sfx("sfx-tap", 0.8);
    var i = +pick.value, choices = document.querySelectorAll(".mc-choice");
    choices.forEach(function (el, k) { el.classList.remove("right", "wrong"); if (k === current.answer) el.classList.add("right"); });
    var ex = document.getElementById("mc-explain"); ex.textContent = current.explain; ex.hidden = false;
    if (i === current.answer) {
      mcStatus.textContent = "Correct!";
      S.saveAcademy(current.id).then(renderMenu);
      say(["Correct. " + current.explain, "Next one when you're ready."]);
    } else {
      choices[i].classList.add("wrong");
      mcStatus.textContent = "Not quite.";
      say(["Not quite — the answer is highlighted. " + current.explain]);
    }
  });
  document.getElementById("mc-solution").addEventListener("click", function () {
    if (!current) return;
    if (current.type === "output") {
      var ta = document.getElementById("mc-input"); ta.value = current.expected; ta.classList.remove("wrong"); ta.classList.add("right");
      var ex3 = document.getElementById("mc-explain"); ex3.textContent = current.explain; ex3.hidden = false;
      mcStatus.textContent = "Solution shown."; say([current.explain]); return;
    }
    document.querySelectorAll(".mc-choice").forEach(function (el, k) { el.classList.toggle("right", k === current.answer); });
    var ex = document.getElementById("mc-explain"); ex.textContent = current.explain; ex.hidden = false;
    mcStatus.textContent = "Solution shown.";
    say([current.explain]);
  });

  /* ---------- Python runtime ---------- */
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
  function execute(src) {
    var ns = py.globals.get("dict")();
    py.runPython("import sys, io\nsys.stdout = io.StringIO()\nsys.stderr = sys.stdout");
    var error = null;
    try { py.runPython(src, { globals: ns }); }
    catch (e) {
      var lines = String(e.message || e).split("\n"), keep = [], inUser = false;
      lines.forEach(function (l) { if (/File "<exec>"/.test(l)) inUser = true; if (inUser && l.trim() && l.trim() !== "PythonError") keep.push(l.replace(/File "<exec>", /, "")); });
      error = keep.length ? keep.join("\n") : lines.filter(function (l) { return l.trim(); }).slice(-2, -1)[0];
    }
    var text = py.runPython("sys.stdout.getvalue()");
    py.runPython("sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__");
    return { out: text, error: error, ns: ns };
  }
  function run(submit) {
    if (!current || current.type === "mc" || current.type === "output") return;
    sfx("sfx-tap", 0.8);
    if (!code.value.trim()) { status.textContent = "Write some code first."; return; }
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
        say([current.type === "bug" ? "Bug squashed. Good eye." : "Excellent! That's exactly it.", "Choose another problem when you're ready."]);
      } catch (e) {
        var msg = String(e.message || e); var m = msg.match(/AssertionError: (.*)$/m);
        var nm = msg.match(/NameError: name '([^']+)' is not defined/), at = msg.match(/AttributeError: (.*)$/m);
        var reason = m ? m[1] : nm ? "The checker couldn't find `" + nm[1] + "` — define it with exactly that name." : at ? at[1] : (msg.split("\n").filter(function (l) { return l.trim() && l.trim() !== "PythonError"; }).slice(-1)[0] || "Check the output and try again.");
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
      acad.hidden = false; openRank = null; openTopic = null; renderMenu(); closeSandbox();
      var name = S.profile && S.profile.name ? S.profile.name : "shinobi";
      say(["Welcome to the Academy, " + name + ".", "Four ranks of training, D through A. Start with D-rank history if you're new, or jump to where you are."]);
    },
    close: function () { closeSandbox(); acad.hidden = true; }
  };
})();
