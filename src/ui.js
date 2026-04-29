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
        
        heirs.forEach((heir, index) => {
            const card = document.createElement('div');
            card.className = 'heir-card';
            card.innerHTML = `
                <div class="heir-name">${heir.name}</div>
                <div class="heir-class">${heir.className}</div>
                <div class="heir-trait">Trait: ${heir.trait.name}</div>
                <div style="font-size: 12px; margin-top: 10px; color: #888;">${heir.trait.desc}</div>
            `;
            card.onclick = () => {
                this.modals.heirSelect.style.display = 'none';
                onSelect(heir);
            };
            optionsDiv.appendChild(card);
        });
        
        this.modals.heirSelect.style.display = 'flex';
    },

    showCamp(gameState, onEnterDungeon, onUpgradeHealth, onUpgradeDamage) {
        this.modals.camp.style.display = 'flex';
        
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
