/**
 * Estilos do grafo.
 *
 * A ordem importa: entre seletores de mesma especificidade o Cytoscape aplica
 * o que vem depois. Por isso o arquivo vai do geral para o específico —
 * base, tipo do nó, estado (hover / central) e por último as arestas. Com as
 * regras de estado no fim, o nó central e o hover não são mais sobrescritos
 * pelo tamanho fixo de 'Movie' e 'Person'.
 */

// Rótulo: título se for filme, nome se for pessoa
const rotulo = ele => ele.data('title') || ele.data('name');

const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

// O parâmetro extra evita reaproveitar uma resposta em cache sem CORS
const imagemTmdb = campo => ele => {
  const path = ele.data(campo);
  return path ? `${TMDB_IMG}${path}?cors=1` : '';
};

export const graphStyles = [
  // ------------------------------------------------------------------
  // 1. Base de todos os nós
  // ------------------------------------------------------------------
  {
    selector: 'node',
    style: {
      'label': rotulo,
      'text-valign': 'bottom',
      'text-margin-y': '10px',
      'color': '#2c2420',
      'font-size': '12px',
      'font-weight': '600',
      // Halo claro: o rótulo continua legível mesmo se cruzar uma foto.
      // Acompanha --graph-label-halo em css/style.css.
      'text-outline-width': 2.5,
      'text-outline-color': '#f8f4ec',
      'text-outline-opacity': 1,
      // Nome longo é cortado em vez de se espalhar sobre os vizinhos
      'text-max-width': '110px',
      'text-wrap': 'ellipsis',
      'text-events': 'no',
      'cursor': 'default'
    }
  },

  // ------------------------------------------------------------------
  // 2. Tipo do nó
  // ------------------------------------------------------------------
  {
    selector: 'node[label = "Movie"]',
    style: {
      'background-color': '#c97355',
      'width': 70,
      'height': 70,
      'border-width': 1.5,
      'border-color': '#a85a42',
      'background-image': imagemTmdb('posterPath'),
      'background-fit': 'cover',
      'background-image-crossorigin': 'anonymous'
    }
  },

  {
    selector: 'node[label = "Person"]',
    style: {
      'background-color': '#7ba89a',
      'width': 48,
      'height': 48,
      'border-width': 1,
      'border-color': '#5a8b7f',
      'background-image': imagemTmdb('profilePath'),
      'background-fit': 'cover',
      'background-image-crossorigin': 'anonymous'
    }
  },

  // ------------------------------------------------------------------
  // 3. Estado — depois do tipo, para prevalecer sobre ele
  // ------------------------------------------------------------------
  {
    selector: 'node[canExpand = "true"]',
    style: {
      'cursor': ele => (ele.data('isExpanded') === 'true' ? 'zoom-out' : 'pointer'),
      'transition-property': 'width, height, border-width, border-color, opacity',
      'transition-duration': '150ms',
      'transition-timing-function': 'ease-out'
    }
  },

  // Sem filmes para revelar, mas ainda clicável: o clique abre os detalhes.
  // A opacidade menor é o aviso de "não expande"; o cursor continua de clique.
  {
    selector: 'node[canExpand = "false"]',
    style: {
      'cursor': 'pointer',
      'opacity': 0.78
    }
  },

  // Nó no painel de detalhes. Anel tracejado para não competir com o dourado
  // do nó central nem com o realce de hover.
  {
    selector: 'node[isSelected = "true"]',
    style: {
      'border-width': 3,
      'border-color': '#8b7355',
      'border-style': 'dashed',
      'border-opacity': 1,
      'opacity': 1,
      'z-index': 4
    }
  },

  // Cresce a partir do tamanho do próprio tipo, em vez de um valor único que
  // encolheria os filmes de 60 para 46
  {
    selector: 'node[hovered = "true"]',
    style: {
      'width': ele => (ele.data('label') === 'Movie' ? 82 : 60),
      'height': ele => (ele.data('label') === 'Movie' ? 82 : 60),
      'border-width': 3,
      'border-color': ele => (ele.data('isExpanded') === 'true' ? '#8b7355' : '#b8860b'),
      'border-opacity': 0.9,
      'shadow-blur': 10,
      'shadow-color': ele => (ele.data('isExpanded') === 'true' ? '#8b7355' : '#b8860b'),
      'shadow-opacity': 0.4,
      'opacity': 1,
      'z-index': 5
    }
  },

  // Nó central: maior de todos, independente do tipo
  {
    selector: 'node[isCentral = "true"]',
    style: {
      'width': 104,
      'height': 104,
      'border-width': 4,
      'border-color': '#b8860b',
      'border-opacity': 0.85,
      'shadow-blur': 16,
      'shadow-color': '#b8860b',
      'shadow-opacity': 0.35,
      'font-size': '14px',
      'text-margin-y': '12px',
      'text-max-width': '170px',
      'opacity': 1,
      'cursor': 'default',
      'z-index': 10
    }
  },

  // ------------------------------------------------------------------
  // 4. Arestas
  // ------------------------------------------------------------------
  {
    selector: 'edge',
    style: {
      'width': 1.5,
      // Um pouco mais fechado que o fundo areia, senão a linha desaparece
      'line-color': '#bfae97',
      'target-arrow-color': '#bfae97',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.9,
      'curve-style': 'bezier',
      'label': '',
      'font-size': 0,
      'text-opacity': 0,
      'text-background-opacity': 0,
      'opacity': 0.7
    }
  },

  {
    selector: "edge[label = 'ACTED_IN']",
    style: {
      'line-color': '#6b9fb0',
      'target-arrow-color': '#6b9fb0'
    }
  },

  {
    selector: "edge[label = 'DIRECTED']",
    style: {
      'line-color': '#c97355',
      'target-arrow-color': '#c97355'
    }
  }
];
