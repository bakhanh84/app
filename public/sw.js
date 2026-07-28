self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'SparkGo — Nhắc Lịch Bảo Dưỡng';
    const options = {
      body: data.body || 'Xe của bạn đã đến lịch bảo dưỡng định kỳ.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        url: data.url || '/calendar',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/calendar';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
