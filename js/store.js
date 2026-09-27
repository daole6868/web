/* ==========================================================================
   store.js — Dữ liệu mặc định, lưu trữ (localStorage / IndexedDB), bộ icon
   Dùng chung cho trang chính (index.html) và trang quản trị (admin.html)
   ========================================================================== */
(function (global) {
  'use strict';

  const KEYS = {
    data: 'mysite_data_v2',
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
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    gamepad: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59c-.01.05-.01.1-.02.15C2.6 9.42 2 14.46 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.41-1.41A2 2 0 0 1 9.83 16h4.34a2 2 0 0 1 1.41.59L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.55-.6-6.58-.69-7.26-.01-.05-.01-.1-.02-.15A4 4 0 0 0 17.32 5z"/>',
    swords: '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    gem: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
    compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    factory: '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3 0 1.25 1 2 2.5 2.5z"/>',
    crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',
    train: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
    wave: '<path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"/>',
    wind: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
    tv: '<rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>',
    building: '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    zalo: '<text x="12" y="15.6" text-anchor="middle" font-size="9.5" font-weight="800" textLength="21" lengthAdjust="spacingAndGlyphs" font-family="Arial, sans-serif" fill="currentColor" stroke="none">Zalo</text>',
    messenger: '<path d="M12 2.5c-5.2 0-9.5 3.9-9.5 8.8 0 2.8 1.4 5.2 3.6 6.8v3.4l3.3-1.8c.8.2 1.7.4 2.6.4 5.2 0 9.5-3.9 9.5-8.8S17.2 2.5 12 2.5Z"/><path d="m6.8 13.6 3.4-3.6 2.2 2.1 3.8-3.7-3.4 3.6-2.2-2.1Z" fill="currentColor"/>',
    discord: '<path d="M8.5 17.5c-2.2 0-4.2-1-5.5-2.2.2-4.2 1.3-8 3.3-10.8 1.3-.6 2.7-1 4.1-1.2l.6 1.2h2l.6-1.2c1.4.2 2.8.6 4.1 1.2 2 2.8 3.1 6.6 3.3 10.8-1.3 1.2-3.3 2.2-5.5 2.2l-1-1.8"/><circle cx="9" cy="11.5" r="1.3" fill="currentColor"/><circle cx="15" cy="11.5" r="1.3" fill="currentColor"/><path d="M7.5 15.3c3 1.4 6 1.4 9 0"/>',
    headset: '<path d="M3 13a9 9 0 0 1 18 0"/><rect x="2.5" y="13" width="5" height="7" rx="2"/><rect x="16.5" y="13" width="5" height="7" rx="2"/><path d="M19 20v.5a2.5 2.5 0 0 1-2.5 2.5H13"/>'
  };

  function icon(name, cls) {
    const body = ICONS[name] || ICONS.sparkles;
    return '<svg class="ico ico--' + name + ' ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  /* Icon dùng cho dịch vụ / quy trình (hiển thị trong bộ chọn icon ở trang quản trị) */
  const SERVICE_ICONS = ['gamepad', 'swords', 'trophy', 'gem', 'compass', 'calendar', 'factory', 'flame', 'crown', 'train', 'wave', 'wind', 'tv', 'building', 'code', 'palette', 'video', 'megaphone', 'lightbulb', 'wrench', 'camera', 'rocket', 'heart', 'shield', 'chart', 'users', 'music', 'sparkles', 'globe', 'cart', 'smartphone', 'pen', 'target', 'zap', 'award', 'coffee', 'gift', 'layers', 'image', 'search', 'message', 'send', 'star', 'clock'];

  /* ---------- Phong cách (skin) lấy cảm hứng từ các tựa game ----------
     Chỉ dùng màu sắc, phông chữ, hoạ tiết tự vẽ — không dùng logo/hình ảnh chính thức. */
  const SKINS = {
    default: { bg: '#0a0c16', ink: '#e9ebf8', name: 'Nova Neon', game: 'Mặc định', tagline: 'Hiện đại, gradient tím – xanh', primary: '#7c5cff', accent: '#22d3ee', font: 'Be Vietnam Pro', display: 'Be Vietnam Pro', effect: 'particles', radius: 14, mode: 'dark', watermark: '' },
    genshin: { bg: '#0e1322', ink: '#f4ecd8', name: 'Teyvat', game: 'Genshin Impact', tagline: 'Vàng kim thanh lịch, hoạ tiết cổ điển', primary: '#d8b36a', accent: '#72c7c9', font: 'Be Vietnam Pro', display: 'Cormorant Garamond', effect: 'stars', radius: 12, mode: 'dark', watermark: 'TEYVAT' },
    wuwa: { bg: '#08090b', ink: '#eef2f1', name: 'Solaris', game: 'Wuthering Waves', tagline: 'Tối giản đen – trắng, sóng âm, góc vát', primary: '#5fe3d6', accent: '#e9d28f', font: 'Be Vietnam Pro', display: 'Saira', effect: 'waves', radius: 3, mode: 'dark', watermark: 'SOLARIS' },
    hsr: { bg: '#070a1c', ink: '#eef0ff', name: 'Astral Express', game: 'Honkai: Star Rail', tagline: 'Vũ trụ sâu thẳm, vàng & tím oải hương', primary: '#f2c46d', accent: '#a58bff', font: 'Be Vietnam Pro', display: 'Exo 2', effect: 'stars', radius: 12, mode: 'dark', watermark: 'ASTRAL' },
    zzz: { bg: '#0b0b0b', ink: '#f4f4ee', name: 'New Eridu', game: 'Zenless Zone Zero', tagline: 'Đường phố, neon vàng chanh, phong cách truyện tranh', primary: '#d4ff1e', accent: '#ff6a1a', font: 'Be Vietnam Pro', display: 'Barlow Condensed', effect: 'none', radius: 6, mode: 'dark', watermark: 'ERIDU' },
    endfield: { bg: '#e9e9e4', ink: '#15171a', name: 'Talos-II', game: 'Arknights: Endfield', tagline: 'Công nghiệp sci-fi, vàng cảnh báo, sáng', primary: '#ffd000', accent: '#17191c', font: 'Be Vietnam Pro', display: 'Chakra Petch', effect: 'grid', radius: 2, mode: 'light', watermark: 'TALOS-II' },
    nte: { bg: '#0c0717', ink: '#fff4fb', name: 'Hethereau', game: 'Neverness to Everness', tagline: 'Thành phố đêm siêu nhiên, neon hồng – tím', primary: '#ff4fa3', accent: '#7a7dff', font: 'Be Vietnam Pro', display: 'Montserrat', effect: 'bokeh', radius: 16, mode: 'dark', watermark: 'EVERNESS' }
  };

  /* ---------- Dữ liệu mặc định ---------- */
  const GAMES = ['Genshin Impact', 'Wuthering Waves', 'Honkai: Star Rail', 'Zenless Zone Zero', 'Arknights: Endfield', 'Neverness to Everness'];
  const DEFAULT_DATA = {
    version: 2,
    general: {
      siteName: 'NOVA BOOST',
      logoText: 'NOVA',
      tagline: 'Cày thuê game gacha uy tín – cày tay 100%',
      seoDescription: 'NOVA BOOST – dịch vụ cày thuê Genshin Impact, Honkai: Star Rail, Wuthering Waves, Zenless Zone Zero, Arknights: Endfield, Neverness to Everness. Cày tay 100%, bảo mật, giá tốt.',
      footerText: 'Game thủ phục vụ game thủ. Giữ nhịp tài khoản của bạn khi bận học, bận làm — an toàn, nhanh chóng, giá hợp lý.',
      copyright: '© {year} NOVA BOOST. Mọi quyền được bảo lưu.',
      shareTitle: '',        // để trống = Tên website — Khẩu hiệu
      shareImage: '',        // ảnh hiện khi gửi link (Facebook, Zalo, Messenger)
      showAdminLink: true,
      games: GAMES.slice(),
      announcement: {
        enabled: true,
        text: '🎮 Khai trương: Giảm 20% đơn đầu tiên cho mọi game!',
        linkText: 'Nhận ưu đãi',
        link: '#contact'
      },
      hero: {
        badge: 'Đang nhận đơn — phản hồi trong 5 phút',
        title: 'Cày thuê game gacha',
        highlight: 'uy tín · an toàn',
        typingPrefix: 'Nhận cày',
        typingWords: GAMES.slice(),
        subtitle: 'Daily, endgame, khám phá bản đồ, farm build… Cày tay 100%, bảo mật tuyệt đối — bạn chỉ việc quay gacha!',
        ctaPrimary: 'Thuê cày ngay',
        ctaSecondary: 'Xem dịch vụ',
        cardName: 'NOVA BOOST',
        cardRole: 'Cày thuê game gacha',
        cardInitials: 'NB',
        floatBadges: [
          { icon: 'shield', text: '100% cày tay, không tool' },
          { icon: 'zap', text: 'Phản hồi trong 5 phút' },
          { icon: 'trophy', text: '1.500+ đơn hoàn thành' },
          { icon: 'star', text: '4.9/5 từ 800+ khách' },
          { icon: 'gamepad', text: 'Nhận mọi server' },
          { icon: 'clock', text: 'Hỗ trợ 24/7' }
        ]
      },
      about: {
        text: 'NOVA BOOST là đội ngũ game thủ lâu năm, chơi và hiểu rõ từng tựa game gacha. Chúng tôi giúp bạn giữ nhịp tài khoản khi bận rộn: không bỏ lỡ sự kiện, không phí thể lực, endgame luôn full sao.',
        highlights: ['Cày tay 100% – tuyệt đối không tool/hack', 'Báo cáo ảnh/video từng đơn', 'Bảo mật thông tin tài khoản', 'Nhận mọi server: Asia, America, Europe, TW/HK/MO'],
        tiles: ['Cày tay 100% – không tool', 'Bảo mật tài khoản tuyệt đối'],
        experienceYears: '5+',
        experienceLabel: 'Năm kinh nghiệm cày thuê'
      },
      stats: [
        { value: 1500, suffix: '+', label: 'Đơn hoàn thành' },
        { value: 800, suffix: '+', label: 'Khách hàng tin tưởng' },
        { value: 100, suffix: '%', label: 'Cày tay, không tool' },
        { value: 24, suffix: '/7', label: 'Nhận đơn & hỗ trợ' }
      ]
    },

    theme: {
      skin: 'genshin',         // default | genshin | wuwa | hsr | zzz | endfield | nte
      skinSwitcher: true,      // hiện nút "Đổi phong cách" để khách xem thử
      mode: 'dark',            // dark | light | auto
      primary: '#d8b36a',
      accent: '#72c7c9',
      radius: 12,
      font: 'Be Vietnam Pro',
      effect: 'stars',         // particles | stars | snow | bubbles | waves | grid | bokeh | none
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
      { id: 'about', name: 'Giới thiệu', title: 'Về NOVA BOOST', subtitle: 'Game thủ phục vụ game thủ', visible: true },
      { id: 'services', name: 'Dịch vụ', title: 'Dịch vụ cày thuê', subtitle: 'Chọn game của bạn — chúng tôi lo phần còn lại', visible: true },
      { id: 'process', name: 'Quy trình', title: 'Quy trình thuê cày', subtitle: '4 bước – nhanh gọn – an toàn', visible: true },
      { id: 'pricing', name: 'Bảng giá', title: 'Bảng giá tham khảo', subtitle: 'Giá tốt – minh bạch – không phát sinh', visible: true },
      { id: 'testimonials', name: 'Đánh giá', title: 'Khách hàng nói gì', subtitle: 'Hơn 800 game thủ đã tin tưởng', visible: true },
      { id: 'faq', name: 'Hỏi đáp', title: 'Câu hỏi thường gặp', subtitle: 'An toàn tài khoản là ưu tiên số 1', visible: true },
      { id: 'contact', name: 'Liên hệ', title: 'Liên hệ thuê cày', subtitle: 'Nhắn tin để được báo giá trong 5 phút', visible: true }
    ],

    services: [
      { id: 'g1', icon: 'compass', title: 'Khám phá bản đồ 100%', category: 'Genshin Impact', short: 'Mở dịch chuyển, nhặt rương, Thần Đồng, giải câu đố — lấy trọn Nguyên Thạch trên bản đồ.', desc: 'Khám phá toàn bộ khu vực bạn chọn: mở điểm dịch chuyển, tượng Thất Thiên Thần, rương, thần đồng, câu đố và nhiệm vụ thế giới. Báo cáo ảnh phần trăm khám phá trước – sau.', features: ['Mở toàn bộ điểm dịch chuyển', 'Nhặt rương & Thần Đồng', 'Giải câu đố, nhiệm vụ thế giới', 'Báo cáo ảnh % khám phá'], price: 'Từ 80.000đ/khu vực', featured: true, visible: true },
      { id: 'g2', icon: 'trophy', title: 'La Hoàn 36★ & Kịch Trường', category: 'Genshin Impact', short: 'Clear La Hoàn Thâm Cảnh 36 sao và Kịch Trường Ảo Ảnh mỗi kỳ, nhận đủ Nguyên Thạch.', desc: 'Clear endgame mỗi kỳ làm mới với đội hình phù hợp tài khoản của bạn. Có ảnh/video kết quả.', features: ['La Hoàn Thâm Cảnh 36★', 'Kịch Trường Ảo Ảnh', 'Tư vấn đội hình kèm theo'], price: 'Từ 60.000đ/kỳ', featured: false, visible: true },
      { id: 'g3', icon: 'gem', title: 'Farm Thánh Di Vật & nâng nhân vật', category: 'Genshin Impact', short: 'Farm bí cảnh, nguyên liệu đột phá, thiên phú — build nhân vật chuẩn chỉ.', desc: 'Dùng nhựa hằng ngày để farm Thánh Di Vật, nguyên liệu đột phá, thiên phú và vũ khí theo nhân vật bạn chỉ định.', features: ['Farm Thánh Di Vật theo set', 'Nguyên liệu đột phá & thiên phú', 'Không dùng Nguyên Thạch khi chưa được phép'], price: 'Từ 50.000đ/ngày', featured: false, visible: true },
      { id: 'w1', icon: 'trophy', title: 'Tower of Adversity full sao', category: 'Wuthering Waves', short: 'Clear Tower of Adversity mỗi chu kỳ, nhận trọn Astrite thưởng.', desc: 'Clear toàn bộ tầng Tower of Adversity và nội dung endgame theo chu kỳ, tối ưu đội hình theo tài khoản.', features: ['Full sao mỗi chu kỳ', 'Ảnh báo cáo kết quả', 'Tư vấn đội hình'], price: 'Từ 60.000đ/kỳ', featured: true, visible: true },
      { id: 'w2', icon: 'wave', title: 'Farm Echo & nâng Resonator', category: 'Wuthering Waves', short: 'Săn Echo đúng set, farm tài nguyên đột phá, nâng cấp Resonator.', desc: 'Săn Echo đúng set và chỉ số chính, farm nguyên liệu nâng cấp nhân vật, vũ khí và kỹ năng.', features: ['Săn Echo theo set yêu cầu', 'Tune chỉ số', 'Farm nguyên liệu nâng cấp'], price: 'Từ 50.000đ/ngày', featured: false, visible: true },
      { id: 'h1', icon: 'trophy', title: 'Endgame: Hỗn Độn · Hư Cấu · Tận Thế', category: 'Honkai: Star Rail', short: 'Clear Memory of Chaos, Pure Fiction, Apocalyptic Shadow full sao mỗi kỳ.', desc: 'Clear toàn bộ ba chế độ endgame mỗi kỳ làm mới, nhận đủ Tinh Ngọc. Có ảnh/video báo cáo.', features: ['Memory of Chaos full sao', 'Pure Fiction full sao', 'Apocalyptic Shadow full sao'], price: 'Từ 70.000đ/kỳ', featured: true, visible: true },
      { id: 'h2', icon: 'train', title: 'Vũ Trụ Mô Phỏng & farm Di Vật', category: 'Honkai: Star Rail', short: 'Cày Simulated / Divergent Universe hằng tuần, farm Di Vật & Phụ Kiện Vị Diện.', desc: 'Hoàn thành điểm tuần Vũ Trụ Mô Phỏng, farm Di Vật và Phụ Kiện Vị Diện theo set bạn cần.', features: ['Điểm tuần Vũ Trụ Mô Phỏng', 'Farm Di Vật theo set', 'Dùng hết Sức Mạnh Khai Phá'], price: 'Từ 40.000đ/tuần', featured: false, visible: true },
      { id: 'z1', icon: 'tv', title: 'Shiyu Defense S-Rank', category: 'Zenless Zone Zero', short: 'Clear Shiyu Defense & Deadly Assault điểm tối đa, nhận đủ Polychrome.', desc: 'Clear nội dung endgame theo kỳ với điểm số cao nhất có thể theo tài khoản của bạn.', features: ['Shiyu Defense S-Rank', 'Deadly Assault', 'Ảnh báo cáo điểm số'], price: 'Từ 60.000đ/kỳ', featured: false, visible: true },
      { id: 'z2', icon: 'zap', title: 'Farm Drive Disc & Hollow Zero', category: 'Zenless Zone Zero', short: 'Farm Drive Disc chuẩn chỉ số, cày Hollow Zero và nhiệm vụ tuần.', desc: 'Dùng pin hằng ngày farm Drive Disc theo set, hoàn thành Hollow Zero / nội dung tuần và nhiệm vụ đại lý.', features: ['Farm Drive Disc theo set', 'Hollow Zero hằng tuần', 'Nhiệm vụ đại lý'], price: 'Từ 50.000đ/ngày', featured: false, visible: true },
      { id: 'e1', icon: 'factory', title: 'Xây dây chuyền nhà máy', category: 'Arknights: Endfield', short: 'Thiết kế dây chuyền sản xuất tự động tối ưu, vận hành trơn tru.', desc: 'Lên sơ đồ và xây dựng dây chuyền sản xuất tự động, tối ưu băng chuyền và năng lượng để tài nguyên về đều đặn.', features: ['Thiết kế sơ đồ tối ưu', 'Mở khoá công nghệ', 'Hướng dẫn vận hành'], price: 'Từ 100.000đ/đơn', featured: true, visible: true },
      { id: 'e2', icon: 'rocket', title: 'Cày cốt truyện & nâng Operator', category: 'Arknights: Endfield', short: 'Cày nhiệm vụ chính – phụ, farm nguyên liệu, nâng cấp Operator & trang bị.', desc: 'Hoàn thành cốt truyện, nhiệm vụ phụ, farm nguyên liệu và nâng cấp Operator theo đội hình bạn muốn.', features: ['Cốt truyện chính & phụ', 'Farm nguyên liệu', 'Nâng cấp Operator'], price: 'Từ 60.000đ/ngày', featured: false, visible: true },
      { id: 'n1', icon: 'building', title: 'Cày cốt truyện & khám phá thành phố', category: 'Neverness to Everness', short: 'Làm nhiệm vụ chính, sự kiện thành phố, thu thập vật phẩm và thành tựu.', desc: 'Hoàn thành cốt truyện, khám phá thành phố, thu thập vật phẩm và thành tựu giúp tài khoản đi nhanh hơn.', features: ['Nhiệm vụ chính & phụ', 'Khám phá, thu thập', 'Thành tựu'], price: 'Liên hệ', featured: false, visible: true },
      { id: 'n2', icon: 'calendar', title: 'Daily & sự kiện NTE', category: 'Neverness to Everness', short: 'Nhiệm vụ hằng ngày, sự kiện giới hạn — không bỏ lỡ phần thưởng nào.', desc: 'Làm nhiệm vụ hằng ngày, hằng tuần và sự kiện giới hạn thời gian.', features: ['Daily & weekly', 'Sự kiện giới hạn', 'Báo cáo hằng tuần'], price: 'Liên hệ', featured: false, visible: true },
      { id: 'm1', icon: 'calendar', title: 'Gói Daily trọn tháng', category: 'Mọi game', short: 'Daily, weekly, dùng hết thể lực mỗi ngày — bạn chỉ việc quay gacha.', desc: 'Đăng nhập mỗi ngày, làm daily/weekly, dùng hết thể lực vào nội dung bạn chọn, nhận quà sự kiện. Áp dụng cho mọi game trong danh sách.', features: ['Daily + weekly mỗi ngày', 'Dùng hết thể lực/nhựa/pin', 'Nhận quà sự kiện', 'Báo cáo hằng tuần'], price: 'Từ 150.000đ/tháng', featured: true, visible: true },
      { id: 'm2', icon: 'lightbulb', title: 'Tư vấn build & đội hình', category: 'Mọi game', short: 'Tư vấn nhân vật, vũ khí, set đồ, đội hình meta phù hợp tài khoản.', desc: 'Xem tài khoản và tư vấn nên đầu tư nhân vật nào, build ra sao, quay banner nào để tối ưu tài nguyên.', features: ['Phân tích tài khoản', 'Gợi ý build & đội hình', 'Lộ trình quay banner'], price: 'Miễn phí khi thuê', featured: false, visible: true }
    ],

    process: [
      { icon: 'message', title: 'Chọn game & dịch vụ', desc: 'Nhắn Zalo/Facebook: game, server, nội dung cần cày — báo giá ngay trong 5 phút.' },
      { icon: 'shield', title: 'Giao tài khoản an toàn', desc: 'Thông tin tài khoản được bảo mật tuyệt đối, chỉ người phụ trách đơn nắm giữ.' },
      { icon: 'swords', title: 'Cày tay 100%', desc: 'Người thật cày tay, không tool/hack, cập nhật tiến độ liên tục.' },
      { icon: 'trophy', title: 'Bàn giao & báo cáo', desc: 'Gửi ảnh/video kết quả, bạn kiểm tra rồi thanh toán và đổi mật khẩu.' }
    ],

    pricing: [
      { id: 'p1', name: 'Gói Lượt', price: '49.000đ', period: '/ lượt', desc: 'Thuê theo từng nhiệm vụ, từng kỳ endgame.', features: ['Chọn 1 nội dung bất kỳ', 'Hoàn thành trong 24h', 'Ảnh báo cáo kết quả', 'Mọi server'], highlight: false, cta: 'Thuê ngay' },
      { id: 'p2', name: 'Gói Daily Tháng', price: '150.000đ', period: '/ tháng / game', desc: 'Rảnh tay cả tháng, tài khoản vẫn đều đặn lên.', features: ['Daily + weekly mỗi ngày', 'Dùng hết thể lực', 'Nhận quà sự kiện', 'Báo cáo hằng tuần', 'Tặng 1 lượt endgame/tháng'], highlight: true, cta: 'Chọn gói này' },
      { id: 'p3', name: 'Gói VIP Trọn Gói', price: '399.000đ', period: '/ tháng', desc: 'Chăm sóc toàn diện nhiều game cùng lúc.', features: ['Tối đa 3 game', 'Daily + toàn bộ endgame', 'Farm build theo yêu cầu', 'Khám phá bản đồ mới', 'Ưu tiên xử lý 24/7'], highlight: false, cta: 'Nhận tư vấn' }
    ],

    testimonials: [
      { name: 'Minh Lữ Khách', role: 'Người chơi Genshin – AR 60', text: 'Thuê clear La Hoàn 36★ ba kỳ liền, lần nào cũng xong trong ngày. Có ảnh báo cáo đầy đủ, rất yên tâm!', rating: 5 },
      { name: 'Thảo Nguyễn', role: 'Main Star Rail & ZZZ', text: 'Gói daily tháng quá tiện, đi làm bận vẫn không bỏ lỡ sự kiện nào. Shop trả lời tin nhắn cực nhanh.', rating: 5 },
      { name: 'Hoàng Long', role: 'Người chơi Wuthering Waves', text: 'Farm Echo đúng set mình cần, chỉ số đẹp hơn mình tự farm nhiều. Giá hợp lý, sẽ thuê tiếp.', rating: 5 },
      { name: 'Khánh Vy', role: 'Tân thủ Arknights: Endfield', text: 'Nhờ dựng giúp dây chuyền nhà máy, giờ tài nguyên tự chảy về đều đều. Mười điểm không có nhưng!', rating: 5 }
    ],

    faq: [
      { q: 'Cày thuê có bị khoá tài khoản không?', a: 'Chúng tôi cày tay 100%, không dùng tool, hack hay phần mềm thứ ba — giống hệt bạn tự chơi. Tài khoản luôn được đăng nhập và chơi như người bình thường.' },
      { q: 'Thông tin tài khoản của tôi có được bảo mật?', a: 'Thông tin chỉ người phụ trách đơn nắm giữ, không chia sẻ, không tiêu tiền tệ cao cấp khi bạn chưa cho phép. Sau khi hoàn thành, bạn nên đổi mật khẩu.' },
      { q: 'Nhận cày những server nào?', a: 'Nhận tất cả server: Asia, America, Europe, TW/HK/MO cho mọi game trong danh sách.' },
      { q: 'Thanh toán như thế nào?', a: 'Đặt cọc 30–50% khi nhận đơn, phần còn lại sau khi bàn giao. Hỗ trợ chuyển khoản ngân hàng, MoMo, ZaloPay.' },
      { q: 'Bao lâu thì xong đơn?', a: 'Đơn endgame thường xong trong 24h, khám phá bản đồ 1–3 ngày tuỳ khu vực. Thời gian cụ thể được báo khi nhận đơn.' }
    ],

    contact: {
      phone: '0909 123 456',
      email: 'hotro@novaboost.vn',
      zalo: '0909123456',
      messenger: 'https://m.me/',
      address: 'Làm việc online – nhận đơn toàn quốc',
      hours: 'Nhận đơn 24/7 • Cày 8:00 – 24:00',
      mapQuery: '',
      showMap: false,
      showForm: true,
      floatingButtons: true,   // bật thanh liên hệ nhanh
      quick: {
        title: 'Hỗ trợ nhanh',
        subtitle: 'Phản hồi trong 5 phút',
        side: 'right',          // right | left
        autoPeek: true,         // tự hiện khi tải trang rồi lùi vào
        peekSeconds: 2,
        items: [
          { id: 'q1', icon: 'zalo', label: 'Zalo', desc: 'Tư vấn & báo giá nhanh', url: '', color: '', visible: true },
          { id: 'q2', icon: 'messenger', label: 'Messenger', desc: 'Nhắn tin qua Facebook', url: '', color: '', visible: true },
          { id: 'q3', icon: 'phone', label: 'Gọi điện', desc: '', url: '', color: '', visible: true },
          { id: 'q4', icon: 'send', label: 'Telegram', desc: 'Nhận đơn 24/7', url: 'https://t.me/', color: '', visible: false },
          { id: 'q5', icon: 'discord', label: 'Discord', desc: 'Cộng đồng game thủ', url: 'https://discord.gg/', color: '', visible: false }
        ]
      },
      socials: { facebook: 'https://facebook.com/', youtube: 'https://youtube.com/', tiktok: 'https://tiktok.com/', instagram: '' }
    },

    music: {
      enabled: true,
      autoplay: false,
      volume: 0.5,
      showVisualizer: true,
      shuffle: false,
      tracks: [
        { id: 't0', type: 'synth', preset: 'epic', title: 'Epic Adventure', artist: 'Nhạc tích hợp' },
        { id: 't5', type: 'synth', preset: 'synthwave', title: 'Neon Night', artist: 'Nhạc tích hợp' },
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

  /* ---------- Thanh liên hệ nhanh: icon, màu & link tự động ---------- */
  const CONTACT_ICONS = ['zalo', 'messenger', 'phone', 'send', 'discord', 'facebook', 'mail', 'youtube', 'tiktok', 'instagram', 'message', 'headset', 'globe', 'map', 'clock', 'gamepad', 'cart', 'users', 'help', 'gift'];
  const QUICK_PRESETS = {
    phone: { color: '#22c55e', url: c => c.phone ? 'tel:' + String(c.phone).replace(/[^\d+]/g, '') : '', desc: c => c.phone },
    zalo: { color: '#0068ff', url: c => c.zalo ? 'https://zalo.me/' + String(c.zalo).replace(/\D/g, '') : '', desc: c => c.zalo },
    messenger: { color: 'linear-gradient(135deg,#00b2ff,#a033ff)', url: c => c.messenger || '' },
    facebook: { color: '#1877f2', url: c => (c.socials || {}).facebook || '' },
    send: { color: '#229ed9' },
    discord: { color: '#5865f2' },
    mail: { url: c => c.email ? 'mailto:' + c.email : '', desc: c => c.email },
    youtube: { color: '#ff0000', url: c => (c.socials || {}).youtube || '' },
    tiktok: { color: '#111111', url: c => (c.socials || {}).tiktok || '' },
    instagram: { color: 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)', url: c => (c.socials || {}).instagram || '' },
    map: { url: c => c.address ? 'https://maps.google.com/?q=' + encodeURIComponent(c.mapQuery || c.address) : '', desc: c => c.address },
    clock: { desc: c => c.hours }
  };
  // Trả về { href, color, desc } — để trống link/mô tả thì lấy từ Thông tin liên hệ
  function quickLink(item, contact) {
    const p = QUICK_PRESETS[item.icon] || {}, c = contact || {};
    const href = (item.url || '').trim() || (p.url ? p.url(c) : '');
    const color = item.color === 'primary' ? '' : (item.color || p.color || '');
    const desc = (item.desc || '').trim() || (p.desc ? (p.desc(c) || '') : '');
    return { href, color, desc };
  }

  /* ---------- Tự chọn icon theo nội dung chữ (khi không chọn icon) ---------- */
  const ICON_RULES = [
    [/endgame|abyss|la hoàn|tháp|boss|full sao|36/, 'swords'],
    [/tool|hack|cày tay|an toàn|bảo mật|uy tín|bảo hành|cam kết/, 'shield'],
    [/giá|rẻ|giảm|%|ưu đãi|khuyến mãi|sale|tiết kiệm/, 'tag'],
    [/phút|nhanh|phản hồi|tốc độ|ngay|liền/, 'zap'],
    [/đơn|hoàn thành|dự án|thành tích/, 'trophy'],
    [/sao|đánh giá|review|★|\/5/, 'star'],
    [/năm|kinh nghiệm/, 'award'],
    [/24\/7|hỗ trợ|online|trực/, 'clock'],
    [/khách|người|thành viên|cộng đồng/, 'users'],
    [/server|game|acc|tài khoản|nhân vật/, 'gamepad'],
    [/quà|tặng|free|miễn phí/, 'gift'],
    [/vip|cao cấp|pro/, 'crown'],
    [/thanh toán|momo|chuyển khoản|ngân hàng/, 'cart'],
    [/bản đồ|khám phá/, 'compass']
  ];
  function guessIcon(text) {
    const t = String(text || '').toLowerCase();
    const hit = ICON_RULES.find(r => r[0].test(t));
    return hit ? hit[1] : 'sparkles';
  }
  // Bỏ emoji ở đầu (dữ liệu cũ dạng "⚡ Phản hồi…")
  const stripEmoji = t => String(t || '').replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\u{FE0F}\u{200D}\u{20E3}\s]+/u, '').trim();
  function normBadge(b) {
    if (b && typeof b === 'object') return { icon: b.icon || '', text: String(b.text || '') };
    return { icon: '', text: stripEmoji(b) };
  }
  // Chuẩn hoá dữ liệu cũ về định dạng mới
  function fixData(d) {
    const h = d && d.general && d.general.hero;
    if (h) h.floatBadges = (Array.isArray(h.floatBadges) ? h.floatBadges : []).map(normBadge).filter(b => b.text);
    return d;
  }

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

  // Màu chữ nên dùng trên nền màu chính: tối nếu màu sáng (vàng, chanh…), trắng nếu màu đậm
  function onColor(hex) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '');
    if (!m) return '#fff';
    const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * lin(parseInt(m[1], 16)) + 0.7152 * lin(parseInt(m[2], 16)) + 0.0722 * lin(parseInt(m[3], 16));
    return L > 0.3 ? '#17130a' : '#fff';
  }

  function uid(prefix) { return (prefix || 'id') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---------- Store ----------
     Hai chế độ, tự nhận biết khi khởi động (Store.init):
     - "server": chạy cùng server/server.js trên VPS → mọi dữ liệu lưu trên máy chủ,
       mọi khách đều thấy nội dung admin đã chỉnh, tin nhắn gửi về admin + Telegram.
     - "local" : mở file trực tiếp trên máy (xem trước) → lưu trong trình duyệt như cũ. */
  let MODE = 'local', DATA = null;

  async function api(method, url, body, raw) {
    const opt = { method, credentials: 'same-origin', headers: { 'X-Requested-With': 'nova' } };
    if (raw) { opt.body = raw.body; opt.headers['Content-Type'] = raw.type || 'application/octet-stream'; opt.headers['X-Filename'] = encodeURIComponent(raw.name || ''); }
    else if (body !== undefined) { opt.body = JSON.stringify(body); opt.headers['Content-Type'] = 'application/json'; }
    let res;
    try { res = await fetch(url, opt); } catch (e) { throw new Error('Không kết nối được máy chủ'); }
    let j = {};
    try { j = await res.json(); } catch (e) { /* không phải JSON */ }
    if (!res.ok || j.ok === false) { const err = new Error(j.error || ('Lỗi máy chủ (' + res.status + ')')); err.status = res.status; throw err; }
    return j;
  }
  const localData = () => fixData(merge(DEFAULT_DATA, readJSON(KEYS.data, {}) || {}));
  const sessionFlag = {
    get() { try { return sessionStorage.getItem(KEYS.session) === '1' || localStorage.getItem(KEYS.session) === '1'; } catch (e) { return false; } },
    set(remember) { try { (remember ? localStorage : sessionStorage).setItem(KEYS.session, '1'); } catch (e) { /* noop */ } },
    clear() { try { sessionStorage.removeItem(KEYS.session); localStorage.removeItem(KEYS.session); } catch (e) { /* noop */ } }
  };
  function checkLocalPassword(pw) {
    const h = DATA && DATA.admin && DATA.admin.passwordHash;
    return h ? hash(pw) === h : pw === 'admin123';
  }

  const Store = {
    KEYS,
    defaults: () => clone(DEFAULT_DATA),
    isServer: () => MODE === 'server',

    async init() {
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        try {
          const j = await api('GET', 'api/site');
          if (j.server) { MODE = 'server'; DATA = fixData(merge(DEFAULT_DATA, j.data || {})); return MODE; }
        } catch (e) { /* không có máy chủ → chế độ xem trước */ }
      }
      MODE = 'local'; DATA = localData(); return MODE;
    },
    load() { if (!DATA) DATA = localData(); return clone(DATA); },
    async save(data) {
      if (MODE === 'server') { const d = clone(data); delete d.admin; await api('PUT', 'api/site', d); }
      else if (!writeJSON(KEYS.data, data)) throw new Error('Bộ nhớ trình duyệt đầy');
      DATA = clone(data);
    },
    async reset() {
      const keepAdmin = DATA && DATA.admin;
      if (MODE === 'server') await api('DELETE', 'api/site');
      else localStorage.removeItem(KEYS.data);
      DATA = merge(DEFAULT_DATA, {});
      if (MODE === 'local' && keepAdmin) { DATA.admin = keepAdmin; writeJSON(KEYS.data, DATA); }
    },

    /* Tin nhắn */
    async messages() { return MODE === 'server' ? (await api('GET', 'api/messages')).messages : readJSON(KEYS.messages, []); },
    async addMessage(msg) {
      if (MODE === 'server') return api('POST', 'api/messages', msg);
      const list = readJSON(KEYS.messages, []);
      list.unshift(Object.assign({ id: uid('m'), date: new Date().toISOString(), read: false }, msg));
      writeJSON(KEYS.messages, list);
    },
    async setRead(id, read) {
      if (MODE === 'server') return api('POST', 'api/messages/' + encodeURIComponent(id) + '/read', { read });
      const list = readJSON(KEYS.messages, []); const m = list.find(x => x.id === id); if (m) m.read = read; writeJSON(KEYS.messages, list);
    },
    async readAll() {
      if (MODE === 'server') return api('POST', 'api/messages/read-all', {});
      writeJSON(KEYS.messages, readJSON(KEYS.messages, []).map(m => Object.assign(m, { read: true })));
    },
    async deleteMessage(id) {
      if (MODE === 'server') return api('DELETE', 'api/messages/' + encodeURIComponent(id));
      writeJSON(KEYS.messages, readJSON(KEYS.messages, []).filter(m => m.id !== id));
    },
    async clearMessages() { if (MODE === 'server') return api('DELETE', 'api/messages'); writeJSON(KEYS.messages, []); },

    /* Thống kê */
    async stats() { return MODE === 'server' ? (await api('GET', 'api/stats')).stats : readJSON(KEYS.stats, { total: 0, days: {} }); },
    async clearStats() { if (MODE === 'server') return api('DELETE', 'api/stats'); localStorage.removeItem(KEYS.stats); },
    trackVisit() {
      try {
        if (sessionStorage.getItem('mysite_visited')) return;
        sessionStorage.setItem('mysite_visited', '1');
      } catch (e) { /* ignore */ }
      if (MODE === 'server') { api('POST', 'api/visit', {}).catch(() => {}); return; }
      const s = readJSON(KEYS.stats, { total: 0, days: {} });
      s.total = (s.total || 0) + 1;
      s.days = s.days || {};
      s.days[today()] = (s.days[today()] || 0) + 1;
      writeJSON(KEYS.stats, s);
    },

    /* Đăng nhập quản trị */
    async me() {
      if (MODE === 'server') { const j = await api('GET', 'api/me'); return { loggedIn: j.loggedIn, mustChange: j.mustChange }; }
      return { loggedIn: sessionFlag.get(), mustChange: !(DATA.admin && DATA.admin.passwordHash) };
    },
    async login(pw, remember) {
      if (MODE === 'server') return api('POST', 'api/login', { password: pw, remember: !!remember });
      if (!checkLocalPassword(pw)) throw new Error('Sai mật khẩu');
      sessionFlag.set(remember);
      return { ok: true, mustChange: !(DATA.admin && DATA.admin.passwordHash) };
    },
    async logout() { if (MODE === 'server') await api('POST', 'api/logout', {}); sessionFlag.clear(); },
    async changePassword(old, pw) {
      if (MODE === 'server') return api('POST', 'api/password', { old, password: pw });
      if (!checkLocalPassword(old)) throw new Error('Mật khẩu hiện tại không đúng');
      if (pw.length < 6) throw new Error('Mật khẩu mới cần ít nhất 6 ký tự');
      const d = localData(); d.admin = { passwordHash: hash(pw) }; writeJSON(KEYS.data, d);
      DATA.admin = d.admin;
    },

    /* Telegram (chỉ khi chạy trên máy chủ) */
    telegram: {
      get: async () => (await api('GET', 'api/telegram')).telegram,
      save: async body => (await api('PUT', 'api/telegram', body)).telegram,
      detect: async () => (await api('POST', 'api/telegram/detect', {})).chats,
      test: () => api('POST', 'api/telegram/test', {})
    },

    /* Sao lưu */
    async exportBackup() {
      if (MODE === 'server') return api('GET', 'api/backup');
      const d = clone(DATA); delete d.admin;
      return { app: 'mysite', exportedAt: new Date().toISOString(), data: d, messages: readJSON(KEYS.messages, []) };
    },
    async importBackup(payload) {
      const d = payload.data || payload;
      if (!d || !d.general || !d.sections) throw new Error('File sao lưu không hợp lệ');
      if (MODE === 'server') await api('POST', 'api/backup', { data: d, messages: payload.messages });
      else {
        d.admin = DATA.admin; writeJSON(KEYS.data, d);
        if (Array.isArray(payload.messages)) writeJSON(KEYS.messages, payload.messages);
      }
      DATA = fixData(merge(DEFAULT_DATA, d));
    },

    /* Ảnh (ảnh chia sẻ link) — chỉ khi chạy trên máy chủ */
    async uploadImage(file) {
      if (MODE !== 'server') throw new Error('Tải ảnh lên chỉ dùng được khi website chạy trên VPS — hãy dán link ảnh');
      return (await api('POST', 'api/image', undefined, { body: file, type: file.type, name: file.name })).url;
    },

    /* Nhạc tải lên: máy chủ → thư mục uploads/music; xem trước → IndexedDB */
    async uploadMusic(file) {
      if (MODE === 'server') {
        const j = await api('POST', 'api/music', undefined, { body: file, type: file.type, name: file.name });
        return { id: uid('u'), type: 'upload', url: j.url, file: j.file, size: j.size };
      }
      const id = uid('u'); await AudioDB.put(id, file);
      return { id, type: 'upload', size: file.size };
    },
    async deleteMusic(track) {
      if (track.file && MODE === 'server') return api('DELETE', 'api/music/' + encodeURIComponent(track.file)).catch(() => {});
      if (!track.url) return AudioDB.del(track.id).catch(() => {});
    },

    hash,
    uid,
    onColor,
    guessIcon,
    quickLink,
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
  global.SKINS = SKINS;
  global.CONTACT_ICONS = CONTACT_ICONS;
  global.icon = icon;
  global.esc = esc;
})(window);
