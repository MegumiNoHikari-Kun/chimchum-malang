// ===================== TAB: PESANAN MASUK =====================
import {
  db, collection, getDocs, deleteDoc, updateDoc, doc
} from './common.js';
import { rupiah, state } from './common.js';

const orderTableBody = document.getElementById("orderTableBody");

/* ===== SUMMARY CARDS ===== */
function renderOrderSummary(list){
  const summaryEl = document.getElementById("orderSummary");
  if (!summaryEl) return;

  const counts = { all: list.length, new: 0, diproses: 0, selesai: 0, dibatalkan: 0 };
  list.forEach(order => {
    const status = order.status || "new";
    if (counts[status] !== undefined) counts[status]++;
  });

  const cards = [
    { key:"all", title:"Total Pesanan", value:counts.all, color:"#34495e" },
    { key:"new", title:"Pesanan Baru", value:counts.new, color:"#d35400" },
    { key:"diproses", title:"Sedang Diproses", value:counts.diproses, color:"#2980b9" },
    { key:"selesai", title:"Pesanan Selesai", value:counts.selesai, color:"#27ae60" },
    { key:"dibatalkan", title:"Dibatalkan", value:counts.dibatalkan, color:"#e74c3c" }
  ];

  summaryEl.innerHTML = cards.map(card => `
    <div onclick="window.filterOrders('${card.key}')" style="cursor:pointer; background:white; padding:15px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,.05); border:3px solid ${state.currentOrderFilter === card.key ? card.color : 'transparent'};">
      <div style="font-size:13px;color:#666;">${card.title}</div>
      <div style="font-size:28px; font-weight:700; color:${card.color};">${card.value}</div>
    </div>
  `).join('');
}

window.filterOrders = (status) => {
  state.currentOrderFilter = status;
  renderOrderSummary(state.cachedOrders);
  renderOrdersTable();
};

/* ===== TABLE RENDER ===== */
function renderOrdersTable(){
  const tbody = document.getElementById("orderTableBody");
  if (!tbody) return;

  let list = [...state.cachedOrders];
  if (state.currentOrderFilter !== "all") {
    list = list.filter(o => (o.status || "new") === state.currentOrderFilter);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#aaa;">Tidak ada data.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(o => {
    const tgl = o.created_at ? new Date(o.created_at.seconds * 1000).toLocaleString('id-ID') : '-';
    const itemStr = Array.isArray(o.items)
      ? o.items.map(i => `<span style="display:block;font-size:13px;">📌 ${i.nama} <b>(${i.qty}x)</b></span>`).join('')
      : "<span style='color:red;'>Format pesanan lama</span>";

    const labelTipe = o.payment_method ? `${o.address || '-'} <br><b style="color:var(--primary)">[${o.payment_method}]</b>` : (o.address || '-');
    const waLink = (o.phone && o.phone !== '-') ? `<a href="https://wa.me/${o.phone}" target="_blank" style="color:var(--primary);font-weight:600;"><i class="fa-brands fa-whatsapp"></i> ${o.phone}</a>` : '-';
    const status = o.status || "new";

    const statusStyles = {
      new: { bg: '#ffe8cc', clr: '#d35400', txt: 'NEW' },
      diproses: { bg: '#d6ecff', clr: '#2980b9', txt: 'DIPROSES' },
      selesai: { bg: '#d4f5dd', clr: '#27ae60', txt: 'SELESAI' },
      dibatalkan: { bg: '#ffdede', clr: '#e74c3c', txt: 'DIBATALKAN' }
    };
    const currentStyle = statusStyles[status] || statusStyles.new;
    const statusBadge = `<span style="padding:5px 10px; border-radius:20px; font-size:12px; font-weight:600; background:${currentStyle.bg}; color:${currentStyle.clr};">${currentStyle.txt}</span>`;

    return `
      <tr>
        <td style="font-size:13px;color:var(--gray);">${tgl}</td>
        <td><b>${o.customer_name || '-'}</b></td>
        <td>${waLink}</td>
        <td><span style="font-size:13px;">${labelTipe}</span></td>
        <td>${statusBadge}</td>
        <td>${itemStr}</td>
        <td style="color:var(--success);font-weight:700;">${rupiah(o.grand_total || 0)}</td>
        <td>
          <select onchange="window.updateOrderStatus('${o.id}', this.value)">
            <option value="new" ${status==='new'?'selected':''}>New</option>
            <option value="diproses" ${status==='diproses'?'selected':''}>Diproses</option>
            <option value="selesai" ${status==='selesai'?'selected':''}>Selesai</option>
            <option value="dibatalkan" ${status==='dibatalkan'?'selected':''}>Dibatalkan</option>
          </select>
          <button onclick="window.reprintOrder('${o.id}')">🖨️</button>
          <button class="btn-delete" onclick="window.deleteOrder('${o.id}')"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ===== LOAD / CRUD ===== */
window.loadOrders = async () => {
  if (!orderTableBody) return;
  orderTableBody.innerHTML = "<tr><td colspan='8' style='text-align:center;padding:20px;color:#aaa;'>Sedang menarik data...</td></tr>";
  try {
    const snap = await getDocs(collection(db, "orders"));
    let list = [];
    snap.forEach(d => { list.push({ id: d.id, ...d.data() }); });
    list.sort((a,b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
    state.cachedOrders = list;
    renderOrderSummary(state.cachedOrders);
    renderOrdersTable();
  } catch (err) {
    console.error(err);
    orderTableBody.innerHTML = "<tr><td colspan='8' style='text-align:center;color:red;padding:20px;'>Gagal memuat log pesanan.</td></tr>";
  }
};

window.deleteOrder = async (id) => {
  if (!confirm("Hapus permanen arsip pesanan ini?")) return;
  try {
    await deleteDoc(doc(db, "orders", id));
    // Update cache lokal tanpa fetch ulang semua data
    state.cachedOrders = state.cachedOrders.filter(o => o.id !== id);
    renderOrderSummary(state.cachedOrders);
    renderOrdersTable();
  } catch (err) {
    console.error("Gagal hapus order:", err);
    alert("Gagal menghapus pesanan: " + err.message);
  }
};

window.updateOrderStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, "orders", id), { status: status });
    const o = state.cachedOrders.find(o => o.id === id);
    if (o) o.status = status;
    renderOrderSummary(state.cachedOrders);
    renderOrdersTable();
  } catch (err) {
    console.error(err);
    alert("Gagal update status");
  }
};

/* ===== REPRINT (format sama dengan struk kasir) ===== */
window.reprintOrder = (id) => {
  const order = state.cachedOrders.find(o => o.id === id);
  if (!order) { alert("Data pesanan tidak ditemukan."); return; }
  cetakUlangPesanan(order);
};

function cetakUlangPesanan(order){
  const tgl = order.created_at ? new Date(order.created_at.seconds * 1000).toLocaleString('id-ID') : new Date().toLocaleString('id-ID');
  const noMeja = order.customer_name || '-';
  const waPelanggan = (order.phone && order.phone !== '-') ? order.phone : '-';
  const grandTotal = order.grand_total || 0;
  const metodeBayar = order.payment_method || '-';
  const uangBayar = order.cash_received ?? grandTotal;
  const kembalian = order.cash_change ?? 0;

  const itemsHtml = (order.items || []).map(i => `
    <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;">
      <span>${i.nama} x${i.qty}</span>
      <span>${rupiah(i.qty * i.harga)}</span>
    </div>
  `).join('');

  const printWindow = window.open('', '_blank', 'width=350,height=600');
  printWindow.document.write(`
    <html>
    <head>
      <title>Struk Belanja - ChimChum</title>
      <style>
        @page { margin: 0; }
        body { font-family: 'Courier New', Courier, monospace; width: 280px; padding: 10px; color: #000; }
        .text-center { text-align: center; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .bold { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="text-center bold" style="font-size:15px;">CHIMCHUM MALANG</div>
      <div class="text-center" style="font-size:11px;">Dimsum Mentai & Ohiyong</div>
      <div class="line"></div>
      <div style="font-size:11px; line-height:1.4;">
        Waktu  : ${tgl}<br>
        Meja   : ${noMeja}<br>
        No HP  : ${waPelanggan}
      </div>
      <div class="line"></div>
      ${itemsHtml}
      <div class="line"></div>
      <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:3px;" class="bold">
        <span>TOTAL TAGIHAN:</span>
        <span>${rupiah(grandTotal)}</span>
      </div>
      <div class="line"></div>
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px;">
        <span>Metode Bayar:</span>
        <span class="bold">${metodeBayar}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px;">
        <span>Uang Diterima:</span>
        <span>${rupiah(uangBayar)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px;">
        <span>Kembalian:</span>
        <span class="bold">${rupiah(kembalian)}</span>
      </div>
      <div class="line"></div>
      <div class="text-center" style="font-size:11px; margin-top:12px;">REPRINT PESANAN</div>
      <script>
        window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 300); }
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
