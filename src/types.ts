export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: 'VN' | 'US';
  audioSrc: string;
  coverSrc: string;
  isFirebase?: boolean;
  userId?: string | null;
  username?: string;
  createdAt?: any;
  audioStoragePath?: string | null;  // NEW: path trong Firebase Storage để xóa khi cần
  coverStoragePath?: string | null;  // NEW: path trong Firebase Storage để xóa khi cần
}

export type ViewType = 'nhac-viet' | 'usuk' | 'yeu-thich' | 'now-playing' | 'library' | 'danh-muc-khac' | 'playlists' | 'playlist-detail';

export interface Playlist {
  id: string;
  name: string;
  userId: string;
  username: string;
  trackIds: string[];
  createdAt: any;
  updatedAt: any;
}

export type EqPreset = 'flat' | 'bass' | 'vocal' | 'acoustic' | 'electronic';

export interface EqCustomGains {
  bass: number; // Low frequencies gain (dB)
  mid: number;  // Mid frequencies gain (dB)
  treble: number; // High frequencies gain (dB)
}