import { UI } from './ui.js';
import { Audio } from './audio.js';

const PLAYER_W = 0.7;
const PLAYER_H = 0.9;

function tileX(p) { return Math.floor(p.x + PLAYER_W / 2); }
function tileY(p) { return Math.floor(p.y + PLAYER_H / 2); }

function hasTrait(player, id) {
    return (player.traits && player.traits.some(t => t.id === id)) ||
           (player.trait && player.trait.id === id);
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

export function attackEnemy(game, dx, dy, type) {
    if (game.player.attackCooldown > 0 && type !== 'blast') return;

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
            game.attackAnim = { x: px, y: py, dx, dy, life: 8, weaponType: type === 'power' ? 'sword' : 'spoon' };
            game.turnCounter++;
        }
        return;
    }

    // Wraith dodge mechanic
    if (enemy.enemyType === 'wraith' && Math.random() < 0.5) {
        UI.addMessage("The Wraith dodged your attack!", "combat");
        Audio.playStep();
        return;
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

    // Pattern Master: 20% crit chance for double damage
    let crit = false;
    if (hasTrait(game.player, 'autism') && Math.random() < 0.20) {
        damage *= 2;
        crit = true;
    }

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

    enemy.health -= damage;
    UI.addMessage(`${crit ? 'CRIT! ' : ''}Hit ${enemy.enemyType} for ${damage}!`, 'combat');
    UI.shakeScreen();
    Audio.playHit();
    
    // Attack Animation (anchored to player tile so the swing renders cleanly)
    game.attackAnim = { x: px, y: py, dx, dy, life: 8, weaponType: type === 'power' ? 'sword' : 'spoon' };
    
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
            life: 1.0, color: '#FF71CE' // Neon Pink
        });
    }
    
    if (knockback) {
        const kx = enemy.x + dx;
        const ky = enemy.y + dy;
        if (game.map[`${kx},${ky}`] === '.' && !game.trolls.find(t => t.x === kx && t.y === ky)) {
            enemy.x = kx;
            enemy.y = ky;
        }
    }
    
    if (enemy.health <= 0) {
        UI.addMessage(`${enemy.enemyType === 'boss' ? 'THE BOSS' : 'Enemy'} defeated!`, 'victory');
        game.trolls = game.trolls.filter(t => t !== enemy);
        game.player.kills = (game.player.kills || 0) + 1;

        // Small chance to drop scrap from any kill — feels generous, encourages exploration
        if (enemy.enemyType !== 'boss' && Math.random() < 0.30) {
            game.items.push({ x: enemy.x, y: enemy.y, type: 'treasure', name: 'Salvaged Scrap' });
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
            const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
            dirs.forEach(d => {
                game.items.push({ x: enemy.x + d[0], y: enemy.y + d[1], type: 'treasure', name: 'Boss Scrap' });
            });
        }
    }
    
    if (type !== 'blast') {
        game.turnCounter++;
    }
}

export function takeDamage(game, amount = 1) {
    if (game.player.hurtCooldown > 0) return;

    // Trait-based damage mitigation
    if (hasTrait(game.player, 'dwarfism')) amount = Math.max(1, amount - 1);

    game.player.health -= amount;
    UI.addMessage("Hit!", 'death');
    UI.shakeScreen();
    Audio.playDamage();
    // Full-screen flash + shake intensity scaled to damage taken.
    game.damageFlash = Math.min(1.0, (game.damageFlash || 0) + 0.6 + amount * 0.15);
    game.screenShake = Math.max(game.screenShake || 0, 0.6 + amount * 0.2);

    // Chronic pain doubles i-frames; insomnia leaves you alert with shorter recovery
    let iframes = 3;
    if (hasTrait(game.player, 'chronic')) iframes = 8;
    if (hasTrait(game.player, 'insomnia')) iframes = Math.max(2, iframes - 1);
    game.player.hurtCooldown = iframes;

    game.floatingText.push({
        x: tileX(game.player), y: tileY(game.player), text: `-${amount}`, life: 30, color: '#01CDFE'
    });

    UI.updateStatus(game);

    if (game.player.health <= 0) {
        game.player.alive = false;
        UI.showGameOver(game, "You succumbed to your wounds.");
    }
}
