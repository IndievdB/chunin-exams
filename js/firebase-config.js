// Firebase web app config (Firebase console → Project settings → Your apps → Web).
// The apiKey is a public project identifier, not a secret; access is controlled by firestore.rules.
// Set this to null to run the site in offline mode (profile saved in this browser only).
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCezinNXgCIx04IoNw05MhBERAwNwmuTcc",
  authDomain: "chunin-exams.firebaseapp.com",
  projectId: "chunin-exams",
  storageBucket: "chunin-exams.firebasestorage.app",
  messagingSenderId: "891805765769",
  appId: "1:891805765769:web:b8380182df7b0a4dd67658",
  measurementId: "G-S58V1VX3PB"
};

// Ask Sensei server (server/sensei.js). Set this to the URL of the deployed "hidden-leaf-sensei"
// web service on Render, e.g. "https://hidden-leaf-sensei.onrender.com". Leave null to disable;
// on localhost the site falls back to http://localhost:8787.
window.SENSEI_URL = "https://hidden-leaf-sensei.onrender.com";
