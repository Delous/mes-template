self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "DevIT",
    body: "Новое уведомление",
    url: "/tasks",
  };

  const data = event.data ? event.data.json() : fallback;

  event.waitUntil(
    self.registration.showNotification(data.title || fallback.title, {
      body: data.body || fallback.body,
      icon: "/icons/icon-180.png",
      badge: "/icons/icon-180.png",
      data: {
        url: data.url || fallback.url,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/tasks";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url.endsWith(url));
      if (existingClient) return existingClient.focus();
      return self.clients.openWindow(url);
    }),
  );
});
