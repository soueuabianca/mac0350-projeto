// frontend/js/search.js
import { fetchSearch } from './api.js';

const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('searchResults');
const clearButton = document.getElementById('searchClear');

const DEBOUNCE_DELAY = 25; // dá tempo de terminar de digitar antes de bater na API
const MIN_CHARS = 1;
const LIMITE = 6;

let debounceTimer = null;
let pedidoAtual = null;   // AbortController do fetch em andamento
let resultados = [];
let indiceAtivo = -1;

// --------------------------------------------------------------------------
// Abrir / fechar
// --------------------------------------------------------------------------

function abrirDropdown() {
  resultsContainer.style.display = 'block';
  searchInput.setAttribute('aria-expanded', 'true');
}

function fecharDropdown() {
  resultsContainer.style.display = 'none';
  searchInput.setAttribute('aria-expanded', 'false');
  searchInput.removeAttribute('aria-activedescendant');
  indiceAtivo = -1;
}

function mostrarMensagem(texto, classe = 'dropdown-empty') {
  resultados = [];
  indiceAtivo = -1;
  resultsContainer.innerHTML = `<div class="${classe}">${escaparHTML(texto)}</div>`;
  abrirDropdown();
}

function mostrarBotaoLimpar(visivel) {
  if (clearButton) clearButton.hidden = !visivel;
}

// --------------------------------------------------------------------------
// Renderização
// --------------------------------------------------------------------------

function escaparHTML(texto) {
  return String(texto).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Marca em negrito os trechos do título que casam com o que foi digitado
function destacarTermos(titulo, termo) {
  const seguro = escaparHTML(titulo);
  const palavras = termo.trim().split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return seguro;

  const padrao = palavras
    .map(p => escaparHTML(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  return seguro.replace(new RegExp(`(${padrao})`, 'gi'), '<mark>$1</mark>');
}

function renderResults(items, termo) {
  resultados = items;
  indiceAtivo = -1;

  if (items.length === 0) {
    mostrarMensagem(`Nenhum filme encontrado para "${termo}".`);
    return;
  }

  resultsContainer.innerHTML = items.map((item, i) => {
    const nota = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : '--';
    const capa = item.poster_path
      ? `<img class="thumb" src="https://image.tmdb.org/t/p/w92${item.poster_path}" alt="" loading="lazy" />`
      : '<span class="thumb thumb-vazio"></span>';
    return `
      <div class="dropdown-item" role="option" id="search-opt-${i}" data-index="${i}" aria-selected="false">
        ${capa}
        <span class="name">${destacarTermos(item.title, termo)}</span>
        <span class="type">★ ${nota}</span>
      </div>
    `;
  }).join('');

  resultsContainer.querySelectorAll('.dropdown-item').forEach(div => {
    div.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleSelect(resultados[Number(div.dataset.index)]);
    });
    div.addEventListener('mousemove', () => destacar(Number(div.dataset.index)));
  });

  abrirDropdown();
}

// Destaca uma opção (navegação por teclado ou mouse)
function destacar(indice) {
  const itens = resultsContainer.querySelectorAll('.dropdown-item');
  if (itens.length === 0) return;

  indiceAtivo = (indice + itens.length) % itens.length;

  itens.forEach((item, i) => {
    const ativo = i === indiceAtivo;
    item.classList.toggle('is-active', ativo);
    item.setAttribute('aria-selected', String(ativo));
    if (ativo) {
      item.scrollIntoView({ block: 'nearest' });
      searchInput.setAttribute('aria-activedescendant', item.id);
    }
  });
}

function handleSelect(item) {
  if (!item) return;
  fecharDropdown();
  searchInput.value = '';
  mostrarBotaoLimpar(false);
  window.history.pushState({}, '', `/movie/${item.tmdbId}`);
  window.dispatchEvent(new CustomEvent('navigate', { detail: { path: `/movie/${item.tmdbId}` } }));
}

// --------------------------------------------------------------------------
// Busca
// --------------------------------------------------------------------------

async function buscar(termo) {
  // Cancela o pedido anterior para não deixar resposta velha sobrescrever a nova
  if (pedidoAtual) pedidoAtual.abort();
  const meuPedido = new AbortController();
  pedidoAtual = meuPedido;

  mostrarMensagem('Buscando...', 'dropdown-loading');

  try {
    const items = await fetchSearch(termo, LIMITE, meuPedido.signal);
    if (pedidoAtual !== meuPedido) return; // já existe uma busca mais recente
    renderResults(items, termo);
  } catch (error) {
    if (error.name === 'AbortError') return; // substituído por uma busca mais recente
    console.error(error);
    mostrarMensagem('Erro ao buscar. Tente de novo.');
  }
}

searchInput.addEventListener('input', function () {
  const query = this.value.trim();
  mostrarBotaoLimpar(query.length > 0);

  if (debounceTimer) clearTimeout(debounceTimer);

  if (query.length === 0) {
    if (pedidoAtual) pedidoAtual.abort();
    pedidoAtual = null;
    fecharDropdown();
    return;
  }

  if (query.length < MIN_CHARS) {
    mostrarMensagem(`Digite pelo menos ${MIN_CHARS} caractere(s).`);
    return;
  }

  debounceTimer = setTimeout(() => buscar(query), DEBOUNCE_DELAY);
});

// Reabre o dropdown ao focar num termo já digitado
searchInput.addEventListener('focus', function () {
  if (resultados.length > 0 && this.value.trim().length >= MIN_CHARS) abrirDropdown();
});

// Navegação por teclado: setas, Enter, Esc
searchInput.addEventListener('keydown', function (e) {
  const aberto = resultsContainer.style.display === 'block';

  if (e.key === 'ArrowDown' && aberto) {
    e.preventDefault();
    destacar(indiceAtivo + 1);
  } else if (e.key === 'ArrowUp' && aberto) {
    e.preventDefault();
    destacar(indiceAtivo - 1);
  } else if (e.key === 'Enter') {
    if (indiceAtivo >= 0) {
      e.preventDefault();
      handleSelect(resultados[indiceAtivo]);
    } else if (resultados.length > 0) {
      e.preventDefault();
      handleSelect(resultados[0]);
    }
  } else if (e.key === 'Escape') {
    fecharDropdown();
    this.blur();
  }
});

if (clearButton) {
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    mostrarBotaoLimpar(false);
    if (pedidoAtual) pedidoAtual.abort();
    pedidoAtual = null;
    resultados = [];
    fecharDropdown();
    searchInput.focus();
  });
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', function (e) {
  if (!e.target.closest('.search-container')) fecharDropdown();
});
