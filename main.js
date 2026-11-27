/* Afaire main: routing, events, sheets */
'use strict';

var app = document.getElementById('app'), navEl = document.getElementById('nav');
var route = 'today';

function render() {
  var r = ROUTES[route] || ROUTES.today, cls = r[1];
  if (route === 'breathe' && !V.br) startBreath(currentSession());
  var y = window.scrollY;
  app.innerHTML = r[0]();
  var bodyCls = cls === 'c' ? 'c m-' + (route === 'mood' ? (V.moodPick || (S.moods[today()] || {}).mood || timeOfDayMood()) : 'stressed') : cls;
  document.body.className = bodyCls;
  navEl.innerHTML = r[2] ? navHTML(r[2]) : '';
  navEl.style.display = r[2] ? '' : 'none';
  if (render.keep) window.scrollTo(0, y);
  render.keep = false;
}
function go() {
  var h = (location.hash || '#today').slice(1);
  if (!ROUTES[h]) h = 'today';
  if (route === 'breathe' && h !== 'breathe') stopBreath();
  if (h !== 'new' && route === 'new') { /* keep draft */ }
  if (h === 'mood') V.moodPick = null;
  route = h; V.wipe = false; render(); window.scrollTo(0, 0);
}
function rerender() { render.keep = true; render(); }
window.addEventListener('hashchange', go);

/* ---------------- breathe ---------------- */
var brTimer = null;
function startBreath(session) {
  var s = SESSIONS.filter(function (x) { return x[0] === session; })[0];
  V.br = { session: session, tech: s[2], playing: false, total: 300, left: 300, t0: 0 };
}
function stopBreath() { clearInterval(brTimer); brTimer = null; if (V.br) V.br.playing = false; V.br = null; }
function tickBreath() {
  var b = V.br; if (!b || !b.playing) return;
  var t = BREATH[b.tech], el = (Date.now() - b.t0) / 1000;
  b.left = Math.max(0, Math.round(b.startLeft - el));
  var ph = (el % t.dur) / t.dur, label = t.ph.filter(function (p) { return ph >= p[1] && ph < p[2]; })[0];
  var pe = document.getElementById('phase'), le = document.getElementById('left');
  if (pe && label && pe.textContent !== label[0]) pe.textContent = label[0];
  if (le) le.textContent = Math.floor(b.left / 60) + ':' + pad(b.left % 60);
  if (b.left <= 0) { b.playing = false; clearInterval(brTimer); markBreath(b.session, true); toast('Session done. Nice work.'); rerender(); }
}
function markBreath(session, val) { var d = today(); S.breath[d] = S.breath[d] || {}; S.breath[d][session] = val; save(); }

/* ---------------- sheet ---------------- */
var sheetEl, scrimEl, sheetSubmit = null;
function openSheet(title, body, onSubmit) {
  closeSheet(true);
  scrimEl = document.createElement('div'); scrimEl.className = 'scrim';
  sheetEl = document.createElement('div'); sheetEl.className = 'sheet'; sheetEl.setAttribute('role', 'dialog'); sheetEl.setAttribute('aria-modal', 'true'); sheetEl.setAttribute('aria-label', title);
  sheetEl.innerHTML = '<div class="grab"></div><div class="sh"><h3>' + title + '</h3><button class="circle glass rp" style="width:40px;height:40px" data-a="close" aria-label="Close">' + ic('x', 18) + '</button></div><form class="sb" data-f="sheet">' + body + '</form>';
  document.body.appendChild(scrimEl); document.body.appendChild(sheetEl);
  sheetSubmit = onSubmit;
  scrimEl.addEventListener('click', function () { closeSheet(); });
  requestAnimationFrame(function () { scrimEl.classList.add('on'); sheetEl.classList.add('on'); });
}
function closeSheet(now) {
  if (!sheetEl) return;
  var s = sheetEl, c = scrimEl; sheetEl = scrimEl = null; sheetSubmit = null;
  if (now) { s.remove(); c.remove(); return; }
  s.classList.remove('on'); c.classList.remove('on');
  setTimeout(function () { s.remove(); c.remove(); }, 320);
}
function fld(label, input) { return '<label class="field"><span>' + label + '</span>' + input + '</label>'; }
function sel(name, opts, val) { return '<select class="inp" name="' + name + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; }
var REMIND = [['', 'Default'], [-1, 'No reminder'], [0, 'At the time'], [5, '5 min before'], [15, '15 min before'], [30, '30 min before'], [60, '1 hour before'], [120, '2 hours before'], [1440, '1 day before']];

function itemSheet(it, onSave, onDelete) {
  var isNew = !it.id && onDelete == null;
  var type = it.type || 'event';
  var b = '<div class="seg glass" style="margin-bottom:12px">' + [['event', 'Event'], ['task', 'Task']].map(function (o) { return '<button type="button" class="rp' + (type === o[0] ? ' on' : '') + '" data-a="itype" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div><input type="hidden" name="type" value="' + type + '">';
  b += fld('Title', '<input class="inp" name="title" required value="' + esc(it.title || '') + '" placeholder="What is it?">');
  b += '<div class="two">' + fld('Date', '<input class="inp" type="date" name="date" value="' + (it.date || '') + '">') + fld('Time', '<input class="inp" type="time" name="time" value="' + (it.time || '') + '">') + '</div>';
  b += '<div data-show="event"' + (type === 'event' ? '' : ' class="hide"') + '><div class="two">' + fld('Ends', '<input class="inp" type="time" name="endTime" value="' + (it.endTime || '') + '">') + fld('Place', '<input class="inp" name="location" value="' + esc(it.location || '') + '">') + '</div></div>';
  b += '<div data-show="task"' + (type === 'task' ? '' : ' class="hide"') + '>' + fld('List', sel('period', [['day', 'Day'], ['week', 'This week'], ['month', 'This month'], ['year', 'This year']], it.period || 'day')) + '</div>';
  b += fld('Reminder', sel('remind', REMIND, it.remind == null ? '' : it.remind));
  b += fld('Note', '<textarea class="inp" name="note" placeholder="Optional">' + esc(it.note || '') + '</textarea>');
  b += '<button class="pill dark rp">' + ic('check', 18, 'stroke-width:2.2') + 'Save</button>';
  if (onDelete) b += '<button type="button" class="pill rp mt" style="color:#B3413B" data-a="sheetDel">' + ic('trash', 18) + 'Delete</button>';
  openSheet(isNew ? 'New ' + type : 'Edit', b, function (f) {
    var out = { type: f.type, title: f.title.trim(), date: f.date, time: f.time, endTime: f.type === 'event' ? f.endTime : '', location: f.type === 'event' ? f.location.trim() : '', note: f.note.trim(), remind: f.remind === '' ? null : +f.remind };
    if (f.type === 'task') { out.period = f.period; out.key = f.period === 'day' ? '' : periodKey(f.period, f.date || today()); } else { out.period = null; }
    if (!out.title) return false;
    onSave(out);
  });
  sheetEl._onDelete = onDelete;
}
function saveItem(id, data) {
  if (id) { var it = S.items.filter(function (x) { return x.id === id; })[0]; Object.assign(it, data); }
  else S.items.push(Object.assign({ id: uid(), done: false, created: Date.now() }, data));
  save(); rerender();
}

function pillSheet(p) {
  p = p || {};
  var b = fld('Name', '<input class="inp" name="name" required value="' + esc(p.name || '') + '" placeholder="e.g. Vitamin D">') +
    '<div class="two">' + fld('Dose', '<input class="inp" name="dose" value="' + esc(p.dose || '1 tablet') + '">') + fld('Time', '<input class="inp" type="time" name="time" value="' + (p.time || '08:00') + '" required>') + '</div>' +
    fld('How to take it', '<input class="inp" name="how" value="' + esc(p.how || '') + '" placeholder="e.g. After a meal">') +
    '<div class="sub" style="margin:0 6px 12px">It goes under Morning, Noon, Evening or Bedtime by its time. You’ll get a reminder at that time.</div>' +
    '<button class="pill dark rp">' + ic('check', 18, 'stroke-width:2.2') + 'Save</button>' + (p.id ? '<button type="button" class="pill rp mt" style="color:#B3413B" data-a="sheetDel">' + ic('trash', 18) + 'Delete</button>' : '');
  openSheet(p.id ? 'Edit pill' : 'Add a pill', b, function (f) {
    var h = +f.time.split(':')[0], slot = h < 11 ? 'morning' : h < 16 ? 'noon' : h < 21 ? 'evening' : 'bedtime';
    var d = { name: f.name.trim(), dose: f.dose.trim(), time: f.time, how: f.how.trim(), slot: slot };
    if (!d.name) return false;
    if (p.id) Object.assign(p, d); else S.pills.push(Object.assign({ id: uid(), color: S.pills.length }, d));
    save(); rerender();
  });
  if (p.id) sheetEl._onDelete = function () { S.pills = S.pills.filter(function (x) { return x.id !== p.id; }); save(); rerender(); };
}
function workSheet(w) {
  w = w || {};
  var b = fld('Type', sel('type', WTYPES.map(function (t) { return [t, t]; }), w.type || 'Walk')) +
    '<div class="two">' + fld('Minutes', '<input class="inp" type="number" inputmode="numeric" min="1" max="600" name="minutes" required value="' + (w.minutes || 30) + '">') + fld('Date', '<input class="inp" type="date" name="date" value="' + (w.date || today()) + '">') + '</div>' +
    '<button class="pill dark rp">' + ic('check', 18, 'stroke-width:2.2') + 'Save</button>' + (w.id ? '<button type="button" class="pill rp mt" style="color:#B3413B" data-a="sheetDel">' + ic('trash', 18) + 'Delete</button>' : '');
  openSheet(w.id ? 'Edit workout' : 'Log a workout', b, function (f) {
    var d = { type: f.type, minutes: Math.max(1, +f.minutes || 0), date: f.date || today() };
    if (w.id) Object.assign(w, d); else S.workouts.push(Object.assign({ id: uid() }, d));
    save(); rerender();
  });
  if (w.id) sheetEl._onDelete = function () { S.workouts = S.workouts.filter(function (x) { return x.id !== w.id; }); save(); rerender(); };
}
function wishSheet(w) {
  w = w || {};
  var b = fld('What is it?', '<input class="inp" name="name" required value="' + esc(w.name || '') + '">') +
    '<div class="two">' + fld('Price (฿)', '<input class="inp" type="number" inputmode="decimal" min="0" name="price" required value="' + (w.price || '') + '">') + fld('Saved so far (฿)', '<input class="inp" type="number" inputmode="decimal" min="0" name="saved" value="' + (w.saved || 0) + '">') + '</div>' +
    (w.id ? fld('Add to savings (฿)', '<input class="inp" type="number" inputmode="decimal" min="0" name="add" placeholder="0">') : '') +
    '<button class="pill dark rp">' + ic('check', 18, 'stroke-width:2.2') + 'Save</button>' + (w.id ? '<button type="button" class="pill rp mt" style="color:#B3413B" data-a="sheetDel">' + ic('trash', 18) + 'Delete</button>' : '');
  openSheet(w.id ? 'Edit wish' : 'Add to wishlist', b, function (f) {
    var d = { name: f.name.trim(), price: Math.max(0, +f.price || 0), saved: Math.max(0, (+f.saved || 0) + (+f.add || 0)) };
    if (!d.name) return false;
    if (w.id) Object.assign(w, d); else S.wishes.push(Object.assign({ id: uid() }, d));
    save(); rerender();
  });
  if (w.id) sheetEl._onDelete = function () { S.wishes = S.wishes.filter(function (x) { return x.id !== w.id; }); save(); rerender(); };
}
function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
function formData(f) { var o = {}; Array.prototype.forEach.call(f.elements, function (el) { if (!el.name) return; o[el.name] = el.type === 'checkbox' ? el.checked : el.value; }); return o; }

/* ---------------- actions ---------------- */
var A = {
  close: function () { closeSheet(); },
  flip: function () { V.flip = !V.flip; var el = document.querySelector('.flip'); if (el) el.classList.toggle('on', V.flip); },
  keep: function () { var i = cardOfDay(); var k = S.kept.indexOf(i); if (k >= 0) S.kept.splice(k, 1); else S.kept.push(i); save(); toast(k >= 0 ? 'Removed from your cards' : 'Kept in Me › Cards'); rerender(); },
  unkeep: function (el) { S.kept = S.kept.filter(function (x) { return x !== +el.dataset.v; }); save(); rerender(); },
  tab: function (el) { V.planTab = el.dataset.v; rerender(); },
  toggle: function (el) { var it = byId(S.items, el.dataset.id); it.done = !it.done; save(); rerender(); },
  edit: function (el) { var it = byId(S.items, el.dataset.id); itemSheet(it, function (d) { saveItem(it.id, d); }, function () { S.items = S.items.filter(function (x) { return x.id !== it.id; }); save(); rerender(); }); },
  addOn: function (el) { itemSheet({ type: el.dataset.t || 'event', date: el.dataset.v || '' }, function (d) { saveItem(null, d); toast('Added'); }); },
  mon: function (el) { var y = +V.calMonth.slice(0, 4), m = +V.calMonth.slice(5, 7) - 1 + +el.dataset.v; var d = new Date(y, m, 1); V.calMonth = d.getFullYear() + '-' + pad(d.getMonth() + 1); rerender(); },
  day: function (el) { V.calSel = el.dataset.v; rerender(); },
  toToday: function () { V.calSel = today(); V.calMonth = today().slice(0, 7); rerender(); },
  itype: function (el) {
    var f = el.closest('form'); f.elements.type.value = el.dataset.v;
    f.querySelectorAll('[data-a="itype"]').forEach(function (b) { b.classList.toggle('on', b === el); });
    f.querySelectorAll('[data-show]').forEach(function (d) { d.classList.toggle('hide', d.dataset.show !== el.dataset.v); });
  },
  sheetDel: function () { var fn = sheetEl && sheetEl._onDelete; closeSheet(); if (fn) fn(); },
  paste: function () {
    if (!navigator.clipboard || !navigator.clipboard.readText) { document.getElementById('paste').focus(); toast('Long-press the box and tap Paste'); return; }
    navigator.clipboard.readText().then(function (t) { V.newText = (V.newText ? V.newText + '\n' : '') + t; rerender(); }).catch(function () { document.getElementById('paste').focus(); toast('Long-press the box and tap Paste'); });
  },
  dictate: function () {
    var R = window.SpeechRecognition || window.webkitSpeechRecognition, ta = document.getElementById('paste');
    if (!R) { ta.focus(); toast('Tap the mic on your keyboard to talk'); return; }
    try {
      var r = new R(); r.lang = navigator.language || 'en-US'; r.interimResults = false;
      r.onresult = function (e) { V.newText = (V.newText ? V.newText + '\n' : '') + e.results[0][0].transcript; rerender(); };
      r.onerror = function () { ta.focus(); toast('Tap the mic on your keyboard to talk'); };
      r.start(); toast('Listening…');
    } catch (e) { ta.focus(); toast('Tap the mic on your keyboard to talk'); }
  },
  noImg: function () { V.newImage = null; rerender(); },
  find: function () {
    var ta = document.getElementById('paste'); V.newText = ta ? ta.value : V.newText;
    if (!V.newText.trim() && !V.newImage) { toast('Paste or type something first'); return; }
    V.busy = true; rerender();
    parseText(V.newText.trim(), V.newImage).then(function (r) {
      V.found = r.items.map(function (x) { return Object.assign({ type: 'task', title: '', date: '', time: '', endTime: '', location: '', note: '' }, x); });
      if (r.err) toast('AI is unavailable, used the simple reader');
    }).catch(function (e) { toast(e.message); }).then(function () { V.busy = false; rerender(); });
  },
  editFound: function (el) { var i = +el.dataset.v, x = V.found[i]; itemSheet(x, function (d) { V.found[i] = d; rerender(); }, function () { V.found.splice(i, 1); rerender(); }); },
  dropFound: function (el) { V.found.splice(+el.dataset.v, 1); rerender(); },
  saveFound: function () {
    V.found.forEach(function (x) {
      var d = Object.assign({}, x, { remind: null });
      if (d.type === 'task') { d.period = 'day'; d.key = ''; }
      S.items.push(Object.assign({ id: uid(), done: false, created: Date.now() }, d));
    });
    var n = V.found.length; V.found = null; V.newText = ''; V.newImage = null; save();
    toast('Saved ' + n + (n === 1 ? ' item' : ' items')); location.hash = '#today';
  },
  sess: function (el) { clearInterval(brTimer); startBreath(el.dataset.v); rerender(); },
  tech: function (el) { clearInterval(brTimer); V.br.tech = el.dataset.v; V.br.playing = false; V.br.left = V.br.total; rerender(); },
  play: function () {
    var b = V.br;
    if (b.playing) { b.playing = false; clearInterval(brTimer); }
    else { if (b.left <= 0) b.left = b.total; b.playing = true; b.t0 = Date.now(); b.startLeft = b.left; clearInterval(brTimer); brTimer = setInterval(tickBreath, 250); }
    rerender();
  },
  brDone: function () { var b = V.br, d = S.breath[today()] || {}; markBreath(b.session, !d[b.session]); b.playing = false; clearInterval(brTimer); if (!d[b.session]) toast('Marked as done'); rerender(); },
  pickMood: function (el) { V.moodPick = el.dataset.v; rerender(); },
  saveMood: function () {
    var m = V.moodPick || (S.moods[today()] || {}).mood; if (!m) return;
    S.moods[today()] = { mood: m, note: (document.getElementById('mnote') || {}).value || '', at: Date.now() }; save();
    toast('Checked in'); location.hash = m === 'stressed' ? '#breathe' : '#wellness';
  },
  addPill: function () { pillSheet(); },
  editPill: function (el) { pillSheet(byId(S.pills, el.dataset.id)); },
  takePill: function (el) { var d = today(); S.pillLog[d] = S.pillLog[d] || {}; S.pillLog[d][el.dataset.id] = !S.pillLog[d][el.dataset.id]; V.popped = el.dataset.id; save(); rerender(); setTimeout(function () { V.popped = null; }, 500); },
  addWork: function () { workSheet(); },
  editWork: function (el) { workSheet(byId(S.workouts, el.dataset.id)); },
  addWish: function () { wishSheet(); },
  editWish: function (el) { wishSheet(byId(S.wishes, el.dataset.id)); },
  push: function () {
    if (S.settings.push) { S.settings.push = false; save(); toast('Reminders turned off'); rerender(); return; }
    enablePush().then(function () { toast('Reminders are on'); rerender(); }).catch(function (e) { toast(e.message); });
  },
  testPush: function () { api('/test', { sub: S.settings.sub }).then(function (r) { toast(r.ok ? 'Sent. Check your notifications.' : 'Could not send (' + r.status + ')'); }).catch(function (e) { toast(e.message); }); },
  testServer: function () {
    var f = document.querySelector('[data-f="server"]'); S.settings.workerUrl = f.elements.workerUrl.value.trim(); S.settings.token = f.elements.token.value.trim(); save();
    api('/health').then(function (r) { toast(!r.authed ? 'Wrong app password' : r.ai ? 'Connected, AI ready' : 'Connected, but AI key is missing'); }).catch(function (e) { toast('Can’t reach the server: ' + e.message); });
  },
  'export': function () {
    var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'afaire-backup-' + today() + '.json'; document.body.appendChild(a); a.click(); a.remove();
  },
  wipe: function () { if (!V.wipe) { V.wipe = true; rerender(); return; } localStorage.removeItem(KEY); S = load(); V.wipe = false; toast('All data deleted'); location.hash = '#today'; render(); }
};

document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-a]');
  if (!el || el.tagName === 'INPUT') return;
  var fn = A[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', function (e) {
  var el = e.target;
  if (el.dataset.a === 'img' && el.files && el.files[0]) {
    resizeImage(el.files[0], 1400).then(function (url) { V.newImage = url; rerender(); }).catch(function () { toast('Could not read that picture'); });
  }
  if (el.dataset.a === 'import' && el.files && el.files[0]) {
    el.files[0].text().then(function (t) {
      var d = JSON.parse(t); if (!d || !d.items) throw new Error();
      localStorage.setItem(KEY, JSON.stringify(d)); S = load(); save(); toast('Restored'); render();
    }).catch(function () { toast('That file isn’t an Afaire backup'); });
  }
});
document.addEventListener('input', function (e) { if (e.target.dataset.in === 'newText') V.newText = e.target.value; });
document.addEventListener('submit', function (e) {
  var f = e.target, kind = f.dataset.f; if (!kind) return;
  e.preventDefault();
  var d = formData(f);
  if (kind === 'sheet') { if (sheetSubmit && sheetSubmit(d) === false) { toast('Please fill in the name'); return; } closeSheet(); return; }
  if (kind === 'quick') {
    var title = (d.t || '').trim(); if (!title) return;
    var p = V.planTab, parsed = parseLine(title);
    S.items.push({ id: uid(), type: 'task', title: parsed.title || title, date: p === 'day' ? (parsed.date || today()) : parsed.date, time: parsed.time, period: p, key: p === 'day' ? '' : periodKey(p), note: '', done: false, remind: null, created: Date.now() });
    save(); rerender(); var q = document.getElementById('qt'); if (q) q.focus();
    if (p === 'day' && parsed.date && parsed.date !== today()) toast('Added for ' + relDay(parsed.date));
  }
  if (kind === 'sleep') { S.sleep[today()] = { bed: d.bed, wake: d.wake }; save(); toast('Saved'); rerender(); }
  if (kind === 'prefs') {
    S.settings.eventRemind = +d.eventRemind; S.settings.breathRemind = !!d.breathRemind;
    SESSIONS.forEach(function (s) { if (d['bt_' + s[0]]) S.settings.breathTimes[s[0]] = d['bt_' + s[0]]; });
    save(); toast('Saved'); rerender();
  }
  if (kind === 'server') { S.settings.workerUrl = d.workerUrl.trim().replace(/\/+$/, ''); S.settings.token = d.token.trim(); save(); toast('Saved'); rerender(); }
});

function resizeImage(file, max) {
  return new Promise(function (res, rej) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', .82));
    };
    img.onerror = rej; img.src = url;
  });
}

/* ---------------- start ---------------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
document.addEventListener('visibilitychange', function () { if (!document.hidden) { syncReminders(); if (route !== 'breathe') rerender(); } });
go();
syncReminders();
