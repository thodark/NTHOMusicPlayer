import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying the custom firestoreDatabaseId if provisioned
const databaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db = databaseId && databaseId !== '(default)' && databaseId !== ''
  ? getFirestore(app, databaseId)
  : getFirestore(app);
export const auth = getAuth();
export const storage = getStorage(app);

// Validate connection to Firestore as requested by Firebase Integration guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
