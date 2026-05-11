const fs = require('fs');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

// The rendering for ~ and T uses manual fillRect. Let's replace it to use the new patterns.
mainJs = mainJs.replace(/} else if \(r\.tile === '~'\) \{[\s\S]*?\} else if \(r\.tile === 'T'\) \{[\s\S]*?\} else \{/m, 
`} else if (r.tile === '~') {
                drawTile(ctx, sx, sy, '#1a3a4a', true, r.isVisible ? 'rgba(91,206,250,0.45)' : null, r.isVisible ? patterns.ice : null);
            } else if (r.tile === 'T') {
                drawTile(ctx, sx, sy, '#1a0a14', true, null, r.isVisible ? patterns.trampoline : null);
            } else if (r.tile === '^') {
                drawTile(ctx, sx, sy, '#1a0a14', false, null, r.isVisible ? patterns.spikes : null);
            } else if (r.tile === '=') {
                drawTile(ctx, sx, sy, '#1a0a14', false, null, r.isVisible ? patterns.platform : null);
            } else if (r.tile === 'C') {
                const broke = game.crumbleState && game.crumbleState[\`\${r.x},\${r.y}\`] && game.crumbleState[\`\${r.x},\${r.y}\`].broken;
                if (!broke) drawTile(ctx, sx, sy, '#1a0a14', false, null, r.isVisible ? patterns.dirt : null);
            } else {`);

fs.writeFileSync('src/main.js', mainJs);
