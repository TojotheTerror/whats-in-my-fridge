# What's in my fridge?

A small web app that turns what's in your fridge into meal ideas with full recipes. It's a single static page with no accounts, no server and no tracking. Your fridge list, favorites and shopping list stay on your own device (browser `localStorage`). When v3 is opened from Telegram, they are also backed up to Telegram's cloud storage for the bot (see [Inside Telegram](#inside-telegram)).

- **Live:** https://tojotheterror.github.io/whats-in-my-fridge/
- **Newest version (v3):** https://tojotheterror.github.io/whats-in-my-fridge/v3/

| Path | Version | Status |
|---|---|---|
| `/` | v2: full recipes, single screen | current main link |
| `/v3/` | v3: bold design, tabs, build-a-meal, list, cook mode | being tested by its user |
| `/v2/` | same file as `/` | kept for old links |
| `/v1/` | first demo | kept for rollback |

## What it does (v3)

- **Fridge:** type what you have and get recipes you can make now, plus ones that need only 1–2 more things.
- **Build:** pick a protein, up to 3 veggies, a cooking style and a flavor, and **✨ Build a recipe** writes a full recipe from those picks. Or switch to **🔎 Matching recipes** to see the curated recipes that use your protein and veggies.
- **Recipes:** search and filter all recipes; ♥ to save favorites.
- **List:** one shopping list. Add your own items, or add missing ingredients from any recipe. Check items off, copy the list, or clear what's checked.
- **Recipe view:** servings 1/2/4/6 with scaled amounts, have/missing marks, and cook mode (one step at a time, keeps the screen on where supported).
- Dark mode by default, light mode if the phone is set to light, and a manual toggle.
- **Works offline:** after the first visit, v3 opens with no signal (for example in a store basement), with the saved list. See [Offline](#offline).

### Inside Telegram

v3 also runs as a Telegram Mini App (opened from the bot's menu button). The page only loads Telegram's script (`telegram-web-app.js`) when Telegram's launch parameters (`tgWebAppData`, `tgWebAppPlatform` or `tgWebAppVersion`) are in the URL. In a normal browser, no request goes to telegram.org. Inside Telegram:

- The app opens full height and the swipe-down-to-close gesture is turned off.
- Telegram's header and background colors match the page.
- Light/dark follows Telegram's own theme unless she has picked one with the 🌗 button.
- Telegram's back button closes cook mode first, then the open recipe. It's hidden when nothing is open.
- Taps use Telegram's haptic feedback.
- Saved data is backed up to Telegram's cloud. See [Telegram cloud backup](#telegram-cloud-backup).

Telegram's launch parameters are stored in the URL hash, which the app also uses for recipe links (`#recipe-id`). The app never treats those parameters as a recipe id. It also saves a copy of them at startup, so opening a recipe (which changes the hash) doesn't break the Telegram connection.

### Telegram cloud backup

Inside Telegram (Bot API 6.9 or newer), the app mirrors its saved data into [Telegram CloudStorage](https://core.telegram.org/bots/webapps#cloudstorage). That storage belongs to her Telegram account and this bot. It covers the fridge, staples, favorites, shopping list and settings (theme, filters). The open tab is not synced. There is no new screen or button.

- **Why:** Telegram's in-app browser keeps its own storage. A Telegram "clear cache" can wipe it. With the backup, her data comes back, and she sees the same data on any phone where she opens the app from Telegram.
- **When it writes:** about 1 second after a change, and right away when she leaves the app. Every change records an `updatedAt` time.
- **On start:** the app shows the data on the phone right away. Then it reads the cloud (it waits at most 3 s, and errors are ignored). The rules:
  - If this phone has no saved data, the cloud copy is used.
  - If both have data, the newer `updatedAt` wins (last write wins).
  - An empty cloud copy never replaces data on the phone. In that case the phone's data is uploaded.
  - If the cloud copy is half-written, for example because another phone is saving at that moment, it is not used. An empty phone never uploads over it.
- **Format:** CloudStorage values are limited to 4096 characters. Each field (`fridge`, `staples`, `favs`, `list`, `prefs`) is stored as ASCII JSON in 4000-character chunks (`list_0`, `list_1`, …). A `manifest` key holds the format version, `updatedAt`, and each field's chunk count and length. It is written last.

**Chrome vs Telegram:** Chrome can't see this backup. Chrome has no Telegram identity, so a list made in Chrome stays in Chrome, and a list made in Telegram stays in Telegram (plus its cloud backup). They are two separate copies. In plain Chrome the app makes no CloudStorage calls and sends no request to telegram.org.

## Offline

`v3/sw.js` is a service worker for `/v3/` only. Its scope is the `v3/` folder, so `/` and `/v2/` are not affected.

- The page (`./` and `./index.html`) is served from the phone's cache right away. A fresh copy is then fetched in the background. A new deploy therefore shows up the next time the app is opened. There is no "update available" prompt.
- The cache name includes a hash of the built page, for example `fridge-v3-` plus 12 hex digits. `build.py` creates the hash. When a new version activates, older `fridge-v3-*` caches are deleted.
- Nothing with a query string is stored, since Telegram can put launch data there. The page is always stored under its plain URL. The only other site's file that is cached is Telegram's `telegram-web-app.js`, so the Telegram features also work offline.
- The page registers the worker only where browsers allow it (HTTPS, with service worker support). If registration fails, the app works as before, just without offline support.

## How it's built

```
src/vocab.json            allowed ingredient names + aliases ("cilantro" -> fresh herbs)
src/recipes/*.json        the recipes, one file per batch
src/app.html              v2 page template
src/app3.html             v3 page template
src/sw3.js                v3 offline service worker template (build.py fills in the cache version)
src/builder.js            build-a-meal recipe composer (browser + Node)
tests/validate_recipes.py recipe checker (must pass before a build)
tests/validate_builder.py composes every builder combination and checks each one
tests/dump_builder.js     Node helper used by validate_builder.py
build.py                  runs the checker, then inlines vocab + recipes into the templates
404.html                  redirects mistyped paths (e.g. /V3) to the right page
docs/                     changelog and user feedback log
```

`index.html`, `v2/index.html`, `v3/index.html` and `v3/sw.js` are **generated**. Edit `src/`, then run:

```
python3 build.py
```

The build stops if any curated recipe or any builder combination fails its checks. The builder check needs `node` on the PATH; Node 18 or newer works. The checker requires:

- amounts, real steps and a time for every recipe
- every listed ingredient to actually appear in the steps
- a correct vegetarian flag
- USDA safe temperatures: 165°F for chicken and turkey, 160°F for ground beef and sausage, 145°F for pork chops
- a doneness cue for fish, shrimp, steak, bacon and eggs

### How the recipe builder works

`src/builder.js` holds four tables. Every built recipe is assembled from them:

- **Proteins:** amount, how it's cut, how long it takes in a pan, oven or pot, and its doneness cue (with USDA temperature), plus the cooking styles it suits.
- **Veggies:** amount, how it's cut, and a cooking class: hard, medium, quick or raw. The class sets cooking order and time. Raw veggies are only used as toppings.
- **Styles:** stir-fry, skillet, sheet-pan, pasta, tacos, rice bowl, soup and curry. Each style has its own step template.
- **Flavors:** aromatics, spices, sauce and finish, plus the styles each flavor suits.

To add a protein, veggie, style or flavor:

1. Add it to the table.
2. Add any new ingredient to `src/vocab.json`.
3. Run `python3 tests/validate_builder.py --show 10`. Fix any errors, then read the sample recipes it prints.

### Adding recipes or ingredients

1. Add any new ingredient to `src/vocab.json`, with aliases people might type.
2. Add recipes to a file in `src/recipes/`, following the schema in `src/recipes/00-example.json`.
3. Run `python3 build.py` until it reports 0 errors.
4. Open a PR. Note the change in `docs/CHANGELOG.md`.

## How changes ship

1. Work happens on a branch, then a PR.
2. For a preview, GitHub Pages can temporarily publish from the branch.
3. Each PR is checked:
   - recipe checker: 0 errors
   - browser checks at phone width (390 px)
   - read-back of the live URL after deploy
4. The owner approves the merge. Pages then publishes from `main` again.

## Documentation upkeep

Every PR that changes behavior or content updates `docs/CHANGELOG.md` in the same PR. User feedback is logged in `docs/feedback.md` with what was changed in response. Work is tracked in Linear: FUL-338 (v2), FUL-339 (v3) and FUL-337 (the future receipt-to-recipes app).
