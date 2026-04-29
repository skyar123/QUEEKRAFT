import { ZINES, HISTORICAL_FIGURES, TREASURES, HEALING_ITEMS } from './data.js';

export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Side-view platformer level generator.
// Convention:
//   '.' = passable air (player can move through)
//   '#' = solid platform/wall (player stands on top, blocked from passing)
//   '>' = exit portal (passable, triggers depth descent on USE)
export function generateMap(game) {
    game.map = {};
    game.items = [];
    game.npcs = [];
    game.trolls = [];

    // Fill with air
    for (let y = 0; y < game.mapHeight; y++) {
        for (let x = 0; x < game.mapWidth; x++) {
            game.map[`${x},${y}`] = '.';
        }
    }

    // Outer side walls (left/right boundaries)
    for (let y = 0; y < game.mapHeight; y++) {
        game.map[`0,${y}`] = '#';
        game.map[`${game.mapWidth - 1},${y}`] = '#';
    }
    // Ceiling
    for (let x = 0; x < game.mapWidth; x++) {
        game.map[`${x},0`] = '#';
    }

    // Solid ground at bottom (2 rows)
    const groundY = game.mapHeight - 2;
    for (let x = 0; x < game.mapWidth; x++) {
        game.map[`${x},${groundY}`] = '#';
        game.map[`${x},${groundY + 1}`] = '#';
    }

    // Add gaps in the ground after level 1 (player must jump over)
    if (game.depth >= 2) {
        const numGaps = 1 + Math.floor(Math.random() * Math.min(3, game.depth));
        for (let i = 0; i < numGaps; i++) {
            const gapStart = 4 + Math.floor(Math.random() * (game.mapWidth - 12));
            const gapWidth = 2 + Math.floor(Math.random() * 2);
            for (let gx = gapStart; gx < gapStart + gapWidth && gx < game.mapWidth - 2; gx++) {
                game.map[`${gx},${groundY}`] = '.';
                game.map[`${gx},${groundY + 1}`] = '.';
            }
        }
    }

    // Generate floating platforms
    const platforms = [];
    const numPlatforms = 6 + Math.floor(Math.random() * 5);
    let attempts = 0;
    while (platforms.length < numPlatforms && attempts < numPlatforms * 4) {
        attempts++;
        const pw = 3 + Math.floor(Math.random() * 4);
        const px = 3 + Math.floor(Math.random() * (game.mapWidth - pw - 4));
        const py = 4 + Math.floor(Math.random() * (groundY - 7));

        let overlap = false;
        for (const other of platforms) {
            // Vertical clearance: at least 3 tiles between platforms (room to jump)
            if (Math.abs(other.y - py) < 3 &&
                px < other.x + other.w + 2 &&
                px + pw + 2 > other.x) {
                overlap = true;
                break;
            }
        }
        if (overlap) continue;

        platforms.push({ x: px, y: py, w: pw });
        for (let dx = 0; dx < pw; dx++) {
            game.map[`${px + dx},${py}`] = '#';
        }
    }

    // Spawn player on ground at the left side
    game.player.x = 2;
    game.player.y = groundY - 1;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.onGround = true;

    // Place exit on the highest platform if available, otherwise far right of ground
    if (game.depth < 8 && platforms.length > 0) {
        const sorted = [...platforms].sort((a, b) => a.y - b.y);
        const target = sorted[0];
        const sx = target.x + Math.floor(target.w / 2);
        const sy = target.y - 1;
        game.map[`${sx},${sy}`] = '>';
    } else if (game.depth < 8) {
        game.map[`${game.mapWidth - 3},${groundY - 1}`] = '>';
    }

    // Helper: pick an open tile directly above a solid (something to stand on)
    function pickStandingTile(filter) {
        const candidates = [];
        // Ground positions
        for (let x = 3; x < game.mapWidth - 3; x++) {
            if (game.map[`${x},${groundY}`] === '#' && game.map[`${x},${groundY - 1}`] === '.') {
                candidates.push({ x, y: groundY - 1 });
            }
        }
        // Platform top positions
        for (const plat of platforms) {
            for (let dx = 0; dx < plat.w; dx++) {
                const x = plat.x + dx;
                const y = plat.y - 1;
                if (game.map[`${x},${y}`] === '.') {
                    candidates.push({ x, y });
                }
            }
        }
        const filtered = filter ? candidates.filter(filter) : candidates;
        return filtered.length ? filtered[Math.floor(Math.random() * filtered.length)] : null;
    }

    // Avoid placing things on the player spawn or on the exit
    const occupied = new Set();
    occupied.add(`${game.player.x},${game.player.y}`);
    for (const key of Object.keys(game.map)) {
        if (game.map[key] === '>') occupied.add(key);
    }
    const pickFree = (filter) => pickStandingTile(t => {
        const key = `${t.x},${t.y}`;
        if (occupied.has(key)) return false;
        return filter ? filter(t) : true;
    });

    // Place Zines
    const zineKeys = Object.keys(ZINES).filter(k => !game.persistent.seenZines[k]);
    const zinesThisLevel = Math.min(3, zineKeys.length);
    for (let i = 0; i < zinesThisLevel; i++) {
        const tile = pickFree();
        if (!tile) break;
        const zineKey = pick(zineKeys);
        zineKeys.splice(zineKeys.indexOf(zineKey), 1);
        occupied.add(`${tile.x},${tile.y}`);
        game.items.push({
            x: tile.x, y: tile.y, type: 'zine', zineKey, name: ZINES[zineKey].title
        });
    }

    // Place a Historical Figure (rare)
    const figureKeys = Object.keys(HISTORICAL_FIGURES).filter(k => !game.persistent.seenFigures[k]);
    if (game.depth <= 8 && figureKeys.length > 0 && Math.random() < 0.6) {
        const tile = pickFree();
        if (tile) {
            const figureKey = pick(figureKeys);
            occupied.add(`${tile.x},${tile.y}`);
            game.npcs.push({
                x: tile.x, y: tile.y, figureKey, type: 'historical'
            });
        }
    }

    // Place Healing Items
    const healingKeys = Object.keys(HEALING_ITEMS);
    if (Math.random() < 0.7 && healingKeys.length > 0) {
        const tile = pickFree();
        if (tile) {
            const healingKey = pick(healingKeys);
            occupied.add(`${tile.x},${tile.y}`);
            game.items.push({
                x: tile.x, y: tile.y, type: 'healing', healingKey, name: HEALING_ITEMS[healingKey].name
            });
        }
    }

    // Place Gender Reveal Chests (1-2 per level)
    const numChests = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numChests; i++) {
        const tile = pickFree();
        if (!tile) break;
        occupied.add(`${tile.x},${tile.y}`);
        game.items.push({
            x: tile.x, y: tile.y, type: 'gender-reveal', name: 'Gender Reveal Chest'
        });
    }

    // Spawn enemies (more on deeper levels)
    const enemyTypes = ['troll', 'wraith', 'concern', 'police'];
    const numEnemies = 2 + Math.floor(Math.random() * 3) + Math.floor(game.depth / 2);
    for (let i = 0; i < numEnemies; i++) {
        const tile = pickFree(t => Math.abs(t.x - game.player.x) > 4); // not right next to player
        if (!tile) break;
        occupied.add(`${tile.x},${tile.y}`);

        const eType = pick(enemyTypes);
        let hp = 2;
        let mDelay = 3;
        let alertRad = 5;
        if (eType === 'wraith')  { hp = 1; mDelay = 1; alertRad = 8; }
        if (eType === 'concern') { hp = 3; mDelay = 2; alertRad = 6; }
        if (eType === 'police')  { hp = 3; mDelay = 1; alertRad = 9; }

        // Scale with depth
        hp = Math.max(1, hp + Math.floor(game.depth / 3));

        game.trolls.push({
            x: tile.x, y: tile.y,
            enemyType: eType,
            health: hp,
            maxHealth: hp,
            patrolPath: [],
            patrolIndex: 0,
            direction: Math.random() < 0.5 ? -1 : 1,
            moveDelay: 0,
            maxMoveDelay: mDelay,
            alertRadius: alertRad,
            chasingTurns: 0
        });
    }

    // A gatekeeper guarding the exit (if there's an exit)
    const exitKey = Object.keys(game.map).find(k => game.map[k] === '>');
    if (exitKey && Math.random() < 0.7) {
        const [ex, ey] = exitKey.split(',').map(Number);
        // Place gatekeeper next to exit if there's a free standing tile nearby
        const nearby = [
            { x: ex - 2, y: ey }, { x: ex + 2, y: ey },
            { x: ex - 1, y: ey }, { x: ex + 1, y: ey }
        ].filter(t =>
            game.map[`${t.x},${t.y}`] === '.' &&
            game.map[`${t.x},${t.y + 1}`] === '#' &&
            !occupied.has(`${t.x},${t.y}`)
        );
        if (nearby.length > 0) {
            const t = nearby[0];
            game.trolls.push({
                x: t.x, y: t.y,
                enemyType: 'gatekeeper',
                health: 4 + Math.floor(game.depth / 2),
                maxHealth: 4 + Math.floor(game.depth / 2),
                patrolPath: [],
                patrolIndex: 0,
                direction: 1,
                moveDelay: 0,
                maxMoveDelay: 99,
                alertRadius: 0,
                chasingTurns: 0
            });
        }
    }

    // Boss every 5 levels
    if (game.depth % 5 === 0) {
        // Spawn boss in the middle-ish of the map on the ground
        let bx = Math.floor(game.mapWidth / 2);
        let by = groundY - 1;
        // Find nearest standing position
        for (let r = 0; r < 6; r++) {
            if (game.map[`${bx},${by + 1}`] === '#' && game.map[`${bx},${by}`] === '.') break;
            bx += 1;
        }
        game.trolls.push({
            x: bx, y: by,
            enemyType: 'boss',
            health: 20 + game.depth * 2,
            maxHealth: 20 + game.depth * 2,
            patrolPath: [],
            patrolIndex: 0,
            direction: 1,
            moveDelay: 0,
            maxMoveDelay: 2,
            alertRadius: 15,
            chasingTurns: 0,
            bossPhase: 1
        });
        // Remove the easy exit; boss must be defeated for it to reappear (handled in combat)
        if (exitKey) game.map[exitKey] = '.';
    }
}
