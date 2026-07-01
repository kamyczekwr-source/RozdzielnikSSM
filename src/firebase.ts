import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Konfiguracja pochodzi ze zmiennych środowiskowych (plik .env.local, nigdy nie
// commituj go do repo). Wartości znajdziesz w Firebase Console -> Project settings
// -> Twoja aplikacja webowa -> SDK setup and configuration.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Logowanie anonimowe: nie wymaga hasła/formularza, ale daje każdemu
// użytkownikowi apki stały identyfikator, dzięki czemu reguły bezpieczeństwa
// Firestore mogą wymagać "zalogowania", zamiast być całkiem otwarte na świat.
export function ensureSignedIn(): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve();
      } else {
        signInAnonymously(auth).then(() => resolve()).catch(reject);
      }
    });
  });
}
