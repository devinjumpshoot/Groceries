# 🛒 Smart Grocery & Budget Safety Tracker (PWA)

Aplikasi Web Mobile (Progressive Web App) modern bergaya native app untuk **anak rantau** yang berbelanja bulanan di supermarket sambil mendorong troli.

---

## 📱 Standar Arsitektur & Tampilan Mobile

1. **Format Layar Khusus Mobile (Max 430px)**: 
   - Dioptimalkan untuk genggaman satu tangan (ergonomi mobile).
   - Ditengahkan secara otomatis (*centered layout*) dengan *ambient dark frame* jika dibuka di browser desktop.
2. **Floating Bottom Navigation Bar**:
   - Menu melayang dengan ikon Lucide untuk tab **Belanja**, **Anggaran**, dan **Riwayat**.
3. **Ergonomi Ramah Jempol (Thumb-Friendly)**:
   - Tombol kuantitas bertingkat besar (`+` dan `−`), target sentuh minimal 44-48px.
   - Input numerik besar tanpa tabel desktop horizontal.
4. **PWA Standalone Support**:
   - Dilengkapi `manifest.json`, meta tag Apple Mobile Web App, dan `sw.js` (Service Worker) untuk belanja offline di dalam supermarket.

---

## ✅ Kebutuhan Fungsional (SRS Checklist)

| Kode | Fitur | Deskripsi Implementasi | Status |
|---|---|---|---|
| **F-01** | **Pencatatan Item Belanja Lengkap** | Menyimpan nama produk, kategori barang (Sembako, Protein, Sayur, Bumbu, Mandi, dll.), satuan (*kg, liter, pcs, pack, dus, botol*), kuantitas beli, dan harga satuan per item. | ✅ **Selesai** |
| **F-02** | **Perhitungan Kuantitas Otomatis** | Perubahan angka Qty (`+` / `−`) langsung menghitung ulang total baris dan total keranjang secara realtime. | ✅ **Selesai** |
| **F-03** | **Kalkulator Diskon Bertingkat** | Menghitung diskon tunggal (contoh: `25%`), diskon bertumpuk (contoh: `50% + 20%` dengan rumus matematis bertingkat), potongan nominal (`5000`), maupun kombinasi dengan rincian per langkah. | ✅ **Selesai** |
| **F-04** | **Komparator Harga Realtime vs Bulan Lalu** | Menampilkan indikator seketika saat nama & harga diinput: <br>• 🔴 **Panah Merah Naik (↑)** jika harga naik dibanding bulan lalu.<br>• 🟢 **Panah Hijau Turun (↓)** jika harga turun dibanding bulan lalu.<br>• ⚪ **Tanda Setara (=)** jika harga stabil. | ✅ **Selesai** |
| **F-05** | **Pengendali Anggaran (Safety Cap)** | Input batas maksimal dompet dengan indikator warna (*Hijau Aman < 75%*, *Kuning Waspada 75-90%*, *Merah Berkedip > 100%* + getaran haptic). | ✅ **Selesai** |
| **F-06** | **Riwayat & Database Belanja** | Fitur "Selesaikan & Simpan Belanjaan" mengarsipkan seluruh keranjang ke `localStorage` dan otomatis memperbarui database acuan harga untuk bulan berikutnya. | ✅ **Selesai** |

---

## 🚀 Cara Menjalankan

1. **Jalankan Web Server Lokal**:
   ```bash
   node server.js
   ```
2. **Buka di Browser**:
   Buka `http://localhost:3000` di Google Chrome / Safari / Edge.
3. **Instalasi PWA ke Layar Utama (Add to Home Screen)**:
   - **Chrome / Android**: Klik menu browser (⋮) -> Pilih **"Tambahkan ke Layar Utama" / "Install App"**.
   - **Safari / iOS**: Tekan tombol Share (📤) -> Pilih **"Add to Home Screen"**.