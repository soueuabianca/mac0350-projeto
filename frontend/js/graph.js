// frontend/js/graph.js
import cytoscape from 'cytoscape';

export function parseToCytoscape(backendData) {
  const elements = [];
  backendData.nodes.forEach(node => {
    elements.push({
      data: {
        id: node.id,
        label: node.label,
        ...node.properties
      }
    });
  });
  backendData.edges.forEach(edge => {
    elements.push({
      data: {
        id: `${edge.source}-${edge.type}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        label: edge.type
      }
    });
  });
  return elements;
}

export function renderGraph(containerId, elements) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // Se já existir um cytoscape instance, destrua
  if (container._cy) {
    container._cy.destroy();
  }
  const cy = cytoscape({
    container: container,
    elements: elements,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#1e1e2f',
          'label': 'data(label)',
          'color': 'white',
          'text-outline-width': 2,
          'text-outline-color': '#1e1e2f'
        }
      },
      {
        selector: 'node[label="Movie"]',
        style: {
          'background-color': '#f5c842',
          'shape': 'round-rectangle'
        }
      },
      {
        selector: 'node[label="Person"]',
        style: {
          'background-color': '#3a3a50',
          'shape': 'ellipse'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-size': '10px'
        }
      }
    ],
    layout: {
      name: 'cose',
      idealEdgeLength: 100,
      nodeRepulsion: 2000
    }
  });
  // Armazenar referência para limpeza
  container._cy = cy;
  return cy;
}