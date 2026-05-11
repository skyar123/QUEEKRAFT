const fs = require('fs');

let data = fs.readFileSync('src/data.js', 'utf8');

const zineMapping = {
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
    const regex = new RegExp(`('${key}':\\s*\\{.*?title:\\s*'.*?',)\\s*content:`, 'g');
    data = data.replace(regex, `$1 image: '/images/${image}.png', content:`);
}

fs.writeFileSync('src/data.js', data);
