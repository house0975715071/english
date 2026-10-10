// 小工具：洗牌、挑干擾選項、日期鍵、HTML 跳脫。純邏輯，node 測試可以直接跑。

export function shuffle(list, rng = Math.random) {
  const a = Array.from(list);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom(list, rng = Math.random) {
  if (!list.length) return undefined;
  return list[Math.floor(rng() * list.length)];
}

/**
 * 從 pool 裡挑 n 個跟 correct 不同的干擾項。
 * keyFn 決定「怎樣算同一個」（預設比 id）；另外英文或中文一樣的也不挑，免得兩個選項都對。
 */
export function pickDistractors(pool, correct, n, { rng = Math.random, keyFn = (x) => x.id } = {}) {
  const ck = keyFn(correct);
  const seenEn = new Set([norm(correct.en)]);
  const seenZh = new Set([norm(correct.zh)]);
  const out = [];
  for (const item of shuffle(pool, rng)) {
    if (out.length >= n) break;
    if (keyFn(item) === ck) continue;
    const en = norm(item.en), zh = norm(item.zh);
    if (seenEn.has(en) || seenZh.has(zh)) continue;
    seenEn.add(en);
    seenZh.add(zh);
    out.push(item);
  }
  return out;
}

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

/** 本機日期鍵 YYYY-MM-DD（用裝置的時區，不用 UTC，免得晚上 11 點玩算成明天） */
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(keyA, keyB) {
  const a = parseKey(keyA), b = parseKey(keyB);
  if (!a || !b) return NaN;
  return Math.round((b - a) / 86400000);
}

function parseKey(k) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(k || ''));
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function uid(prefix = 'p') {
  const t = Date.now().toString(36);
  const r = Math.floor(Math.random() * 1e8).toString(36);
  return `${prefix}_${t}${r}`;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
