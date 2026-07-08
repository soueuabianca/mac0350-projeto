// frontend/js/app.js
import { renderGraph, parseToCytoscape } from './graph.js';
import { fetchMovieGraph, fetchPersonRelated, fetchPopularMovies, fetchNacionais, fetchByGenre } from './api.js';

const app = document.getElementById('app');

// Função para carregar a página inicial (home)
function loadHome() {
  app.innerHTML = `
    <div class="hero">
      <!-- Substitua pelo caminho da sua imagem -->
      <img src="/img/encontre-seu-filme.png" alt="ENCONTRE seu filme" style="max-width:100%; height:auto;" />
      <p>Explore conexões entre filmes, atores e diretores</p>
    </div>
    <p style="text-align:center; color:#888; padding:2rem;">Selecione uma opção no menu ou pesquise para começar.</p>
  `;
}

// Função para renderizar lista de filmes (popular, nacionais, gênero)
function renderMovieList(movies, hasMore) {
  let html = '<div class="movie-grid">';
  movies.forEach(m => {
    html += `
      <div class="movie-card" data-id="${m.tmdbId}">
        ${m.poster_path ? `<img src="https://image.tmdb.org/t/p/w200${m.poster_path}" alt="${m.title}" />` : ''}
        <h3>${m.title}</h3>
        <div class="vote">⭐ ${m.vote_average.toFixed(1)}</div>
      </div>
    `;
  });
  html += '</div>';
  if (hasMore) {
    html += `<button id="loadMore" class="btn">Carregar mais</button>`;
  }
  app.innerHTML = html;

  // Adicionar evento de clique nos cards para navegar ao grafo do filme
  document.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', function() {
      const id = this.dataset.id;
      window.history.pushState({}, '', `/movie/${id}`);
      loadMovieGraph(id);
    });
  });
}

// Função para carregar grafo de um filme
async function loadMovieGraph(movieId) {
  try {
    const data = await fetchMovieGraph(movieId);
    const elements = parseToCytoscape(data);
    app.innerHTML = `<div id="cy"></div>`;
    renderGraph('cy', elements);
  } catch (error) {
    app.innerHTML = `<p style="color:red;">Erro ao carregar grafo: ${error.message}</p>`;
  }
}

// Função para carregar filmes relacionados a uma pessoa
async function loadPersonRelated(personId, movieId) {
  try {
    const data = await fetchPersonRelated(personId, movieId);
    // data é um MovieGraph com nós e arestas, vamos renderizar como grafo
    const elements = parseToCytoscape(data);
    app.innerHTML = `<div id="cy"></div>`;
    renderGraph('cy', elements);
  } catch (error) {
    app.innerHTML = `<p style="color:red;">Erro ao carregar filmes relacionados: ${error.message}</p>`;
  }
}

// Função para carregar populares
async function loadPopular(skip = 0) {
  try {
    const data = await fetchPopularMovies(skip);
    renderMovieList(data.movies, data.hasMore);
  } catch (error) {
    app.innerHTML = `<p style="color:red;">Erro ao carregar populares: ${error.message}</p>`;
  }
}

// Função para carregar nacionais
async function loadNacionais(skip = 0) {
  try {
    const data = await fetchNacionais(skip);
    renderMovieList(data.movies, data.hasMore);
  } catch (error) {
    app.innerHTML = `<p style="color:red;">Erro ao carregar nacionais: ${error.message}</p>`;
  }
}

// Função para carregar por gênero
async function loadGeneros(skip = 0) {
  // Para simplificar, vamos mostrar uma lista de gêneros ou carregar um gênero padrão?
  // Vamos carregar o gênero "Drama" como exemplo, mas seria melhor ter um seletor.
  // Como não temos, vou apenas exibir uma mensagem.
  app.innerHTML = `<p>Selecione um gênero:</p>
    <ul>
      <li><a href="#" data-genre="drama">Drama</a></li>
      <li><a href="#" data-genre="comedy">Comédia</a></li>
      <li><a href="#" data-genre="action">Ação</a></li>
    </ul>
  `;
  document.querySelectorAll('[data-genre]').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const genre = e.target.dataset.genre;
      try {
        const data = await fetchByGenre(genre);
        renderMovieList(data.movies, data.hasMore);
      } catch (error) {
        app.innerHTML = `<p style="color:red;">Erro ao carregar gênero: ${error.message}</p>`;
      }
    });
  });
}

// Roteador
function router() {
  const path = window.location.pathname;
  if (path === '/' || path === '') {
    loadHome();
  } else if (path.startsWith('/movie/')) {
    const movieId = path.split('/')[2];
    if (movieId) loadMovieGraph(movieId);
    else loadHome();
  } else if (path.startsWith('/person/')) {
    const parts = path.split('/');
    const personId = parts[2];
    const movieId = parts[4]; // espera /person/{id}/related-movies?movie_id={id}
    // Mas a URL pode ter query params, vamos pegar da URLSearchParams
    const params = new URLSearchParams(window.location.search);
    const movieIdParam = params.get('movie_id');
    if (personId) {
      loadPersonRelated(personId, movieIdParam);
    } else {
      loadHome();
    }
  } else if (path === '/popular') {
    loadPopular();
  } else if (path === '/nacionais') {
    loadNacionais();
  } else if (path === '/generos') {
    loadGeneros();
  } else {
    loadHome();
  }
}

// Evento de navegação (popstate e pushState)
window.addEventListener('popstate', router);
window.addEventListener('navigate', (e) => {
  router();
});

// Inicializar
router();

// Adicionar listeners nos links do menu
document.querySelectorAll('nav a[data-route]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const route = this.dataset.route;
    let path = '';
    if (route === 'popular') path = '/popular';
    else if (route === 'nacionais') path = '/nacionais';
    else if (route === 'generos') path = '/generos';
    else return;
    window.history.pushState({}, '', path);
    router();
  });
});

