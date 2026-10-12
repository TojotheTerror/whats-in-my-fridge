#!/usr/bin/env python3
"""Build index.html, v2/index.html and v3/index.html (+ v3/sw.js): inline src/vocab.json +
src/recipes/*.json into the page templates.

Runs the recipe validator first and refuses to build if it fails.
"""
import glob, hashlib, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
for check in ("validate_recipes.py", "validate_builder.py"):
    if subprocess.run([sys.executable, os.path.join(ROOT, "tests", check)]).returncode:
        sys.exit(f"{check} failed; not building")
vocab = json.load(open(os.path.join(ROOT, "src", "vocab.json")))["items"]
recipes = []
for f in sorted(glob.glob(os.path.join(ROOT, "src", "recipes", "*.json"))):
    recipes += json.load(open(f))
recipes.sort(key=lambda r: r["name"].lower())
data = json.dumps({"vocab": vocab, "recipes": recipes}, ensure_ascii=False, separators=(",", ":"))
data = data.replace("</", "<\\/")  # never close the <script> tag early
# (template, outputs). Root currently serves v2; v3 is a preview at /v3/ until approved.
TARGETS = [("app.html", ["index.html", os.path.join("v2", "index.html")]),
           ("app3.html", [os.path.join("v3", "index.html")])]
for src, outs in TARGETS:
    html = open(os.path.join(ROOT, "src", src)).read().replace("/*DATA*/", data, 1)
    if "/*BUILDER*/" in html:
        html = html.replace("/*BUILDER*/", open(os.path.join(ROOT, "src", "builder.js")).read().replace("</", "<\\/"), 1)
    for out in outs:
        os.makedirs(os.path.dirname(os.path.join(ROOT, out)), exist_ok=True)
        open(os.path.join(ROOT, out), "w").write(html)
    print(f"built {', '.join(outs)}: {len(recipes)} recipes, {len(html)//1024} KB")
    if src == "app3.html":
        # v3/sw.js: offline copy of v3 only. Its cache name is a hash of the page + worker, so each deploy
        # that changes either one replaces the old cache (same input -> same output, so rebuilds are reproducible).
        sw = open(os.path.join(ROOT, "src", "sw3.js")).read()
        version = hashlib.sha256((html + sw).encode()).hexdigest()[:12]
        open(os.path.join(ROOT, "v3", "sw.js"), "w").write(sw.replace("/*VERSION*/", version, 1))
        print(f"built v3/sw.js: cache fridge-v3-{version}")
