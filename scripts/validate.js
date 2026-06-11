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
    LOOT_TIERS, NAMED_ITEM_EFFECTS, QUESTS, QUEST_KEYS, GOALS
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
const PASSABLE = new Set(['.', '>', '=', '^', 'C', 'H']);
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
        }
        for (const n of game.npcs) {
            check(HISTORICAL_FIGURES[n.figureKey], `depth ${depth}: npc with bad figureKey "${n.figureKey}"`);
        }
        if (depth % 5 === 0) {
            check(game.trolls.some(t => t.enemyType === 'boss'), `depth ${depth}: boss missing on boss floor`);
        }
    }
}
// Hub generation across save shapes (legacy true-valued seenFigures included).
for (const seen of [{}, { marsha: true }, { marsha: 3, sylvia: 1, wewha: 7 }]) {
    const game = freshGame(0);
    game.persistent.seenFigures = seen;
    game.persistent.deepestReached = 8;
    generateHubMap(game);
    check(game.inHub === true, 'hub: inHub flag not set');
    check(Object.values(game.map).includes('D') && Object.values(game.map).includes('F'),
        'hub: portal/campfire tile missing');
    for (const n of game.npcs) check(HISTORICAL_FIGURES[n.figureKey], `hub: npc bad figureKey "${n.figureKey}"`);
}

if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
}
console.log('\nAll integrity checks passed ✓');
