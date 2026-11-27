/*
 * Afaire server: Cloudflare Worker (free plan)
 * - POST /parse  : send text or a picture to Gemini and get appointments/tasks back
 * - GET  /vapid  : public key for Web Push (created on first use, kept in KV)
 * - POST /sync   : store this phone's push subscription and upcoming reminders
 * - POST /test   : send a test notification right away
 * - cron (every minute): send reminders that are due
 *
 * Needs: KV namespace bound as AFAIRE, secret GEMINI_API_KEY,
 * optional secret APP_TOKEN, optional vars GEMINI_MODEL and VAPID_SUBJECT.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Afaire-Token',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const authed = !env.APP_TOKEN || request.headers.get('X-Afaire-Token') === env.APP_TOKEN;

    try {
      if (path === '/' || path === '/health') {
        return json({
          ok: true,
          app: 'afaire',
          authed,
          ai: !!env.GEMINI_API_KEY,
          kv: !!env.AFAIRE,
          model: env.GEMINI_MODEL || DEFAULT_MODEL,
        });
      }
      if (!authed) return json({ error: 'รหัสผ่านแอป (APP_TOKEN) ไม่ตรง' }, 401);

      if (path === '/parse' && request.method === 'POST') {
        return json(await parse(await request.json(), env));
      }
      if (!env.AFAIRE) return json({ error: 'ยังไม่ได้ผูก KV ชื่อ AFAIRE' }, 500);

      if (path === '/vapid') {
        const v = await getVapid(env);
        return json({ key: v.publicKey });
      }
      if (path === '/sync' && request.method === 'POST') {
        const body = await request.json();
        if (!body.sub || !body.sub.endpoint) return json({ error: 'missing subscription' }, 400);
        const state = await loadState(env);
        const id = await hashId(body.sub.endpoint);
        const now = Date.now();
        const reminders = (Array.isArray(body.reminders) ? body.reminders : [])
          .filter((r) => r && r.at && r.at > now - 60_000)
          .slice(0, 400)
          .map((r) => ({
            id: String(r.id).slice(0, 80),
            at: Number(r.at),
            title: String(r.title || '').slice(0, 120),
            body: String(r.body || '').slice(0, 200),
          }));
        state.subs[id] = { sub: body.sub, reminders, updated: now };
        await saveState(env, state);
        return json({ ok: true, count: reminders.length });
      }
      if (path === '/test' && request.method === 'POST') {
        const body = await request.json();
        if (!body.sub || !body.sub.endpoint) return json({ error: 'missing subscription' }, 400);
        const res = await sendPush(env, body.sub, {
          title: 'Afaire',
          body: 'การแจ้งเตือนใช้งานได้แล้ว 🎉',
          tag: 'test',
        });
        return json({ ok: res.ok, status: res.status, detail: res.ok ? '' : await res.text() });
      }
      return json({ error: 'not found' }, 404);
    } catch (err) {
      return json({ error: String((err && err.message) || err) }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDue(env));
  },
};

/* ---------------- reminders ---------------- */

async function loadState(env) {
  const s = await env.AFAIRE.get('state', 'json');
  return s && s.subs ? s : { subs: {} };
}
async function saveState(env, state) {
  await env.AFAIRE.put('state', JSON.stringify(state));
}

async function sendDue(env) {
  if (!env.AFAIRE) return;
  const state = await loadState(env);
  const now = Date.now();
  let changed = false;
  for (const [id, entry] of Object.entries(state.subs)) {
    const due = entry.reminders.filter((r) => r.at <= now + 20_000);
    if (!due.length) continue;
    entry.reminders = entry.reminders.filter((r) => r.at > now + 20_000);
    changed = true;
    // Old reminders (phone was offline, worker was down) are dropped, not sent late.
    const fresh = due.filter((r) => r.at > now - 6 * 3600_000);
    const batch =
      fresh.length > 3
        ? [{ id: 'many', title: `มี ${fresh.length} รายการถึงเวลาแล้ว`, body: fresh.map((r) => r.title).join(' · ').slice(0, 180) }]
        : fresh;
    for (const r of batch) {
      const res = await sendPush(env, entry.sub, { title: r.title, body: r.body, tag: r.id });
      if (res.status === 404 || res.status === 410) {
        delete state.subs[id];
        break;
      }
    }
  }
  if (changed) await saveState(env, state);
}

/* ---------------- AI parsing ---------------- */

const DEFAULT_MODEL = 'gemini-flash-lite-latest';

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          type: { type: 'STRING', enum: ['event', 'task'] },
          title: { type: 'STRING' },
          date: { type: 'STRING', description: 'YYYY-MM-DD (Gregorian) or empty' },
          time: { type: 'STRING', description: 'HH:MM 24h or empty' },
          end_time: { type: 'STRING', description: 'HH:MM 24h or empty' },
          location: { type: 'STRING' },
          note: { type: 'STRING' },
        },
        required: ['type', 'title', 'date', 'time'],
      },
    },
  },
  required: ['items'],
};

async function parse(body, env) {
  if (!env.GEMINI_API_KEY) throw new Error('ยังไม่ได้ใส่ GEMINI_API_KEY');
  const text = String(body.text || '').slice(0, 8000);
  const now = String(body.now || new Date().toISOString());
  const tz = String(body.tz || 'Asia/Bangkok');
  if (!text && !body.image) return { items: [] };

  const instructions = [
    'You turn messy notes, chat messages or screenshots into calendar events and to-do tasks.',
    `Current local date-time: ${now} (time zone ${tz}). Resolve relative dates (พรุ่งนี้, มะรืน, วันศุกร์นี้, next Monday, อาทิตย์หน้า) from it.`,
    'Thai years in พ.ศ. (e.g. 2569) must be converted to ค.ศ. by subtracting 543.',
    'Thai clock words: "บ่าย 2" = 14:00, "4 โมงเย็น" = 16:00, "2 ทุ่ม" = 20:00, "ตี 2" = 02:00, "เที่ยง" = 12:00, "10 โมง" = 10:00, "6 โมงเช้า" = 06:00.',
    'type "event" = something that happens at a specific date and time (meeting, appointment, flight, class, นัด). type "task" = something to do (ต้องทำ, ซื้อ, ส่ง, จ่าย), possibly with a due date.',
    'Keep titles short and in the same language as the input. Put place in location and extra details in note.',
    'One appointment is often written over several lines (title, then lines like วัน:, เวลา:, สถานที่:, ลิงค์:). That is ONE event, not several: merge the lines, put links and other details in note.',
    'If a date has no year, choose the next upcoming occurrence. Leave date or time empty when unknown. Return an empty list if nothing is actionable.',
  ].join('\n');

  const parts = [];
  if (text) parts.push({ text });
  if (body.image && typeof body.image === 'string') {
    const m = body.image.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i);
    if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
  }

  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
        },
      }),
    }
  );
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }
  const data = await res.json();
  const out = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch {
    throw new Error('AI ตอบกลับมาในรูปแบบที่อ่านไม่ได้');
  }
  const items = (parsed.items || []).map((it) => ({
    type: it.type === 'event' ? 'event' : 'task',
    title: String(it.title || '').trim(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(it.date || '') ? it.date : '',
    time: normTime(it.time),
    endTime: normTime(it.end_time),
    location: String(it.location || '').trim(),
    note: String(it.note || '').trim(),
  })).filter((it) => it.title);
  return { items, model };
}

function normTime(t) {
  const m = String(t || '').match(/^(\d{1,2})[:.](\d{1,2})/);
  if (!m || +m[1] > 23 || +m[2] > 59) return '';
  return m[1].padStart(2, '0') + ':' + m[2].padStart(2, '0');
}

/* ---------------- Web Push (RFC 8291 + VAPID RFC 8292) ---------------- */

const enc = new TextEncoder();

export function b64u(bytes) {
  let s = '';
  const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64u(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function concat(...arrs) {
  const len = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const a of arrs) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}
async function hashId(s) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return b64u(d).slice(0, 22);
}

async function getVapid(env) {
  let v = await env.AFAIRE.get('vapid', 'json');
  if (v && v.privateJwk && v.publicKey) return v;
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const privateJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const publicKey = b64u(await crypto.subtle.exportKey('raw', kp.publicKey));
  v = { privateJwk, publicKey };
  await env.AFAIRE.put('vapid', JSON.stringify(v));
  return v;
}

export async function vapidHeader(vapid, endpoint, subject) {
  const aud = new URL(endpoint).origin;
  const header = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const key = await crypto.subtle.importKey('jwk', vapid.privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${header}.${claims}`));
  return `vapid t=${header}.${claims}.${b64u(sig)}, k=${vapid.publicKey}`;
}

async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8);
  return new Uint8Array(bits);
}

export async function encryptPayload(sub, payload) {
  const uaPublic = unb64u(sub.keys.p256dh);
  const authSecret = unb64u(sub.keys.auth);
  const local = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', local.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, local.privateKey, 256));

  const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, ecdh, keyInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const plain = concat(enc.encode(payload), new Uint8Array([2]));
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, plain));

  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, cipher);
}

async function sendPush(env, sub, message) {
  const vapid = await getVapid(env);
  const subject = env.VAPID_SUBJECT || 'mailto:afaire@users.noreply.github.com';
  const body = await encryptPayload(sub, JSON.stringify(message));
  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidHeader(vapid, sub.endpoint, subject),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      Urgency: 'high',
    },
    body,
  });
}
