import cytoscape from 'cytoscape';
import { parseToCytoscape } from './utils/parser.js';
import { graphStyles } from './styles/graphStyles.js';

// A variável API_BASE_URL foi deletada. O Vite cuida do roteamento agora!

async function initGraph() {
  try {
    // 1. Adicionamos o '/api' para o proxy do Vite interceptar e mandar pro backend
    const popularResponse = await fetch('/api/popular?limit=1');

    if (!popularResponse.ok) {
      throw new Error(`Falha ao buscar filmes populares: ${popularResponse.status}`);
    }

    const { movies } = await popularResponse.json();
    const selectedMovie = movies?.[0];

    if (!selectedMovie?.tmdbId) {
      throw new Error('Nenhum filme retornado pela API do backend.');
    }

    // 2. Adicionamos o '/api' aqui também. O selectedMovie.tmdbId já é o ID numérico que o backend quer!
    const graphResponse = await fetch(`/api/movie/${selectedMovie.tmdbId}`);

    if (!graphResponse.ok) {
      throw new Error(`Falha ao buscar grafo do filme: ${graphResponse.status}`);
    }

    const backendData = await graphResponse.json();

    console.log('Dados que chegaram da API:', backendData);

    const cyElements = parseToCytoscape(backendData);

    cytoscape({
      container: document.getElementById('cy'),
      elements: cyElements,
      style: graphStyles,
      layout: {
        name: 'cose',
        padding: 50
      }
    });

    console.log('Grafo renderizado com sucesso!');
  } catch (error) {
    console.error('Erro ao carregar o grafo:', error);
  }
}

initGraph();