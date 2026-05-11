const fs = require('fs');

let data = fs.readFileSync('src/data.js', 'utf8');

const zineMapping = {
    'tucking': 'zine_diy',
    'binding': 'zine_punk',
    'hrt': 'zine_herbal',
    'legal': 'zine_abolition',
    'consent': 'zine_mutual_aid',
    'pronouns': 'zine_queer',
    'gendertrash': 'zine_punk',
    'faith': 'zine_witch',
    'landscape': 'zine_appalachia',
    'godwithin': 'zine_history',
    'drrad': 'zine_herbal',
    'insurrection': 'zine_anarchist',
    'genderreal': 'zine_art',
    'gaylordphoenix': 'zine_art',
    'affirmations': 'zine_poetry',
    'theywalk': 'zine_poetry',
    'alexlearns': 'zine_history',
    'euphoria': 'zine_music',
    'menstruation': 'zine_witch',
    'ballroom_legacy': 'zine_history',
    'star_manifesto': 'zine_anarchist',
    'trans_motherhood': 'zine_queer',
    'chosen_family_guide': 'zine_mutual_aid'
};

for (const [key, image] of Object.entries(zineMapping)) {
    const regex = new RegExp(`('${key}':\\s*\\{\\s*title:\\s*[^,]+,)`);
    data = data.replace(regex, `$1 image: '/images/${image}.png',`);
    // Also remove the old image: '/images/items/zine_tucking.png' if it exists
    const regex2 = new RegExp(`('${key}':\\s*\\{\\s*title:\\s*[^,]+,\\s*)image:\\s*'[^']+',\\s*`);
    data = data.replace(regex2, `$1`);
}

// Ensure tucking doesn't have double image tags due to old format
data = data.replace(/'tucking': \{ title: 'Safe Tucking Guide', image: '\/images\/items\/zine_tucking\.png', content:/, 
                    "'tucking': { title: 'Safe Tucking Guide', image: '/images/zine_diy.png', content:");

const itemMapping = {
    'flag': 'item_pride_flag',
    'nametag': 'item_kindred',
    'letter': 'item_outright',
    'meds': 'item_trans_charm',
    'pin': 'item_resistance_pin',
    'photo': 'item_stonewall',
    'mirror': 'item_civic_shield',
    'notes': 'item_archive'
};

for (const [key, image] of Object.entries(itemMapping)) {
    const regex = new RegExp(`('${key}':\\s*\\{.*?image:\\s*)'[^']+'`);
    data = data.replace(regex, `$1'/images/${image}.png'`);
}

const healingMapping = {
    'tea': 'item_tea',
    'book': 'item_book',
    'crystal': 'item_crystal'
};

for (const [key, image] of Object.entries(healingMapping)) {
    const regex = new RegExp(`('${key}':\\s*\\{.*?image:\\s*)'[^']+'`);
    data = data.replace(regex, `$1'/images/${image}.png'`);
}

fs.writeFileSync('src/data.js', data);
