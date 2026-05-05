import { api } from './mockApi.js';

let state = { nodes: [], flows: [] };
let selectedNodeId = 'account';
let dragging = null;

const svg = document.querySelector('#graph');
const detail = document.querySelector('#detail');
const resetButton = document.querySelector('#reset-layout');
const flowForm = document.querySelector('#flow-form');
const fromSelect = document.querySelector('#flow-from');
const toSelect = document.querySelector('#flow-to');
const amountInput = document.querySelector('#flow-amount');
const flowList = document.querySelector('#flow-list');

const fmt = (n) => `₩${Math.round(n).toLocaleString('ko-KR')}`;
const nodeById = (id) => state.nodes.find((n) => n.id === id);

function linkPath(a, b) {
  const c1x = a.x + (b.x - a.x) * 0.4;
  const c2x = a.x + (b.x - a.x) * 0.7;
  return `M${a.x},${a.y} C${c1x},${a.y} ${c2x},${b.y} ${b.x - b.r},${b.y}`;
}

function refreshNodeInflows() {
  for (const node of state.nodes) node.inflow = 0;
  for (const flow of state.flows) {
    const toNode = nodeById(flow.to);
    if (toNode) toNode.inflow += flow.amount;
  }
}

function updateKpis() {
  const totalIncome = state.flows.filter((f) => f.from === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = state.flows.filter((f) => ['subs', 'living'].includes(f.to)).reduce((sum, f) => sum + f.amount, 0);
  const totalSaving = state.flows.filter((f) => f.to === 'saving').reduce((sum, f) => sum + f.amount, 0);
  const savingRate = totalIncome > 0 ? (totalSaving / totalIncome) * 100 : 0;
  document.querySelector('#kpi-income').textContent = `총수입: ${fmt(totalIncome)}`;
  document.querySelector('#kpi-expense').textContent = `총지출: ${fmt(totalExpense)}`;
  document.querySelector('#kpi-saving').textContent = `저축률: ${savingRate.toFixed(1)}%`;
}

function populateFlowSelects() {
  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';
  for (const node of state.nodes) {
    const a = document.createElement('option');
    a.value = node.id;
    a.textContent = node.name;
    fromSelect.appendChild(a);
    const b = document.createElement('option');
    b.value = node.id;
    b.textContent = node.name;
    toSelect.appendChild(b);
  }
  fromSelect.value = 'account';
  toSelect.value = 'living';
}

function renderFlowList() {
  flowList.innerHTML = '';
  state.flows.forEach((flow) => {
    const li = document.createElement('li');
    li.style.marginBottom = '6px';
    li.innerHTML = `<span>${nodeById(flow.from)?.name ?? flow.from} → ${nodeById(flow.to)?.name ?? flow.to} (${fmt(flow.amount)})</span> `;
    const del = document.createElement('button');
    del.textContent = '삭제';
    del.style.marginLeft = '8px';
    del.style.background = '#7f1d1d';
    del.style.color = '#fff';
    del.style.border = 'none';
    del.style.borderRadius = '4px';
    del.style.padding = '2px 6px';
    del.addEventListener('click', async () => {
      await api.deleteFlow(flow.id);
      await reload();
    });
    li.appendChild(del);
    flowList.appendChild(li);
  });
}

function renderGraph() {
  svg.innerHTML = `<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#60a5fa"></path></marker></defs>`;
  for (const flow of state.flows) {
    const from = nodeById(flow.from); const to = nodeById(flow.to);
    if (!from || !to) continue;
    const width = Math.max(2, Math.log10(flow.amount + 1) - 1);
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('class', 'arrow'); p.setAttribute('d', linkPath(from, to)); p.setAttribute('stroke-width', String(width)); p.setAttribute('marker-end', 'url(#arrow)');
    svg.appendChild(p);
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('class', 'amount'); t.setAttribute('x', String((from.x + to.x) / 2 - 15)); t.setAttribute('y', String((from.y + to.y) / 2 - 12)); t.textContent = fmt(flow.amount);
    svg.appendChild(t);
  }
  for (const n of state.nodes) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('class', `node ${n.type === 'income' ? 'income' : ''} ${selectedNodeId === n.id ? 'selected' : ''}`);
    c.setAttribute('cx', String(n.x)); c.setAttribute('cy', String(n.y)); c.setAttribute('r', String(n.r));
    c.addEventListener('click', () => selectNode(n.id));
    c.addEventListener('pointerdown', (e) => startDrag(e, n.id));
    svg.appendChild(c);
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    l.setAttribute('class', 'label'); l.setAttribute('x', String(n.x - n.r + 10)); l.setAttribute('y', String(n.y + 4)); l.textContent = n.name;
    svg.appendChild(l);
  }
}

function selectNode(id) {
  selectedNodeId = id;
  const n = nodeById(id);
  if (!n) return;
  detail.innerHTML = `<p>노드명: <strong>${n.name}</strong></p><p>잔액: ${fmt(n.balance)}</p><p>월 유입: ${fmt(n.inflow)}</p><p>ID: <code>${n.id}</code></p><p>좌표: (${Math.round(n.x)}, ${Math.round(n.y)})</p>`;
  renderGraph();
}

function startDrag(event, id) {
  event.preventDefault(); dragging = { id }; svg.setPointerCapture(event.pointerId);
}

svg.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const pt = svg.createSVGPoint(); pt.x = event.clientX; pt.y = event.clientY;
  const cur = pt.matrixTransform(svg.getScreenCTM().inverse());
  const node = nodeById(dragging.id);
  node.x = Math.max(node.r, Math.min(1000 - node.r, cur.x));
  node.y = Math.max(node.r, Math.min(640 - node.r, cur.y));
  selectNode(node.id);
});

svg.addEventListener('pointerup', async (event) => {
  if (!dragging) return;
  const node = nodeById(dragging.id);
  svg.releasePointerCapture(event.pointerId);
  dragging = null;
  await api.updateNodePosition(node.id, node.x, node.y);
});

flowForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const from = fromSelect.value; const to = toSelect.value; const amount = Number(amountInput.value || 0);
  if (from === to || amount <= 0) return;
  await api.createFlow({ from, to, amount });
  await reload(to);
});

resetButton?.addEventListener('click', async () => {
  await api.reset();
  await reload('account');
});

async function reload(nextSelectedId = selectedNodeId) {
  state = await api.getDashboard();
  refreshNodeInflows();
  populateFlowSelects();
  renderFlowList();
  updateKpis();
  selectNode(nextSelectedId);
}

reload();
