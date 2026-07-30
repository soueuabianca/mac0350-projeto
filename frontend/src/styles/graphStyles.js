export const graphStyles = [
  // 1. Regra base para TODOS os nós
  {
    selector: 'node',
    style: {
      // O 'data(title)' e 'data(name)' vêm do desempacotamento que fizemos no parser!
      'label': function(ele) { 
          // Se for filme, mostra o título. Se for pessoa, mostra o nome.
          return ele.data('title') || ele.data('name'); 
      },
      'text-valign': 'bottom',
      'text-margin-y': '5px',
      'color': '#ffffff',
      'font-size': '12px'
    }
  },

  // 2. Regra para os Filmes (Nó Central)
  {
    selector: 'node[label = "Movie"]',
    style: {
      'background-color': '#E50914', // Vermelho tipo cinema/Netflix
      'width': '60px',               // Tamanho maior (critério da issue atendido)
      'height': '60px'
    }
  },

  // 3. Regra para as Pessoas (Nós Periféricos)
  {
    selector: 'node[label = "Person"]',
    style: {
      'background-color': '#50E3C2', // Verde água para destacar
      'width': '35px',               // Tamanho menor
      'height': '35px'
    }
  },

  // 4. Regra para as Linhas (Arestas)
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#555',
      'target-arrow-color': '#555',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(label)', // Vai escrever "ACTED_IN" ou "DIRECTED" na linha
      'font-size': '10px',
      'color': '#888',
      'text-background-opacity': 1,
      'text-background-color': '#111'
    }
  }
];