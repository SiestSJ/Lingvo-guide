let currentWord = null;
let allWords = [];

function getWordIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function loadWord() {
    const wordId = getWordIdFromUrl();
    if (!wordId) {
        document.getElementById('wordCard').innerHTML = '<p style="color:red;">Ошибка: слово не указано.</p>';
        return;
    }

    try {
        const response = await fetch('data/words.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        allWords = data.words || [];

        currentWord = allWords.find(w => w.id == wordId);

        if (!currentWord) {
            document.getElementById('wordCard').innerHTML = '<p style="color:red;">Слово не найдено.</p>';
            return;
        }

        displayWord(currentWord);
        initSuggestions(document.getElementById('searchInput'), allWords, document.getElementById('suggestions'));
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        document.getElementById('wordCard').innerHTML = '<p style="color:red;">Ошибка загрузки.</p>';
    }
}

function displayWord(word) {
    const container = document.getElementById('wordCard');
    let examplesHtml = '';
    if (word.examples && word.examples.length) {
        examplesHtml = word.examples.map(ex => `<p class="word-card__example">«${ex}»</p>`).join('');
    }

    const wordCapitalized = word.word.charAt(0).toUpperCase() + word.word.slice(1);

    container.innerHTML = `
        <div class="word-card__word">${wordCapitalized}</div>
        <div class="word-card__stress">${word.stress || ''}</div>
        <div class="word-card__definition">${word.definition}</div>
        ${examplesHtml ? `<div class="word-card__examples">${examplesHtml}</div>` : ''}
    `;
}

function speakWord() {
    if (!currentWord) return;

    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
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
    loadWord();

    document.getElementById('speakButton').addEventListener('click', speakWord);

    const searchBtn = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) return;
            const found = allWords.find(w => w.word.toLowerCase() === query);
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