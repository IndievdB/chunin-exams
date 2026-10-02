# Hidden Leaf Village — Naruto fan site

A static website themed around the Hidden Leaf Village (Konoha). It needs no build step.

`index.html` is the game-style **Hidden Leaf** menu: a big title that re-animates letter by letter as you hover, and a music player along the bottom. For now every destination opens an **Under Construction** overlay inside the menu page (so the music keeps playing); the built-out location pages live in `village.html` and can be linked back in by changing the menu `href`s in `index.html`:

| Menu | Route |
|---|---|
| Residence | `#residence` — your shinobi's room: rank, name/clan editing, stats, and the character creator |
| Academy | `#academy` — Iruka-sensei's Python fundamentals: lessons with auto-checked problems in an in-browser sandbox |
| Training Grounds | `#training` |
| Missions | `#missions` |
| Ninja Exams | `#exams` |
| Hokage Tower | `#hokage` |

The avatar is drawn as layered inline SVG (`js/avatar.js`): skin, hair style and colour, eyes, headband colour, outfit and markings, saved on the Firestore profile as an `avatar` map. Add new looks by extending `OPTIONS` and the matching draw function.

The earlier built-out sections in `village.html` (training, exams, missions, academy, Might Guy's hall) are still there to reuse as these pages are filled in.

## Adding the official artwork

No official images are included in the repo. Put the licensed art from VIZ Media in `assets/images/` at these paths (or edit the paths):

**Location backgrounds** — set by `data-image` in `index.html`:

```
assets/images/locations/konoha.jpg          Village Gate (Konoha overview / Hokage Rock)
assets/images/locations/training-ground.jpg Ninja Training
assets/images/locations/exam-arena.jpg      Chūnin Exams
assets/images/locations/hokage-tower.jpg    Missions
assets/images/locations/academy.jpg         Academy
assets/images/locations/guy-hall.jpg        Might Guy's Hall
```

**Gallery images**, including the six Might Guy portraits, are listed in `js/images.js`, each with a caption.

Until an image exists, the site shows an illustrated placeholder that names the file path it's waiting for. Once you add the file, it shows up automatically. Wide images (about 1600×600) work best for backgrounds, and 4:3 works best for gallery images.

## Shinobi accounts (Firebase)

On first visit the site asks you to sign in with **email and password** (or create an account), then for a Shinobi name and clan. Identity is **Firebase Auth**; the profile is stored in Firestore at `shinobi/{uid}` and syncs live. "Continue as guest" uses an anonymous account that lives in that browser only; a guest who later creates an account keeps their shinobi. Click your name in the ribbon to edit it or sign out.

Setup:
1. Create a project at console.firebase.google.com and add a **Web app**; copy its `firebaseConfig`.
2. Paste it into `js/firebase-config.js` (replace `null`).
3. In **Authentication → Sign-in method**, enable **Email/Password** and **Anonymous**.
4. In **Build → Firestore Database**, create a database, then paste `firestore.rules` into the **Rules** tab and publish.

Until a config is present the site runs in offline mode and keeps the profile in the browser's local storage. Both fit comfortably in Firebase's free Spark plan.

## Academy (Python lessons)

`js/lessons.js` holds the curriculum: topics (variables, lists, for/while loops, functions, classes, inheritance, imports, copies vs references), each with problems that have Iruka's dialogue, a task, starter code and a Python `check`. The check runs in the student's namespace after their code, with `_out` (what they printed) and `_src` (their source) available; raising `AssertionError("…")` fails with that message. Code runs in the browser via Pyodide, loaded from the jsDelivr CDN with the copy in `vendor/pyodide/` as a fallback. Solved problems are saved on the Firestore profile under `academy`.

## Music

Two playlists live in `PLAYLISTS` in `js/menu.js`: the village menu rotates through the `village` list and the Residence plays the `residence` list (Fooling Mode). Each area remembers its own track and position, so leaving the Residence resumes the village song where it left off. Tracks are in `assets/music/`. Browsers only start audio after the first click or key press on the page.

## Publishing on Render (free tier)

The repo includes a `render.yaml` blueprint that describes the site as a Render **Static Site** (no build step, publish the repo root).

1. Push to `main`.
2. In the Render dashboard choose **New → Blueprint**, pick this repository, and click **Apply**. Render reads `render.yaml` and creates the `hidden-leaf` static site.
   (Alternatively, **New → Static Site**, select the repo, leave the build command empty and set the publish directory to `.`.)
3. Render gives you a `https://hidden-leaf.onrender.com`-style URL and redeploys automatically on every push to `main`.

Static sites on Render's free tier are served from a CDN and don't spin down, so there's no cold start. All paths are relative, so the site also works under any subpath.

## Local preview

```
python3 -m http.server 8000
# open http://localhost:8000
```
