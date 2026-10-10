// 進度儲存：小孩（最多 4 個）、設定、每題最佳星數、每個模式最佳輪次、主題徽章、今日任務三個圈、蛋與貼紙階梯、
// 複習盒（Leitner 五盒）、我會說的句子、家長區看的辨識紀錄（只有文字，沒有聲音）。
// 全部存在這台裝置的 localStorage（沒有帳號、不上傳）。storage 可以換掉，所以 node 測試能跑。
//
// 鍵的格式一律帶年齡層：`${level}/${theme}/${mode}/${itemId}`，以後 3–6 歲也有「吃飯時間」才不會撞在一起。
import { dateKey, daysBetween, uid } from './util.js';

export const STORE_KEY = 'kids-english:v2';
export const MAX_PROFILES = 4;
export const AVATARS = ['🐰', '🐻', '🐱', '🐶', '🦊', '🐼', '🐯', '🦄', '🐸', '🐧', '🦁', '🐨'];
export const GRADES = [
  { id: '1', zh: '小一' }, { id: '2', zh: '小二' }, { id: '3', zh: '小三' }, { id: 'other', zh: '其他' },
];
export const MODES = ['learn-cards', 'listen-tap', 'match-pairs', 'build-sentence', 'say-it', 'role-play'];
export const REVIEW_INTERVALS = [1, 2, 4, 7, 16];
const UTTERANCE_CAP = 20;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_SETTINGS = Object.freeze({
  levelId: '6-9',
  zhMode: 'always',      // always：中文一直顯示；tap：點一下才看
  zhLock: false,         // 家長鎖住中文顯示設定
  rate: 0.9,             // 英文語速 0.6～1.2
  voiceURI: null,        // 英文聲音（null＝自動挑）
  sfx: true,             // 音效
  zhVoice: true,         // 點中文會唸
  navVoice: true,        // 按鈕名稱會唸
  recognition: true,     // 語音辨識（關＝只用跟讀模式）
  chooseThenSay: null,   // 角色扮演先選再說；null＝依年級（小一小二開）
  options: 'auto',       // 聽聽看選項數：auto／3／4
  reviewCap: 12,
  themeLock: false,
});

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

function emptyState() {
  return { version: 2, activeProfileId: null, profiles: {}, order: [] };
}

function emptyProgress() {
  return {
    stars: {}, modeStars: {}, modeBest: {}, badges: [], totalStars: 0, plays: 0,
    days: {}, hatched: 0, review: {}, spoken: {}, speakingStars: { recognized: 0, self: 0 },
    utterances: [], streak: { count: 0, last: null }, difficulty: { streak3: 0 }, learnPos: {},
  };
}

function newProfile(name, avatar, extra = {}) {
  return {
    id: uid('kid'),
    name: String(name || '').trim().slice(0, 12) || '小朋友',
    avatar: AVATARS.includes(avatar) ? avatar : AVATARS[0],
    grade: GRADES.some((g) => g.id === extra.grade) ? extra.grade : '1',
    nickname: typeof extra.nickname === 'string' ? extra.nickname.trim().slice(0, 16) : '',
    createdAt: dateKey(),
    settings: { ...DEFAULT_SETTINGS },
    progress: emptyProgress(),
  };
}

const int = (v, lo, hi, d = 0) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : d; };

function sanitizeSettings(s) {
  s = s && typeof s === 'object' ? s : {};
  return {
    levelId: typeof s.levelId === 'string' && s.levelId ? s.levelId : DEFAULT_SETTINGS.levelId,
    zhMode: s.zhMode === 'tap' ? 'tap' : 'always',
    zhLock: s.zhLock === true,
    rate: Number.isFinite(Number(s.rate)) ? Math.min(1.2, Math.max(0.6, Number(s.rate))) : DEFAULT_SETTINGS.rate,
    voiceURI: typeof s.voiceURI === 'string' ? s.voiceURI : null,
    sfx: s.sfx !== false,
    zhVoice: s.zhVoice !== false,
    navVoice: s.navVoice !== false,
    recognition: s.recognition !== false,
    chooseThenSay: typeof s.chooseThenSay === 'boolean' ? s.chooseThenSay : null,
    options: s.options === 3 || s.options === 4 ? s.options : 'auto',
    reviewCap: [8, 12, 16].includes(Number(s.reviewCap)) ? Number(s.reviewCap) : 12,
    themeLock: s.themeLock === true,
  };
}

function sanitizeProgress(g) {
  g = g && typeof g === 'object' ? g : {};
  const p = emptyProgress();
  if (g.stars && typeof g.stars === 'object') for (const [k, v] of Object.entries(g.stars)) { const n = int(v, 0, 3, -1); if (n >= 0) p.stars[k] = n; }
  if (g.modeStars && typeof g.modeStars === 'object') for (const [k, v] of Object.entries(g.modeStars)) { const n = int(v, 0, 1e6, -1); if (n >= 0) p.modeStars[k] = n; }
  if (g.modeBest && typeof g.modeBest === 'object') for (const [k, v] of Object.entries(g.modeBest)) { const n = int(v, 0, 3, -1); if (n >= 0) p.modeBest[k] = n; }
  p.badges = Array.isArray(g.badges) ? g.badges.filter((x) => typeof x === 'string').slice(0, 500) : [];
  p.totalStars = Object.values(p.stars).reduce((a, b) => a + b, 0);
  p.plays = int(g.plays, 0, 1e9);
  if (g.days && typeof g.days === 'object') {
    for (const [k, v] of Object.entries(g.days)) {
      if (!DATE_RE.test(k) || !v || typeof v !== 'object') continue;
      p.days[k] = { stars: int(v.stars, 0, 1e6), learn: v.learn === true, speak: v.speak === true, review: v.review === true, hatched: v.hatched === true, bonus: v.bonus === true, items: Array.isArray(v.items) ? v.items.filter((x) => typeof x === 'string' && /^(word|phrase|line):.+/.test(x)).slice(0, 80) : [] };
    }
  }
  p.hatched = int(g.hatched, 0, 10000);
  if (g.review && typeof g.review === 'object') {
    for (const [k, v] of Object.entries(g.review)) {
      if (!v || typeof v !== 'object') continue;
      p.review[k] = { box: int(v.box, 1, 5, 1), due: DATE_RE.test(String(v.due)) ? v.due : dateKey(), seen: int(v.seen, 0, 1e6), miss: int(v.miss, 0, 1e6) };
    }
  }
  if (g.spoken && typeof g.spoken === 'object') {
    for (const [k, v] of Object.entries(g.spoken)) {
      if (!v || typeof v !== 'object') continue;
      p.spoken[k] = { count: int(v.count, 0, 1e6), three: int(v.three, 0, 1e6) };
    }
  }
  p.speakingStars = { recognized: int(g.speakingStars?.recognized, 0, 1e9), self: int(g.speakingStars?.self, 0, 1e9) };
  p.utterances = Array.isArray(g.utterances)
    ? g.utterances.filter((u) => u && typeof u === 'object').slice(0, UTTERANCE_CAP).map((u) => ({ t: String(u.t || ''), target: String(u.target || ''), heard: String(u.heard || ''), stars: int(u.stars, 0, 3), mode: String(u.mode || '') }))
    : [];
  p.streak = { count: int(g.streak?.count, 0, 1e6), last: DATE_RE.test(String(g.streak?.last)) ? g.streak.last : null };
  p.difficulty = { streak3: int(g.difficulty?.streak3, 0, 1e6) };
  if (g.learnPos && typeof g.learnPos === 'object') for (const [k, v] of Object.entries(g.learnPos)) p.learnPos[k] = int(v, 0, 1000);
  return p;
}

function sanitizeProfile(p) {
  if (!p || typeof p !== 'object' || typeof p.id !== 'string') return null;
  const base = newProfile(p.name, p.avatar, { grade: p.grade, nickname: p.nickname });
  base.id = p.id;
  base.createdAt = DATE_RE.test(String(p.createdAt)) ? p.createdAt : base.createdAt;
  base.settings = sanitizeSettings(p.settings);
  base.progress = sanitizeProgress(p.progress);
  return base;
}

function sanitizeState(raw) {
  const st = emptyState();
  if (!raw || typeof raw !== 'object') return st;
  const profiles = raw.profiles && typeof raw.profiles === 'object' ? raw.profiles : {};
  const order = Array.isArray(raw.order) ? raw.order : Object.keys(profiles);
  for (const id of order) {
    const p = sanitizeProfile(profiles[id]);
    if (p && !st.profiles[p.id] && st.order.length < MAX_PROFILES) { st.profiles[p.id] = p; st.order.push(p.id); }
  }
  st.activeProfileId = st.profiles[raw.activeProfileId] ? raw.activeProfileId : null;
  return st;
}

export function createStore({ storage = null, key = STORE_KEY, now = () => new Date() } = {}) {
  let store = storage;
  if (!store) { try { store = globalThis.localStorage || null; } catch { store = null; } }
  // 瀏覽器不給用儲存（阻擋所有 Cookie、某些 App 內建瀏覽器）→ 只能記在記憶體，關掉就沒了，要老實告訴家長
  let usingMemory = false;
  if (!store) { store = memoryStorage(); usingMemory = true; }
  let persistOk = !usingMemory;
  let state = emptyState();
  const today = () => dateKey(now());

  function load() {
    let raw = null;
    try { raw = store.getItem(key); } catch { raw = null; }
    if (raw) { try { state = sanitizeState(JSON.parse(raw)); } catch { state = emptyState(); } } else state = emptyState();
    return state;
  }
  function save() {
    try { store.setItem(key, JSON.stringify(state)); persistOk = !usingMemory; } catch { persistOk = false; }
    return persistOk;
  }
  const prof = (id) => state.profiles[id] || null;
  const active = () => (state.activeProfileId ? prof(state.activeProfileId) : null);
  const profiles = () => state.order.map((id) => state.profiles[id]).filter(Boolean);

  /* ───── 小孩 ───── */
  function createProfile(name, avatar, extra = {}) {
    if (state.order.length >= MAX_PROFILES) return null;
    const p = newProfile(name, avatar, extra);
    state.profiles[p.id] = p;
    state.order.push(p.id);
    state.activeProfileId = p.id;
    save();
    return p;
  }
  function setActive(id) {
    if (id === null) { state.activeProfileId = null; save(); return true; }
    if (!prof(id)) return false;
    state.activeProfileId = id;
    save();
    return true;
  }
  function updateProfile(id, patch) {
    const p = prof(id);
    if (!p) return null;
    if (typeof patch.name === 'string' && patch.name.trim()) p.name = patch.name.trim().slice(0, 12);
    if (AVATARS.includes(patch.avatar)) p.avatar = patch.avatar;
    if (GRADES.some((g) => g.id === patch.grade)) p.grade = patch.grade;
    if (typeof patch.nickname === 'string') p.nickname = patch.nickname.trim().slice(0, 16);
    save();
    return p;
  }
  function updateSettings(id, patch) {
    const p = prof(id);
    if (!p) return null;
    p.settings = sanitizeSettings({ ...p.settings, ...patch });
    save();
    return p.settings;
  }
  function deleteProfile(id) {
    if (!prof(id)) return false;
    delete state.profiles[id];
    state.order = state.order.filter((x) => x !== id);
    if (state.activeProfileId === id) state.activeProfileId = null;
    save();
    return true;
  }
  function resetProgress(id) {
    const p = prof(id);
    if (!p) return false;
    p.progress = emptyProgress();
    save();
    return true;
  }

  /* ───── 星星 ───── */
  function day(p, k = today()) {
    if (!p.progress.days[k]) p.progress.days[k] = { stars: 0, learn: false, speak: false, review: false, hatched: false, bonus: false, items: [] };
    if (!p.progress.days[k].items) p.progress.days[k].items = [];
    return p.progress.days[k];
  }
  /** 今天碰過的項目（給家長區「今天學了什麼」），key 像 word:6-9.mealtime.word.1 */
  function noteItemToday(id, itemKey) {
    const p = prof(id);
    if (!p) return;
    const d = day(p);
    if (!d.items.includes(itemKey)) { d.items.push(itemKey); if (d.items.length > 80) d.items.shift(); save(); }
  }
  const todayItems = (id, k = today()) => { const p = prof(id); return p && p.progress.days[k] ? [...(p.progress.days[k].items || [])] : []; };

  /** 記一題的成績。只記「最佳」，重玩不掉星、不刷星。回傳 { delta, best, totalStars, dayStars } */
  function award(id, { level, theme, mode, itemId, stars }) {
    const p = prof(id);
    if (!p) return null;
    const s = Math.max(0, Math.min(3, Math.round(Number(stars) || 0)));
    const itemKey = `${level}/${theme}/${mode}/${itemId}`;
    const modeKey = `${level}/${theme}/${mode}`;
    const prev = p.progress.stars[itemKey] || 0;
    const best = Math.max(prev, s);
    const delta = best - prev;
    p.progress.stars[itemKey] = best;
    p.progress.modeStars[modeKey] = (p.progress.modeStars[modeKey] || 0) + delta;
    p.progress.totalStars += delta;
    const d = day(p);
    // 蛋孵了之後，今天的星數只再加 1 顆（自然停下來，沒有刷星誘因）
    if (!d.hatched) d.stars += delta;
    else if (delta > 0 && !d.bonus) { d.stars += 1; d.bonus = true; }
    touchStreak(p);
    save();
    return { delta, best, totalStars: p.progress.totalStars, dayStars: d.stars };
  }

  function touchStreak(p) {
    const t = today();
    const st = p.progress.streak;
    if (st.last === t) return;
    const gap = st.last ? daysBetween(st.last, t) : NaN;
    st.count = gap === 1 ? st.count + 1 : 1;
    st.last = t;
  }

  /**
   * 一輪結束：記這個模式的最佳輪次星數、今日任務的圈、徽章、蛋。
   * kind：'learn'（學一學／聽聽看／配對／排句子）、'speak'（開口說／角色扮演）、'review'
   * 回傳 { newBadge, hatched: 第幾隻(1-based) 或 0, tasks }
   */
  function recordRound(id, { level, theme, mode, stars, kind, selfRated = false }) {
    const p = prof(id);
    if (!p) return null;
    const s = Math.max(1, Math.min(3, Math.round(Number(stars) || 1)));
    const modeKey = `${level}/${theme}/${mode}`;
    p.progress.modeBest[modeKey] = Math.max(p.progress.modeBest[modeKey] || 0, s);
    p.progress.plays += 1;
    if (kind === 'speak') {
      if (selfRated) p.progress.speakingStars.self += s; else p.progress.speakingStars.recognized += s;
    }
    const d = day(p);
    if (kind === 'learn') d.learn = true;
    if (kind === 'speak') d.speak = true;
    if (kind === 'review') d.review = true;
    // 難度：聽聽看連續兩輪 3 星 → 4 個選項；1 星 → 回 3 個
    if (mode === 'listen-tap') {
      if (s === 3) p.progress.difficulty.streak3 += 1;
      else if (s === 1) p.progress.difficulty.streak3 = 0;
    }
    let newBadge = null;
    const badgeKey = `${level}/${theme}`;
    if (!p.progress.badges.includes(badgeKey) && MODES.every((m) => (p.progress.modeBest[`${level}/${theme}/${m}`] || 0) >= 2)) {
      p.progress.badges.push(badgeKey);
      newBadge = badgeKey;
    }
    let hatched = 0;
    if (!d.hatched && d.learn && d.speak && d.review) {
      d.hatched = true;
      p.progress.hatched += 1;
      hatched = p.progress.hatched;
    }
    touchStreak(p);
    save();
    return { newBadge, hatched, tasks: { ...d } };
  }

  /** 今天沒有東西要複習 → 複習圈自動打勾 */
  function markReviewIdle(id) {
    const p = prof(id);
    if (!p) return null;
    const d = day(p);
    if (!d.review) { d.review = true; save(); }
    let hatched = 0;
    if (!d.hatched && d.learn && d.speak && d.review) { d.hatched = true; p.progress.hatched += 1; hatched = p.progress.hatched; save(); }
    return { hatched, tasks: { ...d } };
  }

  const itemStars = (id, level, theme, mode, itemId) => { const p = prof(id); return p ? (p.progress.stars[`${level}/${theme}/${mode}/${itemId}`] || 0) : 0; };
  const modeStars = (id, level, theme, mode) => { const p = prof(id); return p ? (p.progress.modeStars[`${level}/${theme}/${mode}`] || 0) : 0; };
  const modeBest = (id, level, theme, mode) => { const p = prof(id); return p ? (p.progress.modeBest[`${level}/${theme}/${mode}`] || 0) : 0; };
  const hasBadge = (id, level, theme) => { const p = prof(id); return !!p && p.progress.badges.includes(`${level}/${theme}`); };
  function themeStars(id, level, theme) {
    const p = prof(id);
    if (!p) return 0;
    let n = 0;
    for (const [k, v] of Object.entries(p.progress.modeStars)) if (k.startsWith(`${level}/${theme}/`)) n += v;
    return n;
  }
  function themeSlots(id, level, theme) {
    return MODES.map((m) => ({ mode: m, best: modeBest(id, level, theme, m), filled: modeBest(id, level, theme, m) >= 2 }));
  }
  const dayTasks = (id, k = today()) => { const p = prof(id); return p ? { ...(p.progress.days[k] || { stars: 0, learn: false, speak: false, review: false, hatched: false, bonus: false }) } : null; };
  function weekStrip(id) {
    const p = prof(id);
    const out = [];
    const base = now();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i);
      const k = dateKey(d);
      const rec = p ? p.progress.days[k] : null;
      out.push({ key: k, hatched: !!(rec && rec.hatched), played: !!(rec && (rec.stars > 0 || rec.learn || rec.speak || rec.review)), today: i === 0 });
    }
    return out;
  }
  function streak(id) {
    const p = prof(id);
    if (!p || !p.progress.streak.last) return 0;
    const gap = daysBetween(p.progress.streak.last, today());
    return gap <= 1 ? p.progress.streak.count : 0;
  }
  function optionCount(id) {
    const p = prof(id);
    if (!p) return 3;
    if (p.settings.options === 3 || p.settings.options === 4) return p.settings.options;
    return p.progress.difficulty.streak3 >= 2 ? 4 : 3;
  }
  function chooseThenSay(id) {
    const p = prof(id);
    if (!p) return true;
    if (typeof p.settings.chooseThenSay === 'boolean') return p.settings.chooseThenSay;
    return p.grade === '1' || p.grade === '2';
  }

  /* ───── 複習盒（Leitner） ───── */
  const reviewKey = (level, theme, type, itemId) => `${level}/${theme}/${type}/${itemId}`;
  function addDays(k, n) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n);
    return dateKey(d);
  }
  /** 學一學看過 → 進第 1 盒，明天到期 */
  function seeItem(id, { level, theme, type, itemId }) {
    const p = prof(id);
    if (!p) return;
    const k = reviewKey(level, theme, type, itemId);
    if (!p.progress.review[k]) p.progress.review[k] = { box: 1, due: addDays(today(), 1), seen: 1 };
    else p.progress.review[k].seen += 1;
    save();
  }
  /** 答對（第一次就對／開口 2 星以上）升一盒；答錯回第 1 盒 */
  function reviewResult(id, { level, theme, type, itemId, pass }) {
    const p = prof(id);
    if (!p) return null;
    const k = reviewKey(level, theme, type, itemId);
    const t = today();
    let r = p.progress.review[k];
    if (!r) {
      // 第一次遇到：不管對錯都從第 1 盒開始，明天再見
      r = { box: 1, due: addDays(t, 1), seen: 1, miss: pass ? 0 : 1 };
    } else {
      r.seen += 1;
      if (!pass) { r.box = 1; r.miss = (r.miss || 0) + 1; r.due = addDays(t, REVIEW_INTERVALS[0]); }
      else if (r.due <= t) { r.box = Math.min(5, r.box + 1); r.due = addDays(t, REVIEW_INTERVALS[r.box - 1]); }
      // 還沒到期就答對：不升盒（同一天連玩四個遊戲不能讓一個字直接畢業）
    }
    p.progress.review[k] = r;
    save();
    return { ...r };
  }
  /** 把一個項目從複習盒拿掉（教材刪掉了、或這個字根本不能考） */
  function forgetItem(id, { level, theme, type, itemId }) {
    const p = prof(id);
    if (!p) return false;
    const k = reviewKey(level, theme, type, itemId);
    if (!(k in p.progress.review)) return false;
    delete p.progress.review[k];
    save();
    return true;
  }
  /** 最常錯的 n 個（給家長區當餐桌小考） */
  function mostMissed(id, level, n = 5) {
    const p = prof(id);
    if (!p) return [];
    return Object.entries(p.progress.review)
      .filter(([k, r]) => k.startsWith(`${level}/`) && (r.miss || 0) > 0)
      .sort((a, b) => (b[1].miss || 0) - (a[1].miss || 0))
      .slice(0, n)
      .map(([k, r]) => { const [lv, theme, type, ...rest] = k.split('/'); return { key: k, level: lv, theme, type, itemId: rest.join('/'), miss: r.miss, box: r.box }; });
  }
  /** 今天到期的項目（最舊的先），回傳 [{ key, level, theme, type, itemId, box }] */
  function dueItems(id, level, cap = null) {
    const p = prof(id);
    if (!p) return [];
    const t = today();
    const list = [];
    for (const [k, r] of Object.entries(p.progress.review)) {
      if (!k.startsWith(`${level}/`) || r.due > t) continue;
      const [lv, theme, type, ...rest] = k.split('/');
      list.push({ key: k, level: lv, theme, type, itemId: rest.join('/'), box: r.box, due: r.due });
    }
    list.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.box - b.box));
    const limit = cap ?? p.settings.reviewCap;
    return list.slice(0, limit);
  }
  function reviewBox(id, level, theme, type, itemId) {
    const p = prof(id);
    const r = p && p.progress.review[reviewKey(level, theme, type, itemId)];
    return r ? r.box : 0;
  }
  function reviewCounts(id, level) {
    const p = prof(id);
    const out = { total: 0, due: 0, boxes: [0, 0, 0, 0, 0] };
    if (!p) return out;
    const t = today();
    for (const [k, r] of Object.entries(p.progress.review)) {
      if (!k.startsWith(`${level}/`)) continue;
      out.total++;
      if (r.due <= t) out.due++;
      out.boxes[r.box - 1]++;
    }
    return out;
  }

  /* ───── 開口說紀錄 ───── */
  function phraseSaid(id, { level, phraseId, stars }) {
    const p = prof(id);
    if (!p) return null;
    const k = `${level}/${phraseId}`;
    const r = p.progress.spoken[k] || { count: 0, three: 0 };
    r.count += 1;
    if (stars >= 3) r.three += 1;
    p.progress.spoken[k] = r;
    save();
    return { ...r };
  }
  /** 我會說：3 星兩次、或複習盒到第 4 盒以上的句子 */
  function canSay(id, level) {
    const p = prof(id);
    if (!p) return [];
    const out = new Map();
    for (const [k, r] of Object.entries(p.progress.spoken)) {
      if (!k.startsWith(`${level}/`)) continue;
      if (r.three >= 2) out.set(k.slice(level.length + 1), { count: r.count, three: r.three });
    }
    for (const [k, r] of Object.entries(p.progress.review)) {
      if (!k.startsWith(`${level}/`) || r.box < 4) continue;
      const [, , type, ...rest] = k.split('/');
      if (type !== 'phrase') continue;
      const pid = rest.join('/');
      if (!out.has(pid)) { const sp = p.progress.spoken[`${level}/${pid}`]; out.set(pid, { count: sp ? sp.count : 0, three: sp ? sp.three : 0 }); }
    }
    return Array.from(out, ([phraseId, v]) => ({ phraseId, ...v }));
  }
  function logUtterance(id, { target, heard, stars, mode }) {
    const p = prof(id);
    if (!p) return;
    const d = now();
    const t = `${dateKey(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    p.progress.utterances.unshift({ t, target: String(target || '').slice(0, 80), heard: String(heard || '').slice(0, 120), stars: Math.max(0, Math.min(3, Number(stars) || 0)), mode: String(mode || '') });
    p.progress.utterances = p.progress.utterances.slice(0, UTTERANCE_CAP);
    save();
  }
  function setLearnPos(id, { level, theme, chunk, index }) {
    const p = prof(id);
    if (!p) return;
    p.progress.learnPos[`${level}/${theme}/${chunk}`] = Math.max(0, Number(index) || 0);
    save();
  }
  const getLearnPos = (id, { level, theme, chunk }) => { const p = prof(id); return p ? (p.progress.learnPos[`${level}/${theme}/${chunk}`] || 0) : 0; };

  /* ───── 匯出／匯入 ───── */
  function exportJSON() {
    return JSON.stringify({ app: 'kids-english', v: 2, exportedAt: today(), state }, null, 0);
  }
  function importJSON(text, { mode = 'merge' } = {}) {
    let parsed;
    try { parsed = JSON.parse(String(text)); } catch { return { ok: false, error: '這不是進度檔（格式不對）' }; }
    if (!parsed || parsed.app !== 'kids-english' || !parsed.state) return { ok: false, error: '這不是天天說英文的進度檔' };
    const incoming = sanitizeState(parsed.state);
    if (mode === 'replace') { state = incoming; save(); return { ok: true, profiles: state.order.length }; }
    let added = 0, merged = 0;
    for (const id of incoming.order) {
      const inc = incoming.profiles[id];
      const same = profiles().find((p) => p.id === inc.id || p.name === inc.name);
      if (!same) {
        if (state.order.length >= MAX_PROFILES) continue;
        state.profiles[inc.id] = inc;
        state.order.push(inc.id);
        added++;
        continue;
      }
      merged++;
      const g = same.progress, h = inc.progress;
      for (const [k, v] of Object.entries(h.stars)) {
        const prev = g.stars[k] || 0;
        if (v > prev) {
          g.stars[k] = v;
          const modeKey = k.split('/').slice(0, 3).join('/');
          g.modeStars[modeKey] = (g.modeStars[modeKey] || 0) + (v - prev);
          g.totalStars += v - prev;
        }
      }
      for (const [k, v] of Object.entries(h.modeBest)) g.modeBest[k] = Math.max(g.modeBest[k] || 0, v);
      for (const b of h.badges) if (!g.badges.includes(b)) g.badges.push(b);
      for (const [k, v] of Object.entries(h.days)) {
        const cur = g.days[k];
        g.days[k] = cur
          ? { stars: Math.max(cur.stars, v.stars), learn: cur.learn || v.learn, speak: cur.speak || v.speak, review: cur.review || v.review, hatched: cur.hatched || v.hatched, bonus: cur.bonus || v.bonus, items: Array.from(new Set([...(cur.items || []), ...(v.items || [])])).slice(0, 80) }
          : { ...v, items: [...(v.items || [])] };
      }
      g.hatched = Math.max(g.hatched, h.hatched);
      for (const [k, v] of Object.entries(h.review)) {
        const cur = g.review[k];
        if (!cur || v.box > cur.box || (v.box === cur.box && v.due > cur.due)) g.review[k] = { ...v, seen: Math.max(cur ? cur.seen : 0, v.seen) };
      }
      for (const [k, v] of Object.entries(h.spoken)) {
        const cur = g.spoken[k];
        g.spoken[k] = cur ? { count: Math.max(cur.count, v.count), three: Math.max(cur.three, v.three) } : { ...v };
      }
      g.speakingStars = { recognized: Math.max(g.speakingStars.recognized, h.speakingStars.recognized), self: Math.max(g.speakingStars.self, h.speakingStars.self) };
      if ((h.streak.last || '') > (g.streak.last || '')) g.streak = { ...h.streak };
      g.plays = Math.max(g.plays, h.plays);
    }
    save();
    return { ok: true, added, merged };
  }

  /** 可以貼到 LINE 的進度碼（能壓縮就壓縮）。回傳 Promise<string> */
  async function exportCode() {
    const json = exportJSON();
    const bytes = new TextEncoder().encode(json);
    if (typeof CompressionStream === 'function') {
      try {
        const cs = new CompressionStream('deflate-raw');
        const w = cs.writable.getWriter();
        w.write(bytes);
        w.close();
        const buf = new Uint8Array(await new Response(cs.readable).arrayBuffer());
        return 'KE1.' + b64(buf);
      } catch { /* 退回不壓縮 */ }
    }
    return 'KE0.' + b64(bytes);
  }
  async function importCode(code, opts) {
    const s = String(code || '').trim().replace(/\s+/g, '');
    const m = /^KE([01])\.(.+)$/.exec(s);
    if (!m) return { ok: false, error: '這不是進度碼（要以 KE1. 或 KE0. 開頭）' };
    let bytes;
    try { bytes = unb64(m[2]); } catch { return { ok: false, error: '進度碼不完整，請整段複製再貼一次' }; }
    if (m[1] === '1') {
      if (typeof DecompressionStream !== 'function') return { ok: false, error: '這個瀏覽器太舊，沒辦法讀壓縮的進度碼' };
      try {
        const ds = new DecompressionStream('deflate-raw');
        const w = ds.writable.getWriter();
        w.write(bytes);
        w.close();
        bytes = new Uint8Array(await new Response(ds.readable).arrayBuffer());
      } catch { return { ok: false, error: '進度碼解不開，可能貼漏了一段' }; }
    }
    return importJSON(new TextDecoder().decode(bytes), opts);
  }

  load();

  return {
    load, save, active, profiles, createProfile, setActive, updateProfile, updateSettings, deleteProfile, resetProgress,
    award, recordRound, markReviewIdle, itemStars, modeStars, modeBest, hasBadge, themeStars, themeSlots, dayTasks, weekStrip, streak,
    optionCount, chooseThenSay,
    seeItem, reviewResult, forgetItem, dueItems, reviewBox, reviewCounts, mostMissed, noteItemToday, todayItems,
    phraseSaid, canSay, logUtterance, setLearnPos, getLearnPos,
    exportJSON, importJSON, exportCode, importCode,
    get persistOk() { return persistOk; },
    get state() { return state; },
  };
}

function b64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
function unb64(s) {
  const bin = atob(s);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
