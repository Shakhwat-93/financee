/* =====================================================================
   app.js — হিসাব খাতার UI
   সব ডেটা আসে window.Store থেকে (js/store.js)। ডাটাবেস বদলালে
   এই ফাইলে হাত দিতে হবে না।
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- ছোট হেল্পার ---------------- */
  var T = function (k, v) { return window.I18n ? window.I18n.t(k, v) : k; };
  var getMonths = function () { return window.I18n ? window.I18n.months() : ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']; };
  var getMonthsShort = function () { return window.I18n ? window.I18n.monthsShort() : ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে']; };
  var OPS = '+−×÷';
  var TABS = ['home', 'services', 'clients', 'stats'];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var todayISO = function () { return iso(new Date()); };
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var round2 = function (n) { return Math.round(n * 100) / 100; };
  var curSym = function () { return (S && S.settings && S.settings.currency === 'USD') ? '$' : '৳'; };
  var fmtN = function (n) { return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };
  var fmt$ = function (n, sign) { return (n < 0 ? '−' : (sign && n > 0 ? '+' : '')) + curSym() + fmtN(n); };
  var fmtTx = function (n, type) { return (type === 'income' ? '+' : '−') + fmtN(n) + ' ' + curSym(); };
  var vib = function (ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) { /* */ } };
  var initials = function (name) {
    var p = String(name || '?').trim().split(/\s+/);
    var a = Array.from(p[0] || '?')[0] || '?';
    return /[a-z]/i.test(a) && p[1] ? (a + Array.from(p[1])[0]).toUpperCase() : a.toUpperCase();
  };
  var fmtDate = function (s) { var p = s.split('-').map(Number); return p[2] + ' ' + getMonths()[p[1] - 1] + ' ' + p[0]; };
  var dayLabel = function (s) {
    var t = new Date(); var y = new Date(Date.now() - 864e5);
    if (s === iso(t)) return T('today');
    if (s === iso(y)) return T('yesterday');
    var p = s.split('-').map(Number);
    return p[2] + ' ' + getMonths()[p[1] - 1];
  };
  // সাদা লেখা লাগবে নাকি কালো — কার্ডের রঙ অনুযায়ী
  var inkFor = function (hex) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    var L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return L > 0.6 ? '#1A1A12' : '#FFFFFF';
  };

  /* ---------------- আইকন ---------------- */
  var P = {
    home: '<path d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.8H9.2v5.8H5A1.5 1.5 0 0 1 3.5 19z"/>',
    cards: '<rect x="2.5" y="5" width="19" height="14" rx="3.2"/><path d="M2.5 10h19M6.5 15h3"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.8 20c.8-3.4 3.3-5.2 6.2-5.2s5.4 1.8 6.2 5.2"/><circle cx="17.2" cy="9.4" r="2.6"/><path d="M17.4 14.6c2 .3 3.4 1.7 4 4"/>',
    chart: '<path d="M5 20v-6.5M12 20V5M19 20v-10"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    filter: '<path d="M4 7h16M7.5 12h9M10.5 17h3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="M9.2 5.5H19a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9.2L3.5 12z"/><path d="m12 9.5 5 5M17 9.5l-5 5"/>',
    chevD: '<path d="m7 10 5 5 5-5"/>',
    chevL: '<path d="m14.5 6-6 6 6 6"/>',
    chevR: '<path d="m9.5 6 6 6-6 6"/>',
    hand: '<path d="M9 11.5V5.2a1.6 1.6 0 0 1 3.2 0v5.6"/><path d="M12.2 10.5V9a1.6 1.6 0 0 1 3.2 0v2"/><path d="M15.4 10.8a1.6 1.6 0 0 1 3.2 0v4.1A6.1 6.1 0 0 1 12.5 21h-.8a6 6 0 0 1-5-2.7l-3-4.4a1.6 1.6 0 0 1 2.6-1.9L9 14.5"/>',
    mega: '<path d="M3.5 10.5v3a1 1 0 0 0 1 1h2l5.5 4.5v-14L6.5 9.5h-2a1 1 0 0 0-1 1z"/><path d="M15.5 9a3.5 3.5 0 0 1 0 6M18.2 6.2a7.5 7.5 0 0 1 0 11.6"/>',
    tool: '<path d="M14.6 6.4a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.8-5.8a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.6-.4-.4-2.6z"/>',
    play: '<rect x="3" y="5.5" width="13" height="13" rx="2.5"/><path d="m16 10.2 5-3v9.6l-5-3"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z"/>',
    pen: '<path d="M4 20l1-4.2L16.3 4.5a2 2 0 0 1 2.9 0l.3.3a2 2 0 0 1 0 2.9L8.2 19z"/><path d="m14.5 6.5 3 3"/>',
    spark: '<path d="M12 3.5 13.9 10 20.5 12l-6.6 2L12 20.5 10.1 14 3.5 12l6.6-2z"/>',
    sliders: '<path d="M4 7h9M18 7h2M4 17h3M11 17h9"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="8.5" cy="17" r="2.3"/>',
    trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l.9 12a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12M9.5 7V4.5h5V7"/>',
    edit: '<path d="M4 20h4.2L19.3 8.9a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4 15.8z"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 15V4M7 8.5l5-5 5 5M5 20h14"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    cloud: '<path d="M6.5 19h11a4 4 0 0 0 .8-7.9A5.5 5.5 0 0 0 7.7 9.4 4.2 4.2 0 0 0 6.5 19z"/>',
    eye: '<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.9 17.9A10.6 10.6 0 0 1 12 18.5C5.8 18.5 2 12 2 12a18 18 0 0 1 5-5.3M9.9 5.3A10 10 0 0 1 12 5.5c6.2 0 10 6.5 10 6.5a18 18 0 0 1-2.5 3.4M3 3l18 18"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4.5v4h-4"/>',
    user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1-3.7 4-5.8 7.5-5.8s6.5 2.1 7.5 5.8"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'
  };
  var ic = function (name, size, sw) {
    size = size || 20; sw = sw || 1.9;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  };
  var svcIcon = function (s) {
    var n = (s && s.name) || '';
    if (/ভিডিও|video|edit|রিল|reel/i.test(n)) return 'play';
    if (/ওয়েব|web|site|সাইট|app|অ্যাপ/i.test(n)) return 'globe';
    if (/ডিজাইন|design|logo|লোগো|graphic|গ্রাফিক/i.test(n)) return 'pen';
    return 'spark';
  };
  var catIcon = function (c) { return c && c.isAd ? 'mega' : (c && c.id === 'tools' ? 'tool' : 'spark'); };

  /* ---------------- স্টেট ---------------- */
  var S = null;
  var now = new Date();
  var ui = {
    tab: 'home',
    month: { y: now.getFullYear(), m: now.getMonth() },
    txFilter: 'all', q: '',
    clientFilter: 'all', cq: ''
  };

  var monthKey = function (y, m) { return y + '-' + pad(m + 1); };
  var curKey = function () { return monthKey(ui.month.y, ui.month.m); };
  var inMonth = function (e, k) { return e.date.indexOf(k || curKey()) === 0; };
  var svc = function (id) { return S.services.find(function (s) { return s.id === id; }); };
  var cli = function (id) { return S.clients.find(function (c) { return c.id === id; }); };
  var cat = function (id) { return S.expenseCats.find(function (c) { return c.id === id; }) || S.expenseCats[S.expenseCats.length - 1]; };
  var activeServices = function () { return S.services.filter(function (s) { return s.active; }); };

  function totals(list) {
    var inc = 0, exp = 0, ads = 0, due = 0;
    list.forEach(function (e) {
      if (e.type === 'income') {
        if (e.status === 'due') due += e.amount;
        else inc += e.amount;
      } else {
        exp += e.amount;
        if (cat(e.cat).isAd) ads += e.amount;
      }
    });
    return { inc: round2(inc), exp: round2(exp), ads: round2(ads), due: round2(due), net: round2(inc - exp) };
  }
  var monthEntries = function (k) { return S.entries.filter(function (e) { return inMonth(e, k); }); };

  /* ---------------- অ্যানিমেশন হেল্পার (60-120fps GPU only) ---------------- */
  function stagger(root) {
    if (reduceMotion || !root.animate) return;
    $$('[data-st]', root).slice(0, 6).forEach(function (el, i) {
      el.animate(
        [{ opacity: 0, transform: 'translate3d(0,14px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }],
        { duration: 360, delay: 20 + i * 35, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
      );
    });
  }

  function burstConfetti() {
    if (reduceMotion) return;
    var app = $('#app'); if (!app) return;
    var cv = document.createElement('canvas');
    cv.className = 'confetti-cv';
    cv.width = app.clientWidth; cv.height = app.clientHeight;
    app.appendChild(cv);
    var g = cv.getContext('2d');
    var cols = ['#FFE14A', '#2BE8B5', '#FFFFFF', '#2AA8FF', '#FF7EB6'];
    var parts = [];
    for (var i = 0; i < 42; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 3 + Math.random() * 7;
      parts.push({
        x: cv.width / 2, y: cv.height * 0.45,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 3.5,
        sz: 4 + Math.random() * 5, c: cols[i % cols.length],
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, a: 1
      });
    }
    var frame = 0;
    var tick = function () {
      g.clearRect(0, 0, cv.width, cv.height);
      frame++;
      var alive = false;
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.rot += p.vr;
        p.a = Math.max(0, 1 - frame / 65);
        if (p.a > 0) {
          alive = true;
          g.save();
          g.globalAlpha = p.a;
          g.translate(p.x, p.y);
          g.rotate(p.rot);
          g.fillStyle = p.c;
          g.fillRect(-p.sz / 2, -p.sz / 2, p.sz, p.sz * 0.6);
          g.restore();
        }
      });
      if (alive && frame < 70) requestAnimationFrame(tick);
      else cv.remove();
    };
    requestAnimationFrame(tick);
  }

  function moneyHTML(v) {
    var cents = Math.round(Math.abs(v) * 100);
    var w = Math.floor(cents / 100), c = cents % 100;
    return '<span class="cur">' + (v < 0 ? '−' : '') + curSym() + '</span><span class="whole">' + w.toLocaleString('en-US') + '</span><span class="cents">.' + pad(c) + '</span>';
  }
  function countTo(el, val, animate) {
    var from = parseFloat(el.dataset.v || '0');
    el.dataset.v = val;
    if (!animate || reduceMotion || from === val) { el.innerHTML = moneyHTML(val); return; }
    var t0 = performance.now(), d = 900;
    var step = function (t) {
      var p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 4);
      el.innerHTML = moneyHTML(from + (val - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  var toastTimer;
  function toast(t) {
    var el = $('#toast');
    el.textContent = t; el.hidden = true; void el.offsetWidth; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2300);
  }

  /* =================================================================
     হোম
     ================================================================= */
  function avatarHTML(c, cls) {
    return '<span class="av ' + (cls || '') + '" style="--c:' + c.color + '">' + esc(initials(c.name)) + '</span>';
  }

  function txIconHTML(e) {
    if (e.type === 'income') {
      var s = svc(e.svc), c = cli(e.client);
      var sc = s ? s.color : '#ccc';
      if (c) return '<span class="tx-ic" style="--c:' + c.color + ';--ci:#1A1A1A">' + esc(initials(c.name)) + '<span class="dot" style="--d:' + sc + '"></span></span>';
      return '<span class="tx-ic" style="--c:' + sc + ';--ci:' + inkFor(sc) + '">' + ic(svcIcon(s), 19) + '</span>';
    }
    var k = cat(e.cat);
    var fs = e.forSvc && svc(e.forSvc);
    return '<span class="tx-ic" style="--c:#121414;--ci:#fff">' + ic(catIcon(k), 18) + (fs ? '<span class="dot" style="--d:' + fs.color + '"></span>' : '') + '</span>';
  }

  function txText(e) {
    if (e.type === 'income') {
      var s = svc(e.svc), c = cli(e.client);
      var title = c ? c.name : (s ? s.name : 'আয়');
      var sub = [c && s ? s.name : '', e.note].filter(Boolean).join(' · ');
      return { title: title, sub: sub };
    }
    var k = cat(e.cat), fs = e.forSvc && svc(e.forSvc);
    return { title: k.name, sub: [fs ? fs.name + '-এর জন্য' : '', e.note].filter(Boolean).join(' · ') };
  }

  function txRowHTML(e) {
    var t = txText(e);
    var isDue = e.type === 'income' && e.status === 'due';
    return '<button class="tx" data-tx="' + e.id + '">' + txIconHTML(e) +
      '<span class="tx-main"><b>' + esc(t.title) + (isDue ? '<span class="due-tag">' + T('due') + '</span>' : '') + '</b><small>' + esc(t.sub || dayLabel(e.date)) + '</small></span>' +
      '<span class="tx-amt ' + (e.type === 'income' && !isDue ? 'pos' : '') + '">' + fmtTx(e.amount, e.type) + '</span></button>';
  }

  function renderMonthLabels() {
    var lbl = getMonths()[ui.month.m] + ' ' + ui.month.y;
    $$('.month-lbl').forEach(function (el) { el.textContent = lbl; });
  }

  function renderHome(animate) {
    var list = monthEntries();
    var t = totals(list);
    var isNow = ui.month.y === now.getFullYear() && ui.month.m === now.getMonth();
    var loss = t.net < 0;

    var mName = getMonths()[ui.month.m];
    var netText = isNow
      ? (loss ? T('thisMonthNetLoss') + ' <span class="tag-loss">' + T('inLoss') + '</span>' : T('thisMonthNetProfit'))
      : (loss ? T('monthNetLoss', { m: mName }) + ' <span class="tag-loss">' + T('inLoss') + '</span>' : T('monthNetProfit', { m: mName }));
    $('#netLabel').innerHTML = netText;
    var na = $('#netAmount');
    na.classList.toggle('loss', loss);
    countTo(na, t.net, animate);
    $('#heroSub').innerHTML =
      '<span><i style="background:var(--inc)"></i>' + T('income') + ' <b>' + fmt$(t.inc) + '</b></span>' +
      '<span><i style="background:var(--exp)"></i>' + T('expense') + ' <b>' + fmt$(t.exp) + '</b></span>';

    // ডান পাশে উঁকি দেওয়া সার্ভিস কার্ড
    var cols = activeServices().slice(0, 3).map(function (s) { return s.color; });
    while (cols.length < 3) cols.push(['#FFE14A', '#2BE8B5', '#2AA8FF'][cols.length]);
    $('#cardStack').innerHTML = cols.map(function (c, i) {
      return '<span style="background:' + c + ';left:' + (i * 13) + 'px;z-index:' + (3 - i) + '"></span>';
    }).join('');

    // খরচ কার্ড
    $('#spendLbl').textContent = t.ads > 0 ? T('spendAds', { v: fmt$(t.ads) }) : T('thisMonthSpend');
    $('#spendVal').textContent = fmt$(t.exp);
    var byCat = {};
    list.forEach(function (e) { if (e.type === 'expense') byCat[e.cat] = (byCat[e.cat] || 0) + e.amount; });
    var cats = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; });
    var bub = cats.slice(0, 3).map(function (id) {
      var k = cat(id);
      return '<span class="bubble" style="background:' + k.color + ';color:' + inkFor(k.color) + '">' + ic(catIcon(k), 15, 2.1) + '</span>';
    }).join('');
    if (cats.length > 3) bub += '<span class="bubble more">+' + (cats.length - 3) + '</span>';
    if (!cats.length) bub = '<span class="bubble more">' + ic('chart', 15, 2.2) + '</span>';
    $('#spendBubbles').innerHTML = bub;

    // মাসিক গোল ও অ্যাড বাজেট কার্ড
    var gCard = $('#goalCard');
    var goal = Number((S.settings && S.settings.monthlyGoal) || 0);
    var adBud = Number((S.settings && S.settings.adBudget) || 0);
    var isEn = window.I18n && window.I18n.lang() === 'en';
    if (gCard && (goal > 0 || adBud > 0)) {
      gCard.hidden = false;
      var pct = goal > 0 ? Math.round((t.inc / goal) * 100) : 0;
      var ratio = Math.max(0, Math.min(1, goal > 0 ? t.inc / goal : 0));
      $('#goalLbl').textContent = goal > 0 ? (isEn ? 'Monthly Income Goal' : 'মাসিক আয়ের লক্ষ্য') : (isEn ? 'Monthly Ad Budget' : 'মাসিক অ্যাড বাজেট');
      $('#goalPct').textContent = goal > 0 ? (pct + '%') : (adBud > 0 ? Math.round((t.ads / adBud) * 100) + '%' : '0%');
      $('#goalFill').style.transform = 'scaleX(' + (goal > 0 ? ratio : Math.min(1, t.ads / (adBud || 1))).toFixed(4) + ')';
      var leftTxt = goal > 0 ? (fmt$(t.inc) + ' / ' + fmt$(goal)) : (fmt$(t.ads) + ' / ' + fmt$(adBud));
      var rightTxt = '';
      if (adBud > 0 && t.ads >= adBud * 0.8) {
        rightTxt = '<span class="goal-warn">' + (isEn ? 'Ad budget ' : 'অ্যাড বাজেট ') + Math.round((t.ads / adBud) * 100) + '%</span>';
      } else if (goal > 0 && t.inc >= goal) {
        rightTxt = '<span style="color:var(--pos-d);font-weight:700">' + (isEn ? 'Goal Reached! ★' : 'লক্ষ্য পূরণ! ★') + '</span>';
      }
      $('#goalSub').innerHTML = '<span>' + leftTxt + '</span>' + rightTxt;
    } else if (gCard) {
      gCard.hidden = true;
    }

    // বাকি / Pending Due পিল (সব মাসের মোট বাকি)
    var dp = $('#duePill');
    if (dp) {
      var allDue = S.entries.reduce(function (a, e) { return (e.type === 'income' && e.status === 'due') ? a + e.amount : a; }, 0);
      if (allDue > 0) {
        dp.hidden = false;
        $('#dueLbl').textContent = isEn ? 'Pending Due Payments' : 'ক্লায়েন্টদের কাছে বাকি';
        $('#dueVal').textContent = fmt$(round2(allDue));
      } else {
        dp.hidden = true;
      }
    }

    renderTxList();
  }

  function renderTxList() {
    var q = ui.q.trim().toLowerCase();
    var baseList = ui.txFilter === 'due'
      ? S.entries.filter(function (e) { return e.type === 'income' && e.status === 'due'; })
      : monthEntries();
    var list = baseList.filter(function (e) {
      if (ui.txFilter !== 'all' && ui.txFilter !== 'due' && e.type !== ui.txFilter) return false;
      if (!q) return true;
      var t = txText(e);
      return (t.title + ' ' + t.sub + ' ' + (svc(e.svc) || {}).name).toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0); });

    var box = $('#txList');
    if (!S.entries.length) {
      box.innerHTML = '<div class="empty"><b>' + T('noTxTitle') + '</b>' + T('noTxSub') + '</div>';
      return;
    }
    if (!list.length) {
      box.innerHTML = '<div class="empty"><b>' + (q ? T('noMatch') : T('noTxTitle')) + '</b></div>';
      return;
    }
    var html = '', last = '';
    list.forEach(function (e) {
      if (e.date !== last) { html += '<div class="day-label">' + dayLabel(e.date) + '</div>'; last = e.date; }
      html += txRowHTML(e);
    });
    box.innerHTML = html;
  }

  /* =================================================================
     সার্ভিস কার্ড
     ================================================================= */
  function renderServices() {
    var list = monthEntries();
    var order = S.services.slice().sort(function (a, b) { return (b.active ? 1 : 0) - (a.active ? 1 : 0); });
    $('#svcList').innerHTML = order.map(function (s) {
      var inc = 0, ads = 0, jobs = 0;
      list.forEach(function (e) {
        if (e.type === 'income' && e.svc === s.id) { inc += e.amount; jobs++; }
        if (e.type === 'expense' && e.forSvc === s.id) ads += e.amount;
      });
      var net = inc - ads;
      var cents = Math.round(inc * 100) % 100;
      return '<article class="svc-card' + (s.active ? '' : ' off') + '" style="--c:' + s.color + ';--ink2:' + inkFor(s.color) + '" data-st>' +
        '<div class="svc-top"><span>' + esc(s.name) + '</span><span class="meta">•••• ' + jobs + 'টি পেমেন্ট</span></div>' +
        '<div class="svc-amount">' + curSym() + Math.floor(inc).toLocaleString('en-US') + '<small>.' + pad(cents) + '</small></div>' +
        '<div class="svc-sub">অ্যাড ' + fmt$(-ads) + ' · নেট ' + fmt$(round2(net), true) + '</div>' +
        '<div class="svc-bottom"><div class="svc-btns">' +
        '<button data-svc-add="' + s.id + '" aria-label="' + esc(s.name) + '-এ পেমেন্ট যোগ করুন">' + ic('plus', 18, 2.2) + '</button>' +
        '<button data-svc-ad="' + s.id + '" aria-label="' + esc(s.name) + '-এর অ্যাড খরচ লিখুন">' + ic('mega', 17, 2) + '</button>' +
        '<button data-svc-edit="' + s.id + '" aria-label="এডিট">' + ic('sliders', 17, 2) + '</button>' +
        '</div><button class="toggle" data-svc-toggle="' + s.id + '" aria-pressed="' + s.active + '" aria-label="চালু/বন্ধ"></button></div>' +
        '</article>';
    }).join('');
  }

  /* =================================================================
     ক্লায়েন্ট
     ================================================================= */
  function clientStats(k) {
    var m = {};
    S.entries.forEach(function (e) {
      if (e.type !== 'income' || !e.client) return;
      if (k && !inMonth(e, k)) return;
      var r = m[e.client] || (m[e.client] = { total: 0, n: 0, last: '', svcs: {} });
      r.total += e.amount; r.n++;
      if (e.date > r.last) r.last = e.date;
      r.svcs[e.svc] = (r.svcs[e.svc] || 0) + e.amount;
    });
    return m;
  }

  function renderClients() {
    var all = clientStats();
    var top = S.clients.slice().sort(function (a, b) { return ((all[b.id] || {}).total || 0) - ((all[a.id] || {}).total || 0); }).slice(0, 5);
    $('#peopleGrid').innerHTML = top.map(function (c) {
      var r = all[c.id];
      return '<button class="person" data-person="' + c.id + '" data-st>' + avatarHTML(c) + '<b>' + esc(c.name.split(' ')[0]) + '</b><small>' + (r ? fmt$(r.total) : 'নতুন') + '</small></button>';
    }).join('') + '<button class="person add" id="addPersonTile" data-st><span class="av">' + ic('plus', 24, 2) + '</span><b>নতুন</b><small>ক্লায়েন্ট</small></button>';
    renderClientList();
  }

  function renderClientList() {
    var stats = ui.clientFilter === 'month' ? clientStats(curKey()) : clientStats();
    var q = ui.cq.trim().toLowerCase();
    var rows = S.clients.filter(function (c) {
      if (ui.clientFilter === 'month' && !stats[c.id]) return false;
      return !q || c.name.toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return ((stats[b.id] || {}).total || 0) - ((stats[a.id] || {}).total || 0); });
    if (!rows.length) {
      $('#clientList').innerHTML = '<div class="empty"><b>' + (S.clients.length ? 'কোনো ক্লায়েন্ট পাওয়া যায়নি' : 'এখনো কোনো ক্লায়েন্ট নেই') + '</b>' + (S.clients.length ? '' : 'উপরের “যোগ করুন” দিয়ে প্রথম ক্লায়েন্ট যোগ করুন।') + '</div>';
      return;
    }
    $('#clientList').innerHTML = '<div style="height:8px"></div>' + rows.map(function (c) {
      var r = stats[c.id];
      var topSvc = r ? Object.keys(r.svcs).sort(function (a, b) { return r.svcs[b] - r.svcs[a]; })[0] : null;
      var s = topSvc && svc(topSvc);
      return '<button class="cl-row" data-client="' + c.id + '">' + avatarHTML(c) +
        '<span style="min-width:0"><b>' + esc(c.name) + '</b><small>' + (r ? r.n + 'টি পেমেন্ট · শেষ ' + dayLabel(r.last) : 'এখনো পেমেন্ট নেই') + '</small></span>' +
        '<span class="r">' + (r ? fmt$(r.total) : '—') + '<small>' + (s ? esc(s.name) : '') + '</small></span></button>';
    }).join('');
  }

  /* =================================================================
     রিপোর্ট
     ================================================================= */
  function niceCeil(v) {
    if (v <= 0) return 0;
    var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  function renderStats() {
    var list = monthEntries();
    var t = totals(list);
    var loss = t.net < 0;
    var v = $('#verdict');
    v.className = 'verdict' + (loss ? ' loss' : '');
    var margin = t.inc > 0 ? Math.round(t.net / t.inc * 100) : 0;
    v.innerHTML = list.length
      ? '<span class="v-tag">' + (loss ? '▼ ' + T('verdictLoss') : '▲ ' + T('verdictProfit')) + '</span>' +
        '<div class="v-amt">' + fmt$(t.net, true) + '</div>' +
        '<p>' + (loss ? T('verdictLossSub', { v: fmt$(-t.net) }) : T('verdictProfitSub', { p: margin })) + '</p>'
      : '<span class="v-tag" style="color:var(--mut-d)">' + T('noMonthEntry') + '</span><p>' + T('noMonthEntrySub') + '</p>';

    var roas = t.ads > 0 ? (t.inc / t.ads) : null;
    var nInc = list.filter(function (e) { return e.type === 'income'; }).length;
    $('#kpis').innerHTML = [
      { k: T('totalIncome'), c: 'var(--inc)', v: fmt$(t.inc), s: T('paymentsCount', { n: nInc }) },
      { k: T('totalExpense'), c: 'var(--exp)', v: fmt$(t.exp), s: T('inAds', { v: fmt$(t.ads) }) },
      { k: T('adReturn'), v: roas ? roas.toFixed(2) + '×' : '—', s: roas ? T('roasSub', { c: curSym(), v: fmt$(round2(roas)) }) : T('noAdSpend') },
      { k: T('avgPayment'), v: nInc ? fmt$(round2(t.inc / nInc)) : '—', s: T('perPayment') }
    ].map(function (x) {
      return '<div class="kpi" data-st><div class="k">' + (x.c ? '<i style="background:' + x.c + '"></i>' : '') + x.k + '</div><div class="v">' + x.v + '</div><div class="s">' + x.s + '</div></div>';
    }).join('');

    // স্মার্ট ইনসাইটস (Smart Insights)
    var insBox = $('#insightsCard');
    if (insBox) {
      var isEn = window.I18n && window.I18n.lang() === 'en';
      var pm = ui.month.m - 1, py = ui.month.y;
      if (pm < 0) { pm = 11; py--; }
      var prevT = totals(monthEntries(monthKey(py, pm)));
      var insights = [];
      if (prevT.inc > 0 && t.inc > 0) {
        var diffPct = Math.round(((t.inc - prevT.inc) / prevT.inc) * 100);
        insights.push(isEn
          ? 'Revenue is <b>' + (diffPct >= 0 ? '+' : '') + diffPct + '%</b> compared to last month (' + fmt$(prevT.inc) + ').'
          : 'গত মাসের (' + fmt$(prevT.inc) + ') তুলনায় এই মাসে আয় <b>' + (diffPct >= 0 ? '+' : '') + diffPct + '%</b>।');
      }
      var topSvc = S.services.map(function (s) {
        var sum = list.reduce(function (a, e) { return e.type === 'income' && e.svc === s.id ? a + e.amount : a; }, 0);
        return { name: s.name, sum: sum };
      }).sort(function (a, b) { return b.sum - a.sum; })[0];
      if (topSvc && topSvc.sum > 0 && t.inc > 0) {
        var share = Math.round((topSvc.sum / t.inc) * 100);
        insights.push(isEn
          ? 'Top service: <b>' + esc(topSvc.name) + '</b> contributing <b>' + share + '%</b> of income.'
          : 'সেরা সার্ভিস: <b>' + esc(topSvc.name) + '</b> — মোট আয়ের <b>' + share + '%</b> এসেছে এখান থেকে।');
      }
      var byC = {};
      list.forEach(function (e) { if (e.type === 'income' && e.client) byC[e.client] = (byC[e.client] || 0) + e.amount; });
      var topCid = Object.keys(byC).sort(function (a, b) { return byC[b] - byC[a]; })[0];
      if (topCid && cli(topCid)) {
        insights.push(isEn
          ? 'Top client this month: <b>' + esc(cli(topCid).name) + '</b> (' + fmt$(byC[topCid]) + ').'
          : 'এই মাসের সেরা ক্লায়েন্ট: <b>' + esc(cli(topCid).name) + '</b> (' + fmt$(byC[topCid]) + ')।');
      }
      if (insights.length) {
        insBox.hidden = false;
        insBox.innerHTML = '<div class="dc-head"><h2>' + (isEn ? 'Smart Insights' : 'স্মার্ট বিশ্লেষণ') + '</h2></div>' +
          '<div class="insight-list">' + insights.map(function (txt) { return '<div class="insight-row"><i></i><span>' + txt + '</span></div>'; }).join('') + '</div>';
      } else {
        insBox.hidden = true;
      }
    }

    renderTrend();

    // সার্ভিস ব্রেকডাউন
    var rows = S.services.map(function (s) {
      var inc = 0, ads = 0;
      list.forEach(function (e) {
        if (e.type === 'income' && e.svc === s.id) inc += e.amount;
        if (e.type === 'expense' && e.forSvc === s.id) ads += e.amount;
      });
      return { s: s, inc: inc, ads: ads };
    }).filter(function (r) { return r.inc || r.ads; }).sort(function (a, b) { return b.inc - a.inc; });
    var maxInc = Math.max.apply(null, rows.map(function (r) { return r.inc; }).concat([1]));
    $('#svcBreak').innerHTML = rows.length ? '<div class="brk">' + rows.map(function (r) {
      var ratio = Math.max(0.02, Math.min(1, r.inc / maxInc));
      return '<div class="brk-row"><div class="top"><span><i style="background:' + r.s.color + '"></i>' + esc(r.s.name) + '</span><b>' + fmt$(round2(r.inc)) + '</b></div>' +
        '<div class="sub">' + T('adLabel') + ' ' + fmt$(round2(r.ads)) + ' · ' + T('netLabel') + ' ' + fmt$(round2(r.inc - r.ads), true) + (r.ads ? ' · ROAS ' + (r.inc / r.ads).toFixed(1) + '×' : '') + '</div>' +
        '<div class="bar"><i style="width:100%;transform:scaleX(' + ratio.toFixed(4) + ');background:' + r.s.color + '"></i></div></div>';
    }).join('') + '</div>' : '<div class="muted-d">' + T('noSvcIncome') + '</div>';

    // খরচ ব্রেকডাউন
    var byCat = {};
    list.forEach(function (e) { if (e.type === 'expense') byCat[e.cat] = (byCat[e.cat] || 0) + e.amount; });
    var keys = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; });
    $('#expBreak').innerHTML = keys.length ? '<div class="brk">' + keys.map(function (k) {
      var c = cat(k), pct = t.exp ? byCat[k] / t.exp * 100 : 0;
      var ratio = Math.max(0.02, Math.min(1, pct / 100));
      return '<div class="brk-row"><div class="top"><span><i style="background:' + c.color + '"></i>' + esc(c.name) + '</span><b>' + fmt$(round2(byCat[k])) + ' <span style="color:var(--mut-d);font-weight:600">· ' + Math.round(pct) + '%</span></b></div>' +
        '<div class="bar"><i style="width:100%;transform:scaleX(' + ratio.toFixed(4) + ');background:' + c.color + '"></i></div></div>';
    }).join('') + '</div>' : '<div class="muted-d">' + T('noExpense') + '</div>';
  }

  function renderTrend() {
    var months = [];
    for (var i = 5; i >= 0; i--) {
      var y = ui.month.y, m = ui.month.m - i;
      while (m < 0) { m += 12; y--; }
      var k = monthKey(y, m), t = totals(monthEntries(k));
      months.push({ y: y, m: m, k: k, inc: t.inc, exp: t.exp, net: t.net });
    }
    var W = 340, H = 170, L = 38, R = 4, T = 10, B = 24, pw = W - L - R, ph = H - T - B;
    var top = niceCeil(Math.max.apply(null, months.map(function (x) { return Math.max(x.inc, x.exp); }).concat([0]))) || 100;
    var y = function (v) { return T + ph - v / top * ph; };
    var band = pw / months.length, bw = Math.min(14, band * 0.26), gap = 3;
    var g = '';
    [0, 0.5, 1].forEach(function (f) {
      var yy = y(top * f);
      g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/>';
      g += '<text x="' + (L - 6) + '" y="' + (yy + 3.5) + '" text-anchor="end">' + curSym() + fmtN(top * f) + '</text>';
    });
    var bar = function (x, v, color, op) {
      if (v <= 0) return '';
      var h = Math.max(2, v / top * ph), r = Math.min(4, bw / 2), yy = T + ph - h;
      return '<path d="M' + x + ',' + (T + ph) + 'V' + (yy + r) + 'Q' + x + ',' + yy + ' ' + (x + r) + ',' + yy + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + yy + ' ' + (x + bw) + ',' + (yy + r) + 'V' + (T + ph) + 'Z" fill="' + color + '" opacity="' + op + '"/>';
    };
    var bars = '', labels = '', hits = '';
    months.forEach(function (mo, i) {
      var cx = L + i * band + band / 2;
      var sel = mo.k === curKey();
      if (sel) bars += '<rect class="sel-bg" x="' + (L + i * band + 2) + '" y="' + T + '" width="' + (band - 4) + '" height="' + ph + '" rx="10"/>';
      bars += bar(cx - bw - gap / 2, mo.inc, 'var(--inc)', sel ? 1 : 0.55);
      bars += bar(cx + gap / 2, mo.exp, 'var(--exp)', sel ? 1 : 0.55);
      labels += '<text x="' + cx + '" y="' + (H - 6) + '" text-anchor="middle" style="' + (sel ? 'fill:#fff' : '') + '">' + getMonthsShort()[mo.m] + '</text>';
      hits += '<rect class="hit" data-ym="' + mo.y + '-' + mo.m + '" x="' + (L + i * band) + '" y="0" width="' + band + '" height="' + H + '"/>';
    });
    $('#trend').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(T('trend6m')) + '">' + g + bars + '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + ph) + '" y2="' + (T + ph) + '" stroke="rgba(255,255,255,.25)"/>' + labels + hits + '</svg>';
    var cur = months[months.length - 1];
    $('#trendRead').innerHTML = '<span>' + getMonths()[cur.m] + '</span><span>' + T('income') + ' <b>' + fmt$(cur.inc) + '</b></span><span>' + T('expense') + ' <b>' + fmt$(cur.exp) + '</b></span><span>' + T('netLabel') + ' <b>' + fmt$(cur.net, true) + '</b></span>';
  }

  /* =================================================================
     ট্যাব ও স্ক্রিন বদল
     ================================================================= */
  function renderTab(tab, animate) {
    renderMonthLabels();
    if (tab === 'home') renderHome(animate);
    if (tab === 'services') renderServices();
    if (tab === 'clients') renderClients();
    if (tab === 'stats') renderStats();
  }

  function updateTabbar() {
    $$('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === ui.tab); });
    var on = $('.tab.on');
    if (on) $('#tabInd').style.transform = 'translateX(' + (on.offsetLeft - 6) + 'px)';
  }

  function go(tab) {
    if (tab === ui.tab) { $('#s-' + tab).scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var from = $('#s-' + ui.tab), to = $('#s-' + tab);
    var dir = TABS.indexOf(tab) > TABS.indexOf(ui.tab) ? 1 : -1;
    $$('.screen').forEach(function (s) {
      if (s !== from && s !== to) { s.getAnimations && s.getAnimations().forEach(function (a) { a.cancel(); }); s.hidden = true; }
    });
    ui.tab = tab;
    vib(6);
    renderTab(tab, true);
    to.hidden = false; to.scrollTop = 0;
    updateTabbar();
    if (reduceMotion || !to.animate) { from.hidden = true; return; }
    var opt = { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' };
    var a = from.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(' + (-dir * 40) + '%)', opacity: 0 }], opt);
    a.onfinish = function () { if (ui.tab !== from.id.slice(2)) from.hidden = true; };
    to.animate([{ transform: 'translateX(' + (dir * 100) + '%)' }, { transform: 'translateX(0)' }], opt);
    stagger(to);
  }

  function shiftMonth(d) {
    var m = ui.month.m + d, y = ui.month.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    ui.month = { y: y, m: m };
    renderTab(ui.tab, true);
    vib(5);
  }

  /* =================================================================
     শিট (নিচ থেকে উঠে আসা প্যানেল)
     ================================================================= */
  var sheets = [];
  var ignorePop = 0;
  function syncStage() {
    var on = sheets.length > 0;
    $('#stage').classList.toggle('pushed', on);
    $('#scrim').classList.toggle('on', on);
  }
  function openSheet(el) {
    if (sheets.indexOf(el) >= 0) return;
    el.hidden = false; void el.offsetHeight;
    el.classList.add('open');
    sheets.push(el);
    syncStage();
    try { history.pushState({ sheet: sheets.length }, ''); } catch (e) { /* */ }
  }
  function closeSheet(el, fromPop) {
    var i = sheets.indexOf(el);
    if (i < 0) return;
    sheets.splice(i, 1);
    el.classList.remove('open');
    el.style.transform = '';
    syncStage();
    setTimeout(function () { if (!el.classList.contains('open')) el.hidden = true; }, 560);
    if (!fromPop) { try { if (history.state && history.state.sheet) { ignorePop++; history.back(); } } catch (e) { /* */ } }
    if (el.id === 'entrySheet') closeCtx();
  }
  window.addEventListener('popstate', function () {
    if (ignorePop) { ignorePop--; return; }
    if ($('#ctxPanel').classList.contains('open')) { closeCtx(); try { history.pushState({ sheet: sheets.length }, ''); } catch (e) { /* */ } return; }
    var top = sheets[sheets.length - 1];
    if (top) closeSheet(top, true);
  });
  document.addEventListener('backbutton', function (e) {
    if ($('#ctxPanel').classList.contains('open')) {
      e.preventDefault();
      closeCtx();
      return;
    }
    var top = sheets[sheets.length - 1];
    if (top) {
      e.preventDefault();
      closeSheet(top);
      return;
    }
  });
  $('#scrim').addEventListener('click', function () { var top = sheets[sheets.length - 1]; if (top) closeSheet(top); });

  // টেনে নামিয়ে বন্ধ করা
  $$('.sheet .drag-zone').forEach(function (z) {
    var sheet = z.closest('.sheet'), sy = 0, dy = 0, drag = false, moved = false;
    z.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button') && e.target.closest('.seg, .ctx')) return;
      drag = true; moved = false; sy = e.clientY; dy = 0;
      sheet.classList.add('dragging');
      try { z.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    });
    z.addEventListener('pointermove', function (e) {
      if (!drag) return;
      dy = Math.max(0, e.clientY - sy);
      if (dy > 4) moved = true;
      sheet.style.transform = 'translateY(' + dy + 'px)';
    });
    var end = function () {
      if (!drag) return;
      drag = false;
      sheet.classList.remove('dragging');
      if (moved && dy > 110) closeSheet(sheet);
      else sheet.style.transform = '';
    };
    z.addEventListener('pointerup', end);
    z.addEventListener('pointercancel', end);
  });

  function openModal(html, onMount) {
    var m = $('#modal');
    $('#modalBody').innerHTML = html;
    $('#modalBody').scrollTop = 0;
    if (onMount) onMount($('#modalBody'));
    openSheet(m);
  }
  var closeModal = function () { closeSheet($('#modal')); };

  /* =================================================================
     এন্ট্রি শিট — কি-প্যাড, হিসাব, সোয়াইপ
     ================================================================= */
  var E = {};
  function openEntry(opts) {
    var first = activeServices()[0];
    E = Object.assign({
      type: 'income', expr: '', prev: '',
      svc: first ? first.id : null, client: null,
      cat: 'fb', forSvc: null, status: 'paid',
      date: (ui.month.y === now.getFullYear() && ui.month.m === now.getMonth()) ? todayISO() : monthKey(ui.month.y, ui.month.m) + '-01',
      note: '', editId: null
    }, opts || {});
    renderEntry();
    openSheet($('#entrySheet'));
  }

  function openEdit(id) {
    var e = S.entries.find(function (x) { return x.id === id; });
    if (!e) return;
    closeModal();
    setTimeout(function () {
      openEntry({ type: e.type, expr: String(e.amount), svc: e.svc, client: e.client, cat: e.cat || 'fb', forSvc: e.forSvc, status: e.status || 'paid', date: e.date, note: e.note, editId: e.id });
    }, 200);
  }

  function tokens(x) { return x.match(/[0-9.]+|[+−×÷]/g) || []; }
  function evalExpr(x) {
    var t = tokens(x);
    if (!t.length) return 0;
    if (OPS.indexOf(t[t.length - 1]) >= 0) t = t.slice(0, -1);
    var acc = [parseFloat(t[0]) || 0];
    for (var i = 1; i < t.length; i += 2) {
      var op = t[i], n = parseFloat(t[i + 1]) || 0;
      if (op === '×') acc[acc.length - 1] *= n;
      else if (op === '÷') acc[acc.length - 1] = n ? acc[acc.length - 1] / n : NaN;
      else acc.push(op === '−' ? -n : n);
    }
    var s = acc.reduce(function (a, b) { return a + b; }, 0);
    return isFinite(s) ? round2(s) : NaN;
  }
  var hasOp = function (x) { return /[+−×÷]/.test(x); };

  function fmtTyped(numStr) {
    var p = numStr.split('.');
    var int = p[0] === '' ? '' : Number(p[0]).toLocaleString('en-US');
    return int + (p.length > 1 ? '.' + p[1] : '');
  }

  function ctxLabel() {
    var dateBit = E.date === todayISO() ? '' : ' · ' + dayLabel(E.date);
    if (E.type === 'income') {
      var s = svc(E.svc), c = cli(E.client);
      return (s ? s.name : 'সার্ভিস বাছুন') + (c ? ' · ' + c.name : ' · ক্লায়েন্ট যোগ করুন') + dateBit;
    }
    var k = cat(E.cat), f = E.forSvc && svc(E.forSvc);
    return k.name + (f ? ' → ' + f.name : '') + dateBit;
  }

  function renderEntry() {
    $$('#typeSeg button').forEach(function (b) { b.classList.toggle('on', b.dataset.type === E.type); });
    $('#ctxText').textContent = ctxLabel();
    var t = totals(monthEntries(E.date.slice(0, 7)));
    $('#availLine').innerHTML = (E.editId ? 'এডিট করছেন · ' : '') + 'এই মাসের নেট <b>' + fmt$(t.net) + '</b>';
    renderAmount(false);
  }

  var eqTimer;
  function renderAmount(animateNew) {
    var line = $('#amtLine');
    var x = E.expr;
    line.classList.remove('shake');
    if (!x) {
      line.classList.add('placeholder');
      line.innerHTML = '<span class="cur">' + curSym() + '</span><span>0.00</span>';
      line.style.setProperty('--fs', '64px');
    } else {
      line.classList.remove('placeholder');
      var appended = animateNew && x.length > E.prev.length && x.indexOf(E.prev) === 0;
      var html = '<span class="cur">' + curSym() + '</span>', seenOp = false, len = 1;
      var tk = tokens(x);
      tk.forEach(function (tok, ti) {
        var isLast = ti === tk.length - 1;
        if (OPS.indexOf(tok) >= 0) {
          seenOp = true; len += 1;
          html += '<span class="ch op' + (appended && isLast ? ' in' : '') + '">' + tok + '</span>';
          return;
        }
        var shown = fmtTyped(tok);
        len += shown.length;
        var chars = Array.from(shown);
        chars.forEach(function (ch, ci) {
          var anim = appended && isLast && ci === chars.length - 1;
          html += '<span class="ch' + (seenOp ? ' pend' : '') + (anim ? ' in' : '') + '">' + ch + '</span>';
        });
      });
      line.innerHTML = html;
      var fs = len <= 6 ? 64 : len <= 8 ? 54 : len <= 10 ? 44 : len <= 13 ? 36 : 30;
      line.style.setProperty('--fs', fs + 'px');
    }

    // = ফলাফল চিপ
    var chip = $('#eqChip');
    clearTimeout(eqTimer);
    var complete = hasOp(x) && OPS.indexOf(x.slice(-1)) < 0;
    if (complete) {
      var r = evalExpr(x);
      chip.hidden = false;
      chip.innerHTML = '= <span class="dots"><i></i><i></i><i></i></span>';
      eqTimer = setTimeout(function () { chip.textContent = isNaN(r) ? '= ভুল হিসাব' : '= ' + fmtN(r); }, reduceMotion ? 0 : 260);
    } else chip.hidden = true;

    // ডান পাশের ছোট অবতার
    var av = $('#amtAvatar'), val = evalExpr(x);
    if (x && val > 0) {
      var c, txt = '', html2 = '';
      if (E.type === 'income' && (c = cli(E.client))) { av.style.background = c.color; html2 = esc(initials(c.name)); }
      else if (E.type === 'income') { var s = svc(E.svc); av.style.background = s ? s.color : '#ddd'; av.style.color = s ? inkFor(s.color) : '#111'; html2 = ic(svcIcon(s), 15, 2.2); }
      else { var k = cat(E.cat); av.style.background = k.color; av.style.color = inkFor(k.color); html2 = ic(catIcon(k), 15, 2.2); }
      if (E.type === 'income' && c) av.style.color = '#1A1A1A';
      var sig = E.type + E.client + E.svc + E.cat;
      if (av.hidden || av.dataset.sig !== sig) { av.hidden = true; void av.offsetWidth; }
      av.dataset.sig = sig;
      av.innerHTML = html2 || txt;
      av.hidden = false;
    } else av.hidden = true;

    $('#swipeHint').hidden = !(val > 0);
    $$('#opsRow button').forEach(function (b) { b.classList.toggle('on', x.slice(-1) === b.dataset.k); });
  }

  function press(k) {
    vib();
    var x = E.expr;
    var lastNum = x.split(/[+−×÷]/).pop();
    if (k === 'del') x = x.slice(0, -1);
    else if (OPS.indexOf(k) >= 0) {
      if (!x) return;
      var lc = x.slice(-1);
      if (OPS.indexOf(lc) >= 0 || lc === '.') x = x.slice(0, -1) + k; else x += k;
    } else if (k === '.') {
      if (lastNum.indexOf('.') >= 0) return;
      x += lastNum === '' ? '0.' : '.';
    } else {
      if (lastNum.indexOf('.') >= 0 && lastNum.split('.')[1].length >= 2) return;
      if (x.replace(/[^0-9]/g, '').length >= 12) return;
      if (lastNum === '0') x = x.slice(0, -1);
      x += k;
    }
    E.prev = E.expr; E.expr = x;
    renderAmount(true);
  }

  $('#keys').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
  $('#opsRow').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
  $('#eqChip').addEventListener('click', function () {
    var r = evalExpr(E.expr);
    if (isNaN(r) || r < 0) { toast('এই হিসাবটা মেলানো যাচ্ছে না'); return; }
    vib(10);
    E.prev = ''; E.expr = String(r);
    renderAmount(true);
  });
  $('#typeSeg').addEventListener('click', function (e) {
    var b = e.target.closest('[data-type]'); if (!b || b.dataset.type === E.type) return;
    vib(6); E.type = b.dataset.type; renderEntry();
  });
  $('#ctxBtn').addEventListener('click', openCtx);
  $('#swipeHint').addEventListener('click', function () {
    var r = $('#amtLine').getBoundingClientRect();
    confirmEntry(r.left + r.width / 2, r.top + r.height / 2);
  });

  // কি-বোর্ড (ডেস্কটপে)
  document.addEventListener('keydown', function (e) {
    if (!$('#entrySheet').classList.contains('open') || $('#ctxPanel').classList.contains('open')) return;
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    var map = { '+': '+', '-': '−', '*': '×', 'x': '×', '/': '÷', 'Backspace': 'del', '.': '.' };
    var k = /^[0-9]$/.test(e.key) ? e.key : map[e.key];
    if (k) {
      e.preventDefault(); press(k);
      var btn = $('[data-k="' + k + '"]');
      if (btn) { btn.classList.add('press'); setTimeout(function () { btn.classList.remove('press'); }, 120); }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!$('#eqChip').hidden && hasOp(E.expr)) $('#eqChip').click();
      else $('#swipeHint').click();
    } else if (e.key === 'Escape') closeSheet($('#entrySheet'));
  });

  // ডানে সোয়াইপ করে সেভ
  (function () {
    var zone = $('#amountZone'), line = $('#amtLine');
    var st = null;
    zone.addEventListener('pointerdown', function (e) {
      if (!(evalExpr(E.expr) > 0)) return;
      if (e.target.closest('button')) return;
      st = { x: e.clientX, y: e.clientY, id: e.pointerId, drag: false, p: 0 };
    });
    zone.addEventListener('pointermove', function (e) {
      if (!st || e.pointerId !== st.id) return;
      var dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.drag) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
          st.drag = true;
          try { zone.setPointerCapture(e.pointerId); } catch (err) { /* */ }
        } else return;
      }
      var d = Math.max(0, dx);
      st.p = Math.min(1, d / (zone.clientWidth * 0.4));
      line.style.transform = 'translateX(' + (d * 0.6) + 'px)';
      line.style.setProperty('--p', st.p.toFixed(3));
      $('#swipeHint').style.opacity = String(1 - st.p);
      $('#amtAvatar').style.opacity = String(1 - st.p);
      if (st.p >= 1 && !st.buzz) { vib(14); st.buzz = true; }
      if (st.p < 1) st.buzz = false;
    });
    var end = function (e) {
      if (!st) return;
      var s = st; st = null;
      if (!s.drag) return;
      if (s.p >= 1) { confirmEntry(e.clientX, e.clientY); return; }
      springBack();
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', function () { st = null; springBack(); });
  })();

  function springBack() {
    var line = $('#amtLine');
    var cur = line.style.transform;
    line.style.transform = '';
    line.style.setProperty('--p', 0);
    $('#swipeHint').style.opacity = '';
    $('#amtAvatar').style.opacity = '';
    if (cur && line.animate && !reduceMotion) line.animate([{ transform: cur }, { transform: 'translateX(0)' }], { duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  }

  function confirmEntry(x, y) {
    var amount = evalExpr(E.expr);
    if (!(amount > 0)) {
      var l = $('#amtLine'); l.classList.remove('shake'); void l.offsetWidth; l.classList.add('shake');
      vib(30); springBack(); return;
    }
    if (E.type === 'income' && !svc(E.svc)) { springBack(); openCtx(); toast('কোন কাজের পেমেন্ট, সেটা বেছে নিন'); return; }
    var data = {
      type: E.type, amount: amount, date: E.date, note: (E.note || '').trim(),
      svc: E.svc, client: E.client, cat: E.cat, forSvc: E.forSvc, status: E.status || 'paid'
    };
    var p = E.editId ? Store.updateEntry(E.editId, data) : Store.addEntry(data);
    var wasEdit = !!E.editId;
    p.then(function () {
      var text;
      if (E.type === 'income') {
        var c = cli(E.client), s = svc(E.svc);
        text = c ? c.name + ' থেকে ' + (wasEdit ? 'আয় আপডেট হলো' : 'আয় যোগ হলো') : s.name + ' — ' + (wasEdit ? 'আয় আপডেট হলো' : 'আয় যোগ হলো');
      } else {
        text = cat(E.cat).name + ' — ' + (wasEdit ? 'খরচ আপডেট হলো' : 'খরচ লেখা হলো');
      }
      var em = E.date.split('-').map(Number);
      ui.month = { y: em[0], m: em[1] - 1 };
      showSuccess(x, y, (E.type === 'income' ? '+' : '−') + curSym() + fmtN(amount), text);
      if (E.type === 'income') setTimeout(burstConfetti, 220);
    }).catch(function () { springBack(); toast('সেভ হয়নি, আবার চেষ্টা করুন'); });
  }

  function showSuccess(x, y, amt, text) {
    vib([12, 40, 18]);
    var app = $('#app').getBoundingClientRect();
    var cx = x - app.left, cy = y - app.top;
    var r = Math.max(Math.hypot(cx, cy), Math.hypot(app.width - cx, cy), Math.hypot(cx, app.height - cy), Math.hypot(app.width - cx, app.height - cy));
    var blob = $('#blob');
    blob.style.left = (cx - r) + 'px'; blob.style.top = (cy - r) + 'px';
    blob.style.width = blob.style.height = (r * 2) + 'px';
    $('#sAmount').textContent = amt;
    $('#sText').textContent = text;
    var s = $('#success');
    s.classList.remove('show'); s.style.opacity = '';
    s.hidden = false; void s.offsetWidth;
    s.classList.add('show');
    if (blob.animate && !reduceMotion) {
      blob.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 650, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    } else blob.style.transform = 'scale(1)';
  }

  $('#success').addEventListener('click', function () {
    var s = $('#success');
    var done = function () { s.hidden = true; s.classList.remove('show'); $('#blob').getAnimations && $('#blob').getAnimations().forEach(function (a) { a.cancel(); }); $('#blob').style.transform = ''; };
    closeSheet($('#entrySheet'));
    $('#amtLine').style.transform = ''; $('#amtLine').style.setProperty('--p', 0);
    if (ui.tab !== 'home') go('home'); else renderHome(true);
    if (s.animate && !reduceMotion) s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out' }).onfinish = done;
    else done();
  });

  /* ---------- কন্টেক্সট প্যানেল: সার্ভিস, ক্লায়েন্ট, তারিখ, নোট ---------- */
  function optHTML(attr, val, on, label, color, iconName) {
    var sw = color ? '<span class="sw" style="background:' + color + ';color:' + inkFor(color) + '">' + (iconName ? ic(iconName, 13, 2.4) : '') + '</span>' : '';
    return '<button class="opt' + (color ? '' : ' plain') + (on ? ' on' : '') + '" ' + attr + '="' + esc(val) + '">' + sw + esc(label) + '</button>';
  }

  function openCtx() {
    vib(6);
    renderCtx();
    $('#ctxPanel').classList.add('open');
    $('#ctxPanel').setAttribute('aria-hidden', 'false');
  }
  function closeCtx() {
    $('#ctxPanel').classList.remove('open');
    $('#ctxPanel').setAttribute('aria-hidden', 'true');
  }

  function renderCtx() {
    var t = todayISO(), yd = iso(new Date(Date.now() - 864e5));
    var dateSec = '<div class="p-sec"><span class="p-lbl">তারিখ</span><div class="opt-chips">' +
      optHTML('data-date', t, E.date === t, 'আজ') + optHTML('data-date', yd, E.date === yd, 'গতকাল') +
      '</div><div style="margin-top:8px"><input class="field" type="date" id="ctxDate" value="' + E.date + '"></div></div>';
    var noteSec = '<div class="p-sec"><label for="ctxNote">নোট (ঐচ্ছিক)</label><input class="field" id="ctxNote" value="' + esc(E.note) + '" placeholder="' + (E.type === 'income' ? 'যেমন: ২টা রিল, অ্যাডভান্স ৫০%' : 'যেমন: ৩ দিনের ক্যাম্পেইন') + '"></div>';
    var html;
    var isEn = window.I18n && window.I18n.lang() === 'en';
    if (E.type === 'income') {
      html = '<h3 class="p-title">' + T('whatPayment') + '</h3>' +
        '<div class="p-sec"><span class="p-lbl">' + (isEn ? 'Payment Status' : 'পেমেন্ট স্ট্যাটাস') + '</span><div class="opt-chips">' +
        optHTML('data-st', 'paid', E.status !== 'due', isEn ? 'Paid ✓' : 'পরিশোধিত ✓') +
        optHTML('data-st', 'due', E.status === 'due', isEn ? 'Pending Due ⏳' : 'বাকি আছে ⏳') +
        '</div></div>' +
        '<div class="p-sec"><span class="p-lbl">' + T('workType') + '</span><div class="opt-chips">' +
        activeServices().map(function (s) { return optHTML('data-svc', s.id, E.svc === s.id, s.name, s.color, svcIcon(s)); }).join('') +
        '</div></div>' +
        '<div class="p-sec"><span class="p-lbl">' + T('client') + '</span><div class="opt-chips">' +
        optHTML('data-cli', '', !E.client, T('none')) +
        S.clients.map(function (c) { return optHTML('data-cli', c.id, E.client === c.id, c.name, c.color); }).join('') +
        '</div><div class="row-inline" style="margin-top:10px"><input class="field" id="ctxNewClient" placeholder="' + esc(T('newClientName')) + '"><button class="btn-dark sm" id="ctxAddClient">' + T('add') + '</button></div></div>' +
        dateSec + noteSec;
    } else {
      html = '<h3 class="p-title">কিসের খরচ?</h3>' +
        '<div class="p-sec"><span class="p-lbl">খরচের ধরন</span><div class="opt-chips">' +
        S.expenseCats.map(function (k) { return optHTML('data-cat', k.id, E.cat === k.id, k.name, k.color, catIcon(k)); }).join('') +
        '</div></div>' +
        '<div class="p-sec"><span class="p-lbl">কোন সার্ভিসের জন্য? (ঐচ্ছিক)</span><div class="opt-chips">' +
        optHTML('data-for', '', !E.forSvc, 'সাধারণ খরচ') +
        activeServices().map(function (s) { return optHTML('data-for', s.id, E.forSvc === s.id, s.name, s.color, svcIcon(s)); }).join('') +
        '</div></div>' + dateSec + noteSec;
    }
    $('#ctxPanelIn').innerHTML = html;
    $('#ctxPanelIn').scrollTop = 0;
  }

  $('#ctxPanelIn').addEventListener('click', function (e) {
    var b = e.target.closest('.opt');
    if (b) {
      vib(5);
      if (b.hasAttribute('data-svc')) E.svc = b.getAttribute('data-svc');
      if (b.hasAttribute('data-cli')) E.client = b.getAttribute('data-cli') || null;
      if (b.hasAttribute('data-cat')) E.cat = b.getAttribute('data-cat');
      if (b.hasAttribute('data-for')) E.forSvc = b.getAttribute('data-for') || null;
      if (b.hasAttribute('data-date')) E.date = b.getAttribute('data-date');
      if (b.hasAttribute('data-st')) E.status = b.getAttribute('data-st');
      E.note = ($('#ctxNote') || {}).value || E.note;
      renderCtx();
      return;
    }
    if (e.target.closest('#ctxAddClient')) addClientFromCtx();
  });
  $('#ctxPanelIn').addEventListener('change', function (e) {
    if (e.target.id === 'ctxDate' && e.target.value) { E.date = e.target.value; E.note = ($('#ctxNote') || {}).value || E.note; renderCtx(); }
  });
  $('#ctxPanelIn').addEventListener('input', function (e) { if (e.target.id === 'ctxNote') E.note = e.target.value; });
  $('#ctxPanelIn').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'ctxNewClient') { e.preventDefault(); addClientFromCtx(); }
  });
  function addClientFromCtx() {
    var inp = $('#ctxNewClient'), name = inp.value.trim();
    if (!name) { inp.focus(); return; }
    Store.addClient({ name: name }).then(function (c) { E.client = c.id; renderCtx(); toast(name + ' যোগ হলো'); });
  }
  $('#ctxDone').addEventListener('click', function () {
    var n = $('#ctxNote'); if (n) E.note = n.value;
    closeCtx(); renderEntry();
  });

  /* =================================================================
     বিস্তারিত শিটগুলো
     ================================================================= */
  function shareReceiptPNG(e) {
    var t = txText(e), s = svc(e.svc), c = cli(e.client), k = e.type === 'expense' ? cat(e.cat) : null;
    var isInc = e.type === 'income';
    var isEn = window.I18n && window.I18n.lang() === 'en';
    var W = 720, H = 880;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var g = cv.getContext('2d');

    // Dark luxury card background
    var bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0E1212');
    bg.addColorStop(1, '#070909');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    // Ambient top glow
    var rad = g.createRadialGradient(W * 0.5, 110, 10, W * 0.5, 110, 320);
    rad.addColorStop(0, isInc ? 'rgba(61, 220, 132, 0.22)' : 'rgba(255, 138, 76, 0.20)');
    rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = rad;
    g.fillRect(0, 0, W, H);

    // Inner card frame
    g.strokeStyle = 'rgba(255,255,255,0.10)';
    g.lineWidth = 2;
    g.strokeRect(32, 32, W - 64, H - 64);

    // Brand header
    g.fillStyle = '#FFFFFF';
    g.font = '800 30px Manrope, sans-serif';
    g.textAlign = 'left';
    g.fillText((S.profile && S.profile.name) || T('appTitle'), 64, 102);

    g.fillStyle = isInc ? '#3DDC84' : '#FF8A4C';
    g.font = '700 20px Manrope, sans-serif';
    g.textAlign = 'right';
    g.fillText(isInc ? (isEn ? 'PAYMENT RECEIPT' : 'পেমেন্ট রসিদ') : (isEn ? 'EXPENSE VOUCHER' : 'খরচের রসিদ'), W - 64, 100);

    // Divider
    g.strokeStyle = 'rgba(255,255,255,0.08)';
    g.beginPath(); g.moveTo(64, 134); g.lineTo(W - 64, 134); g.stroke();

    // Big amount
    g.textAlign = 'center';
    g.fillStyle = isInc ? '#3DDC84' : '#FFFFFF';
    g.font = '800 76px Manrope, sans-serif';
    g.fillText((isInc ? '+' : '−') + curSym() + fmtN(e.amount), W / 2, 250);

    g.fillStyle = '#8A9292';
    g.font = '600 24px Manrope, sans-serif';
    g.fillText(t.title, W / 2, 298);

    // Status pill
    g.fillStyle = isInc ? 'rgba(61,220,132,0.16)' : 'rgba(255,138,76,0.16)';
    g.fillRect(W / 2 - 90, 324, 180, 44);
    g.fillStyle = isInc ? '#3DDC84' : '#FF8A4C';
    g.font = '800 18px Manrope, sans-serif';
    g.fillText(isInc ? '✓ VERIFIED' : '✓ RECORDED', W / 2, 353);

    // Details rows
    var rows = [
      [T('date'), fmtDate(e.date)],
      [T('type'), isInc ? T('income') : T('expense')],
      isInc ? [T('work'), s ? s.name : '—'] : [T('expenseType'), k ? k.name : '—'],
      isInc ? [T('client'), c ? c.name : '—'] : [T('note'), e.note || '—']
    ];
    if (isInc && e.note) rows.push([T('note'), e.note]);

    var y = 445;
    rows.forEach(function (r) {
      g.fillStyle = '#8A9292';
      g.font = '600 22px Manrope, sans-serif';
      g.textAlign = 'left';
      g.fillText(r[0], 72, y);

      g.fillStyle = '#F3F6F5';
      g.font = '700 22px Manrope, sans-serif';
      g.textAlign = 'right';
      g.fillText(String(r[1]).slice(0, 34), W - 72, y);

      g.strokeStyle = 'rgba(255,255,255,0.06)';
      g.beginPath(); g.moveTo(72, y + 22); g.lineTo(W - 72, y + 22); g.stroke();
      y += 66;
    });

    // Footer
    g.textAlign = 'center';
    g.fillStyle = '#5E6666';
    g.font = '600 18px Manrope, sans-serif';
    g.fillText(T('appTitle') + ' · ID #' + String(e.id).slice(-6).toUpperCase(), W / 2, H - 68);

    cv.toBlob(function (blob) {
      if (!blob) return;
      var fname = 'receipt-' + String(e.id).slice(-6) + '.png';
      try {
        var file = new File([blob], fname, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: T('appTitle') }).catch(function () { /* */ });
          return;
        }
      } catch (err) { /* fallback download */ }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
      toast(isEn ? 'Receipt saved!' : 'রসিদ ডাউনলোড হয়েছে!');
    }, 'image/png');
  }

  function openTx(id) {
    var e = S.entries.find(function (x) { return x.id === id; });
    if (!e) return;
    var isEn = window.I18n && window.I18n.lang() === 'en';
    var isDue = e.type === 'income' && e.status === 'due';
    var t = txText(e), s = svc(e.svc), c = cli(e.client), k = e.type === 'expense' ? cat(e.cat) : null, f = e.forSvc && svc(e.forSvc);
    var rows = [[T('type'), e.type === 'income' ? (isDue ? (isEn ? 'Pending Due ⏳' : 'বাকি পেমেন্ট ⏳') : T('income')) : T('expense')], [T('date'), fmtDate(e.date)]];
    if (e.type === 'income') { rows.push([T('work'), s ? s.name : '—']); rows.push([T('client'), c ? c.name : '—']); }
    else { rows.push([T('expenseType'), k.name]); rows.push([T('forWhichSvc').replace('?', ''), f ? f.name : T('generalExpense')]); }
    if (e.note) rows.push([T('note'), e.note]);
    var cleanPhone = c && c.phone ? String(c.phone).replace(/[^0-9+]/g, '') : '';
    var remMsg = isEn
      ? 'Hello ' + (c ? c.name : '') + ', gentle reminder regarding pending payment of ' + curSym() + fmtN(e.amount) + (s ? ' for ' + s.name : '') + '. Thank you!'
      : 'আসসালামু আলাইকুম ' + (c ? c.name : '') + ', ' + (s ? s.name + '-এর ' : '') + curSym() + fmtN(e.amount) + ' বাকি পেমেন্টটির কথা একটু মনে করিয়ে দিলাম। ধন্যবাদ!';
    var waRem = 'https://wa.me/' + (cleanPhone ? cleanPhone.replace(/^\+/, '').replace(/^0/, '880') : '') + '?text=' + encodeURIComponent(remMsg);

    openModal(
      '<div class="d-head">' + txIconHTML(e) + '<div class="d-amt ' + (e.type === 'income' && !isDue ? 'pos' : '') + '">' + (e.type === 'income' ? '+' : '−') + curSym() + fmtN(e.amount) + '</div><div class="d-title">' + esc(t.title) + (isDue ? '<span class="due-tag">' + T('due') + '</span>' : '') + '</div></div>' +
      '<div class="d-rows">' + rows.map(function (r) { return '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('') + '</div>' +
      (isDue ? '<div style="margin-top:12px"><button class="btn-success" id="markPaidBtn">' + (isEn ? '✓ Mark as Paid' : '✓ পরিশোধিত করুন (Mark Paid)') + '</button></div>' +
        '<div style="margin-top:8px"><a class="wa-btn" style="width:100%" href="' + waRem + '" target="_blank" rel="noopener">' + (isEn ? 'Send WhatsApp Reminder' : 'WhatsApp পেমেন্ট রিমাইন্ডার পাঠান') + '</a></div>' : '') +
      '<div class="btn-row" style="margin-top:12px"><button class="btn-light" id="rcptBtn" style="height:46px;font-size:13.5px">' + (isEn ? 'Share Receipt' : 'রসিদ শেয়ার') + '</button><button class="btn-light" id="dupBtn" style="height:46px;font-size:13.5px">' + (isEn ? 'Duplicate' : 'ডুপ্লিকেট') + '</button></div>' +
      '<div class="btn-row" style="margin-top:10px"><button class="btn-danger" id="delBtn">' + T('delete') + '</button><button class="btn-dark" id="editBtn">' + T('edit') + '</button></div>',
      function (root) {
        var mp = $('#markPaidBtn', root);
        if (mp) {
          mp.onclick = function () {
            vib([12, 30, 16]);
            Store.updateEntry(id, Object.assign({}, e, { status: 'paid' })).then(function () {
              closeModal();
              toast(isEn ? 'Marked as Paid!' : 'পেমেন্ট পরিশোধিত হিসেবে সেভ হয়েছে!');
              setTimeout(burstConfetti, 180);
            });
          };
        }
        $('#rcptBtn', root).onclick = function () { vib(8); shareReceiptPNG(e); };
        $('#dupBtn', root).onclick = function () {
          closeModal();
          setTimeout(function () {
            openEntry({ type: e.type, expr: String(e.amount), svc: e.svc, client: e.client, cat: e.cat || 'fb', forSvc: e.forSvc, date: todayISO(), note: e.note, editId: null });
          }, 200);
        };
        $('#editBtn', root).onclick = function () { openEdit(id); };
        var del = $('#delBtn', root), armed = false, tm;
        del.onclick = function () {
          if (!armed) { armed = true; vib(15); del.classList.add('armed'); del.textContent = T('confirmAgain'); tm = setTimeout(function () { armed = false; del.classList.remove('armed'); del.textContent = T('delete'); }, 3500); return; }
          clearTimeout(tm);
          Store.deleteEntry(id).then(function () { closeModal(); toast(T('deleted')); });
        };
      });
  }

  function openClient(id) {
    var c = cli(id); if (!c) return;
    var list = S.entries.filter(function (e) { return e.type === 'income' && e.client === id; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    var total = list.reduce(function (a, e) { return a + e.amount; }, 0);
    var cleanPhone = String(c.phone || '').replace(/[^0-9+]/g, '');
    var waHref = cleanPhone ? ('https://wa.me/' + cleanPhone.replace(/^\+/, '').replace(/^0/, '880')) : '';
    openModal(
      '<div class="d-head">' + avatarHTML(c).replace('class="av ', 'class="av tx-ic ') + '<div class="d-amt">' + curSym() + fmtN(total) + '</div><div class="d-title">' + esc(c.name) + ' · ' + T('paymentsCount', { n: list.length }) + '</div></div>' +
      '<button class="btn-dark" id="cAdd" style="margin-top:12px">' + esc(c.name.split(' ')[0]) + ' — + ' + T('income') + '</button>' +
      '<div class="btn-row" style="margin-top:8px">' +
      (waHref ? '<a class="wa-btn" href="' + waHref + '" target="_blank" rel="noopener">WhatsApp</a>' : '<button class="btn-light" id="cEditPhone" style="height:46px;font-size:14px">+ WhatsApp</button>') +
      '<button class="btn-light" id="cEdit" style="height:46px;font-size:14px">' + T('edit') + '</button></div>' +
      '<div class="mini-list">' + (list.length ? list.slice(0, 30).map(txRowHTML).join('') : '<div class="empty">' + T('noTxTitle') + '</div>') + '</div>',
      function (root) {
        $('#cAdd', root).onclick = function () { closeModal(); setTimeout(function () { openEntry({ type: 'income', client: id, svc: (list[0] && list[0].svc) || (activeServices()[0] || {}).id }); }, 180); };
        $('#cEdit', root).onclick = function () { closeModal(); setTimeout(function () { openClientForm(id); }, 180); };
        var ep = $('#cEditPhone', root);
        if (ep) ep.onclick = function () { closeModal(); setTimeout(function () { openClientForm(id); }, 180); };
      });
  }

  function openServiceForm(id) {
    var s = id ? svc(id) : null;
    var color = s ? s.color : Store.SERVICE_COLORS[S.services.length % Store.SERVICE_COLORS.length];
    openModal(
      '<h3 class="m-title">' + (s ? 'সার্ভিস এডিট' : 'নতুন সার্ভিস') + '</h3><p class="m-sub">যেমন: ভিডিও এডিটিং, ওয়েবসাইট, লোগো ডিজাইন</p>' +
      '<div class="p-sec"><label for="svcName">নাম</label><input class="field" id="svcName" value="' + esc(s ? s.name : '') + '" placeholder="সার্ভিসের নাম"></div>' +
      '<div class="p-sec"><span class="p-lbl">কার্ডের রঙ</span><div class="color-row" id="colorRow">' +
      Store.SERVICE_COLORS.map(function (c) { return '<button class="color-dot' + (c === color ? ' on' : '') + '" data-color="' + c + '" style="background:' + c + '" aria-label="রঙ"></button>'; }).join('') +
      '</div></div><div style="margin-top:22px"><button class="btn-dark" id="svcSave">' + (s ? 'সেভ করুন' : 'সার্ভিস যোগ করুন') + '</button></div>',
      function (root) {
        $('#colorRow', root).onclick = function (e) {
          var b = e.target.closest('[data-color]'); if (!b) return;
          color = b.dataset.color;
          $$('.color-dot', root).forEach(function (d) { d.classList.toggle('on', d === b); });
        };
        $('#svcSave', root).onclick = function () {
          var name = $('#svcName', root).value.trim();
          if (!name) { $('#svcName', root).focus(); return; }
          (s ? Store.updateService(s.id, { name: name, color: color }) : Store.addService({ name: name, color: color }))
            .then(function () { closeModal(); toast(s ? 'সেভ হয়েছে' : name + ' যোগ হলো'); });
        };
      });
  }

  function openClientForm(id) {
    var c = id ? cli(id) : null;
    var color = c ? c.color : Store.CLIENT_COLORS[S.clients.length % Store.CLIENT_COLORS.length];
    var isEn = window.I18n && window.I18n.lang() === 'en';
    openModal(
      '<h3 class="m-title">' + (c ? (isEn ? 'Edit Client' : 'ক্লায়েন্ট এডিট') : (isEn ? 'New Client' : 'নতুন ক্লায়েন্ট')) + '</h3>' +
      '<div class="p-sec"><label for="cliName">' + (isEn ? 'Name' : 'নাম') + '</label><input class="field" id="cliName" value="' + esc(c ? c.name : '') + '" placeholder="' + (isEn ? 'e.g. Rahim Traders' : 'যেমন: রহিম ট্রেডার্স') + '"></div>' +
      '<div class="p-sec"><label for="cliPhone">' + (isEn ? 'WhatsApp / Phone (Optional)' : 'হোয়াটসঅ্যাপ / ফোন (ঐচ্ছিক)') + '</label><input class="field" id="cliPhone" type="tel" value="' + esc(c ? (c.phone || '') : '') + '" placeholder="017XXXXXXXX"></div>' +
      '<div class="p-sec"><span class="p-lbl">' + (isEn ? 'Avatar Color' : 'অ্যাভাটারের রঙ') + '</span><div class="color-row" id="cColorRow">' +
      Store.CLIENT_COLORS.map(function (col) { return '<button class="color-dot' + (col === color ? ' on' : '') + '" data-color="' + col + '" style="background:' + col + '" aria-label="Color"></button>'; }).join('') +
      '</div></div>' +
      '<div style="margin-top:22px"><button class="btn-dark" id="cliSave">' + (c ? T('saved').replace('হয়েছে', 'করুন') : T('addClient')) + '</button></div>',
      function (root) {
        $('#cColorRow', root).onclick = function (e) {
          var b = e.target.closest('[data-color]'); if (!b) return;
          color = b.dataset.color;
          $$('.color-dot', root).forEach(function (d) { d.classList.toggle('on', d === b); });
        };
        var save = function () {
          var name = $('#cliName', root).value.trim();
          var phone = $('#cliPhone', root).value.trim();
          if (!name) { $('#cliName', root).focus(); return; }
          var req = c
            ? Store.updateClient(c.id, { name: name, phone: phone, color: color })
            : Store.addClient({ name: name, phone: phone, color: color });
          req.then(function () { closeModal(); toast(c ? T('saved') : name + ' ✓'); });
        };
        $('#cliSave', root).onclick = save;
        $('#cliName', root).onkeydown = function (e) { if (e.key === 'Enter') save(); };
      });
  }

  var deferredInstall = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; });

  function downloadFile(content, filename, type) {
    var blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function fmtSyncTime(ts) {
    if (!ts) return T('never');
    var d = new Date(ts);
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' · ' + d.getDate() + ' ' + getMonthsShort()[d.getMonth()];
  }

  function openCloudSettings() {
    var cfg = Store.getCloudConfig();
    var st = Store.getSyncStatus();
    var connected = !!cfg.url;
    var badgeCls = !connected ? '' : (st.state === 'error' ? ' err' : (st.state === 'offline' || st.state === 'syncing' ? ' warn' : ' ok'));
    var badgeText = !connected ? 'কানেক্ট করা নেই' :
      st.state === 'syncing' ? 'সিঙ্ক হচ্ছে…' :
      st.state === 'offline' ? 'অফলাইন (পেন্ডিং)' :
      st.state === 'error' ? ('সমস্যা: ' + (st.message || 'আবার চেষ্টা করুন')) :
      'কানেক্টেড · শেষ সিঙ্ক ' + fmtSyncTime(cfg.lastSync);

    openModal(
      '<h3 class="m-title">গুগল শিট ডাটাবেস</h3>' +
      '<p class="m-sub">সব হিসাব আপনার নিজের Google Sheet-এ অটোমেটিক সেভ হবে। ইন্টারনেট না থাকলেও কাজ করবে।</p>' +
      '<div class="cloud-badge' + badgeCls + '"><i></i><span>' + esc(badgeText) + '</span></div>' +
      '<div class="p-sec"><label for="gsUrl">Apps Script Web App URL</label>' +
      '<input class="field" id="gsUrl" type="url" value="' + esc(cfg.url || '') + '" placeholder="https://script.google.com/macros/s/.../exec" autocomplete="off"></div>' +
      '<div class="p-sec"><label for="gsSecret">সিক্রেট পিন (ঐচ্ছিক)</label>' +
      '<input class="field" id="gsSecret" value="' + esc(cfg.secret || 'hisab123') + '" placeholder="hisab123" autocomplete="off"></div>' +
      '<div style="margin-top:18px"><button class="btn-dark" id="gsSave">' + (connected ? 'আপডেট ও সিঙ্ক করুন' : 'কানেক্ট ও সিঙ্ক করুন') + '</button></div>' +
      (connected ? '<div class="btn-row"><button class="btn-light" id="gsSyncNow">এখনই সিঙ্ক</button><button class="btn-danger" id="gsDisc">ডিসকানেক্ট</button></div>' : '') +
      '<div class="cloud-steps"><b>সেটআপ গাইড:</b><br>' +
      '১. আপনার Google Sheet-এ <b>Extensions → Apps Script</b> খুলুন।<br>' +
      '২. <code>google-sheets-script.gs</code> কোডটি পেস্ট করে Save দিন।<br>' +
      '৩. <b>Deploy → New deployment → Web app</b> (Who has access: <b>Anyone</b>) করে পাওয়া URL-টি উপরে পেস্ট করুন।</div>',
      function (root) {
        var saveBtn = $('#gsSave', root);
        saveBtn.onclick = function () {
          var url = $('#gsUrl', root).value.trim();
          var secret = $('#gsSecret', root).value.trim();
          if (!url || url.indexOf('https://script.google.com/') !== 0) {
            toast('সঠিক Google Apps Script URL দিন');
            $('#gsUrl', root).focus();
            return;
          }
          saveBtn.disabled = true;
          saveBtn.textContent = 'কানেক্ট হচ্ছে…';
          Store.setCloudConfig({ url: url, secret: secret })
            .then(function () {
              closeModal();
              toast('গুগল শিট সফলভাবে কানেক্ট ও সিঙ্ক হয়েছে!');
            })
            .catch(function (err) {
              saveBtn.disabled = false;
              saveBtn.textContent = connected ? 'আপডেট ও সিঙ্ক করুন' : 'কানেক্ট ও সিঙ্ক করুন';
              toast('ব্যর্থ: ' + (err && err.message ? err.message : 'URL বা পিন চেক করুন'));
            });
        };
        var syncBtn = $('#gsSyncNow', root);
        if (syncBtn) {
          syncBtn.onclick = function () {
            syncBtn.disabled = true;
            syncBtn.textContent = 'সিঙ্ক হচ্ছে…';
            Store.syncNow()
              .then(function () { closeModal(); toast('গুগল শিটের সাথে সিঙ্ক সম্পন্ন!'); })
              .catch(function (err) {
                syncBtn.disabled = false; syncBtn.textContent = 'এখনই সিঙ্ক';
                toast('সিঙ্ক হয়নি: ' + (err && err.message ? err.message : 'ইন্টারনেট চেক করুন'));
              });
          };
        }
        var discBtn = $('#gsDisc', root);
        if (discBtn) {
          discBtn.onclick = function () {
            Store.disconnectCloud().then(function () {
              closeModal();
              toast('গুগল শিট ডিসকানেক্ট করা হয়েছে');
            });
          };
        }
      });
  }

  var AVATAR_GRADIENTS = [
    'conic-gradient(from 200deg, #FFE14A, #2BE8B5, #2AA8FF, #FFE14A)',
    'linear-gradient(135deg, #2BE8B5, #18A957)',
    'linear-gradient(135deg, #FFE14A, #FF8A4C)',
    'linear-gradient(135deg, #6366F1, #EC4899)',
    'linear-gradient(135deg, #06B6D4, #3B82F6)',
    'linear-gradient(135deg, #F43F5E, #FB923C)',
    'linear-gradient(135deg, #A855F7, #38BDF8)',
    'linear-gradient(135deg, #E2E8F0, #94A3B8)'
  ];
  var AVATAR_EMOJIS = ['', '💼', '🚀', '⚡', '👑', '🎯', '💎', '🎬', '💻', '🎨', '📈', '🦁'];

  function compressAvatarPhoto(file, cb) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var size = 128;
        var canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        var ctx = canvas.getContext('2d');
        var min = Math.min(img.width, img.height);
        var sx = (img.width - min) / 2, sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        cb(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function renderAvatarInner(p) {
    if (p && p.photo) return '<img class="av-img" src="' + p.photo + '" alt="Avatar">';
    if (p && p.emoji) return '<span class="av-em">' + p.emoji + '</span>';
    return esc(p && p.name ? initials(p.name) : (window.I18n && window.I18n.lang() === 'en' ? 'HK' : 'হি'));
  }

  function openAvatarStudio() {
    var p = Object.assign({ name: '', gradient: AVATAR_GRADIENTS[0], emoji: '', photo: '' }, S.profile || {});
    var isEn = window.I18n && window.I18n.lang() === 'en';
    openModal(
      '<h3 class="m-title">' + (isEn ? 'Avatar Studio' : 'অ্যাভাটার স্টুডিও') + '</h3>' +
      '<p class="m-sub">' + (isEn ? 'Customize your profile avatar with gradients, icons, or your own photo.' : 'গ্রেডিয়েন্ট, আইকন বা আপনার নিজের ছবি দিয়ে প্রোফাইল সাজান।') + '</p>' +
      '<div class="av-preview-row">' +
      '<div class="av-big" id="avBig" style="background:' + (p.gradient || AVATAR_GRADIENTS[0]) + '">' + renderAvatarInner(p) + '</div>' +
      '<div style="flex:1"><button class="btn-dark sm" id="avUploadBtn" style="width:100%">' + (isEn ? 'Upload Photo' : 'ছবি আপলোড করুন') + '</button>' +
      (p.photo ? '<button class="btn-light" id="avRemovePhoto" style="height:36px;margin-top:6px;font-size:12.5px">' + (isEn ? 'Remove Photo' : 'ছবি সরান') + '</button>' : '') +
      '</div></div>' +
      '<div class="p-sec"><span class="p-lbl">' + (isEn ? 'Luxury Gradients' : 'গ্রেডিয়েন্ট স্টাইল') + '</span><div class="color-row" id="avGrads">' +
      AVATAR_GRADIENTS.map(function (g, i) { return '<button class="color-dot' + (g === p.gradient ? ' on' : '') + '" data-gi="' + i + '" style="background:' + g + '"></button>'; }).join('') +
      '</div></div>' +
      '<div class="p-sec"><span class="p-lbl">' + (isEn ? 'Icon / Initials' : 'আইকন বা অক্ষর') + '</span><div class="av-grid" id="avEmojis">' +
      AVATAR_EMOJIS.map(function (em) { return '<button class="av-em-btn' + (em === (p.emoji || '') && !p.photo ? ' on' : '') + '" data-em="' + em + '">' + (em || 'Aa') + '</button>'; }).join('') +
      '</div></div>' +
      '<div style="margin-top:20px"><button class="btn-dark" id="avSaveBtn">' + T('ok') + '</button></div>' +
      '<input type="file" id="avFileInp" accept="image/*" style="display:none">',
      function (root) {
        var syncPrev = function () {
          var box = $('#avBig', root);
          box.style.background = p.gradient || AVATAR_GRADIENTS[0];
          box.innerHTML = renderAvatarInner(p);
        };
        $('#avGrads', root).onclick = function (e) {
          var b = e.target.closest('[data-gi]'); if (!b) return;
          vib(5);
          p.gradient = AVATAR_GRADIENTS[Number(b.dataset.gi)];
          p.photo = '';
          $$('#avGrads .color-dot', root).forEach(function (d) { d.classList.toggle('on', d === b); });
          syncPrev();
        };
        $('#avEmojis', root).onclick = function (e) {
          var b = e.target.closest('[data-em]'); if (!b) return;
          vib(5);
          p.emoji = b.dataset.em;
          p.photo = '';
          $$('#avEmojis .av-em-btn', root).forEach(function (d) { d.classList.toggle('on', d === b); });
          syncPrev();
        };
        var fInp = $('#avFileInp', root);
        $('#avUploadBtn', root).onclick = function () { fInp.click(); };
        fInp.onchange = function (e) {
          var f = e.target.files && e.target.files[0]; if (!f) return;
          compressAvatarPhoto(f, function (dataUrl) {
            p.photo = dataUrl;
            syncPrev();
            toast(isEn ? 'Photo ready!' : 'ছবি প্রস্তুত!');
          });
        };
        var rem = $('#avRemovePhoto', root);
        if (rem) rem.onclick = function () { p.photo = ''; syncPrev(); rem.remove(); };
        $('#avSaveBtn', root).onclick = function () {
          Store.setProfile({ gradient: p.gradient, emoji: p.emoji, photo: p.photo }).then(function () {
            closeModal();
            toast(T('saved'));
          });
        };
      });
  }

  var PIN_KEY = 'hisab.pin';
  var PRIV_KEY = 'hisab.privacy';

  function paintPrivacy() {
    var on = document.body.classList.contains('privacy-on');
    var btn = $('#privacyBtn');
    if (btn) btn.innerHTML = ic(on ? 'eyeOff' : 'eye', 17, 2);
  }
  function togglePrivacy() {
    vib(6);
    var on = document.body.classList.toggle('privacy-on');
    try { localStorage.setItem(PRIV_KEY, on ? '1' : '0'); } catch (e) { /* */ }
    paintPrivacy();
  }
  function initPrivacy() {
    try { if (localStorage.getItem(PRIV_KEY) === '1') document.body.classList.add('privacy-on'); } catch (e) { /* */ }
    paintPrivacy();
  }

  function showPinLock(expectedPin, onUnlock) {
    var box = $('#pinLock'); if (!box) return;
    var isEn = window.I18n && window.I18n.lang() === 'en';
    var entered = '';
    $('#pinTitle').textContent = isEn ? 'Enter 4-Digit PIN' : '৪-ডিজিটের পিন দিন';
    var dots = $$('#pinDots i');
    var paintDots = function () { dots.forEach(function (d, i) { d.classList.toggle('on', i < entered.length); }); };
    paintDots();
    box.hidden = false;
    $('#pinKeys').onclick = function (e) {
      var b = e.target.closest('[data-pk]'); if (!b) return;
      var k = b.dataset.pk;
      vib(6);
      if (k === 'del') { entered = entered.slice(0, -1); paintDots(); return; }
      if (entered.length >= 4) return;
      entered += k;
      paintDots();
      if (entered.length === 4) {
        if (entered === expectedPin) {
          vib([10, 30, 10]);
          box.hidden = true;
          if (onUnlock) onUnlock();
        } else {
          vib(35);
          var dl = $('#pinDots');
          dl.classList.remove('shake'); void dl.offsetWidth; dl.classList.add('shake');
          setTimeout(function () { entered = ''; paintDots(); }, 350);
        }
      }
    };
  }

  function openPinSettings() {
    var isEn = window.I18n && window.I18n.lang() === 'en';
    var curPin = '';
    try { curPin = localStorage.getItem(PIN_KEY) || ''; } catch (e) { /* */ }
    openModal(
      '<h3 class="m-title">' + (isEn ? 'App PIN Lock' : 'অ্যাপ পিন লক') + '</h3>' +
      '<p class="m-sub">' + (isEn ? 'Protect your financial data with a 4-digit passcode.' : '৪-ডিজিটের পিন দিয়ে আপনার হিসাব সুরক্ষিত রাখুন।') + '</p>' +
      '<div class="p-sec"><label for="inpPin">' + (isEn ? 'New 4-Digit PIN' : 'নতুন ৪-ডিজিটের পিন') + '</label>' +
      '<input class="field" id="inpPin" type="password" inputmode="numeric" maxlength="4" placeholder="••••"></div>' +
      '<div style="margin-top:18px"><button class="btn-dark" id="savePinBtn">' + (curPin ? (isEn ? 'Update PIN' : 'পিন আপডেট করুন') : (isEn ? 'Enable PIN Lock' : 'পিন লক চালু করুন')) + '</button></div>' +
      (curPin ? '<div style="margin-top:10px"><button class="btn-danger" id="remPinBtn">' + (isEn ? 'Disable PIN Lock' : 'পিন লক বন্ধ করুন') + '</button></div>' : ''),
      function (root) {
        $('#savePinBtn', root).onclick = function () {
          var v = $('#inpPin', root).value.replace(/[^0-9]/g, '');
          if (v.length !== 4) { toast(isEn ? 'Enter exactly 4 digits' : 'ঠিক ৪টি সংখ্যা দিন'); return; }
          try { localStorage.setItem(PIN_KEY, v); } catch (e) { /* */ }
          closeModal();
          toast(isEn ? 'PIN Lock enabled!' : 'পিন লক চালু হয়েছে!');
        };
        var rem = $('#remPinBtn', root);
        if (rem) rem.onclick = function () {
          try { localStorage.removeItem(PIN_KEY); } catch (e) { /* */ }
          closeModal();
          toast(isEn ? 'PIN Lock disabled' : 'পিন লক বন্ধ করা হয়েছে');
        };
      });
  }

  function openGoalSettings() {
    var isEn = window.I18n && window.I18n.lang() === 'en';
    var goal = (S.settings && S.settings.monthlyGoal) || '';
    var adBud = (S.settings && S.settings.adBudget) || '';
    openModal(
      '<h3 class="m-title">' + (isEn ? 'Monthly Goals & Budget' : 'মাসিক লক্ষ্য ও বাজেট') + '</h3>' +
      '<p class="m-sub">' + (isEn ? 'Track your monthly income target & get alerts before overspending on ads.' : 'মাসিক আয়ের টার্গেট ও অ্যাড খরচের সীমা সেট করুন।') + '</p>' +
      '<div class="p-sec"><label for="inpGoal">' + (isEn ? 'Monthly Income Target (' + curSym() + ')' : 'মাসিক আয়ের লক্ষ্য (' + curSym() + ')') + '</label>' +
      '<input class="field" id="inpGoal" type="number" min="0" value="' + esc(goal) + '" placeholder="50000"></div>' +
      '<div class="p-sec"><label for="inpAdBud">' + (isEn ? 'Monthly Ad Spend Limit (' + curSym() + ')' : 'মাসিক অ্যাড খরচের লিমিট (' + curSym() + ')') + '</label>' +
      '<input class="field" id="inpAdBud" type="number" min="0" value="' + esc(adBud) + '" placeholder="10000"></div>' +
      '<div style="margin-top:22px"><button class="btn-dark" id="saveGoalBtn">' + T('ok') + '</button></div>',
      function (root) {
        $('#saveGoalBtn', root).onclick = function () {
          var g = Math.max(0, Number($('#inpGoal', root).value) || 0);
          var a = Math.max(0, Number($('#inpAdBud', root).value) || 0);
          Store.setSettings({ monthlyGoal: g, adBudget: a }).then(function () {
            closeModal();
            toast(T('saved'));
          });
        };
      });
  }

  function openSettings() {
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
    var installSub = standalone ? 'অ্যাপ হিসেবে চলছে' : deferredInstall ? 'হোম স্ক্রিনে অ্যাপ হিসেবে রাখুন' : isIOS ? 'Safari-তে Share → “Add to Home Screen”' : 'ব্রাউজার মেনু → “Install app / Add to Home screen”';
    var cur = (S.settings && S.settings.currency) || 'BDT';
    var lang = (S.settings && S.settings.lang) || 'bn';
    var cloudCfg = Store.getCloudConfig();
    var cloudConnected = !!cloudCfg.url;
    var cloudSub = cloudConnected ? T('connectedSync', { t: fmtSyncTime(cloudCfg.lastSync) }) : T('setupCloudSub');

    var isEn = window.I18n && window.I18n.lang() === 'en';
    openModal(
      '<div class="brand-head"><img src="icons/logo.svg" alt="Logo"><div><h3>' + esc(T('appTitle')) + '</h3><span>v' + esc(window.APP_VERSION || '1.0.0') + ' · ' + esc(T('settings')) + '</span></div></div>' +
      '<div class="p-sec"><label for="profName">' + esc(T('yourName')) + '</label><div class="row-inline"><input class="field" id="profName" value="' + esc(S.profile.name || '') + '" placeholder="' + esc(T('enterName')) + '"><button class="btn-dark sm" id="openAvBtn">' + (isEn ? 'Avatar' : 'অ্যাভাটার') + '</button></div></div>' +
      '<div class="p-sec"><span class="p-lbl">' + esc(T('language')) + '</span>' +
      '<div class="chips chips-tight" id="langChips" style="margin-top:6px">' +
      '<button class="chip ' + (lang === 'bn' ? 'on' : '') + '" data-l="bn">বাংলা</button>' +
      '<button class="chip ' + (lang === 'en' ? 'on' : '') + '" data-l="en">English</button>' +
      '</div></div>' +
      '<div class="p-sec"><span class="p-lbl">' + esc(T('currency')) + '</span>' +
      '<div class="chips chips-tight" id="currChips" style="margin-top:6px">' +
      '<button class="chip ' + (cur === 'BDT' ? 'on' : '') + '" data-c="BDT">৳ টাকা (BDT)</button>' +
      '<button class="chip ' + (cur === 'USD' ? 'on' : '') + '" data-c="USD">$ USD ($)</button>' +
      '</div></div>' +
      '<div class="set-list">' +
      '<button class="set-item' + (cloudConnected ? ' cloud-on' : '') + '" id="setCloud"><span class="si-ic">' + ic('cloud', 18) + '</span><span><b>' + esc(T('googleSheetDb')) + '</b><small>' + esc(cloudSub) + '</small></span></button>' +
      '<button class="set-item" id="setGoals"><span class="si-ic">' + ic('spark', 18) + '</span><span><b>' + (isEn ? 'Monthly Goals & Budget' : 'মাসিক লক্ষ্য ও বাজেট') + '</b><small>' + (S.settings && S.settings.monthlyGoal ? fmt$(S.settings.monthlyGoal) : (isEn ? 'Set income target & ad budget' : 'মাসিক আয়ের লক্ষ্য ও অ্যাড লিমিট সেট করুন')) + '</small></span></button>' +
      '<button class="set-item" id="setPin"><span class="si-ic">' + ic('lock', 18) + '</span><span><b>' + (isEn ? 'App PIN Lock' : 'অ্যাপ পিন লক') + '</b><small>' + ((function(){ try { return localStorage.getItem(PIN_KEY) ? (isEn ? 'Enabled (4-digit PIN)' : 'চালু আছে (৪-ডিজিট পিন)') : (isEn ? 'Protect app with passcode' : 'পিন দিয়ে অ্যাপ লক করুন'); } catch(e){ return ''; } })()) + '</small></span></button>' +
      '<button class="set-item" id="setUpdate"><span class="si-ic">' + ic('refresh', 18) + '</span><span><b>' + esc(T('appUpdate', { v: window.APP_VERSION || '1.0.0' })) + '</b><small id="setUpdateSub">' + esc(T('checkInstallUpdate')) + '</small></span></button>' +
      '<button class="set-item" id="setInstall"><span class="si-ic">' + ic('download', 18) + '</span><span><b>' + esc(T('installApp')) + '</b><small>' + installSub + '</small></span></button>' +
      '<button class="set-item" id="setBackup"><span class="si-ic">' + ic('file', 18) + '</span><span><b>' + esc(T('backupDownload')) + '</b><small>' + esc(T('backupDownloadSub')) + '</small></span></button>' +
      '<button class="set-item" id="setRestore"><span class="si-ic">' + ic('upload', 18) + '</span><span><b>' + esc(T('backupRestore')) + '</b><small>' + esc(T('backupRestoreSub')) + '</small></span></button>' +
      '<button class="set-item" id="setCsv"><span class="si-ic">' + ic('file', 18) + '</span><span><b>' + esc(T('csvDownload')) + '</b><small>' + esc(T('csvDownloadSub')) + '</small></span></button>' +
      (navigator.share ? '<button class="set-item" id="setShare"><span class="si-ic">' + ic('share', 18) + '</span><span><b>' + esc(T('shareReport')) + '</b><small>' + esc(T('shareReportSub')) + '</small></span></button>' : '') +
      '<button class="set-item" id="setCopy"><span class="si-ic">' + ic('copy', 18) + '</span><span><b>' + esc(T('copyClipboard')) + '</b><small>' + esc(T('copyClipboardSub')) + '</small></span></button>' +
      '<button class="set-item danger" id="setReset"><span class="si-ic">' + ic('trash', 18) + '</span><span><b>' + esc(T('resetAll')) + '</b><small>' + esc(T('resetAllSub')) + '</small></span></button>' +
      '</div>' +
      '<input type="file" id="restoreInput" accept=".json,application/json" style="display:none">',
      function (root) {
        $('#profName', root).onchange = function (e) { Store.setProfile({ name: e.target.value.trim() }); };
        $('#openAvBtn', root).onclick = function () { closeModal(); setTimeout(openAvatarStudio, 200); };
        $('#langChips', root).onclick = function (e) {
          var b = e.target.closest('[data-l]'); if (!b) return;
          var nextL = b.dataset.l;
          vib(6);
          Store.setSettings({ lang: nextL }).then(function () {
            if (window.I18n) window.I18n.applyDOM();
            renderTab(ui.tab, false);
            closeModal();
            toast(T('langChanged'));
          });
        };
        $('#setCloud', root).onclick = function () { closeModal(); setTimeout(openCloudSettings, 200); };
        $('#setGoals', root).onclick = function () { closeModal(); setTimeout(openGoalSettings, 200); };
        $('#setPin', root).onclick = function () { closeModal(); setTimeout(openPinSettings, 200); };
        $('#setUpdate', root).onclick = function () {
          if (!window.AppUpdater) { toast('আপডেটার পাওয়া যায়নি'); return; }
          var sub = $('#setUpdateSub', root);
          var st = window.AppUpdater.getState();
          if (st.status === 'ready') {
            toast('আপডেট ইনস্টল হচ্ছে…');
            window.AppUpdater.apply();
            return;
          }
          if (sub) sub.textContent = 'আপডেট চেক করা হচ্ছে…';
          window.AppUpdater.check({ silent: false }).then(function (res) {
            if (res && res.ready) {
              if (sub) sub.textContent = 'v' + res.version + ' রেডি! এখনই ইনস্টল হচ্ছে…';
              toast('নতুন আপডেট v' + res.version + ' ইনস্টল হচ্ছে!');
              setTimeout(function () { window.AppUpdater.apply(); }, 600);
            } else if (res && res.upToDate) {
              if (sub) sub.textContent = 'সবচেয়ে নতুন ভার্সন চলছে';
              toast('আপনার অ্যাপটি একদম আপ-টু-ডেট!');
            } else if (res && res.error) {
              if (sub) sub.textContent = res.error;
              toast(res.error);
            }
          });
        };
        $('#currChips', root).onclick = function (e) {
          var b = e.target.closest('[data-c]'); if (!b) return;
          var nextC = b.dataset.c;
          vib(6);
          $$('#currChips .chip', root).forEach(function (c) { c.classList.toggle('on', c === b); });
          Store.setSettings({ currency: nextC }).then(function () {
            toast('কারেন্সি ' + (nextC === 'BDT' ? 'টাকা (৳)' : 'ডলার ($)') + ' সেট করা হয়েছে');
            renderTab(ui.tab, true);
          });
        };
        $('#setInstall', root).onclick = function () {
          if (deferredInstall) { deferredInstall.prompt(); deferredInstall.userChoice.finally(function () { deferredInstall = null; }); }
          else toast(standalone ? 'অ্যাপ হিসেবেই চলছে' : isIOS ? 'Share বাটন → Add to Home Screen' : 'ব্রাউজারের মেনু থেকে Install চাপুন');
        };
        $('#setBackup', root).onclick = function () {
          var txt = Store.exportJSON();
          downloadFile(txt, 'hisab-khata-backup-' + todayISO() + '.json', 'application/json');
          toast('ব্যাকআপ ফাইল ডাউনলোড হয়েছে');
        };
        var fileInp = $('#restoreInput', root);
        $('#setRestore', root).onclick = function () {
          fileInp.click();
        };
        fileInp.onchange = function (e) {
          var f = e.target.files && e.target.files[0];
          if (!f) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            Store.importJSON(ev.target.result).then(function () {
              closeModal();
              toast('ব্যাকআপ সফলভাবে রিস্টোর করা হয়েছে!');
              renderTab('home', true);
            }).catch(function (err) {
              toast('রিস্টোর ব্যর্থ: ' + (err.message || 'ভুল ফাইল'));
            });
          };
          reader.readAsText(f);
        };
        $('#setCsv', root).onclick = function () {
          var csv = Store.exportCSV();
          downloadFile(csv, 'hisab-khata-' + todayISO() + '.csv', 'text/csv;charset=utf-8');
          toast('CSV ফাইল ডাউনলোড হয়েছে');
        };
        var sShare = $('#setShare', root);
        if (sShare) {
          sShare.onclick = function () {
            var t = totals(monthEntries());
            var text = '📊 ' + T('appTitle') + ' (' + getMonths()[ui.month.m] + ' ' + ui.month.y + ')\n' +
              T('totalIncome') + ': ' + fmt$(t.inc) + '\n' +
              T('totalExpense') + ': ' + fmt$(t.exp) + ' (' + T('adLabel') + ': ' + fmt$(t.ads) + ')\n' +
              T('netLabel') + ': ' + fmt$(t.net) + '\n' +
              (t.ads > 0 ? 'ROAS: ' + (t.inc / t.ads).toFixed(2) + '×\n' : '');
            navigator.share({ title: 'হিসাব খাতা রিপোর্ট', text: text }).catch(function () { /* */ });
          };
        }
        $('#setCopy', root).onclick = function () {
          var txt = Store.exportJSON();
          if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast('ব্যাকআপ কপি হয়েছে'); }, function () { toast('কপি করা যায়নি'); });
          else toast('কপি করা যায়নি');
        };
        var r = $('#setReset', root), armed = false;
        r.onclick = function () {
          if (!armed) { armed = true; vib(15); r.classList.add('armed'); $('b', r).textContent = 'নিশ্চিত? আবার চাপুন'; return; }
          Store.resetAll().then(function () { closeModal(); toast('সব এন্ট্রি মুছে ফেলা হয়েছে'); });
        };
      });
  }

  /* =================================================================
     ইভেন্ট
     ================================================================= */
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-tab]')) && !t.closest('.sheet')) { go(t.dataset.tab); return; }
    if ((t = e.target.closest('[data-add]'))) { openEntry({ type: t.dataset.add }); return; }
    if (e.target.closest('[data-mprev]')) { shiftMonth(-1); return; }
    if (e.target.closest('[data-mnext]')) { shiftMonth(1); return; }
    if ((t = e.target.closest('[data-tx]'))) { if (t.closest('#modal')) closeModal(); setTimeout(function () { openTx(t.dataset.tx); }, t.closest('#modal') ? 200 : 0); return; }
    if ((t = e.target.closest('[data-person]'))) {
      var pid = t.dataset.person;
      var lastSvc = (S.entries.filter(function (x) { return x.client === pid && x.svc; }).sort(function (a, b) { return b.date.localeCompare(a.date); })[0] || {}).svc;
      openEntry({ type: 'income', client: pid, svc: lastSvc || (activeServices()[0] || {}).id });
      return;
    }
    if ((t = e.target.closest('[data-client]'))) { openClient(t.dataset.client); return; }
    if ((t = e.target.closest('[data-svc-add]'))) { openEntry({ type: 'income', svc: t.dataset.svcAdd }); return; }
    if ((t = e.target.closest('[data-svc-ad]'))) { openEntry({ type: 'expense', cat: 'fb', forSvc: t.dataset.svcAd }); return; }
    if ((t = e.target.closest('[data-svc-edit]'))) { openServiceForm(t.dataset.svcEdit); return; }
    if ((t = e.target.closest('[data-svc-toggle]'))) {
      var s = svc(t.dataset.svcToggle);
      if (s.active && activeServices().length === 1) { toast('অন্তত একটা সার্ভিস চালু রাখতে হবে'); return; }
      vib(8); Store.updateService(s.id, { active: !s.active });
      return;
    }
    if ((t = e.target.closest('.trend .hit'))) {
      var p = t.dataset.ym.split('-').map(Number);
      ui.month = { y: p[0], m: p[1] }; vib(5); renderTab('stats');
      return;
    }
  });

  $('#avatarBtn').addEventListener('click', openSettings);
  if ($('#privacyBtn')) $('#privacyBtn').addEventListener('click', togglePrivacy);
  if ($('#goalCard')) $('#goalCard').addEventListener('click', openGoalSettings);
  if ($('#duePill')) $('#duePill').addEventListener('click', function () {
    var b = $('[data-f="due"]');
    if (b) b.click();
    var sheet = $('#s-home .list-sheet');
    if (sheet) sheet.scrollIntoView({ behavior: 'smooth' });
  });

  // Pull-to-Sync on Home (Google Sheets live refresh)
  (function () {
    var home = $('#s-home'), sy = 0, pulling = false;
    if (!home) return;
    home.addEventListener('touchstart', function (e) {
      if (home.scrollTop <= 0 && e.touches.length === 1) {
        sy = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });
    home.addEventListener('touchend', function (e) {
      if (!pulling) return;
      pulling = false;
      var dy = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : sy) - sy;
      if (dy > 90 && home.scrollTop <= 0 && Store.getCloudConfig && Store.getCloudConfig().url) {
        vib(10);
        toast(T('syncing'));
        Store.syncNow().then(function () {
          toast(window.I18n && window.I18n.lang() === 'en' ? 'Synced with Google Sheets!' : 'গুগল শিটের সাথে সিঙ্ক সম্পন্ন!');
        }).catch(function () { /* handled */ });
      }
    }, { passive: true });
  })();
  $('#newServiceBtn').addEventListener('click', function () { openServiceForm(); });
  $('#newClientBtn').addEventListener('click', openClientForm);
  document.addEventListener('click', function (e) { if (e.target.closest('#addPersonTile')) openClientForm(); });
  if ($('#updateApplyBtn')) {
    $('#updateApplyBtn').addEventListener('click', function () {
      vib(10);
      $('#updateApplyBtn').textContent = 'ইনস্টল হচ্ছে…';
      if (window.AppUpdater) window.AppUpdater.apply();
    });
  }
  if (window.AppUpdater) {
    window.AppUpdater.subscribe(function (st) {
      var bar = $('#updateBar');
      if (!bar) return;
      if (st.status === 'ready') {
        $('#updateText').textContent = 'নতুন আপডেট (v' + st.remote + ') রেডি!';
        bar.hidden = false;
      }
    });
  }

  $('#txChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]'); if (!b) return;
    ui.txFilter = b.dataset.f; vib(5);
    $$('#txChips .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
    renderTxList();
  });
  $('#filterBtn').addEventListener('click', function () {
    var order = ['all', 'income', 'expense'];
    var next = order[(order.indexOf(ui.txFilter) + 1) % 3];
    $('[data-f="' + next + '"]').click();
  });
  $('#searchBtn').addEventListener('click', function () {
    var w = $('#searchWrap'), open = !w.classList.contains('open');
    w.classList.toggle('open', open); $('#searchBtn').classList.toggle('on', open);
    if (open) setTimeout(function () { $('#searchInput').focus(); }, 200);
    else { $('#searchInput').value = ''; ui.q = ''; renderTxList(); }
  });
  $('#searchInput').addEventListener('input', function (e) { ui.q = e.target.value; renderTxList(); });

  $('#clientChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cf]'); if (!b) return;
    ui.clientFilter = b.dataset.cf; vib(5);
    $$('#clientChips .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
    renderClientList();
  });
  $('#clientSearchBtn').addEventListener('click', function () {
    var w = $('#clientSearchWrap'), open = !w.classList.contains('open');
    w.classList.toggle('open', open); $('#clientSearchBtn').classList.toggle('on', open);
    if (open) setTimeout(function () { $('#clientSearch').focus(); }, 200);
    else { $('#clientSearch').value = ''; ui.cq = ''; renderClientList(); }
  });
  $('#clientSearch').addEventListener('input', function (e) { ui.cq = e.target.value; renderClientList(); });

  window.addEventListener('resize', updateTabbar);

  /* ---------------- আইকন বসানো ---------------- */
  function paintIcons() {
    $$('[data-mprev]').forEach(function (b) { b.innerHTML = ic('chevL', 16, 2.2); });
    $$('[data-mnext]').forEach(function (b) { b.innerHTML = ic('chevR', 16, 2.2); });
    $('.pill-light i').innerHTML = ic('plus', 15, 2.6);
    $('#filterBtn').innerHTML = ic('filter', 19);
    $('#searchBtn').innerHTML = ic('search', 19);
    $('#clientSearchBtn').innerHTML = ic('search', 19);
    $('#ctxChev').innerHTML = ic('chevD', 14, 2.2);
    $('#delKey').innerHTML = ic('back', 24, 1.8);
    $('#handIc').innerHTML = ic('hand', 22, 1.7);
    var tabIc = { home: 'home', services: 'cards', clients: 'users', stats: 'chart' };
    $$('.tab').forEach(function (b) { b.innerHTML = ic(tabIc[b.dataset.tab], 21, 2.1); });
  }
  function paintAvatar() {
    var btn = $('#avatarBtn');
    if (!btn) return;
    btn.style.background = (S.profile && S.profile.gradient) || AVATAR_GRADIENTS[0];
    btn.innerHTML = renderAvatarInner(S.profile);
  }
  function paintSyncBadge(st) {
    var btn = $('#avatarBtn');
    if (btn) btn.dataset.sync = (st && st.state) || 'disconnected';
  }

  /* ---------------- শুরু ---------------- */
  Store.init().then(function (state) {
    S = state;
    if (window.I18n) window.I18n.applyDOM();
    paintIcons();
    paintAvatar();
    initPrivacy();
    try {
      var savedPin = localStorage.getItem(PIN_KEY);
      if (savedPin && savedPin.length === 4) showPinLock(savedPin);
    } catch (e) { /* */ }
    paintSyncBadge(Store.getSyncStatus());
    Store.onSyncStatus(paintSyncBadge);
    renderTab('home', true);
    requestAnimationFrame(updateTabbar);
    stagger($('#s-home'));
    try {
      var act = new URLSearchParams(location.search).get('action');
      if (act === 'income') setTimeout(function () { openEntry({ type: 'income' }); }, 300);
      else if (act === 'expense') setTimeout(function () { openEntry({ type: 'expense' }); }, 300);
      else if (act === 'stats') setTimeout(function () { go('stats'); }, 150);
    } catch (e) { /* */ }
    Store.subscribe(function (st) {
      S = st;
      if (window.I18n) window.I18n.applyDOM();
      paintAvatar();
      renderTab(ui.tab, ui.tab === 'home');
      if ($('#ctxPanel').classList.contains('open')) renderCtx();
    });
  });

  // অফলাইন ক্যাশ (PWA)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* */ }); });
  }
})();
