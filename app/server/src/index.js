const express = require("express");
const cors = require("cors");
const { to } = require("await-to-js");
const Firebase = require("./Firebase");

const app = express();
const port = process.env?.HTTP_PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/", (_, res) => {
  res.send("Welcome ;)");
});

app.post("/subscribe", async (req, res) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    res.sendStatus(400);
  }

  const firebase = new Firebase({ appId: "MyFCMApp" });
  const topic = process.env?.TOPIC || "MyTopic";
  const [error] = await to(firebase.subscribeToTopic(fcmToken, topic));

  if (error) {
    console.error("Something wrong happend while subscribing", error);
    res.sendStatus(500);
  } else {
    console.error("Successfully subscribed", { fcmToken, topic });
    res.sendStatus(204);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
