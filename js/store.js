/* ==========================================================================
   store.js — Dữ liệu mặc định, lưu trữ (localStorage / IndexedDB), bộ icon
   Dùng chung cho trang chính (index.html) và trang quản trị (admin.html)
   ========================================================================== */
(function (global) {
  'use strict';

  const KEYS = {
    data: 'mysite_data_v1',
    messages: 'mysite_messages_v1',
    stats: 'mysite_stats_v1',
    session: 'mysite_admin_session'
  };

  /* ---------- Bộ icon SVG (dạng nét, viewBox 24) ---------- */
  const ICONS = {
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
    video: '<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    map: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    next: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
    prev: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>',
    volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    mute: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
    shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    playlist: '<path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronUp: '<path d="m18 15-6-6-6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    layout: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    tag: '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    youtube: '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V3a5 5 0 0 0 5 5"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    pen: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.59 7.59"/><circle cx="11" cy="11" r="2"/>',
    smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>'
  };

  function icon(name, cls) {
    const body = ICONS[name] || ICONS.sparkles;
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  /* Icon dùng cho dịch vụ / quy trình (hiển thị trong bộ chọn icon ở trang quản trị) */
  const SERVICE_ICONS = ['code', 'palette', 'video', 'megaphone', 'lightbulb', 'wrench', 'camera', 'rocket', 'heart', 'shield', 'chart', 'users', 'music', 'sparkles', 'globe', 'cart', 'smartphone', 'pen', 'target', 'zap', 'award', 'coffee', 'gift', 'layers', 'image', 'search', 'message', 'send', 'star', 'clock'];

  /* ---------- Dữ liệu mặc định ---------- */
  const DEFAULT_DATA = {
    version: 1,
    general: {
      siteName: 'Nova Studio',
      logoText: 'Nova',
      tagline: 'Giải pháp sáng tạo cho thương hiệu của bạn',
      seoDescription: 'Nova Studio – dịch vụ thiết kế website, đồ hoạ, quay dựng video và marketing online chuyên nghiệp, tận tâm.',
      footerText: 'Đồng hành cùng bạn xây dựng thương hiệu nổi bật, chuyên nghiệp và khác biệt.',
      showAdminLink: true,
      announcement: {
        enabled: true,
        text: '🎉 Ưu đãi tháng này: Giảm 20% cho khách hàng mới đăng ký tư vấn!',
        linkText: 'Nhận ưu đãi',
        link: '#contact'
      },
      hero: {
        badge: 'Sẵn sàng nhận dự án mới',
        title: 'Biến ý tưởng thành',
        highlight: 'trải nghiệm ấn tượng',
        typingPrefix: 'Chúng tôi chuyên',
        typingWords: ['Thiết kế Website', 'Thiết kế Đồ hoạ', 'Quay dựng Video', 'Marketing Online'],
        subtitle: 'Đội ngũ trẻ, sáng tạo và tận tâm — mang đến giải pháp trọn gói giúp thương hiệu của bạn nổi bật trên môi trường số.',
        ctaPrimary: 'Liên hệ tư vấn',
        ctaSecondary: 'Xem dịch vụ',
        cardName: 'Nova Studio',
        cardRole: 'Creative & Digital Agency',
        cardInitials: 'NS',
        floatBadges: ['⚡ Phản hồi trong 15 phút', '🏆 5+ năm kinh nghiệm', '💎 Cam kết chất lượng']
      },
      about: {
        text: 'Chúng tôi là một studio sáng tạo với niềm đam mê thiết kế và công nghệ. Mỗi dự án là một câu chuyện riêng — chúng tôi lắng nghe, thấu hiểu và biến mong muốn của bạn thành sản phẩm đẹp, hiệu quả và bền vững.',
        highlights: ['Tư vấn miễn phí, báo giá minh bạch', 'Bàn giao đúng hạn, hỗ trợ trọn đời', 'Thiết kế độc quyền, không dùng mẫu có sẵn', 'Tối ưu cho điện thoại & tốc độ tải trang'],
        experienceYears: '5+',
        experienceLabel: 'Năm kinh nghiệm'
      },
      stats: [
        { value: 250, suffix: '+', label: 'Dự án hoàn thành' },
        { value: 180, suffix: '+', label: 'Khách hàng hài lòng' },
        { value: 98, suffix: '%', label: 'Tỉ lệ quay lại' },
        { value: 24, suffix: '/7', label: 'Hỗ trợ khách hàng' }
      ]
    },

    theme: {
      mode: 'dark',            // dark | light | auto
      primary: '#7c5cff',
      accent: '#22d3ee',
      radius: 14,
      font: 'Be Vietnam Pro',
      effect: 'particles',     // particles | stars | snow | bubbles | none
      revealStyle: 'fade-up',  // fade-up | zoom | slide | blur | flip | none
      heroLayout: 'split',     // split | center
      cardStyle: 'glass',      // glass | solid | outline
      preloader: true,
      welcomeGate: false,
      cursorGlow: true,
      tilt: true,
      animations: true,
      audioReactive: true
    },

    sections: [
      { id: 'hero', name: 'Trang chủ', title: '', subtitle: '', visible: true },
      { id: 'about', name: 'Giới thiệu', title: 'Về chúng tôi', subtitle: 'Sáng tạo – Tận tâm – Hiệu quả', visible: true },
      { id: 'services', name: 'Dịch vụ', title: 'Dịch vụ của chúng tôi', subtitle: 'Giải pháp trọn gói cho mọi nhu cầu của bạn', visible: true },
      { id: 'process', name: 'Quy trình', title: 'Quy trình làm việc', subtitle: '4 bước đơn giản – rõ ràng – minh bạch', visible: true },
      { id: 'pricing', name: 'Bảng giá', title: 'Bảng giá tham khảo', subtitle: 'Chọn gói phù hợp, nâng cấp bất cứ lúc nào', visible: true },
      { id: 'testimonials', name: 'Đánh giá', title: 'Khách hàng nói gì', subtitle: 'Niềm tin của khách hàng là động lực của chúng tôi', visible: true },
      { id: 'faq', name: 'Hỏi đáp', title: 'Câu hỏi thường gặp', subtitle: 'Giải đáp nhanh những thắc mắc phổ biến', visible: true },
      { id: 'contact', name: 'Liên hệ', title: 'Liên hệ với chúng tôi', subtitle: 'Để lại lời nhắn — chúng tôi sẽ phản hồi ngay', visible: true }
    ],

    services: [
      { id: 's1', icon: 'code', title: 'Thiết kế Website', category: 'Công nghệ', short: 'Website hiện đại, chuẩn SEO, tối ưu tốc độ và hiển thị hoàn hảo trên mọi thiết bị.', desc: 'Chúng tôi thiết kế và lập trình website theo yêu cầu: giới thiệu doanh nghiệp, bán hàng, landing page… Giao diện độc quyền, quản trị dễ dàng, bàn giao mã nguồn đầy đủ.', features: ['Giao diện độc quyền theo thương hiệu', 'Chuẩn SEO & tối ưu tốc độ', 'Tương thích mọi thiết bị', 'Trang quản trị dễ sử dụng', 'Bảo hành & hỗ trợ trọn đời'], price: 'Từ 4.900.000đ', featured: true, visible: true },
      { id: 's2', icon: 'palette', title: 'Thiết kế Đồ hoạ', category: 'Sáng tạo', short: 'Logo, bộ nhận diện thương hiệu, banner, ấn phẩm quảng cáo chuyên nghiệp.', desc: 'Xây dựng hình ảnh thương hiệu nhất quán và chuyên nghiệp: logo, name card, bao bì, banner mạng xã hội, catalogue, profile công ty…', features: ['Logo & bộ nhận diện', 'Banner / Poster / Social post', 'Chỉnh sửa không giới hạn', 'Bàn giao file gốc'], price: 'Từ 1.500.000đ', featured: false, visible: true },
      { id: 's3', icon: 'video', title: 'Quay dựng Video', category: 'Sáng tạo', short: 'Video quảng cáo, TVC, video TikTok/Reels bắt trend, thu hút người xem.', desc: 'Từ kịch bản đến hậu kỳ: quay phim, dựng video, chèn hiệu ứng, âm thanh, phụ đề. Phù hợp quảng cáo, giới thiệu sản phẩm, sự kiện.', features: ['Lên kịch bản sáng tạo', 'Quay 4K, thiết bị chuyên nghiệp', 'Hậu kỳ màu & âm thanh', 'Tối ưu cho TikTok / Reels / YouTube'], price: 'Từ 3.000.000đ', featured: false, visible: true },
      { id: 's4', icon: 'megaphone', title: 'Marketing Online', category: 'Marketing', short: 'Quảng cáo Facebook, Google, TikTok — tiếp cận đúng khách hàng, tối ưu chi phí.', desc: 'Lập kế hoạch và triển khai chiến dịch quảng cáo đa kênh, theo dõi và tối ưu liên tục, báo cáo minh bạch hằng tuần.', features: ['Nghiên cứu khách hàng mục tiêu', 'Chạy & tối ưu quảng cáo', 'Báo cáo hiệu quả hằng tuần', 'Tư vấn nội dung'], price: 'Từ 5.000.000đ/tháng', featured: true, visible: true },
      { id: 's5', icon: 'lightbulb', title: 'Tư vấn Thương hiệu', category: 'Marketing', short: 'Định vị thương hiệu, chiến lược truyền thông giúp bạn khác biệt trên thị trường.', desc: 'Phân tích thị trường, đối thủ và khách hàng để xây dựng chiến lược thương hiệu dài hạn, thông điệp rõ ràng và nhất quán.', features: ['Phân tích thị trường & đối thủ', 'Định vị & thông điệp', 'Lộ trình truyền thông'], price: 'Liên hệ', featured: false, visible: true },
      { id: 's6', icon: 'wrench', title: 'Hỗ trợ Kỹ thuật', category: 'Công nghệ', short: 'Bảo trì website, tên miền, hosting, email doanh nghiệp — nhanh chóng, tận tình.', desc: 'Dịch vụ bảo trì định kỳ, sao lưu dữ liệu, cập nhật bảo mật, xử lý sự cố và hỗ trợ kỹ thuật 24/7.', features: ['Bảo trì & sao lưu định kỳ', 'Tên miền, hosting, email', 'Xử lý sự cố 24/7'], price: 'Từ 500.000đ/tháng', featured: false, visible: true }
    ],

    process: [
      { icon: 'message', title: 'Tiếp nhận & Tư vấn', desc: 'Lắng nghe nhu cầu, tư vấn giải pháp phù hợp và báo giá chi tiết miễn phí.' },
      { icon: 'pen', title: 'Lên ý tưởng & Thiết kế', desc: 'Phác thảo, thiết kế bản mẫu và chỉnh sửa đến khi bạn hài lòng.' },
      { icon: 'rocket', title: 'Triển khai', desc: 'Thực hiện dự án đúng tiến độ, cập nhật tình hình liên tục.' },
      { icon: 'award', title: 'Bàn giao & Hỗ trợ', desc: 'Bàn giao, hướng dẫn sử dụng và đồng hành hỗ trợ lâu dài.' }
    ],

    pricing: [
      { id: 'p1', name: 'Cơ bản', price: '2.990.000đ', period: '/ dự án', desc: 'Phù hợp cá nhân, cửa hàng nhỏ mới bắt đầu.', features: ['Landing page 1 trang', 'Tên miền & hosting 1 năm', 'Tối ưu điện thoại', 'Hỗ trợ 3 tháng'], highlight: false, cta: 'Chọn gói này' },
      { id: 'p2', name: 'Chuyên nghiệp', price: '6.990.000đ', period: '/ dự án', desc: 'Lựa chọn tốt nhất cho doanh nghiệp vừa và nhỏ.', features: ['Website đến 8 trang', 'Trang quản trị nội dung', 'Chuẩn SEO cơ bản', 'Logo & banner đi kèm', 'Hỗ trợ 12 tháng'], highlight: true, cta: 'Chọn gói này' },
      { id: 'p3', name: 'Doanh nghiệp', price: 'Liên hệ', period: '', desc: 'Giải pháp tuỳ biến toàn diện theo yêu cầu.', features: ['Tính năng theo yêu cầu', 'Tích hợp thanh toán, CRM', 'Marketing tổng thể', 'Quản lý dự án riêng', 'Hỗ trợ trọn đời'], highlight: false, cta: 'Nhận tư vấn' }
    ],

    testimonials: [
      { name: 'Nguyễn Minh Anh', role: 'Chủ shop thời trang', text: 'Website đẹp hơn mong đợi, đơn hàng online tăng rõ rệt chỉ sau 1 tháng. Đội ngũ hỗ trợ rất nhiệt tình!', rating: 5 },
      { name: 'Trần Quốc Bảo', role: 'Giám đốc công ty TNHH ABC', text: 'Làm việc chuyên nghiệp, đúng hạn, báo giá rõ ràng. Bộ nhận diện thương hiệu mới giúp công ty chúng tôi tự tin hơn hẳn.', rating: 5 },
      { name: 'Lê Thu Hà', role: 'Founder quán cà phê Mộc', text: 'Video quảng cáo cực kỳ cuốn, lượt xem TikTok tăng vọt. Chắc chắn sẽ tiếp tục hợp tác lâu dài.', rating: 5 },
      { name: 'Phạm Đức Long', role: 'Kinh doanh bất động sản', text: 'Chiến dịch quảng cáo được tối ưu tốt, chi phí mỗi khách hàng giảm gần một nửa. Rất đáng tiền!', rating: 4 }
    ],

    faq: [
      { q: 'Thời gian hoàn thành một dự án là bao lâu?', a: 'Tuỳ quy mô: landing page khoảng 5–7 ngày, website doanh nghiệp 2–4 tuần, bộ nhận diện thương hiệu 1–2 tuần. Tiến độ cụ thể sẽ được thống nhất khi ký hợp đồng.' },
      { q: 'Tôi có được chỉnh sửa sau khi bàn giao không?', a: 'Có. Bạn được chỉnh sửa miễn phí trong thời gian bảo hành và được hướng dẫn tự cập nhật nội dung qua trang quản trị.' },
      { q: 'Hình thức thanh toán như thế nào?', a: 'Thanh toán theo 2–3 đợt: đặt cọc khi ký hợp đồng, phần còn lại khi nghiệm thu. Hỗ trợ chuyển khoản và tiền mặt.' },
      { q: 'Có hỗ trợ khách hàng ở tỉnh khác không?', a: 'Hoàn toàn được. Chúng tôi làm việc online qua Zalo, Google Meet và hỗ trợ khách hàng trên toàn quốc.' }
    ],

    contact: {
      phone: '0909 123 456',
      email: 'hello@novastudio.vn',
      zalo: '0909123456',
      messenger: 'https://m.me/',
      address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      hours: 'Thứ 2 – Thứ 7: 8:00 – 21:00',
      mapQuery: 'Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      showMap: true,
      showForm: true,
      floatingButtons: true,
      socials: { facebook: 'https://facebook.com/', youtube: 'https://youtube.com/', tiktok: 'https://tiktok.com/', instagram: '' }
    },

    music: {
      enabled: true,
      autoplay: false,
      volume: 0.5,
      showVisualizer: true,
      shuffle: false,
      tracks: [
        { id: 't1', type: 'synth', preset: 'lofi', title: 'Lofi Chill', artist: 'Nhạc tích hợp' },
        { id: 't2', type: 'synth', preset: 'ambient', title: 'Ambient Dream', artist: 'Nhạc tích hợp' },
        { id: 't3', type: 'synth', preset: 'piano', title: 'Piano Calm', artist: 'Nhạc tích hợp' },
        { id: 't4', type: 'synth', preset: 'upbeat', title: 'Upbeat Energy', artist: 'Nhạc tích hợp' }
      ]
    },

    admin: {
      passwordHash: null // null = dùng mật khẩu mặc định "admin123"
    }
  };

  /* ---------- Tiện ích ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  // Trộn dữ liệu đã lưu với mặc định để luôn đủ trường khi nâng cấp phiên bản
  function merge(def, saved) {
    if (!isObj(def) || !isObj(saved)) return saved === undefined ? clone(def) : saved;
    const out = {};
    Object.keys(def).forEach(k => { out[k] = k in saved ? merge(def[k], saved[k]) : clone(def[k]); });
    Object.keys(saved).forEach(k => { if (!(k in out)) out[k] = saved[k]; });
    return out;
  }

  function readJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { console.warn('Không lưu được', e); return false; }
  }

  // Hàm băm đơn giản (cyrb53) — chỉ dùng cho bản demo phía trình duyệt
  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    str = 'nova::' + str;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  function uid(prefix) { return (prefix || 'id') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---------- Store ---------- */
  const Store = {
    KEYS,
    defaults: () => clone(DEFAULT_DATA),

    load() { return merge(DEFAULT_DATA, readJSON(KEYS.data, {}) || {}); },
    save(data) { return writeJSON(KEYS.data, data); },
    reset() { localStorage.removeItem(KEYS.data); },

    messages() { return readJSON(KEYS.messages, []); },
    saveMessages(list) { writeJSON(KEYS.messages, list); },
    addMessage(msg) {
      const list = Store.messages();
      list.unshift(Object.assign({ id: uid('m'), date: new Date().toISOString(), read: false }, msg));
      Store.saveMessages(list);
    },

    stats() { return readJSON(KEYS.stats, { total: 0, days: {} }); },
    trackVisit() {
      try {
        if (sessionStorage.getItem('mysite_visited')) return;
        sessionStorage.setItem('mysite_visited', '1');
      } catch (e) { /* ignore */ }
      const s = Store.stats();
      s.total = (s.total || 0) + 1;
      s.days = s.days || {};
      s.days[today()] = (s.days[today()] || 0) + 1;
      writeJSON(KEYS.stats, s);
    },

    checkPassword(data, pw) {
      const h = data.admin && data.admin.passwordHash;
      return h ? hash(pw) === h : pw === 'admin123';
    },
    hash,
    uid,
    clone
  };

  /* ---------- IndexedDB: lưu file nhạc người dùng tải lên ---------- */
  const AudioDB = {
    _db: null,
    open() {
      if (this._db) return Promise.resolve(this._db);
      return new Promise((resolve, reject) => {
        if (!('indexedDB' in global)) return reject(new Error('Trình duyệt không hỗ trợ IndexedDB'));
        const req = indexedDB.open('mysite_audio', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('files');
        req.onsuccess = () => { this._db = req.result; resolve(this._db); };
        req.onerror = () => reject(req.error);
      });
    },
    async put(id, blob) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').put(blob, id);
        tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
      });
    },
    async get(id) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const req = db.transaction('files').objectStore('files').get(id);
        req.onsuccess = () => res(req.result || null); req.onerror = () => rej(req.error);
      });
    },
    async del(id) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').delete(id);
        tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
      });
    }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  global.Store = Store;
  global.AudioDB = AudioDB;
  global.ICONS = ICONS;
  global.SERVICE_ICONS = SERVICE_ICONS;
  global.icon = icon;
  global.esc = esc;
})(window);
