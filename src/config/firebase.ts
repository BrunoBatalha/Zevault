import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(config).every(Boolean);

let services: FirebaseServices | null = null;

const enableAppCheckDebugToken = (): void => {
  const token = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
  if (!import.meta.env.DEV || !token) return;
  (self as typeof self & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = token;
};

export const getFirebaseServices = (): FirebaseServices => {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  if (services) return services;

  const app = initializeApp(config);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  if (import.meta.env.VITE_FIREBASE_USE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9198', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8180);
  } else if (import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY) {
    enableAppCheckDebugToken();
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }

  services = { app, auth, firestore };
  return services;
};

export const ensureAnonymousUser = async (): Promise<User> => {
  const { auth } = getFirebaseServices();
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
};
