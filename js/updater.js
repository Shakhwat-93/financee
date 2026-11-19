/* =====================================================================
   updater.js — Over-The-Air (OTA) In-App Auto-Updater
   গিটহাবে নতুন কোড পুশ করলেই APK রি-ইনস্টল ছাড়াই অ্যাপের ভেতর থেকে
   ১ ক্লিকে আপডেট ডাউনলোড ও অ্যাপ্লাই করে।
   ===================================================================== */
(function () {
  'use strict';

  var REPO = 'Shakhwat-93/financee';
  var RELEASE_API = 'https://api.github.com/repos/' + REPO + '/releases/tags/ota-latest';
  var listeners = new Set();
  var readyBundle = null;
  var state = {
    status: 'idle', // idle | checking | downloading | ready | latest | error
    current: window.APP_VERSION || '1.0.0',
    remote: null,
    notes: '',
    error: ''
  };

  function getPlugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorUpdater;
  }

  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && getPlugin());
  }

  function emit(patch) {
    Object.assign(state, patch || {});
    listeners.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } });
  }

  // অ্যাপ বুট হলেই Capgo-কে জানাতে হবে যে বান্ডেল ঠিকভাবে চলেছে (যাতে রোলব্যাক না হয়)
  if (isNative()) {
    try { getPlugin().notifyAppReady(); } catch (e) { /* ignore */ }
  }

  function compareVer(a, b) {
    var pa = String(a || '0').replace(/^v/i, '').split('.').map(Number);
    var pb = String(b || '0').replace(/^v/i, '').split('.').map(Number);
    for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
      var na = pa[i] || 0, nb = pb[i] || 0;
      if (na !== nb) return na > nb ? 1 : -1;
    }
    return 0;
  }

  function checkForUpdate(opts) {
    var silent = opts && opts.silent;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (!silent) emit({ status: 'error', error: 'ইন্টারনেট কানেকশন নেই' });
      return Promise.resolve({ offline: true });
    }
    emit({ status: 'checking', error: '' });

    return fetch(RELEASE_API + '?t=' + Date.now(), {
      headers: { 'Accept': 'application/vnd.github+json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('আপডেট সার্ভার পাওয়া যায়নি (' + res.status + ')');
        return res.json();
      })
      .then(function (rel) {
        var remoteVer = String(rel.name || '').replace(/^v/i, '').trim();
        var asset = (rel.assets || []).find(function (a) { return a.name === 'www.zip'; });
        if (!remoteVer || !asset || !asset.browser_download_url) {
          emit({ status: 'latest', remote: state.current });
          return { upToDate: true };
        }
        var currentVer = window.APP_VERSION || '1.0.0';
        var isNewer = currentVer === 'dev' ? false : (compareVer(remoteVer, currentVer) > 0);
        if (!isNewer) {
          emit({ status: 'latest', current: currentVer, remote: remoteVer });
          return { upToDate: true, version: currentVer };
        }

        emit({ status: 'downloading', remote: remoteVer, notes: rel.body || '' });

        if (!isNative()) {
          // ওয়েব/PWA মোডে থাকলে সার্ভিস ওয়ার্কার রিলোড যথেষ্ট
          emit({ status: 'ready', remote: remoteVer, notes: rel.body || '' });
          return { ready: true, web: true, version: remoteVer };
        }

        // নেটিভ Android APK মোডে: ব্যাকগ্রাউন্ডে www.zip ডাউনলোড
        return getPlugin().download({
          url: asset.browser_download_url,
          version: remoteVer
        }).then(function (bundle) {
          readyBundle = bundle;
          emit({ status: 'ready', remote: remoteVer, notes: rel.body || '' });
          return { ready: true, bundle: bundle, version: remoteVer };
        });
      })
      .catch(function (err) {
        var msg = (err && err.message) || 'আপডেট চেক করা যায়নি';
        if (!silent) emit({ status: 'error', error: msg });
        else emit({ status: 'idle' });
        return { error: msg };
      });
  }

  function applyUpdate() {
    if (isNative() && readyBundle && readyBundle.id) {
      return getPlugin().set({ id: readyBundle.id });
    }
    // PWA / Web fallback
    if ('caches' in window) {
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }).finally(function () { location.reload(); });
      return Promise.resolve();
    }
    location.reload();
    return Promise.resolve();
  }

  window.AppUpdater = {
    getState: function () { return state; },
    isNative: isNative,
    subscribe: function (fn) { listeners.add(fn); return function () { listeners.delete(fn); }; },
    check: checkForUpdate,
    apply: applyUpdate
  };

  // অ্যাপ খোলার ২.৫ সেকেন্ড পর ব্যাকগ্রাউন্ডে সাইলেন্ট আপডেট চেক
  if (typeof window !== 'undefined') {
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (isNative()) checkForUpdate({ silent: true });
      }, 2500);
    });
  }
})();
