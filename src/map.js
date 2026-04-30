import { ZINES, HISTORICAL_FIGURES, TREASURES, HEALING_ITEMS } from './data.js';

export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMap(game) {
    game.map = {};
    game.items = [];
    game.npcs = [];
    game.trolls = [];
    
    // 1. Fill background with 'empty' (walls)
    // In our platformer, # is solid wall/floor, . is air.
    for (let y = 0; y < game.mapHeight; y++) {
        for (let x = 0; x < game.mapWidth; x++) {
            game.map[`${x},${y}`] = '#';
        }
    }

    // 2. Carve out the main "sky" area
    for (let y = 2; y < game.mapHeight - 2; y++) {
        for (let x = 2; x < game.mapWidth - 2; x++) {
            game.map[`${x},${y}`] = '.';
        }
    }

    // 3. Generate Platforms
    const platforms = [];
    
    // Start Floor
    const startY = game.mapHeight - 6;
    platforms.push({x: 2, y: startY, w: 6, h: 2});
    
    // Exit Platform (Stairs)
    const exitY = 6;
    const exitX = game.mapWidth - 8;
    platforms.push({x: exitX, y: exitY, w: 6, h: 2});

    // Random Procedural Platforms
    // We want to ensure we can reach the top from the bottom.
    let currentX = 5;
    let currentY = startY;
    
    while (currentY > exitY + 2) {
        const nextW = 4 + Math.floor(Math.random() * 6);
        const nextH = 1;
        
        // Jump distance limits
        const dx = (Math.random() - 0.5) * 12; // Max horizontal jump/move
        const dy = -(3 + Math.floor(Math.random() * 3)); // Max vertical jump
        
        const nextX = Math.max(2, Math.min(game.mapWidth - nextW - 2, Math.floor(currentX + dx)));
        currentY += dy;
        
        platforms.push({x: nextX, y: currentY, w: nextW, h: nextH});
        currentX = nextX;
    }

    // Add some random "filler" platforms for exploration
    for (let i = 0; i < 15; i++) {
        const w = 3 + Math.floor(Math.random() * 5);
        const h = 1;
        const x = 2 + Math.floor(Math.random() * (game.mapWidth - w - 4));
        const y = 5 + Math.floor(Math.random() * (game.mapHeight - 10));
        platforms.push({x, y, w, h});
    }

    // Draw platforms into the map
    platforms.forEach(p => {
        for (let py = p.y; py < p.y + p.h; py++) {
            for (let px = p.x; px < p.x + p.w; px++) {
                game.map[`${px},${py}`] = '#';
            }
        }
    });

    // Set Player Start
    game.player.x = platforms[0].x + 2;
    game.player.y = platforms[0].y - 2;
    game.player.vy = 0;
    game.player.vx = 0;

    // Set Exit
    const lastP = platforms[1]; // Exit platform
    const ex = lastP.x + Math.floor(lastP.w / 2);
    const ey = lastP.y - 1;
    game.map[`${ex},${ey}`] = '>';

    // 4. Place Items and Entities on Platforms
    const zineKeys = [...Object.keys(ZINES)];
    const figureKeys = [...Object.keys(HISTORICAL_FIGURES)];
    const healingKeys = Object.keys(HEALING_ITEMS);

    platforms.slice(2).forEach((p, index) => {
        const x = p.x + Math.floor(p.w / 2);
        const y = p.y - 1;

        if (index % 5 === 0 && zineKeys.length > 0) {
            // Place Zine
            const zineKey = zineKeys.pop();
            game.items.push({ x, y, type: 'zine', zineKey, name: ZINES[zineKey].title });
        } else if (index % 7 === 0 && figureKeys.length > 0) {
            // Place Historical Figure
            const figureKey = figureKeys.pop();
            game.npcs.push({ x, y, figureKey, type: 'historical' });
        } else if (Math.random() < 0.2) {
            // Place Enemy
            const eTypes = ['troll', 'wraith', 'police'];
            const eType = pick(eTypes);
            let hp = 2 + Math.floor(game.depth / 4);
            game.trolls.push({
                x, y, enemyType: eType, health: hp, maxHealth: hp,
                moveDelay: 0, maxMoveDelay: eType === 'police' ? 1 : 3,
                alertRadius: 6, chasingTurns: 0
            });
        } else if (Math.random() < 0.15) {
            // Place Healing Item
            const hKey = pick(healingKeys);
            game.items.push({ x, y, type: 'healing', healingKey: hKey, name: HEALING_ITEMS[hKey].name });
        } else if (Math.random() < 0.1) {
            // Place Gender Reveal Chest
            game.items.push({ x, y, type: 'gender-reveal', name: 'Gender Reveal Chest' });
        }
    });

    // Ensure we have at least one figure per level if possible
    if (game.npcs.length === 0 && figureKeys.length > 0) {
        const p = pick(platforms.slice(2));
        game.npcs.push({ x: p.x + 1, y: p.y - 1, figureKey: pick(figureKeys), type: 'historical' });
    }
}
