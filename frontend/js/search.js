// frontend/js/search.js
import { fetchSearch } from './api.js';

const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('searchResults');
let debounceTimer = null;
const DEBOUNCE_DELAY = 300;

function renderResults(results) {
  resultsContainer.innerHTML = '';
  if (results.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dropdown-empty';
    empty.textContent = 'Nenhum resultado encontrado.';
    resultsContainer.appendChild(empty);
    resultsContainer.style.display = 'block';
    return;
  }

  results.forEach(item => {
    const div = document.createElement('div');
    div.className = 'dropdown-item';
    div.innerHTML = `
      <span class="name">${item.name}</span>
      <span class="type">${item.label}</span>
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
  // Navegar para a rota (SPA)
  if (item.label === 'Movie') {
    window.history.pushState({}, '', `/movie/${item.id}`);
    // Disparar evento para o app.js carregar o grafo
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: `/movie/${item.id}` } }));
  } else if (item.label === 'Person') {
    window.history.pushState({}, '', `/person/${item.id}/related-movies`);
    window.dispatchEvent(new CustomEvent('navigate', { detail: { path: `/person/${item.id}/related-movies` } }));
  }
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