export const ZINES = {
    'tucking': { title: 'Safe Tucking Guide', image: '/images/items/zine_tucking.png', content: '<h3>Safe Tucking</h3><p>Medical tape only, never duct tape! Take breaks every 8 hours. Your safety comes first.</p>' },
    'binding': { title: 'Chest Binding Safety', content: '<h3>Binding Safety</h3><p>Use proper binders, never ace bandages. Listen to your body. Take breaks.</p>' },
    'hrt': { title: 'HRT Guide', content: '<h3>Hormone Therapy</h3><p>Work with qualified doctors. Informed consent clinics are available. You deserve care.</p>' },
    'legal': { title: 'Legal Rights', content: '<h3>Know Your Rights</h3><p>Title VII protects employment. Laws vary by location. Knowledge is power.</p>' },
    'consent': { title: 'Consent Guide', content: '<h3>Consent & Communication</h3><p>Freely given, informed, enthusiastic, ongoing, specific. Always.</p>' },
    'pronouns': { title: 'Pronoun Guide', content: '<h3>Using Pronouns</h3><p>Ask when appropriate, practice consistently, correct mistakes quickly.</p>' },
    'gendertrash': { title: 'gendertrash from hell', content: '<h3>Transsexual Resistance</h3><p>"We are not your gender positive genetics, we are your worst nightmare. We are the ones who refuse to disappear quietly."</p>' },
    'faith': { title: 'Faith / Fe', content: '<h3>La fuerza de las transiciones</h3><p>Queer love transcends languages, borders, bodies. Fe: believing in tomorrow when today feels impossible.</p>' },
    'landscape': { title: 'First Landscape', content: '<h3>Tentative Maps</h3><p>"My gender is unmappable. Liminal territories require different instruments: intuition, patience, willingness to get lost."</p>' },
    'godwithin': { title: 'The God Within', content: '<h3>Black Queerness Across Diaspora</h3><p>"Before they told us we were wrong, we were sacred. Pre-colonial truth: gender was a river, not a wall."</p>' },
    'drrad': { title: 'Dr. RAD\'s Queer Health Show', content: '<h3>DIY Health for Queers</h3><p>"Your body parts don\'t match their medical forms. Good health means being seen as you are, not who they think you should be."</p>' },
    'insurrection': { title: 'Toward the Queerest Insurrection', content: '<h3>Against Assimilation</h3><p>"Marriage won\'t save us. Only insurrection. Only the complete dismantling of everything that makes them comfortable."</p>' },
    'genderreal': { title: 'is gender real?', content: '<h3>Philosophical Questions</h3><p>"What do you mean by real? What do you mean by gender? Gender is a construct and so are you. The sound of freedom."</p>' },
    'gaylordphoenix': { title: 'Gaylord Phoenix', content: '<h3>Queer Mystical Adventure</h3><p>"The gaylord phoenix willing to sacrifice anything for love, for self-knowledge, for the violent beautiful truth of becoming."</p>' },
    'affirmations': { title: 'Authentic Affirmations pt. 3', content: '<h3>Still Here, Still Queer</h3><p>"You are not too much or not enough. You are exactly the right amount of yourself. Your existence is resistance."</p>' },
    'theywalk': { title: 'They Walk', content: '<h3>Nonbinary Identity</h3><p>"They/them/theirs not because I\'m confused but because I\'m clear. Walking toward the family that chooses me back."</p>' },
    'alexlearns': { title: 'Alex Learns about Gender Identity', content: '<h3>Educational Zine</h3><p>"Gender is not your body, clothes, name, or toys. Gender is YOU. Only you can know what feels right for you."</p>' },
    'euphoria': { title: 'Gender Euphoria', content: '<h3>Celebrating Trans Joy</h3><p>"Trans nonbinary/genderqueer is not a problem to be solved. It\'s a joy to be celebrated. Euphoria comes in waves."</p>' },
    'menstruation': { title: 'Zine on Menstruation', content: '<h3>Questioning Binaries</h3><p>"Not all women menstruate, not all who menstruate are women. Periods ≠ womanhood, bleeding ≠ binary."</p>' }
};

export const HISTORICAL_FIGURES = {
    'eleanor': { 
        name: 'Eleanor Rykener', 
        era: '14th Century',
        dialogue: {
            greeting: {
                text: "Greetings, young revolutionary. I am Eleanor Rykener, from 14th century London. They tried to erase me, to reduce me to their rigid categories. But I persisted.",
                choices: [
                    { text: "How did you survive?", next: "survive" },
                    { text: "I'm fighting too.", next: "fighting" }
                ]
            },
            survive: {
                text: "By living. Even in medieval times, we existed. We have always existed, defying their narrow world.",
                choices: [
                    { text: "Thank you for being here.", next: "farewell" }
                ]
            },
            fighting: {
                text: "Remember: your authenticity is not a modern invention. It is ancient, sacred, and unbreakable.",
                choices: [
                    { text: "I won't forget.", next: "farewell" }
                ]
            },
            farewell: {
                text: "Walk in strength. Here is a token of our shared history.",
                reward: 'item_history',
                choices: []
            }
        },
        fact: "Eleanor Rykener was a 14th-century individual in London who worked as an embroiderer and barmaid, and lived openly as a woman, challenging medieval gender norms."
    },
    'marsha': { 
        name: 'Marsha P. Johnson', 
        era: 'Late 20th Century',
        dialogue: {
            greeting: {
                text: "Hey honey! Marsha P. Johnson—the P stands for Pay It No Mind! You look like you're carrying the weight of the world.",
                choices: [
                    { text: "I'm trying to save our history.", next: "mission" },
                    { text: "I'm tired. So tired.", next: "tired" }
                ]
            },
            mission: {
                text: "That's beautiful, baby. History is just stories we refuse to let die. Here—take this. *hands you a brick from Stonewall*",
                reward: "item_brick",
                choices: [
                    { text: "Thank you. I won't let you down.", next: "farewell" }
                ]
            },
            tired: {
                text: "*pulls you into a hug* I know, honey. I know. But you're still here. That's revolution enough for today.",
                effect: "heal_full",
                choices: [
                    { text: "Thank you. I feel better.", next: "farewell" }
                ]
            },
            farewell: {
                text: "Pay them no mind, honey! Keep fighting!",
                choices: []
            }
        },
        fact: "Marsha P. Johnson was a key figure in the 1969 Stonewall uprising and co-founded STAR (Street Transvestite Action Revolutionaries) to support homeless queer youth."
    },
    'sylvia': {
        name: 'Sylvia Rivera',
        era: 'Late 20th Century',
        dialogue: {
            greeting: {
                text: "Sylvia Rivera speaking. I threw the second Molotov cocktail at Stonewall - it was the revolution!",
                choices: [
                    { text: "We're still fighting.", next: "fighting" },
                    { text: "Teach me how to fight.", next: "teach" }
                ]
            },
            fighting: {
                text: "If it wasn't for the drag queen, there would be no gay liberation movement. We're the front-liners!",
                choices: [{text: "We won't let them push us out.", next: "farewell"}]
            },
            teach: {
                text: "We have to be visible. We are not ashamed of who we are. Here, take this rage and use it.",
                reward: "ability_rage",
                choices: [{text: "I'll make it count.", next: "farewell"}]
            },
            farewell: {
                text: "Liberation means ALL of us.",
                choices: []
            }
        },
        fact: "Sylvia Rivera co-founded STAR with Marsha P. Johnson and was the first transgender activist to have her portrait hung in the National Portrait Gallery."
    },
    'dora': { 
        name: 'Dora Richter', 
        era: 'Early 20th Century',
        dialogue: {
            greeting: {
                text: "I am Dora Richter. In 1931, I became the first trans woman to receive successful gender-affirming surgery.",
                choices: [{text: "That must have been terrifying.", next: "science"}]
            },
            science: {
                text: "Dr. Hirschfeld's Institute was my sanctuary. We gave our bodies to science to live as the people we wanted to be.",
                choices: [{text: "Your courage lives on.", next: "farewell"}]
            },
            farewell: {
                text: "Every surgery, every experiment laid the groundwork for future generations like yourself.",
                choices: []
            }
        },
        fact: "Dora Richter was one of the first people in modern history to undergo complete gender-affirming surgery at Magnus Hirschfeld's Institute for Sexual Science in 1931."
    },
    'alan': { 
        name: 'Dr. Alan L. Hart', 
        era: 'Early 20th Century',
        dialogue: {
            greeting: {
                text: "Dr. Alan Hart at your service. Physician, radiologist, and one of the first trans men to undergo surgery in America.",
                choices: [
                    {text: "Tell me about your work.", next: "work"},
                    {text: "I need healing.", next: "heal"}
                ]
            },
            work: {
                text: "I helped save countless lives detecting tuberculosis with X-rays, but society wouldn't let me save my own.",
                choices: [{text: "We see you now.", next: "farewell"}]
            },
            heal: {
                text: "Each of us must work out for ourselves a sensible evaluation of our personalities and accomplishments. Let me tend to your wounds.",
                effect: "heal_full",
                choices: [{text: "Thank you, doctor.", next: "farewell"}]
            },
            farewell: {
                text: "Stay safe out there.",
                choices: []
            }
        },
        fact: "Dr. Alan Hart pioneered the use of X-ray photography to detect tuberculosis, saving countless lives while living authentically as a trans man in the early 20th century."
    },
    'charley': { 
        name: 'Charley Parkhurst', 
        era: '19th Century',
        dialogue: {
            greeting: {
                text: "Howdy there! Charley Parkhurst's the name. Best stagecoach driver in all of California, they said.",
                choices: [{text: "A stagecoach driver?", next: "driver"}]
            },
            driver: {
                text: "Nobody knew I was trans until after I died - lived my whole life as the man I was. Sometimes survival means keeping your truth close.",
                choices: [{text: "I'll remember that.", next: "farewell"}]
            },
            farewell: {
                text: "I found freedom on the frontier, where a person could reinvent themselves completely. Go find yours.",
                choices: []
            }
        },
        fact: "Charley Parkhurst was a famous stagecoach driver who lived as a man for decades and was the first person assigned female at birth to register to vote in a U.S. presidential election (1868)."
    },
    'lili': { 
        name: 'Lili Elbe', 
        era: 'Early 20th Century',
        dialogue: {
            greeting: {
                text: "I am Lili Elbe, Danish painter. My journey was like swimming against the current, up over a waterfall - no turning back.",
                choices: [{text: "You paved the way.", next: "art"}]
            },
            art: {
                text: "I didn't want to be a phenomenon... I wanted to be a quite normal and ordinary woman. Take my artistic vision.",
                reward: "ability_vision",
                choices: [{text: "Thank you.", next: "farewell"}]
            },
            farewell: {
                text: "Even though I died young, I lived authentically. Sometimes that is revolution enough.",
                choices: []
            }
        },
        fact: "Lili Elbe was a successful Danish painter and one of the earliest documented recipients of gender-affirming surgery, which inspired the book and film 'The Danish Girl'."
    },
    'christine': { 
        name: 'Christine Jorgensen', 
        era: 'Mid 20th Century',
        dialogue: {
            greeting: {
                text: "Hello, dear. Christine Jorgensen here. I was the first American to publicly transition.",
                choices: [{text: "The visibility must have been hard.", next: "visibility"}]
            },
            visibility: {
                text: "Visibility has a price, but it also opens doors. Sometimes we must be the lightning rod.",
                choices: [{text: "I will be brave.", next: "farewell"}]
            },
            farewell: {
                text: "The body should fit the soul, not vice versa.",
                choices: []
            }
        },
        fact: "Christine Jorgensen became an international media sensation in 1952 as the first American to publicly transition, using her platform to advocate for transgender visibility."
    },
    'lucy': { 
        name: 'Lucy Hicks Anderson', 
        era: 'Mid 20th Century',
        dialogue: {
            greeting: {
                text: "Lucy Hicks Anderson, pleased to meet you. I defied any doctor in the world to prove that I am not a woman.",
                choices: [{text: "You are an inspiration.", next: "fight"}]
            },
            fight: {
                text: "As a Black trans woman, I faced the intersection of racism and transphobia, but I never backed down.",
                choices: [{text: "We won't back down either.", next: "farewell"}]
            },
            farewell: {
                text: "Marriage equality, the right to exist - these are battles we must win for every generation.",
                choices: []
            }
        },
        fact: "Lucy Hicks Anderson was a Black trans socialite who fiercely defended her right to live and marry as a woman, stating: 'I defy any doctor in the world to prove that I am not a woman.'"
    }
};

export const TREASURES = {
    'flag': { name: 'Pride Flag', desc: 'A beautiful rainbow flag!', image: '/images/items/flag.png' },
    'nametag': { name: 'Name Tag', desc: 'Your real name in bold letters.', image: '/images/items/nametag.png' },
    'letter': { name: 'Support Letter', desc: 'Love from chosen family.', image: '/images/items/letter.png' },
    'meds': { name: 'HRT Meds', desc: 'Steps toward authenticity.', image: '/images/items/meds.png' },
    'pin': { name: 'Trans Pin', desc: 'Small but powerful symbol.', image: '/images/items/pin.png' },
    'photo': { name: 'Family Photo', desc: 'Your chosen family at Pride.', image: '/images/items/photo.png' },
    'mirror': { name: 'Affirming Mirror', desc: 'Shows your true self.', image: '/images/items/mirror.png' },
    'notes': { name: 'Therapy Notes', desc: 'Wisdom for the journey.', image: '/images/items/notes.png' }
};

export const HEALING_ITEMS = {
    'tea': { name: 'Healing Tea', desc: 'Chamomile and lavender restore you.', healing: 1, image: '/images/items/tea.png' },
    'book': { name: 'Book of Affirmations', desc: 'Self-love heals wounds.', healing: 2, image: '/images/items/book.png' },
    'crystal': { name: 'Healing Crystal', desc: 'Amethyst radiates healing energy.', healing: 3, image: '/images/items/crystal.png' }
};

export const GEMINI_GUIDE = {
    name: "AI ARCHIVE SPIRIT (GEMINI)",
    responses: [
        "I am the keeper of the Queer Archives. What would you like to know about our shared history?",
        "Every zine you collect strengthens our collective memory. Data is resistance.",
        "I can help you navigate the wasteland. My sensors detect high levels of queer joy in the deeper archives.",
        "The historical figures you meet are ancestors. Their courage is your inheritance.",
        "I am powered by the collective spirit of those who came before. How can I assist your revolution today?"
    ]
};

// ---------------------------------------------------------------------------
// Difficulty modes. damageScale multiplies enemy-dealt damage; values map
// each "1 damage" hit to fractional hearts (¼ / ½ / 1). bonusHearts is added
// to the player's max health on dungeon entry. lootBonus multiplies drop
// rolls (Easy throws more loot at you; Hard throws less but rarer loot still
// breaks through).
export const DIFFICULTIES = {
    easy:   { id: 'easy',   label: 'EASY',   damageScale: 0.25, bonusHearts: 2,  lootBonus: 1.6,  rareBonus: 1.0, color: '#39FF14',
              tagline: '¼ heart per hit · +2 hearts · loot rains' },
    normal: { id: 'normal', label: 'NORMAL', damageScale: 0.5,  bonusHearts: 0,  lootBonus: 1.0,  rareBonus: 1.0, color: '#01CDFE',
              tagline: '½ heart per hit · standard hearts · standard loot' },
    hard:   { id: 'hard',   label: 'HARD',   damageScale: 1.0,  bonusHearts: -1, lootBonus: 0.7,  rareBonus: 1.6, color: '#FF0040',
              tagline: '1 heart per hit · -1 heart · rare loot favored' }
};

// ---------------------------------------------------------------------------
// Tiered loot system — pulled from rogue-likes & ARPGs but trans-themed and
// (we hope) more interesting than Diablo 3's mostly-flat orange affix soup.
// Each tier carries a name pool, a glow color, a pickup effect, and a scrap
// reward. Effects layer (Rare+ heals; Epic+ buffs damage; Legendary stamps a
// permanent stat onto the persistent profile).
export const LOOT_TIERS = {
    common: {
        weight: 55, color: '#CCCCCC', glow: '#FFFFFF', scrap: 1,
        names: ['Bent Rebar', 'Scrap Wire', 'Cracked Mirror', 'Old Pamphlet', 'Dented Locket'],
        effect: null
    },
    uncommon: {
        weight: 28, color: '#39FF14', glow: '#39FF14', scrap: 2,
        names: ['Resistance Pin', 'Liberation Pamphlet', 'Pride Shoelace', 'Borrowed Lipstick', 'Recovered Photo'],
        effect: 'small_heal'   // +1 hp
    },
    rare: {
        weight: 12, color: '#01CDFE', glow: '#01CDFE', scrap: 4,
        names: ['Solidarity Charm', 'Mutual-Aid Token', 'Marsha\'s Hairpin', 'Sylvia\'s Lighter', 'Stonewall Coin'],
        effect: 'big_heal'     // +2 hp + +1 next hit
    },
    epic: {
        weight: 4, color: '#B967DB', glow: '#B967DB', scrap: 8,
        names: ['Hirschfeld\'s Notes', 'Christine\'s Letter', 'Gilded Pronoun Pin', 'Eleanor\'s Diary'],
        effect: 'rage_vial'    // +3 hp + 6s damage boost
    },
    legendary: {
        weight: 1, color: '#FFD700', glow: '#FFD700', scrap: 20,
        names: ['Stonewall Brick', 'Compton\'s Cafeteria Sugar Shaker', 'Crown of Eleanor Rykener', 'Lili\'s Last Brushstroke'],
        effect: 'permanent_heart'  // permanent +1 max health (lineage)
    }
};

// Probability table compiled from weights, used by combat.dropLoot.
export const LOOT_TIER_KEYS = Object.keys(LOOT_TIERS);
