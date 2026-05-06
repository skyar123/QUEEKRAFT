import { UI } from './ui.js';
import { Audio } from './audio.js';
import { LOOT_TIERS, DIFFICULTIES } from './data.js';

const PLAYER_W = 0.7;
const PLAYER_H = 0.9;

function tileX(p) { return Math.floor(p.x + PLAYER_W / 2); }
function tileY(p) { return Math.floor(p.y + PLAYER_H / 2); }

function hasTrait(player, id) {
    return (player.traits && player.traits.some(t => t.id === id)) ||
           (player.trait && player.trait.id === id);
}

function getDifficulty(game) {
    const id = (game.persistent && game.persistent.difficulty) || 'normal';
    return DIFFICULTIES[id] || DIFFICULTIES.normal;
}

// Cendric-style status effects: applied to enemies, decremented by tickStatus.
// Burn: damage-over-time. Freeze: enemy moves at half rate. Shock: brief stun + chain.
export function applyStatus(enemy, kind, duration, magnitude = 1) {
    enemy.status = enemy.status || {};
    const cur = enemy.status[kind];
    if (!cur || cur.duration < duration) {
        enemy.status[kind] = { duration, magnitude };
    } else {
        cur.magnitude = Math.max(cur.magnitude, magnitude);
    }
}

export function tickStatus(game) {
    for (let i = game.trolls.length - 1; i >= 0; i--) {
        const e = game.trolls[i];
        if (!e.status) continue;
        for (const k of Object.keys(e.status)) {
            const s = e.status[k];
            s.duration -= 1;
            if (k === 'burn') {
                if (game.animFrame % 30 === 0) {
                    e.health -= s.magnitude;
                    game.floatingText.push({ x: e.x, y: e.y, text: `🔥${s.magnitude}`, life: 24, color: '#FF8C00' });
                    game.particles.push({ x: e.x, y: e.y, vx: 0, vy: -0.3, life: 0.8, color: '#FF8C00' });
                }
            }
            if (s.duration <= 0) delete e.status[k];
        }
        if (e.health <= 0) {
            UI.addMessage(`${e.enemyType} burned out!`, 'victory');
            dropLoot(game, e);
            game.trolls.splice(i, 1);
            game.player.kills = (game.player.kills || 0) + 1;
        }
    }
}

export function isFrozen(enemy) {
    return enemy.status && enemy.status.freeze && enemy.status.freeze.duration > 0;
}
export function isShocked(enemy) {
    return enemy.status && enemy.status.shock && enemy.status.shock.duration > 0;
}

// ---------------------------------------------------------------------------
// Tiered loot drops. Common roll-curve modulated by enemy strength (boss /
// gatekeeper bias toward higher tiers) and by difficulty (Hard suppresses
// commons but boosts the chance of true rares breaking through).
function rollTier(game, enemy) {
    const diff = getDifficulty(game);
    const weights = {};
    for (const [k, v] of Object.entries(LOOT_TIERS)) weights[k] = v.weight;

    if (enemy.enemyType === 'boss') {
        // Boss always drops legendary as one of its rewards.
        return 'legendary';
    }
    if (enemy.enemyType === 'gatekeeper' || enemy.enemyType === 'police') {
        weights.common *= 0.5;
        weights.uncommon *= 1.4;
        weights.rare *= 1.6;
        weights.epic *= 1.4;
    }
    if (enemy.enemyType === 'wraith') {
        weights.rare *= 1.8;
        weights.epic *= 1.4;
    }
    // Difficulty bias: Hard mode shifts the curve toward rare+.
    weights.rare *= diff.rareBonus;
    weights.epic *= diff.rareBonus;
    weights.legendary *= diff.rareBonus;

    let total = 0;
    for (const k in weights) total += weights[k];
    let r = Math.random() * total;
    for (const k in weights) {
        r -= weights[k];
        if (r <= 0) return k;
    }
    return 'common';
}

export function dropLoot(game, enemy) {
    const diff = getDifficulty(game);
    // Base chance modulated by lootBonus. Bosses always drop. Normal mobs:
    // 0.55 * lootBonus, capped to 0.95.
    let chance = 0.55 * diff.lootBonus;
    if (enemy.enemyType === 'boss') chance = 1.0;
    if (enemy.enemyType === 'gatekeeper') chance = Math.min(0.95, chance + 0.15);
    if (Math.random() > chance) return;

    const tierKey = rollTier(game, enemy);
    const tier = LOOT_TIERS[tierKey];
    const name = tier.names[Math.floor(Math.random() * tier.names.length)];
    const item = {
        x: enemy.x, y: enemy.y,
        type: 'loot',
        tier: tierKey,
        name,
        scrap: tier.scrap,
        effect: tier.effect,
        color: tier.color,
        glow: tier.glow
    };
    game.items.push(item);
    // Tier-flavored drop announce so the player feels the dopamine.
    if (tierKey === 'legendary' || tierKey === 'epic') {
        UI.addMessage(`✨ ${tier.glow === '#FFD700' ? 'LEGENDARY' : 'EPIC'} drop: ${name}!`, 'special');
        UI.shakeScreen();
        game.screenShake = Math.max(game.screenShake || 0, tierKey === 'legendary' ? 1.0 : 0.6);
        // Loot beam particle burst
        const colors = [tier.glow, '#FFFFFF', tier.color];
        for (let i = 0; i < (tierKey === 'legendary' ? 50 : 25); i++) {
            game.particles.push({
                x: enemy.x + 0.5, y: enemy.y,
                vx: (Math.random() - 0.5) * 0.6,
                vy: -Math.random() * 0.7,
                life: 1.0,
                color: colors[i % colors.length],
                size: 2 + Math.random() * 2
            });
        }
    }
}

// ---------------------------------------------------------------------------
// Combo system. Each successful hit advances a 3-step counter (with optional
// finisher branches: charged → AoE stun, up-input → uppercut, down-input
// airborne → diving stab). Combo resets on damage taken or on a 60-frame
// timeout. The timer ticks down in main.js's update loop.
const COMBO_WINDOW = 60;       // frames a combo is alive after a successful hit
const COMBO_MAX = 3;           // cap chain length
const COMBO_DAMAGE_SCALE = [1.0, 1.15, 1.5]; // step 1, 2, 3 scaling

// ---------------------------------------------------------------------------
// Melee-style knockback profiles. Borrowed from meleelight (schmooblidon's
// Smash Bros recreation). Each attack carries:
//   bk  — base knockback: applied even at 0%, sets the "feel" of a fresh hit
//   kg  — knockback growth: how hard the hit scales with damage * percent
//   angle — trajectory in *Melee* degrees (0=right, 90=up, 270=down)
//   hitlagBase / hitlagScale — frames of hitstop (game.hitStop) on impact;
//     this is the universal "punch freeze" that sells every connect.
// Final velocity = kb * 0.03 * (cos(angle), -sin(angle)) with a horizontal
// flip baked from facing direction. Hitstun = kb * 0.4 frames.
const KB_PROFILES = {
    quick_0:  { bk: 12, kg: 75,  angle: 32,  hitlagBase: 3, hitlagScale: 0.30 }, // Slash
    quick_1:  { bk: 14, kg: 80,  angle: 38,  hitlagBase: 3, hitlagScale: 0.30 }, // Strike
    finisher: { bk: 55, kg: 110, angle: 48,  hitlagBase: 6, hitlagScale: 0.45 }, // 3rd hit launch
    power:    { bk: 45, kg: 115, angle: 42,  hitlagBase: 7, hitlagScale: 0.55 }, // charged smash
    launcher: { bk: 35, kg: 100, angle: 82,  hitlagBase: 5, hitlagScale: 0.35 }, // uppercut
    diveStab: { bk: 30, kg: 90,  angle: 270, hitlagBase: 6, hitlagScale: 0.45 }, // meteor / spike
    blast:    { bk: 40, kg: 80,  angle: 65,  hitlagBase: 5, hitlagScale: 0.35 }  // glitter bomb AoE
};

// Melee getKnockback formula (variable-knockback branch; sk == 0 path):
//   kb = ((0.01 * kg) * ((1.4 * inner) + 18) + bk
// with `inner` rolling damage and percent against weight. Capped at 250 so a
// finisher to a 999% boss doesn't sling them out of the map.
function calcKB(profile, damage, percent, weight) {
    const w = (weight || 100) * 0.01;
    const inner = ((0.05 * (damage * (damage + percent))) + (damage + percent) * 0.1) *
                  (2 - 2 * w / (1 + w));
    const kb = ((0.01 * profile.kg) * ((1.4 * inner) + 18)) + profile.bk;
    return Math.min(kb, 250);
}

function kbHitstun(kb) { return Math.floor(kb * 0.4); }
function kbHitlag(profile, damage) { return Math.floor(profile.hitlagBase + damage * profile.hitlagScale); }

// Convert KB + Melee-angle to canvas-space velocity. dirSign flips the X axis
// so attacks aimed left actually fling enemies left. Positive Y is *down* in
// canvas space, hence the negation on sin().
function kbToVelocity(kb, angleDeg, dirSign) {
    const r = angleDeg * Math.PI / 180;
    const v = kb * 0.03;
    return { vx: Math.cos(r) * v * dirSign, vy: -Math.sin(r) * v };
}

export function tickCombo(game) {
    const p = game.player;
    if (p.comboTimer > 0) {
        p.comboTimer--;
        if (p.comboTimer <= 0) {
            p.comboCount = 0;
            p.comboPeak = 0;
        }
    }
}

export function resetCombo(game) {
    game.player.comboCount = 0;
    game.player.comboTimer = 0;
}

// dirY is -1 for up-attack, +1 for down-attack, 0 otherwise.
// Returns true when something is hit so callers can sequence visuals.
export function attackEnemy(game, dx, dy, type, dirY = 0) {
    if (game.player.attackCooldown > 0 && type !== 'blast') return false;

    const px = tileX(game.player);
    const py = tileY(game.player);
    const targetX = px + dx;
    const targetY = py + dy;

    // Search a small box around target so jumping/landing one tile off still connects
    const candidates = game.trolls.filter(t => {
        const inFront = Math.sign(t.x - px) === Math.sign(dx) || dx === 0;
        return Math.abs(t.x - targetX) <= 1 && Math.abs(t.y - targetY) <= 1 && inFront !== false;
    });
    const enemy = candidates[0] || game.trolls.find(t => t.x === targetX && t.y === targetY);

    if (!enemy) {
        if (type !== 'blast') {
            game.attackAnim = {
                x: px, y: py, dx, dy, life: 8,
                weaponType: type === 'power' ? 'sword' : 'spoon',
                comboStep: (game.player.comboCount || 0),
                dirY
            };
            game.turnCounter++;
        }
        return false;
    }

    // Wraith dodge mechanic
    if (enemy.enemyType === 'wraith' && Math.random() < 0.5) {
        UI.addMessage("The Wraith dodged your attack!", "combat");
        Audio.playStep();
        return false;
    }

    let damage = game.player.baseDamage;
    let knockback = false;

    if (type === 'power') {
        damage = game.player.baseDamage * 2;
        knockback = true;
        game.player.attackCooldown = 2;
    } else {
        game.player.attackCooldown = 0;
    }

    if (hasTrait(game.player, 'euphoria')) {
        game.player.attackCooldown = 0;
        damage += 1;
    }

    // Combo damage scaling. Quick light attacks chain; every 3rd successful
    // light attack is a finisher (knockback + AoE shock). Counter advances on
    // hit landing — see "Combo state" block below — but the *step* is the
    // step the *upcoming* hit will be (count % 3). This way a fresh chain
    // starts at Slash → Strike → FINISHER and loops.
    const upcomingCount = (game.player.comboCount || 0) + 1;
    const comboStep = (upcomingCount - 1) % COMBO_MAX;
    const isFinisher = type === 'quick' && comboStep === COMBO_MAX - 1;
    const isLauncher = dirY < 0 && type === 'quick';
    const isDiveStab = dirY > 0 && type === 'quick' && !game.player.onGround;

    let comboLabel = '';
    if (type === 'quick') {
        damage = Math.ceil(damage * COMBO_DAMAGE_SCALE[comboStep]);
        if (comboStep === 0) comboLabel = 'Slash!';
        else if (comboStep === 1) comboLabel = 'Strike!';
        else if (comboStep === 2) comboLabel = 'FINISHER!';
    }

    // Pattern Master: 20% crit chance for double damage
    let crit = false;
    const critChance = (hasTrait(game.player, 'autism') ? 0.20 : 0) + (game.player.critBonus || 0);
    if (Math.random() < critChance) {
        damage *= 2;
        crit = true;
    }
    // Long combos auto-crit at 5+ (which only happens in chained finishers)
    if (game.player.comboPeak >= 5) {
        damage = Math.ceil(damage * 1.25);
    }

    // Per-enemy weight (heavier mobs eat KB; bosses are stone). Default 100.
    let weight = enemy.weight;
    if (weight === undefined) {
        if (enemy.enemyType === 'boss')        weight = 220;
        else if (enemy.enemyType === 'gatekeeper') weight = 140;
        else if (enemy.enemyType === 'concern' || enemy.enemyType === 'police') weight = 110;
        else if (enemy.enemyType === 'wraith' || enemy.enemyType === 'swarm')   weight = 70;
        else weight = 100;
    }
    enemy.weight = weight;
    enemy.percent = (enemy.percent || 0) + damage;

    // Big Mood: damage swings wildly between 0.5x and 2.5x
    if (hasTrait(game.player, 'bipolar')) {
        damage = Math.max(1, Math.round(damage * (0.5 + Math.random() * 2.0)));
    }

    // Rage power active
    if (game.player.powerType === 'rage' && game.player.powerActive > 0) damage *= 2;
    // HRT bump active
    if (game.player.powerType === 'bump' && game.player.powerActive > 0) damage += 1;
    // Pride dash auto-kills weak foes
    if (game.player.dashTimer > 0 && enemy.maxHealth <= 2) {
        damage = enemy.health;
        UI.addMessage("Dash kill! 🌈", 'special');
    }

    if (game.player.hasBrick) damage += 1;
    if (game.player.hasRage) damage *= 2;
    // Rare-loot damage buff (decremented in main.js update)
    if (game.player.lootBuff > 0) damage += 1;

    // Apply status effects based on attack type / class.
    if (type === 'power') {
        // Heavy sword attack ignites the target — slow burn DOT.
        applyStatus(enemy, 'burn', 180, 1);
    }
    if (type === 'blast') {
        // Glitter bomb stuns + ignites everything caught in the AoE.
        applyStatus(enemy, 'shock', 60, 1);
        applyStatus(enemy, 'burn', 120, 1);
    }
    // 3-step quick-finisher branches: AoE shock to nearby enemies
    if (isFinisher) {
        applyStatus(enemy, 'shock', 45, 1);
        knockback = true;
        for (const other of game.trolls) {
            if (other === enemy) continue;
            const d = Math.abs(other.x - enemy.x) + Math.abs(other.y - enemy.y);
            if (d <= 1) {
                other.health -= Math.max(1, Math.floor(damage * 0.5));
                applyStatus(other, 'shock', 30, 1);
                game.floatingText.push({ x: other.x, y: other.y, text: '⚡SPLASH', life: 24, color: '#FFD700' });
            }
        }
    }
    // Up-input launcher pops the enemy upward & extends combo
    if (isLauncher) {
        comboLabel = 'LAUNCH ↑';
        damage = Math.ceil(damage * 1.1);
        // Visual: little upward burst + brief shock
        applyStatus(enemy, 'shock', 25, 1);
        for (let i = 0; i < 14; i++) game.particles.push({
            x: enemy.x + 0.5, y: enemy.y,
            vx: (Math.random() - 0.5) * 0.3, vy: -0.4 - Math.random() * 0.5,
            life: 1.0, color: '#FFD700'
        });
    }
    // Down-attack mid-air: dive stab — bounces player up afterwards.
    if (isDiveStab) {
        comboLabel = 'DIVE STAB ↓';
        damage = Math.ceil(damage * 1.3);
        game.player.vy = -7;
        game.player.jumpsLeft = Math.max(game.player.jumpsLeft, 1);
        applyStatus(enemy, 'shock', 20, 1);
    }

    // Damage to a shocked enemy chains a tiny burst into its neighbors (Cendric-style elemental synergy).
    if (isShocked(enemy)) {
        damage += 1;
        for (const other of game.trolls) {
            if (other === enemy) continue;
            const d = Math.abs(other.x - enemy.x) + Math.abs(other.y - enemy.y);
            if (d <= 2 && Math.random() < 0.5) {
                other.health -= 1;
                game.floatingText.push({ x: other.x, y: other.y, text: '⚡-1', life: 22, color: '#FFD700' });
            }
        }
    }
    // Frozen enemies take +50% damage.
    if (isFrozen(enemy)) damage = Math.ceil(damage * 1.5);

    // === Melee-style hitlag + knockback resolution =====================
    // Pick the KB profile that matches the *intent* of this swing — the
    // directional finishers override quick/power, so a launcher Q sends the
    // enemy skyward even though the underlying attack type is 'quick'.
    let profileKey;
    if (isDiveStab)       profileKey = 'diveStab';
    else if (isLauncher)  profileKey = 'launcher';
    else if (isFinisher)  profileKey = 'finisher';
    else if (type === 'blast') profileKey = 'blast';
    else if (type === 'power') profileKey = 'power';
    else                       profileKey = comboStep === 1 ? 'quick_1' : 'quick_0';
    const profile = KB_PROFILES[profileKey];

    const kb = calcKB(profile, damage, enemy.percent, weight);
    const dirSign = (dx !== 0 ? Math.sign(dx) : (enemy.x >= px ? 1 : -1));
    const vel = kbToVelocity(kb, profile.angle, dirSign);
    enemy.vx = vel.vx;
    enemy.vy = vel.vy;
    enemy.hitstun = kbHitstun(kb);
    enemy.onGround = false;

    // Hitlag freezes the entire scene for a few frames — that's the universal
    // "punch hit" feel from Smash. game.hitStop is consumed in main.js:gameLoop.
    const hitlag = kbHitlag(profile, damage);
    game.hitStop = Math.max(game.hitStop || 0, hitlag);

    // Bigger hits shake harder. Floor of 0.35 so even a jab nudges the camera.
    const shake = Math.min(1.2, 0.35 + kb * 0.012);
    game.screenShake = Math.max(game.screenShake || 0, shake);

    // KB-launch trail particles — more streaks at higher KB to signal heft.
    const streakCount = Math.min(20, 4 + Math.floor(kb * 0.18));
    for (let i = 0; i < streakCount; i++) {
        game.particles.push({
            x: enemy.x + 0.5, y: enemy.y + 0.5,
            vx: -vel.vx * (0.3 + Math.random() * 0.4),
            vy: -vel.vy * (0.3 + Math.random() * 0.4) - Math.random() * 0.3,
            life: 0.6 + Math.random() * 0.4,
            color: profileKey === 'finisher' ? '#FFD700' :
                   profileKey === 'launcher' ? '#01CDFE' :
                   profileKey === 'diveStab' ? '#FF71CE' : '#FFFFFF',
            size: 2 + Math.random() * 2
        });
    }

    enemy.health -= damage;
    UI.addMessage(`${crit ? 'CRIT! ' : ''}${comboLabel ? comboLabel + ' ' : ''}Hit ${enemy.enemyType} for ${damage}!`, 'combat');
    UI.shakeScreen();
    Audio.playHit();

    // Combo state: every successful quick hit advances; power attacks are
    // intentional finishers and break the chain while still benefiting from
    // the big damage applied above.
    if (type === 'quick') {
        game.player.comboCount = upcomingCount;
        game.player.comboPeak = upcomingCount;
        game.player.comboTimer = COMBO_WINDOW;
    } else if (type === 'power') {
        game.player.comboCount = 0;
        game.player.comboPeak = 0;
    }

    // Attack Animation (anchored to player tile so the swing renders cleanly)
    game.attackAnim = {
        x: px, y: py, dx, dy, life: 8,
        weaponType: type === 'power' ? 'sword' : 'spoon',
        comboStep,
        finisher: isFinisher,
        launcher: isLauncher,
        diveStab: isDiveStab,
        dirY
    };

    // Floating Damage Text
    game.floatingText.push({
        x: enemy.x, y: enemy.y, text: `-${damage}`, life: 30, color: '#FF71CE'
    });

    // Spawn neon particles!
    for (let i = 0; i < 15; i++) {
        game.particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            life: 1.0, color: '#FF71CE'
        });
    }
    // Finisher / launcher / dive: heavier impact particles
    if (isFinisher || isLauncher || isDiveStab) {
        const fxColor = isFinisher ? '#FFD700' : isLauncher ? '#01CDFE' : '#FF71CE';
        for (let i = 0; i < 22; i++) {
            game.particles.push({
                x: enemy.x + 0.5, y: enemy.y,
                vx: (Math.random() - 0.5) * 0.7,
                vy: (isLauncher ? -1 : (isDiveStab ? 1 : -0.4)) - Math.random() * 0.5,
                life: 1.0, color: fxColor
            });
        }
        game.screenShake = Math.max(game.screenShake || 0, isFinisher ? 0.85 : 0.55);
    }
    if (enemy.health <= 0) {
        UI.addMessage(`${enemy.enemyType === 'boss' ? 'THE BOSS' : 'Enemy'} defeated!`, 'victory');
        game.trolls = game.trolls.filter(t => t !== enemy);
        game.player.kills = (game.player.kills || 0) + 1;
        if (typeof window.addXP === 'function') window.addXP(20);
        else game.player.xp = (game.player.xp || 0) + 20;

        // Tiered loot drop replaces the old flat 30% scrap drop.
        if (enemy.enemyType !== 'boss') {
            dropLoot(game, enemy);
        }

        // Death explosion
        const expCount = enemy.enemyType === 'boss' ? 100 : 20;
        const colors = ['#01CDFE','#FF71CE','#FFD700','#39FF14'];
        for (let i = 0; i < expCount; i++) {
            game.particles.push({
                x: enemy.x, y: enemy.y,
                vx: (Math.random() - 0.5) * (enemy.enemyType === 'boss' ? 1.0 : 0.5),
                vy: (Math.random() - 0.5) * (enemy.enemyType === 'boss' ? 1.0 : 0.5),
                life: 1.0,
                color: colors[i % colors.length]
            });
        }

        if (enemy.enemyType === 'boss') {
            UI.addMessage("🎉 BOSS DEFEATED! MASSIVE SCRAP REWARD! 🎉", "special");
            game.treasures += 15;
            game.persistent.treasures += 15;
            game.player.scrapEarned = (game.player.scrapEarned || 0) + 15;
            game.player.health = game.player.maxHealth;
            Audio.playLoot();
            // Boss drops a guaranteed Legendary plus some secondaries.
            dropLoot(game, enemy);
            if (typeof window.addXP === 'function') window.addXP(500);
            else game.player.xp = (game.player.xp || 0) + 500;
            const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
            dirs.forEach(d => {
                game.items.push({ x: enemy.x + d[0], y: enemy.y + d[1], type: 'treasure', name: 'Boss Scrap' });
            });
        }
    }

    if (type !== 'blast') {
        game.turnCounter++;
    }
    return true;
}

export function takeDamage(game, amount = 1) {
    if (game.player.hurtCooldown > 0) return;

    // Trait-based damage mitigation
    if (hasTrait(game.player, 'dwarfism')) amount = Math.max(1, amount - 1);

    // Difficulty scaling: Easy = ¼ heart per "1 damage" hit, Normal = ½, Hard = full.
    const diff = getDifficulty(game);
    let scaled = amount * diff.damageScale;
    // Round to the nearest quarter so the heart HUD shows clean ¼ / ½ / ¾ states.
    scaled = Math.round(scaled * 4) / 4;
    if (scaled < 0.25) scaled = 0.25;

    game.player.health -= scaled;
    UI.addMessage("Hit!", 'death');
    UI.shakeScreen();
    Audio.playDamage();
    // Full-screen flash + shake intensity scaled to damage taken.
    game.damageFlash = Math.min(1.0, (game.damageFlash || 0) + 0.6 + scaled * 0.15);
    game.screenShake = Math.max(game.screenShake || 0, 0.6 + scaled * 0.2);

    // Combo broken on damage taken — punishes greedy play, rewards spacing.
    resetCombo(game);

    // MELEE LIGHT: Player Knockback. Player weighs ~95 (light fighter feel),
    // and uses a fixed mid-angle (~55°) so hits send them up-and-away rather
    // than slamming them into the floor.
    game.player.percent = (game.player.percent || 0) + amount;
    const playerProfile = { bk: 22, kg: 90, angle: 55, hitlagBase: 4, hitlagScale: 0.4 };
    const pkb = calcKB(playerProfile, amount, game.player.percent, 95);
    const pDir = (game.player.vx >= 0 ? -1 : 1);
    const pVel = kbToVelocity(pkb, playerProfile.angle, pDir);
    game.player.vx = pVel.vx;
    game.player.vy = pVel.vy;
    game.player.onGround = false;
    game.player.hitstun = Math.max(12, kbHitstun(pkb));
    // Pause the world for a beat so the hit reads — same hitlag system as offense.
    game.hitStop = Math.max(game.hitStop || 0, kbHitlag(playerProfile, amount));

    // Chronic pain doubles i-frames; insomnia leaves you alert with shorter recovery
    let iframes = 3;
    if (hasTrait(game.player, 'chronic')) iframes = 8;
    if (hasTrait(game.player, 'insomnia')) iframes = Math.max(2, iframes - 1);
    game.player.hurtCooldown = iframes;

    game.floatingText.push({
        x: tileX(game.player), y: tileY(game.player), text: `-${scaled}`, life: 30, color: '#01CDFE'
    });

    UI.updateStatus(game);

    if (game.player.health <= 0.001) {
        game.player.health = 0;
        game.player.alive = false;
        UI.showGameOver(game, "You succumbed to your wounds.");
    }
}
