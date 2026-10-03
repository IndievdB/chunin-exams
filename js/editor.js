/* A small code editor for the dojo sandboxes: a textarea with a syntax-highlighted layer
   underneath, Tab / Shift+Tab to indent or outdent the selected lines, auto-indent on Enter,
   and tabs converted to four spaces on typing and on paste.
   window.CodeEditor(textarea) -> { value get/set, focus(), refresh() }
   window.CodeEditor.highlight(src) -> HTML string with Python highlighting. */
(function () {
  "use strict";
  var TAB = "    ";
  var KEYWORDS = /\b(False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/;
  var BUILTINS = /\b(print|len|range|int|str|float|bool|list|dict|set|tuple|sum|min|max|abs|sorted|reversed|enumerate|zip|map|filter|input|type|isinstance|open|round|any|all|ord|chr|repr|hasattr|getattr|setattr|super|object|Exception|ValueError|TypeError|KeyError|IndexError|AssertionError|NameError|AttributeError|self|cls)\b/;

  function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function span(cls, text) { return '<span class="tk-' + cls + '">' + esc(text) + "</span>"; }

  // One pass over the source. Order matters: comments and strings first, then everything else.
  var TOKEN = /("""[\s\S]*?"""|'''[\s\S]*?'''|[rRbBfFuU]{0,2}"(?:\\.|[^"\\\n])*"|[rRbBfFuU]{0,2}'(?:\\.|[^'\\\n])*')|(#[^\n]*)|(@[A-Za-z_][\w.]*)|(\b(?:def|class)\s+)([A-Za-z_]\w*)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(->|[-+*\/%=<>!&|^~:]+|\.\.\.)/g;
  function highlight(src) {
    var out = "", last = 0, m;
    src = String(src);
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(src))) {
      out += esc(src.slice(last, m.index)); last = TOKEN.lastIndex;
      if (m[1]) out += span("str", m[1]);
      else if (m[2]) out += span("com", m[2]);
      else if (m[3]) out += span("dec", m[3]);
      else if (m[4]) out += span("kw", m[4]) + span("def", m[5]);
      else if (m[6]) out += span("num", m[6]);
      else if (m[7]) out += KEYWORDS.test(m[7]) ? span("kw", m[7]) : BUILTINS.test(m[7]) ? span("bi", m[7]) : span("fn", m[7]);
      else if (m[8]) out += KEYWORDS.test(m[8]) ? span("kw", m[8]) : BUILTINS.test(m[8]) ? span("bi", m[8]) : esc(m[8]);
      else if (m[9]) out += span("op", m[9]);
    }
    out += esc(src.slice(last));
    return out + "\n";           // trailing newline keeps the layer the same height as the textarea
  }

  function detab(text) { return text.replace(/\t/g, TAB); }

  function CodeEditor(ta) {
    var wrap = document.createElement("div"); wrap.className = "ed";
    var pre = document.createElement("pre"); pre.className = "ed-hl"; pre.setAttribute("aria-hidden", "true");
    var code = document.createElement("code"); pre.appendChild(code);
    ta.parentNode.insertBefore(wrap, ta); wrap.appendChild(pre); wrap.appendChild(ta);
    ta.classList.add("ed-ta");

    function paint() { code.innerHTML = highlight(ta.value); sync(); }
    function sync() { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; }
    function set(v) { ta.value = detab(v || ""); paint(); }

    // Replace the selected lines with a transformed version, keeping the selection on them.
    function mapLines(fn) {
      var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
      var ls = v.lastIndexOf("\n", s - 1) + 1;
      var le = v.indexOf("\n", e === s ? e : e - 1); if (le < 0) le = v.length;
      var block = v.slice(ls, le), lines = block.split("\n"), first = fn(lines[0]), out = [first];
      for (var i = 1; i < lines.length; i++) out.push(fn(lines[i]));
      var next = out.join("\n");
      ta.setRangeText(next, ls, le, "preserve");
      var shiftFirst = first.length - lines[0].length;
      var ns = Math.max(ls, s + shiftFirst), ne = ls + next.length;
      if (e === s) ne = ns; else if (e < le) ne = Math.max(ns, e + (next.length - block.length));
      ta.setSelectionRange(ns, ne);
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }

    ta.addEventListener("keydown", function (ev) {
      if (ev.key === "Tab") {
        ev.preventDefault();
        var multi = ta.value.slice(ta.selectionStart, ta.selectionEnd).indexOf("\n") >= 0;
        if (ev.shiftKey) mapLines(function (l) { return l.replace(/^ {1,4}/, ""); });
        else if (multi) mapLines(function (l) { return l.length ? TAB + l : l; });
        else { ta.setRangeText(TAB, ta.selectionStart, ta.selectionEnd, "end"); ta.dispatchEvent(new Event("input", { bubbles: true })); }
      } else if (ev.key === "Enter" && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey) {
        ev.preventDefault();
        var v = ta.value, s = ta.selectionStart;
        var ls = v.lastIndexOf("\n", s - 1) + 1, line = v.slice(ls, s);
        var indent = (line.match(/^ */) || [""])[0];
        if (/:\s*$/.test(line)) indent += TAB;
        ta.setRangeText("\n" + indent, s, ta.selectionEnd, "end");
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (ev.key === "Backspace" && ta.selectionStart === ta.selectionEnd) {
        // delete a whole indent step when the caret sits after only spaces
        var p = ta.selectionStart, before = ta.value.slice(ta.value.lastIndexOf("\n", p - 1) + 1, p);
        if (before.length && /^ +$/.test(before) && before.length % 4 === 0) { ev.preventDefault(); ta.setRangeText("", p - 4, p, "end"); ta.dispatchEvent(new Event("input", { bubbles: true })); }
      }
    });
    ta.addEventListener("paste", function (ev) {
      var text = (ev.clipboardData || window.clipboardData).getData("text");
      if (text.indexOf("\t") < 0) return;           // let the browser handle a plain paste
      ev.preventDefault();
      ta.setRangeText(detab(text), ta.selectionStart, ta.selectionEnd, "end");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    });
    ta.addEventListener("input", function () {
      if (ta.value.indexOf("\t") >= 0) { var p = ta.selectionStart; var before = ta.value.slice(0, p); var extra = (before.match(/\t/g) || []).length * 3; ta.value = detab(ta.value); ta.setSelectionRange(p + extra, p + extra); }
      paint();
    });
    ta.addEventListener("scroll", sync);
    paint();
    return {
      get value() { return ta.value; },
      set value(v) { set(v); },
      focus: function () { ta.focus(); },
      refresh: paint,
      el: wrap
    };
  }
  CodeEditor.highlight = highlight;
  CodeEditor.detab = detab;
  window.CodeEditor = CodeEditor;
})();
