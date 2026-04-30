import { ZINES, HISTORICAL_FIGURES, TREASURES, HEALING_ITEMS } from './data.js';

export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function buildPerimeterPath(room) {
    const {x, y, w, h} = room;
    const path = [];
    for (let px = x; px < x + w; px++) path.push({x: px, y});
    for (let py = y + 1; py < y + h; py++) path.push({x: x + w - 1, y: py});
    for (let px = x + w - 2; px >= x; px--) path.push({x: px, y: y + h - 1});
    for (let py = y + h - 2; py > y; py--) path.push({x, y: py});
    return path;
}

export function buildCorridorPatrol(room) {
    const {x, y, w, h} = room;
    const path = [];
    if (w >= h) {
        for (let px = x; px < x + w; px++) path.push({x: px, y: y + Math.floor(h/2)});
    } else {
        for (let py = y; py < y + h; py++) path.push({x: x + Math.floor(w/2), y: py});
    }
    return path;
}

export function generateMap(game) {
    game.map = {};
    game.items = [];
    game.npcs = [];
    game.trolls = [];
    
    // Fill with walls
    for (let y = 0; y < game.mapHeight; y++) {
        for (let x = 0; x < game.mapWidth; x++) {
            game.map[`${x},${y}`] = '#';
        }
    }
    
    // Create rooms
    const rooms = [];
    for (let i = 0; i < 8; i++) {
        const w = 5 + Math.floor(Math.random() * 6);
        const h = 4 + Math.floor(Math.random() * 4);
        const x = 1 + Math.floor(Math.random() * (game.mapWidth - w - 2));
        const y = 1 + Math.floor(Math.random() * (game.mapHeight - h - 2));
        
        let overlap = false;
        for (const room of rooms) {
            if (x < room.x + room.w + 2 && x + w + 2 > room.x &&
                y < room.y + room.h + 2 && y + h + 2 > room.y) {
                overlap = true;
                break;
            }
        }
        
        if (!overlap) {
            rooms.push({x, y, w, h});
            for (let ry = y; ry < y + h; ry++) {
                for (let rx = x; rx < x + w; rx++) {
                    game.map[`${rx},${ry}`] = '.';
                }
            }
        }
    }
    
    // Connect rooms
    for (let i = 1; i < rooms.length; i++) {
        const r1 = rooms[i-1];
        const r2 = rooms[i];
        const x1 = Math.floor(r1.x + r1.w/2);
        const y1 = Math.floor(r1.y + r1.h/2);
        const x2 = Math.floor(r2.x + r2.w/2);
        const y2 = Math.floor(r2.y + r2.h/2);
        
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            game.map[`${x},${y1}`] = '.';
        }
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            game.map[`${x2},${y}`] = '.';
        }
    }
    
    if (rooms.length > 0) {
        // Spawn slightly inset so platformer collision doesn't catch on tile edges
        game.player.x = Math.floor(rooms[0].x + rooms[0].w/2) + 0.15;
        game.player.y = Math.floor(rooms[0].y + rooms[0].h/2) + 0.05;
        game.player.vx = 0;
        game.player.vy = 0;
        game.player.onGround = false;
    }
    
    if (game.depth < 8 && rooms.length > 1) {
        const lastRoom = rooms[rooms.length - 1];
        const sx = Math.floor(lastRoom.x + lastRoom.w/2);
        const sy = Math.floor(lastRoom.y + lastRoom.h/2);
        game.map[`${sx},${sy}`] = '>';
    }

    // Place Zines and Guards
    const zineKeys = Object.keys(ZINES);
    const guardedRooms = [];
    const zinesThisLevel = Math.min(4, zineKeys.length);
    
    for (let i = 0; i < zinesThisLevel && rooms.length > 2; i++) {
        if (zineKeys.length > 0) {
            const availableRooms = rooms.slice(1, -1).filter(r => !guardedRooms.includes(r));
            if (availableRooms.length === 0) break;
            
            const room = pick(availableRooms);
            guardedRooms.push(room);
            
            const x = Math.floor(room.x + room.w/2);
            const y = Math.floor(room.y + room.h/2);
            const zineKey = pick(zineKeys);
            
            game.items.push({
                x, y, type: 'zine', zineKey, name: ZINES[zineKey].title
            });
            zineKeys.splice(zineKeys.indexOf(zineKey), 1);
            
            // Add a guard (often a Gatekeeper)
            let eType = Math.random() < 0.5 ? 'gatekeeper' : 'troll';
            let hp = eType === 'gatekeeper' ? 4 : 2;
            let mDelay = eType === 'gatekeeper' ? 99 : 3; // Gatekeepers don't move
            
            game.trolls.push({
                x: x + 1, y: y + 1,
                enemyType: eType,
                health: hp,
                maxHealth: hp,
                patrolPath: [{x: x + 1, y: y + 1}, {x: x - 1, y: y - 1}],
                patrolIndex: 0,
                direction: 1,
                moveDelay: 0,
                maxMoveDelay: mDelay,
                alertRadius: eType === 'gatekeeper' ? 0 : 4,
                chasingTurns: 0
            });
        }
    }

    // Place Random Enemies — pool grows with depth
    const baseTypes = ['troll', 'wraith', 'concern', 'police'];
    const advancedTypes = ['swarm', 'bigot'];
    const enemyPool = game.depth >= 3 ? baseTypes.concat(advancedTypes) : baseTypes;

    for (const room of rooms.slice(1)) {
        if (game.depth % 5 === 0 && room === rooms[rooms.length - 1]) continue;

        // Density rises with depth, capped
        const baseCount = Math.min(4, 1 + Math.floor(game.depth / 2));
        const numEnemies = Math.floor(Math.random() * baseCount);
        for (let i = 0; i < numEnemies; i++) {
            const rx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const ry = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

            if (game.map[`${rx},${ry}`] === '>' || game.items.some(it => it.x === rx && it.y === ry)) continue;
            if (game.trolls.some(t => t.x === rx && t.y === ry)) continue;

            const eType = pick(enemyPool);
            let hp = 2, mDelay = 3, alertRad = 4;

            if (eType === 'wraith')    { hp = 1; mDelay = 1; alertRad = 8; }
            if (eType === 'concern')   { hp = 3; mDelay = 2; alertRad = 6; }
            if (eType === 'police')    { hp = 3; mDelay = 1; alertRad = 9; }
            if (eType === 'swarm')     { hp = 1; mDelay = 1; alertRad = 7; }
            if (eType === 'bigot')     { hp = 2; mDelay = 4; alertRad = 6; }

            hp = Math.max(1, hp + Math.floor(game.depth / 3));

            game.trolls.push({
                x: rx, y: ry,
                enemyType: eType,
                health: hp,
                maxHealth: hp,
                patrolPath: [{x: rx, y: ry}, {x: rx + (Math.random()<0.5?-1:1), y: ry + (Math.random()<0.5?-1:1)}],
                patrolIndex: 0,
                direction: 1,
                moveDelay: 0,
                maxMoveDelay: mDelay,
                alertRadius: alertRad,
                chasingTurns: 0
            });
        }
    }

    // Place Historical Figures
    const figureKeys = Object.keys(HISTORICAL_FIGURES);
    if (game.depth <= 8 && figureKeys.length > 0 && rooms.length > 3) {
        const figureKey = pick(figureKeys);
        const availableRooms = rooms.filter(r => !guardedRooms.includes(r) && rooms.indexOf(r) !== 0);
        if (availableRooms.length > 0) {
            const room = pick(availableRooms);
            guardedRooms.push(room);
            const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            
            game.npcs.push({
                x, y, figureKey: figureKey, type: 'historical'
            });
        }
    }

    // Place Healing Items
    const healingKeys = Object.keys(HEALING_ITEMS);
    const remainingRooms = rooms.filter(r => !guardedRooms.includes(r) && rooms.indexOf(r) !== 0);
    if (remainingRooms.length > 0 && healingKeys.length > 0) {
        const room = pick(remainingRooms);
        const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        const healingKey = pick(healingKeys);
        game.items.push({
            x, y, type: 'healing', healingKey, name: HEALING_ITEMS[healingKey].name
        });
    }

    // Place Gender Reveal Chests
    for (const room of rooms.slice(1)) {
        if (Math.random() < 0.25) { // 25% chance per room
            const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            // Don't overlap stairs or other items roughly
            if (game.map[`${x},${y}`] !== '>') {
                game.items.push({
                    x, y, type: 'gender-reveal', name: 'Gender Reveal Chest'
                });
            }
        }
    }

    // Spawn Boss if Depth is a multiple of 5
    if (game.depth % 5 === 0) {
        const bossRoom = rooms[rooms.length - 1];
        const bx = Math.floor(bossRoom.x + bossRoom.w / 2);
        const by = Math.floor(bossRoom.y + bossRoom.h / 2);
        
        // Remove the stairs so they have to kill the boss
        game.map[`${bx},${by}`] = '.'; 

        game.trolls.push({
            x: bx, y: by,
            enemyType: 'boss',
            health: 20,
            maxHealth: 20,
            patrolPath: [{x: bx, y: by}],
            patrolIndex: 0,
            direction: 1,
            moveDelay: 0,
            maxMoveDelay: 2,
            alertRadius: 10,
            chasingTurns: 0,
            bossPhase: 1
        });
    }
}
