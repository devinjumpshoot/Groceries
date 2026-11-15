// ==========================================================================
// FIREBASE FIRESTORE CLOUD CONFIGURATION & REALTIME SYNC
// Project: groceries-58c7e
// ==========================================================================

const firebaseConfig = {
  apiKey: "AIzaSyDnpvSCCHtw_4jekiSDVrn_KkAFA8Kotto",
  authDomain: "groceries-58c7e.firebaseapp.com",
  projectId: "groceries-58c7e",
  storageBucket: "groceries-58c7e.firebasestorage.app",
  messagingSenderId: "436521163383",
  appId: "1:436521163383:web:9ebdb6155d1e7833848472",
  measurementId: "G-L7KBZLHB9Q"
};

let db = null;

try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();

    // Enable offline persistence so data works offline inside supermarkets
    db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence warning: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser');
      }
    });

    console.log('Firebase Cloud Firestore successfully connected: groceries-58c7e');
  }
} catch (e) {
  console.warn('Firebase initialization error:', e);
}

const FirebaseSync = {
  isAvailable() {
    return db !== null;
  },

  async syncCart(cart) {
    if (!db) return;
    try {
      await db.collection('groceries').doc('current_cart').set({
        items: cart,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      FirebaseSync.updateStatusBadge(true);
    } catch (err) {
      console.warn('Firebase syncCart error:', err);
      FirebaseSync.updateStatusBadge(false);
    }
  },

  async syncBudget(budget) {
    if (!db) return;
    try {
      await db.collection('groceries').doc('settings').set({
        budgetCap: budget,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('Firebase syncBudget error:', err);
    }
  },

  async syncHistory(history) {
    if (!db) return;
    try {
      await db.collection('groceries').doc('history').set({
        trips: history,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('Firebase syncHistory error:', err);
    }
  },

  async syncPrices(prices) {
    if (!db) return;
    try {
      await db.collection('groceries').doc('price_database').set({
        prices: prices,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('Firebase syncPrices error:', err);
    }
  },

  initRealtimeListener(onDataUpdated) {
    if (!db) return;

    // Listen to real-time cart updates from cloud
    db.collection('groceries').doc('current_cart').onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data && Array.isArray(data.items)) {
          onDataUpdated('cart', data.items);
        }
      }
      FirebaseSync.updateStatusBadge(true);
    }, (err) => {
      console.warn('Realtime cart sync offline/error:', err);
      FirebaseSync.updateStatusBadge(false);
    });

    // Listen to settings/budget updates
    db.collection('groceries').doc('settings').onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data && typeof data.budgetCap === 'number') {
          onDataUpdated('budget', data.budgetCap);
        }
      }
    }, () => {});

    // Listen to history updates
    db.collection('groceries').doc('history').onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data && Array.isArray(data.trips)) {
          onDataUpdated('history', data.trips);
        }
      }
    }, () => {});
  },

  updateStatusBadge(isOnline) {
    const badge = document.getElementById('cloudSyncStatusBadge');
    if (!badge) return;

    if (isOnline) {
      badge.className = 'cloud-status-badge synced';
      badge.innerHTML = '<span class="cloud-dot"></span><span>Cloud Aktif</span>';
      badge.title = 'Tersinkronisasi Realtime dengan Firebase Firestore (groceries-58c7e)';
    } else {
      badge.className = 'cloud-status-badge offline';
      badge.innerHTML = '<span class="cloud-dot offline"></span><span>Lokal</span>';
      badge.title = 'Mode offline: data tersimpan di HP';
    }
  }
};

window.FirebaseSync = FirebaseSync;

