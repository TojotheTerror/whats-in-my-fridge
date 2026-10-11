# Changelog

Newest first. Every PR that changes behavior or content adds an entry here.

## Unreleased: v3 phase 2, Build a recipe (FUL-339)

- **Build → ✨ Build a recipe** is live and is now the default Build mode. She picks:
  1. a protein (18 options)
  2. up to 3 veggies (28 options)
  3. a cooking style (stir-fry, skillet, sheet-pan, pasta, tacos, rice bowl, soup or curry)
  4. a flavor (garlic & herb, Italian, Tex-Mex, soy & ginger, curry or lemon pepper)

  The page writes a full recipe from those picks: ingredients with amounts, steps in cooking order, total time, servings scaling, the shopping list and cook mode.
- **Combinations that don't work are greyed out, with the reason shown.** For example, salmon can't be made as soup, avocado is served raw so it can't be cooked in a sheet-pan dish, and the curry style always uses the curry flavor.
- **Built recipes behave like the curated ones.** They can be saved with ♥ and show up under Saved. Each has its own link, so a shared or bookmarked recipe opens the same way. "↺ Change my picks" goes back to the builder.
- Each built recipe also lists up to two **tested recipes like this** from the curated set.
- **Every combination is checked before a build.** `tests/validate_builder.py` composes all 162,375 combinations it covers and runs each one through:
  - the same recipe checker as the curated recipes: amounts, every ingredient used in the steps, vegetarian flag, USDA temperatures, doneness cues
  - builder-specific checks: harder vegetables go in before quicker ones, raw vegetables appear only at serving, and each recipe has a stable link and a sensible time

  The combinations covered are every protein × style × flavor with no veggies, each single veggie, every pair, and 150 fixed triples. `build.py` runs this check and refuses to build if it fails.
- Recipe logic lives in `src/builder.js`, which works in the browser and in Node.

## 2026-10-11: v3 feedback round 1 (PR #3, `b7d71f0`) (FUL-339)

Responds to the first round of user feedback (see `feedback.md`).

- **More veggies to pick in Build:** the picker now lists 28 vegetables, sorted A–Z, up from 16.
  - New ingredients: asparagus, kale, Brussels sprouts, eggplant, snap peas, butternut squash, bok choy, leeks.
  - Vegetables already in the recipes are now pickable too: celery, cherry tomatoes, cucumber, lettuce.
- **17 new recipes** that use the new veggies (158 total). Asparagus has 4, leeks has 1, and each of the other new vegetables has 2:
  - sheet-pan salmon and asparagus
  - lemon garlic chicken and asparagus
  - asparagus parmesan pasta
  - asparagus frittata
  - garlic kale
  - sausage, kale and potato soup
  - Brussels sprouts two ways
  - eggplant parmesan
  - garlic soy eggplant
  - shrimp and snap peas
  - beef and snap peas
  - butternut squash soup
  - sausage and butternut squash sheet pan
  - garlic bok choy
  - ginger chicken and bok choy
  - potato leek soup
- **List tab: "+ Add" box** to type your own items (comma-separated works). Items you add show "added by you".
- Docs: added `README.md`, `docs/CHANGELOG.md` and `docs/feedback.md`.
- Note: `/` (v2) is built from the same recipe files, so it also gains the 17 recipes when this merges.

## 2026-10-11: v3 phase 1 and phone 404 fix (PR #2, `1f9b1ef`)

- v3 at `/v3/` in design "C · Bold & playful", chosen by the user from three mockups.
- Bottom tabs: Fridge, Build, Recipes, List.
- Build: pick a protein category, then a protein, then up to 3 veggies, and see matching recipes.
- Favorites, a combined shopping list, cook mode, dark/light themes.
- `404.html`: mistyped paths like `/V3` redirect to the right page.

## 2026-10-11: v2 full recipes (PR #1, `5dc3c14`)

- 141 checked recipes with amounts, steps, time and servings.
- Servings scaling, filters, "things I usually have" staples, shopping-list copy.
- `/` serves v2. v1 moved to `/v1/`.

## 2026-10-11: v1 demo (`59d6a00`)

- First live page: type ingredients, get about 30 meal ideas with one-line methods.
