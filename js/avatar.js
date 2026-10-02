/* Picrew-style shinobi avatar: layered inline SVG built from a small config object.
   window.Avatar = { OPTIONS, DEFAULT, render(cfg) -> svg markup, random() } */
(function () {
  "use strict";
  var OPTIONS = {
    skin: ["#f6d7b8", "#e8b98f", "#c98f5f", "#9d6440", "#6b4328"],
    hair: ["spiky", "bowl", "long", "ponytail", "short", "bun", "shaggy", "none"],
    hairColor: ["#f2c230", "#1f1f1f", "#5b3a1e", "#c0392b", "#e59ab8", "#8e9aa6", "#f4f1ea", "#6a2fb5"],
    eyes: ["normal", "sharingan", "byakugan", "closed", "rinnegan"],
    band: ["#1d3a8a", "#1a1a1a", "#b3261e", "#2f7d32", "#f4f1ea"],
    outfit: ["orange", "vest", "black", "blue", "red", "purple", "akatsuki"],
    mark: ["none", "whiskers", "scar", "mask", "glasses", "clanmark"]
  };
  var LABELS = { skin: "Skin", hair: "Hair", hairColor: "Hair colour", eyes: "Eyes", band: "Headband", outfit: "Outfit", mark: "Markings" };
  var DEFAULT = { skin: 0, hair: 0, hairColor: 0, eyes: 0, band: 0, outfit: 0, mark: 1 };

  function hairBack(style, c) {
    switch (style) {
      case "long": return '<path d="M52 92 q-10 60 4 112 h88 q14 -52 4 -112 Z" fill="' + c + '"/>';
      case "ponytail": return '<path d="M100 40 q46 10 44 60 q12 30 -14 56 q-10 -30 -8 -56 Z" fill="' + c + '"/>';
      case "bun": return '<circle cx="100" cy="36" r="18" fill="' + c + '"/>';
      default: return "";
    }
  }
  function hairFront(style, c) {
    var d = "";
    switch (style) {
      case "spiky": d = "M44 96 L38 50 L62 68 L70 28 L86 62 L100 18 L114 62 L130 28 L138 68 L162 50 L156 96 Q128 70 100 76 Q72 70 44 96 Z"; break;
      case "bowl": d = "M42 100 Q40 36 100 34 Q160 36 158 100 L146 100 Q120 76 100 80 Q80 76 54 100 Z"; break;
      case "long": d = "M42 110 Q40 40 100 36 Q160 40 158 110 L150 92 Q130 66 100 70 Q70 66 50 92 Z"; break;
      case "ponytail": d = "M46 96 Q44 44 100 40 Q156 44 154 96 L140 84 Q120 66 100 72 Q80 66 60 84 Z"; break;
      case "short": d = "M48 92 Q46 42 100 40 Q154 42 152 92 L142 82 Q118 62 100 70 Q82 62 58 82 Z"; break;
      case "bun": d = "M48 92 Q46 48 100 46 Q154 48 152 92 L140 82 Q118 66 100 72 Q82 66 60 82 Z"; break;
      case "shaggy": d = "M40 104 L46 60 L58 78 L66 44 L82 72 L100 30 L118 72 L134 44 L142 78 L154 60 L160 104 L146 96 Q122 70 100 78 Q78 70 54 96 Z"; break;
      default: return "";
    }
    return '<path d="' + d + '" fill="' + c + '" stroke="#1a1208" stroke-width="2.5" stroke-linejoin="round"/>';
  }
  function eyes(kind) {
    var L = '', R = '';
    function eye(cx, inner) { return '<ellipse cx="' + cx + '" cy="118" rx="9" ry="6" fill="#fff" stroke="#1a1208" stroke-width="2"/>' + inner(cx); }
    switch (kind) {
      case "sharingan": L = R = function (cx) { return '<circle cx="' + cx + '" cy="118" r="5" fill="#c62828"/><circle cx="' + cx + '" cy="118" r="1.6" fill="#000"/><circle cx="' + (cx-3) + '" cy="116" r="1.2" fill="#000"/><circle cx="' + (cx+3) + '" cy="116" r="1.2" fill="#000"/><circle cx="' + cx + '" cy="121.5" r="1.2" fill="#000"/>'; }; break;
      case "byakugan": L = R = function (cx) { return '<circle cx="' + cx + '" cy="118" r="5" fill="#e8e3f3" stroke="#b8aed0" stroke-width="1"/>'; }; break;
      case "rinnegan": L = R = function (cx) { return '<circle cx="' + cx + '" cy="118" r="5.5" fill="#b9a3e3"/><circle cx="' + cx + '" cy="118" r="3.5" fill="none" stroke="#5d3f9e" stroke-width="1"/><circle cx="' + cx + '" cy="118" r="1.5" fill="#000"/>'; }; break;
      case "closed": return '<path d="M74 118 q9 6 18 0 M108 118 q9 6 18 0" fill="none" stroke="#1a1208" stroke-width="2.5" stroke-linecap="round"/>';
      default: L = R = function (cx) { return '<circle cx="' + cx + '" cy="118" r="4.5" fill="#1f3b6e"/><circle cx="' + cx + '" cy="118" r="2" fill="#000"/><circle cx="' + (cx-1.5) + '" cy="116" r="1" fill="#fff"/>'; };
    }
    return eye(83, L) + eye(117, R);
  }
  function outfit(kind) {
    var base = '<path d="M30 240 q0 -60 40 -70 l30 -10 l30 10 q40 10 40 70 Z" fill="%F" stroke="#1a1208" stroke-width="2.5"/>';
    var collar = '<path d="M70 160 l30 30 l30 -30" fill="none" stroke="#1a1208" stroke-width="2.5"/>';
    switch (kind) {
      case "orange": return base.replace("%F", "#f57c1f") + '<path d="M30 240 q0 -60 40 -70 l30 -10 v80 Z" fill="#f57c1f"/><path d="M100 160 v80" stroke="#1d3a8a" stroke-width="10"/><path d="M60 175 q10 -20 40 -15" fill="none" stroke="#1d3a8a" stroke-width="12"/>' + collar;
      case "vest": return base.replace("%F", "#2d3a2e") + '<path d="M44 240 q-2 -50 34 -64 l22 -8 l22 8 q36 14 34 64 Z" fill="#7f8b5a" stroke="#1a1208" stroke-width="2.5"/><path d="M68 200 h24 M108 200 h24 M68 218 h24 M108 218 h24" stroke="#5a6540" stroke-width="6" stroke-linecap="round"/>' + collar;
      case "black": return base.replace("%F", "#1e1e22") + collar;
      case "blue": return base.replace("%F", "#2c4a8a") + collar;
      case "red": return base.replace("%F", "#9c1f1f") + '<path d="M100 170 v70" stroke="#5a0d0d" stroke-width="4"/>' + collar;
      case "purple": return base.replace("%F", "#5b3a8a") + '<path d="M60 230 h80" stroke="#c9a3ff" stroke-width="6"/>' + collar;
      case "akatsuki": return base.replace("%F", "#1a1a1a") + '<path d="M50 200 q6 -10 12 0 q6 -10 12 0 q-2 8 -12 8 q-10 0 -12 -8 Z" fill="#c62828"/><path d="M126 215 q6 -10 12 0 q6 -10 12 0 q-2 8 -12 8 q-10 0 -12 -8 Z" fill="#c62828"/><path d="M60 162 q40 30 80 0 l0 20 q-40 24 -80 0 Z" fill="#1a1a1a" stroke="#1a1208" stroke-width="2"/>';
    }
    return base.replace("%F", "#555");
  }
  function marks(kind, skin) {
    switch (kind) {
      case "whiskers": return '<g stroke="#1a1208" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M56 124 h14 M56 131 h14 M56 138 h14 M130 124 h14 M130 131 h14 M130 138 h14"/></g>';
      case "scar": return '<path d="M78 134 q22 4 44 0" fill="none" stroke="#a65a4a" stroke-width="3" stroke-linecap="round"/>';
      case "mask": return '<path d="M58 128 q42 50 84 0 l0 36 q-42 28 -84 0 Z" fill="#2d3a5e" stroke="#1a1208" stroke-width="2"/>';
      case "glasses": return '<g fill="none" stroke="#1a1208" stroke-width="2.5"><circle cx="83" cy="118" r="12"/><circle cx="117" cy="118" r="12"/><path d="M95 118 h10 M71 116 l-8 -4 M129 116 l8 -4"/></g>';
      case "clanmark": return '<path d="M100 132 l-6 10 h12 Z" fill="#c62828"/><path d="M68 110 l-10 -6 M132 110 l10 -6" stroke="#c62828" stroke-width="4" stroke-linecap="round"/>';
      default: return "";
    }
  }
  function pick(list, i) { return list[((i | 0) % list.length + list.length) % list.length]; }

  function render(cfg) {
    cfg = Object.assign({}, DEFAULT, cfg || {});
    var skin = pick(OPTIONS.skin, cfg.skin), hairC = pick(OPTIONS.hairColor, cfg.hairColor), hairS = pick(OPTIONS.hair, cfg.hair);
    var band = pick(OPTIONS.band, cfg.band);
    return '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shinobi avatar">' +
      hairBack(hairS, hairC) +
      outfit(pick(OPTIONS.outfit, cfg.outfit)) +
      '<path d="M86 150 h28 v22 h-28 Z" fill="' + skin + '" stroke="#1a1208" stroke-width="2.5"/>' +           // neck
      '<path d="M58 100 q0 -50 42 -50 q42 0 42 50 v26 q0 36 -42 40 q-42 -4 -42 -40 Z" fill="' + skin + '" stroke="#1a1208" stroke-width="2.5"/>' + // head
      '<path d="M58 104 q-10 0 -10 10 q0 10 10 10 M142 104 q10 0 10 10 q0 10 -10 10" fill="' + skin + '" stroke="#1a1208" stroke-width="2.5"/>' + // ears
      eyes(pick(OPTIONS.eyes, cfg.eyes)) +
      '<path d="M96 128 q4 4 8 0" fill="none" stroke="#1a1208" stroke-width="2" stroke-linecap="round"/>' +   // nose
      '<path d="M90 146 q10 8 20 0" fill="none" stroke="#1a1208" stroke-width="2.5" stroke-linecap="round"/>' + // mouth
      marks(pick(OPTIONS.mark, cfg.mark), skin) +
      // headband: cloth + leaf plate
      '<path d="M54 86 q46 -14 92 0 l0 16 q-46 -12 -92 0 Z" fill="' + band + '" stroke="#1a1208" stroke-width="2.5"/>' +
      '<rect x="76" y="80" width="48" height="22" rx="4" fill="#cfd4d8" stroke="#1a1208" stroke-width="2.5"/>' +
      '<path d="M100 93 m-2 0 a2 2 0 1 1 4 0 a5 5 0 0 1 -9 0 a8 8 0 0 1 16 0 M111 86 l5 -4 M111 86 l3 8" fill="none" stroke="#1a1208" stroke-width="2" stroke-linecap="round"/>' +
      hairFront(hairS, hairC) +
      '</svg>';
  }
  function random() {
    var cfg = {};
    Object.keys(OPTIONS).forEach(function (k) { cfg[k] = Math.floor(Math.random() * OPTIONS[k].length); });
    return cfg;
  }
  window.Avatar = { OPTIONS: OPTIONS, LABELS: LABELS, DEFAULT: DEFAULT, render: render, random: random, pick: pick };
})();
