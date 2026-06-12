// ===================== COMMON / SHARED =====================
import {
  db, authReady, collection, getDocs,
  addDoc, deleteDoc, updateDoc, doc, serverTimestamp
} from '../firebase.js';

// ── SESSION GUARD SECURITY ──
if (sessionStorage.getItem('chimchum_admin') !== 'true') {
  alert("Akses Ditolak! Anda harus login melalui halaman utama.");
  window.location.href = "index.html";
}

// HELPERS
export function rupiah(n){ return 'Rp ' + Number(n).toLocaleString('id-ID'); }

// SHARED STATE (di-export agar modul lain bisa baca/tulis)
export const state = {
  cachedProducts: [],
  cachedOrders: [],
  currentOrderFilter: "all",
  kasirCart: {},
  currentKasirGrandTotal: 0,
  editId: null,
  currentFotoUrl: "",
  stokData: [],
  stokFilterStatus: ""
};

// TAB CONTROLLER SWITCHER
window.switchTab = (tabId, element) => {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  element.classList.add('active');

  if (tabId === 'tab-pesanan') window.loadOrders();
  if (tabId === 'tab-produk') window.loadProducts();
  if (tabId === 'tab-kasir') window.renderKasirMenu();
  if (tabId === 'tab-stok') window.loadStokMonitor();
  if (tabId === 'tab-laporan') window.loadLaporanKeuangan();
};

// LOGOUT ADMIN
window.logoutAdmin = () => {
  if (confirm("Apakah anda yakin ingin keluar dari panel admin?")) {
    sessionStorage.removeItem('chimchum_admin');
    window.location.href = "index.html";
  }
};

export {
  db, authReady, collection, getDocs,
  addDoc, deleteDoc, updateDoc, doc, serverTimestamp
};
