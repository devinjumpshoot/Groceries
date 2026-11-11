# 🛒 Smart Grocery & Budget Safety Tracker (PWA)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://devinjumpshoot.github.io/Groceries/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-10b981?style=for-the-badge&logo=pwa)](https://devinjumpshoot.github.io/Groceries/)
[![Realtime Sync](https://img.shields.io/badge/Realtime%20Sync-PC%20%E2%86%94%20HP-blue?style=for-the-badge&logo=fastapi)](https://devinjumpshoot.github.io/Groceries/)

> 🌐 **Website / Live Demo URL**:  
> 👉 **[https://devinjumpshoot.github.io/Groceries/](https://devinjumpshoot.github.io/Groceries/)**

Aplikasi Web Mobile (**Progressive Web App**) modern bergaya native app yang dirancang khusus untuk **anak rantau** yang berbelanja bulanan di supermarket sambil mendorong troli. Dilengkapi sistem **Realtime Multi-Device Sync** agar data belanjaan di PC dan HP tersinkronisasi seketika saat presentasi.

---

## ⚡ Fitur Unggulan Presentasi: Realtime Sync (PC ↔ HP)

Aplikasi ini mendukung sinkronisasi dua arah seketika (*instant 2-way sync*) antara browser di Komputer (PC) dan Smartphone (HP):

1. **Local Server Mode (Wi-Fi / Hotspot)**:
   - Menggunakan teknologi **Server-Sent Events (SSE)** bawaan Node.js tanpa dependensi eksternal.
   - Latensi ultra-rendah (< 30ms).
   - Deteksi otomatis IP lokal (misal: `http://192.168.0.218:3000`).
2. **Cloud Fallback Mode (Internet / GitHub Pages)**:
   - Terintegrasi dengan **MQTT over WebSocket** untuk sinkronisasi via internet publik apabila PC dan HP berada di jaringan berbeda (misal: HP pakai paket data 4G/5G, PC pakai Wi-Fi kampus).
3. **Demo Ping Feature**:
   - Terdapat tombol **"Kirim Sinyal Tes (Ping)"** di modal sync. Saat ditekan di PC, HP audiens/penguji akan bergetar dan menampilkan notifikasi audio secara realtime.

---

## 📱 Standar Arsitektur & Tampilan Mobile

1. **Format Layar Khusus Mobile (Max 430px)**: 
   - Dioptimalkan untuk genggaman satu tangan (ergonomi mobile).
   - Ditengahkan secara otomatis (*centered layout*) dengan *ambient dark frame* jika dibuka di browser desktop.
2. **Pengendali Anggaran (Safety Cap)**:
   - Kotak batas anggaran responsif dengan tombol "Simpan" pas dan proporsional di semua ukuran layar smartphone.
3. **Floating Bottom Navigation Bar**:
   - Menu melayang dengan ikon Lucide untuk tab **Belanja**, **Anggaran**, dan **Riwayat**.
4. **Ergonomi Ramah Jempol (Thumb-Friendly)**:
   - Tombol kuantitas bertingkat besar (`+` dan `−`), target sentuh minimal 44-48px.
   - Input numerik besar tanpa tabel horizontal.
5. **PWA Standalone Support**:
   - Dilengkapi `manifest.json`, meta tag Apple Mobile Web App, dan `sw.js` (Service Worker) untuk belanja offline di dalam supermarket.

---

## ✅ Kebutuhan Fungsional (SRS Checklist)

| Kode | Fitur | Deskripsi Implementasi | Status |
|---|---|---|---|
| **F-01** | **Pencatatan Item Belanja Lengkap** | Menyimpan nama produk, kategori barang (Sembako, Protein, Sayur, Bumbu, Mandi, dll.), satuan (*kg, liter, pcs, pack, dus, botol*), kuantitas beli, dan harga satuan per item. | ✅ **Selesai** |
| **F-02** | **Perhitungan Kuantitas Otomatis** | Perubahan angka Qty (`+` / `−`) langsung menghitung ulang total baris dan total keranjang secara realtime. | ✅ **Selesai** |
| **F-03** | **Kalkulator Diskon Bertingkat** | Menghitung diskon tunggal (contoh: `25%`), diskon bertumpuk (contoh: `50% + 20%` dengan rumus matematis bertingkat), potongan nominal (`5000`), maupun kombinasi dengan rincian per langkah. | ✅ **Selesai** |
| **F-04** | **Komparator Harga Realtime vs Bulan Lalu** | Menampilkan indikator seketika saat nama & harga diinput: <br>• 🔴 **Panah Merah Naik (↑)** jika harga naik dibanding bulan lalu.<br>• 🟢 **Panah Hijau Turun (↓)** jika harga turun dibanding bulan lalu.<br>• ⚪ **Tanda Setara (=)** jika harga stabil. | ✅ **Selesai** |
| **F-05** | **Pengendali Anggaran (Safety Cap)** | Input batas maksimal dompet dengan indikator warna (*Hijau Aman < 75%*, *Kuning Waspada 75-90%*, *Merah Berkedip > 100%* + getaran haptic). Tombol simpan fleksibel dan tidak terpotong di layar HP. | ✅ **Selesai** |
| **F-06** | **Riwayat & Database Belanja** | Fitur "Selesaikan & Simpan Belanjaan" mengarsipkan seluruh keranjang dan otomatis memperbarui database acuan harga untuk bulan berikutnya. | ✅ **Selesai** |
| **F-07** | **Multi-Device Realtime Sync** | Sinkronisasi data keranjang, anggaran, dan riwayat belanja secara realtime 2 arah antara PC dan HP via Local SSE & Cloud MQTT. | ✅ **Selesai** |

---

## 🚀 Panduan Menjalankan & Presentasi (PC ↔ HP)

### Langkah 1: Jalankan Server di PC
Buka terminal / PowerShell di folder proyek ini dan jalankan:
```bash
node server.js
```
Terminal akan menampilkan informasi URL seperti ini:
```
============================================================
🛒 SMART GROCERY & BUDGET SAFETY TRACKER
⚡ REALTIME SYNC SERVER (PC <-> HP) IS ACTIVE!
============================================================
💻 Buka di PC ini  : http://localhost:3000
📱 Buka di HP (WiFi): http://192.168.0.218:3000
============================================================
```

### Langkah 2: Buka di PC & HP
1. **Di PC**: Buka browser dan kunjungi `http://localhost:3000`.
2. **Di HP**:
   - Sambungkan HP ke Wi-Fi atau Hotspot yang sama dengan PC.
   - Buka browser di HP dan ketik URL yang tertera di terminal (contoh: `http://192.168.0.218:3000`).
   - *Alternatif praktis*: Klik tombol **"Sync HP"** di header atas aplikasi pada PC, lalu scan QR Code yang muncul langsung dengan kamera HP Anda!

### Langkah 3: Uji Coba Realtime Saat Presentasi
1. Tambah item atau ubah kuantitas `+` / `−` di HP ➡️ Data di layar PC langsung berubah seketika tanpa refresh!
2. Ubah batas anggaran di PC dan klik **Simpan** ➡️ Layar HP langsung terupdate seketika!
3. Klik tombol **"Kirim Sinyal Tes (Ping)"** di modal Sync untuk membuktikan koneksi aktif 2 arah kepada penguji / audiens.

---

## ⚙️ Cara Mengisi Bagian "About" di GitHub

Untuk memunculkan link website resmi pada bagian sidebar **About** repository GitHub seperti di screenshot:

1. Buka halaman utama repository Anda di GitHub:  
   👉 `https://github.com/devinjumpshoot/Groceries`
2. Pada kolom sebelah kanan, cari bagian **About** lalu klik ikon gerigi **⚙️ (Edit repository details)**.
3. Isi kolom formulir dengan data berikut:
   - **Description**:  
     `🛒 Smart Grocery & Budget Safety Tracker (PWA) untuk anak rantau belanja bulanan dengan Realtime Sync PC & HP.`
   - **Website**:  
     `https://devinjumpshoot.github.io/Groceries/`
   - Beri tanda centang pada opsi **☑️ Use your GitHub Pages website**.
   - **Topics** (opsional):  
     `pwa`, `realtime-sync`, `grocery-tracker`, `budget-manager`, `mobile-first`, `javascript`
4. Klik tombol hijau **Save changes**.
5. Selesai! Link website Anda kini akan langsung terpampang rapi di bagian About repository GitHub.

---

## 📦 Instalasi PWA ke Layar Utama HP (Add to Home Screen)
- **Android / Google Chrome**: Klik menu browser (⋮) -> Pilih **"Tambahkan ke Layar Utama" / "Install App"**.
- **iOS / Safari**: Tekan tombol Share (📤) -> Pilih **"Add to Home Screen"**.
