// ===================== ENTRY POINT =====================
import { authReady } from './common.js';
import './produk.js';
import './pesanan.js';
import './kasir.js';
import './stok.js';
import './laporan.js';

// Tunggu auth siap sebelum query Firestore pertama kali
authReady.then(() => {
  window.loadProducts();
  window.renderKasirMenu();
});
