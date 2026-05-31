// Helper database manager for persistent client-side tracks storage
import { Track } from '../types';

const DB_NAME = 'Pumpkin_Local_Music_DB';
const STORE_NAME = 'custom_tracks';
const DB_VERSION = 1;

export interface DBTrack {
  id: string;
  title: string;
  artist: string;
  genre: 'VN' | 'US';
  audioBlob?: Blob | null;
  coverBlob?: Blob | null;
  isYoutube?: boolean;
  youtubeId?: string;
  youtubeCover?: string;
}

// Initialize standard indexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Save a track with actual audio and image binary data
export const saveCustomTrack = async (track: DBTrack): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(track);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Retrieve all saved custom tracks 
export const getCustomTracks = async (): Promise<DBTrack[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Delete a custom track
export const deleteCustomTrack = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
