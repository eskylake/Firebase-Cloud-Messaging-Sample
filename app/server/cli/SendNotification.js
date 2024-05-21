const chalk = require("chalk");
const faker = require("faker");
const { to } = require("await-to-js");
const Firebase = require("../src/Firebase");

const { log } = console;

const options = [
  {
    flags: "-t, --token <token>",
    description: "FCM Registration token",
  },
  {
    flags: "-tp, --topic <topic>",
    description: "FCM Topic",
    default: "MyTopic",
  },
];

module.exports = {
  name: "notif",
  options,
  description: "Send notification for test",
  async runAction({ formatter }, { token, topic }) {
    if (topic || token) {
      const data = {
        actionUrl: faker.internet.url(),
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraph(),
      };

      const payload = {
        data,
        webpush: {
          fcmOptions: {
            link: data.actionUrl,
          },
          headers: {
            image: "",
            TTL: "2419200",
          },
        },
        [`${!!topic ? "topic" : "token"}`]: !!topic
          ? topic.trim()
          : token.trim(),
      };

      formatter(payload);

      const firebase = new Firebase({ appId: "MyFCMApp" });
      const [error] = await to(firebase.send(payload));

      if (error) {
        log(chalk`{bgWhite.black 🔴}`, error);
        return;
      }

      log(chalk`{bgWhite.black 🚀 Done}`);
    } else {
      log(chalk`{bgWhite.black 🔴 Please enter FCM Token or Topic}`);
    }
  },
};
