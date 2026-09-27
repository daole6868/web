/* ==========================================================================
   admin.js — Trang quản trị: chỉnh sửa toàn bộ nội dung, giao diện, nhạc,
   bố cục; xem tin nhắn; sao lưu / khôi phục; đổi mật khẩu.
   Chạy cùng server/server.js: dữ liệu lưu trên máy chủ (VPS).
   Mở trực tiếp file trên máy: dữ liệu lưu trong trình duyệt (bản xem trước).
   ========================================================================== */
(async function () {
  'use strict';

  await Store.init();

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const THEME_KEY = 'mysite_admin_theme';

  let saved = Store.load();
  let draft = Store.clone(saved);
  let dirty = false;
  let page = 'dashboard';
  let msgCache = [];          // tin nhắn tải gần nhất (để hiện số chưa đọc)
  let mustChange = false;     // đang dùng mật khẩu mặc định
  let pendingDeletes = [];    // file nhạc chờ xoá khỏi máy chủ sau khi bấm Lưu
  const serverMode = Store.isServer();
  async function loadMessages() { msgCache = await Store.messages(); return msgCache; }

  /* ---------------- Tiện ích ---------------- */
  function getPath(o, path) { return path.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
  function setPath(o, path, v) {
    const ks = path.split('.'); let cur = o;
    ks.slice(0, -1).forEach(k => { if (cur[k] == null) cur[k] = {}; cur = cur[k]; });
    cur[ks[ks.length - 1]] = v;
  }
  function initials(name) {
    const w = String(name || '').trim().split(/\s+/);
    return ((w.length > 1 ? w[w.length - 2][0] : '') + (w[w.length - 1] || '?')[0]).toUpperCase();
  }
  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast--' + type : '');
    el.innerHTML = icon(type === 'ok' ? 'check' : type === 'err' ? 'x' : 'bell') + '<span>' + esc(msg) + '</span>';
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 2800);
  }
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------------- Hộp thoại ---------------- */
  let modalClose = null;
  function openModal(html, onClose) {
    $('#modal-box').innerHTML = '<button class="icon-btn modal__close" data-close aria-label="Đóng">' + icon('x') + '</button>' + html;
    $('#modal').classList.add('open'); $('#modal').setAttribute('aria-hidden', 'false');
    modalClose = onClose || null;
    setTimeout(() => { const f = $('#modal-box input, #modal-box textarea, #modal-box select'); if (f) f.focus(); }, 60);
  }
  function closeModal() {
    $('#modal').classList.remove('open'); $('#modal').setAttribute('aria-hidden', 'true');
    if (modalClose) { const fn = modalClose; modalClose = null; fn(); }
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise(res => {
      let answered = false;
      openModal('<h3>' + esc(title) + '</h3><p class="muted">' + esc(text) + '</p><div class="modal__actions">' +
        '<button class="btn btn--ghost" data-close>Huỷ</button><button class="btn ' + (danger ? 'btn--danger' : 'btn--primary') + '" id="cf-ok">' + esc(okLabel || 'Đồng ý') + '</button></div>',
        () => { if (!answered) res(false); });
      $('#cf-ok').onclick = () => { answered = true; closeModal(); res(true); };
    });
  }
  $('#modal').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal').classList.contains('open')) closeModal(); });

  /* ---------------- Trường nhập liệu ---------------- */
  // attr: 'data-path' (sửa trực tiếp draft) hoặc 'data-ipath' (sửa bản tạm trong hộp thoại)
  function field(f, val, attr) {
    attr = attr || 'data-path';
    const a = attr + '="' + f.key + '" data-type="' + f.type + '"';
    const id = 'f_' + f.key.replace(/\W/g, '_');
    const full = f.full || ['textarea', 'lines', 'icon', 'toggle'].indexOf(f.type) >= 0 && f.full !== false;
    const label = '<label for="' + id + '">' + esc(f.label) + '</label>';
    const hint = f.hint ? '<small class="field__hint">' + esc(f.hint) + '</small>' : '';
    let input;
    switch (f.type) {
      case 'textarea':
        input = '<textarea id="' + id + '" ' + a + ' rows="' + (f.rows || 3) + '" placeholder="' + esc(f.placeholder || '') + '">' + esc(val) + '</textarea>'; break;
      case 'lines':
        input = '<textarea id="' + id + '" ' + a + ' rows="' + (f.rows || 4) + '" placeholder="Mỗi dòng một mục">' + esc((val || []).join('\n')) + '</textarea>';
        if (!f.hint) f.hint = 'Mỗi dòng là một mục';
        return '<div class="field ' + (full ? 'full' : '') + '">' + label + input + '<small class="field__hint">' + esc(f.hint) + '</small></div>';
      case 'number':
        input = '<input id="' + id + '" type="number" ' + a + ' value="' + esc(val) + '">'; break;
      case 'color':
        input = '<div class="color-field"><input type="color" ' + a + ' value="' + esc(val) + '" aria-label="' + esc(f.label) + '"><input id="' + id + '" type="text" ' + a + ' value="' + esc(val) + '" maxlength="7"></div>'; break;
      case 'range':
        input = '<div class="range-field"><input id="' + id + '" type="range" ' + a + ' data-unit="' + (f.unit || '') + '" min="' + f.min + '" max="' + f.max + '" step="' + (f.step || 1) + '" value="' + esc(val) + '"><output>' + esc(val) + (f.unit || '') + '</output></div>'; break;
      case 'select':
        input = '<select id="' + id + '" ' + a + '>' + f.options.map(o => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>'; break;
      case 'toggle':
        return '<label class="toggle ' + (f.full === false ? '' : 'full') + '"><div><b>' + esc(f.label) + '</b>' + (f.hint ? '<small>' + esc(f.hint) + '</small>' : '') + '</div>' +
          '<span class="switch"><input type="checkbox" ' + a + (val ? ' checked' : '') + '><span></span></span></label>';
      case 'icon':
        input = '<input type="hidden" ' + a + ' value="' + esc(val) + '"><div class="icon-picker">' +
          SERVICE_ICONS.map(n => '<button type="button" data-pick="' + n + '" class="' + (n === val ? 'active' : '') + '" title="' + n + '">' + icon(n) + '</button>').join('') + '</div>'; break;
      default:
        input = '<input id="' + id + '" type="text" ' + a + ' value="' + esc(val) + '" placeholder="' + esc(f.placeholder || '') + '">';
    }
    return '<div class="field ' + (full ? 'full' : '') + '">' + label + input + hint + '</div>';
  }
  function parseInput(el) {
    const t = el.dataset.type;
    if (t === 'toggle') return el.checked;
    if (t === 'number' || t === 'range') return el.value === '' ? 0 : Number(el.value);
    if (t === 'lines') return el.value.split('\n').map(s => s.trim()).filter(Boolean);
    return el.value;
  }
  function form(fields, obj, attr) {
    return '<div class="form-grid">' + fields.map(f => field(f, getPath(obj, f.key), attr)).join('') + '</div>';
  }
  function panel(title, ic, desc, body, actions) {
    return '<section class="panel card"><div class="panel__head"><div><h2>' + icon(ic) + esc(title) + '</h2>' + (desc ? '<p>' + esc(desc) + '</p>' : '') + '</div>' + (actions || '') + '</div>' + body + '</section>';
  }

  // Ràng buộc chung: mọi thay đổi trong #view có data-path cập nhật draft
  function syncSiblings(el, root) {
    const t = el.dataset.type, key = el.dataset.path || el.dataset.ipath, at = el.dataset.path ? 'data-path' : 'data-ipath';
    if (t === 'color') $$('[' + at + '="' + key + '"]', root).forEach(x => { if (x !== el) x.value = el.value; });
    if (t === 'range') { const o = el.parentElement.querySelector('output'); const f = el.dataset.unit || ''; if (o) o.textContent = el.value + f; }
  }
  $('#view').addEventListener('input', e => {
    const el = e.target.closest('[data-path]'); if (!el) return;
    if (el.dataset.type === 'color' && !/^#[0-9a-f]{6}$/i.test(el.value)) return;
    setPath(draft, el.dataset.path, parseInput(el));
    syncSiblings(el, $('#view'));
    markDirty();
    if (PAGES[page].onChange) PAGES[page].onChange(el.dataset.path);
  });
  $('#view').addEventListener('change', e => { const el = e.target.closest('[data-path][data-type="toggle"], select[data-path]'); if (el) { setPath(draft, el.dataset.path, parseInput(el)); markDirty(); if (PAGES[page].onChange) PAGES[page].onChange(el.dataset.path); } });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pick]'); if (!b) return;
    const pick = b.closest('.field'); const hidden = $('input[type="hidden"]', pick);
    $$('[data-pick]', pick).forEach(x => x.classList.toggle('active', x === b));
    hidden.value = b.dataset.pick;
    hidden.dispatchEvent(new Event('input', { bubbles: true }));
  });

  /* ---------------- Trạng thái lưu ---------------- */
  function markDirty() {
    dirty = JSON.stringify(draft) !== JSON.stringify(saved);
    $('#dirty').hidden = !dirty; $('#discard').hidden = !dirty;
    $('#save').classList.toggle('pulse-save', dirty);
  }
  let saving = false;
  async function save() {
    if (saving) return;
    saving = true; $('#save').disabled = true;
    try {
      await Store.save(draft);
    } catch (err) {
      toast('Không lưu được: ' + err.message, 'err');
      if (err.status === 401) sessionExpired();
      return;
    } finally { saving = false; $('#save').disabled = false; }
    saved = Store.clone(draft); markDirty();
    pendingDeletes.splice(0).forEach(t => Store.deleteMusic(t));
    toast('Đã lưu thay đổi — trang chủ đã được cập nhật', 'ok');
    refreshChrome();
    try { new BroadcastChannel('mysite').postMessage('saved'); } catch (e) { /* noop */ }
  }
  function sessionExpired() {
    toast('Phiên đăng nhập đã hết — vui lòng đăng nhập lại (bản nháp vẫn được giữ)', 'err');
    $('#app').hidden = true; $('#login').hidden = false; $('#login-pw').value = ''; $('#login-pw').focus();
  }
  $('#save').innerHTML = icon('check') + '<span>Lưu thay đổi</span>';
  $('#save').onclick = save;
  $('#discard').onclick = async () => {
    if (!(await confirmBox('Huỷ thay đổi?', 'Mọi chỉnh sửa chưa lưu sẽ bị mất.', 'Huỷ thay đổi', true))) return;
    draft = Store.clone(saved); pendingDeletes = []; markDirty(); go(page); toast('Đã khôi phục bản đã lưu');
  };
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !$('#app').hidden) { e.preventDefault(); save(); } });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------------- Trình sửa danh sách (CRUD) dùng chung ---------------- */
  // cfg: { path, fields, title(it), sub(it), badge(it), iconOf(it), make(), name, toggleKey }
  function collection(cfg) {
    const arr = getPath(draft, cfg.path) || [];
    const rows = arr.map((it, i) =>
      '<div class="row' + (cfg.toggleKey && it[cfg.toggleKey] === false ? ' off' : '') + '" draggable="true" data-idx="' + i + '">' +
        '<span class="row__grip" title="Kéo để sắp xếp">' + icon('grip') + '</span>' +
        '<div class="row__icon">' + (cfg.iconOf ? cfg.iconOf(it, i) : (i + 1)) + '</div>' +
        '<div class="row__body"><b>' + esc(cfg.title(it)) + (cfg.badge ? cfg.badge(it) : '') + '</b><span>' + esc(cfg.sub ? cfg.sub(it) : '') + '</span></div>' +
        '<div class="row__actions">' +
          '<button class="mini-btn" data-act="up" title="Lên"' + (i === 0 ? ' disabled' : '') + '>' + icon('chevronUp') + '</button>' +
          '<button class="mini-btn" data-act="down" title="Xuống"' + (i === arr.length - 1 ? ' disabled' : '') + '>' + icon('chevronDown') + '</button>' +
          (cfg.toggleKey ? '<button class="mini-btn' + (it[cfg.toggleKey] !== false ? ' on' : '') + '" data-act="toggle" title="Ẩn / hiện">' + icon(it[cfg.toggleKey] !== false ? 'eye' : 'eyeOff') + '</button>' : '') +
          '<button class="mini-btn" data-act="edit" title="Sửa">' + icon('edit') + '</button>' +
          (cfg.fixed ? '' : '<button class="mini-btn" data-act="dup" title="Nhân bản">' + icon('copy') + '</button>' +
          '<button class="mini-btn danger" data-act="del" title="Xoá">' + icon('trash') + '</button>') +
        '</div></div>').join('');
    return '<div class="list" data-coll="' + cfg.path + '">' + (rows || '<div class="empty">' + icon('inbox') + '<div>Chưa có mục nào</div></div>') + '</div>' +
      (cfg.fixed ? '' : '<div style="margin-top:16px"><button class="btn btn--ghost" data-add="' + cfg.path + '">' + icon('plus') + 'Thêm ' + esc(cfg.name) + '</button></div>');
  }
  function bindCollection(cfg, rerender) {
    const list = $('[data-coll="' + cfg.path + '"]'); if (!list) return;
    const arr = () => getPath(draft, cfg.path);
    list.addEventListener('click', async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const i = +b.closest('.row').dataset.idx, a = arr();
      const act = b.dataset.act;
      if (act === 'up' && i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]];
      else if (act === 'down' && i < a.length - 1) [a[i + 1], a[i]] = [a[i], a[i + 1]];
      else if (act === 'toggle') a[i][cfg.toggleKey] = a[i][cfg.toggleKey] === false;
      else if (act === 'dup') { const c = Store.clone(a[i]); if (c.id) c.id = Store.uid('x'); a.splice(i + 1, 0, c); }
      else if (act === 'del') {
        if (!(await confirmBox('Xoá mục này?', '“' + cfg.title(a[i]) + '” sẽ bị xoá (bấm Lưu để áp dụng).', 'Xoá', true))) return;
        if (cfg.onDelete) cfg.onDelete(a[i]);
        a.splice(i, 1);
      }
      else if (act === 'edit') return editItem(cfg, i, rerender);
      markDirty(); rerender();
    });
    // Kéo – thả để sắp xếp
    let from = null;
    list.addEventListener('dragstart', e => { const r = e.target.closest('.row'); if (r) { from = +r.dataset.idx; e.dataTransfer.effectAllowed = 'move'; } });
    list.addEventListener('dragover', e => { const r = e.target.closest('.row'); if (r && from != null) { e.preventDefault(); $$('.row', list).forEach(x => x.classList.toggle('drag-over', x === r)); } });
    list.addEventListener('dragleave', e => { const r = e.target.closest('.row'); if (r) r.classList.remove('drag-over'); });
    list.addEventListener('drop', e => {
      const r = e.target.closest('.row'); if (!r || from == null) return;
      e.preventDefault(); const to = +r.dataset.idx, a = arr();
      if (to !== from) { const [m] = a.splice(from, 1); a.splice(to, 0, m); markDirty(); rerender(); }
      from = null;
    });
    const add = $('[data-add="' + cfg.path + '"]');
    if (add) add.onclick = () => { if (cfg.onAdd) return cfg.onAdd(rerender); editItem(cfg, -1, rerender); };
  }
  function editItem(cfg, i, rerender) {
    const a = getPath(draft, cfg.path);
    const temp = i >= 0 ? Store.clone(a[i]) : cfg.make();
    const fields = typeof cfg.fields === 'function' ? cfg.fields(temp) : cfg.fields;
    openModal('<h3>' + (i >= 0 ? 'Sửa ' : 'Thêm ') + esc(cfg.name) + '</h3><div id="item-form">' + form(fields, temp, 'data-ipath') + '</div>' +
      '<div class="modal__actions"><button class="btn btn--ghost" data-close>Huỷ</button><button class="btn btn--primary" id="item-ok">' + icon('check') + (i >= 0 ? 'Cập nhật' : 'Thêm mới') + '</button></div>');
    const box = $('#item-form');
    const onInput = e => {
      const el = e.target.closest('[data-ipath]'); if (!el) return;
      if (el.dataset.type === 'color' && !/^#[0-9a-f]{6}$/i.test(el.value)) return;
      setPath(temp, el.dataset.ipath, parseInput(el)); syncSiblings(el, box);
    };
    box.addEventListener('input', onInput); box.addEventListener('change', onInput);
    $('#item-ok').onclick = () => {
      const req = fields.find(f => f.required && !String(getPath(temp, f.key) || '').trim());
      if (req) { toast('Vui lòng nhập: ' + req.label, 'err'); return; }
      if (i >= 0) a[i] = temp; else a.push(temp);
      closeModal(); markDirty(); rerender();
      toast(i >= 0 ? 'Đã cập nhật (nhớ bấm Lưu)' : 'Đã thêm (nhớ bấm Lưu)', 'ok');
    };
  }

  /* ---------------- Định nghĩa các trang ---------------- */
  const REVEALS = [['fade-up', 'Trượt lên mờ dần'], ['zoom', 'Phóng to'], ['slide', 'Trượt ngang'], ['blur', 'Làm rõ từ mờ'], ['flip', 'Lật 3D'], ['none', 'Không hiệu ứng']];
  const EFFECTS = [['particles', 'Mạng hạt kết nối'], ['stars', 'Bầu trời sao'], ['waves', 'Sóng âm'], ['grid', 'Lưới kỹ thuật + vạch quét'], ['bokeh', 'Đèn neon nhoè (bokeh)'], ['snow', 'Tuyết rơi'], ['bubbles', 'Bong bóng'], ['none', 'Không có']];
  const FONTS = [['Be Vietnam Pro', 'Be Vietnam Pro (khuyên dùng)'], ['Montserrat', 'Montserrat'], ['Nunito', 'Nunito (mềm mại)'], ['Lexend', 'Lexend (dễ đọc)']];
  const PALETTES = [
    ['Tím Neon', '#7c5cff', '#22d3ee'], ['Hoàng hôn', '#f97316', '#ec4899'], ['Rừng xanh', '#10b981', '#84cc16'], ['Đại dương', '#3b82f6', '#06b6d4'],
    ['Hồng Pastel', '#ec4899', '#a78bfa'], ['Vàng Sang', '#f59e0b', '#ef4444'], ['Chàm', '#6366f1', '#8b5cf6'], ['Bạc hà', '#14b8a6', '#6366f1']
  ];

  const PAGES = {
    dashboard: {
      label: 'Tổng quan', icon: 'home', group: 'Chung', desc: 'Số liệu nhanh về website của bạn',
      async render() {
        const [st, msgs] = await Promise.all([Store.stats(), loadMessages()]), unread = msgs.filter(m => !m.read).length;
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          days.push({ label: i === 0 ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' }), v: (st.days || {})[k] || 0 });
        }
        const max = Math.max(1, ...days.map(d => d.v));
        const kpi = (ic, v, l) => '<div class="kpi card"><div class="kpi__icon">' + icon(ic) + '</div><div><b>' + v + '</b><span>' + l + '</span></div></div>';
        return '<div class="kpis">' +
          kpi('users', (st.total || 0).toLocaleString('vi-VN'), 'Tổng lượt truy cập') +
          kpi('chart', days[6].v, 'Lượt truy cập hôm nay') +
          kpi('inbox', unread + ' / ' + msgs.length, 'Tin nhắn chưa đọc') +
          kpi('layers', draft.services.filter(s => s.visible !== false).length, 'Dịch vụ đang hiển thị') +
        '</div><div class="grid-2">' +
          panel('Lượt truy cập 7 ngày', 'chart', serverMode ? 'Đếm mỗi phiên truy cập của khách' : 'Bản xem trước: chỉ đếm trên trình duyệt này', '<div class="chart">' + days.map((d, i) =>
            '<div class="chart__col"><div class="chart__bar" style="height:' + Math.max(3, d.v / max * 100) + '%;animation-delay:' + (i * 60) + 'ms"><em>' + d.v + '</em></div><small>' + esc(d.label) + '</small></div>').join('') + '</div>') +
          panel('Thao tác nhanh', 'zap', '', '<div class="quick">' +
            [['general', 'edit', 'Sửa nội dung'], ['theme', 'palette', 'Đổi màu sắc'], ['services', 'layers', 'Quản lý dịch vụ'], ['music', 'music', 'Nhạc nền'], ['sections', 'layout', 'Ẩn / hiện mục'], ['backup', 'download', 'Sao lưu']]
              .map(q => '<button data-go="' + q[0] + '">' + icon(q[1]) + q[2] + '</button>').join('') + '</div>') +
        '</div>' +
        panel('Tin nhắn mới nhất', 'inbox', '', msgs.length ? '<div class="list">' + msgs.slice(0, 4).map(m =>
          '<div class="row"><div class="row__icon">' + esc(initials(m.name)) + '</div><div class="row__body"><b>' + esc(m.name) + (m.read ? '' : '<span class="pill">Mới</span>') + '</b><span>' + esc(m.message) + '</span></div><small class="muted">' + fmtDate(m.date) + '</small></div>').join('') + '</div>'
          : '<div class="empty">' + icon('inbox') + '<div>Chưa có tin nhắn nào</div></div>', '<button class="btn btn--ghost btn--sm" data-go="messages">Xem tất cả</button>') +
        '<div class="tip">' + icon(serverMode ? 'shield' : 'lightbulb') + '<p>' + (serverMode
          ? '<b>Đang chạy trên máy chủ:</b> mỗi lần bấm <b>Lưu thay đổi</b> (hoặc Ctrl + S), mọi khách truy cập đều thấy nội dung mới ngay. Tin nhắn của khách được lưu trên máy chủ' + ' và báo về Telegram nếu bạn đã bật.'
          : '<b>Bản xem trước:</b> dữ liệu đang lưu trong trình duyệt này — khách khác sẽ không thấy. Khi đưa lên VPS (chạy <code>server/server.js</code>), mọi thay đổi sẽ áp dụng cho toàn bộ khách. Xem <b>DEPLOY.md</b>.') + '</p></div>';
      }
    },

    general: {
      label: 'Nội dung chung', icon: 'edit', group: 'Nội dung', desc: 'Tên website, phần đầu trang, giới thiệu, số liệu',
      render() {
        return panel('Thông tin website', 'globe', 'Tên thương hiệu, khẩu hiệu và mô tả SEO', form([
          { key: 'general.siteName', label: 'Tên website', type: 'text' },
          { key: 'general.logoText', label: 'Chữ trên logo', type: 'text', hint: 'Chữ cái đầu sẽ hiển thị trong ô logo' },
          { key: 'general.tagline', label: 'Khẩu hiệu (tagline)', type: 'text', full: true },
          { key: 'general.footerText', label: 'Giới thiệu ngắn ở chân trang', type: 'textarea', rows: 2 },
          { key: 'general.copyright', label: 'Dòng bản quyền cuối trang', type: 'text', full: true, hint: 'Viết {year} để tự hiện năm hiện tại. VD: © {year} NOVA BOOST. Mọi quyền được bảo lưu.' },
          { key: 'general.showAdminLink', label: 'Hiện liên kết “Quản trị” ở chân trang', type: 'toggle' }
        ], draft)) +
        panel('Khi gửi link website (Facebook, Zalo, Messenger, Google)', 'send', 'Tiêu đề, mô tả và ảnh hiện ra trong khung xem trước khi ai đó gửi link trang của bạn.',
          '<div class="grid-2" style="align-items:start"><div>' + form([
            { key: 'general.shareTitle', label: 'Tiêu đề', type: 'text', full: true, placeholder: (draft.general.siteName || '') + ' — ' + (draft.general.tagline || ''), hint: 'Để trống = Tên website — Khẩu hiệu' },
            { key: 'general.seoDescription', label: 'Mô tả', type: 'textarea', rows: 3, hint: 'Nên dài 1–2 câu (khoảng 150 ký tự).' },
            { key: 'general.shareImage', label: 'Ảnh xem trước', type: 'text', full: true, placeholder: 'https://… hoặc bấm “Tải ảnh lên”', hint: 'Khuyên dùng ảnh ngang 1200 × 630 px, dưới 5 MB.' }
          ], draft) +
          '<div class="toolbar" style="margin-top:12px"><label class="btn btn--ghost btn--sm file-btn">' + icon('upload') + 'Tải ảnh lên<input type="file" id="share-img" accept="image/png,image/jpeg,image/webp,image/gif"></label>' +
          '<button class="btn btn--ghost btn--sm" id="share-img-clear" type="button">' + icon('trash') + 'Bỏ ảnh</button></div></div>' +
          '<div><div class="share-card" id="share-preview"></div><p class="field__hint" style="margin-top:10px">Facebook/Zalo lưu tạm bản xem trước cũ. Sau khi đổi, xem mục <b>Làm mới bản xem trước</b> trong DEPLOY.md.</p></div></div>') +
        panel('Thanh thông báo', 'bell', 'Dải thông báo nổi bật ở đầu trang (khuyến mãi, tin mới…)', form([
          { key: 'general.announcement.enabled', label: 'Bật thanh thông báo', type: 'toggle' },
          { key: 'general.announcement.text', label: 'Nội dung', type: 'text', full: true },
          { key: 'general.announcement.linkText', label: 'Chữ trên liên kết', type: 'text' },
          { key: 'general.announcement.link', label: 'Liên kết đến', type: 'text', placeholder: '#contact hoặc https://...' }
        ], draft)) +
        panel('Phần đầu trang (Hero)', 'sparkles', 'Ấn tượng đầu tiên của khách truy cập', form([
          { key: 'general.hero.badge', label: 'Nhãn nhỏ phía trên', type: 'text' },
          { key: 'general.hero.title', label: 'Tiêu đề', type: 'text' },
          { key: 'general.hero.highlight', label: 'Phần tiêu đề nổi bật (màu gradient)', type: 'text' },
          { key: 'general.hero.typingPrefix', label: 'Chữ đứng trước hiệu ứng gõ phím', type: 'text' },
          { key: 'general.hero.typingWords', label: 'Các cụm từ chạy hiệu ứng gõ phím', type: 'lines', rows: 4 },
          { key: 'general.hero.subtitle', label: 'Mô tả', type: 'textarea' },
          { key: 'general.hero.ctaPrimary', label: 'Nút chính', type: 'text' },
          { key: 'general.hero.ctaSecondary', label: 'Nút phụ', type: 'text' },
          { key: 'general.hero.cardName', label: 'Tên trên thẻ hồ sơ', type: 'text' },
          { key: 'general.hero.cardRole', label: 'Chức danh trên thẻ', type: 'text' },
          { key: 'general.hero.cardInitials', label: 'Chữ viết tắt trong vòng tròn', type: 'text' },
          { key: 'general.hero.floatBadges', label: 'Nhãn bay quanh thẻ (tối đa 3)', type: 'lines', rows: 3 },
          { key: 'general.games', label: 'Các game nhận cày (dải chữ chạy dưới phần đầu trang)', type: 'lines', rows: 6, hint: 'Mỗi dòng một game — để trống nếu không muốn hiện dải chữ chạy' }
        ], draft)) +
        panel('Mục giới thiệu', 'user', '', form([
          { key: 'general.about.text', label: 'Đoạn giới thiệu', type: 'textarea', rows: 4 },
          { key: 'general.about.highlights', label: 'Điểm nổi bật', type: 'lines' },
          { key: 'general.about.tiles', label: 'Chữ trên 2 ô nhỏ cạnh ô kinh nghiệm', type: 'lines', rows: 2 },
          { key: 'general.about.experienceYears', label: 'Số năm kinh nghiệm', type: 'text' },
          { key: 'general.about.experienceLabel', label: 'Nhãn', type: 'text' }
        ], draft)) +
        panel('Số liệu ấn tượng', 'chart', 'Hiển thị dạng bộ đếm chạy số', collection(CFG.stats));
      },
      after() {
        bindCollection(CFG.stats, () => go('general', true));
        this.onChange();
        $('#share-img').onchange = async e => {
          const f = e.target.files[0]; if (!f) return;
          if (f.size > 5 * 1024 * 1024) return toast('Ảnh quá lớn (tối đa 5 MB)', 'err');
          try {
            toast('Đang tải ảnh lên…');
            draft.general.shareImage = await Store.uploadImage(f);
            $('[data-path="general.shareImage"]').value = draft.general.shareImage;
            markDirty(); this.onChange(); toast('Đã tải ảnh — bấm Lưu để áp dụng', 'ok');
          } catch (err) { toast(err.message, 'err'); }
        };
        $('#share-img-clear').onclick = () => { draft.general.shareImage = ''; $('[data-path="general.shareImage"]').value = ''; markDirty(); this.onChange(); };
      },
      onChange() {
        const g = draft.general, box = $('#share-preview'); if (!box) return;
        const title = g.shareTitle || [g.siteName, g.tagline].filter(Boolean).join(' — ');
        box.innerHTML = (g.shareImage ? '<div class="share-card__img" style="background-image:url(\'' + esc(g.shareImage).replace(/'/g, '%27') + '\')"></div>' : '<div class="share-card__img share-card__img--empty">' + icon('image') + '<span>Chưa có ảnh</span></div>') +
          '<div class="share-card__body"><small>' + esc(location.host || 'tenmien.com') + '</small><b>' + esc(title) + '</b><span>' + esc(g.seoDescription || '') + '</span></div>';
      }
    },

    theme: {
      label: 'Giao diện & Hiệu ứng', icon: 'palette', group: 'Nội dung', desc: 'Màu sắc, phông chữ, bo góc, hiệu ứng',
      render() {
        const t = draft.theme;
        return panel('Phong cách game', 'gamepad', 'Mỗi phong cách đổi toàn bộ bố cục trang trí, phông chữ, màu, hiệu ứng nền — lấy cảm hứng từ từng tựa game. Chọn xong vẫn tinh chỉnh màu bên dưới được.',
          '<div class="skins">' + Object.keys(SKINS).map(k => { const sk = SKINS[k]; return '<button class="skin-card' + (t.skin === k ? ' active' : '') + '" data-skinpick="' + k + '" style="--sb:' + sk.bg + ';--si:' + sk.ink + ';--sp:' + sk.primary + ';--sa:' + sk.accent + ';--sf:\'' + sk.display + '\'">' +
            '<div class="skin-card__art"><i></i><b>' + esc(sk.name) + '</b><span class="skin-card__btn">Thuê ngay</span></div>' +
            '<div class="skin-card__meta"><b>' + esc(sk.game) + '</b><small>' + esc(sk.tagline) + '</small></div>' + (t.skin === k ? '<span class="skin-card__check">' + icon('check') + '</span>' : '') + '</button>'; }).join('') + '</div>' +
          '<div style="margin-top:16px">' + form([{ key: 'theme.skinSwitcher', label: 'Hiện nút “Đổi phong cách” trên trang cho khách xem thử', type: 'toggle', hint: 'Khách chỉ đổi trên máy họ — không ảnh hưởng cài đặt của bạn' }], draft) + '</div>') +
        '<div class="grid-2"><div>' +
          panel('Bảng màu mẫu', 'palette', 'Chọn nhanh một cặp màu hài hoà', '<div class="swatches">' + PALETTES.map(p =>
            '<button class="swatch' + (t.primary === p[1] && t.accent === p[2] ? ' active' : '') + '" data-pal="' + p[1] + ',' + p[2] + '"><i style="background:linear-gradient(135deg,' + p[1] + ',' + p[2] + ')"></i><span>' + p[0] + '</span></button>').join('') + '</div>') +
          panel('Màu & kiểu dáng', 'settings', '', form([
            { key: 'theme.primary', label: 'Màu chính', type: 'color' },
            { key: 'theme.accent', label: 'Màu phụ', type: 'color' },
            { key: 'theme.mode', label: 'Chế độ mặc định', type: 'select', options: [['dark', '🌙 Tối'], ['light', '☀️ Sáng'], ['auto', '🖥️ Theo máy người xem']] },
            { key: 'theme.font', label: 'Phông chữ', type: 'select', options: FONTS },
            { key: 'theme.radius', label: 'Độ bo góc', type: 'range', min: 0, max: 28, unit: 'px', full: true },
            { key: 'theme.cardStyle', label: 'Kiểu thẻ', type: 'select', options: [['glass', 'Kính mờ (glass)'], ['solid', 'Nền đặc'], ['outline', 'Viền mảnh']] },
            { key: 'theme.heroLayout', label: 'Bố cục phần đầu', type: 'select', options: [['split', 'Chia 2 cột + thẻ hồ sơ'], ['center', 'Căn giữa tối giản']] }
          ], draft)) +
        '</div><div>' +
          panel('Xem trước', 'eye', 'Cập nhật ngay khi bạn chỉnh', '<div class="preview" id="preview"></div>') +
          panel('Hiệu ứng', 'sparkles', '', form([
            { key: 'theme.effect', label: 'Hiệu ứng nền', type: 'select', options: EFFECTS },
            { key: 'theme.revealStyle', label: 'Kiểu xuất hiện khi cuộn', type: 'select', options: REVEALS },
            { key: 'theme.preloader', label: 'Màn hình tải trang', type: 'toggle', hint: 'Logo xoay khi mở trang' },
            { key: 'theme.welcomeGate', label: 'Màn hình chào “Vào trang”', type: 'toggle', hint: 'Khách bấm vào trang → nhạc tự phát' },
            { key: 'theme.cursorGlow', label: 'Vầng sáng theo chuột', type: 'toggle' },
            { key: 'theme.tilt', label: 'Thẻ nghiêng 3D khi rê chuột', type: 'toggle' },
            { key: 'theme.audioReactive', label: 'Nền “nhún” theo nhạc', type: 'toggle' },
            { key: 'theme.animations', label: 'Bật chuyển động trang trí', type: 'toggle', hint: 'Tắt nếu muốn trang tĩnh, nhẹ hơn' }
          ], draft)) +
        '</div></div>';
      },
      after() {
        this.onChange();
        $$('[data-skinpick]').forEach(b => b.onclick = () => {
          const k = b.dataset.skinpick, sk = SKINS[k];
          Object.assign(draft.theme, { skin: k, primary: sk.primary, accent: sk.accent, font: sk.font, effect: sk.effect, radius: sk.radius, mode: sk.mode });
          markDirty(); go('theme', true); toast('Đã chọn phong cách ' + sk.game + ' — bấm Lưu để áp dụng', 'ok');
        });
        $$('[data-pal]').forEach(b => b.onclick = () => {
          const [p, a] = b.dataset.pal.split(',');
          draft.theme.primary = p; draft.theme.accent = a; markDirty(); go('theme', true);
        });
      },
      onChange() {
        const t = draft.theme, pv = $('#preview'); if (!pv) return;
        pv.style.setProperty('--pv-p', t.primary); pv.style.setProperty('--pv-a', t.accent);
        pv.style.setProperty('--pv-radius', t.radius + 'px'); pv.style.setProperty('--pv-font', "'" + t.font + "', sans-serif");
        const h = draft.general.hero;
        pv.innerHTML = '<div class="preview__blob"></div><h3>' + esc(h.title) + ' <em>' + esc(h.highlight) + '</em></h3><p>' + esc(h.subtitle) + '</p>' +
          '<div class="preview__btns"><span class="preview__btn">' + esc(h.ctaPrimary) + '</span><span class="preview__btn preview__btn--ghost">' + esc(h.ctaSecondary) + '</span></div>' +
          '<div class="preview__card"><i>' + icon('code') + '</i><div><b>' + esc((draft.services[0] || {}).title || 'Dịch vụ') + '</b><div class="muted" style="font-size:.85rem">' + esc((draft.services[0] || {}).price || '') + '</div></div></div>';
        $$('[data-pal]').forEach(b => b.classList.toggle('active', b.dataset.pal === t.primary + ',' + t.accent));
        applyAdminAccent();
      }
    },

    sections: {
      label: 'Bố cục & Mục', icon: 'layout', group: 'Nội dung', desc: 'Ẩn / hiện, sắp xếp và đổi tên các mục trên trang',
      render() {
        return panel('Các mục trên trang chủ', 'layout', 'Kéo thả hoặc dùng mũi tên để sắp xếp. Bấm con mắt để ẩn/hiện. Mục “Trang chủ” luôn ở đầu.', collection(CFG.sections));
      },
      after() { bindCollection(CFG.sections, () => { const h = draft.sections.findIndex(s => s.id === 'hero'); if (h > 0) draft.sections.unshift(draft.sections.splice(h, 1)[0]); go('sections', true); }); }
    },

    services: {
      label: 'Dịch vụ', icon: 'layers', group: 'Nội dung', desc: 'Thêm, sửa, xoá và sắp xếp dịch vụ',
      render() { return panel('Danh sách dịch vụ', 'layers', 'Dịch vụ “Nổi bật” sẽ có nhãn riêng. Nhóm (danh mục) tạo bộ lọc tự động.', collection(CFG.services)); },
      after() { bindCollection(CFG.services, () => go('services', true)); }
    },
    process: {
      label: 'Quy trình', icon: 'rocket', group: 'Nội dung', desc: 'Các bước làm việc với khách hàng',
      render() { return panel('Các bước', 'rocket', '', collection(CFG.process)); },
      after() { bindCollection(CFG.process, () => go('process', true)); }
    },
    pricing: {
      label: 'Bảng giá', icon: 'tag', group: 'Nội dung', desc: 'Các gói dịch vụ',
      render() { return panel('Các gói', 'tag', 'Gói được đánh dấu “Nổi bật” sẽ phóng to và có viền gradient.', collection(CFG.pricing)); },
      after() { bindCollection(CFG.pricing, () => go('pricing', true)); }
    },
    testimonials: {
      label: 'Đánh giá', icon: 'star', group: 'Nội dung', desc: 'Cảm nhận của khách hàng',
      render() { return panel('Đánh giá khách hàng', 'quote', '', collection(CFG.testimonials)); },
      after() { bindCollection(CFG.testimonials, () => go('testimonials', true)); }
    },
    faq: {
      label: 'Hỏi đáp', icon: 'help', group: 'Nội dung', desc: 'Câu hỏi thường gặp',
      render() { return panel('Câu hỏi thường gặp', 'help', '', collection(CFG.faq)); },
      after() { bindCollection(CFG.faq, () => go('faq', true)); }
    },

    contact: {
      label: 'Liên hệ', icon: 'phone', group: 'Nội dung', desc: 'Thông tin liên hệ, mạng xã hội, bản đồ',
      render() {
        return panel('Thông tin liên hệ', 'phone', '', form([
          { key: 'contact.phone', label: 'Số điện thoại', type: 'text' },
          { key: 'contact.email', label: 'Email', type: 'text' },
          { key: 'contact.zalo', label: 'Số Zalo', type: 'text' },
          { key: 'contact.messenger', label: 'Link Messenger', type: 'text', placeholder: 'https://m.me/tenfanpage' },
          { key: 'contact.address', label: 'Địa chỉ', type: 'text', full: true },
          { key: 'contact.hours', label: 'Giờ làm việc', type: 'text' },
          { key: 'contact.mapQuery', label: 'Địa điểm trên bản đồ', type: 'text', hint: 'Nhập địa chỉ hoặc tên địa điểm để hiện Google Maps' }
        ], draft)) +
        panel('Mạng xã hội', 'globe', 'Để trống nếu không dùng', form([
          { key: 'contact.socials.facebook', label: 'Facebook', type: 'text' },
          { key: 'contact.socials.youtube', label: 'YouTube', type: 'text' },
          { key: 'contact.socials.tiktok', label: 'TikTok', type: 'text' },
          { key: 'contact.socials.instagram', label: 'Instagram', type: 'text' }
        ], draft)) +
        panel('Tuỳ chọn hiển thị', 'settings', '', form([
          { key: 'contact.showForm', label: 'Hiện form gửi lời nhắn', type: 'toggle', full: false },
          { key: 'contact.showMap', label: 'Hiện bản đồ', type: 'toggle', full: false },
          { key: 'contact.floatingButtons', label: 'Nút gọi / Zalo / Messenger nổi góc màn hình', type: 'toggle' }
        ], draft));
      }
    },

    music: {
      label: 'Âm nhạc', icon: 'music', group: 'Nội dung', desc: 'Nhạc nền và danh sách phát',
      render() {
        return panel('Cài đặt trình phát', 'settings', '', form([
          { key: 'music.enabled', label: 'Bật trình phát nhạc', type: 'toggle', full: false },
          { key: 'music.autoplay', label: 'Tự phát khi khách chạm vào trang', type: 'toggle', full: false, hint: 'Trình duyệt chặn tự phát tuyệt đối — nhạc sẽ bắt đầu ở lần chạm/nhấp đầu tiên' },
          { key: 'music.showVisualizer', label: 'Hiện sóng nhạc (visualizer)', type: 'toggle', full: false },
          { key: 'music.shuffle', label: 'Phát ngẫu nhiên', type: 'toggle', full: false },
          { key: 'music.volume', label: 'Âm lượng mặc định', type: 'range', min: 0, max: 1, step: 0.05, full: true }
        ], draft)) +
        panel('Danh sách phát', 'playlist', 'Nhạc “Tích hợp” được tạo trực tiếp bằng trình duyệt — không cần file, không lo bản quyền. Bạn có thể thêm file MP3 của mình hoặc link nhạc.',
          collection(CFG.tracks) +
          '<div class="toolbar" style="margin-top:12px">' +
            '<label class="btn btn--ghost file-btn">' + icon('upload') + 'Tải file nhạc lên<input type="file" id="music-upload" accept="audio/*" multiple></label>' +
            '<button class="btn btn--ghost" id="add-url">' + icon('globe') + 'Thêm link nhạc</button>' +
            '<button class="btn btn--ghost" id="stop-preview">' + icon('pause') + 'Dừng nghe thử</button>' +
          '</div>');
      },
      after() {
        const rr = () => go('music', true);
        bindCollection(CFG.tracks, rr);
        $$('[data-preview]').forEach(b => b.onclick = e => {
          e.stopPropagation();
          MusicPlayer.tracks = draft.music.tracks; MusicPlayer.setVolume(draft.music.volume || 0.5);
          MusicPlayer.play(+b.dataset.preview); toast('Đang nghe thử: ' + draft.music.tracks[+b.dataset.preview].title);
        });
        $('#stop-preview').onclick = () => MusicPlayer.pause();
        $('#add-url').onclick = () => editItem(Object.assign({}, CFG.tracks, { make: () => ({ id: Store.uid('t'), type: 'url', title: '', artist: '', url: '' }) }), -1, rr);
        $('#music-upload').onchange = async e => {
          const files = Array.from(e.target.files || []);
          let added = 0;
          for (const f of files) {
            if (f.size > 40 * 1024 * 1024) { toast('File quá lớn (>40MB): ' + f.name, 'err'); continue; }
            toast('Đang tải lên: ' + f.name + '…');
            try {
              const t = await Store.uploadMusic(f);
              draft.music.tracks.push(Object.assign(t, { title: f.name.replace(/\.[^.]+$/, ''), artist: 'Tải lên' }));
              added++;
            } catch (err) { toast('Không tải lên được ' + f.name + ': ' + err.message, 'err'); }
          }
          markDirty(); rr(); if (added) toast('Đã thêm ' + added + ' bài — bấm Lưu để áp dụng', 'ok');
        };
      }
    },

    messages: {
      label: 'Tin nhắn', icon: 'inbox', group: 'Khách hàng', desc: 'Lời nhắn khách gửi qua form liên hệ',
      filter: 'all', q: '',
      async render() {
        const all = await loadMessages();
        const q = this.q.toLowerCase();
        const list = all.filter(m => (this.filter === 'all' || !m.read) && (!q || JSON.stringify(m).toLowerCase().indexOf(q) >= 0));
        return panel('Hộp thư', 'inbox', all.length + ' tin nhắn • ' + all.filter(m => !m.read).length + ' chưa đọc',
          '<div class="toolbar" style="margin-bottom:18px"><div class="seg"><button data-f="all" class="' + (this.filter === 'all' ? 'active' : '') + '">Tất cả</button><button data-f="unread" class="' + (this.filter === 'unread' ? 'active' : '') + '">Chưa đọc</button></div>' +
          '<div class="search">' + icon('search') + '<input id="msg-q" placeholder="Tìm tên, SĐT, nội dung..." value="' + esc(this.q) + '"></div></div>' +
          (list.length ? '<div class="list">' + list.map(m =>
            '<div class="msg' + (m.read ? '' : ' unread') + '" data-id="' + m.id + '"><div class="msg__head"><div class="avatar">' + esc(initials(m.name)) + '</div>' +
            '<div class="msg__who"><b>' + esc(m.name) + (m.read ? '' : '<span class="pill">Mới</span>') + (m.service ? '<span class="pill pill--gray">' + esc(m.service) + '</span>' : '') + (m.uid ? '<span class="pill pill--amber">' + esc(m.uid) + '</span>' : '') + '</b><span>' + fmtDate(m.date) + '</span></div>' +
            '<div class="row__actions"><button class="mini-btn" data-m="read" title="' + (m.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc') + '">' + icon(m.read ? 'eyeOff' : 'check') + '</button><button class="mini-btn danger" data-m="del" title="Xoá">' + icon('trash') + '</button></div></div>' +
            '<div class="msg__meta"><a href="tel:' + esc(m.phone) + '">' + icon('phone') + esc(m.phone) + '</a>' + (m.email ? '<a href="mailto:' + esc(m.email) + '">' + icon('mail') + esc(m.email) + '</a>' : '') +
            '<a href="https://zalo.me/' + esc(String(m.phone).replace(/\D/g, '')) + '" target="_blank" rel="noopener">' + icon('message') + 'Nhắn Zalo</a></div>' +
            '<div class="msg__body">' + esc(m.message) + '</div></div>').join('') + '</div>'
            : '<div class="empty">' + icon('inbox') + '<div>' + (all.length ? 'Không có tin nhắn phù hợp' : 'Chưa có tin nhắn. Thử gửi một lời nhắn từ form liên hệ trên trang chủ!') + '</div></div>'),
          '<div class="toolbar"><button class="btn btn--ghost btn--sm" id="msg-readall">' + icon('check') + 'Đọc hết</button><button class="btn btn--ghost btn--sm" id="msg-csv">' + icon('download') + 'Xuất Excel (CSV)</button><button class="btn btn--danger btn--sm" id="msg-clear">' + icon('trash') + 'Xoá hết</button></div>');
      },
      after() {
        const self = this, rr = () => { go('messages', true); refreshChrome(); };
        $$('[data-f]').forEach(b => b.onclick = () => { self.filter = b.dataset.f; rr(); });
        const qi = $('#msg-q'); qi.oninput = () => { self.q = qi.value; clearTimeout(self._t); self._t = setTimeout(() => { rr(); const n = $('#msg-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
        const act = async fn => { try { await fn(); rr(); } catch (err) { toast(err.message, 'err'); if (err.status === 401) sessionExpired(); } };
        $('#view').onclick = async e => {
          const b = e.target.closest('[data-m]'); if (!b) return;
          const id = b.closest('.msg').dataset.id, m = msgCache.find(x => x.id === id); if (!m) return;
          if (b.dataset.m === 'read') act(() => Store.setRead(id, !m.read));
          if (b.dataset.m === 'del' && await confirmBox('Xoá tin nhắn?', 'Tin nhắn của ' + m.name + ' sẽ bị xoá vĩnh viễn.', 'Xoá', true)) { await act(() => Store.deleteMessage(id)); toast('Đã xoá tin nhắn'); }
        };
        $('#msg-readall').onclick = () => act(() => Store.readAll());
        $('#msg-clear').onclick = async () => { if (await confirmBox('Xoá tất cả tin nhắn?', 'Không thể hoàn tác.', 'Xoá hết', true)) act(() => Store.clearMessages()); };
        $('#msg-csv').onclick = () => {
          const rows = [['Ngày', 'Họ tên', 'Điện thoại', 'Game / Server / UID', 'Email', 'Dịch vụ', 'Nội dung', 'Đã đọc']].concat(msgCache.map(m => [fmtDate(m.date), m.name, m.phone, m.uid, m.email, m.service, m.message, m.read ? 'Có' : 'Chưa']));
          const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n');
          download('tin-nhan-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
        };
      },
      leave() { $('#view').onclick = null; }
    },

    telegram: {
      label: 'Thông báo Telegram', icon: 'send', group: 'Hệ thống', desc: 'Nhận đơn mới qua Telegram',
      async render() {
        if (!serverMode) return panel('Thông báo Telegram', 'send', '', '<div class="tip">' + icon('lightbulb') + '<p>Tính năng này hoạt động khi website chạy trên VPS (cùng <code>server/server.js</code>). Ở bản xem trước trên máy, tin nhắn chỉ lưu trong trình duyệt.</p></div>');
        const tg = await Store.telegram.get();
        return '<div class="grid-2"><div>' +
          panel('Cài đặt bot', 'settings', 'Khi khách gửi form liên hệ, bot sẽ nhắn ngay cho bạn.',
            '<div class="form-grid">' +
              '<label class="toggle full"><div><b>Bật thông báo Telegram</b><small>' + (tg.enabled ? 'Đang bật' : 'Đang tắt') + '</small></div><span class="switch"><input type="checkbox" id="tg-enabled"' + (tg.enabled ? ' checked' : '') + '><span></span></span></label>' +
              '<div class="field full"><label for="tg-token">Token bot</label><input id="tg-token" type="password" autocomplete="off" placeholder="' + (tg.hasToken ? 'Đã lưu: ' + esc(tg.tokenHint) + ' — để trống nếu không đổi' : '123456789:AAH...') + '"><small class="field__hint">Token chỉ lưu trên máy chủ, không bao giờ hiện ra trang web.</small></div>' +
              '<div class="field full"><label for="tg-chat">Chat ID</label><div class="color-field"><input id="tg-chat" value="' + esc(tg.chatId) + '" placeholder="VD: 123456789 hoặc -100123… (nhóm)"><button class="btn btn--ghost" id="tg-detect" type="button">' + icon('search') + 'Tự tìm</button></div></div>' +
            '</div>' +
            '<div class="toolbar" style="margin-top:18px"><button class="btn btn--primary" id="tg-save">' + icon('check') + 'Lưu cài đặt</button><button class="btn btn--ghost" id="tg-test">' + icon('send') + 'Gửi thử</button></div>' +
            '<div id="tg-chats" style="margin-top:14px"></div>') +
        '</div><div>' +
          panel('Hướng dẫn 1 phút', 'help', '',
            '<ol style="margin:0;padding-left:20px;display:grid;gap:10px;color:var(--muted)">' +
              '<li>Mở Telegram, tìm <b>@BotFather</b> → gửi <code>/newbot</code> → đặt tên → nhận <b>token</b>.</li>' +
              '<li>Dán token vào ô bên trái → bấm <b>Lưu cài đặt</b>.</li>' +
              '<li>Mở bot vừa tạo và bấm <b>Start</b> (hoặc thêm bot vào nhóm và nhắn 1 tin trong nhóm).</li>' +
              '<li>Bấm <b>Tự tìm</b> để lấy Chat ID → chọn → <b>Lưu cài đặt</b>.</li>' +
              '<li>Bật công tắc, bấm <b>Gửi thử</b> — điện thoại sẽ nhận tin ✅.</li>' +
            '</ol>') +
        '</div></div>';
      },
      after() {
        if (!serverMode) return;
        const saveTg = async quiet => {
          const body = { enabled: $('#tg-enabled').checked, chatId: $('#tg-chat').value.trim() };
          const tok = $('#tg-token').value.trim(); if (tok) body.token = tok;
          await Store.telegram.save(body); if (!quiet) toast('Đã lưu cài đặt Telegram', 'ok');
        };
        $('#tg-save').onclick = async () => { try { await saveTg(); go('telegram', true); } catch (err) { toast(err.message, 'err'); } };
        $('#tg-test').onclick = async () => { try { await saveTg(true); await Store.telegram.test(); toast('Đã gửi tin thử — kiểm tra Telegram nhé!', 'ok'); } catch (err) { toast(err.message, 'err'); } };
        $('#tg-detect').onclick = async () => {
          try {
            if ($('#tg-token').value.trim()) await saveTg(true);
            const chats = await Store.telegram.detect();
            $('#tg-chats').innerHTML = chats.length ? '<div class="list">' + chats.map(c => '<button class="row" data-chat="' + esc(c.id) + '" style="text-align:left"><div class="row__icon">' + icon(c.type === 'private' ? 'user' : 'users') + '</div><div class="row__body"><b>' + esc(c.title || c.id) + '</b><span>' + esc(c.type) + ' • ' + esc(c.id) + '</span></div></button>').join('') + '</div>'
              : '<div class="tip">' + icon('help') + '<p>Chưa thấy cuộc trò chuyện nào. Hãy mở bot và bấm <b>Start</b> (hoặc nhắn 1 tin), rồi bấm <b>Tự tìm</b> lại.</p></div>';
            $$('[data-chat]').forEach(b => b.onclick = () => { $('#tg-chat').value = b.dataset.chat; toast('Đã chọn — bấm Lưu cài đặt'); });
          } catch (err) { toast(err.message, 'err'); }
        };
      }
    },

    backup: {
      label: 'Sao lưu & Bảo mật', icon: 'shield', group: 'Hệ thống', desc: 'Xuất / nhập dữ liệu, đổi mật khẩu',
      render() {
        return '<div class="grid-2"><div>' +
          panel('Sao lưu dữ liệu', 'download', 'Tải toàn bộ cấu hình website thành file .json để lưu trữ hoặc chuyển sang máy khác.',
            '<div class="toolbar"><button class="btn btn--primary" id="bk-export">' + icon('download') + 'Tải file sao lưu</button>' +
            '<label class="btn btn--ghost file-btn">' + icon('upload') + 'Khôi phục từ file<input type="file" id="bk-import" accept=".json,application/json"></label></div>' +
            '<p class="field__hint" style="margin-top:14px">Lưu ý: file sao lưu gồm nội dung + tin nhắn. File nhạc tải lên không nằm trong đó' + (serverMode ? ' (chúng ở thư mục uploads/ trên VPS).' : '.') + '</p>') +
          panel('Khôi phục mặc định', 'repeat', 'Đưa toàn bộ nội dung & giao diện về mẫu ban đầu.',
            '<div class="toolbar"><button class="btn btn--danger" id="bk-reset">' + icon('trash') + 'Khôi phục mặc định</button><button class="btn btn--ghost" id="bk-stats">' + icon('chart') + 'Xoá thống kê truy cập</button></div>') +
        '</div><div>' +
          panel('Đổi mật khẩu quản trị', 'lock', mustChange ? 'Bạn đang dùng mật khẩu mặc định “admin123” — hãy đổi ngay!' : 'Bạn đang dùng mật khẩu riêng.',
            '<div class="form-grid"><div class="field full"><label>Mật khẩu hiện tại</label><input type="password" id="pw-old"></div>' +
            '<div class="field"><label>Mật khẩu mới</label><input type="password" id="pw-new"></div><div class="field"><label>Nhập lại</label><input type="password" id="pw-new2"></div></div>' +
            '<div style="margin-top:16px"><button class="btn btn--primary" id="pw-save">' + icon('check') + 'Đổi mật khẩu</button></div>') +
          '<div class="tip">' + icon('shield') + '<p>' + (serverMode
            ? 'Mật khẩu được mã hoá và kiểm tra trên máy chủ. Đổi mật khẩu sẽ đăng xuất mọi thiết bị khác. Quên mật khẩu? Đặt lại trên VPS bằng lệnh trong <b>DEPLOY.md</b>.'
            : 'Đây là <b>bản xem trước</b> — mật khẩu chỉ bảo vệ trên trình duyệt này. Khi chạy trên VPS, mật khẩu được kiểm tra trên máy chủ.') + '</p></div>' +
        '</div></div>';
      },
      after() {
        $('#bk-export').onclick = async () => {
          let payload;
          try { payload = await Store.exportBackup(); } catch (err) { return toast(err.message, 'err'); }
          download('sao-luu-website-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(payload, null, 2));
          toast('Đã tải file sao lưu', 'ok');
        };
        $('#bk-import').onchange = e => {
          const f = e.target.files[0]; if (!f) return;
          const rd = new FileReader();
          rd.onload = async () => {
            try {
              let j;
              try { j = JSON.parse(rd.result); } catch (err) { return toast('File không hợp lệ', 'err'); }
              const d = j.data || j;
              if (!d || !d.general || !d.sections) return toast('File không hợp lệ', 'err');
              if (!(await confirmBox('Khôi phục dữ liệu?', 'Nội dung hiện tại sẽ bị thay thế bằng dữ liệu trong file.', 'Khôi phục'))) return;
              await Store.importBackup(j);
              saved = Store.load(); draft = Store.clone(saved); markDirty(); refreshChrome(); go('dashboard');
              toast('Khôi phục thành công', 'ok');
            } catch (err) { toast('Không khôi phục được: ' + err.message, 'err'); }
          };
          rd.readAsText(f);
        };
        $('#bk-reset').onclick = async () => {
          if (!(await confirmBox('Khôi phục mặc định?', 'Toàn bộ nội dung sẽ trở về mẫu ban đầu (tin nhắn và mật khẩu được giữ lại).', 'Khôi phục', true))) return;
          try { await Store.reset(); } catch (err) { return toast(err.message, 'err'); }
          saved = Store.load(); draft = Store.clone(saved); markDirty(); refreshChrome(); go('backup');
          toast('Đã khôi phục mặc định', 'ok');
        };
        $('#bk-stats').onclick = async () => { if (await confirmBox('Xoá thống kê?', 'Số lượt truy cập sẽ về 0.', 'Xoá', true)) { try { await Store.clearStats(); toast('Đã xoá thống kê'); } catch (err) { toast(err.message, 'err'); } } };
        $('#pw-save').onclick = async () => {
          const o = $('#pw-old').value, n = $('#pw-new').value, n2 = $('#pw-new2').value;
          if (n.length < 8) return toast('Mật khẩu mới cần ít nhất 8 ký tự', 'err');
          if (n !== n2) return toast('Mật khẩu nhập lại không khớp', 'err');
          try { await Store.changePassword(o, n); } catch (err) { return toast(err.message, 'err'); }
          mustChange = false;
          const adm = Store.load().admin; if (adm) { saved.admin = adm; draft.admin = Store.clone(adm); }
          markDirty(); go('backup', true);
          toast('Đã đổi mật khẩu', 'ok');
        };
      }
    }
  };

  /* ---------------- Cấu hình các danh sách ---------------- */
  const CFG = {
    stats: {
      path: 'general.stats', name: 'số liệu', make: () => ({ value: 100, suffix: '+', label: 'Số liệu mới' }),
      title: it => it.value + (it.suffix || '') + ' — ' + it.label, iconOf: () => icon('chart'),
      fields: [{ key: 'value', label: 'Con số', type: 'number' }, { key: 'suffix', label: 'Hậu tố (+, %, /7…)', type: 'text' }, { key: 'label', label: 'Nhãn', type: 'text', full: true, required: true }]
    },
    sections: {
      path: 'sections', name: 'mục', toggleKey: 'visible',
      title: it => it.name, sub: it => it.id === 'hero' ? 'Phần đầu trang' : (it.title + (it.subtitle ? ' — ' + it.subtitle : '')),
      iconOf: it => icon({ hero: 'home', about: 'user', services: 'layers', process: 'rocket', pricing: 'tag', testimonials: 'star', faq: 'help', contact: 'phone' }[it.id] || 'layout'),
      fields: it => [{ key: 'name', label: 'Tên trên menu', type: 'text', required: true }].concat(it.id === 'hero' ? [] : [
        { key: 'title', label: 'Tiêu đề mục', type: 'text' }, { key: 'subtitle', label: 'Mô tả ngắn', type: 'textarea', rows: 2 }]),
      fixed: true, make: () => ({})
    },
    services: {
      path: 'services', name: 'dịch vụ', toggleKey: 'visible',
      make: () => ({ id: Store.uid('s'), icon: 'sparkles', title: '', category: '', short: '', desc: '', features: [], price: 'Liên hệ', featured: false, visible: true }),
      title: it => it.title || '(chưa đặt tên)', sub: it => (it.category ? it.category + ' • ' : '') + it.price,
      badge: it => it.featured ? '<span class="pill pill--amber">Nổi bật</span>' : '',
      iconOf: it => icon(it.icon),
      fields: [
        { key: 'title', label: 'Tên dịch vụ', type: 'text', required: true }, { key: 'category', label: 'Nhóm / danh mục', type: 'text', hint: 'Dùng để lọc' },
        { key: 'price', label: 'Giá hiển thị', type: 'text', placeholder: 'Từ 1.000.000đ' }, { key: 'featured', label: 'Đánh dấu nổi bật', type: 'toggle', full: false },
        { key: 'short', label: 'Mô tả ngắn (trên thẻ)', type: 'textarea', rows: 2 },
        { key: 'desc', label: 'Mô tả chi tiết (trong cửa sổ chi tiết)', type: 'textarea', rows: 4 },
        { key: 'features', label: 'Điểm nổi bật / quyền lợi', type: 'lines' },
        { key: 'icon', label: 'Biểu tượng', type: 'icon' }
      ]
    },
    process: {
      path: 'process', name: 'bước', make: () => ({ icon: 'sparkles', title: '', desc: '' }),
      title: it => it.title, sub: it => it.desc, iconOf: it => icon(it.icon),
      fields: [{ key: 'title', label: 'Tên bước', type: 'text', required: true, full: true }, { key: 'desc', label: 'Mô tả', type: 'textarea', rows: 2 }, { key: 'icon', label: 'Biểu tượng', type: 'icon' }]
    },
    pricing: {
      path: 'pricing', name: 'gói', make: () => ({ id: Store.uid('p'), name: '', price: '', period: '/ dự án', desc: '', features: [], highlight: false, cta: 'Chọn gói này' }),
      title: it => it.name, sub: it => it.price + ' ' + it.period, iconOf: () => icon('tag'),
      badge: it => it.highlight ? '<span class="pill pill--amber">Nổi bật</span>' : '',
      fields: [
        { key: 'name', label: 'Tên gói', type: 'text', required: true }, { key: 'price', label: 'Giá', type: 'text' },
        { key: 'period', label: 'Đơn vị (/ tháng, / dự án…)', type: 'text' }, { key: 'cta', label: 'Chữ trên nút', type: 'text' },
        { key: 'desc', label: 'Mô tả', type: 'textarea', rows: 2 }, { key: 'features', label: 'Quyền lợi', type: 'lines' },
        { key: 'highlight', label: 'Gói nổi bật (phổ biến nhất)', type: 'toggle' }
      ]
    },
    testimonials: {
      path: 'testimonials', name: 'đánh giá', make: () => ({ name: '', role: '', text: '', rating: 5 }),
      title: it => it.name, sub: it => '★'.repeat(Number(it.rating) || 5) + ' — ' + it.text, iconOf: it => esc(initials(it.name)),
      fields: [
        { key: 'name', label: 'Tên khách hàng', type: 'text', required: true }, { key: 'role', label: 'Nghề nghiệp / công ty', type: 'text' },
        { key: 'rating', label: 'Số sao', type: 'select', options: [[5, '★★★★★ (5)'], [4, '★★★★ (4)'], [3, '★★★ (3)']] },
        { key: 'text', label: 'Nội dung đánh giá', type: 'textarea', rows: 4 }
      ]
    },
    faq: {
      path: 'faq', name: 'câu hỏi', make: () => ({ q: '', a: '' }), title: it => it.q, sub: it => it.a, iconOf: () => icon('help'),
      fields: [{ key: 'q', label: 'Câu hỏi', type: 'text', required: true, full: true }, { key: 'a', label: 'Câu trả lời', type: 'textarea', rows: 4 }]
    },
    tracks: {
      path: 'music.tracks', name: 'nhạc tích hợp',
      make: () => ({ id: Store.uid('t'), type: 'synth', preset: 'lofi', title: 'Lofi Chill', artist: 'Nhạc tích hợp' }),
      title: it => it.title, sub: it => it.artist + (it.type === 'url' ? ' • ' + it.url : ''),
      badge: it => '<span class="pill ' + (it.type === 'synth' ? '' : it.type === 'upload' ? 'pill--green' : 'pill--amber') + '">' + (it.type === 'synth' ? 'Tích hợp' : it.type === 'upload' ? 'File' : 'Link') + '</span>',
      iconOf: (it, i) => '<button class="mini-btn on" data-preview="' + i + '" title="Nghe thử">' + icon('play') + '</button>',
      fields: it => [{ key: 'title', label: 'Tên bài', type: 'text', required: true }, { key: 'artist', label: 'Nghệ sĩ / ghi chú', type: 'text' }].concat(
        it.type === 'synth' ? [{ key: 'preset', label: 'Giai điệu', type: 'select', options: Object.keys(MUSIC_PRESETS).map(k => [k, MUSIC_PRESETS[k]]) }] :
        it.type === 'url' ? [{ key: 'url', label: 'Đường dẫn file nhạc (.mp3)', type: 'text', full: true, required: true, placeholder: 'https://.../bai-hat.mp3 hoặc music/bai-hat.mp3' }] : []),
      onDelete: it => { if (it.type === 'upload') pendingDeletes.push(it); } // xoá file thật sau khi bấm Lưu
    }
  };

  /* ---------------- Điều hướng ---------------- */
  function buildNav() {
    let html = '', grp = '';
    const unread = msgCache.filter(m => !m.read).length;
    Object.keys(PAGES).forEach(k => {
      const p = PAGES[k];
      if (p.group !== grp) { grp = p.group; html += '<div class="side-group">' + esc(grp) + '</div>'; }
      html += '<button class="side-link' + (k === page ? ' active' : '') + '" data-page="' + k + '">' + icon(p.icon) + '<span>' + esc(p.label) + '</span>' +
        (k === 'messages' && unread ? '<span class="count">' + unread + '</span>' : '') + '</button>';
    });
    $('#side-nav').innerHTML = html;
  }
  function refreshChrome() {
    buildNav();
    $('#brand-mark').textContent = (saved.general.logoText || 'N')[0];
    $('#brand-name').textContent = saved.general.siteName;
    document.title = 'Quản trị — ' + saved.general.siteName;
  }
  let goSeq = 0;
  async function go(k, keepScroll) {
    if (!PAGES[k]) k = 'dashboard';
    if (PAGES[page] && PAGES[page].leave) PAGES[page].leave();
    const y = window.scrollY, seq = ++goSeq;
    page = k;
    const p = PAGES[k];
    $('#page-title').textContent = p.label; $('#page-desc').textContent = p.desc || '';
    let html;
    try { html = await p.render(); } catch (err) {
      if (err.status === 401) return sessionExpired();
      html = '<div class="tip">' + icon('help') + '<p>Không tải được dữ liệu: ' + esc(err.message) + '</p></div>';
    }
    if (seq !== goSeq) return; // người dùng đã chuyển trang khác
    const v = $('#view');
    v.style.animation = keepScroll ? 'none' : ''; if (!keepScroll) { void v.offsetWidth; v.style.animation = ''; }
    v.innerHTML = html;
    if (k === 'messages' || k === 'dashboard') buildNav();
    if (p.after) p.after.call(p);
    $$('.side-link[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === k));
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
    if (!keepScroll) history.replaceState(null, '', '#' + k);
    $('#app').classList.remove('side-open');
  }
  $('#side-nav').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b) go(b.dataset.page); });
  $('#view').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  $('#side-toggle').onclick = () => $('#app').classList.toggle('side-open');
  $('#sidebar-backdrop').onclick = () => $('#app').classList.remove('side-open');

  /* ---------------- Giao diện trang quản trị ---------------- */
  function applyAdminAccent() {
    const r = document.documentElement.style, t = draft.theme;
    r.setProperty('--primary', t.primary); r.setProperty('--accent', t.accent); r.setProperty('--on-primary', Store.onColor(t.primary));
  }
  function setAdminTheme(m) {
    document.documentElement.dataset.theme = m;
    $('#admin-theme').innerHTML = icon(m === 'dark' ? 'sun' : 'moon');
    try { localStorage.setItem(THEME_KEY, m); } catch (e) { /* noop */ }
  }
  $('#admin-theme').onclick = () => setAdminTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  let tm = 'dark'; try { tm = localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) { /* noop */ }
  setAdminTheme(tm);
  applyAdminAccent();

  // Cập nhật khi có tin nhắn mới (từ tab trang chủ)
  window.addEventListener('storage', e => {
    if (e.key === Store.KEYS.messages) { loadMessages().then(refreshChrome); if (page === 'messages' || page === 'dashboard') go(page, true); toast('Có tin nhắn mới!'); }
  });

  /* ---------------- Đăng nhập ---------------- */
  let started = false;
  async function enterApp() {
    $('#login').hidden = true; $('#app').hidden = false;
    if (started) return; // đăng nhập lại sau khi hết phiên: giữ nguyên bản nháp
    started = true;
    MusicPlayer.init([], {});
    loadMessages().then(buildNav).catch(() => {});
    // Máy chủ: kiểm tra tin nhắn mới mỗi 60 giây
    if (serverMode) setInterval(async () => {
      if (document.hidden || $('#app').hidden) return;
      const before = msgCache.filter(m => !m.read).length;
      try { await loadMessages(); } catch (e) { return; }
      const after = msgCache.filter(m => !m.read).length;
      if (after > before) { toast('Có ' + (after - before) + ' tin nhắn mới!'); buildNav(); if (page === 'messages' || page === 'dashboard') go(page, true); }
    }, 60000);
    $('#view-site').innerHTML = icon('external') + '<span>Xem trang chủ</span>';
    $('#logout').innerHTML = icon('logout') + '<span>Đăng xuất</span>';
    $('#side-toggle').innerHTML = icon('menu');
    refreshChrome();
    go((location.hash || '#dashboard').slice(1));
    if (mustChange) setTimeout(() => toast('Bạn đang dùng mật khẩu mặc định — nên đổi trong mục Sao lưu & Bảo mật'), 1200);
  }
  $('#logout').onclick = async () => {
    if (dirty && !(await confirmBox('Đăng xuất?', 'Bạn có thay đổi chưa lưu.', 'Vẫn đăng xuất', true))) return;
    try { await Store.logout(); } catch (e) { /* noop */ }
    dirty = false; location.reload();
  };

  $('#login-logo').innerHTML = icon('lock');
  $('#login-site').textContent = 'Đăng nhập để quản lý “' + saved.general.siteName + '”';
  $('#pw-eye').innerHTML = icon('eye');
  $('#pw-eye').onclick = () => { const i = $('#login-pw'); i.type = i.type === 'password' ? 'text' : 'password'; $('#pw-eye').innerHTML = icon(i.type === 'password' ? 'eye' : 'eyeOff'); };
  let me = { loggedIn: false, mustChange: false };
  try { me = await Store.me(); } catch (e) { toast('Không kết nối được máy chủ', 'err'); }
  mustChange = me.mustChange;
  $('#login-form').onsubmit = async e => {
    e.preventDefault();
    const btn = $('#login-form button[type="submit"]'); btn.disabled = true;
    try {
      const r = await Store.login($('#login-pw').value, $('#login-remember').checked);
      mustChange = !!r.mustChange;
      enterApp();
    } catch (err) {
      const c = $('#login-form'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
      toast(err.message || 'Sai mật khẩu', 'err'); $('#login-pw').select();
    } finally { btn.disabled = false; }
  };

  if (me.loggedIn) enterApp();
})();
