#!/usr/bin/env python3
"""Validate every recipe in src/recipes/*.json against the schema and safety rules.

Usage: python3 tests/validate_recipes.py [files...]   (default: all batches)
Exit 1 on any error. Prints a summary of coverage.
"""
import json, re, sys, glob, os
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOCAB = json.load(open(os.path.join(ROOT, "src", "vocab.json")))["items"]
MEALS = {"breakfast", "lunch", "dinner", "snack"}
UNITS = {"", "cup", "tbsp", "tsp", "g", "lb", "oz", "clove", "can", "slice", "pinch", "piece", "bunch", "handful", "package", "ml", "inch"}
# Items that may be listed without being named in the steps (seasoning/cooking fat is often "season"/"heat oil").
SILENT_OK = {"salt", "black pepper", "vegetable oil", "olive oil"}
NONVEG = {k for k, v in VOCAB.items() if v["group"] in ("meat", "fish")} | {"chicken broth"}
# Must state an internal temperature (USDA) when present.
TEMP_REQUIRED = {"chicken breast": 165, "chicken thighs": 165, "ground turkey": 165,
                 "ground beef": 160, "sausage": 160, "pork chops": 145}
# Must state a visual doneness cue or a temperature.
CUE_REQUIRED = {"salmon", "white fish", "shrimp", "steak", "bacon", "eggs"}
CUE_RE = re.compile(r"opaque|flakes?|pink|°F|crisp|set\b|no longer runny|cooked through|firm|golden", re.I)
REQUIRED = ["id", "name", "meal", "cuisine", "minutes", "serves", "veg", "ingredients", "steps"]


def words_for(item):
    names = [item] + VOCAB[item]["aliases"]
    out = set()
    for n in names:
        out.add(n.lower())
        # accept the head noun too ("chicken breast" -> "chicken"; "canned tomatoes" -> "tomatoes")
        parts = n.lower().split()
        out.update(p for p in parts if len(p) > 3 and p not in {"canned", "fresh", "frozen", "ground", "white", "green", "heavy", "sour", "cream"})
    out.update({w.rstrip("s") for w in list(out) if len(w) > 4})
    return out


def check(r, where):
    errs = []
    e = lambda m: errs.append(f"{where} [{r.get('id','?')}] {m}")
    for k in REQUIRED:
        if k not in r:
            e(f"missing field {k}")
    if errs:
        return errs
    if not re.fullmatch(r"[a-z0-9-]+", r["id"]): e("id must be kebab-case")
    if not set(r["meal"]) or not set(r["meal"]) <= MEALS: e(f"bad meal {r['meal']}")
    if not (isinstance(r["minutes"], int) and 1 <= r["minutes"] <= 240): e("minutes must be int 1..240")
    if not (isinstance(r["serves"], int) and 1 <= r["serves"] <= 12): e("serves must be int 1..12")
    if not isinstance(r["veg"], bool): e("veg must be bool")
    if len(r["steps"]) < 2: e("needs >=2 steps")
    if any(not isinstance(s, str) or len(s) < 15 for s in r["steps"]): e("each step must be a sentence")
    steps = " ".join(r["steps"]).lower()
    items = []
    for ing in r["ingredients"]:
        it = ing.get("item")
        if it not in VOCAB:
            e(f"unknown item '{it}' (add to vocab or use an existing key)"); continue
        items.append(it)
        q, u = ing.get("qty"), ing.get("unit", "")
        if u not in UNITS: e(f"{it}: bad unit '{u}'")
        if q is None:
            if it not in SILENT_OK and it not in {"fresh herbs", "hot sauce", "red pepper flakes"} and not ing.get("optional"):
                e(f"{it}: qty required (null only for to-taste seasonings/optional)")
        elif not (isinstance(q, (int, float)) and 0 < q <= 100):
            e(f"{it}: qty must be a positive number")
        if it not in SILENT_OK and not any(w in steps for w in words_for(it)):
            e(f"ingredient '{it}' never mentioned in steps")
    if len(items) != len(set(items)): e("duplicate ingredient item")
    if len(items) < 2: e("needs >=2 ingredients")
    if r["veg"]:
        bad = [i for i in items if i in NONVEG and not (i == "chicken broth" and "vegetable" in json.dumps(r).lower())]
        if bad: e(f"veg=true but contains {bad}")
    else:
        if not any(i in NONVEG for i in items): e("veg=false but no meat/fish/broth (set veg true?)")
    for it, t in TEMP_REQUIRED.items():
        if it in items and f"{t}°f" not in steps:
            e(f"{it} requires internal temp '{t}°F' in steps")
    for it in CUE_REQUIRED:
        if it in items and not CUE_RE.search(" ".join(r["steps"])):
            e(f"{it} requires a doneness cue in steps")
    return errs


def main(files):
    errs, all_r = [], []
    for f in files:
        try:
            data = json.load(open(f))
        except Exception as ex:
            errs.append(f"{f}: invalid JSON: {ex}"); continue
        for r in data:
            errs += check(r, os.path.basename(f)); all_r.append(r)
    ids = Counter(r.get("id") for r in all_r); names = Counter(r.get("name", "").lower() for r in all_r)
    errs += [f"duplicate id {k}" for k, n in ids.items() if n > 1]
    errs += [f"duplicate name {k}" for k, n in names.items() if n > 1]
    for x in errs: print("ERROR", x)
    meal = Counter(m for r in all_r for m in r.get("meal", []))
    print(f"\n{len(all_r)} recipes, {len(errs)} errors")
    print("meals:", dict(meal))
    print("cuisines:", dict(Counter(r.get("cuisine") for r in all_r)))
    print("veg:", sum(1 for r in all_r if r.get("veg")), "quick<=20:", sum(1 for r in all_r if r.get("minutes", 99) <= 20))
    return 1 if errs else 0


if __name__ == "__main__":
    fs = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, "src", "recipes", "*.json")))
    sys.exit(main(fs))
