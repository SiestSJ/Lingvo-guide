let words = [];

async function loadDictionary() {
    try {
        const response = await fetch('data/words.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        words = data.words || [];
        renderDictionary();
        initSuggestions(document.getElementById('searchInput'), words, document.getElementById('suggestions'));
    } catch (error) {
        console.error('Ошибка загрузки слов:', error);
        document.getElementById('dictionaryList').innerHTML = '<p style="color:red;">Не удалось загрузить слова.</p>';
    }
}

function groupWordsByFirstLetter(wordsArray) {
    const groups = {};
    wordsArray.forEach(word => {
        const firstLetter = word.word.charAt(0).toUpperCase();
        if (!groups[firstLetter]) groups[firstLetter] = [];
        groups[firstLetter].push(word);
    });
    const sortedLetters = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'ru'));
    sortedLetters.forEach(letter => {
        groups[letter].sort((a, b) => a.word.localeCompare(b.word, 'ru'));
    });
    return { groups, sortedLetters };
}

function renderDictionary() {
    if (!words.length) {
        document.getElementById('dictionaryList').innerHTML = '<p>Слова ещё не загружены.</p>';
        return;
    }

    const { groups, sortedLetters } = groupWordsByFirstLetter(words);

    const indexContainer = document.getElementById('alphabetIndex');
    let indexHtml = '';
    sortedLetters.forEach(letter => {
        indexHtml += `<a href="#letter-${letter}" class="index-letter">${letter}</a>`;
    });
    indexContainer.innerHTML = indexHtml;

    const listContainer = document.getElementById('dictionaryList');
    let listHtml = '';
    sortedLetters.forEach(letter => {
        listHtml += `<div class="letter-group" id="letter-${letter}">`;
        listHtml += `<h2 class="letter-title">${letter}</h2>`;
        listHtml += '<ul class="word-list">';
        groups[letter].forEach(word => {
            listHtml += `<li><a href="word.html?id=${word.id}" class="word-link">${word.word}</a></li>`;
        });
        listHtml += '</ul></div>';
    });
    listContainer.innerHTML = listHtml;
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
    loadDictionary();

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