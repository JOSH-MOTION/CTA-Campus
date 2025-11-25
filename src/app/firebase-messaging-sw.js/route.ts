// src/app/firebase-messaging-sw.js/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const serviceWorkerContent = `
// Firebase Cloud Messaging Service Worker
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js");

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
    icon: "/logob2.png",
    badge: "/logob2.png",
  };
  
  self.registration.showNotification(title, options);
});
`;

  return new NextResponse(serviceWorkerContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}