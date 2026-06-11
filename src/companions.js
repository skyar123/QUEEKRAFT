// Companions — the cozy critter layer. Rescued from cages in the depths,
// they live at the Safehouse pond, and one rides along per run: trailing the
// player on a breadcrumb path (Secret of Mana style) and granting a passive
// perk. Pure presentation + small hooks; they never block or take damage.
import { COMPANIONS } from './data.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';

export function activeCompanion(game) {
    const key = game.persistent && game.persistent.activeCompanion;
    if (!key || !game.persistent.companions || !game.persistent.companions[key]) return null;
    return COMPANIONS[key] || null;
}

// Called whenever a run/floor starts or the active companion changes.
export function initCompanionForRun(game) {
    game.companionTrail = [];
    game.companionPos = null;
    game.companionPerks = {};
    const comp = activeCompanion(game);
    if (!comp) return;
    if (comp.perk === 'crit') game.companionPerks.crit = 0.10;
    if (comp.perk === 'light') game.companionPerks.light = 2;
    if (comp.perk === 'magnet') game.companionPerks.magnet = 3;
}

export function rescueCompanion(game, companionKey) {
    const comp = COMPANIONS[companionKey];
    if (!comp) return;
    if (!game.persistent.companions) game.persistent.companions = {};
    game.persistent.companions[companionKey] = true;
    // First rescue auto-befriends; later ones wait at the Safehouse pond.
    if (!game.persistent.activeCompanion) game.persistent.activeCompanion = companionKey;
    UI.addMessage(`${comp.icon} You freed the ${comp.name}! ${comp.perkDesc}`, 'special');
    UI.addMessage(`🏛 ${game.persistent.activeCompanion === companionKey ? 'They fall in beside you.' : 'They head for the Safehouse pond — pick your travel buddy in the bag (I).'}`, 'special');
    Audio.playChirp && Audio.playChirp();
    initCompanionForRun(game);
}

export function updateCompanion(game) {
    const comp = activeCompanion(game);
    if (!comp) return;
    const p = game.player;

    // Breadcrumb follow — companion sits ~16 frames behind the player.
    game.companionTrail.push({ x: p.x, y: p.y });
    if (game.companionTrail.length > 40) game.companionTrail.shift();
    const idx = Math.max(0, game.companionTrail.length - 16);
    const target = game.companionTrail[idx];
    if (!game.companionPos) game.companionPos = { x: target.x, y: target.y };
    game.companionPos.x += (target.x - game.companionPos.x) * 0.25;
    game.companionPos.y += (target.y - game.companionPos.y) * 0.25;

    // Perk ticks.
    if (comp.perk === 'magnet') {
        // Archive Crow fetches: auto-collect pickups drift toward the player.
        const AUTO = new Set(['loot', 'treasure', 'heart', 'key', 'potion', 'heart_piece']);
        for (const it of game.items) {
            if (!AUTO.has(it.type)) continue;
            const dx = (p.x + 0.35) - it.x, dy = p.y - it.y;
            const d = Math.hypot(dx, dy);
            if (d > 0.1 && d <= 3) { it.x += (dx / d) * 0.12; it.y += (dy / d) * 0.12; }
        }
    }
    if (comp.perk === 'regen' && game.animFrame % (45 * 60) === 0 && p.health < p.maxHealth) {
        p.health = Math.min(p.maxHealth, p.health + 1);
        game.floatingText.push({ x: p.x, y: p.y, text: `${comp.icon}+1`, life: 40, color: '#F5A9B8' });
        UI.updateStatus(game);
    }
    if (comp.perk === 'aura' && game.animFrame % 60 === 0) {
        // Disco Snail: nearby enemies occasionally freeze mid-boogie.
        for (const t of game.trolls) {
            const d = Math.hypot(t.x - p.x, t.y - p.y);
            if (d <= 2.5 && Math.random() < 0.08) {
                t.status = t.status || {};
                t.status.shock = { duration: 35, magnitude: 1 };
                game.floatingText.push({ x: t.x, y: t.y, text: '✨', life: 24, color: '#39FF14' });
            }
        }
    }
    // Sparkle trail so the critter reads as magical, not lost.
    if (game.animFrame % 14 === 0 && game.companionPos) {
        game.particles.push({
            x: game.companionPos.x + 0.3, y: game.companionPos.y + 0.6,
            vx: 0, vy: -0.08, life: 0.7, color: comp.color, size: 1.5
        });
    }
}

// Shared critter renderer — follower, hub idlers, and the cage preview.
export function drawCritter(ctx, key, sx, sy, frame, scale = 1) {
    const comp = COMPANIONS[key];
    if (!comp) return;
    const bob = Math.sin(frame * 0.25 + sx * 0.01) * 2.5;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = comp.color;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 8 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = `${Math.round(18 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = comp.color;
    ctx.shadowBlur = 8;
    ctx.fillText(comp.icon, sx, sy - 4 + bob);
    ctx.restore();
    ctx.textAlign = 'left';
}

export function drawCompanion(game, ctx, camX, camY, T) {
    const comp = activeCompanion(game);
    if (!comp || !game.companionPos) return;
    drawCritter(ctx, game.persistent.activeCompanion,
        game.companionPos.x * T + camX + T * 0.35,
        game.companionPos.y * T + camY + T * 0.9,
        game.animFrame);
}
