import { UI, DialogueUI, GeminiUI } from './ui.js';
import { generateMap, generateHubMap } from './map.js';
import { attackEnemy, takeDamage, tickStatus, tickCombo, resetCombo, applyStatus, isFrozen } from './combat.js';
import { HEALING_ITEMS, TREASURES, HISTORICAL_FIGURES, LOOT_TIERS, DIFFICULTIES, NAMED_ITEM_EFFECTS, QUESTS, QUEST_KEYS } from './data.js';
import { Audio } from './audio.js';

// Expose UI globally so map.js village generator can show status messages.
window.UI = UI;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const T = 32; // tile size in pixels for side-view platformer

const game = {
    persistent: {
        treasures: 0,
        healthUpgrades: 0,
        damageUpgrades: 0,
        healthCost: 3,
        damageCost: 5,
        seenZines: {},
        seenFigures: {},
        // Difficulty mode persists across runs so the player can crank it
        // back up after dying on Easy. Default Normal until the player picks.
        difficulty: 'normal',
        // Permanent +1 max HP charms accumulated from Legendary loot drops.
        permanentHearts: 0,
        // Checkpoint depth — every time the player descends, this advances.
        // On death, the next heir starts here (capped at deepest reached) so
        // progress isn't fully wiped from level 1.
        checkpointDepth: 1,
        deepestReached: 1,
        // Has the player seen the cinematic intro? Replay button stays in camp.
        seenIntro: false,
        // Cozy quest tracker. Keyed by quest id; value: { status, progress }.
        // status: 'available' | 'active' | 'ready' | 'completed'.
        quests: {}
    },
    player: {
        x: 5, y: 5,
        vx: 0, vy: 0,
        health: 3, maxHealth: 3, baseDamage: 1,
        alive: true, hurtCooldown: 0, attackCooldown: 0,
        facingX: 1, facingY: 0,
        hasBrick: false, hasRage: false,
        trait: null, traits: [],
        classObj: null,
        colorPalette: 0,
        onGround: false,
        // Platformer physics state
        coyoteTimer: 0,         // frames since left ground
        jumpBuffer: 0,          // buffered jump press
        jumpsLeft: 1,           // for double jump
        dashTimer: 0,           // active dash duration
        dashCooldown: 0,        // ticks until next dash allowed
        dashDir: 1,
        dropThrough: 0,         // grace frames where one-way platforms are intangible
        // Class power state
        powerCooldown: 0,
        powerActive: 0,         // active duration of current power
        powerType: null,        // 'rage' | 'slow' | 'aura' | 'bump' | 'bomb' | null
        // Charge attack state — hold E to build power, release to unleash a heavy strike.
        chargeAttack: 0,        // 0..120 (frames held)
        chargeReady: false,     // true once charge meter exceeds threshold
        // Combo system: tracked between calls so successful Quick attacks
        // chain into a 3-step string (Slash → Strike → FINISHER).
        comboCount: 0,
        comboTimer: 0,
        comboPeak: 0,
        // Loot-side temp buff: rare+ pickups grant +1 damage for a few seconds.
        lootBuff: 0,
        // Trans motherhood status effects
        damageImmune: 0,    // frames of damage immunity (Shield of Civic Courage)
        bloomRegen: 0,      // frames of HP regen remaining
        bloomRate: 0,       // HP per frame during bloom regen
        defenseBuff: 0,     // frames of reduced incoming damage
        // Lineage stat tracking
        kills: 0, depthReached: 1, scrapEarned: 0
    },
    depth: 1,
    zines: 0,
    treasures: 0,
    historicalFigures: 0,
    isPaused: false,
    hitStop: 0, // Frame freeze counter
    particles: [],
    map: {},
    items: [],
    npcs: [],
    trolls: [],
    seen: {},
    mapWidth: 40,
    mapHeight: 30,
    turnCounter: 0,
    camera: { width: 24, height: 18 },
    // Smooth camera state — lerps toward target with look-ahead based on facing/velocity.
    camX: 0, camY: 0,
    camInitialized: false,
    floatingText: [],
    // Short-lived sprite FX (e.g. opened-chest puff). Each entry:
    // { sprite: imagesKey, x, y, life, maxLife, rise, w, h }.
    spriteFX: [],
    attackAnim: null,
    animFrame: 0,
    // Full-screen red flash on hurt; combat.js bumps this to 1.0.
    damageFlash: 0,
    // Subtle screen shake intensity (decays each frame).
    screenShake: 0
};

const TRAITS = [
    { id: 'none',      name: 'Standard Issue',  desc: 'Just a regular, completely normal trans person.' },
    { id: 'euphoria',  name: 'Gender Euphoria', desc: 'Riding the high! +1 dmg, attacks reset cooldown. 🏳️‍⚧️✨' },
    { id: 'dysphoria', name: 'Dysphoria Day',   desc: 'Everything feels wrong. View distance halved.' },
    { id: 'clocked',   name: 'Clocked',         desc: 'You stand out. Enemies spot you from much further away.' },
    { id: 'stealth',   name: 'Stealth Mode',    desc: 'Passing privileges. Enemies only react when adjacent.' },
    { id: 't4t',       name: 'T4T',             desc: 'We take care of our own. Healing items heal double.' },
    { id: 'gatekept',  name: 'Gatekept',        desc: 'The medical establishment hates you. Upgrades cost +2.' },
    { id: 'adhd',      name: 'A.D.H.D.',        desc: 'Hyperfocused! Move 25% faster. Squirrel!' },
    { id: 'autism',    name: 'Pattern Master',  desc: 'You see the system. Crit chance +20%.' },
    { id: 'gigantism', name: 'Tall Energy',     desc: 'Huge frame. +1 max HP, but bigger hitbox.' },
    { id: 'dwarfism',  name: 'Compact Mode',    desc: 'Smaller hitbox. Take less damage from blows.' },
    { id: 'vertigo',   name: 'Vertigo',         desc: 'The room spins. Camera tilts when you move.' },
    { id: 'colorblind',name: 'Greyscale',       desc: 'World is black & white. +1 DMG out of spite.' },
    { id: 'nostalgia', name: 'Vibes Of The 90s',desc: 'CRT scanlines bloom. +1 jump in your step.' },
    { id: 'bipolar',   name: 'Big Mood',        desc: 'Damage swings wildly between 0.5x and 2.5x.' },
    { id: 'insomnia',  name: 'No Sleep',        desc: 'Always alert. Coyote time doubled.' },
    { id: 'chronic',   name: 'Chronic Pain',    desc: 'Every step hurts. Slower, but extra invuln frames.' },
    { id: 'glitter',   name: 'Glitter Trail',   desc: 'You leave sparkles wherever you walk. Pure aesthetic.' }
];

const CLASSES = [
    { id: 'anarchist',  name: 'Anarchist',         power: 'BLACK BLOC',     desc: 'R: Rage burst — 2x dmg for 3s.' },
    { id: 'terrorist',  name: 'Gender Terrorist',  power: 'GLITTER BOMB',   desc: 'R: Throw a bomb that hits everything nearby.' },
    { id: 'archivist',  name: 'Library Archivist', power: 'TIME DILATION',  desc: 'R: Slow enemies for 4s.' },
    { id: 'brawler',    name: 'Glitter Brawler',   power: 'PRIDE DASH',     desc: 'R: Dash + invuln. Auto-kills weak foes.' },
    { id: 'dealer',     name: 'Hormone Dealer',    power: 'HRT BUMP',       desc: 'R: Heal 2 HP and gain temp damage boost.' },
    { id: 'aidworker',  name: 'Mutual Aid Worker', power: 'SOLIDARITY',     desc: 'R: Healing aura. Restores 1 HP every 2s for 8s.' }
];
const NAMES = ['Ash', 'River', 'Rowan', 'Sage', 'Onyx', 'Quinn', 'Zephyr', 'Nova', 'Vesper', 'Wren', 'Indigo', 'Marlow', 'Sky', 'Phoenix', 'August'];

// Lineage history of all past characters (persistent across runs)
const lineage = [];

// Save/load persistent state to localStorage so progress carries between sessions.
const SAVE_KEY = 'queekraft-save-v1';
function saveGame() {
    try {
        const payload = {
            persistent: game.persistent,
            lineage,
            colorPalette: game.player.colorPalette || 0,
            ts: Date.now()
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (e) {
        // localStorage may be disabled (private mode); silently no-op.
    }
}
function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.persistent) Object.assign(game.persistent, data.persistent);
        if (Array.isArray(data.lineage)) {
            lineage.length = 0;
            data.lineage.forEach(l => lineage.push(l));
        }
        if (typeof data.colorPalette === 'number') game.player.colorPalette = data.colorPalette;
    } catch (e) {
        // Corrupted save — ignore and start fresh.
    }
    // Difficulty fallback for older saves that didn't include the field.
    if (!DIFFICULTIES[game.persistent.difficulty]) game.persistent.difficulty = 'normal';
    if (typeof game.persistent.permanentHearts !== 'number') game.persistent.permanentHearts = 0;
    if (typeof game.persistent.checkpointDepth !== 'number') game.persistent.checkpointDepth = 1;
    if (typeof game.persistent.deepestReached !== 'number') game.persistent.deepestReached = 1;
    if (typeof game.persistent.seenIntro !== 'boolean') game.persistent.seenIntro = false;
    if (!game.persistent.quests || typeof game.persistent.quests !== 'object') game.persistent.quests = {};
    if (!game.persistent.npcEncounters || typeof game.persistent.npcEncounters !== 'object') game.persistent.npcEncounters = {};
    if (!Array.isArray(game.persistent.mural)) game.persistent.mural = [];
}

// ---------------------------------------------------------------------------
// Quest helpers. Status flow: 'available' (offered, not accepted) → 'active'
// (player accepted, progress < target) → 'ready' (progress >= target,
// awaiting turn-in) → 'completed' (rewarded). 'completed' quests are not
// re-offered. 'tea_for_the_hearth' and 'archive_keeper' are repeatable.
const REPEATABLE_QUESTS = new Set(['tea_for_the_hearth', 'archive_keeper']);

function getQuestState(qid) {
    let st = game.persistent.quests[qid];
    if (!st) {
        st = { status: 'available', progress: 0 };
        game.persistent.quests[qid] = st;
    }
    return st;
}

function questsForGiver(figureKey) {
    return QUEST_KEYS
        .map(k => QUESTS[k])
        .filter(q => q.giver === figureKey || (q.turnInWith && q.turnInWith === figureKey));
}

// Bump progress for all matching active quests. Called from combat hooks,
// pickup hooks, and the descend handler.
function updateQuestProgress(matcher, amount = 1) {
    for (const qid of QUEST_KEYS) {
        const q = QUESTS[qid];
        const st = game.persistent.quests[qid];
        if (!st || st.status !== 'active') continue;
        if (!matcher(q)) continue;
        st.progress = Math.min(q.goal.target, (st.progress || 0) + amount);
        if (st.progress >= q.goal.target) {
            st.status = 'ready';
            UI.addMessage(`📋 Quest ready to turn in: ${q.title}`, 'special');
        }
    }
    saveGame();
}

// Called when an enemy is killed (combat.js dispatches a window event).
function onEnemyKilledForQuests(enemyType) {
    updateQuestProgress(q => q.goal.type === 'kill_enemy' && q.goal.enemyType === enemyType);
}
window.__onEnemyKilledForQuests = onEnemyKilledForQuests;

function onZineCollectedForQuests() {
    updateQuestProgress(q => q.goal.type === 'collect_zines_run');
}

function onItemCollectedForQuests(itemKey) {
    updateQuestProgress(q => q.goal.type === 'collect_item' && q.goal.item === itemKey);
}

function onMuralReadForQuests() {
    updateQuestProgress(q => q.goal.type === 'read_murals');
}

function onDepthReachedForQuests(depth) {
    for (const qid of QUEST_KEYS) {
        const q = QUESTS[qid];
        const st = game.persistent.quests[qid];
        if (!st || st.status !== 'active') continue;
        if (q.goal.type !== 'reach_depth') continue;
        if (depth >= q.goal.target) {
            st.progress = q.goal.target;
            st.status = 'ready';
            UI.addMessage(`📋 Quest ready to turn in: ${q.title}`, 'special');
        } else {
            st.progress = Math.max(st.progress || 0, depth);
        }
    }
    saveGame();
}

// Reset per-run progress for run-scoped quests. Called when a new run starts.
function resetRunScopedQuests() {
    for (const qid of QUEST_KEYS) {
        const q = QUESTS[qid];
        const st = game.persistent.quests[qid];
        if (!st || st.status !== 'active') continue;
        if (q.goal.type === 'collect_zines_run') st.progress = 0;
    }
}

function acceptQuest(qid) {
    const st = getQuestState(qid);
    st.status = 'active';
    st.progress = 0;
    UI.addMessage(`📋 Quest accepted: ${QUESTS[qid].title}`, 'special');
    saveGame();
}

function turnInQuest(qid) {
    const q = QUESTS[qid];
    const st = getQuestState(qid);
    if (st.status !== 'ready') return false;
    const r = q.reward || {};
    if (r.scrap) {
        game.persistent.treasures += r.scrap;
        if (typeof game.treasures === 'number') game.treasures += r.scrap;
    }
    if (r.permanentHearts) {
        game.persistent.permanentHearts = (game.persistent.permanentHearts || 0) + r.permanentHearts;
        if (game.player.alive) {
            game.player.maxHealth += r.permanentHearts;
            game.player.health = game.player.maxHealth;
        }
    }
    if (r.permanentDamage) {
        game.persistent.damageUpgrades = (game.persistent.damageUpgrades || 0) + r.permanentDamage;
        if (game.player.alive) game.player.baseDamage += r.permanentDamage;
    }
    UI.addMessage(`✓ Turned in: ${q.title}. ${r.message || ''}`, 'victory');
    if (REPEATABLE_QUESTS.has(qid)) {
        st.status = 'available';
        st.progress = 0;
    } else {
        st.status = 'completed';
        st.progress = q.goal.target;
    }
    UI.updateStatus(game);
    saveGame();
    return true;
}
window.__acceptQuest = acceptQuest;
window.__turnInQuest = turnInQuest;
window.__questsForGiver = (figureKey) => questsForGiver(figureKey).map(q => ({
    ...q,
    state: game.persistent.quests[q.id] || { status: 'available', progress: 0 }
}));
window.__getAllQuests = () => QUEST_KEYS.map(k => ({
    ...QUESTS[k],
    state: game.persistent.quests[k] || { status: 'available', progress: 0 }
}));
loadGame();

const PALETTES = [
    { id: 'trans-blue', name: '🏳️‍⚧️ Trans Blue', body: '#5BCEFA', accent: '#F5A9B8', glow: '#5BCEFA' },
    { id: 'trans-pink', name: '🏳️‍⚧️ Trans Pink', body: '#F5A9B8', accent: '#5BCEFA', glow: '#F5A9B8' },
    { id: 'rainbow', name: '🏳️‍🌈 Rainbow Pride', body: null, accent: null, glow: '#FF71CE',
        colors: ['#E40303','#FF8C00','#FFED00','#008026','#24408E','#732982','#FFFFFF','#FFAFC8','#74D7EE','#613915','#000000'] }
];

// Per-figure filler colors used when no sprite asset exists.
// body = main silhouette, accent = flower/decoration, hat = hat brim color (null = no hat)
const NPC_FILLER_COLORS = {
    default:             { body: '#B967DB', accent: '#FF71CE', hat: null },
    // Existing figures
    marsha:              { body: '#FF8C00', accent: '#FFD700', hat: '#FF4500' },
    sylvia:              { body: '#FF4500', accent: '#FF8C00', hat: '#CC0000' },
    eleanor:             { body: '#8B4513', accent: '#DEB887', hat: null },
    dora:                { body: '#4682B4', accent: '#87CEEB', hat: null },
    alan:                { body: '#228B22', accent: '#90EE90', hat: null },
    charley:             { body: '#8B4513', accent: '#D2691E', hat: '#5F3A1B' },
    lili:                { body: '#DA70D6', accent: '#FFB6C1', hat: null },
    christine:           { body: '#FF69B4', accent: '#FFB6C1', hat: null },
    lucy:                { body: '#4B0082', accent: '#DDA0DD', hat: null },
    peyton_oconner:      { body: '#2E8B57', accent: '#98FB98', hat: null },
    allison_scott:       { body: '#DC143C', accent: '#FF6B6B', hat: null },
    blade_journalists:   { body: '#1C1C1C', accent: '#FFFFFF', hat: null },
    community_mothers:   { body: '#8B0000', accent: '#FFD700', hat: null },
    // Trans motherhood icons
    crystal_labeija:     { body: '#FFD700', accent: '#FF1493', hat: '#DAA520' },
    angie_xtravaganza:   { body: '#FF69B4', accent: '#FFD700', hat: '#FF1493' },
    mama_gloria:         { body: '#20B2AA', accent: '#98FB98', hat: null },
    kenya_cuevas:        { body: '#B22222', accent: '#FFD700', hat: null },
    gauri_sawant:        { body: '#FF8C00', accent: '#FF69B4', hat: null },
    mariela_munoz:       { body: '#9370DB', accent: '#FFD700', hat: null },
    cleopatra_kambugu:   { body: '#4169E1', accent: '#FFD700', hat: null },
    wewha:               { body: '#8B4513', accent: '#32CD32', hat: null },
    jennifer_boylan:     { body: '#4682B4', accent: '#FFFFFF', hat: null },
    mj_rodriguez:        { body: '#FF1493', accent: '#FFD700', hat: '#C71585' },
    coccinelle:          { body: '#DC143C', accent: '#FFF8DC', hat: null },
};

function generateHeirs() {
    const heirs = [];
    for (let i = 0; i < 3; i++) {
        const cls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
        // Some heirs roll a second trait — chaotic, like genetics should be
        const traits = [TRAITS[Math.floor(Math.random() * TRAITS.length)]];
        if (Math.random() < 0.35) {
            const second = TRAITS[Math.floor(Math.random() * TRAITS.length)];
            if (second.id !== traits[0].id) traits.push(second);
        }
        heirs.push({
            name: NAMES[Math.floor(Math.random() * NAMES.length)],
            classObj: cls,
            className: cls.name,
            traits,
            trait: traits[0]
        });
    }
    return heirs;
}

// === Asset manifest ===
// Mix of high-quality hand-processed pixel sprites (clean alpha) and some
// bulk-generated images that shipped with opaque/black backgrounds. We load
// everything, then auto-reject any image whose four corners are fully opaque
// (the tell-tale sign of an un-keyed background) so it falls back to the
// procedural hand-drawn rendering instead of showing as a "walking square".
const ASSET_PATHS = {
    // ── Player (palette variants — clean pixel sprites) ─────────────────
    player_blue:        '/images/spr_player_blue.png',
    player_pink:        '/images/spr_player_pink.png',
    player_rainbow:     '/images/spr_player_rainbow.png',
    // ── Core sprites ────────────────────────────────────────────────────
    chest:              '/images/spr_chest.png',
    chest_open:         '/images/spr_chest_open.png',
    zine:               '/images/spr_zine.png',
    boss:               '/images/spr_boss.png',
    // ── NPC figure sprites ──────────────────────────────────────────────
    npc_community_mothers: '/images/spr_community_mothers.png',
    npc_marsha:         '/images/spr_marsha.png',
    npc_sylvia:         '/images/spr_sylvia.png',
    npc_eleanor:        '/images/spr_eleanor.png',
    npc_charley:        '/images/spr_charley.png',
    npc_dora:           '/images/spr_dora.png',
    npc_hart:           '/images/spr_hart.png',
    npc_lili:           '/images/spr_lili.png',
    npc_lucy:           '/images/spr_lucy.png',
    npc_christine:      '/images/spr_christine.png',
    npc_holly:          '/images/spr_holly.png',
    npc_zeke:           '/images/spr_zeke.png',
    npc_divine:         '/images/spr_divine.png',
    npc_peyton:         '/images/spr_peyton.png',
    npc_allison:        '/images/spr_allison.png',
    // ── Enemy sprites ───────────────────────────────────────────────────
    enemy:              '/images/spr_enemy.png',
    enemy_wraith:       '/images/spr_wraith.png',
    enemy_gatekeeper:   '/images/spr_gatekeeper.png',
    enemy_concern:      '/images/spr_concern_troll.png',
    enemy_police:       '/images/spr_police.png',
    enemy_bigot:        '/images/spr_bigot.png',
    enemy_swarm:        '/images/spr_swarm.png',
    enemy_boss:         '/images/spr_boss.png',
    enemy_dark_beast:   '/images/spr_dark_beast.png',
    enemy_ghost:        '/images/spr_ghost_enemy.png',
    enemy_bureaucracy:  '/images/spr_bureaucracy_enemy.png',
    enemy_corporate_drone: '/images/spr_corporate_drone.png',
    enemy_gentrifier:   '/images/spr_gentrifier.png',
    enemy_hb2_enforcer: '/images/spr_hb2_enforcer.png',
    // ── Themed loot art ─────────────────────────────────────────────────
    loot_crown:              '/images/spr_crown.png',
    loot_pride_medallion:    '/images/spr_pride_medallion.png',
    loot_bouquet:            '/images/spr_bouquet.png',
    loot_banjo:              '/images/spr_banjo.png',
    loot_chalk_bag:          '/images/spr_chalk_bag.png',
    loot_bike_lock:          '/images/spr_bike_lock.png',
    loot_forage_basket:      '/images/spr_forage_basket.png',
    loot_spray_can:          '/images/spr_spray_can.png',
    loot_tattoo_gun:         '/images/spr_tattoo_gun.png',
    // ── Generated item art ──────────────────────────────────────────────
    item_archive:        '/images/item_archive.png',
    item_bloom:          '/images/item_bloom.png',
    item_bodhi:          '/images/item_bodhi.png',
    item_book:           '/images/item_book.png',
    item_civic_shield:   '/images/item_civic_shield.png',
    item_crystal:        '/images/item_crystal.png',
    item_fierce_light:   '/images/item_fierce_light.png',
    item_firestorm:      '/images/item_firestorm.png',
    item_hearth:         '/images/item_hearth.png',
    item_homegrown:      '/images/item_homegrown.png',
    item_kindred:        '/images/item_kindred.png',
    item_outright:       '/images/item_outright.png',
    item_phoenix:        '/images/item_phoenix.png',
    item_pride_flag:     '/images/item_pride_flag.png',
    item_resistance_pin: '/images/item_resistance_pin.png',
    item_shelter_key:    '/images/item_shelter_key.png',
    item_stonewall:      '/images/item_stonewall.png',
    item_sweet_tea:      '/images/item_sweet_tea.png',
    item_tea:            '/images/item_tea.png',
    item_trans_charm:    '/images/item_trans_charm.png',
    // ── Tile textures (clean pre-AI floor/wall) ─────────────────────────
    tile_floor: '/images/tex_floor.png',
    tile_wall:  '/images/tex_wall.png'
};

// Enemy type → sprite key. Auto-reject filters out any that load with an
// opaque background; those fall back to the procedural shapes.
const ENEMY_SPRITES = {
    troll:      'enemy_dark_beast',
    wraith:     'enemy_wraith',
    gatekeeper: 'enemy_gatekeeper',
    concern:    'enemy_concern',
    police:     'enemy_police',
    bigot:      'enemy_bigot',
    swarm:      'enemy_swarm'
};

// NPC figure key → sprite key. Falls back to colored filler when the
// sprite is missing or rejected.
const NPC_SPRITES = {
    'community_mothers':     'npc_community_mothers',
    'marsha':                'npc_marsha',
    'sylvia':                'npc_sylvia',
    'eleanor':               'npc_eleanor',
    'charley':               'npc_charley',
    'dora':                  'npc_dora',
    'alan':                  'npc_hart',
    'lili':                  'npc_lili',
    'lucy':                  'npc_lucy',
    'christine':             'npc_christine',
    'william_dorsey_swann':  'npc_zeke',
    'peyton_oconner':        'npc_peyton',
    'allison_scott':         'npc_allison',
    'mama_gloria':           'npc_holly',
    'blade_journalists':     'npc_divine',
    'crystal_labeija':       'npc_divine',
    'paris_dupree':          'npc_zeke',
    'dorian_corey':          'npc_holly',
    'kenya_cuevas':          'npc_allison',
    'cleopatra_kambugu':     'npc_dora',
    'mariela_munoz':         'npc_lucy'
};

// Named-loot → sprite key.
const NAMED_LOOT_SPRITES = {
    'Crown of Eleanor Rykener':         'loot_crown',
    "LaBeija's Trophy":                 'loot_pride_medallion',
    'The Mausoleum Flower':             'loot_bouquet',
    'Hearth Stone':                     'item_hearth',
    "Mother's Fierce Light":            'item_fierce_light',
    "House Mother's Sash":              'loot_pride_medallion',
    'Stonewall Brick':                  'item_stonewall',
    "Compton's Cafeteria Sugar Shaker": 'item_sweet_tea',
    "Lili's Last Brushstroke":          'loot_spray_can',
    'Safe Shelter Key':                 'item_shelter_key',
    'STAR House Key':                   'item_shelter_key',
    "Rivera's Megaphone":               'loot_spray_can',
    "Mama Gloria's Charm Book":         'item_book',
    "Mariela's Tarot Deck":             'item_bodhi',
    "Boylan's Memoir":                  'item_book',
    'Vicks Touch of Care':              'item_kindred',
    "Sawant's Petition":                'item_civic_shield',
    'Homegrown Families Blessing':      'item_homegrown',
    "Marsha's Hairpin":                 'loot_pride_medallion',
    "Sylvia's Lighter":                 'item_firestorm',
    'Stonewall Coin':                   'item_stonewall',
    "Hirschfeld's Notes":               'item_archive',
    "Christine's Letter":               'item_book',
    'Gilded Pronoun Pin':               'item_resistance_pin',
    "Eleanor's Diary":                  'item_book',
    'Resistance Pin':                   'item_resistance_pin',
    'Pride Shoelace':                   'item_pride_flag',
    'Youth OUTright Badge':             'item_outright',
    "Mutual-Aid Token":                 'item_kindred',
    'Solidarity Charm':                 'item_trans_charm',
    'Liberation Pamphlet':              'item_archive',
    'Archival Fragment':                'item_archive',
    'Phoenix Flame':                    'item_phoenix',
    'Bloom of Resistance':              'item_bloom',
    'Electric Dirt':                    'item_crystal',
    'Bodhi Seed':                       'item_bodhi'
};

const images = {};
for (const k of Object.keys(ASSET_PATHS)) images[k] = new Image();

// Detect un-keyed backgrounds: if all four corners of the loaded image are
// (nearly) fully opaque, it's a flat-background render, not a sprite cut-out
// — flag it so imgReady() rejects it and the procedural art is used instead.
// Tile textures are exempt (they're meant to tile edge-to-edge).
const TEXTURE_KEYS = new Set(['tile_floor', 'tile_wall']);
function markIfOpaqueBackground(key, img) {
    if (TEXTURE_KEYS.has(key)) return;
    try {
        const c = document.createElement('canvas');
        const S = 24;
        c.width = S; c.height = S;
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(img, 0, 0, S, S);
        const corners = [
            cx.getImageData(0, 0, 1, 1).data[3],
            cx.getImageData(S - 1, 0, 1, 1).data[3],
            cx.getImageData(0, S - 1, 1, 1).data[3],
            cx.getImageData(S - 1, S - 1, 1, 1).data[3]
        ];
        const opaqueCorners = corners.filter(a => a > 240).length;
        if (opaqueCorners >= 3) {
            img.__opaqueBg = true;
            console.warn(`Sprite "${key}" has an opaque background — using procedural fallback.`);
        }
    } catch (e) {
        // Canvas tainted or failed — leave the sprite enabled.
    }
}

let pendingImages = Object.keys(ASSET_PATHS).length;
let initStarted = false;
function tickLoaded() {
    pendingImages--;
    if (pendingImages <= 0 && !initStarted) {
        initStarted = true;
        initGame();
    }
}
for (const [k, path] of Object.entries(ASSET_PATHS)) {
    images[k].onload  = () => { markIfOpaqueBackground(k, images[k]); tickLoaded(); };
    images[k].onerror = () => { console.warn(`Asset failed: ${path}`); tickLoaded(); };
    images[k].src = path;
}
// Failsafe — if asset loading hangs, start without textures after 5s.
setTimeout(() => { if (!initStarted) { initStarted = true; initGame(); } }, 5000);

// True when an image finished loading, is safe to drawImage(), and isn't a
// flat-background render we've flagged for procedural fallback.
function imgReady(img) { return img && img.complete && img.naturalWidth > 0 && !img.__opaqueBg; }

function updateResolution() {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait) {
        // Vertical/Portrait Mode (iPhone)
        game.camera.width = 12;
        game.camera.height = 20;
    } else {
        // Landscape (Desktop/Tablet)
        game.camera.width = 24;
        game.camera.height = 16;
    }
    canvas.width = game.camera.width * T;
    canvas.height = game.camera.height * T;
    // ensure pixel art isn't blurry when resized
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', updateResolution);

let patterns = {};
function initGame() {
    updateResolution();

    // Assign a default class on very first run so the PWR button works!
    if (!game.player.classObj) {
        game.player.classObj = CLASSES[0];
        game.player.className = CLASSES[0].name;
    }

    if (imgReady(images.tile_floor)) patterns.floor = ctx.createPattern(images.tile_floor, 'repeat');
    if (imgReady(images.tile_wall)) patterns.wall = ctx.createPattern(images.tile_wall, 'repeat');
    if (imgReady(images.tile_platform)) patterns.platform = ctx.createPattern(images.tile_platform, 'repeat');
    if (imgReady(images.tile_dirt)) patterns.dirt = ctx.createPattern(images.tile_dirt, 'repeat');
    if (imgReady(images.tile_grass)) patterns.grass = ctx.createPattern(images.tile_grass, 'repeat');
    if (imgReady(images.tile_ice)) patterns.ice = ctx.createPattern(images.tile_ice, 'repeat');
    if (imgReady(images.tile_trampoline)) patterns.trampoline = ctx.createPattern(images.tile_trampoline, 'repeat');
    if (imgReady(images.tile_spikes)) patterns.spikes = ctx.createPattern(images.tile_spikes, 'repeat');
    if (imgReady(images.tile_water)) patterns.water = ctx.createPattern(images.tile_water, 'repeat');
    if (imgReady(images.tile_acid)) patterns.acid = ctx.createPattern(images.tile_acid, 'repeat');
    if (imgReady(images.tile_neon_border)) patterns.neon_border = ctx.createPattern(images.tile_neon_border, 'repeat');
    if (imgReady(images.tile_background)) patterns.background = ctx.createPattern(images.tile_background, 'repeat');

    // First-time players see the cinematic intro before the camp screen.
    if (!game.persistent.seenIntro) {
        playIntro(() => {
            game.persistent.seenIntro = true;
            saveGame();
            startCamp();
        });
    } else {
        startCamp();
    }
}

// ---------------------------------------------------------------------------
// Cinematic intro. Walks through a fixed sequence of scenes with auto-advance
// timers, dot indicators, and SPACE / TAP / Next-button to step manually.
// Skip jumps straight to the camp screen. Used on first run and replayable
// from the camp's "Replay Intro Story" button.
function playIntro(onDone) {
    const screen = document.getElementById('intro-screen');
    const dotsEl = document.getElementById('intro-dots');
    const skipBtn = document.getElementById('intro-skip');
    const nextBtn = document.getElementById('intro-next');
    const scenes = Array.from(screen.querySelectorAll('.intro-scene'));
    if (!scenes.length) { onDone && onDone(); return; }

    // Per-scene auto-advance times in ms. The CONTROLS scene & the final
    // logo scene linger longer because they have more to read / no dialog.
    const sceneDurations = [3200, 3200, 3500, 3200, 4200, 4200, 6500, 8000];

    let idx = 0;
    let timer = null;
    let cleanedUp = false;

    // Build dot indicators (one per scene).
    dotsEl.innerHTML = '';
    scenes.forEach(() => {
        const d = document.createElement('div');
        d.className = 'dot';
        dotsEl.appendChild(d);
    });
    const dots = Array.from(dotsEl.querySelectorAll('.dot'));

    function show(i) {
        if (timer) { clearTimeout(timer); timer = null; }
        scenes.forEach((s, n) => s.classList.toggle('active', n === i));
        dots.forEach((d, n) => d.classList.toggle('active', n === i));
        if (i < scenes.length - 1) {
            const dur = sceneDurations[i] || 3500;
            timer = setTimeout(() => show(i + 1), dur);
        }
    }

    function advance() {
        if (idx >= scenes.length - 1) {
            finish();
        } else {
            idx += 1;
            show(idx);
        }
    }

    function finish() {
        if (cleanedUp) return;
        cleanedUp = true;
        if (timer) { clearTimeout(timer); timer = null; }
        screen.style.display = 'none';
        document.removeEventListener('keydown', onKey, true);
        screen.removeEventListener('click', onClick);
        skipBtn.removeEventListener('click', skip);
        nextBtn.removeEventListener('click', nextHandler);
        // Tiny delay so the click that closed the intro doesn't bleed into
        // the camp's "Enter the Wasteland" button.
        setTimeout(() => onDone && onDone(), 50);
    }

    function onKey(e) {
        if (e.code === 'Escape') { e.preventDefault(); finish(); }
        else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
            e.preventDefault();
            advance();
        }
    }
    function onClick(e) {
        // Ignore clicks on the buttons themselves — they have their own handlers.
        if (e.target.closest('#intro-controls-bar')) return;
        advance();
    }
    function skip(e) { e.stopPropagation(); finish(); }
    function nextHandler(e) { e.stopPropagation(); advance(); }

    screen.style.display = 'flex';
    document.addEventListener('keydown', onKey, true);
    screen.addEventListener('click', onClick);
    skipBtn.addEventListener('click', skip);
    nextBtn.addEventListener('click', nextHandler);

    show(0);
}

// Expose for the camp's "Replay Intro" button.
window.__playIntro = playIntro;

function spawnParticle(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
        game.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 2,
            life: 1.0,
            color: color,
            size: 2 + Math.random() * 3
        });
    }
}

const PERKS = [
    { id: 'hp', name: 'Vitality', desc: '+1 Max HP and heal to full.', effect: (p) => { p.maxHealth += 1; p.health = p.maxHealth; } },
    { id: 'dmg', name: 'Strength', desc: '+1 Base Damage.', effect: (p) => { p.baseDamage += 1; } },
    { id: 'speed', name: 'Agility', desc: 'Slightly faster movement and acceleration.', effect: (p) => { p.hasSpeedPerk = true; } },
    { id: 'jump', name: 'Airborne', desc: 'Gain an extra jump.', effect: (p) => { p.extraJumps = (p.extraJumps || 0) + 1; } },
    { id: 'crit', name: 'Precision', desc: '+10% Crit Chance.', effect: (p) => { p.critBonus = (p.critBonus || 0) + 0.1; } },
    { id: 'regen', name: 'Recovery', desc: 'Slowly regenerate health over time.', effect: (p) => { p.hasRegen = true; } }
];

function addXP(amount) {
    const p = game.player;
    p.xp = (p.xp || 0) + amount;
    p.xpToNext = p.xpToNext || 100;
    
    UI.addMessage(`+${amount} XP`, 'special');
    
    if (p.xp >= p.xpToNext) {
        p.xp -= p.xpToNext;
        p.level = (p.level || 1) + 1;
        p.xpToNext = Math.floor(p.xpToNext * 1.5);
        levelUp();
    }
    UI.updateStatus(game);
}
window.addXP = addXP;

function levelUp() {
    // Pick 3 random perks
    const shuffled = [...PERKS].sort(() => 0.5 - Math.random());
    const choices = shuffled.slice(0, 3);
    
    UI.showLevelUp(choices, (selected) => {
        selected.effect(game.player);
        UI.addMessage(`Leveled Up! New Perk: ${selected.name}`, 'special');
        UI.updateStatus(game);
    });
}

function updateParticles() {
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx * 0.1;
        p.y += p.vy * 0.1;
        p.vy += 0.4; // gravity
        p.life -= 0.04;
        if (p.life <= 0) game.particles.splice(i, 1);
    }
    if (!game.groundEffects) game.groundEffects = [];
    for (let i = game.groundEffects.length - 1; i >= 0; i--) {
        game.groundEffects[i].life--;
        if (game.groundEffects[i].life <= 0) game.groundEffects.splice(i, 1);
    }
}

function startCamp() {
    UI.showCamp(
        game,
        () => {
            // "Enter the Wasteland" goes straight to the dungeon — the village
            // is an optional side area reached via its own button, never on
            // the run critical path.
            startDungeon();
        },
        () => {
            const penalty = (game.player.trait && game.player.trait.id === 'gatekept') ? 2 : 0;
            const cost = game.persistent.healthCost + penalty;
            if (game.persistent.treasures >= cost) {
                game.persistent.treasures -= cost;
                game.persistent.healthUpgrades++;
                game.persistent.healthCost += 2;
                saveGame();
                return true;
            }
            return false;
        },
        () => {
            const penalty = (game.player.trait && game.player.trait.id === 'gatekept') ? 2 : 0;
            const cost = game.persistent.damageCost + penalty;
            if (game.persistent.treasures >= cost) {
                game.persistent.treasures -= cost;
                game.persistent.damageUpgrades++;
                game.persistent.damageCost += 3;
                saveGame();
                return true;
            }
            return false;
        },
        lineage,
        (difficultyId) => {
            if (DIFFICULTIES[difficultyId]) {
                game.persistent.difficulty = difficultyId;
                saveGame();
                UI.addMessage(`Difficulty set: ${DIFFICULTIES[difficultyId].label}`, 'special');
            }
        },
        () => {
            // Player explicitly chose to reset their checkpoint to depth 1.
            game.persistent.checkpointDepth = 1;
            saveGame();
        }
    );
    
    // Hook up AI Guide buttons
    const aiBtn = document.getElementById('ai-guide-btn');
    if (aiBtn) aiBtn.onclick = () => GeminiUI.start(game);
    const topAiBtn = document.getElementById('ai-btn');
    if (topAiBtn) topAiBtn.onclick = () => GeminiUI.start(game);

    // Hook up Village button
    const villageBtn = document.getElementById('visit-village-btn');
    if (villageBtn) villageBtn.onclick = () => {
        UI.modals.camp.style.display = 'none';
        enterHub();
    };
}

async function descend() {
    UI.addMessage("Descending into the deeper archives...", "special");
    
    // Depth Transition Effect
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:black;z-index:9999;opacity:0;transition:opacity 0.5s;display:flex;align-items:center;justify-content:center;color:#5BCEFA;font-size:32px;text-shadow:0 0 20px #5BCEFA;';
    overlay.textContent = `LEVEL ${game.depth + 1}`;
    document.body.appendChild(overlay);
    
    // Fade in
    await new Promise(r => {
        overlay.offsetWidth; // reflow
        overlay.style.opacity = '1';
        setTimeout(r, 600);
    });

    game.depth++;
    // Checkpoint advances each time you descend. Saves to localStorage so the
    // next heir resumes where the previous one fell.
    game.persistent.checkpointDepth = Math.max(game.persistent.checkpointDepth || 1, game.depth);
    game.persistent.deepestReached = Math.max(game.persistent.deepestReached || 1, game.depth);
    game.player.depthReached = game.depth;
    onDepthReachedForQuests(game.depth);
    saveGame();
    // Reset FOV and prompt state so the new floor starts unexplored.
    game.seen = {};
    lastPromptTile = null;
    generateMap(game);
    // generateMap already positions the player on the new floor's spawn tile.
    game.camInitialized = false;
    UI.updateStatus(game);
    UI.addMessage(`📍 Checkpoint reached: Depth ${game.depth}`, 'special');

    // Fade out
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 600);

    levelUp();
}

// Enter the hub town. Called from startCamp's "Enter Wasteland" callback so
// every run begins in the hub; the player walks to the 'D' tile to descend.
function enterHub() {
    const p = game.player;
    p.alive = true;
    // Hub gives the player full health and resets transient combat state, but
    // does NOT touch persistent quest progress / upgrades.
    const diff = DIFFICULTIES[game.persistent.difficulty || 'normal'] || DIFFICULTIES.normal;
    let maxHp = 3 + game.persistent.healthUpgrades + diff.bonusHearts + (game.persistent.permanentHearts || 0);
    if (p.traits && p.traits.some(t => t.id === 'gigantism')) maxHp += 1;
    maxHp = Math.max(1, maxHp);
    p.maxHealth = maxHp;
    p.health = p.maxHealth;
    p.baseDamage = 1 + game.persistent.damageUpgrades;
    p.hurtCooldown = 0;
    p.vx = 0; p.vy = 0;
    p.dashTimer = 0; p.dashCooldown = 0;
    p.powerCooldown = 0; p.powerActive = 0; p.powerType = null;
    p.jumpsLeft = 1;
    p.coyoteTimer = 0;
    p.percent = 0; p.hitstun = 0;
    p.damageImmune = 0;

    generateHubMap(game);
    game.camInitialized = false;
    lastPromptTile = null;
    UI.updateStatus(game);

    const figuresMet = Object.keys(game.persistent.seenFigures || {}).length;
    const zinesCollected = Object.keys(game.persistent.seenZines || {}).length;
    UI.addMessage(`🏘️ Welcome to the Safehouse Village. ${figuresMet} figures met — explore ${figuresMet > 3 ? '6 zones' : 'the open zones'}.`, 'special');
    UI.addMessage('💬 Talk to residents (USE/F). Quest log: J. Campfire (F-tile) re-opens upgrades. Walk right → portal to the wasteland.', 'special');
    if (zinesCollected > 0) UI.addMessage(`📖 ${zinesCollected}/19 zines archived — the village grows with each one.`, 'special');
    gameStarted = true;
}

function startDungeon() {
    // Reset transient dungeon state but apply persistent upgrades
    const p = game.player;
    p.alive = true;
    game.inHub = false;
    const diff = DIFFICULTIES[game.persistent.difficulty || 'normal'] || DIFFICULTIES.normal;
    let maxHp = 3 + game.persistent.healthUpgrades + diff.bonusHearts + (game.persistent.permanentHearts || 0);
    if (p.traits && p.traits.some(t => t.id === 'gigantism')) maxHp += 1;
    maxHp = Math.max(1, maxHp); // Hard mode could never push you below 1 heart
    p.maxHealth = maxHp;
    p.health = p.maxHealth;
    p.baseDamage = 1 + game.persistent.damageUpgrades;
    if (p.trait && p.trait.id === 'colorblind') p.baseDamage += 1;
    p.hasBrick = false;
    p.hasRage = false;
    p.hurtCooldown = 0;
    p.vx = 0; p.vy = 0;
    p.dashTimer = 0; p.dashCooldown = 0;
    p.powerCooldown = 0; p.powerActive = 0; p.powerType = null;
    p.jumpsLeft = 1;
    p.coyoteTimer = 0;
    p.comboCount = 0; p.comboTimer = 0; p.comboPeak = 0;
    p.lootBuff = 0;
    p.kills = 0; p.scrapEarned = 0; p.depthReached = 1;
    resetRunScopedQuests();
    p.xp = 0; p.level = 1; p.xpToNext = 100;
    p.percent = 0; p.hitstun = 0;
    p.extraJumps = 0; p.critBonus = 0; p.hasRegen = false; p.hasSpeedPerk = false;
    p.damageImmune = 0; p.bloomRegen = 0; p.bloomRate = 0; p.defenseBuff = 0;

    // Checkpoint resume: next heir starts at the highest depth previously
    // reached (mediated by `checkpointDepth`). First-ever run is depth 1.
    game.depth = Math.max(1, game.persistent.checkpointDepth || 1);
    p.depthReached = game.depth;
    game.zines = Object.keys(game.persistent.seenZines).length;
    game.historicalFigures = Object.keys(game.persistent.seenFigures).length;
    game.treasures = 0;
    game.seen = {};
    lastPromptTile = null;

    generateMap(game);
    updateFOV();
    UI.updateStatus(game);
    UI.addMessage("🏳️‍⚧️ You enter the wasteland!", "special");
    if (p.classObj) UI.addMessage(`Class: ${p.classObj.name}. Press R for ${p.classObj.power}.`, "special");
    // Mark the game as live ONLY after generateMap has populated game.map.
    // Until this flips, the rAF loop short-circuits — preventing the player
    // from free-falling through an undefined map while the camp modal is open.
    gameStarted = true;
    physicsAccumulator = 0;
    draw();
}

function updateFOV() {
    let fovRadius = 9;
    if (game.player.trait && game.player.trait.id === 'dysphoria') fovRadius = 5;
    if (game.player.traits && game.player.traits.some(t => t.id === 'autism')) fovRadius += 2;

    const px = tileX(), py = tileY();
    for (let dy = -fovRadius; dy <= fovRadius; dy++) {
        for (let dx = -fovRadius; dx <= fovRadius; dx++) {
            if (dx*dx + dy*dy > fovRadius*fovRadius) continue;
            const x = px + dx;
            const y = py + dy;
            if (x >= 0 && y >= 0 && x < game.mapWidth && y < game.mapHeight) {
                game.seen[`${x},${y}`] = true;
            }
        }
    }
}

function isPassable(x, y) {
    if (x < 0 || y < 0 || x >= game.mapWidth || y >= game.mapHeight) return false;
    const tile = game.map[`${x},${y}`];
    // For AI, FOV, attack target lookups: one-way platforms + spikes are passable
    // (enemies don't avoid spikes — they're a *player* hazard).
    // Hub-only special tiles ('D' portal, 'F' campfire) are passable too so the
    // player can stand on them to interact.
    return tile === '.' || tile === '>' || tile === '=' || tile === '^' || tile === 'C' || tile === 'D' || tile === 'F';
}

// Legacy turn-based movement kept as a no-op shim — platformer physics handles motion now.
function movePlayer(_dx, _dy) { /* deprecated by platformer physics */ }

function processTurn() {
    // Decrement attack cooldown each turn (for power attack delay)
    if (game.player.attackCooldown > 0) game.player.attackCooldown--;
    if (game.player.hurtCooldown > 0) game.player.hurtCooldown--;

    const px = tileX();
    const py = tileY();

    // Time-dilation power slows enemies to half tick rate
    const slowed = game.player.powerType === 'slow' && game.player.powerActive > 0;
    if (slowed && game.animFrame % 2 !== 0) return;

    game.trolls.forEach(troll => {
        // Frozen enemies move at half rate.
        const frozen = troll.status && troll.status.freeze && troll.status.freeze.duration > 0;
        const shocked = troll.status && troll.status.shock && troll.status.shock.duration > 0;
        if (shocked) return; // shocked = stunned, skip turn entirely
        troll.moveDelay += frozen ? 0.5 : 1;
        if (troll.moveDelay < troll.maxMoveDelay) return;
        troll.moveDelay = 0;

        // Snap enemy to its tile coords for adjacency math (their float position
        // includes a sub-tile offset from physics landing).
        const tx = trollTileX(troll);
        const ty = trollTileY(troll);

        if (troll.enemyType === 'gatekeeper') {
            // Gatekeepers don't move but DO attack if adjacent
            const dist = Math.abs(px - tx) + Math.abs(py - ty);
            if (dist <= 1) takeDamage(game, 2);
            return;
        }

        const dist = Math.abs(px - tx) + Math.abs(py - ty);
        let alertRadius = troll.alertRadius;
        if (game.player.trait && game.player.trait.id === 'clocked') alertRadius += 3;
        if (game.player.trait && game.player.trait.id === 'stealth') alertRadius = 1;

        // Returns true if (ex, ey) is inside a protected room (safe shelter or hearth).
        const isProtectedRoom = (ex, ey) => {
            const erx = Math.floor(ex / 10), ery = Math.floor(ey / 10);
            const rk = `${erx},${ery}`;
            return (game.safeShelterRooms && game.safeShelterRooms.has(rk)) ||
                   (game.hearthRooms && game.hearthRooms.has(rk));
        };

        const stepToward = () => {
            // Path on tile coordinates (enemy float positions don't index the map).
            const tdx = px > tx ? 1 : px < tx ? -1 : 0;
            const tdy = py > ty ? 1 : py < ty ? -1 : 0;
            const nx1 = tx + tdx, ny1 = ty + tdy;
            const nx2 = tx + tdx, ny2 = ty;
            const nx3 = tx,       ny3 = ty + tdy;
            const occupied = (cx, cy) => game.trolls.find(t => t !== troll && trollTileX(t) === cx && trollTileY(t) === cy);
            if (isPassable(nx1, ny1) && !isProtectedRoom(nx1, ny1) && !occupied(nx1, ny1)) {
                troll.x = nx1; troll.y = ny1;
            } else if (isPassable(nx2, ny2) && !isProtectedRoom(nx2, ny2) && !occupied(nx2, ny2)) {
                troll.x = nx2;
            } else if (isPassable(nx3, ny3) && !isProtectedRoom(nx3, ny3) && !occupied(nx3, ny3)) {
                troll.y = ny3;
            }
        };

        // CONCERN TROLL: drains HP when adjacent, moves slowly toward player
        if (troll.enemyType === 'concern') {
            if (dist <= 1) {
                takeDamage(game, 1);
                UI.addMessage("Concern Troll whispers 'Are you SURE about this?'", 'death');
            } else if (dist <= alertRadius) {
                stepToward();
            }
            return;
        }

        // BOSS: always aggressive, spawns minions. Enters phase 2 at <50% HP:
        //   - movement speed doubles (halves the per-tick delay)
        //   - spawn chance climbs and the cap doubles
        //   - contact damage rises from 2 to 3
        if (troll.enemyType === 'boss') {
            if (troll.bossPhase !== 2 && troll.health < troll.maxHealth / 2) {
                troll.bossPhase = 2;
                troll.maxMoveDelay = Math.max(1, Math.floor(troll.maxMoveDelay / 2));
                Audio.playBossRoar && Audio.playBossRoar();
                game.screenShake = Math.max(game.screenShake, 1.0);
                UI.addMessage("👹 BOSS ENRAGED!", "death");
                game.floatingText.push({ x: troll.x, y: troll.y - 1, text: 'RAGE', life: 60, color: '#FF0040' });
                for (let i = 0; i < 30; i++) game.particles.push({
                    x: troll.x + 0.5, y: troll.y,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: -Math.random() * 0.5,
                    life: 1.0, color: i % 2 ? '#FF00FF' : '#FF0040'
                });
            }
            const enraged = troll.bossPhase === 2;
            const contactDmg = enraged ? 3 : 2;
            const spawnChance = enraged ? 0.45 : 0.25;
            const spawnCap = enraged ? 18 : 12;
            if (dist <= 1) { takeDamage(game, contactDmg); return; }
            if (troll.health < troll.maxHealth / 2 && Math.random() < spawnChance && game.trolls.length < spawnCap) {
                const tdx = (Math.random() < 0.5 ? -1 : 1);
                const tdy = (Math.random() < 0.5 ? -1 : 1);
                if (isPassable(tx + tdx, ty + tdy)) {
                    game.trolls.push({ x: tx+tdx, y: ty+tdy, enemyType: 'wraith',
                        health: 1, maxHealth: 1, patrolPath: [], patrolIndex: 0, direction: 1,
                        moveDelay: 0, maxMoveDelay: 1, alertRadius: 8, chasingTurns: 0 });
                    UI.addMessage("⚡ BOSS spawned a Wraith!", "death");
                }
            } else {
                stepToward();
                if (enraged) stepToward();   // double-step in phase 2
            }
            return;
        }

        // WRAITH: teleports, high dodge — attack if adjacent
        if (troll.enemyType === 'wraith') {
            if (dist <= 1) { takeDamage(game, 1); return; }
            if (dist <= alertRadius && Math.random() < 0.6) {
                for (let i = 0; i < 5; i++) game.particles.push({x: troll.x, y: troll.y, vx: 0, vy: -0.4, life: 1, color: '#39FF14'});
                stepToward();
            }
            return;
        }

        // POLICE: fast, aggressive, 2 damage
        if (troll.enemyType === 'police') {
            if (dist <= 1) { takeDamage(game, 2); return; }
            if (dist <= alertRadius) stepToward();
            return;
        }

        // SWARM (new): tiny, fast, 1 dmg, can stack
        if (troll.enemyType === 'swarm') {
            if (dist <= 1) { takeDamage(game, 1); return; }
            if (dist <= alertRadius) { stepToward(); stepToward(); }
            return;
        }

        // BIGOT (new): far-range projectile thrower (logical adjacency = 2)
        if (troll.enemyType === 'bigot') {
            if (dist <= 4 && Math.random() < 0.3) {
                takeDamage(game, 1);
                UI.addMessage("Bigot threw a slur at you.", 'death');
                game.floatingText.push({ x: troll.x, y: troll.y, text: '!', life: 30, color: '#FF0000' });
                return;
            }
            if (dist <= 1) { takeDamage(game, 1); return; }
            if (dist <= alertRadius) stepToward();
            return;
        }

        // DEFAULT TROLL: chase forever once alerted, 1 damage on contact
        if (dist <= 1) { takeDamage(game, 1); return; }
        if (dist <= alertRadius) {
            troll.chasingTurns = 99;
            stepToward();
            return;
        }

        // Idle wander
        if (Math.random() < 0.4) {
            const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
            const [rx, ry] = dirs[Math.floor(Math.random() * dirs.length)];
            const nx = tx + rx, ny = ty + ry;
            if (isPassable(nx, ny) && !game.trolls.find(t => trollTileX(t) === nx && trollTileY(t) === ny)) {
                troll.x = nx;
                troll.y = ny;
            }
        }
    });

    // Body-check: if any troll occupies the player's tile (compare on
    // the snapped tile coords because enemy positions are floats).
    const caught = game.trolls.find(t => trollTileX(t) === px && trollTileY(t) === py);
    if (caught) {
        let dmg = 1;
        if (caught.enemyType === 'police') dmg = 2;
        if (caught.enemyType === 'boss') dmg = 3;
        if (game.player.traits && game.player.traits.some(t => t.id === 'dwarfism')) dmg = Math.max(1, dmg - 1);
        if (game.player.traits && game.player.traits.some(t => t.id === 'chronic')) game.player.hurtCooldown = 8;
        takeDamage(game, dmg);

        // Knockback the player away
        const dirX = (game.player.x + PLAYER_W/2) > caught.x ? 1 : -1;
        game.player.vx = dirX * 6;
        game.player.vy = -4;
        game.player.onGround = false;
    }
    
    checkPickups();
    draw();
}

function tileX() { return Math.floor(game.player.x + PLAYER_W / 2); }
function tileY() { return Math.floor(game.player.y + PLAYER_H / 2); }
// Enemy positions drift off integer tiles after gravity/landing (see
// moveEnemyY: e.y = floor(feet) - 0.8 - 0.0001). Snap to the tile that
// contains the enemy's center so the turn-based AI's distance/adjacency
// checks work the same way they do for the player.
function trollTileX(t) { return Math.floor(t.x + 0.4); }
function trollTileY(t) { return Math.floor(t.y + 0.4); }
function entityNear(e) {
    return Math.abs(e.x - tileX()) <= 1 && Math.abs(e.y - tileY()) <= 1;
}

function interact() {
    if (!game.player.alive) return;
    const px = tileX();
    const py = tileY();

    if (game.map[`${px},${py}`] === '>') {
        descend();
        return;
    }

    // Hub portal: leave the hub and start a fresh dungeon run.
    if (game.inHub && game.map[`${px},${py}`] === 'D') {
        UI.addMessage('🌀 You step through the portal into the wasteland.', 'special');
        startDungeon();
        return;
    }
    // Hub campfire: re-open the legacy upgrade modal so the player can spend
    // scrap, change difficulty, swap palette, etc. without leaving the hub.
    if (game.inHub && game.map[`${px},${py}`] === 'F') {
        startCamp();
        return;
    }

    
    // REFUSAL MECHANIC
    const refusalTarget = game.trolls.find(t => entityNear(t) && (t.enemyType === 'concern' || t.enemyType === 'bigot' || t.enemyType === 'gatekeeper'));
    if (refusalTarget) {
        UI.startRefusal(game, refusalTarget);
        return;
    }

    const npc = game.npcs.find(n => entityNear(n));

    if (npc) {
        if (!game.persistent.seenFigures[npc.figureKey]) {
            game.persistent.seenFigures[npc.figureKey] = true;
            game.historicalFigures++;
        }
        DialogueUI.start(game, npc.figureKey, () => addXP(150));
        // In dungeon: NPC disappears after conversation (they move on).
        // In hub village: NPCs persist so you can talk to them again.
        if (!game.inHub) {
            game.npcs = game.npcs.filter(n => n !== npc);
        }
        saveGame();
        UI.updateStatus(game);
        draw();
        if (game.zines >= 19 && game.historicalFigures >= 9) {
            UI.showVictory();
        }
        return;
    }

    const item = game.items.find(i => entityNear(i));
    if (item) {
        if (item.type === 'zine') {
            if (!game.persistent.seenZines[item.zineKey]) {
                game.persistent.seenZines[item.zineKey] = true;
                game.zines++;
            }
            UI.addMessage(`Collected: ${item.name}!`, 'special');
            Audio.playLoot();
            UI.showZine(item.zineKey);
            addXP(100);
            onZineCollectedForQuests();
        } else if (item.type === 'healing') {
            const healing = HEALING_ITEMS[item.healingKey];
            let healAmount = healing.healing;
            if (game.player.trait && game.player.trait.id === 't4t') healAmount *= 2; // T4T healing buff
            
            game.player.health = Math.min(game.player.maxHealth, game.player.health + healAmount);
            UI.addMessage(`Used ${item.name}. Healed ${healAmount} HP.`, "healing");
            Audio.playLoot();
            onItemCollectedForQuests(item.healingKey);
        } else if (item.type === 'treasure') {
            if (item.decorative) {
                // Village dressing — no scrap, just a warm beat.
                UI.addMessage(`You admire the ${item.name}. The village feels a little more like home.`, 'special');
                Audio.playLoot && Audio.playLoot();
            } else {
                game.treasures++;
                game.persistent.treasures++;
                game.player.scrapEarned = (game.player.scrapEarned || 0) + 1;
                UI.addMessage(`Picked up ${item.name}!`, 'treasure');
                Audio.playLoot();
            }
        } else if (item.type === 'loot') {
            // Tiered loot: scrap + tier-specific effect (heal, buff, perma-heart).
            const scrap = item.scrap || 1;
            game.treasures += scrap;
            game.persistent.treasures += scrap;
            game.player.scrapEarned = (game.player.scrapEarned || 0) + scrap;
            const tierKey = item.tier || 'common';
            const label = tierKey.toUpperCase();
            UI.addMessage(`[${label}] ${item.name}  +${scrap} scrap!`, tierKey === 'legendary' ? 'special' : (tierKey === 'epic' ? 'special' : 'treasure'));
            Audio.playLoot();
            // Visual sparkle
            for (let i = 0; i < 18; i++) {
                game.particles.push({
                    x: tileX(), y: tileY(),
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -Math.random() * 0.6,
                    life: 1.0,
                    color: item.glow || '#FFD700',
                    size: 2 + Math.random() * 2
                });
            }
            // Named item effect override — check NAMED_ITEM_EFFECTS first
            const resolvedEffect = (item.name && NAMED_ITEM_EFFECTS[item.name]) ? NAMED_ITEM_EFFECTS[item.name] : item.effect;
            if (resolvedEffect === 'hearth_stone') {
                game.player.health = game.player.maxHealth;
                game.player.defenseBuff = Math.max(game.player.defenseBuff || 0, 200);
                UI.addMessage('The Hearth Stone warms you. Full heal + defense for 200 frames!', 'healing');
                for (let i = 0; i < 30; i++) game.particles.push({
                    x: tileX(), y: tileY(), vx: (Math.random()-0.5)*0.5, vy: -Math.random()*0.7,
                    life: 1.2, color: i % 2 ? '#FFD700' : '#FF8C00', size: 3
                });
            } else if (resolvedEffect === 'mothers_light') {
                UI.addMessage("Mother's Fierce Light erupts! AOE damage burst!", 'special');
                for (const troll of [...game.trolls]) {
                    const dx = troll.x - tileX(), dy = troll.y - tileY();
                    if (Math.sqrt(dx*dx + dy*dy) <= 3) {
                        troll.health -= 4;
                        game.floatingText.push({ x: troll.x, y: troll.y, text: '-4 🔥', life: 30, color: '#FFD700' });
                        if (troll.health <= 0) {
                            game.trolls = game.trolls.filter(t => t !== troll);
                            game.player.kills = (game.player.kills || 0) + 1;
                            addXP(20);
                        }
                    }
                }
                for (let i = 0; i < 60; i++) game.particles.push({
                    x: tileX()+0.5, y: tileY(), vx: (Math.random()-0.5)*1.2, vy: (Math.random()-0.5)*1.2,
                    life: 1.0, color: ['#FFD700','#F5A9B8','#5BCEFA','#FFFFFF'][i%4], size: 3
                });
                game.screenShake = Math.max(game.screenShake || 0, 0.9);
            } else if (resolvedEffect === 'youth_badge') {
                addXP(50);
                UI.addMessage('Youth OUTright Badge! +50 XP bonus!', 'special');
            } else if (resolvedEffect === 'safe_key') {
                // Reveal a safe shelter room on the current level
                if (game.safeShelterRooms && game.safeShelterRooms.size === 0) {
                    const rx = Math.floor(Math.random() * 4), ry = Math.floor(Math.random() * 3);
                    game.safeShelterRooms.add(`${rx},${ry}`);
                }
                UI.addMessage('Safe Shelter Key glows. A refuge reveals itself!', 'special');
            } else if (resolvedEffect === 'homegrown_blessing') {
                game.player.bloomRegen = Math.max(game.player.bloomRegen || 0, 300);
                game.player.bloomRate = 0.01;
                UI.addMessage('Homegrown Families Blessing: gentle regen for 300 frames.', 'healing');
            } else if (resolvedEffect === 'archival_fragment') {
                addXP(30);
                const fragments = [
                    "Fragment: 'We were here before. We will be here after.'",
                    "Fragment: 'The archive holds what they tried to burn.'",
                    "Fragment: 'Every name erased becomes a star in our sky.'",
                    "Fragment: 'Trans mothers built this community. Remember them.'"
                ];
                UI.addMessage(fragments[Math.floor(Math.random() * fragments.length)], 'special');
            } else if (resolvedEffect === 'labeija_trophy') {
                // Ballroom crown: stun all nearby enemies + full heal + 6s dmg buff
                game.player.health = game.player.maxHealth;
                game.player.lootBuff = Math.max(game.player.lootBuff || 0, 360);
                let stunned = 0;
                for (const troll of game.trolls) {
                    const dx = troll.x - tileX(), dy = troll.y - tileY();
                    if (Math.sqrt(dx*dx + dy*dy) <= 5) {
                        if (!troll.status) troll.status = {};
                        troll.status.shock = { duration: 180 };
                        stunned++;
                    }
                }
                UI.addMessage(`LaBeija's Trophy crowns you! Full heal + dmg boost + ${stunned} enemies stunned! THE FLOOR IS YOURS!`, 'special');
                for (let i = 0; i < 50; i++) game.particles.push({
                    x: tileX() + 0.5, y: tileY(), vx: (Math.random()-0.5)*1.0, vy: (Math.random()-0.5)*1.0,
                    life: 1.4, color: i % 2 ? '#FFD700' : '#FF1493', size: 3
                });
                game.screenShake = Math.max(game.screenShake || 0, 0.6);
            } else if (resolvedEffect === 'mausoleum_flower') {
                // Kenya's memorial: +3 HP + long regen + flower particles
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 3);
                game.player.bloomRegen = Math.max(game.player.bloomRegen || 0, 400);
                game.player.bloomRate = 0.015;
                UI.addMessage('The Mausoleum Flower heals the living in honor of the dead. +3 HP + regen.', 'healing');
                const flowerColors = ['#FF69B4','#FFB6C1','#FF1493','#FFD700','#FFFFFF'];
                for (let i = 0; i < 30; i++) game.particles.push({
                    x: tileX() + 0.5, y: tileY(), vx: (Math.random()-0.5)*0.7, vy: -Math.random()*0.8,
                    life: 1.3, color: flowerColors[i % flowerColors.length], size: 2.5
                });
            } else if (resolvedEffect === 'house_mother_sash') {
                // Defense sash: 400-frame defense + +1 HP
                game.player.defenseBuff = Math.max(game.player.defenseBuff || 0, 400);
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 1);
                UI.addMessage("House Mother's Sash bestows leadership: +1 HP + defense 400 frames.", 'special');
                for (let i = 0; i < 20; i++) game.particles.push({
                    x: tileX() + 0.5, y: tileY(), vx: (Math.random()-0.5)*0.5, vy: -Math.random()*0.6,
                    life: 1.0, color: i % 2 ? '#FF69B4' : '#FFD700', size: 2
                });
            } else if (resolvedEffect === 'riveras_megaphone') {
                // AOE knockback + stun 120 frames
                let hit = 0;
                for (const troll of game.trolls) {
                    const dx = troll.x - tileX(), dy = troll.y - tileY();
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist <= 4) {
                        if (!troll.status) troll.status = {};
                        troll.status.shock = { duration: 120 };
                        troll.x += Math.sign(dx) * 2; troll.y += Math.sign(dy);
                        hit++;
                    }
                }
                UI.addMessage(`Rivera's Megaphone ROARS! ${hit} enemies knocked back + stunned!`, 'special');
                game.screenShake = Math.max(game.screenShake || 0, 0.8);
                for (let i = 0; i < 30; i++) game.particles.push({
                    x: tileX() + 0.5, y: tileY(), vx: (Math.random()-0.5)*1.2, vy: (Math.random()-0.5)*1.2,
                    life: 1.0, color: i % 2 ? '#FF4500' : '#FF8C00', size: 2.5
                });
            } else if (resolvedEffect === 'charm_book') {
                // Mama Gloria's Charm Book: full heal + permanent +1 HP
                game.player.health = game.player.maxHealth + 1;
                game.player.maxHealth += 1;
                game.persistent.permanentHearts = (game.persistent.permanentHearts || 0) + 1;
                saveGame();
                UI.addMessage("Mama Gloria's Charm Book: full heal + PERMANENT +1 HEART. Head up. Shoulders back.", 'special');
                for (let i = 0; i < 25; i++) game.particles.push({
                    x: tileX() + 0.5, y: tileY(), vx: (Math.random()-0.5)*0.5, vy: -Math.random()*0.7,
                    life: 1.2, color: i % 2 ? '#20B2AA' : '#98FB98', size: 2
                });
            } else if (resolvedEffect === 'tarot_deck') {
                // Mariela's Tarot: fortune — random good or bad + XP
                addXP(40);
                const fortunes = [
                    { good: true,  msg: "The Star: hope restored. +3 HP!", hp: 3 },
                    { good: true,  msg: "The Empress: nurturing power. +2 HP + regen.", hp: 2, regen: true },
                    { good: false, msg: "The Tower: disruption. -1 HP, but clarity follows.", hp: -1 },
                    { good: true,  msg: "The World: completion. +2 HP + dmg boost.", hp: 2, buff: true },
                    { good: false, msg: "The Moon: illusion. Lose 1 HP in confusion.", hp: -1 },
                ];
                const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
                game.player.health = Math.max(0.5, Math.min(game.player.maxHealth, game.player.health + fortune.hp));
                if (fortune.regen) { game.player.bloomRegen = Math.max(game.player.bloomRegen || 0, 300); game.player.bloomRate = 0.01; }
                if (fortune.buff) { game.player.lootBuff = Math.max(game.player.lootBuff || 0, 240); }
                UI.addMessage(`Mariela's Tarot: ${fortune.msg}`, fortune.good ? 'healing' : 'death');
                for (let i = 0; i < 20; i++) game.particles.push({
                    x: tileX() + 0.5, y: tileY(), vx: (Math.random()-0.5)*0.6, vy: -Math.random()*0.7,
                    life: 1.0, color: ['#9370DB','#FFD700','#FF69B4'][i % 3], size: 2
                });
            } else if (resolvedEffect === 'boylan_memoir') {
                // Jennifer Boylan's memoir: +200 XP + reveal all mural tiles
                addXP(200);
                if (game.muralTiles) {
                    Object.keys(game.muralTiles).forEach(k => { if (game.seen) game.seen[k] = true; });
                }
                UI.addMessage("Boylan's Memoir: +200 XP. The archive illuminates — every story on every wall revealed.", 'special');
            } else if (resolvedEffect === 'vicks_care') {
                // Vicks Touch of Care: +2 HP + regen 200 frames
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 2);
                game.player.bloomRegen = Math.max(game.player.bloomRegen || 0, 200);
                game.player.bloomRate = 0.01;
                UI.addMessage("Vicks Touch of Care: +2 HP + gentle regen. A mother's love has no gender.", 'healing');
            } else if (resolvedEffect === 'sawant_petition') {
                // Sawant's Petition: +20 XP + creates a safe shelter room
                addXP(20);
                if (game.safeShelterRooms && game.safeShelterRooms.size === 0) {
                    const rx = Math.floor(Math.random() * 4), ry = Math.floor(Math.random() * 3);
                    game.safeShelterRooms.add(`${rx},${ry}`);
                }
                UI.addMessage("Sawant's Petition: +20 XP. Legal momentum — a shelter opens somewhere in the archive.", 'special');
            } else if (resolvedEffect === 'star_key') {
                // STAR House Key: creates a new shelter room + defense buff
                game.player.defenseBuff = Math.max(game.player.defenseBuff || 0, 250);
                if (game.safeShelterRooms) {
                    const rx = Math.floor(Math.random() * 4), ry = Math.floor(Math.random() * 3);
                    game.safeShelterRooms.add(`${rx},${ry}`);
                }
                UI.addMessage('STAR House Key glows red. A shelter opens. Marsha and Sylvia built this for you.', 'special');
                for (let i = 0; i < 20; i++) game.particles.push({
                    x: tileX() + 0.5, y: tileY(), vx: (Math.random()-0.5)*0.5, vy: -Math.random()*0.6,
                    life: 1.0, color: i % 2 ? '#FF4500' : '#FF8C00', size: 2
                });
            } else if (resolvedEffect === 'small_heal') {
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 1);
            } else if (resolvedEffect === 'big_heal') {
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 2);
                game.player.lootBuff = Math.max(game.player.lootBuff || 0, 240);
                UI.addMessage('Solidarity surges through you (+1 dmg / 4s)', 'healing');
            } else if (resolvedEffect === 'rage_vial') {
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 3);
                game.player.lootBuff = Math.max(game.player.lootBuff || 0, 360);
                UI.addMessage('Ancestor rage in your veins (+1 dmg / 6s)', 'healing');
            } else if (resolvedEffect === 'permanent_heart') {
                game.persistent.permanentHearts = (game.persistent.permanentHearts || 0) + 1;
                game.player.maxHealth += 1;
                game.player.health = game.player.maxHealth;
                saveGame();
                UI.addMessage('PERMANENT +1 HEART. The lineage grows stronger.', 'special');
            } else if (item.effect === 'small_heal') {
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 1);
            } else if (item.effect === 'big_heal') {
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 2);
                game.player.lootBuff = Math.max(game.player.lootBuff || 0, 240);
                UI.addMessage('Solidarity surges through you (+1 dmg / 4s)', 'healing');
            } else if (item.effect === 'rage_vial') {
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 3);
                game.player.lootBuff = Math.max(game.player.lootBuff || 0, 360);
                UI.addMessage('Ancestor rage in your veins (+1 dmg / 6s)', 'healing');
            } else if (item.effect === 'permanent_heart') {
                game.persistent.permanentHearts = (game.persistent.permanentHearts || 0) + 1;
                game.player.maxHealth += 1;
                game.player.health = game.player.maxHealth;
                saveGame();
                UI.addMessage('PERMANENT +1 HEART. The lineage grows stronger.', 'special');
            }
        } else if (item.type === 'gender-reveal') {
            // Pop the open-chest sprite where the closed chest was so the
            // player gets a brief "it opened!" beat before it disappears.
            game.spriteFX.push({
                sprite: 'chest_open',
                x: item.x, y: item.y,
                life: 36, maxLife: 36,
                rise: 0, w: 36, h: 28
            });
            // EXPLORATION MECHANIC: Gender Reveal Chest
            if (Math.random() > 0.5) {
                // It's a boy/girl! (Explosion)
                UI.addMessage(`💥 The Gender Reveal Chest exploded! It's a disaster! 💥`, 'death');
                Audio.playDamage();
                takeDamage(game, 2);
            } else {
                // It's queer joy! (Loot)
            UI.addMessage(`🎉 The Gender Reveal Chest was full of HRT and treasures! 🎉`, 'special');
                game.treasures += 3;
                game.persistent.treasures += 3;
                game.player.scrapEarned = (game.player.scrapEarned || 0) + 3;
                game.player.health = Math.min(game.player.maxHealth, game.player.health + 1);
                addXP(50);
            }
        }
        game.items = game.items.filter(i => i !== item);
        UI.updateStatus(game);
        draw();
        
        if (game.zines >= 19 && game.historicalFigures >= 9) {
            UI.showVictory();
        }
        return;
    }
}

let lastPromptTile = null;
function checkPickups() {
    const px = tileX(), py = tileY();
    const key = `${px},${py}`;
    if (key === lastPromptTile) return; // don't spam
    const item = game.items.find(i => entityNear(i));
    const npc = game.npcs.find(n => entityNear(n));
    if (item) {
        UI.addMessage(`You see: ${item.name}. Press USE/F to interact.`);
        lastPromptTile = key;
    } else if (npc) {
        const fig = HISTORICAL_FIGURES[npc.figureKey];
        UI.addMessage(`You see ${fig ? fig.name : 'a historical figure'}. Press USE/F to speak.`);
        lastPromptTile = key;
    } else if (game.map[key] === '>') {
        UI.addMessage(`Stairs down. Press USE/F to descend.`);
        lastPromptTile = key;
    } else if (game.map[key] === 'D') {
        UI.addMessage(`Wasteland portal. Press USE/F to enter the dungeon.`);
        lastPromptTile = key;
    } else if (game.map[key] === 'F') {
        UI.addMessage(`Campfire. Press USE/F to rest, upgrade, and pick a difficulty.`);
        lastPromptTile = key;
    }

    // Mural reading — check adjacent ceiling tiles for mural messages
    if (game.muralTiles) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const mk = `${px + dx},${py + dy}`;
                if (game.muralTiles[mk] && mk !== lastPromptTile) {
                    const msg = game.muralTiles[mk];
                    UI.addMessage(`🎨 "${msg}" (+0.5 HP)`, 'healing');
                    game.player.health = Math.min(game.player.maxHealth, game.player.health + 0.5);
                    UI.updateStatus(game);
                    lastPromptTile = mk;
                    onMuralReadForQuests();
                    // Golden sparkle on reading
                    for (let i = 0; i < 10; i++) game.particles.push({
                        x: px + dx, y: py + dy,
                        vx: (Math.random()-0.5)*0.3, vy: -Math.random()*0.4,
                        life: 1.0, color: '#FFD700', size: 2
                    });
                    break;
                }
            }
        }
    }
}

function drawTile(ctx, sx, sy, color, isWall, glowColor, pattern) {
    ctx.fillStyle = pattern || color;
    // Removed shadowBlur - performance killer!
    ctx.fillRect(sx, sy, T, T);
    if (isWall) {
        ctx.strokeStyle = glowColor || '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 0.5, sy + 0.5, T - 1, T - 1);
        
        // Faux-glow: draw a semi-transparent stroke if visible
        if (glowColor) {
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(sx - 1, sy - 1, T + 2, T + 2);
            ctx.globalAlpha = 1.0;
        }
    }
}

// Animation & Physics loop with fixed timestep (SuperTux-style — physics stays
// stable across variable refresh rates; rendering still runs every rAF).
let lastTime = 0;
let physicsAccumulator = 0;
const FIXED_DT = 1 / 60;
const MAX_FRAME_DT = 0.1; // clamp huge tab-switch hitches so we don't death-spiral
let paused = false;
let questLogVisible = false;
// Set true the first time generateMap finishes so physics doesn't run against
// an empty map (which would let the player free-fall through "nothing" while
// the camp modal is open). Without this, slow asset loads on a real
// machine can produce the "fell through map / hovering in space" glitch.
let gameStarted = false;
let showFps = false;
const fpsSamples = [];
const keys = {}; // Global keyboard state



function gameLoop(time) {
    const real = (time - lastTime) / 1000;
    lastTime = time;

    physicsAccumulator += Math.min(MAX_FRAME_DT, real);
    
    // Handle Hit Stop (frame freeze)
    if (game.hitStop > 0) {
        game.hitStop--;
        requestAnimationFrame(gameLoop);
        return;
    }

    if (!paused && gameStarted) {
        // Cap to 4 sub-steps per frame to avoid catch-up storms (250ms ceiling).
        let steps = 0;
        while (physicsAccumulator >= FIXED_DT && steps < 4) {
            update(FIXED_DT);
            physicsAccumulator -= FIXED_DT;
            steps++;
        }
        if (physicsAccumulator > FIXED_DT * 4) physicsAccumulator = 0;
    } else {
        // Eat any accumulated time so the first real frame doesn't catch-up storm.
        physicsAccumulator = 0;
    }

    if (gameStarted) draw();
    if (real > 0) {
        fpsSamples.push(real);
        if (fpsSamples.length > 60) fpsSamples.shift();
    }
    updateParticles();
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// Parallax neon starfield — generated once, rendered every frame at varying depth.
const stars = [];
(function buildStarfield() {
    const colors = ['#FF71CE','#01CDFE','#FFD700','#39FF14','#FFFFFF','#B967DB'];
    for (let i = 0; i < 90; i++) {
        stars.push({
            x: Math.random(),
            y: Math.random(),
            size: Math.random() * 1.6 + 0.5,
            phase: Math.random() * Math.PI * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            // Three depth tiers: distant (slow), mid, near (fast).
            layer: 0.08 + Math.floor(Math.random() * 3) * 0.18
        });
    }
})();

// === Platformer physics constants (Rogue Legacy inspired) ===
const PLAYER_W = 0.65; // Slightly narrower for better platforming
const PLAYER_H = 0.9;
const GRAVITY = 0.65;
const TERMINAL_VY = 12;
const JUMP_SPEED = -7.5;
const COYOTE_FRAMES = 10;
const JUMP_BUFFER_FRAMES = 10;
const DASH_FRAMES = 8;
const DASH_COOLDOWN = 35;
const DASH_SPEED = 0.6;
const ACCEL = 0.65;          // Horizontal acceleration
const FRICTION_GROUND = 0.72; // Ground friction
const FRICTION_AIR = 0.86;    // Air resistance
const MAX_VX = 3.5;          // Speed limit

// Returns true if (px, py) lies inside any solid wall.
// One-way platforms are NOT considered solid by this — use isOneWayBlocking
// to test whether falling feet should land on a `=` or 'C' tile.
function pointSolid(px, py) {
    const x = Math.floor(px), y = Math.floor(py);
    if (x < 0 || y < 0 || x >= game.mapWidth || y >= game.mapHeight) return true;
    const t = game.map[`${x},${y}`];
    // Walls + ice + trampolines are full-height solids.
    return t === '#' || t === '~' || t === 'T';
}

// True when feet at `feetY` should land on a one-way platform — the platform
// only catches feet that are arriving onto it from above. We treat the
// platform's effective "top" as the integer Y of the tile; if previous-frame
// feet were above that line, the platform catches them.
function isOneWayBlocking(px, feetY, prevFeetY) {
    const x = Math.floor(px), y = Math.floor(feetY);
    if (x < 0 || y < 0 || x >= game.mapWidth || y >= game.mapHeight) return false;
    const t = game.map[`${x},${y}`];
    // '=' = standard one-way; 'C' = crumbling one-way (until it breaks).
    if (t !== '=' && t !== 'C') return false;
    if (t === 'C' && game.crumbleState && game.crumbleState[`${x},${y}`] && game.crumbleState[`${x},${y}`].broken) return false;
    // Drop-through grace period: ignore the platform briefly after Down+Jump.
    if (game.player.dropThrough > 0) return false;
    return prevFeetY <= y + 0.0001;
}

function isGrounded(p) {
    const feet = p.y + PLAYER_H + 0.02;
    const prevFeet = p.y + PLAYER_H;
    if (pointSolid(p.x + 0.05, feet) ||
        pointSolid(p.x + PLAYER_W - 0.05, feet) ||
        pointSolid(p.x + PLAYER_W * 0.5, feet)) return true;
    if (isOneWayBlocking(p.x + 0.05, feet, prevFeet) ||
        isOneWayBlocking(p.x + PLAYER_W - 0.05, feet, prevFeet) ||
        isOneWayBlocking(p.x + PLAYER_W * 0.5, feet, prevFeet)) return true;
    return false;
}

function moveEntityX(ent, dx, w, h) {
    if (dx === 0) return;
    const target = ent.x + dx;
    const lead = dx > 0 ? target + w : target;
    if (pointSolid(lead, ent.y) ||
        pointSolid(lead, ent.y + h * 0.5) ||
        pointSolid(lead, ent.y + h - 0.001)) {
        if (dx > 0) ent.x = Math.floor(lead) - w - 0.0001;
        else ent.x = Math.floor(lead) + 1;
        ent.vx = 0;
    } else {
        ent.x = target;
    }
}

function moveX(dx) {
    moveEntityX(game.player, dx, PLAYER_W, PLAYER_H);
}

function moveY(dy) {
    if (dy === 0) return;
    const p = game.player;
    const prevFeet = p.y + PLAYER_H;
    const target = p.y + dy;
    if (dy > 0) {
        // Falling — land on solids OR on one-way platforms when arriving from above.
        const feet = target + PLAYER_H;
        const hitSolid = pointSolid(p.x + 0.05, feet) ||
                         pointSolid(p.x + PLAYER_W - 0.05, feet) ||
                         pointSolid(p.x + PLAYER_W * 0.5, feet);
        const hitOneWay = isOneWayBlocking(p.x + 0.05, feet, prevFeet) ||
                          isOneWayBlocking(p.x + PLAYER_W - 0.05, feet, prevFeet) ||
                          isOneWayBlocking(p.x + PLAYER_W * 0.5, feet, prevFeet);
        if (hitSolid || hitOneWay) {
            p.y = Math.floor(feet) - PLAYER_H - 0.0001;
            p.vy = 0;
        } else {
            p.y = target;
        }
    } else {
        // Rising — only true walls block the head; jump up through one-ways.
        const head = target;
        if (pointSolid(p.x + 0.05, head) ||
            pointSolid(p.x + PLAYER_W - 0.05, head)) {
            p.y = Math.floor(head) + 1;
            p.vy = 0;
        } else {
            p.y = target;
        }
    }
}

function moveEnemyY(e, dy, w, h) {
    if (dy === 0) return;
    const target = e.y + dy;
    if (dy > 0) {
        const feet = target + h;
        if (pointSolid(e.x + 0.05, feet) || pointSolid(e.x + w - 0.05, feet)) {
            e.y = Math.floor(feet) - h - 0.0001;
            e.vy = 0;
            e.onGround = true;
        } else {
            e.y = target;
            e.onGround = false;
        }
    } else {
        if (pointSolid(e.x + 0.05, target) || pointSolid(e.x + w - 0.05, target)) {
            e.y = Math.floor(target) + 1;
            e.vy = 0;
        } else {
            e.y = target;
        }
    }
}

function tryJump() {
    const p = game.player;
    if (p.coyoteTimer > 0) {
        p.vy = JUMP_SPEED;
        p.coyoteTimer = 0;
        p.onGround = false;
        p.jumpsLeft -= 1;
        Audio.playJump();
        spawnDust(p.x + PLAYER_W / 2, p.y + PLAYER_H, 6, '#FF71CE');
        return true;
    }
    const maxJumps = 1 + (p.extraJumps || 0) + (p.traits && p.traits.some(t => t.id === 'nostalgia') ? 1 : 0);
    if (p.jumpsLeft > 0) {
        p.vy = JUMP_SPEED * 0.92;
        p.jumpsLeft -= 1;
        for (let i = 0; i < 12; i++) spawnDust(p.x + PLAYER_W / 2, p.y + PLAYER_H, 1, i % 2 ? '#01CDFE' : '#FF71CE');
        Audio.playJump();
        return true;
    }
    return false;
}

// Reads tile under feet + body and applies hazard side-effects each frame.
//   '^' spikes      → 1 dmg + small knockback (gated by hurtCooldown)
//   '~' ice         → flag p.onIceTile so friction stays high
//   'T' trampoline  → big bounce on contact
//   'C' crumbling   → start a timer; break the tile after 30 frames of contact
function applyHazards(p) {
    p.onIceTile = false;

    // Tile directly under the player's feet.
    const footX = Math.floor(p.x + PLAYER_W / 2);
    const footY = Math.floor(p.y + PLAYER_H + 0.05);
    const below = game.map[`${footX},${footY}`];

    if (p.onGround && below === 'T' && p.vy >= 0) {
        // Trampoline! Force a sky-high bounce, refund a jump.
        p.vy = -16;
        p.onGround = false;
        p.jumpsLeft = Math.max(p.jumpsLeft, 1);
        (Audio.playBoing || Audio.playJump) && (Audio.playBoing ? Audio.playBoing() : Audio.playJump());
        for (let i = 0; i < 16; i++) spawnDust(p.x + PLAYER_W / 2, p.y + PLAYER_H, 1, i % 2 ? '#FFD700' : '#FF71CE');
        UI.addMessage('BOING!', 'special');
    }

    if (p.onGround && below === '~') {
        if (!p.wasOnIce) Audio.playSlip && Audio.playSlip();
        p.onIceTile = true;
        p.wasOnIce = true;
    } else {
        p.wasOnIce = false;
    }

    // Crumbling tiles: track per-tile timer. 30 frames of contact → break.
    if (!game.crumbleState) game.crumbleState = {};
    if (p.onGround && below === 'C') {
        const k = `${footX},${footY}`;
        if (!game.crumbleState[k]) {
            game.crumbleState[k] = { started: game.animFrame, broken: false, contact: 1 };
        } else {
            game.crumbleState[k].contact = game.animFrame;
        }
    }
    for (const [k, st] of Object.entries(game.crumbleState)) {
        if (st.broken) continue;
        if (game.animFrame - st.started >= 30) {
            st.broken = true;
            const [bx, by] = k.split(',').map(Number);
            game.map[k] = '.';
            game.screenShake = Math.max(game.screenShake, 0.25);
            Audio.playCrumble && Audio.playCrumble();
            for (let i = 0; i < 10; i++) spawnDust(bx + 0.5, by + 0.5, 1, '#888');
        }
    }

    // Spike overlap — sample three points on the player's footprint.
    const spikeAt = (cx, cy) => game.map[`${Math.floor(cx)},${Math.floor(cy)}`] === '^';
    const overlap =
        spikeAt(p.x + 0.05,            p.y + PLAYER_H - 0.05) ||
        spikeAt(p.x + PLAYER_W - 0.05, p.y + PLAYER_H - 0.05) ||
        spikeAt(p.x + PLAYER_W * 0.5,  p.y + PLAYER_H - 0.05) ||
        spikeAt(p.x + PLAYER_W * 0.5,  p.y + PLAYER_H * 0.5);
    if (overlap && p.hurtCooldown <= 0) {
        takeDamage(game, 1);
        p.vy = -7;
        p.vx = (p.vx >= 0 ? -1 : 1) * 5;
        p.onGround = false;
        Audio.playSpike && Audio.playSpike();
        UI.addMessage('Ouch! Spikes!', 'death');
        for (let i = 0; i < 8; i++) spawnDust(p.x + PLAYER_W / 2, p.y + PLAYER_H, 1, '#FF0040');
    }
}

function spawnDust(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        game.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -Math.random() * 0.3,
            life: 0.8, color,
            size: 2 + Math.random() * 2
        });
    }
}

function update(dt) {
    game.animFrame++;

    if (!game.player.alive) return;

    updateFOV(); // Keep seen-tiles current so items/NPCs render as player explores

    const p = game.player;

    // Decrement timers
    if (p.coyoteTimer > 0) p.coyoteTimer--;
    if (p.jumpBuffer > 0) p.jumpBuffer--;
    if (p.dashTimer > 0) p.dashTimer--;
    if (p.dashCooldown > 0) p.dashCooldown--;
    if (p.powerCooldown > 0) p.powerCooldown--;
    if (p.powerActive > 0) p.powerActive--;
    if (p.dropThrough > 0) p.dropThrough--;
    if (p.lootBuff > 0) p.lootBuff--;
    if (p.damageImmune > 0) p.damageImmune--;
    if (p.defenseBuff > 0) p.defenseBuff--;
    if (p.bloomRegen > 0) {
        p.bloomRegen--;
        p.health = Math.min(p.maxHealth, p.health + (p.bloomRate || 0.02));
        if (game.animFrame % 90 === 0) {
            game.floatingText.push({ x: p.x, y: p.y, text: '+✿', life: 30, color: '#F5A9B8' });
            UI.updateStatus(game);
        }
    }

    // Safe shelter slow heal — player heals 0.005 HP/frame while standing inside
    if (game.safeShelterRooms && game.safeShelterRooms.size > 0) {
        const prx = Math.floor((p.x + PLAYER_W / 2) / 10);
        const pry = Math.floor((p.y + PLAYER_H / 2) / 10);
        if (game.safeShelterRooms.has(`${prx},${pry}`) && p.health < p.maxHealth && game.animFrame % 30 === 0) {
            p.health = Math.min(p.maxHealth, p.health + 0.05);
            UI.updateStatus(game);
        }
    }

    // Ambient hearth sparkles — golden particles drift upward in hearth rooms
    if (game.hearthRooms && game.animFrame % 8 === 0) {
        const prx = Math.floor((p.x + PLAYER_W / 2) / 10);
        const pry = Math.floor((p.y + PLAYER_H / 2) / 10);
        if (game.hearthRooms.has(`${prx},${pry}`)) {
            const cx = prx * 10 + 5 + (Math.random() - 0.5) * 4;
            const cy = pry * 10 + 8 - Math.random() * 3;
            game.particles.push({
                x: cx, y: cy,
                vx: (Math.random() - 0.5) * 0.08,
                vy: -0.12 - Math.random() * 0.1,
                life: 1.2,
                color: Math.random() < 0.5 ? '#FFD700' : '#FF8C00',
                size: 1.5 + Math.random() * 1.5
            });
        }
    }

    // Combo timer — resets the chain after 1 second of inaction.
    tickCombo(game);
    if (p.hitstun > 0) p.hitstun--;

    // Charge meter ticks while E is held (capped at 120).
    if (p.chargeAttack > 0 && p.chargeAttack < 120) p.chargeAttack++;
    if (p.chargeAttack >= 60 && !p.chargeReady) {
        p.chargeReady = true;
        // Tiny visual confirmation when ready
        spawnDust(p.x + PLAYER_W / 2, p.y + PLAYER_H * 0.5, 6, '#FFD700');
    }

    // Variable Jump: If jump key is released while rising, cut the vertical velocity.
    // This allows for short hops vs high jumps (Rogue Legacy feel).
    if (p.vy < -3 && !keys['Space'] && !keys['ArrowUp'] && !keys['KeyW']) {
        p.vy *= 0.5;
    }

    // Resolve buffered jump (only if it succeeds, consume it)
    if (p.jumpBuffer > 0 && (p.coyoteTimer > 0 || (p.jumpsLeft > 0 && !p.onGround))) {
        if (tryJump()) p.jumpBuffer = 0;
    }

    // Mid-air aura tick (Mutual Aid Worker power)
    if (p.powerType === 'aura' && p.powerActive > 0 && game.animFrame % 60 === 0) {
        if (p.health < p.maxHealth) {
            p.health = Math.min(p.maxHealth, p.health + 1);
            game.floatingText.push({ x: p.x, y: p.y, text: '+1', life: 30, color: '#39FF14' });
            UI.updateStatus(game);
        }
    }

    // Glitter trail
    if (p.traits && p.traits.some(t => t.id === 'glitter') && game.animFrame % 4 === 0 && Math.abs(p.vx) > 0.5) {
        spawnDust(p.x + PLAYER_W / 2, p.y + PLAYER_H, 1, ['#FF71CE','#01CDFE','#FFD700','#39FF14'][game.animFrame % 4]);
    }

    // Gravity (apply only when airborne)
    if (!p.onGround) p.vy += GRAVITY;
    if (p.vy > TERMINAL_VY) p.vy = TERMINAL_VY;

    // Dash overrides horizontal velocity
    let effectiveVx = p.vx;
    if (p.dashTimer > 0) {
        effectiveVx = p.dashDir * 9;
        p.vy = Math.min(p.vy, 0.5); // float during dash
    }

    // Sub-step movement to avoid tunneling at high speeds
    const STEPS = 4;
    for (let s = 0; s < STEPS; s++) {
        moveX(effectiveVx * 0.1 / STEPS);
        moveY(p.vy * 0.1 / STEPS);
    }

    // Authoritative grounded check. Drives coyote/jump refresh and landing FX.
    const wasGrounded = p.onGround;
    p.onGround = isGrounded(p);
    if (p.onGround) {
        p.coyoteTimer = (p.trait && p.trait.id === 'insomnia') ? COYOTE_FRAMES * 2 : COYOTE_FRAMES;
        p.jumpsLeft = 1 + (p.extraJumps || 0) + (p.traits && p.traits.some(t => t.id === 'nostalgia') ? 1 : 0);
        if (!wasGrounded && p.vy >= 1.5) {
            Audio.playStep();
            spawnDust(p.x + PLAYER_W / 2, p.y + PLAYER_H, 4, '#FFFFFF');
        }
    }

    // Combat is handled entirely by combat.js during the input event.

    // Stomp-to-kill: falling onto an enemy from above damages it and bounces
    // the player. Bosses and gatekeepers are too sturdy to stomp.
    if (p.vy >= 2.0) {
        const feetY = p.y + PLAYER_H;
        for (const troll of game.trolls) {
            if (troll.enemyType === 'boss' || troll.enemyType === 'gatekeeper') continue;
            const dx = (troll.x + 0.5) - (p.x + PLAYER_W / 2);
            const dy = troll.y - feetY;
            if (Math.abs(dx) < 0.85 && dy >= -0.55 && dy <= 0.35) {
                troll.health -= 2;
                p.vy = -8.5; // bounce
                p.jumpsLeft = Math.max(p.jumpsLeft, 1); // refund a jump as a reward
                UI.addMessage(`Stomp! ${troll.enemyType} -2`, 'combat');
                Audio.playHit();
                game.screenShake = Math.max(game.screenShake, 0.6);
                spawnParticle(troll.x, troll.y, '#FFD700', 12);
                if (troll.health <= 0) {
                    UI.addMessage(`Stomped ${troll.enemyType}!`, 'victory');
                    game.trolls = game.trolls.filter(t => t !== troll);
                    p.kills = (p.kills || 0) + 1;
                    addXP(20);
                    if (Math.random() < 0.30) {
                        game.items.push({ x: troll.x, y: troll.y, type: 'treasure', name: 'Salvaged Scrap' });
                    }
                }
                break;
            }
        }
    }

    // Hazard interactions: spikes hurt; trampolines bounce; crumbling tiles
    // start to break; ice slips. Resolved before friction so ice can override it.
    applyHazards(p);

    // Friction (only when not dashing). Ice keeps almost all velocity.
    if (p.dashTimer <= 0) {
        const fric = p.onGround ? (p.onIceTile ? 0.98 : FRICTION_GROUND) : FRICTION_AIR;
        p.vx *= fric;
    }
    if (Math.abs(p.vx) < 0.01) p.vx = 0;

    // Status effect ticking (DOTs, freeze duration, etc.)
    tickStatus(game);

    // Regen perk
    if (p.hasRegen && game.animFrame % 600 === 0 && p.health < p.maxHealth) {
        p.health = Math.min(p.maxHealth, p.health + 1);
        game.floatingText.push({ x: p.x, y: p.y, text: '+1', life: 40, color: '#39FF14' });
        UI.updateStatus(game);
    }

    // Update Enemies (Melee Light Physics)
    for (const troll of game.trolls) {
        if (troll.hitstun > 0) troll.hitstun--;
        
        // Gravity
        if (!troll.onGround) troll.vy = (troll.vy || 0) + GRAVITY * 0.8;
        if (troll.vy > TERMINAL_VY) troll.vy = TERMINAL_VY;
        
        // Horizontal Friction
        troll.vx = (troll.vx || 0) * 0.95;
        if (Math.abs(troll.vx) < 0.05) troll.vx = 0;
        
        // Apply movement
        const w = 0.8, h = 0.8;
        moveEntityX(troll, (troll.vx || 0) * 0.1, w, h);
        moveEnemyY(troll, (troll.vy || 0) * 0.1, w, h);
    }

    // Enemy AI / cooldown tick (turn-style every ~10 frames)
    if (game.animFrame % 10 === 0) {
        processTurn();
    }
}

function draw() {
    let bgColor = '#050505';
    if (!game.inHub) {
        if (game.depth <= 3) bgColor = '#111315'; // Harsh grays
        else if (game.depth <= 6) bgColor = '#1a1300'; // Dark gold
        else bgColor = '#080016'; // Deep purples
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const px = tileX();
    const py = tileY();

    // Vertigo trait → tilt the canvas slightly based on horizontal velocity
    const isVertigo = game.player.traits && game.player.traits.some(t => t.id === 'vertigo');
    const isGreyscale = game.player.traits && game.player.traits.some(t => t.id === 'colorblind');

    // Smooth camera with horizontal look-ahead (SuperTux-inspired: the camera
    // leads the player in their facing direction so you can see what's coming).
    const lookAhead = (game.player.facingX || 1) * 2.2 * T;
    const targetX = canvas.width / 2 - (game.player.x + PLAYER_W / 2) * T - lookAhead;
    const targetY = canvas.height / 2 - (game.player.y + PLAYER_H / 2) * T - 1.0 * T;
    if (!game.camInitialized) {
        game.camX = targetX;
        game.camY = targetY;
        game.camInitialized = true;
    } else {
        game.camX += (targetX - game.camX) * 0.10;
        game.camY += (targetY - game.camY) * 0.12;
    }

    // Screen-shake offset (decays toward 0 each frame).
    let shakeX = 0, shakeY = 0;
    if (game.screenShake > 0.05) {
        shakeX = (Math.random() - 0.5) * game.screenShake * 12;
        shakeY = (Math.random() - 0.5) * game.screenShake * 12;
        game.screenShake *= 0.85;
    } else {
        game.screenShake = 0;
    }

    // Parallax starfield BEHIND the world
    for (const s of stars) {
        const wrapW = canvas.width + 40;
        const wrapH = canvas.height + 40;
        const x = ((s.x * wrapW + game.camX * s.layer) % wrapW + wrapW) % wrapW - 20;
        const y = ((s.y * wrapH + game.camY * s.layer) % wrapH + wrapH) % wrapH - 20;
        const tw = 0.35 + Math.sin(game.animFrame * 0.04 + s.phase) * 0.25;
        
        ctx.globalAlpha = tw * s.layer * 3.5;
        ctx.fillStyle = s.color;
        // Removed shadowBlur from stars - huge performance save
        ctx.fillRect(x, y, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    if (isVertigo) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(game.player.vx * 0.012);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    const camX = Math.floor(game.camX + shakeX);
    const camY = Math.floor(game.camY + shakeY);

    const renderables = [];
    const VIEW_W = Math.ceil(canvas.width / T) + 2;
    const VIEW_H = Math.ceil(canvas.height / T) + 2;
    const startX = Math.max(0, px - Math.ceil(VIEW_W / 2));
    const startY = Math.max(0, py - Math.ceil(VIEW_H / 2));
    const endX = Math.min(game.mapWidth, startX + VIEW_W);
    const endY = Math.min(game.mapHeight, startY + VIEW_H);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = game.map[`${x},${y}`];
            if (!tile) continue;
            const dx = x - px;
            const dy = y - py;
            const isVisible = (dx * dx + dy * dy) <= 60;
            const isExplored = game.seen[`${x},${y}`];
            if (isVisible || isExplored) {
                renderables.push({ type: 'tile', tile, x, y, z: 0, isVisible });
            }
        }
    }

    game.items.forEach(item => { if (game.seen[`${item.x},${item.y}`]) renderables.push({ type: 'item', entity: item, x: item.x, y: item.y, z: 1 }); });
    game.npcs.forEach(npc => { if (game.seen[`${npc.x},${npc.y}`]) renderables.push({ type: 'npc', entity: npc, x: npc.x, y: npc.y, z: 1 }); });
    game.trolls.forEach(troll => {
        const d = (troll.x - px)**2 + (troll.y - py)**2;
        if (d <= 60) renderables.push({ type: 'troll', entity: troll, x: troll.x, y: troll.y, z: 2 });
    });
    if (game.player.alive) {
        renderables.push({ type: 'player', entity: game.player, x: game.player.x, y: game.player.y, z: 3 });
    }

    renderables.sort((a, b) => a.z - b.z);

    renderables.forEach(r => {
        const sx = r.x * T + camX;
        const sy = r.y * T + camY;
        
        ctx.globalAlpha = 1.0;
        
        if (r.type === 'tile') {
            // Determine special room tint for this tile
            const tileRx = Math.floor(r.x / 10);
            const tileRy = Math.floor(r.y / 10);
            const roomKey = `${tileRx},${tileRy}`;
            const inHearth = game.hearthRooms && game.hearthRooms.has(roomKey);
            const inShelter = game.safeShelterRooms && game.safeShelterRooms.has(roomKey);
            const inBallroom = game.ballroomRooms && game.ballroomRooms.has(roomKey);
            const inStarHouse = game.starHouseRooms && game.starHouseRooms.has(roomKey);
            const inCharmSchool = game.charmSchoolRooms && game.charmSchoolRooms.has(roomKey);

            ctx.globalAlpha = r.isVisible ? 0.7 : 0.2;
            if (r.tile === '#') {
                // Hearth rooms use warm amber glow on walls
                let wallGlow = r.isVisible ? 'rgba(255,113,206,0.3)' : null;
                if (inHearth && r.isVisible) wallGlow = 'rgba(255,160,50,0.35)';
                if (inShelter && r.isVisible) wallGlow = 'rgba(91,206,250,0.35)';
                if (inBallroom && r.isVisible) wallGlow = 'rgba(255,215,0,0.40)';
                if (inStarHouse && r.isVisible) wallGlow = 'rgba(220,50,50,0.35)';
                if (inCharmSchool && r.isVisible) wallGlow = 'rgba(32,178,170,0.35)';
                const glow = wallGlow;
                drawTile(ctx, sx, sy, '#0a0a0a', true, glow, patterns.wall);

                // Mural text on ceiling walls
                if (r.isVisible && game.muralTiles && game.muralTiles[`${r.x},${r.y}`]) {
                    ctx.globalAlpha = 0.85;
                    ctx.save();
                    ctx.font = '8px VT323';
                    ctx.fillStyle = inHearth ? '#FFD700' : '#F5A9B8';
                    ctx.textAlign = 'center';
                    const mural = game.muralTiles[`${r.x},${r.y}`];
                    ctx.fillText(mural, sx + T / 2, sy + T - 2);
                    ctx.textAlign = 'left';
                    ctx.restore();
                    ctx.globalAlpha = r.isVisible ? 0.7 : 0.2;
                }
            } else if (r.tile === '~') {
                drawTile(ctx, sx, sy, '#1a3a4a', true, r.isVisible ? 'rgba(91,206,250,0.45)' : null, r.isVisible ? patterns.ice : null);
            } else if (r.tile === 'T') {
                drawTile(ctx, sx, sy, '#1a0a14', true, null, r.isVisible ? patterns.trampoline : null);
            } else if (r.tile === '^') {
                drawTile(ctx, sx, sy, '#1a0a14', false, null, r.isVisible ? patterns.spikes : null);
            } else if (r.tile === '=') {
                drawTile(ctx, sx, sy, '#1a0a14', false, null, r.isVisible ? patterns.platform : null);
            } else if (r.tile === 'C') {
                const broke = game.crumbleState && game.crumbleState[`${r.x},${r.y}`] && game.crumbleState[`${r.x},${r.y}`].broken;
                if (!broke) drawTile(ctx, sx, sy, '#1a0a14', false, null, r.isVisible ? patterns.dirt : null);
            } else {
                const floorColor = r.isVisible ? '#0a0a0a' : '#030303';
                let floorGlow = r.isVisible ? 'rgba(1,205,254,0.3)' : null;
                drawTile(ctx, sx, sy, floorColor, false, floorGlow, r.isVisible ? patterns.floor : null);
                // Hearth warm amber overlay on floor
                if (inHearth && r.isVisible && r.tile !== '>') {
                    ctx.globalAlpha = 0.12;
                    ctx.fillStyle = '#FF8C00';
                    ctx.fillRect(sx, sy, T, T);
                    ctx.globalAlpha = r.isVisible ? 0.7 : 0.2;
                }
                // Safe shelter trans flag tint on floor
                if (inShelter && r.isVisible && r.tile !== '>') {
                    const shelterColor = (game.animFrame % 120 < 60) ? 'rgba(91,206,250,0.10)' : 'rgba(245,169,184,0.10)';
                    ctx.globalAlpha = 0.15;
                    ctx.fillStyle = shelterColor;
                    ctx.fillRect(sx, sy, T, T);
                    ctx.globalAlpha = r.isVisible ? 0.7 : 0.2;
                }
                // Ballroom: animated gold/pink sparkle shimmer
                if (inBallroom && r.isVisible && r.tile !== '>') {
                    const ballColor = (game.animFrame % 60 < 20) ? 'rgba(255,215,0,0.12)' : (game.animFrame % 60 < 40) ? 'rgba(255,20,147,0.10)' : 'rgba(180,100,255,0.10)';
                    ctx.globalAlpha = 0.18;
                    ctx.fillStyle = ballColor;
                    ctx.fillRect(sx, sy, T, T);
                    ctx.globalAlpha = r.isVisible ? 0.7 : 0.2;
                }
                // STAR House: warm red/orange activist tint
                if (inStarHouse && r.isVisible && r.tile !== '>') {
                    ctx.globalAlpha = 0.12;
                    ctx.fillStyle = 'rgba(220,80,50,0.15)';
                    ctx.fillRect(sx, sy, T, T);
                    ctx.globalAlpha = r.isVisible ? 0.7 : 0.2;
                }
                // Charm School: warm teal / nurturing tint
                if (inCharmSchool && r.isVisible && r.tile !== '>') {
                    ctx.globalAlpha = 0.12;
                    ctx.fillStyle = 'rgba(32,178,170,0.15)';
                    ctx.fillRect(sx, sy, T, T);
                    ctx.globalAlpha = r.isVisible ? 0.7 : 0.2;
                }
                if (r.tile === 'D') {
                    // Hub-only: dungeon portal — purple/magenta swirling vortex.
                    ctx.globalAlpha = 1.0;
                    const t = game.animFrame * 0.12;
                    ctx.fillStyle = '#FF00FF';
                    ctx.shadowBlur = 22; ctx.shadowColor = '#FF00FF';
                    for (let i = 0; i < 3; i++) {
                        ctx.globalAlpha = 0.35 - i * 0.08;
                        ctx.beginPath();
                        ctx.arc(sx + T/2, sy + T/2, 14 - i * 4 + Math.sin(t + i) * 2, 0, Math.PI*2);
                        ctx.fill();
                    }
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 12px VT323';
                    ctx.textAlign = 'center';
                    ctx.fillText('PORTAL', sx + T/2, sy - 2);
                    ctx.textAlign = 'left';
                    ctx.shadowBlur = 0;
                } else if (r.tile === 'F') {
                    // Hub-only: campfire — flickering orange glow + label.
                    ctx.globalAlpha = 1.0;
                    const flick = (game.animFrame % 8 < 4) ? '#FF8C00' : '#FFD700';
                    ctx.fillStyle = flick;
                    ctx.shadowBlur = 16; ctx.shadowColor = '#FF8C00';
                    ctx.beginPath();
                    ctx.arc(sx + T/2, sy + T/2 + 2, 9, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(sx + T/2, sy + T/2 + 4, 4, 0, Math.PI*2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 12px VT323';
                    ctx.textAlign = 'center';
                    ctx.fillText('CAMPFIRE', sx + T/2, sy - 2);
                    ctx.textAlign = 'left';
                } else if (r.tile === '>') {
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = '#01CDFE';
                    // Faux-glow arc
                    ctx.globalAlpha = 0.3;
                    ctx.beginPath(); ctx.arc(sx + T/2, sy + T/2, 12, 0, Math.PI*2); ctx.fill();
                    ctx.globalAlpha = 1.0;
                    ctx.beginPath(); ctx.arc(sx + T/2, sy + T/2, 8, 0, Math.PI*2); ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (r.tile === '=') {
                    // One-way platform: a thin neon ledge along the top of the tile.
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = '#FF71CE';
                    ctx.shadowBlur = 12; ctx.shadowColor = '#FF71CE';
                    ctx.fillRect(sx + 1, sy, T - 2, 4);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(sx + 1, sy, T - 2, 1);
                    ctx.shadowBlur = 0;
                } else if (r.tile === 'C') {
                    // Crumbling platform — fades from cyan to red as it cracks.
                    const st = game.crumbleState && game.crumbleState[`${r.x},${r.y}`];
                    const aged = st ? Math.min(1, (game.animFrame - st.started) / 30) : 0;
                    ctx.globalAlpha = 1.0;
                    const col = aged > 0
                        ? `rgb(${255}, ${Math.floor(215 * (1 - aged))}, ${Math.floor(64 * (1 - aged))})`
                        : '#01CDFE';
                    ctx.fillStyle = col;
                    ctx.shadowBlur = aged > 0 ? 14 : 10;
                    ctx.shadowColor = col;
                    ctx.fillRect(sx + 1, sy, T - 2, 4);
                    // Cracks scribbled across the platform when aging.
                    if (aged > 0.2) {
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 1;
                        ctx.shadowBlur = 0;
                        ctx.beginPath();
                        ctx.moveTo(sx + 4, sy + 1); ctx.lineTo(sx + 8, sy + 3);
                        ctx.lineTo(sx + 14, sy + 1); ctx.lineTo(sx + 22, sy + 3);
                        ctx.stroke();
                    }
                    ctx.shadowBlur = 0;
                } else if (r.tile === '^') {
                    // Spikes — pointed teeth glowing red along the top of the tile.
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = '#C0C0C0';
                    const teeth = 4;
                    const tw = (T - 4) / teeth;
                    for (let s = 0; s < teeth; s++) {
                        ctx.beginPath();
                        ctx.moveTo(sx + 2 + s * tw,        sy + T);
                        ctx.lineTo(sx + 2 + s * tw + tw/2, sy + 4);
                        ctx.lineTo(sx + 2 + (s + 1) * tw,  sy + T);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            }
        } else {
            ctx.globalAlpha = 1.0;
            const drawX = sx + T / 2;
            const drawY = sy + T;
            
            if (r.type === 'item') {
                if (r.entity.type === 'gender-reveal') {
                    // Pulsing chest
                    const pulse = Math.sin(game.animFrame * 0.18) * 3;
                    const flick = (game.animFrame % 8 < 4) ? '#FF71CE' : '#5BCEFA';
                    if (imgReady(images.chest)) {
                        ctx.drawImage(images.chest, drawX - 24, drawY - 36 + pulse, 48, 36);
                    } else {
                        ctx.fillStyle = flick;
                        ctx.beginPath(); ctx.arc(drawX, drawY - 8 + pulse, 8, 0, Math.PI*2); ctx.fill();
                    }
                } else if (r.entity.type === 'zine') {
                    const bob = Math.sin(game.animFrame * 0.3) * 2;
                    if (imgReady(images.zine)) {
                        ctx.drawImage(images.zine, drawX - 22, drawY - 36 + bob, 44, 36);
                    } else {
                        // Fallback zine
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(drawX - 12, drawY - 20 + bob, 24, 28);
                        ctx.fillStyle = '#FF71CE';
                        ctx.fillRect(drawX - 8, drawY - 14 + bob, 16, 3);
                        ctx.fillRect(drawX - 8, drawY - 6 + bob, 16, 3);
                    }
                } else if (r.entity.type === 'healing') {
                    const bob = Math.sin(game.animFrame * 0.4) * 2;
                    ctx.fillStyle = '#39FF14';
                    // Draw a cross/plus — scaled up for visibility
                    ctx.fillRect(drawX - 4, drawY - 20 + bob, 8, 18);
                    ctx.fillRect(drawX - 10, drawY - 14 + bob, 20, 8);
                } else if (r.entity.type === 'loot') {
                    // Tier-glowing pickup. Higher tiers pulse harder + emit upward sparkles.
                    const tier = r.entity.tier || 'common';
                    const glow = r.entity.glow || '#FFFFFF';
                    const color = r.entity.color || '#CCCCCC';
                    const pulseSpeed = tier === 'legendary' ? 0.32 : tier === 'epic' ? 0.24 : tier === 'rare' ? 0.18 : 0.12;
                    const bob = Math.sin(game.animFrame * pulseSpeed) * 3;
                    const radius = tier === 'legendary' ? 28 : tier === 'epic' ? 22 : tier === 'rare' ? 18 : 14;
                    // Halo (drawn under both gem & themed sprite for the glow ring)
                    ctx.globalAlpha = 0.35;
                    ctx.fillStyle = glow;
                    ctx.shadowBlur = radius;
                    ctx.shadowColor = glow;
                    ctx.beginPath();
                    ctx.arc(drawX, drawY - 10 + bob, radius * 0.4, 0, Math.PI*2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;

                    // Themed sprite if this loot's name is in the lookup,
                    // otherwise the generic gem fallback.
                    const lootSpriteKey = NAMED_LOOT_SPRITES[r.entity.name];
                    const lootImg = lootSpriteKey && images[lootSpriteKey];
                    if (lootImg && imgReady(lootImg)) {
                        const sw = tier === 'legendary' ? 48 : tier === 'epic' ? 40 : 36;
                        const sh = sw;
                        ctx.shadowBlur = 0;
                        ctx.drawImage(lootImg, drawX - sw / 2, drawY - sh - 2 + bob, sw, sh);
                    } else {
                        // Gem body
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.moveTo(drawX,      drawY - 18 + bob);
                        ctx.lineTo(drawX + 8,  drawY - 10 + bob);
                        ctx.lineTo(drawX,      drawY - 2 + bob);
                        ctx.lineTo(drawX - 8,  drawY - 10 + bob);
                        ctx.closePath();
                        ctx.fill();
                        ctx.fillStyle = '#FFFFFF';
                        ctx.globalAlpha = 0.7;
                        ctx.fillRect(drawX - 2, drawY - 14 + bob, 4, 4);
                        ctx.globalAlpha = 1.0;
                    }
                    // Trickle sparkles for higher tiers
                    if ((tier === 'legendary' || tier === 'epic') && game.animFrame % 6 === 0) {
                        game.particles.push({
                            x: r.x + 0.5 + (Math.random() - 0.5) * 0.4,
                            y: r.y + 0.4,
                            vx: (Math.random() - 0.5) * 0.1,
                            vy: -0.2 - Math.random() * 0.15,
                            life: 0.8, color: glow, size: 2
                        });
                    }
                    ctx.shadowBlur = 0;
                } else {
                    const bob = Math.sin(game.animFrame * 0.3) * 1;
                    if (imgReady(images.chest)) {
                        ctx.drawImage(images.chest, drawX - 18, drawY - 28 + bob, 36, 28);
                    } else {
                        ctx.fillStyle = '#FFD700';
                        ctx.fillRect(drawX - 8, drawY - 10 + bob, 16, 10);
                        ctx.fillStyle = '#FF71CE';
                        ctx.fillRect(drawX - 1, drawY - 8 + bob, 2, 6);
                    }
                }
            } else if (r.type === 'npc') {
                const bob = Math.sin(game.animFrame * 0.3) * 2;
                const figKey = r.entity.figureKey;
                const npcC = NPC_FILLER_COLORS[figKey] || NPC_FILLER_COLORS.default;
                // Per-figure sprite override; everyone else falls back to colored filler.
                const npcSprKey = NPC_SPRITES[figKey];
                const npcSprite = npcSprKey && images[npcSprKey] && imgReady(images[npcSprKey]) ? images[npcSprKey] : null;
                if (npcSprite) {
                    const sw = 56, h = 64;
                    ctx.drawImage(npcSprite, drawX - sw/2, drawY - h + bob, sw, h);
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 14px VT323';
                    ctx.textAlign = 'center';
                    ctx.fillText('!', drawX, drawY - h - 4 + bob);
                    ctx.textAlign = 'left';
                } else {
                    // Colored filler body
                    ctx.fillStyle = npcC.body;
                    ctx.beginPath();
                    ctx.roundRect(drawX - 8, drawY - 28 + bob, 16, 20, 4);
                    ctx.fill();
                    // Head
                    ctx.beginPath();
                    ctx.arc(drawX, drawY - 32 + bob, 7, 0, Math.PI*2);
                    ctx.fill();
                    // Hat (if defined) — brim + crown
                    if (npcC.hat) {
                        ctx.fillStyle = npcC.hat;
                        ctx.fillRect(drawX - 10, drawY - 38 + bob, 20, 3);
                        ctx.fillRect(drawX - 7, drawY - 43 + bob, 14, 6);
                    }
                    // Accent flowers / decorations
                    ctx.fillStyle = npcC.accent;
                    for (let f = 0; f < 5; f++) {
                        const fa = (f / 5) * Math.PI;
                        ctx.beginPath();
                        ctx.arc(drawX + Math.cos(fa) * 7, drawY - 39 + bob + Math.sin(fa) * -2, 2, 0, Math.PI*2);
                        ctx.fill();
                    }
                    // "!" indicator above head
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 14px VT323';
                    ctx.textAlign = 'center';
                    ctx.fillText('!', drawX, drawY - (npcC.hat ? 47 : 43) + bob);
                    ctx.textAlign = 'left';
                }
            } else if (r.type === 'troll') {
                const bob = Math.sin(game.animFrame * 0.16 + r.x) * 1.4;
                const et = r.entity.enemyType || 'troll';
                let size = 20, h = 24;

                // Per-enemy-type sprite if one is loaded; otherwise fall through
                // to the procedural drawing for that type, then to the generic
                // enemy texture.
                const spriteKey = ENEMY_SPRITES[et];
                const typedImg = spriteKey && images[spriteKey];
                let drewSprite = false;
                if (et === 'boss') {
                    // boss is handled in its own block below
                } else if (typedImg && imgReady(typedImg)) {
                    // Wraith / ghost flicker keeps the spectral feel even with sprite
                    if (et === 'wraith') ctx.globalAlpha = 0.7 + Math.sin(game.animFrame * 0.6) * 0.25;
                    // Scale sprites to be clearly visible — 1.5-2 tiles tall
                    const sw = (et === 'gatekeeper' || et === 'police') ? 52 : (et === 'bigot' ? 48 : 44);
                    const sh = (et === 'gatekeeper' || et === 'police') ? 58 : (et === 'bigot' ? 54 : 50);
                    ctx.drawImage(typedImg, drawX - sw / 2, drawY - sh + bob, sw, sh);
                    if (et === 'wraith') ctx.globalAlpha = 1.0;
                    size = sw / 2; h = sh;
                    drewSprite = true;
                }

                if (!drewSprite && imgReady(images.enemy) && et !== 'boss' && et !== 'swarm') {
                    ctx.drawImage(images.enemy, drawX - 22, drawY - 48 + bob, 44, 48);
                } else if (!drewSprite) {
                    if (et === 'troll') {
                        ctx.fillStyle = '#FF0000';
                        ctx.fillRect(drawX - 10, drawY - h + bob, size, h);
                        ctx.fillStyle = '#FFF';
                        ctx.fillRect(drawX - 6, drawY - h + 4 + bob, 4, 4);
                        ctx.fillRect(drawX + 2, drawY - h + 4 + bob, 4, 4);
                    } else if (et === 'wraith') {
                        // Ghostly triangle shape that flickers
                        ctx.globalAlpha = 0.6 + Math.sin(game.animFrame * 0.8) * 0.3;
                        ctx.fillStyle = '#39FF14';
                        ctx.beginPath();
                        ctx.moveTo(drawX, drawY - 30 + bob);
                        ctx.lineTo(drawX + 12, drawY + bob);
                        ctx.lineTo(drawX - 12, drawY + bob);
                        ctx.closePath(); ctx.fill();
                        ctx.fillStyle = '#000';
                        ctx.beginPath(); ctx.arc(drawX - 3, drawY - 18 + bob, 2, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(drawX + 3, drawY - 18 + bob, 2, 0, Math.PI*2); ctx.fill();
                        ctx.globalAlpha = 1;
                    } else if (et === 'gatekeeper') {
                        size = 28; h = 30;
                        ctx.fillStyle = '#FFB000';
                        ctx.fillRect(drawX - 14, drawY - h + bob, size, h);
                        // Shield
                        ctx.fillStyle = '#8B4513';
                        ctx.fillRect(drawX - 16, drawY - 20 + bob, 6, 16);
                        ctx.fillStyle = '#FFF';
                        ctx.fillRect(drawX - 8, drawY - h + 6 + bob, 5, 5);
                        ctx.fillRect(drawX + 4, drawY - h + 6 + bob, 5, 5);
                    } else if (et === 'concern') {
                        ctx.fillStyle = '#8A2BE2';
                        ctx.beginPath();
                        ctx.roundRect(drawX - 10, drawY - 24 + bob, 20, 24, 10);
                        ctx.fill();
                        // "?" on face
                        ctx.fillText('?', drawX - 4, drawY - 8 + bob);
                    } else if (et === 'swarm') {
                        // Tiny scuttler — dark cloud with eyes
                        size = 14; h = 14;
                        ctx.fillStyle = '#330033';
                        ctx.beginPath();
                        ctx.arc(drawX, drawY - 7 + bob, 7, 0, Math.PI*2);
                        ctx.fill();
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(drawX - 3, drawY - 8 + bob, 2, 2);
                        ctx.fillRect(drawX + 1, drawY - 8 + bob, 2, 2);
                    } else if (et === 'bigot') {
                        // Hostile face on a megaphone-shaped torso
                        ctx.fillStyle = '#A52A2A';
                        ctx.fillRect(drawX - 9, drawY - 24 + bob, 18, 24);
                        // Megaphone
                        ctx.fillStyle = '#444';
                        ctx.beginPath();
                        ctx.moveTo(drawX + 9, drawY - 18 + bob);
                        ctx.lineTo(drawX + 18, drawY - 22 + bob);
                        ctx.lineTo(drawX + 18, drawY - 8 + bob);
                        ctx.lineTo(drawX + 9, drawY - 12 + bob);
                        ctx.closePath();
                        ctx.fill();
                        ctx.fillStyle = '#FF0000';
                        ctx.fillRect(drawX - 6, drawY - 20 + bob, 3, 3);
                        ctx.fillRect(drawX + 3, drawY - 20 + bob, 3, 3);
                    } else if (et === 'police') {
                        ctx.fillStyle = '#0000FF';
                        ctx.fillRect(drawX - 10, drawY - 26 + bob, 20, 26);
                        // Badge
                        ctx.fillStyle = '#FFD700';
                        ctx.beginPath(); ctx.arc(drawX, drawY - 16 + bob, 4, 0, Math.PI*2); ctx.fill();
                        // Red eyes
                        ctx.fillStyle = '#FF0000';
                        ctx.fillRect(drawX - 6, drawY - 24 + bob, 4, 3);
                        ctx.fillRect(drawX + 2, drawY - 24 + bob, 4, 3);
                    } else if (et === 'boss') {
                        size = 80; h = 96;
                        const enraged = r.entity.bossPhase === 2;
                        const bossImg = imgReady(images.enemy_boss) ? images.enemy_boss : images.boss;
                        if (imgReady(bossImg)) {
                            ctx.drawImage(bossImg, drawX - size/2, drawY - h + bob, size, h);
                            if (enraged) {
                                ctx.save();
                                ctx.globalCompositeOperation = 'multiply';
                                ctx.globalAlpha = 0.45;
                                ctx.fillStyle = '#FF0040';
                                ctx.fillRect(drawX - size/2, drawY - h + bob, size, h);
                                ctx.restore();
                            }
                        } else {
                            ctx.fillStyle = '#FF00FF';
                            ctx.fillRect(drawX - size/2, drawY - h + bob, size, h);
                            ctx.fillStyle = '#FFF';
                            ctx.fillRect(drawX - 12, drawY - h + 10 + bob, 8, 6);
                            ctx.fillRect(drawX + 4, drawY - h + 10 + bob, 8, 6);
                        }
                    }
                }
                
                // Health Bar for all enemies — scaled to match new sprite widths
                const barW = Math.max(size * 2, 40);
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#333';
                ctx.fillRect(drawX - barW/2, drawY - h - 12 + bob, barW, 5);
                ctx.fillStyle = '#FF71CE';
                ctx.fillRect(drawX - barW/2, drawY - h - 12 + bob, barW * (r.entity.health / r.entity.maxHealth), 5);

                // Status effect glyphs floating above the health bar.
                if (r.entity.status) {
                    let ix = drawX - barW / 2;
                    const iy = drawY - h - 22 + bob;
                    if (r.entity.status.burn && r.entity.status.burn.duration > 0) {
                        ctx.fillStyle = '#FF8C00'; ctx.shadowColor = '#FF8C00'; ctx.shadowBlur = 8;
                        ctx.font = 'bold 12px VT323'; ctx.fillText('🔥', ix, iy); ix += 14;
                    }
                    if (r.entity.status.freeze && r.entity.status.freeze.duration > 0) {
                        ctx.fillStyle = '#5BCEFA'; ctx.shadowColor = '#5BCEFA'; ctx.shadowBlur = 8;
                        ctx.font = 'bold 12px VT323'; ctx.fillText('❄', ix, iy); ix += 14;
                        // Frosty overlay on the sprite itself
                        ctx.globalAlpha = 0.35;
                        ctx.fillStyle = '#5BCEFA';
                        ctx.fillRect(drawX - size/2, drawY - h + bob, size, h);
                        ctx.globalAlpha = 1;
                    }
                    if (r.entity.status.shock && r.entity.status.shock.duration > 0) {
                        ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8;
                        ctx.font = 'bold 12px VT323'; ctx.fillText('⚡', ix, iy);
                    }
                    ctx.shadowBlur = 0;
                }
            } else if (r.type === 'player') {
                if (r.entity.hurtCooldown % 2 === 0) {
                    // Try to use generated player sprite based on palette
                    const paletteId = r.entity.colorPalette || 0;
                    const palSpriteKeys = ['player_blue', 'player_blue', 'player_pink', 'player_rainbow'];
                    const palSprKey = palSpriteKeys[paletteId] || 'player_blue';
                    const playerImg = images[palSprKey];
                    if (playerImg && imgReady(playerImg)) {
                        const pw = 52, ph = 60;
                        const bob = Math.sin(game.animFrame * 0.4) * 2;
                        // Flip sprite when facing left
                        ctx.save();
                        if (r.entity.facingX < 0) {
                            ctx.translate(drawX, 0);
                            ctx.scale(-1, 1);
                            ctx.translate(-drawX, 0);
                        }
                        ctx.drawImage(playerImg, drawX - pw/2, drawY - ph + bob, pw, ph);
                        ctx.restore();
                    } else {
                    // DRAW PROCEDURAL PUNK PLAYER
                    // Slow, tiny idle bob — only really shows while moving on
                    // the ground. A fast bob made the character feel like it
                    // was hopping and threw off aiming.
                    const _moving = r.entity.onGround && Math.abs(r.entity.vx || 0) > 0.4;
                    const bob = Math.sin(game.animFrame * 0.14) * (_moving ? 1.4 : 0.5);
                    const pal = PALETTES[r.entity.colorPalette || 0];
                        
                        // Get body and accent colors (cycle for rainbow)
                        let bodyColor, accentColor;
                        if (pal.colors) {
                            // Progress pride: cycle through all flag colors
                            bodyColor = pal.colors[game.animFrame % pal.colors.length];
                            accentColor = pal.colors[(game.animFrame + 3) % pal.colors.length];
                        } else {
                            bodyColor = pal.body;
                            accentColor = pal.accent;
                        }
                        
                        // Ground glow circle for POP
                        ctx.fillStyle = pal.glow;
                        ctx.globalAlpha = 0.2;
                        ctx.shadowBlur = 30;
                        ctx.shadowColor = pal.glow;
                        ctx.beginPath();
                        ctx.ellipse(drawX, drawY, 14, 7, 0, 0, Math.PI*2);
                        ctx.fill();
                        ctx.globalAlpha = 1.0;
                        
                        // Punk protagonist body
                        ctx.fillStyle = bodyColor; ctx.shadowColor = bodyColor;
                        ctx.shadowBlur = 25;
                        ctx.beginPath();
                        ctx.roundRect(drawX - 9, drawY - 30 + bob, 18, 22, 5);
                        ctx.fill();
                        // Head
                        ctx.beginPath();
                        ctx.arc(drawX, drawY - 34 + bob, 8, 0, Math.PI*2);
                        ctx.fill();
                        // Mohawk
                        ctx.fillStyle = accentColor; ctx.shadowColor = accentColor;
                        for (let s = 0; s < 5; s++) {
                            ctx.fillRect(drawX - 4 + s * 2, drawY - 43 + bob - s, 2, 7 + s);
                        }
                        // Visor/glasses
                        ctx.fillStyle = accentColor;
                        ctx.fillRect(drawX - 7 + (r.entity.facingX * 3), drawY - 36 + bob + (r.entity.facingY * 1), 14, 3);
                        // Arms + Hands
                        ctx.fillStyle = bodyColor;
                        ctx.shadowBlur = 10;
                        const armSwing = Math.sin(game.animFrame * 0.5) * 4;
                        // Left arm
                        ctx.fillRect(drawX - 14, drawY - 26 + bob + armSwing, 5, 14);
                        // Left hand
                        ctx.fillStyle = accentColor;
                        ctx.beginPath(); ctx.arc(drawX - 12, drawY - 11 + bob + armSwing, 3, 0, Math.PI*2); ctx.fill();
                        // Right arm
                        ctx.fillStyle = bodyColor;
                        ctx.fillRect(drawX + 9, drawY - 26 + bob - armSwing, 5, 14);
                        // Right hand
                        ctx.fillStyle = accentColor;
                        ctx.beginPath(); ctx.arc(drawX + 12, drawY - 11 + bob - armSwing, 3, 0, Math.PI*2); ctx.fill();
                        // Legs
                        ctx.fillStyle = bodyColor;
                        const legSpread = Math.sin(game.animFrame * 0.6) * 3;
                        ctx.fillRect(drawX - 6 - legSpread, drawY - 8 + bob, 5, 10);
                        ctx.fillRect(drawX + 1 + legSpread, drawY - 8 + bob, 5, 10);
                    } // end procedural else
                }
            }
            
            // INTERACT PROMPT INDICATOR
            // If the player is very close to an interactable entity (NPC or Item), show a bouncy ▼
            if (r.type === 'item' || r.type === 'npc') {
                const px = game.player.x + PLAYER_W / 2;
                const py = game.player.y + PLAYER_H / 2;
                const ex = r.x + 0.5;
                const ey = r.y + 0.5;
                const dist = Math.sqrt(Math.pow(px - ex, 2) + Math.pow(py - ey, 2));
                if (dist < 2.5) {
                    const drawX = sx + T / 2;
                    const drawY = sy + T;
                    const bounce = Math.sin(game.animFrame * 0.4) * 3;
                    ctx.fillStyle = '#01CDFE';
                    ctx.font = 'bold 20px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = '#01CDFE';
                    ctx.fillText('▼', drawX, drawY - 50 + bounce);
                    ctx.textAlign = 'left';
                }
            }
            
            ctx.shadowBlur = 0;
        }
    });

    // Draw Ground Effects (Class Signatures)
    if (game.groundEffects) {
        for (const ge of game.groundEffects) {
            if (ge.type === 'trans_blast') {
                const drawX = (ge.x + game.camX / T) * T;
                const drawY = (ge.y + game.camY / T) * T;
                const r = (1 - (ge.life / 180)) * T * 3.5;
                const a = ge.life / 180;
                ctx.globalAlpha = Math.max(0, a * 0.6);
                
                // Trans flag colors
                const colors = ['#5BCEFA', '#F5A9B8', '#FFFFFF', '#F5A9B8', '#5BCEFA'];
                ctx.lineWidth = 4;
                for (let i = 0; i < colors.length; i++) {
                    ctx.beginPath();
                    ctx.strokeStyle = colors[i];
                    ctx.arc(drawX, drawY, Math.max(1, r - i * 6), 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else if (ge.type === 'gold_pulse') {
                const drawX = (ge.x + game.camX / T) * T;
                const drawY = (ge.y + game.camY / T) * T;
                const r = (1 - (ge.life / 60)) * T * 4;
                const a = ge.life / 60;
                ctx.globalAlpha = Math.max(0, a * 0.5);
                ctx.beginPath();
                ctx.fillStyle = '#FFD700';
                ctx.arc(drawX, drawY, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    ctx.globalAlpha = 1.0;

    // Draw Particles
    for (const p of game.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect((p.x + game.camX/T) * T, (p.y + game.camY/T) * T, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    // Draw short-lived sprite FX (chest-open puff, etc.) — fade + rise then expire.
    for (let i = game.spriteFX.length - 1; i >= 0; i--) {
        const fx = game.spriteFX[i];
        fx.life -= 1;
        fx.rise = (fx.rise || 0) + 0.4;
        if (fx.life <= 0) { game.spriteFX.splice(i, 1); continue; }
        const img = images[fx.sprite];
        if (!imgReady(img)) continue;
        const sx = fx.x * T + camX + T/2 - fx.w / 2;
        const sy = fx.y * T + camY + T - fx.h - fx.rise;
        ctx.globalAlpha = Math.max(0, fx.life / fx.maxLife);
        ctx.drawImage(img, sx, sy, fx.w, fx.h);
    }
    ctx.globalAlpha = 1.0;
    
    // Draw Attack Animation — proper arc sweep with correct screen-space angles
    if (game.attackAnim) {
        const anim = game.attackAnim;
        anim.life -= 1.5;
        if (anim.life <= 0) {
            game.attackAnim = null;
        } else {
            const cx = anim.x * T + camX + T/2;
            const cy = anim.y * T + camY + T/2 - 12;

            // Platformer: direct screen-space angle from facing direction.
            // Combo branches modify the sweep so each chain step reads visually.
            const baseAngle = Math.atan2(anim.dy, anim.dx);
            // Combo step 0 → horizontal slash, step 1 → reverse from above,
            // step 2 (finisher) → big spin. Launcher / dive override entirely.
            let facingAngle = baseAngle;
            let HALF_SWEEP = Math.PI * 0.72;
            let direction = 1;
            if (anim.launcher) {
                facingAngle = baseAngle - Math.PI * 0.45; // up-tilted swing
                HALF_SWEEP = Math.PI * 0.85;
            } else if (anim.diveStab) {
                facingAngle = baseAngle + Math.PI * 0.45; // down-thrust
                HALF_SWEEP = Math.PI * 0.45;
            } else if (anim.finisher) {
                HALF_SWEEP = Math.PI * 1.05; // big spin sweep on finisher
            } else if (anim.comboStep === 1) {
                direction = -1; // reverse-direction follow-up slash
            }
            const startAngle = facingAngle - HALF_SWEEP * direction;
            const endAngle   = facingAngle + HALF_SWEEP * direction;
            const swingProgress = (8 - anim.life) / 8;
            const weaponAngle = startAngle + swingProgress * (endAngle - startAngle);

            const RADIUS = (anim.weaponType === 'sword' ? 46 : 36) +
                           (anim.finisher ? 8 : anim.comboStep === 1 ? 4 : 0);
            const isSword = anim.weaponType === 'sword';
            const glowColor = anim.finisher ? '#FFD700'
                            : anim.launcher ? '#01CDFE'
                            : anim.diveStab ? '#FF71CE'
                            : (isSword ? '#01CDFE' : '#FF71CE');

            ctx.save();

            // 1. ARC TRAIL using ctx.arc() — glowing sweep path
            ctx.beginPath();
            ctx.arc(cx, cy, RADIUS, startAngle, weaponAngle, false);
            ctx.globalAlpha = 0.55 * (anim.life / 8);
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = isSword ? 12 : 9;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 20;
            ctx.shadowColor = glowColor;
            ctx.globalCompositeOperation = 'lighter';
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;

            // 2. WEAPON LINE — drawn from hilt outward at current weapon angle
            const tipX = cx + Math.cos(weaponAngle) * RADIUS;
            const tipY = cy + Math.sin(weaponAngle) * RADIUS;
            const hiltX = cx + Math.cos(weaponAngle) * 10;
            const hiltY = cy + Math.sin(weaponAngle) * 10;

            if (isSword) {
                ctx.beginPath();
                ctx.moveTo(hiltX, hiltY);
                ctx.lineTo(tipX, tipY);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#01CDFE';
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(hiltX, hiltY);
                ctx.lineTo(tipX, tipY);
                ctx.strokeStyle = '#01CDFE';
                ctx.lineWidth = 7;
                ctx.globalAlpha = 0.4;
                ctx.stroke();
                ctx.globalAlpha = 1;
                const perpX = Math.cos(weaponAngle + Math.PI/2) * 9;
                const perpY = Math.sin(weaponAngle + Math.PI/2) * 9;
                ctx.beginPath();
                ctx.moveTo(hiltX - perpX, hiltY - perpY);
                ctx.lineTo(hiltX + perpX, hiltY + perpY);
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 8;
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(hiltX, hiltY);
                ctx.lineTo(tipX, tipY);
                ctx.strokeStyle = '#D0D0D0';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#FF71CE';
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(tipX, tipY, 7, 0, Math.PI*2);
                ctx.fillStyle = '#C0C0C0';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#FF71CE';
                ctx.fill();
                ctx.strokeStyle = '#FF71CE';
                ctx.lineWidth = 1.5;
                for (let t = 0; t < 6; t++) {
                    const sa = weaponAngle + (t / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(tipX + Math.cos(sa) * 6, tipY + Math.sin(sa) * 6);
                    ctx.lineTo(tipX + Math.cos(sa) * 10, tipY + Math.sin(sa) * 10);
                    ctx.stroke();
                }
            }

            // 3. IMPACT FLASH at peak
            if (swingProgress > 0.45 && swingProgress < 0.65) {
                const flashAlpha = 1 - Math.abs(swingProgress - 0.55) / 0.1;
                ctx.globalAlpha = flashAlpha * 0.5;
                ctx.fillStyle = glowColor;
                ctx.shadowBlur = 50;
                ctx.shadowColor = glowColor;
                ctx.beginPath();
                ctx.arc(tipX, tipY, 16, 0, Math.PI*2);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
            }

            ctx.restore();
        }
    }
    
    // Draw Floating Text
    ctx.font = 'bold 18px VT323';
    for (let i = game.floatingText.length - 1; i >= 0; i--) {
        const ft = game.floatingText[i];
        ft.life -= 1;
        if (ft.life <= 0) {
            game.floatingText.splice(i, 1);
            continue;
        }
        
        const px = ft.x * T + camX + T/2;
        const py = ft.y * T + camY + T/2;
        const rise = (30 - ft.life);
        
        ctx.globalAlpha = ft.life / 30;
        ctx.fillStyle = ft.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = ft.color;
        ctx.fillText(ft.text, px - 10, py - 30 - rise);
        ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1.0;

    // ── Hearth room campfire ─────────────────────────────────────────────────
    if (game.hearthRooms) {
        for (const roomKey of game.hearthRooms) {
            const [hrx, hry] = roomKey.split(',').map(Number);
            const fireWorldX = hrx * 10 + 5;
            const fireWorldY = hry * 10 + 7; // near floor
            const fsx = fireWorldX * T + camX;
            const fsy = fireWorldY * T + camY;
            // Only render if in view
            if (fsx < -T || fsx > canvas.width + T || fsy < -T || fsy > canvas.height + T) continue;
            const flicker = 0.75 + Math.sin(game.animFrame * 0.35) * 0.25;
            const flicker2 = 0.7 + Math.sin(game.animFrame * 0.55 + 1.2) * 0.3;
            ctx.save();
            // Glow halo
            ctx.globalAlpha = 0.18 * flicker;
            ctx.fillStyle = '#FF8C00';
            ctx.beginPath();
            ctx.arc(fsx + T/2, fsy + T/4, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            // Log base
            ctx.fillStyle = '#4a2a0a';
            ctx.fillRect(fsx + 4, fsy + T/2 + 4, T - 8, 5);
            // Outer flame (orange)
            ctx.fillStyle = `rgba(255,${Math.floor(100 + 60 * flicker)},0,${flicker})`;
            ctx.beginPath();
            ctx.moveTo(fsx + T/2, fsy - 4);
            ctx.lineTo(fsx + T/2 + 9, fsy + T/2 + 2);
            ctx.lineTo(fsx + T/2 - 9, fsy + T/2 + 2);
            ctx.closePath();
            ctx.fill();
            // Inner flame (yellow)
            ctx.fillStyle = `rgba(255,${Math.floor(200 + 55 * flicker2)},0,${flicker2})`;
            ctx.beginPath();
            ctx.moveTo(fsx + T/2, fsy + 4);
            ctx.lineTo(fsx + T/2 + 5, fsy + T/2 + 2);
            ctx.lineTo(fsx + T/2 - 5, fsy + T/2 + 2);
            ctx.closePath();
            ctx.fill();
            // Ember tip (white)
            ctx.fillStyle = `rgba(255,255,220,${flicker})`;
            ctx.beginPath();
            ctx.arc(fsx + T/2, fsy + 6, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ── Safe shelter trans flag accent strip on floor ─────────────────────────
    if (game.safeShelterRooms) {
        for (const roomKey of game.safeShelterRooms) {
            const [srx, sry] = roomKey.split(',').map(Number);
            const floorY = sry * 10 + 8; // top of floor row
            for (let tx = srx * 10 + 1; tx < (srx + 1) * 10 - 1; tx++) {
                const tsx = tx * T + camX, tsy = floorY * T + camY;
                if (tsx < -T || tsx > canvas.width + T) continue;
                // Stripe: trans blue / pink / white cycling
                const stripeColor = tx % 3 === 0 ? 'rgba(91,206,250,0.55)' :
                                    tx % 3 === 1 ? 'rgba(245,169,184,0.55)' :
                                                   'rgba(255,255,255,0.40)';
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = stripeColor;
                ctx.fillRect(tsx, tsy, T, 2);
            }
            ctx.globalAlpha = 1.0;
        }
    }

    // Close vertigo wrapper
    if (isVertigo) ctx.restore();

    // === HUD OVERLAYS (drawn outside the vertigo wrapper so they stay still) ===

    // Greyscale post-process
    if (isGreyscale) {
        ctx.save();
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // Low-HP vignette pulse
    const hpRatio = game.player.health / Math.max(1, game.player.maxHealth);
    if (hpRatio <= 0.34 && game.player.alive) {
        const pulse = 0.35 + Math.sin(game.animFrame * 0.12) * 0.15;
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width*0.25,
                                              canvas.width/2, canvas.height/2, canvas.width*0.7);
        grad.addColorStop(0, 'rgba(255,0,40,0)');
        grad.addColorStop(1, `rgba(255,0,40,${pulse})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // CRT scanlines (always on for the aesthetic, slightly stronger with nostalgia trait)
    const scanAlpha = (game.player.traits && game.player.traits.some(t => t.id === 'nostalgia')) ? 0.18 : 0.08;
    ctx.fillStyle = `rgba(0,0,0,${scanAlpha})`;
    for (let y = 0; y < canvas.height; y += 3) ctx.fillRect(0, y, canvas.width, 1);

    // Charge attack meter — sits above the player on screen so it's always visible.
    if (game.player.chargeAttack > 0) {
        const chargeRatio = Math.min(1, game.player.chargeAttack / 120);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 - 60;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(cx - 32, cy, 64, 6);
        const isOver = game.player.chargeAttack >= 110;
        const isReady = game.player.chargeAttack >= 60;
        ctx.fillStyle = isOver ? '#FF0040' : isReady ? '#FFD700' : '#01CDFE';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(cx - 32, cy, 64 * chargeRatio, 6);
        ctx.shadowBlur = 0;
        if (isReady) {
            ctx.font = 'bold 11px VT323';
            ctx.textAlign = 'center';
            ctx.fillStyle = isOver ? '#FF0040' : '#FFD700';
            ctx.fillText(isOver ? 'OVERCHARGED!' : 'READY', cx, cy + 18);
            ctx.textAlign = 'left';
        }
    }

    // Class power HUD
    if (game.player.classObj) {
        const cls = game.player.classObj;
        const w = 160, h = 16, x0 = canvas.width - w - 8, y0 = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
        ctx.strokeStyle = '#01CDFE';
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 - 2, y0 - 2, w + 4, h + 4);
        const cdRatio = 1 - (game.player.powerCooldown / 600);
        ctx.fillStyle = game.player.powerActive > 0 ? '#FF71CE' : '#01CDFE';
        ctx.fillRect(x0, y0, w * cdRatio, h);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px VT323';
        ctx.fillText(`R: ${cls.power}${game.player.powerCooldown > 0 ? ` (${Math.ceil(game.player.powerCooldown/60)}s)` : ''}`, x0 + 4, y0 + 12);
    }

    // Mini-map in top-right corner (depth & explored layout)
    const MM = 3; // 3px per tile
    const mmW = game.mapWidth * MM, mmH = game.mapHeight * MM;
    const mmX = canvas.width - mmW - 8, mmY = canvas.height - mmH - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
    ctx.strokeStyle = '#FF71CE';
    ctx.strokeRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
    for (let y = 0; y < game.mapHeight; y++) {
        for (let x = 0; x < game.mapWidth; x++) {
            if (!game.seen[`${x},${y}`]) continue;
            const t = game.map[`${x},${y}`];
            ctx.fillStyle = t === '#' ? '#444' : t === '>' ? '#01CDFE' : '#1a1a1a';
            ctx.fillRect(mmX + x*MM, mmY + y*MM, MM, MM);
        }
    }
    ctx.fillStyle = '#FF71CE';
    ctx.fillRect(mmX + tileX()*MM - 1, mmY + tileY()*MM - 1, MM + 2, MM + 2);

    // Dash cooldown ring under player position on map
    if (game.player.dashCooldown > 0) {
        ctx.strokeStyle = '#01CDFE';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const angle = (1 - game.player.dashCooldown / DASH_COOLDOWN) * Math.PI * 2;
        ctx.arc(canvas.width / 2, canvas.height - 30, 12, -Math.PI/2, -Math.PI/2 + angle);
        ctx.stroke();
    }

    // F1-toggled FPS / frame-time overlay — useful for diagnosing perf issues
    // on real machines without browser devtools.
    if (showFps && fpsSamples.length) {
        let sum = 0;
        for (const s of fpsSamples) sum += s;
        const avgMs = (sum / fpsSamples.length) * 1000;
        const fps = 1000 / Math.max(0.0001, avgMs);
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(8, 8, 110, 36);
        ctx.font = 'bold 12px VT323';
        ctx.textAlign = 'left';
        ctx.fillStyle = fps >= 50 ? '#39FF14' : fps >= 30 ? '#FFD700' : '#FF0040';
        ctx.fillText(`FPS: ${fps.toFixed(0)}`, 14, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`frame: ${avgMs.toFixed(1)}ms`, 14, 38);
        ctx.restore();
    }

    // Screen-space damage flash — drawn over everything for unmissable hurt feedback.
    if (game.damageFlash > 0.01) {
        ctx.fillStyle = `rgba(255,40,80,${game.damageFlash * 0.45})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        game.damageFlash *= 0.86;
    } else {
        game.damageFlash = 0;
    }

    // --- HUD Overlay on Canvas ---
    // Draw prominent Health (Hearts) in top right corner. Each heart is sliced
    // into quarters so Easy/Normal damage drains visibly per ¼ / ½ heart hit.
    const padding = 12;
    const heartSize = 22;
    const heartGap = 6;
    const heartW = heartSize + heartGap;
    ctx.font = '28px "VT323", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let i = 0; i < game.player.maxHealth; i++) {
        const hx = canvas.width - padding - (game.player.maxHealth - i) * heartW;
        const hy = padding;
        const heartFill = Math.max(0, Math.min(1, game.player.health - i));

        // Empty silhouette first (always drawn so quarter hearts read clearly).
        ctx.fillStyle = '#1a1a1a';
        ctx.shadowBlur = 0;
        ctx.fillText('♥', hx, hy);
        ctx.fillStyle = '#444444';
        ctx.fillText('♡', hx, hy);

        if (heartFill > 0) {
            // Clip to fill ratio so we get crisp ¼ / ½ / ¾ partial hearts.
            ctx.save();
            ctx.beginPath();
            ctx.rect(hx, hy, heartSize * heartFill, heartSize + 6);
            ctx.clip();
            ctx.fillStyle = '#FF71CE';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#FF71CE';
            ctx.fillText('♥', hx, hy);
            ctx.restore();
        }
    }
    ctx.shadowBlur = 0;

    // Difficulty label sits beside the hearts so the player remembers the
    // setting at a glance.
    const diffNow = DIFFICULTIES[game.persistent.difficulty || 'normal'] || DIFFICULTIES.normal;
    ctx.font = 'bold 12px VT323';
    ctx.fillStyle = diffNow.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = diffNow.color;
    const diffLabel = `${diffNow.label}`;
    const diffW = ctx.measureText(diffLabel).width;
    const diffX = canvas.width - padding - game.player.maxHealth * heartW - diffW - 6;
    ctx.fillText(diffLabel, diffX, padding + 6);
    ctx.shadowBlur = 0;

    // Combo HUD — displays current chain count + remaining window.
    if (game.player.comboCount > 0 || game.player.comboTimer > 0) {
        const cc = Math.max(game.player.comboCount, game.player.comboPeak || 0);
        const cTimerMax = 60;
        const cFill = Math.max(0, game.player.comboTimer / cTimerMax);
        const baseX = padding;
        const baseY = canvas.height - padding - 28;
        ctx.font = 'bold 26px VT323';
        const labelTier = cc >= 3 ? '#FFD700' : cc === 2 ? '#FF71CE' : '#01CDFE';
        ctx.fillStyle = labelTier;
        ctx.shadowBlur = 14;
        ctx.shadowColor = labelTier;
        ctx.fillText(`x${cc} COMBO`, baseX, baseY);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(baseX, baseY + 22, 96, 4);
        ctx.fillStyle = labelTier;
        ctx.fillRect(baseX, baseY + 22, 96 * cFill, 4);
    }

    // Loot buff indicator — small +1 DMG sigil under the combo HUD.
    if (game.player.lootBuff > 0) {
        const baseX = padding;
        const baseY = canvas.height - padding - 56;
        ctx.font = 'bold 14px VT323';
        ctx.fillStyle = '#39FF14';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#39FF14';
        ctx.fillText(`+1 DMG (${Math.ceil(game.player.lootBuff / 60)}s)`, baseX, baseY);
        ctx.shadowBlur = 0;
    }

    // Quest log overlay (J to toggle). Top half = headline progress;
    // bottom half = active/ready cozy quests with per-quest status.
    if (questLogVisible) {
        const w = 380, h = 360;
        const x0 = canvas.width / 2 - w / 2;
        const y0 = canvas.height / 2 - h / 2;
        ctx.fillStyle = 'rgba(5,5,12,0.94)';
        ctx.fillRect(x0, y0, w, h);
        ctx.strokeStyle = '#FF71CE';
        ctx.shadowColor = '#FF71CE';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        ctx.strokeRect(x0, y0, w, h);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FF71CE';
        ctx.font = 'bold 18px VT323';
        ctx.textAlign = 'center';
        ctx.fillText('📋 QUEST LOG', x0 + w / 2, y0 + 22);

        ctx.textAlign = 'left';
        ctx.font = '14px VT323';
        const seenZ = Object.keys(game.persistent.seenZines || {}).length;
        const seenF = Object.keys(game.persistent.seenFigures || {}).length;

        let yy = y0 + 50;
        const line = (label, color) => { ctx.fillStyle = color; ctx.fillText(label, x0 + 16, yy); yy += 18; };
        line('▸ Recover the lost zines:', '#FFFFFF');
        const zRatio = seenZ / 19;
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x0 + 30, yy - 10, 280, 8);
        ctx.fillStyle = '#FF71CE'; ctx.fillRect(x0 + 30, yy - 10, 280 * zRatio, 8);
        ctx.fillStyle = '#FFFFFF'; ctx.font = '12px VT323'; ctx.fillText(`${seenZ} / 19`, x0 + 320, yy - 2);
        yy += 14;

        ctx.font = '14px VT323';
        line('▸ Meet the historical figures:', '#FFFFFF');
        const fRatio = seenF / 9;
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x0 + 30, yy - 10, 280, 8);
        ctx.fillStyle = '#01CDFE'; ctx.fillRect(x0 + 30, yy - 10, 280 * fRatio, 8);
        ctx.fillStyle = '#FFFFFF'; ctx.font = '12px VT323'; ctx.fillText(`${seenF} / 9`, x0 + 320, yy - 2);
        yy += 14;

        ctx.font = '14px VT323';
        line(`▸ Depth ${game.depth} · Deepest ${game.persistent.deepestReached || game.depth}`, '#FFD700');
        line(`▸ Scrap banked: ${game.persistent.treasures}`, '#39FF14');

        // Cozy quests list
        yy += 8;
        ctx.fillStyle = '#FF71CE'; ctx.font = 'bold 14px VT323';
        ctx.fillText('— COZY QUESTS —', x0 + 16, yy); yy += 18;
        ctx.font = '13px VT323';
        const allQuests = (typeof window.__getAllQuests === 'function') ? window.__getAllQuests() : [];
        if (allQuests.length === 0) {
            ctx.fillStyle = '#888'; ctx.fillText('Talk to NPCs to discover quests.', x0 + 16, yy); yy += 16;
        }
        for (const q of allQuests) {
            const s = q.state.status;
            if (s === 'completed') continue;
            let prefix = '○', col = '#888';
            if (s === 'active') { prefix = '◐'; col = '#01CDFE'; }
            else if (s === 'ready') { prefix = '✓'; col = '#FFD700'; }
            ctx.fillStyle = col;
            const progressStr = (s === 'active' || s === 'ready') ? ` (${q.state.progress}/${q.goal.target})` : '';
            ctx.fillText(`${prefix} ${q.title}${progressStr}`, x0 + 16, yy); yy += 14;
            ctx.fillStyle = '#aaa'; ctx.font = '11px VT323';
            ctx.fillText(`   ${q.summary}`, x0 + 16, yy); yy += 14;
            ctx.font = '13px VT323';
        }

        ctx.fillStyle = '#888';
        ctx.font = '12px VT323';
        ctx.fillText('Press J to close', x0 + 16, y0 + h - 12);
        ctx.textAlign = 'left';
    }

    // Pause overlay on top of HUD.
    if (paused) {
        ctx.fillStyle = 'rgba(5,5,12,0.78)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.font = 'bold 56px VT323';
        ctx.shadowBlur = 18; ctx.shadowColor = '#FF71CE';
        ctx.fillStyle = '#FF71CE';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 10);
        ctx.shadowBlur = 8; ctx.shadowColor = '#01CDFE';
        ctx.font = '18px VT323';
        ctx.fillStyle = '#01CDFE';
        ctx.fillText('P / Esc to resume', canvas.width / 2, canvas.height / 2 + 24);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px VT323';
        ctx.fillText('WASD/Arrows · Space jump · Q quick · E power · Shift dash · R class', canvas.width / 2, canvas.height / 2 + 50);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
    }
}

function tryDash() {
    const p = game.player;
    if (p.dashCooldown > 0) return;
    p.dashTimer = DASH_FRAMES;
    p.dashCooldown = DASH_COOLDOWN;
    p.dashDir = p.facingX || 1;
    p.hurtCooldown = Math.max(p.hurtCooldown, 4);
    UI.addMessage("Dash!", "special");
    for (let i = 0; i < 14; i++) spawnDust(p.x + PLAYER_W / 2, p.y + PLAYER_H * 0.5, 1, '#01CDFE');
    Audio.playDash();
}

function activateClassPower() {
    const p = game.player;
    if (p.powerCooldown > 0 || !p.classObj) return;
    const cls = p.classObj.id;
    p.powerCooldown = 600; // 10s @ 60fps
    Audio.playPower();
    if (cls === 'anarchist') {
        p.powerType = 'rage'; p.powerActive = 180;
        UI.addMessage("BLACK BLOC RAGE! ✊", "special"); UI.shakeScreen();
        for (let i = 0; i < 30; i++) spawnDust(p.x, p.y + PLAYER_H, 1, '#FF0000');
    } else if (cls === 'terrorist') {
        UI.addMessage("GLITTER BOMB! 💣", "special"); UI.shakeScreen();
        const dirs = [[0,0],[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
        dirs.forEach(d => attackEnemy(game, d[0], d[1], 'blast'));
        for (let i = 0; i < 60; i++) {
            game.particles.push({ x: p.x + PLAYER_W/2, y: p.y + PLAYER_H/2,
                vx: (Math.random()-0.5)*1.4, vy: (Math.random()-0.5)*1.4, life: 1.0,
                color: ['#FF71CE','#01CDFE','#FFD700','#39FF14'][i%4] });
        }
        if (!game.groundEffects) game.groundEffects = [];
        game.groundEffects.push({ x: p.x + PLAYER_W/2, y: p.y + PLAYER_H/2, life: 180, type: 'trans_blast' });
    } else if (cls === 'archivist') {
        p.powerType = 'slow'; p.powerActive = 240;
        UI.addMessage("TIME DILATION ⏳", "special");
        // Freeze every enemy in sight when activated.
        const px2 = tileX(), py2 = tileY();
        game.trolls.forEach(t => {
            if (Math.abs(t.x - px2) + Math.abs(t.y - py2) <= 8) {
                applyStatus(t, 'freeze', 240, 1);
                game.particles.push({ x: t.x, y: t.y, vx: 0, vy: -0.2, life: 1, color: '#5BCEFA' });
            }
        });
    } else if (cls === 'brawler') {
        tryDash();
        p.dashTimer = DASH_FRAMES * 2; p.hurtCooldown = 30;
        UI.addMessage("PRIDE DASH! 🌈", "special");
    } else if (cls === 'dealer') {
        p.health = Math.min(p.maxHealth, p.health + 2);
        p.powerType = 'bump'; p.powerActive = 240;
        UI.addMessage("HRT BUMP — feeling powerful!", "healing");
        UI.updateStatus(game);
        if (!game.groundEffects) game.groundEffects = [];
        game.groundEffects.push({ x: p.x + PLAYER_W/2, y: p.y + PLAYER_H/2, life: 60, type: 'gold_pulse' });
    } else if (cls === 'aidworker') {
        p.powerType = 'aura'; p.powerActive = 480;
        UI.addMessage("SOLIDARITY AURA — community heals.", "healing");
    }
}

function setupControls() {
    document.addEventListener('keydown', e => {
        if (e.repeat) return;
        keys[e.code] = true;

        // Pause toggle works even when a modal is open (so Esc can close us out of stuck state).
        if (e.code === 'Escape' || e.code === 'KeyP') {
            const modalOpen = UI.modals.zine.style.display === 'flex' ||
                              UI.modals.conversation.style.display === 'flex' ||
                              UI.modals.gameOver.style.display === 'flex' ||
                              UI.modals.victory.style.display === 'flex' ||
                              UI.modals.heirSelect.style.display === 'flex' ||
                              UI.modals.camp.style.display === 'flex';
            if (!modalOpen) {
                paused = !paused;
                e.preventDefault();
                return;
            }
        }

        if (UI.modals.zine.style.display === 'flex' || 
            UI.modals.conversation.style.display === 'flex' ||
            UI.modals.levelUp.style.display === 'flex') return;
        if (paused || game.player.hitstun > 0) return;

        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowDown' || e.code === 'KeyS') {
            e.preventDefault(); // Prevent browser scrolling which looks like a game freeze!
        }

        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            // Holding Down + jump drops through the one-way platform you're standing on.
            if ((keys['ArrowDown'] || keys['KeyS']) && game.player.onGround) {
                game.player.dropThrough = 8;
                game.player.onGround = false;
                game.player.vy = 1.5;
            } else if (!tryJump()) {
                // Out of jumps right now — buffer so a slightly-early press still lands.
                game.player.jumpBuffer = JUMP_BUFFER_FRAMES;
            }
        }

        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            const px = Math.floor(game.player.x + PLAYER_W / 2);
            const pyFeet = Math.floor(game.player.y + PLAYER_H + 0.1);
            if (game.player.onGround && game.map[`${px},${pyFeet}`] === '=') {
                game.player.dropThrough = 8;
                game.player.onGround = false;
                game.player.vy = 1.5;
            } else if (game.map[`${px},${Math.floor(game.player.y + PLAYER_H - 0.1)}`] === '>') {
                descend();
                return;
            }
        }

        if (e.code === 'KeyQ') {
            // Directional attacks: Up + Q = launcher; Down + Q (airborne) = dive stab.
            const upHeld = keys['ArrowUp'] || keys['KeyW'];
            const downHeld = keys['ArrowDown'] || keys['KeyS'];
            let dirY = 0;
            if (upHeld) dirY = -1;
            else if (downHeld && !game.player.onGround) dirY = 1;
            attackEnemy(game, game.player.facingX, 0, 'quick', dirY);
        } else if (e.code === 'KeyE') {
            // Begin charging — holding builds the meter; release in keyup.
            game.player.chargeAttack = 1;
            game.player.chargeReady = false;
        } else if (e.code === 'KeyR') {
            activateClassPower();
        } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            tryDash();
        } else if (e.code === 'Enter' || e.code === 'KeyF') {
            interact();
        } else if (e.code === 'KeyJ') {
            questLogVisible = !questLogVisible;
        } else if (e.code === 'F1') {
            showFps = !showFps;
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', e => {
        keys[e.code] = false;
        // Variable jump height: releasing the jump button while still rising
        // truncates upward velocity, so taps = small hop, holds = full leap.
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            if (game.player.vy < -3.5) game.player.vy *= 0.45;
        }
        // Release charge attack — heavy if charged, regular power swing if barely held.
        if (e.code === 'KeyE' && game.player.chargeAttack > 0) {
            const charged = game.player.chargeAttack >= 60;
            const overcharge = game.player.chargeAttack >= 110;
            if (overcharge) {
                // Overcharged release — hits in an arc and applies burn to all in front.
                UI.addMessage("OVERCHARGED STRIKE! 🔥", 'special');
                UI.shakeScreen();
                game.screenShake = Math.max(game.screenShake, 0.8);
                const fx = game.player.facingX || 1;
                attackEnemy(game, fx, 0, 'power');
                attackEnemy(game, fx, -1, 'power');
                attackEnemy(game, fx, 1, 'power');
            } else if (charged) {
                attackEnemy(game, game.player.facingX || 1, 0, 'power');
            } else {
                attackEnemy(game, game.player.facingX || 1, 0, 'quick');
            }
            game.player.chargeAttack = 0;
            game.player.chargeReady = false;
        }
    });

    // Normalized analog input from the on-screen joystick (-1..1 each axis).
    // The wrapped update below scales acceleration by tiltX magnitude.
    const touchAxis = { x: 0, y: 0 };

    // Wrap update for held-key horizontal movement
    const originalUpdate = update;
    update = (dt) => {
        const p = game.player;
        let accel = ACCEL;
        if (p.trait && p.trait.id === 'adhd') accel *= 1.4;
        if (p.hasSpeedPerk) accel *= 1.3;
        if (p.traits && p.traits.some(t => t.id === 'chronic')) accel *= 0.7;

        if (p.hitstun > 0) {
            // Melee-style DI: allow slight horizontal nudge while in hitstun
            if (keys['ArrowLeft'] || keys['KeyA']) p.vx -= 0.15;
            if (keys['ArrowRight'] || keys['KeyD']) p.vx += 0.15;
        } else if (p.dashTimer <= 0) {
            const tiltX = touchAxis.x;
            if (keys['ArrowLeft'] || keys['KeyA']) {
                p.vx -= accel;
                p.facingX = -1;
            } else if (keys['ArrowRight'] || keys['KeyD']) {
                p.vx += accel;
                p.facingX = 1;
            } else if (Math.abs(tiltX) > 0.18) {
                // Analog joystick: 0.65x multiplier so mobile feels slower/more precise.
                p.vx += accel * tiltX * 0.65;
                p.facingX = tiltX > 0 ? 1 : -1;
            }
            // Clamp speed
            let limit = MAX_VX * (p.trait?.id === 'adhd' ? 1.3 : 1.0);
            if (p.hasSpeedPerk) limit *= 1.25;
            if (p.vx > limit) p.vx = limit;
            if (p.vx < -limit) p.vx = -limit;
        }
        originalUpdate(dt);
    };

    // On-screen / touch controls — held-state via pointer events so a finger
    // resting on a button actually keeps the action active, not just one tap.
    function bindHold(id, onPress, onRelease) {
        const el = document.getElementById(id);
        if (!el) return;
        let isPressed = false;
        const press = (e) => {
            if (e && e.cancelable) e.preventDefault();
            if (isPressed) return;
            isPressed = true;
            el.classList.add('pressed');
            onPress && onPress(e);
        };
        const release = (e) => {
            if (e && e.cancelable) e.preventDefault();
            if (!isPressed) return;
            isPressed = false;
            el.classList.remove('pressed');
            onRelease && onRelease(e);
        };
        // Pointer events handle touch + mouse + pen uniformly on iOS Safari ≥13.
        el.addEventListener('pointerdown', press);
        el.addEventListener('pointerup', release);
        el.addEventListener('pointercancel', release);
        el.addEventListener('pointerleave', release);
        // Belt-and-suspenders for older iOS that fire touch but not pointer.
        el.addEventListener('touchstart', press, { passive: false });
        el.addEventListener('touchend', release, { passive: false });
        el.addEventListener('touchcancel', release, { passive: false });
    }

    // ---- Virtual analog joystick (left thumb) ---------------------------
    // Touching anywhere in #tj-zone spawns the base under the finger; the
    // stick translates with the drag and exposes a normalized vector via
    // touchAxis so the wrapped update can scale acceleration by tilt.
    const tjZone  = document.getElementById('tj-zone');
    const tjBase  = document.getElementById('tj-base');
    const tjStick = document.getElementById('tj-stick');
    const JOY_RADIUS = 60;       // px: max stick travel from center
    const JOY_DEAD   = 0.18;     // ignore tiny tilts to prevent drift
    let joyId = null;            // pointerId currently driving the joystick
    let joyOriginX = 0, joyOriginY = 0;
    let joyDownLatched = false;  // edge-trigger for "down + neutral = drop through"

    if (tjZone && tjBase && tjStick) {
        const setStick = (dx, dy) => {
            const len = Math.hypot(dx, dy);
            const max = JOY_RADIUS;
            const ux = len > max ? dx * (max / len) : dx;
            const uy = len > max ? dy * (max / len) : dy;
            tjStick.style.transform = `translate(${ux}px, ${uy}px)`;
            const nx = ux / max;
            const ny = uy / max;
            touchAxis.x = Math.abs(nx) > JOY_DEAD ? nx : 0;
            touchAxis.y = Math.abs(ny) > JOY_DEAD ? ny : 0;
        };

        const beginJoy = (e) => {
            if (joyId !== null) return;
            if (e.cancelable) e.preventDefault();
            joyId = e.pointerId;
            const rect = tjZone.getBoundingClientRect();
            joyOriginX = e.clientX - rect.left;
            joyOriginY = e.clientY - rect.top;
            tjBase.style.left = `${joyOriginX}px`;
            tjBase.style.top  = `${joyOriginY}px`;
            tjBase.classList.add('active');
            tjStick.style.transform = 'translate(0, 0)';
            try { tjZone.setPointerCapture(e.pointerId); } catch (_) {}
        };
        const moveJoy = (e) => {
            if (e.pointerId !== joyId) return;
            if (e.cancelable) e.preventDefault();
            const rect = tjZone.getBoundingClientRect();
            const dx = (e.clientX - rect.left) - joyOriginX;
            const dy = (e.clientY - rect.top)  - joyOriginY;
            setStick(dx, dy);
            // Pulling the stick down past 60% triggers a single drop-through
            // when standing on a one-way platform — re-armed when released.
            if (touchAxis.y > 0.6 && !joyDownLatched) {
                joyDownLatched = true;
                const px = Math.floor(game.player.x + PLAYER_W / 2);
                const pyFeet = Math.floor(game.player.y + PLAYER_H + 0.1);
                if (game.player.onGround && game.map[`${px},${pyFeet}`] === '=') {
                    game.player.dropThrough = 8;
                    game.player.onGround = false;
                    game.player.vy = 1.5;
                } else if (game.map[`${px},${Math.floor(game.player.y + PLAYER_H - 0.1)}`] === '>') {
                    descend();
                }
            } else if (touchAxis.y < 0.3) {
                joyDownLatched = false;
            }
        };
        const endJoy = (e) => {
            if (e.pointerId !== joyId) return;
            joyId = null;
            joyDownLatched = false;
            tjBase.classList.remove('active');
            tjStick.style.transform = 'translate(0, 0)';
            touchAxis.x = 0;
            touchAxis.y = 0;
            try { tjZone.releasePointerCapture(e.pointerId); } catch (_) {}
        };
        tjZone.addEventListener('pointerdown', beginJoy);
        tjZone.addEventListener('pointermove', moveJoy);
        tjZone.addEventListener('pointerup', endJoy);
        tjZone.addEventListener('pointercancel', endJoy);
        tjZone.addEventListener('pointerleave', endJoy);
    }

    // ---- Action buttons -------------------------------------------------
    bindHold('t-jump', () => {
        keys['Space'] = true; // Suppress per-frame velocity cut while finger is held
        // Joystick fully down + JUMP = drop through one-way platform (high threshold avoids accidental drops).
        if (touchAxis.y > 0.8 && game.player.onGround) {
            const px = Math.floor(game.player.x + PLAYER_W / 2);
            const pyFeet = Math.floor(game.player.y + PLAYER_H + 0.1);
            if (game.map[`${px},${pyFeet}`] === '=') {
                game.player.dropThrough = 8;
                game.player.onGround = false;
                game.player.vy = 1.5;
                return;
            }
        }
        if (!tryJump()) {
            game.player.jumpBuffer = JUMP_BUFFER_FRAMES;
        }
    }, () => {
        keys['Space'] = false;
        // Variable jump on release.
        if (game.player.vy < -3.5) game.player.vy *= 0.45;
    });

    // 3-hit combo ATK: tap once/twice = quick attack, third tap = power finisher.
    {
        const atkEl        = document.getElementById('t-atk');
        const comboEl      = document.getElementById('t-combo');
        const comboCountEl = document.getElementById('t-combo-count');
        const comboLabelEl = document.getElementById('t-combo-label');
        const flashEl      = document.getElementById('power-move-flash');
        let mobileCombo    = 0;
        let comboTimeout   = null;
        const COMBO_MS     = 1800;

        function showPowerFlash() {
            if (!flashEl) return;
            flashEl.style.display = 'flex';
            clearTimeout(flashEl._t);
            flashEl._t = setTimeout(() => { flashEl.style.display = 'none'; }, 580);
        }

        function syncComboHud() {
            if (!comboEl) return;
            comboEl.classList.toggle('active', mobileCombo > 0);
            comboEl.classList.toggle('ready',  mobileCombo >= 2);
            if (atkEl) atkEl.classList.toggle('combo-ready', mobileCombo >= 2);
            if (comboCountEl) comboCountEl.textContent = `x${mobileCombo}`;
            if (comboLabelEl) comboLabelEl.textContent = mobileCombo >= 2 ? 'POWER READY' : 'COMBO';
        }

        function clearCombo() { mobileCombo = 0; syncComboHud(); }

        if (atkEl) {
            atkEl.addEventListener('pointerdown', (e) => {
                if (e.cancelable) e.preventDefault();
                atkEl.classList.add('pressed');
            });
            atkEl.addEventListener('pointerup', (e) => {
                if (e.cancelable) e.preventDefault();
                atkEl.classList.remove('pressed');
                const fx = game.player.facingX || 1;
                if (mobileCombo >= 2) {
                    clearTimeout(comboTimeout);
                    clearCombo();
                    attackEnemy(game, fx, 0, 'power');
                    game.screenShake = Math.max(game.screenShake || 0, 0.9);
                    for (let i = 0; i < 16; i++) spawnParticle(
                        game.player.x + PLAYER_W / 2,
                        game.player.y + PLAYER_H / 2,
                        i % 2 ? '#FFD700' : '#FF71CE', 1
                    );
                    UI.addMessage('POWER MOVE! 💥', 'special');
                    showPowerFlash();
                } else {
                    const dirY = touchAxis.y > 0.4 && !game.player.onGround ? 1 : 0;
                    attackEnemy(game, fx, 0, 'quick', dirY);
                    mobileCombo++;
                    clearTimeout(comboTimeout);
                    comboTimeout = setTimeout(clearCombo, COMBO_MS);
                    syncComboHud();
                }
            });
            atkEl.addEventListener('pointercancel', () => atkEl.classList.remove('pressed'));
        }
    }
    bindHold('t-dash', tryDash);
    bindHold('t-pwr',  activateClassPower);
    bindHold('t-use',  () => {
        // USE doubles as descend when standing on stairs.
        const px = Math.floor(game.player.x + PLAYER_W / 2);
        const pyMid = Math.floor(game.player.y + PLAYER_H - 0.1);
        if (game.map[`${px},${pyMid}`] === '>') { descend(); return; }
        if (game.inHub && game.map[`${px},${pyMid}`] === 'D') { startDungeon(); return; }
        if (game.inHub && game.map[`${px},${pyMid}`] === 'F') { startCamp(); return; }
        interact();
    });

    // ---- Top-right mini buttons ----------------------------------------
    const aiBtn = document.getElementById('t-ai');
    if (aiBtn) aiBtn.addEventListener('click', () => GeminiUI.start(game));
    const questBtn = document.getElementById('t-quest');
    if (questBtn) questBtn.addEventListener('click', () => { questLogVisible = !questLogVisible; });

    // Pause requires a long-press (~600 ms) so it can't trigger by accident.
    const pauseBtn  = document.getElementById('t-pause');
    const pauseWrap = document.querySelector('.t-pause-wrap');
    if (pauseBtn && pauseWrap) {
        let pauseTimer = null;
        const begin = (e) => {
            if (e && e.cancelable) e.preventDefault();
            if (pauseTimer) return;
            pauseWrap.classList.add('holding');
            pauseTimer = setTimeout(() => {
                paused = !paused;
                pauseTimer = null;
                pauseWrap.classList.remove('holding');
            }, 600);
        };
        const cancel = (e) => {
            if (e && e.cancelable) e.preventDefault();
            if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null; }
            pauseWrap.classList.remove('holding');
        };
        pauseBtn.addEventListener('pointerdown', begin);
        pauseBtn.addEventListener('pointerup', cancel);
        pauseBtn.addEventListener('pointercancel', cancel);
        pauseBtn.addEventListener('pointerleave', cancel);
        pauseBtn.addEventListener('touchstart', begin, { passive: false });
        pauseBtn.addEventListener('touchend', cancel, { passive: false });
    }

    // Combo HUD is managed by the 3-hit combo ATK block above (syncComboHud).

    // ---- First-visit tutorial (mobile only) ----------------------------
    {
        const tutEl  = document.getElementById('touch-tutorial');
        const dismiss = document.getElementById('tutorial-dismiss');
        if (tutEl && window.matchMedia('(pointer: coarse)').matches && !localStorage.getItem('tut_seen_v2')) {
            tutEl.style.display = 'flex';
            if (dismiss) dismiss.addEventListener('click', () => {
                tutEl.style.display = 'none';
                localStorage.setItem('tut_seen_v2', '1');
            }, { once: true });
        }
    }

    // iOS requires a user gesture to start audio. Resume on first interaction.
    const unlockAudio = () => {
        try { Audio.playStep(); } catch (e) { /* no-op */ }
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('pointerdown', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    // Prevent two-finger zoom / double-tap zoom on the canvas.
    const canvasEl = document.getElementById('game-canvas');
    canvasEl.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    canvasEl.addEventListener('gesturestart', e => e.preventDefault());

    document.getElementById('victory-restart-btn').onclick = () => location.reload();
    document.getElementById('game-over-continue-btn').onclick = () => {
        // Record fallen heir into lineage
        lineage.push({
            name: document.getElementById('player-name').textContent,
            className: game.player.classObj ? game.player.classObj.name : '???',
            traitName: game.player.trait ? game.player.trait.name : 'Standard Issue',
            depth: game.player.depthReached || game.depth,
            kills: game.player.kills || 0,
            scrap: game.player.scrapEarned || 0
        });
        // Persist before heir selection so the run is durable even if browser closes mid-pick.
        saveGame();
        const heirs = generateHeirs();
        UI.showHeirSelection(heirs, (selectedHeir) => {
            applyHeir(selectedHeir);
            startCamp();
        });
    };
}

function applyHeir(heir) {
    game.player.trait = heir.trait;
    game.player.traits = heir.traits || [heir.trait];
    game.player.classObj = heir.classObj || null;
    document.getElementById('player-name').textContent = heir.name;
}

// Ensure setupControls is called once on load, even though initGame does startCamp
setupControls();
