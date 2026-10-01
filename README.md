# Hidden Leaf Village — Naruto fan site

A static website themed around the Hidden Leaf Village (Konoha). It needs no build step.

`index.html` is the game-style **Village Select** menu: tilted menu items, a big title that re-animates letter by letter as you hover, and a music player along the bottom. Each item opens a part of the village in `village.html`:

| Menu | Location | What's there |
|---|---|---|
| Village Gate | `#village` | Landing page, village map, welcome scrolls |
| Ninja Training | `#training` | Training grounds, bell test, chakra control, taijutsu scrolls |
| Chūnin Exams | `#exams` | The three exam stages + an interactive "Question 10" |
| Missions | `#missions` | Mission desk at Hokage Tower — draw D–S rank missions, keep a log |
| Academy | `#academy` | Curriculum and hand-sign scrolls |
| Might Guy's Hall | `#guy` | Might Guy scrolls, Eight Gates, Springtime of Youth button, portrait gallery |

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

## Music

The player at the bottom of the menu reads its playlist from `PLAYLIST` in `js/menu.js`. The three tracks in `assets/music/` are short synthesized placeholder loops made for this prototype (royalty-free, no attribution needed). To use real music, drop the files into `assets/music/` and update the titles and paths in the playlist. Browsers only start audio after the first click or key press on the page.

## Publishing on GitHub Pages

1. Merge into the branch you want to publish (e.g. `main`).
2. In the repo, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, and select that branch with the `/ (root)` folder.
3. The site will be live at `https://<user>.github.io/chunin-exams/`.

All paths are relative, so the site works from the project subpath. The `.nojekyll` file stops GitHub from running Jekyll on the site.

## Local preview

```
python3 -m http.server 8000
# open http://localhost:8000
```
