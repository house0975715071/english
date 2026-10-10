// 離線快取（Service Worker）：第一次打開後，把網頁用到的檔案存在裝置裡，之後沒網路也能玩。
// 版本號由 tools/build-web.mjs 蓋章；本機預覽（127.0.0.1）不會註冊這支，改檔案重新整理就看得到。
// 策略：同網域的檔案只用這一版的快取（安裝時整套抓好）；快取沒有才連網；首頁拿不到就回快取的首頁。
const VERSION = "20261010-66a86446";
const CACHE = `kids-english-${VERSION}`;
const PRECACHE = ["./index.html","./app.js","./content/index.js","./content/levels/6-9/config.js","./content/levels/6-9/manifest.js","./content/levels/6-9/themes/animals-and-pets.js","./content/levels/6-9/themes/birthday-and-holidays.js","./content/levels/6-9/themes/daily-routine.js","./content/levels/6-9/themes/family-and-home.js","./content/levels/6-9/themes/feelings-and-body.js","./content/levels/6-9/themes/going-out.js","./content/levels/6-9/themes/greetings-and-about-me.js","./content/levels/6-9/themes/mealtime.js","./content/levels/6-9/themes/numbers-and-colors.js","./content/levels/6-9/themes/play-and-friends.js","./content/levels/6-9/themes/school-day.js","./content/levels/6-9/themes/shopping.js","./content/levels/6-9/themes/weather-and-clothes.js","./content/stickers.js","./games/build-sentence.js","./games/index.js","./games/learn-cards.js","./games/listen-tap.js","./games/match-pairs.js","./games/review.js","./games/role-play.js","./games/say-it.js","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon.svg","./","./lib/audio.js","./lib/scoring.js","./lib/speaker.js","./lib/speech.js","./lib/store.js","./lib/ui.js","./lib/util.js","./manifest.webmanifest","./parent.js","./style.css"];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const base = new URL('./', self.location.href);
    // 任何一個檔沒抓到，這次安裝就算失敗（瀏覽器之後會再試）：寧可繼續用舊的完整版，也不要換成缺檔的新版
    await Promise.all(PRECACHE.filter((p) => p !== '__PRECACHE__').map((p) => cache.add(new Request(new URL(p, base).href, { cache: 'reload' }))));
    // 不自動接管：新版本等「有新版本，點一下更新」被按下（message: skipWaiting）才換，不會在一輪遊戲中途換檔
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('kids-english-') && k !== CACHE).map((k) => caches.delete(k)));
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // 快取裡有就只用快取，而且不在背景覆蓋它：同一版的檔案要整套一致（新版由新的 Service Worker 整套換）
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    const res = await fetch(req).then((r) => {
      if (r && r.ok && r.type === 'basic') cache.put(req, r.clone()).catch(() => {});
      return r;
    }).catch(() => null);
    if (res) return res;
    if (req.mode === 'navigate') {
      const home = await cache.match(new URL('./index.html', new URL('./', self.location.href)).href);
      if (home) return home;
    }
    return new Response('離線中，這個檔案還沒存到裝置裡。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
