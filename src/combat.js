import { UI } from './ui.js';
import { Audio } from './audio.js';

export function attackEnemy(game, dx, dy, type) {
    if (game.player.attackCooldown > 0) return; // silently block — no spam message
    
    // Determine target based on player facing direction
    const targetX = game.player.x + dx;
    const targetY = game.player.y + dy;
    
    const enemy = game.trolls.find(t => t.x === targetX && t.y === targetY);
    
    if (!enemy) {
        if (type !== 'blast') {
            // no cooldown on a miss — can swing freely
            game.attackAnim = { x: game.player.x, y: game.player.y, dx: dx, dy: dy, life: 8, weaponType: type === 'power' ? 'sword' : 'spoon' };
            game.turnCounter++;
        }
        return;
    }
    
    // Wraith dodge mechanic
    if (enemy.enemyType === 'wraith' && Math.random() < 0.5) {
        UI.addMessage("The Wraith dodged your attack!", "combat");
        Audio.playStep(); // Whoosh
        return;
    }
    
    let damage = game.player.baseDamage;
    let knockback = false;
    
    if (type === 'power') {
        damage = game.player.baseDamage * 2;
        knockback = true;
        game.player.attackCooldown = 2; // power attack has brief cooldown
    } else {
        game.player.attackCooldown = 0; // quick attack — no delay!
    }

    if (game.player.trait) {
        if (game.player.trait.id === 'euphoria') {
            game.player.attackCooldown = 0;
            damage += 1;
        }
    }

    if (game.player.hasBrick) damage += 1;
    if (game.player.hasRage) damage *= 2;
    
    enemy.health -= damage;
    UI.addMessage(`Hit troll for ${damage} damage!`, 'combat');
    UI.shakeScreen();
    Audio.playHit();
    
    // Attack Animation
    game.attackAnim = { x: game.player.x, y: game.player.y, dx: dx, dy: dy, life: 8, weaponType: type === 'power' ? 'sword' : 'spoon' };
    
    // Floating Damage Text
    game.floatingText.push({
        x: enemy.x, y: enemy.y, text: `-${damage}`, life: 30, color: '#FF71CE'
    });
    
    // Spawn neon particles!
    for (let i = 0; i < 15; i++) {
        game.particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            life: 1.0, color: '#FF71CE' // Neon Pink
        });
    }
    
    if (knockback) {
        const kx = enemy.x + dx;
        const ky = enemy.y + dy;
        if (game.map[`${kx},${ky}`] === '.' && !game.trolls.find(t => t.x === kx && t.y === ky)) {
            enemy.x = kx;
            enemy.y = ky;
        }
    }
    
    if (enemy.health <= 0) {
        UI.addMessage(`${enemy.enemyType === 'boss' ? 'THE BOSS' : 'Enemy'} defeated!`, 'victory');
        game.trolls = game.trolls.filter(t => t !== enemy);
        
        // Death explosion
        let expCount = enemy.enemyType === 'boss' ? 100 : 20;
        for (let i = 0; i < expCount; i++) {
            game.particles.push({
                x: enemy.x, y: enemy.y,
                vx: (Math.random() - 0.5) * (enemy.enemyType === 'boss' ? 1.0 : 0.5),
                vy: (Math.random() - 0.5) * (enemy.enemyType === 'boss' ? 1.0 : 0.5),
                life: 1.0, color: '#01CDFE' // Neon Cyan
            });
        }
        
        if (enemy.enemyType === 'boss') {
            UI.addMessage("🎉 BOSS DEFEATED! MASSIVE SCRAP REWARD! 🎉", "special");
            game.treasures += 15;
            game.persistent.treasures += 15;
            game.player.health = game.player.maxHealth;
            Audio.playLoot();
            // Drop a bunch of healing and scrap around the boss
            const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
            dirs.forEach(d => {
                game.items.push({ x: enemy.x + d[0], y: enemy.y + d[1], type: 'treasure', name: 'Boss Scrap' });
            });
        }
    }
    
    if (type !== 'blast') {
        game.turnCounter++;
    }
}

export function takeDamage(game, amount = 1) {
    if (game.player.hurtCooldown > 0) return; // Invincibility frames
    
    game.player.health -= amount;
    UI.addMessage("A troll claws you!", 'death');
    UI.shakeScreen();
    Audio.playDamage();
    
    game.player.hurtCooldown = 3; // Turns of invincibility
    
    game.floatingText.push({
        x: game.player.x, y: game.player.y, text: `-${amount}`, life: 30, color: '#01CDFE'
    });
    
    UI.updateStatus(game);
    
    if (game.player.health <= 0) {
        game.player.alive = false;
        UI.showGameOver(game, "You succumbed to your wounds.");
    }
}
