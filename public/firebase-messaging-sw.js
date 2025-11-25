// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js");

// Your Firebase config (same as in firebase.ts)
firebase.initializeApp({
 projectId: 'campus-compass-ug6bc',
  appId: '1:627953773368:web:a87d7270648de5146b6fcd',
  storageBucket: 'campus-compass-ug6bc.appspot.com',
  apiKey: 'AIzaSyDA7BIADNBZwk-9o7A8fzVcfPy6HeZWJzU',
  authDomain: 'campus-compass-ug6bc.firebaseapp.com',
  messagingSenderId: '627953773368',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background Message:", payload);

  const title = payload.notification?.title || "New Notification";
  const options = {
    body: payload.notification?.body || "",
    icon: "/logob2.png", // optional: put your logo in public/
    badge: "/logob2.png",
  };

  self.registration.showNotification(title, options);
});