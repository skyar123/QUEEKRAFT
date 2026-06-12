// Data & map-generation integrity checks (no browser needed): `npm test`.
// Catches the classes of bugs that have bitten this repo before — dialogue
// nodes pointing at missing branches, reward keys with no handler in ui.js,
// image paths that won't exist in a production build (only public/ ships),
// and map layouts whose spawn/exit invariants break.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    ZINES, HISTORICAL_FIGURES, HEALING_ITEMS, TREASURES, ECHO_KEYS,
    LOOT_TIERS, NAMED_ITEM_EFFECTS, QUESTS, QUEST_KEYS, GOALS,
    WEAPONS, WEAPON_KEYS, POTIONS, POTION_KEYS, COMPANIONS, COMPANION_KEYS, FISH, FISH_KEYS
} from '../src/data.js';
import { generateMap, generateHubMap } from '../src/map.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let failures = 0;
function check(ok, msg) {
    if (!ok) { failures++; console.error(`  ✗ ${msg}`); }
}

// ── Dialogue graph ──────────────────────────────────────────────────────────
// Reward keys must match a branch in ui.js applyEffects, or NPCs hand the
// player a raw string. Effects likewise.
const HANDLED_REWARDS = new Set([
    'item_brick', 'item_history', 'item_shield', 'item_bloom', 'reveal_passage',
    'ability_rage', 'ability_vision', 'labeija_trophy', 'star_solidarity', 'wewha_blessing'
]);
const HANDLED_EFFECTS = new Set(['heal_full', 'charm_lesson', 'community_heal']);

console.log('Dialogue graph…');
for (const [key, fig] of Object.entries(HISTORICAL_FIGURES)) {
    check(fig.dialogue && fig.dialogue.greeting, `${key}: missing dialogue.greeting`);
    check(typeof fig.fact === 'string' && fig.fact.length > 0, `${key}: missing fact`);
    for (const [nodeId, node] of Object.entries(fig.dialogue || {})) {
        for (const choice of node.choices || []) {
            check(fig.dialogue[choice.next], `${key}.${nodeId}: choice → missing node "${choice.next}"`);
        }
        if (node.reward) check(HANDLED_REWARDS.has(node.reward), `${key}.${nodeId}: unhandled reward "${node.reward}"`);
        if (node.effect) check(HANDLED_EFFECTS.has(node.effect), `${key}.${nodeId}: unhandled effect "${node.effect}"`);
    }
    if (fig.dialogue_variants) {
        for (const v of Object.values(fig.dialogue_variants)) {
            check(fig.dialogue[v], `${key}: dialogue_variants → missing node "${v}"`);
        }
    }
}
for (const key of ECHO_KEYS) {
    check(HISTORICAL_FIGURES[key] && HISTORICAL_FIGURES[key].echo, `ECHO_KEYS: "${key}" missing or not flagged echo`);
}
for (const qid of QUEST_KEYS) {
    const q = QUESTS[qid];
    check(HISTORICAL_FIGURES[q.giver], `quest ${qid}: giver "${q.giver}" not a figure`);
    if (q.turnInWith) check(HISTORICAL_FIGURES[q.turnInWith], `quest ${qid}: turnInWith "${q.turnInWith}" not a figure`);
}

// ── Asset paths ─────────────────────────────────────────────────────────────
// '/images/x.png' must exist under public/ — anything else 404s in production.
console.log('Asset paths…');
const imageRefs = [];
for (const z of Object.values(ZINES)) imageRefs.push(z.image);
for (const t of Object.values(TREASURES)) imageRefs.push(t.image);
for (const h of Object.values(HEALING_ITEMS)) imageRefs.push(h.image);
const srcDir = path.join(root, 'src');
for (const f of fs.readdirSync(srcDir)) {
    const text = fs.readFileSync(path.join(srcDir, f), 'utf8');
    for (const m of text.matchAll(/['"](\/images\/[^'"]+\.(?:png|jpg|svg|webp))['"]/g)) imageRefs.push(m[1]);
}
for (const ref of new Set(imageRefs)) {
    check(fs.existsSync(path.join(root, 'public', ref)), `missing in public/: ${ref}`);
}

// ── Loot tables ─────────────────────────────────────────────────────────────
// Named effects must be reachable: either in a tier's name pool or placed
// directly by map.js set-piece rooms.
console.log('Loot tables…');
const poolNames = new Set(Object.values(LOOT_TIERS).flatMap(t => t.names));
const MAP_PLACED = new Set(['STAR House Key']);
for (const name of Object.keys(NAMED_ITEM_EFFECTS)) {
    check(poolNames.has(name) || MAP_PLACED.has(name), `NAMED_ITEM_EFFECTS: "${name}" never drops (not in any tier pool)`);
}
check(Object.keys(ZINES).length >= GOALS.zines, `GOALS.zines (${GOALS.zines}) exceeds zine pool (${Object.keys(ZINES).length})`);
const nonEcho = Object.values(HISTORICAL_FIGURES).filter(f => !f.echo).length;
check(nonEcho >= GOALS.figures, `GOALS.figures (${GOALS.figures}) exceeds figure pool (${nonEcho})`);

// ── RPG tables ──────────────────────────────────────────────────────────────
console.log('RPG tables…');
const VALID_PROCS = new Set(['burn', 'shock', 'freeze']);
for (const k of WEAPON_KEYS) {
    const w = WEAPONS[k];
    check(w.id === k, `weapon ${k}: id mismatch`);
    check(typeof w.dmgBonus === 'number' && typeof w.kb === 'number' && (w.reach === 1 || w.reach === 2),
        `weapon ${k}: bad stats`);
    check(w.icon && w.name && w.desc && TIER_OK(w.tier), `weapon ${k}: missing display fields`);
    if (w.proc) check(VALID_PROCS.has(w.proc.status) && w.proc.chance > 0 && w.proc.chance <= 1 && w.proc.duration > 0,
        `weapon ${k}: bad proc`);
}
function TIER_OK(t) { return ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(t); }
for (const k of POTION_KEYS) {
    const p = POTIONS[k];
    check(p.id === k && p.icon && p.name && p.price > 0 && ['1','2','3','4'].includes(p.hotkey),
        `potion ${k}: malformed`);
}
const seenHotkeys = new Set(POTION_KEYS.map(k => POTIONS[k].hotkey));
check(seenHotkeys.size === POTION_KEYS.length, 'potions: duplicate hotkeys');
const VALID_PERKS = new Set(['crit', 'magnet', 'light', 'regen', 'aura']);
for (const k of COMPANION_KEYS) {
    const c = COMPANIONS[k];
    check(c.id === k && c.icon && c.name && c.color && VALID_PERKS.has(c.perk) && c.perkDesc,
        `companion ${k}: malformed`);
}
const VALID_FISH_FX = new Set(['heal1', 'heal2', 'ward', 'shock_aura', 'warpaint', 'fullheal', 'jump', 'heart_piece']);
let fishWeight = 0;
for (const k of FISH_KEYS) {
    const f = FISH[k];
    check(f.id === k && f.icon && f.name && f.weight > 0 && TIER_OK(f.tier) && VALID_FISH_FX.has(f.effect),
        `fish ${k}: malformed`);
    fishWeight += f.weight;
}
check(fishWeight > 0, 'fish: zero total weight');

// ── Map generation invariants ───────────────────────────────────────────────
console.log('Map generation…');
function freshGame(depth) {
    return {
        depth,
        persistent: { seenFigures: {}, seenEchoes: {}, deepestReached: depth, treasures: 0 },
        player: {}, map: {}, items: [], npcs: [], trolls: [],
        particles: [], spriteFX: [], seen: {}, floatingText: []
    };
}
const PASSABLE = new Set(['.', '>', '=', 'C']);
for (let depth = 1; depth <= 10; depth++) {
    for (let trial = 0; trial < 25; trial++) {
        const game = freshGame(depth);
        generateMap(game);
        check(game.mapWidth % 10 === 0 && game.mapHeight % 10 === 0,
            `depth ${depth}: map ${game.mapWidth}x${game.mapHeight} not room-aligned`);
        const spawnTile = game.map[`${Math.floor(game.player.x)},${Math.ceil(game.player.y)}`];
        check(PASSABLE.has(spawnTile), `depth ${depth}: spawn tile "${spawnTile}" not passable`);
        const hasStairs = Object.values(game.map).includes('>');
        check(hasStairs === (depth < 10), `depth ${depth}: stairs ${hasStairs ? 'present' : 'missing'} (expected ${depth < 10})`);
        for (const it of game.items) {
            if (it.type === 'zine') check(ZINES[it.zineKey], `depth ${depth}: zine item with bad key "${it.zineKey}"`);
            if (it.type === 'healing') check(HEALING_ITEMS[it.healingKey], `depth ${depth}: healing item with bad key "${it.healingKey}"`);
            if (it.type === 'weapon') check(WEAPONS[it.weaponKey], `depth ${depth}: weapon item with bad key "${it.weaponKey}"`);
            if (it.type === 'cage') check(COMPANIONS[it.companionKey], `depth ${depth}: cage with bad companion "${it.companionKey}"`);
        }
        for (const n of game.npcs) {
            if (n.type === 'merchant' || n.type === 'companion') continue;
            check(HISTORICAL_FIGURES[n.figureKey], `depth ${depth}: npc with bad figureKey "${n.figureKey}"`);
        }
        if (depth % 5 === 0) {
            check(game.trolls.some(t => t.enemyType === 'boss'), `depth ${depth}: boss missing on boss floor`);
        }
        // Vault invariants: outer + inner doors exist, a Small Key is on the
        // floor, and the treasure chamber actually contains treasure.
        if (game.vault) {
            const v = game.vault;
            check(game.map[`${v.doorX},${v.doorY}`] === 'V', `depth ${depth}: vault outer door tile missing`);
            check(game.map[`${v.innerX},${v.innerY}`] === 'V', `depth ${depth}: vault inner door tile missing`);
            check(game.items.some(i => i.type === 'key'), `depth ${depth}: vault exists but no Small Key on floor`);
            check(game.items.some(i => i.type === 'heart_piece'), `depth ${depth}: vault has no heart piece`);
            check(game.mapHeight > v.innerY, `depth ${depth}: mapHeight not extended past vault`);
        }
    }
}
// Hub generation across save shapes (legacy true-valued seenFigures included).
for (const seen of [{}, { marsha: true }, { marsha: 3, sylvia: 1, wewha: 7 }]) {
    const game = freshGame(0);
    game.persistent.seenFigures = seen;
    game.persistent.companions = { cat: true, crow: true };
    game.persistent.deepestReached = 8;
    generateHubMap(game);
    check(game.inHub === true, 'hub: inHub flag not set');
    check(Object.values(game.map).includes('D') && Object.values(game.map).includes('F'),
        'hub: portal/campfire tile missing');
    check(Object.values(game.map).includes('W'), 'hub: fishing pond missing');
    check(game.npcs.some(n => n.type === 'merchant'), 'hub: Mercy missing from the lobby');
    check(game.npcs.filter(n => n.type === 'companion').length === 2, 'hub: rescued companions not idling');
    for (const n of game.npcs) {
        if (n.type === 'merchant') continue;
        if (n.type === 'companion') { check(COMPANIONS[n.companionKey], `hub: idle companion bad key`); continue; }
        check(HISTORICAL_FIGURES[n.figureKey], `hub: npc bad figureKey "${n.figureKey}"`);
    }
}

if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
}
console.log('\nAll integrity checks passed ✓');
