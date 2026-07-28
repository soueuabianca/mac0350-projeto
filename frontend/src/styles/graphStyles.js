export const graphStyles = [
  // 1. Regra base para todos os nós
  {
    selector: 'node',
    style: {
      // O 'data(title)' e 'data(name)' vêm do desempacotamento de parser.
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
      'background-color': '#E50914', 
      'width': '60px',               
      'height': '60px',
      'background-image': function(ele) {
          const path = ele.data('posterPath');
          // Adiciona a base do TMDB antes do caminho da imagem
          // Cache Buster: Adiciona um parâmetro falso no final da URL da imagem (?cors=1)
          return path ? `https://image.tmdb.org/t/p/w200${path}?cors=1` : '';
      },
      'background-fit': 'cover', 
      'background-image-crossorigin': 'anonymous'     
    }
  },

  // 3. Regra para as Pessoas (Nós Periféricos)
  {
    selector: 'node[label = "Person"]',
    style: {
      'background-color': '#50E3C2', 
      'width': '35px',               
      'height': '35px',
      'background-image': function(ele) {
          const path = ele.data('profilePath');
          // Usa a foto de perfil do artista
          // Cache Buster: Adiciona um parâmetro falso no final da URL da imagem (?cors=1)
          return path ? `https://image.tmdb.org/t/p/w200${path}?cors=1` : '';
      },
      'background-fit': 'cover',
      'background-image-crossorigin': 'anonymous'
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