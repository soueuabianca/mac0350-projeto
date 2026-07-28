// frontend/js/graph.js
// Ponte entre o app e a renderização de grafo feita em /src (parser + estilos).
import cytoscape from 'cytoscape';
import { parseToCytoscape } from '../src/utils/parser.js';
import { graphStyles } from '../src/styles/graphStyles.js';

const LAYOUT = {
  name: 'cose',
  padding: 50,
  idealEdgeLength: 120,
  nodeRepulsion: 8000,
  animate: false
};

/**
 * O parser usa o tmdbId cru como id do nó, e um filme e uma pessoa podem ter
 * o mesmo tmdbId — nesse caso o Cytoscape fundiria os dois nós. Aqui os ids
 * recebem o prefixo do rótulo (Movie-603 / Person-6384), preservando o tmdbId
 * original em data.tmdbId. Nas arestas o backend sempre orienta
 * Person -> Movie (ver docs/graph-schema.md).
 */
function withUniqueIds(elements) {
  return elements.map(el => {
    const data = { ...el.data };

    if (data.source === undefined) {
      return { data: { ...data, id: `${data.label}-${data.id}`, tmdbId: data.id } };
    }

    const source = `Person-${data.source}`;
    const target = `Movie-${data.target}`;
    return { data: { ...data, id: `${source}-${data.label}-${target}`, source, target } };
  });
}

/**
 * Renderiza o grafo de um filme no container informado.
 *
 * @param {string} containerId  id da div que recebe o Cytoscape (ex: 'cy')
 * @param {object} backendData  resposta do backend no formato MovieGraph
 * @param {object} handlers     { onNodeTap(data, cy) }
 * @returns {object|null} instância do Cytoscape
 */

export function renderGraph(containerId, backendData, handlers = {}) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  // Descarta o grafo anterior para não vazar instâncias entre navegações
  if (container._cy) {
    container._cy.destroy();
    container._cy = null;
  }

  // 1. Guarda os elementos formatados numa variável
  const cyElements = withUniqueIds(parseToCytoscape(backendData));

  //  2. Estratégia para debugar
  console.log("ELEMENTOS PRONTOS PRO CYTOSCAPE:", cyElements);

  // 3. Inicializa o Cytoscape usando a variável
  const cy = cytoscape({
    container,
    elements: cyElements,
    style: graphStyles,
    layout: LAYOUT
  });

  if (handlers.onNodeTap) {
    cy.on('tap', 'node', (evt) => handlers.onNodeTap(evt.target.data(), cy));
  }

  container._cy = cy;
  return cy;
}

/**
 * Acrescenta nós/arestas a um grafo já renderizado, ignorando o que já existe.
 * Usado na expansão dinâmica (clicar numa pessoa revela outros filmes dela).
 *
 * @returns {number} quantidade de elementos novos adicionados
 */
export function expandGraph(cy, backendData) {
  if (!cy) return 0;

  const novos = withUniqueIds(parseToCytoscape(backendData))
    .filter(el => cy.getElementById(el.data.id).empty());

  if (novos.length === 0) return 0;

  cy.add(novos);
  cy.layout(LAYOUT).run();
  return novos.length;
}
