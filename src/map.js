import { ZINES, HISTORICAL_FIGURES, TREASURES, HEALING_ITEMS, ECHO_KEYS } from './data.js';

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
    "A story that didn't survive intact is still a story. Hold it anyway.",
    // DSM mnemonics and clinical wisdom
    "SIG E CAPS: Sleep, Interest, Guilt, Energy, Concentration, Appetite, Psychomotor, Suicidality",
    "DIG FAST: Distractibility, Indiscretion, Grandiosity, Flight of ideas, Activity, Sleep, Talkativeness",
    "The Anxious Distress specifier: 5 symptoms, severity matters, always document",
    "Mixed features = opposite polarity symptoms bleeding through — highest suicide risk",
    "Mood reactivity is the cardinal feature of atypical depression — can they feel better at all?",
    "Peripartum onset: during pregnancy OR within 4 weeks — 50% begin before delivery",
    "Rapid cycling: 4+ episodes in 12 months — check thyroid, check substances",
    "Melancholic depression: early morning awakening, worse in AM, non-reactive mood",
    "Seasonal pattern: 2 years, 2 episodes, temporal relationship — light therapy first",
    "Catatonia emergency: lorazepam first. NOT antipsychotics. ECT if refractory.",
    "Rule out medical causes first. Always. Hypothyroid mimics depression.",
    "BPD vs Bipolar II: chronic instability vs episodic mood. Identity disturbance = BPD.",
    "PTSD vs Adjustment: was it traumatic? actual/threatened death, injury, sexual violence?",
    "GAD worry = ego-syntonic, real-life topics. OCD obsessions = ego-dystonic, feel alien.",
    "Biopsychosocial-spiritual: never reduce a human to a single dimension",
    "V-codes are not lesser concerns — they are the social determinants. Treat them.",
    "Cultural humility is not a technique. It is a lifetime orientation.",
    "The CFI is the tool. Cultural formulation is the stance.",
    "DMDD is chronic irritability. Bipolar is episodic mood change. Duration is the key.",
    "Mixed features in MDE = possible bipolar spectrum. Antidepressants alone may destabilize.",
    "Minority stress is a social determinant of mental health — not a character flaw.",
    "CPTSD (ICD-11): prolonged inescapable trauma + affect dysregulation + negative self-concept + relationship difficulties",
    "The diagnosis is a map. The person is the territory. Hold both.",
    "Differential diagnosis is clinical reasoning, not labeling. Rule out, rule in, hold uncertainty.",
    "Every zine here is a clinical case. Every case is a life. Treat them that way."
];

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

    // Special room tracking for rendering and mechanics
    game.hearthRooms = new Set();
    game.safeShelterRooms = new Set();
    game.ballroomRooms = new Set();
    game.starHouseRooms = new Set();
    game.charmSchoolRooms = new Set();
    game.echoRooms = new Set();
    game.muralTiles = {};

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
        const muralRoomKey = `${muralRoom.rx},${muralRoom.ry}`;
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
            game.muralTiles[key] = MURAL_MESSAGES[i % MURAL_MESSAGES.length];
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
    const advancedTypes = ['swarm', 'bigot', 'ruminator', 'avoidance', 'compulsion'];
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
            if (eType === 'ruminator') { hp = 3; mDelay = 4; alertRad = 5; }
            if (eType === 'avoidance') { hp = 2; mDelay = 2; alertRad = 6; }
            if (eType === 'compulsion'){ hp = 4; mDelay = 3; alertRad = 3; }
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
        // Spawn the boss two tiles left of center so the exit stairs at center remain reachable.
        const bossX = roomCenterX(exitRoom.rx) - 2;
        const bossY = roomFloorY(exitRoom.ry) - 1;
        if (game.map[`${bossX},${bossY}`] !== '#') {
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
}

// ---------------------------------------------------------------------------
// Safehouse Village — an optional cozy hub. NOT on the run critical path
// anymore (camp's "Enter the Wasteland" still goes straight to the dungeon);
// this is reached via the camp's "🏘️ Visit the Safehouse Village" button.
//
// The village is six zones divided by interior walls with carved doorways:
//
//   ┌────────┬──────────┬───────────┬───────────┬──────────┬───────────┐
//   │ HEARTH │ DRAG BAR │ BALLROOM  │  ARCHIVE  │  STAR    │  ATRIUM   │
//   │ (warm) │  (teal)  │  (gold)   │ (blue/pk) │  (red)   │ (neutral) │
//   └────────┴──────────┴───────────┴───────────┴──────────┴───────────┘
//        F (campfire)                                        D (portal)
//
// Each zone uses an existing room-set (hearthRooms, charmSchoolRooms, etc.)
// so the tile renderer's per-room tint already lights it correctly.
//
// Village GROWS with progress (the player's ask):
//   - Core quest givers always appear so the quest loop works on first visit.
//   - Other NPCs only show after the player has met them in the dungeon
//     (game.persistent.seenFigures[key] === true).
//   - Decorative props (bouquets/zines) scale with seenZines count.
//   - Zone tints turn from dim to vivid once a zone has at least one resident.

const VLG_W = 60;
const VLG_H = 20;     // taller for buildings + rooftops
const ZONE_W = 10;    // each of the 6 zones is 10 tiles wide
const ZONES = [
    { id: 'hearth',   name: 'HEARTH KITCHEN', tint: 'hearth',       npcs: ['community_mothers', 'mama_gloria', 'mariela_munoz', 'gauri_sawant'] },
    { id: 'drag',     name: 'DRAG BAR',       tint: 'charmSchool',  npcs: ['marsha', 'coccinelle', 'mj_rodriguez', 'sylvia'] },
    { id: 'ballroom', name: 'BALLROOM STAGE', tint: 'ballroom',     npcs: ['crystal_labeija', 'paris_dupree', 'angie_xtravaganza'] },
    { id: 'archive',  name: 'THE ARCHIVE',    tint: 'safeShelter',  npcs: ['blade_journalists', 'jennifer_boylan', 'dorian_corey', 'eleanor'] },
    { id: 'star',     name: 'STAR HOUSE',     tint: 'starHouse',    npcs: ['kenya_cuevas', 'cleopatra_kambugu', 'allison_scott', 'peyton_oconner'] },
    { id: 'atrium',   name: 'THE ATRIUM',     tint: null,           npcs: ['william_dorsey_swann', 'wewha', 'charley', 'dora', 'alan', 'lili', 'christine', 'lucy'] }
];

// NPCs that always appear regardless of seenFigures so the quest loop is
// usable on first visit (each is a quest giver).
const CORE_RESIDENTS = new Set([
    'community_mothers',
    'marsha',
    'crystal_labeija',
    'blade_journalists',
    'william_dorsey_swann'
]);

function zoneHasAnyResident(zone, game) {
    return zone.npcs.some(k =>
        HISTORICAL_FIGURES[k] && (CORE_RESIDENTS.has(k) || (game.persistent.seenFigures && game.persistent.seenFigures[k]))
    );
}

function applyZoneTint(game, tint, roomKey) {
    if (tint === 'hearth')           game.hearthRooms.add(roomKey);
    else if (tint === 'charmSchool') game.charmSchoolRooms.add(roomKey);
    else if (tint === 'ballroom')    game.ballroomRooms.add(roomKey);
    else if (tint === 'safeShelter') game.safeShelterRooms.add(roomKey);
    else if (tint === 'starHouse')   game.starHouseRooms.add(roomKey);
    // 'null' tint = no room set, renders as default dungeon-floor look.
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
    game.crumbleState = {};
    game.muralTiles = {};
    game.hearthRooms = new Set();
    game.safeShelterRooms = new Set();
    game.ballroomRooms = new Set();
    game.starHouseRooms = new Set();
    game.charmSchoolRooms = new Set();
    game.echoRooms = new Set();
    game.mapWidth = VLG_W;
    game.mapHeight = VLG_H;
    game.seen = {};

    // Layout constants
    const streetY  = VLG_H - 4;   // ground-level street the player walks on
    const roofY    = 4;            // top of building rooftops
    const skyY     = 1;            // open sky rows above rooftops
    const wallH    = streetY - roofY; // interior height of each building

    // Fill everything solid, then carve out sky + street
    fillRect(game.map, 0, 0, VLG_W, VLG_H, '#');
    // Sky
    fillRect(game.map, 1, skyY, VLG_W - 2, roofY - skyY, '.');
    // Street (walkable ground level)
    fillRect(game.map, 1, streetY, VLG_W - 2, 1, '.');

    // ── Building shells ──────────────────────────────────────────────────
    // Each zone gets a building: exterior walls from roofY to streetY,
    // interior carved open, a doorway at ground level, and windows.
    for (let z = 0; z < ZONES.length; z++) {
        const bx0 = z * ZONE_W + 1;   // building left wall x
        const bx1 = (z + 1) * ZONE_W - 1; // building right wall x

        // Exterior side walls
        for (let y = roofY; y < streetY; y++) {
            game.map[`${bx0},${y}`] = '#';
            game.map[`${bx1},${y}`] = '#';
        }
        // Rooftop cap (solid row)
        for (let x = bx0; x <= bx1; x++) game.map[`${x},${roofY}`] = '#';

        // Interior open space
        fillRect(game.map, bx0 + 1, roofY + 1, bx1 - bx0 - 1, streetY - roofY - 1, '.');

        // Doorway (3 tiles tall) at the center of each building front
        const doorX = z * ZONE_W + Math.floor(ZONE_W / 2);
        for (let y = streetY - 3; y < streetY; y++) game.map[`${doorX},${y}`] = '.';

        // Windows — two per building, symmetrical
        const winY1 = roofY + 2, winY2 = roofY + 3;
        game.map[`${bx0 + 2},${winY1}`] = '.';
        game.map[`${bx0 + 2},${winY2}`] = '.';
        game.map[`${bx1 - 2},${winY1}`] = '.';
        game.map[`${bx1 - 2},${winY2}`] = '.';

        // Shared divider wall between buildings (solid pillar at zone boundary)
        // already solid from the initial fill — just ensure doorway gap in street
        if (z > 0) {
            const divX = z * ZONE_W;
            game.map[`${divX},${streetY}`] = '.'; // street-level gap so player can walk
        }
    }

    // ── Zone tints, signs & decoration ──────────────────────────────────
    const zinesCollected = Object.keys(game.persistent && game.persistent.seenZines || {}).length;
    const figuresMet     = Object.keys(game.persistent && game.persistent.seenFigures || {}).length;
    const decorated      = Math.min(1, 0.25 + zinesCollected / 19);

    for (let z = 0; z < ZONES.length; z++) {
        const zone = ZONES[z];
        const bx0  = z * ZONE_W + 1;
        const bx1  = (z + 1) * ZONE_W - 1;
        const cx   = z * ZONE_W + Math.floor(ZONE_W / 2);
        const interior = bx0 + 1; // first walkable tile inside building

        const willBeOccupied = zoneHasAnyResident(zone, game);
        if (willBeOccupied) applyZoneTint(game, zone.tint, `${z},0`);

        // Zone name written on the rooftop so it's visible from the street
        game.muralTiles[`${cx - 1},${roofY}`] = willBeOccupied ? zone.name : '[LOCKED]';

        // ── Per-zone interior layout ─────────────────────────────────────
        if (zone.id === 'hearth') {
            // Kitchen island counter + wall shelf
            placePlatform(game.map, interior,     streetY - 2, 5);
            placePlatform(game.map, interior + 3, streetY - 5, 3);  // high shelf
            if (decorated > 0.4) placePlatform(game.map, interior + 1, streetY - 4, 2);
        } else if (zone.id === 'drag') {
            // Bar counter runs the length; loft balcony above
            placePlatform(game.map, interior,     streetY - 2, 7);  // bar top
            placePlatform(game.map, interior,     streetY - 6, 4);  // loft level
            placePlatform(game.map, interior + 5, streetY - 4, 2);  // loft steps
        } else if (zone.id === 'ballroom') {
            // Raised stage in center with step up + spotlights (high platforms)
            placePlatform(game.map, interior + 1, streetY - 2, 6);  // stage floor
            placePlatform(game.map, interior + 2, streetY - 4, 4);  // stage raised
            placePlatform(game.map, interior + 3, streetY - 6, 2);  // top of stage
            if (decorated > 0.5) {
                placePlatform(game.map, interior,     streetY - 7, 1); // spotlight box L
                placePlatform(game.map, interior + 6, streetY - 7, 1); // spotlight box R
            }
        } else if (zone.id === 'archive') {
            // Tall bookshelves as vertical pillars with walkable tops
            for (let sx of [interior, interior + 3, interior + 6]) {
                for (let y = streetY - 2; y >= streetY - 6; y -= 2) {
                    placePlatform(game.map, sx, y, 2);
                }
            }
            if (decorated > 0.5) placePlatform(game.map, interior + 1, streetY - 7, 5); // top gallery
        } else if (zone.id === 'star') {
            // Bunk beds: pairs of platforms at two heights per side
            placePlatform(game.map, interior,     streetY - 2, 3);
            placePlatform(game.map, interior + 5, streetY - 2, 3);
            placePlatform(game.map, interior,     streetY - 4, 3);
            placePlatform(game.map, interior + 5, streetY - 4, 3);
            if (decorated > 0.4) {
                placePlatform(game.map, interior + 2, streetY - 6, 4); // top bunk loft
            }
        } else if (zone.id === 'atrium') {
            // Grand entrance: wide steps leading to portal
            placePlatform(game.map, interior,     streetY - 2, 2);
            placePlatform(game.map, interior + 5, streetY - 2, 2);
            if (decorated > 0.3) placePlatform(game.map, interior + 2, streetY - 4, 4);
        }

        // Rooftop platform — reachable via building interior; accessible on all zones
        placePlatform(game.map, bx0 + 1, roofY + 1, bx1 - bx0 - 2);

        // Decorative item scatter
        if (willBeOccupied && Math.random() < decorated) {
            game.items.push({
                x: interior + 1 + Math.floor(Math.random() * Math.max(1, bx1 - bx0 - 3)),
                y: streetY,
                type: 'treasure', name: 'Bouquet (gift)', decorative: true
            });
        }
    }

    // Campfire at street entrance; wasteland portal at far right
    game.map[`3,${streetY}`]              = 'F';
    game.map[`${VLG_W - 3},${streetY}`]  = 'D';

    // Reveal entire village on first visit
    for (let y = 0; y < VLG_H; y++) {
        for (let x = 0; x < VLG_W; x++) game.seen[`${x},${y}`] = true;
    }

    // Spawn player at village entrance by the campfire
    game.player.x = 1.5;
    game.player.y = streetY;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.onGround = true;

    // Populate NPCs — CORE_RESIDENTS always present; others need seenFigures
    for (let z = 0; z < ZONES.length; z++) {
        const zone = ZONES[z];
        const bx0  = z * ZONE_W + 1;
        const bx1  = (z + 1) * ZONE_W - 1;
        const eligible = zone.npcs.filter(k =>
            HISTORICAL_FIGURES[k] &&
            (CORE_RESIDENTS.has(k) || (game.persistent.seenFigures && game.persistent.seenFigures[k]))
        );
        const step = Math.max(1, Math.floor((bx1 - bx0) / (eligible.length + 1)));
        eligible.forEach((figureKey, i) => {
            game.npcs.push({ x: bx0 + step * (i + 1), y: streetY, figureKey, type: 'historical' });
        });
    }

    const totalFigures = Object.keys(HISTORICAL_FIGURES).length;
    if (typeof window !== 'undefined' && window.UI && window.UI.addMessage) {
        window.UI.addMessage(
            `Village: ${game.npcs.length} residents · ${figuresMet}/${totalFigures} figures met · ${zinesCollected}/19 zines. Walk right to return to the wasteland.`,
            'special'
        );
    }
}
