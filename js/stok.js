// ===================== TAB: MONITORING STOK =====================
import { db, collection, getDocs, updateDoc, doc } from './common.js';
import { state } from './common.js';

window.loadStokMonitor = async () => {
  const stokBody = document.getElementById('stokTableBody');
  if (!stokBody) return;
  stokBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:30px;">Memuat data...</td></tr>';
  try {
    const snap = await getDocs(collection(db, 'products'));
    state.stokData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStokSummary();
    window.renderStokTable();
  } catch (e) {
    console.error(e);
    stokBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">Gagal memuat stok.</td></tr>';
  }
};

function stokStatus(stok) {
  const s = Number(stok) || 0;
  if (s <= 0)  return { key:'habis', label:'✕ Habis',    color:'#e74c3c', bg:'#fdf0ef' };
  if (s <= 5)  return { key:'tipis', label:'⚠ Menipis',  color:'#e67e22', bg:'#fef9e7' };
  return              { key:'aman',  label:'✓ Aman',     color:'#27ae60', bg:'#e8faf0' };
}

function renderStokSummary() {
  const summaryEl = document.getElementById('stokSummary');
  if (!summaryEl) return;
  const total  = state.stokData.length;
  const habis  = state.stokData.filter(p => Number(p.stok) <= 0).length;
  const tipis  = state.stokData.filter(p => Number(p.stok) > 0 && Number(p.stok) <= 5).length;
  const aman   = total - habis - tipis;

  const active = state.stokFilterStatus || '';

  const cards = [
    { key:'',      icon:'📦', bg:'#e8f4fd', value:total, color:'#222',    label:'Total Produk' },
    { key:'aman',  icon:'✅', bg:'#e8faf0', value:aman,  color:'#27ae60', label:'Stok Aman' },
    { key:'tipis', icon:'⚠️', bg:'#fef9e7', value:tipis, color:'#e67e22', label:'Stok Menipis' },
    { key:'habis', icon:'❌', bg:'#fdf0ef', value:habis, color:'#e74c3c', label:'Stok Habis' }
  ];

  summaryEl.innerHTML = cards.map(c => `
    <div onclick="window.setStokFilter('${c.key}')"
      style="cursor:pointer; background:white; border-radius:12px; padding:18px; box-shadow:0 2px 10px rgba(0,0,0,.05); display:flex; align-items:center; gap:14px; border:2px solid ${active === c.key ? 'var(--primary)' : 'transparent'}; transition:0.15s;">
      <div style="width:44px;height:44px;background:${c.bg};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">${c.icon}</div>
      <div><div style="font-size:24px;font-weight:700;color:${c.color};">${c.value}</div><div style="font-size:13px;color:#666;">${c.label}</div></div>
    </div>
  `).join('');
}

window.setStokFilter = (key) => {
  state.stokFilterStatus = state.stokFilterStatus === key ? '' : key;
  renderStokSummary();
  window.renderStokTable();
};

window.renderStokTable = () => {
  const stokBody = document.getElementById('stokTableBody');
  if (!stokBody) return;

  const filterStatus = state.stokFilterStatus || '';
  const searchVal = (document.getElementById('stokSearch')?.value || '').toLowerCase();

  let list = state.stokData;
  if (filterStatus) {
    list = list.filter(p => stokStatus(p.stok).key === filterStatus);
  }
  if (searchVal) {
    list = list.filter(p => (p.nama || '').toLowerCase().includes(searchVal));
  }

  if (list.length === 0) {
    stokBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#aaa;">Tidak ada data produk.</td></tr>';
    return;
  }
  stokBody.innerHTML = list.map(p => {
    const status = stokStatus(p.stok);
    return `
      <tr>
        <td><img class="prod-img" style="width:50px;height:50px;object-fit:cover;border-radius:8px;" src="${p.foto || 'https://via.placeholder.com/50'}" onerror="this.src='https://via.placeholder.com/50'"></td>
        <td><b>${p.nama}</b></td>
        <td><span style="background:#f1f5f9; padding:4px 8px; border-radius:6px; font-size:12px;">${p.kategori || 'Umum'}</span></td>
        <td style="font-weight: 700;">${p.stok} Porsi</td>
        <td><span style="padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600; background:${status.bg}; color:${status.color};">${status.label}</span></td>
        <td>
          <button onclick="window.stokDecrement('${p.id}')" style="padding:5px 9px;">-</button>
          <input type="number" id="stok-inp-${p.id}" value="${p.stok}" min="0" style="width:70px;padding:6px;margin:0;display:inline-block;">
          <button onclick="window.stokIncrement('${p.id}')" style="padding:5px 9px;">+</button>
          <button class="btn-primary" onclick="window.stokSave('${p.id}')" style="padding:5px 10px;">Simpan</button>
        </td>
      </tr>
    `;
  }).join('');
};

/* EDIT STOK INLINE */
window.stokDecrement = (id) => {
  const inp = document.getElementById(`stok-inp-${id}`);
  if (inp) inp.value = Math.max(0, Number(inp.value) - 1);
};
window.stokIncrement = (id) => {
  const inp = document.getElementById(`stok-inp-${id}`);
  if (inp) inp.value = Number(inp.value) + 1;
};
window.stokSave = async (id) => {
  const inp = document.getElementById(`stok-inp-${id}`);
  const newStok = inp ? (Number(inp.value) || 0) : 0;
  try {
    await updateDoc(doc(db, 'products', id), { stok: newStok });
    const p = state.stokData.find(p => p.id === id);
    if (p) p.stok = newStok;
    renderStokSummary();
    window.renderStokTable();

    const btn = document.querySelector(`button[onclick="window.stokSave('${id}')"]`);
    if (btn) {
      const orig = btn.innerText;
      btn.innerText = '✓ Tersimpan';
      btn.style.background = '#27ae60';
      setTimeout(() => { btn.innerText = orig; btn.style.background = ''; }, 1500);
    }
  } catch (e) {
    alert('Gagal simpan stok.');
    console.error(e);
  }
};
