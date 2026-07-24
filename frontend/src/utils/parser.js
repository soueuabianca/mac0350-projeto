export function parseToCytoscape(backendData) {

  const elements = [];

  // 1. Traduzir os Nós 
  backendData.nodes.forEach(node => {
    elements.push({
      data: {
        id: node.id,
        label: node.label,
        ...node.properties // 
      }
    });
  });

  // 2. Traduzir as Arestas 
  backendData.edges.forEach(edge => {
    elements.push({
      data: {
        // Cytoscape pede um ID único para cada aresta
        id: `${edge.source}-${edge.type}-${edge.target}`, 
        source: edge.source,
        target: edge.target,
        label: edge.type 
      }
    });
  });

 
  return elements;
}