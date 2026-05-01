import { ZINES, HISTORICAL_FIGURES, TREASURES, HEALING_ITEMS } from './data.js';

export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Tile types:
//   '#' solid wall          (blocks all movement)
//   '.' empty space         (passable)
//   '=' one-way platform    (solid only when falling onto it from above)
//   '>' stairs down         (passable; triggers descent on USE)
//   '^' spikes              (passable; touching it damages the player)
//   '~' ice                 (solid floor; very low friction on top)
//   'T' trampoline          (solid floor; landing on it bounces sky-high)
//   'C' crumbling platform  (one-way; collapses ~0.5s after first contact)

const ROOMS_X = 4;
const ROOMS_Y = 3;
const ROOM_W = 10;
const ROOM_H = 10;

function fillRect(map, x, y, w, h, ch) {
    for (let j = y; j < y + h; j++)
        for (let i = x; i < x + w; i++)
            map[`${i},${j}`] = ch;
}

function carveRoomShell(map, rx, ry) {
    const x = rx * ROOM_W;
    const y = ry * ROOM_H;
    fillRect(map, x + 1, y + 1, ROOM_W - 2, ROOM_H - 2, '.');
    fillRect(map, x, y, ROOM_W, 1, '#');                // ceiling
    fillRect(map, x, y + ROOM_H - 2, ROOM_W, 2, '#');   // 2-thick floor
    for (let j = y; j < y + ROOM_H; j++) {
        map[`${x},${j}`] = '#';
        map[`${x + ROOM_W - 1},${j}`] = '#';
    }
}

function carveDoor(map, x, y, height = 3) {
    for (let j = 0; j < height; j++) map[`${x},${y - j}`] = '.';
}

function placePlatform(map, x, y, w) {
    for (let i = 0; i < w; i++) {
        const k = `${x + i},${y}`;
        if (map[k] === '.') map[k] = '=';
    }
}

function populateRoomInterior(map, rx, ry) {
    const x = rx * ROOM_W + 1;
    const y = ry * ROOM_H + 1;
    const w = ROOM_W - 2;
    const h = ROOM_H - 2;

    const numPlats = 1 + Math.floor(Math.random() * 3);
    const placedRows = new Set();
    for (let p = 0; p < numPlats; p++) {
        const row = y + 2 + Math.floor(Math.random() * Math.max(1, h - 4));
        if (placedRows.has(row)) continue;
        placedRows.add(row);
        const pw = 2 + Math.floor(Math.random() * 4);
        const px = x + 1 + Math.floor(Math.random() * Math.max(1, w - pw - 2));
        placePlatform(map, px, row, pw);
    }
}

// Drop hazards into a finished room. Depth gates each kind so early floors
// stay fair. Hazards never block the room exits — those tiles are 1-from-wall.
function decorateRoomWithHazards(map, rx, ry, depth) {
    const floorTopY  = ry * ROOM_H + ROOM_H - 2;        // top tile of the 2-thick floor
    const standingY  = floorTopY - 1;                   // row the player walks on
    const innerStart = rx * ROOM_W + 2;
    const innerEnd   = (rx + 1) * ROOM_W - 2;

    // Spike pit (depth 2+): replace a stretch of the standing row with '^'.
    if (depth >= 2 && Math.random() < 0.30) {
        const span = 1 + Math.floor(Math.random() * 2);
        const sx = innerStart + Math.floor(Math.random() * Math.max(1, innerEnd - innerStart - span));
        for (let i = 0; i < span; i++) {
            const k = `${sx + i},${standingY}`;
            if (map[k] === '.') map[k] = '^';
        }
    }

    // Ice patch (depth 3+): swap a stretch of floor-top to '~'.
    if (depth >= 3 && Math.random() < 0.25) {
        const span = 2 + Math.floor(Math.random() * 3);
        const sx = innerStart + Math.floor(Math.random() * Math.max(1, innerEnd - innerStart - span));
        for (let i = 0; i < span; i++) {
            const k = `${sx + i},${floorTopY}`;
            if (map[k] === '#') map[k] = '~';
        }
    }

    // Trampoline (depth 3+): single floor-top swap.
    if (depth >= 3 && Math.random() < 0.18) {
        const tx = innerStart + Math.floor(Math.random() * Math.max(1, innerEnd - innerStart));
        const k = `${tx},${floorTopY}`;
        if (map[k] === '#') map[k] = 'T';
    }

    // Crumbling platforms (depth 2+): convert one of the room's '=' tiles to 'C'.
    if (depth >= 2 && Math.random() < 0.35) {
        const candidates = [];
        for (let j = ry * ROOM_H + 1; j < floorTopY; j++) {
            for (let i = rx * ROOM_W + 1; i < (rx + 1) * ROOM_W - 1; i++) {
                if (map[`${i},${j}`] === '=') candidates.push([i, j]);
            }
        }
        if (candidates.length > 0) {
            const [cx, cy] = candidates[Math.floor(Math.random() * candidates.length)];
            map[`${cx},${cy}`] = 'C';
        }
    }
}

function roomFloorY(ry)  { return ry * ROOM_H + ROOM_H - 2; } // top of solid floor
function roomCenterX(rx) { return rx * ROOM_W + Math.floor(ROOM_W / 2); }

export function generateMap(game) {
    game.map = {};
    game.items = [];
    game.npcs = [];
    game.trolls = [];

    game.mapWidth = ROOMS_X * ROOM_W;
    game.mapHeight = ROOMS_Y * ROOM_H;

    fillRect(game.map, 0, 0, game.mapWidth, game.mapHeight, '#');

    const roomList = [];
    for (let ry = 0; ry < ROOMS_Y; ry++) {
        for (let rx = 0; rx < ROOMS_X; rx++) {
            carveRoomShell(game.map, rx, ry);
            populateRoomInterior(game.map, rx, ry);
            roomList.push({ rx, ry });
        }
    }

    // Reset crumble timers (lives in game state, not the map dictionary).
    game.crumbleState = {};
    // Decorate every room except the spawn room with hazards (depth-gated).
    for (let i = 1; i < roomList.length; i++) {
        const { rx, ry } = roomList[i];
        decorateRoomWithHazards(game.map, rx, ry, game.depth);
    }

    // Horizontal connections at floor level — open both adjacent walls
    for (let ry = 0; ry < ROOMS_Y; ry++) {
        for (let rx = 0; rx < ROOMS_X - 1; rx++) {
            const wallX = (rx + 1) * ROOM_W - 1;
            const sharedX = (rx + 1) * ROOM_W;
            const floor = roomFloorY(ry) - 1;
            carveDoor(game.map, wallX, floor, 3);
            carveDoor(game.map, sharedX, floor, 3);
        }
    }

    // Vertical shafts — replace the floor tile with a one-way platform so
    // the player can drop through with Down+Jump but lands on it from above.
    for (let rx = 0; rx < ROOMS_X; rx++) {
        for (let ry = 0; ry < ROOMS_Y - 1; ry++) {
            const cx = roomCenterX(rx);
            const upperFloor = roomFloorY(ry);
            game.map[`${cx},${upperFloor}`] = '='; // The floor you stand on
            game.map[`${cx},${upperFloor + 1}`] = '.'; // The bottom half of the thick floor
            game.map[`${cx},${upperFloor + 2}`] = '.'; // The ceiling of the room below!
        }
    }

    // Spawn the player on the top-left room's floor.
    const spawnRoom = roomList[0];
    game.player.x = roomCenterX(spawnRoom.rx) + 0.15;
    game.player.y = roomFloorY(spawnRoom.ry) - 1;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.onGround = true;

    const exitRoom = roomList[roomList.length - 1];
    const exitX = roomCenterX(exitRoom.rx);
    const exitY = roomFloorY(exitRoom.ry) - 1;
    if (game.depth < 8) game.map[`${exitX},${exitY}`] = '>';

    // Content placement — pop random rooms (excluding spawn) for set pieces
    const usable = roomList.slice(1);
    function popRandomRoom() {
        if (usable.length === 0) return null;
        const idx = Math.floor(Math.random() * usable.length);
        return usable.splice(idx, 1)[0];
    }
    function inRoomFloorTile(room) {
        const cx = roomCenterX(room.rx) + Math.floor(Math.random() * 5) - 2;
        const cy = roomFloorY(room.ry) - 1;
        return { x: cx, y: cy };
    }

    const zineKeys = Object.keys(ZINES);
    const zinesThisLevel = Math.min(3, zineKeys.length, usable.length);
    for (let i = 0; i < zinesThisLevel; i++) {
        const room = popRandomRoom();
        if (!room) break;
        const pos = inRoomFloorTile(room);
        const zineKey = pick(zineKeys);
        zineKeys.splice(zineKeys.indexOf(zineKey), 1);
        game.items.push({ x: pos.x, y: pos.y, type: 'zine', zineKey, name: ZINES[zineKey].title });

        const eType = Math.random() < 0.5 ? 'gatekeeper' : 'troll';
        const hp = eType === 'gatekeeper' ? 4 : 2;
        const mDelay = eType === 'gatekeeper' ? 99 : 3;
        game.trolls.push({
            x: pos.x + 1, y: pos.y,
            enemyType: eType, health: hp, maxHealth: hp,
            patrolPath: [], patrolIndex: 0, direction: 1,
            moveDelay: 0, maxMoveDelay: mDelay,
            alertRadius: eType === 'gatekeeper' ? 0 : 4,
            chasingTurns: 0
        });
    }

    const figureKeys = Object.keys(HISTORICAL_FIGURES).filter(k => !game.persistent.seenFigures[k]);
    if (game.depth <= 8 && figureKeys.length > 0 && usable.length > 0) {
        const room = popRandomRoom();
        const pos = inRoomFloorTile(room);
        const figureKey = pick(figureKeys);
        game.npcs.push({ x: pos.x, y: pos.y, figureKey, type: 'historical' });
    }

    const healingKeys = Object.keys(HEALING_ITEMS);
    if (usable.length > 0 && healingKeys.length > 0) {
        const room = popRandomRoom();
        const pos = inRoomFloorTile(room);
        const healingKey = pick(healingKeys);
        game.items.push({ x: pos.x, y: pos.y, type: 'healing', healingKey, name: HEALING_ITEMS[healingKey].name });
    }

    const baseTypes = ['troll', 'wraith', 'concern', 'police'];
    const advancedTypes = ['swarm', 'bigot'];
    const enemyPool = game.depth >= 3 ? baseTypes.concat(advancedTypes) : baseTypes;

    for (const room of usable) {
        const baseCount = Math.min(3, 1 + Math.floor(game.depth / 2));
        const numEnemies = Math.floor(Math.random() * baseCount);
        for (let i = 0; i < numEnemies; i++) {
            const cx = roomCenterX(room.rx) + Math.floor(Math.random() * 5) - 2;
            const cy = roomFloorY(room.ry) - 1;
            const tile = game.map[`${cx},${cy}`];
            if (tile !== '.' && tile !== '>') continue;
            if (game.trolls.some(t => t.x === cx && t.y === cy)) continue;

            const eType = pick(enemyPool);
            let hp = 2, mDelay = 3, alertRad = 4;
            if (eType === 'wraith')  { hp = 1; mDelay = 1; alertRad = 8; }
            if (eType === 'concern') { hp = 3; mDelay = 2; alertRad = 6; }
            if (eType === 'police')  { hp = 3; mDelay = 1; alertRad = 9; }
            if (eType === 'swarm')   { hp = 1; mDelay = 1; alertRad = 7; }
            if (eType === 'bigot')   { hp = 2; mDelay = 4; alertRad = 6; }
            hp = Math.max(1, hp + Math.floor(game.depth / 3));

            game.trolls.push({
                x: cx, y: cy,
                enemyType: eType, health: hp, maxHealth: hp,
                patrolPath: [], patrolIndex: 0, direction: 1,
                moveDelay: 0, maxMoveDelay: mDelay,
                alertRadius: alertRad, chasingTurns: 0
            });
        }

        // Reward chest perched on the highest platform when present
        if (Math.random() < 0.25) {
            let placed = false;
            for (let j = room.ry * ROOM_H + 1; j < (room.ry + 1) * ROOM_H - 2 && !placed; j++) {
                for (let i = room.rx * ROOM_W + 1; i < (room.rx + 1) * ROOM_W - 1; i++) {
                    if (game.map[`${i},${j}`] === '=') {
                        game.items.push({ x: i, y: j - 1, type: 'gender-reveal', name: 'Gender Reveal Chest' });
                        placed = true;
                        break;
                    }
                }
            }
            if (!placed) {
                const pos = inRoomFloorTile(room);
                game.items.push({ x: pos.x, y: pos.y, type: 'gender-reveal', name: 'Gender Reveal Chest' });
            }
        }
    }

    if (game.depth % 5 === 0) {
        const bossX = roomCenterX(exitRoom.rx);
        const bossY = roomFloorY(exitRoom.ry) - 1;
        game.map[`${bossX},${bossY}`] = '.';
        game.trolls.push({
            x: bossX, y: bossY,
            enemyType: 'boss',
            health: 20, maxHealth: 20,
            patrolPath: [], patrolIndex: 0, direction: 1,
            moveDelay: 0, maxMoveDelay: 2,
            alertRadius: 10, chasingTurns: 0, bossPhase: 1
        });
    }
}
