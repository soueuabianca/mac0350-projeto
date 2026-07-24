// frontend/js/search.js
import { fetchSearch } from './api.js';

const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('searchResults');
let debounceTimer = null;
const DEBOUNCE_DELAY = 300;

// frontend/js/search.js (Atualização das funções)

function renderResults(results) {
  resultsContainer.innerHTML = '';
  if (results.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dropdown-empty';
    empty.textContent = 'Nenhum filme encontrado.';
    resultsContainer.appendChild(empty);
    resultsContainer.style.display = 'block';
    return;
  }

  results.forEach(item => {
    const div = document.createElement('div');
    div.className = 'dropdown-item';
    // Utilizando item.title conforme o schema Movie
    div.innerHTML = `
      <span class="name">${item.title}</span>
      <span class="type">Filme</span>
    `;
    div.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleSelect(item);
    });
    resultsContainer.appendChild(div);
  });
  resultsContainer.style.display = 'block';
}

function handleSelect(item) {
  resultsContainer.style.display = 'none';
  searchInput.value = '';
  // Redireciona sempre para o grafo do filme usando tmdbId
  window.history.pushState({}, '', `/movie/${item.tmdbId}`);
  window.dispatchEvent(new CustomEvent('navigate', { detail: { path: `/movie/${item.tmdbId}` } }));
}

searchInput.addEventListener('input', function() {
  const query = this.value;
  if (debounceTimer) clearTimeout(debounceTimer);

  if (!query.trim()) {
    resultsContainer.style.display = 'none';
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const results = await fetchSearch(query);
      renderResults(results);
    } catch (error) {
      console.error(error);
      resultsContainer.innerHTML = '<div class="dropdown-empty">Erro ao buscar.</div>';
      resultsContainer.style.display = 'block';
    }
  }, DEBOUNCE_DELAY);
});

// Fechar dropdown ao clicar fora
document.addEventListener('click', function(e) {
  if (!e.target.closest('.search-container')) {
    resultsContainer.style.display = 'none';
  }
});

// Fechar com ESC
searchInput.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    resultsContainer.style.display = 'none';
    this.blur();
  }
});