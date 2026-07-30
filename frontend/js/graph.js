// frontend/js/graph.js
// Ponte entre o app e a renderização de grafo feita em /src (parser + estilos).
import cytoscape from 'cytoscape';
import { parseToCytoscape } from '../src/utils/parser.js';
import { graphStyles } from '../src/styles/graphStyles.js';

/**
 * Física do grafo.
 *
 * Espalhar demais tem um efeito colateral: o enquadramento precisa reduzir o
 * zoom para caber tudo, e os nós acabam minúsculos. Então a repulsão fica
 * perto do padrão do cose (400000) e o afastamento vem de nodeOverlap, que
 * separa os vizinhos sem inflar o grafo inteiro.
 */
const PHYSICS = {
  name: 'cose',
  padding: 60,
  nodeRepulsion: 420000,
  nodeOverlap: 45,
  idealEdgeLength: 130,
  edgeElasticity: 100,
  nestingFactor: 1.2,
  gravity: 70,
  numIter: 2000,
  initialTemp: 220,
  coolingFactor: 0.96,
  minTemp: 1.0,
  componentSpacing: 140,
  animationEasing: 'ease-out',
  // Quem enquadra na primeira renderização é o próprio cose. Tentei assumir
  // isso no animateFit com zoom calculado à mão e o resultado cortava nós nas
  // bordas; o fit nativo acerta.
  fit: true
};

/**
 * Primeira renderização.
 *
 * `animate: false` é deliberado: com 'end' o evento layoutstop chega antes da
 * animação de posições terminar, então o enquadramento era calculado sobre
 * coordenadas intermediárias e os nós escapavam da borda depois. Com as
 * posições resolvidas de uma vez, quem dá a sensação de fluidez é o movimento
 * de câmera do animateFit, que agora mira na geometria final.
 */
const LAYOUT = {
  ...PHYSICS,
  randomize: true,
  animate: false
};

/**
 * Usado na expansão. randomize: false mantém quem já está na tela no lugar e
 * só relaxa o grafo em volta dos nós novos — sem isso cada clique reembaralha
 * tudo. Menos iterações porque parte de um estado já bom.
 */
const LAYOUT_RELAX = {
  ...PHYSICS,
  randomize: false,
  numIter: 1200,
  animate: 'end',
  animationDuration: 550
};

const FIT_PADDING = 60;
// Tela estreita tem menos espaço para desperdiçar em margem
const CANVAS_ESTREITO = 560;
const FIT_PADDING_ESTREITO = 24;

/**
 * Enquadra o grafo numa única animação, respeitando o piso e o teto de zoom.
 *
 * Quando o grafo cabe dentro dos limites, delega para o `fit` do Cytoscape,
 * que resolve zoom e pan de uma vez. Fora deles o zoom é fixado no limite e o
 * pan é calculado à mão: passar `zoom` e `center` juntos para cy.animate faz
 * o pan ser derivado do zoom atual, não do de destino, e o grafo termina
 * deslocado — foi o que cortava os nós nas telas estreitas.
 */
// Quem pediu menos movimento no sistema recebe o estado final direto
const semAnimacao = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/**
 * Reenquadra sempre que o canvas muda de tamanho.
 *
 * O tamanho final do container nem sempre vale no momento em que o layout
 * termina — o painel lateral recolhe, a tela cheia entra, a janela gira, ou o
 * próprio grid assenta depois. Em vez de adivinhar o gatilho e reenquadrar por
 * setTimeout, o observer torna o enquadramento auto-corretivo: qualquer
 * mudança de caixa avisa o Cytoscape e refaz o fit.
 */
function observarTamanho(container, cy) {
  if (typeof ResizeObserver !== 'function') return;

  let timer = null;
  let primeira = true;

  const observer = new ResizeObserver(() => {
    // O observer dispara já na inscrição; esse primeiro aviso é redundante
    if (primeira) {
      primeira = false;
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (cy.destroyed?.()) return;
      cy.resize();
      animateFit(cy, 300);
    }, 120);
  });

  observer.observe(container);
  cy.on('destroy', () => {
    clearTimeout(timer);
    observer.disconnect();
  });
}

/**
 * Enquadra o grafo, animando o movimento de câmera.
 *
 * Envelope fino sobre cy.fit de propósito. Uma versão anterior calculava zoom
 * e pan à mão para impor um piso de legibilidade; o efeito colateral foi pior
 * que o problema — nós cortados na borda — então o fit nativo decide, e a
 * legibilidade fica por conta do zoom manual e do botão de enquadrar.
 */
function animateFit(cy, duration = 500) {
  if (!cy) return;
  const nodes = cy.nodes();
  if (nodes.empty()) return;

  const padding = cy.width() < CANVAS_ESTREITO ? FIT_PADDING_ESTREITO : FIT_PADDING;

  if (semAnimacao() || duration <= 0) {
    cy.fit(nodes, padding);
    return;
  }

  cy.animate({ fit: { eles: nodes, padding } }, { duration, easing: 'ease-out' });
}

/**
 * O parser usa o tmdbId cru como id do nó, e um filme e uma pessoa podem ter
 * o mesmo tmdbId — nesse caso o Cytoscape fundiria os dois nós. Aqui os ids
 * recebem o prefixo do rótulo (Movie-603 / Person-6384), preservando o tmdbId
 * original em data.tmdbId. Nas arestas o backend sempre orienta
 * Person -> Movie (ver docs/graph-schema.md).
 */
function withUniqueIds(elements) {
  const labelById = new Map();

  elements.forEach(el => {
    const data = el.data || {};
    if (data.source === undefined) {
      const nodeLabel = data.label || 'Node';
      labelById.set(data.id, nodeLabel);
    }
  });

  return elements.map(el => {
    const data = { ...el.data };

    // Nó não tem source/target
    if (data.source === undefined) {
      const nodeLabel = data.label || 'Node';
      return { data: { ...data, id: `${nodeLabel}-${data.id}`, tmdbId: data.id } };
    }

    const sourceLabel = labelById.get(data.source) || 'Node';
    const targetLabel = labelById.get(data.target) || 'Node';
    const source = `${sourceLabel}-${data.source}`;
    const target = `${targetLabel}-${data.target}`;
    const edgeLabel = data.label || 'edge';

    return {
      data: {
        ...data,
        id: `${source}-${edgeLabel}-${target}`,
        source,
        target
      }
    };
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
    layout: LAYOUT,
    // Abaixo disso os rótulos somem; o piso do enquadramento automático é
    // mais alto ainda (MIN_FIT_ZOOM), este aqui só limita o zoom manual
    minZoom: 0.25,
    maxZoom: 3,
    wheelSensitivity: 0.25,
    autolock: false,
    autounselectify: false
  });

  // O enquadramento inicial vem do `fit` do cose (ver PHYSICS). Daqui para
  // frente o observer cobre as mudanças de tamanho do container.
  observarTamanho(container, cy);

  if (handlers.onNodeTap) {
    cy.on('tap', 'node', (evt) => handlers.onNodeTap(evt.target.data(), cy));
  }

  cy.on('mouseover', 'node', (evt) => {
    const node = evt.target;
    const isCentral = node.data('isCentral') === 'true';
    const isExpanded = node.data('isExpanded') === 'true';

    if (isCentral) {
      node.data('hovered', 'false');
      container.style.cursor = 'default';
      return;
    }

    if (node.data('canExpand') === 'true') {
      node.data('hovered', 'true');
      container.style.cursor = isExpanded ? 'zoom-out' : 'pointer';
    } else {
      node.data('hovered', 'false');
      container.style.cursor = 'not-allowed';
    }
  });

  cy.on('mouseout', 'node', (evt) => {
    evt.target.data('hovered', 'false');
    container.style.cursor = 'default';
  });

  // Adiciona controles de zoom
  addGraphControls(container, cy);

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
  relaxLayout(cy);
  return novos.length;
}

/**
 * Reacomoda o grafo preservando as posições atuais e reenquadra ao terminar.
 * É o movimento que o usuário vê a cada expansão, então roda animado.
 */
function relaxLayout(cy) {
  const layout = cy.layout(LAYOUT_RELAX);
  cy.one('layoutstop', () => animateFit(cy, 550));
  layout.run();
}

export function mergeGraph(cy, backendData) {
  if (!cy) return { count: 0, addedNodeIds: [], addedEdgeIds: [] };

  const parsedElements = withUniqueIds(parseToCytoscape(backendData));
  const nodes = parsedElements.filter(el => el.data.source === undefined);
  const centralIds = new Set(
    nodes
      .filter(node => node.data.isCentral === 'true')
      .map(node => node.data.id)
  );

  cy.nodes().forEach(node => node.data('isCentral', 'false'));

  const novos = parsedElements.filter(el => cy.getElementById(el.data.id).empty());
  if (novos.length === 0) {
    cy.nodes().forEach(node => {
      if (centralIds.has(node.id())) {
        node.data('isCentral', 'true');
      }
    });
    return { count: 0, addedNodeIds: [], addedEdgeIds: [] };
  }

  cy.add(novos);
  cy.nodes().forEach(node => {
    if (centralIds.has(node.id())) {
      node.data('isCentral', 'true');
    }
  });
  relaxLayout(cy);
  return {
    count: novos.length,
    addedNodeIds: novos.filter(el => el.data.source === undefined).map(el => el.data.id),
    addedEdgeIds: novos.filter(el => el.data.source !== undefined).map(el => el.data.id)
  };
}

export function setCentralNode(cy, nodeId) {
  if (!cy) return;

  cy.nodes().forEach(node => {
    node.data('isCentral', node.id() === nodeId ? 'true' : 'false');
    node.data('hovered', 'false');
  });
  relaxLayout(cy);
}

/**
 * Controles sobrepostos ao canvas: zoom, enquadrar e tela cheia.
 *
 * Os botões entram no wrapper, não no #cy: assim continuam visíveis quando o
 * wrapper vai para tela cheia, e ficam fora do DOM que o Cytoscape gerencia.
 */
function addGraphControls(container, cy) {
  const wrapper = container.closest('.graph-canvas-wrapper') || container.parentElement;
  if (!wrapper) return;

  // Evita empilhar controles se o mesmo shell for renderizado de novo
  wrapper.querySelector('.graph-controls')?.remove();

  const controls = document.createElement('div');
  controls.className = 'graph-controls';
  controls.innerHTML = `
    <button class="graph-btn graph-btn-zoom-in" title="Ampliar" aria-label="Ampliar">+</button>
    <button class="graph-btn graph-btn-zoom-out" title="Reduzir" aria-label="Reduzir">−</button>
    <button class="graph-btn graph-btn-fit" title="Enquadrar o grafo" aria-label="Enquadrar o grafo">◎</button>
    <button class="graph-btn graph-btn-panel" title="Recolher o painel" aria-label="Recolher o painel">⇥</button>
    <button class="graph-btn graph-btn-fullscreen" title="Tela cheia" aria-label="Entrar em tela cheia">⛶</button>
  `;
  wrapper.appendChild(controls);

  const zoomInBtn = controls.querySelector('.graph-btn-zoom-in');
  const zoomOutBtn = controls.querySelector('.graph-btn-zoom-out');
  const fitBtn = controls.querySelector('.graph-btn-fit');
  const panelBtn = controls.querySelector('.graph-btn-panel');
  const fullscreenBtn = controls.querySelector('.graph-btn-fullscreen');

  // Zoom animado a partir do centro da viewport
  function zoomBy(fator) {
    const alvo = cy.zoom() * fator;
    cy.animate(
      {
        zoom: {
          level: alvo,
          renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
        }
      },
      { duration: 220, easing: 'ease-out' }
    );
  }

  zoomInBtn.addEventListener('click', () => zoomBy(1.25));
  zoomOutBtn.addEventListener('click', () => zoomBy(1 / 1.25));
  fitBtn.addEventListener('click', () => animateFit(cy, 450));

  // Recolhe o painel lateral para o canvas ocupar a largura toda
  panelBtn.addEventListener('click', () => {
    const layout = wrapper.closest('.graph-layout');
    if (!layout) return;

    const recolhido = layout.classList.toggle('panel-hidden');
    panelBtn.classList.toggle('active', recolhido);
    panelBtn.textContent = recolhido ? '⇤' : '⇥';
    panelBtn.title = recolhido ? 'Mostrar o painel' : 'Recolher o painel';
    panelBtn.setAttribute('aria-label', panelBtn.title);

    // A coluna muda por transição CSS; reenquadra quando ela termina
    setTimeout(() => {
      cy.resize();
      animateFit(cy, 400);
    }, 380);
  });

  const suportaFullscreen = typeof wrapper.requestFullscreen === 'function';

  // Sem a API nativa, cai para posicionamento fixo via CSS
  function fullscreenFallback() {
    wrapper.classList.toggle('is-fullscreen-fallback');
    sincronizarBotao(wrapper.classList.contains('is-fullscreen-fallback'));
  }

  function sincronizarBotao(ativo) {
    fullscreenBtn.classList.toggle('active', ativo);
    fullscreenBtn.textContent = ativo ? '⤡' : '⛶';
    fullscreenBtn.title = ativo ? 'Sair da tela cheia (Esc)' : 'Tela cheia';
    fullscreenBtn.setAttribute('aria-label', fullscreenBtn.title);

    // A altura do canvas muda por transição CSS; o Cytoscape só descobre o
    // novo tamanho quando avisado, então reenquadra depois que ela termina
    setTimeout(() => {
      cy.resize();
      animateFit(cy, 450);
    }, 380);
  }

  fullscreenBtn.addEventListener('click', async () => {
    if (!suportaFullscreen) {
      fullscreenFallback();
      return;
    }

    try {
      if (document.fullscreenElement === wrapper) {
        await document.exitFullscreen();
      } else {
        await wrapper.requestFullscreen();
      }
    } catch {
      fullscreenFallback();
    }
  });

  // Cobre também o Esc e o botão de tela cheia do navegador
  function onFullscreenChange() {
    sincronizarBotao(document.fullscreenElement === wrapper);
  }

  document.addEventListener('fullscreenchange', onFullscreenChange);

  // Sai do fullscreen e solta o listener quando o grafo é descartado
  cy.on('destroy', () => {
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    if (document.fullscreenElement === wrapper) document.exitFullscreen().catch(() => {});
  });
}
