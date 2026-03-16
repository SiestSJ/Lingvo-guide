// Глобальные переменные
let words = [];
let facts = [];

// Загружаем данные из JSON
async function loadData() {
    try {
        const response = await fetch('data/words.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        words = data.words || [];
        facts = data.facts || [];

        console.log('Данные загружены:', { words: words.length, facts: facts.length });

        initWordOfDay();
        initFacts();
        initSuggestions(document.getElementById('searchInput'), words, document.getElementById('suggestions'));
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        document.getElementById('wordOfDayCard').innerHTML = '<p style="color:red;">Ошибка загрузки</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadData);

// ========== СЛОВО ДНЯ ==========
function initWordOfDay() {
    if (!words.length) return;

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const index = dayOfYear % words.length;
    const word = words[index];
    displayWordOfDay(word);
}

function displayWordOfDay(word) {
    const container = document.getElementById('wordOfDayCard');
    if (!container) return;

    let examplesHtml = '';
    if (word.examples?.length) {
        examplesHtml = word.examples.map(ex => `<p class="word-card__example">«${ex}»</p>`).join('');
    }

    // Первая буква заглавная
    const wordCapitalized = word.word.charAt(0).toUpperCase() + word.word.slice(1);

    container.innerHTML = `
        <div class="word-card__word">${wordCapitalized}</div>
        <div class="word-card__stress">${word.stress || ''}</div>
        <div class="word-card__definition">${word.definition}</div>
        ${examplesHtml ? `<div class="word-card__examples">${examplesHtml}</div>` : ''}
    `;
}

// ========== ФАКТЫ ==========
function initFacts() {
    if (!facts.length) return;

    const today = new Date().toDateString();
    let stored = localStorage.getItem('dailyFacts');

    if (stored) {
        try {
            stored = JSON.parse(stored);
            if (stored.date === today && Array.isArray(stored.facts)) {
                displayFacts(stored.facts);
                return;
            }
        } catch (e) {
            // игнорируем
        }
    }

    const shuffled = [...facts].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    localStorage.setItem('dailyFacts', JSON.stringify({
        date: today,
        facts: selected
    }));

    displayFacts(selected);
}

function displayFacts(factsArray) {
    const container = document.getElementById('factsContainer');
    if (!container) return;

    container.innerHTML = factsArray.map(fact =>
        `<div class="fact-item">${fact.text}</div>`
    ).join('');
}

// ========== АВТОДОПОЛНЕНИЕ ==========
function initSuggestions(inputElement, wordsArray, suggestionsContainer) {
    if (!inputElement || !wordsArray) return;

    inputElement.addEventListener('input', () => {
        const query = inputElement.value.trim().toLowerCase();
        if (query.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        const matches = wordsArray
            .filter(word => word.word.toLowerCase().startsWith(query))
            .slice(0, 5);

        if (matches.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestionsContainer.innerHTML = matches.map(word =>
            `<div data-id="${word.id}">${word.word}</div>`
        ).join('');
        suggestionsContainer.style.display = 'block';
    });

    suggestionsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('div');
        if (!target || !target.dataset.id) return;
        window.location.href = `word.html?id=${target.dataset.id}`;
    });

    inputElement.addEventListener('blur', () => {
        setTimeout(() => {
            suggestionsContainer.style.display = 'none';
        }, 200);
    });

    inputElement.addEventListener('focus', () => {
        if (inputElement.value.trim().length > 0) {
            inputElement.dispatchEvent(new Event('input'));
        }
    });
}

// ========== ПОИСК ==========
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) return;

            const found = words.find(w => w.word.toLowerCase() === query);
            if (found) {
                window.location.href = `word.html?id=${found.id}`;
            } else {
                window.location.href = `not-found.html?word=${encodeURIComponent(query)}`;
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchBtn.click();
        });
    }
});