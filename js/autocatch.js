/* =====================================================================
   autocatch.js — Live Notification Auto-Catch Engine (Cash In / Cash Out)
   Android NotificationListenerService থেকে bKash, Nagad, Rocket, Upay,
   Bank SMS/App নোটিফিকেশন পড়ে অটোমেটিক ক্যাশ ইন (আয়) ও ক্যাশ আউট (খরচ)
   হিসাব খাতায় ও Google Sheet-এ সেভ করে।
   ===================================================================== */
(function () {
  'use strict';

  var CFG_KEY = 'hisab.ac.cfg';
  var SEEN_KEY = 'hisab.ac.seen';
  var REV_KEY = 'hisab.ac.review';
  var listeners = new Set();
  var onAutoAddedCb = null;

  var cfg = loadJSON(CFG_KEY, { enabled: true, autoPost: true, granted: false });
  var seenIds = loadJSON(SEEN_KEY, []);
  var reviewQueue = loadJSON(REV_KEY, []);

  function loadJSON(k, def) {
    try {
      var raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : def;
    } catch (e) { return def; }
  }
  function saveJSON(k, val) {
    try { localStorage.setItem(k, JSON.stringify(val)); } catch (e) { /* */ }
  }

  function getPlugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AutoCatch;
  }
  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && getPlugin());
  }
  function emit() {
    listeners.forEach(function (fn) { try { fn({ cfg: cfg, review: reviewQueue }); } catch (e) { console.error(e); } });
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function toISODate(ts) {
    var d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function alreadySeen(id) {
    if (!id) return false;
    if (seenIds.indexOf(id) >= 0) return true;
    seenIds.push(id);
    if (seenIds.length > 100) seenIds = seenIds.slice(-100);
    saveJSON(SEEN_KEY, seenIds);
    return false;
  }

  function commitEventToStore(ev) {
    if (!window.Store) return Promise.resolve();
    var st = window.Store.get();
    var activeSvcs = (st && st.services || []).filter(function (s) { return s.active; });
    var defaultSvc = activeSvcs[0] ? activeSvcs[0].id : null;
    var note = [ev.source || 'Auto-Catch', ev.actionLabel || ''].filter(Boolean).join(' · ');

    var entry = {
      type: ev.type === 'expense' ? 'expense' : 'income',
      amount: Number(ev.amount) || 0,
      date: toISODate(ev.timestamp),
      svc: ev.type === 'income' ? defaultSvc : null,
      client: null,
      cat: ev.type === 'expense' ? 'other' : null,
      forSvc: null,
      status: 'paid',
      note: note
    };
    return window.Store.addEntry(entry).then(function (saved) {
      if (onAutoAddedCb) onAutoAddedCb(ev, saved);
      return saved;
    });
  }

  function handleIncomingEvent(ev) {
    if (!ev || !(Number(ev.amount) > 0)) return;
    if (!cfg.enabled) return;
    if (alreadySeen(ev.id)) return;

    if (cfg.autoPost) {
      commitEventToStore(ev);
    } else {
      reviewQueue.unshift(ev);
      if (reviewQueue.length > 20) reviewQueue = reviewQueue.slice(0, 20);
      saveJSON(REV_KEY, reviewQueue);
      emit();
    }
  }

  function drainNativeQueue() {
    if (!isNative()) return Promise.resolve();
    return getPlugin().getPendingEvents().then(function (res) {
      var list = (res && res.events) || [];
      list.forEach(handleIncomingEvent);
    }).catch(function () { /* ignore */ });
  }

  function refreshConfig() {
    if (!isNative()) return Promise.resolve(cfg);
    return getPlugin().getConfig().then(function (res) {
      cfg = Object.assign({}, cfg, res || {});
      saveJSON(CFG_KEY, cfg);
      emit();
      return cfg;
    }).catch(function () { return cfg; });
  }

  // JS fallback parser for live testing in browser or simulator
  function parseInJS(title, text) {
    var bn = '০১২৩৪৫৬৭৮৯';
    var combined = String((title || '') + ' ' + (text || '')).replace(/[০-৯]/g, function (c) { return String(bn.indexOf(c)); });
    var lower = combined.toLowerCase();
    var isInc = /(cash[\s\-]?in|received|add[\s\-]?money|credited|deposited|deposit|refund|ক্যাশ[\s\-]?ইন|অ্যাড[\s\-]?মানি|টাকা\s*এসেছে|পেয়েছেন|পেয়েছেন|জমা)/i.test(combined);
    var isExp = /(cash[\s\-]?out|send[\s\-]?money|sent\s+tk|sent\s+bdt|payment|paid\s+|debited|withdrawn|recharge|ক্যাশ[\s\-]?আউট|সেন্ড[\s\-]?মানি|পেমেন্ট|পাঠানো|কেটে|খরচ)/i.test(combined);
    if (!isInc && !isExp) return null;
    var type = (isInc && !isExp) || (isInc && /received|credited|cash[\s\-]?in|add[\s\-]?money|ক্যাশ[\s\-]?ইন/i.test(lower)) ? 'income' : 'expense';
    var cut = combined.replace(/(new\s+balance|current\s+balance|available\s+balance|balance|bal\b|ব্যালেন্স).*/i, '');
    var m = cut.match(/(?:tk\.?|bdt|৳|\$|taka)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i) ||
            cut.match(/([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:tk\.?|bdt|৳|taka|টাকা)/i) ||
            combined.match(/(?:tk\.?|bdt|৳|\$|taka)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
    var amt = m ? parseFloat(m[1].replace(/,/g, '')) : 0;
    if (!(amt > 0)) return null;
    var src = /bkash|বিকাশ/i.test(lower) ? 'bKash' : /nagad|নগদ/i.test(lower) ? 'Nagad' : /rocket|রকেট/i.test(lower) ? 'Rocket' : /upay|উপায়|উপায়/i.test(lower) ? 'Upay' : /bank|a\/c/i.test(lower) ? 'Bank' : 'Auto-Catch';
    return {
      id: 'ac_sim_' + Date.now() + '_' + Math.round(amt * 100),
      type: type,
      amount: Math.round(amt * 100) / 100,
      source: src,
      actionLabel: type === 'income' ? (/add[\s\-]?money|অ্যাড/i.test(lower) ? 'Add Money' : 'Cash In') : (/cash[\s\-]?out|ক্যাশ/i.test(lower) ? 'Cash Out' : 'Payment'),
      title: title || src,
      rawText: text || '',
      timestamp: Date.now()
    };
  }

  window.AutoCatchEngine = {
    isNative: isNative,
    getConfig: function () { return Object.assign({}, cfg); },
    getReviewQueue: function () { return reviewQueue.slice(); },
    subscribe: function (fn) { listeners.add(fn); return function () { listeners.delete(fn); }; },
    refresh: function () { return refreshConfig().then(drainNativeQueue); },
    setConfig: function (patch) {
      cfg = Object.assign({}, cfg, patch || {});
      saveJSON(CFG_KEY, cfg);
      emit();
      if (isNative()) {
        return getPlugin().setConfig({ enabled: !!cfg.enabled, autoPost: !!cfg.autoPost }).then(function (res) {
          cfg = Object.assign({}, cfg, res || {});
          saveJSON(CFG_KEY, cfg);
          emit();
          return cfg;
        });
      }
      return Promise.resolve(cfg);
    },
    openPermissionSettings: function () {
      if (isNative()) return getPlugin().openPermissionSettings();
      return Promise.resolve();
    },
    approveReview: function (id) {
      var idx = reviewQueue.findIndex(function (x) { return x.id === id; });
      if (idx < 0) return Promise.resolve();
      var ev = reviewQueue.splice(idx, 1)[0];
      saveJSON(REV_KEY, reviewQueue);
      emit();
      return commitEventToStore(ev);
    },
    dismissReview: function (id) {
      reviewQueue = reviewQueue.filter(function (x) { return x.id !== id; });
      saveJSON(REV_KEY, reviewQueue);
      emit();
      return Promise.resolve();
    },
    simulateTest: function (title, text) {
      if (isNative()) {
        return getPlugin().simulateTest({ title: title, text: text }).then(function (ev) {
          handleIncomingEvent(ev);
          return ev;
        });
      }
      var parsed = parseInJS(title, text);
      if (!parsed) return Promise.reject(new Error('নোটিফিকেশন থেকে টাকার পরিমাণ পাওয়া যায়নি'));
      handleIncomingEvent(parsed);
      return Promise.resolve(parsed);
    },
    init: function (onAutoAdded) {
      onAutoAddedCb = onAutoAdded || null;
      if (isNative()) {
        try {
          getPlugin().addListener('paymentDetected', function (ev) {
            handleIncomingEvent(ev);
          });
        } catch (e) { /* ignore */ }
        refreshConfig().then(drainNativeQueue);
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') {
            refreshConfig().then(drainNativeQueue);
          }
        });
      }
    }
  };
})();
