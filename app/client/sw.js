importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"
);

(function (self) {
  let messaging;

  const log = function log(ns) {
    const args = Array.prototype.slice.call(arguments, ns ? 1 : 0);
    console.group(
      `%c FCM %c [sw] %c [Info] %c [${ns}]`,
      "background: #E72020; color: #fff",
      "background: #007E80; color: #fff",
      "background: #1E88E5; color: #fff",
      "background: #BBE6CC; color: black"
    );
    console.log.apply(console, args);
    console.groupEnd();
  };

  const decodeConfig = () =>
    JSON.parse(self.atob(new URL(location).searchParams.get("firebaseConfig")));

  self.addEventListener("install", () => {
    self.skipWaiting();
  });

  self.addEventListener("notificationclick", (event) => {
    const { notification } = event;
    const {
      data: { actionUrl },
    } = notification;

    log("Notification onClick", "Start Click", notification);

    event.notification.close();

    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientsArr) => {
          // If a Window tab matching the targeted URL already exists, focus that;
          const hadWindowToFocus = clientsArr.some((windowClient) => {
            windowClient.url === actionUrl
              ? (windowClient.focus(), true)
              : false;
          });

          // Otherwise, open a new tab to the applicable URL and focus it.
          if (!hadWindowToFocus) {
            return clients.openWindow(actionUrl);
          }
        })
    );

    log("Notification onClick", "End Click", notification);
  });

  const firebaseConfig = decodeConfig();

  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();

  self.addEventListener("push", function (event) {
    messaging.onBackgroundMessage((payload) => {
      log(
        "Notification onBackgroundMessage",
        "Creating Notification To Show",
        payload
      );

      const {
        data: { title, body, actionUrl, icon, image },
      } = payload;

      const notificationOptions = {
        body,
        icon,
        image,
        data: {
          actionUrl,
        },
      };

      log(
        "Notification onBackgroundMessage",
        "Start showNotification",
        payload
      );

      const promiseChain = new Promise((resolve) => {
        self.registration
          .showNotification(title, notificationOptions)
          .then(() => resolve());
      });

      event.waitUntil(promiseChain);

      log("Notification onBackgroundMessage", "End showNotification", payload);
    });
  });
})(self);
