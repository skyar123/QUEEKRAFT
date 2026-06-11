// Inventory — the RPG bag. Weapons (with procs/stats), a potion belt on
// hotkeys 1-4, pocketed fish snacks, small keys, heart pieces, and the
// floor map/compass. Also hosts Mercy's Mutual Aid Cart shop UI (rendered
// into the conversation modal, like the Gemini terminal does).
import { WEAPONS, POTIONS, POTION_KEYS, FISH, COMPANIONS } from './data.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';
import { initCompanionForRun } from './companions.js';

const TIER_RANK = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

// Fresh run loadout: trusty spoon, one tonic for the road.
export function initInventory(game) {
    const p = game.player;
    p.weapon = 'spoon';
    p.weapons = ['spoon'];
    p.potions = { tonic: 1, brew: 0, warpaint: 0, ward: 0 };
    p.fish = [];
    p.keysHeld = 0;
    p.hasMap = false;
    p.hasCompass = false;
    p.shockAuraTimer = 0;
}

export function addWeapon(game, weaponKey) {
    const w = WEAPONS[weaponKey];
    if (!w) return;
    const p = game.player;
    if (p.weapons.includes(weaponKey)) {
        game.treasures += 4;
        game.persistent.treasures += 4;
        UI.addMessage(`${w.icon} Duplicate ${w.name} — traded for 4 scrap.`, 'treasure');
        return;
    }
    p.weapons.push(weaponKey);
    const cur = WEAPONS[p.weapon] || WEAPONS.spoon;
    const upgrade = (TIER_RANK[w.tier] || 0) > (TIER_RANK[cur.tier] || 0);
    if (upgrade) {
        p.weapon = weaponKey;
        UI.addMessage(`${w.icon} ${w.name} equipped! ${w.desc}`, 'special');
    } else {
        UI.addMessage(`${w.icon} Got: ${w.name}. It's in the bag (I) when you want it.`, 'special');
    }
    Audio.playLoot();
}

export function addPotion(game, potionKey, count = 1) {
    const pot = POTIONS[potionKey];
    if (!pot) return;
    game.player.potions[potionKey] = (game.player.potions[potionKey] || 0) + count;
    UI.addMessage(`${pot.icon} Got: ${pot.name} (press ${pot.hotkey}).`, 'treasure');
}

export function usePotion(game, potionKey) {
    const p = game.player;
    const pot = POTIONS[potionKey];
    if (!pot || !(p.potions[potionKey] > 0)) return false;
    p.potions[potionKey]--;
    if (potionKey === 'tonic') {
        p.health = Math.min(p.maxHealth, p.health + 2);
        UI.addMessage('🧪 Herbal Tonic: +2 HP.', 'healing');
    } else if (potionKey === 'brew') {
        p.health = p.maxHealth;
        UI.addMessage('☕ Hearth Brew: fully healed. Someone believes in you.', 'healing');
    } else if (potionKey === 'warpaint') {
        p.lootBuff = Math.max(p.lootBuff || 0, 720);
        UI.addMessage('💄 War Paint on: +1 damage for 12s. Devastating.', 'special');
    } else if (potionKey === 'ward') {
        p.defenseBuff = Math.max(p.defenseBuff || 0, 600);
        UI.addMessage('🛡 Ward Charm hums: damage halved for 10s.', 'special');
    }
    Audio.playPotion && Audio.playPotion();
    UI.updateStatus(game);
    return true;
}

export function eatFish(game, index) {
    const p = game.player;
    const key = p.fish && p.fish[index];
    const fish = FISH[key];
    if (!fish) return;
    p.fish.splice(index, 1);
    const fx = fish.effect;
    if (fx === 'heal1') p.health = Math.min(p.maxHealth, p.health + 1);
    else if (fx === 'heal2') p.health = Math.min(p.maxHealth, p.health + 2);
    else if (fx === 'ward') p.defenseBuff = Math.max(p.defenseBuff || 0, 600);
    else if (fx === 'warpaint') p.lootBuff = Math.max(p.lootBuff || 0, 720);
    else if (fx === 'shock_aura') p.shockAuraTimer = 600;
    else if (fx === 'fullheal') {
        p.health = p.maxHealth;
        if (typeof window.addXP === 'function') window.addXP(50);
    } else if (fx === 'jump') {
        p.extraJumps = (p.extraJumps || 0) + 1;
        p.jumpsLeft = Math.max(p.jumpsLeft, 1);
    } else if (fx === 'heart_piece') {
        addHeartPiece(game);
    }
    UI.addMessage(`${fish.icon} You eat the ${fish.name}. ${fish.desc}`, 'healing');
    Audio.playPotion && Audio.playPotion();
    UI.updateStatus(game);
}

// Four pieces forge a permanent heart, Zelda-style.
export function addHeartPiece(game) {
    game.persistent.heartPieces = (game.persistent.heartPieces || 0) + 1;
    const n = game.persistent.heartPieces;
    if (n >= 4) {
        game.persistent.heartPieces = n - 4;
        game.persistent.permanentHearts = (game.persistent.permanentHearts || 0) + 1;
        game.player.maxHealth += 1;
        game.player.health = game.player.maxHealth;
        UI.addMessage('💖 FOUR PIECES BECOME ONE — permanent +1 HEART! The lineage grows.', 'special');
    } else {
        UI.addMessage(`💗 Heart Piece (${n}/4). Collect four for a permanent heart.`, 'special');
    }
    UI.updateStatus(game);
}

// ── Bag modal ───────────────────────────────────────────────────────────────
let invModal = null;
function ensureModal() {
    if (invModal) return invModal;
    invModal = document.createElement('div');
    invModal.id = 'inventory-modal';
    invModal.className = 'modal';
    invModal.innerHTML =
        `<div class="zine-box" style="max-width:560px;width:94%;max-height:86vh;overflow-y:auto;border-color:#39FF14;">
            <div class="zine-header" style="color:#39FF14;">🎒 THE BAG</div>
            <div id="inv-kit" style="text-align:center;color:#FFD700;font-size:15px;margin-bottom:10px;"></div>
            <div id="inv-weapons"></div>
            <div id="inv-potions"></div>
            <div id="inv-fish"></div>
            <div id="inv-companions"></div>
            <button class="zine-close" id="inv-close">Close (I)</button>
        </div>`;
    document.body.appendChild(invModal);
    invModal.querySelector('#inv-close').onclick = () => { invModal.style.display = 'none'; };
    invModal.addEventListener('click', (e) => { if (e.target === invModal) invModal.style.display = 'none'; });
    UI.modals.inventory = invModal;
    return invModal;
}

export function toggleInventory(game) {
    const m = ensureModal();
    if (m.style.display === 'flex') { m.style.display = 'none'; return; }
    renderInventory(game);
    m.style.display = 'flex';
}

function sectionHeader(label, color) {
    return `<div style="color:${color};font-size:16px;letter-spacing:2px;border-bottom:1px dashed ${color};margin:12px 0 8px;">${label}</div>`;
}

function renderInventory(game) {
    const m = ensureModal();
    const p = game.player;

    m.querySelector('#inv-kit').innerHTML =
        `🗝 Keys: ${p.keysHeld || 0} · 💗 Heart Pieces: ${(game.persistent.heartPieces || 0)}/4` +
        `${p.hasMap ? ' · 🗺 Map' : ''}${p.hasCompass ? ' · 🧭 Compass' : ''}`;

    const wEl = m.querySelector('#inv-weapons');
    wEl.innerHTML = sectionHeader('⚔ WEAPONS', '#FF71CE');
    (p.weapons || []).forEach(wk => {
        const w = WEAPONS[wk];
        if (!w) return;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px solid rgba(255,113,206,0.15);';
        const equipped = p.weapon === wk;
        row.innerHTML =
            `<span style="font-size:22px;">${w.icon}</span>` +
            `<span style="flex:1;"><span style="color:${equipped ? '#FFD700' : '#FFF'};">${w.name}</span>` +
            `<br><span style="font-size:12px;color:#aaa;">${w.desc}</span></span>`;
        const btn = document.createElement('button');
        btn.className = 'conversation-btn';
        btn.style.cssText = 'padding:4px 10px;font-size:14px;';
        btn.textContent = equipped ? 'EQUIPPED' : 'EQUIP';
        btn.disabled = equipped;
        btn.onclick = () => { p.weapon = wk; UI.addMessage(`${w.icon} ${w.name} equipped.`, 'special'); renderInventory(game); };
        row.appendChild(btn);
        wEl.appendChild(row);
    });

    const pEl = m.querySelector('#inv-potions');
    pEl.innerHTML = sectionHeader('🧪 POTION BELT (keys 1-4)', '#01CDFE');
    POTION_KEYS.forEach(pk => {
        const pot = POTIONS[pk];
        const count = (p.potions && p.potions[pk]) || 0;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px solid rgba(1,205,254,0.15);';
        row.innerHTML =
            `<span style="font-size:22px;">${pot.icon}</span>` +
            `<span style="flex:1;"><span style="color:#FFF;">${pot.name} ×${count}</span> <span style="color:#888;">[${pot.hotkey}]</span>` +
            `<br><span style="font-size:12px;color:#aaa;">${pot.desc}</span></span>`;
        const btn = document.createElement('button');
        btn.className = 'conversation-btn';
        btn.style.cssText = 'padding:4px 10px;font-size:14px;';
        btn.textContent = 'USE';
        btn.disabled = count <= 0;
        btn.onclick = () => { usePotion(game, pk); renderInventory(game); };
        row.appendChild(btn);
        pEl.appendChild(row);
    });

    const fEl = m.querySelector('#inv-fish');
    const fishList = p.fish || [];
    fEl.innerHTML = sectionHeader(`🐟 POND SNACKS (${fishList.length}/6)`, '#5BCEFA');
    if (fishList.length === 0) {
        fEl.innerHTML += '<div style="color:#888;font-size:13px;padding:4px;">Nothing pocketed. The Safehouse pond awaits.</div>';
    }
    fishList.forEach((fk, i) => {
        const fish = FISH[fk];
        if (!fish) return;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:5px 4px;border-bottom:1px solid rgba(91,206,250,0.15);';
        row.innerHTML = `<span style="font-size:20px;">${fish.icon}</span><span style="flex:1;color:#FFF;">${fish.name}<br><span style="font-size:12px;color:#aaa;">${fish.desc}</span></span>`;
        const btn = document.createElement('button');
        btn.className = 'conversation-btn';
        btn.style.cssText = 'padding:4px 10px;font-size:14px;';
        btn.textContent = 'EAT';
        btn.onclick = () => { eatFish(game, i); renderInventory(game); };
        row.appendChild(btn);
        fEl.appendChild(row);
    });

    const cEl = m.querySelector('#inv-companions');
    const owned = Object.keys(game.persistent.companions || {});
    cEl.innerHTML = sectionHeader('🐾 COMPANIONS', '#FFD700');
    if (owned.length === 0) {
        cEl.innerHTML += '<div style="color:#888;font-size:13px;padding:4px;">No critters rescued yet. Listen for rattling cages in the depths.</div>';
    }
    owned.forEach(ck => {
        const comp = COMPANIONS[ck];
        if (!comp) return;
        const active = game.persistent.activeCompanion === ck;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px solid rgba(255,215,0,0.15);';
        row.innerHTML =
            `<span style="font-size:22px;">${comp.icon}</span>` +
            `<span style="flex:1;"><span style="color:${active ? '#FFD700' : '#FFF'};">${comp.name}</span>` +
            `<br><span style="font-size:12px;color:#aaa;">${comp.perkDesc}</span></span>`;
        const btn = document.createElement('button');
        btn.className = 'conversation-btn';
        btn.style.cssText = 'padding:4px 10px;font-size:14px;';
        btn.textContent = active ? 'WITH YOU' : 'BRING';
        btn.disabled = active;
        btn.onclick = () => {
            game.persistent.activeCompanion = ck;
            initCompanionForRun(game);
            UI.addMessage(`${comp.icon} ${comp.name} pads along beside you.`, 'special');
            renderInventory(game);
        };
        row.appendChild(btn);
        cEl.appendChild(row);
    });
}

// ── Mercy's Mutual Aid Cart ─────────────────────────────────────────────────
function buildStock(game, inHub) {
    const stock = [];
    const potPool = [...POTION_KEYS].sort(() => 0.5 - Math.random()).slice(0, 2);
    for (const pk of potPool) stock.push({ kind: 'potion', key: pk, price: POTIONS[pk].price, repeat: true });
    if (!inHub) {
        stock.push({ kind: 'key', price: 8 });
        stock.push({ kind: Math.random() < 0.5 ? 'map' : 'compass', price: 5 });
    }
    const wPool = ['stiletto', 'tattoo_gun', 'bike_lock', 'banjo'];
    const wk = Math.random() < 0.05 ? 'glitter_blade' : wPool[Math.floor(Math.random() * wPool.length)];
    stock.push({ kind: 'weapon', key: wk, price: WEAPONS[wk].price });
    stock.push({ kind: 'heart_piece', price: 18 });
    return stock;
}

function stockLabel(entry) {
    if (entry.kind === 'potion') { const p = POTIONS[entry.key]; return `${p.icon} ${p.name}`; }
    if (entry.kind === 'weapon') { const w = WEAPONS[entry.key]; return `${w.icon} ${w.name}`; }
    if (entry.kind === 'key') return '🗝 Small Key';
    if (entry.kind === 'map') return '🗺 Floor Map (reveals the whole floor)';
    if (entry.kind === 'compass') return '🧭 Compass (marks goals on the minimap)';
    if (entry.kind === 'heart_piece') return '💗 Heart Piece';
    return '???';
}

export function openShop(game, npc) {
    if (!npc.stock) npc.stock = buildStock(game, !!game.inHub);
    document.getElementById('conversation-name').textContent = "MERCY — MUTUAL AID CART";
    const portrait = document.querySelector('#conversation-modal img');
    if (portrait) portrait.src = '/images/spr_community_mothers.png';
    const textEl = document.getElementById('conversation-text');
    const choices = document.getElementById('conversation-choices');

    const render = () => {
        textEl.textContent = `"Take what you need, leave what you can, sugar. Scrap keeps the cart rolling." — You have ${game.persistent.treasures} scrap.`;
        choices.innerHTML = '';
        npc.stock.forEach(entry => {
            if (entry.sold) return;
            const btn = document.createElement('button');
            btn.className = 'conversation-btn';
            btn.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:6px;';
            btn.innerHTML = `${stockLabel(entry)} — <span style="color:#FFD700;">${entry.price} scrap</span>`;
            btn.disabled = game.persistent.treasures < entry.price;
            btn.onclick = () => {
                game.persistent.treasures -= entry.price;
                Audio.playBuy && Audio.playBuy();
                if (entry.kind === 'potion') addPotion(game, entry.key);
                else if (entry.kind === 'weapon') { addWeapon(game, entry.key); entry.sold = true; }
                else if (entry.kind === 'key') { game.player.keysHeld = (game.player.keysHeld || 0) + 1; UI.addMessage('🗝 Small Key pocketed.', 'treasure'); entry.sold = true; }
                else if (entry.kind === 'map') {
                    game.player.hasMap = true;
                    Object.keys(game.map).forEach(k => { game.seen[k] = true; });
                    UI.addMessage('🗺 The floor map unfurls — every corridor revealed.', 'special');
                    entry.sold = true;
                } else if (entry.kind === 'compass') {
                    game.player.hasCompass = true;
                    UI.addMessage('🧭 The compass spins, then points at everything you want.', 'special');
                    entry.sold = true;
                } else if (entry.kind === 'heart_piece') { addHeartPiece(game); entry.sold = true; }
                UI.updateStatus(game);
                render();
            };
            choices.appendChild(btn);
        });
        const leave = document.createElement('button');
        leave.className = 'conversation-btn';
        leave.textContent = 'Take care, Mercy.';
        leave.onclick = () => { UI.modals.conversation.style.display = 'none'; };
        choices.appendChild(leave);
    };
    render();
    UI.modals.conversation.style.display = 'flex';
}
