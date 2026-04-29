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
        trait: null,
        colorPalette: 0,
        onGround: false
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
    { id: 'none', name: 'Standard Issue', desc: 'Just a regular, completely normal trans person.' },
    { id: 'euphoria', name: 'Gender Euphoria', desc: 'Riding the high! Moves fast, attacks fast. 🏳️‍⚧️✨' },
    { id: 'dysphoria', name: 'Dysphoria Day', desc: 'Everything feels wrong. Fog of war is extremely tight.' },
    { id: 'clocked', name: 'Clocked', desc: 'You stand out. Enemies spot you from much further away.' },
    { id: 'stealth', name: 'Stealth Mode', desc: 'Passing privileges. Enemies only notice if you bump them.' },
    { id: 't4t', name: 'T4T', desc: 'We take care of our own. Healing items heal double.' },
    { id: 'gatekept', name: 'Gatekept', desc: 'The medical establishment hates you. Upgrades cost +2.' }
];

const CLASSES = ['Anarchist', 'Gender Terrorist', 'Library Archivist', 'Glitter Brawler', 'Hormone Dealer', 'Mutual Aid Worker'];
const NAMES = ['Ash', 'River', 'Rowan', 'Sage', 'Onyx', 'Quinn', 'Zephyr', 'Nova'];

const PALETTES = [
    { id: 'trans-blue', name: '🏳️‍⚧️ Trans Blue', body: '#5BCEFA', accent: '#F5A9B8', glow: '#5BCEFA' },
    { id: 'trans-pink', name: '🏳️‍⚧️ Trans Pink', body: '#F5A9B8', accent: '#5BCEFA', glow: '#F5A9B8' },
    { id: 'rainbow', name: '🏳️‍🌈 Rainbow Pride', body: null, accent: null, glow: '#FF71CE',
        colors: ['#E40303','#FF8C00','#FFED00','#008026','#24408E','#732982','#FFFFFF','#FFAFC8','#74D7EE','#613915','#000000'] }
];

function generateHeirs() {
    const heirs = [];
    for (let i = 0; i < 3; i++) {
        heirs.push({
            name: NAMES[Math.floor(Math.random() * NAMES.length)],
            className: CLASSES[Math.floor(Math.random() * CLASSES.length)],
            trait: TRAITS[Math.floor(Math.random() * TRAITS.length)]
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
        () => { startDungeon(); }, // On Enter Dungeon
        () => { // On Upgrade Health
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
        () => { // On Upgrade Damage
            const penalty = (game.player.trait && game.player.trait.id === 'gatekept') ? 2 : 0;
            const cost = game.persistent.damageCost + penalty;
            if (game.persistent.treasures >= cost) {
                game.persistent.treasures -= cost;
                game.persistent.damageUpgrades++;
                game.persistent.damageCost += 3;
                return true;
            }
            return false;
        }
    );
}

function startDungeon() {
    // Reset transient dungeon state but apply persistent upgrades
    game.player.alive = true;
    game.player.maxHealth = 3 + game.persistent.healthUpgrades;
    game.player.health = game.player.maxHealth;
    game.player.baseDamage = 1 + game.persistent.damageUpgrades;
    game.player.hasBrick = false;
    game.player.hasRage = false;
    game.player.hurtCooldown = 0;
    
    game.depth = 1;
    game.zines = Object.keys(game.persistent.seenZines).length; // Start with persistent zines
    game.historicalFigures = Object.keys(game.persistent.seenFigures).length;
    game.treasures = 0; // Current run treasures
    game.seen = {};
    
    generateMap(game);
    updateFOV();
    UI.updateStatus(game);
    UI.addMessage("🏳️‍⚧️ You enter the dungeon!", "special");
    draw();
}

// Player tile-space helpers (player.x/y are floats from physics)
function playerTileX() { return Math.round(game.player.x); }
function playerTileY() { return Math.round(game.player.y); }

function updateFOV() {
    let fovRadius = 6;
    if (game.player.trait && game.player.trait.id === 'dysphoria') fovRadius = 3;

    const px = playerTileX();
    const py = playerTileY();
    for (let dy = -fovRadius; dy <= fovRadius; dy++) {
        for (let dx = -fovRadius; dx <= fovRadius; dx++) {
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

// Solid surface (something an entity can stand on)
function isSolid(x, y) {
    if (x < 0 || y < 0 || x >= game.mapWidth || y >= game.mapHeight) return true;
    return game.map[`${x},${y}`] === '#';
}

// Move an enemy one tile toward target, respecting platformer rules.
// Enemies walk along surfaces and won't step into open air unless they fly.
function moveEnemy(troll, tdx, tdy, opts = {}) {
    const flying = opts.flying || troll.enemyType === 'wraith';
    const nx = troll.x + tdx;
    const ny = troll.y + tdy;
    if (!isPassable(nx, ny)) return false;
    if (game.trolls.find(t => t !== troll && t.x === nx && t.y === ny)) return false;
    if (!flying) {
        // Don't walk off cliffs unless we're already falling (needs ground below or directly below)
        if (!isSolid(nx, ny + 1)) {
            // Allow a little falling: if blocked horizontally, drop down
            if (tdy === 0 && isSolid(nx, ny + 2)) {
                // there's ground 1 tile below, OK to drop
            } else if (tdy === 0) {
                return false;
            }
        }
    }
    troll.x = nx;
    troll.y = ny;
    return true;
}

function processTurn() {
    if (game.player.attackCooldown > 0) game.player.attackCooldown--;
    if (game.player.hurtCooldown > 0) game.player.hurtCooldown--;

    const px = playerTileX();
    const py = playerTileY();

    game.trolls.forEach(troll => {
        troll.moveDelay++;
        if (troll.moveDelay < troll.maxMoveDelay) return;
        troll.moveDelay = 0;

        const dist = Math.abs(px - troll.x) + Math.abs(py - troll.y);

        if (troll.enemyType === 'gatekeeper') {
            if (dist <= 1) takeDamage(game, 2);
            return;
        }

        let alertRadius = troll.alertRadius;
        if (game.player.trait && game.player.trait.id === 'clocked') alertRadius += 3;
        if (game.player.trait && game.player.trait.id === 'stealth') alertRadius = 1;

        const tdx = px > troll.x ? 1 : px < troll.x ? -1 : 0;
        const tdy = py > troll.y ? 1 : py < troll.y ? -1 : 0;

        if (troll.enemyType === 'concern') {
            if (dist <= 1) {
                takeDamage(game, 1);
                UI.addMessage("Concern Troll whispers 'Are you SURE about this?'", 'death');
            } else if (dist <= alertRadius) {
                if (!moveEnemy(troll, tdx, 0)) moveEnemy(troll, 0, tdy);
            }
            return;
        }

        if (troll.enemyType === 'boss') {
            if (dist <= 1) { takeDamage(game, 2); return; }
            if (troll.health < troll.maxHealth / 2 && Math.random() < 0.25 && game.trolls.length < 12) {
                const sx = troll.x + (Math.random() < 0.5 ? -1 : 1);
                const sy = troll.y;
                if (isPassable(sx, sy)) {
                    game.trolls.push({
                        x: sx, y: sy, enemyType: 'wraith',
                        health: 1, maxHealth: 1,
                        patrolPath: [], patrolIndex: 0, direction: 1,
                        moveDelay: 0, maxMoveDelay: 1, alertRadius: 8, chasingTurns: 0
                    });
                    UI.addMessage("⚡ BOSS spawned a Wraith!", "death");
                }
            } else {
                if (!moveEnemy(troll, tdx, 0)) moveEnemy(troll, 0, tdy);
            }
            return;
        }

        if (troll.enemyType === 'wraith') {
            // Wraiths fly and teleport
            if (dist <= 1) { takeDamage(game, 1); return; }
            if (dist <= alertRadius && Math.random() < 0.6) {
                if (moveEnemy(troll, tdx, tdy, { flying: true })) {
                    for (let i = 0; i < 5; i++) {
                        game.particles.push({ x: troll.x, y: troll.y, vx: 0, vy: -0.4, life: 1, color: '#39FF14' });
                    }
                }
            }
            return;
        }

        if (troll.enemyType === 'police') {
            if (dist <= 1) { takeDamage(game, 2); return; }
            if (dist <= alertRadius) {
                if (!moveEnemy(troll, tdx, 0)) moveEnemy(troll, 0, tdy);
            }
            return;
        }

        // Default troll: chase if alerted
        if (dist <= 1) { takeDamage(game, 1); return; }
        if (dist <= alertRadius) {
            if (!moveEnemy(troll, tdx, 0)) moveEnemy(troll, 0, tdy);
            return;
        }

        // Idle wander
        if (Math.random() < 0.4) {
            const dir = Math.random() < 0.5 ? -1 : 1;
            moveEnemy(troll, dir, 0);
        }
    });

    // Body-collision damage when player overlaps an enemy tile
    const caught = game.trolls.find(t => t.x === px && t.y === py);
    if (caught) {
        let dmg = 1;
        if (caught.enemyType === 'police') dmg = 2;
        if (caught.enemyType === 'boss') dmg = 3;
        takeDamage(game, dmg);
    }

    checkPickups();
}

function interact() {
    if (!game.player.alive) return;

    const px = playerTileX();
    const py = playerTileY();

    if (game.map[`${px},${py}`] === '>') {
        game.depth++;
        UI.addMessage(`Descending to level ${game.depth}...`);
        Audio.playStairs();
        generateMap(game);
        updateFOV();
        draw();
        return;
    }

    // Match adjacency (within 1 tile in any direction) so the player doesn't
    // need to be perfectly snapped to a tile to interact.
    const near = (a, b) => Math.abs(a.x - px) <= 1 && Math.abs(a.y - py) <= 1;

    const npc = game.npcs.find(near);
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

    const item = game.items.find(near);
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
            game.persistent.treasures++; // Save permanently
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

// Throttle pickup hint messages so they don't spam every physics tick
let lastPickupHint = '';
function checkPickups() {
    const px = playerTileX();
    const py = playerTileY();
    const near = (a) => Math.abs(a.x - px) <= 1 && Math.abs(a.y - py) <= 1;

    const item = game.items.find(near);
    const npc = game.npcs.find(near);
    let hint = '';
    if (item) hint = `You see: ${item.name}. Press USE to interact.`;
    else if (npc) hint = `You see a historical figure. Press USE to speak.`;
    if (hint && hint !== lastPickupHint) {
        UI.addMessage(hint);
        lastPickupHint = hint;
    }
    if (!hint) lastPickupHint = '';
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

function update(dt) {
    game.animFrame++;

    if (!game.player.alive) return;

    const PLAYER_W = 0.8;

    // Gravity (only when airborne — keeps onGround stable, no jitter)
    if (!game.player.onGround) {
        game.player.vy = Math.min(game.player.vy + 0.6, 8);
    } else {
        game.player.vy = 0;
    }

    // Vertical movement
    const nextY = game.player.y + game.player.vy * 0.1;
    const checkBottom = Math.floor(nextY + PLAYER_W);
    const checkTop = Math.floor(nextY);
    const xL = Math.floor(game.player.x);
    const xR = Math.floor(game.player.x + PLAYER_W);

    if (game.player.vy >= 0) {
        // Falling: check tile under feet
        if (isPassable(xL, checkBottom) && isPassable(xR, checkBottom)) {
            game.player.y = nextY;
            game.player.onGround = false;
        } else {
            // Snap so feet rest on top of the wall
            game.player.y = checkBottom - PLAYER_W;
            game.player.vy = 0;
            game.player.onGround = true;
        }
    } else {
        // Jumping up: check tile above head
        if (isPassable(xL, checkTop) && isPassable(xR, checkTop)) {
            game.player.y = nextY;
            game.player.onGround = false;
        } else {
            // Bonk a ceiling
            game.player.y = checkTop + 1;
            game.player.vy = 0;
        }
    }

    // Re-check ground after vertical movement (in case we walked off an edge)
    if (game.player.onGround) {
        const fy = Math.floor(game.player.y + PLAYER_W + 0.05);
        if (isPassable(xL, fy) && isPassable(xR, fy)) {
            game.player.onGround = false;
        }
    }

    // Horizontal movement
    const nextX = game.player.x + game.player.vx * 0.1;
    const yT = Math.floor(game.player.y);
    const yB = Math.floor(game.player.y + PLAYER_W);
    const checkX = game.player.vx > 0 ? Math.floor(nextX + PLAYER_W) : Math.floor(nextX);

    if (isPassable(checkX, yT) && isPassable(checkX, yB)) {
        game.player.x = nextX;
    } else {
        // Snap to wall edge
        if (game.player.vx > 0) game.player.x = checkX - PLAYER_W;
        else if (game.player.vx < 0) game.player.x = checkX + 1;
        game.player.vx = 0;
    }

    // Friction
    game.player.vx *= 0.8;
    if (Math.abs(game.player.vx) < 0.05) game.player.vx = 0;

    // Enemy AI & cooldown ticks (simulating "turns" in real-time)
    if (game.animFrame % 10 === 0) {
        processTurn();
    }

    // Refresh visibility around the player every few frames
    if (game.animFrame % 5 === 0) {
        updateFOV();
    }
}

function draw() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Side-view camera: center on player
    const camX = Math.floor(canvas.width / 2 - game.player.x * T - T / 2);
    const camY = Math.floor(canvas.height / 2 - game.player.y * T - T / 2);

    const renderables = [];
    const VIEW_W = Math.ceil(canvas.width / T) + 2;
    const VIEW_H = Math.ceil(canvas.height / T) + 2;
    const ptx = playerTileX();
    const pty = playerTileY();
    const startX = Math.max(0, ptx - Math.ceil(VIEW_W / 2));
    const startY = Math.max(0, pty - Math.ceil(VIEW_H / 2));
    const endX = Math.min(game.mapWidth, startX + VIEW_W);
    const endY = Math.min(game.mapHeight, startY + VIEW_H);

    const VIS_R2 = 80; // squared visibility radius
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = game.map[`${x},${y}`];
            if (!tile) continue;
            const dx = x - ptx;
            const dy = y - pty;
            const isVisible = (dx * dx + dy * dy) <= VIS_R2;
            const isExplored = game.seen[`${x},${y}`];
            if (isVisible || isExplored) {
                renderables.push({ type: 'tile', tile, x, y, z: 0, isVisible });
            }
        }
    }

    game.items.forEach(item => { if (game.seen[`${item.x},${item.y}`]) renderables.push({ type: 'item', entity: item, x: item.x, y: item.y, z: 1 }); });
    game.npcs.forEach(npc => { if (game.seen[`${npc.x},${npc.y}`]) renderables.push({ type: 'npc', entity: npc, x: npc.x, y: npc.y, z: 1 }); });
    game.trolls.forEach(troll => {
        const d = (troll.x - ptx) ** 2 + (troll.y - pty) ** 2;
        if (d <= VIS_R2) renderables.push({ type: 'troll', entity: troll, x: troll.x, y: troll.y, z: 2 });
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
}

function jump() {
    if (game.player.onGround) {
        game.player.vy = -10;
        game.player.onGround = false;
        Audio.playJump();
    }
}

function isModalOpen() {
    return UI.modals.zine.style.display === 'flex'
        || UI.modals.conversation.style.display === 'flex'
        || UI.modals.victory.style.display === 'flex'
        || UI.modals.gameOver.style.display === 'flex'
        || UI.modals.heirSelect.style.display === 'flex'
        || UI.modals.camp.style.display === 'flex';
}

function setupControls() {
    const keys = {};
    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (isModalOpen()) return;

        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            jump();
            e.preventDefault();
        }

        const fx = game.player.facingX || 1;
        if (e.code === 'KeyQ') {
            attackEnemy(game, fx, 0, 'quick');
        } else if (e.code === 'KeyE') {
            attackEnemy(game, fx, 0, 'power');
        } else if (e.code === 'KeyR') {
            if (game.player.attackCooldown === 0) {
                game.player.attackCooldown = 5;
                UI.addMessage("NEON BLAST! 💥", "special");
                UI.shakeScreen();
                const dirs = [[1, 0], [-1, 0], [1, -1], [-1, -1], [0, -1]];
                dirs.forEach(d => attackEnemy(game, d[0], d[1], 'blast'));
            }
        } else if (e.code === 'Enter' || e.code === 'KeyF') {
            interact();
        }
    });

    document.addEventListener('keyup', e => {
        keys[e.code] = false;
    });

    // Wrap update with input handling. Pauses while a modal is open.
    const originalUpdate = update;
    update = (dt) => {
        if (isModalOpen()) {
            game.player.vx = 0;
            return;
        }
        if (keys['ArrowLeft'] || keys['KeyA']) {
            game.player.vx = -4;
            game.player.facingX = -1;
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            game.player.vx = 4;
            game.player.facingX = 1;
        }
        originalUpdate(dt);
    };

    // Touch / mobile controls
    const upBtn = document.getElementById('up');
    const leftBtn = document.getElementById('left');
    const rightBtn = document.getElementById('right');
    const downBtn = document.getElementById('down');

    const setMove = (dir) => () => {
        if (dir === 0) {
            game.player.vx = 0;
        } else {
            game.player.vx = dir * 4;
            game.player.facingX = dir;
        }
    };

    upBtn.ontouchstart = upBtn.onmousedown = (e) => { e.preventDefault(); jump(); };
    leftBtn.ontouchstart = leftBtn.onmousedown = (e) => { e.preventDefault(); setMove(-1)(); };
    leftBtn.ontouchend = leftBtn.onmouseup = leftBtn.onmouseleave = setMove(0);
    rightBtn.ontouchstart = rightBtn.onmousedown = (e) => { e.preventDefault(); setMove(1)(); };
    rightBtn.ontouchend = rightBtn.onmouseup = rightBtn.onmouseleave = setMove(0);
    if (downBtn) {
        downBtn.ontouchstart = downBtn.onmousedown = (e) => { e.preventDefault(); interact(); };
    }

    document.getElementById('interact').onclick = interact;
    document.getElementById('quick-attack').onclick = () => attackEnemy(game, game.player.facingX || 1, 0, 'quick');
    document.getElementById('power-attack').onclick = () => attackEnemy(game, game.player.facingX || 1, 0, 'power');

    document.getElementById('victory-restart-btn').onclick = () => location.reload();
    document.getElementById('game-over-continue-btn').onclick = () => {
        const heirs = generateHeirs();
        UI.showHeirSelection(heirs, (selectedHeir) => {
            game.player.trait = selectedHeir.trait;
            document.getElementById('player-name').textContent = selectedHeir.name;
            startCamp();
        });
    };
}

// Ensure setupControls is called once on load, even though initGame does startCamp
setupControls();
