/* Build-a-meal recipe composer (phase 2).
 *
 * Turns a selection {protein, veggies[<=3], style, flavor} into a full recipe object with
 * the same shape as src/recipes/*.json, so the same checker (tests/validate_recipes.py)
 * validates every combination. All amounts are for 2 servings; the recipe sheet scales them.
 *
 * Works in the browser (window.Builder) and in Node (module.exports) for testing.
 */
(function (root) {
  "use strict";

  // ---------- proteins ----------
  // kind: pieces | whole | ground | bacon | ham | tofu | beans | tuna | lentils | eggs
  // pan/roast/simmer: [min, max] minutes. cue: doneness phrase (USDA temps where they apply).
  const C165 = "until no longer pink inside and it reaches 165°F";
  const P = {
    "chicken breast": { cat: "poultry", name: "chicken", qty: 12, unit: "oz", note: "cut into 1-inch pieces", kind: "pieces", pan: [6, 8], roast: [18, 20], simmer: [12, 15], cue: C165, styles: ["stir-fry", "skillet", "sheet-pan", "pasta", "tacos", "rice-bowl", "soup", "curry"] },
    "chicken thighs": { cat: "poultry", name: "chicken thighs", qty: 1, unit: "lb", note: "boneless, cut into 1-inch pieces", kind: "pieces", pan: [7, 9], roast: [20, 25], simmer: [15, 18], cue: C165, styles: ["stir-fry", "skillet", "sheet-pan", "pasta", "tacos", "rice-bowl", "soup", "curry"] },
    "ground turkey": { cat: "poultry", name: "turkey", qty: 12, unit: "oz", kind: "ground", pan: [7, 8], cue: "breaking it up, until no pink remains and it reaches 165°F", styles: ["stir-fry", "skillet", "pasta", "tacos", "rice-bowl", "soup"] },
    "salmon": { cat: "seafood", name: "salmon", qty: 2, unit: "piece", note: "6 oz fillets", kind: "whole", flake: true, pan: [8, 10], roast: [12, 15], cue: "until it is opaque and flakes easily with a fork (145°F)", styles: ["skillet", "sheet-pan", "pasta", "tacos", "rice-bowl"] },
    "shrimp": { cat: "seafood", name: "shrimp", qty: 12, unit: "oz", note: "peeled and deveined", kind: "pieces", pan: [3, 4], roast: [8, 10], simmer: [3, 4], cue: "until pink and opaque", styles: ["stir-fry", "skillet", "sheet-pan", "pasta", "tacos", "rice-bowl", "soup", "curry"] },
    "white fish": { cat: "seafood", name: "fish", qty: 2, unit: "piece", note: "6 oz fillets such as cod or tilapia", kind: "whole", flake: true, pan: [6, 8], roast: [12, 15], simmer: [6, 8], cue: "until it is opaque and flakes easily with a fork (145°F)", styles: ["skillet", "sheet-pan", "tacos", "rice-bowl", "curry"] },
    "canned tuna": { cat: "seafood", name: "tuna", qty: 2, unit: "can", note: "5 oz cans, drained", kind: "tuna", styles: ["pasta", "rice-bowl"] },
    "ground beef": { cat: "beef", name: "beef", qty: 12, unit: "oz", kind: "ground", pan: [7, 8], cue: "breaking it up, until no pink remains and it reaches 160°F", styles: ["stir-fry", "skillet", "pasta", "tacos", "rice-bowl", "soup"] },
    "steak": { cat: "beef", name: "steak", qty: 12, unit: "oz", note: "sirloin or flank, thinly sliced against the grain", kind: "pieces", pan: [3, 4], roast: [8, 10], cue: "until browned and cooked to your liking (145°F for well done)", styles: ["stir-fry", "skillet", "sheet-pan", "tacos", "rice-bowl"] },
    "pork chops": { cat: "pork", name: "pork chops", qty: 2, unit: "", note: "boneless, ¾ inch thick", kind: "whole", slice: true, pan: [8, 10], roast: [15, 18], cue: "until they reach 145°F, then rest 3 minutes", styles: ["skillet", "sheet-pan", "rice-bowl"] },
    "sausage": { cat: "pork", name: "sausage", qty: 12, unit: "oz", note: "fresh links, sliced into coins", kind: "pieces", pan: [8, 10], roast: [18, 20], cue: "until browned and it reaches 160°F", styles: ["skillet", "sheet-pan", "pasta", "soup", "rice-bowl"] },
    "bacon": { cat: "pork", name: "bacon", qty: 6, unit: "slice", note: "chopped", kind: "bacon", pan: [6, 8], styles: ["skillet", "pasta", "rice-bowl"] },
    "ham": { cat: "pork", name: "ham", qty: 8, unit: "oz", note: "diced", kind: "ham", styles: ["skillet", "pasta", "soup", "rice-bowl"] },
    "tofu": { cat: "veg", name: "tofu", qty: 1, unit: "package", note: "14 oz extra-firm, patted dry and cubed", kind: "tofu", pan: [8, 10], roast: [25, 30], simmer: [5, 5], styles: ["stir-fry", "skillet", "sheet-pan", "tacos", "rice-bowl", "curry"] },
    "canned black beans": { cat: "veg", name: "black beans", qty: 1, unit: "can", note: "drained and rinsed", kind: "beans", styles: ["skillet", "tacos", "rice-bowl", "soup"] },
    "canned chickpeas": { cat: "veg", name: "chickpeas", qty: 1, unit: "can", note: "drained, rinsed and patted dry", kind: "beans", roast: [25, 30], styles: ["skillet", "sheet-pan", "pasta", "rice-bowl", "soup", "curry"] },
    "lentils": { cat: "veg", name: "lentils", qty: 0.75, unit: "cup", note: "red lentils, rinsed", kind: "lentils", simmer: [18, 20], styles: ["soup", "curry"] },
    "eggs": { cat: "veg", name: "eggs", qty: 4, unit: "", kind: "eggs", styles: ["stir-fry", "skillet", "tacos", "rice-bowl"] },
  };

  // ---------- veggies ----------
  // cls: hard | medium | quick | raw.  pan/roast/simmer minutes by class.
  const V = {
    potatoes: { cls: "hard", qty: 12, unit: "oz", note: "cut into ½-inch cubes" },
    "sweet potatoes": { cls: "hard", qty: 1, unit: "lb", note: "peeled, cut into ½-inch cubes" },
    "butternut squash": { cls: "hard", qty: 2, unit: "cup", note: "peeled, cut into ½-inch cubes" },
    carrots: { cls: "hard", qty: 2, unit: "", note: "thinly sliced" },
    "brussels sprouts": { cls: "hard", qty: 8, unit: "oz", note: "trimmed and halved" },
    cauliflower: { cls: "hard", qty: 2, unit: "cup", note: "small florets" },
    eggplant: { cls: "hard", qty: 1, unit: "", note: "small, cut into 1-inch cubes" },
    broccoli: { cls: "medium", qty: 2, unit: "cup", note: "small florets" },
    "bell pepper": { cls: "medium", qty: 1, unit: "", note: "sliced" },
    "green beans": { cls: "medium", qty: 6, unit: "oz", note: "trimmed, cut in half" },
    asparagus: { cls: "medium", qty: 8, unit: "oz", note: "cut into 2-inch pieces" },
    zucchini: { cls: "medium", qty: 1, unit: "", note: "halved and sliced" },
    mushrooms: { cls: "medium", qty: 8, unit: "oz", note: "sliced" },
    "snap peas": { cls: "medium", qty: 6, unit: "oz", note: "strings removed" },
    cabbage: { cls: "medium", qty: 2, unit: "cup", note: "shredded" },
    corn: { cls: "medium", qty: 1, unit: "cup", note: "frozen or cut from the cob" },
    onion: { cls: "medium", qty: 1, unit: "", note: "sliced" },
    leeks: { cls: "medium", qty: 2, unit: "", note: "white and light green parts, sliced and rinsed well" },
    "bok choy": { cls: "medium", qty: 8, unit: "oz", note: "chopped" },
    celery: { cls: "medium", qty: 1, unit: "cup", note: "sliced" },
    spinach: { cls: "quick", qty: 3, unit: "handful" },
    kale: { cls: "quick", qty: 2, unit: "cup", note: "stems removed, chopped" },
    "frozen peas": { cls: "quick", qty: 1, unit: "cup" },
    tomatoes: { cls: "quick", qty: 2, unit: "", note: "chopped" },
    "cherry tomatoes": { cls: "quick", qty: 1, unit: "cup", note: "halved" },
    avocado: { cls: "raw", qty: 1, unit: "", note: "sliced" },
    lettuce: { cls: "raw", qty: 1, unit: "cup", note: "shredded" },
    cucumber: { cls: "raw", qty: 0.5, unit: "", note: "sliced" },
  };
  const VT = { hard: { pan: [10, 12], roast: [25, 30], simmer: [15, 15] }, medium: { pan: [4, 5], roast: [15, 20], simmer: [6, 8] }, quick: { pan: [1, 2], roast: [5, 5], simmer: [2, 3] } };
  const BASE = new Set(["onion", "leeks", "celery", "bell pepper", "mushrooms"]); // softened first in soups and curries
  const VDONE = { hard: "until tender and browned in spots", medium: "until crisp-tender", quick: "until wilted or warmed through" };

  // ---------- styles ----------
  const S = {
    "stir-fry": { label: "Stir-fry", e: "🥢", noun: "stir-fry", raw: false, meal: ["dinner"] },
    skillet: { label: "Skillet", e: "🍳", noun: "skillet", raw: true, meal: ["lunch", "dinner"] },
    "sheet-pan": { label: "Sheet-pan", e: "🫕", noun: "sheet-pan dinner", raw: false, meal: ["dinner"] },
    pasta: { label: "Pasta", e: "🍝", noun: "pasta", raw: false, meal: ["lunch", "dinner"] },
    tacos: { label: "Tacos", e: "🌮", noun: "tacos", raw: true, meal: ["lunch", "dinner"] },
    "rice-bowl": { label: "Rice bowl", e: "🍚", noun: "rice bowl", raw: true, meal: ["lunch", "dinner"] },
    soup: { label: "Soup", e: "🍲", noun: "soup", raw: false, meal: ["lunch", "dinner"] },
    curry: { label: "Curry", e: "🍛", noun: "curry", raw: false, meal: ["dinner"] },
  };

  // ---------- flavors ----------
  // aromatics: cooked 30 s before the sauce. spices: dry seasoning. sauce: added at the end
  // (mode "glaze" = mixed and tossed, "simmer" = simmered a few minutes, "butter" = melted in).
  // finish: added when serving. Items with optional:true never block a dish.
  const F = {
    "garlic-herb": { label: "Garlic & herb", e: "🧄", adj: "Garlic-herb", cuisine: "Classic", oil: "olive oil",
      aromatics: [["garlic", 3, "clove", "minced"]], spices: [["italian seasoning", 1, "tsp"]],
      sauce: { mode: "butter", items: [["butter", 2, "tbsp"]] }, finish: [["fresh herbs", null, "", "chopped parsley or basil", true], ["lemon", 0.5, "", "for squeezing", true]],
      styles: ["stir-fry", "skillet", "sheet-pan", "pasta", "rice-bowl", "soup"] },
    italian: { label: "Italian", e: "🍅", adj: "Italian", cuisine: "Italian", oil: "olive oil",
      aromatics: [["garlic", 2, "clove", "minced"]], spices: [["italian seasoning", 2, "tsp"], ["red pepper flakes", null, "", "a pinch", true]],
      sauce: { mode: "simmer", items: [["canned tomatoes", 1, "can", "14 oz, diced or crushed"]], noSheetPan: true }, finish: [["parmesan", 0.25, "cup", "grated"]],
      styles: ["skillet", "sheet-pan", "pasta", "soup"] },
    "tex-mex": { label: "Tex-Mex", e: "🌶️", adj: "Tex-Mex", cuisine: "Tex-Mex", oil: "vegetable oil",
      aromatics: [["garlic", 2, "clove", "minced"]], spices: [["chili powder", 2, "tsp"], ["cumin", 1, "tsp"]],
      sauce: { mode: "simmer", items: [["salsa", 0.5, "cup"]], topping: true }, finish: [["lime", 1, "", "cut into wedges"], ["fresh herbs", null, "", "chopped cilantro", true]],
      styles: ["skillet", "sheet-pan", "tacos", "rice-bowl", "soup"] },
    "soy-ginger": { label: "Soy & ginger", e: "🫚", adj: "Soy-ginger", cuisine: "Asian-style", oil: "vegetable oil",
      aromatics: [["garlic", 2, "clove", "minced"], ["ginger", 1, "tbsp", "grated"]], spices: [],
      sauce: { mode: "glaze", items: [["soy sauce", 3, "tbsp"], ["honey", 1, "tbsp"], ["cornstarch", 1, "tsp"]], water: 3 }, finish: [["green onions", 2, "", "sliced"], ["sesame oil", 1, "tsp"]],
      styles: ["stir-fry", "skillet", "sheet-pan", "tacos", "rice-bowl"] },
    curry: { label: "Curry", e: "🍛", adj: "Coconut", cuisine: "Indian-style", oil: "vegetable oil",
      aromatics: [["garlic", 2, "clove", "minced"], ["ginger", 1, "tbsp", "grated"]], spices: [["curry powder", 2, "tbsp"]],
      sauce: { mode: "simmer", items: [["coconut milk", 1, "can", "13.5 oz"]] }, finish: [["lime", 0.5, "", "for squeezing", true], ["fresh herbs", null, "", "chopped cilantro", true]],
      styles: ["curry"] },
    "lemon-pepper": { label: "Lemon pepper", e: "🍋", adj: "Lemon-pepper", cuisine: "Classic", oil: "olive oil",
      aromatics: [["garlic", 2, "clove", "minced"]], spices: [["black pepper", 1, "tsp", "coarsely ground"]],
      sauce: { mode: "butter", items: [["butter", 2, "tbsp"], ["lemon", 1, "", "zested and juiced"]] }, finish: [["fresh herbs", null, "", "chopped parsley", true]],
      styles: ["stir-fry", "skillet", "sheet-pan", "pasta", "tacos", "rice-bowl"] },
  };

  // ---------- helpers ----------
  const DISPLAY = { "brussels sprouts": "Brussels sprouts", "chicken broth": "broth" };
  const show = k => DISPLAY[k] || k;
  const list = a => a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  const rng = ([a, b]) => a === b ? `${a}` : `${a}–${b}`;
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const slug = s => s.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function ing(item, qty, unit, note, optional) {
    const o = { item, qty: qty == null ? null : qty, unit: unit || "" };
    if (note) o.note = note;
    if (optional) o.optional = true;
    return o;
  }
  function Bag() {
    const m = new Map();
    return {
      add(i) {
        const ex = m.get(i.item);
        if (!ex) { m.set(i.item, Object.assign({}, i)); return; }
        if (ex.optional && !i.optional) delete ex.optional;
        if (ex.qty != null && i.qty != null && ex.unit === i.unit) ex.qty = Math.max(ex.qty, i.qty);
        else if (ex.qty == null && i.qty != null) { ex.qty = i.qty; ex.unit = i.unit; }
      },
      list() { return [...m.values()]; },
    };
  }
  const T = a => (a ? a[1] : 0);

  // ---------- compatibility ----------
  function stylesFor(protein) {
    const p = P[protein]; if (!p) return [];
    return Object.keys(S).map(k => ({ key: k, ok: p.styles.includes(k), why: p.styles.includes(k) ? "" : `Not a good fit for ${p.name}` }));
  }
  function vegIssue(veggies, style) {
    const raw = veggies.filter(v => V[v] && V[v].cls === "raw");
    if (raw.length && !S[style].raw) return `${cap(list(raw))} ${raw.length > 1 ? "are" : "is"} served raw — pick tacos, rice bowl or skillet`;
    return "";
  }
  function flavorsFor(style) {
    return Object.keys(F).map(k => ({ key: k, ok: F[k].styles.includes(style), why: F[k].styles.includes(style) ? "" : (style === "curry" ? "Curry style uses the curry flavor" : `Not used for ${S[style].label.toLowerCase()}`) }));
  }
  function valid(sel) {
    const p = P[sel.protein], s = S[sel.style], f = F[sel.flavor];
    if (!p || !s || !f) return "Pick a protein, style and flavor";
    if (!p.styles.includes(sel.style)) return `${cap(p.name)} isn't used for ${s.label.toLowerCase()}`;
    if (!f.styles.includes(sel.style)) return `${f.label} isn't used for ${s.label.toLowerCase()}`;
    if ((sel.veggies || []).length > 3) return "Pick up to 3 veggies";
    for (const v of sel.veggies || []) if (!V[v]) return `Unknown veggie ${v}`;
    return vegIssue(sel.veggies || [], sel.style);
  }

  // ---------- ids (so favorites and links work for built recipes) ----------
  function encode(sel) { return ["b", slug(sel.protein), sel.style, sel.flavor, ...[...sel.veggies].sort().map(slug)].join("~"); }
  function decode(id) {
    const parts = String(id).split("~");
    if (parts[0] !== "b" || parts.length < 4) return null;
    const byslug = o => Object.fromEntries(Object.keys(o).map(k => [slug(k), k]));
    const ps = byslug(P), vs = byslug(V);
    const sel = { protein: ps[parts[1]], style: parts[2], flavor: parts[3], veggies: parts.slice(4).map(x => vs[x]) };
    if (!sel.protein || sel.veggies.some(v => !v)) return null;
    return valid(sel) ? null : sel;
  }

  // ---------- composition ----------
  function compose(sel) {
    const err = valid(sel); if (err) throw new Error(err);
    // canonical veggie order (cook order, then A-Z) so names and ids are stable
    const ORD = { hard: 0, medium: 1, quick: 2, raw: 3 };
    sel = Object.assign({}, sel, { veggies: [...new Set(sel.veggies)].sort((a, b) => ORD[V[a].cls] - ORD[V[b].cls] || a.localeCompare(b)) });
    const p = P[sel.protein], s = S[sel.style], f = F[sel.flavor], st = sel.style;
    const veg = { hard: [], medium: [], quick: [], raw: [] };
    for (const v of sel.veggies) veg[V[v].cls].push(v);
    const bag = Bag(), steps = [];
    let mins = 10; // prep
    const oil = f.oil, pn = p.name;
    const add = (arr, extra) => arr.forEach(([i, q, u, n, o]) => bag.add(ing(i, q, u, n, o || extra)));

    // protein + veggies + flavor ingredients
    bag.add(ing(sel.protein, p.qty, p.unit, p.note));
    for (const v of sel.veggies) bag.add(ing(v, V[v].qty, V[v].unit, V[v].note));
    add(f.aromatics); add(f.spices);
    const sauceItems = (st === "sheet-pan" && f.sauce.noSheetPan) ? [] : f.sauce.items.filter(([i]) => !(st === "sheet-pan" && i === "cornstarch"));
    add(sauceItems); add(f.finish);
    bag.add(ing(oil, 2, "tbsp"));
    bag.add(ing("salt", null, "")); bag.add(ing("black pepper", null, ""));

    const aromN = list(f.aromatics.map(a => show(a[0])));
    const spiceN = list(f.spices.filter(x => !x[4]).map(x => show(x[0])));
    const optSpice = f.spices.find(x => x[4]);
    const finishReq = f.finish.filter(x => !x[4]).map(x => show(x[0]));
    const finishOpt = f.finish.filter(x => x[4]).map(x => show(x[0]));
    const finishTxt = () => {
      if (!finishOpt.length) return list(finishReq);
      const o = list(finishOpt) + " if you like";
      return finishReq.length ? `${list(finishReq)}, plus ${o}` : o;
    };
    const sauceN = list(sauceItems.map(x => x[0] === "lemon" ? "lemon (zest and juice)" : show(x[0])));
    const glaze = f.sauce.mode === "glaze" && sauceItems.length;

    // pan-cooked veggies, in order hard -> medium -> quick (returns minutes used)
    function vegPan(lead) {
      let m = 0, first = true;
      for (const cls of ["hard", "medium", "quick"]) {
        if (!veg[cls].length) continue;
        const t = VT[cls].pan;
        steps.push(`${first && lead ? lead + " add" : "Add"} the ${list(veg[cls].map(show))} and cook ${rng(t)} minutes, stirring${cls === "hard" ? " now and then (cover the pan for the first 5 minutes)" : ""}, ${VDONE[cls]}.`);
        m += t[1]; first = false;
      }
      return m;
    }
    function aromatics(heat) {
      steps.push(`Add the ${list([...f.aromatics, ...f.spices.filter(x => !x[4])].map(x => show(x[0])))}${optSpice ? ` (plus ${show(optSpice[0])} if you like)` : ""} and cook ${heat === "low" ? "1 minute" : "30 seconds"}, stirring, until fragrant.`);
      mins += 1;
    }
    // cook the protein in a skillet and set it aside (most styles)
    function proteinPan(heat) {
      const h = `Heat 1 tbsp of the ${oil} in a large skillet over ${heat} heat.`;
      switch (p.kind) {
        case "pieces": steps.push(`${h} Season the ${pn} with salt and pepper, add in one layer and cook ${rng(p.pan)} minutes, stirring now and then, ${p.cue}. Move to a plate.`); break;
        case "whole": steps.push(`${h} Season the ${pn} with salt and pepper and cook ${rng(p.pan)} minutes, turning once, ${p.cue}. Move to a plate${p.flake ? " and break into large flakes" : p.slice ? " and slice" : ""}.`); break;
        case "ground": steps.push(`${h} Add the ${pn} and cook ${rng(p.pan)} minutes, ${p.cue}. Season with salt and pepper and move to a plate.`); break;
        case "bacon": steps.push(`Cook the bacon in a large skillet over medium heat ${rng(p.pan)} minutes, stirring, until crisp. Move to a plate and pour off all but 1 tbsp of the fat.`); break;
        case "ham": steps.push(`${h} Cook the ham 3–4 minutes until lightly browned. Move to a plate.`); mins += 4; return;
        case "tofu": steps.push(`${h} Add the tofu and cook ${rng(p.pan)} minutes, turning, until golden and firm on most sides. Season with salt and move to a plate.`); break;
        case "eggs": steps.push(`${h} Beat the eggs with a pinch of salt, pour them in and stir gently until softly set, 1–2 minutes. Move to a plate.`); mins += 2; return;
        default: return;
      }
      mins += p.pan[1];
    }
    const otherOil = () => p.kind === "bacon" ? "Over medium-high heat," : `Add the rest of the ${oil} to the skillet, then`;
    function saucePanFinish(back) {
      // back: text for returning the protein
      if (glaze) {
        steps.splice(0, 0, `Stir the ${sauceN} together with ${f.sauce.water} tbsp water in a small bowl.`);
        steps.push(`${back}, pour in the sauce and toss 1–2 minutes until it thickens and coats everything.`); mins += 2;
      } else if (f.sauce.mode === "butter") {
        steps.push(`${back}, add the ${sauceN}, and toss until the butter melts and coats everything.`); mins += 1;
      } else if (f.sauce.mode === "simmer" && f.sauce.topping) {
        steps.push(`${back}, stir in the ${sauceN} and simmer 2 minutes.`); mins += 2;
      } else if (f.sauce.mode === "simmer") {
        steps.push(`Pour in the ${sauceN}, bring to a simmer and cook 5 minutes until slightly thickened. ${back} and stir to coat.`); mins += 5;
      }
    }
    const beansStep = () => { steps.push(`Add the ${pn} and cook 2–3 minutes, stirring, until heated through.`); mins += 3; };

    if (st === "stir-fry" || st === "skillet") {
      const heat = st === "stir-fry" ? "high" : "medium-high";
      if (st === "stir-fry") bag.add(ing("rice", 2, "cup", "cooked, for serving"));
      if (p.kind === "eggs" && st === "skillet") {
        mins += vegPan(`Heat the ${oil} in a large nonstick skillet over medium heat, then`);
        aromatics();
        steps.push(`Beat the eggs with a pinch of salt and pepper, pour them over the vegetables and stir gently 2–3 minutes until just set.`); mins += 3;
        if (sauceItems.length) steps.push(f.sauce.mode === "glaze" ? `Drizzle with the ${sauceN} mixed with ${f.sauce.water} tbsp water and toss for 30 seconds.` : `Stir in the ${sauceN} and cook 1 minute.`);
        if (glaze) { /* inline above */ }
      } else {
        proteinPan(heat);
        const vm = vegPan(otherOil()); mins += vm;
        if (p.kind === "beans") beansStep();
        aromatics();
        saucePanFinish(["beans"].includes(p.kind) ? "Season with salt and pepper" : `Return the ${pn}`);
      }
      const ft = finishTxt();
      const raw = veg.raw.length ? ` topped with the ${list(veg.raw.map(show))}` : "";
      steps.push(`Serve${st === "stir-fry" ? " over the rice" : " hot"}${raw ? "," : ""}${raw}${ft ? `${raw ? ", plus" : ", topped with"} ${ft}` : ""}.`);
    } else if (st === "sheet-pan") {
      steps.push("Heat the oven to 425°F and line a large sheet pan with foil or parchment.");
      // timeline: everything finishes together
      const items = [];
      if (veg.hard.length) items.push({ t: VT.hard.roast, names: veg.hard });
      if (veg.medium.length) items.push({ t: VT.medium.roast, names: veg.medium });
      const pt = p.roast || [20, 25];
      items.push({ t: pt, names: [pn], protein: true });
      items.sort((a, b) => b.t[1] - a.t[1]);
      const total = items[0].t[1];
      let elapsed = 0, firstStep = true;
      for (let i = 0; i < items.length; i++) {
        const it = items[i], startAt = total - it.t[1];
        if (startAt > elapsed) { steps.push(`Roast ${startAt - elapsed} minutes.`); elapsed = startAt; }
        const season = list(["salt", ...f.spices.filter(x => !x[4]).map(x => show(x[0])), ...(f.spices.some(x => x[0] === "black pepper") ? [] : ["pepper"])]);
        const what = it.protein
          ? (p.kind === "whole" ? `the ${pn} (brushed with oil and seasoned with ${season})` : `the ${pn} (tossed with 1 tbsp ${oil}, ${season})`)
          : `the ${list(it.names.map(show))} (tossed with 1 tbsp ${oil}, salt and pepper)`;
        steps.push(`${firstStep ? "Spread" : "Add"} ${what} ${firstStep ? "on the pan" : "to the pan"}.`);
        firstStep = false;
      }
      const cue = p.kind === "tofu" ? "until the tofu is golden and crisp at the edges" : p.kind === "beans" ? "until the chickpeas are crisp" : p.cue;
      const garlicLast = `Scatter the ${aromN} over everything for the last 5 minutes`;
      steps.push(`Roast ${total - elapsed} more minutes, ${cue}, and the vegetables are tender. ${garlicLast}${veg.quick.length ? `, along with the ${list(veg.quick.map(show))}` : ""}.`);
      mins += total;
      if (glaze) steps.push(`Stir the ${sauceN} together, drizzle over the hot pan and toss.`);
      else if (f.sauce.mode === "butter") steps.push(`Add the ${sauceN} to the hot pan and toss until the butter melts.`);
      const ft = finishTxt();
      steps.push(`Serve${f.sauce.topping ? ` with the ${sauceN}` : ""}${ft ? `${f.sauce.topping ? " and" : ""} topped with ${ft}` : ""}.`);
      if (f.sauce.topping) bag.add(ing("salsa", 0.5, "cup"));
    } else if (st === "pasta") {
      bag.add(ing("pasta", 8, "oz"));
      steps.push("Cook the pasta in well-salted boiling water until al dente. Save 1 cup of the pasta water, then drain.");
      mins += 12;
      if (p.kind !== "tuna") proteinPan("medium-high");
      const vm = vegPan(p.kind === "tuna" ? `Heat the ${oil} in a large skillet over medium-high heat, then` : otherOil()); mins += vm;
      if (p.kind === "beans") beansStep();
      aromatics();
      const back = p.kind === "tuna" ? "Add the pasta and the tuna" : p.kind === "beans" ? "Add the pasta" : `Return the ${pn} and add the pasta`;
      if (f.sauce.mode === "simmer") { steps.push(`Pour in the ${sauceN}, bring to a simmer and cook 5 minutes.`); mins += 5; steps.push(`${back} with a splash of pasta water and toss 1 minute until glossy.`); }
      else steps.push(`${back}. Add the ${sauceN} with a splash of pasta water and toss 1 minute until glossy.`);
      const ft = finishTxt();
      steps.push(`Season with salt and pepper and serve${ft ? " topped with " + ft : ""}.`);
    } else if (st === "tacos" || st === "rice-bowl") {
      const bowl = st === "rice-bowl";
      bag.add(bowl ? ing("rice", 2, "cup", "cooked") : ing("tortillas", 6, "", "small"));
      if (p.kind === "eggs" && bowl) {
        const vm = vegPan(`Heat 1 tbsp of the ${oil} in a large skillet over medium-high heat, then`); mins += vm;
        aromatics();
        if (sauceItems.length) { if (glaze) steps.push(`Stir the ${sauceN} with ${f.sauce.water} tbsp water, pour into the skillet and toss 1 minute.`); else steps.push(`Stir in the ${sauceN} and cook 1 minute.`); }
        steps.push(`Move the vegetables to a plate. Add the rest of the ${oil}, crack in the eggs and fry 3–4 minutes until the whites are set and the edges are crisp.`); mins += 4;
      } else {
        if (p.kind !== "tuna") proteinPan("medium-high");
        const vm = vegPan(p.kind === "tuna" ? `Heat the ${oil} in a large skillet over medium-high heat, then` : otherOil()); mins += vm;
        if (p.kind === "beans") beansStep();
        aromatics();
        const back = p.kind === "tuna" ? "Stir in the tuna" : p.kind === "beans" ? "Season with salt and pepper" : `Return the ${pn}`;
        if (f.sauce.topping) { steps.push(`${back} and cook 1 minute.`); }
        else saucePanFinish(back);
      }
      if (!bowl) { steps.push("Warm the tortillas in a dry skillet, about 30 seconds per side."); mins += 2; }
      else steps.push("Warm the rice if needed.");
      const ft = finishTxt();
      const tops = [...veg.raw.map(show), ...(f.sauce.topping ? [sauceN] : []), ...finishReq];
      const topOpt = finishOpt.length ? ` (${list(finishOpt)} too, if you like)` : "";
      steps.push(bowl ? `Divide the rice between two bowls and spoon the ${p.kind === "eggs" ? "vegetables and eggs" : pn + (sel.veggies.length - veg.raw.length ? " and vegetables" : "")} on top${tops.length ? `. Top with ${list(tops)}${topOpt}` : topOpt ? `. Add ${list(finishOpt)} if you like` : ""}.`
        : `Fill the tortillas with the ${p.kind === "eggs" ? "eggs" : pn}${sel.veggies.length - veg.raw.length ? " and vegetables" : ""}${tops.length ? ` and top with ${list(tops)}${topOpt}` : topOpt ? `. Add ${list(finishOpt)} if you like` : ""}.`);
    } else if (st === "soup") {
      bag.add(ing("chicken broth", 3, "cup", p.cat === "veg" ? "use vegetable broth to keep it vegetarian" : null));
      const baseV = veg.medium.filter(v => BASE.has(v)), lateV = veg.medium.filter(v => !BASE.has(v));
      const browned = ["ground", "bacon", "ham"].includes(p.kind) || sel.protein === "sausage";
      if (browned) proteinPan("medium-high");
      steps.push(baseV.length
        ? `${browned ? "In the same pot over medium heat" : `Heat the ${oil} in a large pot over medium heat`}, add the ${list(baseV.map(show))} and cook 5 minutes until softened.`
        : `${browned ? "Lower the heat to medium" : `Heat the ${oil} in a large pot over medium heat`}.`);
      if (baseV.length) mins += 5;
      aromatics("low");
      const early = !browned && (p.kind === "beans" || p.kind === "lentils" || (p.kind === "pieces" && p.simmer && p.simmer[1] >= 10));
      const firstIn = [...veg.hard.map(show), ...(early ? [pn] : [])];
      steps.push(`Add the broth${f.sauce.mode === "simmer" ? " and " + sauceN : ""}${firstIn.length ? ", then the " + list(firstIn) : ""}. Bring to a boil, then lower the heat.`);
      const simmerT = Math.max(veg.hard.length ? 15 : 0, early && p.simmer ? p.simmer[1] : 0, p.kind === "lentils" ? 20 : 0, 8);
      steps.push(`Simmer ${simmerT} minutes${early && p.kind === "pieces" ? `, ${p.cue}` : p.kind === "lentils" ? ", until the lentils are soft" : ""}${veg.hard.length ? (early && p.kind === "pieces" ? ", and" : "") + " until the vegetables are tender" : ""}.`);
      mins += simmerT + 5;
      const late = !browned && !early;
      if (lateV.length) { steps.push(`Add the ${list(lateV.map(show))} and simmer ${rng(VT.medium.simmer)} minutes until tender.`); mins += VT.medium.simmer[1]; }
      const lateBits = [...(late ? [pn] : []), ...veg.quick.map(show)];
      if (lateBits.length) { steps.push(`Add the ${list(lateBits)} and simmer ${late ? rng(p.simmer) : "2–3"} minutes more${late ? `, ${p.cue}` : ""}.`); mins += late ? p.simmer[1] : 3; }
      if (browned) steps.push(`Return the ${pn} to the pot and heat through.`);
      if (p.kind === "beans") steps.push(`Mash some of the ${pn} against the side of the pot to thicken the soup.`);
      if (f.sauce.mode === "butter") steps.push(`Stir in the ${sauceN}.`);
      const ft = finishTxt();
      steps.push(`Season with salt and pepper and serve${ft ? " topped with " + ft : ""}.`);
    } else if (st === "curry") {
      bag.add(ing("onion", 1, "", "diced"));
      bag.add(ing("rice", 2, "cup", "cooked, for serving"));
      if (p.kind === "lentils") bag.add(ing("chicken broth", 1.5, "cup", "use vegetable broth to keep it vegetarian"));
      const tofuPan = p.kind === "tofu";
      if (tofuPan) proteinPan("medium-high");
      const baseV = veg.medium.filter(v => BASE.has(v) && v !== "onion"), lateV = veg.medium.filter(v => !BASE.has(v));
      steps.push(`${tofuPan ? "In the same pot, heat the rest of the oil" : `Heat the ${oil} in a large pot`} over medium heat. Add the onion${baseV.length ? " and " + list(baseV.map(show)) : ""} and cook 5 minutes until soft.`); mins += 5;
      aromatics("low");
      const early = p.kind === "pieces" && p.simmer[1] >= 10;
      if (early) { steps.push(`Add the ${pn} and stir 2 minutes to coat in the spices.`); mins += 2; }
      const withSauce = [...veg.hard.map(show), ...(p.kind === "beans" || p.kind === "lentils" ? [pn] : [])];
      steps.push(`Pour in the ${sauceN}${p.kind === "lentils" ? " and the broth" : ""}${withSauce.length ? ", add the " + list(withSauce) : ""}, and bring to a gentle simmer.`);
      const simmerT = Math.max(veg.hard.length ? 15 : 0, early ? p.simmer[1] : 0, p.kind === "lentils" ? 20 : 0, 8);
      steps.push(`Simmer ${simmerT} minutes, stirring now and then${early ? `, ${p.cue}` : ""}${p.kind === "lentils" ? ", until the lentils are soft" : ""}.`);
      mins += simmerT;
      const lateP = !early && ["pieces", "whole"].includes(p.kind);
      const lateBits = [...lateV.map(show), ...(lateP ? [pn] : [])];
      if (lateBits.length) { const t = lateP ? p.simmer : VT.medium.simmer; steps.push(`Add the ${list(lateBits)} and simmer ${rng(t)} minutes more${lateP ? `, ${p.cue}` : ", until tender"}.`); mins += t[1]; }
      if (veg.quick.length || tofuPan) { steps.push(`Stir in the ${list([...(tofuPan ? [pn] : []), ...veg.quick.map(show)])} and cook 2–3 minutes until heated through.`); mins += 3; }
      const ft = finishTxt();
      steps.push(`Season with salt and serve over the rice${ft ? ", with " + ft : ""}.`);
    }

    const vnames = sel.veggies.map(show);
    const TITLE = { "chicken thighs": "chicken thigh", "pork chops": "pork chop", chickpeas: "chickpea", "black beans": "black bean", lentils: "lentil", eggs: "egg" };
    const base = `${f.adj} ${TITLE[p.name] || p.name}`;
    const name = cap(`${base} ${s.noun}${vnames.length ? " with " + list(vnames) : ""}`);
    const isVeg = p.cat === "veg";
    const meal = [...s.meal]; if (p.kind === "eggs" && !meal.includes("breakfast")) meal.unshift("breakfast");
    return {
      id: encode(sel), name, built: true, sel,
      meal, cuisine: f.cuisine, minutes: Math.ceil(mins / 5) * 5, serves: 2, veg: isVeg,
      ingredients: bag.list(), steps,
      _cat: p.cat, _e: s.e,
    };
  }

  const api = {
    PROTEINS: P, VEGGIES: V, STYLES: S, FLAVORS: F,
    stylesFor, flavorsFor, vegIssue, valid, compose, encode, decode,
    fromId(id) { const sel = decode(id); return sel ? compose(sel) : null; },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Builder = api;
})(typeof window !== "undefined" ? window : globalThis);
