(function () {
  "use strict";

  var IMG_ROOT = "assets/images/";
  var routes = Array.prototype.map.call(document.querySelectorAll(".location"), function (s) { return s.id; });
  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".menu-toggle");

  /* ---------- Routing: each menu option opens a part of the village ---------- */
  function show(route) {
    if (routes.indexOf(route) === -1) route = "village";
    routes.forEach(function (id) {
      var el = document.getElementById(id);
      var active = id === route;
      el.hidden = !active;
      if (active) {
        el.classList.remove("enter");
        void el.offsetWidth; // restart the entry animation
        el.classList.add("enter");
        document.title = el.dataset.title + " · Hidden Leaf Village";
      }
    });
    nav.querySelectorAll("a").forEach(function (a) {
      if (a.getAttribute("href") === "#" + route) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  /* ---------- Images: real art when present, illustrated placeholder otherwise ---------- */
  function probe(path, onLoad, onError) {
    var img = new Image();
    img.onload = function () { onLoad(img); };
    img.onerror = onError;
    img.src = IMG_ROOT + path;
  }

  document.querySelectorAll(".scene[data-image]").forEach(function (scene) {
    probe(scene.dataset.image, function (img) {
      scene.style.backgroundImage = "url('" + img.src + "')";
      scene.classList.add("has-photo");
    }, function () {});
  });

  document.querySelectorAll(".gallery[data-gallery]").forEach(function (gallery) {
    var items = (window.KONOHA_IMAGES || {})[gallery.dataset.gallery] || [];
    items.forEach(function (item) {
      var fig = document.createElement("figure");
      fig.className = "frame";
      var cap = document.createElement("figcaption");
      cap.textContent = item.caption;
      var placeholder = document.createElement("div");
      placeholder.className = "frame-placeholder";
      placeholder.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#leaf-symbol"/></svg>';
      var hint = document.createElement("code");
      hint.textContent = IMG_ROOT + item.src;
      placeholder.appendChild(hint);
      fig.appendChild(placeholder);
      fig.appendChild(cap);
      gallery.appendChild(fig);

      probe(item.src, function (img) {
        img.alt = item.caption;
        img.loading = "lazy";
        fig.replaceChild(img, placeholder);
      }, function () {});
    });
  });

  /* ---------- Scrolls unroll on click ---------- */
  document.querySelectorAll(".scroll:not(.open-always) > button.scroll-rod").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var scroll = btn.parentElement;
      var open = scroll.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Chūnin Exam: question 10 ---------- */
  var quizResult = document.querySelector(".quiz-result");
  document.querySelectorAll("[data-quiz]").forEach(function (b) {
    b.addEventListener("click", function () {
      quizResult.textContent = b.dataset.quiz === "take"
        ? "There is no tenth question. Your resolve was the answer — you pass the first exam!"
        : "You walked away. Your team fails this year. A shinobi must be willing to face the unknown.";
      quizResult.className = "quiz-result " + (b.dataset.quiz === "take" ? "pass" : "fail");
    });
  });

  /* ---------- Mission desk ---------- */
  var MISSIONS = {
    D: [
      ["Find the Runaway Cat", "A noble's beloved cat has escaped again. Retrieve it unharmed — beware the claws.", "Daimyō's wife", "5,000 ryō"],
      ["Weed the Vegetable Garden", "An elderly villager needs her field cleared before the harvest festival.", "Local farmer", "3,000 ryō"],
      ["Babysitting Duty", "Watch three academy-age children for an afternoon. Harder than it sounds.", "Merchant family", "4,000 ryō"]
    ],
    C: [
      ["Escort the Bridge Builder", "Protect a master builder on his journey home. Bandits only... probably.", "Bridge builder", "30,000 ryō"],
      ["Deliver a Sealed Scroll", "Carry an official document to an allied village's border post.", "Hokage Tower", "50,000 ryō"]
    ],
    B: [
      ["Track the Rogue Ninja", "A missing-nin was sighted near the eastern border. Locate and report.", "Intelligence Division", "150,000 ryō"],
      ["Guard the Festival", "Provide security for the Fire Country lantern festival.", "Feudal lord", "120,000 ryō"]
    ],
    A: [
      ["Retrieve the Stolen Forbidden Scroll", "A sealed jutsu scroll was taken from the archives. Recover it at any cost.", "Hokage", "600,000 ryō"],
      ["Protect the Daimyō", "Serve as bodyguard during a diplomatic summit.", "Fire Daimyō", "800,000 ryō"]
    ],
    S: [
      ["Confront the Cloaked Organization", "Intercept a pair of S-rank criminals before they reach the village.", "Hokage (classified)", "1,000,000+ ryō"]
    ]
  };
  var rank = "D";
  var current = null;
  var $ = function (sel) { return document.querySelector(sel); };

  function drawMission() {
    var list = MISSIONS[rank];
    var next;
    do { next = list[Math.floor(Math.random() * list.length)]; } while (list.length > 1 && next === current);
    current = next;
    $(".mission-rank").textContent = rank;
    $(".mission-title").textContent = current[0];
    $(".mission-desc").textContent = current[1];
    $(".mission-client").textContent = current[2];
    $(".mission-reward").textContent = current[3];
    $(".mission-status").textContent = "";
    var paper = $(".mission-scroll");
    paper.classList.remove("unfurl");
    void paper.offsetWidth;
    paper.classList.add("unfurl");
  }

  document.querySelectorAll(".rank-tabs [data-rank]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      rank = tab.dataset.rank;
      document.querySelectorAll(".rank-tabs [data-rank]").forEach(function (t) {
        t.setAttribute("aria-selected", String(t === tab));
      });
      current = null;
      drawMission();
    });
  });
  $("#draw-mission").addEventListener("click", drawMission);
  $("#accept-mission").addEventListener("click", function () {
    var log = $("#mission-log-list");
    var empty = log.querySelector(".empty");
    if (empty) empty.remove();
    var li = document.createElement("li");
    li.innerHTML = '<span class="badge rank-' + rank + '">' + rank + "</span> ";
    li.appendChild(document.createTextNode(current[0]));
    log.prepend(li);
    $(".mission-status").textContent = "Mission accepted. Report back to the desk when complete!";
  });
  drawMission();

  /* ---------- Springtime of Youth ---------- */
  var youth = 0;
  try { youth = parseInt(localStorage.getItem("youth") || "0", 10) || 0; } catch (e) {}
  var countEl = $("#youth-count");
  countEl.textContent = youth;
  $("#youth-btn").addEventListener("click", function (e) {
    youth += 1;
    countEl.textContent = youth;
    try { localStorage.setItem("youth", String(youth)); } catch (err) {}
    var burst = document.createElement("span");
    burst.className = "youth-burst";
    burst.textContent = ["YOUTH!", "👍", "✨", "DYNAMIC ENTRY!", "🔥"][youth % 5];
    burst.style.left = e.clientX + "px";
    burst.style.top = e.clientY + "px";
    document.body.appendChild(burst);
    setTimeout(function () { burst.remove(); }, 1000);
  });

  show(location.hash.slice(1));
})();
