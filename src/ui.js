import { ZINES, HISTORICAL_FIGURES, DIFFICULTIES, GEMINI_GUIDE } from './data.js';
import { Audio } from './audio.js';

export const UI = {
    messageArea: document.getElementById('message-area'),
    status: {
        depth: document.getElementById('depth'),
        hearts: document.getElementById('player-hearts'),
        zines: document.getElementById('zines'),
        figures: document.getElementById('figures'),
        echoes: document.getElementById('echoes'),
        treasures: document.getElementById('treasures'),
        level: document.getElementById('player-level'),
        xpBar: document.getElementById('xp-bar-fill')
    },
    modals: {
        zine: document.getElementById('zine-modal'),
        conversation: document.getElementById('conversation-modal'),
        victory: document.getElementById('victory-screen'),
        gameOver: document.getElementById('game-over-screen'),
        heirSelect: document.getElementById('heir-select-screen'),
        camp: document.getElementById('camp-screen'),
        levelUp: document.getElementById('level-up-screen'),
        mural: document.getElementById('mural-screen')
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
        if (this.status.echoes) {
            const e = (game.persistent && game.persistent.seenEchoes) ? Object.keys(game.persistent.seenEchoes).length : 0;
            this.status.echoes.textContent = e;
        }
        this.status.treasures.textContent = game.treasures;
        this.status.level.textContent = game.player.level || 1;
        
        const xpRatio = (game.player.xp || 0) / (game.player.xpToNext || 100);
        this.status.xpBar.style.width = `${Math.min(1, xpRatio) * 100}%`;

        const displayHealth = Math.ceil(game.player.health);
        const displayMax = Math.ceil(game.player.maxHealth);
        const full = "♥".repeat(Math.max(0, displayHealth));
        const empty = "♡".repeat(Math.max(0, displayMax - displayHealth));
        this.status.hearts.innerHTML = 
            [...full].map(h => `<span class="heart-full">${h}</span>`).join('') +
            [...empty].map(h => `<span class="heart-empty">${h}</span>`).join('');
    },

    showZine(zineKey) {
        const zine = ZINES[zineKey];
        if (!zine) return;
        document.getElementById('zine-title').textContent = zine.title;
        document.getElementById('zine-content').innerHTML = zine.content;
        
        const coverImg = document.getElementById('zine-cover');
        if (zine.image) {
            coverImg.src = zine.image;
            coverImg.style.display = 'block';
        } else {
            coverImg.style.display = 'none';
        }
        
        const overlay = document.getElementById('zine-ritual-overlay');
        const quoteEl = document.getElementById('zine-ritual-quote');
        
        // Extract a quote from the content if possible
        const match = zine.content.match(/<p>"(.*?)"<\/p>/) || zine.content.match(/<p>(.*?)<\/p>/);
        const quote = match ? match[1] : "Power in our stories.";
        
        if (overlay && quoteEl) {
            quoteEl.innerHTML = `"${quote}"`;
            overlay.style.display = 'flex';
            void overlay.offsetWidth;
            overlay.style.opacity = '1';

            const zineModal = this.modals.zine;
            const dismiss = () => {
                overlay.removeEventListener('click', dismiss);
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    zineModal.style.display = 'flex';
                }, 500);
            };
            overlay.addEventListener('click', dismiss);
        } else {
            this.modals.zine.style.display = 'flex';
        }
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

    
    startRefusal(game, enemy) {
        document.getElementById('conversation-name').textContent = 'Refusal: ' + enemy.enemyType;
        document.getElementById('conversation-text').textContent = 'An oppressor approaches. Refuse them on your own terms.';
        
        const choicesContainer = document.getElementById('conversation-choices');
        choicesContainer.innerHTML = '';

        const options = [
            "I don't have time for this.",
            "Your opinion is noted and immediately discarded.",
            "Bestie... no."
        ];

        options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'conversation-btn';
            btn.textContent = opt;
            btn.onclick = () => {
                // Correct choice logic (let's say all of them are correct for now, or pick one)
                // Actually, let's make them all work and give different funny reactions!
                document.getElementById('conversation-text').textContent = "The enemy deflates. Their power over you is gone.";
                choicesContainer.innerHTML = '';
                
                const closeBtn = document.createElement('button');
                closeBtn.className = 'conversation-btn';
                closeBtn.textContent = 'Walk away.';
                closeBtn.onclick = () => {
                    UI.modals.conversation.style.display = 'none';
                    game.trolls = game.trolls.filter(t => t !== enemy);
                    for (let i = 0; i < 20; i++) {
                        game.particles.push({
                            x: enemy.x + 0.5, y: enemy.y,
                            vx: (Math.random()-0.5)*0.8, vy: -Math.random()*1.0,
                            life: 1.0, color: '#aaa', size: 3
                        });
                    }
                    UI.addMessage('You refused to engage. That takes strength.', 'special');
                };
                choicesContainer.appendChild(closeBtn);
            };
            choicesContainer.appendChild(btn);
        });

        UI.modals.conversation.style.display = 'flex';
    },

    showGameOver(game, msg) {
        this.addMessage(msg, 'death');
        
        const DEATH_QUOTES = [
            { quote: "We have to be visible. We should not be ashamed of who we are.", author: "Marsha P. Johnson" },
            { quote: "I'm not missing a minute of this. It's the revolution!", author: "Sylvia Rivera" },
            { quote: "I will not be a casualty.", author: "Miss Major" },
            { quote: "Before they told us we were wrong, we were sacred.", author: "The Archive" },
            { quote: "The only way to survive is by taking care of one another.", author: "Grace Lee Boggs" },
            { quote: "You are exactly the right amount of yourself.", author: "Anonymous" }
        ];
        const q = DEATH_QUOTES[Math.floor(Math.random() * DEATH_QUOTES.length)];

        document.getElementById('death-message').innerHTML = `
            <div style="margin-bottom: 24px; font-size: 20px; font-style: italic; color: #FF71CE; text-shadow: 0 0 10px #FF71CE;">
                "${q.quote}"<br>
                <span style="font-size: 16px; color: #01CDFE; text-shadow: 0 0 8px #01CDFE;">— ${q.author}</span>
            </div>
            <div style="font-size: 14px; color: #aaa; margin-bottom: 24px;">
                (Depth ${game.depth || 1} reached — ${game.zines} zines recovered)
            </div>
            <div style="font-size: 14px; color: #888;">
                Legacy Points (Treasures): ${game.treasures}
            </div>
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

    showLevelUp(perks, onSelect) {
        const container = document.getElementById('perk-options');
        container.innerHTML = '';
        
        perks.forEach(perk => {
            const card = document.createElement('div');
            card.className = 'perk-card';
            card.innerHTML = `
                <div class="perk-name">${perk.name}</div>
                <div class="perk-desc">${perk.desc}</div>
            `;
            card.onclick = () => {
                this.modals.levelUp.style.display = 'none';
                onSelect(perk);
            };
            container.appendChild(card);
        });
        
        this.modals.levelUp.style.display = 'flex';
    },

    showItemReward(item) {
        // Reuse zine modal for item rewards for now, or create a specific one
        document.getElementById('zine-title').textContent = item.name || item.type;
        document.getElementById('zine-content').innerHTML = `<p>${item.desc || 'A valuable piece of history.'}</p>`;
        
        const coverImg = document.getElementById('zine-cover');
        if (item.image) {
            coverImg.src = item.image;
            coverImg.style.display = 'block';
        } else {
            // Fallback for scrap
            if (item.name?.includes('Scrap')) coverImg.src = '/images/items/scrap.png';
            else if (item.name?.includes('Brick')) coverImg.src = '/images/items/brick.png';
            else if (item.name?.includes('Token')) coverImg.src = '/images/items/history_token.png';
            else coverImg.style.display = 'none';
            
            if (coverImg.src.includes('items')) coverImg.style.display = 'block';
        }
        
        this.modals.zine.style.display = 'flex';
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

    showCamp(gameState, onEnterDungeon, onUpgradeHealth, onUpgradeDamage, lineage, onDifficultyChange, onResetCheckpoint) {
        this.currentGame = gameState;
        this.modals.camp.style.display = 'flex';
        if (lineage) this.renderLineage(lineage);

        const updateCampUI = () => {
            document.getElementById('camp-treasures').textContent = gameState.persistent.treasures;
            document.getElementById('cost-health').textContent = gameState.persistent.healthCost;
            document.getElementById('cost-damage').textContent = gameState.persistent.damageCost;

            const healthLvl = gameState.persistent.healthUpgrades || 0;
            const dmgLvl = gameState.persistent.damageUpgrades || 0;
            const lvlHealth = document.getElementById('lvl-health');
            const lvlDamage = document.getElementById('lvl-damage');
            const bonusHealth = document.getElementById('bonus-health');
            const bonusDamage = document.getElementById('bonus-damage');
            if (lvlHealth) lvlHealth.textContent = healthLvl;
            if (lvlDamage) lvlDamage.textContent = dmgLvl;
            if (bonusHealth) bonusHealth.textContent = `+${healthLvl} heart${healthLvl === 1 ? '' : 's'}`;
            if (bonusDamage) bonusDamage.textContent = `+${dmgLvl} dmg`;

            const cpEl = document.getElementById('camp-checkpoint');
            const dpEl = document.getElementById('camp-deepest');
            if (cpEl) cpEl.textContent = gameState.persistent.checkpointDepth || 1;
            if (dpEl) dpEl.textContent = gameState.persistent.deepestReached || 1;
            const resetBtn = document.getElementById('reset-checkpoint-btn');
            if (resetBtn) resetBtn.disabled = (gameState.persistent.checkpointDepth || 1) <= 1;

            document.getElementById('upgrade-health-btn').disabled = gameState.persistent.treasures < gameState.persistent.healthCost;
            document.getElementById('upgrade-damage-btn').disabled = gameState.persistent.treasures < gameState.persistent.damageCost;
        };

        updateCampUI();
        // Wire the checkpoint reset button each time the camp opens.
        const resetBtn = document.getElementById('reset-checkpoint-btn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (onResetCheckpoint) onResetCheckpoint();
                updateCampUI();
            };
        }

        // Replay-intro button hides the camp, plays the cinematic, then re-opens
        // the camp when the player skips/finishes — no progress lost.
        const replayBtn = document.getElementById('replay-intro-btn');
        if (replayBtn && typeof window.__playIntro === 'function') {
            replayBtn.onclick = () => {
                this.modals.camp.style.display = 'none';
                window.__playIntro(() => {
                    this.modals.camp.style.display = 'flex';
                    updateCampUI();
                });
            };
        }

        // -------------------------------------------------------------------
        // Difficulty selector. Lazy-build once, then re-highlight current pick
        // every time the camp opens.
        let diffRow = document.getElementById('difficulty-row');
        if (!diffRow) {
            diffRow = document.createElement('div');
            diffRow.id = 'difficulty-row';
            diffRow.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;margin:14px 0;padding:10px;border:2px dashed var(--punk-cyan);';

            const heading = document.createElement('div');
            heading.style.cssText = 'color:var(--punk-cyan);font-size:18px;text-align:center;text-shadow:0 0 6px var(--punk-cyan);';
            heading.textContent = '⚔ DIFFICULTY ⚔';
            diffRow.appendChild(heading);

            const buttons = document.createElement('div');
            buttons.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;';
            ['easy', 'normal', 'hard'].forEach(id => {
                const d = DIFFICULTIES[id];
                const btn = document.createElement('button');
                btn.className = 'upgrade-btn';
                btn.dataset.diff = id;
                btn.style.cssText = `padding:8px 14px;font-size:18px;border-color:${d.color};color:${d.color};display:flex;flex-direction:column;align-items:center;gap:2px;min-width:120px;`;
                const label = document.createElement('span');
                label.textContent = d.label;
                label.style.cssText = 'font-weight:bold;font-size:18px;';
                const tagline = document.createElement('span');
                tagline.textContent = d.tagline;
                tagline.style.cssText = 'font-size:11px;opacity:0.85;text-transform:none;';
                btn.appendChild(label);
                btn.appendChild(tagline);
                btn.onclick = () => {
                    if (onDifficultyChange) onDifficultyChange(id);
                    diffRow.querySelectorAll('button').forEach(b => {
                        const dd = DIFFICULTIES[b.dataset.diff];
                        b.style.borderColor = dd.color;
                        b.style.boxShadow = '';
                    });
                    btn.style.boxShadow = `0 0 18px ${d.color}`;
                    btn.style.borderColor = d.color;
                };
                buttons.appendChild(btn);
            });
            diffRow.appendChild(buttons);

            const enterBtn = document.getElementById('enter-dungeon-btn');
            enterBtn.parentNode.insertBefore(diffRow, enterBtn);
        }
        // Highlight the persistent choice every time camp opens.
        diffRow.querySelectorAll('button').forEach(b => {
            const dd = DIFFICULTIES[b.dataset.diff];
            b.style.borderColor = dd.color;
            if (b.dataset.diff === (gameState.persistent.difficulty || 'normal')) {
                b.style.boxShadow = `0 0 18px ${dd.color}`;
            } else {
                b.style.boxShadow = '';
            }
        });
        
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

    start(game, npcKey, onClose) {
        this.currentGame = game;
        this.onCloseCallback = onClose || null;
        this.currentNPC = HISTORICAL_FIGURES[npcKey];
        this.currentNPCKey = npcKey;

        // Show the NPC's hand-drawn sprite as the portrait, falling back to generic.
        const portraitEl = document.querySelector('#conversation-modal img');
        if (portraitEl) {
            const spriteKey = window.NPC_SPRITES && window.NPC_SPRITES[npcKey];
            portraitEl.src = (spriteKey && window.ASSET_PATHS && window.ASSET_PATHS[spriteKey])
                || '/images/portrait_npc.png';
        }

        if (!game.persistent.npcEncounters) game.persistent.npcEncounters = {};
        game.persistent.npcEncounters[npcKey] = (game.persistent.npcEncounters[npcKey] || 0) + 1;
        const runs = game.persistent.npcEncounters[npcKey];
        
        if (this.currentNPC.dialogue_variants) {
            let selectedVariant = 'greeting';
            const keys = Object.keys(this.currentNPC.dialogue_variants).map(Number).sort((a,b) => b-a);
            for (const k of keys) {
                if (runs >= k) {
                    selectedVariant = this.currentNPC.dialogue_variants[k];
                    break;
                }
            }
            this.currentNode = selectedVariant;
        } else {
            this.currentNode = 'greeting';
        }

        document.getElementById('conversation-name').textContent = `${this.currentNPC.name} (${this.currentNPC.era})`;
        UI.modals.conversation.style.display = 'flex';

        this.renderNode();
    },

    renderNode() {
        const node = this.currentNPC.dialogue[this.currentNode];
        document.getElementById('conversation-text').textContent = node.text;
        
        // AI TTS - Speak the NPC text
        Audio.speak(node.text);
        
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

        // Add "Fact Check" button for Google Search integration
        if (this.currentNPC.fact) {
            const factBtn = document.createElement('button');
            factBtn.className = 'conversation-btn';
            factBtn.style.borderColor = '#FFD700';
            factBtn.style.color = '#FFD700';
            factBtn.innerHTML = '🔍 FACT CHECK (Search)';
            factBtn.onclick = () => {
                UI.addMessage(`[Google Search Data]: ${this.currentNPC.fact}`, 'special');
                Audio.speak(`Search result: ${this.currentNPC.fact}`);
            };
            choicesContainer.appendChild(factBtn);
        }

        // Quest buttons — accept available quests, check progress on active ones,
        // turn in ready ones. Only the giver/turnInWith NPC sees the button.
        const quests = (typeof window.__questsForGiver === 'function')
            ? window.__questsForGiver(this.currentNPCKey)
            : [];
        for (const q of quests) {
            const status = q.state.status;
            if (status === 'completed') continue;
            const btn = document.createElement('button');
            btn.className = 'conversation-btn';
            if (status === 'available') {
                btn.style.borderColor = '#39FF14';
                btn.style.color = '#39FF14';
                btn.innerHTML = `📋 [QUEST] ${q.title} — ${q.summary}`;
                btn.onclick = () => {
                    document.getElementById('conversation-text').textContent = q.acceptDialog;
                    Audio.speak(q.acceptDialog);
                    window.__acceptQuest && window.__acceptQuest(q.id);
                    setTimeout(() => this.renderNode(), 50);
                };
            } else if (status === 'active') {
                btn.style.borderColor = '#01CDFE';
                btn.style.color = '#01CDFE';
                btn.innerHTML = `📋 [IN PROGRESS] ${q.title} — ${q.state.progress}/${q.goal.target}`;
                btn.onclick = () => {
                    document.getElementById('conversation-text').textContent = q.pendingDialog;
                    Audio.speak(q.pendingDialog);
                };
            } else if (status === 'ready') {
                btn.style.borderColor = '#FFD700';
                btn.style.color = '#FFD700';
                btn.innerHTML = `✓ [TURN IN] ${q.title}`;
                btn.onclick = () => {
                    document.getElementById('conversation-text').textContent = q.completeDialog;
                    Audio.speak(q.completeDialog);
                    window.__turnInQuest && window.__turnInQuest(q.id);
                    setTimeout(() => this.renderNode(), 50);
                };
            }
            choicesContainer.appendChild(btn);
        }
    },

    applyEffects(node) {
        if (node.effect === 'heal_full') {
            this.currentGame.player.health = this.currentGame.player.maxHealth;
            UI.addMessage("You are fully healed!", "healing");
            UI.updateStatus(this.currentGame);
        }
        if (node.effect === 'charm_lesson') {
            // Mama Gloria's lesson: permanent +1 max HP + particles
            this.currentGame.player.maxHealth += 1;
            this.currentGame.player.health = this.currentGame.player.maxHealth;
            this.currentGame.persistent.permanentHearts = (this.currentGame.persistent.permanentHearts || 0) + 1;
            UI.addMessage("Mama Gloria's lesson: head up, shoulders back. PERMANENT +1 HEART.", "special");
            UI.updateStatus(this.currentGame);
            for (let i = 0; i < 25; i++) {
                this.currentGame.particles && this.currentGame.particles.push({
                    x: this.currentGame.player.x + 0.35, y: this.currentGame.player.y,
                    vx: (Math.random() - 0.5) * 0.5, vy: -Math.random() * 0.6,
                    life: 1.2, color: ['#20B2AA', '#98FB98', '#FFD700'][i % 3], size: 2.5
                });
            }
        }
        if (node.effect === 'community_heal') {
            // Community mothers: full heal + 200-frame defense buff
            this.currentGame.player.health = this.currentGame.player.maxHealth;
            this.currentGame.player.defenseBuff = Math.max(this.currentGame.player.defenseBuff || 0, 200);
            UI.addMessage("The Chosen Family heals you completely. Defense strengthened for 200 frames.", "healing");
            UI.updateStatus(this.currentGame);
            for (let i = 0; i < 25; i++) {
                this.currentGame.particles && this.currentGame.particles.push({
                    x: this.currentGame.player.x + 0.35,
                    y: this.currentGame.player.y,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: -Math.random() * 0.5,
                    life: 1.2,
                    color: ['#F5A9B8', '#5BCEFA', '#FFD700'][i % 3],
                    size: 2.5
                });
            }
        }
        if (node.reward) {
            if (node.reward === 'item_brick') {
                this.currentGame.player.hasBrick = true;
                UI.addMessage("Received: Stonewall Brick (+1 dmg)", "special");
            } else if (node.reward === 'item_shield') {
                // Shield of Civic Courage — 300-frame damage immunity
                this.currentGame.player.damageImmune = Math.max(this.currentGame.player.damageImmune || 0, 300);
                UI.addMessage("Received: Shield of Civic Courage (damage immunity 300 frames)!", "special");
                for (let i = 0; i < 20; i++) {
                    this.currentGame.particles && this.currentGame.particles.push({
                        x: this.currentGame.player.x + 0.35,
                        y: this.currentGame.player.y,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: -Math.random() * 0.6,
                        life: 1.0,
                        color: '#5BCEFA',
                        size: 3
                    });
                }
            } else if (node.reward === 'item_bloom') {
                // Resilience Bloom — regen 0.02 HP/frame for 600 frames
                this.currentGame.player.bloomRegen = Math.max(this.currentGame.player.bloomRegen || 0, 600);
                this.currentGame.player.bloomRate = 0.02;
                UI.addMessage("Received: Resilience Bloom (regen 0.02 HP/frame for 600 frames)!", "healing");
            } else if (node.reward === 'reveal_passage') {
                // Blade journalists reveal hidden mural passages
                const g = this.currentGame;
                if (g.muralTiles) {
                    const msgs = ["The Blade doesn't stop printing", "Press freedom is trans freedom",
                                  "Every silenced voice echoes here", "We documented this. It happened."];
                    let revealed = 0;
                    for (let rx = 0; rx < 4 && revealed < 3; rx++) {
                        for (let ry = 0; ry < 3 && revealed < 3; ry++) {
                            const wx = rx * 10 + 1 + Math.floor(Math.random() * 8);
                            const wy = ry * 10;
                            const mk = `${wx},${wy}`;
                            if (!g.muralTiles[mk]) {
                                g.muralTiles[mk] = msgs[revealed % msgs.length];
                                if (g.seen) g.seen[mk] = true;
                                revealed++;
                            }
                        }
                    }
                }
                UI.addMessage("The journalists reveal hidden passages through the archive!", "special");
            } else if (node.reward === 'ability_rage') {
                this.currentGame.player.hasRage = true;
                UI.addMessage("Received: Ancestor Rage (2x damage!)", "special");
            } else if (node.reward === 'ability_vision') {
                this.currentGame.player.extraJumps = (this.currentGame.player.extraJumps || 0) + 1;
                UI.addMessage("Received: Artistic Vision (+1 jump)!", "special");
            } else if (node.reward === 'labeija_trophy') {
                // Crystal LaBeija / MJ Rodriguez: full heal + 6s damage boost
                this.currentGame.player.health = this.currentGame.player.maxHealth;
                this.currentGame.player.lootBuff = Math.max(this.currentGame.player.lootBuff || 0, 360);
                UI.addMessage("LaBeija's Trophy AWARDED! Full heal + damage boost — the floor is yours!", "special");
                UI.updateStatus(this.currentGame);
                for (let i = 0; i < 35; i++) {
                    this.currentGame.particles && this.currentGame.particles.push({
                        x: this.currentGame.player.x + 0.35, y: this.currentGame.player.y,
                        vx: (Math.random() - 0.5) * 0.7, vy: -Math.random() * 0.8,
                        life: 1.4, color: i % 2 ? '#FFD700' : '#FF1493', size: 3
                    });
                }
            } else if (node.reward === 'star_solidarity') {
                // Kenya Cuevas: full heal + defense buff + shelter revealed
                const g = this.currentGame;
                g.player.health = g.player.maxHealth;
                g.player.defenseBuff = Math.max(g.player.defenseBuff || 0, 300);
                if (g.safeShelterRooms && g.safeShelterRooms.size === 0) {
                    const rx = Math.floor(Math.random() * 4), ry = Math.floor(Math.random() * 3);
                    g.safeShelterRooms.add(`${rx},${ry}`);
                }
                UI.addMessage("Kenya's solidarity: full heal + defense 300 frames. A shelter opens.", "healing");
                UI.updateStatus(g);
                for (let i = 0; i < 25; i++) {
                    g.particles && g.particles.push({
                        x: g.player.x + 0.35, y: g.player.y,
                        vx: (Math.random() - 0.5) * 0.5, vy: -Math.random() * 0.6,
                        life: 1.0, color: i % 2 ? '#FF4500' : '#FFD700', size: 2.5
                    });
                }
            } else if (node.reward === 'wewha_blessing') {
                // We'wha: +1 jump + full heal + earth-tone particles
                this.currentGame.player.health = this.currentGame.player.maxHealth;
                this.currentGame.player.extraJumps = (this.currentGame.player.extraJumps || 0) + 1;
                UI.addMessage("We'wha's blessing: full heal + the river grants you another jump.", "healing");
                UI.updateStatus(this.currentGame);
                for (let i = 0; i < 28; i++) {
                    this.currentGame.particles && this.currentGame.particles.push({
                        x: this.currentGame.player.x + 0.35, y: this.currentGame.player.y,
                        vx: (Math.random() - 0.5) * 0.5, vy: -Math.random() * 0.7,
                        life: 1.1, color: ['#8B4513', '#32CD32', '#98FB98'][i % 3], size: 2
                    });
                }
            } else {
                UI.addMessage(`Received: ${node.reward}`, "special");
            }
        }
    },

    close() {
        UI.modals.conversation.style.display = 'none';
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        const cb = this.onCloseCallback;
        this.currentGame = null;
        this.currentNPC = null;
        this.currentNode = null;
        this.onCloseCallback = null;
        if (cb) cb();
    }
};

// Lightweight, fully-offline "AI" responder. Maps the player's typed input to
// a category of in-world responses so the Archive Spirit always sounds like
// it's speaking from inside QUEEKRAFT's wasteland — no network calls needed.
function geminiRespond(input) {
    const t = (input || '').toLowerCase().trim();
    if (!t) return "Speak, keeper. The archive listens.";

    const has = (...words) => words.some(w => t.includes(w));

    if (has('hello', 'hi ', 'hey', 'greetings', 'yo')) {
        return "Hello, keeper. The archive sees you. What story do you seek?";
    }
    if (has('zine', 'archive', 'pamphlet', 'paper')) {
        return "Nineteen zines remain scattered through the depths. Each one you recover relights a fragment of our shared memory. Look behind crumbling tiles and beside fallen banners.";
    }
    if (has('ancestor', 'figure', 'historical', 'survivor', 'queer history', 'who is')) {
        const names = HISTORICAL_FIGURES
            ? Object.values(HISTORICAL_FIGURES).slice(0, 3).map(f => f.name).join(', ')
            : '';
        return `Nine ancestors walk these halls — among them ${names}. Speak with them. Their courage is your inheritance.`;
    }
    if (has('boss', 'enemy', 'mutant', 'fight', 'combat', 'attack', 'kill')) {
        return "The wasteland is hostile, but you are not alone. Three quick strikes chains a power move. Charge your weapon for a heavy hit. Dash through danger — the i-frames are real.";
    }
    if (has('jump', 'platform', 'fall', 'drop')) {
        return "Hold the jump button to leap higher. Pull the joystick down and tap jump to drop through one-way platforms. Trampolines launch you skyward — use them.";
    }
    if (has('dash', 'dodge', 'evade', 'shift')) {
        return "Dash grants brief invulnerability. Time it against an incoming swing and you'll pass right through the blow.";
    }
    if (has('scrap', 'loot', 'gold', 'money', 'currency', 'upgrade', 'shop', 'camp')) {
        return "Scrap is the language of survival. Spend it at the safehouse to permanently strengthen every future heir — more hearts, harder strikes, deeper checkpoints.";
    }
    if (has('death', 'die', 'died', 'heir', 'lineage', 'legacy', 'continue')) {
        return "When you fall, the lineage continues. An heir will take up your torch with every upgrade you bought intact. Death is a comma, not a period.";
    }
    if (has('depth', 'level', 'floor', 'descend', 'stairs')) {
        return "Each descent strengthens both you and the wasteland. Your checkpoint advances with you, so a heir need not start from depth one.";
    }
    if (has('class', 'power', 'ability', 'pwr', 'skill', 'perk')) {
        return "Your class power recharges over time — anarchist rage, archivist time-slow, brawler dash, dealer bump, aidworker aura. Each is a different kind of resistance.";
    }
    if (has('queer', 'trans', 'gay', 'lgbt', 'pride', 'liberation', 'revolution')) {
        return "We were here. We are here. We will be here. Every zine you save, every ancestor you meet, every heir you raise — that is the revolution made flesh.";
    }
    if (has('help', 'hint', 'tip', 'stuck', 'what do', 'what should', 'how do', 'how should')) {
        return "Stay mobile. Collect every glow you see. Speak with every ancestor. The wasteland rewards curiosity and punishes hesitation.";
    }
    if (has('thank', 'bye', 'goodbye', 'farewell', 'leave')) {
        return "Walk softly, keeper. The archive watches over you.";
    }
    if (has('who are you', 'what are you', 'gemini', 'spirit', 'ai')) {
        return "I am the Archive Spirit — the collected echo of every queer voice they tried to erase. I run on memory and refusal.";
    }

    // Fallback — quote a flavor line so even unknown input feels in-character.
    const stock = GEMINI_GUIDE.responses;
    return stock[Math.floor(Math.random() * stock.length)];
}

export const GeminiUI = {
    transcript: [],

    start(game) {
        const spirit = GEMINI_GUIDE;
        const opener = spirit.responses[Math.floor(Math.random() * spirit.responses.length)];

        document.getElementById('conversation-name').textContent = spirit.name;

        // Change portrait for AI
        const portrait = document.querySelector('#conversation-modal img');
        if (portrait) {
            portrait.src = '/images/portrait_gemini.png';
            portrait.style.filter = 'drop-shadow(0 0 15px var(--punk-cyan))';
            portrait.classList.add('pulse-glow');
        }

        // Replace the static text area with a scrollable transcript.
        const textEl = document.getElementById('conversation-text');
        textEl.innerHTML = '';
        textEl.classList.add('gemini-transcript');

        const append = (who, msg) => {
            const line = document.createElement('div');
            line.className = `gemini-line gemini-line-${who}`;
            const tag = document.createElement('span');
            tag.className = 'gemini-tag';
            tag.textContent = who === 'ai' ? '◆ ARCHIVE' : '▸ YOU';
            const body = document.createElement('span');
            body.className = 'gemini-body';
            body.textContent = msg;
            line.appendChild(tag);
            line.appendChild(body);
            textEl.appendChild(line);
            textEl.scrollTop = textEl.scrollHeight;
        };

        append('ai', opener);
        Audio.speak(opener);

        // Build the input row + close button in the choices container.
        const choicesContainer = document.getElementById('conversation-choices');
        choicesContainer.innerHTML = '';

        const inputRow = document.createElement('div');
        inputRow.className = 'gemini-input-row';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'gemini-input';
        input.className = 'gemini-input';
        input.placeholder = 'Ask the Archive Spirit…';
        input.autocomplete = 'off';
        input.maxLength = 200;

        const sendBtn = document.createElement('button');
        sendBtn.className = 'conversation-btn gemini-send';
        sendBtn.textContent = 'SEND';

        const submit = () => {
            const q = input.value.trim();
            if (!q) return;
            append('user', q);
            input.value = '';
            const reply = geminiRespond(q);
            // Tiny delay so it feels like the spirit is "thinking".
            setTimeout(() => {
                append('ai', reply);
                Audio.speak(reply);
            }, 220);
        };

        sendBtn.onclick = submit;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submit();
            }
        });

        inputRow.appendChild(input);
        inputRow.appendChild(sendBtn);
        choicesContainer.appendChild(inputRow);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'conversation-btn';
        closeBtn.textContent = "Thank you, Guide.";
        closeBtn.onclick = () => {
            if (portrait) {
                portrait.src = '/images/portrait_npc.png';
                portrait.style.filter = '';
                portrait.classList.remove('pulse-glow');
            }
            textEl.classList.remove('gemini-transcript');
            textEl.innerHTML = '';
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            UI.modals.conversation.style.display = 'none';
        };
        choicesContainer.appendChild(closeBtn);

        UI.modals.conversation.style.display = 'flex';
        // Auto-focus the input so a hardware keyboard works immediately;
        // on iOS this also brings up the on-screen keyboard.
        setTimeout(() => input.focus(), 50);
    }
};

document.getElementById('zine-close-btn').addEventListener('click', () => UI.closeZine());

// Hook up mural buttons
document.addEventListener('DOMContentLoaded', () => {
    const muralBtn = document.getElementById('view-mural-btn');
    const closeMuralBtn = document.getElementById('close-mural-btn');
    const muralScreen = document.getElementById('mural-screen');
    const campScreen = document.getElementById('camp-screen');

    if (muralBtn && closeMuralBtn && muralScreen) {
        muralBtn.onclick = () => {
            const list = document.getElementById('mural-list');
            list.innerHTML = '';
            
            // Need game object, we can pull it from window or UI.currentGame
            const game = UI.currentGame;
            const mural = (game && game.persistent && game.persistent.mural) ? game.persistent.mural : [];
            
            if (mural.length === 0) {
                list.innerHTML = '<div style="color: #888; text-align: center;">The mural is empty. Be the first to leave a legacy.</div>';
            } else {
                mural.forEach(m => {
                    const el = document.createElement('div');
                    el.style.cssText = 'background: rgba(1, 205, 254, 0.1); border: 1px solid #01CDFE; padding: 10px; border-radius: 4px;';
                    el.innerHTML = `
                        <span style="color: #FF71CE; font-weight: bold; font-size: 18px;">${m.name}</span>
                        <span style="color: #aaa; font-size: 14px;">(${m.className})</span><br>
                        <span style="color: #39FF14; font-size: 14px;">Reached Depth ${m.depth}</span> ·
                        <span style="color: #FFD700; font-size: 14px;">${m.zines} Zines</span>
                    `;
                    list.appendChild(el);
                });
            }
            
            campScreen.style.display = 'none';
            muralScreen.style.display = 'flex';
        };
        
        closeMuralBtn.onclick = () => {
            muralScreen.style.display = 'none';
            campScreen.style.display = 'flex';
        };
    }
});
