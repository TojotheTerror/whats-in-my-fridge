#!/usr/bin/env node
// Emit every valid build-a-meal combination as JSON lines for tests/validate_builder.py.
// Veggie sets: none, every single veggie, every pair, and a fixed sample of triples.
const B = require("../src/builder.js");
const P = Object.keys(B.PROTEINS), V = Object.keys(B.VEGGIES), S = Object.keys(B.STYLES), F = Object.keys(B.FLAVORS);

const sets = [[]];
for (const v of V) sets.push([v]);
for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) sets.push([V[i], V[j]]);
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
for (let n = 0; n < 150; n++) { const t = new Set(); while (t.size < 3) t.add(V[Math.floor(rnd() * V.length)]); sets.push([...t]); }

let invalid = 0, errors = 0; const seen = new Set();
for (const protein of P) for (const style of S) for (const flavor of F) for (const veggies of sets) {
  const sel = { protein, style, flavor, veggies };
  if (B.valid(sel)) { invalid++; continue; }
  try {
    const r = B.compose(sel);
    if (seen.has(r.id)) continue; seen.add(r.id);
    const back = B.fromId(r.id);
    r._roundtrip = !!back && back.name === r.name;
    process.stdout.write(JSON.stringify(r) + "\n");
  } catch (e) { errors++; process.stdout.write(JSON.stringify({ id: `ERR:${protein}/${style}/${flavor}/${veggies}`, _throw: String(e.stack || e) }) + "\n"); }
}
process.stderr.write(`skipped ${invalid} incompatible, ${errors} threw\n`);
