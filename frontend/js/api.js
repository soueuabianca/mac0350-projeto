// frontend/js/api.js
const API_BASE = '/api';  // Usa o proxy do Vite

export async function fetchSearch(query, limit = 6) {
  if (!query.trim()) return [];
  const url = `${API_BASE}/search/combined?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro na busca: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

export async function fetchMovieGraph(movieId) {
  const url = `${API_BASE}/movie/${movieId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar grafo do filme: ${res.status}`);
  return await res.json();
}

export async function fetchPersonRelated(personId, movieId) {
  const url = `${API_BASE}/person/${personId}/related-movies?movie_id=${movieId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar filmes relacionados: ${res.status}`);
  return await res.json();
}

export async function fetchPopularMovies(skip = 0, limit = 10) {
  const url = `${API_BASE}/popular?skip=${skip}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar populares: ${res.status}`);
  return await res.json();
}

export async function fetchNacionais(skip = 0, limit = 10) {
  // Ajuste: você pode criar um endpoint específico ou usar o genre com ID de nacional? Vamos supor um endpoint "nacionais"
  // Por enquanto, vou usar o mesmo popular mas com filtro? Melhor criar endpoint.
  // Mas como não temos, vou deixar genérico.
  // Vamos usar o discover com country=BR? Precisaria de um endpoint novo.
  // Vou simular com um alerta.
  console.warn('Endpoint /nacionais ainda não implementado.');
  return { movies: [], hasMore: false };
}

export async function fetchByGenre(genre, skip = 0, limit = 10) {
  const url = `${API_BASE}/genre/${genre}?skip=${skip}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar gênero: ${res.status}`);
  return await res.json();
}