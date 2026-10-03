/* Shinobi accounts: Firebase Auth (email/password, with anonymous "guest" accounts)
   + a Firestore profile document at shinobi/{uid}.
   Exposes window.Shinobi with: ready (Promise), user, profile, online,
   signIn(email, pw), signUp(email, pw), guest(), resetPassword(email), saveProfile(name, clan), signOut(), onChange(fn).
   Falls back to localStorage when FIREBASE_CONFIG is null so the site still works. */
(function () {
  "use strict";
  var LS_KEY = "shinobi-profile";
  var listeners = [];
  var api = { user: null, profile: null, online: false, onChange: function (fn) { listeners.push(fn); } };
  function emit() { listeners.forEach(function (fn) { fn(api); }); }

  function localMode(resolve) {
    try { api.profile = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {}
    api.user = api.profile ? { isAnonymous: true } : null;
    var ok = function () { return Promise.resolve(); };
    api.signIn = api.signUp = api.guest = function () { api.user = { isAnonymous: true }; emit(); return ok(); };
    api.resetPassword = ok;
    api.saveProgress = function (field, problemId) {
      var ac = Object.assign({}, (api.profile && api.profile[field]) || {}); ac[problemId] = true;
      var patch = {}; patch[field] = ac;
      api.profile = Object.assign({}, api.profile || {}, patch);
      try { localStorage.setItem(LS_KEY, JSON.stringify(api.profile)); } catch (e) {}
      emit(); return ok();
    };
    api.saveAcademy = function (id) { return api.saveProgress("academy", id); };
    api.saveDraft = function (field, problemId, code) {
      var d = Object.assign({}, (api.profile && api.profile.drafts) || {}); var f = Object.assign({}, d[field] || {}); f[problemId] = code; d[field] = f;
      api.profile = Object.assign({}, api.profile || {}, { drafts: d });
      try { localStorage.setItem(LS_KEY, JSON.stringify(api.profile)); } catch (e) {}
      return ok();
    };
    api.saveChat = function (key, data) { try { localStorage.setItem("chat:" + key, JSON.stringify(data)); } catch (e) {} return ok(); };
    api.loadChat = function (key) { try { return Promise.resolve(JSON.parse(localStorage.getItem("chat:" + key))); } catch (e) { return Promise.resolve(null); } };
    api.idToken = function () { return Promise.resolve(null); };
    api.saveAvatar = function (avatar) {
      api.profile = Object.assign({}, api.profile || {}, { avatar: avatar });
      try { localStorage.setItem(LS_KEY, JSON.stringify(api.profile)); } catch (e) {}
      emit(); return ok();
    };
    api.saveProfile = function (name, clan) {
      api.profile = Object.assign({}, api.profile || {}, { name: name, clan: clan });
      try { localStorage.setItem(LS_KEY, JSON.stringify(api.profile)); } catch (e) {}
      emit(); return ok();
    };
    api.signOut = function () {
      api.user = null; api.profile = null;
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      emit(); return ok();
    };
    resolve(api);
  }

  api.ready = new Promise(function (resolve) {
    if (!window.FIREBASE_CONFIG) return localMode(resolve);
    Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
    ]).then(function (m) {
      var appMod = m[0], A = m[1], F = m[2];
      var app = appMod.initializeApp(window.FIREBASE_CONFIG);
      var auth = A.getAuth(app);
      var db = F.getFirestore(app);
      var unsub = null, first = true;
      api.online = true;

      function watchProfile(uid) {
        if (unsub) { unsub(); unsub = null; }
        unsub = F.onSnapshot(F.doc(db, "shinobi", uid), function (snap) {
          api.lastError = null;
          api.profile = snap.exists() ? snap.data() : null;
          emit();
          if (first) { first = false; resolve(api); }
        }, function (e) {
          // read failed (usually Firestore rules): surface it instead of stalling
          api.profile = null; api.lastError = e; emit();
          if (first) { first = false; resolve(api); }
        });
      }

      api.signIn = function (email, pw) { return A.signInWithEmailAndPassword(auth, email, pw); };
      api.signUp = function (email, pw) {
        // a guest who registers keeps their uid (and therefore their shinobi)
        if (auth.currentUser && auth.currentUser.isAnonymous) {
          return A.linkWithCredential(auth.currentUser, A.EmailAuthProvider.credential(email, pw));
        }
        return A.createUserWithEmailAndPassword(auth, email, pw);
      };
      api.guest = function () { return A.signInAnonymously(auth); };
      api.resetPassword = function (email) { return A.sendPasswordResetEmail(auth, email); };
      api.saveProfile = function (name, clan) {
        return F.setDoc(F.doc(db, "shinobi", auth.currentUser.uid),
          { name: name, clan: clan, email: auth.currentUser.email || null, updatedAt: F.serverTimestamp() }, { merge: true });
      };
      api.saveAvatar = function (avatar) {
        return F.setDoc(F.doc(db, "shinobi", auth.currentUser.uid), { avatar: avatar, updatedAt: F.serverTimestamp() }, { merge: true });
      };
      api.saveProgress = function (field, problemId) {
        var patch = { updatedAt: F.serverTimestamp() }; patch[field + "." + problemId] = true;
        return F.updateDoc(F.doc(db, "shinobi", auth.currentUser.uid), patch);
      };
      api.saveAcademy = function (id) { return api.saveProgress("academy", id); };
      // editor drafts live on the profile under drafts.<field>.<problemId>
      api.saveDraft = function (field, problemId, code) {
        var d = {}; d[field] = {}; d[field][problemId] = code;
        return F.setDoc(F.doc(db, "shinobi", auth.currentUser.uid), { drafts: d }, { merge: true });
      };
      // Ask-sensei chats are a subcollection so they don't bloat the profile document
      api.saveChat = function (key, data) {
        try { localStorage.setItem("chat:" + key, JSON.stringify(data)); } catch (e) {}
        return F.setDoc(F.doc(db, "shinobi", auth.currentUser.uid, "chats", key), Object.assign({}, data, { updatedAt: F.serverTimestamp() }));
      };
      api.loadChat = function (key) {
        return F.getDoc(F.doc(db, "shinobi", auth.currentUser.uid, "chats", key)).then(function (snap) {
          if (snap.exists()) return snap.data();
          try { return JSON.parse(localStorage.getItem("chat:" + key)); } catch (e) { return null; }
        }, function () { try { return JSON.parse(localStorage.getItem("chat:" + key)); } catch (e) { return null; } });
      };
      api.idToken = function () { return auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null); };
      api.signOut = function () { return A.signOut(auth); };

      A.onAuthStateChanged(auth, function (u) {
        api.user = u ? { uid: u.uid, email: u.email, isAnonymous: u.isAnonymous } : null;
        if (u) watchProfile(u.uid);
        else {
          if (unsub) { unsub(); unsub = null; }
          api.profile = null; emit();
          if (first) { first = false; resolve(api); }
        }
      });
    }).catch(function () { localMode(resolve); });
  });

  // Friendly text for Firebase auth error codes
  api.describe = function (err) {
    var code = (err && err.code) || "";
    if (code.indexOf("invalid-email") >= 0) return "That email address doesn't look right.";
    if (code.indexOf("email-already-in-use") >= 0 || code.indexOf("credential-already-in-use") >= 0) return "That email is already registered. Try signing in instead.";
    if (code.indexOf("weak-password") >= 0) return "Password must be at least 6 characters.";
    if (code.indexOf("invalid-credential") >= 0 || code.indexOf("wrong-password") >= 0 || code.indexOf("user-not-found") >= 0) return "Wrong email or password.";
    if (code.indexOf("too-many-requests") >= 0) return "Too many attempts. Wait a moment and try again.";
    if (code.indexOf("network") >= 0) return "Can't reach the village records. Check your connection.";
    if (code.indexOf("operation-not-allowed") >= 0) return "This sign-in method isn't enabled in Firebase.";
    if (code.indexOf("permission-denied") >= 0) return "The village records refused access (Firestore rules). Check that the rules from firestore.rules are published.";
    if (code.indexOf("not-found") >= 0) return "The village records database was not found. Check the Firestore database exists and is named (default).";
    return "Something went wrong: " + (code || (err && err.message) || "unknown error");
  };
  window.Shinobi = api;
})();
