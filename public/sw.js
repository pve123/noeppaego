/**
 * 서비스 워커 — 인터넷이 끊겼을 때 크롬 공룡 대신 /offline.html 을 보여 주는 일만 한다.
 * 연휴·일정 같은 데이터는 저장하지 않는다(지난 화면이 남아 헷갈리지 않게). 페이지 이동만 가로채고 나머지 요청은 건드리지 않는다.
 * offline.html 을 고치면 CACHE 숫자를 올린다 — 그래야 새 화면을 다시 받아 둔다.
 */
const CACHE = "offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      // 서비스 워커가 깨어나는 동안 페이지 요청을 먼저 보내 둔다 — 온라인일 때 느려지지 않게.
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse;
        return preloaded ?? (await fetch(event.request));
      } catch {
        const cached = await caches.match(OFFLINE_URL);
        return cached ?? Response.error();
      }
    })(),
  );
});
