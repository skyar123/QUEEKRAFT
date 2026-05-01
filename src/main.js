import { UI, DialogueUI } from './ui.js';
import { generateMap } from './map.js';
import { attackEnemy, takeDamage, tickStatus, applyStatus, isFrozen } from './combat.js';
import { HEALING_ITEMS, TREASURES, HISTORICAL_FIGURES } from './data.js';
import { Audio } from './audio.js';

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
        seenFigures: {}
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
}
loadGame();

const PALETTES = [
    { id: 'trans-blue', name: '🏳️‍⚧️ Trans Blue', body: '#5BCEFA', accent: '#F5A9B8', glow: '#5BCEFA' },
    { id: 'trans-pink', name: '🏳️‍⚧️ Trans Pink', body: '#F5A9B8', accent: '#5BCEFA', glow: '#F5A9B8' },
    { id: 'rainbow', name: '🏳️‍🌈 Rainbow Pride', body: null, accent: null, glow: '#FF71CE',
        colors: ['#E40303','#FF8C00','#FFED00','#008026','#24408E','#732982','#FFFFFF','#FFAFC8','#74D7EE','#613915','#000000'] }
];

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
// Drop a file at the listed path and it picks up automatically.
const ASSET_PATHS = {
    tex_floor: '/images/tex_floor.png',
    tex_wall:  '/images/tex_wall.png',
    player:    '/images/spr_player.png',
    enemy:     '/images/spr_enemy.png',
    boss:      '/images/spr_enemy.png',  // 1024x1024 transparent demon — boss only
    chest:     '/images/spr_chest.png',  // transparent neon chest — treasure / gender-reveal
    marsha:    '/images/spr_marsha.png'  // transparent Marsha — historical NPC
};

const images = {};
for (const k of Object.keys(ASSET_PATHS)) images[k] = new Image();

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
    images[k].onload  = tickLoaded;
    images[k].onerror = () => { console.warn(`Asset failed: ${path}`); tickLoaded(); };
    images[k].src = path;
}
// Failsafe — if asset loading hangs, start without textures after 5s.
setTimeout(() => { if (!initStarted) { initStarted = true; initGame(); } }, 5000);

// True when an image finished loading and is safe to drawImage().
function imgReady(img) { return img && img.complete && img.naturalWidth > 0; }

let patterns = {};
function initGame() {
    canvas.width = game.camera.width * T;
    canvas.height = game.camera.height * T;
    
    if (imgReady(images.tex_floor)) patterns.floor = ctx.createPattern(images.tex_floor, 'repeat');
    if (imgReady(images.tex_wall)) patterns.wall = ctx.createPattern(images.tex_wall, 'repeat');
    
    // Start by showing the camp screen for the very first run, or directly start
    startCamp();
}

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

function updateParticles() {
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx * 0.1;
        p.y += p.vy * 0.1;
        p.vy += 0.4; // gravity
        p.life -= 0.04;
        if (p.life <= 0) game.particles.splice(i, 1);
    }
}

function startCamp() {
    UI.showCamp(
        game,
        () => { startDungeon(); },
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
        lineage
    );
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
    generateMap(game);
    game.player.x = game.spawnX || 5;
    game.player.y = game.spawnY || 5;
    game.camInitialized = false;
    UI.updateStatus(game);
    
    // Fade out
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 600);
}

function startDungeon() {
    // Reset transient dungeon state but apply persistent upgrades
    const p = game.player;
    p.alive = true;
    let maxHp = 3 + game.persistent.healthUpgrades;
    if (p.traits && p.traits.some(t => t.id === 'gigantism')) maxHp += 1;
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
    p.kills = 0; p.scrapEarned = 0; p.depthReached = 1;

    game.depth = 1;
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
    return tile === '.' || tile === '>' || tile === '=' || tile === '^' || tile === 'C';
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

        if (troll.enemyType === 'gatekeeper') {
            // Gatekeepers don't move but DO attack if adjacent
            const dist = Math.abs(px - troll.x) + Math.abs(py - troll.y);
            if (dist === 1) takeDamage(game, 2);
            return;
        }

        const dist = Math.abs(px - troll.x) + Math.abs(py - troll.y);
        let alertRadius = troll.alertRadius;
        if (game.player.trait && game.player.trait.id === 'clocked') alertRadius += 3;
        if (game.player.trait && game.player.trait.id === 'stealth') alertRadius = 1;

        const stepToward = () => {
            const tdx = px > troll.x ? 1 : px < troll.x ? -1 : 0;
            const tdy = py > troll.y ? 1 : py < troll.y ? -1 : 0;
            if (isPassable(troll.x + tdx, troll.y + tdy) && !game.trolls.find(t => t !== troll && t.x === troll.x + tdx && t.y === troll.y + tdy)) {
                troll.x += tdx; troll.y += tdy;
            } else if (isPassable(troll.x + tdx, troll.y) && !game.trolls.find(t => t !== troll && t.x === troll.x + tdx && t.y === troll.y)) {
                troll.x += tdx;
            } else if (isPassable(troll.x, troll.y + tdy) && !game.trolls.find(t => t !== troll && t.x === troll.x && t.y === troll.y + tdy)) {
                troll.y += tdy;
            }
        };

        // CONCERN TROLL: drains HP when adjacent, moves slowly toward player
        if (troll.enemyType === 'concern') {
            if (dist === 1) {
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
            if (dist === 1) { takeDamage(game, contactDmg); return; }
            if (troll.health < troll.maxHealth / 2 && Math.random() < spawnChance && game.trolls.length < spawnCap) {
                const tdx = (Math.random() < 0.5 ? -1 : 1);
                const tdy = (Math.random() < 0.5 ? -1 : 1);
                if (isPassable(troll.x + tdx, troll.y + tdy)) {
                    game.trolls.push({ x: troll.x+tdx, y: troll.y+tdy, enemyType: 'wraith',
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
            if (dist === 1) { takeDamage(game, 1); return; }
            if (dist <= alertRadius && Math.random() < 0.6) {
                for (let i = 0; i < 5; i++) game.particles.push({x: troll.x, y: troll.y, vx: 0, vy: -0.4, life: 1, color: '#39FF14'});
                stepToward();
            }
            return;
        }

        // POLICE: fast, aggressive, 2 damage
        if (troll.enemyType === 'police') {
            if (dist === 1) { takeDamage(game, 2); return; }
            if (dist <= alertRadius) stepToward();
            return;
        }

        // SWARM (new): tiny, fast, 1 dmg, can stack
        if (troll.enemyType === 'swarm') {
            if (dist === 1) { takeDamage(game, 1); return; }
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
            if (dist === 1) { takeDamage(game, 1); return; }
            if (dist <= alertRadius) stepToward();
            return;
        }

        // DEFAULT TROLL: chase forever once alerted, 1 damage on contact
        if (dist === 1) { takeDamage(game, 1); return; }
        if (dist <= alertRadius) {
            troll.chasingTurns = 99;
            stepToward();
            return;
        }

        // Idle wander
        if (Math.random() < 0.4) {
            const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
            const [rx, ry] = dirs[Math.floor(Math.random() * dirs.length)];
            if (isPassable(troll.x + rx, troll.y + ry) && !game.trolls.find(t => t.x === troll.x + rx && t.y === troll.y + ry)) {
                troll.x += rx;
                troll.y += ry;
            }
        }
    });

    // Body-check: if any troll occupies the player's tile
    const caught = game.trolls.find(t => t.x === px && t.y === py);
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

    const npc = game.npcs.find(n => entityNear(n));
    if (npc) {
        if (!game.persistent.seenFigures[npc.figureKey]) {
            game.persistent.seenFigures[npc.figureKey] = true;
            game.historicalFigures++;
        }
        DialogueUI.start(game, npc.figureKey);
        game.npcs = game.npcs.filter(n => n !== npc);
        UI.updateStatus(game);
        draw();
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
        } else if (item.type === 'healing') {
            const healing = HEALING_ITEMS[item.healingKey];
            let healAmount = healing.healing;
            if (game.player.trait && game.player.trait.id === 't4t') healAmount *= 2; // T4T healing buff
            
            game.player.health = Math.min(game.player.maxHealth, game.player.health + healAmount);
            UI.addMessage(`Used ${item.name}. Healed ${healAmount} HP.`, "healing");
            Audio.playLoot();
        } else if (item.type === 'treasure') {
            game.treasures++;
            game.persistent.treasures++;
            game.player.scrapEarned = (game.player.scrapEarned || 0) + 1;
            UI.addMessage(`Picked up ${item.name}!`, 'treasure');
            Audio.playLoot();
        } else if (item.type === 'gender-reveal') {
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
        UI.addMessage(`You see a historical figure. Press USE/F to speak.`);
        lastPromptTile = key;
    } else if (game.map[key] === '>') {
        UI.addMessage(`Stairs down. Press USE/F to descend.`);
        lastPromptTile = key;
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
const GRAVITY = 0.48; // Lighter gravity for better air control
const TERMINAL_VY = 12;
const JUMP_SPEED = -11.5; // Stronger jump
const COYOTE_FRAMES = 8;
const JUMP_BUFFER_FRAMES = 8;
const DASH_FRAMES = 8;
const DASH_COOLDOWN = 30;
const DASH_SPEED = 0.55;

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

function moveX(dx) {
    if (dx === 0) return;
    const p = game.player;
    const target = p.x + dx;
    const lead = dx > 0 ? target + PLAYER_W : target;
    // Horizontal motion only blocks on solid walls — you can walk past a
    // one-way platform's edge column horizontally.
    if (pointSolid(lead, p.y) ||
        pointSolid(lead, p.y + PLAYER_H * 0.5) ||
        pointSolid(lead, p.y + PLAYER_H - 0.001)) {
        if (dx > 0) p.x = Math.floor(lead) - PLAYER_W - 0.0001;
        else p.x = Math.floor(lead) + 1;
        p.vx = 0;
    } else {
        p.x = target;
    }
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

    const p = game.player;

    // Decrement timers
    if (p.coyoteTimer > 0) p.coyoteTimer--;
    if (p.jumpBuffer > 0) p.jumpBuffer--;
    if (p.dashTimer > 0) p.dashTimer--;
    if (p.dashCooldown > 0) p.dashCooldown--;
    if (p.powerCooldown > 0) p.powerCooldown--;
    if (p.powerActive > 0) p.powerActive--;
    if (p.dropThrough > 0) p.dropThrough--;

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
        p.jumpsLeft = (p.traits && p.traits.some(t => t.id === 'nostalgia')) ? 2 : 1;
        if (!wasGrounded && p.vy >= 1.5) {
            Audio.playStep();
            spawnDust(p.x + PLAYER_W / 2, p.y + PLAYER_H, 4, '#FFFFFF');
        }
    }

    // Combat logic
    if (game.attackAnim) {
        const anim = game.attackAnim;
        for (const troll of game.trolls) {
            const dist = Math.abs(troll.x - anim.x) + Math.abs(troll.y - anim.y);
            if (dist < 1.0 && anim.life > 6 && anim.life < 12) {
                troll.health -= game.player.baseDamage;
                troll.vx += anim.dx * 12; // Knockback
                troll.vy -= 4;
                game.hitStop = 8;
                game.screenShake = 0.8;
                UI.shakeScreen();
                Audio.playHit && Audio.playHit();
                spawnParticle(troll.x, troll.y, '#FF0040', 8);
                if (troll.health <= 0) {
                    game.trolls = game.trolls.filter(t => t !== troll);
                    game.player.kills++;
                }
            }
        }
    }

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
    if (p.dashTimer <= 0) p.vx *= p.onIceTile ? 0.97 : 0.78;
    if (Math.abs(p.vx) < 0.05) p.vx = 0;

    // Status effect ticking (DOTs, freeze duration, etc.)
    tickStatus(game);

    // Enemy AI / cooldown tick (turn-style every ~10 frames)
    if (game.animFrame % 10 === 0) {
        processTurn();
    }
}

function draw() {
    ctx.fillStyle = '#050505';
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
            ctx.globalAlpha = r.isVisible ? 0.7 : 0.2;
            if (r.tile === '#') {
                const glow = r.isVisible ? 'rgba(255,113,206,0.3)' : null;
                drawTile(ctx, sx, sy, '#0a0a0a', true, glow, patterns.wall);
            } else if (r.tile === '~') {
                // Ice — pale blue floor tile with a glossy highlight.
                drawTile(ctx, sx, sy, '#1a3a4a', true, r.isVisible ? 'rgba(91,206,250,0.45)' : null, null);
                if (r.isVisible) {
                    ctx.globalAlpha = 0.55;
                    ctx.fillStyle = '#5BCEFA';
                    ctx.fillRect(sx + 1, sy + 1, T - 2, 6);
                    ctx.globalAlpha = 0.85;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(sx + 4, sy + 2, T - 14, 2);
                }
            } else if (r.tile === 'T') {
                // Trampoline — pink/yellow pad with a glowing top stripe.
                drawTile(ctx, sx, sy, '#1a0a14', true, null, null);
                if (r.isVisible) {
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = '#FF71CE';
                    ctx.fillRect(sx + 2, sy + 4, T - 4, T - 12);
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(sx + 2, sy + 4, T - 4, 3);
                    // Springs
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 1;
                    for (let s = 0; s < 3; s++) {
                        ctx.beginPath();
                        ctx.moveTo(sx + 6 + s * 8, sy + T - 8);
                        ctx.lineTo(sx + 6 + s * 8, sy + T - 2);
                        ctx.stroke();
                    }
                }
            } else {
                const floorColor = r.isVisible ? '#0a0a0a' : '#030303';
                const glowColor = r.isVisible ? 'rgba(1,205,254,0.3)' : null;
                drawTile(ctx, sx, sy, floorColor, false, glowColor, r.isVisible ? patterns.floor : null);
                if (r.tile === '>') {
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
                        ctx.drawImage(images.chest, drawX - 18, drawY - 28 + pulse, 36, 28);
                    } else {
                        ctx.fillStyle = flick;
                        ctx.beginPath(); ctx.arc(drawX, drawY - 8 + pulse, 8, 0, Math.PI*2); ctx.fill();
                    }
                } else if (r.entity.type === 'zine') {
                    ctx.fillStyle = '#FFFFFF';
                    const bob = Math.sin(game.animFrame * 0.3) * 2;
                    ctx.fillRect(drawX - 6, drawY - 14 + bob, 12, 14);
                    ctx.fillStyle = '#FF71CE';
                    ctx.fillRect(drawX - 4, drawY - 12 + bob, 8, 2);
                    ctx.fillRect(drawX - 4, drawY - 8 + bob, 8, 2);
                } else if (r.entity.type === 'healing') {
                    const bob = Math.sin(game.animFrame * 0.4) * 2;
                    ctx.fillStyle = '#39FF14';
                    // Draw a cross/plus
                    ctx.fillRect(drawX - 2, drawY - 12 + bob, 4, 10);
                    ctx.fillRect(drawX - 5, drawY - 8 + bob, 10, 4);
                } else {
                    const bob = Math.sin(game.animFrame * 0.3) * 1;
                    if (imgReady(images.chest)) {
                        ctx.drawImage(images.chest, drawX - 12, drawY - 20 + bob, 24, 20);
                    } else {
                        ctx.fillStyle = '#FFD700';
                        ctx.fillRect(drawX - 8, drawY - 10 + bob, 16, 10);
                        ctx.fillStyle = '#FF71CE';
                        ctx.fillRect(drawX - 1, drawY - 8 + bob, 2, 6);
                    }
                }
            } else if (r.type === 'npc') {
                const bob = Math.sin(game.animFrame * 0.3) * 2;
                if (imgReady(images.marsha)) {
                    const sw = 44, h = 56;
                    ctx.drawImage(images.marsha, drawX - sw/2, drawY - h + bob, sw, h);
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 14px VT323';
                    ctx.textAlign = 'center';
                    ctx.fillText('!', drawX, drawY - h - 4 + bob);
                    ctx.textAlign = 'left';
                } else {
                    ctx.fillStyle = '#B967DB';
                    ctx.beginPath();
                    ctx.roundRect(drawX - 8, drawY - 28 + bob, 16, 20, 4);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(drawX, drawY - 32 + bob, 7, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = '#FF71CE';
                    for (let f = 0; f < 5; f++) {
                        const fa = (f / 5) * Math.PI;
                        ctx.beginPath();
                        ctx.arc(drawX + Math.cos(fa) * 6, drawY - 38 + bob + Math.sin(fa) * -2, 2, 0, Math.PI*2);
                        ctx.fill();
                    }
                }
            } else if (r.type === 'troll') {
                const bob = Math.sin(game.animFrame * 0.4 + r.x) * 2;
                const et = r.entity.enemyType || 'troll';
                let size = 20, h = 24;
                
                if (imgReady(images.enemy)) {
                    ctx.drawImage(images.enemy, drawX - size, drawY - h + bob, size * 2, h);
                } else {
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
                        ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px VT323';
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
                        size = 64; h = 72;
                        const enraged = r.entity.bossPhase === 2;
                        if (imgReady(images.boss)) {
                            ctx.drawImage(images.boss, drawX - size/2, drawY - h + bob, size, h);
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
                
                // Health Bar for all enemies
                const barW = Math.max(size, 20);
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#333';
                ctx.fillRect(drawX - barW/2, drawY - h - 10 + bob, barW, 4);
                ctx.fillStyle = '#FF71CE';
                ctx.fillRect(drawX - barW/2, drawY - h - 10 + bob, barW * (r.entity.health / r.entity.maxHealth), 4);

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
                    // DRAW PLAYER
                    if (imgReady(images.player)) {
                        const bob = Math.sin(game.animFrame * 0.1) * 3;
                        ctx.save();
                        ctx.translate(drawX, drawY - 20 + bob);
                        if (r.entity.facingX < 0) ctx.scale(-1, 1);
                        ctx.drawImage(images.player, -24, -40, 48, 48);
                        ctx.restore();
                    } else {
                        const bob = Math.sin(game.animFrame * 0.4) * 2;
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
                    }
                }
            }
            ctx.shadowBlur = 0;
        }
    });

    // Draw Particles
    for (const p of game.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect((p.x + game.camX/T) * T, (p.y + game.camY/T) * T, p.size, p.size);
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

            // Platformer: direct screen-space angle from facing direction
            const facingAngle = Math.atan2(anim.dy, anim.dx);

            const HALF_SWEEP = Math.PI * 0.72;
            const startAngle = facingAngle - HALF_SWEEP;
            const endAngle   = facingAngle + HALF_SWEEP;
            const swingProgress = (8 - anim.life) / 8;
            const weaponAngle = startAngle + swingProgress * (endAngle - startAngle);

            const RADIUS = anim.weaponType === 'sword' ? 46 : 36;
            const isSword = anim.weaponType === 'sword';
            const glowColor = isSword ? '#01CDFE' : '#FF71CE';

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

    // Quest log overlay (J to toggle) — Cendric-style objective tracker.
    if (questLogVisible) {
        const w = 320, h = 220;
        const x0 = canvas.width / 2 - w / 2;
        const y0 = canvas.height / 2 - h / 2;
        ctx.fillStyle = 'rgba(5,5,12,0.92)';
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
        const line = (label, color) => { ctx.fillStyle = color; ctx.fillText(label, x0 + 16, yy); yy += 20; };
        line('▸ Recover the lost zines:', '#FFFFFF');
        const zRatio = seenZ / 19;
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x0 + 30, yy - 12, 240, 8);
        ctx.fillStyle = '#FF71CE'; ctx.fillRect(x0 + 30, yy - 12, 240 * zRatio, 8);
        ctx.fillStyle = '#FFFFFF'; ctx.font = '12px VT323'; ctx.fillText(`${seenZ} / 19`, x0 + 280, yy - 4);
        yy += 12;

        ctx.font = '14px VT323';
        line('▸ Meet the historical figures:', '#FFFFFF');
        const fRatio = seenF / 9;
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x0 + 30, yy - 12, 240, 8);
        ctx.fillStyle = '#01CDFE'; ctx.fillRect(x0 + 30, yy - 12, 240 * fRatio, 8);
        ctx.fillStyle = '#FFFFFF'; ctx.font = '12px VT323'; ctx.fillText(`${seenF} / 9`, x0 + 280, yy - 4);
        yy += 16;

        ctx.font = '14px VT323';
        line(`▸ Current depth: ${game.depth}  ·  Max reached: ${game.player.depthReached || game.depth}`, '#FFD700');
        line(`▸ Scrap banked: ${game.persistent.treasures}`, '#39FF14');
        line(`▸ Lineage size: ${lineage.length}`, '#B967DB');

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
    } else if (cls === 'aidworker') {
        p.powerType = 'aura'; p.powerActive = 480;
        UI.addMessage("SOLIDARITY AURA — community heals.", "healing");
    }
}

function setupControls() {
    const keys = {};
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

        if (UI.modals.zine.style.display === 'flex' || UI.modals.conversation.style.display === 'flex') return;
        if (paused) return;

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

        if (e.code === 'KeyQ') {
            attackEnemy(game, game.player.facingX, 0, 'quick');
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

    // Wrap update for held-key horizontal movement
    const originalUpdate = update;
    update = (dt) => {
        const p = game.player;
        let speed = 4;
        if (p.trait && p.trait.id === 'adhd') speed = 5;
        if (p.traits && p.traits.some(t => t.id === 'chronic')) speed = Math.min(speed, 3);

        if (p.dashTimer <= 0) {
            if (keys['ArrowLeft'] || keys['KeyA']) {
                p.vx = -speed;
                p.facingX = -1;
            } else if (keys['ArrowRight'] || keys['KeyD']) {
                p.vx = speed;
                p.facingX = 1;
            }
        }
        originalUpdate(dt);
    };

    // On-screen / touch controls — held-state via pointer events so a finger
    // resting on Left actually keeps walking left, not just one tap of motion.
    function bindHold(id, onPress, onRelease) {
        const el = document.getElementById(id);
        if (!el) return;
        const press = (e) => {
            e.preventDefault();
            el.classList.add('pressed');
            onPress && onPress();
        };
        const release = (e) => {
            e && e.preventDefault && e.preventDefault();
            el.classList.remove('pressed');
            onRelease && onRelease();
        };
        // Pointer events handle touch + mouse + pen uniformly on iOS Safari ≥13.
        el.addEventListener('pointerdown', press);
        el.addEventListener('pointerup', release);
        el.addEventListener('pointercancel', release);
        el.addEventListener('pointerleave', release);
        // Belt-and-suspenders for older iOS that fire touch but not pointer.
        el.addEventListener('touchstart', press, { passive: false });
        el.addEventListener('touchend', release, { passive: false });
    }

    // Held-state flags drive the wrapped update loop.
    const touchHeld = { left: false, right: false };
    bindHold('left',  () => { touchHeld.left = true;  game.player.facingX = -1; },
                      () => { touchHeld.left = false; });
    bindHold('right', () => { touchHeld.right = true; game.player.facingX = 1; },
                      () => { touchHeld.right = false; });
    bindHold('up', () => {
        if ((touchHeld.down || keys['ArrowDown'] || keys['KeyS']) && game.player.onGround) {
            game.player.dropThrough = 8;
            game.player.onGround = false;
            game.player.vy = 1.5;
        } else if (!tryJump()) {
            game.player.jumpBuffer = JUMP_BUFFER_FRAMES;
        }
    }, () => {
        // Variable jump on touch release too.
        if (game.player.vy < -3.5) game.player.vy *= 0.45;
    });
    bindHold('down', () => { touchHeld.down = true; tryDash(); }, () => { touchHeld.down = false; });

    // Action buttons.
    bindHold('interact', interact);
    bindHold('quick-attack', () => attackEnemy(game, game.player.facingX || 1, 0, 'quick'));
    // Power attack: hold to charge, release to fire (mirrors keyboard E).
    bindHold('power-attack',
        () => { game.player.chargeAttack = 1; game.player.chargeReady = false; },
        () => {
            if (game.player.chargeAttack <= 0) return;
            const charged = game.player.chargeAttack >= 60;
            const overcharge = game.player.chargeAttack >= 110;
            const fx = game.player.facingX || 1;
            if (overcharge) {
                UI.addMessage("OVERCHARGED STRIKE! 🔥", 'special');
                game.screenShake = Math.max(game.screenShake, 0.8);
                attackEnemy(game, fx, 0, 'power');
                attackEnemy(game, fx, -1, 'power');
                attackEnemy(game, fx, 1, 'power');
            } else if (charged) {
                attackEnemy(game, fx, 0, 'power');
            } else {
                attackEnemy(game, fx, 0, 'quick');
            }
            game.player.chargeAttack = 0;
            game.player.chargeReady = false;
        });
    bindHold('class-power', activateClassPower);

    // Top-row UI buttons.
    bindHold('pause-btn', () => { paused = !paused; });
    bindHold('quest-btn', () => { questLogVisible = !questLogVisible; });

    // Hook touch held-state into the per-frame velocity assignment.
    const updateRefForTouch = () => {
        const p = game.player;
        if (p.dashTimer > 0) return;
        let speed = 4;
        if (p.trait && p.trait.id === 'adhd') speed = 5;
        if (p.traits && p.traits.some(t => t.id === 'chronic')) speed = Math.min(speed, 3);
        if (touchHeld.left)  { p.vx = -speed; p.facingX = -1; }
        if (touchHeld.right) { p.vx =  speed; p.facingX =  1; }
    };
    const prevUpdate = update;
    update = (dt) => { updateRefForTouch(); prevUpdate(dt); };

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
