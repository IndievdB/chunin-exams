/* Shinobi accounts: Firebase anonymous auth + a Firestore profile document.
   Exposes window.Shinobi = { ready (Promise), profile, save(name, clan), signOut() }.
   Falls back to localStorage when FIREBASE_CONFIG is null so the site still works. */
(function () {
  "use strict";
  var LS_KEY = "shinobi-profile";
  var listeners = [];
  var api = { profile: null, online: false, onChange: function (fn) { listeners.push(fn); } };
  function emit() { listeners.forEach(function (fn) { fn(api.profile); }); }

  function localLoad() { try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { return null; } }
  function localSave(p) { try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch (e) {} }

  api.ready = new Promise(function (resolve) {
    if (!window.FIREBASE_CONFIG) {
      api.profile = localLoad();
      api.save = function (name, clan) { api.profile = { name: name, clan: clan }; localSave(api.profile); emit(); return Promise.resolve(); };
      api.signOut = function () { api.profile = null; try { localStorage.removeItem(LS_KEY); } catch (e) {} emit(); return Promise.resolve(); };
      resolve(api); return;
    }
    Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
    ]).then(function (m) {
      var appMod = m[0], authMod = m[1], fsMod = m[2];
      var app = appMod.initializeApp(window.FIREBASE_CONFIG);
      var auth = authMod.getAuth(app);
      var db = fsMod.getFirestore(app);
      var user = null, unsub = null;
      api.online = true;

      function watchProfile() {
        if (unsub) unsub();
        unsub = fsMod.onSnapshot(fsMod.doc(db, "shinobi", user.uid), function (snap) {
          api.profile = snap.exists() ? snap.data() : null;
          emit();
          resolve(api);
        }, function () { resolve(api); });
      }
      api.save = function (name, clan) {
        return fsMod.setDoc(fsMod.doc(db, "shinobi", user.uid),
          { name: name, clan: clan, updatedAt: fsMod.serverTimestamp() }, { merge: true });
      };
      api.signOut = function () {
        api.profile = null; emit();
        return authMod.signOut(auth).then(function () { return authMod.signInAnonymously(auth); });
      };
      authMod.onAuthStateChanged(auth, function (u) {
        if (u) { user = u; watchProfile(); }
        else authMod.signInAnonymously(auth).catch(function () { resolve(api); });
      });
    }).catch(function () {
      // SDK failed to load (offline?) — degrade to local mode
      api.profile = localLoad();
      api.save = function (name, clan) { api.profile = { name: name, clan: clan }; localSave(api.profile); emit(); return Promise.resolve(); };
      api.signOut = function () { api.profile = null; emit(); return Promise.resolve(); };
      resolve(api);
    });
  });
  window.Shinobi = api;
})();
