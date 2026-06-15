// Service Worker for Web Push Notifications
// Immediately activate — don't wait for all windows to close
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload.title || "GenX Digitizing";
    const options = {
      body: payload.body || "",
      icon: "/images/black_logo.png",
      badge: "/favicon.ico",
      data: { url: payload.url || "/" },
      requireInteraction: false,
      tag: "genx-notification",
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // Plain text fallback
    event.waitUntil(
      self.registration.showNotification("GenX Digitizing", {
        body: event.data.text(),
        icon: "/images/black_logo.png",
        badge: "/favicon.ico",
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
