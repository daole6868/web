#!/usr/bin/env node
/* ==========================================================================
   server.js — Máy chủ cho website NOVA BOOST
   - Không cần cài thư viện (chỉ dùng Node.js có sẵn, bản 18 trở lên)
   - Phục vụ các file web (index.html, admin.html, css, js, nhạc…)
   - API lưu nội dung, tin nhắn, thống kê, file nhạc vào thư mục data/ và uploads/
   - Đăng nhập admin kiểm tra trên máy chủ (mật khẩu mã hoá scrypt, cookie HttpOnly)
   - Gửi thông báo Telegram khi có khách để lại lời nhắn

   Chạy:           node server/server.js
   Đặt mật khẩu:   node server/server.js set-password "MatKhauMoi"
   Biến môi trường: PORT (mặc định 3000), HOST (127.0.0.1), DATA_DIR, UPLOAD_DIR,
                   ADMIN_PASSWORD (mật khẩu ban đầu khi chưa có)
   ========================================================================== */
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(ROOT, 'uploads'));
const MUSIC_DIR = path.join(UPLOAD_DIR, 'music');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const MAX_JSON = 2 * 1024 * 1024;           // 2 MB cho dữ liệu nội dung
const MAX_UPLOAD = 40 * 1024 * 1024;        // 40 MB mỗi file nhạc
const SESSION_HOURS = 12, REMEMBER_DAYS = 30;
const MAX_MESSAGES = 5000;

const FILES = {
  site: path.join(DATA_DIR, 'site.json'),
  messages: path.join(DATA_DIR, 'messages.json'),
  stats: path.join(DATA_DIR, 'stats.json'),
  private: path.join(DATA_DIR, 'private.json'),   // mật khẩu + Telegram — KHÔNG công khai
  sessions: path.join(DATA_DIR, 'sessions.json')
};

/* ---------------- Lưu trữ file JSON (ghi an toàn, tuần tự) ---------------- */
const cache = new Map();
const queues = new Map();

function readJSON(file, fallback) {
  if (cache.has(file)) return cache.get(file);
  let val = fallback;
  try { val = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { /* chưa có file */ }
  cache.set(file, val);
  return val;
}
function writeJSON(file, val) {
  cache.set(file, val);
  const prev = queues.get(file) || Promise.resolve();
  const next = prev.then(async () => {
    const tmp = file + '.' + process.pid + '.tmp';
    await fsp.writeFile(tmp, JSON.stringify(val, null, 1), { mode: 0o600 }); // chỉ chủ sở hữu đọc được
    await fsp.rename(tmp, file); // đổi tên = ghi nguyên vẹn, không bao giờ hỏng file giữa chừng
  }).catch(err => console.error('[ghi file lỗi]', file, err.message));
  queues.set(file, next);
  return next;
}

/* ---------------- Mật khẩu & phiên đăng nhập ---------------- */
function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return { salt, hash };
}
function verifyPassword(pw, priv) {
  if (!priv.passwordHash || !priv.salt) return false;
  const a = Buffer.from(hashPassword(pw, priv.salt).hash, 'hex');
  const b = Buffer.from(priv.passwordHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function setPassword(pw, mustChange) {
  const priv = readJSON(FILES.private, {});
  const { salt, hash } = hashPassword(pw);
  priv.salt = salt; priv.passwordHash = hash; priv.mustChange = !!mustChange;
  return writeJSON(FILES.private, priv);
}
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

function createSession(remember) {
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = readJSON(FILES.sessions, {});
  const now = Date.now();
  Object.keys(sessions).forEach(k => { if (sessions[k] < now) delete sessions[k]; });
  const ttl = remember ? REMEMBER_DAYS * 864e5 : SESSION_HOURS * 36e5;
  sessions[sha(token)] = now + ttl;
  writeJSON(FILES.sessions, sessions);
  return { token, maxAge: Math.floor(ttl / 1000), remember };
}
function getSessionToken(req) {
  const m = /(?:^|;\s*)nb_session=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  return m ? m[1] : null;
}
function isAuthed(req) {
  const t = getSessionToken(req); if (!t) return false;
  const exp = readJSON(FILES.sessions, {})[sha(t)];
  return !!exp && exp > Date.now();
}
function destroySession(req) {
  const t = getSessionToken(req); if (!t) return;
  const sessions = readJSON(FILES.sessions, {});
  delete sessions[sha(t)]; writeJSON(FILES.sessions, sessions);
}
function cookie(req, token, maxAge) {
  const secure = (req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
  return 'nb_session=' + token + '; Path=/; HttpOnly; SameSite=Strict' + secure + (maxAge != null ? '; Max-Age=' + maxAge : '');
}

/* ---------------- Giới hạn tần suất (chống dò mật khẩu / spam) ---------------- */
const buckets = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(); let b = buckets.get(key);
  if (!b || b.reset < now) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.n++;
  return b.n > max;
}
setInterval(() => { const now = Date.now(); buckets.forEach((b, k) => { if (b.reset < now) buckets.delete(k); }); }, 10 * 60e3).unref();

function clientIp(req) {
  const remote = req.socket.remoteAddress || '';
  // Chỉ tin X-Forwarded-For khi yêu cầu đi qua Nginx trên chính máy này
  if ((remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1') && req.headers['x-real-ip']) return String(req.headers['x-real-ip']);
  return remote;
}

/* ---------------- Telegram ---------------- */
function tgEsc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function telegram(method, token, payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload || {});
    const req = https.request({
      hostname: 'api.telegram.org', path: '/bot' + token + '/' + method, method: 'POST', timeout: 10000,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = ''; res.on('data', c => { data += c; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({ ok: false, description: 'Phản hồi không hợp lệ' }); } });
    });
    req.on('timeout', () => req.destroy(new Error('Hết thời gian chờ')));
    req.on('error', e => resolve({ ok: false, description: e.message }));
    req.end(body);
  });
}
async function notifyTelegram(msg) {
  const tg = (readJSON(FILES.private, {}).telegram) || {};
  if (!tg.enabled || !tg.token || !tg.chatId) return;
  const site = readJSON(FILES.site, {});
  const name = (site.general && site.general.siteName) || 'Website';
  const lines = [
    '🎮 <b>Đơn mới từ ' + tgEsc(name) + '</b>',
    '',
    '👤 <b>Tên:</b> ' + tgEsc(msg.name),
    '📞 <b>SĐT:</b> ' + tgEsc(msg.phone),
    msg.uid ? '🎯 <b>Game/Server/UID:</b> ' + tgEsc(msg.uid) : null,
    msg.service ? '🛠 <b>Dịch vụ:</b> ' + tgEsc(msg.service) : null,
    msg.email ? '📧 <b>Email:</b> ' + tgEsc(msg.email) : null,
    '💬 <b>Nội dung:</b>\n' + tgEsc(msg.message),
    '',
    '🕒 ' + new Date(msg.date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  ].filter(l => l !== null).join('\n');
  const r = await telegram('sendMessage', tg.token, { chat_id: tg.chatId, text: lines, parse_mode: 'HTML', disable_web_page_preview: true });
  if (!r.ok) console.error('[Telegram lỗi]', r.description);
}

/* ---------------- Tiện ích HTTP ---------------- */
function send(res, status, body, headers) {
  const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
  const data = isJson ? JSON.stringify(body) : body;
  res.writeHead(status, Object.assign({ 'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }, headers || {}));
  res.end(data);
}
const ok = (res, body, h) => send(res, 200, body || { ok: true }, h);
const fail = (res, status, error) => send(res, status, { ok: false, error });

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Dữ liệu quá lớn'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJsonBody(req, limit) {
  const buf = await readBody(req, limit || 64 * 1024);
  try { return JSON.parse(buf.toString('utf8') || '{}'); } catch (e) { throw Object.assign(new Error('JSON không hợp lệ'), { status: 400 }); }
}
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

/* ---------------- API ---------------- */
const routes = [];
const route = (method, pattern, opts, handler) => routes.push({ method, pattern, auth: !!opts.auth, handler });

// Nội dung website (công khai)
route('GET', /^\/api\/site$/, {}, (req, res) => ok(res, { ok: true, data: readJSON(FILES.site, null), server: true }));
route('PUT', /^\/api\/site$/, { auth: true }, async (req, res) => {
  const d = await readJsonBody(req, MAX_JSON);
  if (!isObj(d) || !isObj(d.general) || !Array.isArray(d.sections)) return fail(res, 400, 'Dữ liệu không hợp lệ');
  delete d.admin; // mật khẩu không bao giờ nằm trong dữ liệu công khai
  d.updatedAt = new Date().toISOString();
  await writeJSON(FILES.site, d);
  ok(res, { ok: true, updatedAt: d.updatedAt });
});

// Đăng nhập
route('GET', /^\/api\/me$/, {}, (req, res) => {
  const priv = readJSON(FILES.private, {});
  ok(res, { ok: true, loggedIn: isAuthed(req), mustChange: !!priv.mustChange });
});
route('POST', /^\/api\/login$/, {}, async (req, res) => {
  const ip = clientIp(req);
  if (limited('login:' + ip, 8, 15 * 60e3)) return fail(res, 429, 'Sai quá nhiều lần — thử lại sau 15 phút');
  const b = await readJsonBody(req);
  const priv = readJSON(FILES.private, {});
  if (!verifyPassword(str(b.password, 200), priv)) { await new Promise(r => setTimeout(r, 600)); return fail(res, 401, 'Sai mật khẩu'); }
  buckets.delete('login:' + ip);
  const s = createSession(!!b.remember);
  ok(res, { ok: true, mustChange: !!priv.mustChange }, { 'Set-Cookie': cookie(req, s.token, s.remember ? s.maxAge : null) });
});
route('POST', /^\/api\/logout$/, {}, (req, res) => { destroySession(req); ok(res, null, { 'Set-Cookie': cookie(req, '', 0) }); });
route('POST', /^\/api\/password$/, { auth: true }, async (req, res) => {
  const b = await readJsonBody(req);
  const priv = readJSON(FILES.private, {});
  if (!verifyPassword(str(b.old, 200), priv)) return fail(res, 400, 'Mật khẩu hiện tại không đúng');
  const pw = String(b.password || '');
  if (pw.length < 8) return fail(res, 400, 'Mật khẩu mới cần ít nhất 8 ký tự');
  await setPassword(pw, false);
  // Đăng xuất mọi phiên khác, giữ phiên hiện tại
  const keep = sha(getSessionToken(req)), sessions = readJSON(FILES.sessions, {});
  writeJSON(FILES.sessions, keep in sessions ? { [keep]: sessions[keep] } : {});
  ok(res);
});

// Tin nhắn liên hệ
route('POST', /^\/api\/messages$/, {}, async (req, res) => {
  const ip = clientIp(req);
  if (limited('msg:' + ip, 5, 10 * 60e3)) return fail(res, 429, 'Bạn gửi quá nhanh — vui lòng thử lại sau ít phút');
  const b = await readJsonBody(req);
  if (b.website) return ok(res); // bẫy bot (ô ẩn)
  const m = {
    id: 'm' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'),
    date: new Date().toISOString(), read: false,
    name: str(b.name, 80), phone: str(b.phone, 20), email: str(b.email, 120), uid: str(b.uid, 120),
    service: str(b.service, 120), message: str(b.message, 2000)
  };
  if (m.name.length < 2 || !/^[0-9+\s.()-]{8,20}$/.test(m.phone) || m.message.length < 5) return fail(res, 400, 'Thông tin chưa hợp lệ');
  const list = readJSON(FILES.messages, []);
  list.unshift(m); if (list.length > MAX_MESSAGES) list.length = MAX_MESSAGES;
  await writeJSON(FILES.messages, list);
  notifyTelegram(m).catch(() => {});
  ok(res);
});
route('GET', /^\/api\/messages$/, { auth: true }, (req, res) => ok(res, { ok: true, messages: readJSON(FILES.messages, []) }));
route('POST', /^\/api\/messages\/read-all$/, { auth: true }, async (req, res) => {
  const list = readJSON(FILES.messages, []); list.forEach(m => { m.read = true; });
  await writeJSON(FILES.messages, list); ok(res);
});
route('POST', /^\/api\/messages\/([\w-]+)\/read$/, { auth: true }, async (req, res, id) => {
  const b = await readJsonBody(req), list = readJSON(FILES.messages, []), m = list.find(x => x.id === id);
  if (!m) return fail(res, 404, 'Không tìm thấy');
  m.read = !!b.read; await writeJSON(FILES.messages, list); ok(res);
});
route('DELETE', /^\/api\/messages\/([\w-]+)$/, { auth: true }, async (req, res, id) => {
  await writeJSON(FILES.messages, readJSON(FILES.messages, []).filter(x => x.id !== id)); ok(res);
});
route('DELETE', /^\/api\/messages$/, { auth: true }, async (req, res) => { await writeJSON(FILES.messages, []); ok(res); });

// Thống kê truy cập
route('POST', /^\/api\/visit$/, {}, async (req, res) => {
  if (limited('visit:' + clientIp(req), 20, 60 * 60e3)) return ok(res);
  const s = readJSON(FILES.stats, { total: 0, days: {} });
  const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
  s.total = (s.total || 0) + 1; s.days = s.days || {}; s.days[day] = (s.days[day] || 0) + 1;
  const keys = Object.keys(s.days).sort(); while (keys.length > 400) delete s.days[keys.shift()];
  await writeJSON(FILES.stats, s); ok(res);
});
route('GET', /^\/api\/stats$/, { auth: true }, (req, res) => ok(res, { ok: true, stats: readJSON(FILES.stats, { total: 0, days: {} }) }));
route('DELETE', /^\/api\/stats$/, { auth: true }, async (req, res) => { await writeJSON(FILES.stats, { total: 0, days: {} }); ok(res); });

// Sao lưu / khôi phục
route('GET', /^\/api\/backup$/, { auth: true }, (req, res) => ok(res, { app: 'mysite', exportedAt: new Date().toISOString(), data: readJSON(FILES.site, null), messages: readJSON(FILES.messages, []) }));
route('POST', /^\/api\/backup$/, { auth: true }, async (req, res) => {
  const b = await readJsonBody(req, MAX_JSON * 3), d = b.data || b;
  if (!isObj(d) || !isObj(d.general) || !Array.isArray(d.sections)) return fail(res, 400, 'File sao lưu không hợp lệ');
  delete d.admin;
  await writeJSON(FILES.site, d);
  if (Array.isArray(b.messages)) await writeJSON(FILES.messages, b.messages.slice(0, MAX_MESSAGES));
  ok(res);
});
route('DELETE', /^\/api\/site$/, { auth: true }, async (req, res) => { // khôi phục mặc định
  cache.delete(FILES.site); await fsp.rm(FILES.site, { force: true }); ok(res);
});

// Telegram
function tgPublic() {
  const tg = (readJSON(FILES.private, {}).telegram) || {};
  return { enabled: !!tg.enabled, chatId: tg.chatId || '', hasToken: !!tg.token, tokenHint: tg.token ? tg.token.slice(0, 6) + '…' + tg.token.slice(-4) : '' };
}
route('GET', /^\/api\/telegram$/, { auth: true }, (req, res) => ok(res, { ok: true, telegram: tgPublic() }));
route('PUT', /^\/api\/telegram$/, { auth: true }, async (req, res) => {
  const b = await readJsonBody(req), priv = readJSON(FILES.private, {});
  const tg = priv.telegram || {};
  if (b.token != null && String(b.token).trim()) {
    const t = str(b.token, 100);
    if (!/^\d{5,}:[\w-]{20,}$/.test(t)) return fail(res, 400, 'Token bot không đúng định dạng (dạng 123456789:ABC...)');
    tg.token = t;
  }
  if (b.clearToken) tg.token = '';
  if (b.chatId != null) tg.chatId = str(b.chatId, 40);
  if (b.enabled != null) tg.enabled = !!b.enabled;
  priv.telegram = tg; await writeJSON(FILES.private, priv);
  ok(res, { ok: true, telegram: tgPublic() });
});
route('POST', /^\/api\/telegram\/detect$/, { auth: true }, async (req, res) => {
  const tg = (readJSON(FILES.private, {}).telegram) || {};
  if (!tg.token) return fail(res, 400, 'Chưa nhập token bot');
  const r = await telegram('getUpdates', tg.token, { limit: 50 });
  if (!r.ok) return fail(res, 400, 'Telegram báo lỗi: ' + (r.description || 'không rõ'));
  const chats = [];
  (r.result || []).reverse().forEach(u => {
    const c = (u.message || u.channel_post || u.my_chat_member || {}).chat;
    if (c && !chats.find(x => x.id === c.id)) chats.push({ id: String(c.id), title: c.title || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.username || '', type: c.type });
  });
  ok(res, { ok: true, chats });
});
route('POST', /^\/api\/telegram\/test$/, { auth: true }, async (req, res) => {
  const tg = (readJSON(FILES.private, {}).telegram) || {};
  if (!tg.token || !tg.chatId) return fail(res, 400, 'Cần nhập đủ token và Chat ID');
  const r = await telegram('sendMessage', tg.token, { chat_id: tg.chatId, text: '✅ Kết nối thành công! Website sẽ gửi đơn mới về đây.' });
  r.ok ? ok(res) : fail(res, 400, 'Telegram báo lỗi: ' + (r.description || 'không rõ'));
});

// Tải nhạc lên
const AUDIO_EXT = { 'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/aac': '.aac', 'audio/ogg': '.ogg', 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/webm': '.webm', 'audio/flac': '.flac' };
route('POST', /^\/api\/music$/, { auth: true }, async (req, res) => {
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  let ext = AUDIO_EXT[type];
  if (!ext) { const e = path.extname(decodeURIComponent(String(req.headers['x-filename'] || ''))).toLowerCase(); if (Object.values(AUDIO_EXT).includes(e)) ext = e; }
  if (!ext) return fail(res, 415, 'Chỉ nhận file âm thanh (mp3, m4a, ogg, wav…)');
  if (Number(req.headers['content-length'] || 0) > MAX_UPLOAD) return fail(res, 413, 'File quá lớn (tối đa 40 MB)');
  const name = crypto.randomBytes(8).toString('hex') + ext;
  const file = path.join(MUSIC_DIR, name);
  const buf = await readBody(req, MAX_UPLOAD);
  await fsp.writeFile(file, buf);
  ok(res, { ok: true, url: 'uploads/music/' + name, file: name, size: buf.length });
});
route('DELETE', /^\/api\/music\/([a-f0-9]{16}\.(?:mp3|m4a|aac|ogg|wav|webm|flac))$/, { auth: true }, async (req, res, name) => {
  await fsp.rm(path.join(MUSIC_DIR, name), { force: true }); ok(res);
});

/* ---------------- Phục vụ file tĩnh ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.webm': 'audio/webm', '.flac': 'audio/flac',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8'
};
// Chỉ các file/thư mục này được phép tải về — data/, server/, .git… luôn bị chặn
const PUBLIC_FILES = new Set(['/index.html', '/admin.html', '/favicon.ico', '/robots.txt']);
const PUBLIC_DIRS = ['/css/', '/js/', '/music/', '/uploads/', '/assets/'];

async function serveStatic(req, res, pathname) {
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/admin') pathname = '/admin.html';
  const allowed = PUBLIC_FILES.has(pathname) || PUBLIC_DIRS.some(d => pathname.startsWith(d));
  if (!allowed || pathname.includes('..') || /\/\./.test(pathname)) return send(res, 404, 'Không tìm thấy');
  const base = pathname.startsWith('/uploads/') ? UPLOAD_DIR : ROOT;
  const rel = pathname.startsWith('/uploads/') ? pathname.slice('/uploads/'.length) : pathname.slice(1);
  const file = path.resolve(base, rel);
  if (!file.startsWith(base + path.sep)) return send(res, 404, 'Không tìm thấy');
  let st;
  try { st = await fsp.stat(file); } catch (e) { return send(res, 404, 'Không tìm thấy'); }
  if (!st.isFile()) return send(res, 404, 'Không tìm thấy');

  const ext = path.extname(file).toLowerCase();
  const etag = 'W/"' + st.size.toString(16) + '-' + Math.floor(st.mtimeMs).toString(16) + '"';
  const longCache = pathname.startsWith('/uploads/') || pathname.startsWith('/music/');
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'ETag': etag, 'Last-Modified': st.mtime.toUTCString(), 'Accept-Ranges': 'bytes',
    'Cache-Control': longCache ? 'public, max-age=2592000' : 'no-cache'
  };
  if (pathname === '/admin.html') headers['X-Robots-Tag'] = 'noindex, nofollow';
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }

  // Hỗ trợ tua nhạc (HTTP Range)
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    let start = range[1] ? Number(range[1]) : st.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : st.size - 1;
    if (!range[1]) end = st.size - 1;
    if (start < 0 || start >= st.size || end >= st.size || start > end) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end(); }
    res.writeHead(206, Object.assign(headers, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + st.size, 'Content-Length': end - start + 1 }));
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, Object.assign(headers, { 'Content-Length': st.size }));
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

/* ---------------- Máy chủ ---------------- */
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return send(res, 400, 'URL không hợp lệ'); }

  try {
    if (pathname.startsWith('/api/')) {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = r.pattern.exec(pathname); if (!m) continue;
        if (r.auth) {
          if (!isAuthed(req)) return fail(res, 401, 'Chưa đăng nhập');
          // Chống CSRF: yêu cầu thay đổi dữ liệu phải có header riêng (form lạ không gửi được)
          if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'nova') return fail(res, 403, 'Yêu cầu không hợp lệ');
        }
        return await r.handler(req, res, ...m.slice(1));
      }
      return fail(res, 404, 'API không tồn tại');
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    await serveStatic(req, res, pathname);
  } catch (err) {
    console.error('[lỗi]', req.method, pathname, err.message);
    if (!res.headersSent) fail(res, err.status || 500, err.status ? err.message : 'Lỗi máy chủ');
  }
});

/* ---------------- Khởi động / lệnh dòng lệnh ---------------- */
async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(MUSIC_DIR, { recursive: true });

  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'set-password') {
    if (!arg || arg.length < 8) { console.error('Mật khẩu cần ít nhất 8 ký tự:  node server/server.js set-password "MatKhauMoi"'); process.exit(1); }
    await setPassword(arg, false);
    console.log('✅ Đã đặt mật khẩu quản trị mới.');
    process.exit(0);
  }

  const priv = readJSON(FILES.private, {});
  if (!priv.passwordHash) {
    const initial = process.env.ADMIN_PASSWORD || 'admin123';
    await setPassword(initial, !process.env.ADMIN_PASSWORD);
    console.log('🔑 Đã tạo mật khẩu quản trị ban đầu' + (process.env.ADMIN_PASSWORD ? ' từ ADMIN_PASSWORD.' : ': admin123 — HÃY ĐỔI NGAY!'));
  }

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') console.error('❌ Cổng ' + PORT + ' đang bị chương trình khác dùng. Đổi cổng bằng biến PORT hoặc tắt chương trình kia.');
    else console.error('❌ Không khởi động được:', err.message);
    process.exit(1);
  });
  server.listen(PORT, HOST, () => console.log('🚀 NOVA BOOST đang chạy tại http://' + HOST + ':' + PORT + '  (dữ liệu: ' + DATA_DIR + ')'));
}
main();
