const fs = require('fs');
let code = fs.readFileSync('src/main.js', 'utf8');

const resolved = `    boss:      '/images/spr_dark_beast.png',
    chest:     '/images/spr_chest.png',
    chest_open:'/images/spr_chest_open.png',
    marsha:    '/images/spr_marsha.png',
    zine:      '/images/spr_zine.png',

    // Per-figure NPC overrides (renderer falls back to procedural filler)
    npc_community_mothers: '/images/spr_community_mothers.png',

    // Enemy variants — keyed by ENEMY_SPRITES below
    enemy_dark_beast:      '/images/spr_dark_beast.png',
    enemy_ghost:           '/images/spr_ghost_enemy.png',
    enemy_bureaucracy:     '/images/spr_bureaucracy_enemy.png',
    enemy_corporate_drone: '/images/spr_corporate_drone.png',
    enemy_gentrifier:      '/images/spr_gentrifier.png',
    enemy_hb2_enforcer:    '/images/spr_hb2_enforcer.png',

    // Themed loot art — referenced via NAMED_LOOT_SPRITES below
    loot_crown:              '/images/spr_crown.png',
    loot_pride_medallion:    '/images/spr_pride_medallion.png',
    loot_bouquet:            '/images/spr_bouquet.png',
    loot_banjo:              '/images/spr_banjo.png',
    loot_chalk_bag:          '/images/spr_chalk_bag.png',
    loot_bike_lock:          '/images/spr_bike_lock.png',
    loot_bike_lock_grounded: '/images/spr_bike_lock_grounded.png',
    loot_forage_basket:      '/images/spr_forage_basket.png',
    loot_gravl_heart:        '/images/spr_gravl_heart.png',
    loot_spray_can:          '/images/spr_spray_can.png',
    loot_tattoo_gun:         '/images/spr_tattoo_gun.png',

    tile_floor: '/images/tile_floor.png',
    tile_wall: '/images/tile_wall.png',
    tile_platform: '/images/tile_platform.png',
    tile_dirt: '/images/tile_dirt.png',
    tile_grass: '/images/tile_grass.png',
    tile_ice: '/images/tile_ice.png',
    tile_trampoline: '/images/tile_trampoline.png',
    tile_spikes: '/images/tile_spikes.png',
    tile_water: '/images/tile_water.png',
    tile_acid: '/images/tile_acid.png',
    tile_neon_border: '/images/tile_neon_border.png',
    tile_background: '/images/tile_background.png'
};

// Enemy type → sprite key. Renderer falls back to generic \`enemy\` art
// when an enemyType isn't listed (swarm stays procedural; boss uses \`boss\`).
const ENEMY_SPRITES = {
    troll:      'enemy_dark_beast',
    wraith:     'enemy_ghost',
    gatekeeper: 'enemy_bureaucracy',
    concern:    'enemy_corporate_drone',
    bigot:      'enemy_gentrifier',
    police:     'enemy_hb2_enforcer'
};

// Named-loot → sprite key. Renderer looks up loot.name here so themed
// legendary/epic drops get unique art instead of the generic gem.
const NAMED_LOOT_SPRITES = {
    'Crown of Eleanor Rykener':         'loot_crown',
    "LaBeija's Trophy":                 'loot_pride_medallion',
    'The Mausoleum Flower':             'loot_bouquet',
    'Hearth Stone':                     'loot_gravl_heart',
    "Mother's Fierce Light":            'loot_pride_medallion',
    "House Mother's Sash":              'loot_pride_medallion',
    'Stonewall Brick':                  'loot_bike_lock_grounded',
    "Compton's Cafeteria Sugar Shaker": 'loot_chalk_bag',
    "Lili's Last Brushstroke":          'loot_spray_can',
    'Safe Shelter Key':                 'loot_bike_lock',
    'STAR House Key':                   'loot_bike_lock',
    "Rivera's Megaphone":               'loot_spray_can',
    "Mama Gloria's Charm Book":         'loot_forage_basket',
    "Mariela's Tarot Deck":             'loot_forage_basket',
    "Boylan's Memoir":                  'loot_forage_basket',
    'Vicks Touch of Care':              'loot_chalk_bag',
    "Sawant's Petition":                'loot_banjo',
    'Homegrown Families Blessing':      'loot_bouquet',
    "Marsha's Hairpin":                 'loot_pride_medallion',
    "Sylvia's Lighter":                 'loot_spray_can',
    'Stonewall Coin':                   'loot_pride_medallion',
    "Hirschfeld's Notes":               'loot_forage_basket',
    "Christine's Letter":               'loot_forage_basket',
    'Gilded Pronoun Pin':               'loot_pride_medallion',
    "Eleanor's Diary":                  'loot_forage_basket',
    'Resistance Pin':                   'loot_pride_medallion',
    'Pride Shoelace':                   'loot_pride_medallion',
    'Youth OUTright Badge':             'loot_pride_medallion',
    "Mutual-Aid Token":                 'loot_chalk_bag',
    'Solidarity Charm':                 'loot_pride_medallion',
    'Liberation Pamphlet':              'loot_forage_basket'`;

// Replace everything from <<<<<<< HEAD to >>>>>>> ... with `resolved`
const regex = /<<<<<<< HEAD[\s\S]*?>>>>>>> [^\n]+/m;
code = code.replace(regex, resolved);
fs.writeFileSync('src/main.js', code);
