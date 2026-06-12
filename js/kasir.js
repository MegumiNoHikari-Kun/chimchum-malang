// ===================== TAB: KASIR DINE-IN =====================
import {
  db, collection, addDoc, updateDoc, doc, serverTimestamp
} from './common.js';
import { rupiah, state } from './common.js';

const kasirMenuList = document.getElementById("kasirMenuList");
const kasirCartItems = document.getElementById("kasirCartItems");

/* ===== DROPDOWN KATEGORI ===== */
window.updateKasirKategoriDropdown = (kategoriSet) => {
  const kategoriSelect = document.getElementById('filterKategoriKasir');
  if (!kategoriSelect) return;
  const daftarKategori = ['Semua', ...Array.from(kategoriSet).sort()];

  kategoriSelect.innerHTML = daftarKategori.map(k => `
    <option value="${k}">${k}</option>
  `).join('');
};

/* ===== SEARCH & FILTER ===== */
function jalankanFilterKasir() {
  const searchInput = document.getElementById('searchMenuKasir');
  const filterSelect = document.getElementById('filterKategoriKasir');
  if (!searchInput || !filterSelect) return;

  const kataKunci = searchInput.value.toLowerCase();
  const kategoriTerpilih = filterSelect.value;
  const semuaProduk = document.querySelectorAll('.kasir-item-card');

  semuaProduk.forEach(card => {
    const namaProduk = card.querySelector('h4').innerText.toLowerCase();
    const kategoriProduk = card.dataset.kategori || 'Umum';

    const cocokSearch = namaProduk.includes(kataKunci);
    const cocokKategori = (kategoriTerpilih === 'Semua') || (kategoriProduk === kategoriTerpilih);

    card.style.display = (cocokSearch && cocokKategori) ? 'block' : 'none';
  });
}

document.getElementById('searchMenuKasir')?.addEventListener('input', jalankanFilterKasir);
document.getElementById('filterKategoriKasir')?.addEventListener('change', jalankanFilterKasir);

/* ===== KALKULATOR CASH & KEMBALIAN ===== */
window.toggleCashSection = () => {
  const metode = document.getElementById("kasirMetodeBayar").value;
  const section = document.getElementById("sectionKalkulatorCash");
  if (section) section.style.display = (metode === "Cash") ? "block" : "none";
  window.hitungKembalian();
};

window.hitungKembalian = () => {
  const metode = document.getElementById("kasirMetodeBayar").value;
  if (metode !== "Cash") return;

  const uangBayar = Number(document.getElementById("kasirUangBayar").value) || 0;
  const kembalian = uangBayar - state.currentKasirGrandTotal;
  const elKembalian = document.getElementById("kasirKembalian");

  if (!elKembalian) return;

  if (uangBayar === 0) {
    elKembalian.innerText = "Rp 0";
    elKembalian.style.color = "var(--dark)";
  } else if (kembalian < 0) {
    elKembalian.innerText = "Uang Kurang!";
    elKembalian.style.color = "red";
  } else {
    elKembalian.innerText = rupiah(kembalian);
    elKembalian.style.color = "green";
  }
};

window.setUangCepat = (nominal) => {
  document.getElementById("kasirUangBayar").value = nominal;
  window.hitungKembalian();
};

window.setUangPas = () => {
  document.getElementById("kasirUangBayar").value = state.currentKasirGrandTotal;
  window.hitungKembalian();
};

/* ===== RENDER MENU KASIR ===== */
window.renderKasirMenu = () => {
  if (!kasirMenuList) return;
  kasirMenuList.innerHTML = "";
  if (state.cachedProducts.length === 0) {
    kasirMenuList.innerHTML = "<p>Produk tidak ditemukan. Refresh Page / Klik Kelola Produk.</p>";
    return;
  }
  state.cachedProducts.forEach(p => {
    const stok    = Number(p.stok) || 0;
    const habis   = stok <= 0;
    const stokTxt = habis ? '❌ Habis' : stok <= 5 ? `⚠ Sisa ${stok}` : `✓ ${stok} porsi`;
    const stokClr = habis ? '#e74c3c' : stok <= 5 ? '#e67e22' : '#27ae60';

    kasirMenuList.innerHTML += `
      <div class="kasir-item-card" data-kategori="${p.kategori || 'Umum'}" style="${habis ? 'opacity:.45;pointer-events:none;' : ''}" onclick="window.addToKasirCart('${p.id}', \`${p.nama}-${p.isi}\`, ${p.harga}, ${stok}, ${Number(p.hpp) || 0})">
        <img style="width:100%; height:120px; object-fit:cover; border-radius:8px;" src="${p.foto || 'https://via.placeholder.com/150'}" onerror="this.src='https://via.placeholder.com/150'">
        <h4>${p.nama}</h4>
        <spanstyle="font-size:12px;font-weight:600;color:grey;">${p.isi}</span>
        <p>${rupiah(p.harga)}</p>
        <span style="font-size:11px;font-weight:600;color:${stokClr};">${stokTxt}</span>
      </div>
    `;
  });
}

/* ===== CART ===== */
window.addToKasirCart = (id, nama, harga, stok, hpp) => {
  const inCart  = state.kasirCart[id]?.qty || 0;
  const stokMax = Number(stok) || 0;

  if (inCart >= stokMax) {
    alert(`Stok ${nama} hanya ${stokMax} porsi, sudah penuh di struk.`);
    return;
  }
  if (state.kasirCart[id]) { state.kasirCart[id].qty++; }
  else { state.kasirCart[id] = { id, nama, harga, qty: 1, stok: stokMax, hpp: Number(hpp) || 0 }; }
  updateKasirCartUI();
};

window.changeKasirQty = (id, delta) => {
  if (!state.kasirCart[id]) return;
  const next    = state.kasirCart[id].qty + delta;
  const stokMax = state.kasirCart[id].stok ?? 999;

  if (next > stokMax) {
    alert(`Stok tersisa hanya ${stokMax} porsi.`);
    return;
  }
  if (next <= 0) { delete state.kasirCart[id]; }
  else { state.kasirCart[id].qty = next; }
  updateKasirCartUI();
};

function updateKasirCartUI() {
  if (!kasirCartItems) return;
  const items = Object.values(state.kasirCart);
  if (items.length === 0) {
    kasirCartItems.innerHTML = `<p style="text-align:center; color:#aaa; font-size:13px; padding:20px 0;">Belum ada item dipilih.</p>`;
    document.getElementById("kasirGrandTotal").innerText = rupiah(0);
    state.currentKasirGrandTotal = 0;
    window.hitungKembalian();
    return;
  }

  let grandTotal = 0;
  kasirCartItems.innerHTML = items.map(item => {
    const totalItemHarga = item.qty * item.harga;
    grandTotal += totalItemHarga;
    return `
      <div class="receipt-item" style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <div style="max-width: 50%;">
          <div style="font-weight:600; font-size:13px;">${item.nama}</div>
          <div style="font-size:11px; color:var(--gray);">${rupiah(item.harga)}</div>
        </div>
        <div class="receipt-qty-control" style="display:flex; align-items:center; gap:6px;">
          <button onclick="window.changeKasirQty('${item.id}', -1)">-</button>
          <span style="font-weight:700; font-size:14px; min-width:15px; text-align:center;">${item.qty}</span>
          <button onclick="window.changeKasirQty('${item.id}', 1)">+</button>
        </div>
        <div style="font-weight:600; font-size:13px; min-width:70px; text-align:right;">${rupiah(totalItemHarga)}</div>
      </div>
    `;
  }).join('');

  document.getElementById("kasirGrandTotal").innerText = rupiah(grandTotal);
  state.currentKasirGrandTotal = grandTotal;
  window.hitungKembalian();
  window.renderKasirMenu();
}

/* ===== CETAK STRUK ===== */
function cetakStrukThermal(noMeja, waPelanggan, items, grandTotal, metodeBayar, uangBayar, kembalian) {
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  const tgl = new Date().toLocaleString('id-ID');

  let itemsHtml = items.map(i => `
    <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;">
      <span>${i.nama} x${i.qty}</span>
      <span>${rupiah(i.qty * i.harga)}</span>
    </div>
  `).join('');

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
        No HP  : ${waPelanggan || '-'}
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
      <div class="text-center" style="font-size:11px; margin-top:12px;">Terima Kasih Atas Kunjungan Anda!</div>
      <script>
        window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 300); }
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/* ===== SUBMIT TRANSAKSI ===== */
window.submitKasirOrder = async () => {
  const items = Object.values(state.kasirCart);
  if (items.length === 0) { alert("Struk kasir kosong! Pilih menu terlebih dahulu."); return; }

  const noMeja = document.getElementById("kasirNomorMeja").value.trim();
  if (!noMeja) { alert("Harap isi Nomor Meja pelanggan dine-in!"); return; }

  const waPelanggan = document.getElementById("kasirWaPelanggan").value.trim();
  const metodeBayar = document.getElementById("kasirMetodeBayar").value;
  const statusPrint = document.getElementById("printStrukCheck")?.checked;
  const grandTotal = items.reduce((total, item) => total + (item.qty * item.harga), 0);
  const totalHpp = items.reduce((total, item) => total + (item.qty * (Number(item.hpp) || 0)), 0);
  const totalProfit = grandTotal - totalHpp;

  let uangBayar = grandTotal;
  let kembalian = 0;

  if (metodeBayar === "Cash") {
    uangBayar = Number(document.getElementById("kasirUangBayar").value) || 0;
    if (uangBayar < grandTotal) {
      alert("Gagal simpan! Uang tunai yang dimasukkan masih kurang dari total tagihan.");
      return;
    }
    kembalian = uangBayar - grandTotal;
  }

  try {
    await addDoc(collection(db, "orders"), {
      customer_name: "Dine-In (" + noMeja + ")",
      phone: waPelanggan || "-",
      address: "Makan di Tempat",
      items: items.map(i => {
        const hppSatuan = Number(i.hpp) || 0;
        const profitSatuan = i.harga - hppSatuan;
        return {
          nama: i.nama,
          qty: i.qty,
          harga: i.harga,
          hpp: hppSatuan,
          profit: profitSatuan,
          subtotal: i.qty * i.harga,
          subtotal_hpp: i.qty * hppSatuan,
          subtotal_profit: i.qty * profitSatuan
        };
      }),
      grand_total: grandTotal,
      total_hpp: totalHpp,
      total_profit: totalProfit,
      payment_method: metodeBayar,
      cash_received: uangBayar,
      cash_change: kembalian,
      status: "selesai",
      created_at: serverTimestamp()
    });

    await Promise.all(
      items.map(i =>
        updateDoc(doc(db, "products", i.id), {
          stok: Math.max(0, (i.stok ?? 0) - i.qty)
        })
      )
    );

    alert("🎉 Transaksi Kasir Berhasil Disimpan!");

    if (statusPrint) {
      cetakStrukThermal(noMeja, waPelanggan, items, grandTotal, metodeBayar, uangBayar, kembalian);
    }

    state.kasirCart = {};
    document.getElementById("kasirNomorMeja").value = "";
    document.getElementById("kasirWaPelanggan").value = "";
    document.getElementById("kasirUangBayar").value = "";
    document.getElementById("kasirMetodeBayar").value = "Cash";
    window.toggleCashSection();
    updateKasirCartUI();
    await window.loadProducts();

  } catch (err) {
    console.error("Kasir Submit Error:", err);
    alert("Gagal memproses transaksi kasir.");
  }
};
