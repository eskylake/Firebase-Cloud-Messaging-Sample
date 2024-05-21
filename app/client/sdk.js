import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getMessaging,
  getToken as getFCMToken,
  onMessage,
  isSupported,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";
import { isSupported as isSwSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-sw.js";

const error = function error(ns, message, err) {
  console.group(
    `%c FCM %c [sdk] %c [Error] %c [${ns}] - ${message}`,
    "background: #E72020; color: #fff",
    "background: #E6956C; color: #fff",
    "background: #F39C12; color: black",
    "background: #FCE4E4; color: black"
  );
  console.error(err);
  console.groupEnd();
};

const log = function log(ns) {
  const args = Array.prototype.slice.call(arguments, ns ? 1 : 0);
  console.group(
    `%c FCM %c [sdk] %c [Info] %c [${ns}]`,
    "background: #E72020; color: #fff",
    "background: #E6956C; color: #fff",
    "background: #1E88E5; color: #fff",
    "background: #BBE6CC; color: black"
  );
  console.log.apply(console, args);
  console.groupEnd();
};

(async function (window) {
  if (!isSupported()) {
    error("Push Init", "Notification is not supported", window);
  } else if (!isSwSupported()) {
    error("Push Init", "Service worker is not supported", window);
  } else if (window.Notification.permission === "denied") {
    error("Push Init", "Notification is blocked");
  } else {
    const SW_FILE = "sw.js";
    const SERVER_URL = "http://localhost:3000";
    let VAPID = "";

    const loadFirebaseConfig = async () => {
      return fetch("firebase-config.json")
        .then((response) => response.json())
        .then((data) => {
          if (
            !data ||
            typeof data !== "object" ||
            Object.keys({ ...data }).length === 0
          ) {
            throw new Error("FirebaseConfig is not valid");
          }

          return data;
        })
        .catch((err) => {
          error("Load FirebaseConfig", "Can not fetch the config", err);
          return false;
        });
    };

    const encodeConfig = (firebaseConfig) =>
      window.btoa(JSON.stringify(firebaseConfig));

    const subscribeToken = async (fcmToken) => {
      log("Notification Subscribe", "Subscribing Token", fcmToken);

      if (!!fcmToken === false) return;

      return fetch(`${SERVER_URL}/subscribe`, {
        method: "POST",
        headers: new Headers({ "Content-type": "application/json" }),
        body: JSON.stringify({
          fcmToken,
        }),
      })
        .then(() => {
          log("Notification Subscribe", "Token Subscribed", fcmToken);
        })
        .catch((err) =>
          error("Notification Subscribe", "Notification Subscribe", err)
        );
    };

    const getSW = async () => {
      log("Notification Get Service Worker", "Finding Service Worker...");

      return window.navigator.serviceWorker
        .getRegistration("/")
        .then((registration) => {
          log(
            "Notification Get Service Worker",
            "Finding Service Worker",
            registration
          );

          if (registration?.active) {
            log(
              "Notification Get Service Worker",
              "Service Worker is Active",
              registration.active
            );

            const { scriptURL } = registration.active;
            if (scriptURL.search(`${SW_FILE}`) > -1) {
              log(
                "Notification Get Service Worker",
                "Found Service Worker",
                registration
              );

              return registration;
            }
          }

          log(
            "Notification Get Service Worker",
            "Did not find any active Service Worker",
            registration
          );

          return null;
        })
        .catch((err) =>
          error(
            "Notification Get Service Worker",
            "Can not Get Service Worker Registration",
            err
          )
        );
    };

    const registerSW = async (firebaseConfig) => {
      try {
        let sw = await getSW();

        if (!sw) {
          const swOptions = {
            type: "classic",
            scope: "/",
          };

          log(
            "Notification Service Worker",
            "Registering Service Worker",
            SW_FILE,
            swOptions
          );

          sw = await window.navigator.serviceWorker.register(
            `/${SW_FILE}?firebaseConfig=${encodeURIComponent(
              encodeConfig(firebaseConfig.credentials)
            )}`,
            swOptions
          );
          log("Notification Service Worker", "Registered Service Worker");
        }

        return sw
          .update()
          .then((registration) => {
            log(
              "Notification Service Worker",
              "Update Service Worker",
              registration
            );

            return registration;
          })
          .catch((err) =>
            error(
              "Notification Service Worker",
              "Can not update Service Worker registration",
              err
            )
          );
      } catch (error) {
        error(
          "Notification Service Worker",
          "Service Worker Registration Error",
          error
        );
      }
    };

    const getToken = async (firebaseConfig) => {
      try {
        log("Notification getToken", "Register Service Worker");

        const ServiceWorkerRegistration = await registerSW(firebaseConfig);

        log("Notification getToken", "Calling FCM getToken()...");
        return getFCMToken(messaging, {
          serviceWorkerRegistration: ServiceWorkerRegistration,
          vapidKey: firebaseConfig.VAPID,
        })
          .then((token) => {
            log("Notification getToken", token);

            return token;
          })
          .catch((err) => {
            error("Notification getToken", "Can not Get FCM Token", err);
            return null;
          });
      } catch (error) {
        error("Notification getToken", "Get FCM Token Error", error);
      }
    };

    const requestPermission = async (firebaseConfig) => {
      log("Notification Permission", "Requesting permission...");

      if (window.Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          const token = await getToken(firebaseConfig);
          if (token) {
            log(
              "Notification Permission",
              "Notification permission granted",
              token
            );
            await subscribeToken(token);
          }
        } else {
          error(
            "Notification Permission",
            "Unable to get permission to notify",
            permission
          );
        }
      } else {
        error(
          "Notification Permission",
          "Notification Permission is Denied: Permission is: [%s]",
          window.Notification.permission
        );
      }
    };

    const showNotification = (payload) => {
      const {
        data: { title, body, actionUrl, icon },
      } = payload;

      const notification = new window.Notification(title, {
        body,
        icon,
      });

      notification.onclick = (event) => {
        event.preventDefault(); // prevent the browser from focusing the Notification's tab
        window.open(actionUrl, "_blank").focus();
      };
    };

    const firebaseConfig = await loadFirebaseConfig();

    if (!firebaseConfig) {
      return;
    }

    const app = initializeApp(
      firebaseConfig.credentials,
      firebaseConfig.projectId
    );

    const messaging = getMessaging(app);

    await requestPermission(firebaseConfig);

    onMessage(messaging, (payload) => {
      log("FCM onMessage", "Message received", payload);
      showNotification(payload);
    });
  }
})(window);
