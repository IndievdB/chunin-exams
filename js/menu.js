(function () {
  "use strict";

  /* ---------- Title that re-slams letter by letter on hover ---------- */
  var title = document.querySelector(".title");
  var blurb = document.querySelector(".blurb");
  var go = document.querySelector(".go");
  var arrows = { up: document.getElementById("arrow-up"), down: document.getElementById("arrow-down") };
  var items = Array.prototype.slice.call(document.querySelectorAll(".menu a"));
  var current = null;
  var swapTimer = null;

  function build(text) {
    title.innerHTML = "";
    var i = 0;
    text.split("|").forEach(function (lineText) {
      var line = document.createElement("span");
      line.className = "line";
      Array.prototype.forEach.call(lineText, function (c) {
        var ch = document.createElement("span");
        ch.className = "ch";
        ch.textContent = c;
        ch.style.setProperty("--d", (i * 40) + "ms"); // staggered brush-in
        line.appendChild(ch);
        i++;
      });
      title.appendChild(line);
    });
  }

  function select(item, instant) {
    if (item === current) return;
    var dir = items.indexOf(item) > items.indexOf(current) ? "down" : "up";
    current = item;
    items.forEach(function (a) { a.classList.toggle("active", a === item); });
    go.href = item.href;
    blurb.textContent = item.dataset.blurb;
    clearTimeout(swapTimer);

    var swap = function () { build(item.dataset.title); title.classList.remove("out"); };
    if (instant || !title.children.length) { swap(); return; }
    arrows[dir].classList.remove("bump"); void arrows[dir].offsetWidth; arrows[dir].classList.add("bump");
    title.classList.add("out");           // old letters wash out...
    swapTimer = setTimeout(swap, 160);     // ...new ones brush in
  }
  function step(delta) {
    var idx = (items.indexOf(current) + delta + items.length) % items.length;
    select(items[idx]);
  }

  items.forEach(function (a) {
    a.addEventListener("mouseenter", function () { select(a); });
    a.addEventListener("focus", function () { select(a); });
  });
  arrows.up.addEventListener("click", function () { step(-1); });
  arrows.down.addEventListener("click", function () { step(1); });
  // keyboard: arrows cycle, Enter follows the active link
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      step(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && current && document.activeElement.tagName !== "BUTTON") {
      location.href = current.href;
    }
  });
  select(items[0], true);

  /* ---------- Music player ---------- */
  // Placeholder loops generated for this prototype (royalty-free). Swap the
  // files in assets/music/ and update this list when the real tracks arrive.
  var PLAYLIST = [
    { title: "Village at Dawn",   src: "assets/music/village-dawn.mp3" },
    { title: "Training Grounds",  src: "assets/music/training-grounds.mp3" },
    { title: "Exam Tension",      src: "assets/music/exam-tension.mp3" }
  ];
  var audio = document.getElementById("audio");
  var player = document.querySelector(".player");
  var playBtn = document.getElementById("play");
  var loopBtn = document.getElementById("loop");
  var nameEl = document.querySelector(".track-name");
  var bar = document.querySelector(".progress .bar");
  var progress = document.getElementById("progress");
  var timeEl = document.getElementById("time");
  var track = 0;

  function fmt(s) {
    if (!isFinite(s)) return "0:00";
    s = Math.floor(s);
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }
  function load(i, autoplay) {
    track = (i + PLAYLIST.length) % PLAYLIST.length;
    audio.src = PLAYLIST[track].src;
    nameEl.textContent = PLAYLIST[track].title;
    if (autoplay) audio.play().catch(function () {});
  }
  function setPlaying(on) {
    player.classList.toggle("playing", on);
    playBtn.textContent = on ? "❚❚" : "▶";
    playBtn.setAttribute("aria-label", on ? "Pause" : "Play");
  }

  playBtn.addEventListener("click", function () { audio.paused ? audio.play() : audio.pause(); });
  document.getElementById("prev").addEventListener("click", function () {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    load(track - 1, !audio.paused);
  });
  document.getElementById("next").addEventListener("click", function () { load(track + 1, !audio.paused); });
  loopBtn.addEventListener("click", function () {
    audio.loop = !audio.loop;
    loopBtn.setAttribute("aria-pressed", String(audio.loop));
  });
  audio.addEventListener("play", function () { setPlaying(true); });
  audio.addEventListener("pause", function () { setPlaying(false); });
  audio.addEventListener("ended", function () { if (!audio.loop) load(track + 1, true); });
  audio.addEventListener("timeupdate", function () {
    var pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    bar.style.width = pct + "%";
    progress.setAttribute("aria-valuenow", Math.round(pct));
    timeEl.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
  });
  audio.addEventListener("loadedmetadata", function () { timeEl.textContent = "0:00 / " + fmt(audio.duration); });
  progress.addEventListener("click", function (e) {
    var r = progress.getBoundingClientRect();
    if (audio.duration) audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });
  progress.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") audio.currentTime += 5;
    if (e.key === "ArrowLeft") audio.currentTime -= 5;
  });

  // Browsers block autoplay until the page is touched, so the first click
  // or key anywhere starts the music.
  function firstInteraction() {
    if (audio.paused) audio.play().catch(function () {});
    document.removeEventListener("pointerdown", firstInteraction);
    document.removeEventListener("keydown", firstInteraction);
  }
  document.addEventListener("pointerdown", firstInteraction);
  document.addEventListener("keydown", firstInteraction);
  load(0, false);
})();
