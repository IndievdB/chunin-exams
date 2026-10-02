/* Picrew-style shinobi avatar: layered inline SVG built from a small config object.
   window.Avatar = { OPTIONS, DEFAULT, render(cfg) -> svg markup, random() } */
(function () {
  "use strict";
  var OPTIONS = {
    skin: ["#f6d7b8", "#e8b98f", "#c98f5f", "#9d6440", "#6b4328", "#fde7d2", "#f1c9a5", "#d9a074", "#b67c4f", "#8a5a36", "#5a3722", "#3f2616", "#e6cdb5", "#c8a07a", "#a87556"],
    hair: ["spiky", "bowl", "long", "ponytail", "short", "bun", "shaggy", "none", "mohawk", "sideswept", "twintails", "braid", "buzz", "curly", "wild", "slick", "topknot", "bob"],
    hairColor: ["#f2c230", "#1f1f1f", "#5b3a1e", "#c0392b", "#e59ab8", "#8e9aa6", "#f4f1ea", "#6a2fb5", "#2e4a9e", "#1f8a5a", "#d35400", "#7a1f1f", "#3b2a6b", "#b0b0b0", "#ffd9a0", "#223", "#8b5a2b", "#e63946"],
    eyes: ["normal", "sharingan", "byakugan", "closed", "rinnegan", "green", "amber", "grey", "violet", "mangekyo", "tenseigan", "sage", "ketsuryugan", "jogan", "scarred"],
    band: ["#1d3a8a", "#1a1a1a", "#b3261e", "#2f7d32", "#f4f1ea", "#6b3a16", "#5b2a86", "#0c6b7a", "#b8860b", "#444", "#e04a7a", "#2a2a5a", "#7a7a2a", "#ff7f11", "#9fb3c8"],
    outfit: ["orange", "vest", "black", "blue", "red", "purple", "akatsuki", "anbu", "green", "white", "kimono", "sand", "mesh", "cloak", "gold", "teal", "hoodie"],
    mark: ["none", "whiskers", "scar", "mask", "glasses", "clanmark", "bandage", "facepaint", "eyepatch", "freckles", "fangmarks", "curse", "visor", "beard", "blush", "bindi"],
    expression: ["calm", "determined", "smile", "smirk", "angry", "tired", "shocked"]
  };
  var LABELS = { skin: "Skin", hair: "Hair", hairColor: "Hair colour", eyes: "Eyes", expression: "Expression", band: "Headband", outfit: "Outfit", mark: "Markings" };
  var DEFAULT = { skin: 0, hair: 0, hairColor: 0, eyes: 0, expression: 0, band: 0, outfit: 0, mark: 1 };

  function hairBack(style, c) {
    switch (style) {
      case "long": return '<path d="M58 92 q-8 60 4 112 h76 q12 -52 4 -112 Z" fill="' + c + '"/>';
      case "ponytail": return '<path d="M100 42 q42 10 40 58 q12 30 -14 56 q-10 -30 -8 -56 Z" fill="' + c + '"/>';
      case "bun": return '<circle cx="100" cy="40" r="17" fill="' + c + '"/>';
      case "twintails": return '<path d="M58 100 q-16 40 -4 90 h16 q6 -50 0 -90 Z M142 100 q16 40 4 90 h-16 q-6 -50 0 -90 Z" fill="' + c + '"/>';
      case "braid": return '<path d="M130 100 q22 40 10 90 h-14 q8 -50 -4 -90 Z" fill="' + c + '"/><path d="M134 120 l6 10 l-6 10 l6 10 l-6 10 l6 10" fill="none" stroke="#1a1208" stroke-width="1.5" opacity=".5"/>';
      case "topknot": return '<path d="M94 42 q6 -22 12 0 q10 -10 8 6 h-28 q-2 -16 8 -6 Z" fill="' + c + '" stroke="#1a1208" stroke-width="2"/>';
      case "wild": return '<path d="M52 110 l-14 -30 l20 6 l-6 -36 l18 18 l0 -28 l16 22 l14 -30 l14 30 l16 -22 l0 28 l18 -18 l-6 36 l20 -6 l-14 30 Z" fill="' + c + '"/>';
      case "bob": return '<path d="M54 96 q-6 40 6 62 h80 q12 -22 6 -62 Z" fill="' + c + '"/>';
      default: return "";
    }
  }
  function hairFront(style, c) {
    // head is 60..140 wide at the brow line (y~96); fronts sit inside that, spikes may poke out above
    var d = "";
    switch (style) {
      case "spiky": d = "M56 96 L48 54 L68 68 L74 30 L88 62 L100 20 L112 62 L126 30 L132 68 L152 54 L144 96 Q124 74 100 78 Q76 74 56 96 Z"; break;
      case "bowl": d = "M54 100 Q52 38 100 36 Q148 38 146 100 L136 100 Q118 78 100 82 Q82 78 64 100 Z"; break;
      case "long": d = "M54 110 Q52 42 100 38 Q148 42 146 110 L140 94 Q122 70 100 74 Q78 70 60 94 Z"; break;
      case "ponytail": d = "M56 96 Q54 46 100 42 Q146 46 144 96 L134 86 Q118 68 100 74 Q82 68 66 86 Z"; break;
      case "short": d = "M58 92 Q56 44 100 42 Q144 44 142 92 L134 84 Q116 64 100 72 Q84 64 66 84 Z"; break;
      case "bun": d = "M58 92 Q56 50 100 48 Q144 50 142 92 L132 84 Q116 68 100 74 Q84 68 68 84 Z"; break;
      case "shaggy": d = "M52 104 L56 62 L66 78 L72 46 L86 72 L100 34 L114 72 L128 46 L134 78 L144 62 L148 104 L138 96 Q120 72 100 80 Q80 72 62 96 Z"; break;
      case "mohawk": d = "M88 92 L90 30 L100 14 L110 30 L112 92 Q100 84 88 92 Z"; break;
      case "sideswept": d = "M56 96 Q54 44 100 42 Q146 44 144 96 L136 86 Q120 60 72 84 Q64 90 56 96 Z"; break;
      case "twintails": d = "M56 96 Q54 46 100 42 Q146 46 144 96 L134 86 Q118 68 100 74 Q82 68 66 86 Z"; break;
      case "braid": d = "M56 96 Q54 46 100 42 Q146 46 144 96 L136 88 Q118 70 100 74 Q82 70 64 88 Z"; break;
      case "buzz": d = "M60 92 Q58 52 100 50 Q142 52 140 92 L132 86 Q116 72 100 76 Q84 72 68 86 Z"; break;
      case "curly": d = "M54 100 q-6 -14 6 -22 q-8 -16 8 -22 q-2 -18 14 -16 q6 -16 18 -8 q12 -8 18 8 q16 -2 14 16 q16 6 8 22 q12 8 6 22 L138 94 Q120 70 100 76 Q80 70 62 94 Z"; break;
      case "wild": d = "M56 98 L62 60 L74 74 L80 40 L92 66 L100 28 L108 66 L120 40 L126 74 L138 60 L144 98 L136 92 Q118 70 100 78 Q82 70 64 92 Z"; break;
      case "slick": d = "M56 96 Q56 46 100 44 Q144 46 144 96 L140 94 Q130 60 72 70 Q62 76 60 94 Z"; break;
      case "topknot": d = "M58 94 Q56 50 100 48 Q144 50 142 94 L134 86 Q118 70 100 74 Q82 70 66 86 Z"; break;
      case "bob": d = "M54 100 Q52 42 100 38 Q148 42 146 100 L138 96 Q122 70 100 74 Q78 70 62 96 Z"; break;
      default: return "";
    }
    return '<path d="' + d + '" fill="' + c + '" stroke="#1a1208" stroke-width="2.5" stroke-linejoin="round"/>';
  }
  function eyes(kind, expr) {
    if (expr === "tired" || kind === "closed") {
      var yy = expr === "tired" ? 120 : 118;
      return '<path d="M72 ' + yy + ' q11 5 22 0 M106 ' + yy + ' q11 5 22 0" fill="none" stroke="#1a1208" stroke-width="2.5" stroke-linecap="round"/>' +
        (expr === "tired" ? '<path d="M74 127 h18 M108 127 h18" stroke="#8a6a5a" stroke-width="1.5" opacity=".7"/>' : "");
    }
    var ry = expr === "shocked" ? 8 : expr === "angry" || expr === "determined" ? 5 : 6;
    function iris(cx) {
      switch (kind) {
        case "sharingan": return '<circle cx="' + cx + '" cy="118" r="4.6" fill="#c62828"/><circle cx="' + cx + '" cy="118" r="1.5" fill="#000"/><circle cx="' + (cx-2.8) + '" cy="116.3" r="1.1" fill="#000"/><circle cx="' + (cx+2.8) + '" cy="116.3" r="1.1" fill="#000"/><circle cx="' + cx + '" cy="121.3" r="1.1" fill="#000"/>';
        case "byakugan": return '<circle cx="' + cx + '" cy="118" r="4.6" fill="#ece8f5" stroke="#c3b8da" stroke-width="1"/>';
        case "rinnegan": return '<circle cx="' + cx + '" cy="118" r="5" fill="#b9a3e3"/><circle cx="' + cx + '" cy="118" r="3.2" fill="none" stroke="#5d3f9e" stroke-width="1"/><circle cx="' + cx + '" cy="118" r="1.3" fill="#000"/>';
        case "mangekyo": return '<circle cx="' + cx + '" cy="118" r="4.8" fill="#c62828"/><path d="M' + cx + ' 113.5 l2.2 3.8 l4.2 .3 l-3.2 2.8 l1 4.2 l-4.2 -2.2 l-4.2 2.2 l1 -4.2 l-3.2 -2.8 l4.2 -.3 Z" fill="#000"/>';
        case "tenseigan": return '<circle cx="' + cx + '" cy="118" r="4.8" fill="#9fdcff"/><circle cx="' + cx + '" cy="118" r="2.6" fill="none" stroke="#fff" stroke-width="1"/><circle cx="' + cx + '" cy="118" r="1" fill="#fff"/>';
        case "sage": return '<circle cx="' + cx + '" cy="118" r="4.8" fill="#e0a800"/><rect x="' + (cx-1) + '" y="113.5" width="2" height="9" rx="1" fill="#000"/>';
        case "ketsuryugan": return '<circle cx="' + cx + '" cy="118" r="4.8" fill="#8b0000"/><circle cx="' + cx + '" cy="118" r="1.6" fill="#000"/>';
        case "jogan": return '<circle cx="' + cx + '" cy="118" r="4.8" fill="#4aa3dd"/><circle cx="' + cx + '" cy="118" r="2.2" fill="#fff" opacity=".9"/><circle cx="' + cx + '" cy="118" r="1" fill="#000"/>';
        case "scarred": return '<circle cx="' + cx + '" cy="118" r="4.2" fill="#8e9aa6"/><circle cx="' + cx + '" cy="118" r="2" fill="#000"/>';
        case "green": return '<circle cx="' + cx + '" cy="118" r="4.2" fill="#2e8b57"/><circle cx="' + cx + '" cy="118" r="2" fill="#000"/><circle cx="' + (cx-1.4) + '" cy="116.2" r="1" fill="#fff"/>';
        case "amber": return '<circle cx="' + cx + '" cy="118" r="4.2" fill="#d4891a"/><circle cx="' + cx + '" cy="118" r="2" fill="#000"/><circle cx="' + (cx-1.4) + '" cy="116.2" r="1" fill="#fff"/>';
        case "grey": return '<circle cx="' + cx + '" cy="118" r="4.2" fill="#7d8791"/><circle cx="' + cx + '" cy="118" r="2" fill="#000"/><circle cx="' + (cx-1.4) + '" cy="116.2" r="1" fill="#fff"/>';
        case "violet": return '<circle cx="' + cx + '" cy="118" r="4.2" fill="#7b4fb8"/><circle cx="' + cx + '" cy="118" r="2" fill="#000"/><circle cx="' + (cx-1.4) + '" cy="116.2" r="1" fill="#fff"/>';
        default: return '<circle cx="' + cx + '" cy="118" r="4.2" fill="#1f3b6e"/><circle cx="' + cx + '" cy="118" r="2" fill="#000"/><circle cx="' + (cx-1.4) + '" cy="116.2" r="1" fill="#fff"/>';
      }
    }
    function eye(cx) {
      // almond: upper lid heavier, lower lid light
      return '<path d="M' + (cx-11) + ' 118 q11 -' + (ry+3) + ' 22 0 q-11 ' + (ry) + ' -22 0 Z" fill="#fff"/>' +
        '<clipPath id="e' + cx + '"><path d="M' + (cx-11) + ' 118 q11 -' + (ry+3) + ' 22 0 q-11 ' + ry + ' -22 0 Z"/></clipPath>' +
        '<g clip-path="url(#e' + cx + ')">' + iris(cx) + '</g>' +
        '<path d="M' + (cx-11) + ' 118 q11 -' + (ry+3) + ' 22 0" fill="none" stroke="#1a1208" stroke-width="2.8" stroke-linecap="round"/>' +
        '<path d="M' + (cx-11) + ' 118 q11 ' + ry + ' 22 0" fill="none" stroke="#1a1208" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>';
    }
    return eye(83) + eye(117);
  }
  function brows(expr) {
    var s = '<g fill="none" stroke="#1a1208" stroke-width="2.6" stroke-linecap="round">';
    switch (expr) {
      case "angry": return s + '<path d="M70 104 l24 6 M130 104 l-24 6"/></g>';
      case "determined": return s + '<path d="M70 106 l24 3 M130 106 l-24 3"/></g>';
      case "shocked": return s + '<path d="M72 101 q11 -6 22 -1 M106 100 q11 -5 22 1"/></g>';
      case "tired": return s + '<path d="M72 108 q11 -2 22 1 M106 109 q11 -3 22 -1"/></g>';
      case "smirk": return s + '<path d="M72 106 q11 -4 22 -1 M106 103 q11 -4 22 2"/></g>';
      default: return s + '<path d="M72 106 q11 -4 22 -1 M106 105 q11 -3 22 1"/></g>';
    }
  }
  function mouth(expr) {
    switch (expr) {
      case "smile": return '<path d="M88 145 q12 10 24 0" fill="none" stroke="#1a1208" stroke-width="2.4" stroke-linecap="round"/>';
      case "smirk": return '<path d="M92 146 q10 4 18 -3" fill="none" stroke="#1a1208" stroke-width="2.4" stroke-linecap="round"/>';
      case "angry": return '<path d="M90 148 q10 -6 20 0" fill="none" stroke="#1a1208" stroke-width="2.4" stroke-linecap="round"/>';
      case "shocked": return '<ellipse cx="100" cy="147" rx="5" ry="6" fill="#4a1a1a" stroke="#1a1208" stroke-width="2"/>';
      case "tired": return '<path d="M92 147 h16" fill="none" stroke="#1a1208" stroke-width="2.4" stroke-linecap="round"/>';
      case "determined": return '<path d="M91 146 h18" fill="none" stroke="#1a1208" stroke-width="2.6" stroke-linecap="round"/>';
      default: return '<path d="M92 146 q8 3 16 0" fill="none" stroke="#1a1208" stroke-width="2.2" stroke-linecap="round"/>';
    }
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
      case "anbu": return base.replace("%F", "#2b2b30") + '<path d="M62 176 q38 -16 76 0 l-6 14 q-32 -12 -64 0 Z" fill="#b9bec4" stroke="#1a1208" stroke-width="2"/><path d="M100 160 v80" stroke="#b9bec4" stroke-width="6"/>' + collar;
      case "green": return base.replace("%F", "#2f8f3a") + '<path d="M70 160 l30 30 l30 -30" fill="none" stroke="#1a1208" stroke-width="2.5"/><path d="M60 236 h80" stroke="#f57c1f" stroke-width="8"/>';
      case "white": return base.replace("%F", "#f1efe8") + '<path d="M100 160 v80" stroke="#c62828" stroke-width="4"/>' + collar;
      case "kimono": return base.replace("%F", "#5a2d82") + '<path d="M72 160 l28 40 l28 -40" fill="#f1efe8" stroke="#1a1208" stroke-width="2"/><path d="M40 222 h120" stroke="#c62828" stroke-width="10"/>';
      case "sand": return base.replace("%F", "#c9a86a") + '<path d="M70 160 l30 30 l30 -30" fill="none" stroke="#1a1208" stroke-width="2.5"/><path d="M60 200 h80" stroke="#8a6a3a" stroke-width="5"/>';
      case "mesh": return base.replace("%F", "#1e1e22") + '<path d="M44 200 h112 M44 212 h112 M44 224 h112 M60 170 v70 M80 166 v74 M100 162 v78 M120 166 v74 M140 170 v70" stroke="#6a6a72" stroke-width="1.5" opacity=".9"/>' + collar;
      case "cloak": return base.replace("%F", "#2a3b4d") + '<path d="M30 240 q0 -60 40 -70 l30 -10 v80 Z" fill="#1f2d3b"/><path d="M60 162 q40 30 80 0 l0 20 q-40 24 -80 0 Z" fill="#2a3b4d" stroke="#1a1208" stroke-width="2"/>';
      case "gold": return base.replace("%F", "#d4a017") + '<path d="M100 160 v80" stroke="#7a1f1f" stroke-width="8"/>' + collar;
      case "teal": return base.replace("%F", "#1c7f86") + '<path d="M60 230 h80" stroke="#f4f1ea" stroke-width="6"/>' + collar;
      case "hoodie": return base.replace("%F", "#5c5c66") + '<path d="M58 164 q42 26 84 0 l0 18 q-42 22 -84 0 Z" fill="#4a4a54" stroke="#1a1208" stroke-width="2"/><path d="M92 185 v20 M108 185 v20" stroke="#f1efe8" stroke-width="3" stroke-linecap="round"/>';
      case "akatsuki": return base.replace("%F", "#1a1a1a") + '<path d="M50 200 q6 -10 12 0 q6 -10 12 0 q-2 8 -12 8 q-10 0 -12 -8 Z" fill="#c62828"/><path d="M126 215 q6 -10 12 0 q6 -10 12 0 q-2 8 -12 8 q-10 0 -12 -8 Z" fill="#c62828"/><path d="M60 162 q40 30 80 0 l0 20 q-40 24 -80 0 Z" fill="#1a1a1a" stroke="#1a1208" stroke-width="2"/>';
    }
    return base.replace("%F", "#555");
  }
  function marks(kind, skin) {
    switch (kind) {
      case "whiskers": return '<g stroke="#1a1208" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M62 126 h12 M61 132 h13 M62 138 h12 M126 126 h12 M126 132 h13 M126 138 h12"/></g>';
      case "scar": return '<path d="M82 133 q18 4 36 0" fill="none" stroke="#a65a4a" stroke-width="3" stroke-linecap="round"/><path d="M90 130 v7 M100 131 v7 M110 130 v7" stroke="#a65a4a" stroke-width="1.5" stroke-linecap="round"/>';
      case "mask": return '<path d="M63 126 Q100 170 137 126 L137 142 Q126 160 118 164 Q108 169 100 169 Q92 169 82 164 Q74 160 63 142 Z" fill="#2d3a5e" stroke="#1a1208" stroke-width="2"/>';
      case "glasses": return '<g fill="none" stroke="#1a1208" stroke-width="2.5"><circle cx="83" cy="118" r="12"/><circle cx="117" cy="118" r="12"/><path d="M95 118 h10 M71 116 l-8 -4 M129 116 l8 -4"/></g>';
      case "bandage": return '<path d="M62 118 q38 -18 76 0 l0 10 q-38 -14 -76 0 Z" fill="#f1efe8" stroke="#1a1208" stroke-width="1.5" opacity=".95"/>';
      case "facepaint": return '<path d="M70 108 l10 30 M130 108 l-10 30 M90 150 h20" stroke="#8b1c1c" stroke-width="4" stroke-linecap="round"/>';
      case "eyepatch": return '<ellipse cx="117" cy="118" rx="12" ry="9" fill="#1a1a1a"/><path d="M106 112 L60 94 M128 112 L146 100" stroke="#1a1a1a" stroke-width="2.5"/>';
      case "freckles": return '<g fill="#a65a4a" opacity=".8"><circle cx="76" cy="132" r="1.3"/><circle cx="82" cy="136" r="1.3"/><circle cx="72" cy="138" r="1.3"/><circle cx="124" cy="132" r="1.3"/><circle cx="118" cy="136" r="1.3"/><circle cx="128" cy="138" r="1.3"/></g>';
      case "fangmarks": return '<path d="M78 128 l4 10 l4 -10 M114 128 l4 10 l4 -10" fill="#c62828" stroke="#1a1208" stroke-width="1"/>';
      case "curse": return '<g fill="#1a1a1a"><path d="M126 100 q6 -4 8 2 q-6 2 -8 -2 Z"/><path d="M130 94 q4 -6 8 -2 q-4 4 -8 2 Z"/><path d="M134 104 q6 0 6 6 q-6 -2 -6 -6 Z"/></g>';
      case "visor": return '<path d="M64 112 h72 v12 h-72 Z" fill="#1f3b6e" opacity=".85" stroke="#1a1208" stroke-width="2"/>';
      case "beard": return '<path d="M74 136 q26 36 52 0 q-6 28 -26 30 q-20 -2 -26 -30 Z" fill="#3b2a1a" opacity=".9"/>';
      case "blush": return '<ellipse cx="76" cy="134" rx="7" ry="4" fill="#e59ab8" opacity=".7"/><ellipse cx="124" cy="134" rx="7" ry="4" fill="#e59ab8" opacity=".7"/>';
      case "bindi": return '<circle cx="100" cy="98" r="3.5" fill="#c62828"/>';
      case "clanmark": return '<path d="M100 132 l-6 10 h12 Z" fill="#c62828"/><path d="M68 110 l-10 -6 M132 110 l10 -6" stroke="#c62828" stroke-width="4" stroke-linecap="round"/>';
      default: return "";
    }
  }
  function pick(list, i) { return list[((i | 0) % list.length + list.length) % list.length]; }

  function render(cfg) {
    cfg = Object.assign({}, DEFAULT, cfg || {});
    var skin = pick(OPTIONS.skin, cfg.skin), hairC = pick(OPTIONS.hairColor, cfg.hairColor), hairS = pick(OPTIONS.hair, cfg.hair);
    var band = pick(OPTIONS.band, cfg.band), expr = pick(OPTIONS.expression, cfg.expression);
    return '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shinobi avatar">' +
      hairBack(hairS, hairC) +
      outfit(pick(OPTIONS.outfit, cfg.outfit)) +
      '<path d="M86 150 h28 v22 h-28 Z" fill="' + skin + '" stroke="#1a1208" stroke-width="2.5"/>' +           // neck
      '<path d="M60 100 q0 -50 40 -50 q40 0 40 50 v22 q0 26 -22 38 q-10 6 -18 6 q-8 0 -18 -6 q-22 -12 -22 -38 Z" fill="' + skin + '" stroke="#1a1208" stroke-width="2.5"/>' + // head
      '<path d="M60 106 q-9 0 -9 9 q0 9 9 9 M140 106 q9 0 9 9 q0 9 -9 9" fill="' + skin + '" stroke="#1a1208" stroke-width="2.5"/>' + // ears
      '<path d="M66 112 q10 -16 34 -16 q24 0 34 16" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="6"/>' + // brow shadow
      eyes(pick(OPTIONS.eyes, cfg.eyes), expr) + brows(expr) +
      '<path d="M100 124 l-3 8 h5" fill="none" stroke="#1a1208" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' + // nose
      mouth(expr) +
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
