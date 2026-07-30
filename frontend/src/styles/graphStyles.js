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
      'font-size': '12px',
      'cursor': 'default'
    }
  },

  {
    selector: 'node[canExpand = "true"]',
    style: {
      'cursor': function(ele) {
        return ele.data('isExpanded') === 'true' ? 'zoom-out' : 'pointer';
      },
      'transition-property': 'width, height, border-width, border-color, opacity',
      'transition-duration': '120ms',
      'transition-timing-function': 'ease-out'
    }
  },

  {
    selector: 'node[isCentral = "true"]',
    style: {
      'cursor': 'default'
    }
  },

  {
    selector: 'node[hovered = "true"]',
    style: {
      'width': 46,
      'height': 46,
      'width': 46,
      'height': 46,
      'border-width': 3,
      'border-color': function(ele) {
        return ele.data('isExpanded') === 'true' ? '#ffb703' : '#f5d76e';
      },
      'border-opacity': 0.95,
      'shadow-blur': 12,
      'shadow-color': function(ele) {
        return ele.data('isExpanded') === 'true' ? '#ffb703' : '#f5d76e';
      },
      'shadow-opacity': 0.55,
      'opacity': 1
    }
  },

  {
    selector: 'node[canExpand = "false"]',
    style: {
      'cursor': 'not-allowed',
      'opacity': 0.78
    }
  },

  // 2. Regra para o nó central, independente do tipo
  {
    selector: 'node[isCentral = "true"]',
    style: {
      'width': '86px',
      'height': '86px',
      'border-width': 4,
      'border-color': '#f5d76e',
      'border-opacity': 0.95,
      'shadow-blur': 18,
      'shadow-color': '#f5d76e',
      'shadow-opacity': 0.65,
      'z-index': 10
    }
  },

  // 3. Regra para os Filmes (Nó Central)
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

  // 4. Regra para as Pessoas (Nós Periféricos)
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

  // 5. Regra para as Linhas (Arestas)
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#555',
      'target-arrow-color': '#555',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': '',
      'font-size': 0,
      'color': '#000000',
      'text-opacity': 0,
      'text-background-opacity': 0
    }
  },

  {
    selector: "edge[label = 'ACTED_IN']",
    style: {
      'line-color': '#3b82f6',
      'target-arrow-color': '#3b82f6'
    }
  },

  {
    selector: "edge[label = 'DIRECTED']",
    style: {
      'line-color': '#ef4444',
      'target-arrow-color': '#ef4444'
    }
  }
];