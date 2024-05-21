const firebaseAdmin = require("firebase-admin");
const serviceAccount = require("../service-account.json");

class Firebase {
  constructor({ appId }) {
    this.#init({ appId });
  }

  #init({ appId }) {
    const credential =
      typeof serviceAccount === "object" &&
      Object.keys(serviceAccount).length !== 0
        ? firebaseAdmin.credential.cert(serviceAccount)
        : firebaseAdmin.credential.applicationDefault();

    try {
      this.firebaseApp = firebaseAdmin.app(appId);
    } catch {
      this.firebaseApp = firebaseAdmin.initializeApp(
        {
          credential,
        },
        appId
      );
    }
  }

  getMessaging() {
    return this.firebaseApp.messaging();
  }

  async send(payload) {
    return this.getMessaging().send(payload);
  }

  async subscribeToTopic(token, topic) {
    const registrationTokens = !Array.isArray(token) ? [token] : token;

    return this.getMessaging().subscribeToTopic(
      [...new Set(registrationTokens)],
      topic
    );
  }
}

module.exports = Firebase;
