import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Track, ViewType, EqPreset, EqCustomGains, Playlist } from '../types';
import { myPlaylist } from '../data';
import { User, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AudioPlaybackContextType {
  playlist: Track[];
  filteredPlaylist: Track[];
  currentTrack: Track;
  currentTrackIndex: number;
  isPlaying: boolean;
  progress: number; // 0 to 100
  currentTime: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0 to 1
  shuffle: boolean;
  repeat: 'none' | 'all' | 'one';
  favorites: string[];
  historyList: string[]; // Recently played track IDS (max 5)
  searchQuery: string;
  currentView: ViewType;
  eqPreset: EqPreset;
  eqGains: EqCustomGains;
  // Firebase Auth and Songs attributes
  user: User | null;
  firebaseSongs: Track[];
  // Playlist management
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  createPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  renamePlaylist: (playlistId: string, newName: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  // Controls
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleFavorite: (trackId: string) => void;
  setVolumeAndValue: (vol: number) => void;
  seekPercent: (val: number) => void;
  setSearchQuery: (q: string) => void;
  setCurrentView: (view: ViewType) => void;
  setPreset: (preset: EqPreset) => void;
  updateEqGain: (band: 'bass' | 'mid' | 'treble', val: number) => void;
  // Firebase Controls
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  uploadSongToFirebase: (
    title: string,
    artist: string,
    genre: 'VN' | 'US',
    audioFile: File | null,
    coverFile: File | null,
    youtubeId?: string,
    youtubeCover?: string
  ) => Promise<void>;
  deleteFirebaseSong: (songId: string) => Promise<void>;
}

const AudioPlaybackContext = createContext<AudioPlaybackContextType | undefined>(undefined);

export const useAudioPlayback = () => {
  const context = useContext(AudioPlaybackContext);
  if (!context) {
    throw new Error('useAudioPlayback must be used within an AudioPlaybackProvider');
  }
  return context;
};

// Lazy AudioContext variables declared outside the component lifecycle to prevent leaks
let audioContext: AudioContext | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let bassFilter: BiquadFilterNode | null = null;
let midFilter: BiquadFilterNode | null = null;
let trebleFilter: BiquadFilterNode | null = null;

// Function to extract YouTube ID or check if it's a YouTube track
const getYTId = (track: Track): string | null => {
  if (!track) return null;
  if ((track as any).youtubeId) return (track as any).youtubeId;
  if (track.audioSrc && track.audioSrc.includes('/api/yt-stream')) {
    const match = track.audioSrc.match(/[?&]id=([^&]+)/);
    if (match) return match[1];
  }
  if (track.audioSrc && (track.audioSrc.includes('youtube.com') || track.audioSrc.includes('youtu.be'))) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = track.audioSrc.match(regExp);
    if (match && match[2].length === 11) return match[2];
  }
  return null;
};

export const AudioPlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Web elements refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Firebase auth & songs states
  const [user, setUser] = useState<User | null>(null);
  const [firebaseSongs, setFirebaseSongs] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Dynamic tracks states
  const [playlist, setPlaylist] = useState<Track[]>(myPlaylist);
  const [currentTrackId, setCurrentTrackId] = useState<string>(myPlaylist[0]?.id || '');

  // Persistence loaded state safely
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('ntho_favs');
    return saved ? JSON.parse(saved) : [];
  });

  const [historyList, setHistoryList] = useState<string[]>(() => {
    const saved = localStorage.getItem('ntho_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('ntho_volume');
    return saved ? Number(saved) : 0.8;
  });

  // Track playback states
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<'none' | 'all' | 'one'>('none');
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [currentView, setCurrentViewState] = useState<ViewType>('nhac-viet');

  // Equalizer DSP State
  const [eqPreset, setEqPresetState] = useState<EqPreset>('flat');
  const [eqGains, setEqGains] = useState<EqCustomGains>({
    bass: 0,
    mid: 0,
    treble: 0
  });

  const ytPlayerRef = useRef<any>(null);
  const updateTimerRef = useRef<number | null>(null);

  const startYTProgressTimer = () => {
    stopYTProgressTimer();
    updateTimerRef.current = window.setInterval(() => {
      const player = ytPlayerRef.current;
      if (player && player.getCurrentTime) {
        const cur = player.getCurrentTime() || 0;
        const dur = player.getDuration() || 0;
        setCurrentTime(cur);
        setDuration(dur);
        setProgress(dur > 0 ? (cur / dur) * 100 : 0);
      }
    }, 250);
  };

  const stopYTProgressTimer = () => {
    if (updateTimerRef.current !== null) {
      clearInterval(updateTimerRef.current);
      updateTimerRef.current = null;
    }
  };

  const loadYTAPI = (): Promise<any> => {
    return new Promise((resolve) => {
      if ((window as any).YT && (window as any).YT.Player) {
        resolve((window as any).YT);
        return;
      }
      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const previousCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        resolve((window as any).YT);
      };
    });
  };

  const initYTPlayer = async (): Promise<any> => {
    if (ytPlayerRef.current) return ytPlayerRef.current;
    
    await loadYTAPI();
    
    return new Promise((resolve) => {
      let container = document.getElementById('youtube-player-hidden-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'youtube-player-hidden-container';
        container.setAttribute('style', 'position: absolute; top: -9999px; left: -9999px; width: 1px; height: 1px; opacity: 0.001; pointer-events: none;');
        document.body.appendChild(container);
      }

      let playerElement = document.getElementById('youtube-player-hidden');
      if (!playerElement) {
        playerElement = document.createElement('div');
        playerElement.id = 'youtube-player-hidden';
        container.appendChild(playerElement);
      }

      ytPlayerRef.current = new (window as any).YT.Player('youtube-player-hidden', {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume * 100);
            resolve(event.target);
          },
          onStateChange: (event: any) => {
            const state = event.data;
            const playerState = (window as any).YT.PlayerState;
            if (state === playerState.PLAYING) {
              setIsPlaying(true);
              startYTProgressTimer();
            } else if (state === playerState.PAUSED) {
              setIsPlaying(false);
              stopYTProgressTimer();
            } else if (state === playerState.ENDED) {
              setIsPlaying(false);
              stopYTProgressTimer();
              handleTrackEndRef.current();
            }
          },
          onError: (err: any) => {
            console.error("YouTube SDK error playing this track:", err.data);
            setIsPlaying(false);
            stopYTProgressTimer();
          }
        }
      });
    });
  };

  // Keep shuffle history to avoid repeating indices
  const shuffleHistory = useRef<number[]>([]);

  // Listen to Auth State
  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setPlaylists([]); // clear when logged out
    });
  }, []);

  // Listen to user's playlists (real-time)
  useEffect(() => {
    if (!user) {
      setPlaylists([]);
      return;
    }
    const playlistsCol = collection(db, 'playlists');
    const q = query(playlistsCol, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Playlist[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === user.uid) {
          list.push({
            id: doc.id,
            name: data.name || 'Playlist mới',
            userId: data.userId,
            username: data.username || '',
            trackIds: data.trackIds || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      });
      setPlaylists(list);
    }, (err) => {
      console.warn('Playlist listener error:', err.message);
    });
    return () => unsubscribe();
  }, [user]);

  // Listen to Firestore Songs (Real-time updates!)
  useEffect(() => {
    const songsCol = collection(db, 'songs');
    
    // Query without orderBy to completely avoid missing index errors and database permission anomalies!
    const unsubscribe = onSnapshot(songsCol, (snapshot) => {
      const songsList: Track[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        let createdTime: any = new Date();
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            createdTime = data.createdAt.toDate();
          } else if (data.createdAt.seconds) {
            createdTime = new Date(data.createdAt.seconds * 1000);
          } else {
            createdTime = new Date(data.createdAt);
          }
        }

        songsList.push({
          id: doc.id,
          title: data.title || '',
          artist: data.artist || '',
          genre: data.genre || 'VN',
          audioSrc: data.audioSrc || '',
          coverSrc: data.coverSrc || './music/nang-tho/cover.jpg',
          isFirebase: true,
          userId: data.userId || null,
          username: data.username || 'Anonymous',
          createdAt: createdTime,
          audioStoragePath: data.audioStoragePath || null,
          coverStoragePath: data.coverStoragePath || null
        });
      });

      // Sort in-memory descending by createdAt safely
      songsList.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt || 0);
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt || 0);
        return timeB - timeA;
      });

      setFirebaseSongs(songsList);
    }, (error) => {
      console.warn("Firestore subscription rejected or missing permissions (falling back gracefully):", error.message);
      // Suppress throwing uncaught crash exceptions to ensure seamless client UX
      setFirebaseSongs([]);
    });

    return () => unsubscribe();
  }, []);

  // Firebase auth & file operations
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setCurrentViewState('nhac-viet');
    } catch (error) {
      console.error("Google popup login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentViewState('nhac-viet');
    } catch (error) {
      console.error("Signout failing:", error);
    }
  };

  // ── Playlist CRUD ──────────────────────────────────────────────
  const createPlaylist = async (name: string) => {
    if (!user) throw new Error('Bạn cần đăng nhập để tạo playlist!');
    const id = 'pl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    await setDoc(doc(db, 'playlists', id), {
      id,
      name: name.trim() || 'Playlist mới',
      userId: user.uid,
      username: user.displayName || 'Anonymous',
      trackIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const deletePlaylist = async (playlistId: string) => {
    await deleteDoc(doc(db, 'playlists', playlistId));
    if (selectedPlaylistId === playlistId) setSelectedPlaylistId(null);
  };

  const renamePlaylist = async (playlistId: string, newName: string) => {
    if (!newName.trim()) return;
    const ref2 = doc(db, 'playlists', playlistId);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    await setDoc(ref2, { ...snap.data(), name: newName.trim(), updatedAt: serverTimestamp() });
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    const ref2 = doc(db, 'playlists', playlistId);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const data = snap.data();
    const ids: string[] = data.trackIds || [];
    if (ids.includes(trackId)) return; // already in playlist
    await setDoc(ref2, { ...data, trackIds: [...ids, trackId], updatedAt: serverTimestamp() });
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const ref2 = doc(db, 'playlists', playlistId);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const data = snap.data();
    const ids: string[] = (data.trackIds || []).filter((id: string) => id !== trackId);
    await setDoc(ref2, { ...data, trackIds: ids, updatedAt: serverTimestamp() });
  };
  // ───────────────────────────────────────────────────────────────

  const uploadSongToFirebase = async (
    title: string,
    artist: string,
    genre: 'VN' | 'US',
    audioFile: File | null,
    coverFile: File | null,
    youtubeId?: string,
    youtubeCover?: string
  ) => {
    // --- Kiểm tra trùng lặp ---
    if (youtubeId) {
      const ytDuplicate = firebaseSongs.find(s => s.audioSrc?.includes(`id=${youtubeId}`));
      if (ytDuplicate) {
        throw new Error(`Bài "${ytDuplicate.title}" đã tồn tại trong thư viện cộng đồng!`);
      }
    } else {
      const titleDuplicate = firebaseSongs.find(
        s =>
          s.title.trim().toLowerCase() === title.trim().toLowerCase() &&
          s.artist.trim().toLowerCase() === artist.trim().toLowerCase()
      );
      if (titleDuplicate) {
        throw new Error(`Bài "${titleDuplicate.title}" của "${titleDuplicate.artist}" đã tồn tại!`);
      }
    }
    // --- Hết kiểm tra trùng lặp ---

    const songId = 'fire-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    let audioUrl = '';
    let coverUrl = './music/nang-tho/cover.jpg';

    // Track original upload paths for deletion validation
    const audioStoragePath = audioFile ? `songs/${songId}_audio_${audioFile.name}` : null;
    const coverStoragePath = (coverFile && !youtubeId) ? `songs/${songId}_cover_${coverFile.name}` : null;

    try {
      if (youtubeId) {
        audioUrl = `/api/yt-stream?id=${youtubeId}`;
        coverUrl = youtubeCover || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
      } else if (audioFile) {
        try {
          // 1. Upload audio
          const audioStorageRef = ref(storage, audioStoragePath!);
          const audioSnapshot = await uploadBytes(audioStorageRef, audioFile);
          audioUrl = await getDownloadURL(audioSnapshot.ref);

          // 2. Upload cover if exists
          if (coverFile) {
            const coverStorageRef = ref(storage, coverStoragePath!);
            const coverSnapshot = await uploadBytes(coverStorageRef, coverFile);
            coverUrl = await getDownloadURL(coverSnapshot.ref);
          }
        } catch (storageErr: any) {
          console.error("Firebase Storage Upload Error:", storageErr);
          throw new Error("Không thể tải tập tin nhạc: Hộp lưu trữ Firebase Storage của bạn cần nâng cấp gói Blaze (trả phí) để lưu tệp tin nhị phân lớn. Vui lòng chuyển sang dán link YouTube (hoàn toàn miễn phí, lưu trên Firestore) hoặc sử dụng tính năng dán link!");
        }
      }

      // 3. Save DB
      const songDocRef = doc(db, 'songs', songId);
      await setDoc(songDocRef, {
        id: songId,
        title,
        artist,
        genre,
        audioSrc: audioUrl,
        coverSrc: coverUrl,
        userId: auth.currentUser?.uid || null,
        username: auth.currentUser?.displayName || 'Anonymous',
        userPhoto: auth.currentUser?.photoURL || null,
        createdAt: serverTimestamp(),
        audioStoragePath,
        coverStoragePath
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `songs/${songId}`);
    }
  };

  const deleteFirebaseSong = async (songId: string) => {
    try {
      const songDocRef = doc(db, 'songs', songId);
      
      // Get doc first to retrieve storage paths
      const songSnap = await getDoc(songDocRef);
      if (songSnap.exists()) {
        const data = songSnap.data();
        // Delete audio file from storage if present
        if (data.audioStoragePath) {
          try {
            await deleteObject(ref(storage, data.audioStoragePath));
          } catch (storErr) {
            console.warn('Storage audio delete failed (file may not exist):', storErr);
          }
        }
        // Delete cover file from storage if present
        if (data.coverStoragePath) {
          try {
            await deleteObject(ref(storage, data.coverStoragePath));
          } catch (storErr) {
            console.warn('Storage cover delete failed:', storErr);
          }
        }
      }

      // Delete firestore document
      await deleteDoc(songDocRef);

      // Stop currently playing track if it got deleted
      if (currentTrackId === songId) {
        setCurrentTrackId(myPlaylist[0]?.id || '');
        setCurrentTrackIndex(0);

        // Stop standard HTML5 audio
        const audio = audioRef.current;
        if (audio) {
          audio.src = myPlaylist[0].audioSrc;
          audio.pause();
        }

        // Stop YouTube player if playing
        const player = ytPlayerRef.current;
        if (player && player.pauseVideo) {
          try { player.pauseVideo(); } catch (_) {}
        }
        stopYTProgressTimer();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `songs/${songId}`);
    }
  };

  // Sync merged playlist database: Standard + Firebase Shared
  useEffect(() => {
    setPlaylist([...myPlaylist, ...firebaseSongs]);
  }, [firebaseSongs]);

  // Keep currentTrackIndex perfectly synchronized with currentTrackId dynamically
  useEffect(() => {
    if (currentTrackId) {
      const newIdx = playlist.findIndex(t => t.id === currentTrackId);
      if (newIdx !== -1) {
        setCurrentTrackIndex(newIdx);
      }
    }
  }, [playlist, currentTrackId]);

  // Filter query applied to active genre
  const filteredPlaylist = playlist.filter((track) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return track.title.toLowerCase().includes(query) || track.artist.toLowerCase().includes(query);
  });

  const currentTrack = playlist.find(t => t.id === currentTrackId) || playlist[0] || myPlaylist[0];

  // Sync favorites & history to local Storage
  useEffect(() => {
    localStorage.setItem('ntho_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('ntho_history', JSON.stringify(historyList));
  }, [historyList]);

  // Keep a reference to the latest handleTrackEnd to avoid stale closures in the audio listeners
  const handleTrackEndRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleTrackEndRef.current = handleTrackEnd;
  });

  // Lazy instantiate AudioElement once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    const ytId = getYTId(currentTrack);
    audio.src = ytId ? '' : currentTrack.audioSrc;
    audio.volume = volume;
    audioRef.current = audio;

    // Listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      // Attempt initializing Web Audio structures lazy-style when playing first time
      initWebAudio();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      setProgress(0);
      setCurrentTime(0);
    };

    const handleEnded = () => {
      handleTrackEndRef.current();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      stopYTProgressTimer();
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        try { ytPlayerRef.current.destroy(); } catch (_) {}
      }
    };
  }, []);

  // 1. Screen Wake Lock API: Prevent screen sleep while playing music
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.warn('Screen Wake Lock request failed:', err);
        }
      }
    };

    const releaseWakeLock = () => {
      if (wakeLock) {
        wakeLock.release()
          .then(() => {
            wakeLock = null;
          })
          .catch((err: any) => console.warn('Screen Wake Lock release failed:', err));
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Re-acquire lock if page becomes visible again
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  // 2. Media Session API: Background play sync & Notification lockscreen system controls
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'Pumpkin Player Studio',
        artwork: [
          { src: currentTrack.coverSrc, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.coverSrc, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.coverSrc, sizes: '192x192', type: 'image/jpeg' },
          { src: currentTrack.coverSrc, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.coverSrc, sizes: '384x384', type: 'image/jpeg' },
          { src: currentTrack.coverSrc, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      // Position state
      if ('setPositionState' in navigator.mediaSession && duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1.0,
            position: Math.min(currentTime, duration)
          });
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }, [currentTrack, duration, currentTime]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && duration > 0) {
            seekPercent((details.seekTime / duration) * 100);
          }
        });
      } catch (e) {
        console.warn('Media Session Action Handlers registration failed:', e);
      }
    }
  }, [playlist, currentTrackIndex, isPlaying]);

  // Web Audio Equalizer Initialization
  const initWebAudio = () => {
    const audio = audioRef.current;
    if (!audio || audioContext) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      audioContext = new AudioCtx();
      sourceNode = audioContext.createMediaElementSource(audio);

      // Low-shelf (bass)
      bassFilter = audioContext.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 220; // range < 220Hz
      bassFilter.gain.value = eqGains.bass;

      // Peaking (mids)
      midFilter = audioContext.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.Q.value = 1.2;
      midFilter.frequency.value = 1200; // mid range ~1.2kHz
      midFilter.gain.value = eqGains.mid;

      // High-shelf (trebles)
      trebleFilter = audioContext.createBiquadFilter();
      trebleFilter.type = 'highshelf';
      trebleFilter.frequency.value = 5200; // treble range > 5.2kHz
      trebleFilter.gain.value = eqGains.treble;

      // Connect source -> bass -> mid -> treble -> sound destination
      sourceNode.connect(bassFilter);
      bassFilter.connect(midFilter);
      midFilter.connect(trebleFilter);
      trebleFilter.connect(audioContext.destination);
    } catch (err) {
      console.warn("Could not hook up standard Web Audio API filters:", err);
    }
  };

  // Sync EQ gains to Web Audio filters
  useEffect(() => {
    if (audioContext && audioContext.state === 'suspended') {
      // Resume if suspended by user action
      audioContext.resume();
    }
    if (bassFilter) bassFilter.gain.value = eqGains.bass;
    if (midFilter) midFilter.gain.value = eqGains.mid;
    if (trebleFilter) trebleFilter.gain.value = eqGains.treble;
  }, [eqGains]);

  // Update EQ gains physically and update states
  const updateEqGain = (band: 'bass' | 'mid' | 'treble', val: number) => {
    setEqPresetState('flat'); // customized values override standard presets
    setEqGains((prev) => ({
      ...prev,
      [band]: val
    }));
  };

  // Select EQ presets
  const setPreset = (preset: EqPreset) => {
    setEqPresetState(preset);
    let newGains: EqCustomGains = { bass: 0, mid: 0, treble: 0 };

    switch (preset) {
      case 'bass':
        newGains = { bass: 8, mid: 1, treble: -2 };
        break;
      case 'vocal':
        newGains = { bass: -4, mid: 7, treble: 3 };
        break;
      case 'acoustic':
        newGains = { bass: 3, mid: 2, treble: 5 };
        break;
      case 'electronic':
        newGains = { bass: 7, mid: -1, treble: 6 };
        break;
      case 'flat':
      default:
        newGains = { bass: 0, mid: 0, treble: 0 };
        break;
    }
    setEqGains(newGains);
  };

  // Add a helper for navigation views
  const setCurrentView = (view: ViewType) => {
    setCurrentViewState(view);
  };

  const setSearchQuery = (q: string) => {
    setSearchQueryState(q);
  };

  // Update track list index
  const playTrack = async (track: Track) => {
    const idx = playlist.findIndex((item) => item.id === track.id);
    if (idx === -1) return;

    setCurrentTrackId(track.id);
    setCurrentTrackIndex(idx);
    addToHistory(track.id);

    const ytId = getYTId(track);

    if (ytId) {
      console.log(`[Playback] Playing YouTube track via Client SDK: Video ID ${ytId}`);
      
      // Stop/Pause standard HTML5 audio
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = ''; // Clear source to stop buffer
      }

      try {
        const player = await initYTPlayer();
        setIsPlaying(true);
        player.loadVideoById({
          videoId: ytId,
          suggestedQuality: 'small'
        });
        player.playVideo();
        player.setVolume(volume * 100);
      } catch (err) {
        console.error("Failed to play YouTube track via SDK:", err);
      }
    } else {
      console.log(`[Playback] Playing MP3 track via Standard HTML5 element: ${track.audioSrc}`);
      
      // Stop/Pause YouTube SDK
      stopYTProgressTimer();
      const player = ytPlayerRef.current;
      if (player && player.pauseVideo) {
        try { player.pauseVideo(); } catch (_) {}
      }

      // Play standard file audio next frame safely
      setTimeout(() => {
        const audio = audioRef.current;
        if (audio) {
          audio.src = track.audioSrc;
          audio.volume = volume;
          audio.play().catch((err) => {
            console.warn("Audio autoplay blocked by context:", err);
          });
        }
      }, 50);
    }
  };

  const togglePlayPause = () => {
    const track = playlist[currentTrackIndex] || playlist[0] || myPlaylist[0];
    const ytId = getYTId(track);

    if (ytId) {
      const player = ytPlayerRef.current;
      if (player) {
        try {
          const playerState = player.getPlayerState();
          const YTState = (window as any).YT.PlayerState;
          if (playerState === YTState.PLAYING) {
            player.pauseVideo();
          } else {
            player.playVideo();
          }
        } catch (_) {
          playTrack(track);
        }
      } else {
        playTrack(track);
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;

      if (audio.paused) {
        // Resume context if suspended
        if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume();
        }
        audio.play().catch((err) => {
          console.warn("Audio autoplay blocked:", err);
        });
      } else {
        audio.pause();
      }
    }
  };

  // Get matching sub-playlist based on current view/context
  const getSubPlaylist = () => {
    if (currentView === 'library' || currentView === 'now-playing') {
      return playlist;
    }
    const curGenre = currentTrack.genre;
    if (currentView === 'nhac-viet') {
      return playlist.filter(t => t.genre === 'VN');
    }
    if (currentView === 'usuk') {
      return playlist.filter(t => t.genre === 'US');
    }
    if (currentView === 'yeu-thich') {
      const favList = playlist.filter(t => favorites.includes(t.id));
      return favList.length > 0 ? favList : playlist;
    }
    // fallbacks
    return playlist;
  };

  // Smart shuffle algorithm
  const getSmartShuffleIndex = (subList: Track[]) => {
    if (subList.length <= 1) return currentTrackIndex;

    const actualSubIndices = subList.map(t => playlist.findIndex(item => item.id === t.id));
    const unplayedSubIndices = actualSubIndices.filter(i => !shuffleHistory.current.includes(i) && i !== currentTrackIndex);

    if (unplayedSubIndices.length === 0) {
      // Clear history when done
      shuffleHistory.current = [currentTrackIndex];
      const fallbackIndices = actualSubIndices.filter(i => i !== currentTrackIndex);
      const randomIdx = fallbackIndices[Math.floor(Math.random() * fallbackIndices.length)];
      return randomIdx === undefined ? currentTrackIndex : randomIdx;
    }

    const matchedIndex = unplayedSubIndices[Math.floor(Math.random() * unplayedSubIndices.length)];
    shuffleHistory.current.push(matchedIndex);
    return matchedIndex;
  };

  const playNext = () => {
    const subList = getSubPlaylist();
    if (subList.length === 0) {
      // fallback to whole playlist
      playNextWhole();
      return;
    }

    if (shuffle) {
      const nextIndex = getSmartShuffleIndex(subList);
      const trackToPlay = playlist[nextIndex];
      if (trackToPlay) playTrack(trackToPlay);
      return;
    }

    const localIdx = subList.findIndex(t => t.id === currentTrack.id);
    const nextLocal = (localIdx + 1) % subList.length;
    const trackToPlay = subList[nextLocal];
    if (trackToPlay) playTrack(trackToPlay);
  };

  const playPrev = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const subList = getSubPlaylist();
    if (subList.length === 0) {
      playPrevWhole();
      return;
    }

    if (shuffle) {
      const prevIndex = getSmartShuffleIndex(subList);
      const trackToPlay = playlist[prevIndex];
      if (trackToPlay) playTrack(trackToPlay);
      return;
    }

    const localIdx = subList.findIndex(t => t.id === currentTrack.id);
    const prevLocal = (localIdx - 1 + subList.length) % subList.length;
    const trackToPlay = subList[prevLocal];
    if (trackToPlay) playTrack(trackToPlay);
  };

  // fallbacks
  const playNextWhole = () => {
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    playTrack(playlist[nextIdx]);
  };

  const playPrevWhole = () => {
    const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    playTrack(playlist[prevIdx]);
  };

  const handleTrackEnd = () => {
    if (repeat === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((err) => console.warn(err));
      }
      return;
    }

    if (repeat === 'all' || shuffle) {
      playNext();
      return;
    }

    // if repeat === 'none', advance to next track in sub list if there is one
    const subList = getSubPlaylist();
    const localIdx = subList.findIndex(t => t.id === currentTrack.id);
    if (localIdx !== -1 && localIdx < subList.length - 1) {
      playNext();
    } else {
      setIsPlaying(false);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  };

  // Mutex model: Suffle & Repeat
  const toggleShuffle = () => {
    setShuffle(prev => !prev);
    // Mutex behavior: disable repeat if enabling shuffle
    if (!shuffle) {
      setRepeat('none');
    }
  };

  const cycleRepeat = () => {
    const nextRepeatMap: Record<'none' | 'all' | 'one', 'none' | 'all' | 'one'> = {
      none: 'all',
      all: 'one',
      one: 'none'
    };
    const newRepeat = nextRepeatMap[repeat];
    setRepeat(newRepeat);

    // Mutex behavior: disable shuffle if enabling repeat
    if (newRepeat !== 'none') {
      setShuffle(false);
    }
  };

  const toggleFavorite = (trackId: string) => {
    setFavorites((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter(id => id !== trackId);
      } else {
        return [...prev, trackId];
      }
    });
  };

  const addToHistory = (trackId: string) => {
    setHistoryList((prev) => {
      const cleaned = prev.filter(id => id !== trackId);
      return [trackId, ...cleaned].slice(0, 5); // Max 5 items
    });
  };

  const setVolumeAndValue = (vol: number) => {
    const bounded = Math.max(0, Math.min(1, vol));
    setVolume(bounded);
    localStorage.setItem('ntho_volume', String(bounded));
    if (audioRef.current) {
      audioRef.current.volume = bounded;
    }
    const player = ytPlayerRef.current;
    if (player && player.setVolume) {
      try {
        player.setVolume(bounded * 100);
      } catch (_) {}
    }
  };

  const seekPercent = (val: number) => {
    const track = playlist[currentTrackIndex] || playlist[0] || myPlaylist[0];
    const ytId = getYTId(track);

    if (ytId) {
      const player = ytPlayerRef.current;
      if (player && player.getDuration) {
        const dur = player.getDuration() || 0;
        if (dur > 0) {
          const seekToSeconds = (val / 100) * dur;
          player.seekTo(seekToSeconds, true);
          setCurrentTime(seekToSeconds);
          setProgress(val);
        }
      }
    } else {
      const audio = audioRef.current;
      if (audio && !isNaN(audio.duration) && isFinite(audio.duration)) {
        try {
          audio.currentTime = (val / 100) * audio.duration;
          setCurrentTime(audio.currentTime);
          setProgress(val);
        } catch (err) {
          console.warn("Failed to seek audio element:", err);
        }
      }
    }
  };

  return (
    <AudioPlaybackContext.Provider
      value={{
        playlist,
        filteredPlaylist,
        currentTrack,
        currentTrackIndex,
        isPlaying,
        progress,
        currentTime,
        duration,
        volume,
        shuffle,
        repeat,
        favorites,
        historyList,
        searchQuery,
        currentView,
        eqPreset,
        eqGains,
        user,
        firebaseSongs,
        playlists,
        selectedPlaylistId,
        setSelectedPlaylistId,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        playTrack,
        togglePlayPause,
        playNext,
        playPrev,
        toggleShuffle,
        cycleRepeat,
        toggleFavorite,
        setVolumeAndValue,
        seekPercent,
        setSearchQuery,
        setCurrentView,
        setPreset,
        updateEqGain,
        signInWithGoogle,
        logout,
        uploadSongToFirebase,
        deleteFirebaseSong
      }}
    >
      {children}
    </AudioPlaybackContext.Provider>
  );
};