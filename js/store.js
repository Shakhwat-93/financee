/* =====================================================================
   store.js — অ্যাপের ডেটা লেয়ার
   ---------------------------------------------------------------------
   এখন সব ডেটা ব্রাউজারের localStorage-এ থাকে।
   ডাটাবেস (Supabase / Firebase / নিজের API) কানেক্ট করতে চাইলে
   শুধু এই ফাইলের ফাংশনগুলোর ভেতরটা বদলালেই হবে। app.js শুধু
   window.Store-এর এই ফাংশনগুলো ব্যবহার করে:

     Store.init()                 -> Promise<state>
     Store.get()                  -> state (সিঙ্ক)
     Store.subscribe(fn)          -> unsubscribe()
     Store.addEntry(data)         -> Promise<entry>
     Store.updateEntry(id, data)  -> Promise<entry>
     Store.deleteEntry(id)        -> Promise<void>
     Store.addService(data)       -> Promise<service>
     Store.updateService(id, d)   -> Promise<service>
     Store.addClient(data)        -> Promise<client>
     Store.setProfile(data)       -> Promise<void>
     Store.clearDemo()            -> Promise<void>
     Store.resetAll()             -> Promise<void>
     Store.exportJSON()           -> string

   ডেটার গঠন (টেবিল বানানোর সময় এটাই ফলো করবেন):

   entries  { id, type: 'income'|'expense', amount (USD, number),
              date 'YYYY-MM-DD',
              svc       (income: কোন সার্ভিসের পেমেন্ট — services.id),
              client    (income: clients.id, ঐচ্ছিক),
              cat       (expense: expenseCats.id),
              forSvc    (expense: কোন সার্ভিসের জন্য খরচ — services.id, ঐচ্ছিক),
              note, createdAt (ms), demo (bool) }
   services { id, name, color, active }
   clients  { id, name, color, demo }
   expenseCats { id, name, color, isAd }
   profile  { name }
   ===================================================================== */
(function () {
  'use strict';

  var KEY = 'hisab.v1';
  var listeners = new Set();
  var state = null;

  var uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };

  var EXPENSE_CATS = [
    { id: 'fb', name: 'Facebook Ads', color: '#4C8DFF', isAd: true },
    { id: 'google', name: 'Google Ads', color: '#FFC83D', isAd: true },
    { id: 'tiktok', name: 'TikTok Ads', color: '#FF5FA2', isAd: true },
    { id: 'tools', name: 'টুলস / সফটওয়্যার', color: '#9B8CFF', isAd: false },
    { id: 'other', name: 'অন্যান্য খরচ', color: '#5B6262', isAd: false }
  ];

  var SERVICE_COLORS = ['#FFE14A', '#2BE8B5', '#2AA8FF', '#FF8A4C', '#FF7EB6', '#9B8CFF'];
  var CLIENT_COLORS = ['#FFB86B', '#7FD4FF', '#B6A6FF', '#7CF0C0', '#FF9DB5', '#FFE07A', '#9EE37D'];

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* private mode etc. */ }
    return null;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function emit() { listeners.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } }); }
  function commit() { save(); emit(); }

  /* ---------- প্রথমবার খুললে দেখানোর জন্য ডেমো ডেটা ---------- */
  function seed() {
    var services = [
      { id: 's_video', name: 'ভিডিও এডিটিং', color: SERVICE_COLORS[0], active: true },
      { id: 's_web', name: 'ওয়েবসাইট তৈরি', color: SERVICE_COLORS[1], active: true },
      { id: 's_design', name: 'গ্রাফিক ডিজাইন', color: SERVICE_COLORS[2], active: true }
    ];
    var names = ['রহিম ট্রেডার্স', 'নুসরাত ফ্যাশন', 'করিম ভাই', 'Studio Nine', 'তানিয়া', 'আরিফ হোসেন', 'Green Leaf'];
    var clients = names.map(function (n, i) {
      return { id: 'c_demo_' + i, name: n, color: CLIENT_COLORS[i % CLIENT_COLORS.length], demo: true };
    });

    // ছোট একটা ডিটারমিনিস্টিক র‍্যান্ডম, যাতে প্রতিবার একই ডেমো আসে
    var r = 7;
    var rnd = function () { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    var pick = function (arr) { return arr[Math.floor(rnd() * arr.length)]; };

    var entries = [];
    var today = new Date();
    for (var back = 3; back >= 0; back--) {
      var y = today.getFullYear(), m = today.getMonth() - back;
      while (m < 0) { m += 12; y--; }
      var days = new Date(y, m + 1, 0).getDate();
      var lastDay = back === 0 ? today.getDate() : days;
      var add = function (e) {
        var d = Math.max(1, Math.min(lastDay, e.day));
        entries.push({
          id: uid() + entries.length, type: e.type, amount: e.amount,
          date: y + '-' + pad(m + 1) + '-' + pad(d),
          svc: e.svc || null, client: e.client || null, cat: e.cat || null, forSvc: e.forSvc || null,
          note: e.note || '', createdAt: Date.now() - back * 1e9 + d * 1e6, demo: true
        });
      };
      var nInc = back === 0 ? 4 : 6 + Math.floor(rnd() * 3);
      for (var i = 0; i < nInc; i++) {
        var s = pick(services);
        var base = s.id === 's_web' ? 120 + Math.round(rnd() * 280) : s.id === 's_video' ? 25 + Math.round(rnd() * 90) : 20 + Math.round(rnd() * 60);
        add({ type: 'income', amount: base, svc: s.id, client: pick(clients).id, day: 1 + Math.floor(rnd() * lastDay), note: rnd() > 0.7 ? 'অ্যাডভান্স' : '' });
      }
      var nAds = back === 0 ? 3 : 5;
      for (var j = 0; j < nAds; j++) {
        add({ type: 'expense', amount: 10 + Math.round(rnd() * 25), cat: rnd() > 0.25 ? 'fb' : 'google', forSvc: pick(services).id, day: 1 + Math.floor(rnd() * lastDay) });
      }
      add({ type: 'expense', amount: 12, cat: 'tools', day: 3, note: 'সাবস্ক্রিপশন' });
    }

    return {
      version: 1,
      demo: true,
      profile: { name: '' },
      settings: { currency: 'BDT' },
      services: services,
      clients: clients,
      expenseCats: EXPENSE_CATS,
      entries: entries
    };
  }

  function pickEntryFields(d) {
    var income = d.type === 'income';
    return {
      type: income ? 'income' : 'expense',
      amount: Math.round(Number(d.amount) * 100) / 100,
      date: String(d.date || iso(new Date())),
      svc: income ? (d.svc || null) : null,
      client: income ? (d.client || null) : null,
      cat: income ? null : (d.cat || 'other'),
      forSvc: income ? null : (d.forSvc || null),
      note: String(d.note || '')
    };
  }

  window.Store = {
    SERVICE_COLORS: SERVICE_COLORS,
    CLIENT_COLORS: CLIENT_COLORS,

    init: function () {
      state = load();
      if (!state || !state.entries) { state = seed(); save(); }
      if (!state.expenseCats) state.expenseCats = EXPENSE_CATS;
      if (!state.profile) state.profile = { name: '' };
      if (!state.settings) state.settings = { currency: 'BDT' };
      return Promise.resolve(state);
    },

    get: function () { return state; },

    subscribe: function (fn) { listeners.add(fn); return function () { listeners.delete(fn); }; },

    addEntry: function (data) {
      var e = pickEntryFields(data);
      e.id = uid(); e.createdAt = Date.now(); e.demo = false;
      state.entries.push(e);
      commit();
      return Promise.resolve(e);
    },

    updateEntry: function (id, data) {
      var e = state.entries.find(function (x) { return x.id === id; });
      if (!e) return Promise.reject(new Error('not found'));
      Object.assign(e, pickEntryFields(data));
      commit();
      return Promise.resolve(e);
    },

    deleteEntry: function (id) {
      state.entries = state.entries.filter(function (x) { return x.id !== id; });
      commit();
      return Promise.resolve();
    },

    addService: function (data) {
      var s = { id: 's_' + uid(), name: String(data.name).trim(), color: data.color || SERVICE_COLORS[state.services.length % SERVICE_COLORS.length], active: true };
      state.services.push(s);
      commit();
      return Promise.resolve(s);
    },

    updateService: function (id, patch) {
      var s = state.services.find(function (x) { return x.id === id; });
      if (!s) return Promise.reject(new Error('not found'));
      Object.assign(s, patch);
      commit();
      return Promise.resolve(s);
    },

    addClient: function (data) {
      var c = { id: 'c_' + uid(), name: String(data.name).trim(), color: CLIENT_COLORS[state.clients.length % CLIENT_COLORS.length], demo: false };
      state.clients.push(c);
      commit();
      return Promise.resolve(c);
    },

    setProfile: function (patch) {
      Object.assign(state.profile, patch);
      commit();
      return Promise.resolve();
    },

    setSettings: function (patch) {
      if (!state.settings) state.settings = { currency: 'BDT' };
      Object.assign(state.settings, patch);
      commit();
      return Promise.resolve(state.settings);
    },

    clearDemo: function () {
      state.entries = state.entries.filter(function (e) { return !e.demo; });
      var used = new Set(state.entries.map(function (e) { return e.client; }));
      state.clients = state.clients.filter(function (c) { return !c.demo || used.has(c.id); });
      state.demo = false;
      commit();
      return Promise.resolve();
    },

    resetAll: function () {
      state = {
        version: 1, demo: false, profile: { name: state.profile.name || '' },
        settings: { currency: (state.settings && state.settings.currency) || 'BDT' },
        services: state.services.map(function (s) { return Object.assign({}, s); }),
        clients: [], expenseCats: EXPENSE_CATS, entries: []
      };
      commit();
      return Promise.resolve();
    },

    exportJSON: function () { return JSON.stringify(state, null, 2); },

    importJSON: function (jsonStr) {
      try {
        var parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
        if (!parsed || !Array.isArray(parsed.entries) || !Array.isArray(parsed.services)) {
          return Promise.reject(new Error('ভুল ফরম্যাট! সঠিক হিসাব খাতার ব্যাকআপ ফাইল দিন।'));
        }
        state = {
          version: parsed.version || 1,
          demo: !!parsed.demo,
          profile: parsed.profile || { name: '' },
          settings: parsed.settings || { currency: 'BDT' },
          services: parsed.services || [],
          clients: parsed.clients || [],
          expenseCats: parsed.expenseCats || EXPENSE_CATS,
          entries: parsed.entries || []
        };
        commit();
        return Promise.resolve(state);
      } catch (err) {
        return Promise.reject(err);
      }
    },

    exportCSV: function () {
      var header = ['তারিখ', 'ধরন', 'পরিমাণ', 'সার্ভিস/ক্যাটাগরি', 'ক্লায়েন্ট', 'নোট'];
      var rows = state.entries.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).map(function (e) {
        var typeStr = e.type === 'income' ? 'আয়' : 'খরচ';
        var catStr = '';
        if (e.type === 'income') {
          var s = state.services.find(function (x) { return x.id === e.svc; });
          catStr = s ? s.name : '—';
        } else {
          var k = state.expenseCats.find(function (x) { return x.id === e.cat; });
          catStr = k ? k.name : 'অন্যান্য';
        }
        var cli = e.client ? (state.clients.find(function (x) { return x.id === e.client; }) || {}).name || '' : '';
        var clean = function (str) { return '"' + String(str || '').replace(/"/g, '""') + '"'; };
        return [e.date, typeStr, e.amount, clean(catStr), clean(cli), clean(e.note)].join(',');
      });
      return '\uFEFF' + [header.join(',')].concat(rows).join('\r\n');
    }
  };
})();
