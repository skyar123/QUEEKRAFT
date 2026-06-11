// Fishing — the Safehouse pond minigame. Cast with USE next to water, wait
// for the bobber to dip, hit USE inside the bite window to land the catch.
// Fish are pocketable snacks (eaten from the bag) and every species logged
// in the persistent fish-dex shows up in the Codex.
import { FISH, FISH_KEYS } from './data.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';

const BITE_WINDOW = 28;   // frames to react once the bobber dips
const MAX_POCKET_FISH = 6;

function adjacentWater(game) {
    const px = Math.floor(game.player.x + 0.35);
    const py = Math.floor(game.player.y + 0.45);
    for (const [dx, dy] of [[1, 1], [-1, 1], [1, 0], [-1, 0], [0, 1], [2, 1], [-2, 1]]) {
        if (game.map[`${px + dx},${py + dy}`] === 'W') return { x: px + dx, y: py + dy };
    }
    return null;
}

export function nearWater(game) { return !!adjacentWater(game); }
export function isFishing(game) { return !!game.fishing; }

// USE pressed: start a cast, land a bite, or reel in early. Returns true when
// the press was consumed by fishing.
export function handleFishingUse(game) {
    if (game.fishing) {
        if (game.fishing.phase === 'bite') landCatch(game);
        else {
            game.fishing = null;
            UI.addMessage('You reel the line back in.', 'system');
        }
        return true;
    }
    const spot = adjacentWater(game);
    if (!spot) return false;
    game.fishing = {
        phase: 'wait',
        timer: 90 + Math.floor(Math.random() * 200),
        spotX: spot.x, spotY: spot.y
    };
    Audio.playSplash && Audio.playSplash();
    UI.addMessage('🎣 You cast a line. Wait for the dip… then USE!', 'special');
    return true;
}

function rollFish() {
    let total = 0;
    for (const k of FISH_KEYS) total += FISH[k].weight;
    let r = Math.random() * total;
    for (const k of FISH_KEYS) {
        r -= FISH[k].weight;
        if (r <= 0) return k;
    }
    return FISH_KEYS[0];
}

function landCatch(game) {
    const key = rollFish();
    const fish = FISH[key];
    game.fishing = null;
    if (!game.persistent.fishDex) game.persistent.fishDex = {};
    const firstCatch = !game.persistent.fishDex[key];
    game.persistent.fishDex[key] = (game.persistent.fishDex[key] || 0) + 1;

    if (!game.player.fish) game.player.fish = [];
    let pocketed = '';
    if (game.player.fish.length < MAX_POCKET_FISH) {
        game.player.fish.push(key);
        pocketed = ' Pocketed — snack on it from the bag (I).';
    } else {
        pocketed = ' Pockets full — released with a kiss.';
    }
    UI.addMessage(`${fish.icon} Caught: ${fish.name} [${fish.tier.toUpperCase()}]!${firstCatch ? ' NEW fish-dex entry!' : ''}${pocketed}`, 'special');
    Audio.playCatch && Audio.playCatch();
    for (let i = 0; i < 16; i++) {
        game.particles.push({
            x: game.player.x + 0.35, y: game.player.y,
            vx: (Math.random() - 0.5) * 0.5, vy: -Math.random() * 0.6,
            life: 1.0, color: i % 2 ? '#5BCEFA' : '#FFFFFF', size: 2
        });
    }
}

export function updateFishing(game) {
    const f = game.fishing;
    if (!f) return;
    // Walking or jumping off the bank cancels the cast quietly.
    if (Math.abs(game.player.vx) > 0.6 || !game.player.onGround) {
        game.fishing = null;
        return;
    }
    f.timer--;
    if (f.phase === 'wait' && f.timer <= 0) {
        f.phase = 'bite';
        f.timer = BITE_WINDOW;
        Audio.playSplash && Audio.playSplash();
        game.floatingText.push({ x: f.spotX, y: f.spotY - 1, text: '❗', life: BITE_WINDOW, color: '#FFD700' });
    } else if (f.phase === 'bite' && f.timer <= 0) {
        game.fishing = null;
        UI.addMessage('…it got away. The pond giggles.', 'system');
    }
}

export function drawFishing(game, ctx, camX, camY, T) {
    const f = game.fishing;
    if (!f) return;
    const px = (game.player.x + 0.35) * T + camX;
    const py = (game.player.y + 0.3) * T + camY;
    const bobBase = f.spotX * T + camX + T / 2;
    const dip = f.phase === 'bite' ? 5 : Math.sin(game.animFrame * 0.1) * 1.5;
    const by = f.spotY * T + camY + 4 + dip;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo((px + bobBase) / 2, Math.min(py, by) - 14, bobBase, by);
    ctx.stroke();
    ctx.fillStyle = f.phase === 'bite' ? '#FF0040' : '#FF71CE';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(bobBase, by, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
