import { ZINES, HISTORICAL_FIGURES, HEALING_ITEMS, ECHO_KEYS, COMPANION_KEYS } from './data.js';

const MURAL_MESSAGES = [
    "You are powerful, you are loved",
    "Chosen family is real family",
    "We mother each other",
    "The mountains remember us",
    "Trans joy is resistance",
    "Ballroom is our home",
    "STAR House never closes",
    "Walk your truth, honey",
    "Mother is not a noun — it's a verb",
    "Aaji Cha Ghar: Grandma's Home",
    "Casa de las Muñecas — we shelter our own",
    "Motherhood belongs to us",
    "Every house is built on love",
    // Drawn from the lineage: real words, scrawled where the demolition crews can't reach.
    "No one dies alone while I'm standing — K. Cuevas",
    "Family is a verb. Conjugate it daily.",
    "I am happy because I am a lady, a mother, a grandmother — M. Muñoz",
    "It's not about manners. It's about love. — Mama Gloria",
    "Pay it no mind, but never let it go unsaid",
    "We were sacred before they told us we were wrong",
    "23 children. Not one of them I turned away.",
    "Stay close. Stay quiet. Get past them. We need you deeper.",
    "They struck our names from the records. We carved them here.",
    // The deeper shelves — the Archive holds whole stories, not just zines.
    "The Archive keeps more than zines. It keeps whole stories. Some are leaking.",
    "If you find a room that's flickering — someone's still inside it. Say hello.",
    "Fin is the part of Lu that lived. Every echo has one of those. Find it.",
    "The signal doesn't stop just because the broadcast does.",
    "A story that didn't survive intact is still a story. Hold it anyway."
];

export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Tile types:
//   '#' solid wall          (blocks all movement)
//   '.' empty space         (passable)
//   '=' one-way platform    (solid only when falling onto it from above)
//   '>' stairs down         (passable; triggers descent on USE)
//   '~' ice                 (solid floor; very low friction on top)
//   'T' trampoline          (solid floor; landing on it bounces sky-high)
//   'C' crumbling platform  (one-way; collapses ~0.5s after first contact)

const ROOMS_X = 4;
const ROOMS_Y = 3;
const ROOM_W = 10;
const ROOM_H = 10;

// ── Layout archetypes ── Each descent rolls a different grid silhouette so no
// two floors feel the same. Deeper floors unlock the larger, more vertical
// shapes. `motifs` is the pool of interior styles rooms on this floor draw from.
const LAYOUTS = [
    { name: 'classic',  cols: 4, rows: 3, motifs: ['scatter', 'islands'] },
    { name: 'wide',     cols: 5, rows: 3, motifs: ['scatter', 'staircase', 'islands'] },
    { name: 'tall',     cols: 3, rows: 4, motifs: ['ledges', 'staircase', 'scatter'] },
    { name: 'sprawl',   cols: 4, rows: 4, motifs: ['scatter', 'islands', 'ledges'] },
    { name: 'gauntlet', cols: 5, rows: 2, motifs: ['staircase', 'islands'] },
    { name: 'warren',   cols: 3, rows: 3, motifs: ['scatter', 'staircase', 'ledges'] },
    // Castle architecture — PRIME's citadels. Great halls with pillars,
    // climbable watchtowers, crenellated ramparts.
    { name: 'keep',     cols: 4, rows: 3, motifs: ['hall', 'towers', 'ramparts'], castle: true },
    { name: 'citadel',  cols: 5, rows: 4, motifs: ['towers', 'hall', 'ledges'],   castle: true }
];
function pickLayout(depth) {
    // Castle floors appear from depth 3 and get more common the deeper you go.
    const castles = LAYOUTS.filter(l => l.castle);
    if (depth >= 3 && Math.random() < Math.min(0.6, 0.2 + depth * 0.05)) {
        const cPool = depth >= 5 ? castles : castles.filter(l => l.cols * l.rows <= 12);
        if (cPool.length) return pick(cPool);
    }
    // Keep early floors compact; open up the big vertical sprawls deeper down.
    const open = LAYOUTS.filter(l => !l.castle);
    const pool = (depth >= 5) ? open : open.filter(l => l.cols * l.rows <= 16);
    return pick(pool.length ? pool : open);
}

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

function populateRoomInterior(map, rx, ry, motif = 'scatter', depth = 1) {
    const x = rx * ROOM_W + 1;
    const y = ry * ROOM_H + 1;
    const w = ROOM_W - 2;
    const h = ROOM_H - 2;
    const floorTop = ry * ROOM_H + ROOM_H - 2;

    if (motif === 'staircase') {
        // Diagonal run of short ledges — rhythmic, jump-friendly.
        const dir = Math.random() < 0.5 ? 1 : -1;
        let px = dir > 0 ? x + 1 : x + w - 3;
        let py = floorTop - 2;
        for (let s = 0; s < 4 && py > y + 1; s++) {
            placePlatform(map, px, py, 2);
            px += dir * 2; py -= 2;
            if (px < x + 1 || px > x + w - 2) break;
        }
    } else if (motif === 'islands') {
        // Scattered floating one-way islands at varied heights.
        const n = 2 + Math.floor(Math.random() * 2);
        for (let p = 0; p < n; p++) {
            const pw = 2 + Math.floor(Math.random() * 3);
            const pxv = x + 1 + Math.floor(Math.random() * Math.max(1, w - pw - 1));
            const pyv = y + 1 + Math.floor(Math.random() * Math.max(1, h - 3));
            placePlatform(map, pxv, pyv, pw);
        }
    } else if (motif === 'ledges') {
        // Alternating wall ledges climbing upward — wall-to-wall hops.
        for (let s = 0, py = floorTop - 2; py > y + 1; s++, py -= 2) {
            const pw = 3;
            const pxv = (s % 2 === 0) ? x + 1 : x + w - pw - 1;
            placePlatform(map, pxv, py, pw);
        }
    } else if (motif === 'hall') {
        // Castle great-hall: a long mid-height gallery plus 2-tall floor
        // pillars you hop over. Pillars stay off the room-edge door columns.
        placePlatform(map, x + 1, y + Math.floor(h / 2), w - 2);
        for (let px2 = x + 2; px2 <= x + w - 3; px2 += 3) {
            if (map[`${px2},${floorTop - 1}`] !== '.') continue;
            map[`${px2},${floorTop - 1}`] = '#';
            map[`${px2},${floorTop - 2}`] = '#';
        }
    } else if (motif === 'towers') {
        // Twin watchtowers: stacked one-way landings climbing both side walls.
        for (const tx of [x + 1, x + w - 4]) {
            for (let py2 = floorTop - 2; py2 > y + 1; py2 -= 2) placePlatform(map, tx, py2, 3);
        }
    } else if (motif === 'ramparts') {
        // Battlements: a high crenellated walkway with a mid landing to reach it.
        const wy = y + 2;
        for (let i = x + 1; i < x + w - 1; i++) {
            if ((i - x) % 3 !== 0) {
                const k = `${i},${wy}`;
                if (map[k] === '.') map[k] = '=';
            }
        }
        placePlatform(map, x + Math.floor(w / 2) - 1, y + Math.floor(h / 2) + 1, 3);
    } else {
        // 'scatter' — the original random platforms.
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
}

// Drop hazards into a finished room. Depth gates each kind so early floors
// stay fair. Hazards never block the room exits — those tiles are 1-from-wall.
function decorateRoomWithHazards(map, rx, ry, depth) {
    const floorTopY  = ry * ROOM_H + ROOM_H - 2;        // top tile of the 2-thick floor
    const standingY  = floorTopY - 1;                   // row the player walks on
    const innerStart = rx * ROOM_W + 2;
    const innerEnd   = (rx + 1) * ROOM_W - 2;

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

    // Special room tracking for rendering and mechanics
    game.hearthRooms = new Set();
    game.safeShelterRooms = new Set();
    game.ballroomRooms = new Set();
    game.starHouseRooms = new Set();
    game.charmSchoolRooms = new Set();
    game.echoRooms = new Set();
    game.muralTiles = {};
    game.projectiles = [];
    game.vault = null;
    // Per-floor Zelda-kit state: small keys and the map/compass reset each floor.
    game.player.keysHeld = 0;
    game.player.hasMap = false;
    game.player.hasCompass = false;

    // Roll this floor's layout archetype. Shadow the module defaults so every
    // reference below (loops, shafts, connections) uses the per-floor grid.
    const layout = pickLayout(game.depth);
    const ROOMS_X = layout.cols;
    const ROOMS_Y = layout.rows;
    game.layoutName = layout.name;
    game.castleFloor = !!layout.castle;
    const motifPool = layout.motifs || ['scatter'];

    game.mapWidth = ROOMS_X * ROOM_W;
    game.mapHeight = ROOMS_Y * ROOM_H;

    fillRect(game.map, 0, 0, game.mapWidth, game.mapHeight, '#');

    const roomList = [];
    for (let ry = 0; ry < ROOMS_Y; ry++) {
        for (let rx = 0; rx < ROOMS_X; rx++) {
            carveRoomShell(game.map, rx, ry);
            populateRoomInterior(game.map, rx, ry, pick(motifPool), game.depth);
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
            // Widen the hole to 3 tiles so the player doesn't snag on the edges and get snapped back up.
            for (let i = -1; i <= 1; i++) {
                game.map[`${cx + i},${upperFloor}`] = '='; // The floor you stand on
                game.map[`${cx + i},${upperFloor + 1}`] = '.'; // The bottom half of the thick floor
                game.map[`${cx + i},${upperFloor + 2}`] = '.'; // The ceiling of the room below!
            }
        }
    }

    // Spawn the player on the top-left room's floor.
    const spawnRoom = roomList[0];
    game.player.x = roomCenterX(spawnRoom.rx) + 0.15;
    game.player.y = roomFloorY(spawnRoom.ry) - 1;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.onGround = true;
    game.player.climbing = false;

    const exitRoom = roomList[roomList.length - 1];
    const exitX = roomCenterX(exitRoom.rx);
    const exitY = roomFloorY(exitRoom.ry) - 1;
    // Depth 10 is the floor of THE CORE (zone starts at 9) — the final boss
    // floor, so no stairs beyond it. The old cap of 8 made THE CORE and its
    // story card unreachable even though the intro and zone table promise it.
    if (game.depth < 10) game.map[`${exitX},${exitY}`] = '>';

    // Content placement — pop random rooms (excluding spawn) for set pieces
    const usable = roomList.slice(1);
    function popRandomRoom() {
        if (usable.length === 0) return null;
        const idx = Math.floor(Math.random() * usable.length);
        return usable.splice(idx, 1)[0];
    }
    function inRoomFloorTile(room) {
        // Retry a few offsets so set-pieces never embed in pillars or crates.
        const cy = roomFloorY(room.ry) - 1;
        for (let t = 0; t < 8; t++) {
            const cx = roomCenterX(room.rx) + Math.floor(Math.random() * 5) - 2;
            const tile = game.map[`${cx},${cy}`];
            if (tile === '.' || tile === '>') return { x: cx, y: cy };
        }
        return { x: roomCenterX(room.rx), y: cy };
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

    // Exclude NPCs already placed in special rooms this run
    const alreadyPlaced = new Set(game.npcs.map(n => n.figureKey));
    const figureKeys = Object.keys(HISTORICAL_FIGURES).filter(k =>
        !game.persistent.seenFigures[k] && !alreadyPlaced.has(k)
    );
    if (figureKeys.length > 0 && usable.length > 0) {
        const room = popRandomRoom();
        if (room) {
            const pos = inRoomFloorTile(room);
            const figureKey = pick(figureKeys);
            game.npcs.push({ x: pos.x, y: pos.y, figureKey, type: 'historical' });
        }
    }

    const healingKeys = Object.keys(HEALING_ITEMS);
    if (usable.length > 0 && healingKeys.length > 0) {
        const room = popRandomRoom();
        const pos = inRoomFloorTile(room);
        const healingKey = pick(healingKeys);
        game.items.push({ x: pos.x, y: pos.y, type: 'healing', healingKey, name: HEALING_ITEMS[healingKey].name });
    }

    // ── Hearth room (every 3 levels) ─────────────────────────────────────────
    // Warm community space: campfire, community_mothers NPC, Hearth Stone item.
    // Enemies will not path into these rooms (checked in main.js processTurn).
    const isHearthLevel = game.depth % 3 === 0;
    if (isHearthLevel && usable.length > 0) {
        const hearthRoom = popRandomRoom();
        const roomKey = `${hearthRoom.rx},${hearthRoom.ry}`;
        game.hearthRooms.add(roomKey);
        const pos = inRoomFloorTile(hearthRoom);
        if (!game.persistent.seenFigures['community_mothers']) {
            game.npcs.push({ x: pos.x, y: pos.y, figureKey: 'community_mothers', type: 'historical' });
        }
        // Spawn a Hearth Stone item near the campfire
        const stoneX = roomCenterX(hearthRoom.rx) + 2;
        const stoneY = roomFloorY(hearthRoom.ry) - 1;
        game.items.push({
            x: stoneX, y: stoneY,
            type: 'loot', tier: 'legendary',
            name: 'Hearth Stone',
            scrap: 20, effect: 'hearth_stone',
            color: '#FFD700', glow: '#FFD700'
        });
    }

    // ── Safe Shelter room ─────────────────────────────────────────────────────
    // Trans flag blue/pink tint; enemies won't enter; slow heal inside.
    if (usable.length > 0 && Math.random() < 0.55) {
        const shelterRoom = popRandomRoom();
        game.safeShelterRooms.add(`${shelterRoom.rx},${shelterRoom.ry}`);
        // Peyton O'Connor spawns in the safe room on even depths
        if (game.depth % 2 === 0 && !game.persistent.seenFigures['peyton_oconner']) {
            const pos = inRoomFloorTile(shelterRoom);
            game.npcs.push({ x: pos.x, y: pos.y, figureKey: 'peyton_oconner', type: 'historical' });
        }
    }

    // ── Ballroom room (every 4th depth starting at 2) ────────────────────────
    // Gold-shimmer space where enemies can't enter; Ballroom NPCs spawn here.
    const isBallroomLevel = game.depth >= 2 && game.depth % 4 === 2;
    if (isBallroomLevel && usable.length > 0) {
        const ballroomRoom = popRandomRoom();
        game.ballroomRooms.add(`${ballroomRoom.rx},${ballroomRoom.ry}`);
        const ballroomFigures = ['crystal_labeija', 'angie_xtravaganza', 'mj_rodriguez'];
        const availBallroom = ballroomFigures.filter(k => !game.persistent.seenFigures[k]);
        if (availBallroom.length > 0) {
            const pos = inRoomFloorTile(ballroomRoom);
            game.npcs.push({ x: pos.x, y: pos.y, figureKey: pick(availBallroom), type: 'historical' });
        }
        game.items.push({
            x: roomCenterX(ballroomRoom.rx) + 2, y: roomFloorY(ballroomRoom.ry) - 1,
            type: 'loot', tier: 'legendary',
            name: "LaBeija's Trophy",
            scrap: 20, effect: 'labeija_trophy',
            color: '#FFD700', glow: '#FFD700'
        });
    }

    // ── STAR House room (every 5th depth starting at 3) ─────────────────────
    // Red/orange activist space; community shelter NPCs spawn here.
    const isStarHouseLevel = game.depth >= 3 && game.depth % 5 === 3;
    if (isStarHouseLevel && usable.length > 0) {
        const starRoom = popRandomRoom();
        game.starHouseRooms.add(`${starRoom.rx},${starRoom.ry}`);
        const starFigures = ['kenya_cuevas', 'cleopatra_kambugu', 'mariela_munoz'];
        const availStar = starFigures.filter(k => !game.persistent.seenFigures[k]);
        if (availStar.length > 0) {
            const pos = inRoomFloorTile(starRoom);
            game.npcs.push({ x: pos.x, y: pos.y, figureKey: pick(availStar), type: 'historical' });
        }
        game.items.push({
            x: roomCenterX(starRoom.rx) - 2, y: roomFloorY(starRoom.ry) - 1,
            type: 'loot', tier: 'rare',
            name: 'STAR House Key',
            scrap: 4, effect: 'star_key',
            color: '#FF4500', glow: '#FF8C00'
        });
    }

    // ── Charm School room (30% random chance) ────────────────────────────────
    // Warm-teal teaching space; Mama Gloria spawns here.
    if (usable.length > 0 && Math.random() < 0.30) {
        const charmRoom = popRandomRoom();
        game.charmSchoolRooms.add(`${charmRoom.rx},${charmRoom.ry}`);
        if (!game.persistent.seenFigures['mama_gloria']) {
            const pos = inRoomFloorTile(charmRoom);
            game.npcs.push({ x: pos.x, y: pos.y, figureKey: 'mama_gloria', type: 'historical' });
        }
        game.items.push({
            x: roomCenterX(charmRoom.rx) + 1, y: roomFloorY(charmRoom.ry) - 1,
            type: 'loot', tier: 'rare',
            name: "Mama Gloria's Charm Book",
            scrap: 4, effect: 'charm_book',
            color: '#20B2AA', glow: '#48D1CC'
        });
    }

    // ── Castle Vault (depth ≥ 2, ~45%) ───────────────────────────────────────
    // A key-locked treasure chamber. The golden door teleports you into a
    // sealed room appended below the floor grid (Zelda house-interior style),
    // so generation can never wall off the critical path. The Small Key is
    // hidden elsewhere on the floor, under guard.
    if (game.depth >= 2 && usable.length > 0 && Math.random() < 0.45) {
        const vRoom = popRandomRoom();
        const doorX = roomCenterX(vRoom.rx) - 3;
        const doorY = roomFloorY(vRoom.ry) - 1;
        if (game.map[`${doorX},${doorY}`] === '.') {
            game.map[`${doorX},${doorY}`] = 'V';
            // Sealed chamber below the grid.
            const CW = 11, CH = 6;
            const cx0 = 2, cy0 = game.mapHeight + 2;
            fillRect(game.map, cx0 - 1, cy0 - 1, CW + 2, CH + 2, '#');
            fillRect(game.map, cx0, cy0, CW, CH, '.');
            const innerY = cy0 + CH - 1;
            game.map[`${cx0 + 1},${innerY}`] = 'V'; // way back out
            game.vault = { doorX, doorY, innerX: cx0 + 1, innerY };
            game.mapHeight = cy0 + CH + 2;

            // Vault treasure: a weapon, a heart piece, a rich loot gem, scrap.
            const vaultWeapons = ['stiletto', 'tattoo_gun', 'bike_lock', 'banjo'];
            const wKey = Math.random() < 0.06 ? 'glitter_blade' : pick(vaultWeapons);
            game.items.push({ x: cx0 + 4, y: innerY, type: 'weapon', weaponKey: wKey, name: 'Weapon Cache' });
            game.items.push({ x: cx0 + 6, y: innerY, type: 'heart_piece', name: 'Heart Piece' });
            game.items.push({
                x: cx0 + 8, y: innerY, type: 'loot',
                tier: game.depth >= 6 ? 'legendary' : 'epic',
                name: game.depth >= 6 ? 'Stonewall Brick' : "Hirschfeld's Notes",
                scrap: game.depth >= 6 ? 20 : 8,
                effect: game.depth >= 6 ? 'permanent_heart' : 'rage_vial',
                color: '#FFD700', glow: '#FFD700'
            });

            // The key, guarded, somewhere else on the floor.
            const keyRoom = popRandomRoom() || vRoom;
            const kp = inRoomFloorTile(keyRoom);
            game.items.push({ x: kp.x, y: kp.y, type: 'key', name: 'Small Key' });
            game.trolls.push({
                x: kp.x + 1, y: kp.y,
                enemyType: 'gatekeeper', health: 4 + Math.floor(game.depth / 3), maxHealth: 4 + Math.floor(game.depth / 3),
                patrolPath: [], patrolIndex: 0, direction: 1,
                moveDelay: 0, maxMoveDelay: 99, alertRadius: 0, chasingTurns: 0
            });
        }
    }

    // ── Mercy's Mutual Aid Cart (~35%) ───────────────────────────────────────
    // A traveling merchant. Her room is marked safe so the shop stays cozy.
    if (usable.length > 0 && Math.random() < 0.35) {
        const mRoom = popRandomRoom();
        const pos = inRoomFloorTile(mRoom);
        game.npcs.push({ x: pos.x, y: pos.y, type: 'merchant', name: 'Mercy' });
        game.safeShelterRooms.add(`${mRoom.rx},${mRoom.ry}`);
    }

    // ── Caged companion (depth ≥ 2, ~40% while any remain) ───────────────────
    // Rescue them and they join the Safehouse roster permanently.
    const ownedComps = (game.persistent && game.persistent.companions) || {};
    const unownedComps = COMPANION_KEYS.filter(k => !ownedComps[k]);
    if (usable.length > 0 && unownedComps.length > 0 && game.depth >= 2 && Math.random() < 0.40) {
        const cRoom = popRandomRoom();
        const pos = inRoomFloorTile(cRoom);
        game.items.push({ x: pos.x, y: pos.y, type: 'cage', companionKey: pick(unownedComps), name: 'Rattling Cage' });
    }

    // ── Breakable crates (Zelda pots) ────────────────────────────────────────
    // Smash with any attack or a dash; they cough up hearts, scrap, potions.
    {
        const crateCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < crateCount; i++) {
            const rx = Math.floor(Math.random() * ROOMS_X);
            const ry = Math.floor(Math.random() * ROOMS_Y);
            if (rx === 0 && ry === 0) continue; // keep the spawn room clear
            const cx = roomCenterX(rx) + (Math.random() < 0.5 ? -3 : 3);
            const cy = roomFloorY(ry) - 1;
            if (game.map[`${cx},${cy}`] === '.') game.map[`${cx},${cy}`] = 'X';
        }
    }

    // ── Echo Chamber (depth ≥ 3, ~22% per floor) ─────────────────────────────
    // A story the Archive couldn't quite hold — it's leaking, and someone from
    // it is still in there. Datamosh-tinted; enemies don't path in. Spawns one
    // un-met Echo character and a small "Fragment" pickup.
    if (usable.length > 0 && game.depth >= 3 && Math.random() < 0.22) {
        const unmet = ECHO_KEYS.filter(k => !(game.persistent.seenEchoes && game.persistent.seenEchoes[k]));
        if (unmet.length > 0) {
            const echoRoom = popRandomRoom();
            game.echoRooms.add(`${echoRoom.rx},${echoRoom.ry}`);
            const pos = inRoomFloorTile(echoRoom);
            game.npcs.push({ x: pos.x, y: pos.y, figureKey: pick(unmet), type: 'echo' });
            game.items.push({
                x: roomCenterX(echoRoom.rx) - 1, y: roomFloorY(echoRoom.ry) - 1,
                type: 'loot', tier: 'epic',
                name: 'Archival Fragment',
                scrap: 8, effect: 'rage_vial',
                color: '#B967DB', glow: '#B967DB'
            });
            // Glitchy mural over the chamber.
            const wx = roomCenterX(echoRoom.rx), wy = echoRoom.ry * ROOM_H;
            game.muralTiles[`${wx},${wy}`] = 'a story that didn\'t survive intact — keeper, hold it anyway';
        }
    }

    // ── Allison Scott near a mural room ──────────────────────────────────────
    if (usable.length > 0 && !game.persistent.seenFigures['allison_scott'] && game.depth >= 2 && Math.random() < 0.4) {
        const muralRoom = popRandomRoom();
        // Mark a ceiling tile in this room as a mural
        const wallX = roomCenterX(muralRoom.rx);
        const wallY = muralRoom.ry * ROOM_H;
        game.muralTiles[`${wallX},${wallY}`] = pick(MURAL_MESSAGES);
        const pos = inRoomFloorTile(muralRoom);
        game.npcs.push({ x: pos.x, y: pos.y, figureKey: 'allison_scott', type: 'historical' });
    }

    // ── Blade Journalists near mural areas ────────────────────────────────────
    if (usable.length > 0 && !game.persistent.seenFigures['blade_journalists'] && game.depth >= 3 && Math.random() < 0.35) {
        const bladRoom = popRandomRoom();
        const wallX = roomCenterX(bladRoom.rx) - 1;
        const wallY = bladRoom.ry * ROOM_H;
        game.muralTiles[`${wallX},${wallY}`] = "The Blade doesn't stop printing";
        const pos = inRoomFloorTile(bladRoom);
        game.npcs.push({ x: pos.x, y: pos.y, figureKey: 'blade_journalists', type: 'historical' });
    }

    // ── Scatter mural tiles on ceiling walls throughout the level ─────────────
    for (let i = 0; i < 4; i++) {
        const rx = Math.floor(Math.random() * ROOMS_X);
        const ry = Math.floor(Math.random() * ROOMS_Y);
        const wx = rx * ROOM_W + 1 + Math.floor(Math.random() * (ROOM_W - 2));
        const wy = ry * ROOM_H; // ceiling row
        const key = `${wx},${wy}`;
        if (!game.muralTiles[key]) {
            game.muralTiles[key] = pick(MURAL_MESSAGES);
        }
    }

    // ── Archival Fragment items ───────────────────────────────────────────────
    if (usable.length > 0) {
        const fragRoom = usable[Math.floor(Math.random() * usable.length)];
        const pos = inRoomFloorTile(fragRoom);
        game.items.push({
            x: pos.x, y: pos.y,
            type: 'loot', tier: 'common',
            name: 'Archival Fragment',
            scrap: 1, effect: 'archival_fragment',
            color: '#CCCCCC', glow: '#FFFFFF'
        });
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

            // Elite variants: tougher, gold-ringed, guaranteed rich drops.
            const elite = game.depth >= 2 && Math.random() < Math.min(0.22, 0.04 + game.depth * 0.02);
            if (elite) hp = hp * 2 + 1;

            game.trolls.push({
                x: cx, y: cy,
                enemyType: eType, health: hp, maxHealth: hp, elite,
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
        const finalBoss = game.depth >= 10;
        const bossHP = finalBoss ? 34 : 20;
        const bossY = roomFloorY(exitRoom.ry) - 1;
        // Try several offsets from center so a hall-motif pillar never blocks spawn.
        const center = roomCenterX(exitRoom.rx);
        const bossX = [-2, -3, -1, 2, 3, 1].map(d => center + d).find(cx => game.map[`${cx},${bossY}`] === '.') ?? center - 2;
        game.trolls.push({
            x: bossX, y: bossY,
            enemyType: 'boss', bossName: finalBoss ? 'THE LANDLORD KING' : 'THE ALGORITHM',
            health: bossHP, maxHealth: bossHP,
            patrolPath: [], patrolIndex: 0, direction: 1,
            moveDelay: 0, maxMoveDelay: 2,
            alertRadius: 10, chasingTurns: 0, bossPhase: 1
        });
    }
}

// ---------------------------------------------------------------------------
// Safehouse Sanctuary — a multi-floor vertical building. The player enters at
// the Lobby (top) and drops through the central shaft to visit ancestors on
// the floors matching the dungeon depth where each was first met.
//
//   FLOOR 0  ─ LOBBY ─ campfire (F), zine rack, wasteland portal (D)
//   FLOOR 1  ─ Ancestors met at depth 1  (Surface Ruins)
//   FLOOR 2  ─ Ancestors met at depth 2  (Surface Ruins)
//   FLOOR 3  ─ Ancestors met at depth 3  (Bureaucracy Levels)
//   ... etc. Empty floors are abandoned; occupied ones are tinted by depth zone.
//
// Each floor (FLOOR_H = 7 tiles — sized so one jump clears exactly one floor):
//   y+0   ceiling row  (#, except shaft cols: always .)
//   y+1–4 interior     (. open; side platforms for extra footing)
//   y+5   platform row (# sides, = at shaft — stand here; Down+Jump descends)
//   y+6   sub-floor gap(# sides, . at shaft — jump straight up to ascend)
//
// Ancestors only appear once met in the dungeon. seenFigures[key] stores the
// depth at which they were first encountered (legacy true-saves → floor 1).

function applyZoneTint(game, tint, roomKey) {
    if (tint === 'hearth')           game.hearthRooms.add(roomKey);
    else if (tint === 'charmSchool') game.charmSchoolRooms.add(roomKey);
    else if (tint === 'ballroom')    game.ballroomRooms.add(roomKey);
    else if (tint === 'safeShelter') game.safeShelterRooms.add(roomKey);
    else if (tint === 'starHouse')   game.starHouseRooms.add(roomKey);
}

export function generateHubMap(game) {
    game.depth = 0;
    game.inHub = true;
    game.map = {};
    game.items = [];
    game.npcs = [];
    game.trolls = [];
    game.particles = [];
    game.spriteFX = [];
    game.projectiles = [];
    game.vault = null;
    game.castleFloor = false;
    game.crumbleState = {};
    game.muralTiles = {};
    game.hearthRooms = new Set();
    game.safeShelterRooms = new Set();
    game.ballroomRooms = new Set();
    game.starHouseRooms = new Set();
    game.charmSchoolRooms = new Set();
    game.echoRooms = new Set();
    game.seen = {};

    const seenFigures    = game.persistent.seenFigures || {};
    const seenZines      = game.persistent.seenZines   || {};
    const zinesCollected = Object.keys(seenZines).length;

    // Group unlocked ancestors by the dungeon depth where they were first met.
    // New saves: seenFigures[key] = depth (number ≥ 1).
    // Legacy saves: seenFigures[key] = true  → place on floor 1.
    const figuresByDepth = {};
    for (const [key, val] of Object.entries(seenFigures)) {
        if (!HISTORICAL_FIGURES[key]) continue;
        const d = (typeof val === 'number' && val >= 1) ? Math.floor(val) : 1;
        if (!figuresByDepth[d]) figuresByDepth[d] = [];
        figuresByDepth[d].push(key);
    }

    const maxDepth  = Math.max(5, game.persistent.deepestReached || 1);
    const NUM_FLOORS = maxDepth + 1;   // floor 0 = lobby, floor N = depth N ancestors
    const FLOOR_H   = 7;
    const HUB_W     = 30;
    const HUB_H     = NUM_FLOORS * FLOOR_H + 1;
    const SHAFT_CX  = 14;
    const SHAFT     = new Set([SHAFT_CX - 1, SHAFT_CX, SHAFT_CX + 1]);

    game.mapWidth  = HUB_W;
    game.mapHeight = HUB_H;

    fillRect(game.map, 0, 0, HUB_W, HUB_H, '#');

    for (let f = 0; f < NUM_FLOORS; f++) {
        const fTop   = f * FLOOR_H;
        const intEnd = fTop + FLOOR_H - 3;  // last interior row (player tile level)
        const standY = fTop + FLOOR_H - 2;  // one-way platform row
        const subY   = fTop + FLOOR_H - 1;  // sub-floor gap (open at shaft)

        // Open shaft through ceiling row so players can jump between floors
        for (const sx of SHAFT) {
            if (sx > 0 && sx < HUB_W - 1) game.map[`${sx},${fTop}`] = '.';
        }

        // Interior rows open
        for (let y = fTop + 1; y <= intEnd; y++) {
            for (let x = 1; x < HUB_W - 1; x++) game.map[`${x},${y}`] = '.';
        }

        // Platform row: solid sides, one-way = at shaft columns
        for (let x = 1; x < HUB_W - 1; x++) {
            game.map[`${x},${standY}`] = SHAFT.has(x) ? '=' : '#';
        }

        // Sub-floor gap: solid sides, open at shaft (allows jumping back up)
        for (let x = 1; x < HUB_W - 1; x++) {
            game.map[`${x},${subY}`] = SHAFT.has(x) ? '.' : '#';
        }

        // Side platforms — extra footing and room dressing on each floor
        placePlatform(game.map, 3,          intEnd - 2, 5);
        placePlatform(game.map, HUB_W - 9, intEnd - 2, 5);

        // Floor label on the ceiling row (readable from the floor above)
        const figuresHere = f === 0 ? [] : (figuresByDepth[f] || []);
        if (f === 0) {
            game.muralTiles[`${SHAFT_CX - 5},${fTop}`] = '— SAFEHOUSE SANCTUARY —';
        } else {
            const zoneName = f >= 9 ? 'THE CORE'
                : f >= 7 ? 'THE DEEP-GRID'
                : f >= 5 ? 'THE ARCHIVE DEPTHS'
                : f >= 3 ? 'THE BUREAUCRACY LEVELS'
                : 'THE SURFACE RUINS';
            game.muralTiles[`${SHAFT_CX - 5},${fTop}`] = figuresHere.length
                ? `DEPTH ${f} · ${zoneName}`
                : `DEPTH ${f} · ABANDONED`;
        }

        // Place ancestor NPCs evenly across the floor, skipping the shaft.
        const npcY = intEnd; // player's tile level when standing on this floor
        if (figuresHere.length > 0) {
            const slots = [];
            for (let x = 4; x <= HUB_W - 5; x++) if (!SHAFT.has(x)) slots.push(x);
            figuresHere.forEach((figureKey, i) => {
                const idx = figuresHere.length === 1
                    ? Math.floor(slots.length / 2)
                    : Math.round(i * (slots.length - 1) / (figuresHere.length - 1));
                game.npcs.push({ x: slots[idx], y: npcY, figureKey, type: 'historical' });
            });
        }
    }

    // Tint each 10×10 renderer room by the depth zone of the floor at its centre.
    const roomCols = Math.ceil(HUB_W / 10);
    const roomRows = Math.ceil(HUB_H / 10);
    for (let ery = 0; ery < roomRows; ery++) {
        const cf = Math.min(NUM_FLOORS - 1, Math.floor((ery * 10 + 5) / FLOOR_H));
        const tintType = cf <= 2 ? 'hearth'
            : cf <= 4 ? 'safeShelter'
            : cf <= 6 ? 'ballroom'
            : cf <= 8 ? 'starHouse'
            : 'charmSchool';
        for (let erx = 0; erx < roomCols; erx++) applyZoneTint(game, tintType, `${erx},${ery}`);
    }

    // Lobby tiles (floor 0, interior row y = FLOOR_H - 3 = 4)
    const lobbyIntY = FLOOR_H - 3;
    game.map[`3,${lobbyIntY}`]             = 'F'; // campfire (upgrades)
    game.map[`${HUB_W - 4},${lobbyIntY}`]  = 'D'; // portal to wasteland

    // The pond — stand at the edge and USE to fish. Water caps the platform
    // row so you walk along its bank, never into it.
    for (let wx2 = 20; wx2 <= 23; wx2++) game.map[`${wx2},${FLOOR_H - 2}`] = 'W';
    game.muralTiles[`21,0`] = 'gone fishin\' — back never';

    // Mercy keeps a permanent stall by the campfire.
    game.npcs.push({ x: 6, y: lobbyIntY, type: 'merchant', name: 'Mercy' });

    // Rescued companions laze around the pond.
    Object.keys(game.persistent.companions || {}).forEach((ck, i) => {
        game.npcs.push({ x: 17 + (i % 3), y: lobbyIntY, type: 'companion', companionKey: ck });
    });

    // Zine magazine rack — permanent interactive item, never removed
    const zineTotal = Object.keys(ZINES).length;
    game.items.push({
        x: SHAFT_CX - 5, y: lobbyIntY,
        type: 'zinebook',
        name: `📖 Zine Rack (${zinesCollected}/${zineTotal})`
    });

    // Reveal entire hub on entry
    for (let y = 0; y < HUB_H; y++) {
        for (let x = 0; x < HUB_W; x++) game.seen[`${x},${y}`] = true;
    }

    // Spawn player standing on the lobby platform row (standY = FLOOR_H - 2).
    game.player.x = 1.5;
    game.player.y = FLOOR_H - 2.9; // standY minus player height (0.9)
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.onGround = true;

    const figuresMet   = Object.keys(seenFigures).length;
    const totalFigures = Object.keys(HISTORICAL_FIGURES).length;
    if (typeof window !== 'undefined' && window.UI && window.UI.addMessage) {
        window.UI.addMessage(
            `🏛 Safehouse Sanctuary — ${figuresMet}/${totalFigures} ancestors · ${zinesCollected}/${zineTotal} zines. Drop through the shaft to visit each depth level.`,
            'special'
        );
        window.UI.addMessage(
            '💬 CAMPFIRE (F): upgrades · PORTAL (D): wasteland · ZINE RACK: browse collected zines · J: quest log.',
            'special'
        );
    }
}
