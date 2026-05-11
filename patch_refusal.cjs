const fs = require('fs');

let uiCode = fs.readFileSync('src/ui.js', 'utf8');

const refusalCode = `
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
`;

// Insert startRefusal inside UI object
uiCode = uiCode.replace(/showGameOver\(game, msg\) \{/, refusalCode + '\n    showGameOver(game, msg) {');
fs.writeFileSync('src/ui.js', uiCode);


let mainCode = fs.readFileSync('src/main.js', 'utf8');
const interactPatch = `
    // REFUSAL MECHANIC
    const refusalTarget = game.trolls.find(t => entityNear(t) && (t.enemyType === 'concern' || t.enemyType === 'bigot' || t.enemyType === 'gatekeeper'));
    if (refusalTarget) {
        UI.startRefusal(game, refusalTarget);
        return;
    }

    const npc = game.npcs.find(n => entityNear(n));
`;
mainCode = mainCode.replace(/const npc = game\.npcs\.find\(n => entityNear\(n\)\);/, interactPatch);
fs.writeFileSync('src/main.js', mainCode);
