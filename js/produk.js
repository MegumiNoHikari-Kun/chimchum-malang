// ===================== TAB: KELOLA PRODUK =====================
import {
  db, collection, getDocs, addDoc, deleteDoc, updateDoc, doc
} from './common.js';
import { rupiah, state } from './common.js';

const tableBody = document.getElementById("tableBody");

const inpNama = document.getElementById("nama");
const inpKategori = document.getElementById("kategori");
const inpIsi = document.getElementById("isi");
const inpHarga = document.getElementById("harga");
const inpHpp = document.getElementById("hpp");
const inpStok = document.getElementById("stok");
const inpFotoFile = document.getElementById("fotoFile");
const inpDeskripsi = document.getElementById("deskripsi");

/* FUNGSI GITHUB UPLOAD VIA API (proxy serverless) */
async function uploadToGithub(file) {
  const fileName = `assets/${Date.now()}-${file.name}`;
  const contentBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(contentBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, content: base64 })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Detail Error GitHub:", data);
    alert(`Gagal API GitHub: ${data.message} (${response.status})`);
    throw new Error(`GitHub API Error: ${data.message}`);
  }

  return data.url;
}

/* LOAD PRODUCTS (TAB PRODUK & SYNC KASIR) */
window.loadProducts = async () => {
  if (!tableBody) return;
  tableBody.innerHTML = "<tr><td colspan='8'>Memuat produk...</td></tr>";
  try {
    const snap = await getDocs(collection(db, "products"));
    tableBody.innerHTML = "";
    state.cachedProducts = [];
    const kategoriSet = new Set();

    snap.forEach(d => {
      const p = d.data();
      state.cachedProducts.push({ id: d.id, ...p });
      if (p.kategori) kategoriSet.add(p.kategori.trim());

      tableBody.innerHTML += `
        <tr>
          <td><img class="prod-img" style="width:60px; height:60px; object-fit:cover; border-radius:6px;" src="${p.foto || 'https://via.placeholder.com/60'}" onerror="this.src='https://via.placeholder.com/60'"></td>
          <td><b>${p.nama}</b></td>
          <td><span style="background:#fff1ea; padding:4px 8px; border-radius:6px; font-size:12px;">${p.kategori}</span></td>
          <td>${p.isi} pcs</td>
          <td style="color:var(--primary); font-weight:600">${rupiah(p.harga)}</td>
          <td style="color:#64748b">${rupiah(p.hpp || 0)}</td>
          <td>${p.stok} porsi</td>
          <td>
            <div class="action-btns">
              <button class="btn-edit" onclick="window.editProduct('${d.id}', \`${p.nama}\`, \`${p.kategori}\`, ${p.isi}, ${p.harga}, ${p.hpp || 0}, ${p.stok}, \`${p.foto || ''}\`, \`${p.deskripsi || ''}\`)">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-delete" onclick="window.deleteProduct('${d.id}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    window.updateKasirKategoriDropdown(kategoriSet);
    window.renderKasirMenu();
  } catch (err) {
    console.error("Error load products:", err);
    tableBody.innerHTML = "<tr><td colspan='8'>Gagal memuat data produk.</td></tr>";
  }
};

/* CREATE / UPDATE PRODUCT */
window.saveProduct = async () => {
  if (!inpNama.value || !inpHarga.value) { alert("Nama dan Harga produk wajib diisi!"); return; }

  const btnSimpan = document.querySelector(".btn-primary");
  btnSimpan.disabled = true;
  btnSimpan.innerHTML = "Menyimpan...";

  try {
    let fotoUrl = state.currentFotoUrl;

    if (inpFotoFile.files && inpFotoFile.files[0]) {
      fotoUrl = await uploadToGithub(inpFotoFile.files[0]);
    }

    const data = {
      nama: inpNama.value.trim(),
      kategori: inpKategori.value.trim() || 'Umum',
      isi: Number(inpIsi.value) || 0,
      harga: Number(inpHarga.value) || 0,
      hpp: Number(inpHpp.value) || 0,
      stok: Number(inpStok.value) || 0,
      deskripsi: inpDeskripsi.value.trim(),
      foto: fotoUrl,
      aktif: true
    };

    if (state.editId) {
      await updateDoc(doc(db, "products", state.editId), data);
      alert("Produk berhasil diupdate!");
      state.editId = null;
    } else {
      await addDoc(collection(db, "products"), data);
      alert("Produk baru berhasil ditambahkan!");
    }
    clearForm();
    window.loadProducts();
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan produk: " + err.message);
  } finally {
    btnSimpan.disabled = false;
    btnSimpan.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Informasi Produk`;
  }
};

/* DELETE PRODUCT */
window.deleteProduct = async (id) => {
  if (!confirm("Apakah Anda yakin ingin menghapus produk ini dari katalog?")) return;
  try {
    await deleteDoc(doc(db, "products", id));
    window.loadProducts();
  } catch (err) { alert("Gagal menghapus produk."); }
};

/* EDIT MODE INJECTOR */
window.editProduct = (id, n, k, i, h, hpp, s, f, d) => {
  state.editId = id;
  if (inpNama) inpNama.value = n;
  if (inpKategori) inpKategori.value = k;
  if (inpIsi) inpIsi.value = i;
  if (inpHarga) inpHarga.value = h;
  if (inpHpp) inpHpp.value = hpp;
  if (inpStok) inpStok.value = s;
  state.currentFotoUrl = f;
  if (inpDeskripsi) inpDeskripsi.value = d;
  document.getElementById("nama")?.scrollIntoView({ behavior: 'smooth' });
};

function clearForm(){
  if (inpNama) inpNama.value = "";
  if (inpKategori) inpKategori.value = "";
  if (inpIsi) inpIsi.value = "";
  if (inpHarga) inpHarga.value = "";
  if (inpHpp) inpHpp.value = "";
  if (inpStok) inpStok.value = "";
  if (inpFotoFile) inpFotoFile.value = "";
  if (inpDeskripsi) inpDeskripsi.value = "";
  state.editId = null;
  state.currentFotoUrl = "";
}
