// 語音：念英文／中文（speechSynthesis）＋ 聽小孩說英文（SpeechRecognition）。
// 兩個都是瀏覽器內建、免費、不用金鑰。
//
// 念（TTS）：
//   - 聲音清單在很多裝置是慢慢載入的（voiceschanged），最多等 2.5 秒。
//   - iOS 規定第一次 speak() 一定要在使用者點擊的處理函式裡「同步」發生，所以 speak() 不等任何 await 才呼叫。
//   - 有些手機念完不發 onend，用字數估一個保險時間，到了就當念完。
//   - 英文聲音挑法：本機 > 兒童／自然聲音名單 > en-US > 其他英文。使用者在設定選過就照他選的。
//
// 聽（STT）：
//   - Chrome／Edge／Safari 有；Firefox 沒有。Chrome 會把聲音送到 Google 伺服器辨識，所以要有網路。
//   - 一定要從使用者點擊觸發；第一次會跳麥克風授權。
//   - 錯誤全部翻成中文訊息給畫面用。

const VOICE_WAIT_MS = 2500;
const PREFERRED_EN = [
  'microsoft ana', 'ana online', 'microsoft jenny', 'microsoft aria', 'microsoft michelle', 'microsoft emma',
  'google us english', 'samantha', 'karen', 'moira', 'tessa', 'daniel', 'microsoft guy', 'microsoft zira', 'alex',
];

function normLang(l) { return String(l || '').replace(/_/g, '-').toLowerCase(); }
function isEn(l) { return normLang(l).split('-')[0] === 'en'; }
function isZh(l) { const p = normLang(l).split('-'); return p[0] === 'zh' || p[0] === 'cmn'; }
function isCantonese(l) { const n = normLang(l); return n.startsWith('yue') || n.includes('-hk') || n.includes('-mo'); }

export function createTTS() {
  const g = globalThis;
  let synth = null;
  try { synth = g.speechSynthesis || null; } catch { synth = null; }
  const Utter = typeof g.SpeechSynthesisUtterance === 'function' ? g.SpeechSynthesisUtterance : null;
  const supported = !!(synth && Utter);
  let all = [];
  let ready = false;
  let readyResolve;
  const readyPromise = new Promise((r) => { readyResolve = r; });
  let gen = 0;
  let keep = null; // 留住 utterance，避免 Chrome 回收掉收不到 onend

  function refresh() {
    if (!supported) return false;
    try { all = Array.from(synth.getVoices() || []); } catch { all = []; }
    return all.length > 0;
  }

  function finish() {
    if (ready) return;
    ready = true;
    readyResolve(all.length > 0);
  }

  if (supported) {
    if (refresh()) finish();
    else {
      const t = setTimeout(finish, VOICE_WAIT_MS);
      const poll = setInterval(() => { if (refresh()) { clearInterval(poll); clearTimeout(t); finish(); } }, 200);
      try {
        synth.addEventListener('voiceschanged', () => { if (refresh() && !ready) { clearInterval(poll); clearTimeout(t); finish(); } });
      } catch { /* 舊瀏覽器 */ }
    }
  } else {
    ready = true;
    readyResolve(false);
  }

  // 本機聲音永遠排在線上聲音前面（線上聲音沒網路會無聲），再看名單、再看 en-US
  function rankEn(v) {
    const name = String(v.name || '').toLowerCase();
    const lang = normLang(v.lang);
    let score = 0;
    if (v.localService) score += 1000;
    const idx = PREFERRED_EN.findIndex((p) => name.includes(p));
    if (idx >= 0) score += 100 - idx;
    if (lang === 'en-us') score += 20;
    else if (lang.startsWith('en')) score += 10;
    if (/natural|neural/.test(name)) score += 5;
    return score;
  }

  function online() {
    try { return typeof navigator === 'undefined' || navigator.onLine !== false; } catch { return true; }
  }

  function rankZh(v) {
    const lang = normLang(v.lang);
    let score = 0;
    if (lang.includes('-tw')) score += 50;
    if (isCantonese(v.lang)) score -= 100;
    if (v.localService) score += 20;
    if (/hanhan|yating|hsiaochen|hsiaoyu|meijia|google 國語|zhiwei/i.test(v.name)) score += 10;
    return score;
  }

  function voicesFor(lang) {
    if (!all.length) refresh();
    const list = all.filter((v) => (lang === 'zh' ? isZh(v.lang) : isEn(v.lang)));
    const rank = lang === 'zh' ? rankZh : rankEn;
    return list
      .map((v, i) => ({ v, s: rank(v), i }))
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((x) => x.v);
  }

  function pick(lang, voiceURI) {
    let list = voicesFor(lang);
    // 離線時只用本機聲音（線上聲音會無聲）
    if (!online() && list.some((v) => v.localService)) list = list.filter((v) => v.localService);
    if (voiceURI) {
      const hit = list.find((v) => v.voiceURI === voiceURI);
      if (hit) return hit;
    }
    return list[0] || null;
  }

  /** iOS 第一句常常無聲：在使用者第一次點擊時先念一個空白 */
  function warmUp() {
    if (!supported) return;
    try {
      const u = new Utter(' ');
      u.volume = 0;
      u.rate = 2;
      synth.speak(u);
    } catch { /* 忽略 */ }
  }

  /**
   * 念一句。回傳 Promise，念完（或失敗、被取消）就 resolve({ ok, reason })，不會 reject。
   * lang：'en' 或 'zh'。
   */
  function speak(text, { lang = 'en', rate = 0.9, pitch = 1, voiceURI = null } = {}) {
    const s = String(text || '').trim();
    if (!supported || !s) return Promise.resolve({ ok: false, reason: supported ? 'empty' : 'unsupported' });
    const my = ++gen;
    return new Promise((resolve) => {
      let done = false;
      const finishOnce = (ok, reason) => { if (done) return; done = true; clearTimeout(watch); if (keep === u) keep = null; resolve({ ok, reason }); };
      let u;
      try {
        u = new Utter(s);
        const v = pick(lang, voiceURI);
        if (v) { u.voice = v; u.lang = v.lang; } else u.lang = lang === 'zh' ? 'zh-TW' : 'en-US';
        u.rate = Math.min(1.5, Math.max(0.5, Number(rate) || 0.9));
        u.pitch = Math.min(2, Math.max(0.5, Number(pitch) || 1));
        u.volume = 1;
      } catch {
        return resolve({ ok: false, reason: 'error' });
      }
      u.onend = () => finishOnce(true, 'end');
      u.onerror = (e) => finishOnce(false, (e && e.error) || 'error');
      const ms = Math.max(2500, (s.length / (lang === 'zh' ? 3.5 : 12)) * 1000 / u.rate * 1.8 + 1500);
      const watch = setTimeout(() => { if (my === gen) { try { synth.cancel(); } catch { /* 忽略 */ } } finishOnce(true, 'timeout'); }, ms);
      keep = u;
      try {
        if (synth.speaking || synth.pending) synth.cancel();
        if (synth.paused) synth.resume();
        synth.speak(u);
      } catch {
        finishOnce(false, 'error');
      }
    });
  }

  function cancel() {
    gen++;
    if (supported) { try { synth.cancel(); } catch { /* 忽略 */ } }
  }

  if (supported && g.document) {
    try {
      g.document.addEventListener('visibilitychange', () => { if (g.document.hidden) cancel(); });
      g.addEventListener('pagehide', cancel);
    } catch { /* 忽略 */ }
  }

  return {
    supported,
    ready: () => readyPromise,
    isReady: () => ready,
    voices: (lang) => voicesFor(lang).map((v) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang, local: !!v.localService })),
    hasVoice: (lang) => voicesFor(lang).length > 0,
    speak,
    cancel,
    warmUp,
    isSpeaking: () => { try { return !!(synth && (synth.speaking || synth.pending)); } catch { return false; } },
  };
}

export const STT_MESSAGES = {
  unsupported: '這個瀏覽器聽不到你說話。請改用 Chrome、Edge 或 Safari 打開，或先用「我念完了」自己檢查。',
  'not-allowed': '麥克風被擋住了。請在瀏覽器網址列旁邊的鎖頭圖示，把「麥克風」改成允許，再試一次。',
  'service-not-allowed': '這台裝置不讓網頁用語音辨識。可以試試看換成 Chrome 或 Safari。',
  'audio-capture': '找不到麥克風。請確認裝置有麥克風、沒有被其他程式占用。',
  'no-speech': '沒有聽到聲音，再大聲一點、對著麥克風說一次。',
  network: '語音辨識需要網路。請先連上網路，再按一次麥克風。',
  aborted: '這次取消了，再按一次麥克風就好。',
  timeout: '時間到了，再按一次麥克風說一次。',
  error: '聽不清楚，再試一次。',
};

export function createSTT() {
  const g = globalThis;
  const Rec = g.SpeechRecognition || g.webkitSpeechRecognition || null;
  const supported = typeof Rec === 'function';
  let current = null;
  let currentFinish = null;

  /**
   * 聽一句英文。回傳 Promise<{ ok, alternatives: string[], error?: code, message?: 中文 }>，不會 reject。
   * onInterim(text) 可以拿到還沒定稿的文字，畫面用來即時顯示。
   */
  function listen({ lang = 'en-US', maxMs = 8000, onInterim = null, onStart = null } = {}) {
    if (!supported) return Promise.resolve({ ok: false, alternatives: [], error: 'unsupported', message: STT_MESSAGES.unsupported });
    abort();
    return new Promise((resolve) => {
      let done = false;
      const finals = [];
      const interimAlts = [];
      let timer = null;
      let rec;
      const finish = (res) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (current === rec) { current = null; currentFinish = null; }
        resolve(res);
      };
      currentFinish = finish;
      try {
        rec = new Rec();
        rec.lang = lang;
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 5;
      } catch {
        return finish({ ok: false, alternatives: [], error: 'error', message: STT_MESSAGES.error });
      }
      current = rec;
      // 計時從「真的開始收音」才算：第一次會跳麥克風授權框，小孩去找爸媽的那段時間不能算進 8 秒
      let begun = false;
      const giveUp = (code) => {
        try { rec.abort(); } catch { /* 忽略 */ }
        finish({ ok: false, alternatives: [], error: code, message: STT_MESSAGES[code] || STT_MESSAGES.error });
      };
      const begin = () => {
        if (begun || done) return;
        begun = true;
        clearTimeout(timer);
        timer = setTimeout(() => {
          try { rec.stop(); } catch { /* 忽略 */ }
          setTimeout(() => {
            if (done) return;
            const alts = finals.length ? finals : interimAlts.filter(Boolean);
            if (alts.length) finish({ ok: true, alternatives: alts });
            else giveUp('timeout');
          }, 1200);
        }, maxMs);
      };
      rec.onaudiostart = begin;
      rec.onspeechstart = begin;
      rec.onstart = () => { begin(); if (typeof onStart === 'function') { try { onStart(); } catch { /* 忽略 */ } } };
      rec.onresult = (ev) => {
        begin();
        try {
          let interim = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const r = ev.results[i];
            if (r.isFinal) {
              for (let k = 0; k < r.length; k++) if (r[k] && r[k].transcript) finals.push(String(r[k].transcript));
            } else {
              interim += r[0] ? String(r[0].transcript) : '';
            }
          }
          if (interim) {
            interimAlts[0] = interim;
            if (typeof onInterim === 'function') { try { onInterim(interim); } catch { /* 忽略 */ } }
          }
        } catch { /* 忽略 */ }
      };
      rec.onerror = (ev) => {
        const code = (ev && ev.error) || 'error';
        if (code === 'aborted' && (finals.length || interimAlts.length)) return; // 我們自己停的，等 onend 整理結果
        finish({ ok: false, alternatives: finals.length ? finals : interimAlts, error: code, message: STT_MESSAGES[code] || STT_MESSAGES.error });
      };
      rec.onend = () => {
        const alts = finals.length ? finals : interimAlts.filter(Boolean);
        if (alts.length) finish({ ok: true, alternatives: alts });
        else finish({ ok: false, alternatives: [], error: 'no-speech', message: STT_MESSAGES['no-speech'] });
      };
      // 一直沒開始（授權框沒人按、或瀏覽器不發 onstart）→ 30 秒後放棄，並真的把辨識關掉，不留一個開著的麥克風
      timer = setTimeout(() => { if (!begun && !done) giveUp('timeout'); }, Math.max(maxMs, 30000));
      try {
        rec.start();
      } catch {
        finish({ ok: false, alternatives: [], error: 'error', message: STT_MESSAGES.error });
      }
    });
  }

  /** 使用者提早按「停」：停止收音，讓 onend 把已經聽到的整理出來 */
  function stop() {
    if (current) { try { current.stop(); } catch { /* 忽略 */ } }
  }

  // 外部取消（換頁、開始下一次聽）：關掉麥克風，並讓還在等結果的那一方收到「已取消」，不要讓它永遠等
  function abort() {
    if (current) {
      const r = current;
      const fin = currentFinish;
      current = null;
      currentFinish = null;
      try { r.onresult = null; r.onend = null; r.onerror = null; r.abort(); } catch { /* 忽略 */ }
      if (fin) fin({ ok: false, alternatives: [], error: 'aborted', message: STT_MESSAGES.aborted });
    }
  }

  return { supported, listen, stop, abort, isListening: () => !!current };
}
