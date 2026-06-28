import cytoscape from 'cytoscape';
import { parseToCytoscape } from './utils/parser.js';
import { graphStyles } from './styles/graphStyles.js';


// Deixar fixo ("movie-1" ou "The Matrix") só para testar issue grafo estático.
const FILME_TESTE = 'movie-1'; 
const API_URL = `http://127.0.0.1:8000/movie/${FILME_TESTE}`;

async function initGraph() {
  try {
    // 1. O Garçom (fetch) busca os dados no Backend
    const response = await fetch(API_URL);
    const backendData = await response.json();

    console.log("Dados que chegaram da API:", backendData);

    // 2. O Tradutor (parser) limpa os ingredientes
    const cyElements = parseToCytoscape(backendData);

    // 3. O Empratamento: Inicializamos o Cytoscape!
    const cy = cytoscape({
      container: document.getElementById('cy'), // A div no index.html
      elements: cyElements,                     // Os dados formatados
      style: graphStyles,                       // Nossas regras de cores e tamanhos
      layout: {
        name: 'cose',                           // Layout automático que espalha os nós
        padding: 50
      }
    });

    console.log("Grafo renderizado com sucesso!");

  } catch (error) {
    console.error("Erro ao carregar o grafo:", error);
  }
}

// Roda a função assim que a página carrega
initGraph();