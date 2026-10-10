// 開口說共用元件：開口說、角色扮演、複習都用這一個。
//
// 流程：聽（大喇叭，麥克風灰的）→ 麥克風解鎖 → 一下點開始聽（不是按住）→ 結果只亮「念到的字」（綠色＋粗體＋底線）
//      → 1～3 顆星 → 🦜 再念一次 → 「再說一次」「下一句」一樣大。最多 2 次計分，取最好；沒聽到聲音不算一次。
//      辨識器有聽到東西、只是一個字都沒對上 → 也算一次、給 1 顆星（「我有聽到你囉！」），不讓小孩卡在原地。
// 跟讀模式（沒有辨識、沒網路、家長關掉、麥克風被擋、連續兩次辨識失敗）：模型再念一次 → 3-2-1 → 小孩跟著念
//      → 「我說完了」2 星；旁邊小小的「給爸媽 👍」可以給第 3 顆。小孩看到的永遠是一句友善的話，不是錯誤碼。
// 麥克風開著的時候，畫面上任何會出聲的按鈕都不響（不然平板會念給自己聽）。
// 原始辨識文字不給小孩看，只記到家長區。
import { scoreSpeech } from './scoring.js';
import { html, raw, render, starsHtml, confetti, fillName } from './ui.js';
import { escapeHtml } from './util.js';

const MIC_INTRO_KEY = 'kids-english:mic-intro';
const PRAISE = { 3: '太棒了！', 2: '很接近！', 1: '我有聽到你囉！' };
// 這幾種代表「這台裝置／這個瀏覽器現在就是不能聽」→ 立刻改跟讀模式
const HARD_ERRORS = ['not-allowed', 'service-not-allowed', 'network', 'audio-capture', 'unsupported'];
// 這幾種只是「這次沒聽到」，不算辨識壞掉
const SOFT_ERRORS = ['no-speech', 'timeout', 'aborted'];

// 這一次打開網頁期間，小孩（或爸媽）主動選了「先用跟讀模式」→ 之後每一輪都不再跳麥克風，重新整理才恢復
let userChoseEcho = false;

export function createSpeakerComponent(ctx) {
  // ctx: { tts, stt, sfx, store, profile, settings, speakEn(text, {rate}), speakZh(text), zhHidden(), toast, modeId }
  // 遊戲把「下一句」「再說一次」要做的事掛在回傳的 api 上：speaker.onNext = fn
  const api = { mount: null, recognitionAvailable: null, resetSession: null, onNext: null, onRetry: null };
  let sttErrors = 0;
  let sessionEcho = false; // 這一輪因為辨識失敗改成跟讀；下一輪重新試

  function recognitionAvailable() {
    if (!ctx.stt.supported) return false;
    if (ctx.settings().recognition === false) return false;
    if (sessionEcho || userChoseEcho) return false;
    try { if (navigator.onLine === false) return false; } catch { /* 忽略 */ }
    return true;
  }
  function micIntroShown() { try { return localStorage.getItem(MIC_INTRO_KEY) === '1'; } catch { return true; } }
  function markMicIntro() { try { localStorage.setItem(MIC_INTRO_KEY, '1'); } catch { /* 忽略 */ } }

  /**
   * 掛到 container 上。phrase: { id, en, zh, emoji, keyWords, alsoAccept }，roleName 用來換 {name}。
   * onResult({ stars, selfRated, transcript, attempts, skipped })
   * 回傳 { destroy, replay, skip, isDone, isEcho }
   */
  function mount(container, { phrase, onResult, roleName = 'Amy', autoListen = false, showNext = true, nextLabel = '下一句' }) {
    const nick = ctx.profile().nickname;
    const en = fillName(phrase.en, nick, roleName);
    const zh = fillName(phrase.zh, nick, roleName);
    const st = {
      listened: false, attempts: 0, best: null, kept: null, listening: false, feedback: false,
      echo: !recognitionAvailable(), countdown: 0, echoWaiting: false, done: false,
    };
    let alive = true;

    const speakModel = (slow = false) => ctx.speakEn(en, { rate: slow ? 0.7 : undefined });
    const better = (a, b) => (!b || (a && (a.stars > b.stars || (a.stars === b.stars && (a.ratio || 0) > (b.ratio || 0))))) ? a : b;

    function wordsHtml(words) {
      if (!words) return escapeHtml(en);
      return words.map((w) => (w.hit ? `<span class="wordmark hit">${escapeHtml(w.word)}</span>` : `<span class="wordmark">${escapeHtml(w.word)}</span>`)).join(' ');
    }

    function draw() {
      if (!alive) return;
      const zhHidden = ctx.zhHidden();
      const res = st.best;
      const micCls = st.listening ? 'listening' : (st.listened && !st.feedback) ? 'ready' : 'locked';
      let bottom;
      if (st.done) {
        bottom = html`
          <div class="row center mt" style="gap:14px">
            <button class="btn soft" data-act="again"><span class="emoji">🔁</span> 再說一次</button>
            ${showNext ? html`<button class="btn ok" data-act="next"><span class="emoji">👉</span> ${nextLabel}</button>` : ''}
          </div>`;
      } else if (st.echo) {
        if (st.countdown > 0) {
          bottom = html`<div class="center-text mt" style="font-size:64px;line-height:1">${st.countdown}</div><div class="center-text muted">準備好，跟著說！</div>`;
        } else if (st.echoWaiting) {
          bottom = html`
            <div class="center-text muted mt">說完了嗎？</div>
            <div class="row center mt" style="gap:14px">
              <button class="btn ok big" style="width:auto" data-act="echo-done"><span class="emoji">👍</span> 我說完了</button>
            </div>
            <div class="row center mt"><button class="btn ghost small" data-act="echo-parent">給爸媽：爸媽聽到了 👍</button></div>`;
        } else if (st.listened) {
          bottom = html`
            <div class="center-text tiny mt">跟讀模式</div>
            <div class="row center mt" style="gap:14px">
              <button class="btn accent" data-act="echo-start"><span class="emoji">🎤</span> 換你說</button>
            </div>`;
        } else {
          bottom = html`<div class="center-text muted mt">先按喇叭聽一次</div>`;
        }
      } else {
        bottom = html`
          <div class="row center mt">
            <button class="roundbtn mic ${micCls}" data-act="mic" aria-label="麥克風"><span class="ring"></span>🎤</button>
          </div>
          <div class="center-text muted small mt">${st.listening ? '換你說！' : st.feedback ? '聽鸚鵡再說一次…' : st.listened ? '按麥克風，說一次' : '先按喇叭聽一次'}</div>`;
      }
      render(container, html`
        <div class="qcard ${zhHidden ? 'zh-hidden' : ''}">
          <div class="scene">${phrase.emoji || '💬'}</div>
          <div class="en">${raw(wordsHtml(res && res.words))}</div>
          <div class="zh" data-act="zh">${zh}</div>
          <button class="zh-chip" data-act="peek">中文</button>
          ${res ? html`<div class="mt">${starsHtml(res.stars, { big: true })}</div>` : ''}
          <div class="row center mt" style="gap:16px">
            <button class="roundbtn sm" data-act="listen" aria-label="聽一次">🔊</button>
            <button class="roundbtn sm" data-act="slow" aria-label="慢慢聽">🐢</button>
            ${res && !st.echo ? html`<button class="roundbtn sm" data-act="parrot" aria-label="鸚鵡再念一次">🦜</button>` : ''}
          </div>
        </div>
        ${bottom}
      `);
    }

    function goEcho(message) {
      st.echo = true;
      st.listening = false;
      if (message) ctx.toast(message);
      draw();
    }

    async function startRecognition() {
      if (st.listening || st.done || st.feedback) return;
      if (!micIntroShown()) {
        showMicIntro(
          () => { markMicIntro(); startRecognition(); },
          // 選跟讀：不記「說明看過了」，下次要開麥克風前一定再出現說明，瀏覽器不會無預警跳授權框
          () => { userChoseEcho = true; goEcho(''); },
        );
        return;
      }
      ctx.tts.cancel();
      st.listening = true;
      ctx.sfx.mic();
      draw();
      const r = await ctx.stt.listen({ lang: 'en-US', maxMs: 8000 });
      if (!alive) return;
      st.listening = false;
      if (!r.ok) {
        const code = r.error;
        if (HARD_ERRORS.includes(code) || (!SOFT_ERRORS.includes(code) && ++sttErrors >= 2)) {
          sessionEcho = true;
          goEcho('這台裝置現在聽不到你說話，我們改用跟讀模式');
          return;
        }
        if (code !== 'aborted') ctx.toast(SOFT_ERRORS.includes(code) ? '靠近一點再說一次' : '再試一次');
        draw();
        return;
      }
      sttErrors = 0;
      const res = scoreSpeech(en, r.alternatives, { keyWords: phrase.keyWords || [], alsoAccept: phrase.alsoAccept || [] });
      if (!res.transcript) { ctx.toast('靠近一點再說一次'); draw(); return; }
      // 有聽到東西就是有開口：至少 1 顆星
      if (res.stars < 1) res.stars = 1;
      st.attempts += 1;
      st.best = better(res, st.best);
      ctx.store.logUtterance(ctx.profile().id, { target: en, heard: res.transcript, stars: res.stars, mode: ctx.modeId || 'say-it' });
      if (res.stars >= 3) { ctx.sfx.fanfare(); confetti(); } else ctx.sfx.star(res.stars);
      // 鸚鵡再念一次＋中文鼓勵；這段時間麥克風鎖著（不在點擊裡，iOS 可能無聲，所以畫面上有 🦜 可以再按）
      st.feedback = true;
      draw();
      await ctx.speakEn(en);
      if (!alive) return;
      if (ctx.settings().zhVoice) await ctx.speakZh(PRAISE[res.stars]);
      if (!alive) return;
      st.feedback = false;
      if (st.attempts >= 2 || res.stars === 3) finish(false);
      else draw();
    }

    function finish(skipped) {
      if (st.done) return;
      st.done = true;
      st.feedback = false;
      st.best = better(st.best, st.kept);
      draw();
      const best = st.best;
      onResult({
        stars: best ? best.stars : (skipped ? 0 : 1),
        selfRated: !!(best && best.self),
        transcript: best ? best.transcript || '' : '',
        attempts: st.attempts,
        skipped: !!skipped && !best,
      });
    }

    async function echoStart() {
      if (st.countdown > 0 || st.echoWaiting) return;
      ctx.tts.cancel();
      for (const n of [3, 2, 1]) {
        st.countdown = n; draw(); ctx.sfx.tap();
        await new Promise((r) => setTimeout(r, 700));
        if (!alive) return;
      }
      st.countdown = 0;
      st.echoWaiting = true;
      draw();
      await speakModel();
    }

    function echoDone(stars) {
      if (st.done) return;
      st.echoWaiting = false;
      st.best = better({ stars, words: null, transcript: '', self: true }, st.best);
      ctx.sfx.star(stars);
      if (stars === 3) confetti();
      finish(false);
    }

    function onTap(e) {
      const b = e.target.closest('[data-act]');
      if (!b || !container.contains(b)) return;
      const act = b.dataset.act;
      // 麥克風開著：除了再按一下麥克風（提早結束），其他按鈕都不理
      if (st.listening && act !== 'mic') return;
      if (act === 'listen' || act === 'slow') {
        st.listened = true;
        if (!st.feedback) draw();
        speakModel(act === 'slow');
      } else if (act === 'zh') {
        if (ctx.settings().zhVoice) ctx.speakZh(zh);
      } else if (act === 'peek') {
        const z = container.querySelector('.zh');
        if (z) { z.classList.add('revealed'); setTimeout(() => z.classList.remove('revealed'), 2000); }
        if (ctx.settings().zhVoice) ctx.speakZh(zh);
      } else if (act === 'mic') {
        if (st.listening) { ctx.stt.stop(); return; }
        if (st.feedback) return;
        if (!st.listened) { st.listened = true; draw(); speakModel(); return; }
        startRecognition();
      } else if (act === 'parrot') {
        speakModel();
      } else if (act === 'again') {
        // 再說一次：剛才拿到的星星先收著（kept），這次如果比較差或跳過，回報的還是比較好的那次
        st.kept = better(st.best, st.kept);
        st.done = false; st.attempts = 0; st.best = null; st.listened = true; st.echoWaiting = false;
        draw();
        if (api.onRetry) api.onRetry();
      } else if (act === 'next') {
        if (api.onNext) api.onNext();
      } else if (act === 'echo-start') {
        echoStart();
      } else if (act === 'echo-done') {
        echoDone(2);
      } else if (act === 'echo-parent') {
        echoDone(3);
      }
    }
    container.addEventListener('click', onTap);
    draw();
    if (autoListen) { st.listened = true; draw(); speakModel(); }

    return {
      destroy() { alive = false; container.removeEventListener('click', onTap); ctx.stt.abort(); },
      replay() { if (st.listening) return; st.listened = true; if (!st.feedback) draw(); speakModel(); },
      skip() { if (st.listening) ctx.stt.abort(); st.listening = false; finish(true); },
      isDone: () => st.done,
      isEcho: () => st.echo,
    };
  }

  function showMicIntro(onAllow, onEcho) {
    const bg = document.createElement('div');
    bg.className = 'sheet-bg';
    bg.innerHTML = `<div class="sheet" role="dialog">
      <h2 style="margin:0 0 10px;font-size:24px">🎤 換你開口說英文囉！</h2>
      <p>等一下畫面會跳出「要允許使用麥克風嗎？」，請找爸爸媽媽一起按「允許」。</p>
      <ul style="padding-left:20px;margin:8px 0">
        <li>你的聲音不會被錄下來，也不會存起來，說完就不見了。</li>
        <li>現在不能用麥克風也沒關係，可以先用「跟讀模式」，一樣可以練習。</li>
      </ul>
      <details class="small muted" style="margin:8px 0"><summary>給爸爸媽媽</summary>
        <p>語音辨識是瀏覽器內建功能：用 Chrome／Edge 時，孩子說的話會送到 Google／Microsoft 的伺服器辨識，所以需要網路；iPad 的 Safari 用的是 Apple 的辨識，需要在設定裡開啟「聽寫」。這個 App 本身不錄音、不上傳、不儲存任何聲音或資料。不想開麥克風，可以到「家長區」把語音辨識關掉，改用「跟讀模式」。如果不小心按到「不允許」，可以在網址列旁邊的鎖頭圖示把麥克風改回允許。</p>
      </details>
      <div class="stack mt">
        <button class="btn block ok" data-k="allow">好，打開麥克風</button>
        <button class="btn block soft" data-k="echo">先用跟讀模式</button>
      </div>
    </div>`;
    bg.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-k]');
      if (!b) return;
      bg.remove();
      if (b.dataset.k === 'allow') onAllow(); else onEcho();
    });
    document.body.appendChild(bg);
  }

  api.mount = mount;
  api.recognitionAvailable = recognitionAvailable;
  api.resetSession = () => { sessionEcho = false; sttErrors = 0; };
  return api;
}

/** 第一次設定時爸媽選了「先用跟讀模式」：這次打開網頁期間都用跟讀，而且不記「說明看過了」 */
export function chooseEchoForSession() { userChoseEcho = true; }
