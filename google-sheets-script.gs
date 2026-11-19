var SECRET_PIN = 'hisab123';

var HEADERS = {
  Entries: ['id', 'type', 'amount', 'date', 'svc', 'client', 'cat', 'forSvc', 'note', 'createdAt', 'demo'],
  Services: ['id', 'name', 'color', 'active'],
  Clients: ['id', 'name', 'color', 'demo'],
  Config: ['key', 'value']
};

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkAuth(secret) {
  if (!SECRET_PIN) return true;
  return String(secret || '') === String(SECRET_PIN);
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var h = HEADERS[name];
    sheet.getRange(1, 1, 1, h.length).setValues([h])
      .setFontWeight('bold')
      .setBackground('#0A0C0C')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function formatDateCell(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(val).trim();
}

function toBool(val, def) {
  if (val === '' || val === null || val === undefined) return !!def;
  if (typeof val === 'boolean') return val;
  var s = String(val).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes';
}

function readAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shEntries = getOrCreateSheet(ss, 'Entries');
  var shServices = getOrCreateSheet(ss, 'Services');
  var shClients = getOrCreateSheet(ss, 'Clients');
  var shConfig = getOrCreateSheet(ss, 'Config');

  // Entries
  var entries = [];
  var eRows = shEntries.getDataRange().getValues();
  for (var i = 1; i < eRows.length; i++) {
    var r = eRows[i];
    if (!r[0]) continue;
    entries.push({
      id: String(r[0]),
      type: String(r[1]) === 'expense' ? 'expense' : 'income',
      amount: Number(r[2]) || 0,
      date: formatDateCell(r[3]),
      svc: r[4] ? String(r[4]) : null,
      client: r[5] ? String(r[5]) : null,
      cat: r[6] ? String(r[6]) : null,
      forSvc: r[7] ? String(r[7]) : null,
      note: r[8] ? String(r[8]) : '',
      createdAt: Number(r[9]) || Date.now(),
      demo: toBool(r[10], false)
    });
  }

  // Services
  var services = [];
  var sRows = shServices.getDataRange().getValues();
  for (var j = 1; j < sRows.length; j++) {
    var sr = sRows[j];
    if (!sr[0]) continue;
    services.push({
      id: String(sr[0]),
      name: String(sr[1] || ''),
      color: String(sr[2] || '#FFE14A'),
      active: toBool(sr[3], true)
    });
  }

  // Clients
  var clients = [];
  var cRows = shClients.getDataRange().getValues();
  for (var k = 1; k < cRows.length; k++) {
    var cr = cRows[k];
    if (!cr[0]) continue;
    clients.push({
      id: String(cr[0]),
      name: String(cr[1] || ''),
      color: String(cr[2] || '#FFB86B'),
      demo: toBool(cr[3], false)
    });
  }

  // Config
  var cfg = {};
  var cfgRows = shConfig.getDataRange().getValues();
  for (var m = 1; m < cfgRows.length; m++) {
    if (cfgRows[m][0]) cfg[String(cfgRows[m][0])] = cfgRows[m][1];
  }

  var isEmpty = entries.length === 0 && services.length === 0 && clients.length === 0 && !cfg.updatedAt;

  return {
    empty: isEmpty,
    version: 1,
    demo: toBool(cfg.demo, false),
    profile: { name: cfg.profileName ? String(cfg.profileName) : '' },
    settings: { currency: cfg.currency ? String(cfg.currency) : 'BDT' },
    services: services,
    clients: clients,
    entries: entries,
    updatedAt: Number(cfg.updatedAt) || 0
  };
}

function writeSheetRows(sheet, header, rows, textCols) {
  sheet.clearContents();
  var all = [header].concat(rows);
  var range = sheet.getRange(1, 1, all.length, header.length);
  if (textCols && textCols.length) {
    for (var i = 0; i < textCols.length; i++) {
      sheet.getRange(2, textCols[i], Math.max(1, rows.length), 1).setNumberFormat('@');
    }
  }
  range.setValues(all);
  sheet.getRange(1, 1, 1, header.length)
    .setFontWeight('bold')
    .setBackground('#0A0C0C')
    .setFontColor('#FFFFFF');
}

function writeAllData(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shEntries = getOrCreateSheet(ss, 'Entries');
  var shServices = getOrCreateSheet(ss, 'Services');
  var shClients = getOrCreateSheet(ss, 'Clients');
  var shConfig = getOrCreateSheet(ss, 'Config');

  var entries = Array.isArray(payload.entries) ? payload.entries : [];
  var services = Array.isArray(payload.services) ? payload.services : [];
  var clients = Array.isArray(payload.clients) ? payload.clients : [];
  var profile = payload.profile || { name: '' };
  var settings = payload.settings || { currency: 'BDT' };
  var updatedAt = Date.now();

  var eRows = entries.map(function (e) {
    return [
      String(e.id || ''),
      e.type === 'expense' ? 'expense' : 'income',
      Number(e.amount) || 0,
      String(e.date || ''),
      e.svc || '',
      e.client || '',
      e.cat || '',
      e.forSvc || '',
      e.note || '',
      Number(e.createdAt) || Date.now(),
      !!e.demo
    ];
  });

  var sRows = services.map(function (s) {
    return [String(s.id || ''), String(s.name || ''), String(s.color || '#FFE14A'), s.active !== false];
  });

  var cRows = clients.map(function (c) {
    return [String(c.id || ''), String(c.name || ''), String(c.color || '#FFB86B'), !!c.demo];
  });

  var cfgRows = [
    ['profileName', String(profile.name || '')],
    ['currency', String(settings.currency || 'BDT')],
    ['demo', !!payload.demo],
    ['updatedAt', updatedAt]
  ];

  // Column 4 (date) stored as plain text so Google Sheets never alters YYYY-MM-DD
  writeSheetRows(shEntries, HEADERS.Entries, eRows, [4]);
  writeSheetRows(shServices, HEADERS.Services, sRows);
  writeSheetRows(shClients, HEADERS.Clients, cRows);
  writeSheetRows(shConfig, HEADERS.Config, cfgRows);

  return updatedAt;
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    if (!checkAuth(params.secret)) {
      return jsonOut({ ok: false, error: 'ভুল সিক্রেট পিন (Unauthorized)' });
    }
    var data = readAllData();
    return jsonOut({ ok: true, data: data });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var raw = (e && e.postData && e.postData.contents) || '{}';
    var body = JSON.parse(raw);

    if (!checkAuth(body.secret)) {
      return jsonOut({ ok: false, error: 'ভুল সিক্রেট পিন (Unauthorized)' });
    }

    if (body.action === 'ping') {
      return jsonOut({ ok: true, pong: true });
    }

    var updatedAt = writeAllData(body.state || {});
    return jsonOut({ ok: true, updatedAt: updatedAt });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}
