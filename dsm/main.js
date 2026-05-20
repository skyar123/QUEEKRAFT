import { CATEGORIES, DISORDER_INDEX, FACTS } from './data.js';

// ===== Persistence =====
const STORAGE_KEY = 'dsm-archive-stats-v1';
function loadStats() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { bestStreak: 0, totalCorrect: 0 }; }
    catch { return { bestStreak: 0, totalCorrect: 0 }; }
}
function saveStats(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}
let stats = loadStats();

function renderTitleStats() {
    document.getElementById('best-streak').textContent = stats.bestStreak;
    document.getElementById('best-correct').textContent = stats.totalCorrect;
}

// ===== Screen routing =====
const screens = {
    title:    document.getElementById('screen-title'),
    quiz:     document.getElementById('screen-quiz'),
    cards:    document.getElementById('screen-cards'),
    glossary: document.getElementById('screen-glossary'),
};
function show(name) {
    for (const [k, el] of Object.entries(screens)) {
        el.classList.toggle('active', k === name);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
}

// ===== Utility =====
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function sample(arr, n) { return shuffle(arr).slice(0, n); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function toast(msg, ms = 2200) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._h);
    toast._h = setTimeout(() => t.classList.remove('show'), ms);
}

// ===== Title menu =====
document.querySelectorAll('.mbtn').forEach(btn => {
    btn.addEventListener('click', () => startMode(btn.dataset.mode));
});
document.querySelectorAll('[data-action="back"]').forEach(btn => {
    btn.addEventListener('click', () => { show('title'); renderTitleStats(); });
});
document.getElementById('reset-stats').addEventListener('click', () => {
    stats = { bestStreak: 0, totalCorrect: 0 };
    saveStats(stats);
    renderTitleStats();
    toast('Stats cleared.');
});

function startMode(mode) {
    if (mode === 'diagnose')   startQuiz('diagnose');
    if (mode === 'category')   startQuiz('category');
    if (mode === 'flashcards') startCards();
    if (mode === 'glossary')   startGlossary();
}

// ===== Quiz engine =====
let quiz = null;

function startQuiz(mode) {
    quiz = {
        mode,
        score: 0,
        streak: 0,
        index: 0,
        total: 10,
        question: null,
    };
    document.getElementById('quiz-mode-label').textContent =
        mode === 'diagnose' ? 'DIAGNOSE THE VIGNETTE' : 'CATEGORY DRILL';
    show('quiz');
    nextQuestion();
}

function nextQuestion() {
    if (quiz.index >= quiz.total) return finishQuiz();
    quiz.index += 1;
    quiz.question = quiz.mode === 'diagnose' ? buildDiagnoseQ() : buildCategoryQ();
    renderQuiz();
}

// Vignette -> pick disorder. Distractors prefer same category to keep it real.
function buildDiagnoseQ() {
    const target = pick(DISORDER_INDEX);
    const sameCat = DISORDER_INDEX.filter(d =>
        d.categoryId === target.categoryId && d.name !== target.name);
    const otherCat = DISORDER_INDEX.filter(d => d.categoryId !== target.categoryId);
    const distractors = [
        ...sample(sameCat, Math.min(2, sameCat.length)),
        ...sample(otherCat, 3),
    ].slice(0, 3);
    return {
        promptLabel: 'VIGNETTE',
        prompt: target.vignette,
        choices: shuffle([target, ...distractors]).map(d => ({
            label: d.name,
            correct: d.name === target.name,
        })),
        answer: target,
        explanation: `${target.name} — ${target.categoryName}. Key cues: ${target.cues.join('; ')}.`,
    };
}

// Disorder -> pick its DSM category.
function buildCategoryQ() {
    const target = pick(DISORDER_INDEX);
    const wrongCats = CATEGORIES.filter(c => c.id !== target.categoryId);
    const distractors = sample(wrongCats, 3).map(c => c.name);
    return {
        promptLabel: 'DISORDER',
        prompt: target.name,
        choices: shuffle([target.categoryName, ...distractors]).map(name => ({
            label: name,
            correct: name === target.categoryName,
        })),
        answer: target,
        explanation: `${target.name} sits in ${target.categoryName}. Key cues: ${target.cues.join('; ')}.`,
    };
}

function renderQuiz() {
    const q = quiz.question;
    document.getElementById('quiz-score').textContent = quiz.score;
    document.getElementById('quiz-streak').textContent = quiz.streak;
    document.getElementById('quiz-q').textContent = `${quiz.index}/${quiz.total}`;
    document.getElementById('quiz-prompt-label').textContent = q.promptLabel;
    document.getElementById('quiz-prompt').textContent = q.prompt;
    const fb = document.getElementById('quiz-feedback');
    fb.textContent = '';
    fb.className = 'feedback';
    const next = document.getElementById('quiz-next');
    next.disabled = true;
    next.textContent = quiz.index >= quiz.total ? 'FINISH ▶' : 'NEXT ▶';

    const wrap = document.getElementById('quiz-choices');
    wrap.innerHTML = '';
    q.choices.forEach(ch => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.textContent = ch.label;
        b.addEventListener('click', () => answer(ch, b));
        wrap.appendChild(b);
    });
}

function answer(choice, btn) {
    const buttons = document.querySelectorAll('#quiz-choices .choice');
    buttons.forEach(b => { b.disabled = true; });
    const fb = document.getElementById('quiz-feedback');

    if (choice.correct) {
        btn.classList.add('correct');
        quiz.score += 1;
        quiz.streak += 1;
        stats.totalCorrect += 1;
        if (quiz.streak > stats.bestStreak) stats.bestStreak = quiz.streak;
        saveStats(stats);
        fb.textContent = '✓ ' + quiz.question.explanation;
        fb.classList.add('good');
    } else {
        btn.classList.add('wrong');
        buttons.forEach(b => {
            const lab = b.textContent;
            const c = quiz.question.choices.find(x => x.label === lab);
            if (c && c.correct) b.classList.add('reveal');
        });
        quiz.streak = 0;
        fb.textContent = '✗ ' + quiz.question.explanation;
        fb.classList.add('bad');
    }
    document.getElementById('quiz-score').textContent = quiz.score;
    document.getElementById('quiz-streak').textContent = quiz.streak;
    document.getElementById('quiz-next').disabled = false;
}

document.getElementById('quiz-next').addEventListener('click', () => {
    if (!quiz) return;
    if (quiz.index >= quiz.total) finishQuiz();
    else nextQuestion();
});

function finishQuiz() {
    const pct = Math.round((quiz.score / quiz.total) * 100);
    let line;
    if (pct === 100) line = `Perfect run — ${quiz.score}/${quiz.total}.`;
    else if (pct >= 80) line = `Sharp work — ${quiz.score}/${quiz.total}.`;
    else if (pct >= 60) line = `Solid — ${quiz.score}/${quiz.total}.`;
    else line = `${quiz.score}/${quiz.total} — keep studying.`;
    toast(`${line}  Trivia: ${pick(FACTS)}`, 5000);
    show('title');
    renderTitleStats();
}

// ===== Flashcards =====
let cards = null;

function startCards() {
    cards = { deck: shuffle(DISORDER_INDEX), i: 0, flipped: false };
    document.getElementById('card-total').textContent = cards.deck.length;
    renderCard();
    show('cards');
}

function renderCard() {
    const d = cards.deck[cards.i];
    document.getElementById('card-index').textContent = cards.i + 1;
    document.getElementById('card-name').textContent = d.name;
    document.getElementById('card-cat').textContent = d.categoryName.toUpperCase();
    const ul = document.getElementById('card-cues');
    ul.innerHTML = '';
    d.cues.forEach(c => {
        const li = document.createElement('li');
        li.textContent = c;
        ul.appendChild(li);
    });
    const fc = document.getElementById('flashcard');
    cards.flipped = false;
    fc.classList.remove('flipped');
}

function flipCard() {
    cards.flipped = !cards.flipped;
    document.getElementById('flashcard').classList.toggle('flipped', cards.flipped);
}

document.getElementById('flashcard').addEventListener('click', flipCard);
document.getElementById('card-flip').addEventListener('click', flipCard);
document.getElementById('card-next').addEventListener('click', () => {
    cards.i = (cards.i + 1) % cards.deck.length;
    renderCard();
});
document.getElementById('card-prev').addEventListener('click', () => {
    cards.i = (cards.i - 1 + cards.deck.length) % cards.deck.length;
    renderCard();
});
document.getElementById('card-shuffle').addEventListener('click', () => {
    cards.deck = shuffle(DISORDER_INDEX);
    cards.i = 0;
    renderCard();
    toast('Deck reshuffled.');
});

// Keyboard shortcuts (only when cards screen is active)
document.addEventListener('keydown', (e) => {
    if (!screens.cards.classList.contains('active') || !cards) return;
    if (e.code === 'Space') { e.preventDefault(); flipCard(); }
    else if (e.code === 'ArrowRight') {
        cards.i = (cards.i + 1) % cards.deck.length; renderCard();
    } else if (e.code === 'ArrowLeft') {
        cards.i = (cards.i - 1 + cards.deck.length) % cards.deck.length; renderCard();
    }
});

// ===== Glossary =====
function startGlossary() {
    const wrap = document.getElementById('glossary-list');
    document.getElementById('glossary-count').textContent = CATEGORIES.length;
    wrap.innerHTML = '';
    CATEGORIES.forEach(cat => {
        const det = document.createElement('details');
        det.className = 'cat-block';
        const sum = document.createElement('summary');
        sum.innerHTML = `<span style="color:${cat.color}">${cat.name}</span>`;
        det.appendChild(sum);

        const blurb = document.createElement('div');
        blurb.className = 'blurb';
        blurb.textContent = cat.blurb;
        det.appendChild(blurb);

        const list = document.createElement('div');
        list.className = 'dis-list';
        cat.disorders.forEach(d => {
            const item = document.createElement('div');
            item.className = 'dis-item';
            item.style.borderLeftColor = cat.color;
            item.innerHTML =
                `<div class="dis-name">${d.name}</div>` +
                `<div class="dis-cues">${d.cues.join(' · ')}</div>`;
            list.appendChild(item);
        });
        det.appendChild(list);
        wrap.appendChild(det);
    });
    show('glossary');
}

// ===== Boot =====
renderTitleStats();
