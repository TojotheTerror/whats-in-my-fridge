#!/usr/bin/env python3
"""Validate every build-a-meal combination.

Runs tests/dump_builder.js (Node) to compose every valid {protein, style, flavor, veggies}
selection, then applies:
  - the same per-recipe checks as the curated recipes (validate_recipes.check): schema,
    amounts, every ingredient named in the steps, veg flag, USDA temps, doneness cues;
  - builder-specific checks: veggie order (hard -> medium -> quick), raw veggies only in the
    final serving step, id round-trip, sane total time, no leftover template text.
Exit 1 on any failure. Prints a few sample recipes with --show N.
"""
import json, os, re, subprocess, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from validate_recipes import check, VOCAB  # noqa: E402

NODE = os.environ.get("NODE", "node")
CLS = None
BASE = {"onion", "leeks", "celery", "bell pepper", "mushrooms"}


def first_step(steps, word):
    # don't count "tomatoes" inside "canned tomatoes"/"cherry tomatoes", "potatoes" inside "sweet potatoes"
    pat = re.compile(r"(?<!canned )(?<!cherry )(?<!sweet )\b" + re.escape(word.lower()) + r"\b")
    for i, s in enumerate(steps):
        if pat.search(s.lower()):
            return i
    return None


def main():
    show = int(sys.argv[sys.argv.index("--show") + 1]) if "--show" in sys.argv else 0
    out = subprocess.run([NODE, os.path.join(HERE, "dump_builder.js")], capture_output=True, text=True)
    if out.returncode:
        print(out.stderr); return 1
    print(out.stderr.strip())
    meta = json.loads(subprocess.run([NODE, "-e", "const B=require('./src/builder.js');console.log(JSON.stringify(Object.fromEntries(Object.entries(B.VEGGIES).map(([k,v])=>[k,v.cls]))))"],
                                     capture_output=True, text=True, cwd=os.path.dirname(HERE)).stdout)
    import random
    random.seed(11)
    errs, n, names = [], 0, Counter()
    samples = []
    for line in out.stdout.splitlines():
        r = json.loads(line); n += 1
        if "_throw" in r:
            errs.append(f"{r['id']}: threw {r['_throw'][:200]}"); continue
        errs += check(dict(r, id=re.sub(r"[^a-z0-9]+", "-", r["id"]).strip("-")), "builder")
        sel, steps = r["sel"], r["steps"]
        names[r["name"]] += 1
        if not r.get("_roundtrip"): errs.append(f"{r['id']}: id does not round-trip")
        txt = " ".join(steps)
        if re.search(r"undefined|null|NaN|\$\{|\s{2,}|\.\.|, \.|  ", txt): errs.append(f"{r['id']}: template residue: {txt[:160]}")
        if not (10 <= r["minutes"] <= 90): errs.append(f"{r['id']}: minutes {r['minutes']}")
        # veggie order: first mention of each hard veggie <= medium <= quick
        idx = {}
        for v in sel["veggies"]:
            name = "Brussels sprouts" if v == "brussels sprouts" else v
            idx[v] = first_step(steps, name)
            if idx[v] is None: errs.append(f"{r['id']}: veggie {v} not in steps")
        order = {"hard": 0, "medium": 1, "quick": 2}
        for a in sel["veggies"]:
            for b in sel["veggies"]:
                ca, cb = meta[a], meta[b]
                if ca in order and cb in order and order[ca] < order[cb] and not (sel["style"] in ("soup", "curry") and b in BASE) and idx.get(a) is not None and idx.get(b) is not None and idx[a] > idx[b]:
                    errs.append(f"{r['id']}: {a} ({ca}) added after {b} ({cb})")
            if meta[a] == "raw" and idx.get(a) is not None and idx[a] != len(steps) - 1:
                errs.append(f"{r['id']}: raw {a} appears before the serving step")
        samples.append(r) if len(samples) < 400 else (samples.__setitem__(rr, r) if (rr := random.randrange(n)) < 400 else None)
    dup = [k for k, c in names.items() if c > 1]
    if dup: errs.append(f"{len(dup)} duplicate names, e.g. {dup[:3]}")
    for e in errs[:40]: print("ERROR", e)
    kinds = Counter(re.sub(r"\[?b~[^\]: ]*\]?:?", "", e).strip()[:90] for e in errs)
    for k, c in kinds.most_common(40): print(f"{c:6d}  {k}")
    print(f"\n{n} built combinations checked, {len(errs)} errors")
    import random
    random.seed(3)
    for r in random.sample(samples, min(show, len(samples))):
        print("\n==", r["name"], f"({r['minutes']} min, serves {r['serves']}, {'veg' if r['veg'] else 'non-veg'})")
        for i in r["ingredients"]:
            print("  -", (str(i["qty"]) + " " + i["unit"]).strip() if i["qty"] is not None else "", i["item"], ("(" + i["note"] + ")") if i.get("note") else "", "[opt]" if i.get("optional") else "")
        for k, s in enumerate(r["steps"], 1): print(f"  {k}. {s}")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
