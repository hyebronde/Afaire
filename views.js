/* Afaire views: each returns HTML for #app */
'use strict';

var ICON = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2"/>',
  plan: '<circle cx="5.5" cy="7" r="1.5"/><circle cx="5.5" cy="12" r="1.5"/><circle cx="5.5" cy="17" r="1.5"/><path d="M10 7h10M10 12h10M10 17h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/>',
  me: '<circle cx="12" cy="9" r="3.5"/><path d="M5 19.5c1.5-3.2 4-4.8 7-4.8s5.5 1.6 7 4.8"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="4"/><path d="M3.5 10h17M8 3v3.5M16 3v3.5"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>',
  check: '<path d="M5 12.5l5 4.5 9-10"/>',
  wind: '<path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 14h15a3 3 0 1 1-3 3"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
  pill: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M9.7 8.7l4.6 6.6"/>',
  run: '<circle cx="14" cy="4.5" r="1.8"/><path d="M9 21l2.5-5.5L14 17v4M6 12l3-3.5 4 1.5 2.5 3 3 .5M11.5 15.5L13 10"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  cards: '<rect x="4" y="6" width="11" height="15" rx="2.5" transform="rotate(-8 9.5 13.5)"/><rect x="9" y="3.5" width="11" height="15" rx="2.5"/>',
  paste: '<rect x="6" y="4.5" width="12" height="16" rx="3"/><rect x="9" y="3" width="6" height="3.5" rx="1.5"/>',
  photo: '<rect x="3.5" y="5" width="17" height="14" rx="4"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16L15 11l-8 8"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>', pause: '<path d="M9 6v12M15 6v12"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>', trash: '<path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
  wave: '<path d="M3 10c3 0 3 3 6 3s3-3 6-3 3 3 6 3M3 15c3 0 3 3 6 3s3-3 6-3 3 3 6 3"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10"/>',
  dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'
};
function ic(n, size, extra) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:' + (size || 22) + 'px;height:' + (size || 22) + 'px' + (extra ? ';' + extra : '') + '">' + ICON[n] + '</svg>'; }
function topbar(title, back, right) {
  return '<div class="top">' + (back ? '<a class="circle glass rp" href="#' + back + '" aria-label="Back">' + ic('back', 20) + '</a>' : '') + '<h1>' + title + '</h1>' + (right || '') + '</div>';
}
function ck(on) { return '<span class="ck' + (on ? ' on' : '') + '">' + ic('check') + '</span>'; }
function big(v, u) { return '<span class="big">' + v + (u ? '<small>' + u + '</small>' : '') + '</span>'; }

var V = { planTab: 'day', calMonth: today().slice(0, 7), calSel: today(), flip: false, newText: '', newImage: null, found: null, br: null, moodPick: null, busy: false, wmode: 'w' };
var MOODS = [['calm', 'Calm'], ['happy', 'Happy'], ['excited', 'Excited'], ['stressed', 'Stressed']];
var MOOD_DOT = { calm: 'a-sky', happy: 'a-gold', excited: 'a-coral', stressed: 'a-violet' };
var MOOD_TINT = { calm: '#BFDDEB', happy: '#FFD9A0', excited: '#FFB5A8', stressed: '#D4C9F5' };

/* ---------------- Today (planner first) ---------------- */
function monthGrid(small) {
  var mk = V.calMonth, y = +mk.slice(0, 4), m = +mk.slice(5, 7) - 1, first = new Date(y, m, 1), t = today();
  var start = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  var h = '<div class="cal' + (small ? ' sm' : '') + '">' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (d) { return '<span class="dw">' + d + '</span>'; }).join('');
  for (var i = 0; i < start; i++) h += '<span></span>';
  for (var d = 1; d <= days; d++) {
    var s = y + '-' + pad(m + 1) + '-' + pad(d), its = itemsOn(s), cls = s === t ? 'today' : its.some(function (x) { return x.type === 'task' && !x.done; }) ? 'tk' : its.length ? 'ev' : '';
    h += '<button class="rp ' + cls + (s === V.calSel ? ' sel' : '') + '" data-a="day" data-v="' + s + '" aria-label="' + MONTHS[m] + ' ' + d + (its.length ? ', ' + its.length + ' items' : '') + '">' + d + '<small>' + (small ? (its.length ? '•' : '') : (its.length || '')) + '</small></button>';
  }
  return h + '</div>';
}
function agendaRows(s) {
  var list = itemsOn(s), h = '';
  if (!list.length) return '<div class="empty">Nothing planned</div>';
  list.forEach(function (x) {
    var bar = x.type === 'task' ? '' : '<i class="dotA ' + (x.time && x.time >= '18:00' ? 'a-violet' : 'a-sky') + '" style="width:4px;height:30px;border-radius:4px;flex:none"></i>';
    h += '<div class="row' + (x.done ? ' done' : '') + '" style="min-height:52px">' + (x.type === 'task' ? '<button class="rp" data-a="toggle" data-id="' + x.id + '" aria-pressed="' + !!x.done + '" aria-label="Done">' + ck(x.done) + '</button>' : bar) +
      '<span style="width:44px;font-size:14px;font-weight:300">' + (x.time || (x.type === 'task' ? 'Task' : 'All day')) + '</span><button class="b" data-a="edit" data-id="' + x.id + '" style="text-align:left"><span class="t1" style="font-size:15px">' + esc(x.title) + '</span>' + (x.location ? '<span class="t2">' + esc(x.location) + '</span>' : '') + '</button></div>';
  });
  return h;
}
function viewToday() {
  var t = today(), sel = V.calSel, sd = parseYmd(sel), mode = V.wmode || 'w', dn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var has = function (d) { return itemsOn(d).length > 0; };
  var h = '<section class="wh" aria-label="Calendar">';
  h += '<div class="hd"><div class="sg" role="group" aria-label="View"><button class="rp' + (mode === 'w' ? ' on' : '') + '" data-a="wmode" data-v="w" aria-pressed="' + (mode === 'w') + '">Weekly</button><button class="rp' + (mode === 'm' ? ' on' : '') + '" data-a="wmode" data-v="m" aria-pressed="' + (mode === 'm') + '">Monthly</button></div>' +
    '<button class="ib rp" data-a="toToday" aria-label="Go to today">' + ic('cal', 20) + '</button></div>';
  if (mode === 'w') {
    h += '<div class="big"><span>' + MONTHS[sd.getMonth()] + '</span><span>' + sd.getDate() + '</span></div>';
    var mon = mondayOf(sel);
    h += '<div class="whl"><div class="arc" style="top:50px;height:66px;border-top:1px solid rgba(255,255,255,.3)"></div><div class="arc" style="top:104px;height:20px;border-top:2px dotted rgba(255,255,255,.45)"></div><div class="days">';
    for (var i = 0; i < 7; i++) {
      var d = addDays(mon, i), off = i - 3, dd = parseYmd(d);
      h += '<button class="rp' + (d === sel ? ' on' : '') + (d === t ? ' td' : '') + '" data-a="day" data-v="' + d + '" aria-label="' + fmtLong(d) + '" style="transform:translateY(' + (off * off * 3.2) + 'px) rotate(' + (off * 2.2) + 'deg)"><span class="l">' + dn[i] + '</span><span class="n">' + dd.getDate() + '</span><i class="dot' + (has(d) ? ' y' : '') + '"></i></button>';
    }
    h += '</div></div>';
  } else {
    var y = +V.calMonth.slice(0, 4), m = +V.calMonth.slice(5, 7) - 1, first = new Date(y, m, 1), st = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    h += '<div class="big s"><span>' + MONTHS[m] + '</span><span>' + (V.calMonth === sel.slice(0, 7) ? sd.getDate() : y) + '</span></div>';
    h += '<div class="mg dn">' + dn.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="mg">';
    for (var k = 0; k < st; k++) h += '<span></span>';
    for (var n = 1; n <= days; n++) {
      var s2 = y + '-' + pad(m + 1) + '-' + pad(n);
      h += '<button class="rp' + (s2 === sel ? ' on' : '') + (s2 === t ? ' td' : '') + '" data-a="day" data-v="' + s2 + '" aria-label="' + fmtLong(s2) + '"><span>' + n + '</span><i class="' + (has(s2) ? 'y' : '') + '"></i></button>';
    }
    h += '</div>';
  }
  h += '<div class="ft"><div class="nv"><button class="rp" data-a="shift" data-v="-1" aria-label="' + (mode === 'w' ? 'Previous week' : 'Previous month') + '">' + ic('left', 18) + '</button><button class="rp" data-a="shift" data-v="1" aria-label="' + (mode === 'w' ? 'Next week' : 'Next month') + '">' + ic('chev', 18) + '</button></div>' +
    '<button class="ne rp" data-a="addOn" data-v="' + sel + '">' + ic('plus', 18, 'stroke-width:2') + 'New event</button></div></section>';
  var list = itemsOn(sel), tasks = list.filter(function (x) { return x.type === 'task'; }), evs = list.filter(function (x) { return x.type !== 'task'; });
  var left = tasks.filter(function (x) { return !x.done; }).length;
  h += '<div class="tl todo"><div class="th"><span>To-do</span><small>' + (tasks.length ? left + ' left' : '') + '</small></div>';
  if (!tasks.length) h += '<div class="row empty" style="min-height:0">No tasks for this day</div>';
  tasks.forEach(function (x) {
    h += '<div class="row' + (x.done ? ' done' : '') + '" style="min-height:52px"><button class="rp" data-a="toggle" data-id="' + x.id + '" aria-pressed="' + !!x.done + '" aria-label="Done">' + ck(x.done) + '</button><button class="b" data-a="edit" data-id="' + x.id + '" style="text-align:left;display:flex;align-items:center;gap:8px"><span class="t1" style="flex:1;min-width:0">' + esc(x.title) + '</span>' + (x.time || x.note ? '<span class="t2" style="flex:none;max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(x.time || x.note) + '</span>' : '') + '</button></div>';
  });
  h += '</div><div class="tl sch"><div class="th"><span>Schedule</span><small>' + (evs.length ? evs.length + (evs.length === 1 ? ' event' : ' events') : '') + '</small></div>';
  if (!evs.length) h += '<div class="row empty" style="min-height:0">Nothing scheduled</div>';
  evs.forEach(function (x) {
    var c = !x.time ? '#DDF247' : x.time >= '18:00' ? '#8FB39D' : '#E2965A';
    h += '<button class="row rp" data-a="edit" data-id="' + x.id + '" style="min-height:52px"><i class="bar" style="background:' + c + '"></i><span style="width:44px;font-size:14px;font-weight:300">' + (x.time || 'All day') + '</span><span class="b"><span class="t1" style="font-size:15px">' + esc(x.title) + '</span>' + (x.location ? '<span class="t2">' + esc(x.location) + '</span>' : '') + '</span></button>';
  });
  return h + '</div>';
}
function flipCard() {
  var ci = cardOfDay(today()), kept = S.kept.indexOf(ci) >= 0;
  return '<button class="flip aura a-violet rp mt16' + (V.flip ? ' on' : '') + '" data-a="flip" aria-label="Today’s card, tap to flip">' +
    '<span class="fr"><span class="card-ic">' + ic('spark', 26, 'stroke-width:1.5') + '</span><span><span class="chip">Today’s card</span><span style="display:block;font-size:21px;font-weight:300;margin-top:8px">Tap to turn it over</span></span></span>' +
    '<span class="bk"><span style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="chip">Today’s card</span><span data-a="keep" class="chip w" role="button" aria-label="Keep this card">' + (kept ? 'Kept' : 'Keep') + '</span></span><span style="font-size:19px;font-weight:300;line-height:1.3">' + esc(CARDS[ci]) + '</span></span></button>';
}

/* ---------------- Plan ---------------- */
function viewPlan() {
  var p = V.planTab, key = periodKey(p), list = tasksFor(p, key), t = today();
  var titles = { day: fmtLong(t), week: fmtMD(mondayOf(t)) + ' – ' + fmtMD(addDays(mondayOf(t), 6)), month: MONTHS[+t.slice(5, 7) - 1], year: t.slice(0, 4) };
  var ph = { day: 'Add a task for today', week: 'Add a task for this week', month: 'Add a task for this month', year: 'Add a goal for this year' };
  var h = topbar('Plan', null, '<a class="circle glass rp" href="#calendar" aria-label="Calendar">' + ic('cal', 20) + '</a>');
  h += '<div class="seg glass mt16">' + ['day', 'week', 'month', 'year'].map(function (k) { return '<button class="rp' + (k === p ? ' on' : '') + '" data-a="tab" data-v="' + k + '" aria-pressed="' + (k === p) + '">' + k.charAt(0).toUpperCase() + k.slice(1) + '</button>'; }).join('') + '</div>';
  h += '<form class="quick glass mt" data-f="quick"><label class="sr" for="qt">New task</label><input id="qt" name="t" placeholder="' + ph[p] + '" autocomplete="off" enterkeyhint="done"><button class="circle dark rp" style="width:44px;height:44px" aria-label="Add task">' + ic('plus', 20, 'stroke-width:2') + '</button></form>';
  var left = list.filter(function (x) { return !x.done; }).length;
  h += '<div class="label"><span>' + titles[p] + '</span><span>' + left + ' left</span></div>';
  h += '<div class="glass list">';
  if (!list.length) h += '<div class="empty">Nothing here yet. Add something above.</div>';
  list.forEach(function (x) {
    var sub = [x.time, x.date && x.date < t && !x.done ? 'From ' + relDay(x.date) : '', x.note].filter(Boolean).join(' · ');
    h += '<div class="row' + (x.done ? ' done' : '') + '"><button class="rp" data-a="toggle" data-id="' + x.id + '" aria-pressed="' + !!x.done + '" aria-label="Done">' + ck(x.done) + '</button><button class="b" data-a="edit" data-id="' + x.id + '"><span class="t1">' + esc(x.title) + '</span>' + (sub ? '<span class="t2">' + esc(sub) + '</span>' : '') + '</button></div>';
  });
  return h + '</div>';
}

/* ---------------- Calendar ---------------- */
function viewCalendar() {
  var mk = V.calMonth, y = +mk.slice(0, 4), m = +mk.slice(5, 7) - 1, first = new Date(y, m, 1), t = today();
  var start = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  var h = topbar(MONTHS[m] + ' <small>' + y + '</small>', 'plan', '<div style="display:flex;gap:6px"><button class="circle glass rp" style="width:44px;height:44px" data-a="mon" data-v="-1" aria-label="Previous month">' + ic('left', 18) + '</button><button class="circle glass rp" style="width:44px;height:44px" data-a="mon" data-v="1" aria-label="Next month">' + ic('chev', 18) + '</button></div>');
  h = h.replace('<h1>', '<h1 style="font-size:28px">');
  h += '<div class="glass mt16" style="padding:14px 10px 12px">' + monthGrid(false).replace(/<\/div>$/, '');
  h += '</div><div class="legend"><span><i style="background:rgba(150,205,180,.6)"></i>Events</span><span><i style="background:rgba(240,170,180,.6)"></i>Task due</span><span><i style="background:var(--lime)"></i>Today</span></div></div>';
  var sel = itemsOn(V.calSel);
  h += '<div class="glass list mt"><div class="label" style="margin:6px 10px 4px"><span>' + (V.calSel === t ? 'Today · ' : '') + fmtLong(V.calSel) + '</span><button class="chip rp" data-a="addOn" data-v="' + V.calSel + '">' + ic('plus', 14, 'stroke-width:2.2') + 'Add</button></div>';
  if (!sel.length) h += '<div class="empty">Nothing planned</div>';
  sel.forEach(function (x) {
    h += '<button class="row rp' + (x.done ? ' done' : '') + '" data-a="edit" data-id="' + x.id + '"><span style="width:48px;font-weight:300">' + (x.time || (x.type === 'task' ? 'Task' : 'All day')) + '</span><span class="b"><span class="t1" style="font-size:15px">' + esc(x.title) + '</span>' + (x.location ? '<span class="t2">' + esc(x.location) + '</span>' : '') + '</span></button>';
  });
  return h + '</div>';
}

/* ---------------- New ---------------- */
function viewNew() {
  var h = topbar('New', 'today');
  h += '<div class="glass mt16" style="padding:16px 20px"><label for="paste" style="display:block;font-size:13px;font-weight:300;color:var(--muted);margin-bottom:6px">Paste a message, notes or an email</label>' +
    '<textarea id="paste" data-in="newText" style="width:100%;min-height:96px;border:0;outline:0;resize:vertical;background:transparent;font-weight:300;line-height:1.5" placeholder="e.g. Dentist tomorrow at 2pm">' + esc(V.newText) + '</textarea>' +
    (V.newImage ? '<div style="position:relative;display:inline-block;margin-top:8px"><img src="' + V.newImage + '" alt="Attached picture" style="max-height:110px;border-radius:14px;display:block"><button class="circle dark" style="position:absolute;top:-8px;right:-8px;width:28px;height:28px" data-a="noImg" aria-label="Remove picture">' + ic('x', 14) + '</button></div>' : '') + '</div>';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-top:12px">' +
    '<button class="circle glass rp" style="width:54px;height:54px" data-a="paste" aria-label="Paste">' + ic('paste') + '</button>' +
    '<label class="circle glass rp" style="width:54px;height:54px;cursor:pointer" aria-label="Add a picture">' + ic('photo') + '<input type="file" accept="image/*" data-a="img" class="sr"></label>' +
    '<button class="circle glass rp" style="width:54px;height:54px" data-a="dictate" aria-label="Dictate">' + ic('mic') + '</button>' +
    '<button class="pill limebtn rp" style="flex:1;height:54px;font-weight:400" data-a="find"' + (V.busy ? ' disabled' : '') + '>' + (V.busy ? '<span class="spin"></span>Reading…' : ic('spark', 18) + 'Find events') + '</button></div>';
  if (V.found) {
    h += '<div class="label"><span>' + V.found.length + ' found</span><span>Tap to edit</span></div>';
    if (!V.found.length) h += '<div class="glass empty">Nothing to add from that. Try writing a date or a time.</div>';
    V.found.forEach(function (x, i) {
      var chips = [];
      if (x.date || x.time) chips.push((x.date ? fmtShort(x.date) : '') + (x.date && x.time ? ' · ' : '') + (x.time || ''));
      if (x.type === 'task') chips.push('Task');
      if (x.location) chips.push(x.location);
      h += '<div class="glass" style="display:flex;align-items:center;gap:12px;min-height:80px;padding:10px 12px 10px 10px;margin-bottom:8px;border-radius:40px">' +
        '<span class="aura ' + (x.type === 'task' ? 'a-coral' : 'a-sky') + '" style="width:56px;height:56px;border-radius:50%;display:grid;place-items:center;flex:none">' + ic(x.type === 'task' ? 'check' : 'cal', 20) + '</span>' +
        '<button class="b rp" style="flex:1;min-width:0;text-align:left" data-a="editFound" data-v="' + i + '"><span style="display:block;font-size:17px">' + esc(x.title) + '</span><span style="display:flex;gap:5px;margin-top:5px;flex-wrap:wrap">' + chips.map(function (c, j) { return '<span class="chip' + (j ? ' w' : '') + '">' + esc(c) + '</span>'; }).join('') + '</span></button>' +
        '<button class="circle rp" style="width:40px;height:40px" data-a="dropFound" data-v="' + i + '" aria-label="Remove">' + ic('x', 18) + '</button></div>';
    });
    if (V.found.length) h += '<button class="pill dark rp mt" data-a="saveFound">' + ic('check', 18, 'stroke-width:2.2') + 'Save ' + V.found.length + (V.found.length === 1 ? ' item' : ' items') + '</button>';
  } else {
    h += '<div class="label"><span>Or add one yourself</span></div><div class="grid2"><button class="pill glass rp" data-a="addOn" data-v="' + today() + '" data-t="event">' + ic('cal', 18) + 'Event</button><button class="pill glass rp" data-a="addOn" data-v="" data-t="task">' + ic('check', 18) + 'Task</button></div>';
    if (!S.settings.workerUrl) h += '<div class="sub" style="margin:14px 8px 0">Works offline for simple dates and times. For pictures and messy chats, set up AI in Me › Settings.</div>';
  }
  return h;
}

/* ---------------- Wellness ---------------- */
function viewWellness() {
  var t = today(), cs = currentSession(), bd = S.breath[t] || {}, sess = SESSIONS.filter(function (s) { return s[0] === cs; })[0];
  var mood = S.moods[t], ww = workoutWeek(t), slept = S.sleep[t] || S.sleep[addDays(t, -1)];
  var h = topbar('Wellness') + '<div class="sub">Small things, every day</div>';
  h += flipCard();
  h += '<a class="aura a-violet rp mt" href="#breathe" style="display:flex;align-items:center;gap:14px;min-height:156px;padding:18px 18px 18px 22px"><span style="flex:1;min-width:0"><span class="chip">' + sess[1] + (bd[cs] ? ' · done' : ' · next') + '</span><span style="display:block;font-size:26px;font-weight:200;margin-top:10px">Breathe</span><span style="display:block;font-size:13px;font-weight:300">' + BREATH[sess[2]].label + ' · 5 min</span>' +
    '<span style="display:flex;gap:6px;margin-top:12px">' + SESSIONS.map(function (s) { return '<i style="width:26px;height:5px;border-radius:5px;background:' + (bd[s[0]] ? '#fff' : 'rgba(255,255,255,.4)') + '"></i>'; }).join('') + '</span></span><span class="circle glass" style="width:66px;height:66px">' + ic('play') + '</span></a>';
  var bars = weekDates(t).map(function (d) { var e = S.sleep[d]; var m = e ? sleepMinutes(e) : 0; return '<i style="flex:1;height:' + Math.max(6, Math.min(100, m / 540 * 100)) + '%;border-radius:3px;background:' + (d === t ? '#fff' : e ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.2)') + '"></i>'; }).join('');
  var pct = Math.min(1, ww.mins / 150), C = 94.2;
  h += '<div class="grid2 mt">';
  h += '<a class="tile round aura ' + (mood ? MOOD_DOT[mood.mood] : 'a-sky') + ' rp" href="#mood" style="width:150px;height:150px"><span style="font-size:13px;font-weight:300">Mood</span>' + ic('wave', 34) + '<span style="font-size:22px;font-weight:200">' + (mood ? MOODS.filter(function (m) { return m[0] === mood.mood; })[0][1] : 'Check in') + '</span></a>';
  h += '<a class="tile aura a-night rp" href="#sleep" style="height:150px"><span class="t">Sleep</span><span style="display:flex;align-items:flex-end;gap:6px;height:28px">' + bars + '</span>' + big(slept ? dur(sleepMinutes(slept)) : 'Log') + '</a>';
  h += '<a class="tile aura a-gold rp" href="#pills" style="height:150px"><span class="t">Pills</span><span style="display:flex;gap:6px">' + S.pills.map(function (p) { return '<i style="width:12px;height:12px;border-radius:50%;' + ((S.pillLog[t] || {})[p.id] ? 'background:#fff' : 'border:1.5px solid #fff') + '"></i>'; }).join('') + '</span>' + big(S.pills.length ? pillsTaken(t) + ' of ' + S.pills.length : 'Add') + '</a>';
  h += '<a class="tile aura a-coral rp" href="#workout" style="height:150px"><span class="t"><span>Workout</span><svg width="38" height="38" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" style="fill:none;stroke:rgba(255,255,255,.35);stroke-width:3"/><circle cx="18" cy="18" r="15" transform="rotate(-90 18 18)" style="fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-dasharray:' + (pct * C).toFixed(1) + ' ' + C + '"/></svg></span>' + big(ww.mins, 'of 150 min') + '</a>';
  return h + '</div>';
}

/* ---------------- Breathe ---------------- */
function viewBreathe() {
  var b = V.br, t = BREATH[b.tech], done = S.breath[today()] || {};
  var h = topbar('Breathe', 'wellness', '<span class="glass" style="height:40px;padding:0 14px;border-radius:20px;display:flex;align-items:center;font-size:14px;font-weight:300">' + Math.round(b.total / 60) + ' min</span>');
  h += '<div style="display:flex;gap:6px;margin-top:16px">' + SESSIONS.map(function (s) {
    var on = s[0] === b.session;
    return '<button class="rp glass" data-a="sess" data-v="' + s[0] + '" aria-pressed="' + on + '" style="flex:1;height:56px;border-radius:28px;text-align:center;' + (on ? 'background:rgba(255,255,255,.34);border-color:rgba(255,255,255,.85)' : '') + '"><span style="display:block;font-size:15px">' + s[1] + '</span><span style="display:block;font-size:11.5px;font-weight:300;opacity:.85">' + (done[s[0]] ? 'Done' : S.settings.breathTimes[s[0]]) + '</span></button>';
  }).join('') + '</div>';
  h += '<div style="display:flex;gap:6px;margin-top:12px;justify-content:center">' + ['sigh', 'box', 'slow'].map(function (k) {
    var on = k === b.tech;
    return '<button class="rp" data-a="tech" data-v="' + k + '" aria-pressed="' + on + '" style="height:40px;padding:0 16px;border-radius:20px;font-size:14px;' + (on ? 'background:#fff;color:#3E3A5C' : 'background:rgba(255,255,255,.16);font-weight:300') + '">' + BREATH[k].label + '</button>';
  }).join('') + '</div>';
  h += '<div class="orbwrap"><div class="r1"></div><div class="r2"></div><div class="orb" id="orb" style="animation-name:' + t.anim + ';animation-duration:' + t.dur + 's;animation-play-state:' + (b.playing ? 'running' : 'paused') + '"></div></div>';
  h += '<div class="phase" id="phase" aria-live="polite">' + (b.playing ? t.ph[0][0] : b.left <= 0 ? 'Well done' : 'Ready when you are') + '</div>';
  h += '<div style="text-align:center;font-size:13.5px;font-weight:300;opacity:.92">' + t.desc + '</div>';
  h += '<div style="display:flex;justify-content:center;align-items:center;gap:22px;margin-top:22px"><span id="left" style="width:60px;text-align:right;font-size:15px;font-weight:300">' + Math.floor(b.left / 60) + ':' + pad(b.left % 60) + '</span>' +
    '<button class="circle rp" data-a="play" aria-label="' + (b.playing ? 'Pause' : 'Play') + '" style="width:80px;height:80px;background:#fff;color:#3E3A5C;box-shadow:0 0 40px rgba(255,255,255,.4)">' + ic(b.playing ? 'pause' : 'play', 26) + '</button>' +
    '<button class="rp" data-a="brDone" style="width:60px;font-size:14px;font-weight:300;text-align:left">' + (done[b.session] ? 'Done' : 'Finish') + '</button></div>';
  return h;
}

/* ---------------- Mood ---------------- */
function viewMood() {
  var t = today(), cur = V.moodPick || (S.moods[t] || {}).mood;
  var h = topbar('Mood', 'wellness') + '<h2 style="margin:18px 0 0;font-weight:300;font-size:26px">How are you feeling?</h2>';
  h += '<div class="grid2" style="margin-top:14px;gap:10px">' + MOODS.map(function (m, i) {
    var on = m[0] === cur;
    return '<button class="rp" data-a="pickMood" data-v="' + m[0] + '" aria-pressed="' + on + '" style="height:80px;border-radius:40px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:0 24px;transition:.3s;' + (on ? 'background:rgba(255,255,255,.34);border:1px solid rgba(255,255,255,.85)' : 'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.5)') + '"><span style="font-size:12px;font-weight:300;opacity:.85">0' + (i + 1) + '</span><span style="font-size:18px">' + m[1] + '</span></button>';
  }).join('') + '</div>';
  var wk = weekDates(t), counts = {};
  wk.forEach(function (d) { var e = S.moods[d]; if (e) counts[e.mood] = (counts[e.mood] || 0) + 1; });
  var most = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
  h += '<div class="glass mt" style="padding:14px 16px"><div class="label" style="margin:0"><span>This week</span><span>' + (most ? 'Mostly ' + most : 'No check-ins yet') + '</span></div><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));margin-top:10px;text-align:center">' +
    wk.map(function (d) { var e = d === t && cur ? { mood: cur } : S.moods[d]; return '<span style="display:flex;flex-direction:column;align-items:center;gap:6px"><i style="width:' + (d === t ? 22 : 18) + 'px;height:' + (d === t ? 22 : 18) + 'px;border-radius:50%;' + (e ? 'background:' + MOOD_TINT[e.mood] + ';box-shadow:0 0 12px ' + MOOD_TINT[e.mood] : 'border:1.5px dashed rgba(255,255,255,.55)') + '"></i><span style="font-size:11.5px;font-weight:300">' + DOW[parseYmd(d).getDay()].charAt(0) + '</span></span>'; }).join('') + '</div></div>';
  h += '<div class="glass mt" style="padding:14px 18px"><label for="mnote" style="display:block;font-size:13px;font-weight:300;margin-bottom:6px">Anything on your mind?</label><textarea id="mnote" style="width:100%;height:64px;border:0;outline:0;resize:none;background:transparent;font-weight:300" placeholder="Write a few words, or leave it empty">' + esc((S.moods[t] || {}).note || '') + '</textarea></div>';
  h += '<button class="pill rp mt" data-a="saveMood" style="background:#fff;color:#3E3A5C"' + (cur ? '' : ' disabled') + '>' + ic('check', 18, 'stroke-width:2.2') + 'Save check-in</button>';
  if (cur === 'stressed') h += '<a class="pill glass rp mt" href="#breathe">' + ic('wind', 18) + 'Take a 5 minute breath</a>';
  return h;
}

/* ---------------- Sleep ---------------- */
function viewSleep() {
  var t = today(), e = S.sleep[t] || {}, wk = weekDates(t), H = 140;
  var h = topbar('Sleep', 'wellness');
  var m = e.bed && e.wake ? sleepMinutes(e) : 0;
  h += '<form class="aura a-night mt16" data-f="sleep" style="display:block;padding:16px 16px 18px"><span class="chip">Last night</span><div style="display:flex;gap:8px;margin-top:12px">' +
    '<label class="rp" style="flex:1;height:56px;border-radius:28px;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:space-between;padding:0 16px"><span style="font-size:13px;font-weight:300;display:flex;gap:5px;align-items:center">' + ic('moon', 14) + 'Bed</span><input type="time" name="bed" value="' + (e.bed || '23:00') + '" style="border:0;background:transparent;color:#fff;font-size:18px;font-weight:300;width:96px;text-align:right;-webkit-appearance:none;appearance:none"></label>' +
    '<label class="rp" style="flex:1;height:56px;border-radius:28px;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:space-between;padding:0 16px"><span style="font-size:13px;font-weight:300;display:flex;gap:5px;align-items:center">' + ic('sun', 14) + 'Woke</span><input type="time" name="wake" value="' + (e.wake || '07:00') + '" style="border:0;background:transparent;color:#fff;font-size:18px;font-weight:300;width:96px;text-align:right;-webkit-appearance:none;appearance:none"></label></div>' +
    '<div style="display:flex;align-items:center;gap:10px;margin-top:12px;padding-left:4px"><span style="flex:1"><span style="display:block;font-size:38px;font-weight:200;line-height:1">' + (m ? dur(m) : '–') + '</span><span style="font-size:13px;font-weight:300">' + (m ? (m >= 420 ? 'Good, 7 hours or more' : dur(420 - m).replace('0h ', '') + ' under 7 hours') : 'Set your times and save') + '</span></span><button class="chip w rp" style="height:40px;padding:0 16px;border-radius:20px;font-size:14px">' + (m ? 'Update' : 'Save') + '</button></div></form>';
  var logged = wk.filter(function (d) { return S.sleep[d]; }), mins = logged.map(function (d) { return sleepMinutes(S.sleep[d]); });
  var avg = mins.length ? mins.reduce(function (a, b) { return a + b; }, 0) / mins.length : 0;
  var lb = Math.round(7 / 9 * H);
  h += '<div class="glass mt" style="padding:14px 16px 12px"><div class="label" style="margin:0"><span>This week</span><span>' + (mins.length ? 'Average ' + dur(avg) : 'No nights logged') + '</span></div><div style="position:relative;height:' + H + 'px;margin-top:24px"><div style="position:absolute;left:0;right:0;bottom:' + lb + 'px;border-top:1.5px dashed rgba(43,38,35,.35)"></div><span class="chip" style="position:absolute;right:0;bottom:' + (lb + 4) + 'px;height:20px;padding:0 7px;font-size:10.5px">7h</span><div style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr))">' +
    wk.map(function (d) { var x = S.sleep[d]; var mm = x ? sleepMinutes(x) : 0; return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;height:100%"><span style="font-size:10.5px;font-weight:300;opacity:' + (mm ? 1 : 0) + '">' + Math.floor(mm / 60) + 'h</span><i class="' + (mm ? (d === t ? 'dotA a-night' : mm >= 420 ? 'dotA a-violet' : '') : '') + '" style="width:24px;height:' + (mm ? Math.min(H - 18, Math.round(mm / 540 * H)) : 8) + 'px;border-radius:12px;' + (mm ? (mm < 420 && d !== t ? 'background:linear-gradient(180deg,#D9D0F7,#BDB2EC)' : '') : 'border:1.5px dashed rgba(43,38,35,.25)') + '"></i></div>'; }).join('') +
    '</div></div><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));text-align:center;font-size:12px;font-weight:300;color:var(--muted);margin-top:6px">' + wk.map(function (d) { return '<span' + (d === t ? ' style="color:var(--ink);font-weight:500"' : '') + '>' + DOW[parseYmd(d).getDay()].charAt(0) + '</span>'; }).join('') + '</div></div>';
  var verdict = sleepVerdict(logged, mins);
  h += '<div class="glass mt" style="padding:4px 18px"><div style="padding:12px 0;border-bottom:1px solid var(--line)"><div style="font-size:15px">Hours</div><div class="sub" style="margin-top:2px">' + verdict[0] + '</div></div><div style="padding:12px 0"><div style="font-size:15px">Bedtime</div><div class="sub" style="margin-top:2px">' + verdict[1] + '</div></div></div>';
  return h + '<div class="sub" style="margin:8px 6px 0;font-size:11px">Based on American Academy of Sleep Medicine guidance. Not medical advice.</div>';
}
function sleepVerdict(logged, mins) {
  if (!mins.length) return ['Log your sleep for a few nights to see how it’s going. Adults need 7 or more hours on a regular basis.', 'Going to bed around the same time each night helps.'];
  var under = mins.filter(function (m) { return m < 420; }).length;
  var a = under === 0 ? 'You got 7 hours or more every night you logged. Nice.' : 'Under 7 hours on ' + under + ' of ' + mins.length + ' nights. Adults need 7 or more on a regular basis.';
  var beds = logged.map(function (d) { var b = toMin(S.sleep[d].bed); return b < 720 ? b + 1440 : b; });
  var spread = beds.length > 1 ? Math.max.apply(null, beds) - Math.min.apply(null, beds) : 0;
  var b = beds.length < 2 ? 'Log a few more nights to see how steady your bedtime is.' : spread <= 45 ? 'Your bedtime is steady, within ' + spread + ' min. Keep it up.' : 'Your bedtime moved by about ' + dur(spread).replace('0h ', '') + '. A steady bedtime helps.';
  return [a, b];
}

/* ---------------- Pills ---------------- */
function viewPills() {
  var t = today(), log = S.pillLog[t] || {}, wk = weekDates(t);
  var h = topbar('Pills', 'wellness', '<button class="circle glass rp" data-a="addPill" aria-label="Add a pill">' + ic('plus', 20, 'stroke-width:2') + '</button>');
  h += '<div class="glass" style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding:12px 18px"><span><span class="sub" style="display:block;margin:0">Today</span><span style="font-size:24px;font-weight:200">' + pillsTaken(t) + ' of ' + S.pills.length + ' taken</span></span><span style="display:flex;gap:6px">' +
    wk.map(function (d) { var n = S.pills.length, k = n ? pillsTaken(d) / n : 0, fut = d > t; return '<span style="display:flex;flex-direction:column;align-items:center;gap:3px"><i style="width:12px;height:12px;border-radius:50%;' + (fut || !n ? 'border:1.5px dashed rgba(43,38,35,.3)' : k >= 1 ? 'background:var(--ink)' : k > 0 ? 'background:linear-gradient(90deg,var(--ink) 50%,rgba(43,38,35,.15) 50%)' : 'border:1.5px solid var(--ink)') + (d === t ? ';box-shadow:0 0 0 3px var(--lime)' : '') + '"></i><span style="font-size:10px;font-weight:300;color:var(--muted)">' + DOW[parseYmd(d).getDay()].charAt(0) + '</span></span>'; }).join('') + '</span></div>';
  if (!S.pills.length) h += '<div class="glass empty mt">Add the pills you take each day. Afaire will remind you at the right time.</div><button class="pill dark rp mt" data-a="addPill">' + ic('plus', 18, 'stroke-width:2') + 'Add a pill</button>';
  SLOTS.forEach(function (sl) {
    var ps = S.pills.filter(function (p) { return p.slot === sl[0]; }).sort(function (a, b) { return a.time < b.time ? -1 : 1; });
    if (!ps.length || !S.pills.length) return;
    h += '<div class="label" style="margin:14px 10px 6px"><span>' + sl[1] + '</span><span>' + (S.settings.push ? 'Reminder on' : '') + '</span></div>';
    ps.forEach(function (p) {
      var on = !!log[p.id], c = PILL_COLORS[p.color % PILL_COLORS.length];
      h += '<div class="pcap glass' + (on ? ' on' : '') + '"><button class="capw rp" data-a="takePill" data-id="' + p.id + '" aria-pressed="' + on + '" aria-label="' + (on ? p.name + ', taken' : 'Mark ' + p.name + ' as taken') + '" style="--c1:' + c[0] + ';--c2:' + c[1] + ';border-radius:20px"><span class="cap' + (V.popped === p.id && on ? ' pop' : '') + '"><span class="half"></span><span class="liq"></span><span class="seam"></span><span class="shine"></span></span><span class="badge">' + ic('check') + '</span></button>' +
        '<button class="b" data-a="editPill" data-id="' + p.id + '" style="flex:1;min-width:0;text-align:left"><span style="display:flex;align-items:center;gap:8px"><span class="chip">' + esc(p.name) + '</span><span style="font-size:12px;font-weight:300;color:var(--muted)">' + p.time + '</span></span>' + (p.how ? '<span style="display:block;font-size:12px;font-weight:300;color:var(--muted);margin-top:6px">' + esc(p.how) + '</span>' : '') + '<span style="display:block;font-size:22px;font-weight:200;line-height:1.1;margin-top:' + (p.how ? 0 : 6) + 'px">' + esc(p.dose) + '</span></button></div>';
    });
  });
  return h;
}

/* ---------------- Workout ---------------- */
var WTYPES = ['Walk', 'Run', 'Yoga', 'Strength', 'Cycling', 'Swim', 'Pilates', 'Dance', 'Sport', 'Other'];
function viewWorkout() {
  var t = today(), ww = workoutWeek(t), C = 2 * Math.PI * 50, pct = Math.min(1, ww.mins / 150);
  var h = topbar('Workout', 'wellness');
  h += '<div class="aura a-coral mt16" style="display:flex;align-items:center;gap:18px;padding:18px"><svg width="124" height="124" viewBox="0 0 124 124" aria-hidden="true" style="flex:none"><circle cx="62" cy="62" r="50" style="fill:none;stroke:rgba(255,255,255,.35);stroke-width:7"/><circle cx="62" cy="62" r="50" transform="rotate(-90 62 62)" style="fill:none;stroke:#fff;stroke-width:7;stroke-linecap:round;stroke-dasharray:' + (pct * C).toFixed(1) + ' ' + C.toFixed(1) + ';transition:stroke-dasharray .8s"/><text x="62" y="62" text-anchor="middle" style="fill:#fff;font-family:Outfit,sans-serif;font-size:32px;font-weight:200">' + ww.mins + '</text><text x="62" y="82" text-anchor="middle" style="fill:#fff;font-family:Outfit,sans-serif;font-size:11px;font-weight:300">of 150 min</text></svg>' +
    '<div style="min-width:0"><span class="chip">This week</span><div style="font-size:14px;font-weight:300;margin-top:10px">' + (ww.mins >= 150 ? 'Goal reached. Well done.' : (150 - ww.mins) + ' min to go.') + '<br>Strength ' + Math.min(ww.strengthDays, 2) + ' of 2 days.</div><div style="font-size:11px;font-weight:300;opacity:.9;margin-top:8px">WHO suggests 150 to 300 min of moderate activity a week.</div></div></div>';
  var perDay = ww.dates.map(function (d) { return S.workouts.filter(function (w) { return w.date === d; }).reduce(function (a, w) { return a + (+w.minutes || 0); }, 0); });
  var maxM = Math.max(60, Math.max.apply(null, perDay));
  h += '<div class="glass mt" style="padding:14px 16px 12px"><div class="label" style="margin:0"><span>Active days</span><span>' + perDay.filter(Boolean).length + ' of 7</span></div><div style="height:84px;margin-top:8px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr))">' +
    perDay.map(function (m, i) { var d = ww.dates[i]; return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;height:100%"><span style="font-size:10.5px;font-weight:300;opacity:' + (m ? 1 : 0) + '">' + m + '</span><i class="' + (m ? 'dotA a-coral' : '') + '" style="width:22px;height:' + (m ? Math.max(10, Math.round(m / maxM * 60)) : 8) + 'px;border-radius:11px;' + (m ? '' : d === t ? 'background:var(--lime)' : 'border:1.5px dashed rgba(43,38,35,.25)') + '"></i></div>'; }).join('') +
    '</div><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));text-align:center;font-size:12px;font-weight:300;color:var(--muted);margin-top:6px">' + ww.dates.map(function (d) { return '<span' + (d === t ? ' style="color:var(--ink);font-weight:500"' : '') + '>' + DOW[parseYmd(d).getDay()].charAt(0) + '</span>'; }).join('') + '</div></div>';
  var recent = S.workouts.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 4);
  h += '<div class="glass list mt"><div class="label" style="margin:6px 10px 2px"><span>Logged</span></div>' + (recent.length ? '' : '<div class="empty">No workouts yet this week</div>') +
    recent.map(function (w) { return '<button class="row rp" data-a="editWork" data-id="' + w.id + '" style="min-height:50px"><span style="width:44px;font-size:13px;font-weight:300;color:var(--muted)">' + relDay(w.date).replace('Yesterday', 'Yest.') + '</span><span class="b" style="font-size:15.5px">' + esc(w.type) + '</span><span style="font-size:14px;font-weight:300">' + w.minutes + ' min</span></button>'; }).join('') + '</div>';
  return h + '<button class="pill dark rp mt" data-a="addWork">' + ic('plus', 18, 'stroke-width:2') + 'Log a workout</button>';
}

/* ---------------- Me ---------------- */
function viewMe() {
  var saved = S.wishes.reduce(function (a, w) { return a + (+w.saved || 0); }, 0), cols = ['gold', 'coral', 'sky', 'violet', 'teal'];
  var h = topbar('Me', null, '<a class="circle glass rp" href="#settings" aria-label="Settings">' + ic('gear', 20) + '</a>');
  h += '<div class="label"><span>Wishlist</span><span>' + (S.wishes.length ? 'Saved ' + baht(saved) : '') + '</span></div>';
  if (!S.wishes.length) h += '<div class="glass empty">Things you’re saving up for. Add the price and how much you’ve put aside.</div>';
  S.wishes.forEach(function (w, i) {
    var pct = w.price ? Math.min(100, Math.round(w.saved / w.price * 100)) : 0, ready = w.price && w.saved >= w.price;
    h += '<button class="aura a-' + cols[i % cols.length] + ' rp" data-a="editWish" data-id="' + w.id + '" style="display:block;width:100%;padding:14px 20px;margin-bottom:8px;text-align:left"><span style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><span style="font-size:17px">' + esc(w.name) + '</span><span style="font-size:15px;font-weight:300">' + baht(w.price) + '</span></span><span class="bar" style="display:block"><i style="width:' + pct + '%"></i></span>' +
      '<span style="display:flex;justify-content:space-between;align-items:center;margin-top:7px"><span style="font-size:12.5px;font-weight:300">' + (ready ? 'All saved' : baht(w.saved) + ' saved · ' + baht(w.price - w.saved) + ' to go') + '</span>' + (ready ? '<span class="chip" style="height:22px">Ready</span>' : '') + '</span></button>';
  });
  h += '<button class="pill glass rp" data-a="addWish" style="height:54px">' + ic('plus', 18, 'stroke-width:2') + 'Add to wishlist</button>';
  function mrow(href, icon, label, val) { return '<a class="row rp" href="#' + href + '" style="min-height:52px">' + ic(icon, 20) + '<span class="b" style="font-size:15.5px">' + label + '</span><span class="sub" style="margin:0">' + val + '</span>' + ic('chev', 16) + '</a>'; }
  h += '<div class="glass list mt">' + mrow('cards', 'cards', 'Cards you kept', S.kept.length) + mrow('settings', 'bell', 'Reminders', S.settings.push ? 'On' : 'Off') + mrow('settings', 'gear', 'Settings', '') + '</div>';
  return h;
}
function viewCards() {
  var h = topbar('Cards you kept', 'me');
  if (!S.kept.length) h += '<div class="glass empty mt16">Turn over today’s card on the Today screen and tap Keep to save it here.</div>';
  S.kept.slice().reverse().forEach(function (i) { h += '<div class="aura a-violet mt" style="padding:20px 22px;font-size:18px;font-weight:300;line-height:1.35;display:flex;gap:12px;align-items:flex-start"><span style="flex:1">' + esc(CARDS[i]) + '</span><button class="rp" data-a="unkeep" data-v="' + i + '" aria-label="Remove">' + ic('x', 18) + '</button></div>'; });
  return h;
}

/* ---------------- Settings ---------------- */
function viewSettings() {
  var st = S.settings, perm = ('Notification' in window) ? Notification.permission : 'unsupported';
  var h = topbar('Settings', 'me');
  h += '<div class="label"><span>Reminders</span><span>' + (st.push ? 'On' : 'Off') + '</span></div><div class="glass" style="padding:16px 18px">';
  if (!isStandalone()) h += '<div class="sub" style="margin:0 0 10px">To get reminders on iPhone, open Afaire in Safari, tap Share, then Add to Home Screen, and open it from there.</div>';
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill dark rp" style="flex:1;height:50px" data-a="push">' + ic('bell', 18) + (st.push ? 'Reminders are on' : 'Turn on reminders') + '</button>' + (st.push ? '<button class="pill glass rp" style="flex:0 0 auto;width:auto;padding:0 18px;height:50px" data-a="testPush">Test</button>' : '') + '</div>';
  h += '<div class="sub" style="margin:8px 4px 0">Notifications: ' + perm + '</div>';
  h += '<form data-f="prefs" style="margin-top:14px"><label class="field"><span>Remind me before events</span><select class="inp" name="eventRemind">' + [[-1, 'Off'], [0, 'At the time'], [10, '10 min before'], [15, '15 min before'], [30, '30 min before'], [60, '1 hour before'], [120, '2 hours before']].map(function (o) { return '<option value="' + o[0] + '"' + (+st.eventRemind === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
    '<label class="field" style="display:flex;align-items:center;justify-content:space-between;gap:10px"><span style="margin:0">Breathing reminders</span><input type="checkbox" name="breathRemind"' + (st.breathRemind ? ' checked' : '') + ' style="width:24px;height:24px;accent-color:#2B2623"></label>' +
    '<div class="two" style="grid-template-columns:1fr 1fr 1fr">' + SESSIONS.map(function (s) { return '<label class="field"><span>' + s[1] + '</span><input class="inp" type="time" name="bt_' + s[0] + '" value="' + st.breathTimes[s[0]] + '"></label>'; }).join('') + '</div>' +
    '<button class="pill glass rp" style="height:50px">Save</button></form></div>';
  h += '<div class="label"><span>AI and server</span><span>' + (st.workerUrl ? 'Connected' : 'Not set up') + '</span></div><form class="glass" data-f="server" style="padding:16px 18px">' +
    '<label class="field"><span>Server address</span><input class="inp" name="workerUrl" type="url" inputmode="url" autocapitalize="off" placeholder="https://afaire.your-name.workers.dev" value="' + esc(st.workerUrl) + '"></label>' +
    '<label class="field"><span>App password (if you set one)</span><input class="inp" name="token" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" value="' + esc(st.token) + '"></label>' +
    '<div style="display:flex;gap:8px"><button class="pill dark rp" style="flex:1;height:50px">Save</button><button type="button" class="pill glass rp" style="flex:1;height:50px" data-a="testServer">Check</button></div>' +
    '<div class="sub" style="margin:10px 4px 0">The setup guide is in the README on GitHub.</div></form>';
  h += '<div class="label"><span>Your data</span><span>Stays on this phone</span></div><div class="glass" style="padding:14px 18px;display:flex;gap:8px;flex-wrap:wrap">' +
    '<button class="pill glass rp" style="flex:1;height:50px" data-a="export">' + ic('dl', 18) + 'Back up</button><label class="pill glass rp" style="flex:1;height:50px;cursor:pointer">Restore<input type="file" accept="application/json" class="sr" data-a="import"></label>' +
    '<div class="sub" style="flex-basis:100%;text-align:center;margin:2px 0 0">Afaire version ' + APP_VERSION + '</div><button class="pill rp" style="flex-basis:100%;height:46px;color:#B3413B;font-size:14px" data-a="wipe">' + (V.wipe ? 'Tap again to delete everything' : 'Delete all data') + '</button></div>';
  return h;
}

var ROUTES = {
  today: [viewToday, 'f', 'Today'], plan: [viewPlan, 'b', 'Plan'], calendar: [viewCalendar, 'b', 'Plan'], 'new': [viewNew, 'b', 'Add'],
  wellness: [viewWellness, '', 'Wellness'], me: [viewMe, '', 'Me'], cards: [viewCards, '', 'Me'], settings: [viewSettings, 'b', 'Me'],
  breathe: [viewBreathe, 'c', null], mood: [viewMood, 'c', null], sleep: [viewSleep, '', null], pills: [viewPills, 'b', null], workout: [viewWorkout, '', null]
};
var TABS = [['Today', 'sun', 'today'], ['Plan', 'plan', 'plan'], ['Add', 'plus', 'new'], ['Wellness', 'leaf', 'wellness'], ['Me', 'me', 'me']];
function navHTML(active) {
  return TABS.map(function (t) {
    if (t[1] === 'plus') return '<a class="add dark rp" href="#new" aria-label="Add"' + (active === 'Add' ? ' aria-current="page"' : '') + '>' + ic('plus', 24, 'stroke-width:2') + '</a>';
    var on = t[0] === active;
    return '<a class="rp ' + (on ? 'on' : 'glass') + '" href="#' + t[2] + '" aria-label="' + t[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(t[1]) + '</a>';
  }).join('');
}
