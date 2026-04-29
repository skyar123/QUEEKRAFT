export const ZINES = {
    'tucking': { title: 'Safe Tucking Guide', content: '<h3>Safe Tucking</h3><p>Medical tape only, never duct tape! Take breaks every 8 hours. Your safety comes first.</p>' },
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
    }
};

export const TREASURES = {
    'flag': { name: 'Pride Flag', desc: 'A beautiful rainbow flag!' },
    'nametag': { name: 'Name Tag', desc: 'Your real name in bold letters.' },
    'letter': { name: 'Support Letter', desc: 'Love from chosen family.' },
    'meds': { name: 'HRT Meds', desc: 'Steps toward authenticity.' },
    'pin': { name: 'Trans Pin', desc: 'Small but powerful symbol.' },
    'photo': { name: 'Family Photo', desc: 'Your chosen family at Pride.' },
    'mirror': { name: 'Affirming Mirror', desc: 'Shows your true self.' },
    'notes': { name: 'Therapy Notes', desc: 'Wisdom for the journey.' }
};

export const HEALING_ITEMS = {
    'tea': { name: 'Healing Tea', desc: 'Chamomile and lavender restore you.', healing: 1 },
    'book': { name: 'Book of Affirmations', desc: 'Self-love heals wounds.', healing: 2 },
    'crystal': { name: 'Healing Crystal', desc: 'Amethyst radiates healing energy.', healing: 3 }
};
