// frontend/js/app.js
import {
  fetchPopularMovies,
  fetchByGenre,
  fetchMovieGraph,
  fetchPersonRelatedMovies
} from './api.js';
import { renderGraph, expandGraph } from './graph.js';
import './search.js';

const app = document.getElementById('app');

const PAGE_SIZE = 10;

// Gêneros aceitos pelo backend (enum Genre em backend/app/schemas.py)
const GENEROS = [
  { slug: 'action', nome: 'Ação' },
  { slug: 'adventure', nome: 'Aventura' },
  { slug: 'animation', nome: 'Animação' },
  { slug: 'comedy', nome: 'Comédia' },
  { slug: 'crime', nome: 'Crime' },
  { slug: 'documentary', nome: 'Documentário' },
  { slug: 'drama', nome: 'Drama' },
  { slug: 'family', nome: 'Família' },
  { slug: 'fantasy', nome: 'Fantasia' },
  { slug: 'history', nome: 'História' },
  { slug: 'horror', nome: 'Terror' },
  { slug: 'music', nome: 'Música' },
  { slug: 'mystery', nome: 'Mistério' },
  { slug: 'romance', nome: 'Romance' },
  { slug: 'sciencefiction', nome: 'Ficção científica' },
  { slug: 'tvmovie', nome: 'Filme de TV' },
  { slug: 'thriller', nome: 'Suspense' },
  { slug: 'war', nome: 'Guerra' },
  { slug: 'western', nome: 'Faroeste' }
];

const generoPorSlug = slug => GENEROS.find(g => g.slug === slug);

// Filme que está no centro da exploração atual
let currentMovieId = null;

// --------------------------------------------------------------------------
// Helpers de UI
// --------------------------------------------------------------------------

function navigateTo(path) {
  window.history.pushState({}, '', path);
  router();
}

function posterTag(movie) {
  if (!movie.poster_path) return '<div class="movie-card-noposter">sem pôster</div>';
  return `<img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" alt="${movie.title}" loading="lazy" />`;
}

function movieCardHTML(movie) {
  const nota = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : '--';
  return `
    <div class="movie-card" data-id="${movie.tmdbId}" role="button" tabindex="0">
      ${posterTag(movie)}
      <h3>${movie.title}</h3>
      <div class="vote">★ ${nota}</div>
    </div>
  `;
}

// Torna clicáveis (mouse e teclado) os cards dentro de um container
function bindMovieCards(container) {
  container.querySelectorAll('.movie-card').forEach(card => {
    const abrir = () => navigateTo(`/movie/${card.dataset.id}`);
    card.addEventListener('click', abrir);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrir();
      }
    });
  });
}

function skeletonGrid(qtd = PAGE_SIZE) {
  return `<div class="movie-grid">${'<div class="movie-card skeleton"></div>'.repeat(qtd)}</div>`;
}

// --------------------------------------------------------------------------
// Home
// --------------------------------------------------------------------------

function loadHome() {
  app.innerHTML = `
    <section class="hero">
      <p class="hero-kicker">Cinema em forma de rede</p>
      <h1 class="hero-title">Encontre seu filme</h1>
      <p class="hero-subtitle">
        Parta de um filme, descubra quem o fez e siga por outros trabalhos
        dessas pessoas — cada clique abre uma nova conexão.
      </p>
      <div class="hero-actions">
        <button class="btn" data-go="/popular">Ver populares</button>
        <button class="btn btn-ghost" data-go="/generos">Explorar gêneros</button>
      </div>
    </section>

    <section class="home-section">
      <div class="section-head">
        <h2>Filmes em destaque</h2>
        <a href="/popular" class="section-link" data-go="/popular">ver todos</a>
      </div>
      <div id="home-catalog-container">${skeletonGrid(5)}</div>
    </section>

    <section class="home-section">
      <div class="section-head">
        <h2>Navegue por gênero</h2>
        <a href="/generos" class="section-link" data-go="/generos">ver todos</a>
      </div>
      <div class="genre-grid genre-grid-compacto" id="home-genre-grid">
        ${GENEROS.slice(0, 8).map(genreCardHTML).join('')}
      </div>
    </section>
  `;

  pintarCapas(document.getElementById('home-genre-grid'));

  app.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(el.dataset.go);
    });
  });

  app.querySelectorAll('.genre-card').forEach(card => {
    card.addEventListener('click', () => navigateTo(`/generos?g=${card.dataset.genre}`));
  });

  fetchPopularMovies(0, 5).then(data => {
    const container = document.getElementById('home-catalog-container');
    if (!container) return;
    container.innerHTML = `<div class="movie-grid">${data.movies.map(movieCardHTML).join('')}</div>`;
    bindMovieCards(container);
  }).catch(() => {
    const container = document.getElementById('home-catalog-container');
    if (container) container.innerHTML = `<p class="erro">Erro ao carregar os destaques.</p>`;
  });
}

// --------------------------------------------------------------------------
// Listas paginadas (populares e gêneros)
// --------------------------------------------------------------------------

// Renderiza a lista num container, acumulando páginas ao clicar em "Carregar mais"
function renderMovieList(container, data, carregarMais) {
  container.innerHTML = `
    <div class="movie-grid">${data.movies.map(movieCardHTML).join('')}</div>
    ${data.hasMore ? '<button id="loadMore" class="btn">Carregar mais</button>' : ''}
  `;
  bindMovieCards(container);

  const botao = container.querySelector('#loadMore');
  if (!botao) return;

  botao.addEventListener('click', async () => {
    botao.disabled = true;
    botao.textContent = 'Carregando...';
    try {
      const proxima = await carregarMais();
      const grid = container.querySelector('.movie-grid');
      grid.insertAdjacentHTML('beforeend', proxima.movies.map(movieCardHTML).join(''));
      bindMovieCards(grid);
      if (proxima.hasMore) {
        botao.disabled = false;
        botao.textContent = 'Carregar mais';
      } else {
        botao.remove();
      }
    } catch (error) {
      botao.disabled = false;
      botao.textContent = 'Tentar novamente';
    }
  });
}

async function loadPopular() {
  app.innerHTML = `
    <section class="list-view">
      <h2 class="page-title">Populares</h2>
      <div id="list-container">${skeletonGrid()}</div>
    </section>
  `;

  const container = document.getElementById('list-container');
  let skip = 0;

  try {
    const data = await fetchPopularMovies(skip, PAGE_SIZE);
    renderMovieList(container, data, async () => {
      skip += PAGE_SIZE;
      return await fetchPopularMovies(skip, PAGE_SIZE);
    });
  } catch (error) {
    container.innerHTML = `<p class="erro">Erro ao carregar populares: ${error.message}</p>`;
  }
}

// Card de um gênero, usado na home e na página de gêneros.
// O pôster de fundo entra depois, quando a capa do gênero chega da API.
function genreCardHTML(genero, indice) {
  const numero = String(indice + 1).padStart(2, '0');
  return `
    <button class="genre-card" data-genre="${genero.slug}">
      <span class="genre-card-numero">${numero}</span>
      <span class="genre-card-nome">${genero.nome}</span>
    </button>
  `;
}

// Capa de cada gênero: pôster do filme mais bem avaliado dele.
// Guardado em cache para não repetir a requisição a cada visita.
const capaPorGenero = new Map();

async function capaDoGenero(slug) {
  if (capaPorGenero.has(slug)) return capaPorGenero.get(slug);

  let capa = null;
  try {
    const data = await fetchByGenre(slug, 0, 1);
    const filme = data.movies[0];
    if (filme) capa = { poster: filme.poster_path, titulo: filme.title };
  } catch (error) {
    capa = null; // sem capa o card continua legível, só fica sem imagem
  }

  capaPorGenero.set(slug, capa);
  return capa;
}

// Preenche o fundo dos cards conforme as capas chegam (não bloqueia a tela)
function pintarCapas(container) {
  container.querySelectorAll('.genre-card').forEach(async card => {
    const capa = await capaDoGenero(card.dataset.genre);
    if (!capa || !capa.poster || !card.isConnected) return;
    card.style.backgroundImage = `url(https://image.tmdb.org/t/p/w342${capa.poster})`;
    card.classList.add('tem-capa');
    card.title = `Em destaque: ${capa.titulo}`;
  });
}

// Mural de gêneros (nenhum selecionado ainda)
function loadGeneros(generoSelecionado) {
  const genero = generoPorSlug(generoSelecionado);

  if (!genero) {
    app.innerHTML = `
      <section class="list-view">
        <h2 class="page-title">Gêneros</h2>
        <p class="page-subtitle">Escolha um gênero e veja os filmes mais bem avaliados dele.</p>
        <div class="genre-grid">${GENEROS.map(genreCardHTML).join('')}</div>
      </section>
    `;
    const grid = app.querySelector('.genre-grid');
    grid.querySelectorAll('.genre-card').forEach(card => {
      card.addEventListener('click', () => navigateTo(`/generos?g=${card.dataset.genre}`));
    });
    pintarCapas(grid);
    return;
  }

  // Gênero escolhido: banner com o filme de destaque + atalhos para os outros
  app.innerHTML = `
    <section class="list-view">
      <div class="genre-banner" id="genre-banner">
        <div class="genre-banner-texto">
          <p class="genre-banner-kicker">Gênero</p>
          <h2 class="genre-banner-nome">${genero.nome}</h2>
          <p class="genre-banner-destaque" id="genre-banner-destaque">Carregando destaque...</p>
        </div>
        <button class="btn btn-claro" id="voltar-generos">Todos os gêneros</button>
      </div>

      <div class="genre-chips" id="genre-chips">
        ${GENEROS.map(g => `
          <button class="genre-chip${g.slug === genero.slug ? ' is-active' : ''}"
                  data-genre="${g.slug}"
                  aria-pressed="${g.slug === genero.slug}">${g.nome}</button>
        `).join('')}
      </div>

      <div id="list-container">${skeletonGrid()}</div>
    </section>
  `;

  document.getElementById('voltar-generos')
    .addEventListener('click', () => navigateTo('/generos'));

  document.querySelectorAll('#genre-chips .genre-chip').forEach(chip => {
    chip.addEventListener('click', () => navigateTo(`/generos?g=${chip.dataset.genre}`));
  });

  carregarFilmesDoGenero(genero.slug);
}

async function carregarFilmesDoGenero(slug) {
  const container = document.getElementById('list-container');
  if (!container) return;

  let skip = 0;
  try {
    const data = await fetchByGenre(slug, skip, PAGE_SIZE);

    // O filme mais bem avaliado do gênero vira o pano de fundo do banner
    const destaque = data.movies[0];
    const banner = document.getElementById('genre-banner');
    const legenda = document.getElementById('genre-banner-destaque');
    if (destaque && banner) {
      if (destaque.poster_path) {
        banner.style.backgroundImage =
          `url(https://image.tmdb.org/t/p/w780${destaque.poster_path})`;
        banner.classList.add('tem-capa');
      }
      if (legenda) legenda.textContent = `Em destaque: ${destaque.title}`;
    } else if (legenda) {
      legenda.remove();
    }

    if (data.movies.length === 0) {
      container.innerHTML = '<p class="lista-vazia">Nenhum filme encontrado nesse gênero.</p>';
      return;
    }
    renderMovieList(container, data, async () => {
      skip += PAGE_SIZE;
      return await fetchByGenre(slug, skip, PAGE_SIZE);
    });
  } catch (error) {
    container.innerHTML = `<p class="erro">Erro ao carregar gênero: ${error.message}</p>`;
  }
}

// --------------------------------------------------------------------------
// Grafos
// --------------------------------------------------------------------------

// Esqueleto da tela de grafo: área do Cytoscape + painel lateral de detalhes
function renderGraphShell(titulo) {
  app.innerHTML = `
    <section class="graph-view">
      <h2 class="graph-title" id="graph-title">${titulo}</h2>
      <p class="graph-hint">
        Clique numa pessoa para revelar os outros filmes dela &mdash;
        clique num filme para torná-lo o novo centro.
      </p>
      <div class="graph-layout">
        <div id="cy"></div>
        <aside id="details-panel" class="details-panel">
          <p class="details-empty">Selecione um nó do grafo para ver os detalhes.</p>
        </aside>
      </div>
    </section>
  `;
}

// Painel lateral com os dados do nó clicado
function showNodeDetails(node) {
  const panel = document.getElementById('details-panel');
  if (!panel) return;

  if (node.label === 'Movie') {
    panel.innerHTML = `
      ${node.posterPath ? `<img src="https://image.tmdb.org/t/p/w200${node.posterPath}" alt="${node.title}" />` : ''}
      <h3>${node.title || ''}</h3>
      ${node.releaseYear ? `<p class="details-meta">${node.releaseYear}</p>` : ''}
      <p class="details-text">${node.overview || 'Sem sinopse disponível.'}</p>
      ${node.tmdbUrl ? `<a href="${node.tmdbUrl}" target="_blank" rel="noopener">Ver no TMDB</a>` : ''}
    `;
  } else {
    panel.innerHTML = `
      ${node.profilePath ? `<img src="https://image.tmdb.org/t/p/w200${node.profilePath}" alt="${node.name}" />` : ''}
      <h3>${node.name || ''}</h3>
      <p class="details-text">${node.biography || 'Sem biografia disponível.'}</p>
      ${node.tmdbUrl ? `<a href="${node.tmdbUrl}" target="_blank" rel="noopener">Ver no TMDB</a>` : ''}
    `;
  }
}

function setGraphStatus(mensagem) {
  const hint = document.querySelector('.graph-hint');
  if (hint) hint.textContent = mensagem;
}

// Clique num nó: pessoa expande a rede, filme vira o novo centro
async function handleNodeTap(node, cy) {
  showNodeDetails(node);

  if (node.label === 'Person') {
    try {
      const relacionados = await fetchPersonRelatedMovies(node.tmdbId, currentMovieId);
      const adicionados = expandGraph(cy, relacionados);
      if (adicionados === 0) {
        setGraphStatus(`Nenhum filme novo encontrado para ${node.name || 'esta pessoa'}.`);
      }
    } catch (error) {
      setGraphStatus(`Erro ao expandir: ${error.message}`);
    }
    return;
  }

  if (node.label === 'Movie' && node.tmdbId !== currentMovieId) {
    navigateTo(`/movie/${node.tmdbId}`);
  }
}

// Grafo de um filme (rota /movie/{id})
async function loadMovieGraph(movieId) {
  currentMovieId = Number(movieId);
  renderGraphShell('Carregando grafo...');

  try {
    const data = await fetchMovieGraph(movieId);

    if (!data.nodes || data.nodes.length === 0) {
      app.innerHTML = `<p class="lista-vazia">Nenhuma conexão encontrada para este filme.</p>`;
      return;
    }

    const filme = data.nodes.find(n => n.label === 'Movie');
    const titulo = document.getElementById('graph-title');
    if (titulo && filme) titulo.textContent = filme.properties.title;

    renderGraph('cy', data, { onNodeTap: handleNodeTap });
  } catch (error) {
    app.innerHTML = `<p class="erro">Erro ao carregar o grafo: ${error.message}</p>`;
  }
}

// Grafo dos outros filmes de uma pessoa (rota /person/{id}/related-movies)
async function loadPersonRelated(personId, movieId) {
  currentMovieId = Number(movieId);
  renderGraphShell('Carregando filmes relacionados...');

  try {
    const data = await fetchPersonRelatedMovies(personId, movieId);

    if (!data.nodes || data.nodes.length === 0) {
      app.innerHTML = `<p class="lista-vazia">Nenhum outro filme encontrado para esta pessoa.</p>`;
      return;
    }

    const pessoa = data.nodes.find(n => n.label === 'Person');
    const titulo = document.getElementById('graph-title');
    if (titulo && pessoa) titulo.textContent = pessoa.properties.name;

    renderGraph('cy', data, { onNodeTap: handleNodeTap });
  } catch (error) {
    app.innerHTML = `<p class="erro">Erro ao carregar filmes relacionados: ${error.message}</p>`;
  }
}

// --------------------------------------------------------------------------
// Roteador
// --------------------------------------------------------------------------

function marcarLinkAtivo(path) {
  document.querySelectorAll('nav a[data-route]').forEach(link => {
    link.classList.toggle('is-active', link.getAttribute('href') === path);
  });
}

function router() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  marcarLinkAtivo(path);

  if (path === '/' || path === '') {
    loadHome();
  } else if (path.startsWith('/movie/')) {
    const movieId = path.split('/')[2];
    if (movieId) loadMovieGraph(movieId);
    else loadHome();
  } else if (path.startsWith('/person/')) {
    const personId = path.split('/')[2];
    const movieIdParam = params.get('movie_id');
    if (personId) loadPersonRelated(personId, movieIdParam);
    else loadHome();
  } else if (path === '/popular') {
    loadPopular();
  } else if (path === '/generos') {
    loadGeneros(params.get('g'));
  } else {
    loadHome();
  }
}

window.addEventListener('popstate', router);
window.addEventListener('navigate', router);

router();

// Links do cabeçalho
document.querySelectorAll('nav a[data-route]').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    navigateTo(this.getAttribute('href'));
  });
});

// O logo/título também volta para a home
const brand = document.querySelector('.brand');
if (brand) {
  brand.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('/');
  });
}
