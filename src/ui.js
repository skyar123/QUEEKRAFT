import { ZINES, HISTORICAL_FIGURES } from './data.js';

export const UI = {
    messageArea: document.getElementById('message-area'),
    status: {
        depth: document.getElementById('depth'),
        hearts: document.getElementById('player-hearts'),
        zines: document.getElementById('zines'),
        figures: document.getElementById('figures'),
        treasures: document.getElementById('treasures')
    },
    modals: {
        zine: document.getElementById('zine-modal'),
        conversation: document.getElementById('conversation-modal'),
        victory: document.getElementById('victory-screen'),
        gameOver: document.getElementById('game-over-screen'),
        heirSelect: document.getElementById('heir-select-screen'),
        camp: document.getElementById('camp-screen')
    },
    
    addMessage(text, type = 'system') {
        const msg = document.createElement('div');
        msg.className = `message msg-${type}`;
        msg.textContent = text;
        this.messageArea.appendChild(msg);
        while (this.messageArea.children.length > 20) {
            this.messageArea.removeChild(this.messageArea.firstChild);
        }
        this.messageArea.scrollTop = this.messageArea.scrollHeight;
    },

    updateStatus(game) {
        this.status.depth.textContent = game.depth;
        this.status.zines.textContent = game.zines;
        this.status.figures.textContent = game.historicalFigures;
        this.status.treasures.textContent = game.treasures;

        const full = "♥".repeat(Math.max(0, game.player.health));
        const empty = "♡".repeat(Math.max(0, game.player.maxHealth - game.player.health));
        this.status.hearts.innerHTML = 
            [...full].map(h => `<span class="heart-full">${h}</span>`).join('') +
            [...empty].map(h => `<span class="heart-empty">${h}</span>`).join('');
    },

    showZine(zineKey) {
        const zine = ZINES[zineKey];
        if (!zine) return;
        document.getElementById('zine-title').textContent = zine.title;
        document.getElementById('zine-content').innerHTML = zine.content;
        this.modals.zine.style.display = 'flex';
    },

    closeZine() {
        this.modals.zine.style.display = 'none';
    },

    shakeScreen() {
        const canvas = document.getElementById('game-canvas');
        canvas.classList.remove('shake');
        void canvas.offsetWidth; // trigger reflow
        canvas.classList.add('shake');
    },

    showGameOver(game, msg) {
        this.addMessage(msg, 'death');
        document.getElementById('death-message').innerHTML = `
            ${msg}<br><br>
            Zines: ${game.zines}/19<br>
            Historical Figures: ${game.historicalFigures}/9<br>
            Legacy Points (Treasures): ${game.treasures}<br><br>
            The revolution does not end with you.
        `;
        this.modals.gameOver.style.display = 'flex';
    },

    showVictory() {
        this.modals.victory.style.display = 'flex';
    },

    showHeirSelection(heirs, onSelect) {
        this.modals.gameOver.style.display = 'none';
        const optionsDiv = document.getElementById('heir-options');
        optionsDiv.innerHTML = '';

        heirs.forEach((heir) => {
            const card = document.createElement('div');
            card.className = 'heir-card';
            const traitsHtml = (heir.traits || [heir.trait]).map(t => `
                <div class="heir-trait">★ ${t.name}</div>
                <div style="font-size: 12px; color: #aaa; margin-bottom: 6px;">${t.desc}</div>
            `).join('');
            const power = heir.classObj ? `<div style="color:#FFD700;font-size:14px;margin-top:6px;">Power: ${heir.classObj.power}</div><div style="font-size:11px;color:#888">${heir.classObj.desc}</div>` : '';
            card.innerHTML = `
                <div class="heir-name">${heir.name}</div>
                <div class="heir-class">${heir.className}</div>
                ${traitsHtml}
                ${power}
            `;
            card.onclick = () => {
                this.modals.heirSelect.style.display = 'none';
                onSelect(heir);
            };
            optionsDiv.appendChild(card);
        });

        this.modals.heirSelect.style.display = 'flex';
    },

    renderLineage(lineage) {
        let row = document.getElementById('lineage-row');
        if (!row) {
            row = document.createElement('div');
            row.id = 'lineage-row';
            row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:15px 0;max-height:160px;overflow-y:auto;border:2px dashed var(--punk-purple);padding:10px;';
            const enterBtn = document.getElementById('enter-dungeon-btn');
            const heading = document.createElement('div');
            heading.id = 'lineage-heading';
            heading.style.cssText = 'text-align:center;color:var(--punk-purple);font-size:18px;margin-top:10px;';
            heading.textContent = '⚰️ FALLEN LINEAGE ⚰️';
            enterBtn.parentNode.insertBefore(heading, enterBtn);
            enterBtn.parentNode.insertBefore(row, enterBtn);
        }
        row.innerHTML = '';
        if (!lineage || lineage.length === 0) {
            row.innerHTML = '<div style="color:#666;padding:5px;">No fallen heroes yet. Be the first.</div>';
            return;
        }
        lineage.slice(-12).reverse().forEach((entry, i) => {
            const card = document.createElement('div');
            card.style.cssText = `
                border:1px solid var(--punk-cyan);
                padding:6px 8px;
                font-size:12px;
                background:rgba(1,205,254,0.05);
                min-width:140px;
            `;
            card.innerHTML = `
                <div style="color:var(--punk-pink);font-weight:bold;">${entry.name}</div>
                <div style="color:#aaa;">${entry.className}</div>
                <div style="color:var(--punk-cyan);font-size:11px;">${entry.traitName}</div>
                <div style="color:#666;font-size:11px;margin-top:3px;">D${entry.depth} · ${entry.kills} kills · ${entry.scrap} scrap</div>
            `;
            row.appendChild(card);
        });
    },

    showCamp(gameState, onEnterDungeon, onUpgradeHealth, onUpgradeDamage, lineage) {
        this.modals.camp.style.display = 'flex';
        if (lineage) this.renderLineage(lineage);
        
        const updateCampUI = () => {
            document.getElementById('camp-treasures').textContent = gameState.persistent.treasures;
            document.getElementById('cost-health').textContent = gameState.persistent.healthCost;
            document.getElementById('cost-damage').textContent = gameState.persistent.damageCost;
            
            document.getElementById('upgrade-health-btn').disabled = gameState.persistent.treasures < gameState.persistent.healthCost;
            document.getElementById('upgrade-damage-btn').disabled = gameState.persistent.treasures < gameState.persistent.damageCost;
        };
        
        updateCampUI();
        
        // Add color palette selector if not already present
        let paletteRow = document.getElementById('palette-row');
        if (!paletteRow) {
            paletteRow = document.createElement('div');
            paletteRow.id = 'palette-row';
            paletteRow.style.cssText = 'display:flex;gap:8px;justify-content:center;margin:15px 0;flex-wrap:wrap;';
            
            const palettes = [
                { id: 0, label: '🏳️‍⚧️ Trans Blue', colors: ['#5BCEFA','#F5A9B8','#FFFFFF'] },
                { id: 1, label: '🏳️‍⚧️ Trans Pink', colors: ['#F5A9B8','#5BCEFA','#FFFFFF'] },
                { id: 2, label: '🏳️‍🌈 Rainbow Pride', colors: ['#E40303','#FF8C00','#FFED00','#008026','#24408E','#732982','#613915','#000000'] }
            ];
            
            palettes.forEach(p => {
                const btn = document.createElement('button');
                btn.className = 'upgrade-btn';
                btn.dataset.paletteId = p.id;
                btn.style.cssText = 'padding:8px 12px;font-size:14px;display:flex;align-items:center;gap:6px;';
                
                // Color swatch
                const swatch = document.createElement('span');
                swatch.style.cssText = `display:inline-flex;gap:1px;`;
                p.colors.slice(0, 5).forEach(c => {
                    const dot = document.createElement('span');
                    dot.style.cssText = `width:8px;height:8px;background:${c};border-radius:50%;display:inline-block;`;
                    swatch.appendChild(dot);
                });
                
                btn.appendChild(swatch);
                btn.appendChild(document.createTextNode(p.label));
                btn.onclick = () => {
                    gameState.player.colorPalette = p.id;
                    // Highlight selected
                    paletteRow.querySelectorAll('button').forEach(b => b.style.borderColor = 'var(--punk-pink)');
                    btn.style.borderColor = '#01CDFE';
                    btn.style.boxShadow = '0 0 15px #01CDFE';
                };
                paletteRow.appendChild(btn);
            });
            
            // Insert before the enter button
            const enterBtn = document.getElementById('enter-dungeon-btn');
            enterBtn.parentNode.insertBefore(paletteRow, enterBtn);
        }
        // Highlight current selection
        paletteRow.querySelectorAll('button').forEach(b => {
            if (parseInt(b.dataset.paletteId) === (gameState.player.colorPalette || 0)) {
                b.style.borderColor = '#01CDFE';
                b.style.boxShadow = '0 0 15px #01CDFE';
            } else {
                b.style.borderColor = 'var(--punk-pink)';
                b.style.boxShadow = '';
            }
        });
        
        document.getElementById('upgrade-health-btn').onclick = () => {
            if (onUpgradeHealth()) updateCampUI();
        };
        document.getElementById('upgrade-damage-btn').onclick = () => {
            if (onUpgradeDamage()) updateCampUI();
        };
        document.getElementById('enter-dungeon-btn').onclick = () => {
            this.modals.camp.style.display = 'none';
            onEnterDungeon();
        };
    }
};

export const DialogueUI = {
    currentGame: null,
    currentNPC: null,
    currentNode: null,

    start(game, npcKey) {
        this.currentGame = game;
        this.currentNPC = HISTORICAL_FIGURES[npcKey];
        this.currentNode = 'greeting';
        
        document.getElementById('conversation-name').textContent = `${this.currentNPC.name} (${this.currentNPC.era})`;
        UI.modals.conversation.style.display = 'flex';
        
        this.renderNode();
    },

    renderNode() {
        const node = this.currentNPC.dialogue[this.currentNode];
        document.getElementById('conversation-text').textContent = node.text;
        
        const choicesContainer = document.getElementById('conversation-choices');
        choicesContainer.innerHTML = '';
        
        if (node.choices && node.choices.length > 0) {
            node.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'conversation-btn';
                btn.textContent = choice.text;
                btn.onclick = () => {
                    this.applyEffects(node);
                    this.currentNode = choice.next;
                    this.renderNode();
                };
                choicesContainer.appendChild(btn);
            });
        } else {
            const btn = document.createElement('button');
            btn.className = 'conversation-btn';
            btn.textContent = "Farewell";
            btn.onclick = () => {
                this.applyEffects(node);
                this.close();
            };
            choicesContainer.appendChild(btn);
        }
    },

    applyEffects(node) {
        if (node.effect === 'heal_full') {
            this.currentGame.player.health = this.currentGame.player.maxHealth;
            UI.addMessage("You are fully healed!", "healing");
            UI.updateStatus(this.currentGame);
        }
        if (node.reward) {
            UI.addMessage(`Received: ${node.reward}`, "special");
            if (node.reward === 'item_brick') {
                this.currentGame.player.hasBrick = true;
            }
        }
    },

    close() {
        UI.modals.conversation.style.display = 'none';
        this.currentGame = null;
        this.currentNPC = null;
        this.currentNode = null;
    }
};

document.getElementById('zine-close-btn').addEventListener('click', () => UI.closeZine());
