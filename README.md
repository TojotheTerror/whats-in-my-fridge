# What's in my fridge?

A small web app that turns what's in your fridge into meal ideas with full recipes. It's a single static page with no accounts, no server and no tracking. Your fridge list, favorites and shopping list stay on your own device (browser `localStorage`).

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
- **Build:** pick a protein, then up to 3 veggies, then see matching recipes. A recipe builder that writes a new recipe from your picks is planned (phase 2).
- **Recipes:** search and filter all recipes; ♥ to save favorites.
- **List:** one shopping list. Add your own items, or add missing ingredients from any recipe. Check items off, copy the list, or clear what's checked.
- **Recipe view:** servings 1/2/4/6 with scaled amounts, have/missing marks, and cook mode (one step at a time, keeps the screen on where supported).
- Dark mode by default, light mode if the phone is set to light, and a manual toggle.

## How it's built

```
src/vocab.json            allowed ingredient names + aliases ("cilantro" -> fresh herbs)
src/recipes/*.json        the recipes, one file per batch
src/app.html              v2 page template
src/app3.html             v3 page template
tests/validate_recipes.py recipe checker (must pass before a build)
build.py                  runs the checker, then inlines vocab + recipes into the templates
404.html                  redirects mistyped paths (e.g. /V3) to the right page
docs/                     changelog and user feedback log
```

`index.html`, `v2/index.html` and `v3/index.html` are **generated**. Edit `src/`, then run:

```
python3 build.py
```

The build stops if any recipe fails the checker. The checker requires:

- amounts, real steps and a time for every recipe
- every listed ingredient to actually appear in the steps
- a correct vegetarian flag
- USDA safe temperatures: 165°F for chicken and turkey, 160°F for ground beef and sausage, 145°F for pork chops
- a doneness cue for fish, shrimp, steak, bacon and eggs

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
