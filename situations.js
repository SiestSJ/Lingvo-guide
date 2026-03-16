let situations = [];
let words = [];

// Специальные соответствия словоформ и начальных форм
const wordFormMapping = {
    "чекнул": "чекнуть",
    "чекнула": "чекнуть",
    "чекнули": "чекнуть",
    // при необходимости можно добавить другие исключения
};

async function loadSituations() {
    try {
        const response = await fetch('data/words.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        situations = data.situations || [];
        words = data.words || [];
        renderSituations();
        initSuggestions(document.getElementById('searchInput'), words, document.getElementById('suggestions'));
    } catch (error) {
        console.error('Ошибка загрузки ситуаций:', error);
        document.getElementById('situationsList').innerHTML = '<p style="color:red;">Не удалось загрузить ситуации.</p>';
    }
}

function renderSituations() {
    const container = document.getElementById('situationsList');
    if (!situations.length) {
        container.innerHTML = '<p>Пока нет ситуаций.</p>';
        return;
    }

    let html = '';
    situations.forEach(sit => {
        html += `<div class="situation-card">`;
        html += `<h2 class="situation-title">${sit.title}</h2>`;
        
        // Диалог (оригинал)
        html += `<div class="situation-dialog">`;
        sit.dialog.forEach(line => {
            let text = line.text;
            if (sit.keywords && Array.isArray(sit.keywords)) {
                const sortedKeywords = [...sit.keywords].sort((a, b) => b.length - a.length);
                sortedKeywords.forEach(keyword => {
                    const regex = new RegExp(`(^|\\s)(${keyword})([а-я]*)(?=[\\s.,!?;:()]|$)`, 'gi');
                    text = text.replace(regex, (match, space, root, ending) => {
                        const fullWord = root + ending;
                        return `${space}<span class="slang-word" data-word="${root.toLowerCase()}">${fullWord}</span>`;
                    });
                });
            }
            html += `<p><strong>${line.speaker}:</strong> ${text}</p>`;
        });
        html += `</div>`;

        // Перевод (построчный с указанием говорящего)
        if (sit.translationLines && Array.isArray(sit.translationLines)) {
            html += `<div class="situation-translation">`;
            html += `<strong>Перевод:</strong>`;
            sit.translationLines.forEach((transLine, index) => {
                // Берем говорящего из соответствующей реплики диалога (если есть)
                const speaker = sit.dialog[index]?.speaker || '';
                html += `<p><strong>${speaker}:</strong> ${transLine}</p>`;
            });
            html += `</div>`;
        } else if (sit.translation) {
            // Запасной вариант, если вдруг нет translationLines
            html += `<div class="situation-translation"><strong>Перевод:</strong> ${sit.translation}</div>`;
        }

        html += `</div>`;
    });

    container.innerHTML = html;

    // Обработчики клика
    document.querySelectorAll('.slang-word').forEach(span => {
        span.addEventListener('click', (e) => {
            e.stopPropagation();
            const wordKey = e.target.dataset.word;
            console.log('Ищем слово по ключу:', wordKey);

            if (wordFormMapping[wordKey]) {
                const mappedWord = wordFormMapping[wordKey];
                const targetWord = words.find(w => w.word.toLowerCase() === mappedWord);
                if (targetWord) {
                    showWordModal(targetWord);
                    return;
                }
            }

            let word = words.find(w => w.word.toLowerCase() === wordKey);
            if (!word) {
                word = words.find(w => wordKey.startsWith(w.word.toLowerCase()));
            }

            if (word) {
                showWordModal(word);
            } else {
                console.warn('Слово не найдено в словаре:', wordKey);
                alert('Информация о слове не найдена');
            }
        });
    });
}

function showWordModal(word) {
    const modal = document.getElementById('wordModal');
    const content = document.getElementById('modalWordContent');

    let examplesHtml = '';
    if (word.examples && word.examples.length) {
        examplesHtml = word.examples.map(ex => `<p>«${ex}»</p>`).join('');
    }

    const wordCapitalized = word.word.charAt(0).toUpperCase() + word.word.slice(1);

    content.innerHTML = `
        <h2>${wordCapitalized}</h2>
        <p><strong>${word.stress || ''}</strong></p>
        <p>${word.definition}</p>
        ${examplesHtml ? `<div><strong>Примеры:</strong>${examplesHtml}</div>` : ''}
        <a href="word.html?id=${word.id}" class="button" style="margin-top:10px;">Подробнее</a>
    `;

    modal.style.display = 'block';

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
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
    loadSituations();

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