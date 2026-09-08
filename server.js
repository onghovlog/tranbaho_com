require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function formatSeconds(sec) {
  const total = parseInt(sec, 10);
  if (isNaN(total) || total < 0) return '';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseIsoDuration(iso) {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);
  const totalSec = hours * 3600 + minutes * 60 + seconds;
  return formatSeconds(totalSec);
}

function fetchYoutubeInfo(videoId) {
  return new Promise((resolve) => {
    if (!videoId) return resolve({ success: false, message: 'Missing videoId' });
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    }, (res) => {
      let html = '';
      res.on('data', chunk => { html += chunk; });
      res.on('end', () => {
        let duration = '';
        let title = '';

        // Extract title
        const titleMatch = html.match(/<meta property="og:title" content="(.*?)">/) || html.match(/<title>(.*?) - YouTube<\/title>/);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        }

        // Extract duration
        const lenMatch = html.match(/"lengthSeconds":"(\d+)"/);
        if (lenMatch && lenMatch[1]) {
          duration = formatSeconds(lenMatch[1]);
        } else {
          const durMatch = html.match(/itemprop="duration" content="(PT[^"]+)"/);
          if (durMatch && durMatch[1]) {
            duration = parseIsoDuration(durMatch[1]);
          } else {
            const msMatch = html.match(/"approxDurationMs":"(\d+)"/);
            if (msMatch && msMatch[1]) {
              duration = formatSeconds(Math.round(parseInt(msMatch[1], 10) / 1000));
            }
          }
        }
        resolve({
          success: true,
          videoId,
          duration,
          title,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        });
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, videoId, duration: '', title: '', error: err.message });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, videoId, duration: '', title: '', error: 'Timeout' });
    });
  });
}

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tran_ba_ho';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123@2026';
const JWT_SECRET = process.env.JWT_SECRET || 'tranbaho_secret_key_2026';

const BASE_DIR = __dirname;
let db = null;
let mongoClient = null;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

function sanitizeDoc(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  if (_id !== 'single_doc') {
    rest.id = _id;
  }
  return rest;
}

// Kết nối MongoDB
async function initMongo() {
  try {
    mongoClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await mongoClient.connect();
    db = mongoClient.db();
    console.log('✅ Connected successfully to MongoDB Atlas!');
  } catch (err) {
    console.warn('⚠️ MongoDB connection unavailable. Server will fallback to db.json:', err.message);
    db = null;
  }
}

// Helper đọc JSON body
function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Helper kiểm tra JWT token
function verifyAuthToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return false;
  }
}

// Helper lấy toàn bộ dữ liệu công khai từ MongoDB
async function getFullDataFromMongo() {
  if (!db) return null;
  try {
    const keys = [
      'profile', 'heroSlides', 'courses', 'designPortfolio', 
      'webProjects', 'services', 'droppii', 'articles', 
      'gallery', 'youtubeVideos'
    ];
    const fullData = {};

    for (const key of keys) {
      const collection = db.collection(key);
      const docs = await collection.find({}).toArray();
      
      if (key === 'profile' || key === 'droppii') {
        const firstDoc = docs.find(d => d._id === 'single_doc') || docs[0];
        fullData[key] = firstDoc ? sanitizeDoc(firstDoc) : {};
      } else {
        fullData[key] = docs.map(sanitizeDoc);
      }
    }
    return fullData;
  } catch (err) {
    console.error('Error reading from MongoDB:', err);
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('?');
  let reqPath = decodeURIComponent(urlParts[0]);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- 1. PUBLIC APIs ---
  if (req.method === 'GET' && (reqPath === '/api/youtube-info' || reqPath === '/api/admin/youtube-info')) {
    const decodedUrl = decodeURIComponent(req.url);
    const urlMatch = decodedUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
    let cleanId = urlMatch ? urlMatch[1] : '';

    if (!cleanId) {
      const paramMatch = decodedUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:&|$)/i);
      if (paramMatch && paramMatch[1]) cleanId = paramMatch[1];
    }

    if (!cleanId) {
      const plain = decodedUrl.replace(/^.*[?&]v=/, '').replace(/^.*[?&]videoId=/, '').trim();
      const plainMatch = plain.match(/^[a-zA-Z0-9_-]{11}$/);
      if (plainMatch) cleanId = plainMatch[0];
    }

    const result = await fetchYoutubeInfo(cleanId);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(result));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/db') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    let data = await getFullDataFromMongo();
    if (!data) {
      try {
        const raw = fs.readFileSync(path.join(BASE_DIR, 'db.json'), 'utf-8');
        data = JSON.parse(raw);
      } catch (e) {
        data = { error: 'Failed to load data source' };
      }
    }
    res.end(JSON.stringify(data));
    return;
  }

  if (req.method === 'POST' && reqPath === '/api/contact') {
    const bodyData = await parseJsonBody(req);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });

    bodyData.createdAt = new Date().toISOString();
    bodyData.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (db) {
      try {
        await db.collection('contacts').insertOne(bodyData);
        console.log('📬 Đã lưu lead mới vào MongoDB:', bodyData.fullname || bodyData.phone);
      } catch (err) {
        console.error('Lỗi lưu contact:', err);
      }
    }
    res.end(JSON.stringify({
      success: true,
      message: 'Gửi thông tin liên hệ thành công! Trần Bá Hộ sẽ phản hồi sớm nhất.'
    }));
    return;
  }

  // --- 2. ADMIN AUTHENTICATION APIs ---
  if (req.method === 'POST' && reqPath === '/api/admin/login') {
    const { username, password } = await parseJsonBody(req);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });

    const inputUser = (username || '').trim();
    const inputPass = (password || '').trim();

    if (inputUser === ADMIN_USERNAME.trim() && inputPass === ADMIN_PASSWORD.trim()) {
      const token = jwt.sign({ username: ADMIN_USERNAME, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      res.end(JSON.stringify({
        success: true,
        token,
        user: { username: ADMIN_USERNAME, role: 'Administrator' }
      }));
    } else {
      res.end(JSON.stringify({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác.'
      }));
    }
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/admin/verify') {
    const user = verifyAuthToken(req);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (user) {
      res.end(JSON.stringify({ success: true, user }));
    } else {
      res.end(JSON.stringify({ success: false, message: 'Unauthorized' }));
    }
    return;
  }

  // --- 3. PROTECTED ADMIN CRUD APIs ---
  if (reqPath.startsWith('/api/admin/')) {
    const user = verifyAuthToken(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ.' }));
      return;
    }

    const subPath = reqPath.replace('/api/admin/', '').trim();
    const pathSegments = subPath.split('/');
    const collectionName = pathSegments[0];
    const docId = pathSegments[1];

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });

    if (!db) {
      res.end(JSON.stringify({ success: false, message: 'Kết nối MongoDB chưa sẵn sàng.' }));
      return;
    }

    try {
      const collection = db.collection(collectionName);

      // GET /api/admin/contacts (hoặc collection khác)
      if (req.method === 'GET') {
        const docs = await collection.find({}).sort({ _id: -1 }).toArray();
        res.end(JSON.stringify({ success: true, data: docs.map(sanitizeDoc) }));
        return;
      }

      // POST /api/admin/:collection - Thêm mới
      if (req.method === 'POST') {
        const newItem = await parseJsonBody(req);
        if (collectionName === 'profile' || collectionName === 'droppii') {
          await collection.updateOne(
            { _id: 'single_doc' },
            { $set: { _id: 'single_doc', ...newItem } },
            { upsert: true }
          );
        } else {
          newItem.createdAt = new Date().toISOString();
          await collection.insertOne(newItem);
        }
        res.end(JSON.stringify({ success: true, message: 'Thêm mới thành công!' }));
        return;
      }

      // PUT /api/admin/:collection/:id - Cập nhật
      if (req.method === 'PUT') {
        const updateData = await parseJsonBody(req);
        delete updateData._id;
        delete updateData.id;

        let query = {};
        if (docId === 'single_doc' || collectionName === 'profile' || collectionName === 'droppii') {
          query = { _id: 'single_doc' };
        } else if (ObjectId.isValid(docId)) {
          query = { _id: new ObjectId(docId) };
        } else if (!isNaN(Number(docId))) {
          query = { _id: Number(docId) };
        } else {
          query = { _id: docId };
        }

        await collection.updateOne(query, { $set: updateData });
        res.end(JSON.stringify({ success: true, message: 'Cập nhật thành công!' }));
        return;
      }

      // DELETE /api/admin/:collection/:id - Xóa bản ghi
      if (req.method === 'DELETE' && docId) {
        let query = {};
        if (ObjectId.isValid(docId)) {
          query = { _id: new ObjectId(docId) };
        } else if (!isNaN(Number(docId))) {
          query = { _id: Number(docId) };
        } else {
          query = { _id: docId };
        }

        await collection.deleteOne(query);
        res.end(JSON.stringify({ success: true, message: 'Đã xóa bản ghi thành công!' }));
        return;
      }

    } catch (err) {
      console.error('Lỗi API Admin:', err);
      res.end(JSON.stringify({ success: false, message: 'Lỗi server: ' + err.message }));
      return;
    }
  }

  // --- 4. PUBLIC GET /api/:collection ---
  if (req.method === 'GET' && reqPath.startsWith('/api/')) {
    const collName = reqPath.replace('/api/', '').trim();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });

    if (db && collName) {
      try {
        const docs = await db.collection(collName).find({}).toArray();
        if (collName === 'profile' || collName === 'droppii') {
          const firstDoc = docs.find(d => d._id === 'single_doc') || docs[0];
          res.end(JSON.stringify(firstDoc ? sanitizeDoc(firstDoc) : {}));
        } else {
          res.end(JSON.stringify(docs.map(sanitizeDoc)));
        }
        return;
      } catch (e) {}
    }

    try {
      const raw = fs.readFileSync(path.join(BASE_DIR, 'db.json'), 'utf-8');
      const dbJson = JSON.parse(raw);
      res.end(JSON.stringify(dbJson[collName] || { error: 'Collection not found' }));
    } catch (e) {
      res.end(JSON.stringify({ error: 'Failed to read data' }));
    }
    return;
  }

  // --- 5. STATIC FILES ---
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(BASE_DIR, reqPath);

  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

initMongo().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`🔑 Admin Dashboard sẵn sàng tại http://localhost:${PORT}/admin.html`);
  });
});
