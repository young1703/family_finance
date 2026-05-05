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
    { id: crypto.randomUUID(), from: 'income', to: 'account', amount: 5200000 },
    { id: crypto.randomUUID(), from: 'account', to: 'saving', amount: 1800000 },
    { id: crypto.randomUUID(), from: 'account', to: 'subs', amount: 900000 },
    { id: crypto.randomUUID(), from: 'account', to: 'living', amount: 1650000 }
  ]
};

function clone(v) { return JSON.parse(JSON.stringify(v)); }
function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return clone(defaultState);
  return JSON.parse(raw);
}
function save(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

export const api = {
  async getDashboard() {
    const state = load();
    return clone(state);
  },

  async createFlow(payload) {
    const state = load();
    state.flows.push({ id: crypto.randomUUID(), ...payload });
    save(state);
    return { ok: true };
  },

  async deleteFlow(flowId) {
    const state = load();
    state.flows = state.flows.filter((f) => f.id !== flowId);
    save(state);
    return { ok: true };
  },

  async updateNodePosition(nodeId, posX, posY) {
    const state = load();
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error('node not found');
    node.x = posX;
    node.y = posY;
    save(state);
    return { ok: true };
  },

  async reset() {
    save(clone(defaultState));
    return { ok: true };
  },
  async exportState() {
    return clone(load());
  },

  async importState(payload) {
    if (!payload || !Array.isArray(payload.nodes) || !Array.isArray(payload.flows)) {
      throw new Error('invalid state payload');
    }
    save(clone(payload));
    return { ok: true };
  }
};
