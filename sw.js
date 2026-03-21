// NYANO VOICE QUEST - Service Worker v6
const CACHE = 'nyano-v6';
const FILES = ['./nyano_v6.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES).catch(() => {}))
  );
});

// Activate: delete ALL old caches (v5, v4, etc.)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// Network-first for HTML (always fresh), cache-first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document' || url.pathname.endsWith('.html');
  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});

// Notifications
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFS') scheduleAll(e.data.notifs);
  if (e.data && e.data.type === 'CANCEL_NOTIFS') clearAllTimers();
});

let timers = [];
function clearAllTimers() { timers.forEach(t => clearTimeout(t)); timers = []; }

function scheduleAll(notifs) {
  clearAllTimers();
  const now = new Date();
  function nextTime(h, m) {
    const t = new Date(); t.setHours(h, m, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    return t - now;
  }
  if (notifs.morning) {
    timers.push(setTimeout(() => {
      self.registration.showNotification('NYANO VOICE QUEST 🎙️', {
        body: 'おはよう！ウォームアップで声帯を起こそう。今日も一歩前へ。',
        icon: './icon-192.png', badge: './icon-192.png',
        tag: 'morning', requireInteraction: false, data: { url: './' }
      });
      scheduleAll(notifs);
    }, nextTime(8, 0)));
  }
  if (notifs.after) {
    timers.push(setTimeout(() => {
      self.registration.showNotification('NYANO VOICE QUEST ⚔️', {
        body: 'バイトお疲れ！声優練習30分やろう。デイリー依頼も確認！',
        icon: './icon-192.png', badge: './icon-192.png',
        tag: 'after', requireInteraction: false, data: { url: './' }
      });
      scheduleAll(notifs);
    }, nextTime(22, 0)));
  }
  if (notifs.night) {
    timers.push(setTimeout(() => {
      self.registration.showNotification('NYANO VOICE QUEST 🌙', {
        body: 'まだ練習できてない？2分だけでいい。ストリークを守ろう。',
        icon: './icon-192.png', badge: './icon-192.png',
        tag: 'night', requireInteraction: true,
        actions: [{ action: 'open', title: '練習する' }, { action: 'dismiss', title: '明日やる' }],
        data: { url: './' }
      });
      scheduleAll(notifs);
    }, nextTime(23, 0)));
  }
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      if (list.length > 0) { list[0].focus(); return; }
      clients.openWindow(e.notification.data?.url || './');
    })
  );
});
