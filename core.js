/* Afaire core: data, dates, reminders, parsing, push */
'use strict';

var KEY = 'afaire.v1';
var DEF = {
  items: [], moods: {}, breath: {}, pills: [], pillLog: {}, sleep: {}, workouts: [], wishes: [], kept: [],
  settings: { workerUrl: '', token: '', push: false, sub: null, eventRemind: 30,
    breathRemind: true, breathTimes: { morning: '08:00', midday: '13:00', evening: '19:30' } }
};
var S = load();

function load() {
  var d;
  try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
  d = d || {};
  var out = JSON.parse(JSON.stringify(DEF));
  Object.keys(d).forEach(function (k) { out[k] = d[k]; });
  out.settings = Object.assign({}, DEF.settings, d.settings || {});
  out.settings.breathTimes = Object.assign({}, DEF.settings.breathTimes, (d.settings || {}).breathTimes || {});
  return out;
}
var saveTimer = null;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save on this device'); }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(syncReminders, 1500);
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

/* ---------- dates ---------- */
var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function pad(n) { return (n < 10 ? '0' : '') + n; }
function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseYmd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function today() { return ymd(new Date()); }
function addDays(s, n) { var d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
function mondayOf(s) { var d = parseYmd(s); var w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return ymd(d); }
function weekKey(s) { return 'W' + mondayOf(s); }
function monthKey(s) { return s.slice(0, 7); }
function yearKey(s) { return s.slice(0, 4); }
function periodKey(p, s) { s = s || today(); return p === 'week' ? weekKey(s) : p === 'month' ? monthKey(s) : p === 'year' ? yearKey(s) : s; }
function fmtShort(s) { var d = parseYmd(s); return DOW[d.getDay()] + ' ' + d.getDate(); }
function fmtLong(s) { var d = parseYmd(s); return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); }
function fmtMD(s) { var d = parseYmd(s); return MON[d.getMonth()] + ' ' + d.getDate(); }
function relDay(s) { var t = today(); return s === t ? 'Today' : s === addDays(t, 1) ? 'Tomorrow' : s === addDays(t, -1) ? 'Yesterday' : fmtShort(s); }
function toMin(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
function dur(m) { m = Math.round(m); return Math.floor(m / 60) + 'h ' + pad(m % 60) + 'm'; }
function atTime(s, t) { var d = parseYmd(s); var p = t.split(':'); d.setHours(+p[0], +p[1], 0, 0); return d.getTime(); }
function timeOfDayMood() { var h = new Date().getHours(); return h >= 5 && h < 11 ? 'happy' : h >= 11 && h < 17 ? 'calm' : 'stressed'; }

/* ---------- items ---------- */
function itemsOn(s) {
  return S.items.filter(function (it) { return it.date === s && (it.type === 'event' || it.period === 'day' || !it.period); })
    .sort(function (a, b) { return (a.time || '99') < (b.time || '99') ? -1 : 1; });
}
function tasksFor(period, key) {
  return S.items.filter(function (it) {
    if (it.type !== 'task') return false;
    if (period === 'day') return (it.period || 'day') === 'day' && (it.date === key || (!it.done && it.date && it.date < key) || (!it.date && key === today()));
    return it.period === period && it.key === key;
  }).sort(function (a, b) { return (a.done - b.done) || ((a.date || '') < (b.date || '') ? -1 : 1); });
}
function nextEvent() {
  var now = Date.now();
  return S.items.filter(function (it) { return it.type === 'event' && it.date && it.time && atTime(it.date, it.time) > now - 30 * 60000; })
    .sort(function (a, b) { return atTime(a.date, a.time) - atTime(b.date, b.time); })[0];
}

/* ---------- wellness ---------- */
var PILL_COLORS = [['#FFE07A', '#F2A93B'], ['#FFB3C1', '#E06A86'], ['#B8F0C4', '#4FB673'], ['#C8C4FF', '#7A72E8'], ['#FFC79A', '#E8834A'], ['#D9C2FF', '#9A6BE0']];
var SLOTS = [['morning', 'Morning', '08:00'], ['noon', 'Noon', '12:00'], ['evening', 'Evening', '19:00'], ['bedtime', 'Bedtime', '22:30']];
function pillsTaken(s) { var l = S.pillLog[s] || {}; return S.pills.filter(function (p) { return l[p.id]; }).length; }
function sleepMinutes(e) { var b = toMin(e.bed), w = toMin(e.wake); var m = w - b; if (m <= 0) m += 1440; return m; }
function weekDates(s) { var m = mondayOf(s || today()); var out = []; for (var i = 0; i < 7; i++) out.push(addDays(m, i)); return out; }
function workoutWeek(s) {
  var dates = weekDates(s), set = {};
  dates.forEach(function (d) { set[d] = true; });
  var list = S.workouts.filter(function (w) { return set[w.date]; });
  var mins = list.reduce(function (a, w) { return a + (+w.minutes || 0); }, 0);
  var strength = {};
  list.forEach(function (w) { if (w.type === 'Strength') strength[w.date] = true; });
  return { dates: dates, list: list, mins: mins, strengthDays: Object.keys(strength).length };
}
var BREATH = {
  sigh: { label: 'Cyclic sigh', dur: 9, anim: 'oSigh', desc: 'Two breaths in through the nose, one long sigh out.', ph: [['Breathe in', 0, .22], ['A little more', .22, .33], ['Slowly out', .33, 1]] },
  box: { label: 'Box', dur: 16, anim: 'oBox', desc: 'In 4, hold 4, out 4, hold 4. Good for focus.', ph: [['Breathe in', 0, .25], ['Hold', .25, .5], ['Breathe out', .5, .75], ['Hold', .75, 1]] },
  slow: { label: 'Slow', dur: 11, anim: 'oSlow', desc: 'About 5 breaths a minute. Settles you before bed.', ph: [['Breathe in', 0, .5], ['Breathe out', .5, 1]] }
};
var SESSIONS = [['morning', 'Morning', 'box'], ['midday', 'Midday', 'sigh'], ['evening', 'Evening', 'slow']];
function currentSession() {
  var h = new Date().getHours(), done = S.breath[today()] || {};
  var order = h < 11 ? ['morning', 'midday', 'evening'] : h < 17 ? ['midday', 'evening', 'morning'] : ['evening', 'midday', 'morning'];
  for (var i = 0; i < order.length; i++) if (!done[order[i]]) return order[i];
  return order[0];
}

function cardOfDay(s) { var d = parseYmd(s || today()); var start = new Date(d.getFullYear(), 0, 1); var day = Math.round((d - start) / 86400000); return ((day * 97) % CARDS.length + CARDS.length) % CARDS.length; }

/* ---------- reminders ---------- */
function buildReminders() {
  var now = Date.now(), until = now + 8 * 86400000, out = [];
  function add(id, at, title, body) { if (at > now && at < until) out.push({ id: id, at: at, title: title, body: body || '' }); }
  S.items.forEach(function (it) {
    if (it.done || !it.date || !it.time) return;
    var r = it.remind == null ? (it.type === 'event' ? S.settings.eventRemind : 0) : it.remind;
    if (r < 0) return;
    var at = atTime(it.date, it.time) - r * 60000;
    add('i' + it.id, at, it.title, (r ? 'In ' + (r >= 60 ? (r / 60) + ' h' : r + ' min') + ' · ' : '') + it.time + (it.location ? ' · ' + it.location : ''));
  });
  for (var i = 0; i < 8; i++) {
    var d = addDays(today(), i), log = S.pillLog[d] || {}, bdone = S.breath[d] || {};
    S.pills.forEach(function (p) { if (!log[p.id] && p.time) add('p' + p.id + d, atTime(d, p.time), 'Time for ' + p.name, p.dose + (p.how ? ' · ' + p.how : '')); });
    if (S.settings.breathRemind) SESSIONS.forEach(function (s) {
      if (!bdone[s[0]]) add('b' + s[0] + d, atTime(d, S.settings.breathTimes[s[0]]), s[1] + ' breathing', 'Five minutes to slow down. ' + BREATH[s[2]].label + '.');
    });
  }
  return out.sort(function (a, b) { return a.at - b.at; }).slice(0, 380);
}
function api(path, body) {
  var url = (S.settings.workerUrl || '').replace(/\/+$/, '');
  if (!url) return Promise.reject(new Error('Server not set up'));
  return fetch(url + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Afaire-Token': S.settings.token || '' },
    body: body ? JSON.stringify(body) : undefined
  }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || ('Error ' + r.status)); return j; }); });
}
function syncReminders() {
  if (!S.settings.push || !S.settings.sub) return Promise.resolve();
  return api('/sync', { sub: S.settings.sub, reminders: buildReminders() }).catch(function () {});
}
function b64ToU8(s) { var p = '='.repeat((4 - s.length % 4) % 4); var b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); var a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
function isStandalone() { return window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches); }
function enablePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return Promise.reject(new Error(isStandalone() ? 'This device can’t show notifications' : 'Add Afaire to your Home Screen first'));
  if (!S.settings.workerUrl) return Promise.reject(new Error('Add your server address first'));
  return Notification.requestPermission().then(function (perm) {
    if (perm !== 'granted') throw new Error('Notifications are turned off for Afaire');
    return Promise.all([navigator.serviceWorker.ready, api('/vapid')]);
  }).then(function (r) {
    return r[0].pushManager.getSubscription().then(function (old) {
      return old || r[0].pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(r[1].key) });
    });
  }).then(function (sub) {
    S.settings.sub = JSON.parse(JSON.stringify(sub)); S.settings.push = true; save();
    return syncReminders();
  });
}

/* ---------- parsing ---------- */
function parseText(text, image) {
  if (S.settings.workerUrl) {
    var now = new Date();
    return api('/parse', { text: text, image: image || null, now: ymd(now) + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ' (' + DAYS[now.getDay()] + ')', tz: Intl.DateTimeFormat().resolvedOptions().timeZone })
      .then(function (r) { return { items: tidyAI(text, r.items || []), ai: true }; })
      .catch(function (e) { if (image && !text) throw e; return { items: localParse(text), ai: false, err: e.message }; });
  }
  if (image && !text) return Promise.reject(new Error('Reading pictures needs the AI server. Set it up in Me › Settings.'));
  return Promise.resolve({ items: localParse(text), ai: false });
}
var TH_DAYS = { 'อาทิตย์': 0, 'จันทร์': 1, 'อังคาร': 2, 'พุธ': 3, 'พฤหัส': 4, 'พฤหัสบดี': 4, 'ศุกร์': 5, 'เสาร์': 6 };
var EN_DAYS = { sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6 };
var TH_MON = { 'ม.ค.': 1, 'มกราคม': 1, 'ก.พ.': 2, 'กุมภาพันธ์': 2, 'มี.ค.': 3, 'มีนาคม': 3, 'เม.ย.': 4, 'เมษายน': 4, 'พ.ค.': 5, 'พฤษภาคม': 5, 'มิ.ย.': 6, 'มิถุนายน': 6, 'ก.ค.': 7, 'กรกฎาคม': 7, 'ส.ค.': 8, 'สิงหาคม': 8, 'ก.ย.': 9, 'กันยายน': 9, 'ต.ค.': 10, 'ตุลาคม': 10, 'พ.ย.': 11, 'พฤศจิกายน': 11, 'ธ.ค.': 12, 'ธันวาคม': 12 };
var LABEL_RE = /^[^0-9A-Za-z\u0E00-\u0E7F]*(วันที่|วัน|เวลา|ลิงค์|ลิงก์|link|สถานที่|location|place|where|when|date|time|ห้อง|room|zoom|meet|รายละเอียด|details?|note|หมายเหตุ)\s*[:：]/i;
var URL_RE = /https?:\/\/[^\s<>"']+/gi;
function blockLines(b) { return b.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean); }
function isOneAppointment(lines) { return lines.length > 1 && lines.some(function (l) { return LABEL_RE.test(l); }) && lines.filter(function (l) { return !LABEL_RE.test(l) && !/^https?:\/\//i.test(l); }).length <= 2; }
function mergeBlock(lines) {
  var head = lines.filter(function (l) { return !LABEL_RE.test(l) && !/^https?:\/\//i.test(l); }), urls = [], it = { type: 'event', title: '', date: '', time: '', endTime: '', location: '', note: '' };
  lines.forEach(function (l) {
    (l.match(URL_RE) || []).forEach(function (u) { urls.push(u); });
    var lab = l.match(LABEL_RE), body = l.replace(URL_RE, ' ');
    if (lab && /สถานที่|location|place|where|ห้อง|room/i.test(lab[1])) { it.location = body.replace(LABEL_RE, '').trim(); return; }
    if (lab && /รายละเอียด|detail|note|หมายเหตุ/i.test(lab[1])) { it.note += (it.note ? '\n' : '') + body.replace(LABEL_RE, '').trim(); return; }
    var p = parseLine(body.replace(LABEL_RE, ' '));
    if (!it.date && p.date) it.date = p.date;
    if (!it.time && p.time) it.time = p.time;
  });
  var t = (head[0] || lines[0]).replace(URL_RE, ' ').replace(/^[^0-9A-Za-z\u0E00-\u0E7F]+/, '').replace(/^(นัดหมาย|นัด|appointment|reminder)\s*[:：]?\s*/i, '').trim();
  if (head[1]) it.note = head[1] + (it.note ? '\n' + it.note : '');
  if (urls.length) it.note = (it.note ? it.note + '\n' : '') + urls.join('\n');
  it.title = t || 'Appointment';
  if (!it.time) it.type = it.date ? 'event' : 'task';
  return it;
}
function localParse(text) {
  var out = [];
  String(text || '').split(/\n\s*\n/).forEach(function (b) {
    var lines = blockLines(b);
    if (isOneAppointment(lines)) out.push(mergeBlock(lines));
    else lines.map(function (l) { return parseLine(l.replace(URL_RE, ' ').trim() || l); }).forEach(function (x) { if (x.title) out.push(x); });
  });
  return out;
}
function tidyAI(text, items) {
  var blocks = String(text || '').split(/\n\s*\n/).map(blockLines).filter(function (l) { return l.length; });
  if (blocks.length !== 1 || !isOneAppointment(blocks[0]) || items.length < 2) return items;
  var m = mergeBlock(blocks[0]), ai = items.filter(function (x) { return x.date || x.time; })[0] || items[0];
  m.date = m.date || ai.date || ''; m.time = m.time || ai.time || ''; m.endTime = ai.endTime || ''; m.location = m.location || ai.location || '';
  if (m.time) m.type = 'event';
  return [m];
}
function parseLine(line) {
  var s = ' ' + line + ' ', low = s.toLowerCase(), date = '', time = '', t = today(), m;
  function cut(re) { s = s.replace(re, ' '); low = s.toLowerCase(); }
  // dates
  if (/(วันนี้|\btoday\b|\btonight\b)/i.test(s)) { date = t; cut(/(วันนี้|\btoday\b|\btonight\b)/i); }
  else if (/(มะรืน(นี้)?|day after tomorrow)/i.test(s)) { date = addDays(t, 2); cut(/(มะรืน(นี้)?|(the )?day after tomorrow)/i); }
  else if (/(พรุ่งนี้|\btomorrow\b|\btmr\b)/i.test(s)) { date = addDays(t, 1); cut(/(พรุ่งนี้|\btomorrow\b|\btmr\b)/i); }
  if (!date && (m = s.match(/(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?/))) {
    var y = m[3] ? +m[3] : new Date().getFullYear(); if (y < 100) y += 2000; if (y > 2400) y -= 543;
    var dd = new Date(y, +m[2] - 1, +m[1]); if (!m[3] && ymd(dd) < t) dd.setFullYear(y + 1);
    date = ymd(dd); cut(m[0]);
  }
  if (!date) {
    for (var k in TH_MON) {
      var re = new RegExp('(\\d{1,2})\\s*' + k.replace(/\./g, '\\.') + '(?:\\s*(\\d{4}))?');
      if ((m = s.match(re))) { var yy = m[2] ? +m[2] : new Date().getFullYear(); if (yy > 2400) yy -= 543; var d2 = new Date(yy, TH_MON[k] - 1, +m[1]); if (!m[2] && ymd(d2) < t) d2.setFullYear(yy + 1); date = ymd(d2); cut(m[0]); break; }
    }
  }
  if (!date && (m = low.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b|\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/))) {
    var mi = MON.map(function (x) { return x.toLowerCase(); }).indexOf(m[1] || m[4]); var dn = +(m[2] || m[3]);
    var d3 = new Date(new Date().getFullYear(), mi, dn); if (ymd(d3) < t) d3.setFullYear(d3.getFullYear() + 1); date = ymd(d3); cut(new RegExp(m[0].replace(/\./g, '\\.'), 'i'));
  }
  if (!date) {
    var found = null, next = false;
    for (var th in TH_DAYS) if (s.indexOf(th) >= 0 && (!found || th.length > found.length)) found = th;
    if (found) { next = /หน้า/.test(s); cut(new RegExp('(วัน)?' + found + '(บดี)?(นี้|หน้า)?')); date = nextDow(TH_DAYS[found], next); }
    else if ((m = low.match(/\b(next|this)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|wed|thurs|thur|thu|fri|sat)\b/))) { date = nextDow(EN_DAYS[m[2]], m[1] === 'next'); cut(new RegExp(m[0], 'i')); }
  }
  // times
  if ((m = s.match(/(\d{1,2})[:.](\d{2})\s*(น\.|am|pm)?/i))) { var hh = +m[1]; if (/pm/i.test(m[3] || '') && hh < 12) hh += 12; if (/am/i.test(m[3] || '') && hh === 12) hh = 0; time = pad(hh) + ':' + m[2]; cut(m[0]); }
  else if ((m = low.match(/\b(\d{1,2})\s*(am|pm)\b/))) { var h2 = +m[1] % 12 + (m[2] === 'pm' ? 12 : 0); time = pad(h2) + ':00'; cut(new RegExp(m[0], 'i')); }
  else if ((m = s.match(/บ่าย\s*(\d{1,2})(\s*โมง)?/))) { time = pad(+m[1] + 12) + ':00'; cut(m[0]); }
  else if ((m = s.match(/(\d{1,2})\s*ทุ่ม/))) { time = pad(+m[1] + 18) + ':00'; cut(m[0]); }
  else if ((m = s.match(/ตี\s*(\d{1,2})/))) { time = pad(+m[1]) + ':00'; cut(m[0]); }
  else if ((m = s.match(/(\d{1,2})\s*โมง\s*(เย็น|เช้า)?/))) { var h3 = +m[1]; if (m[2] === 'เย็น' && h3 < 12) h3 += 12; else if (!m[2] && h3 < 7) h3 += 12; time = pad(h3) + ':00'; cut(m[0]); }
  else if (/เที่ยงคืน/.test(s)) { time = '00:00'; cut(/เที่ยงคืน/); }
  else if (/เที่ยง|\bnoon\b/i.test(s)) { time = '12:00'; cut(/เที่ยง(วัน)?|\bnoon\b/i); }
  s = s.replace(/\s(at|on|by)\s+(?=[,@]|\s*$)/gi, ' ').replace(/\s(at|on|by)\s*$/i, ' ');
  var loc = '', title = s;
  var cm = s.match(/^([^,]+),\s*([^,]{2,40})\s*$/);
  if (cm) { title = cm[1]; loc = cm[2].trim(); }
  else if ((m = s.match(/(?:\s(?:at|@)\s+|\s@|ที่)\s*([^,@]+?)\s*$/i)) && !/^\d/.test(m[1])) { loc = m[1].trim(); title = s.slice(0, m.index); }
  title = title.replace(/\s(before|next|this)\s*$/i, ' ').replace(/\s{2,}/g, ' ').replace(/^[\s,.\-–@]+|[\s,.\-–@]+$/g, '');
  title = title.replace(/^(อย่าลืม|ต้อง|remember to|don't forget to)\s*/i, '').trim() || line;
  return { type: time ? 'event' : 'task', title: title.charAt(0).toUpperCase() + title.slice(1), date: date, time: time, endTime: '', location: loc, note: '' };
}
function nextDow(dow, forceNext) {
  var t = today(), d = parseYmd(t), diff = (dow - d.getDay() + 7) % 7;
  if (diff === 0) diff = 7;
  var target = addDays(t, diff);
  if (forceNext && mondayOf(target) === mondayOf(t)) target = addDays(target, 7);
  return target;
}

/* ---------- misc ---------- */
function baht(n) { return '฿' + Math.round(+n || 0).toLocaleString('en-US'); }
var toastT;
function toast(msg) { var t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2600); }
