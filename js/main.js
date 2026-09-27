/* ==========================================================================
   main.js — Dựng trang chính từ dữ liệu (Store) và gắn toàn bộ hiệu ứng
   ========================================================================== */
(async function () {
  'use strict';

  await Store.init(); // tải nội dung từ máy chủ (nếu có) trước khi dựng trang

  const D = Store.load();
  const PREVIEW_KEY = 'mysite_skin_preview';
  let T = themeFor(readPreview());
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const sec = {}; D.sections.forEach(s => { sec[s.id] = s; });
  const visible = D.sections.filter(s => s.visible);
  const isVisible = id => !!(sec[id] && sec[id].visible);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const PREF_KEY = 'mysite_theme_pref';

  /* ---------------- Tiện ích ---------------- */
  function initials(name) {
    const w = String(name || '').trim().split(/\s+/);
    return ((w.length > 1 ? w[w.length - 2][0] : '') + (w[w.length - 1] || '?')[0]).toUpperCase();
  }
  function stars(n) {
    let h = '<span class="stars" aria-label="' + n + ' sao">';
    for (let i = 1; i <= 5; i++) h += icon('star', i <= n ? '' : 'off');
    return h + '</span>';
  }
  function telHref(p) { return 'tel:' + String(p || '').replace(/[^\d+]/g, ''); }
  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast--' + type : '');
    el.innerHTML = icon(type === 'ok' ? 'check' : type === 'err' ? 'x' : 'bell') + '<span>' + esc(msg) + '</span>';
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3200);
  }
  function copyText(text) {
    const done = () => toast('Đã sao chép: ' + text, 'ok');
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(done);
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Không sao chép được', 'err'); }
    ta.remove();
  }
  function hexToRgb(hex) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [124, 92, 255];
  }

  /* ---------------- Giao diện (theme) & phong cách game (skin) ---------------- */
  function readPreview() { try { return localStorage.getItem(PREVIEW_KEY); } catch (e) { return null; } }
  // Khách "xem thử" 1 phong cách khác → lấy màu, phông, hiệu ứng mặc định của phong cách đó
  function themeFor(skin) {
    const own = SKINS[D.theme.skin] ? D.theme.skin : 'default';
    if (!skin || !SKINS[skin] || skin === own) return Object.assign({}, D.theme, { skin: own });
    const k = SKINS[skin];
    return Object.assign({}, D.theme, { skin, primary: k.primary, accent: k.accent, font: k.font, effect: k.effect, radius: k.radius, mode: k.mode });
  }
  // Hiệu ứng vòng tròn lan toả từ vị trí bấm (dùng cho đổi sáng/tối và đổi phong cách)
  function circleTransition(e, fn) {
    if (!document.startViewTransition || reduceMotion) return fn();
    const x = e ? e.clientX : innerWidth / 2, y = e ? e.clientY : innerHeight / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(fn).ready.then(() => {
      document.documentElement.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(() => {});
  }
  function currentMode() {
    if (T.skin !== 'default') return T.mode === 'auto' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : T.mode;
    let pref = null;
    try { pref = localStorage.getItem(PREF_KEY); } catch (e) { /* noop */ }
    const mode = pref || T.mode;
    if (mode === 'auto') return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    return mode;
  }
  function setMode(mode) {
    document.documentElement.dataset.theme = mode;
    $('#theme-toggle').innerHTML = icon(mode === 'dark' ? 'sun' : 'moon');
    const meta = $('meta[name="theme-color"]'); if (meta) meta.content = mode === 'dark' ? '#0a0c16' : '#f5f6fb';
  }
  function applyTheme() {
    const r = document.documentElement.style;
    r.setProperty('--primary', T.primary);
    r.setProperty('--accent', T.accent);
    r.setProperty('--on-primary', Store.onColor(T.primary));
    r.setProperty('--radius', T.radius + 'px');
    const stack = ", system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
    const sk = SKINS[T.skin] || SKINS.default;
    r.setProperty('--font', "'" + T.font + "'" + stack);
    r.setProperty('--font-display', "'" + sk.display + "'" + stack);
    document.documentElement.dataset.skin = T.skin;
    $$('.hero__wm').forEach(el => { el.textContent = sk.watermark || ''; });
    document.body.dataset.reveal = reduceMotion ? 'none' : T.revealStyle;
    document.body.dataset.card = T.cardStyle;
    document.body.classList.toggle('has-glow', !!(T.cursorGlow && finePointer && !reduceMotion));
    setMode(currentMode());
    document.title = D.general.shareTitle || (D.general.siteName + (D.general.tagline ? ' — ' + D.general.tagline : ''));
    const md = $('meta[name="description"]'); if (md) md.content = D.general.seoDescription || '';
  }

  /* ---------------- Dựng các mục ---------------- */
  function head(id) {
    const s = sec[id];
    return '<div class="section-head reveal"><span class="section-head__eyebrow">' + esc(s.name) + '</span><h2>' + esc(s.title) + '</h2>' +
      (s.subtitle ? '<p>' + esc(s.subtitle) + '</p>' : '') + '</div>';
  }

  const R = {};

  R.hero = () => {
    const h = D.general.hero, c = D.contact;
    const floats = (h.floatBadges || []).slice(0, 8).map((b, i) =>
      '<div class="float-badge fb-' + (i + 1) + '"><span class="float-badge__ico">' + icon(b.icon || Store.guessIcon(b.text)) + '</span>' + esc(b.text) + '</div>').join('');
    const st = D.general.stats || [];
    const games = D.general.games || [];
    const loop = games.map(g => '<span>' + icon('gamepad') + esc(g) + '</span><i>✦</i>').join('');
    return '<section id="hero" class="hero hero--' + esc(T.heroLayout) + (games.length ? ' has-marquee' : '') + '"><div class="hero__wm" aria-hidden="true"></div><div class="container hero__inner">' +
      '<div class="hero__content">' +
        (h.badge ? '<span class="badge reveal"><i class="dot"></i>' + esc(h.badge) + '</span>' : '') +
        '<h1 class="hero__title reveal" style="--d:.1s">' + esc(h.title) + ' <span class="grad-text">' + esc(h.highlight) + '</span></h1>' +
        '<div class="hero__typing reveal" style="--d:.2s">' + esc(h.typingPrefix) + ' <span class="typing"></span><span class="caret"></span></div>' +
        '<p class="hero__sub reveal" style="--d:.3s">' + esc(h.subtitle) + '</p>' +
        '<div class="hero__cta reveal" style="--d:.4s">' +
          '<a href="#contact" class="btn btn--primary btn--lg">' + esc(h.ctaPrimary) + icon('arrowRight', 'ico--move') + '</a>' +
          (isVisible('services') ? '<a href="#services" class="btn btn--ghost btn--lg">' + esc(h.ctaSecondary) + '</a>' : '') +
        '</div>' +
        '<div class="hero__chips reveal" style="--d:.5s">' +
          (c.phone ? '<a class="chip" href="' + telHref(c.phone) + '">' + icon('phone') + esc(c.phone) + '</a>' : '') +
          (c.email ? '<a class="chip" href="mailto:' + esc(c.email) + '">' + icon('mail') + esc(c.email) + '</a>' : '') +
        '</div>' +
      '</div>' +
      '<div class="hero__visual reveal r-right" style="--d:.3s">' +
        '<div class="orbit"><i></i></div><div class="orbit orbit--2"><i></i></div>' +
        '<div class="profile-card card tilt spot">' +
          '<div class="profile-card__avatar"><b><span class="grad-text">' + esc(h.cardInitials || initials(h.cardName)) + '</span></b></div>' +
          '<h3>' + esc(h.cardName) + '</h3><div class="profile-card__role">' + esc(h.cardRole) + '</div>' + stars(5) +
          '<div class="profile-card__stats">' + st.slice(0, 3).map(s => '<div><b>' + esc(s.value) + esc(s.suffix) + '</b><span>' + esc(s.label) + '</span></div>').join('') + '</div>' +
        '</div>' + floats +
      '</div>' +
    '</div><a class="scroll-down" href="#' + (visible[1] ? visible[1].id : 'hero') + '" aria-label="Cuộn xuống"></a>' +
    (games.length ? '<div class="marquee" aria-label="Các game nhận cày"><div class="marquee__track">' + loop + loop + loop + loop + '</div></div>' : '') + '</section>';
  };

  R.about = () => {
    const a = D.general.about;
    const tl = a.tiles || [];
    const tiles = [['swords', tl[0] || 'Cày tay 100%'], ['shield', tl[1] || 'Bảo mật tài khoản']];
    return '<section id="about" class="section"><div class="container">' + head('about') +
      '<div class="about__grid">' +
        '<div class="about__visual reveal">' +
          '<div class="about__tile about__tile--main card"><strong>' + esc(a.experienceYears) + '</strong><span>' + esc(a.experienceLabel) + '</span></div>' +
          tiles.map(t => '<div class="about__tile card tilt spot">' + icon(t[0]) + '<b>' + esc(t[1]) + '</b></div>').join('') +
        '</div>' +
        '<div class="about__text reveal r-right" style="--d:.15s"><p>' + esc(a.text) + '</p>' +
          '<ul class="checklist">' + (a.highlights || []).map(x => '<li>' + icon('check') + '<span>' + esc(x) + '</span></li>').join('') + '</ul>' +
          '<div style="margin-top:30px"><a href="#contact" class="btn btn--primary">' + esc(D.general.hero.ctaPrimary) + icon('arrowRight', 'ico--move') + '</a></div>' +
        '</div>' +
      '</div>' +
      '<div class="stats">' + (D.general.stats || []).map((s, i) =>
        '<div class="stat card reveal spot" style="--d:' + (i * 0.1) + 's"><b class="grad-text"><span data-count="' + Number(s.value || 0) + '">0</span>' + esc(s.suffix) + '</b><span>' + esc(s.label) + '</span></div>').join('') +
      '</div>' +
    '</div></section>';
  };

  R.services = () => {
    const list = D.services.filter(s => s.visible !== false);
    const cats = Array.from(new Set(list.map(s => s.category).filter(Boolean)));
    return '<section id="services" class="section"><div class="container">' + head('services') +
      (cats.length > 1 ? '<div class="filters reveal"><button class="filter active" data-filter="*">Tất cả</button>' +
        cats.map(c => '<button class="filter" data-filter="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' : '') +
      '<div class="services__grid">' + list.map((s, i) =>
        '<article class="service card tilt spot reveal" style="--d:' + ((i % 3) * 0.1) + 's" data-cat="' + esc(s.category) + '">' +
          (s.featured ? '<span class="tag-featured">★ Nổi bật</span>' : '') +
          '<div class="service__icon">' + icon(s.icon) + '</div>' +
          (s.category ? '<span class="tag-cat">' + esc(s.category) + '</span>' : '') +
          '<h3>' + esc(s.title) + '</h3><p>' + esc(s.short) + '</p>' +
          '<div class="service__foot"><span class="service__price">' + esc(s.price) + '</span>' +
          '<button class="service__more" data-service="' + esc(s.id) + '">Chi tiết' + icon('arrowRight') + '</button></div>' +
        '</article>').join('') + '</div>' +
    '</div></section>';
  };

  R.process = () => '<section id="process" class="section"><div class="container">' + head('process') +
    '<div class="process" id="process-list"><div class="process__line"></div>' + D.process.map((p, i) =>
      '<div class="step reveal" style="--d:' + (i * 0.15) + 's"><div class="step__num">' + icon(p.icon) + '<em>' + (i + 1) + '</em></div>' +
      '<h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p></div>').join('') + '</div>' +
  '</div></section>';

  R.pricing = () => '<section id="pricing" class="section"><div class="container">' + head('pricing') +
    '<div class="pricing">' + D.pricing.map((p, i) =>
      '<div class="plan card spot reveal' + (p.highlight ? ' plan--hl' : '') + '" style="--d:' + (i * 0.12) + 's">' +
        (p.highlight ? '<span class="plan__ribbon">⭐ Phổ biến nhất</span>' : '') +
        '<h3>' + esc(p.name) + '</h3><div class="plan__price">' + esc(p.price) + ' <small>' + esc(p.period) + '</small></div>' +
        '<p class="plan__desc">' + esc(p.desc) + '</p>' +
        '<ul>' + (p.features || []).map(f => '<li>' + icon('check') + esc(f) + '</li>').join('') + '</ul>' +
        '<button class="btn ' + (p.highlight ? 'btn--primary' : 'btn--ghost') + ' btn--block" data-plan="' + esc(p.name) + '">' + esc(p.cta || 'Chọn gói') + '</button>' +
      '</div>').join('') + '</div>' +
  '</div></section>';

  R.testimonials = () => '<section id="testimonials" class="section"><div class="container">' + head('testimonials') +
    '<div class="slider reveal" id="slider"><div class="slider__viewport"><div class="slider__track">' + D.testimonials.map(t =>
      '<div class="review"><div class="review__card card">' + icon('quote', 'review__quote') +
        '<p class="review__text">“' + esc(t.text) + '”</p>' +
        '<div class="review__who"><div class="avatar">' + esc(initials(t.name)) + '</div><div><b>' + esc(t.name) + '</b><span>' + esc(t.role) + '</span><div>' + stars(Number(t.rating) || 5) + '</div></div></div>' +
      '</div></div>').join('') + '</div></div>' +
    '<div class="slider__nav"><button class="icon-btn" data-slide="prev" aria-label="Trước">' + icon('chevronLeft') + '</button>' +
    '<div class="dots">' + D.testimonials.map((_, i) => '<button aria-label="Đánh giá ' + (i + 1) + '" data-dot="' + i + '"></button>').join('') + '</div>' +
    '<button class="icon-btn" data-slide="next" aria-label="Sau">' + icon('chevronRight') + '</button></div></div>' +
  '</div></section>';

  R.faq = () => '<section id="faq" class="section"><div class="container">' + head('faq') +
    '<div class="faq">' + D.faq.map((f, i) =>
      '<div class="faq__item card reveal' + (i === 0 ? ' open' : '') + '" style="--d:' + (i * 0.08) + 's">' +
        '<button class="faq__q" aria-expanded="' + (i === 0) + '"><span>' + esc(f.q) + '</span>' + icon('plus') + '</button>' +
        '<div class="faq__a"><div><p>' + esc(f.a) + '</p></div></div></div>').join('') + '</div>' +
  '</div></section>';

  R.contact = () => {
    const c = D.contact, so = c.socials || {};
    const items = [
      c.phone && ['phone', 'Điện thoại', c.phone, telHref(c.phone)],
      c.email && ['mail', 'Email', c.email, 'mailto:' + c.email],
      c.zalo && ['message', 'Zalo', c.zalo, 'https://zalo.me/' + String(c.zalo).replace(/\D/g, '')],
      c.address && ['map', 'Địa chỉ', c.address, 'https://maps.google.com/?q=' + encodeURIComponent(c.mapQuery || c.address)],
      c.hours && ['clock', 'Giờ làm việc', c.hours, null]
    ].filter(Boolean);
    const socials = ['facebook', 'youtube', 'tiktok', 'instagram'].filter(k => so[k]);
    const opts = serviceOpts();
    return '<section id="contact" class="section"><div class="container">' + head('contact') +
      '<div class="contact">' +
        '<div class="contact__info">' + items.map((it, i) =>
          '<div class="info-card card reveal" style="--d:' + (i * 0.08) + 's"><div class="info-card__icon">' + icon(it[0]) + '</div>' +
          '<div class="info-card__body"><span>' + it[1] + '</span>' + (it[3] ? '<a href="' + esc(it[3]) + '" target="' + (it[3].startsWith('http') ? '_blank' : '_self') + '" rel="noopener"><b>' + esc(it[2]) + '</b></a>' : '<b>' + esc(it[2]) + '</b>') + '</div>' +
          (it[0] !== 'clock' ? '<button class="copy-btn" data-copy="' + esc(it[2]) + '" aria-label="Sao chép">' + icon('copy') + '</button>' : '') + '</div>').join('') +
          (socials.length ? '<div class="socials reveal">' + socials.map(k => '<a href="' + esc(so[k]) + '" target="_blank" rel="noopener" aria-label="' + k + '">' + icon(k) + '</a>').join('') + '</div>' : '') +
          (c.showMap && c.mapQuery ? '<div class="map card reveal"><iframe loading="lazy" title="Bản đồ" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=' + encodeURIComponent(c.mapQuery) + '&z=15&output=embed"></iframe></div>' : '') +
        '</div>' +
        (c.showForm ? '<div class="form card reveal r-right" id="form-wrap">' + formHTML(opts) + '</div>' : '') +
      '</div>' +
    '</div></section>';
  };

  function serviceOpts() {
    return D.services.filter(s => s.visible !== false).map(s => '<option>' + esc(s.title) + '</option>').join('') +
      D.pricing.map(p => '<option>Gói ' + esc(p.name) + '</option>').join('');
  }

  function formHTML(opts) {
    return '<form id="contact-form" novalidate><h3>Gửi lời nhắn</h3><p>Điền thông tin, chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.</p>' +
      '<div class="form__grid">' +
        '<div class="field"><label for="f-name">Họ và tên *</label><input id="f-name" name="name" placeholder="Nguyễn Văn A" autocomplete="name"><small class="field__err"></small></div>' +
        '<div class="field"><label for="f-phone">Số điện thoại *</label><input id="f-phone" name="phone" placeholder="09xx xxx xxx" inputmode="tel" autocomplete="tel"><small class="field__err"></small></div>' +
        '<div class="field"><label for="f-uid">Game / Server / UID</label><input id="f-uid" name="uid" placeholder="VD: Genshin – Asia – 8xxxxxxxx"></div>' +
        '<div class="field"><label for="f-email">Email</label><input id="f-email" name="email" placeholder="ban@email.com" type="email" autocomplete="email"><small class="field__err"></small></div>' +
        '<div class="field field--full"><label for="f-service">Dịch vụ quan tâm</label><select id="f-service" name="service"><option value="">— Chọn dịch vụ —</option>' + opts + '<option>Khác</option></select></div>' +
        '<div class="field field--full"><label for="f-msg">Nội dung *</label><textarea id="f-msg" name="message" placeholder="Bạn cần cày gì? (VD: La Hoàn 36★, daily 1 tháng…)"></textarea><small class="field__err"></small></div>' +
      '</div>' +
      '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">' +
      '<div class="form__foot"><p class="form__note">🔒 Thông tin của bạn được bảo mật.</p><button class="btn btn--primary" type="submit">' + icon('send') + 'Gửi tin nhắn</button></div></form>';
  }

  function renderHeader() {
    const g = D.general;
    $('#logo').innerHTML = '<span class="logo__mark">' + esc((g.logoText || g.siteName || 'N')[0]) + '</span><span>' + esc(g.logoText || g.siteName) + '</span>';
    $('#preloader-text').textContent = (g.logoText || 'N')[0];
    const links = visible.map((s, i) => '<a href="#' + s.id + '" data-nav="' + s.id + '" style="--i:' + i + '">' + esc(s.name) + '</a>');
    $('#nav').innerHTML = '<span class="nav__pill"></span>' + links.join('');
    $('#mobile-nav').innerHTML = links.join('');
    $('#menu-btn').innerHTML = icon('menu');
    if (!isVisible('contact')) $('#header-cta').remove();
    else $('#header-cta').textContent = sec.contact.name;
  }

  function renderFooter() {
    const g = D.general, c = D.contact, so = c.socials || {};
    const socials = ['facebook', 'youtube', 'tiktok', 'instagram'].filter(k => so[k]);
    const svc = D.services.filter(s => s.visible !== false).slice(0, 5);
    $('#footer').innerHTML = '<div class="container"><div class="footer__grid">' +
      '<div><a href="#hero" class="logo">' + $('#logo').innerHTML + '</a><p style="margin-top:16px">' + esc(g.footerText) + '</p>' +
        (socials.length ? '<div class="socials">' + socials.map(k => '<a href="' + esc(so[k]) + '" target="_blank" rel="noopener" aria-label="' + k + '">' + icon(k) + '</a>').join('') + '</div>' : '') + '</div>' +
      '<div><h4>' + esc(sec.services ? sec.services.name : 'Dịch vụ') + '</h4><ul>' + svc.map(s => '<li><a href="#services">' + esc(s.title) + '</a></li>').join('') + '</ul></div>' +
      '<div><h4>' + esc(sec.contact ? sec.contact.name : 'Liên hệ') + '</h4><ul>' +
        (c.phone ? '<li><a href="' + telHref(c.phone) + '">' + icon('phone') + esc(c.phone) + '</a></li>' : '') +
        (c.email ? '<li><a href="mailto:' + esc(c.email) + '">' + icon('mail') + esc(c.email) + '</a></li>' : '') +
        (c.address ? '<li>' + icon('map') + esc(c.address) + '</li>' : '') +
        (c.hours ? '<li>' + icon('clock') + esc(c.hours) + '</li>' : '') + '</ul></div>' +
      '</div><div class="footer__bottom"><span>' + esc(String(g.copyright || '© {year} ' + g.siteName).replace(/\{year\}/g, new Date().getFullYear())) + '</span>' +
      (g.showAdminLink ? '<a href="admin.html">' + icon('lock') + ' Quản trị</a>' : '') + '</div></div>';
  }

  /* Thanh liên hệ nhanh bên cạnh màn hình (thu gọn thành 1 nút nhỏ) */
  let dockPeek = () => {};
  function renderDock() {
    const c = D.contact, q = c.quick || {}, box = $('#dock');
    const items = (q.items || []).filter(it => it.visible !== false).map(it => Object.assign({}, it, Store.quickLink(it, c))).filter(it => it.href);
    if (!c.floatingButtons || !items.length) { box.remove(); return; }
    box.classList.toggle('dock--left', q.side === 'left');
    box.innerHTML =
      '<button class="dock__tab" type="button" aria-expanded="false" aria-controls="dock-panel" aria-label="Mở hỗ trợ nhanh">' + icon('headset') + '<span class="dock__dot"></span></button>' +
      '<div class="dock__panel" id="dock-panel" role="region" aria-label="' + esc(q.title || 'Hỗ trợ nhanh') + '">' +
        ((q.title || q.subtitle) ? '<div class="dock__head">' + (q.title ? '<b>' + esc(q.title) + '</b>' : '') + (q.subtitle ? '<small><i></i>' + esc(q.subtitle) + '</small>' : '') + '</div>' : '') +
        items.map(it => {
          const ext = /^https?:/i.test(it.href);
          return '<a class="dock__item" href="' + esc(it.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' +
            '<span class="dock__ico"' + (it.color ? ' style="background:' + esc(it.color) + ';color:#fff"' : '') + '>' + icon(it.icon || 'message') + '</span>' +
            '<span class="dock__txt"><b>' + esc(it.label) + '</b>' + (it.desc ? '<small>' + esc(it.desc) + '</small>' : '') + '</span></a>';
        }).join('') +
      '</div>';
    const tab = $('.dock__tab', box);
    let hover = false, timer = null;
    const set = open => { box.classList.toggle('open', open); tab.setAttribute('aria-expanded', String(open)); tab.setAttribute('aria-label', open ? 'Thu gọn hỗ trợ nhanh' : 'Mở hỗ trợ nhanh'); };
    tab.onclick = () => { clearTimeout(timer); set(!box.classList.contains('open')); };
    box.addEventListener('mouseenter', () => { hover = true; clearTimeout(timer); });
    box.addEventListener('mouseleave', () => { hover = false; if (box.dataset.peek) { timer = setTimeout(() => { set(false); delete box.dataset.peek; }, 600); } });
    document.addEventListener('click', e => { if (!e.composedPath().includes(box)) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    // Tự hiện vài giây khi tải trang rồi lùi vào
    dockPeek = () => {
      if (!q.autoPeek) return;
      box.dataset.peek = '1'; set(true);
      timer = setTimeout(() => { if (!hover) { set(false); delete box.dataset.peek; } }, Math.max(1, Number(q.peekSeconds) || 2) * 1000);
    };
  }

  function renderAnnounce() {
    const a = D.general.announcement, el = $('#announce');
    let closed = false;
    try { closed = sessionStorage.getItem('mysite_announce_closed') === a.text; } catch (e) { /* noop */ }
    if (!a.enabled || !a.text || closed) return;
    el.hidden = false;
    el.innerHTML = '<span>' + esc(a.text) + '</span>' + (a.link ? '<a href="' + esc(a.link) + '">' + esc(a.linkText || 'Xem ngay') + ' →</a>' : '') +
      '<button class="announce__close" aria-label="Đóng">' + icon('x') + '</button>';
    $('.announce__close', el).onclick = () => {
      el.style.transition = 'margin .4s, opacity .4s'; el.style.opacity = '0'; el.style.marginTop = -el.offsetHeight + 'px';
      setTimeout(() => el.remove(), 400);
      try { sessionStorage.setItem('mysite_announce_closed', a.text); } catch (e) { /* noop */ }
    };
  }

  function renderMain() {
    $('#main').innerHTML = visible.map(s => (R[s.id] ? R[s.id]() : '')).join('');
  }

  /* ---------------- Hiệu ứng & tương tác ---------------- */
  function initReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || document.body.dataset.reveal === 'none') { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(e => io.observe(e));

    const pl = $('#process-list');
    if (pl) new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { pl.classList.add('in-view'); o.disconnect(); } }, { threshold: 0.3 }).observe(pl);

    const counters = $$('[data-count]');
    const co = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      co.unobserve(en.target);
      const el = en.target, end = Number(el.dataset.count), dur = 1800, t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(end * e).toLocaleString('vi-VN');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
  }

  function initTyping() {
    const el = $('.typing'); if (!el) return;
    const words = (D.general.hero.typingWords || []).filter(Boolean);
    if (!words.length) { $('.hero__typing').style.display = 'none'; return; }
    let w = 0, c = 0, del = false;
    (function tick() {
      const word = words[w];
      el.textContent = word.slice(0, c);
      if (!del && c === word.length) { del = true; return setTimeout(tick, 1800); }
      if (del && c === 0) { del = false; w = (w + 1) % words.length; return setTimeout(tick, 350); }
      c += del ? -1 : 1;
      setTimeout(tick, del ? 40 : 85);
    })();
  }

  function initTilt() {
    $$('.spot').forEach(el => el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
    if (!T.tilt || !finePointer || reduceMotion) return;
    $$('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 8) + 'deg) rotateY(' + (x * 8) + 'deg) translateY(-6px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* Nhãn bay vòng quanh thẻ hồ sơ (quỹ đạo elip, có chiều sâu 3D) */
  let orbitMeasure = () => {};
  function initOrbit() {
    const vis = $('.hero__visual'), card = vis && $('.profile-card', vis);
    const all = vis ? $$('.float-badge', vis) : [];
    if (!card || !all.length || reduceMotion || T.animations === false) return;
    vis.classList.add('orbiting');
    let geo = null, angle = -Math.PI / 2, paused = false, last = performance.now();
    orbitMeasure = () => {
      const list = all.filter(b => getComputedStyle(b).display !== 'none');
      if (!list.length) { geo = null; return; }
      list.forEach(b => { b._w = b.offsetWidth; b._h = b.offsetHeight; });
      const bw = Math.max(...list.map(b => b._w)), bh = list[0]._h;
      const cw = card.offsetWidth, ch = card.offsetHeight;
      const cx = card.offsetLeft + cw / 2, cy = card.offsetTop + ch / 2;
      // Chừa đủ chỗ để nhãn không chạy ra ngoài màn hình
      const vr = vis.getBoundingClientRect(), mid = vr.left + cx;
      const room = Math.min(mid, innerWidth - mid) - bw / 2 - 8;
      const rx = Math.max(40, Math.min(cw / 2 + bw * 0.4, room));
      const ry = ch / 2 + bh * 0.9;
      geo = { cx, cy, rx, ry, list };
    };
    const tick = now => {
      const dt = Math.min(50, now - last); last = now;
      if (!paused && !document.hidden) angle += dt * (2 * Math.PI / 42000); // 42 giây một vòng
      if (geo) {
        const { cx, cy, rx, ry, list } = geo, n = list.length;
        for (let i = 0; i < n; i++) {
          const b = list[i], a = angle + i * 2 * Math.PI / n, depth = (Math.sin(a) + 1) / 2; // 0 = phía sau, 1 = phía trước
          const x = cx + rx * Math.cos(a) - b._w / 2, y = cy + ry * Math.sin(a) - b._h / 2;
          b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (0.82 + depth * 0.18).toFixed(3) + ')';
          b.style.opacity = (0.55 + depth * 0.45).toFixed(3);
          b.style.zIndex = depth > 0.5 ? 3 : 0;
        }
      }
      requestAnimationFrame(tick);
    };
    vis.addEventListener('pointerenter', () => { paused = true; });
    vis.addEventListener('pointerleave', () => { paused = false; });
    window.addEventListener('resize', () => orbitMeasure());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => orbitMeasure());
    window.addEventListener('load', () => orbitMeasure());
    orbitMeasure(); setTimeout(orbitMeasure, 1300); requestAnimationFrame(tick);
  }

  function initRipple() {
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest('.btn'); if (!b) return;
      const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
      const sp = document.createElement('span'); sp.className = 'ripple';
      sp.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
      b.appendChild(sp); setTimeout(() => sp.remove(), 650);
    });
  }

  function initScroll() {
    const header = $('#header'), prog = $('#scroll-progress'), top = $('#to-top');
    top.innerHTML = icon('arrowUp') + '<svg class="ring" viewBox="0 0 52 52"><rect x="1" y="1" width="50" height="50" rx="' + (T.radius) + '" fill="none" stroke="var(--primary)" stroke-width="2" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>';
    const ringRect = $('rect', top);
    top.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const links = $$('#nav a, #mobile-nav a'), pill = $('.nav__pill');
    const sections = visible.map(s => document.getElementById(s.id)).filter(Boolean);
    let lastY = 0, ticking = false, activeId = null;

    function movePill(id) {
      const a = $('#nav a[data-nav="' + id + '"]');
      if (!a || !pill) return;
      pill.style.left = a.offsetLeft + 'px'; pill.style.width = a.offsetWidth + 'px'; pill.style.opacity = '1';
    }
    function update() {
      ticking = false;
      const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight, p = h > 0 ? y / h : 0;
      prog.style.transform = 'scaleX(' + p + ')';
      header.classList.toggle('scrolled', y > 20);
      header.classList.toggle('hide', y > 400 && y > lastY + 4 && !document.body.classList.contains('no-scroll'));
      if (y < lastY - 4) header.classList.remove('hide');
      lastY = y;
      top.classList.toggle('show', y > 600);
      ringRect.setAttribute('stroke-dashoffset', String(100 - p * 100));
      let cur = sections[0] && sections[0].id;
      sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; });
      if (cur !== activeId) {
        activeId = cur;
        links.forEach(a => a.classList.toggle('active', a.dataset.nav === cur));
        movePill(cur);
      }
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', () => movePill(activeId));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => movePill(activeId));
    window.addEventListener('load', () => movePill(activeId));
    update();
  }

  function initMenu() {
    const menu = $('#mobile-menu'), btn = $('#menu-btn');
    const set = open => {
      menu.classList.toggle('open', open); document.body.classList.toggle('no-scroll', open);
      btn.innerHTML = icon(open ? 'x' : 'menu'); menu.setAttribute('aria-hidden', String(!open));
    };
    btn.onclick = () => set(!menu.classList.contains('open'));
    menu.addEventListener('click', e => { if (e.target === menu || e.target.closest('a')) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  function initThemeToggle() {
    $('#theme-toggle').addEventListener('click', e => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(PREF_KEY, next); } catch (err) { /* noop */ }
      circleTransition(e, () => setMode(next));
    });
  }

  /* Bộ chọn phong cách game — khách bấm để xem thử (chỉ lưu trên máy người xem) */
  function initSkinPicker() {
    const wrap = $('#skin-pick');
    if (!D.theme.skinSwitcher) { wrap.remove(); return; }
    const btn = $('#skin-btn'), menu = $('#skin-menu');
    btn.innerHTML = icon('gamepad');
    function render() {
      menu.innerHTML = '<div class="skin-menu__head"><b>Phong cách giao diện</b><small>Xem thử — chỉ thay đổi trên máy của bạn</small></div>' +
        Object.keys(SKINS).map(k => { const s = SKINS[k]; return '<button data-skin="' + k + '" class="' + (k === T.skin ? 'active' : '') + '">' +
          '<i style="background:linear-gradient(135deg,' + s.primary + ',' + s.accent + ')"></i><span><b>' + esc(s.game) + '</b><small>' + esc(s.name + ' · ' + s.tagline) + '</small></span>' +
          (k === T.skin ? icon('check') : '') + '</button>'; }).join('');
    }
    render();
    const SEEN = 'mysite_skin_seen';
    try { if (localStorage.getItem(SEEN)) wrap.classList.add('seen'); } catch (e) { /* noop */ }
    btn.onclick = () => {
      wrap.classList.toggle('open'); btn.setAttribute('aria-expanded', wrap.classList.contains('open'));
      wrap.classList.add('seen'); try { localStorage.setItem(SEEN, '1'); } catch (e) { /* noop */ }
    };
    menu.addEventListener('click', e => {
      const b = e.target.closest('[data-skin]'); if (!b) return;
      const k = b.dataset.skin; wrap.classList.remove('open');
      if (k === T.skin) return;
      try { if (k === D.theme.skin) localStorage.removeItem(PREVIEW_KEY); else localStorage.setItem(PREVIEW_KEY, k); } catch (err) { /* noop */ }
      circleTransition(e, () => { T = themeFor(k); applyTheme(); initBackground(); render(); setTimeout(orbitMeasure, 80); });
      toast('🎮 Phong cách: ' + SKINS[k].game);
    });
    document.addEventListener('click', e => { if (!e.composedPath().includes(wrap)) wrap.classList.remove('open'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') wrap.classList.remove('open'); });
  }

  /* Hộp thoại */
  function openModal(html) {
    const m = $('#modal');
    $('#modal-box').innerHTML = '<button class="icon-btn modal__close" data-close aria-label="Đóng">' + icon('x') + '</button>' + html;
    m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll');
    setTimeout(() => { const f = $('#modal-box .btn'); if (f) f.focus({ preventScroll: true }); }, 50);
  }
  function closeModal() {
    const m = $('#modal'); if (!m.classList.contains('open')) return;
    m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll');
  }
  function goContact(value) {
    closeModal();
    const sel = $('#f-service');
    if (sel && value) { Array.from(sel.options).forEach(o => { if (o.text === value) sel.value = o.value || o.text; }); }
    const c = $('#contact'); if (c) c.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { const n = $('#f-name'); if (n) n.focus({ preventScroll: true }); }, 700);
  }

  function initServices() {
    $$('.filter').forEach(f => f.addEventListener('click', () => {
      $$('.filter').forEach(x => x.classList.toggle('active', x === f));
      const cat = f.dataset.filter;
      $$('.service').forEach(s => {
        const show = cat === '*' || s.dataset.cat === cat;
        s.classList.toggle('is-hidden', !show);
        if (show) { s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop', 'in'); }
      });
    }));
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-service]');
      if (b) {
        const s = D.services.find(x => x.id === b.dataset.service); if (!s) return;
        openModal('<div class="modal__icon">' + icon(s.icon) + '</div>' + (s.category ? '<span class="tag-cat">' + esc(s.category) + '</span>' : '') +
          '<h3>' + esc(s.title) + '</h3><p>' + esc(s.desc || s.short) + '</p>' +
          '<ul>' + (s.features || []).map(f => '<li>' + icon('check') + esc(f) + '</li>').join('') + '</ul>' +
          '<div class="modal__foot"><span class="modal__price">' + esc(s.price) + '</span><button class="btn btn--primary" data-goto="' + esc(s.title) + '">Đăng ký tư vấn' + icon('arrowRight', 'ico--move') + '</button></div>');
        return;
      }
      const p = e.target.closest('[data-plan]'); if (p) return goContact('Gói ' + p.dataset.plan);
      const g = e.target.closest('[data-goto]'); if (g) return goContact(g.dataset.goto);
      if (e.target.closest('[data-close]')) closeModal();
      const cp = e.target.closest('[data-copy]'); if (cp) copyText(cp.dataset.copy);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  function initSlider() {
    const root = $('#slider'); if (!root) return;
    const track = $('.slider__track', root), dots = $$('[data-dot]', root), n = dots.length;
    let i = 0, timer;
    const go = k => { i = (k + n) % n; track.style.transform = 'translateX(' + (-i * 100) + '%)'; dots.forEach((d, j) => d.classList.toggle('active', j === i)); };
    const auto = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 5500); };
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-slide]'), d = e.target.closest('[data-dot]');
      if (b) { go(i + (b.dataset.slide === 'next' ? 1 : -1)); auto(); }
      if (d) { go(+d.dataset.dot); auto(); }
    });
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', auto);
    let sx = null;
    root.addEventListener('pointerdown', e => { sx = e.clientX; });
    root.addEventListener('pointerup', e => { if (sx != null && Math.abs(e.clientX - sx) > 50) { go(i + (e.clientX < sx ? 1 : -1)); auto(); } sx = null; });
    go(0); auto();
  }

  function initFaq() {
    $$('.faq__q').forEach(q => q.addEventListener('click', () => {
      const item = q.parentElement, open = !item.classList.contains('open');
      $$('.faq__item').forEach(x => { x.classList.remove('open'); $('.faq__q', x).setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('open', open); q.setAttribute('aria-expanded', String(open));
    }));
  }

  function initForm() {
    const wrap = $('#form-wrap'); if (!wrap) return;
    wrap.addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target, v = k => (f.elements[k].value || '').trim();
      const errs = {};
      if (v('name').length < 2) errs.name = 'Vui lòng nhập họ tên';
      if (!/^[0-9+\s.()-]{8,15}$/.test(v('phone'))) errs.phone = 'Số điện thoại chưa hợp lệ';
      if (v('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) errs.email = 'Email chưa hợp lệ';
      if (v('message').length < 5) errs.message = 'Vui lòng nhập nội dung (ít nhất 5 ký tự)';
      ['name', 'phone', 'email', 'message'].forEach(k => {
        const fld = f.elements[k].closest('.field');
        fld.classList.toggle('invalid', !!errs[k]); $('.field__err', fld).textContent = errs[k] || '';
      });
      if (Object.keys(errs).length) { toast('Vui lòng kiểm tra lại thông tin', 'err'); f.elements[Object.keys(errs)[0]].focus(); return; }
      const btn = $('button[type="submit"]', f);
      const label = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<span class="preloader__ring" style="position:static;width:18px;height:18px;border-width:2px"></span> Đang gửi...';
      setTimeout(async () => {
        try {
          await Store.addMessage({ name: v('name'), phone: v('phone'), uid: v('uid'), email: v('email'), service: v('service'), message: v('message'), website: v('website') });
        } catch (err) {
          btn.disabled = false; btn.innerHTML = label;
          toast(err.message || 'Gửi không thành công, vui lòng thử lại', 'err');
          return;
        }
        wrap.innerHTML = '<div class="form-success"><div class="form-success__icon">' + icon('check') + '</div><h3>Gửi thành công!</h3>' +
          '<p style="color:var(--muted)">Cảm ơn ' + esc(v('name')) + '. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</p>' +
          '<button class="btn btn--ghost" id="form-again">Gửi tin nhắn khác</button></div>';
        toast('Đã gửi lời nhắn thành công', 'ok');
        $('#form-again').onclick = () => { wrap.innerHTML = formHTML(serviceOpts()); };
      }, 500);
    });
    wrap.addEventListener('input', e => { const fld = e.target.closest('.field'); if (fld) fld.classList.remove('invalid'); });
  }

  function initCursor() {
    if (!document.body.classList.contains('has-glow')) return;
    const g = $('#cursor-glow'); let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    window.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    (function loop() { cx += (x - cx) * 0.12; cy += (y - cy) * 0.12; g.style.transform = 'translate(' + (cx - 230) + 'px,' + (cy - 230) + 'px)'; requestAnimationFrame(loop); })();
  }

  /* ---------------- Nền canvas: hạt / sao / tuyết / bong bóng / sóng âm / lưới / bokeh ---------------- */
  let bgGen = 0; // tăng mỗi lần đổi phong cách để dừng vòng lặp cũ
  const mouse = { x: -999, y: -999 };
  window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  function initBackground() {
    const gen = ++bgGen, cv = $('#bg-canvas'), type = T.effect, ctx = cv.getContext('2d');
    if (type === 'none' || reduceMotion) { cv.style.display = 'none'; return; }
    cv.style.display = '';
    const [pr, pg, pb] = hexToRgb(T.primary), [ar, ag, ab] = hexToRgb(T.accent);
    const P = pr + ',' + pg + ',' + pb, A = ar + ',' + ag + ',' + ab;
    let W, H, dpr, items = [], t = 0, shooting = null;
    const rnd = (a, b) => a + Math.random() * (b - a);
    function resize() {
      if (gen !== bgGen) return window.removeEventListener('resize', resize);
      dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seed();
    }
    function seed() {
      const area = W * H;
      if (type === 'particles') items = Array.from({ length: Math.min(90, Math.floor(area / 15000)) }, () => ({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-.35, .35), vy: rnd(-.35, .35), r: rnd(1, 2.4) }));
      if (type === 'stars') items = Array.from({ length: Math.min(220, Math.floor(area / 6000)) }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(.3, 1.6), p: rnd(0, 6.28), s: rnd(.01, .04), vy: rnd(.02, .15) }));
      if (type === 'snow') items = Array.from({ length: Math.min(160, Math.floor(area / 9000)) }, () => ({ x: rnd(0, W), y: rnd(-H, H), r: rnd(1, 3.5), vy: rnd(.3, 1.2), p: rnd(0, 6.28) }));
      if (type === 'bubbles') items = Array.from({ length: Math.min(40, Math.floor(area / 35000)) }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(8, 40), vy: rnd(.2, .7), p: rnd(0, 6.28), c: Math.random() < .5 }));
      if (type === 'waves') items = Array.from({ length: 40 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(.5, 1.5), vx: rnd(.1, .5), p: rnd(0, 6.28) }));
      if (type === 'grid') items = Array.from({ length: 12 }, () => ({ x: 0, y: 0, life: -1 }));
      if (type === 'bokeh') items = Array.from({ length: Math.min(30, Math.floor(area / 40000) + 10) }, (_, i) => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(20, 90), vy: rnd(.1, .4), vx: rnd(-.15, .15), p: rnd(0, 6.28), a: rnd(.07, .2), c: i % 3 === 0 ? A : i % 3 === 1 ? P : '255,170,220' }));
    }
    function frame() {
      if (gen !== bgGen) return;
      if (document.hidden) return requestAnimationFrame(frame);
      const beat = window.__beat || 0;
      const dark = document.documentElement.dataset.theme === 'dark';
      ctx.clearRect(0, 0, W, H);
      if (type === 'particles') {
        for (const p of items) {
          p.x += p.vx * (1 + beat * 3); p.y += p.vy * (1 + beat * 3);
          if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 120) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
        }
        for (let i = 0; i < items.length; i++) {
          const a = items[i];
          for (let j = i + 1; j < items.length; j++) {
            const b = items[j], d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 130) { ctx.strokeStyle = 'rgba(' + P + ',' + ((1 - d / 130) * (dark ? .35 : .25)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          }
          const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (md < 180) { ctx.strokeStyle = 'rgba(' + A + ',' + ((1 - md / 180) * .5) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
          ctx.fillStyle = 'rgba(' + (i % 3 ? P : A) + ',.8)';
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (1 + beat), 0, 6.283); ctx.fill();
        }
      } else if (type === 'stars') {
        for (const s of items) {
          s.p += s.s; s.y -= s.vy; if (s.y < 0) { s.y = H; s.x = rnd(0, W); }
          const a = (Math.sin(s.p) * .5 + .5) * (dark ? .9 : .5) + beat * .3;
          ctx.fillStyle = dark ? 'rgba(255,255,255,' + a + ')' : 'rgba(' + P + ',' + a + ')';
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
        }
        if (!shooting && Math.random() < .004) shooting = { x: rnd(W * .2, W), y: rnd(0, H * .4), l: 0 };
        if (shooting) {
          const s = shooting; s.l += 14; const tx = s.x - s.l, ty = s.y + s.l * .5;
          const g = ctx.createLinearGradient(tx, ty, tx + 90, ty - 45); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 90, ty - 45); ctx.stroke();
          if (s.l > 600) shooting = null;
        }
      } else if (type === 'snow') {
        for (const f of items) {
          f.p += .01; f.y += f.vy; f.x += Math.sin(f.p) * .5;
          if (f.y > H + 5) { f.y = -5; f.x = rnd(0, W); }
          ctx.fillStyle = dark ? 'rgba(255,255,255,.75)' : 'rgba(' + P + ',.35)';
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
        }
      } else if (type === 'bubbles') {
        for (const b of items) {
          b.p += .01; b.y -= b.vy * (1 + beat * 2); b.x += Math.sin(b.p) * .4;
          if (b.y < -b.r) { b.y = H + b.r; b.x = rnd(0, W); }
          const c = b.c ? P : A;
          ctx.strokeStyle = 'rgba(' + c + ',.35)'; ctx.fillStyle = 'rgba(' + c + ',.06)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill(); ctx.stroke();
        }
      } else if (type === 'waves') {
        // Các dải sóng âm mảnh, biên độ tăng theo nhịp nhạc
        t += .01 * (1 + beat * 2);
        for (let k = 0; k < 6; k++) {
          const y0 = H * (.22 + k * .12), amp = 14 + k * 5 + beat * 70;
          ctx.strokeStyle = 'rgba(' + (k % 2 ? A : P) + ',' + (.1 + (k % 3) * .05) + ')'; ctx.lineWidth = k === 2 ? 1.6 : 1;
          ctx.beginPath();
          for (let x = 0; x <= W + 8; x += 8) {
            const y = y0 + Math.sin(x * .006 + t * (1 + k * .3) + k) * amp * Math.sin(x * .0016 + t * .4 + k);
            x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.stroke();
        }
        for (const d of items) {
          d.x += d.vx; d.p += .03; if (d.x > W) { d.x = 0; d.y = rnd(0, H); }
          ctx.fillStyle = 'rgba(255,255,255,' + (.25 + Math.sin(d.p) * .2) + ')';
          ctx.fillRect(d.x, d.y, d.r * 6, d.r * .8);
        }
      } else if (type === 'grid') {
        // Lưới kỹ thuật + vạch quét + khối dữ liệu nhấp nháy
        const ink = dark ? '255,255,255' : '20,22,26', gs = 48;
        ctx.fillStyle = 'rgba(' + ink + ',.16)';
        for (let x = gs; x < W; x += gs) for (let y = gs; y < H; y += gs) ctx.fillRect(x - .75, y - .75, 1.5, 1.5);
        ctx.strokeStyle = 'rgba(' + ink + ',.28)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = gs * 2; x < W; x += gs * 4) for (let y = gs * 2; y < H; y += gs * 4) { ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); }
        ctx.stroke();
        t += 1.3 + beat * 5; const sy = t % (H + 200) - 100;
        const g = ctx.createLinearGradient(0, sy - 90, 0, sy); g.addColorStop(0, 'rgba(' + P + ',0)'); g.addColorStop(1, 'rgba(' + P + ',.16)');
        ctx.fillStyle = g; ctx.fillRect(0, sy - 90, W, 90);
        ctx.fillStyle = 'rgba(' + P + ',.7)'; ctx.fillRect(0, sy, W, 1);
        for (const b of items) {
          b.life--;
          if (b.life < 0) { b.x = Math.floor(rnd(1, W / gs)) * gs; b.y = Math.floor(rnd(1, H / gs)) * gs; b.life = rnd(60, 200); }
          if (b.life % 24 < 16) { ctx.fillStyle = 'rgba(' + P + ',.35)'; ctx.fillRect(b.x + 3, b.y + 3, gs - 6, 5); ctx.fillStyle = 'rgba(' + ink + ',.2)'; ctx.fillRect(b.x + 3, b.y + 11, (gs - 6) * .6, 3); }
        }
      } else if (type === 'bokeh') {
        // Đèn thành phố nhoè (bokeh) trôi chậm
        ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
        for (const b of items) {
          b.p += .01; b.y -= b.vy * (1 + beat * 2); b.x += b.vx + Math.sin(b.p) * .2;
          if (b.y < -b.r) { b.y = H + b.r; b.x = rnd(0, W); }
          const r = b.r * (1 + beat * .3), g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
          g.addColorStop(0, 'rgba(' + b.c + ',' + b.a + ')'); g.addColorStop(.7, 'rgba(' + b.c + ',' + (b.a * .45) + ')'); g.addColorStop(1, 'rgba(' + b.c + ',0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.283); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', resize);
    resize(); frame();
  }

  /* ---------------- Trình phát nhạc ---------------- */
  const VOL_KEY = 'mysite_volume';
  function initPlayer() {
    const M = D.music, root = $('#player');
    if (!M.enabled || !M.tracks.length) { root.remove(); return null; }
    let vol = M.volume;
    try { const v = localStorage.getItem(VOL_KEY); if (v != null) vol = parseFloat(v); } catch (e) { /* noop */ }
    MusicPlayer.init(M.tracks, { volume: vol, shuffle: M.shuffle });
    root.hidden = false;
    root.innerHTML =
      '<div class="player__panel" role="region" aria-label="Trình phát nhạc">' +
        '<div class="player__head"><div class="player__disc">' + icon('music') + '</div><div class="player__meta"><b id="pl-title">—</b><span id="pl-artist"></span></div>' +
        '<button class="icon-btn" id="pl-close" aria-label="Thu gọn">' + icon('chevronDown') + '</button></div>' +
        (M.showVisualizer ? '<canvas class="player__viz" id="pl-viz"></canvas>' : '') +
        '<div class="player__progress" id="pl-prog"><i></i></div>' +
        '<div class="player__time"><span id="pl-cur">0:00</span><span id="pl-dur">--:--</span></div>' +
        '<div class="player__controls">' +
          '<button id="pl-shuffle" aria-label="Phát ngẫu nhiên" class="' + (M.shuffle ? 'on' : '') + '">' + icon('shuffle') + '</button>' +
          '<button id="pl-prev" aria-label="Bài trước">' + icon('prev') + '</button>' +
          '<button id="pl-play" class="play-main" aria-label="Phát/Tạm dừng">' + icon('play') + '</button>' +
          '<button id="pl-next" aria-label="Bài sau">' + icon('next') + '</button>' +
          '<button id="pl-listbtn" aria-label="Danh sách phát">' + icon('playlist') + '</button>' +
        '</div>' +
        '<div class="player__vol"><button id="pl-mute" aria-label="Tắt tiếng">' + icon('volume') + '</button><input type="range" id="pl-vol" min="0" max="1" step="0.01" value="' + vol + '" aria-label="Âm lượng"></div>' +
        '<div class="player__list" id="pl-list"></div>' +
      '</div>' +
      '<button class="player__fab" id="pl-fab" aria-label="Mở trình phát nhạc">' + icon('music') + '<span class="eq"><i></i><i></i><i></i></span></button>';

    const P = MusicPlayer, fmt = s => { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const typeLabel = t => t.type === 'synth' ? 'Tích hợp' : t.type === 'upload' ? 'File' : 'Link';
    function renderList() {
      $('#pl-list').innerHTML = P.tracks.map((t, i) => '<button data-track="' + i + '" class="' + (i === P.index ? 'active' : '') + '">' +
        (i === P.index && P.playing ? icon('volume') : icon('music')) + '<span>' + esc(t.title) + '</span><small>' + typeLabel(t) + '</small></button>').join('');
    }
    function renderMeta() {
      const t = P.current() || {};
      $('#pl-title').textContent = t.title || '—'; $('#pl-artist').textContent = t.artist || '';
      $('#pl-play').innerHTML = icon(P.playing ? 'pause' : 'play');
      root.classList.toggle('playing', P.playing);
      renderList();
    }
    let lastVol = vol || 0.5;
    const setVol = v => { P.setVolume(v); $('#pl-vol').value = v; $('#pl-mute').innerHTML = icon(v > 0 ? 'volume' : 'mute'); try { localStorage.setItem(VOL_KEY, v); } catch (e) { /* noop */ } };
    P.on('change', t => { renderMeta(); toast('🎵 Đang phát: ' + t.title); });
    P.on('state', renderMeta);
    P.on('error', t => toast('Không phát được: ' + t.title + ' — chuyển bài tiếp', 'err'));
    $('#pl-fab').onclick = () => root.classList.toggle('open');
    $('#pl-close').onclick = () => root.classList.remove('open');
    $('#pl-play').onclick = () => P.toggle();
    $('#pl-next').onclick = () => P.next();
    $('#pl-prev').onclick = () => P.prev();
    $('#pl-shuffle').onclick = e => { P.shuffle = !P.shuffle; e.currentTarget.classList.toggle('on', P.shuffle); toast(P.shuffle ? 'Bật phát ngẫu nhiên' : 'Tắt phát ngẫu nhiên'); };
    $('#pl-listbtn').onclick = e => { $('#pl-list').classList.toggle('open'); e.currentTarget.classList.toggle('on'); };
    $('#pl-list').onclick = e => { const b = e.target.closest('[data-track]'); if (b) P.play(+b.dataset.track); };
    $('#pl-vol').oninput = e => setVol(+e.target.value);
    $('#pl-mute').onclick = () => { if (P.volume > 0) { lastVol = P.volume; setVol(0); } else setVol(lastVol || 0.5); };
    $('#pl-prog').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); P.seek((e.clientX - r.left) / r.width); };
    document.addEventListener('click', e => { if (!e.composedPath().includes(root)) root.classList.remove('open'); });
    renderMeta();

    // Vòng lặp: visualizer, thanh tiến trình, "nhún" theo nhạc
    const viz = $('#pl-viz'), vctx = viz && viz.getContext('2d'), buf = new Uint8Array(64);
    let beat = 0;
    (function loop() {
      const lvl = P.level();
      beat += (lvl - beat) * 0.25;
      window.__beat = T.audioReactive ? beat : 0;
      if (T.audioReactive) document.documentElement.style.setProperty('--beat', beat.toFixed(3));
      const tm = P.time(), prog = $('#pl-prog');
      prog.classList.toggle('live', !!(tm && tm.live));
      if (tm) {
        $('#pl-cur').textContent = fmt(tm.elapsed);
        $('#pl-dur').textContent = tm.live ? '∞ LIVE' : fmt(tm.duration);
        if (!tm.live) $('i', prog).style.width = (tm.duration ? tm.elapsed / tm.duration * 100 : 0) + '%';
      }
      if (vctx && root.classList.contains('open')) {
        const w = viz.clientWidth, h = viz.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
        if (viz.width !== w * d) { viz.width = w * d; viz.height = h * d; }
        vctx.setTransform(d, 0, 0, d, 0, 0); vctx.clearRect(0, 0, w, h);
        P.freq(buf);
        const bars = 32, bw = w / bars, [pr, pg, pb] = hexToRgb(T.primary), [ar, ag, ab] = hexToRgb(T.accent);
        const g = vctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, 'rgb(' + pr + ',' + pg + ',' + pb + ')'); g.addColorStop(1, 'rgb(' + ar + ',' + ag + ',' + ab + ')');
        vctx.fillStyle = g;
        for (let i = 0; i < bars; i++) {
          const v = buf[Math.floor(i * 40 / bars)] / 255, bh = Math.max(2, v * h);
          vctx.beginPath();
          if (vctx.roundRect) vctx.roundRect(i * bw + 1.5, h - bh, bw - 3, bh, 2); else vctx.rect(i * bw + 1.5, h - bh, bw - 3, bh);
          vctx.fill();
        }
      }
      requestAnimationFrame(loop);
    })();
    return P;
  }

  /* ---------------- Preloader, màn chào & tự phát nhạc ---------------- */
  function initIntro(player) {
    const pre = $('#preloader'), gate = $('#gate'), M = D.music;
    const hidePre = () => { pre.classList.add('done'); setTimeout(() => pre.remove(), 800); if (!T.welcomeGate) setTimeout(dockPeek, 700); };
    if (T.preloader) { const t0 = performance.now(); const go = () => setTimeout(hidePre, Math.max(0, 900 - (performance.now() - t0))); document.readyState === 'complete' ? go() : window.addEventListener('load', go); }
    else { pre.remove(); if (!T.welcomeGate) setTimeout(dockPeek, 900); }

    if (T.welcomeGate) {
      gate.hidden = false; document.body.classList.add('no-scroll');
      $('#gate-logo').textContent = (D.general.logoText || 'N')[0];
      $('#gate-title').textContent = 'Chào mừng đến với ' + D.general.siteName;
      if (!player) { $('#gate-sub').textContent = D.general.tagline; $('#gate-silent').remove(); }
      const leave = withMusic => {
        gate.classList.add('leave'); document.body.classList.remove('no-scroll');
        setTimeout(() => gate.remove(), 800);
        setTimeout(dockPeek, 900);
        if (withMusic && player) player.play(0);
      };
      $('#gate-enter').onclick = () => leave(true);
      const s = $('#gate-silent'); if (s) s.onclick = () => leave(false);
      return;
    }
    gate.remove();
    if (player && M.autoplay) {
      const start = () => { ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.removeEventListener(ev, start, true)); if (!player.playing) player.play(0); };
      ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, start, true));
    }
  }

  /* Tự tải lại khi trang quản trị lưu thay đổi (ở tab khác) */
  const liveReload = () => { toast('Nội dung vừa được cập nhật — đang tải lại…'); setTimeout(() => location.reload(), 900); };
  window.addEventListener('storage', e => { if (e.key === Store.KEYS.data) liveReload(); });
  try { new BroadcastChannel('mysite').onmessage = e => { if (e.data === 'saved') liveReload(); }; } catch (e) { /* trình duyệt cũ */ }

  /* ---------------- Khởi động ---------------- */
  renderAnnounce();
  renderHeader();
  renderMain();
  renderFooter();
  applyTheme();
  renderDock();
  Store.trackVisit();
  initReveal();
  initTyping();
  initTilt();
  initOrbit();
  initRipple();
  initScroll();
  initMenu();
  initThemeToggle();
  initSkinPicker();
  initServices();
  initSlider();
  initFaq();
  initForm();
  initCursor();
  initBackground();
  const player = initPlayer();
  initIntro(player);
  if (T.animations === false) document.body.dataset.anim = 'off';
})();
