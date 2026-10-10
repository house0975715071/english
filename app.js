// 天天說英文 — 主程式：路由、誰要玩、第一次設定、首頁（今日任務＋主題）、主題頁、遊戲外框、結果、貼紙簿、我會說、家長區入口。
// 全部在瀏覽器裡跑；進度存 localStorage；沒有任何對外連線。
import { createStore, AVATARS, GRADES, MODES } from './lib/store.js';
import { createTTS, createSTT } from './lib/speech.js';
import { sfx, unlock, setEnabled } from './lib/audio.js';
import { LEVELS, getLevel, loadTheme, loadStickers } from './content/index.js';
import { GAMES, REVIEW, gameById } from './games/index.js';
import { createSpeakerComponent, chooseEchoForSession } from './lib/speaker.js';
import { html, raw, render, starsHtml, dotsHtml, toast, sheet, confetti, fillName } from './lib/ui.js';
import { mountParent } from './parent.js';

export const APP_VERSION = '2026.10.02';
const IDLE_MS = 30 * 60 * 1000;
const TIP_KEY = 'kids-english:home-tip';

const app = document.getElementById('app');
const store = createStore();
const tts = createTTS();
const stt = createSTT();
// routeSeq：每換一次頁就 +1。遊戲、載入中的畫面在 await 之後先比對，不是自己那一頁就什麼都不做
const S = { game: null, speaker: null, idleTimer: null, swWaiting: null, routeSeq: 0, navSpeech: null, lastActive: Date.now() };

/* ───────── 共用 ───────── */
const pid = () => (store.active() ? store.active().id : null);
const profile = () => store.active();
const settings = () => (profile() ? profile().settings : { ...store.state, zhMode: 'always', rate: 0.9, navVoice: true, zhVoice: true, sfx: true, recognition: true, levelId: '6-9' });
const level = () => getLevel(settings().levelId || '6-9');
const zhHidden = () => settings().zhMode === 'tap';

// 念之前修正幾個語音引擎會念錯的寫法（畫面上的字不變）
const TTS_FIXES = [[/\bMRT\b/g, 'M R T'], [/\bTV\b/g, 'T V']];
function speakEn(text, { rate, pitch } = {}) {
  let t = String(text || '');
  for (const [re, to] of TTS_FIXES) t = t.replace(re, to);
  return tts.speak(t, { lang: 'en', rate: rate ?? settings().rate, pitch, voiceURI: settings().voiceURI });
}
function speakZh(text) { return tts.speak(text, { lang: 'zh', rate: 0.95 }); }
// 念按鈕名稱（給還不太識字的一年級）。記下這句的 Promise：遊戲開始念英文前會等它念完，不會把它切掉
function sayNav(label) {
  if (label && settings().navVoice && tts.hasVoice('zh')) { S.navSpeech = speakZh(label); return S.navSpeech; }
  return null;
}
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
const isLineApp = () => /\bLine\//.test(navigator.userAgent);
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => navigator.standalone === true || (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches);

// 30 分鐘沒人碰就回「誰要玩？」，避免哥哥玩完、妹妹拿起來玩卻記到哥哥名下。
// 平板睡著時計時器會暫停，所以每次碰螢幕、畫面回到前景時，都用「實際經過的時間」再判斷一次。
function idleCheck() {
  if (pid() && Date.now() - S.lastActive > IDLE_MS) { store.setActive(null); go('#/'); return true; }
  return false;
}
function armIdle() {
  clearTimeout(S.idleTimer);
  S.idleTimer = setTimeout(idleCheck, IDLE_MS + 1000);
}
document.addEventListener('pointerdown', () => {
  unlock();
  if (idleCheck()) return; // 回「誰要玩？」；這一下點擊之後被擋在選人畫面（沒有選人的頁面都會導回去）
  S.lastActive = Date.now();
  armIdle();
}, { passive: true, capture: true });
// iOS 只有在 click（不是 pointerdown）裡第一次念才會解鎖語音，所以暖機放在 click
let warmed = false;
document.addEventListener('click', () => {
  unlock();
  if (!warmed) { warmed = true; tts.warmUp(); }
}, { capture: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { unlock(); idleCheck(); } });

// 單一事件委派：data-go（換頁）、data-speak-en／data-speak-zh（念）、data-say（念按鈕名稱）
app.addEventListener('click', (e) => {
  const sayEl = e.target.closest('[data-say]');
  const goEl = e.target.closest('[data-go]');
  const enEl = e.target.closest('[data-speak-en]');
  const zhEl = e.target.closest('[data-speak-zh]');
  if (enEl) { speakEn(enEl.dataset.speakEn); return; }
  if (zhEl) { if (settings().zhVoice) speakZh(zhEl.dataset.speakZh); return; }
  if (goEl) { sfx.tap(); if (sayEl) sayNav(sayEl.dataset.say); go(goEl.dataset.go); return; }
  if (sayEl) sayNav(sayEl.dataset.say);
});

// 只有真的有遊戲在跑才把語音停掉；一般換頁不停，剛按下去那個按鈕的名稱才念得完
function teardownGame() {
  const had = !!S.game;
  if (S.game && S.game.destroy) { try { S.game.destroy(); } catch { /* 忽略 */ } }
  S.game = null;
  if (had) tts.cancel();
  stt.abort();
}

/* ───────── 路由 ───────── */
function route() {
  S.routeSeq += 1;
  teardownGame();
  app.onclick = null; // 「新朋友」那幾步掛的處理函式，離開就拿掉
  document.querySelectorAll('.sheet-bg').forEach((n) => n.remove());
  const h = location.hash || '#/';
  const parts = h.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  const q = Object.fromEntries(new URLSearchParams((h.split('?')[1] || '')));
  const name = parts[0] || '';
  // 「有新版本」只在誰要玩／首頁出現，不蓋住遊戲頂欄的喇叭
  document.querySelectorAll('.update-pill').forEach((n) => { n.hidden = !(name === '' || name === 'home'); });
  const needsKid = !['', 'new', 'parent'].includes(name);
  if (needsKid && !pid()) return go('#/');
  if (profile()) setEnabled(settings().sfx);
  window.scrollTo(0, 0);
  switch (name) {
    case '': return pickerScreen();
    case 'new': return onboardingScreen();
    case 'home': return homeScreen();
    case 'theme': return themeScreen(parts[1]);
    case 'cards': return cardsScreen(parts[1]);
    case 'play': return playScreen(parts[1], parts[2], q);
    case 'review': return playScreen(null, 'review', q);
    case 'stickers': return stickersScreen();
    case 'cansay': return canSayScreen();
    case 'parent': return parentScreen();
    default: return go('#/');
  }
}
window.addEventListener('hashchange', route);

/* ───────── 誰要玩？ ───────── */
function pickerScreen() {
  const kids = store.profiles();
  render(app, html`
    <div class="screen">
      <div class="topbar"><div class="title">天天說英文<span class="sub">Say It Every Day</span></div></div>
      ${isLineApp() ? html`<div class="banner">請改用 Safari／Chrome 開啟，麥克風才會動（LINE 裡面的瀏覽器聽不到你說話）。</div>` : ''}
      ${isIOS() && !isStandalone() && !isLineApp() ? html`<div class="banner info small">給爸媽：iPad／iPhone 建議<b>先</b>按 Safari 下方「分享 ⬆️」→「加入主畫面」，再從主畫面的圖示打開來玩。主畫面的 App 和 Safari 的進度是分開存的，先加再玩，進度才不會分兩邊。</div>` : ''}
      <h1 class="center-text" style="font-size:30px;margin:18px 0 6px">誰要玩？</h1>
      <div class="profiles">
        ${kids.map((k) => html`<button class="profile" data-pick="${k.id}"><span class="emoji">${k.avatar}</span><span>${k.name}</span></button>`)}
        ${kids.length < 4 ? html`<button class="profile add" data-go="#/new"><span class="emoji">➕</span><span>新朋友</span></button>` : ''}
      </div>
      <div class="grow"></div>
      <div class="center-text mt-lg"><button class="btn ghost" data-go="#/parent">👪 家長</button></div>
      ${!store.persistOk ? html`<div class="banner mt">這個瀏覽器不讓我們記住進度（可能是無痕模式）。可以玩，但關掉就會忘記。</div>` : ''}
    </div>`);
  app.querySelector('.profiles').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    store.setActive(b.dataset.pick);
    sfx.pop();
    const k = store.active();
    if (settings().zhVoice && tts.hasVoice('zh')) S.navSpeech = speakZh(`${k.name}，你好！`);
    go('#/home');
  });
}

/* ───────── 第一次設定 ───────── */
function onboardingScreen() {
  if (store.profiles().length >= 4) { toast('最多 4 個小朋友，先到家長區刪一個'); return go('#/'); }
  const st = { step: 0, name: '', avatar: AVATARS[0], grade: '1', nickname: '', heard: null, created: null };
  // 已經是主畫面 App → 不用再提醒加到主畫面；iPhone／iPad 的 Safari → 提醒放在「建立小朋友之前」（主畫面 App 的進度是另外存的）
  const standalone = isStandalone();
  const tipFirst = !standalone && isIOS();
  const steps = standalone ? ['name', 'avatar', 'grade', 'nickname', 'sound', 'mic']
    : tipFirst ? ['tip', 'name', 'avatar', 'grade', 'nickname', 'sound', 'mic']
      : ['name', 'avatar', 'grade', 'nickname', 'sound', 'mic', 'tip'];
  const tipShown = () => { try { return localStorage.getItem(TIP_KEY) === '1'; } catch { return true; } };
  if (tipFirst && tipShown()) steps.shift();
  // 往下一步；最後一步是「加到主畫面」而且看過了就跳過
  const advance = () => {
    st.step++;
    if (steps[st.step] === 'tip' && tipShown()) st.step++;
    if (st.step >= steps.length) return finish();
    return draw();
  };

  function draw() {
    const step = steps[st.step];
    let body;
    if (step === 'name') body = html`
      <h2>你叫什麼名字？</h2>
      <div class="field"><input type="text" id="ob-name" maxlength="12" placeholder="例：小明、Amy" value="${st.name}" autocomplete="off"></div>
      <button class="btn big mt" data-ob="next">下一步</button>`;
    else if (step === 'avatar') body = html`
      <h2>選一個你喜歡的動物</h2>
      <div class="avatars">${AVATARS.map((a) => html`<button class="${a === st.avatar ? 'on' : ''}" data-avatar="${a}">${a}</button>`)}</div>
      <button class="btn big mt" data-ob="next">下一步</button>`;
    else if (step === 'grade') body = html`
      <h2>幾年級？</h2>
      <div class="stack">${GRADES.map((g) => html`<button class="btn ${g.id === st.grade ? '' : 'soft'} block" data-grade="${g.id}">${g.zh}</button>`)}</div>
      <button class="btn big mt" data-ob="next">下一步</button>`;
    else if (step === 'nickname') body = html`
      <h2>英文名字（可以不填）</h2>
      <p class="muted small">故事裡的小朋友會用這個名字叫你，例如 Amy、Ben、Leo。沒有就先用故事裡的名字。</p>
      <div class="field"><input type="text" id="ob-nick" maxlength="16" placeholder="Amy" value="${st.nickname}" autocomplete="off" autocapitalize="words"></div>
      <button class="btn big mt" data-ob="next">下一步</button>`;
    else if (step === 'sound') body = html`
      <h2>聲音測試</h2>
      <p class="muted">按一下喇叭，聽聽看有沒有聲音。（這一步讓平板之後都能自動念英文）</p>
      <div class="row center mt"><button class="roundbtn primary" data-ob="sound">🔊</button></div>
      ${st.heard === null ? html`<p class="center-text muted mt">聽到了嗎？</p>` : ''}
      <div class="row center mt" style="gap:12px">
        <button class="btn ok" data-ob="heard">聽到了 👍</button>
        <button class="btn soft" data-ob="notheard">沒聽到</button>
      </div>
      ${st.heard === false ? html`<div class="banner mt">檢查一下：靜音鍵有沒有開、音量有沒有調大、是不是接著藍牙耳機。再按一次喇叭試試；真的沒聲音也可以先進去玩。<div class="mt"><button class="btn soft" data-ob="next">先進去玩</button></div></div>` : ''}`;
    else if (step === 'mic') body = html`
      <h2>🎤 換你開口說英文囉！</h2>
      <p>等一下畫面會跳出「要允許使用麥克風嗎？」，請找爸爸媽媽一起按「允許」。</p>
      <ul style="padding-left:20px"><li>你的聲音不會被錄下來，也不會存起來，說完就不見了。</li><li>現在不能用麥克風也沒關係，可以先用「跟讀模式」，一樣可以練習。</li></ul>
      <details class="small muted"><summary>給爸爸媽媽</summary><p>語音辨識是瀏覽器內建功能：用 Chrome／Edge 時，孩子說的話會送到 Google／Microsoft 的伺服器辨識，所以需要網路；iPad 的 Safari 用的是 Apple 的辨識，需要在設定裡開啟「聽寫」。這個 App 本身不錄音、不上傳、不儲存任何聲音或資料。不想開麥克風，可以到「家長區」把語音辨識關掉，改用「跟讀模式」。</p></details>
      <div class="stack mt">
        <button class="btn ok block" data-ob="mic-allow">好，打開麥克風</button>
        <button class="btn soft block" data-ob="mic-skip">先用跟讀模式</button>
      </div>`;
    else body = html`
      <h2>📲 給爸媽：加到主畫面</h2>
      <p>把這個網頁加到平板或手機的主畫面，之後點圖示就能玩，而且沒有網路也能玩（除了「聽你說話」要網路）。</p>
      <div class="card soft small">
        <div><b>iPad／iPhone（Safari）</b>：下面的「分享」按鈕 ⬆️ → 往下找「加入主畫面」。</div>
        <div class="mt"><b>Android（Chrome）</b>：右上角「⋮」→「安裝應用程式」或「加到主畫面」。</div>
      </div>
      ${tipFirst
        ? html`<p class="small muted">iPad／iPhone 的主畫面 App 跟 Safari 是<b>分開存進度</b>的。建議現在先加，然後從主畫面的圖示打開，再建立小朋友。</p>
          <button class="btn big ok mt" data-ob="next">我知道了，繼續在這裡設定</button>`
        : html`<p class="small muted">加到主畫面之後，如果是 iPad／iPhone，主畫面的 App 會是新的空白進度；要搬過去請用家長區「備份」的進度碼。</p>
          <button class="btn big ok mt" data-ob="start">開始玩！</button>`}`;
    render(app, html`
      <div class="screen">
        <div class="topbar"><button class="iconbtn ghost" data-ob="back">◀</button><div class="title">新朋友<span class="sub">第 ${st.step + 1} 步，共 ${steps.length} 步</span></div></div>
        <div class="card">${body}</div>
      </div>`);
    const inp = app.querySelector('input');
    if (inp) inp.focus();
  }

  // 已經建立過（例如按返回回去改名字）→ 把改過的內容寫回去，不要靜靜丟掉
  function createNow() {
    if (st.created) {
      store.updateProfile(st.created.id, { name: st.name, avatar: st.avatar, grade: st.grade, nickname: st.nickname });
      return st.created;
    }
    st.created = store.createProfile(st.name, st.avatar, { grade: st.grade, nickname: st.nickname });
    return st.created;
  }

  app.onclick = (e) => {
    const av = e.target.closest('[data-avatar]');
    if (av) { st.avatar = av.dataset.avatar; sfx.tap(); return draw(); }
    const gr = e.target.closest('[data-grade]');
    if (gr) { st.grade = gr.dataset.grade; sfx.tap(); return draw(); }
    const b = e.target.closest('[data-ob]');
    if (!b) return;
    const act = b.dataset.ob;
    const step = steps[st.step];
    if (act === 'back') { if (st.step === 0) { app.onclick = null; return go('#/'); } st.step--; return draw(); }
    if (act === 'next') {
      if (step === 'name') { st.name = (app.querySelector('#ob-name').value || '').trim(); if (!st.name) { toast('先打名字喔'); return; } }
      if (step === 'nickname') { st.nickname = (app.querySelector('#ob-nick').value || '').trim(); createNow(); }
      if (step === 'tip') { try { localStorage.setItem(TIP_KEY, '1'); } catch { /* 忽略 */ } }
      return advance();
    }
    if (act === 'sound') { unlock(); tts.warmUp(); speakEn('Hello! Nice to meet you.').then(() => { if (settings().zhVoice) speakZh('你好！'); }); return; }
    if (act === 'heard') { st.heard = true; return advance(); }
    if (act === 'notheard') { st.heard = false; return draw(); }
    if (act === 'mic-allow') {
      try { localStorage.setItem('kids-english:mic-intro', '1'); } catch { /* 忽略 */ }
      if (stt.supported) stt.listen({ maxMs: 1500 }).then(() => {}); // 只為了跳出授權
      return advance();
    }
    // 先用跟讀：這次打開網頁期間都用跟讀，而且不記「說明看過了」——之後要開麥克風前一定會再看到說明
    if (act === 'mic-skip') { chooseEchoForSession(); return advance(); }
    if (act === 'start') return finish();
  };
  function finish() {
    try { localStorage.setItem(TIP_KEY, '1'); } catch { /* 忽略 */ }
    createNow();
    app.onclick = null;
    go('#/home');
  }
  draw();
}

/* ───────── 首頁 ───────── */
function recommendedTheme() {
  const lv = level();
  return lv.themes.find((t) => !store.hasBadge(pid(), lv.id, t.id)) || lv.themes[0];
}
function recommendedMode(themeId) {
  return GAMES.find((g) => store.modeBest(pid(), level().id, themeId, g.id) < 2) || null;
}
function nextTask() {
  const d = store.dayTasks(pid());
  const lv = level();
  const t = recommendedTheme();
  if (!d.learn) {
    const g = GAMES.filter((x) => x.kind === 'learn').find((x) => store.modeBest(pid(), lv.id, t.id, x.id) < 2) || GAMES[0];
    return { label: '學新的', emoji: '📖', hash: `#/play/${t.id}/${g.id}`, say: '學新的' };
  }
  if (!d.speak) {
    const g = store.modeBest(pid(), lv.id, t.id, 'say-it') < 2 ? 'say-it' : 'role-play';
    return { label: '開口說', emoji: '🎤', hash: `#/play/${t.id}/${g}`, say: '開口說' };
  }
  if (!d.review && store.dueItems(pid(), lv.id).length) return { label: '複習', emoji: '🔁', hash: '#/review', say: '複習' };
  const g = recommendedMode(t.id) || GAMES[0];
  return { label: '今天完成了！再玩一個', emoji: '🐣', hash: `#/play/${t.id}/${g.id}`, say: '再玩一個' };
}

function eggHtml(d) {
  const e = d.hatched ? '🐣' : '🥚';
  return raw(`<span class="egg"><span class="e ${!d.hatched && (d.learn || d.speak) ? 'wobble' : ''}">${e}</span><span class="tri"><i class="${d.learn ? 'on' : ''}"></i><i class="${d.speak ? 'on' : ''}"></i><i class="${d.review ? 'on' : ''}"></i></span></span>`);
}
function weekHtml() {
  return raw(`<span class="week">${store.weekStrip(pid()).map((w) => `<i class="${w.hatched ? 'hatched' : w.played ? 'played' : ''} ${w.today ? 'today' : ''}"></i>`).join('')}</span>`);
}
function tabbar(on) {
  const tabs = [['home', '🏠', '首頁', '#/home'], ['stickers', '📒', '貼紙簿', '#/stickers'], ['cansay', '💬', '我會說', '#/cansay'], ['parent', '👪', '家長', '#/parent']];
  return raw(`<nav class="tabbar">${tabs.map(([k, e, z, h]) => `<button class="tab ${on === k ? 'on' : ''}" data-go="${h}" data-say="${z}"><span class="emoji">${e}</span>${z}</button>`).join('')}</nav>`);
}

function homeScreen() {
  const p = profile();
  const lv = level();
  // 今天沒有東西要複習 → 複習圈自動打勾（學新的、開口說都做完才勾，蛋就在首頁孵）
  const d0 = store.dayTasks(pid());
  if (d0.learn && d0.speak && !d0.review && !store.dueItems(pid(), lv.id).length) {
    const o = store.markReviewIdle(pid());
    const seq = S.routeSeq;
    if (o && o.hatched) setTimeout(() => celebrate({ hatched: o.hatched, seq }), 500);
  }
  const d = store.dayTasks(pid());
  const task = nextTask();
  const rec = recommendedTheme();
  render(app, html`
    <div class="screen">
      <div class="topbar">
        <button class="iconbtn avatar-btn" data-go="#/" aria-label="換人"><span class="emoji">${p.avatar}</span> ${p.name}</button>
        <div class="grow"></div>
        ${eggHtml(d)}
      </div>
      <div class="row between small muted" style="padding:0 4px 8px"><span>這一週</span>${weekHtml()}</div>
      <button class="btn big accent" data-go="${task.hash}" data-say="${task.say}" style="min-height:96px;font-size:26px"><span class="emoji">${task.emoji}</span> 今日任務：${task.label}</button>
      <div class="row small muted mt" style="justify-content:space-around">
        <span>${d.learn ? '✅' : '⬜'} 學新的</span><span>${d.speak ? '✅' : '⬜'} 開口說</span><span>${d.review ? '✅' : '⬜'} 複習</span>
      </div>
      <h2 style="margin:22px 0 10px;font-size:20px">主題 <span class="tiny">${lv.ages}</span></h2>
      <div class="grid2">
        ${lv.themes.map((t) => {
          const slots = store.themeSlots(pid(), lv.id, t.id);
          const badge = store.hasBadge(pid(), lv.id, t.id);
          return html`
            <button class="tile ${badge ? 'badge' : ''} ${t.id === rec.id && !badge ? 'rec' : ''}" style="--tile:${t.color}" data-go="#/theme/${t.id}" data-say="${t.zh}">
              <span class="emoji">${badge ? `🏅` : t.emoji}</span>
              <span class="name">${t.zh}${t.id === rec.id && !badge ? html`<span class="tag">推薦</span>` : ''}<span class="en">${t.en}</span></span>
              <span class="meta">${dotsHtml(slots)}</span>
            </button>`;
        })}
      </div>
      ${tabbar('home')}
    </div>`);
}

/* ───────── 主題頁 ───────── */
async function themeScreen(themeId) {
  const lv = level();
  const meta = lv.themes.find((t) => t.id === themeId);
  if (!meta) return go('#/home');
  render(app, html`<div class="screen"><div class="topbar"><button class="iconbtn ghost" data-go="#/home">◀</button><div class="title">${meta.emoji} ${meta.zh}</div></div><p class="center-text muted">載入中…</p></div>`);
  const seq = S.routeSeq;
  let theme;
  try { theme = await loadTheme(lv.id, themeId); } catch {
    if (seq !== S.routeSeq) return;
    render(app, html`<div class="screen"><div class="topbar"><button class="iconbtn ghost" data-go="#/home">◀</button><div class="title">${meta.emoji} ${meta.zh}</div></div><div class="banner">這個主題的教材還沒放進來。</div></div>`);
    return;
  }
  if (seq !== S.routeSeq) return; // 載入中就按了返回 → 不要把主題頁蓋回去
  const slots = store.themeSlots(pid(), lv.id, themeId);
  const left = slots.filter((s) => !s.filled).length;
  const badge = store.hasBadge(pid(), lv.id, themeId);
  const rec = recommendedMode(themeId);
  render(app, html`
    <div class="screen">
      <div class="topbar"><button class="iconbtn ghost" data-go="#/home" aria-label="回首頁">◀</button><div class="title">${meta.emoji} ${meta.zh}<span class="sub en">${meta.en}</span></div></div>
      <div class="card soft">
        <div class="board">${GAMES.map((g, i) => html`<div class="slot2 ${slots[i].filled ? 'on' : ''}">${slots[i].filled ? g.emoji : '·'}</div>`)}</div>
        <div class="center-text small mt">${badge ? '🏅 這個主題的徽章拿到了！' : `再 ${left} 格就有徽章`}</div>
      </div>
      <div class="stack mt">
        ${GAMES.map((g) => html`
          <button class="modebtn" data-go="#/play/${themeId}/${g.id}" data-say="${g.zh}">
            <span class="emoji">${g.emoji}</span>
            <span><span class="name">${g.zh}${rec && rec.id === g.id ? html` <span class="tag" style="font-size:12px;color:#fff;background:var(--rose);border-radius:999px;padding:2px 8px">推薦</span>` : ''}</span><br><span class="desc">${g.desc}</span></span>
            <span class="stars">${starsHtml(store.modeBest(pid(), lv.id, themeId, g.id))}</span>
          </button>`)}
        <button class="btn soft block" data-go="#/cards/${themeId}" data-say="看單字卡">🗂️ 看單字卡（${theme.words.length} 字・${theme.phrases.length} 句）</button>
      </div>
    </div>`);
}

/* ───────── 看單字卡（自由翻） ───────── */
async function cardsScreen(themeId) {
  const lv = level();
  const meta = lv.themes.find((t) => t.id === themeId);
  if (!meta) return go('#/home');
  const seq = S.routeSeq;
  let theme;
  try { theme = await loadTheme(lv.id, themeId); } catch { if (seq === S.routeSeq) { toast('這個主題的教材還沒放進來'); go('#/home'); } return; }
  if (seq !== S.routeSeq) return;
  const nick = profile().nickname;
  const row = (it) => html`
    <div class="listrow">
      <span class="emoji">${it.emoji}</span>
      <span class="t"><div class="en">${fillName(it.en, nick)}</div><div class="zh" data-speak-zh="${fillName(it.zh, nick)}">${fillName(it.zh, nick)}</div></span>
      <button class="roundbtn sm" data-speak-en="${fillName(it.ttsOverride || it.en, nick)}" aria-label="聽">🔊</button>
    </div>`;
  render(app, html`
    <div class="screen">
      <div class="topbar"><button class="iconbtn ghost" data-go="#/theme/${themeId}">◀</button><div class="title">🗂️ ${meta.zh}<span class="sub">點喇叭聽英文，點中文聽中文</span></div></div>
      <div class="card"><h3>單字</h3>${theme.words.map(row)}</div>
      <div class="card mt"><h3>句子</h3>${theme.phrases.map(row)}</div>
      ${theme.dialogues.map((d) => html`<div class="card mt"><h3>🎭 ${d.title_zh}<span class="tiny">　${d.scene_zh}</span></h3>${d.lines.map((l) => { const r = d.roles.find((x) => x.key === l.role); return row({ emoji: r ? r.emoji : '💬', en: l.en, zh: l.zh }); })}</div>`)}
    </div>`);
}

/* ───────── 遊戲外框 ───────── */
async function playScreen(themeId, modeId, q) {
  const lv = level();
  const game = gameById(modeId);
  if (!game) return go('#/home');
  const meta = themeId ? lv.themes.find((t) => t.id === themeId) : null;
  if (themeId && !meta) return go('#/home');
  render(app, html`<div class="screen game"><div class="topbar"><button class="iconbtn ghost" data-go="#/home">🏠</button><div class="title">${game.emoji} ${game.zh}</div></div><p class="center-text muted">載入中…</p></div>`);
  // 這一頁的號碼。換頁之後，這一輪遊戲還沒跑完的動作（念下一題、結算、畫面）一律不做
  const seq = S.routeSeq;
  const stale = () => seq !== S.routeSeq;
  let theme = null;
  if (themeId) {
    try { theme = await loadTheme(lv.id, themeId); } catch { if (!stale()) { toast('這個主題的教材還沒放進來'); go('#/home'); } return; }
  }
  if (stale()) return;
  render(app, html`
    <div class="screen game">
      <div class="topbar">
        <button class="iconbtn ghost" data-go="${themeId ? `#/theme/${themeId}` : '#/home'}" aria-label="回去">🏠</button>
        <div class="title" style="font-size:17px">${game.emoji} ${game.zh}<span class="sub">${meta ? meta.zh : '今天該複習的'}</span></div>
        <button class="iconbtn" id="btn-replay" aria-label="再聽一次">🔊</button>
        <button class="iconbtn ${zhHidden() ? '' : 'ghost'}" id="btn-zh" aria-label="中文顯示">👁 中文</button>
      </div>
      <div class="gameprogress" id="gp"></div>
      <div id="game-root" class="mt ${zhHidden() ? 'zh-hidden' : ''}"></div>
      <div class="grow"></div>
      <div class="row center mt"><button class="btn ghost small" id="btn-skip">跳過 ▶</button></div>
    </div>`);
  const root = app.querySelector('#game-root');
  let replayFn = null, skipFn = null;
  app.querySelector('#btn-replay').onclick = () => { sfx.tap(); if (replayFn) replayFn(); };
  app.querySelector('#btn-skip').onclick = () => { sfx.tap(); if (skipFn) skipFn(); };
  app.querySelector('#btn-zh').onclick = () => {
    if (settings().zhLock) { toast('中文顯示由爸媽設定'); return; }
    store.updateSettings(pid(), { zhMode: zhHidden() ? 'always' : 'tap' });
    // 外框和畫面上現有的卡片一起換（卡片是畫的時候各自加上 zh-hidden 的）
    root.classList.toggle('zh-hidden', zhHidden());
    root.querySelectorAll('.qcard').forEach((n) => n.classList.toggle('zh-hidden', zhHidden()));
    app.querySelector('#btn-zh').classList.toggle('ghost', !zhHidden());
    toast(zhHidden() ? '挑戰模式：點「中文」才會看到' : '中文一直顯示');
  };
  const safeSpeakEn = (t, o) => (stale() ? Promise.resolve({ ok: false, reason: 'stale' }) : speakEn(t, o));
  const safeSpeakZh = (t) => (stale() ? Promise.resolve({ ok: false, reason: 'stale' }) : speakZh(t));
  const safeToast = (m, ms) => { if (!stale()) toast(m, ms); };
  const speakerCtx = {
    tts, stt, sfx, store, toast: safeToast, modeId,
    profile, settings, zhHidden,
    speakEn: safeSpeakEn, speakZh: safeSpeakZh,
  };
  const speaker = createSpeakerComponent(speakerCtx);
  let finished = false;
  let outcome = { hatched: 0, newBadge: null };
  const boxedThisRound = new Set(); // 同一輪同一個項目只升降一次複習盒
  // 記一輪成績（可以記不只一次，例如角色扮演換角色再演；模式最佳星數只會往上）
  const record = (r) => {
    const o = store.recordRound(pid(), { level: lv.id, theme: themeId || 'review', mode: modeId, stars: r.stars, kind: r.kind || game.kind, selfRated: !!r.selfRated });
    outcome = { hatched: outcome.hatched || o.hatched, newBadge: outcome.newBadge || o.newBadge };
    return o;
  };
  const ctx = {
    root, theme, level: lv, config: lv.config, store, tts, stt, sfx, toast: safeToast, speaker,
    profile, settings, zhHidden, speakEn: safeSpeakEn, speakZh: safeSpeakZh,
    isStale: stale,
    loadTheme: (id) => loadTheme(lv.id, id),
    chunkId: q.chunk || null, dialogueId: q.d || null,
    setProgress(i, n) {
      if (stale()) return;
      const gp = app.querySelector('#gp');
      if (!gp) return;
      gp.innerHTML = Array.from({ length: Math.max(1, Math.min(n, 20)) }, (_, k) => `<i class="${k < i - 1 ? 'done' : k === i - 1 ? 'cur' : ''}"></i>`).join('');
    },
    setReplay(fn) { replayFn = fn; },
    setSkip(fn) { skipFn = fn; },
    noteToday(key) { store.noteItemToday(pid(), key); },
    award(a) {
      const t = a.theme || themeId;
      if (!t) return;
      store.award(pid(), { level: lv.id, theme: t, mode: modeId === 'review' ? 'review' : modeId, itemId: a.itemId, stars: a.stars });
      if ((a.type === 'word' || a.type === 'phrase') && typeof a.pass === 'boolean' && !boxedThisRound.has(a.itemId)) {
        boxedThisRound.add(a.itemId);
        store.reviewResult(pid(), { level: lv.id, theme: t, type: a.type, itemId: a.itemId, pass: a.pass });
      }
    },
    record,
    done(r) {
      // 已經離開這一頁：不結算、不蓋畫面（小孩是自己按回去的）
      if (finished || stale()) return;
      finished = true;
      teardownGame();
      if (r.idle) {
        const o = store.markReviewIdle(pid());
        resultScreen({ themeId, modeId, stars: 1, idle: true, replay: [], hatched: o.hatched, newBadge: null });
        return;
      }
      if (!r.recorded) record(r);
      resultScreen({ themeId, modeId, stars: r.stars, replay: r.replay || [], hatched: outcome.hatched, newBadge: outcome.newBadge, selfRated: !!r.selfRated });
    },
  };
  try {
    const mod = await game.load();
    if (stale()) return;
    // 剛按下去的按鈕名稱（中文）先念完，遊戲再開始念英文，不然會被切掉
    if (S.navSpeech) await Promise.race([S.navSpeech, new Promise((r) => setTimeout(r, 2500))]);
    if (stale()) return;
    const g = await mod.start(ctx);
    if (stale()) { if (g && g.destroy) g.destroy(); return; }
    if (!finished) S.game = g;
  } catch (e) {
    console.error(e);
    if (!stale()) render(root, html`<div class="banner">這個遊戲打不開（${String(e && e.message || e)}）。先回首頁試別的。</div>`);
  }
}

/* ───────── 結果 ───────── */
async function resultScreen({ themeId, modeId, stars, replay, hatched, newBadge, idle = false, selfRated = false }) {
  const lv = level();
  const line = idle ? '今天沒有要複習的，休息一下 💤' : stars === 3 ? '太棒了！' : stars === 2 ? '很棒！再玩一次會更好' : '完成了！';
  const next = themeId ? recommendedMode(themeId) : null;
  const nextHash = themeId ? (next ? `#/play/${themeId}/${next.id}` : `#/theme/${themeId}`) : '#/home';
  render(app, html`
    <div class="screen">
      <div class="result">
        <div class="big-emoji">${idle ? '💤' : stars === 3 ? '🎉' : stars === 2 ? '😄' : '👍'}</div>
        <h1>${line}</h1>
        <div class="mt">${starsHtml(stars, { big: true })}</div>
        ${selfRated ? html`<div class="tiny mt">跟讀模式</div>` : ''}
        ${replay.length ? html`
          <div class="card mt-lg" style="text-align:left">
            <h3>再聽一次</h3>
            ${replay.slice(0, 12).map((it) => html`<div class="listrow"><span class="emoji">${it.emoji || '💬'}</span><span class="t"><div class="en">${it.en}</div><div class="zh">${it.zh}</div></span><button class="roundbtn sm" data-speak-en="${it.en}" aria-label="聽">🔊</button></div>`)}
          </div>` : ''}
        <div class="row center mt-lg" style="gap:12px">
          ${!idle ? html`<button class="btn soft" data-go="${themeId ? `#/play/${themeId}/${modeId}` : '#/review'}" data-say="再玩一次">🔁 再玩一次</button>` : ''}
          <button class="btn ok" data-go="${nextHash}" data-say="${next ? next.zh : '回首頁'}">${next ? `${next.emoji} ${next.zh}` : '🏠 回首頁'}</button>
        </div>
      </div>
    </div>`);
  if (!idle) { if (stars === 3) sfx.fanfare(); else sfx.star(stars); if (stars >= 2) confetti(stars === 3 ? 18 : 10); }
  if (settings().zhVoice) speakZh(line);
  celebrate({ hatched, newBadge, seq: S.routeSeq });
}

/** 拿到徽章／蛋孵出來的慶祝面板（結果畫面與首頁都會用）。已經換頁就不跳出來（不蓋住下一個遊戲） */
async function celebrate({ hatched = 0, newBadge = null, seq = S.routeSeq }) {
  const lv = level();
  const gone = () => seq !== S.routeSeq;
  if (newBadge) {
    const meta = lv.themes.find((t) => `${lv.id}/${t.id}` === newBadge);
    await new Promise((r) => setTimeout(r, 900));
    if (gone()) return;
    sheet({ title: '🏅 拿到徽章了！', body: html`<div class="center-text"><div style="font-size:84px">${meta ? meta.emoji : '🏅'}</div><p>「${meta ? meta.zh : ''}」六個遊戲都拿到 2 顆星以上！</p></div>`, buttons: [{ label: '耶！', cls: 'ok' }] });
    sfx.fanfare(); confetti(20);
  }
  if (hatched) {
    let stick = null;
    try { const list = await loadStickers(); stick = list[(hatched - 1) % list.length]; } catch { /* 貼紙檔還沒有 */ }
    await new Promise((r) => setTimeout(r, 700));
    if (gone()) return; // 貼紙已經記在貼紙簿裡了，只是不在別的畫面上跳出來
    sheet({
      title: '🐣 蛋孵出來了！',
      body: html`<div class="center-text"><div style="font-size:96px;line-height:1.1">${stick ? stick.emoji : '🐣'}</div>${stick ? html`<div class="en" style="font-size:28px;font-weight:800">${stick.en}</div><div class="muted">${stick.zh}</div>` : ''}<p class="small muted mt">今天的三個任務都完成了！</p></div>`,
      buttons: [{ label: '收進貼紙簿', cls: 'ok', onTap: () => {} }],
    });
    sfx.fanfare(); confetti(24);
    if (stick) { await speakEn(stick.en); if (!gone() && settings().zhVoice) speakZh(stick.zh); }
  }
}

/* ───────── 貼紙簿 ───────── */
async function stickersScreen() {
  const p = profile();
  const lv = level();
  let list = [];
  try { list = await loadStickers(); } catch { /* 還沒有 */ }
  const n = p.progress.hatched;
  const todayDone = store.dayTasks(pid()).hatched;
  const badges = lv.themes.filter((t) => store.hasBadge(pid(), lv.id, t.id));
  render(app, html`
    <div class="screen">
      <div class="topbar"><div class="title">📒 貼紙簿<span class="sub">每天完成三個任務，就孵出一隻</span></div><div class="pill">${n} / ${list.length || 60}</div></div>
      ${badges.length ? html`<div class="card soft mb"><h3>🏅 主題徽章</h3><div class="row wrap">${badges.map((t) => html`<span class="pill" style="font-size:22px">${t.emoji}</span>`)}</div></div>` : ''}
      <div class="stickers">
        ${list.map((s, i) => (i < n
          ? html`<button class="stick" data-speak-en="${s.en}" data-say="${s.zh}">${s.emoji}<small>${s.en}</small><small class="tiny">${s.zh}</small></button>`
          : i === n
            ? html`<div class="stick off" style="filter:grayscale(1)">${s.emoji}<small>${todayDone ? '明天' : '今天'}完成任務</small><small class="tiny">就孵出來</small></div>`
            : html`<div class="stick off">❔</div>`))}
      </div>
      ${!list.length ? html`<div class="banner">貼紙還在路上。</div>` : ''}
      ${tabbar('stickers')}
    </div>`);
}

/* ───────── 我會說 ───────── */
async function canSayScreen() {
  const lv = level();
  const items = store.canSay(pid(), lv.id);
  const nick = profile().nickname;
  const rows = [];
  if (items.length) {
    const themes = {};
    for (const t of lv.themes) { try { themes[t.id] = await loadTheme(lv.id, t.id); } catch { /* 略 */ } }
    for (const it of items) {
      for (const t of Object.values(themes)) {
        const ph = t.phrases.find((x) => x.id === it.phraseId);
        if (ph) { rows.push({ ...ph, count: it.count }); break; }
      }
    }
  }
  render(app, html`
    <div class="screen">
      <div class="topbar"><div class="title">💬 我會說<span class="sub">開口說拿到 3 顆星兩次，句子就會住進來</span></div><div class="pill">${rows.length} 句</div></div>
      ${rows.length ? html`<div class="card">${rows.map((r) => html`<div class="listrow"><span class="emoji">${r.emoji}</span><span class="t"><div class="en">${fillName(r.en, nick)}</div><div class="zh">${fillName(r.zh, nick)}<span class="tiny">　說過 ${r.count} 次</span></div></span><button class="roundbtn sm" data-speak-en="${fillName(r.en, nick)}" aria-label="聽">🔊</button></div>`)}</div>`
        : html`<div class="card center-text"><div style="font-size:64px">🦜</div><p class="muted">還沒有句子住進來。去「開口說」拿 3 顆星吧！</p><button class="btn" data-go="#/theme/${recommendedTheme().id}">去開口說</button></div>`}
      ${tabbar('cansay')}
    </div>`);
}

/* ───────── 家長區 ───────── */
function parentScreen() {
  render(app, html`<div class="screen wide"><div class="topbar"><button class="iconbtn ghost" data-go="${pid() ? '#/home' : '#/'}">◀</button><div class="title">👪 家長區</div></div><div id="parent-root"></div>${pid() ? tabbar('parent') : ''}</div>`);
  mountParent(app.querySelector('#parent-root'), {
    store, tts, stt, speakEn, speakZh, go, toast, sheet, levels: LEVELS, level, loadTheme: (id) => loadTheme(level().id, id), version: APP_VERSION,
    swWaiting: () => S.swWaiting, applyUpdate,
  });
}

/* ───────── 離線快取 ───────── */
function applyUpdate() {
  if (S.swWaiting) { S.swWaiting.postMessage('skipWaiting'); }
}
function showUpdatePill() {
  if (document.querySelector('.update-pill')) return;
  const b = document.createElement('button');
  b.className = 'update-pill';
  b.textContent = '有新版本，點一下更新';
  b.onclick = () => { applyUpdate(); b.remove(); };
  const name = (location.hash || '#/').replace(/^#\/?/, '').split(/[/?]/)[0];
  b.hidden = !(name === '' || name === 'home');
  document.body.appendChild(b);
}
async function registerSW() {
  // 在自己電腦上預覽時不裝離線快取（改了檔案重新整理就要看得到）
  const host = location.hostname;
  const local = host === 'localhost' || host === '[::1]' || host.startsWith('127.');
  if (local || !('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js');
    // 第一次安裝（還沒有舊版在管這一頁）不算「有新版本」
    const watch = (w) => { if (!w || !navigator.serviceWorker.controller) return; S.swWaiting = w; showUpdatePill(); };
    watch(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => { if (nw.state === 'installed') watch(reg.waiting); });
    });
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; location.reload(); });
  } catch { /* 離線快取失敗不影響玩 */ }
}

/* ───────── 啟動 ───────── */
(function boot() {
  const hint = document.createElement('div');
  hint.className = 'rotate-hint';
  hint.textContent = '請把平板轉直 📱';
  document.body.appendChild(hint);
  store.setActive(null); // 每次打開都從「誰要玩？」開始，避免手足記錯人
  if (location.hash && location.hash !== '#/') history.replaceState(null, '', location.pathname);
  route();
  registerSW();
  tts.ready().then(() => { if (!tts.hasVoice('en')) toast('這台裝置沒有英文語音，可以到設定裡下載英文語音', 4000); });
})();
