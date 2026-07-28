// frontend/js/api.js
const API_BASE = '/api';  // Usa o proxy do Vite

// Caracteres com significado especial no Lucene, usado pelo índice fulltext do Neo4j
const LUCENE_ESPECIAIS = /([+\-!(){}[\]^"~*?:\\/]|&&|\|\|)/g;

/**
 * O índice fulltext casa termos inteiros: "ka" não encontra "Cidadão Kane".
 * Para busca enquanto se digita, cada termo vira um prefixo ("ka*"), depois de
 * escapar os caracteres que o Lucene interpretaria como sintaxe. Os termos são
 * unidos por AND para que "quentin tar" não traga tudo que casa só com "tar".
 */
export function toPrefixQuery(query) {
  return query
    .trim()
    .split(/\s+/)
    .map(termo => termo.replace(LUCENE_ESPECIAIS, '\\$1'))
    .filter(termo => termo.length > 0)
    .map(termo => `${termo}*`)
    .join(' AND ');
}

export async function fetchSearch(query, limit = 6, signal) {
  if (!query.trim()) return [];
  // Atualizado para a rota unificada do backend
  const url = `${API_BASE}/search/?q=${encodeURIComponent(toPrefixQuery(query))}&limit=${limit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Erro na busca: ${res.status}`);
  const data = await res.json();
  return data.movies || []; // O schema MovieCatalog retorna 'movies'
}

export async function fetchPopularMovies(skip = 0, limit = 10) {
  const url = `${API_BASE}/popular?skip=${skip}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar populares: ${res.status}`);
  return await res.json();
}

// Grafo de um filme: nós do filme + elenco/direção e as arestas entre eles
export async function fetchMovieGraph(movieId) {
  const url = `${API_BASE}/movie/${movieId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar grafo do filme: ${res.status}`);
  return await res.json();
}

// Outros filmes de uma pessoa, excluindo o filme que já está no grafo
export async function fetchPersonRelatedMovies(personId, movieId) {
  const url = `${API_BASE}/person/${personId}/related-movies?movie_id=${movieId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar filmes relacionados: ${res.status}`);
  return await res.json();
}

export async function fetchByGenre(genre, skip = 0, limit = 10) {
  const url = `${API_BASE}/genre/${genre}?skip=${skip}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar gênero: ${res.status}`);
  return await res.json();
}