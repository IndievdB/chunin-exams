/* Ask Sensei: a chat drawer inside a dojo problem panel. Pick a teacher, ask about the problem
   or your code, and the answer comes back in that teacher's voice via the server in server/sensei.js.
   Chats are saved per problem (profile subcollection + this browser) so you can come back to them.
   window.Sensei.mount(container, { key() -> "field:id", context() -> {problem, code, output}, user() -> name })
     -> { open(), close(), toggle(), load() } */
(function () {
  "use strict";
  var TEACHERS = [
    { id: "kakashi",    name: "Kakashi",    kanji: "写", blurb: "Lazy, sharp, late." },
    { id: "jiraiya",    name: "Jiraiya",    kanji: "蝦", blurb: "Loud Toad Sage." },
    { id: "itachi",     name: "Itachi",     kanji: "鴉", blurb: "Few words. All of them count." },
    { id: "ebisu",      name: "Ebisu",      kanji: "眼", blurb: "ELITE instructor." },
    { id: "konohamaru", name: "Konohamaru", kanji: "猿", blurb: "Future Hokage, kore!" },
    { id: "orochimaru", name: "Orochimaru", kanji: "蛇", blurb: "Kukuku… fascinating." }
  ];
  var MAX_SAVED = 40;
  function url() {
    if (window.SENSEI_URL) return window.SENSEI_URL.replace(/\/+$/, "") + "/sensei";
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return "http://localhost:8787/sensei";
    return null;
  }
  // Wake a sleeping (free-tier) server as soon as a dojo opens, so it's up by the first question.
  var warmed = 0;
  function warm() {
    var u = url(); if (!u || Date.now() - warmed < 5 * 60 * 1000) return;
    warmed = Date.now();
    fetch(u.replace(/\/sensei$/, "/"), { method: "GET", mode: "cors" }).catch(function () {});
  }
  var SLOW_AFTER = 4000, TIMEOUT = window.SENSEI_TIMEOUT || 90000;
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  // Tiny Markdown: fenced code (highlighted), inline code, bold, italics, paragraphs and lists.
  function md(text) {
    var parts = String(text).split(/```(?:python|py)?\n?([\s\S]*?)```/g), out = "";
    for (var i = 0; i < parts.length; i++) {
      if (i % 2) { out += "<pre class='chat-code'><code>" + (window.CodeEditor ? window.CodeEditor.highlight(parts[i].replace(/\n$/, "")) : esc(parts[i])) + "</code></pre>"; continue; }
      var blocks = parts[i].split(/\n{2,}/);
      blocks.forEach(function (b) {
        b = b.trim(); if (!b) return;
        var lines = b.split("\n");
        var inl = function (s) { return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|\s)\*([^*\n]+)\*(?=\s|$|[.,!?])/g, "$1<i>$2</i>"); };
        if (lines.every(function (l) { return /^\s*([-*]|\d+\.)\s+/.test(l); })) out += "<ul>" + lines.map(function (l) { return "<li>" + inl(l.replace(/^\s*([-*]|\d+\.)\s+/, "")) + "</li>"; }).join("") + "</ul>";
        else out += "<p>" + lines.map(inl).join("<br>") + "</p>";
      });
    }
    return out;
  }

  function mount(container, opts) {
    var S = window.Shinobi;
    container.className = "sensei"; container.hidden = true;
    container.innerHTML =
      '<div class="sensei-head"><div class="sb-label">Ask a sensei</div><div class="sensei-pick" role="radiogroup" aria-label="Choose a teacher"></div></div>' +
      '<div class="sensei-log" aria-live="polite"></div>' +
      '<form class="sensei-form"><textarea class="sensei-in" rows="2" placeholder="Ask about the problem, your code, or Python…"></textarea>' +
      '<button class="go sensei-send" type="submit"><i aria-hidden="true">火</i>Ask</button></form>' +
      '<p class="sensei-note"></p>';
    var pick = container.querySelector(".sensei-pick"), log = container.querySelector(".sensei-log");
    var form = container.querySelector(".sensei-form"), input = container.querySelector(".sensei-in"), note = container.querySelector(".sensei-note");
    var teacher = "kakashi", messages = [], key = null, busy = false;
    try { teacher = localStorage.getItem("sensei-teacher") || teacher; } catch (e) {}

    function renderPick() {
      pick.innerHTML = "";
      TEACHERS.forEach(function (t) {
        var b = document.createElement("button"); b.type = "button"; b.className = "sensei-t" + (t.id === teacher ? " on" : "");
        b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(t.id === teacher)); b.title = t.blurb;
        b.innerHTML = "<span class='sensei-k'>" + t.kanji + "</span><span>" + t.name + "</span>";
        b.addEventListener("click", function () { teacher = t.id; try { localStorage.setItem("sensei-teacher", teacher); } catch (e) {} renderPick(); input.focus(); });
        pick.appendChild(b);
      });
    }
    function nameOf(id) { var t = TEACHERS.filter(function (x) { return x.id === id; })[0]; return t ? t.name : "Sensei"; }
    function renderLog() {
      log.innerHTML = "";
      if (!messages.length) { log.innerHTML = "<p class='sensei-empty'>Pick a sensei and ask anything: what the task means, why your code fails, or how a Python feature works. They can see your code and the problem.</p>"; return; }
      messages.forEach(function (m) {
        var d = document.createElement("div"); d.className = "chat " + (m.role === "user" ? "me" : "them");
        d.innerHTML = "<div class='chat-who'>" + esc(m.role === "user" ? (opts.user() || "You") : nameOf(m.teacher)) + "</div><div class='chat-body'>" + md(m.content) + "</div>";
        log.appendChild(d);
      });
      log.scrollTop = log.scrollHeight;
    }
    function persist() {
      if (!key) return;
      messages = messages.slice(-MAX_SAVED);
      S.saveChat(key, { messages: messages, teacher: teacher }).catch(function () {});
    }
    function load() {
      key = opts.key(); messages = []; renderLog(); note.textContent = "";
      var k = key;
      S.loadChat(k).then(function (data) {
        if (k !== key) return;
        if (data && Array.isArray(data.messages)) { messages = data.messages; }
        renderLog();
      });
    }
    function setBusy(on) { busy = on; container.querySelector(".sensei-send").disabled = on; input.disabled = on; container.classList.toggle("busy", on); }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim(); if (!q || busy) return;
      if (!url()) { note.textContent = "The sensei line isn't set up yet (SENSEI_URL in js/firebase-config.js)."; return; }
      var ctx = opts.context();
      messages.push({ role: "user", content: q, code: ctx.code || "", output: ctx.output || "", t: Date.now() }); input.value = ""; renderLog(); persist();
      var typing = document.createElement("div"); typing.className = "chat them typing"; typing.innerHTML = "<div class='chat-who'>" + esc(nameOf(teacher)) + "</div><div class='chat-body'>…</div>"; log.appendChild(typing); log.scrollTop = log.scrollHeight;
      setBusy(true); note.textContent = "";
      var slow = setTimeout(function () { typing.querySelector(".chat-body").textContent = "The sensei is on the way from the other side of the village… the first answer after a quiet spell can take up to a minute."; log.scrollTop = log.scrollHeight; }, SLOW_AFTER);
      var ctrl = typeof AbortController === "function" ? new AbortController() : null;
      var killer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT);
      S.idToken().then(function (tok) {
        return fetch(url(), { method: "POST", headers: { "content-type": "application/json" }, signal: ctrl ? ctrl.signal : undefined,
          body: JSON.stringify({ idToken: tok, teacher: teacher, problem: ctx.problem, code: ctx.code, output: ctx.output,
            messages: messages.slice(-24).map(function (m) { return { role: m.role, content: m.content, code: m.code, output: m.output }; }) }) });
      }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || ("HTTP " + r.status)); return j; }); })
        .then(function (j) { messages.push({ role: "assistant", teacher: teacher, content: j.reply, t: Date.now() }); persist(); })
        .catch(function (err) {
          // keep the question so one click resends it
          messages.pop(); persist(); input.value = q;
          note.textContent = err.name === "AbortError" ? "No answer after a minute and a half. The sensei may still be waking up — press Ask again."
            : err instanceof TypeError ? "The browser couldn't complete the request. If the server was asleep, press Ask again; if it keeps happening, the service's ALLOWED_ORIGIN must be exactly " + location.origin + "." : err.message;
        })
        .then(function () { clearTimeout(slow); clearTimeout(killer); setBusy(false); renderLog(); input.focus(); });
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

    renderPick(); renderLog();
    return {
      warm: warm,
      open: function () { container.hidden = false; input.focus(); container.scrollIntoView({ block: "nearest", behavior: "smooth" }); },
      close: function () { container.hidden = true; },
      toggle: function () { container.hidden ? this.open() : this.close(); },
      load: load,
      get isOpen() { return !container.hidden; }
    };
  }
  window.Sensei = { mount: mount, TEACHERS: TEACHERS };
})();
