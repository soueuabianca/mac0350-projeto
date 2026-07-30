export function parseToCytoscape(backendData) {

  const elements = [];
  const centerId = backendData?.center?.id;
  const centerLabel = backendData?.center?.label;

  // 1. Traduzir os Nós 
  backendData.nodes.forEach(node => {
    const isCentral = centerId != null && node.id === centerId && (!centerLabel || node.label === centerLabel);
    const canExpand = node.label === 'Person' || node.label === 'Movie';
    elements.push({
      data: {
        id: node.id,
        label: node.label,
        isCentral: isCentral ? 'true' : 'false',
        canExpand: canExpand ? 'true' : 'false',
        isExpanded: 'false',
        // Seleção (painel de detalhes) é estado próprio, separado de expansão:
        // um nó folha não expande e ainda assim pode estar selecionado.
        isSelected: 'false',
        interactionMode: 'expand',
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