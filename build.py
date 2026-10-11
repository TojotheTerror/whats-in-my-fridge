#!/usr/bin/env python3
"""Build v2/index.html: inline src/vocab.json + src/recipes/*.json into src/app.html.

Runs the recipe validator first and refuses to build if it fails.
"""
import glob, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
if subprocess.run([sys.executable, os.path.join(ROOT, "tests", "validate_recipes.py")]).returncode:
    sys.exit("validator failed; not building")
vocab = json.load(open(os.path.join(ROOT, "src", "vocab.json")))["items"]
recipes = []
for f in sorted(glob.glob(os.path.join(ROOT, "src", "recipes", "*.json"))):
    recipes += json.load(open(f))
recipes.sort(key=lambda r: r["name"].lower())
data = json.dumps({"vocab": vocab, "recipes": recipes}, ensure_ascii=False, separators=(",", ":"))
data = data.replace("</", "<\\/")  # never close the <script> tag early
html = open(os.path.join(ROOT, "src", "app.html")).read().replace("/*DATA*/", data, 1)
os.makedirs(os.path.join(ROOT, "v2"), exist_ok=True)
open(os.path.join(ROOT, "v2", "index.html"), "w").write(html)
print(f"built v2/index.html: {len(recipes)} recipes, {len(html)//1024} KB")
