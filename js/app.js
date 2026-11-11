/**
 * Smart Grocery & Budget Safety Tracker
 * Main Application Logic
 */

// Application State
const state = {
  activeTab: 'belanja', // 'belanja', 'anggaran', 'riwayat'
  budgetCap: 500000,    // Default 500k IDR for anak rantau
  cart: [],
  history: [],
  priceDatabase: {},
  selectedCategoryFilter: 'all',
  searchQuery: '',
  editingItemId: null,
  editingDiscountItemId: null
};

// LocalStorage Keys
const STORAGE_KEYS = {
  CART: 'smart_grocery_cart',
  BUDGET: 'smart_grocery_budget',
  HISTORY: 'smart_grocery_history',
  PRICES: 'smart_grocery_prices'
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
  if (typeof syncEngine !== 'undefined') {
    syncEngine.init();
  }
});

function loadDataFromStorage() {
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

function saveCartToStorage() {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
  if (typeof syncEngine !== 'undefined') {
    syncEngine.broadcastState('Perubahan Keranjang');
  }
}

function saveBudgetToStorage() {
  localStorage.setItem(STORAGE_KEYS.BUDGET, state.budgetCap.toString());
  if (typeof syncEngine !== 'undefined') {
    syncEngine.broadcastState('Batas Anggaran');
  }
}

function saveHistoryToStorage() {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
  if (typeof syncEngine !== 'undefined') {
    syncEngine.broadcastState('Riwayat Belanja');
  }
}

function savePricesToStorage() {
  localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(state.priceDatabase));
  if (typeof syncEngine !== 'undefined') {
    syncEngine.broadcastState('Database Harga Acuan');
  }
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
 * F-04: Komparator Harga Realtime vs Bulan Lalu
 */
function comparePriceWithPrevious(itemName, currentUnitPrice) {
  if (!itemName || !currentUnitPrice) return null;
  const normalizedKey = itemName.trim().toLowerCase();
  
  // Try exact or fuzzy match
  let previousRecord = state.priceDatabase[normalizedKey];
  if (!previousRecord) {
    const keys = Object.keys(state.priceDatabase);
    const matchedKey = keys.find(k => normalizedKey.includes(k) || k.includes(normalizedKey));
    if (matchedKey) {
      previousRecord = state.priceDatabase[matchedKey];
    }
  }

  if (!previousRecord || !previousRecord.price) {
    return { status: 'new', diff: 0, percent: 0, prevPrice: null };
  }

  const prevPrice = previousRecord.price;
  const diff = currentUnitPrice - prevPrice;
  const percent = prevPrice > 0 ? ((diff / prevPrice) * 100) : 0;

  if (diff > 0) {
    return {
      status: 'up',
      diff,
      percent: Math.abs(percent).toFixed(1),
      prevPrice,
      label: `Naik ${formatRupiah(diff)} (+${Math.abs(percent).toFixed(1)}%)`,
      icon: 'trending-up'
    };
  } else if (diff < 0) {
    return {
      status: 'down',
      diff: Math.abs(diff),
      percent: Math.abs(percent).toFixed(1),
      prevPrice,
      label: `Turun ${formatRupiah(Math.abs(diff))} (-${Math.abs(percent).toFixed(1)}%)`,
      icon: 'trending-down'
    };
  } else {
    return {
      status: 'equal',
      diff: 0,
      percent: 0,
      prevPrice,
      label: `Stabil = ${formatRupiah(prevPrice)}`,
      icon: 'minus'
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
  const percentUsed = budget > 0 ? Math.min(200, (totalSpent / budget) * 100) : 0;

  // Visual status & Colors
  let statusClass = 'status-safe';
  let pillClass = 'pill-safe';
  let pillText = 'Aman Terkendali';
  let progressFillClass = '';

  if (percentUsed >= 100) {
    statusClass = 'status-danger';
    pillClass = 'pill-danger';
    pillText = '⚠️ OVERBUDGET!';
    progressFillClass = 'fill-danger';
  } else if (percentUsed >= 85) {
    statusClass = 'status-warning';
    pillClass = 'pill-warning';
    pillText = '⚡ Mendekati Limit';
    progressFillClass = 'fill-warning';
  } else if (percentUsed >= 65) {
    pillText = '👍 Masih Longgar';
  }

  safetyCard.className = `budget-safety-card ${statusClass}`;
  
  safetyCard.innerHTML = `
    <div class="budget-card-header">
      <div class="budget-status-pill ${pillClass}">
        <i data-lucide="${percentUsed >= 100 ? 'alert-triangle' : percentUsed >= 85 ? 'shield-alert' : 'shield-check'}" style="width:14px; height:14px;"></i>
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
      <span>Terpakai <strong class="percent-used">${percentUsed.toFixed(0)}%</strong> dari total limit</span>
      ${totalSaved > 0 ? `<span style="color:#fbbf24; font-weight:700;">Hemat: ${formatRupiah(totalSaved)}</span>` : `<span>${state.cart.length} item di troli</span>`}
    </div>

    ${percentUsed >= 100 ? `
      <div class="overbudget-alert-banner">
        <i data-lucide="alert-octagon" style="width:16px; height:16px; flex-shrink:0;"></i>
        <span>Perhatian! Pengeluaran telah melampaui limit sebesar ${formatRupiah(Math.abs(remaining))}. Evaluasi barang belanjaan Anda!</span>
      </div>
    ` : ''}
  `;

  // Attach quick edit click
  document.getElementById('btnQuickEditBudget')?.addEventListener('click', () => {
    switchTab('anggaran');
  });

  // Haptic feedback trigger on mobile if danger
  if (percentUsed >= 100 && 'vibrate' in navigator) {
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
    const comp = comparePriceWithPrevious(item.name, item.unitPrice);
    const catObj = DEFAULT_CATEGORIES.find(c => c.id === item.category) || { name: item.category || 'Lainnya', color: '#64748b' };

    let compBadgeHtml = '';
    if (comp && comp.status !== 'new') {
      const compClass = comp.status === 'up' ? 'price-up' : comp.status === 'down' ? 'price-down' : 'price-equal';
      compBadgeHtml = `
        <span class="price-comparator-badge ${compClass}" title="Bulan lalu: ${formatRupiah(comp.prevPrice)}">
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
            <span class="stepper-value">${item.qty}</span>
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
            <button class="budget-save-btn" id="btnSaveBudgetSetting">
              <i data-lucide="check" style="width:14px; height:14px;"></i>
              <span>Simpan</span>
            </button>
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
    const btn = document.getElementById('btnSaveBudgetSetting');
    const val = parseFloat(document.getElementById('inputBudgetValue').value);
    if (!isNaN(val) && val >= 0) {
      state.budgetCap = val;
      saveBudgetToStorage();
      if (btn) {
        btn.innerHTML = '<span>✓ Tersimpan!</span>';
        setTimeout(() => { renderApp(); }, 500);
      } else {
        renderApp();
      }
      showToast(`Batas anggaran berhasil diperbarui ke ${formatRupiah(val)}!`, 'success');
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
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      // Remove item confirmation
      if (confirm(`Hapus "${item.name}" dari keranjang belanja?`)) {
        state.cart = state.cart.filter(i => i.id !== id);
        saveCartToStorage();
        showToast(`Item "${item.name}" dihapus`, 'warning');
        renderApp();
      }
    } else {
      item.qty = newQty;
      saveCartToStorage();
      renderApp();
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
 * F-04: Live comparator box in Add/Edit modal
 */
function updateLiveComparatorBox(name, price) {
  const box = document.getElementById('modalLiveComparatorBox');
  if (!box) return;

  if (!name || !price) {
    box.style.display = 'none';
    return;
  }

  const comp = comparePriceWithPrevious(name, price);
  if (!comp || comp.status === 'new') {
    box.style.display = 'flex';
    box.innerHTML = `
      <div class="live-comp-icon" style="background:rgba(59, 130, 246, 0.15); color:#60a5fa;">
        <i data-lucide="sparkles" style="width:18px; height:18px;"></i>
      </div>
      <div class="live-comp-info">
        <div class="live-comp-title">Item Baru</div>
        <div class="live-comp-status" style="color:#93c5fd;">Belum ada data harga bulan lalu untuk item ini.</div>
      </div>
    `;
    initLucideIcons();
    return;
  }

  box.style.display = 'flex';
  const isUp = comp.status === 'up';
  const isDown = comp.status === 'down';
  const color = isUp ? '#f87171' : isDown ? '#34d399' : '#cbd5e1';
  const bg = isUp ? 'rgba(239,68,68,0.15)' : isDown ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)';

  box.innerHTML = `
    <div class="live-comp-icon" style="background:${bg}; color:${color};">
      <i data-lucide="${comp.icon}" style="width:18px; height:18px;"></i>
    </div>
    <div class="live-comp-info">
      <div class="live-comp-title">Komparasi vs Bulan Lalu (${formatRupiah(comp.prevPrice)})</div>
      <div class="live-comp-status" style="color:${color};">
        ${comp.label}
      </div>
    </div>
  `;
  initLucideIcons();
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
   CHECKOUT & FINISH TRIP (F-06)
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
  const defaultTripTitle = `Belanja Bulanan - ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  document.getElementById('inputCheckoutTripTitle').value = defaultTripTitle;
  document.getElementById('inputCheckoutStore').value = 'Super Indo / Alfamidi / Indomaret';
  
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
  const title = document.getElementById('inputCheckoutTripTitle').value.trim() || 'Belanja Bulanan Kos';
  const store = document.getElementById('inputCheckoutStore').value.trim() || 'Supermarket';

  let totalOriginal = 0;
  let totalSpent = 0;
  let totalSaved = 0;

  const tripItems = state.cart.map(item => {
    const calc = calculateTieredDiscount(item.unitPrice, item.qty, item.discountInput);
    totalOriginal += calc.originalSubtotal;
    totalSpent += calc.finalTotal;
    totalSaved += calc.discountAmount;

    // F-06: Automatically update database acuan harga untuk bulan berikutnya!
    const key = item.name.trim().toLowerCase();
    state.priceDatabase[key] = {
      name: item.name,
      category: item.category,
      unit: item.unit,
      price: item.unitPrice,
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
    date: new Date().toISOString().split('T')[0],
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
  showToast('Belanjaan berhasil diarsipkan ke Riwayat & Database!', 'success');
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

  if (state.cart.length > 0) {
    if (!confirm('Troli saat ini sudah ada isinya. Tambahkan item riwayat ini ke troli?')) return;
  }

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
  showToast(`${newItems.length} item dimuat ke troli!`, 'success');
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
        }
        suggestionsBox.classList.remove('active');
      });
    });
  });

  document.getElementById('inputItemUnitPrice')?.addEventListener('input', (e) => {
    const price = parseFloat(e.target.value) || 0;
    updateLiveComparatorBox(input.value, price);
  });
}

/* ==========================================================================
   NAVIGATION & EVENT LISTENERS
   ========================================================================== */
function setupEventListeners() {
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

  setupAutocomplete();
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

  if (confirm(`Pilih tindakan untuk "${item.name}":\n- Klik OK untuk Edit\n- Klik Batal untuk Hapus`)) {
    openEditItemModal(id);
  } else {
    state.cart = state.cart.filter(i => i.id !== id);
    saveCartToStorage();
    showToast(`"${item.name}" dihapus`, 'warning');
    renderApp();
  }
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

/* ==========================================================================
   REALTIME MULTI-DEVICE SYNC ENGINE (PC <-> HP)
   Ultra-fast Realtime synchronization for live presentations:
   1. Local Server SSE (Server-Sent Events) via node server.js
   2. Cloud MQTT WebSocket Relay fallback for GitHub Pages or Remote Networks
   ========================================================================== */
const syncEngine = {
  clientId: 'client_' + (window.innerWidth < 768 ? 'hp_' : 'pc_') + Math.random().toString(36).substring(2, 9),
  deviceType: window.innerWidth < 768 ? 'Smartphone (HP)' : 'Komputer (PC)',
  isReceivingRemoteSync: false,
  status: 'connecting', // 'connected' | 'offline' | 'connecting'
  mode: 'local', // 'local' | 'cloud'
  eventSource: null,
  mqttClient: null,
  networkInfo: null,
  cloudRoom: 'smart-groceries-devin-demo',
  isInitialized: false,

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.updateStatusBadge();
    this.initEventListeners();
    this.detectAndConnect();
  },

  async detectAndConnect() {
    // 1. Check if local Node.js server is active
    try {
      const res = await fetch('/api/network-info', { cache: 'no-store' });
      if (res.ok) {
        this.networkInfo = await res.json();
        this.mode = 'local';
        this.connectLocalSSE();
        return;
      }
    } catch (e) {
      // Local server not available, fall back to cloud sync
    }

    // 2. Fall back to Cloud MQTT Relay
    this.connectCloudMQTT();
  },

  connectLocalSSE() {
    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.status = 'connected';
        this.updateStatusBadge();
        console.log('⚡ Realtime Sync SSE terhubung ke server lokal');
      };

      this.eventSource.addEventListener('init', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.state && Array.isArray(data.state.cart) && data.state.cart.length > 0) {
            this.applyRemoteState(data.state, 'Sinkronisasi Server', '');
          } else {
            // Seed server with current client state if server is fresh
            this.broadcastState('Initial Seed');
          }
        } catch (err) {
          console.warn('Gagal memproses data init:', err);
        }
      });

      this.eventSource.addEventListener('sync_update', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.senderId !== this.clientId) {
            this.applyRemoteState(data.state, data.senderDevice, data.action);
          }
        } catch (err) {
          console.warn('Gagal memproses sync_update:', err);
        }
      });

      this.eventSource.addEventListener('ping_signal', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.handlePingReceived(data);
        } catch (err) {}
      });

      this.eventSource.onerror = () => {
        this.status = 'offline';
        this.updateStatusBadge();
        // Reconnect attempt
        setTimeout(() => {
          if (this.mode === 'local') this.connectLocalSSE();
        }, 3000);
      };
    } catch (err) {
      console.warn('Gagal membuat koneksi EventSource:', err);
      this.connectCloudMQTT();
    }
  },

  connectCloudMQTT() {
    this.mode = 'cloud';
    if (typeof mqtt === 'undefined') {
      this.status = 'offline';
      this.updateStatusBadge();
      return;
    }

    try {
      this.status = 'connecting';
      this.updateStatusBadge();

      const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000
      });

      const topicSync = `smart-groceries/${this.cloudRoom}/sync`;
      const topicPing = `smart-groceries/${this.cloudRoom}/ping`;

      this.mqttClient.on('connect', () => {
        this.status = 'connected';
        this.updateStatusBadge();
        console.log('⚡ Cloud Realtime Sync terhubung via MQTT Topic:', topicSync);
        this.mqttClient.subscribe([topicSync, topicPing]);
      });

      this.mqttClient.on('message', (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          if (payload.senderId === this.clientId) return;

          if (topic.endsWith('/sync')) {
            this.applyRemoteState(payload.state, payload.senderDevice, payload.action);
          } else if (topic.endsWith('/ping')) {
            this.handlePingReceived(payload);
          }
        } catch (err) {
          console.warn('Gagal memproses MQTT message:', err);
        }
      });

      this.mqttClient.on('error', () => {
        this.status = 'offline';
        this.updateStatusBadge();
      });

      this.mqttClient.on('close', () => {
        this.status = 'offline';
        this.updateStatusBadge();
      });
    } catch (e) {
      console.warn('MQTT connection failed:', e);
      this.status = 'offline';
      this.updateStatusBadge();
    }
  },

  applyRemoteState(remoteState, senderDevice, action) {
    if (!remoteState) return;
    this.isReceivingRemoteSync = true;
    try {
      if (Array.isArray(remoteState.cart)) {
        state.cart = remoteState.cart;
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
      }
      if (typeof remoteState.budgetCap === 'number') {
        state.budgetCap = remoteState.budgetCap;
        localStorage.setItem(STORAGE_KEYS.BUDGET, state.budgetCap.toString());
      }
      if (Array.isArray(remoteState.history)) {
        state.history = remoteState.history;
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
      }
      if (remoteState.priceDatabase) {
        state.priceDatabase = { ...state.priceDatabase, ...remoteState.priceDatabase };
        localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(state.priceDatabase));
      }

      renderApp();

      if (action && action !== 'Initial Seed') {
        showToast(`⚡ Realtime: ${action} (${senderDevice || 'HP'})`, 'success');
      }
    } finally {
      setTimeout(() => {
        this.isReceivingRemoteSync = false;
      }, 80);
    }
  },

  broadcastState(actionName = 'update') {
    if (this.isReceivingRemoteSync) return;

    const payload = {
      state: {
        cart: state.cart,
        budgetCap: state.budgetCap,
        history: state.history,
        priceDatabase: state.priceDatabase
      },
      senderId: this.clientId,
      senderDevice: this.deviceType,
      action: actionName,
      timestamp: Date.now()
    };

    // 1. Broadcast via Local Server API
    if (this.mode === 'local') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => {
        console.warn('Gagal kirim sync lokal:', err);
      });
    }

    // 2. Broadcast via Cloud MQTT
    if (this.mqttClient && this.mqttClient.connected) {
      const topicSync = `smart-groceries/${this.cloudRoom}/sync`;
      this.mqttClient.publish(topicSync, JSON.stringify(payload), { qos: 0 });
    }
  },

  sendPing() {
    const payload = {
      senderId: this.clientId,
      senderDevice: this.deviceType,
      message: `Sinyal Tes dari ${this.deviceType}!`,
      timestamp: Date.now()
    };

    if (this.mode === 'local') {
      fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }

    if (this.mqttClient && this.mqttClient.connected) {
      const topicPing = `smart-groceries/${this.cloudRoom}/ping`;
      this.mqttClient.publish(topicPing, JSON.stringify(payload));
    }

    showToast(`🔔 Sinyal tes terkirim dari ${this.deviceType}!`, 'success');
  },

  handlePingReceived(data) {
    showToast(`🔔 ${data.message || 'Sinyal tes realtime diterima!'}`, 'warning');
    if ('vibrate' in navigator) {
      try { navigator.vibrate([150, 80, 150]); } catch (e) {}
    }
    // Audio notification
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}
  },

  updateStatusBadge() {
    const dot = document.getElementById('syncStatusDot');
    const label = document.getElementById('syncStatusLabel');
    const modalDot = document.getElementById('syncModalDot');
    const modalText = document.getElementById('syncModalModeText');
    const modalTitle = document.getElementById('syncModalStatusTitle');
    const modalDesc = document.getElementById('syncModalStatusDesc');

    if (!dot) return;

    if (this.status === 'connected') {
      dot.className = 'sync-pulse-dot live';
      if (label) label.textContent = 'Sync ON';
      if (modalDot) modalDot.className = 'sync-pulse-dot live';
      if (modalTitle) modalTitle.textContent = '⚡ Sinkronisasi Realtime Terhubung!';
      if (modalDesc) modalDesc.textContent = `Perangkat Anda (${this.deviceType}) aktif dan terhubung realtime.`;
      if (modalText) {
        modalText.textContent = this.mode === 'local' 
          ? 'Server Lokal Wi-Fi (Instant SSE)' 
          : 'Cloud Realtime Relay (Room: ' + this.cloudRoom + ')';
      }
    } else if (this.status === 'connecting') {
      dot.className = 'sync-pulse-dot connecting';
      if (label) label.textContent = 'Connecting...';
      if (modalDot) modalDot.className = 'sync-pulse-dot connecting';
      if (modalTitle) modalTitle.textContent = 'Menghubungkan ke Server...';
      if (modalDesc) modalDesc.textContent = 'Mencari koneksi realtime PC & HP...';
    } else {
      dot.className = 'sync-pulse-dot offline';
      if (label) label.textContent = 'Offline';
      if (modalDot) modalDot.className = 'sync-pulse-dot offline';
      if (modalTitle) modalTitle.textContent = '⚠️ Menunggu Server Sync';
      if (modalDesc) modalDesc.textContent = 'Jalankan "node server.js" di PC agar HP dapat tersinkronisasi.';
    }
  },

  openModal() {
    this.updateModalInfo();
    openModal('syncModal');
  },

  async updateModalInfo() {
    this.updateStatusBadge();
    const urlText = document.getElementById('syncModalUrlText');
    const qrImg = document.getElementById('syncQrImage');
    const qrPlaceholder = document.getElementById('syncQrPlaceholder');

    let targetUrl = window.location.href;

    // If on localhost or missing network info, try refreshing network info
    if (this.mode === 'local' && (!this.networkInfo || !this.networkInfo.mobileUrl)) {
      try {
        const res = await fetch('/api/network-info', { cache: 'no-store' });
        if (res.ok) {
          this.networkInfo = await res.json();
        }
      } catch (e) {}
    }

    if (this.networkInfo && this.networkInfo.mobileUrl) {
      targetUrl = this.networkInfo.mobileUrl;
    }

    if (urlText) urlText.textContent = targetUrl;

    if (qrImg) {
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}&margin=4`;
      qrImg.src = qrApi;
      qrImg.onload = () => {
        qrImg.style.display = 'block';
        if (qrPlaceholder) qrPlaceholder.style.display = 'none';
      };
      qrImg.onerror = () => {
        if (qrPlaceholder) {
          qrPlaceholder.style.display = 'block';
          qrPlaceholder.innerHTML = `<span style="color:#ef4444; font-weight:700;">Buka link berikut di browser HP:</span><br><code style="color:#10b981; font-size:0.95rem;">${targetUrl}</code>`;
        }
      };
    }
  },

  initEventListeners() {
    document.getElementById('btnSyncModal')?.addEventListener('click', () => {
      this.openModal();
    });

    document.getElementById('btnCopySyncUrl')?.addEventListener('click', () => {
      const urlText = document.getElementById('syncModalUrlText')?.textContent;
      if (urlText) {
        navigator.clipboard.writeText(urlText).then(() => {
          showToast('Link berhasil disalin ke clipboard!', 'success');
        }).catch(() => {
          showToast('Silakan salin teks URL secara manual', 'warning');
        });
      }
    });

    document.getElementById('btnSendSyncPing')?.addEventListener('click', () => {
      this.sendPing();
    });
  }
};
