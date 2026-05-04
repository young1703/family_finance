const STORAGE_KEY = 'family_finance_demo_state_v1';

const defaultState = {
  nodes: [
    { id: 'income', name: '급여 수입', x: 110, y: 180, r: 60, type: 'income', balance: 0, inflow: 5200000 },
    { id: 'account', name: '입출금 계좌', x: 490, y: 180, r: 70, type: 'account', balance: 2350000, inflow: 5200000 },
    { id: 'saving', name: '적금', x: 810, y: 120, r: 50, type: 'saving', balance: 9800000, inflow: 1800000 },
    { id: 'subs', name: '구독/통신', x: 810, y: 280, r: 45, type: 'expense', balance: 0, inflow: 900000 },
    { id: 'living', name: '생활비', x: 810, y: 440, r: 55, type: 'expense', balance: 0, inflow: 1650000 }
  ],
  flows: [
    { from: 'income', to: 'account', amount: 5200000 },
    { from: 'account', to: 'saving', amount: 1800000 },
    { from: 'account', to: 'subs', amount: 900000 },
    { from: 'account', to: 'living', amount: 1650000 }
  ]
};

const state = loadState();
let selectedNodeId = 'account';
let dragging = null;

const svg = document.querySelector('#graph');
const detail = document.querySelector('#detail');
const resetButton = document.querySelector('#reset-layout');

const fmt = (n) => `₩${n.toLocaleString('ko-KR')}`;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return JSON.parse(raw);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nodeById(id) {
  return state.nodes.find((n) => n.id === id);
}

function linkPath(a, b) {
  const c1x = a.x + (b.x - a.x) * 0.4;
  const c2x = a.x + (b.x - a.x) * 0.7;
  return `M${a.x},${a.y} C${c1x},${a.y} ${c2x},${b.y} ${b.x - b.r},${b.y}`;
}

function render() {
  svg.innerHTML = `
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <path d="M0,0 L0,6 L9,3 z" fill="#60a5fa"></path>
      </marker>
    </defs>`;

  for (const flow of state.flows) {
    const from = nodeById(flow.from);
    const to = nodeById(flow.to);
    const width = Math.max(2, Math.log10(flow.amount + 1) - 1);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'arrow');
    path.setAttribute('d', linkPath(from, to));
    path.setAttribute('stroke-width', String(width));
    path.setAttribute('marker-end', 'url(#arrow)');
    svg.appendChild(path);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'amount');
    text.setAttribute('x', String((from.x + to.x) / 2 - 15));
    text.setAttribute('y', String((from.y + to.y) / 2 - 12));
    text.textContent = fmt(flow.amount);
    svg.appendChild(text);
  }

  for (const n of state.nodes) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', `node ${n.type === 'income' ? 'income' : ''} ${selectedNodeId === n.id ? 'selected' : ''}`);
    circle.setAttribute('cx', String(n.x));
    circle.setAttribute('cy', String(n.y));
    circle.setAttribute('r', String(n.r));
    circle.dataset.id = n.id;
    circle.addEventListener('click', () => selectNode(n.id));
    circle.addEventListener('pointerdown', (e) => startDrag(e, n.id));
    svg.appendChild(circle);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'label');
    label.setAttribute('x', String(n.x - n.r + 10));
    label.setAttribute('y', String(n.y + 4));
    label.textContent = n.name;
    svg.appendChild(label);
  }
}

function selectNode(id) {
  selectedNodeId = id;
  const n = nodeById(id);
  detail.innerHTML = `
    <p>노드명: <strong>${n.name}</strong></p>
    <p>잔액: ${fmt(n.balance)}</p>
    <p>월 유입: ${fmt(n.inflow)}</p>
    <p>ID: <code>${n.id}</code></p>
    <p>좌표: (${Math.round(n.x)}, ${Math.round(n.y)})</p>
  `;
  render();
}

function startDrag(event, id) {
  event.preventDefault();
  dragging = { id };
  svg.setPointerCapture(event.pointerId);
}

svg.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());

  const node = nodeById(dragging.id);
  node.x = Math.max(node.r, Math.min(1000 - node.r, cursor.x));
  node.y = Math.max(node.r, Math.min(640 - node.r, cursor.y));
  selectNode(node.id);
});

svg.addEventListener('pointerup', (event) => {
  if (!dragging) return;
  svg.releasePointerCapture(event.pointerId);
  dragging = null;
  saveState();
});

resetButton?.addEventListener('click', () => {
  state.nodes = structuredClone(defaultState.nodes);
  state.flows = structuredClone(defaultState.flows);
  saveState();
  selectNode('account');
});

render();
selectNode(selectedNodeId);
