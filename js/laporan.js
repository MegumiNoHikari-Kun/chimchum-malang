// ===================== TAB: LAPORAN KEUANGAN =====================
import { db, collection, getDocs } from './common.js';
import { rupiah, state } from './common.js';

let laporanChartInstance = null;
let productHppMap = {}; // { nama_produk: hpp }

function toDateInputValue(d){
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/* Set rentang cepat: N hari terakhir (termasuk hari ini) */
window.setLaporanRange = (days) => {
  const akhir = new Date();
  const mulai = new Date();
  mulai.setDate(mulai.getDate() - (days - 1));

  document.getElementById('laporanTglMulai').value = toDateInputValue(mulai);
  document.getElementById('laporanTglAkhir').value = toDateInputValue(akhir);

  window.loadLaporanKeuangan();
};

/* Inisialisasi default: 7 hari terakhir, hanya saat pertama buka tab */
function initDefaultRangeIfEmpty(){
  const elMulai = document.getElementById('laporanTglMulai');
  const elAkhir = document.getElementById('laporanTglAkhir');
  if (elMulai && !elMulai.value) {
    const akhir = new Date();
    const mulai = new Date();
    mulai.setDate(mulai.getDate() - 6);
    elMulai.value = toDateInputValue(mulai);
    elAkhir.value = toDateInputValue(akhir);
  }
}

/* Build map nama produk -> HPP terkini, dipakai untuk menghitung HPP historis */
async function buildProductHppMap(){
  // Manfaatkan cache produk jika sudah ada (dari tab Kelola Produk)
  if (state.cachedProducts && state.cachedProducts.length > 0) {
    productHppMap = {};
    state.cachedProducts.forEach(p => { productHppMap[p.nama] = Number(p.hpp) || 0; });
    return;
  }
  const snap = await getDocs(collection(db, 'products'));
  productHppMap = {};
  snap.forEach(d => {
    const p = d.data();
    productHppMap[p.nama] = Number(p.hpp) || 0;
  });
}

window.loadLaporanKeuangan = async () => {
  initDefaultRangeIfEmpty();

  const tableBody = document.getElementById('laporanTableBody');
  const summaryEl = document.getElementById('laporanSummary');
  if (!tableBody) return;

  const tglMulaiStr = document.getElementById('laporanTglMulai').value;
  const tglAkhirStr = document.getElementById('laporanTglAkhir').value;

  if (!tglMulaiStr || !tglAkhirStr) {
    alert('Pilih tanggal mulai dan akhir terlebih dahulu.');
    return;
  }

  const tglMulai = new Date(tglMulaiStr + 'T00:00:00');
  const tglAkhir = new Date(tglAkhirStr + 'T23:59:59');

  if (tglMulai > tglAkhir) {
    alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
    return;
  }

  tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:30px;">Memuat data laporan...</td></tr>';

  try {
    await buildProductHppMap();

    const snap = await getDocs(collection(db, 'orders'));
    const orders = [];
    snap.forEach(d => orders.push({ id: d.id, ...d.data() }));

    // Filter berdasarkan rentang tanggal & abaikan pesanan dibatalkan
    const filtered = orders.filter(o => {
      if (!o.created_at?.seconds) return false;
      if ((o.status || 'new') === 'dibatalkan') return false;
      const t = new Date(o.created_at.seconds * 1000);
      return t >= tglMulai && t <= tglAkhir;
    });

    // Kelompokkan per tanggal (yyyy-mm-dd)
    const dailyMap = {}; // { 'yyyy-mm-dd': { omzet, hpp, trx } }

    filtered.forEach(o => {
      const t = new Date(o.created_at.seconds * 1000);
      const key = toDateInputValue(t);
      if (!dailyMap[key]) dailyMap[key] = { omzet: 0, hpp: 0, trx: 0 };

      let omzetOrder = 0;
      let hppOrder = 0;

      if (o.total_hpp !== undefined && o.total_profit !== undefined) {
        // Order baru: data hpp & profit sudah tersimpan per transaksi (konsisten historis)
        omzetOrder = Number(o.grand_total) || 0;
        hppOrder = Number(o.total_hpp) || 0;
      } else {
        // Order lama: fallback hitung dari HPP produk terkini
        (o.items || []).forEach(item => {
          const subtotal = (Number(item.qty) || 0) * (Number(item.harga) || 0);
          omzetOrder += subtotal;
          const hppSatuan = item.hpp !== undefined ? Number(item.hpp) : (productHppMap[item.nama] ?? 0);
          hppOrder += hppSatuan * (Number(item.qty) || 0);
        });
      }

      dailyMap[key].omzet += omzetOrder;
      dailyMap[key].hpp += hppOrder;
      dailyMap[key].trx += 1;
    });

    // Buat daftar semua tanggal dalam rentang (termasuk yang kosong, agar chart kontinu)
    const allDates = [];
    const cursor = new Date(tglMulai);
    while (cursor <= tglAkhir) {
      allDates.push(toDateInputValue(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const rows = allDates.map(dateKey => {
      const d = dailyMap[dateKey] || { omzet: 0, hpp: 0, trx: 0 };
      const profit = d.omzet - d.hpp;
      const margin = d.omzet > 0 ? (profit / d.omzet * 100) : 0;
      return { date: dateKey, ...d, profit, margin };
    });

    renderLaporanSummary(rows);
    renderLaporanChart(rows);
    renderLaporanTable(rows);

  } catch (err) {
    console.error('Gagal load laporan keuangan:', err);
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;padding:20px;">Gagal memuat data laporan.</td></tr>';
  }
};

function renderLaporanSummary(rows){
  const summaryEl = document.getElementById('laporanSummary');
  if (!summaryEl) return;

  const totalOmzet = rows.reduce((a, r) => a + r.omzet, 0);
  const totalHpp = rows.reduce((a, r) => a + r.hpp, 0);
  const totalProfit = totalOmzet - totalHpp;
  const totalTrx = rows.reduce((a, r) => a + r.trx, 0);
  const margin = totalOmzet > 0 ? (totalProfit / totalOmzet * 100) : 0;

  const cards = [
    { icon:'💰', bg:'#e8f4fd', value: rupiah(totalOmzet), color:'#2980b9', label:'Total Omzet' },
    { icon:'📉', bg:'#fdf0ef', value: rupiah(totalHpp), color:'#e74c3c', label:'Total HPP' },
    { icon:'📈', bg:'#e8faf0', value: rupiah(totalProfit), color: totalProfit >= 0 ? '#27ae60' : '#e74c3c', label:'Total Profit' },
    { icon:'🧾', bg:'#fef9e7', value: totalTrx, color:'#e67e22', label:'Jumlah Transaksi' },
    { icon:'📊', bg:'#f3e8fd', value: margin.toFixed(1) + '%', color:'#8e44ad', label:'Margin Profit' }
  ];

  summaryEl.innerHTML = cards.map(c => `
    <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 2px 10px rgba(0,0,0,.05);display:flex;align-items:center;gap:14px;">
      <div style="width:44px;height:44px;background:${c.bg};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${c.icon}</div>
      <div style="min-width:0;">
        <div style="font-size:20px;font-weight:700;color:${c.color};white-space:nowrap;">${c.value}</div>
        <div style="font-size:13px;color:#666;">${c.label}</div>
      </div>
    </div>
  `).join('');
}

function renderLaporanChart(rows){
  const canvas = document.getElementById('laporanChart');
  if (!canvas) return;

  const labels = rows.map(r => {
    const d = new Date(r.date + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  });

  const dataOmzet = rows.map(r => r.omzet);
  const dataHpp = rows.map(r => r.hpp);
  const dataProfit = rows.map(r => r.profit);

  if (laporanChartInstance) {
    laporanChartInstance.destroy();
  }

  laporanChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Pemasukan (Omzet)',
          data: dataOmzet,
          backgroundColor: '#2980b9',
          borderRadius: 4
        },
        {
          label: 'Pengeluaran (HPP)',
          data: dataHpp,
          backgroundColor: '#e74c3c',
          borderRadius: 4
        },
        {
          label: 'Profit',
          data: dataProfit,
          type: 'line',
          borderColor: '#27ae60',
          backgroundColor: '#27ae60',
          tension: 0.3,
          fill: false,
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${rupiah(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (val) => rupiah(val)
          }
        }
      }
    }
  });
}

function renderLaporanTable(rows){
  const tableBody = document.getElementById('laporanTableBody');
  if (!tableBody) return;

  if (rows.every(r => r.trx === 0)) {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#aaa;">Tidak ada transaksi pada rentang tanggal ini.</td></tr>';
    return;
  }

  tableBody.innerHTML = rows.map(r => {
    const d = new Date(r.date + 'T00:00:00');
    const tglLabel = d.toLocaleDateString('id-ID', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
    const profitColor = r.profit >= 0 ? 'var(--success)' : '#e74c3c';
    return `
      <tr>
        <td>${tglLabel}</td>
        <td>${r.trx}</td>
        <td style="color:#2980b9;font-weight:600;">${rupiah(r.omzet)}</td>
        <td style="color:#e74c3c;font-weight:600;">${rupiah(r.hpp)}</td>
        <td style="color:${profitColor};font-weight:700;">${rupiah(r.profit)}</td>
        <td>${r.margin.toFixed(1)}%</td>
      </tr>
    `;
  }).join('');
}
