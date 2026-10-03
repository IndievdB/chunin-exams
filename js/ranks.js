/* Shinobi ranks and progress, shared by the Residence and the dojos.
   Rank is earned by solving problems across every area (Academy + Training Grounds today;
   new areas add themselves to AREAS). window.Ranks = { TIERS, AREAS, progress(profile) } */
(function () {
  "use strict";
  var TIERS = [
    { name: "Student", jp: "生徒", at: 0 },
    { name: "Genin",   jp: "下忍", at: 0.2 },
    { name: "Chunin",  jp: "中忍", at: 0.5 },
    { name: "Jonin",   jp: "上忍", at: 0.8 },
    { name: "Kage",    jp: "影",   at: 1 }
  ];
  var AREAS = [
    { id: "academy",  title: "Academy",          kanji: "学", lessons: function () { return window.LESSONS || []; } },
    { id: "training", title: "Training Grounds", kanji: "修", lessons: function () { return window.JUTSU || []; } }
  ];
  var LOCKED = [
    { title: "Missions",     kanji: "任" },
    { title: "Ninja Exams",  kanji: "試" },
    { title: "Hokage Tower", kanji: "火" }
  ];

  function problemsOf(rank) { var r = []; rank.topics.forEach(function (t) { r = r.concat(t.problems); }); return r; }

  function progress(profile) {
    profile = profile || {};
    var total = 0, solved = 0;
    var areas = AREAS.map(function (a) {
      var done = profile[a.id] || {};
      var ranks = a.lessons().map(function (r) {
        var ps = problemsOf(r), n = ps.filter(function (p) { return done[p.id]; }).length;
        total += ps.length; solved += n;
        return { rank: r.rank, title: r.title, solved: n, total: ps.length };
      });
      var at = ranks.reduce(function (s, r) { return s + r.total; }, 0), sv = ranks.reduce(function (s, r) { return s + r.solved; }, 0);
      return { id: a.id, title: a.title, kanji: a.kanji, ranks: ranks, solved: sv, total: at };
    });
    var thresholds = TIERS.map(function (t) { return Math.ceil(t.at * total); });
    var tier = 0;
    for (var i = 0; i < TIERS.length; i++) if (solved >= thresholds[i]) tier = i;
    var next = tier + 1 < TIERS.length ? TIERS[tier + 1] : null;
    var need = next ? thresholds[tier + 1] - solved : 0;
    var span = next ? thresholds[tier + 1] - thresholds[tier] : 1;
    return {
      solved: solved, total: total, areas: areas, locked: LOCKED,
      rank: TIERS[tier], next: next, need: need,
      toNext: next ? (solved - thresholds[tier]) / span : 1,
      nextAt: next ? thresholds[tier + 1] : total
    };
  }
  window.Ranks = { TIERS: TIERS, AREAS: AREAS, progress: progress };
})();
