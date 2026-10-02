(function () {
  "use strict";

  /* ---------- Title that re-slams letter by letter on hover ---------- */
  var title = document.querySelector(".title");
  var blurb = document.querySelector(".blurb");
  var go = document.querySelector(".go");
  var items = Array.prototype.slice.call(document.querySelectorAll(".menu a"));
  var current = null;
  var swapTimer = null;
  var masterVolume = function () { return 1; }; // replaced once the player is set up

  // woodblock sound effects: clone so rapid hovers can overlap
  function sfx(id, vol) {
    var a = document.getElementById(id).cloneNode();
    a.volume = vol * masterVolume();
    a.play().catch(function () {});
  }

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
    fitTitle();
  }
  // shrink the title until its longest line fits the column
  function fitTitle() {
    title.style.setProperty("--fit", 1);
    var avail = title.parentElement.clientWidth;
    var widest = 0;
    title.querySelectorAll(".line").forEach(function (l) { widest = Math.max(widest, l.scrollWidth); });
    if (widest > avail) title.style.setProperty("--fit", Math.max(0.5, avail / widest));
  }
  window.addEventListener("resize", fitTitle);

  function select(item, instant) {
    if (item === current) return;
    if (!instant) sfx("sfx-hover", 0.5);
    current = item;
    items.forEach(function (a) { a.classList.toggle("active", a === item); });
    go.href = item.href;
    blurb.textContent = item.dataset.blurb;
    clearTimeout(swapTimer);

    var swap = function () { build(item.dataset.title); title.classList.remove("out"); };
    if (instant || !title.children.length) { swap(); return; }
    title.classList.add("out");           // old letters wash out...
    swapTimer = setTimeout(swap, 160);     // ...new ones brush in
  }
  function step(delta) {
    var idx = (items.indexOf(current) + delta + items.length) % items.length;
    select(items[idx]);
  }

  /* ---------- Under construction: every destination opens the overlay in-page,
     so the music keeps playing. Swap these for real links when the pages exist. */
  var uc = document.getElementById("uc");
  var ucWhere = document.querySelector(".uc-where");
  function openUC(item) {
    ucWhere.textContent = item.textContent;
    uc.hidden = false;
    document.querySelector(".uc-back").focus();
  }
  function closeUC() {
    uc.hidden = true;
    if (location.hash) history.replaceState(null, "", location.pathname);
    if (current) current.focus();
  }
  items.forEach(function (a) {
    a.addEventListener("mouseenter", function () { select(a); });
    a.addEventListener("focus", function () { select(a); });
    a.addEventListener("pointerdown", function () { sfx("sfx-select", 0.8); });
    a.addEventListener("click", function (e) { e.preventDefault(); select(a, true); history.replaceState(null, "", a.getAttribute("href")); openUC(a); });
  });
  go.addEventListener("pointerdown", function () { sfx("sfx-select", 0.8); });
  go.addEventListener("click", function (e) { e.preventDefault(); if (current) { history.replaceState(null, "", current.getAttribute("href")); openUC(current); } });
  document.querySelector(".uc-back").addEventListener("click", function (e) { e.preventDefault(); sfx("sfx-select", 0.8); closeUC(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !uc.hidden) closeUC(); });
  uc.addEventListener("click", function (e) { if (e.target === uc) closeUC(); });
  // keyboard: arrows cycle, Enter follows the active link
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT") return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      step(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && current && uc.hidden && document.activeElement.tagName !== "BUTTON") {
      sfx("sfx-select", 0.8);
      history.replaceState(null, "", current.getAttribute("href"));
      openUC(current);
    }
  });
  // deep link: #training etc. selects that item and opens its overlay
  var start = items.filter(function (a) { return a.getAttribute("href") === location.hash; })[0];
  select(start || items[0], true);
  if (start) openUC(start);

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
  var muteBtn = document.getElementById("mute");
  var volSlider = document.getElementById("vol");

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

  /* volume: slider + mute, remembered between visits */
  var savedVol = 0.7;
  try { savedVol = parseFloat(localStorage.getItem("volume")); if (!(savedVol >= 0 && savedVol <= 1)) savedVol = 0.7; } catch (e) {}
  function updateMuteIcon() {
    var v = audio.volume;
    muteBtn.classList.toggle("silent", v === 0);
    muteBtn.classList.toggle("low", v > 0 && v < 0.5);
    muteBtn.setAttribute("aria-pressed", String(audio.muted));
    muteBtn.setAttribute("aria-label", audio.muted ? "Unmute" : "Mute");
  }
  function applyVolume(v) {
    audio.volume = v;
    volSlider.value = Math.round(v * 100);
    if (v > 0) audio.muted = false;   // dragging the slider un-mutes
    updateMuteIcon();
    try { localStorage.setItem("volume", String(v)); } catch (e) {}
  }
  masterVolume = function () { return audio.muted ? 0 : audio.volume; };
  volSlider.addEventListener("input", function () { applyVolume(volSlider.value / 100); });
  muteBtn.addEventListener("click", function () {
    audio.muted = !audio.muted;
    updateMuteIcon();
  });
  applyVolume(savedVol);

  /* minimal player until the pointer comes near the bottom (or the player is focused) */
  var miniTimer = null;
  function setMini(on) { player.classList.toggle("mini", on); }
  document.addEventListener("pointermove", function (e) {
    var near = e.clientY > window.innerHeight - 150;
    clearTimeout(miniTimer);
    if (near) setMini(false);
    else miniTimer = setTimeout(function () { if (!player.contains(document.activeElement)) setMini(true); }, 900);
  });
  player.addEventListener("focusin", function () { setMini(false); });
  player.addEventListener("focusout", function () { miniTimer = setTimeout(function () { setMini(true); }, 1500); });
  setMini(true);

  /* remember track + position so a reload (or a future real page) resumes the music */
  function saveState() {
    try { localStorage.setItem("music", JSON.stringify({ track: track, t: audio.currentTime, playing: !audio.paused, loop: audio.loop })); } catch (e) {}
  }
  audio.addEventListener("timeupdate", function () { if (Math.floor(audio.currentTime) % 3 === 0) saveState(); });
  audio.addEventListener("pause", saveState);
  audio.addEventListener("play", saveState);
  window.addEventListener("pagehide", saveState);
  var resume = null;
  try { resume = JSON.parse(localStorage.getItem("music")); } catch (e) {}

  // Browsers block autoplay until the page is touched, so the first click
  // or key anywhere starts the music.
  function firstInteraction(e) {
    // a press on the player itself is handled by its own buttons
    if (e && e.target && player.contains(e.target)) return;
    if (audio.paused) audio.play().catch(function () {});
    document.removeEventListener("pointerdown", firstInteraction);
    document.removeEventListener("keydown", firstInteraction);
  }
  document.addEventListener("pointerdown", firstInteraction);
  document.addEventListener("keydown", firstInteraction);
  /* ---------- Shinobi login: account (email/password or guest), then profile ---------- */
  var S = window.Shinobi;
  var login = document.getElementById("login");
  var authForm = document.getElementById("auth-form");
  var profileForm = document.getElementById("profile-form");
  var authEmail = document.getElementById("auth-email");
  var authPw = document.getElementById("auth-pw");
  var loginName = document.getElementById("login-name");
  var loginClan = document.getElementById("login-clan");
  var who = document.getElementById("who");

  function err(form, msg) { form.querySelector(".login-error").textContent = msg || ""; }
  function busy(form, on) { form.setAttribute("aria-busy", String(on)); }
  function showWho(p) {
    who.hidden = !p;
    if (!p) return;
    who.querySelector(".who-name").textContent = p.name;
    who.querySelector(".who-clan").textContent = p.clan && p.clan !== "No clan" ? p.clan + " clan" : "";
    who.title = "Your shinobi";
  }
  function showAuth() {
    login.hidden = false; profileForm.hidden = true; authForm.hidden = false;
    err(authForm, ""); authPw.value = "";
    document.getElementById("login-mode").textContent = S.online ? "Synced with the village records" : "Offline mode: saved in this browser only";
    setTimeout(function () { authEmail.focus(); }, 50);
  }
  function showProfile(editing) {
    login.hidden = false; authForm.hidden = true; profileForm.hidden = false;
    err(profileForm, "");
    loginName.value = editing && S.profile ? S.profile.name : "";
    loginClan.value = editing && S.profile ? S.profile.clan : "";
    document.getElementById("profile-submit").textContent = editing ? "Save" : "Enter the village";
    document.getElementById("profile-cancel").hidden = !editing;
    var acct = S.user && S.user.email ? S.user.email : "Guest account";
    document.getElementById("login-account").textContent = acct;
    setTimeout(function () { loginName.focus(); }, 50);
  }
  function closeLogin() { login.hidden = true; }

  // step 1: account
  authForm.addEventListener("submit", function (e) { e.preventDefault(); doAuth("signin"); });
  authForm.addEventListener("click", function (e) {
    var act = e.target.closest("[data-act]") && e.target.closest("[data-act]").dataset.act;
    if (act && act !== "signin") { e.preventDefault(); doAuth(act); }
  });
  function doAuth(act) {
    var email = authEmail.value.trim(), pw = authPw.value;
    err(authForm, "");
    if (act === "guest") { busy(authForm, true); return S.guest().catch(function (x) { err(authForm, S.describe(x)); }).then(function () { busy(authForm, false); }); }
    if (!email) { err(authForm, "Enter your email address."); authEmail.focus(); return; }
    if (act === "reset") {
      busy(authForm, true);
      return S.resetPassword(email).then(function () { err(authForm, "Password reset email sent to " + email + "."); })
        .catch(function (x) { err(authForm, S.describe(x)); }).then(function () { busy(authForm, false); });
    }
    if (pw.length < 6) { err(authForm, "Password must be at least 6 characters."); authPw.focus(); return; }
    busy(authForm, true);
    sfx("sfx-select", 0.8);
    (act === "signup" ? S.signUp(email, pw) : S.signIn(email, pw))
      .catch(function (x) { err(authForm, S.describe(x)); })
      .then(function () { busy(authForm, false); });
  }

  // step 2: profile
  profileForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = loginName.value.trim().replace(/\s+/g, " ");
    var clan = loginClan.value.trim() || "No clan";
    if (name.length < 2) { err(profileForm, "A shinobi needs a name of at least two characters."); return; }
    busy(profileForm, true);
    sfx("sfx-select", 0.8);
    S.saveProfile(name, clan).then(function () { closeLogin(); showWho(S.profile || { name: name, clan: clan }); })
      .catch(function (x) { err(profileForm, S.describe(x)); })
      .then(function () { busy(profileForm, false); });
  });
  document.getElementById("profile-cancel").addEventListener("click", closeLogin);
  document.getElementById("profile-signout").addEventListener("click", function () {
    sfx("sfx-hover", 0.5);
    S.signOut().then(function () { showWho(null); showAuth(); });
  });
  who.addEventListener("click", function () { sfx("sfx-hover", 0.5); showProfile(true); });

  // react to auth / profile changes (sign-in from step 1 moves to step 2 or straight in)
  S.onChange(function () {
    if (!S.user) { showWho(null); if (!login.hidden || !document.hasFocus()) showAuth(); return; }
    if (S.profile) { showWho(S.profile); if (!authForm.hidden) closeLogin(); }
    else if (!login.hidden && !authForm.hidden) showProfile(false);
  });
  S.ready.then(function () {
    if (S.user && S.profile) showWho(S.profile);
    else if (S.user) showProfile(false);
    else showAuth();
  });

  if (resume && resume.track >= 0 && resume.track < PLAYLIST.length) {
    load(resume.track, false);
    audio.loop = !!resume.loop;
    loopBtn.setAttribute("aria-pressed", String(audio.loop));
    audio.addEventListener("loadedmetadata", function once() {
      audio.removeEventListener("loadedmetadata", once);
      if (resume.t && resume.t < audio.duration) audio.currentTime = resume.t;
      if (resume.playing) audio.play().catch(function () {});
    });
  } else {
    load(0, false);
  }
})();
