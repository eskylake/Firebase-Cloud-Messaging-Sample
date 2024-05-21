# Firebase Cloud Messaging Sample

Brief implementation of Firebase Cloud Messaging (FCM) for both client and server, showcasing essential setup and configuration steps.

## Installation

1- Make sure to have the following:

- [Service Account](https://firebase.google.com/docs/cloud-messaging/auth-server#provide-credentials-manually)
- [VAPID](https://firebase.google.com/docs/cloud-messaging/js/client#configure_web_credentials_with)
- FCM project & app [Credentials](https://firebase.google.com/docs/web/setup#create-firebase-project-and-app)

2- Replace `app/server/service-account.json` with your own

3- Replace `app/client/firebase-config.json` with your own

4- Replace `app/client/manifest.json[gcm_sender_id]` with your FCM `Sender ID`

5- Run the following:

```bash
$ docker compose up -d

$ docker exec -it fcm-server

$ yarn install

$ yarn run dev # Server listening on port 3000
```

## Usage

1- Open [http://localhost](http://localhost) to make sure the client app works healthy

2- Make sure Notification permission is allowed and `sw.js` is registered successfully in the browser

3- Send a sample notification:

```bash
# Login to the server's container
$ docker exec -it fcm-server

# Send a notification by:
$ node cli.js notif

# You can see the usage by:
$ node cli.js --help
```

## License

[MIT](https://choosealicense.com/licenses/mit/)