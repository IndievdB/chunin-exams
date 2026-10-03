# Hidden Leaf Village — Naruto fan site

A static website themed around the Hidden Leaf Village (Konoha). It needs no build step.

`index.html` is the game-style **Hidden Leaf** menu: a big title that re-animates letter by letter as you hover, and a music player along the bottom. For now every destination opens an **Under Construction** overlay inside the menu page (so the music keeps playing); the built-out location pages live in `village.html` and can be linked back in by changing the menu `href`s in `index.html`:

| Menu | Route |
|---|---|
| Residence | `#residence` — your shinobi's room: the Ninja Info Card (name, clan, rank), progress and rank-up tracker (`js/ranks.js`), and the character creator |
| Academy | `#academy` — Iruka-sensei's Python fundamentals: lessons with auto-checked problems in an in-browser sandbox |
| Training Grounds | `#training` — Rock Lee's data-structures dojo: hash maps, linked lists, stacks, queues, heaps, trees, graphs/grids, DP |
| Missions | `#missions` |
| Ninja Exams | `#exams` |
| Hokage Tower | `#hokage` — the Third Hokage's office: every shinobi's Ninja Info Card and progress. The admin account (email in `js/account.js`, enforced by `firestore.rules`) gets an **Admin** toggle to grant or remove progress per rank or per problem and to pin a rank |

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

## Dojos (Academy and Training Grounds)

Both lesson screens are instances of `js/dojo.js`, configured in `js/dojos.js` (background, teacher sprite, curriculum, profile field). The Academy uses `js/lessons.js` (Python fundamentals, Iruka) and the Training Grounds use `js/jutsu.js` (data structures, Rock Lee). Progress is saved on the profile under `academy` and `training`.

### The sandbox editor

The code box (`js/editor.js`) highlights Python, keeps indentation on Enter, turns tabs into four spaces (including pasted code), and indents or outdents every selected line with **Tab** / **Shift+Tab**. **Ctrl+Enter** runs. Whatever you type is saved per problem (in the browser and under `drafts` on your profile) so closing the panel or the tab loses nothing; **Clear** resets to the starter. **Show solution** opens a read-only solution beside your code instead of replacing it.

### Ask a sensei

Every problem has an **Ask a sensei** button: a chat where Kakashi, Jiraiya, Itachi, Ebisu, Konohamaru or Orochimaru answer questions about the task, your code or Python in their own (exaggerated) voice. They see the problem, your code and your last output, and are told to teach rather than hand over the answer unless you ask for it outright. Chats are saved per problem (profile subcollection `shinobi/{uid}/chats` plus the browser) so you can pick them up later.

The chat goes through a small server that holds the Anthropic API key, `server/sensei.js`:

1. `render.yaml` describes it as the `hidden-leaf-sensei` Node web service (free plan, so it sleeps when idle: the site pings it as soon as a dojo opens, and if an answer takes more than a few seconds the chat says the sensei is on the way; after ninety seconds it gives up and keeps the question in the box to resend). In Render set its environment variables: `ANTHROPIC_API_KEY`, `FIREBASE_WEB_API_KEY` (the `apiKey` from `js/firebase-config.js`, used to check that the caller is signed in), and `ALLOWED_ORIGIN` (the static site's URL).
2. Put the service URL in `window.SENSEI_URL` in `js/firebase-config.js`.
3. Locally: `cd server && npm install && ANTHROPIC_API_KEY=… node sensei.js` and the site on localhost will use it automatically (no sign-in check when `FIREBASE_WEB_API_KEY` is unset).

Teacher voices and the shared tutoring rules live in `server/teachers.js`.

## Academy (Python lessons)

`js/lessons.js` holds the curriculum in four ranks: **D Ninja History** (predict a snippet's output, then repair broken code), **C Weapon Handling** (one concept per problem, written from scratch), **B Chakra Control** (several concepts combined) and **A Tactics & Formation** (array problems that need a plan). Code problems have Iruka's dialogue, a task, an optional hint, a Python `check` and a `solution`; the check runs in the student's namespace with `_out` (printed text) and `_src` (source) available, and raising `AssertionError("…")` fails with that message. Multiple-choice problems have `code`, `question`, `choices`, `answer` and `explain`. Code runs in the browser via Pyodide (CDN, with `vendor/pyodide/` as fallback). Solved problems are saved on the Firestore profile under `academy`.

## Music

Playlists live in `PLAYLISTS` in `js/menu.js`: the village menu rotates through `village`, the Residence plays `residence`, the Academy plays `academy` and the Training Grounds play `training`. Each area remembers its own track and position and the music crossfades when you move between areas. Getting a question wrong in any dojo plays the Sadness and Sorrow clip over the ducked area music, which fades back when the clip ends or the next answer is right. Tracks are in `assets/music/`. Browsers only start audio after the first click or key press on the page.

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
