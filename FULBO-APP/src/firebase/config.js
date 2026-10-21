import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// iPhone/iPad (Safari y la PWA instalada): el canal de streaming de Firestore a veces
// queda colgado y las lecturas no vuelven aunque las escrituras se guarden.
// Long polling es un poco más lento pero funciona siempre.
const esIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  // iPadOS se presenta como Mac
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const db = initializeFirestore(app, esIOS ? { experimentalForceLongPolling: true } : {});

// Persistencia explícita: la sesión sobrevive a cerrar el navegador o la PWA.
// Usa IndexedDB y, si no está disponible, localStorage.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
