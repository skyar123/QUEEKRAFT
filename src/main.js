import { UI, DialogueUI } from './ui.js';
import { generateMap } from './map.js';
import { attackEnemy, takeDamage } from './combat.js';
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
        // Class power state
        powerCooldown: 0,
        powerActive: 0,         // active duration of current power
        powerType: null,        // 'rage' | 'slow' | 'aura' | 'bump' | 'bomb' | null
        // Lineage stat tracking
        kills: 0, depthReached: 1, scrapEarned: 0
    },
    depth: 1,
    zines: 0,
    treasures: 0,
    historicalFigures: 0,
    map: {},
    items: [],
    npcs: [],
    trolls: [],
    seen: {},
    mapWidth: 40,
    mapHeight: 30,
    turnCounter: 0,
    camera: { width: 24, height: 18 },
    particles: [],
    floatingText: [],
    attackAnim: null,
    animFrame: 0
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

// Image assets
const images = {
    player: new Image(),
    enemy: new Image(),
    zine: new Image(),
    wall: new Image(),
    floor: new Image(),
    npc: new Image(),
    item: new Image(),
    tex_floor: new Image(),
    tex_wall: new Image()
};

images.player.src = '/images/player.png';
images.enemy.src = '/images/enemy.png';
images.zine.src = '/images/zine.png';
images.wall.src = '/images/wall.png';
images.floor.src = '/images/floor.png';
images.npc.src = '/images/npc.png';
images.item.src = '/images/item.png';
images.tex_floor.src = '/images/tex_floor.png';
images.tex_wall.src = '/images/tex_wall.png';

// New generated sprites
const sprites = {
    player: new Image(),
    marsha: new Image(),
    enemy: new Image(),
    chest: new Image()
};
sprites.player.src = '/images/spr_player.png';
sprites.marsha.src = '/images/spr_marsha.png';
sprites.enemy.src = '/images/spr_enemy.png';
sprites.chest.src = '/images/spr_chest.png';

let imagesLoaded = 0;
const totalImages = Object.keys(images).length;
Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            initGame();
        }
    };
});

let patterns = {};
function initGame() {
    canvas.width = game.camera.width * T;
    canvas.height = game.camera.height * T;
    
    patterns.floor = ctx.createPattern(images.tex_floor, 'repeat');
    patterns.wall = ctx.createPattern(images.tex_wall, 'repeat');
    
    // Start by showing the camp screen for the very first run, or directly start
    startCamp();
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
                return true;
            }
            return false;
        },
        lineage
    );
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

    generateMap(game);
    updateFOV();
    UI.updateStatus(game);
    UI.addMessage("🏳️‍⚧️ You enter the wasteland!", "special");
    if (p.classObj) UI.addMessage(`Class: ${p.classObj.name}. Press R for ${p.classObj.power}.`, "special");
    draw();
}

function updateFOV() {
    let fovRadius = 6;
    if (game.player.trait && game.player.trait.id === 'dysphoria') fovRadius = 3;
    if (game.player.traits && game.player.traits.some(t => t.id === 'autism')) fovRadius += 1;

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
    return tile === '.' || tile === '>';
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
        troll.moveDelay++;
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

        // BOSS: always aggressive, spawns minions
        if (troll.enemyType === 'boss') {
            if (dist === 1) { takeDamage(game, 2); return; }
            if (troll.health < troll.maxHealth / 2 && Math.random() < 0.25 && game.trolls.length < 12) {
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
        game.depth++;
        game.player.depthReached = Math.max(game.player.depthReached, game.depth);
        UI.addMessage(`Descending to level ${game.depth}...`);
        Audio.playStairs && Audio.playStairs();
        generateMap(game);
        // place player at the spawn (room 0 already set by generateMap)
        updateFOV();
        draw();
        return;
    }

    const npc = game.npcs.find(n => entityNear(n));
    if (npc) {
        if (!game.seen[npc.figureKey]) {
            game.historicalFigures++;
            game.seen[npc.figureKey] = true;
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
            UI.addMessage(`Picked up ${item.name}!`, "treasure");
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
    if (glowColor) { ctx.shadowBlur = 6; ctx.shadowColor = glowColor; }
    ctx.fillRect(sx, sy, T, T);
    ctx.shadowBlur = 0;
    if (isWall) {
        ctx.strokeStyle = glowColor || '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 0.5, sy + 0.5, T - 1, T - 1);
    }
}

// Animation & Physics loop
let lastTime = 0;
function gameLoop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// === Platformer physics constants ===
const PLAYER_W = 0.7;
const PLAYER_H = 0.9;
const GRAVITY = 0.55;
const TERMINAL_VY = 14;
const JUMP_SPEED = -10.5;
const COYOTE_FRAMES = 6;
const JUMP_BUFFER_FRAMES = 6;
const DASH_FRAMES = 8;
const DASH_COOLDOWN = 30;
const DASH_SPEED = 0.55;

function pointSolid(px, py) {
    return !isPassable(Math.floor(px), Math.floor(py));
}

function moveX(dx) {
    if (dx === 0) return;
    const p = game.player;
    const target = p.x + dx;
    const lead = dx > 0 ? target + PLAYER_W : target;
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
    const target = p.y + dy;
    if (dy > 0) {
        const feet = target + PLAYER_H;
        if (pointSolid(p.x + 0.05, feet) ||
            pointSolid(p.x + PLAYER_W - 0.05, feet) ||
            pointSolid(p.x + PLAYER_W * 0.5, feet)) {
            p.y = Math.floor(feet) - PLAYER_H - 0.0001;
            p.vy = 0;
            if (!p.onGround) Audio.playStep && Audio.playStep();
            p.onGround = true;
            p.coyoteTimer = (p.trait && p.trait.id === 'insomnia') ? COYOTE_FRAMES * 2 : COYOTE_FRAMES;
            p.jumpsLeft = (p.traits && p.traits.some(t => t.id === 'nostalgia')) ? 2 : 1;
        } else {
            p.y = target;
        }
    } else {
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

function spawnDust(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        game.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -Math.random() * 0.3,
            life: 0.8, color
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

    // Resolve buffered jump
    if (p.jumpBuffer > 0 && (p.coyoteTimer > 0 || p.jumpsLeft > 0)) {
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

    // Gravity
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
        // Assume not grounded each frame; moveY will set true if floor hit
        if (s === 0) p.onGround = false;
        moveX(effectiveVx * 0.1 / STEPS);
        moveY(p.vy * 0.1 / STEPS);
    }

    // Friction (only when not dashing)
    if (p.dashTimer <= 0) p.vx *= 0.78;
    if (Math.abs(p.vx) < 0.05) p.vx = 0;

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
    if (isVertigo) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(game.player.vx * 0.012);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Smooth camera following the float position
    const camX = Math.floor(canvas.width / 2 - game.player.x * T - T / 2);
    const camY = Math.floor(canvas.height / 2 - game.player.y * T - T / 2);

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
            } else {
                const floorColor = r.isVisible ? '#0a0a0a' : '#030303';
                const glowColor = r.isVisible ? 'rgba(1,205,254,0.15)' : null;
                drawTile(ctx, sx, sy, floorColor, false, glowColor, r.isVisible ? patterns.floor : null);
                if (r.tile === '>') {
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = '#01CDFE';
                    ctx.shadowBlur = 20; ctx.shadowColor = '#01CDFE';
                    ctx.beginPath(); ctx.arc(sx + T/2, sy + T/2, 8, 0, Math.PI*2); ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        } else {
            ctx.globalAlpha = 1.0;
            const drawX = sx + T / 2;
            const drawY = sy + T;
            
            ctx.shadowBlur = 20;
            
            if (r.type === 'item') {
                if (r.entity.type === 'gender-reveal') {
                    const pulse = Math.sin(game.animFrame * 0.5) * 3;
                    ctx.fillStyle = (game.animFrame % 4 < 2) ? '#FF71CE' : '#5BCEFA';
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.beginPath(); ctx.arc(drawX, drawY - 8 + pulse, 8, 0, Math.PI*2); ctx.fill();
                } else if (r.entity.type === 'zine') {
                    ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = '#FFFFFF';
                    const bob = Math.sin(game.animFrame * 0.3) * 2;
                    ctx.fillRect(drawX - 6, drawY - 14 + bob, 12, 14);
                    ctx.fillStyle = '#FF71CE';
                    ctx.fillRect(drawX - 4, drawY - 12 + bob, 8, 2);
                    ctx.fillRect(drawX - 4, drawY - 8 + bob, 8, 2);
                } else if (r.entity.type === 'healing') {
                    const bob = Math.sin(game.animFrame * 0.4) * 2;
                    ctx.fillStyle = '#39FF14'; ctx.shadowColor = '#39FF14';
                    // Draw a cross/plus
                    ctx.fillRect(drawX - 2, drawY - 12 + bob, 4, 10);
                    ctx.fillRect(drawX - 5, drawY - 8 + bob, 10, 4);
                } else {
                    const bob = Math.sin(game.animFrame * 0.3) * 1;
                    ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700';
                    // Mini chest shape
                    ctx.fillRect(drawX - 8, drawY - 10 + bob, 16, 10);
                    ctx.fillStyle = '#FF71CE';
                    ctx.fillRect(drawX - 1, drawY - 8 + bob, 2, 6);
                }
            } else if (r.type === 'npc') {
                // Animated NPC — glowing purple figure with bob
                const bob = Math.sin(game.animFrame * 0.3) * 2;
                ctx.fillStyle = '#B967DB'; ctx.shadowColor = '#B967DB';
                // Body
                ctx.beginPath();
                ctx.roundRect(drawX - 8, drawY - 28 + bob, 16, 20, 4);
                ctx.fill();
                // Head
                ctx.beginPath();
                ctx.arc(drawX, drawY - 32 + bob, 7, 0, Math.PI*2);
                ctx.fill();
                // Neon flower crown
                ctx.fillStyle = '#FF71CE'; ctx.shadowColor = '#FF71CE';
                for (let f = 0; f < 5; f++) {
                    const fa = (f / 5) * Math.PI;
                    ctx.beginPath();
                    ctx.arc(drawX + Math.cos(fa) * 6, drawY - 38 + bob + Math.sin(fa) * -2, 2, 0, Math.PI*2);
                    ctx.fill();
                }
            } else if (r.type === 'troll') {
                const bob = Math.sin(game.animFrame * 0.4 + r.x) * 2;
                const et = r.entity.enemyType || 'troll';
                let size = 20, h = 24;
                
                if (et === 'troll') {
                    ctx.fillStyle = '#FF0000'; ctx.shadowColor = '#FF0000';
                    ctx.fillRect(drawX - 10, drawY - h + bob, size, h);
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(drawX - 6, drawY - h + 4 + bob, 4, 4);
                    ctx.fillRect(drawX + 2, drawY - h + 4 + bob, 4, 4);
                } else if (et === 'wraith') {
                    // Ghostly triangle shape that flickers
                    ctx.globalAlpha = 0.6 + Math.sin(game.animFrame * 0.8) * 0.3;
                    ctx.fillStyle = '#39FF14'; ctx.shadowColor = '#39FF14';
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
                    ctx.fillStyle = '#FFB000'; ctx.shadowColor = '#FFB000';
                    ctx.fillRect(drawX - 14, drawY - h + bob, size, h);
                    // Shield
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(drawX - 16, drawY - 20 + bob, 6, 16);
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(drawX - 8, drawY - h + 6 + bob, 5, 5);
                    ctx.fillRect(drawX + 4, drawY - h + 6 + bob, 5, 5);
                } else if (et === 'concern') {
                    ctx.fillStyle = '#8A2BE2'; ctx.shadowColor = '#8A2BE2';
                    ctx.beginPath();
                    ctx.roundRect(drawX - 10, drawY - 24 + bob, 20, 24, 10);
                    ctx.fill();
                    // "?" on face
                    ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px VT323';
                    ctx.fillText('?', drawX - 4, drawY - 8 + bob);
                } else if (et === 'swarm') {
                    // Tiny scuttler — dark cloud with eyes
                    size = 14; h = 14;
                    ctx.fillStyle = '#330033'; ctx.shadowColor = '#FF00FF';
                    ctx.beginPath();
                    ctx.arc(drawX, drawY - 7 + bob, 7, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(drawX - 3, drawY - 8 + bob, 2, 2);
                    ctx.fillRect(drawX + 1, drawY - 8 + bob, 2, 2);
                } else if (et === 'bigot') {
                    // Hostile face on a megaphone-shaped torso
                    ctx.fillStyle = '#A52A2A'; ctx.shadowColor = '#FF4500';
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
                    ctx.fillStyle = '#0000FF'; ctx.shadowColor = '#0000FF';
                    ctx.fillRect(drawX - 10, drawY - 26 + bob, 20, 26);
                    // Badge
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath(); ctx.arc(drawX, drawY - 16 + bob, 4, 0, Math.PI*2); ctx.fill();
                    // Red eyes
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(drawX - 6, drawY - 24 + bob, 4, 3);
                    ctx.fillRect(drawX + 2, drawY - 24 + bob, 4, 3);
                } else if (et === 'boss') {
                    size = 40; h = 44;
                    const pulse = Math.sin(game.animFrame * 0.3) * 4;
                    ctx.fillStyle = '#FF00FF'; ctx.shadowColor = '#FF00FF';
                    ctx.shadowBlur = 20 + pulse;
                    ctx.fillRect(drawX - 20, drawY - h + bob, size, h);
                    // Horns
                    ctx.beginPath();
                    ctx.moveTo(drawX - 16, drawY - h + bob);
                    ctx.lineTo(drawX - 10, drawY - h - 12 + bob);
                    ctx.lineTo(drawX - 4, drawY - h + bob);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(drawX + 4, drawY - h + bob);
                    ctx.lineTo(drawX + 10, drawY - h - 12 + bob);
                    ctx.lineTo(drawX + 16, drawY - h + bob);
                    ctx.fill();
                    // Glowing eyes
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(drawX - 12, drawY - h + 10 + bob, 8, 6);
                    ctx.fillRect(drawX + 4, drawY - h + 10 + bob, 8, 6);
                }
                
                // Health Bar for all enemies
                const barW = Math.max(size, 20);
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#333';
                ctx.fillRect(drawX - barW/2, drawY - h - 10 + bob, barW, 4);
                ctx.fillStyle = '#FF71CE';
                ctx.fillRect(drawX - barW/2, drawY - h - 10 + bob, barW * (r.entity.health / r.entity.maxHealth), 4);
            } else if (r.type === 'player') {
                if (r.entity.hurtCooldown % 2 === 0) {
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
            ctx.shadowBlur = 0;
        }
    });

    // Draw Particles
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if (p.life <= 0) {
            game.particles.splice(i, 1);
            continue;
        }
        
        const px = p.x * T + camX + T/2;
        const py = p.y * T + camY + T/2;
        
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(px, py - 10, 3, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
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

        if (UI.modals.zine.style.display === 'flex' || UI.modals.conversation.style.display === 'flex') return;

        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            game.player.jumpBuffer = JUMP_BUFFER_FRAMES;
            tryJump();
        }

        if (e.code === 'KeyQ') {
            attackEnemy(game, game.player.facingX, 0, 'quick');
        } else if (e.code === 'KeyE') {
            attackEnemy(game, game.player.facingX, 0, 'power');
        } else if (e.code === 'KeyR') {
            activateClassPower();
        } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            tryDash();
        } else if (e.code === 'Enter' || e.code === 'KeyF') {
            interact();
        }
    });

    document.addEventListener('keyup', e => { keys[e.code] = false; });

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

    // On-screen controls
    document.getElementById('up').onclick = () => { game.player.jumpBuffer = JUMP_BUFFER_FRAMES; tryJump(); };
    document.getElementById('left').onclick = () => { game.player.vx = -4; game.player.facingX = -1; };
    document.getElementById('right').onclick = () => { game.player.vx = 4; game.player.facingX = 1; };
    document.getElementById('down').onclick = () => tryDash();
    document.getElementById('interact').onclick = interact;
    document.getElementById('quick-attack').onclick = () => attackEnemy(game, game.player.facingX, 0, 'quick');
    document.getElementById('power-attack').onclick = () => attackEnemy(game, game.player.facingX, 0, 'power');

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
