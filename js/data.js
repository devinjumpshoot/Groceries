/**
 * Smart Grocery & Budget Safety Tracker
 * Data default & katalog acuan harga bulan lalu
 */

const DEFAULT_CATEGORIES = [
  { id: 'sembako', name: 'Sembako & Beras', icon: 'wheat', color: '#f59e0b' },
  { id: 'protein', name: 'Daging & Protein', icon: 'drumstick', color: '#ef4444' },
  { id: 'sayur_buah', name: 'Sayur & Buah', icon: 'apple', color: '#10b981' },
  { id: 'bumbu', name: 'Bumbu & Minyak', icon: 'flame', color: '#f97316' },
  { id: 'instan', name: 'Mie & Makanan Instan', icon: 'soup', color: '#eab308' },
  { id: 'mandi', name: 'Mandi & Kebersihan', icon: 'sparkles', color: '#06b6d4' },
  { id: 'minuman', name: 'Susu & Minuman', icon: 'cup-soda', color: '#8b5cf6' },
  { id: 'camilan', name: 'Snack & Camilan', icon: 'cookie', color: '#ec4899' },
  { id: 'lainnya', name: 'Lain-lain', icon: 'shopping-bag', color: '#64748b' }
];

const DEFAULT_UNITS = [
  'pcs', 'kg', 'liter', 'pack', 'gram', 'botol', 'dus', 'sachet', 'ikat', 'kaleng'
];

// Database acuan harga historis bulan lalu (Harga Standar Pasar / Supermarket Anak Rantau)
const DEFAULT_PREVIOUS_MONTH_PRICES = {
  "beras ramos 5kg": { name: "Beras Ramos 5kg", category: "sembako", unit: "pack", price: 74000 },
  "beras setra ramos 5kg": { name: "Beras Setra Ramos 5kg", category: "sembako", unit: "pack", price: 76000 },
  "minyak goreng 2 liter": { name: "Minyak Goreng 2 Liter", category: "bumbu", unit: "pack", price: 34500 },
  "minyak goreng tropical 2l": { name: "Minyak Goreng Tropical 2L", category: "bumbu", unit: "pack", price: 35000 },
  "minyak goreng sania 2l": { name: "Minyak Goreng Sania 2L", category: "bumbu", unit: "pack", price: 34000 },
  "telur ayam negeri 1kg": { name: "Telur Ayam Negeri 1kg", category: "protein", unit: "kg", price: 29000 },
  "telur ayam 1kg": { name: "Telur Ayam 1kg", category: "protein", unit: "kg", price: 29000 },
  "indomie goreng 1 dus": { name: "Indomie Goreng 1 Dus (40 pcs)", category: "instan", unit: "dus", price: 118000 },
  "indomie goreng": { name: "Indomie Goreng", category: "instan", unit: "pcs", price: 3100 },
  "indomie ayam bawang": { name: "Indomie Ayam Bawang", category: "instan", unit: "pcs", price: 3000 },
  "susu ultra milk 1l": { name: "Susu Ultra Milk 1L", category: "minuman", unit: "pcs", price: 19500 },
  "susu uht full cream 1 liter": { name: "Susu UHT Full Cream 1 Liter", category: "minuman", unit: "pcs", price: 19500 },
  "kecap manis bango 520ml": { name: "Kecap Manis Bango 520ml", category: "bumbu", unit: "pack", price: 24500 },
  "saus sambal abc 335ml": { name: "Saus Sambal ABC 335ml", category: "bumbu", unit: "botol", price: 16500 },
  "dada ayam fillet 1kg": { name: "Dada Ayam Fillet 1kg", category: "protein", unit: "kg", price: 52000 },
  "tempe papan": { name: "Tempe Papan", category: "protein", unit: "pcs", price: 6000 },
  "tahu sutra putih": { name: "Tahu Sutra Putih", category: "protein", unit: "pack", price: 8000 },
  "sabun mandi cair lifebuoy 450ml": { name: "Sabun Mandi Cair Lifebuoy 450ml", category: "mandi", unit: "pack", price: 22000 },
  "shampoo pantene 290ml": { name: "Shampoo Pantene 290ml", category: "mandi", unit: "botol", price: 36000 },
  "pasta gigi pepsodent 225g": { name: "Pasta Gigi Pepsodent 225g", category: "mandi", unit: "pcs", price: 17500 },
  "deterjen soklin cair 750ml": { name: "Deterjen SoKlin Cair 750ml", category: "mandi", unit: "pack", price: 18500 },
  "pelembut royale soklin 720ml": { name: "Pelembut Royale SoKlin 720ml", category: "mandi", unit: "pack", price: 16000 },
  "tisu paseo 250 sheets": { name: "Tisu Paseo 250 Sheets", category: "mandi", unit: "pack", price: 13500 },
  "bawang merah 500g": { name: "Bawang Merah 500g", category: "bumbu", unit: "pack", price: 21000 },
  "bawang putih 500g": { name: "Bawang Putih 500g", category: "bumbu", unit: "pack", price: 22500 },
  "cabai rawit merah 250g": { name: "Cabai Rawit Merah 250g", category: "bumbu", unit: "pack", price: 18000 },
  "roti tawar kupas sari roti": { name: "Roti Tawar Kupas Sari Roti", category: "camilan", unit: "pack", price: 16500 },
  "kopi kapal api special 165g": { name: "Kopi Kapal Api Special 165g", category: "minuman", unit: "pack", price: 15500 },
  "gula pasir gulaku 1kg": { name: "Gula Pasir Gulaku 1kg", category: "sembako", unit: "kg", price: 18000 },
  "garam dapur cap kapal 250g": { name: "Garam Dapur Cap Kapal 250g", category: "bumbu", unit: "pack", price: 4000 },
  "biskuit roma kelapa 300g": { name: "Biskuit Roma Kelapa 300g", category: "camilan", unit: "pack", price: 11000 }
};

// Data riwayat belanja sebelumnya (Bulan Lalu) untuk pertama kali onboarding
const INITIAL_HISTORY_DATA = [
  {
    id: "trip-prev-month",
    date: "2026-09-05",
    title: "Belanja Bulanan Kos - September 2026",
    storeName: "Super Indo Swalayan",
    budget: 600000,
    totalOriginal: 554500,
    totalDiscount: 42500,
    totalFinal: 512000,
    itemCount: 9,
    items: [
      { id: "h1", name: "Beras Ramos 5kg", category: "sembako", unit: "pack", qty: 1, unitPrice: 74000, discountInput: "0", finalItemTotal: 74000, note: "Stok 1 bulan" },
      { id: "h2", name: "Minyak Goreng Tropical 2L", category: "bumbu", unit: "pack", qty: 1, unitPrice: 35000, discountInput: "5000", finalItemTotal: 30000, note: "Promo potongan 5rb" },
      { id: "h3", name: "Telur Ayam Negeri 1kg", category: "protein", unit: "kg", qty: 2, unitPrice: 29000, discountInput: "0", finalItemTotal: 58000, note: "2 tray/kg" },
      { id: "h4", name: "Indomie Goreng 1 Dus (40 pcs)", category: "instan", unit: "dus", qty: 1, unitPrice: 118000, discountInput: "10%", finalItemTotal: 106200, note: "Diskon 10%" },
      { id: "h5", name: "Susu Ultra Milk 1L", category: "minuman", unit: "pcs", qty: 2, unitPrice: 19500, discountInput: "0", finalItemTotal: 39000, note: "" },
      { id: "h6", name: "Sabun Mandi Cair Lifebuoy 450ml", category: "mandi", unit: "pack", qty: 1, unitPrice: 22000, discountInput: "20%", finalItemTotal: 17600, note: "Promo hemat" },
      { id: "h7", name: "Deterjen SoKlin Cair 750ml", category: "mandi", unit: "pack", qty: 2, unitPrice: 18500, discountInput: "0", finalItemTotal: 37000, note: "" },
      { id: "h8", name: "Kecap Manis Bango 520ml", category: "bumbu", unit: "pack", qty: 1, unitPrice: 24500, discountInput: "0", finalItemTotal: 24500, note: "" },
      { id: "h9", name: "Dada Ayam Fillet 1kg", category: "protein", unit: "kg", qty: 2, unitPrice: 52000, discountInput: "15%", finalItemTotal: 88400, note: "Meal prep 2 minggu" }
    ]
  }
];

// Template belanja siap pakai untuk anak rantau
const GROCERY_TEMPLATES = [
  {
    name: "Paket Hemat Anak Kos (Dasar)",
    description: "Kebutuhan esensial 1 bulan paling irit",
    estimatedTotal: 350000,
    items: [
      { name: "Beras Ramos 5kg", category: "sembako", unit: "pack", qty: 1, unitPrice: 76000, discountInput: "" },
      { name: "Minyak Goreng 2 Liter", category: "bumbu", unit: "pack", qty: 1, unitPrice: 35000, discountInput: "" },
      { name: "Telur Ayam Negeri 1kg", category: "protein", unit: "kg", qty: 2, unitPrice: 29500, discountInput: "" },
      { name: "Indomie Goreng", category: "instan", unit: "pcs", qty: 15, unitPrice: 3100, discountInput: "" },
      { name: "Sabun Mandi Cair Lifebuoy 450ml", category: "mandi", unit: "pack", qty: 1, unitPrice: 22000, discountInput: "" },
      { name: "Deterjen SoKlin Cair 750ml", category: "mandi", unit: "pack", qty: 1, unitPrice: 18500, discountInput: "" },
      { name: "Pasta Gigi Pepsodent 225g", category: "mandi", unit: "pcs", qty: 1, unitPrice: 17500, discountInput: "" }
    ]
  },
  {
    name: "Paket Lengkap Sehat (High Protein)",
    description: "Bagus untuk meal-prep dan gizi seimbang",
    estimatedTotal: 550000,
    items: [
      { name: "Beras Ramos 5kg", category: "sembako", unit: "pack", qty: 1, unitPrice: 76000, discountInput: "" },
      { name: "Dada Ayam Fillet 1kg", category: "protein", unit: "kg", qty: 2, unitPrice: 54000, discountInput: "" },
      { name: "Telur Ayam Negeri 1kg", category: "protein", unit: "kg", qty: 2, unitPrice: 29500, discountInput: "" },
      { name: "Tempe Papan", category: "protein", unit: "pcs", qty: 4, unitPrice: 6000, discountInput: "" },
      { name: "Tahu Sutra Putih", category: "protein", unit: "pack", qty: 2, unitPrice: 8000, discountInput: "" },
      { name: "Minyak Goreng Tropical 2L", category: "bumbu", unit: "pack", qty: 1, unitPrice: 35000, discountInput: "" },
      { name: "Bawang Merah 500g", category: "bumbu", unit: "pack", qty: 1, unitPrice: 22000, discountInput: "" },
      { name: "Bawang Putih 500g", category: "bumbu", unit: "pack", qty: 1, unitPrice: 23000, discountInput: "" },
      { name: "Susu Ultra Milk 1L", category: "minuman", unit: "pcs", qty: 2, unitPrice: 19500, discountInput: "" }
    ]
  }
];
