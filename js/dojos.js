/* The two dojo instances. Must load after dojo.js, lessons.js and jutsu.js. */
window.Academy = window.Dojo({
  id: "academy", title: "Academy", kicker: "忍者学校",
  bg: "assets/images/locations/academy.jpg", sprite: "assets/images/characters/iruka.png",
  teacher: "Iruka-sensei", lessons: window.LESSONS, field: "academy",
  welcome: function (name) { return ["Welcome to the Academy, " + name + ".", "Four ranks of training, D through A. Start with D-rank history if you're new, or jump to where you are."]; }
});
window.Training = window.Dojo({
  id: "training", title: "Training Grounds", kicker: "第三演習場",
  bg: "assets/images/locations/training.jpg", sprite: "assets/images/characters/lee.png",
  teacher: "Rock Lee", lessons: window.JUTSU, field: "training",
  praise: "YES! That is the power of hard work!",
  welcome: function (name) { return [name + "! Welcome to Training Ground 3!", "Here we learn jutsu — the data structures every shinobi programmer needs. Hash maps, linked lists, stacks, queues, heaps, trees, graphs and dynamic programming.", "D-rank is hand seals, C is shape transformation, B is nature transformation, and A is combat practice. Let's go!"]; }
});
