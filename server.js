const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const STORE_FILE = path.join(__dirname, 'sync-store.json');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

// In-memory shared state for multi-device sync
let sharedState = {
  cart: [],
  budgetCap: 500000,
  history: [],
  priceDatabase: {},
  lastUpdated: Date.now()
};

// Load saved state from sync-store.json if available
if (fs.existsSync(STORE_FILE)) {
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      sharedState = { ...sharedState, ...parsed };
      console.log('📦 Data tersimpan berhasil dimuat dari sync-store.json');
    }
  } catch (err) {
    console.warn('⚠️ Gagal memuat sync-store.json:', err.message);
  }
}

// Persist shared state to file
function persistSharedState() {
  try {
    fs.writeFile(STORE_FILE, JSON.stringify(sharedState, null, 2), (err) => {
      if (err) console.error('Gagal menulis ke sync-store.json:', err);
    });
  } catch (e) {
    console.error('Error persist state:', e);
  }
}

// SSE Connected Clients (PC, HP, Tablets)
const sseClients = new Set();

// Broadcast event to all connected clients
function broadcastEvent(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (err) {
      sseClients.delete(res);
    }
  }
}

// Heartbeat every 20s to keep SSE connections alive
setInterval(() => {
  for (const res of sseClients) {
    try {
      res.write(': keep-alive\n\n');
    } catch (e) {
      sseClients.delete(res);
    }
  }
}, 20000);

// Detect Local IPv4 Addresses for HP Connection
function getNetworkIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

const server = http.createServer((req, res) => {
  const [reqUrl, queryStr] = req.url.split('?');
  const method = req.method;

  // CORS Headers for API endpoints
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client-ID');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 1: Server-Sent Events (SSE) Stream for Instant Realtime Sync
  if (reqUrl === '/api/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.write('\n');

    sseClients.add(res);

    // Send immediate initial sync state to connecting client
    const initPayload = {
      type: 'init',
      state: sharedState,
      serverTime: Date.now(),
      connectedClients: sseClients.size
    };
    res.write(`event: init\ndata: ${JSON.stringify(initPayload)}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // API 2: Network Info (IPs, Port, Mobile URLs)
  if (reqUrl === '/api/network-info' && method === 'GET') {
    const ips = getNetworkIps();
    const primaryIp = ips[0] || 'localhost';
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      port: PORT,
      localUrl: `http://localhost:${PORT}`,
      networkIps: ips,
      primaryIp,
      mobileUrl: `http://${primaryIp}:${PORT}`,
      connectedClients: sseClients.size
    }));
    return;
  }

  // API 3: Get Synced State
  if (reqUrl === '/api/sync' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      state: sharedState,
      timestamp: sharedState.lastUpdated
    }));
    return;
  }

  // API 4: Push Synced State (from PC or HP)
  if (reqUrl === '/api/sync' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { state: newState, senderId, senderDevice, action } = payload;

        if (newState && typeof newState === 'object') {
          if (Array.isArray(newState.cart)) sharedState.cart = newState.cart;
          if (typeof newState.budgetCap === 'number') sharedState.budgetCap = newState.budgetCap;
          if (Array.isArray(newState.history)) sharedState.history = newState.history;
          if (newState.priceDatabase) sharedState.priceDatabase = newState.priceDatabase;
          sharedState.lastUpdated = Date.now();

          // Persist to disk
          persistSharedState();

          // Broadcast to all other devices in real-time
          broadcastEvent('sync_update', {
            state: sharedState,
            senderId,
            senderDevice: senderDevice || 'Perangkat Lain',
            action: action || 'update',
            timestamp: sharedState.lastUpdated
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, timestamp: sharedState.lastUpdated }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 5: Ping signal for live demonstration (PC sends ping -> HP rings / notifies)
  if (reqUrl === '/api/ping' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        broadcastEvent('ping_signal', {
          senderId: parsed.senderId || 'unknown',
          senderDevice: parsed.senderDevice || 'PC',
          message: parsed.message || 'Sinyal Tes Presentasi Realtime!',
          timestamp: Date.now()
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }

  // Static File Serving
  let targetPath = reqUrl === '/' ? '/index.html' : reqUrl;
  const filePath = path.join(__dirname, targetPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(content);
    }
  });
});

// Bind to 0.0.0.0 so all LAN/Wi-Fi devices (smartphones, tablets) can access it
server.listen(PORT, '0.0.0.0', () => {
  const ips = getNetworkIps();
  const primaryIp = ips[0] || 'localhost';
  console.log('\n' + '='.repeat(60));
  console.log('🛒 SMART GROCERY & BUDGET SAFETY TRACKER');
  console.log('⚡ REALTIME SYNC SERVER (PC <-> HP) IS ACTIVE!');
  console.log('='.repeat(60));
  console.log(`💻 Buka di PC ini  : http://localhost:${PORT}`);
  if (ips.length > 0) {
    ips.forEach(ip => {
      console.log(`📱 Buka di HP (WiFi): http://${ip}:${PORT}`);
    });
  } else {
    console.log(`📱 Buka di HP (WiFi): http://${primaryIp}:${PORT}`);
  }
  console.log('='.repeat(60));
  console.log('💡 Tips: Sambungkan HP dan PC ke Wi-Fi / Hotspot yang sama.');
  console.log('   Perubahan di PC langsung muncul di HP seketika!\n');
});
