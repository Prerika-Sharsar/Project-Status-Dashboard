// ===== DATA =====
let projects = [
  { id: 1, name: 'ERP System Upgrade',     category: 'Initiative', vendor: 'SAP',                budget: 480000, pct: 65, status: 'On Track', rag: 'G', notes: 'On schedule — UAT phase in progress' },
  { id: 2, name: 'Cloud Migration Phase 2', category: 'Initiative', vendor: 'AWS / Infosys',      budget: 320000, pct: 40, status: 'At Risk',  rag: 'A', notes: 'Resource constraints identified, mitigation plan underway' },
  { id: 3, name: 'Cybersecurity Overhaul',  category: 'Initiative', vendor: 'Palo Alto Networks', budget: 175000, pct: 85, status: 'On Track', rag: 'G', notes: 'Firewall rollout complete; endpoint phase next' },
  { id: 4, name: 'CRM Implementation',      category: 'Initiative', vendor: 'Salesforce',         budget: 210000, pct: 20, status: 'Delayed',  rag: 'R', notes: 'Scope creep escalated to steering committee' },
  { id: 5, name: 'AI Chatbot Platform',     category: 'AI',         vendor: 'OpenAI / Internal',  budget: 95000,  pct: 55, status: 'On Track', rag: 'G', notes: 'Pilot live; expanding to customer support team' },
];
let nextId = 6;
let editingId = null;
let activeTab = 'overview';

const STORAGE_KEY = 'itProjectStatusProjects';
const NEXT_ID_KEY = 'itProjectStatusNextId';

const progressColors = { G: '#4caf7d', A: '#f59e0b', R: '#e74c3c' };
const statusClass    = { 'On Track': 'on-track', 'At Risk': 'at-risk', 'Delayed': 'delayed', 'Completed': 'completed' };

function loadStoredData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(item => item && typeof item === 'object')) {
        projects = parsed;
      }
    } catch (err) {
      console.warn('Unable to load stored projects:', err);
    }
  }

  const storedNext = localStorage.getItem(NEXT_ID_KEY);
  if (storedNext) {
    const parsedNext = parseInt(storedNext, 10);
    if (!Number.isNaN(parsedNext) && parsedNext > 0) {
      nextId = parsedNext;
      return;
    }
  }

  nextId = projects.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  localStorage.setItem(NEXT_ID_KEY, String(nextId));
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  const titles = { overview: 'Portfolio Initiative Register', initiative: 'Initiative Projects', ai: 'AI Projects' };
  document.getElementById('registerTitle').textContent = titles[tab];
  renderTable();
}

function getFilteredProjects() {
  const search = document.getElementById('searchBox').value.toLowerCase();
  const statusF = document.getElementById('statusFilter').value;
  const ragF    = document.getElementById('ragFilter').value;

  return projects.filter(p => {
    if (activeTab === 'initiative' && p.category !== 'Initiative') return false;
    if (activeTab === 'ai'         && p.category !== 'AI')         return false;
    if (search && !p.name.toLowerCase().includes(search) && !p.vendor.toLowerCase().includes(search)) return false;
    if (statusF && p.status !== statusF) return false;
    if (ragF    && p.rag    !== ragF)    return false;
    return true;
  });
}

function renderTable() {
  const filtered = getFilteredProjects();
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');

  const base = activeTab === 'overview' ? projects
             : projects.filter(p => p.category === (activeTab === 'ai' ? 'AI' : 'Initiative'));
  updateStats(base);

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = filtered.map(p => {
    const sc  = statusClass[p.status] || 'on-track';
    const col = progressColors[p.rag] || '#4caf7d';
    const catClass = p.category === 'AI' ? 'ai' : 'initiative';
    return `
    <tr>
      <td>
        <div class="init-name">${escHtml(p.name)}</div>
        <div class="vendor">${escHtml(p.vendor)}</div>
      </td>
      <td><span class="cat-pill ${catClass}">${escHtml(p.category)}</span></td>
      <td class="vendor">${escHtml(p.vendor)}</td>
      <td class="budget">₹${p.budget.toLocaleString()}</td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${p.pct}%;background:${col}"></div>
          </div>
          <span class="pct">${p.pct}%</span>
        </div>
      </td>
      <td><span class="badge ${sc}"><span class="badge-dot"></span>${p.status}</span></td>
      <td>
        <div class="rag-wrap">
          <button class="rag-btn g ${p.rag==='G'?'active':''}" type="button">G</button>
          <button class="rag-btn a ${p.rag==='A'?'active':''}" type="button">A</button>
          <button class="rag-btn r ${p.rag==='R'?'active':''}" type="button">R</button>
        </div>
      </td>
      <td><div class="notes" title="${escHtml(p.notes)}">${escHtml(p.notes)}</div></td>
      <td>
        <div class="action-wrap">
          <button type="button" class="act-btn edit" data-action="edit" data-id="${p.id}">Edit</button>
          <button type="button" class="act-btn remove" data-action="remove" data-id="${p.id}">Remove</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function updateStats(base) {
  const total     = base.length;
  const onTrack   = base.filter(p => p.status === 'On Track' || p.status === 'Completed').length;
  const atRisk    = base.filter(p => p.status === 'At Risk').length;
  const delayed   = base.filter(p => p.status === 'Delayed').length;
  const budget    = base.reduce((s, p) => s + p.budget, 0);

  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statOnTrack').textContent = onTrack;
  document.getElementById('statAtRisk').textContent  = atRisk;
  document.getElementById('statCritical').textContent= delayed;
  document.getElementById('cardTotal').textContent   = total;
  document.getElementById('cardOnTrack').textContent = onTrack;
  document.getElementById('cardAtRisk').textContent  = atRisk;
  document.getElementById('cardDelayed').textContent = delayed;
  document.getElementById('metaCount').textContent   = `${total} Initiatives`;
  document.getElementById('metaBudget').textContent  = '₹' + budget.toLocaleString();
}

function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add New Project';
  clearForm();
  document.getElementById('modalOverlay').classList.add('open');
}

function openEditModal(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Project';
  document.getElementById('fName').value     = p.name;
  document.getElementById('fCategory').value = p.category;
  document.getElementById('fVendor').value   = p.vendor;
  document.getElementById('fBudget').value   = p.budget;
  document.getElementById('fPct').value      = p.pct;
  document.getElementById('fStatus').value   = p.status;
  document.getElementById('fRag').value      = p.rag;
  document.getElementById('fNotes').value    = p.notes;
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function clearForm() {
  ['fName','fCategory','fVendor','fBudget','fPct','fStatus','fNotes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('fRag').value = 'G';
}

function saveProject() {
  const name     = document.getElementById('fName').value.trim();
  const category = document.getElementById('fCategory').value;
  const vendor   = document.getElementById('fVendor').value.trim() || '—';
  const budget   = parseInt(document.getElementById('fBudget').value) || 0;
  const pct      = Math.min(100, Math.max(0, parseInt(document.getElementById('fPct').value) || 0));
  const status   = document.getElementById('fStatus').value;
  const rag      = document.getElementById('fRag').value;
  const notes    = document.getElementById('fNotes').value.trim();

  if (!name)     { alert('Please enter an initiative name.'); return; }
  if (!category) { alert('Please select a category (AI or Initiative).'); return; }
  if (!status)   { alert('Please select a status.'); return; }

  if (editingId !== null) {
    const idx = projects.findIndex(p => p.id === editingId);
    if (idx !== -1) projects[idx] = { id: editingId, name, category, vendor, budget, pct, status, rag, notes };
  } else {
    projects.push({ id: nextId++, name, category, vendor, budget, pct, status, rag, notes });
  }

  saveProjects();
  closeModal();
  renderTable();
}

function removeProject(id) {
  if (!confirm('Remove this project?')) return;
  projects = projects.filter(p => p.id !== id);
  saveProjects();
  renderTable();
}

function exportCSV() {
  const filtered = getFilteredProjects();
  const header = ['Name','Category','Vendor','Budget','%Complete','Status','RAG','Notes'];
  const rows = filtered.map(p =>
    [p.name, p.category, p.vendor, p.budget, p.pct, p.status, p.rag, p.notes]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  );
  const csv  = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'it-project-status.csv';
  a.click();
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function init() {
  loadStoredData();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('searchBox').addEventListener('input', renderTable);
  document.getElementById('statusFilter').addEventListener('change', renderTable);
  document.getElementById('ragFilter').addEventListener('change', renderTable);
  document.querySelector('.btn-export').addEventListener('click', exportCSV);
  document.querySelector('.btn-add').addEventListener('click', openAddModal);
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  document.querySelector('.btn-cancel').addEventListener('click', closeModal);
  document.querySelector('.btn-save').addEventListener('click', saveProject);

  document.getElementById('tableBody').addEventListener('click', function(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const id = Number(button.dataset.id);
    if (button.dataset.action === 'edit') openEditModal(id);
    if (button.dataset.action === 'remove') removeProject(id);
  });

  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  const d = new Date();
  document.getElementById('reportDate').textContent =
    d.getDate() + ' ' + d.toLocaleString('en-GB',{month:'long'}) + ' ' + d.getFullYear();

  renderTable();
}

document.addEventListener('DOMContentLoaded', init);
