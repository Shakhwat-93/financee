/* =====================================================================
   i18n.js — Bilingual Engine (বাংলা & English)
   1-tap instant switching with zero page reload.
   ===================================================================== */
(function () {
  'use strict';

  var MONTHS = {
    bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };
  var MONTHS_SHORT = {
    bn: ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };

  var DICT = {
    bn: {
      appTitle: 'হিসাব খাতা',
      home: 'হোম',
      services: 'সার্ভিস',
      clients: 'ক্লায়েন্ট',
      stats: 'রিপোর্ট',
      settings: 'সেটিংস',
      income: 'আয়',
      expense: 'খরচ',
      all: 'সব',
      thisMonth: 'এই মাসে',
      transactions: 'লেনদেন',
      searchPlaceholder: 'ক্লায়েন্ট, সার্ভিস বা নোট খুঁজুন',
      clientSearchPlaceholder: 'ক্লায়েন্টের নাম খুঁজুন',
      newService: 'নতুন সার্ভিস',
      addClient: 'যোগ করুন',
      serviceFootNote: 'কার্ডে দেখানো অ্যাড খরচ হলো যেসব খরচ আপনি ঐ সার্ভিসের নামে ট্যাগ করেছেন। সুইচ বন্ধ করলে সার্ভিসটা এন্ট্রির তালিকায় আর আসবে না।',
      trend6m: '৬ মাসের ট্রেন্ড',
      byService: 'সার্ভিস অনুযায়ী',
      byServiceSub: 'আয় · অ্যাড খরচ · নেট',
      whereSpent: 'খরচ কোথায় গেল',
      swipeToSave: 'ডানে সোয়াইপ করে সেভ করুন',
      ok: 'ঠিক আছে',
      tapToClose: 'যেকোনো জায়গায় চাপ দিয়ে বন্ধ করুন',
      today: 'আজ',
      yesterday: 'গতকাল',
      thisMonthNetProfit: 'এই মাসের নেট লাভ',
      thisMonthNetLoss: 'এই মাসের নেট লস',
      monthNetProfit: '{m} মাসের নেট লাভ',
      monthNetLoss: '{m} মাসের নেট লস',
      inLoss: 'লসে আছেন',
      spendAds: 'খরচ · অ্যাডে {v}',
      thisMonthSpend: 'এই মাসের খরচ',
      noTxTitle: 'কোনো লেনদেন নেই',
      noTxSub: 'উপরের "আয়" বা "খরচ" চাপুন।',
      noMatch: 'কিছুই মেলেনি',
      paymentsCount: '{n}টি পেমেন্ট',
      adLabel: 'অ্যাড',
      netLabel: 'নেট',
      newLabel: 'নতুন',
      noClientsTitle: 'কোনো ক্লায়েন্ট নেই',
      noClientsSub: 'উপরে "যোগ করুন" চেপে প্রথম ক্লায়েন্ট যোগ করুন।',
      noClientMatch: 'কোনো ক্লায়েন্ট খুঁজে পাওয়া যায়নি',
      verdictProfit: 'এই মাসে লাভ হয়েছে',
      verdictLoss: 'এই মাসে লস হয়েছে',
      verdictProfitSub: 'আয়ের {p}% আপনার হাতে থাকছে।',
      verdictLossSub: 'খরচ আয়ের চেয়ে {v} বেশি। অ্যাড খরচ একবার দেখে নিন।',
      noMonthEntry: 'এই মাসে কোনো এন্ট্রি নেই',
      noMonthEntrySub: 'হোম থেকে আয় বা খরচ যোগ করলে এখানে হিসাব দেখাবে।',
      totalIncome: 'মোট আয়',
      totalExpense: 'মোট খরচ',
      inAds: 'অ্যাডে {v}',
      adReturn: 'অ্যাড রিটার্ন (ROAS)',
      roasSub: 'বিজ্ঞাপনে {c}1 খরচে {v} আয়',
      noAdSpend: 'অ্যাড খরচ নেই',
      avgPayment: 'গড় পেমেন্ট',
      perPayment: 'প্রতি পেমেন্টে',
      noSvcIncome: 'এই মাসে কোনো সার্ভিসে আয় নেই',
      noExpense: 'এই মাসে কোনো খরচ নেই',
      editing: 'এডিট করছেন · ',
      thisMonthNet: 'এই মাসের নেট',
      pickService: 'সার্ভিস বাছুন',
      addClientOpt: 'ক্লায়েন্ট যোগ করুন',
      generalExpense: 'সাধারণ খরচ',
      forService: '{s}-এর জন্য',
      date: 'তারিখ',
      noteOptional: 'নোট (ঐচ্ছিক)',
      noteIncPh: 'যেমন: ২টা রিল, অ্যাডভান্স ৫০%',
      noteExpPh: 'যেমন: ৩ দিনের ক্যাম্পেইন',
      whatPayment: 'কিসের পেমেন্ট?',
      workType: 'কাজের ধরন',
      client: 'ক্লায়েন্ট',
      none: 'কেউ না',
      newClientName: 'নতুন ক্লায়েন্টের নাম',
      add: 'যোগ',
      whatExpense: 'কিসের খরচ?',
      expenseType: 'খরচের ধরন',
      forWhichSvc: 'কোন সার্ভিসের জন্য? (ঐচ্ছিক)',
      type: 'ধরন',
      work: 'কাজ',
      note: 'নোট',
      delete: 'মুছুন',
      edit: 'এডিট',
      confirmAgain: 'নিশ্চিত? আবার চাপুন',
      deleted: 'মুছে ফেলা হয়েছে',
      saved: 'সেভ হয়েছে',
      saveFailed: 'সেভ হয়নি, আবার চেষ্টা করুন',
      badMath: 'এই হিসাবটা মেলানো যাচ্ছে না',
      pickSvcToast: 'কোন কাজের পেমেন্ট, সেটা বেছে নিন',
      keepOneSvc: 'অন্তত একটা সার্ভিস চালু রাখতে হবে',
      yourName: 'আপনার নাম',
      enterName: 'নাম লিখুন',
      language: 'ভাষা / Language',
      currency: 'কারেন্সি নির্বাচন',
      googleSheetDb: 'গুগল শিট ডাটাবেস',
      connectedSync: 'কানেক্টেড · শেষ সিঙ্ক {t}',
      setupCloudSub: 'ফ্রি ক্লাউড ডাটাবেস ও অটো-সিঙ্ক চালু করুন',
      appUpdate: 'অ্যাপ আপডেট (v{v})',
      checkInstallUpdate: 'নতুন আপডেট চেক ও ইনস্টল করুন',
      checkingUpdate: 'আপডেট চেক করা হচ্ছে…',
      upToDate: 'সবচেয়ে নতুন ভার্সন চলছে',
      upToDateToast: 'আপনার অ্যাপটি একদম আপ-টু-ডেট!',
      updateReady: 'নতুন আপডেট (v{v}) রেডি!',
      updateNow: 'আপডেট করুন',
      installing: 'ইনস্টল হচ্ছে…',
      installApp: 'অ্যাপ ইন্সটল করুন',
      backupDownload: 'ব্যাকআপ ডাউনলোড করুন',
      backupDownloadSub: 'সম্পূর্ণ ডেটা JSON ফাইল হিসেবে ফোনে সেভ হবে',
      backupRestore: 'ব্যাকআপ রিস্টোর করুন',
      backupRestoreSub: 'আগের সংরক্ষিত JSON ফাইল থেকে ডেটা আনুন',
      csvDownload: 'Excel / CSV ডাউনলোড',
      csvDownloadSub: 'সব লেনদেনের স্প্রেডশীট ফাইল',
      shareReport: 'মাসিক রিপোর্ট শেয়ার',
      shareReportSub: 'হোয়াটসঅ্যাপ বা মেসেঞ্জারে পাঠান',
      copyClipboard: 'ক্লিপবোর্ডে কপি করুন',
      copyClipboardSub: 'সব ডেটা JSON কোড হিসেবে কপি হবে',
      resetAll: 'সব এন্ট্রি মুছে ফেলুন',
      resetAllSub: 'সার্ভিসগুলো থাকবে, বাকি সব মুছবে',
      never: 'কখনো না',
      notConnected: 'কানেক্ট করা নেই',
      syncing: 'সিঙ্ক হচ্ছে…',
      offlinePending: 'অফলাইন (পেন্ডিং)',
      syncNow: 'এখনই সিঙ্ক',
      disconnect: 'ডিসকানেক্ট',
      connectSync: 'কানেক্ট ও সিঙ্ক করুন',
      updateSync: 'আপডেট ও সিঙ্ক করুন',
      langChanged: 'ভাষা বাংলা সেট করা হয়েছে'
    },
    en: {
      appTitle: 'Hisab Khata',
      home: 'Home',
      services: 'Services',
      clients: 'Clients',
      stats: 'Reports',
      settings: 'Settings',
      income: 'Income',
      expense: 'Expense',
      all: 'All',
      thisMonth: 'This Month',
      transactions: 'Transactions',
      searchPlaceholder: 'Search client, service or note',
      clientSearchPlaceholder: 'Search client name',
      newService: 'New Service',
      addClient: 'Add Client',
      serviceFootNote: 'Ad spend shown on each card reflects expenses tagged to that service. Turning off the switch hides it from new entries.',
      trend6m: '6-Month Trend',
      byService: 'By Service',
      byServiceSub: 'Income · Ad Spend · Net',
      whereSpent: 'Expense Breakdown',
      swipeToSave: 'Swipe right to save',
      ok: 'Done',
      tapToClose: 'Tap anywhere to close',
      today: 'Today',
      yesterday: 'Yesterday',
      thisMonthNetProfit: 'This Month Net Profit',
      thisMonthNetLoss: 'This Month Net Loss',
      monthNetProfit: '{m} Net Profit',
      monthNetLoss: '{m} Net Loss',
      inLoss: 'In Loss',
      spendAds: 'Spend · Ads {v}',
      thisMonthSpend: 'This Month Spend',
      noTxTitle: 'No transactions yet',
      noTxSub: 'Tap "Income" or "Expense" above to add one.',
      noMatch: 'No matching results',
      paymentsCount: '{n} payments',
      adLabel: 'Ads',
      netLabel: 'Net',
      newLabel: 'New',
      noClientsTitle: 'No clients yet',
      noClientsSub: 'Tap "Add Client" above to add your first client.',
      noClientMatch: 'No matching clients found',
      verdictProfit: 'Profitable This Month',
      verdictLoss: 'Loss This Month',
      verdictProfitSub: 'You are keeping {p}% of your revenue as net profit.',
      verdictLossSub: 'Expenses exceed income by {v}. Review your ad spend.',
      noMonthEntry: 'No entries this month',
      noMonthEntrySub: 'Add income or expenses from Home to view analytics.',
      totalIncome: 'Total Income',
      totalExpense: 'Total Expense',
      inAds: 'In ads {v}',
      adReturn: 'Ad Return (ROAS)',
      roasSub: '{c}1 ad spend returns {v}',
      noAdSpend: 'No ad spend',
      avgPayment: 'Avg Payment',
      perPayment: 'Per payment',
      noSvcIncome: 'No service revenue this month',
      noExpense: 'No expenses this month',
      editing: 'Editing · ',
      thisMonthNet: 'Month Net',
      pickService: 'Select Service',
      addClientOpt: 'Add Client',
      generalExpense: 'General Expense',
      forService: 'For {s}',
      date: 'Date',
      noteOptional: 'Note (Optional)',
      noteIncPh: 'e.g. 2 reels, 50% advance',
      noteExpPh: 'e.g. 3-day campaign',
      whatPayment: 'Payment Details',
      workType: 'Service',
      client: 'Client',
      none: 'None',
      newClientName: 'New client name',
      add: 'Add',
      whatExpense: 'Expense Details',
      expenseType: 'Category',
      forWhichSvc: 'For which service? (Optional)',
      type: 'Type',
      work: 'Service',
      note: 'Note',
      delete: 'Delete',
      edit: 'Edit',
      confirmAgain: 'Confirm? Tap again',
      deleted: 'Entry deleted',
      saved: 'Saved',
      saveFailed: 'Failed to save, try again',
      badMath: 'Invalid calculation',
      pickSvcToast: 'Please select a service first',
      keepOneSvc: 'At least one active service is required',
      yourName: 'Your Name',
      enterName: 'Enter your name',
      language: 'Language / ভাষা',
      currency: 'Currency',
      googleSheetDb: 'Google Sheets Database',
      connectedSync: 'Connected · Last sync {t}',
      setupCloudSub: 'Enable free cloud database & auto-sync',
      appUpdate: 'App Update (v{v})',
      checkInstallUpdate: 'Check & install live OTA updates',
      checkingUpdate: 'Checking for updates…',
      upToDate: 'Running latest version',
      upToDateToast: 'Your app is up to date!',
      updateReady: 'New update (v{v}) ready!',
      updateNow: 'Update Now',
      installing: 'Installing…',
      installApp: 'Install App',
      backupDownload: 'Download Backup',
      backupDownloadSub: 'Save complete data as a JSON file',
      backupRestore: 'Restore Backup',
      backupRestoreSub: 'Import from a previously saved JSON file',
      csvDownload: 'Export Excel / CSV',
      csvDownloadSub: 'Download spreadsheet of all transactions',
      shareReport: 'Share Monthly Report',
      shareReportSub: 'Send via WhatsApp or Messenger',
      copyClipboard: 'Copy JSON Backup',
      copyClipboardSub: 'Copy full backup JSON to clipboard',
      resetAll: 'Clear All Entries',
      resetAllSub: 'Keeps services, deletes all entries & clients',
      never: 'Never',
      notConnected: 'Not connected',
      syncing: 'Syncing…',
      offlinePending: 'Offline (Pending)',
      syncNow: 'Sync Now',
      disconnect: 'Disconnect',
      connectSync: 'Connect & Sync',
      updateSync: 'Update & Sync',
      langChanged: 'Language switched to English'
    }
  };

  function getLang() {
    try {
      var st = window.Store && window.Store.get && window.Store.get();
      return (st && st.settings && st.settings.lang === 'en') ? 'en' : 'bn';
    } catch (e) {
      return 'bn';
    }
  }

  function t(key, vars) {
    var l = getLang();
    var str = (DICT[l] && DICT[l][key]) || (DICT.bn && DICT.bn[key]) || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return str;
  }

  function applyDOM() {
    var l = getLang();
    document.documentElement.lang = l;
    document.title = t('appTitle');
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    }
    var phs = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < phs.length; j++) {
      var p = phs[j];
      var pk = p.getAttribute('data-i18n-ph');
      if (pk) p.placeholder = t(pk);
    }
  }

  window.I18n = {
    lang: getLang,
    t: t,
    months: function () { return MONTHS[getLang()]; },
    monthsShort: function () { return MONTHS_SHORT[getLang()]; },
    applyDOM: applyDOM
  };
})();
