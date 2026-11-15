/**
 * Smart Grocery & Budget Safety Tracker
 * Main Application Logic
 */

// Application State
const state = {
  activeTab: 'belanja', // 'belanja', 'anggaran', 'riwayat'
  budgetCap: 500000,    // Default 500k IDR for anak rantau
  currentSession: {
    storeName: "Lotte Mart Grocery - Puri Indah",
    date: new Date().toISOString().split('T')[0]
  },
  cart: [],
  history: [],
  priceDatabase: {},
  selectedCategoryFilter: 'all',
  searchQuery: '',
  editingItemId: null,
  editingDiscountItemId: null,
  optionsItemId: null
};

// LocalStorage Keys
const STORAGE_KEYS = {
  CART: 'smart_grocery_cart',
  BUDGET: 'smart_grocery_budget',
  HISTORY: 'smart_grocery_history',
  PRICES: 'smart_grocery_prices',
  SESSION: 'smart_grocery_session'
};

/* ==========================================================================
   INITIALIZATION & PERSISTENCE
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  initPWA();
  initLucideIcons();
  setupEventListeners();
  renderApp();
  initCloudSync();
});

function initCloudSync() {
  if (window.FirebaseSync && window.FirebaseSync.isAvailable()) {
    window.FirebaseSync.initRealtimeListener((type, data) => {
      if (type === 'cart' && Array.isArray(data)) {
        state.cart = data;
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(data));
        renderApp();
      } else if (type === 'budget' && typeof data === 'number') {
        state.budgetCap = data;
        localStorage.setItem(STORAGE_KEYS.BUDGET, data.toString());
        renderApp();
      } else if (type === 'history' && Array.isArray(data)) {
        state.history = data;
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data));
        renderApp();
      }
    });

    // Initial sync
    window.FirebaseSync.syncCart(state.cart);
    window.FirebaseSync.syncBudget(state.budgetCap);
  }
}

function loadDataFromStorage() {
  // F-01: Load Sesi Belanja Aktif (Lokasi Toko & Tanggal)
  const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession);
      if (parsed.storeName) state.currentSession.storeName = parsed.storeName;
      if (parsed.date) state.currentSession.date = parsed.date;
    } catch (e) {}
  }

  // Set input tanggal & toko di UI
  const storeInput = document.getElementById('sessionStoreInput');
  const dateInput = document.getElementById('sessionDateInput');
  if (storeInput) storeInput.value = state.currentSession.storeName;
  if (dateInput) {
    dateInput.value = state.currentSession.date;
    updateSessionBadgeDate(state.currentSession.date);
  }

  // Load Budget
  const savedBudget = localStorage.getItem(STORAGE_KEYS.BUDGET);
  if (savedBudget) {
    state.budgetCap = parseFloat(savedBudget) || 500000;
  }

  // Load Price Database (default + stored)
  const savedPrices = localStorage.getItem(STORAGE_KEYS.PRICES);
  if (savedPrices) {
    try {
      state.priceDatabase = { ...DEFAULT_PREVIOUS_MONTH_PRICES, ...JSON.parse(savedPrices) };
    } catch (e) {
      state.priceDatabase = { ...DEFAULT_PREVIOUS_MONTH_PRICES };
    }
  } else {
    state.priceDatabase = { ...DEFAULT_PREVIOUS_MONTH_PRICES };
  }

  // Load History
  const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
  if (savedHistory) {
    try {
      state.history = JSON.parse(savedHistory);
    } catch (e) {
      state.history = [...INITIAL_HISTORY_DATA];
    }
  } else {
    state.history = [...INITIAL_HISTORY_DATA];
    saveHistoryToStorage();
  }

  // Load Cart or start with sample items
  const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
  if (savedCart) {
    try {
      state.cart = JSON.parse(savedCart);
    } catch (e) {
      state.cart = [];
    }
  } else {
    // Initial sample grocery cart for live demo
    state.cart = [
      {
        id: 'cart-1',
        name: 'Beras Ramos 5kg',
        category: 'sembako',
        unit: 'pack',
        qty: 1,
        unitPrice: 76000,
        discountInput: '0',
        isChecked: true,
        note: 'Stok beras sebulan'
      },
      {
        id: 'cart-2',
        name: 'Minyak Goreng 2 Liter',
        category: 'bumbu',
        unit: 'pack',
        qty: 1,
        unitPrice: 33000,
        discountInput: '5000',
        isChecked: true,
        note: 'Promo flash sale'
      },
      {
        id: 'cart-3',
        name: 'Telur Ayam Negeri 1kg',
        category: 'protein',
        unit: 'kg',
        qty: 2,
        unitPrice: 31000,
        discountInput: '',
        isChecked: false,
        note: 'Harga lagi naik sedikit'
      },
      {
        id: 'cart-4',
        name: 'Sabun Mandi Cair Lifebuoy 450ml',
        category: 'mandi',
        unit: 'pack',
        qty: 2,
        unitPrice: 22000,
        discountInput: '50% + 20%',
        isChecked: false,
        note: 'Diskon bertingkat supermarket'
      }
    ];
    saveCartToStorage();
  }
}

function saveSessionToStorage() {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(state.currentSession));
}

function updateSessionBadgeDate(dateStr) {
  const badge = document.getElementById('sessionActiveBadge');
  if (!badge) return;
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) {
    badge.textContent = 'Hari Ini';
  } else {
    badge.textContent = formatDate(dateStr);
  }
}

function saveCartToStorage() {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
  if (window.FirebaseSync) window.FirebaseSync.syncCart(state.cart);
}

function saveBudgetToStorage() {
  localStorage.setItem(STORAGE_KEYS.BUDGET, state.budgetCap.toString());
  if (window.FirebaseSync) window.FirebaseSync.syncBudget(state.budgetCap);
}

function saveHistoryToStorage() {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
  if (window.FirebaseSync) window.FirebaseSync.syncHistory(state.history);
}

function savePricesToStorage() {
  localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(state.priceDatabase));
  if (window.FirebaseSync) window.FirebaseSync.syncPrices(state.priceDatabase);
}

function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
      .catch((err) => console.warn('PWA Service Worker registration failed:', err));
  }
}

function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* ==========================================================================
   MATHEMATICAL ENGINES (F-02 & F-03 & F-04)
   ========================================================================== */

/**
 * F-03: Kalkulator Diskon Bertingkat
 * Menghitung diskon tunggal (contoh: 25%), diskon bertingkat (contoh: 50% + 20%), 
 * diskon nominal (contoh: 5000), atau kombinasi (contoh: 20% + 5000)
 */
function calculateTieredDiscount(unitPrice, qty, discountStr) {
  const originalSubtotal = unitPrice * qty;
  if (!discountStr || discountStr.trim() === '' || discountStr.trim() === '0') {
    return {
      originalSubtotal,
      finalTotal: originalSubtotal,
      discountAmount: 0,
      discountPercentage: 0,
      steps: [
        { label: 'Harga Asli', amount: originalSubtotal }
      ]
    };
  }

  // Clean string and split by '+'
  const parts = discountStr.split('+').map(p => p.trim()).filter(Boolean);
  let currentAmount = originalSubtotal;
  const steps = [{ label: `Harga Awal (${qty} x ${formatRupiah(unitPrice)})`, amount: originalSubtotal }];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes('%')) {
      const pct = parseFloat(part.replace('%', '')) || 0;
      const cut = currentAmount * (pct / 100);
      currentAmount = Math.max(0, currentAmount - cut);
      steps.push({
        label: `Diskon ${i + 1} (${pct}%)`,
        cutAmount: cut,
        amountAfter: currentAmount
      });
    } else {
      // Nominal discount (e.g. 5000, 5k, 5.000)
      let cleanNum = part.toLowerCase().replace(/k/g, '000').replace(/[^0-9]/g, '');
      const nominal = parseFloat(cleanNum) || 0;
      const cut = Math.min(currentAmount, nominal);
      currentAmount = Math.max(0, currentAmount - cut);
      steps.push({
        label: `Potongan ${i + 1} (${formatRupiah(nominal)})`,
        cutAmount: cut,
        amountAfter: currentAmount
      });
    }
  }

  const discountAmount = originalSubtotal - currentAmount;
  const discountPercentage = originalSubtotal > 0 ? (discountAmount / originalSubtotal) * 100 : 0;

  return {
    originalSubtotal,
    finalTotal: currentAmount,
    discountAmount,
    discountPercentage,
    steps
  };
}

/**
 * F-04: Komparator Harga Realtime vs Riwayat Toko & Tanggal Sebelumnya
 * • Panah Merah Naik (↑): Jika harga naik dibanding riwayat bulan lalu di toko tersebut (+Rp selisih)
 * • Panah Hijau Turun (↓): Jika harga turun dibanding riwayat bulan lalu di toko tersebut (-Rp hemat)
 * • Tanda Setara (=): Jika harga stabil/tetap
 */
function comparePriceWithPrevious(itemName, currentUnitPrice, targetStore) {
  if (!itemName || !currentUnitPrice) return null;
  const normalizedKey = itemName.trim().toLowerCase();
  const currentStore = (targetStore || state.currentSession.storeName || '').trim();

  let foundRecord = null;
  let isStoreExactMatch = false;

  // 1. Prioritas 1: Cari dari riwayat sesi belanja (state.history) pada toko yang sama
  if (state.history && state.history.length > 0) {
    for (const trip of state.history) {
      const storeMatches = trip.storeName && currentStore && 
        (trip.storeName.toLowerCase().includes(currentStore.toLowerCase()) || 
         currentStore.toLowerCase().includes(trip.storeName.toLowerCase()));

      if (trip.items && Array.isArray(trip.items)) {
        const matchingItem = trip.items.find(i => {
          const itemKey = i.name.trim().toLowerCase();
          return itemKey === normalizedKey || itemKey.includes(normalizedKey) || normalizedKey.includes(itemKey);
        });

        if (matchingItem && matchingItem.unitPrice) {
          if (storeMatches) {
            foundRecord = {
              price: matchingItem.unitPrice,
              storeName: trip.storeName,
              date: trip.date,
              name: matchingItem.name
            };
            isStoreExactMatch = true;
            break;
          } else if (!foundRecord) {
            foundRecord = {
              price: matchingItem.unitPrice,
              storeName: trip.storeName,
              date: trip.date,
              name: matchingItem.name
            };
          }
        }
      }
    }
  }

  // 2. Prioritas 2: Cari di priceDatabase
  if (!isStoreExactMatch && state.priceDatabase) {
    let dbRecord = state.priceDatabase[normalizedKey];
    if (!dbRecord) {
      const keys = Object.keys(state.priceDatabase);
      const matchedKey = keys.find(k => normalizedKey.includes(k) || k.includes(normalizedKey));
      if (matchedKey) dbRecord = state.priceDatabase[matchedKey];
    }

    if (dbRecord && dbRecord.price) {
      const dbStoreMatches = dbRecord.storeName && currentStore && 
        (dbRecord.storeName.toLowerCase().includes(currentStore.toLowerCase()) || 
         currentStore.toLowerCase().includes(dbRecord.storeName.toLowerCase()));

      if (dbStoreMatches || !foundRecord) {
        foundRecord = {
          price: dbRecord.price,
          storeName: dbRecord.storeName || currentStore || 'Supermarket',
          date: dbRecord.date || 'Bulan lalu',
          name: dbRecord.name || itemName
        };
        if (dbStoreMatches) isStoreExactMatch = true;
      }
    }
  }

  if (!foundRecord || !foundRecord.price) {
    return { status: 'new', diff: 0, percent: 0, prevPrice: null, storeName: currentStore };
  }

  const prevPrice = foundRecord.price;
  const diff = currentUnitPrice - prevPrice;
  const percent = prevPrice > 0 ? ((diff / prevPrice) * 100) : 0;
  const storeContext = foundRecord.storeName ? foundRecord.storeName : (currentStore || 'Toko Sebelumnya');
  const dateContext = foundRecord.date ? formatDate(foundRecord.date) : 'Bulan lalu';

  if (diff > 0) {
    return {
      status: 'up',
      diff,
      percent: Math.abs(percent).toFixed(1),
      prevPrice,
      prevStore: storeContext,
      prevDate: dateContext,
      isExactStore: isStoreExactMatch,
      label: `↑ Naik +${formatRupiah(diff)} (+${Math.abs(percent).toFixed(1)}%)`,
      icon: 'arrow-up',
      badgeClass: 'price-up'
    };
  } else if (diff < 0) {
    return {
      status: 'down',
      diff: Math.abs(diff),
      percent: Math.abs(percent).toFixed(1),
      prevPrice,
      prevStore: storeContext,
      prevDate: dateContext,
      isExactStore: isStoreExactMatch,
      label: `↓ Turun -${formatRupiah(Math.abs(diff))} (-${Math.abs(percent).toFixed(1)}%)`,
      icon: 'arrow-down',
      badgeClass: 'price-down'
    };
  } else {
    return {
      status: 'equal',
      diff: 0,
      percent: '0.0',
      prevPrice,
      prevStore: storeContext,
      prevDate: dateContext,
      isExactStore: isStoreExactMatch,
      label: `= Stabil (${formatRupiah(prevPrice)})`,
      icon: 'minus',
      badgeClass: 'price-equal'
    };
  }
}

/* ==========================================================================
   RENDERERS & UI UPDATES
   ========================================================================== */
function renderApp() {
  renderBudgetHeaderCard();
  renderCategoryPills();
  
  if (state.activeTab === 'belanja') {
    renderCartView();
  } else if (state.activeTab === 'anggaran') {
    renderBudgetView();
  } else if (state.activeTab === 'riwayat') {
    renderHistoryView();
  }

  updateNavBadge();
  initLucideIcons();
}

/**
 * F-05: Pengendali Anggaran (Safety Cap Sticky Header)
 * Indikator warna visual:
 * • Kuning waspada (≥90%)
 * • Banner merah tegas (>100%) jika total melampaui limit dompet
 */
function renderBudgetHeaderCard() {
  const safetyCard = document.getElementById('budgetSafetyCard');
  if (!safetyCard) return;

  // Calculate totals
  let totalOriginal = 0;
  let totalSpent = 0;
  let totalSaved = 0;

  state.cart.forEach(item => {
    const calc = calculateTieredDiscount(item.unitPrice, item.qty, item.discountInput);
    totalOriginal += calc.originalSubtotal;
    totalSpent += calc.finalTotal;
    totalSaved += calc.discountAmount;
  });

  const budget = state.budgetCap;
  const remaining = budget - totalSpent;
  const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;

  // F-05 Visual status & Colors
  let statusClass = 'status-safe';
  let pillClass = 'pill-safe';
  let pillText = 'Aman Terkendali';
  let progressFillClass = '';

  if (percentUsed > 100) {
    statusClass = 'status-danger';
    pillClass = 'pill-danger';
    pillText = '🚨 OVERBUDGET (>100%)';
    progressFillClass = 'fill-danger';
  } else if (percentUsed >= 90) {
    statusClass = 'status-warning';
    pillClass = 'pill-warning';
    pillText = '⚡ WASPADA (≥90%) MENDEKATI LIMIT';
    progressFillClass = 'fill-warning';
  } else if (percentUsed >= 70) {
    pillText = '👍 Terkendali';
  }

  safetyCard.className = `budget-safety-card ${statusClass}`;
  
  safetyCard.innerHTML = `
    <div class="budget-card-header">
      <div class="budget-status-pill ${pillClass}">
        <i data-lucide="${percentUsed > 100 ? 'alert-triangle' : percentUsed >= 90 ? 'shield-alert' : 'shield-check'}" style="width:14px; height:14px;"></i>
        <span>${pillText}</span>
      </div>
      <button class="budget-edit-trigger" id="btnQuickEditBudget">
        <i data-lucide="sliders-horizontal" style="width:13px; height:13px;"></i>
        <span>Limit: ${formatRupiah(budget)}</span>
      </button>
    </div>

    <div class="budget-numbers-grid">
      <div class="budget-number-block">
        <span class="label">Total Keranjang Saat Ini</span>
        <span class="amount">${formatRupiah(totalSpent)}</span>
      </div>
      <div class="budget-number-block ${remaining < 0 ? 'is-over' : ''}">
        <span class="label">${remaining >= 0 ? 'Sisa Anggaran Dingin' : 'Kelebihan Anggaran'}</span>
        <span class="amount remaining-amount">${remaining < 0 ? '-' : ''}${formatRupiah(Math.abs(remaining))}</span>
      </div>
    </div>

    <div class="budget-progress-container">
      <div class="budget-progress-fill ${progressFillClass}" style="width: ${Math.min(100, percentUsed)}%;"></div>
    </div>

    <div class="budget-progress-footer">
      <span>Terpakai <strong class="percent-used">${percentUsed.toFixed(1)}%</strong> dari total limit</span>
      ${totalSaved > 0 ? `<span style="color:#fbbf24; font-weight:700;">Hemat: ${formatRupiah(totalSaved)}</span>` : `<span>${state.cart.length} item di troli</span>`}
    </div>

    ${percentUsed > 100 ? `
      <div class="overbudget-alert-banner">
        <i data-lucide="alert-octagon" style="width:18px; height:18px; flex-shrink:0;"></i>
        <span><strong>PERHATIAN OVERBUDGET (>100%)!</strong> Total belanja telah melampaui limit dompet sebesar ${formatRupiah(Math.abs(remaining))}. Evaluasi kembali barang belanjaan Anda!</span>
      </div>
    ` : ''}
  `;

  // Attach quick edit click
  document.getElementById('btnQuickEditBudget')?.addEventListener('click', () => {
    switchTab('anggaran');
  });

  // Haptic feedback trigger on mobile if danger
  if (percentUsed > 100 && 'vibrate' in navigator) {
    try { navigator.vibrate([100, 50, 100]); } catch(e) {}
  }
}

/**
 * Render Category filter pills
 */
function renderCategoryPills() {
  const container = document.getElementById('categoryScrollPills');
  if (!container) return;

  const categories = [{ id: 'all', name: 'Semua Kategori', icon: 'layers' }, ...DEFAULT_CATEGORIES];
  
  container.innerHTML = categories.map(cat => `
    <button class="cat-pill ${state.selectedCategoryFilter === cat.id ? 'active' : ''}" data-cat="${cat.id}">
      <i data-lucide="${cat.icon || 'tag'}" style="width:14px; height:14px;"></i>
      <span>${cat.name}</span>
    </button>
  `).join('');

  container.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedCategoryFilter = btn.getAttribute('data-cat');
      renderApp();
    });
  });
}

/**
 * F-01 & F-02: Shopping Cart (Belanja) View
 */
function renderCartView() {
  const listContainer = document.getElementById('groceryListContainer');
  if (!listContainer) return;

  // Filter items
  let filteredItems = state.cart;
  if (state.selectedCategoryFilter !== 'all') {
    filteredItems = filteredItems.filter(i => i.category === state.selectedCategoryFilter);
  }
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(i => i.name.toLowerCase().includes(q) || (i.note && i.note.toLowerCase().includes(q)));
  }

  if (filteredItems.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon-wrap">
          <i data-lucide="shopping-cart" style="width:32px; height:32px;"></i>
        </div>
        <h3>Troli Belanja Kosong</h3>
        <p>Belum ada barang di daftar belanja. Masukkan barang yang akan dibeli di supermarket atau pilih template siap pakai.</p>
        <button class="quick-template-btn" id="btnLoadStarterTemplate">
          <i data-lucide="sparkles" style="width:16px; height:16px;"></i>
          <span>Isi Paket Hemat Anak Kos</span>
        </button>
      </div>
    `;

    document.getElementById('btnLoadStarterTemplate')?.addEventListener('click', () => {
      loadTemplate(GROCERY_TEMPLATES[0]);
    });
    return;
  }

  listContainer.innerHTML = filteredItems.map(item => {
    const calc = calculateTieredDiscount(item.unitPrice, item.qty, item.discountInput);
    const comp = comparePriceWithPrevious(item.name, item.unitPrice, state.currentSession.storeName);
    const catObj = DEFAULT_CATEGORIES.find(c => c.id === item.category) || { name: item.category || 'Lainnya', color: '#64748b' };

    let compBadgeHtml = '';
    if (comp && comp.status !== 'new') {
      const compClass = comp.badgeClass || (comp.status === 'up' ? 'price-up' : comp.status === 'down' ? 'price-down' : 'price-equal');
      const tooltip = `Riwayat di ${comp.prevStore || 'Supermarket'} (${comp.prevDate || 'Sebelumnya'}): ${formatRupiah(comp.prevPrice)}`;
      compBadgeHtml = `
        <span class="price-comparator-badge ${compClass}" title="${escapeHtml(tooltip)}">
          <i data-lucide="${comp.icon}" style="width:11px; height:11px;"></i>
          <span>${comp.label}</span>
        </span>
      `;
    }

    const hasDiscount = calc.discountAmount > 0;

    return `
      <div class="grocery-card ${item.isChecked ? 'is-checked' : ''}" data-id="${item.id}">
        <div class="grocery-card-top">
          <div class="item-check-and-title">
            <button class="custom-checkbox ${item.isChecked ? 'checked' : ''}" onclick="toggleCheckItem('${item.id}')" aria-label="Tandai sudah masuk troli">
              <i data-lucide="check" style="width:15px; height:15px; stroke-width:3.5;"></i>
            </button>
            <div class="item-meta">
              <span class="item-title">${escapeHtml(item.name)}</span>
              <div class="item-badge-row">
                <span class="category-tag" style="border-left: 2px solid ${catObj.color};">${catObj.name}</span>
                ${compBadgeHtml}
              </div>
            </div>
          </div>
          <button class="card-actions-btn" onclick="openItemOptionsModal('${item.id}')" aria-label="Opsi">
            <i data-lucide="more-vertical" style="width:18px; height:18px;"></i>
          </button>
        </div>

        <div class="grocery-card-mid">
          <div class="unit-price-calc">
            <span>Harga Satuan: <strong>${formatRupiah(item.unitPrice)}</strong> / ${item.unit || 'pcs'}</span>
          </div>
          <button class="discount-pill-btn" onclick="openDiscountModal('${item.id}')">
            <i data-lucide="percent" style="width:12px; height:12px;"></i>
            <span>${item.discountInput && item.discountInput !== '0' ? `Diskon: ${item.discountInput}` : '+ Diskon'}</span>
          </button>
        </div>

        <div class="grocery-card-bottom">
          <div class="qty-stepper">
            <button class="stepper-btn" onclick="updateItemQty('${item.id}', -1)" aria-label="Kurangi kuantitas">−</button>
            <input type="number" class="stepper-qty-input" value="${item.qty}" min="0.1" step="any" oninput="setItemQtyDirect('${item.id}', this.value)" aria-label="Kuantitas">
            <span class="stepper-unit">${item.unit || 'pcs'}</span>
            <button class="stepper-btn" onclick="updateItemQty('${item.id}', 1)" aria-label="Tambah kuantitas">+</button>
          </div>

          <div class="card-item-total">
            ${hasDiscount ? `<div class="orig-price-strike">${formatRupiah(calc.originalSubtotal)}</div>` : ''}
            <div class="final-price">${formatRupiah(calc.finalTotal)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * TAB 2: Anggaran & Analytics View
 */
function renderBudgetView() {
  const container = document.getElementById('budgetViewContent');
  if (!container) return;

  // Breakdown by category
  const categoryTotals = {};
  let totalSpent = 0;

  DEFAULT_CATEGORIES.forEach(c => { categoryTotals[c.id] = 0; });

  state.cart.forEach(item => {
    const calc = calculateTieredDiscount(item.unitPrice, item.qty, item.discountInput);
    const cat = item.category || 'lainnya';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + calc.finalTotal;
    totalSpent += calc.finalTotal;
  });

  const budget = state.budgetCap;
  const remaining = budget - totalSpent;
  const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;

  container.innerHTML = `
    <div class="budget-page-container">
      <div class="analytics-hero-card">
        <div class="hero-title-row">
          <h2>🛡️ Pengendali Anggaran</h2>
          <span style="font-size:0.75rem; color:var(--text-secondary);">Standar Belanja Bulanan</span>
        </div>

        <div class="budget-input-group">
          <label>Batas Maksimal Dompet (Safety Cap Target):</label>
          <div class="budget-input-row">
            <span class="currency-prefix">Rp</span>
            <input type="number" id="inputBudgetValue" class="budget-large-input" value="${budget}" step="10000" min="0">
            <button class="budget-save-btn" id="btnSaveBudgetSetting">Simpan</button>
          </div>
        </div>

        <div class="budget-numbers-grid" style="margin-top:16px;">
          <div class="budget-number-block">
            <span class="label">Alokasi Terpakai</span>
            <span class="amount">${formatRupiah(totalSpent)}</span>
          </div>
          <div class="budget-number-block ${remaining < 0 ? 'is-over' : ''}">
            <span class="label">${remaining >= 0 ? 'Dana Sisa Aman' : 'Kelebihan Anggaran'}</span>
            <span class="amount remaining-amount">${remaining < 0 ? '-' : ''}${formatRupiah(Math.abs(remaining))}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 10px; display:flex; align-items:center; gap:6px;">
          <i data-lucide="pie-chart" style="width:16px; height:16px; color:var(--primary);"></i>
          <span>Distribusi Pengeluaran Per Kategori</span>
        </h3>
        
        <div class="category-breakdown-list">
          ${DEFAULT_CATEGORIES.map(cat => {
            const spent = categoryTotals[cat.id] || 0;
            const pct = totalSpent > 0 ? ((spent / totalSpent) * 100) : 0;
            if (spent === 0) return '';
            return `
              <div class="cat-breakdown-item">
                <div class="cat-breakdown-header">
                  <div class="cat-name-with-dot">
                    <span class="cat-color-dot" style="background:${cat.color}"></span>
                    <span>${cat.name}</span>
                  </div>
                  <div class="cat-spent-amount">${formatRupiah(spent)} <span style="font-size:0.7rem; color:var(--text-muted); font-weight:normal;">(${pct.toFixed(0)}%)</span></div>
                </div>
                <div class="cat-progress-mini">
                  <div class="cat-progress-mini-fill" style="width:${pct}%; background:${cat.color};"></div>
                </div>
              </div>
            `;
          }).join('') || '<div style="color:var(--text-muted); font-size:0.85rem; padding:12px; text-align:center;">Belum ada data belanja di keranjang.</div>'}
        </div>
      </div>

      <div style="background:var(--bg-surface); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
        <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <i data-lucide="lightbulb" style="width:16px; height:16px; color:#f59e0b;"></i>
          <span>Tips Belanja Cerdas Anak Rantau</span>
        </h4>
        <ul style="padding-left:18px; font-size:0.8rem; color:var(--text-secondary); line-height:1.6;">
          <li>Prioritaskan kebutuhan pokok (Sembako & Protein) di awal sebelum camilan.</li>
          <li>Perhatikan indikator 🔴 panah naik untuk mempertimbangkan merk alternatif.</li>
          <li>Manfaatkan kalkulator diskon bertingkat (50%+20%) untuk memastikan keaslian promo supermarket.</li>
        </ul>
      </div>
    </div>
  `;

  document.getElementById('btnSaveBudgetSetting')?.addEventListener('click', () => {
    const val = parseFloat(document.getElementById('inputBudgetValue').value);
    if (!isNaN(val) && val >= 0) {
      state.budgetCap = val;
      saveBudgetToStorage();
      showToast('Batas anggaran berhasil diperbarui!', 'success');
      renderApp();
    }
  });
}

/**
 * F-06: Riwayat & Database Belanja (History View)
 */
function renderHistoryView() {
  const container = document.getElementById('historyViewContent');
  if (!container) return;

  if (state.history.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card" style="margin: 20px 16px;">
        <div class="empty-icon-wrap">
          <i data-lucide="archive" style="width:32px; height:32px;"></i>
        </div>
        <h3>Belum Ada Riwayat</h3>
        <p>Setelah selesai berbelanja di supermarket, klik tombol 'Selesaikan & Simpan Belanjaan' di tab Belanja untuk mengarsipkan data.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="history-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:1.1rem; font-weight:800;">Riwayat Belanja Bulanan</h2>
          <span style="font-size:0.75rem; color:var(--text-secondary);">Database belanja tersimpan untuk komparasi harga</span>
        </div>
        <button class="quick-template-btn" style="padding:6px 12px; margin:0;" onclick="exportHistoryData()">
          <i data-lucide="download" style="width:14px; height:14px;"></i>
          <span>Ekspor</span>
        </button>
      </div>

      ${state.history.map(trip => `
        <div class="history-card" onclick="openHistoryDetailModal('${trip.id}')">
          <div class="history-card-header">
            <div>
              <span class="history-date-badge">${formatDate(trip.date)}</span>
              <h4 class="history-title">${escapeHtml(trip.title)}</h4>
              <span class="history-store">📍 ${escapeHtml(trip.storeName || 'Supermarket')} • ${trip.itemCount || (trip.items ? trip.items.length : 0)} Item</span>
            </div>
            ${trip.totalDiscount > 0 ? `
              <span class="history-savings-pill">Hemat ${formatRupiah(trip.totalDiscount)}</span>
            ` : ''}
          </div>

          <div class="history-card-footer">
            <div class="history-total-block">
              <span class="label">Total Pengeluaran</span>
              <span class="val">${formatRupiah(trip.totalFinal)}</span>
            </div>
            <span style="font-size:0.75rem; color:var(--primary-light); font-weight:700; display:flex; align-items:center; gap:4px;">
              Lihat Detail <i data-lucide="chevron-right" style="width:14px; height:14px;"></i>
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function updateNavBadge() {
  const badge = document.getElementById('cartNavBadge');
  if (badge) {
    const unCheckedCount = state.cart.filter(i => !i.isChecked).length;
    badge.textContent = state.cart.length;
    badge.style.display = state.cart.length > 0 ? 'flex' : 'none';
  }
}

/* ==========================================================================
   CART ACTIONS & CRUD (F-01, F-02)
   ========================================================================== */
function toggleCheckItem(id) {
  const item = state.cart.find(i => i.id === id);
  if (item) {
    item.isChecked = !item.isChecked;
    saveCartToStorage();
    renderApp();
    if ('vibrate' in navigator) {
      try { navigator.vibrate(30); } catch(e) {}
    }
  }
}

function updateItemQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (item) {
    const newQty = Math.round((item.qty + delta) * 100) / 100;
    if (newQty <= 0) {
      state.cart = state.cart.filter(i => i.id !== id);
      saveCartToStorage();
      showToast(`Item "${item.name}" dihapus dari troli`, 'warning');
      renderApp();
    } else {
      item.qty = newQty;
      saveCartToStorage();
      renderApp();
    }
  }
}

/**
 * F-02: Perhitungan Kuantitas Otomatis secara Realtime
 * Perubahan angka kuantitas (Qty) langsung mengalikan harga satuan detik itu juga ke total baris item tanpa reload.
 */
function setItemQtyDirect(id, val) {
  const parsed = parseFloat(val);
  if (isNaN(parsed) || parsed <= 0) return;
  const item = state.cart.find(i => i.id === id);
  if (item) {
    item.qty = Math.round(parsed * 100) / 100;
    saveCartToStorage();
    renderBudgetHeaderCard();
    const card = document.querySelector(`.grocery-card[data-id="${id}"]`);
    if (card) {
      const calc = calculateTieredDiscount(item.unitPrice, item.qty, item.discountInput);
      const totalEl = card.querySelector('.card-item-total');
      if (totalEl) {
        const hasDiscount = calc.discountAmount > 0;
        totalEl.innerHTML = `
          ${hasDiscount ? `<div class="orig-price-strike">${formatRupiah(calc.originalSubtotal)}</div>` : ''}
          <div class="final-price">${formatRupiah(calc.finalTotal)}</div>
        `;
      }
    }
  }
}

function openAddItemModal() {
  state.editingItemId = null;
  document.getElementById('itemModalTitle').textContent = 'Tambah Item Belanja';
  document.getElementById('inputItemName').value = '';
  document.getElementById('selectItemCategory').value = 'sembako';
  document.getElementById('selectItemUnit').value = 'pcs';
  document.getElementById('inputItemQty').value = '1';
  document.getElementById('inputItemUnitPrice').value = '';
  document.getElementById('inputItemDiscount').value = '';
  document.getElementById('inputItemNote').value = '';
  
  updateLiveComparatorBox('', 0);
  updateModalItemTotalPreview();
  openModal('itemFormModal');
  setTimeout(() => document.getElementById('inputItemName').focus(), 150);
}

function openEditItemModal(id) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;

  state.editingItemId = id;
  document.getElementById('itemModalTitle').textContent = 'Edit Item Belanja';
  document.getElementById('inputItemName').value = item.name;
  document.getElementById('selectItemCategory').value = item.category || 'sembako';
  document.getElementById('selectItemUnit').value = item.unit || 'pcs';
  document.getElementById('inputItemQty').value = item.qty;
  document.getElementById('inputItemUnitPrice').value = item.unitPrice;
  document.getElementById('inputItemDiscount').value = item.discountInput || '';
  document.getElementById('inputItemNote').value = item.note || '';

  updateLiveComparatorBox(item.name, item.unitPrice);
  updateModalItemTotalPreview();
  openModal('itemFormModal');
}

function saveItemFromForm() {
  const name = document.getElementById('inputItemName').value.trim();
  const category = document.getElementById('selectItemCategory').value;
  const unit = document.getElementById('selectItemUnit').value;
  const qty = parseFloat(document.getElementById('inputItemQty').value) || 1;
  const unitPrice = parseFloat(document.getElementById('inputItemUnitPrice').value) || 0;
  const discountInput = document.getElementById('inputItemDiscount').value.trim();
  const note = document.getElementById('inputItemNote').value.trim();

  if (!name) {
    showToast('Nama barang wajib diisi!', 'danger');
    return;
  }
  if (unitPrice <= 0) {
    showToast('Harga satuan harus lebih dari 0!', 'danger');
    return;
  }

  if (state.editingItemId) {
    // Update existing
    const item = state.cart.find(i => i.id === state.editingItemId);
    if (item) {
      item.name = name;
      item.category = category;
      item.unit = unit;
      item.qty = qty;
      item.unitPrice = unitPrice;
      item.discountInput = discountInput;
      item.note = note;
      showToast('Item berhasil diperbarui', 'success');
    }
  } else {
    // Add new item
    const newItem = {
      id: 'cart-' + Date.now(),
      name,
      category,
      unit,
      qty,
      unitPrice,
      discountInput,
      note,
      isChecked: false
    };
    state.cart.push(newItem);
    showToast(`"${name}" masuk troli`, 'success');
  }

  saveCartToStorage();
  closeModal('itemFormModal');
  renderApp();
}

/**
 * F-04: Live comparator box in Add/Edit modal (Realtime vs Riwayat Toko & Tanggal Sebelumnya)
 */
function updateLiveComparatorBox(name, price) {
  const box = document.getElementById('modalLiveComparatorBox');
  if (!box) return;

  if (!name || !price) {
    box.style.display = 'none';
    return;
  }

  const comp = comparePriceWithPrevious(name, price, state.currentSession.storeName);
  if (!comp || comp.status === 'new') {
    box.style.display = 'flex';
    box.innerHTML = `
      <div class="live-comp-icon" style="background:rgba(59, 130, 246, 0.15); color:#60a5fa;">
        <i data-lucide="sparkles" style="width:18px; height:18px;"></i>
      </div>
      <div class="live-comp-info" style="min-width:0; flex:1;">
        <div class="live-comp-title" style="font-size:0.75rem; color:var(--text-secondary);">Item Baru / Belum Ada Riwayat</div>
        <div class="live-comp-status" style="color:#93c5fd; font-size:0.82rem; font-weight:600;">Akan dicatat sebagai harga perdana di ${escapeHtml(state.currentSession.storeName || 'Toko Aktif')}</div>
      </div>
    `;
    initLucideIcons();
    return;
  }

  box.style.display = 'flex';
  const isUp = comp.status === 'up';
  const isDown = comp.status === 'down';
  const color = isUp ? '#f87171' : isDown ? '#34d399' : '#cbd5e1';
  const bg = isUp ? 'rgba(239,68,68,0.18)' : isDown ? 'rgba(16,185,129,0.18)' : 'rgba(148,163,184,0.18)';
  const storeContext = comp.prevStore ? `di ${comp.prevStore} (${comp.prevDate || 'Bulan lalu'})` : 'bulan lalu';

  box.innerHTML = `
    <div class="live-comp-icon" style="background:${bg}; color:${color};">
      <i data-lucide="${comp.icon}" style="width:18px; height:18px;"></i>
    </div>
    <div class="live-comp-info" style="min-width:0; flex:1;">
      <div class="live-comp-title" style="font-size:0.72rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
        Riwayat ${escapeHtml(storeContext)}: <strong>${formatRupiah(comp.prevPrice)}</strong>
      </div>
      <div class="live-comp-status" style="color:${color}; font-weight:700; font-size:0.85rem;">
        ${comp.label}
      </div>
    </div>
  `;
  initLucideIcons();
}

/**
 * F-02 & F-03: Live subtotal calculation inside Item Form Modal
 */
function updateModalItemTotalPreview() {
  const box = document.getElementById('modalItemLiveTotalBox');
  if (!box) return;

  const qty = parseFloat(document.getElementById('inputItemQty')?.value) || 0;
  const unitPrice = parseFloat(document.getElementById('inputItemUnitPrice')?.value) || 0;
  const discountStr = document.getElementById('inputItemDiscount')?.value || '';

  if (qty <= 0 || unitPrice <= 0) {
    box.style.display = 'none';
    return;
  }

  const calc = calculateTieredDiscount(unitPrice, qty, discountStr);
  box.style.display = 'flex';
  box.innerHTML = `
    <div>
      <div style="font-size:0.75rem; color:var(--text-secondary);">Subtotal (${qty} x ${formatRupiah(unitPrice)}):</div>
      ${calc.discountAmount > 0 ? `<div style="font-size:0.72rem; color:#fbbf24;">Diskon: -${formatRupiah(calc.discountAmount)} (${calc.discountPercentage.toFixed(0)}%)</div>` : ''}
    </div>
    <div class="total-val">${formatRupiah(calc.finalTotal)}</div>
  `;
}

/* ==========================================================================
   TIERED DISCOUNT MODAL (F-03)
   ========================================================================== */
function openDiscountModal(itemId) {
  const item = state.cart.find(i => i.id === itemId);
  if (!item) return;

  state.editingDiscountItemId = itemId;
  document.getElementById('discountModalItemTitle').textContent = `${item.name} (${item.qty} x ${formatRupiah(item.unitPrice)})`;
  document.getElementById('inputDiscountFormula').value = item.discountInput || '';
  
  renderDiscountLiveBreakdown(item.unitPrice, item.qty, item.discountInput || '');
  openModal('discountCalcModal');
}

function renderDiscountLiveBreakdown(unitPrice, qty, discountStr) {
  const container = document.getElementById('discountCalcBreakdown');
  if (!container) return;

  const res = calculateTieredDiscount(unitPrice, qty, discountStr);
  
  let stepsHtml = res.steps.map((s, idx) => {
    if (idx === 0) {
      return `<div class="math-step-row"><span>${s.label}:</span> <strong>${formatRupiah(s.amount)}</strong></div>`;
    }
    return `
      <div class="math-step-row">
        <span>${s.label} (-${formatRupiah(s.cutAmount)}):</span>
        <span>${formatRupiah(s.amountAfter)}</span>
      </div>
    `;
  }).join('');

  stepsHtml += `
    <div class="math-step-row highlight-final">
      <span>Total Akhir Bayar:</span>
      <span>${formatRupiah(res.finalTotal)}</span>
    </div>
    <div style="font-size:0.75rem; color:#fbbf24; margin-top:4px;">
      Total Hemat: ${formatRupiah(res.discountAmount)} (${res.discountPercentage.toFixed(1)}%)
    </div>
  `;

  container.innerHTML = stepsHtml;
}

function applyPresetDiscount(formula) {
  const input = document.getElementById('inputDiscountFormula');
  input.value = formula;
  const item = state.cart.find(i => i.id === state.editingDiscountItemId);
  if (item) {
    renderDiscountLiveBreakdown(item.unitPrice, item.qty, formula);
  }
}

function saveDiscountSetting() {
  const formula = document.getElementById('inputDiscountFormula').value.trim();
  const item = state.cart.find(i => i.id === state.editingDiscountItemId);
  if (item) {
    item.discountInput = formula;
    saveCartToStorage();
    showToast('Diskon berhasil diterapkan!', 'success');
    closeModal('discountCalcModal');
    renderApp();
  }
}

/* ==========================================================================
   CHECKOUT & FINISH TRIP (F-01, F-06)
   ========================================================================== */
function openCheckoutSummaryModal() {
  if (state.cart.length === 0) {
    showToast('Troli masih kosong!', 'warning');
    return;
  }

  let totalOriginal = 0;
  let totalSpent = 0;
  let totalSaved = 0;

  state.cart.forEach(item => {
    const calc = calculateTieredDiscount(item.unitPrice, item.qty, item.discountInput);
    totalOriginal += calc.originalSubtotal;
    totalSpent += calc.finalTotal;
    totalSaved += calc.discountAmount;
  });

  const remaining = state.budgetCap - totalSpent;
  const now = new Date();
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const storePrefix = (state.currentSession.storeName || 'Supermarket').split(' - ')[0];
  const defaultTripTitle = `Belanja di ${storePrefix} - ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const titleInput = document.getElementById('inputCheckoutTripTitle');
  const storeInput = document.getElementById('inputCheckoutStore');
  const dateInput = document.getElementById('inputCheckoutDate');

  if (titleInput) titleInput.value = defaultTripTitle;
  if (storeInput) storeInput.value = state.currentSession.storeName || 'Lotte Mart Grocery - Puri Indah';
  if (dateInput) dateInput.value = state.currentSession.date || new Date().toISOString().split('T')[0];
  
  document.getElementById('checkoutSummaryContent').innerHTML = `
    <div style="background:rgba(0,0,0,0.3); padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:8px;">
      <div class="math-step-row"><span>Jumlah Item:</span> <strong>${state.cart.length} item</strong></div>
      <div class="math-step-row"><span>Total Harga Asal:</span> <span>${formatRupiah(totalOriginal)}</span></div>
      <div class="math-step-row" style="color:#fbbf24;"><span>Total Potongan Diskon:</span> <strong>-${formatRupiah(totalSaved)}</strong></div>
      <div class="math-step-row highlight-final" style="font-size:1.1rem;"><span>Total Yang Harus Dibayar:</span> <span style="color:var(--primary-light);">${formatRupiah(totalSpent)}</span></div>
      <div class="math-step-row" style="margin-top:4px; font-size:0.75rem; color:${remaining >= 0 ? '#34d399' : '#f87171'};">
        <span>Status Anggaran:</span>
        <strong>${remaining >= 0 ? `Sisa Aman ${formatRupiah(remaining)}` : `Overbudget ${formatRupiah(Math.abs(remaining))}`}</strong>
      </div>
    </div>
  `;

  openModal('checkoutModal');
}

function finishAndSaveTrip() {
  const title = document.getElementById('inputCheckoutTripTitle')?.value.trim() || 'Belanja Bulanan Kos';
  const store = document.getElementById('inputCheckoutStore')?.value.trim() || state.currentSession.storeName || 'Lotte Mart Grocery - Puri Indah';
  const tripDate = document.getElementById('inputCheckoutDate')?.value || state.currentSession.date || new Date().toISOString().split('T')[0];

  let totalOriginal = 0;
  let totalSpent = 0;
  let totalSaved = 0;

  const tripItems = state.cart.map(item => {
    const calc = calculateTieredDiscount(item.unitPrice, item.qty, item.discountInput);
    totalOriginal += calc.originalSubtotal;
    totalSpent += calc.finalTotal;
    totalSaved += calc.discountAmount;

    // F-06: Automatically update database acuan harga multi-toko untuk sesi belanja berikutnya!
    const key = item.name.trim().toLowerCase();
    state.priceDatabase[key] = {
      name: item.name,
      category: item.category,
      unit: item.unit,
      price: item.unitPrice,
      storeName: store,
      date: tripDate,
      lastUpdated: new Date().toISOString()
    };

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      qty: item.qty,
      unitPrice: item.unitPrice,
      discountInput: item.discountInput,
      finalItemTotal: calc.finalTotal,
      note: item.note
    };
  });

  const newHistoryRecord = {
    id: 'trip-' + Date.now(),
    date: tripDate,
    title,
    storeName: store,
    budget: state.budgetCap,
    totalOriginal,
    totalDiscount: totalSaved,
    totalFinal: totalSpent,
    itemCount: tripItems.length,
    items: tripItems
  };

  state.history.unshift(newHistoryRecord);
  saveHistoryToStorage();
  savePricesToStorage();

  // Clear current cart
  state.cart = [];
  saveCartToStorage();

  closeModal('checkoutModal');
  showToast(`Sesi belanja "${title}" di ${store} tersimpan ke database riwayat!`, 'success');
  switchTab('riwayat');
}

/* ==========================================================================
   HISTORY DETAILS MODAL
   ========================================================================== */
function openHistoryDetailModal(tripId) {
  const trip = state.history.find(t => t.id === tripId);
  if (!trip) return;

  document.getElementById('historyDetailTitle').textContent = trip.title;
  
  document.getElementById('historyDetailBody').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.25); padding:12px; border-radius:var(--radius-sm);">
      <div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">Tanggal: ${formatDate(trip.date)}</div>
        <div style="font-size:0.85rem; font-weight:700;">📍 ${escapeHtml(trip.storeName || 'Supermarket')}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.7rem; color:var(--text-secondary);">Total Bayar</div>
        <div style="font-family:var(--font-mono); font-size:1.1rem; font-weight:800; color:var(--primary-light);">${formatRupiah(trip.totalFinal)}</div>
      </div>
    </div>

    <h4 style="font-size:0.9rem; font-weight:800; margin-top:8px;">Daftar Barang Belanja (${trip.items ? trip.items.length : 0} item):</h4>
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${(trip.items || []).map(item => `
        <div style="background:var(--bg-card); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:0.88rem;">${escapeHtml(item.name)}</div>
            <div style="font-size:0.72rem; color:var(--text-secondary);">${item.qty} ${item.unit || 'pcs'} x ${formatRupiah(item.unitPrice)} ${item.discountInput ? `<span style="color:#fbbf24;">(Diskon: ${item.discountInput})</span>` : ''}</div>
          </div>
          <div style="font-family:var(--font-mono); font-weight:700; color:var(--text-primary); font-size:0.95rem;">
            ${formatRupiah(item.finalItemTotal || (item.qty * item.unitPrice))}
          </div>
        </div>
      `).join('')}
    </div>

    <button class="quick-template-btn" style="width:100%; justify-content:center; margin-top:12px;" onclick="copyTripToCart('${trip.id}')">
      <i data-lucide="copy" style="width:16px; height:16px;"></i>
      <span>Jadikan Daftar Belanja Baru</span>
    </button>
  `;

  openModal('historyDetailModal');
  initLucideIcons();
}

function copyTripToCart(tripId) {
  const trip = state.history.find(t => t.id === tripId);
  if (!trip || !trip.items) return;

  const newItems = trip.items.map(item => ({
    id: 'cart-' + Math.random().toString(36).substr(2, 9),
    name: item.name,
    category: item.category,
    unit: item.unit,
    qty: item.qty,
    unitPrice: item.unitPrice,
    discountInput: item.discountInput || '',
    note: item.note || '',
    isChecked: false
  }));

  state.cart = [...state.cart, ...newItems];
  saveCartToStorage();
  closeModal('historyDetailModal');
  showToast(`${newItems.length} item riwayat ditambahkan ke troli!`, 'success');
  switchTab('belanja');
}

function loadTemplate(tpl) {
  const newItems = tpl.items.map(item => ({
    id: 'cart-' + Math.random().toString(36).substr(2, 9),
    name: item.name,
    category: item.category,
    unit: item.unit,
    qty: item.qty,
    unitPrice: item.unitPrice,
    discountInput: item.discountInput || '',
    note: 'Dari template ' + tpl.name,
    isChecked: false
  }));

  state.cart = [...state.cart, ...newItems];
  saveCartToStorage();
  showToast(`Template "${tpl.name}" berhasil dimasukkan!`, 'success');
  renderApp();
}

/* ==========================================================================
   AUTOCOMPLETE & SEARCH
   ========================================================================== */
function setupAutocomplete() {
  const input = document.getElementById('inputItemName');
  const suggestionsBox = document.getElementById('autocompleteSuggestions');
  if (!input || !suggestionsBox) return;

  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    const unitPriceInput = document.getElementById('inputItemUnitPrice');
    const currentPrice = parseFloat(unitPriceInput.value) || 0;
    
    updateLiveComparatorBox(input.value, currentPrice);

    if (val.length < 2) {
      suggestionsBox.classList.remove('active');
      return;
    }

    const matches = Object.keys(state.priceDatabase)
      .filter(k => k.includes(val))
      .slice(0, 5);

    if (matches.length === 0) {
      suggestionsBox.classList.remove('active');
      return;
    }

    suggestionsBox.innerHTML = matches.map(k => {
      const rec = state.priceDatabase[k];
      return `
        <div class="autocomplete-item" data-key="${k}">
          <span>${rec.name || k}</span>
          <span style="color:var(--primary-light); font-family:var(--font-mono); font-weight:700;">${formatRupiah(rec.price)}</span>
        </div>
      `;
    }).join('');

    suggestionsBox.classList.add('active');

    suggestionsBox.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.getAttribute('data-key');
        const rec = state.priceDatabase[key];
        if (rec) {
          input.value = rec.name || key;
          document.getElementById('inputItemUnitPrice').value = rec.price;
          if (rec.category) document.getElementById('selectItemCategory').value = rec.category;
          if (rec.unit) document.getElementById('selectItemUnit').value = rec.unit;
          updateLiveComparatorBox(rec.name || key, rec.price);
          updateModalItemTotalPreview();
        }
        suggestionsBox.classList.remove('active');
      });
    });
  });

  document.getElementById('inputItemUnitPrice')?.addEventListener('input', (e) => {
    const price = parseFloat(e.target.value) || 0;
    updateLiveComparatorBox(input.value, price);
    updateModalItemTotalPreview();
  });

  document.getElementById('inputItemQty')?.addEventListener('input', () => {
    const unitPriceInput = document.getElementById('inputItemUnitPrice');
    const price = parseFloat(unitPriceInput?.value) || 0;
    updateLiveComparatorBox(input.value, price);
    updateModalItemTotalPreview();
  });

  document.getElementById('inputItemDiscount')?.addEventListener('input', () => {
    updateModalItemTotalPreview();
  });
}

/* ==========================================================================
   NAVIGATION & EVENT LISTENERS
   ========================================================================== */
function setupEventListeners() {
  // F-01: Session Store Input (Lokasi Toko)
  const sessionStoreEl = document.getElementById('sessionStoreInput');
  if (sessionStoreEl) {
    const handleStoreChange = (e) => {
      const val = e.target.value.trim();
      state.currentSession.storeName = val || 'Lotte Mart Grocery - Puri Indah';
      saveSessionToStorage();
      renderCartView();
      initLucideIcons();
    };
    sessionStoreEl.addEventListener('input', handleStoreChange);
    sessionStoreEl.addEventListener('change', handleStoreChange);
  }

  // F-01: Session Date Picker (Selector Tanggal)
  const sessionDateEl = document.getElementById('sessionDateInput');
  if (sessionDateEl) {
    sessionDateEl.addEventListener('change', (e) => {
      state.currentSession.date = e.target.value;
      saveSessionToStorage();
      updateSessionBadgeDate(e.target.value);
      renderCartView();
      initLucideIcons();
    });
  }

  // Bottom Tabs Click
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Global Search input
  document.getElementById('globalSearchInput')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderCartView();
    initLucideIcons();
  });

  // FAB Add Item
  document.getElementById('fabAddItem')?.addEventListener('click', openAddItemModal);
  document.getElementById('fabCheckout')?.addEventListener('click', openCheckoutSummaryModal);

  // Form Submission
  document.getElementById('btnSaveItem')?.addEventListener('click', saveItemFromForm);
  document.getElementById('btnSaveDiscount')?.addEventListener('click', saveDiscountSetting);
  document.getElementById('btnConfirmCheckout')?.addEventListener('click', finishAndSaveTrip);

  // Discount formula input dynamic update
  document.getElementById('inputDiscountFormula')?.addEventListener('input', (e) => {
    const item = state.cart.find(i => i.id === state.editingDiscountItemId);
    if (item) {
      renderDiscountLiveBreakdown(item.unitPrice, item.qty, e.target.value);
    }
  });

  // Close modals on backdrop click or close button
  document.querySelectorAll('.sheet-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // Item Options Action Sheet buttons
  document.getElementById('btnActionEditItem')?.addEventListener('click', () => {
    const id = state.optionsItemId;
    closeModal('itemOptionsModal');
    if (id) openEditItemModal(id);
  });

  document.getElementById('btnActionDiscountItem')?.addEventListener('click', () => {
    const id = state.optionsItemId;
    closeModal('itemOptionsModal');
    if (id) openDiscountModal(id);
  });

  document.getElementById('btnActionDeleteItem')?.addEventListener('click', () => {
    const id = state.optionsItemId;
    if (id) {
      const item = state.cart.find(i => i.id === id);
      state.cart = state.cart.filter(i => i.id !== id);
      saveCartToStorage();
      closeModal('itemOptionsModal');
      showToast(`Item "${item ? item.name : 'Barang'}" dihapus dari troli`, 'warning');
      renderApp();
    }
  });

  setupAutocomplete();
  setupSwipeNavigation();
}

/**
 * Mobile Swipe Gesture Navigation between Tabs
 */
function setupSwipeNavigation() {
  const viewport = document.getElementById('appViewport');
  if (!viewport) return;

  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  viewport.addEventListener('touchstart', (e) => {
    if (e.target.closest('.modal-overlay') || e.target.closest('#categoryScrollPills') || e.target.closest('.qty-stepper') || e.target.closest('input') || e.target.closest('select')) {
      isSwiping = false;
      return;
    }
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isSwiping = true;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    isSwiping = false;

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;

    // Minimum swipe threshold: 50px horizontally, horizontal must dominate vertical by 1.4x
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
      const tabs = ['belanja', 'anggaran', 'riwayat'];
      const currentIdx = tabs.indexOf(state.activeTab);

      if (diffX < 0 && currentIdx < tabs.length - 1) {
        // Swipe left -> Next tab
        switchTab(tabs[currentIdx + 1]);
        if ('vibrate' in navigator) try { navigator.vibrate(20); } catch(e) {}
      } else if (diffX > 0 && currentIdx > 0) {
        // Swipe right -> Previous tab
        switchTab(tabs[currentIdx - 1]);
        if ('vibrate' in navigator) try { navigator.vibrate(20); } catch(e) {}
      }
    }
  }, { passive: true });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.remove('active');
  });

  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) {
    activeView.classList.add('active');
  }

  // Show/hide floating action bar in Belanja tab
  const fabBar = document.getElementById('floatingActionBar');
  if (fabBar) {
    fabBar.style.display = tabId === 'belanja' ? 'flex' : 'none';
  }

  renderApp();
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function openItemOptionsModal(id) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;

  state.optionsItemId = id;
  const titleEl = document.getElementById('itemOptionsTitle');
  const subEl = document.getElementById('itemOptionsSub');
  
  if (titleEl) titleEl.textContent = item.name;
  if (subEl) subEl.textContent = `${formatRupiah(item.unitPrice)} / ${item.unit || 'pcs'} • Qty: ${item.qty}`;

  openModal('itemOptionsModal');
  initLucideIcons();
}

/* ==========================================================================
   HELPERS & TOAST
   ========================================================================== */
function formatRupiah(amount) {
  return 'Rp ' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'warning') iconName = 'alert-triangle';
  if (type === 'danger') iconName = 'alert-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width:18px; height:18px; flex-shrink:0;"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  initLucideIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function exportHistoryData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
    history: state.history,
    prices: state.priceDatabase,
    budget: state.budgetCap
  }, null, 2));
  
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `smart_grocery_backup_${new Date().toISOString().split('T')[0]}.json`);
  dlAnchorElem.click();
  showToast('Data berhasil diekspor!', 'success');
}
