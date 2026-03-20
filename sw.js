// NYANO VOICE QUEST - Service Worker v4
const CACHE = 'nyano-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./nyano_v4.html']))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ── SCHEDULED NOTIFICATIONS ──────────────────────────────
// Receive schedule from main thread
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFS') {
    scheduleAll(e.data.notifs);
  }
  if (e.data && e.data.type === 'CANCEL_NOTIFS') {
    clearAllTimers();
  }
});

let timers = [];
function clearAllTimers() {
  timers.forEach(t => clearTimeout(t));
  timers = [];
}

function scheduleAll(notifs) {
  clearAllTimers();

  const now = new Date();

  function nextTime(h, m) {
    const t = new Date();
    t.setHours(h, m, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    return t - now;
  }

  if (notifs.morning) {
    const delay = nextTime(8, 0);
    const id = setTimeout(() => {
      self.registration.showNotification('NYANO VOICE QUEST 🎙️', {
        body: 'おはよう！ウォームアップで声帯を起こそう。今日も一歩前へ。',
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: 'morning',
        requireInteraction: false,
        data: { url: './' }
      });
      scheduleAll(notifs); // reschedule tomorrow
    }, delay);
    timers.push(id);
  }

  if (notifs.after) {
    const delay = nextTime(22, 0);
    const id = setTimeout(() => {
      self.registration.showNotification('NYANO VOICE QUEST ⚔️', {
        body: 'バイトお疲れ！声優練習30分やろう。デイリー依頼も残ってるよ。',
        icon: './icon-192.png',
        tag: 'after',
        requireInteraction: false,
        data: { url: './' }
      });
      scheduleAll(notifs);
    }, delay);
    timers.push(id);
  }

  if (notifs.night) {
    // 23:00 reminder if no practice yet
    const delay = nextTime(23, 0);
    const id = setTimeout(() => {
      // Only fire if no practice today (check via IndexedDB not available in SW easily,
      // so always fire and let the app handle the UI)
      self.registration.showNotification('NYANO VOICE QUEST 🌙', {
        body: 'まだ練習できてない？2分だけでいい。ストリークを守ろう。',
        icon: './icon-192.png',
        tag: 'night',
        requireInteraction: true,
        actions: [
          { action: 'open', title: '練習する' },
          { action: 'dismiss', title: '明日やる' }
        ],
        data: { url: './' }
      });
      scheduleAll(notifs);
    }, delay);
    timers.push(id);
  }
}

// Tap notification → open app
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
