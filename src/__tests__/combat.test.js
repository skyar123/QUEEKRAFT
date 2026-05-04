import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyStatus, tickStatus, isFrozen, isShocked, attackEnemy, takeDamage } from '../combat.js';

vi.mock('../ui.js', () => ({
    UI: {
        addMessage: vi.fn(),
        shakeScreen: vi.fn(),
        updateStatus: vi.fn(),
        showGameOver: vi.fn(),
    },
}));

vi.mock('../audio.js', () => ({
    Audio: {
        playStep: vi.fn(),
        playHit: vi.fn(),
        playDamage: vi.fn(),
        playLoot: vi.fn(),
    },
}));

// Player sits at tile (5,5): Math.floor(5 + 0.35) = 5, Math.floor(5 + 0.45) = 5
function makeGame(overrides = {}) {
    return {
        player: {
            x: 5, y: 5,
            baseDamage: 2,
            attackCooldown: 0,
            hurtCooldown: 0,
            kills: 0,
            health: 10,
            maxHealth: 10,
            alive: true,
            traits: [],
            hasBrick: false,
            hasRage: false,
            powerType: null,
            powerActive: 0,
            dashTimer: 0,
        },
        trolls: [],
        map: {},
        items: [],
        floatingText: [],
        particles: [],
        turnCounter: 0,
        animFrame: 0,
        treasures: 0,
        persistent: { treasures: 0 },
        attackAnim: null,
        damageFlash: 0,
        screenShake: 0,
        ...overrides,
    };
}

function makeEnemy(overrides = {}) {
    return {
        x: 6, y: 5,
        health: 5,
        maxHealth: 5,
        enemyType: 'bully',
        status: {},
        ...overrides,
    };
}

// ─── applyStatus ──────────────────────────────────────────────────────────────

describe('applyStatus', () => {
    it('applies a new status to an enemy with no prior status', () => {
        const enemy = { status: {} };
        applyStatus(enemy, 'burn', 120, 2);
        expect(enemy.status.burn).toEqual({ duration: 120, magnitude: 2 });
    });

    it('replaces existing status when new duration is longer', () => {
        const enemy = { status: { burn: { duration: 30, magnitude: 1 } } };
        applyStatus(enemy, 'burn', 120, 1);
        expect(enemy.status.burn.duration).toBe(120);
    });

    it('keeps existing status when new duration is shorter', () => {
        const enemy = { status: { burn: { duration: 120, magnitude: 1 } } };
        applyStatus(enemy, 'burn', 30, 1);
        expect(enemy.status.burn.duration).toBe(120);
    });

    it('upgrades magnitude to the higher value without shortening duration', () => {
        const enemy = { status: { burn: { duration: 120, magnitude: 1 } } };
        applyStatus(enemy, 'burn', 30, 5);
        // duration stays 120 (new is shorter), but magnitude gets bumped
        expect(enemy.status.burn.duration).toBe(120);
        expect(enemy.status.burn.magnitude).toBe(5);
    });

    it('initialises enemy.status if it is undefined', () => {
        const enemy = {};
        applyStatus(enemy, 'shock', 60, 1);
        expect(enemy.status.shock).toEqual({ duration: 60, magnitude: 1 });
    });
});

// ─── isFrozen / isShocked ─────────────────────────────────────────────────────

describe('isFrozen', () => {
    it('is falsy for an enemy with no status', () => {
        expect(isFrozen({})).toBeFalsy();
    });

    it('is falsy when freeze duration is 0', () => {
        expect(isFrozen({ status: { freeze: { duration: 0 } } })).toBeFalsy();
    });

    it('is truthy when freeze is active', () => {
        expect(isFrozen({ status: { freeze: { duration: 5 } } })).toBeTruthy();
    });
});

describe('isShocked', () => {
    it('is falsy for an enemy with no status', () => {
        expect(isShocked({})).toBeFalsy();
    });

    it('is falsy when shock duration is 0', () => {
        expect(isShocked({ status: { shock: { duration: 0 } } })).toBeFalsy();
    });

    it('is truthy when shock is active', () => {
        expect(isShocked({ status: { shock: { duration: 10 } } })).toBeTruthy();
    });
});

// ─── tickStatus ───────────────────────────────────────────────────────────────

describe('tickStatus', () => {
    it('decrements status duration each tick', () => {
        const enemy = makeEnemy({ status: { freeze: { duration: 10, magnitude: 1 } } });
        const game = makeGame({ trolls: [enemy] });
        tickStatus(game);
        expect(enemy.status.freeze.duration).toBe(9);
    });

    it('removes a status when its duration hits 0', () => {
        const enemy = makeEnemy({ status: { freeze: { duration: 1, magnitude: 1 } } });
        const game = makeGame({ trolls: [enemy] });
        tickStatus(game);
        expect(enemy.status.freeze).toBeUndefined();
    });

    it('applies burn damage on frames that are multiples of 30', () => {
        const enemy = makeEnemy({ health: 10, status: { burn: { duration: 120, magnitude: 2 } } });
        const game = makeGame({ trolls: [enemy], animFrame: 30 });
        tickStatus(game);
        expect(enemy.health).toBe(8);
    });

    it('does not apply burn damage on non-multiple-of-30 frames', () => {
        const enemy = makeEnemy({ health: 10, status: { burn: { duration: 120, magnitude: 2 } } });
        const game = makeGame({ trolls: [enemy], animFrame: 31 });
        tickStatus(game);
        expect(enemy.health).toBe(10);
    });

    it('removes a burned-to-death enemy and increments player kills', () => {
        const enemy = makeEnemy({ health: 1, status: { burn: { duration: 120, magnitude: 5 } } });
        const game = makeGame({ trolls: [enemy], animFrame: 30 });
        tickStatus(game);
        expect(game.trolls).toHaveLength(0);
        expect(game.player.kills).toBe(1);
    });

    it('skips enemies with no status object', () => {
        const enemy = makeEnemy({ status: undefined });
        const game = makeGame({ trolls: [enemy] });
        expect(() => tickStatus(game)).not.toThrow();
    });
});

// ─── attackEnemy ──────────────────────────────────────────────────────────────

describe('attackEnemy', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('does nothing when attackCooldown > 0 (non-blast)', () => {
        const enemy = makeEnemy();
        const game = makeGame({ trolls: [enemy] });
        game.player.attackCooldown = 1;
        attackEnemy(game, 1, 0, 'normal');
        expect(enemy.health).toBe(5);
    });

    it('increments turnCounter on a miss', () => {
        const game = makeGame({ trolls: [] });
        attackEnemy(game, 1, 0, 'normal');
        expect(game.turnCounter).toBe(1);
    });

    it('deals baseDamage on a normal hit', () => {
        // Prevent wraith dodge and all random effects
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const enemy = makeEnemy();
        const game = makeGame({ trolls: [enemy] });
        attackEnemy(game, 1, 0, 'normal');
        expect(enemy.health).toBe(5 - game.player.baseDamage);
    });

    it('deals double baseDamage on a power attack', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const enemy = makeEnemy({ health: 20, maxHealth: 20 });
        const game = makeGame({ trolls: [enemy] });
        attackEnemy(game, 1, 0, 'power');
        expect(enemy.health).toBe(20 - game.player.baseDamage * 2);
    });

    it('sets attackCooldown to 2 after a power attack', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const enemy = makeEnemy({ health: 20, maxHealth: 20 });
        const game = makeGame({ trolls: [enemy] });
        attackEnemy(game, 1, 0, 'power');
        expect(game.player.attackCooldown).toBe(2);
    });

    it('removes enemy from trolls array when health reaches 0', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const enemy = makeEnemy({ health: 1 });
        const game = makeGame({ trolls: [enemy] });
        attackEnemy(game, 1, 0, 'normal');
        expect(game.trolls).toHaveLength(0);
    });

    it('increments player.kills when enemy dies', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const enemy = makeEnemy({ health: 1 });
        const game = makeGame({ trolls: [enemy] });
        attackEnemy(game, 1, 0, 'normal');
        expect(game.player.kills).toBe(1);
    });

    it('applies +50% damage (ceil) to frozen enemies', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        // baseDamage=3, frozen → ceil(3 * 1.5) = 5
        const enemy = makeEnemy({
            health: 20, maxHealth: 20,
            status: { freeze: { duration: 10, magnitude: 1 } },
        });
        const game = makeGame({ trolls: [enemy] });
        game.player.baseDamage = 3;
        attackEnemy(game, 1, 0, 'normal');
        expect(enemy.health).toBe(20 - Math.ceil(3 * 1.5));
    });

    it('adds +1 damage to shocked enemies', () => {
        // random > 0.5 so chain doesn't fire on neighbours
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const enemy = makeEnemy({
            health: 20, maxHealth: 20,
            status: { shock: { duration: 10, magnitude: 1 } },
        });
        const game = makeGame({ trolls: [enemy] });
        attackEnemy(game, 1, 0, 'normal');
        expect(enemy.health).toBe(20 - (game.player.baseDamage + 1));
    });

    it('adds burn status to a power-attack target', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const enemy = makeEnemy({ health: 20, maxHealth: 20 });
        const game = makeGame({ trolls: [enemy] });
        attackEnemy(game, 1, 0, 'power');
        expect(enemy.status?.burn?.duration).toBeGreaterThan(0);
    });

    it('awards 15 treasures and heals player on boss kill', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const boss = makeEnemy({ health: 1, maxHealth: 1, enemyType: 'boss' });
        const game = makeGame({ trolls: [boss] });
        game.player.health = 3;
        attackEnemy(game, 1, 0, 'normal');
        expect(game.treasures).toBe(15);
        expect(game.player.health).toBe(game.player.maxHealth);
    });

    it('increments turnCounter after a normal hit', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const enemy = makeEnemy({ health: 20, maxHealth: 20 });
        const game = makeGame({ trolls: [enemy] });
        attackEnemy(game, 1, 0, 'normal');
        expect(game.turnCounter).toBe(1);
    });

    it('does not increment turnCounter for blast type', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        const enemy = makeEnemy({ health: 20, maxHealth: 20 });
        const game = makeGame({ trolls: [enemy] });
        attackEnemy(game, 1, 0, 'blast');
        expect(game.turnCounter).toBe(0);
    });
});

// ─── takeDamage ───────────────────────────────────────────────────────────────

describe('takeDamage', () => {
    it('reduces player health by the given amount', () => {
        const game = makeGame();
        takeDamage(game, 2);
        expect(game.player.health).toBe(8);
    });

    it('does nothing when hurtCooldown > 0', () => {
        const game = makeGame();
        game.player.hurtCooldown = 3;
        takeDamage(game, 2);
        expect(game.player.health).toBe(10);
    });

    it('sets alive to false when health reaches 0', () => {
        const game = makeGame();
        game.player.health = 1;
        takeDamage(game, 1);
        expect(game.player.alive).toBe(false);
    });

    it('sets a default of 3 invincibility frames', () => {
        const game = makeGame();
        takeDamage(game, 1);
        expect(game.player.hurtCooldown).toBe(3);
    });

    it('dwarfism trait reduces incoming damage by 1 (minimum 1)', () => {
        const game = makeGame();
        game.player.traits = [{ id: 'dwarfism' }];
        takeDamage(game, 3);
        expect(game.player.health).toBe(10 - 2);
    });

    it('dwarfism trait cannot reduce damage below 1', () => {
        const game = makeGame();
        game.player.traits = [{ id: 'dwarfism' }];
        takeDamage(game, 1);
        expect(game.player.health).toBe(9);
    });

    it('chronic trait extends invincibility frames to 8', () => {
        const game = makeGame();
        game.player.traits = [{ id: 'chronic' }];
        takeDamage(game, 1);
        expect(game.player.hurtCooldown).toBe(8);
    });

    it('insomnia trait reduces invincibility frames by 1 (min 2)', () => {
        const game = makeGame();
        game.player.traits = [{ id: 'insomnia' }];
        takeDamage(game, 1);
        expect(game.player.hurtCooldown).toBe(2);
    });

    it('insomnia does not reduce frames below 2', () => {
        // default iframes=3, insomnia → max(2, 3-1) = 2
        const game = makeGame();
        game.player.traits = [{ id: 'insomnia' }];
        takeDamage(game, 1);
        expect(game.player.hurtCooldown).toBeGreaterThanOrEqual(2);
    });
});
