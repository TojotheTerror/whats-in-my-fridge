# Changelog

Newest first. Every PR that changes behavior or content adds an entry here.

## Unreleased: v3 feedback round 1 (FUL-339)

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
