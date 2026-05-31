import React, { useEffect, useState, useRef, memo } from 'react';
import { useAudioPlayback } from '../context/AudioPlaybackContext';
import { Track } from '../types';
import { 
  Heart, 
  Disc, 
  Play, 
  Activity, 
  Music, 
  Star, 
  Library, 
  Radio, 
  Sparkles, 
  Plus, 
  Trash, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X,
  ListMusic,
  Pencil,
  PlayCircle,
  ChevronRight,
  FolderPlus,
} from 'lucide-react';

// ── External AddToPlaylistDropdown ────────────────────────────────────────────
// MUST be defined OUTSIDE MainScreen so React never destroys/re-creates it on
// each parent render, which caused the dropdown to flicker and be un-clickable.
interface AddToPlaylistDropdownProps {
  trackId: string;
  playlists: { id: string; name: string; trackIds: string[] }[];
  showQuickCreate: boolean;
  quickCreateName: string;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  onSetShowQuickCreate: (v: boolean) => void;
  onSetQuickCreateName: (v: string) => void;
  onQuickCreateAndAdd: (trackId: string) => void;
}

const AddToPlaylistDropdown = memo<AddToPlaylistDropdownProps>(({
  trackId,
  playlists,
  showQuickCreate,
  quickCreateName,
  onAddToPlaylist,
  onSetShowQuickCreate,
  onSetQuickCreateName,
  onQuickCreateAndAdd,
}) => (
  <div
    className="absolute right-0 top-full mt-1 z-50 w-52 bg-[#1a1630] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    onClick={e => e.stopPropagation()}
  >
    <div className="px-3 py-2 border-b border-white/6">
      <p className="text-[10px] font-bold text-[#8a80a8] uppercase tracking-widest">Thêm vào playlist</p>
    </div>
    <div className="max-h-40 overflow-y-auto">
      {playlists.length === 0 ? (
        <p className="text-[10px] text-[#8a80a8] px-3 py-2 italic">Chưa có playlist nào</p>
      ) : (
        playlists.map(pl => (
          <button
            key={pl.id}
            onClick={() => onAddToPlaylist(pl.id, trackId)}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[#f0ecff] hover:bg-[#b76cff]/15 transition text-left"
          >
            <span>🎵</span>
            <span className="truncate flex-1">{pl.name}</span>
            <span className="text-[9px] text-[#8a80a8]">{pl.trackIds.length} bài</span>
          </button>
        ))
      )}
    </div>
    <div className="border-t border-white/6 px-3 py-2">
      {showQuickCreate ? (
        <div className="flex gap-1">
          <input
            autoFocus
            type="text"
            value={quickCreateName}
            onChange={e => onSetQuickCreateName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onQuickCreateAndAdd(trackId); }}
            placeholder="Tên playlist mới..."
            className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white placeholder-[#8a80a8] outline-none"
          />
          <button onClick={() => onQuickCreateAndAdd(trackId)} className="px-2 py-1 bg-[#7c3cff] rounded-lg text-white text-[10px] font-bold">OK</button>
        </div>
      ) : (
        <button
          onClick={() => onSetShowQuickCreate(true)}
          className="flex items-center gap-1.5 text-[10px] text-[#b76cff] font-semibold hover:text-white transition"
        >
          <Plus className="w-3 h-3" /> Tạo playlist mới
        </button>
      )}
    </div>
  </div>
));

const CopyrightFooter: React.FC = () => (
  <footer className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] tracking-widest text-[#8a80a8] font-mono select-none">
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-[#b76cff] animate-pulse" />
      <span>© 2026 PUMPKIN PLAYER · CHIA SẺ VÀ CẢM NHẬN ÂM NHẠC</span>
    </div>
    <span className="text-[8px] bg-white/4 px-2.5 py-1 rounded border border-white/5 uppercase font-bold tracking-[0.2em] text-[#ff4fd8] logo-glow">
      Pumpkin Original Studio
    </span>
    <span>CRAFTED FOR AMAZING VIBES</span>
  </footer>
);

// Helper function to extract YouTube video ID from potential URLs
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const cleanUrl = url.trim();
  
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/i
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

export const MainScreen: React.FC = () => {
  const {
    currentView,
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    favorites,
    playlist,
    filteredPlaylist,
    playTrack,
    togglePlayPause,
    searchQuery,
    user,
    uploadSongToFirebase,
    deleteFirebaseSong,
    firebaseSongs,
    playlists,
    selectedPlaylistId,
    setSelectedPlaylistId,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    setCurrentView,
  } = useAudioPlayback();

  // Waveform heights generation state (static but moving in interval)
  const [waveHeights, setWaveHeights] = useState<number[]>([]);

  // Importer state
  const [showImporter, setShowImporter] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newGenre, setNewGenre] = useState<'VN' | 'US'>('VN');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // YouTube Importer States
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [youtubeCover, setYoutubeCover] = useState('');
  const [isFetchingYt, setIsFetchingYt] = useState(false);
  const [ytMode, setYtMode] = useState<'single' | 'playlist'>('single');
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState('');

  // Community Selected Playlist View State
  const [selectedUploaderId, setSelectedUploaderId] = useState<string | null>(null);

  // Playlist UI state
  const [addToPlDrop, setAddToPlDrop] = useState<string | null>(null); // trackId of open dropdown
  const [plToast, setPlToast] = useState('');
  const [renamingPlId, setRenamingPlId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [quickCreateName, setQuickCreateName] = useState('');
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  // Close add-to-playlist dropdown when clicking outside
  useEffect(() => {
    if (!addToPlDrop) return;
    const handler = () => { setAddToPlDrop(null); setShowQuickCreate(false); };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [addToPlDrop]);

  useEffect(() => {
    // Generate beautiful waves heights
    const bars = 28;
    setWaveHeights(Array.from({ length: bars }, (_, i) => 20 + Math.sin(i * 0.8) * 14 + Math.random() * 18));
  }, []);

  // Sync intervals for micro jitter variations if it is currently playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setWaveHeights(prev =>
        prev.map(h => {
          const delta = (Math.random() - 0.5) * 8;
          return Math.max(10, Math.min(48, h + delta));
        })
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs) || !isFinite(timeInSecs)) return '0:00';
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Specific filtered lists
  const songsVN = filteredPlaylist.filter(t => t.genre === 'VN');
  const songsUS = filteredPlaylist.filter(t => t.genre === 'US');
  const favoriteTracks = filteredPlaylist.filter(t => favorites.includes(t.id));

  // Extract unique users who contributed to Firebase Sharing
  const uploaders = React.useMemo(() => {
    const map = new Map<string, { userId: string; username: string; userPhoto: string | null; songs: Track[] }>();
    firebaseSongs.forEach(song => {
      const uid = song.userId || 'anonymous';
      const name = song.username || 'Cộng đồng';
      const photo = (song as any).userPhoto || null;
      if (!map.has(uid)) {
        map.set(uid, { userId: uid, username: name, userPhoto: photo, songs: [] });
      }
      map.get(uid)!.songs.push(song);
    });
    return Array.from(map.values());
  }, [firebaseSongs]);

  const handleFetchYoutubeInfo = async () => {
    if (!youtubeUrl.trim()) {
      setErrorMsg('Vui lòng nhập link bài hát YouTube hợp lệ.');
      return;
    }
    setErrorMsg('');
    setIsFetchingYt(true);
    setToastMsg('Đang lấy dữ liệu và chi tiết từ YouTube...');
    try {
      const videoId = getYoutubeVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error('Không phân tích được Video ID từ link YouTube này! Vui lòng kiểm tra lại link.');
      }

      let data: any = null;

      // 1. First, attempt to use the server API endpoint
      try {
        const resp = await fetch(`/api/yt-info?url=${encodeURIComponent(youtubeUrl.trim())}`);
        if (resp.ok) {
          const contentType = resp.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            data = await resp.json();
            if (data && data.error) {
              console.warn("Backend returned error for yt-info, we will fall back to clientside:", data.error);
              data = null;
            }
          }
        }
      } catch (backendErr) {
        console.warn("Could not fetch via backend /api/yt-info (maybe offline or static site), falling back to client-side oEmbed:", backendErr);
      }

      // 2. If backend isn't available or failed, query noembed.com natively (CORS-friendly oEmbed proxy)
      if (!data || !data.title) {
        try {
          const clientRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            if (clientData && clientData.title) {
              let artist = clientData.author_name || "Cộng đồng";
              if (artist.endsWith(" - Topic")) {
                artist = artist.slice(0, -8);
              }
              data = {
                id: videoId,
                title: clientData.title,
                artist,
                coverSrc: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                audioSrc: `/api/yt-stream?id=${videoId}`,
              };
            }
          }
        } catch (clientErr) {
          console.error("Direct clientside oEmbed also failed:", clientErr);
        }
      }

      // 3. Ultimate Fallback: construct beautiful defaults using video info
      if (!data) {
        data = {
          id: videoId,
          title: "Tác phẩm YouTube mới (" + videoId + ")",
          artist: "YouTube Creator",
          coverSrc: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          audioSrc: `/api/yt-stream?id=${videoId}`,
        };
      }

      setNewTitle(data.title || '');
      setNewArtist(data.artist || '');
      setYoutubeId(data.id || videoId);
      setYoutubeCover(data.coverSrc || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
      setCoverFile(null);
      setToastMsg('✨ Lấy thông tin YouTube tuyệt vời! Đã điền sẵn tiêu đề và bìa thumbnail.');
      setTimeout(() => setToastMsg(''), 2500);
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi khi lấy thông tin YouTube.');
      setToastMsg('');
    } finally {
      setIsFetchingYt(false);
    }
  };

  // Specific YouTube Playlist fetching and processing
  const handleFetchYoutubePlaylist = async () => {
    if (!youtubeUrl.trim()) {
      setErrorMsg('Vui lòng nhập link playlist YouTube hợp lệ.');
      return;
    }
    setErrorMsg('');
    setIsFetchingYt(true);
    setToastMsg('Đang quét và bóc tách danh sách bài hát trong Playlist YouTube...');
    setPlaylistTracks([]);
    setPlaylistTitle('');
    try {
      const resp = await fetch(`/api/yt-playlist?url=${encodeURIComponent(youtubeUrl.trim())}`);
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Kiểm tra lại link Playlist YouTube hoặc thử lại!');
      }

      if (data.tracks && data.tracks.length > 0) {
        setPlaylistTracks(data.tracks);
        setPlaylistTitle(data.title || 'Tuyển tập danh sách phát');
        setToastMsg(`🎉 Tìm thấy ${data.tracks.length} bài hát trong Playlist "${data.title}"! Đã sẵn sàng nhập.`);
      } else {
        throw new Error('Không tìm thấy bài hát nào trong playlist này.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi khi lấy thông tin Playlist.');
      setToastMsg('');
    } finally {
      setIsFetchingYt(false);
    }
  };

  // Loop through extracted playlist items and save them to database/indexedDB
  const handleImportAllPlaylist = async () => {
    if (playlistTracks.length === 0) {
      setErrorMsg('Không có bài hát nào để nhập!');
      return;
    }

    if (!user) {
      setErrorMsg('Vui lòng kết nối tài khoản Google ở Menu bên trái trước khi upload lên cộng đồng!');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      setToastMsg(`Đang tiến hành nhập ${playlistTracks.length} bài hát từ playlist... Vui lòng không đóng trình duyệt.`);

      let successCount = 0;
      for (let i = 0; i < playlistTracks.length; i++) {
        const track = playlistTracks[i];
        try {
          await uploadSongToFirebase(
            track.title,
            track.artist,
            newGenre,
            null, // no manual audio file
            null, // no manual cover file
            track.id, // youtubeId
            track.coverSrc // youtubeCover
          );
          successCount++;
          setToastMsg(`Đang nhập bài (${i + 1}/${playlistTracks.length}): "${track.title}"`);
        } catch (err) {
          console.error("Lỗi khi nhập bài:", track.title, err);
        }
      }

      setToastMsg(`🎉 Nhập thành công ${successCount}/${playlistTracks.length} tác phẩm từ Playlist YouTube vào hệ thống!`);
      
      // Reset playlist tracks
      setPlaylistTracks([]);
      setPlaylistTitle('');
      setYoutubeUrl('');

      setTimeout(() => {
        setToastMsg('');
        setShowImporter(false);
      }, 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Gặp lỗi trong quá trình tự động bóc tách và nạp playlist.');
    } finally {
      setIsSaving(false);
    }
  };

  // Form submit track
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Vui lòng nhập tên bài hát.');
      return;
    }
    if (!newArtist.trim()) {
      setErrorMsg('Vui lòng nhập tên người trình bày.');
      return;
    }
    if (!youtubeId) {
      setErrorMsg('Vui lòng dán link bài hát YouTube để tiếp tục!');
      return;
    }

    if (!user) {
      setErrorMsg('Vui lòng kết nối tài khoản Google ở Menu bên trái trước khi upload lên cộng đồng!');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      setToastMsg('Đang lưu thông tin và đồng bộ trực tiếp lên Firebase Cloud...');
      await uploadSongToFirebase(
        newTitle.trim(),
        newArtist.trim(),
        newGenre,
        null,
        coverFile,
        youtubeId || undefined,
        youtubeCover || undefined
      );
      setToastMsg('🎉 Đã chia sẻ tác phẩm thành công lên cộng đồng!');

      // Reset Form fields
      setNewTitle('');
      setNewArtist('');
      setCoverFile(null);
      setYoutubeUrl('');
      setYoutubeId('');
      setYoutubeCover('');
      
      // Auto close pane
      setTimeout(() => {
        setToastMsg('');
        setShowImporter(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Đã có lỗi hệ thống khi lưu trữ dữ liệu.';
      if (err instanceof Error) {
        try {
          const detail = JSON.parse(err.message);
          if (detail && detail.error) {
            errMsg = detail.error;
          } else {
            errMsg = err.message;
          }
        } catch (_) {
          errMsg = err.message;
        }
      } else if (err && typeof err === 'object' && err.message) {
        errMsg = err.message;
      } else if (typeof err === 'string') {
        errMsg = err;
      }
      
      if (errMsg.includes('storage') || errMsg.includes('bucket') || errMsg.includes('quota') || errMsg.includes('unauthorized') || errMsg.includes('permission')) {
        setErrorMsg('Lỗi Cloud Storage: Gói Spark của bạn chưa kích hoạt hoặc không hỗ trợ lưu tệp tin. Vui lòng dán link YouTube để lưu miễn phí trên Firestore.');
      } else {
        setErrorMsg(errMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Importer bento ui block render helper
  const renderImporterCard = () => (
    <div className="bg-[#131124] border border-[#b76cff]/20 rounded-[28px] p-6 mb-6 shadow-[0_8px_32px_rgba(124,60,255,0.15)] animate-fade-in relative z-20">
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5 select-none">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Pumpkin" className="w-6 h-6 animate-pulse object-contain" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Trình Nạp Nhạc Pumpkin Creator
          </h3>
        </div>
        <button
          onClick={() => {
            setShowImporter(false);
            setPlaylistTracks([]);
            setPlaylistTitle('');
            setYoutubeUrl('');
          }}
          className="p-1 px-3 rounded-lg bg-white/4 text-xs font-bold text-[#8a80a8] hover:text-white transition"
        >
          Đóng
        </button>
      </div>

      {/* Mode Selectors */}
      <div className="grid grid-cols-2 gap-2 bg-[#06040f] border border-white/5 p-1 rounded-2xl mb-6 max-w-[440px] select-none">
        <button
          type="button"
          onClick={() => {
            setYtMode('single');
            setPlaylistTracks([]);
            setPlaylistTitle('');
            setYoutubeUrl('');
            setErrorMsg('');
          }}
          className={`py-2 px-4 rounded-xl text-[10px] font-extrabold tracking-wider transition-all duration-200 uppercase ${
            ytMode === 'single'
              ? 'bg-gradient-to-r from-[#7c3cff] to-[#b76cff] text-white shadow-[0_0_12px_rgba(183,108,255,0.3)]'
              : 'text-[#8a80a8] hover:text-white'
          }`}
        >
          🎵 Nhập 1 Bài Hát
        </button>
        <button
          type="button"
          onClick={() => {
            setYtMode('playlist');
            setNewTitle('');
            setNewArtist('');
            setYoutubeId('');
            setYoutubeCover('');
            setYoutubeUrl('');
            setErrorMsg('');
          }}
          className={`py-2 px-4 rounded-xl text-[10px] font-extrabold tracking-wider transition-all duration-200 uppercase ${
            ytMode === 'playlist'
              ? 'bg-gradient-to-r from-[#ff4fd8] to-[#b76cff] text-white shadow-[0_0_12px_rgba(255,79,216,0.3)]'
              : 'text-[#8a80a8] hover:text-white'
          }`}
        >
          ⚡ Nhập Trọn Playlist (Đa Năng)
        </button>
      </div>

      {ytMode === 'playlist' ? (
        <div className="space-y-4 animate-fade-in select-none">
          {/* YouTube playlist input helper */}
          <div className="bg-[#0f0d1a]/80 border border-purple-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-end gap-3.5">
            <div className="flex-1 flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1.5">
                <span>⚡ Auto-Scrape YouTube Playlist URL</span>
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Dán link PLAYLIST YouTube hoặc link video thuộc Playlist tại đây..."
                className="w-full bg-[#131124] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-[#b76cff] focus:ring-1 focus:ring-purple-500/50 transition font-medium"
              />
            </div>
            <button
              type="button"
              disabled={isFetchingYt || isSaving}
              onClick={handleFetchYoutubePlaylist}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-300 font-bold text-[10px] tracking-wider uppercase transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 h-[42px]"
            >
              {isFetchingYt ? 'ĐANG QUÉT...' : 'QUÉT PLAYLIST'}
            </button>
          </div>

          <div className="flex flex-col gap-1.5 max-w-[240px]">
            <label className="text-[10px] font-bold text-[#8a80a8] uppercase">Chọn Thể Loại Cho Danh Sách *</label>
            <select
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value as 'VN' | 'US')}
              className="w-full bg-[#0f0d1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#b76cff] transition font-semibold"
            >
              <option value="VN">🇻🇳 Nhạc Việt (VN)</option>
              <option value="US">🌐 Nhạc USUK (US)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-[9px] font-bold text-[#b76cff] bg-[#7c3cff]/10 border border-[#b76cff]/20 px-3 py-2 rounded-xl max-w-[340px]">
            <span>🌐</span>
            <span>Tất cả bài hát sẽ được chia sẻ lên Firebase Cộng Đồng</span>
          </div>

          {playlistTracks.length > 0 && (
            <div className="bg-[#0f0d1a]/50 border border-white/5 p-4 rounded-2xl animate-scale-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff4fd8] animate-ping" />
                    📋 {playlistTitle}
                  </h4>
                  <p className="text-[10px] text-[#8a80a8] mt-0.5">Máy chủ đã trích xuất thành công {playlistTracks.length} bài hát</p>
                </div>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleImportAllPlaylist}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3cff] to-[#ff4fd8] hover:opacity-90 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-lg shadow-purple-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'ĐANG TIẾN HÀNH NẠP...' : '⚡ BẮT ĐẦU NHẬP TẤT CẢ'}
                </button>
              </div>

              {/* Tracks List Scroll Container */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar border border-white/5 bg-[#06040f]/60 p-3 rounded-xl">
                {playlistTracks.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white/5 transition border border-transparent hover:border-white/5">
                    <div className="text-[9px] font-mono text-white/30 w-5 text-right font-bold">{idx + 1}</div>
                    <img src={item.coverSrc} className="w-9 h-9 rounded-md object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{item.title}</p>
                      <p className="text-[9px] text-[#8a80a8] truncate">{item.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error and messages section for playlist */}
          <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            {errorMsg ? (
              <div className="flex items-center gap-2 text-xs text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            ) : toastMsg ? (
              <div className="flex items-center gap-2 text-xs text-[#b76cff] font-bold">
                <CheckCircle2 className="w-4 h-4 animate-bounce" />
                <span>{toastMsg}</span>
              </div>
            ) : (
              <span className="text-[9px] text-[#8a80a8] font-mono leading-tight">
                🌐 Chế độ Firebase Cloud: Tự động trôi nổi và chia sẻ đến toàn cộng đồng.
              </span>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleImportSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 select-none animate-fade-in">
          {/* YouTube paste input helper */}
          <div className="col-span-1 md:col-span-2 bg-[#0f0d1a]/80 border border-emerald-500/15 rounded-2xl p-4 flex flex-col sm:flex-row items-end gap-3.5">
            <div className="flex-1 flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                <span>⚡ Tự động điền bằng YouTube Link (Tối ưu nhất)</span>
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Dán link bài hát YouTube vào đây... (Ví dụ: https://www.youtube.com/watch?v=... hoặc https://youtu.be/...)"
                className="w-full bg-[#131124] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition font-medium"
              />
            </div>
            <button
              type="button"
              disabled={isFetchingYt}
              onClick={handleFetchYoutubeInfo}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 font-bold text-[10px] tracking-wider uppercase transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 h-[38px]"
            >
              {isFetchingYt ? 'ĐANG LẤY...' : 'LẤY THÔNG TIN'}
            </button>
          </div>

          {youtubeId && (
            <div className="col-span-1 md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setYoutubeUrl('');
                  setYoutubeId('');
                  setYoutubeCover('');
                }}
                className="text-[9px] font-bold text-rose-400 hover:text-white transition bg-rose-500/10 border border-rose-500/15 py-1 px-2.5 rounded-lg uppercase"
              >
                ✕ Huỷ chế độ YouTube (Quay lại tải file từ máy)
              </button>
            </div>
          )}

          {/* Left Inputs column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[9px] font-bold text-[#b76cff] bg-[#7c3cff]/10 border border-[#b76cff]/20 px-3 py-2 rounded-xl">
              <span>🌐</span>
              <span>Bài hát sẽ được chia sẻ trực tiếp lên Firebase Cộng Đồng</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#8a80a8] uppercase">Tên bài hát *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Nàng Thơ Lofi, Đường Một Chiều..."
                className="w-full bg-[#0f0d1a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#b76cff] transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#8a80a8] uppercase">Nghệ sĩ thể hiện *</label>
              <input
                type="text"
                required
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                placeholder="Người trình bày, ca sĩ hoặc cover..."
                className="w-full bg-[#0f0d1a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#b76cff] transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#8a80a8] uppercase">Thể loại danh mục *</label>
              <select
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value as 'VN' | 'US')}
                className="w-full bg-[#0f0d1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#b76cff] transition"
              >
                <option value="VN">🇻🇳 Nhạc Việt (VN)</option>
                <option value="US">🌐 Nhạc USUK (US)</option>
              </select>
            </div>
          </div>

          {/* Right Files upload columns */}
          <div className="flex flex-col gap-4">
            {/* YouTube source info */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[10px] font-bold text-emerald-400 uppercase">Nguồn âm thanh *</label>
              <div className={`flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 ${youtubeId ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-[#0f0d1a]'}`}>
                <Upload className={`w-5 h-5 ${youtubeId ? 'text-emerald-400' : 'text-[#8a80a8]'}`} />
                <span className="text-[10px] font-bold text-white max-w-[200px] text-center truncate">
                  {youtubeId ? '⚡ Nguồn âm thanh YouTube tự động' : 'Dán link YouTube ở trên để tiếp tục'}
                </span>
                <span className="text-[8px] text-[#8a80a8] text-center">
                  {youtubeId ? `ID: ${youtubeId}` : 'Chỉ hỗ trợ YouTube link (Spark plan)'}
                </span>
              </div>
            </div>

            {/* File Cover art trigger */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[10px] font-bold text-[#8a80a8] uppercase">Ảnh bìa album (Mặc định nếu để trống)</label>
              <div 
                onClick={() => !youtubeId && coverInputRef.current?.click()}
                className={`flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition ${
                  youtubeId 
                    ? 'border-pink-500/40 bg-pink-500/5 cursor-not-allowed' 
                    : coverFile 
                      ? 'border-pink-500/50 bg-pink-500/5 cursor-pointer' 
                      : 'border-white/10 hover:border-[#b76cff]/40 bg-[#0f0d1a] cursor-pointer'
                }`}
              >
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={!!youtubeId}
                />
                <Upload className={`w-5 h-5 ${youtubeId || coverFile ? 'text-[#ff4fd8]' : 'text-[#8a80a8]'}`} />
                <span className="text-[10px] font-bold text-white max-w-[200px] text-center truncate">
                  {youtubeId ? '⚡ Tự động lồng thumbnail YouTube' : coverFile ? coverFile.name : 'Chọn ảnh bìa (JPG, PNG)'}
                </span>
                <span className="text-[8px] text-[#8a80a8]">
                  {youtubeId ? 'Chuẩn đĩa quay đĩa than mượt mà' : 'Ảnh Vuông tỉ lệ 1:1 cho hiển thị chuẩn đĩa quay'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button and responses overlay */}
          <div className="col-span-1 md:col-span-2 pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 mt-2">
            {errorMsg ? (
              <div className="flex items-center gap-2 text-xs text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            ) : toastMsg ? (
              <div className="flex items-center gap-2 text-xs text-[#b76cff] font-bold">
                <CheckCircle2 className="w-4 h-4 animate-bounce" />
                <span>{toastMsg}</span>
              </div>
            ) : (
              <span className="text-[9px] text-[#8a80a8] font-mono leading-tight">
                🌐 Bài hát sẽ được chia sẻ trực tiếp lên Firestore giúp cả cộng đồng cùng nghe.
              </span>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewTitle('');
                  setNewArtist('');
                  setCoverFile(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#8a80a8] bg-white/4 rounded-xl hover:text-white transition"
              >
                Xoá Nhập Liệu
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#7c3cff] hover:bg-[#b76cff] text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
              >
                {isSaving ? 'Đang Xử Lý...' : 'Đưa Lên Firebase'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );

  const showPlToast = (msg: string) => {
    setPlToast(msg);
    setTimeout(() => setPlToast(''), 2500);
  };

  const handleAddToPlaylist = async (playlistId: string, trackId: string) => {
    try {
      await addTrackToPlaylist(playlistId, trackId);
      const pl = playlists.find(p => p.id === playlistId);
      showPlToast(`✅ Đã thêm vào "${pl?.name || 'playlist'}"`);
    } catch {
      showPlToast('❌ Thêm thất bại, thử lại!');
    }
    setAddToPlDrop(null);
  };

  const handleQuickCreateAndAdd = async (trackId: string) => {
    if (!quickCreateName.trim()) return;
    try {
      await createPlaylist(quickCreateName.trim());
      // find newly created playlist by name (slight delay for Firestore)
      showPlToast(`✅ Đã tạo playlist "${quickCreateName.trim()}" và thêm bài`);
      // We'll add track after a tick so Firestore listener picks up the new playlist
      setTimeout(async () => {
        const newPl = playlists.find(p => p.name === quickCreateName.trim());
        if (newPl) await addTrackToPlaylist(newPl.id, trackId);
      }, 800);
    } catch {
      showPlToast('❌ Tạo playlist thất bại!');
    }
    setQuickCreateName('');
    setShowQuickCreate(false);
    setAddToPlDrop(null);
  };

  // Switch renderer based on navigation selection
  switch (currentView) {
    case 'nhac-viet':
      return (
        <section className="animate-fade-in flex flex-col h-full font-plus">
          {/* Header Banner - Fixed size bounding to resolve squishiness */}
          <div className="relative overflow-hidden min-h-[220px] rounded-[28px] p-8 bg-gradient-to-tr from-[#7c3cff]/35 to-[#ff4fd8]/15 border border-[#b76cff]/15 flex flex-col justify-end">
            <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full bg-[#b76cff]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#b76cff] uppercase">
                  DANH MỤC TRUYÊN ĐỀ
                </span>
                <h1 className="font-plus font-extrabold text-3xl md:text-5xl text-white tracking-wide leading-tight mt-1 mb-3">
                  NHẠC VIỆT
                </h1>
                <p className="text-xs text-[#8a80a8] font-medium max-w-[450px] leading-relaxed italic">
                  Kho lưu trữ các bài hát Việt Nam chọn lọc cao cấp. Nhấn để chìm đắm vào giai điệu lofi ấm áp.
                </p>
              </div>

              {/* Quick actions trigger addition */}
              <button
                onClick={() => {
                  setShowImporter(!showImporter);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="bg-white/5 border border-white/8 hover:border-[#b76cff]/30 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 text-white active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-[#b76cff]" />
                <span>Thêm Nhạc Hộ</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex-1">
            {/* Show local DB file importer */}
            {showImporter && renderImporterCard()}

            {/* List panel */}
            <div className="bg-[#0f0d1a]/50 border border-white/6 p-6 rounded-[26px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                <div>
                  <h2 className="text-md font-bold text-[#f0ecff]">Danh sách phát</h2>
                  <p className="text-[10px] text-[#8a80a8] font-medium">Click để phát bài hát mong muốn</p>
                </div>
                <span className="text-xs text-[#b76cff] font-mono tracking-wider font-bold">
                  {songsVN.length} BÀI HÁT
                </span>
              </div>

              {songsVN.length === 0 ? (
                <div className="py-20 text-center text-[#8a80a8] text-xs">
                  {searchQuery ? 'Không tìm thấy bài hát nào khớp với tìm kiếm.' : 'Không có bài hát thuộc chuyên mục này.'}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 md:gap-1">
                  {songsVN.map((song, idx) => {
                    const isCurrent = song.id === currentTrack.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => playTrack(song)}
                        className={`group relative flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition ${
                          isCurrent
                            ? 'bg-gradient-to-r from-[#7c3cff]/15 to-transparent border border-[#b76cff]/20'
                            : 'hover:bg-white/4 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <span className="font-mono text-xs font-bold text-[#8a80a8] w-4 select-none">
                            {isCurrent && isPlaying ? (
                              <Activity className="w-3.5 h-3.5 text-[#b76cff] animate-pulse" />
                            ) : (
                              String(idx + 1).padStart(2, '0')
                            )}
                          </span>
                          <img
                            src={song.coverSrc}
                            alt="art"
                            className="w-11 h-11 rounded-xl object-cover bg-white/5 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%231d1730%22 width=%221%22 height=%221%22/></svg>';
                            }}
                          />
                          <div className="min-w-0 pr-8">
                            <h4 className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-[#b76cff]' : 'text-[#f0ecff] group-hover:text-white'}`}>
                              {song.title}
                            </h4>
                            <p className="text-[10px] text-[#8a80a8] font-medium leading-normal mt-0.5 truncate">
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {song.isFirebase ? (
                            user && user.uid === song.userId ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Bạn có chắc muốn xoá bài hát cộng đồng "${song.title}" khỏi Firebase?`)) {
                                    deleteFirebaseSong(song.id);
                                  }
                                }}
                                className="p-1 px-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[9px] font-bold tracking-wider hover:scale-105 active:scale-95 transition"
                              >
                                XOÁ CHIA SẺ
                              </button>
                            ) : (
                              <span className="hidden md:inline text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider font-semibold">
                                👤 {song.username || 'Cộng đồng'}
                              </span>
                            )
                          ) : (
                            <span className="hidden md:inline text-[9px] font-mono text-[#8a80a8]/80 bg-white/2 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider">
                              SYSTEM
                            </span>
                          )}
                          {user && (
                            <div className="relative">
                              <button
                                onClick={e => { e.stopPropagation(); setAddToPlDrop(addToPlDrop === song.id ? null : song.id); setShowQuickCreate(false); }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-[#b76cff]/10 border border-[#b76cff]/20 text-[#b76cff] hover:bg-[#b76cff]/25 transition active:scale-90"
                                title="Thêm vào playlist"
                              >
                                <FolderPlus className="w-3.5 h-3.5" />
                              </button>
                              {addToPlDrop === song.id && <AddToPlaylistDropdown
                                trackId={song.id}
                                playlists={playlists}
                                showQuickCreate={showQuickCreate}
                                quickCreateName={quickCreateName}
                                onAddToPlaylist={handleAddToPlaylist}
                                onSetShowQuickCreate={setShowQuickCreate}
                                onSetQuickCreateName={setQuickCreateName}
                                onQuickCreateAndAdd={handleQuickCreateAndAdd}
                              />}
                            </div>
                          )}
                          <span className="font-mono text-xs text-[#8a80a8] select-none">
                            {isCurrent ? 'Đang phát' : 'Preloaded'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <CopyrightFooter />
        </section>
      );

    case 'usuk':
      return (
        <section className="animate-fade-in flex flex-col h-full font-plus">
          {/* Header Banner */}
          <div className="relative overflow-hidden min-h-[220px] rounded-[28px] p-8 bg-gradient-to-tr from-[#7c3cff]/35 to-[#ff4fd8]/15 border border-[#b76cff]/15 flex flex-col justify-end">
            <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full bg-[#b76cff]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#ff4fd8] uppercase">
                  WORLDWIDE SELECTIONS
                </span>
                <h1 className="font-plus font-extrabold text-3xl md:text-5xl text-white tracking-wide leading-tight mt-1 mb-3">
                  USUK VIBES
                </h1>
                <p className="text-xs text-[#8a80a8] font-medium max-w-[450px] leading-relaxed italic">
                  Embrace the international spectrum. Pristine hits selected for absolute sensory elegance.
                </p>
              </div>

              {/* Quick actions trigger addition */}
              <button
                onClick={() => {
                  setShowImporter(!showImporter);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="bg-white/5 border border-white/8 hover:border-[#b76cff]/30 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 text-white active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-[#ff4fd8]" />
                <span>Thêm Nhạc USUK</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex-1">
            {/* Show local DB file importer */}
            {showImporter && renderImporterCard()}

            {/* List panel */}
            <div className="bg-[#0f0d1a]/50 border border-white/6 p-6 rounded-[26px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                <div>
                  <h2 className="text-md font-bold text-[#f0ecff]">Global Playlist</h2>
                  <p className="text-[10px] text-[#8a80a8] font-medium">Click any track to transition into the groove</p>
                </div>
                <span className="text-xs text-[#ff4fd8] font-mono tracking-wider font-bold">
                  {songsUS.length} TRACKS
                </span>
              </div>

              {songsUS.length === 0 ? (
                <div className="py-20 text-center text-[#8a80a8] text-xs">
                  {searchQuery ? 'Không tìm thấy bài hát nào khớp với tìm kiếm.' : 'Không có bài hát USUK nào khả dụng.'}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 md:gap-1">
                  {songsUS.map((song, idx) => {
                    const isCurrent = song.id === currentTrack.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => playTrack(song)}
                        className={`group relative flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition ${
                          isCurrent
                            ? 'bg-gradient-to-r from-[#7c3cff]/15 to-transparent border border-[#b76cff]/20'
                            : 'hover:bg-white/4 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <span className="font-mono text-xs font-bold text-[#8a80a8] w-4 select-none">
                            {isCurrent && isPlaying ? (
                              <Activity className="w-3.5 h-3.5 text-[#ff4fd8] animate-pulse" />
                            ) : (
                              String(idx + 1).padStart(2, '0')
                            )}
                          </span>
                          <img
                            src={song.coverSrc}
                            alt="art"
                            className="w-11 h-11 rounded-xl object-cover bg-white/5 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%231d1730%22 width=%221%22 height=%221%22/></svg>';
                            }}
                          />
                          <div className="min-w-0 pr-8">
                            <h4 className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-[#ff4fd8]' : 'text-[#f0ecff] group-hover:text-white'}`}>
                              {song.title}
                            </h4>
                            <p className="text-[10px] text-[#8a80a8] font-medium leading-normal mt-0.5 truncate">
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {song.isFirebase ? (
                            user && user.uid === song.userId ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Bạn có chắc muốn xoá bài hát cộng đồng "${song.title}" khỏi Firebase?`)) {
                                    deleteFirebaseSong(song.id);
                                  }
                                }}
                                className="p-1 px-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[9px] font-bold tracking-wider hover:scale-105 active:scale-95 transition"
                              >
                                XOÁ CHIA SẺ
                              </button>
                            ) : (
                              <span className="hidden md:inline text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider font-semibold">
                                👤 {song.username || 'Cộng đồng'}
                              </span>
                            )
                          ) : (
                            <span className="hidden md:inline text-[9px] font-mono text-[#8a80a8]/80 bg-white/2 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider">
                              SYSTEM
                            </span>
                          )}
                          {user && (
                            <div className="relative">
                              <button
                                onClick={e => { e.stopPropagation(); setAddToPlDrop(addToPlDrop === song.id ? null : song.id); setShowQuickCreate(false); }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-[#b76cff]/10 border border-[#b76cff]/20 text-[#b76cff] hover:bg-[#b76cff]/25 transition active:scale-90"
                                title="Thêm vào playlist"
                              >
                                <FolderPlus className="w-3.5 h-3.5" />
                              </button>
                              {addToPlDrop === song.id && <AddToPlaylistDropdown
                                trackId={song.id}
                                playlists={playlists}
                                showQuickCreate={showQuickCreate}
                                quickCreateName={quickCreateName}
                                onAddToPlaylist={handleAddToPlaylist}
                                onSetShowQuickCreate={setShowQuickCreate}
                                onSetQuickCreateName={setQuickCreateName}
                                onQuickCreateAndAdd={handleQuickCreateAndAdd}
                              />}
                            </div>
                          )}
                          <span className="font-mono text-xs text-[#8a80a8] select-none">
                            {isCurrent ? 'Playing' : 'Ready'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <CopyrightFooter />
        </section>
      );

    case 'yeu-thich':
      return (
        <section className="animate-fade-in flex flex-col h-full font-plus">
          {/* Header Banner - Spotify Heart-style list */}
          <div className="relative overflow-hidden min-h-[220px] rounded-[28px] p-8 bg-gradient-to-tr from-rose-500/25 to-[#ff4fd8]/10 border border-rose-500/15 flex flex-col justify-end">
            <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex items-end justify-between w-full">
              <div className="flex items-end gap-5">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/10 flex-shrink-0 animate-pulse">
                  <Heart className="w-8 h-8 fill-rose-500" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-[0.25em] text-rose-400 uppercase">
                    DANH SÁCH RIÊNG CỦA BẠN
                  </span>
                  <h1 className="font-plus font-extrabold text-3xl md:text-5xl text-white tracking-wide leading-tight mt-1 mb-2">
                    BÀI HÁT YÊU THÍCH
                  </h1>
                  <p className="text-xs text-[#8a80a8] font-medium max-w-[450px] leading-relaxed italic">
                    Không gian lưu giữ những cảm xúc ưa chuộng của bạn. Cảm thụ trọn vẹn từng tần số.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* List panel */}
          <div className="bg-[#0f0d1a]/50 border border-white/6 p-6 rounded-[26px] mt-6 flex-1">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
              <div>
                <h2 className="text-md font-bold text-[#f0ecff]">Nhạc yêu thích</h2>
                <p className="text-[10px] text-[#8a80a8] font-medium">Lưu trữ tự động hoàn toàn tại thiết bị của bạn</p>
              </div>
              <span className="text-xs text-rose-400 font-mono tracking-wider font-bold">
                {favoriteTracks.length} BÀI ĐÃ THÍCH
              </span>
            </div>

            {favoriteTracks.length === 0 ? (
              <div className="py-24 text-center text-[#8a80a8] flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full border border-white/5 bg-white/2 flex items-center justify-center text-[#8a80a8]/50">
                  <Heart className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold">Chưa có bài hát nào được yêu thích.</p>
                <p className="text-[10px] text-[#8a80a8]/60 max-w-[280px]">
                  Bấm biểu tượng trái tim ở thanh điều điều khiển bên dưới để thêm bài hát vào đây nhé!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 md:gap-1">
                {favoriteTracks.map((song, idx) => {
                  const isCurrent = song.id === currentTrack.id;
                  return (
                    <div
                      key={song.id}
                      onClick={() => playTrack(song)}
                      className={`group relative flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#7c3cff]/15 to-transparent border border-[#b76cff]/20'
                          : 'hover:bg-white/4 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <span className="font-mono text-xs font-bold text-[#8a80a8] w-4 select-none">
                          {isCurrent && isPlaying ? (
                            <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          ) : (
                            String(idx + 1).padStart(2, '0')
                          )}
                        </span>
                        <img
                          src={song.coverSrc}
                          alt="art"
                          className="w-11 h-11 rounded-xl object-cover bg-white/5 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%231d1730%22 width=%221%22 height=%221%22/></svg>';
                          }}
                        />
                        <div className="min-w-0 pr-8">
                          <h4 className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-rose-500' : 'text-[#f0ecff] group-hover:text-white'}`}>
                            {song.title}
                          </h4>
                          <p className="text-[10px] text-[#8a80a8] font-medium leading-normal mt-0.5 truncate">
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {song.isFirebase ? (
                          user && user.uid === song.userId ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Bạn có chắc muốn xoá bài hát cộng đồng "${song.title}" khỏi Firebase?`)) {
                                  deleteFirebaseSong(song.id);
                                }
                              }}
                              className="p-1 px-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[9px] font-bold tracking-wider hover:scale-105 active:scale-95 transition"
                            >
                              XOÁ CHIA SẺ
                            </button>
                          ) : (
                            <span className="hidden md:inline text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider font-semibold">
                              👤 {song.username || 'Cộng đồng'}
                            </span>
                          )
                        ) : (
                          <span className="hidden md:inline text-[9px] font-mono text-[#8a80a8]/80 bg-white/2 px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider">
                            SYSTEM
                          </span>
                        )}
                        {user && (
                          <div className="relative">
                            <button
                              onClick={e => { e.stopPropagation(); setAddToPlDrop(addToPlDrop === song.id ? null : song.id); setShowQuickCreate(false); }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-[#b76cff]/10 border border-[#b76cff]/20 text-[#b76cff] hover:bg-[#b76cff]/25 transition active:scale-90"
                              title="Thêm vào playlist"
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                            </button>
                            {addToPlDrop === song.id && <AddToPlaylistDropdown
                                trackId={song.id}
                                playlists={playlists}
                                showQuickCreate={showQuickCreate}
                                quickCreateName={quickCreateName}
                                onAddToPlaylist={handleAddToPlaylist}
                                onSetShowQuickCreate={setShowQuickCreate}
                                onSetQuickCreateName={setQuickCreateName}
                                onQuickCreateAndAdd={handleQuickCreateAndAdd}
                              />}
                          </div>
                        )}
                        <span className="font-mono text-xs text-[#8a80a8] select-none">
                          Fav Track
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <CopyrightFooter />
        </section>
      );

    case 'now-playing':
      return (
        <section className="animate-fade-in flex flex-col h-full font-plus select-none">
          <div className="relative overflow-hidden min-h-[460px] md:min-h-[520px] rounded-[32px] border border-white/8 bg-[#0f0d1a]/82 shadow-2xl backdrop-blur-2xl p-6 md:p-12 flex flex-col justify-between">
            {/* Ambient matching blurred backing cover art decoration */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.14] filter blur-[60px] saturate-200 transition-all duration-700">
              <img src={currentTrack.coverSrc} alt="blurred-art" className="w-full h-full object-cover scale-[1.3]" />
            </div>

            {/* Title display block */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#ff4fd8] animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#b76cff] uppercase">
                  Studio Focus Cinema
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#8a80a8] tracking-widest uppercase">
                Now Airing · {currentTrack.genre}
              </span>
            </div>

            {/* Major Interactive Module layout for Vinyl Disk & Arm */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-12 my-8">
              
              {/* Disc component with Arm positioning lever */}
              <div className="relative w-56 h-56 md:w-76 md:h-76 flex-shrink-0 flex items-center justify-center">
                
                {/* Arm spindle stylus pin */}
                <div className="absolute top-[-36px] right-2 md:right-8 w-24 z-30 pointer-events-none">
                  {/* Rotating needle body relying on playing state */}
                  <div
                    className="relative w-full origin-top-right transition-transform duration-[850ms] ease-out shadow-lg"
                    style={{
                      transform: isPlaying ? 'rotate(-6deg)' : 'rotate(-28deg)'
                    }}
                  >
                    {/* Metal arm stylus line */}
                    <div className="w-[3px] h-[100px] bg-gradient-to-b from-[#f0ecff]/90 to-[#b76cff]/40 rounded-full ml-auto shadow-inner" style={{ transform: 'rotate(-4deg)' }} />
                    {/* Head needle visual indicator */}
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#ff4fd8] to-[#7c3cff] border border-white/20 shadow-[-2px_4px_12px_rgba(183,108,255,0.6)] ml-[86px] mt-[-2px]" />
                  </div>
                </div>

                {/* Rotating black Vinyl disc body */}
                <div
                  onClick={togglePlayPause}
                  className={`relative w-full h-full rounded-full bg-gradient-to-tr from-zinc-950 to-[#1a1630] border-[5px] border-black shadow-[0_16px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(183,108,255,0.18)] flex items-center justify-center overflow-hidden cursor-pointer active:scale-[0.98] transition-transform duration-100 ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}
                  title="Click to play/pause track"
                >
                  {/* Concentric vinyl tracks grooves */}
                  <div className="absolute inset-0 rounded-full vinyl-grooves pointer-events-none" />

                  {/* Album Cover Circle inside disc */}
                  <div className="w-[52%] h-[52%] rounded-full overflow-hidden border-[3px] border-[#06040f] shadow-inner relative z-10">
                    <img src={currentTrack.coverSrc} alt="Art centered" className="w-full h-full object-cover" />
                  </div>

                  {/* Core spindle pinhole node */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4.5 h-4.5 bg-[#06040f] rounded-full border border-white/10 z-20 shadow-md" />
                </div>

              </div>

              {/* Glowing playback song copy column */}
              <div className="text-center md:text-left max-w-[420px] flex-1">
                <span className="text-[9px] font-bold tracking-[0.25em] text-[#ff4fd8] uppercase bg-white/3 px-3 py-1 rounded-full border border-white/5 inline-block mb-3 select-none">
                  PHÁT NHẠC CAO CẤP
                </span>
                <h2 className="font-plus font-extrabold text-2xl md:text-4xl text-white tracking-wide leading-tight mb-2 uppercase select-text hover:text-[#b76cff] transition-colors">
                  {currentTrack.title}
                </h2>
                <p className="text-sm font-semibold text-[#8a80a8] mb-6 tracking-wide select-text">
                  {currentTrack.artist}
                </p>

                {/* Timescales with dynamic tracker */}
                <div className="flex items-center justify-center md:justify-start gap-3 text-xs text-[#b76cff] font-mono select-none">
                  <span className="font-bold">{formatTime(currentTime)}</span>
                  <span className="text-[#8a80a8]/40">•</span>
                  <span className="text-[#8a80a8]">{formatTime(duration)}</span>
                </div>

                {/* High fidelity waveform equalizer (animated columns) */}
                <div className="flex items-end justify-center md:justify-start gap-[3.5px] h-11 mt-6 overflow-hidden">
                  {waveHeights.map((h, i) => (
                    <span
                      key={i}
                      className="w-[3px] rounded-t bg-gradient-to-t from-[#7c3cff] to-[#ff4fd8] transition-all duration-[120ms]"
                      style={{
                        height: h,
                        opacity: isPlaying ? 0.8 : 0.25
                      }}
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* Mini helper hint bottom overlay */}
            <div className="relative z-10 flex justify-between items-center bg-white/2 border border-white/5 rounded-2xl p-3 text-[10px] font-medium text-[#8a80a8] select-none">
              <span className="flex items-center gap-1.5 text-orange-400">
                <Heart className="w-3 h-3 fill-orange-500 text-orange-500 animate-pulse" />
                <span>Pumpkin Player Premium</span>
              </span>
              <span>Click vào đĩa quay để tạm hoãn/phát nhạc</span>
            </div>

          </div>

          <CopyrightFooter />
        </section>
      );

    case 'danh-muc-khac':
      return (
        <section className="animate-fade-in flex flex-col h-full font-plus">
          {/* Header Banner - Fixed size bounding */}
          <div className="relative overflow-hidden min-h-[200px] rounded-[28px] p-8 bg-gradient-to-tr from-[#7c3cff]/30 to-[#ff4fd8]/10 border border-[#b76cff]/15 flex flex-col justify-end mb-6">
            <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full bg-[#b76cff]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#b76cff] uppercase">
                  Mạng Lưới Chia Sẻ Cộng Đồng
                </span>
                <h1 className="font-plus font-extrabold text-3xl md:text-5xl text-white tracking-wide leading-tight mt-1 mb-2">
                  DANH MỤC KHÁC
                </h1>
                <p className="text-xs text-[#8a80a8] font-medium max-w-[450px] leading-relaxed italic">
                  Khám phá danh sách phát nhạc riêng biệt của từng thành viên đóng góp trên hệ thống Firebase.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1">
            {!selectedUploaderId ? (
              // Display list of contributors/uploaders
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h2 className="text-sm font-bold text-[#f0ecff] uppercase tracking-wider">Thành Viên Chia Sẻ ({uploaders.length})</h2>
                  <span className="text-[10px] text-[#8a80a8]">Bấm chọn người dùng để nghe playlist cá nhân</span>
                </div>

                {uploaders.length === 0 ? (
                  <div className="py-20 text-center text-[#8a80a8] bg-[#0f0d1a]/40 rounded-3xl border border-white/5 text-xs">
                    Chưa có thành viên nào chia sẻ nhạc lên hệ thống cộng đồng.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-plus">
                    {uploaders.map((uploader) => (
                      <div
                        key={uploader.userId}
                        onClick={() => setSelectedUploaderId(uploader.userId)}
                        className="group bg-[#110e20]/60 hover:bg-[#1a1632]/80 border border-white/5 hover:border-[#b76cff]/30 rounded-[22px] p-5 transition-all duration-250 cursor-pointer flex items-center justify-between shadow-sm hover:shadow-lg"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* User Avatar */}
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-[#7c3cff] to-[#ff4fd8] p-0.5 flex-shrink-0">
                            {uploader.userPhoto ? (
                              <img src={uploader.userPhoto} alt="Avatar" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                                {uploader.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white group-hover:text-[#b76cff] transition truncate">
                              {uploader.username}
                            </h4>
                            <p className="text-[10px] text-[#8a80a8] mt-1 font-medium">
                              {uploader.songs.length} tác phẩm đã chia sẻ
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] font-bold text-[#b76cff] bg-[#b76cff]/10 px-2.5 py-1.5 rounded-xl uppercase tracking-wider group-hover:bg-[#b76cff] group-hover:text-white transition-all">
                          XEM PLAYLIST
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Display a particular contributor's songs
              (() => {
                const curUploader = uploaders.find(u => u.userId === selectedUploaderId);
                if (!curUploader) {
                  setSelectedUploaderId(null);
                  return null;
                }
                return (
                  <div className="animate-fade-in flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-2">
                      <button
                        onClick={() => setSelectedUploaderId(null)}
                        className="text-xs font-bold text-[#b76cff] bg-[#7c3cff]/10 border border-[#b76cff]/20 px-3.5 py-2 rounded-xl hover:bg-[#b76cff]/20 transition flex items-center gap-1.5 active:scale-95"
                      >
                        ← Trở lại danh mục thành viên
                      </button>

                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#b76cff]/20 flex items-center justify-center text-[10px] font-bold text-white">
                          {curUploader.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-bold text-[#f0ecff]">
                          Playlist của {curUploader.username}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#0f0d1a]/50 border border-white/6 p-6 rounded-[26px]">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                        <div>
                          <h2 className="text-md font-bold text-[#f0ecff]">Bộ Sưu Tập Cá Nhân</h2>
                          <p className="text-[10px] text-[#8a80a8] font-medium">Click để thưởng thức tác phẩm yêu thích</p>
                        </div>
                        <span className="text-xs text-[#b76cff] font-mono tracking-wider font-bold">
                          {curUploader.songs.length} BÀI HÁT
                        </span>
                      </div>

                      {curUploader.songs.length === 0 ? (
                        <div className="py-20 text-center text-[#8a80a8] text-xs">
                          Bộ sưu tập tạm thời trống rỗng.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5 md:gap-1">
                          {curUploader.songs.map((song, idx) => {
                            const isCurrent = song.id === currentTrack.id;
                            return (
                              <div
                                key={song.id}
                                onClick={() => playTrack(song)}
                                className={`group relative flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition ${
                                  isCurrent
                                    ? 'bg-gradient-to-r from-[#7c3cff]/15 to-transparent border border-[#b76cff]/20'
                                    : 'hover:bg-white/4 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                  <span className="font-mono text-xs font-bold text-[#8a80a8] w-4 select-none">
                                    {isCurrent && isPlaying ? (
                                      <Activity className="w-3.5 h-3.5 text-[#b76cff] animate-pulse" />
                                    ) : (
                                      String(idx + 1).padStart(2, '0')
                                    )}
                                  </span>
                                  <img
                                    src={song.coverSrc}
                                    alt="art"
                                    className="w-11 h-11 rounded-xl object-cover bg-white/5 flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%231d1730%22 width=%221%22 height=%221%22/></svg>';
                                    }}
                                  />
                                  <div className="min-w-0 pr-8">
                                    <h4 className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-[#b76cff]' : 'text-[#f0ecff] group-hover:text-white'}`}>
                                      {song.title}
                                    </h4>
                                    <p className="text-[10px] text-[#8a80a8] font-medium leading-normal mt-0.5 truncate">
                                      {song.artist}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 flex-shrink-0">
                                  {song.genre && (
                                    <span className="text-[8px] font-bold text-[#8a80a8] border border-white/5 bg-white/3 px-2 py-0.5 rounded uppercase">
                                      {song.genre}
                                    </span>
                                  )}

                                  {/* User specific delete authorization */}
                                  {user && user.uid === song.userId && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Bạn muốn xoá bài hát "${song.title}" khỏi Firebase?`)) {
                                          deleteFirebaseSong(song.id);
                                        }
                                      }}
                                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all scale-90 md:scale-100"
                                      title="Xoá khỏi tuyển tập chia sẻ"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          <CopyrightFooter />
        </section>
      );

    case 'library':
    default:
      return (
        <section className="animate-fade-in flex flex-col h-full font-plus">
          {/* Header Banner */}
          <div className="relative overflow-hidden min-h-[220px] rounded-[28px] p-8 bg-gradient-to-tr from-[#7c3cff]/35 to-[#ff4fd8]/15 border border-[#b76cff]/15 flex flex-col justify-end">
            <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full bg-[#b76cff]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
              <div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#b76cff] uppercase">
                  TRÌNH PHÁT THƯ VIỆN TOÀN BẢN
                </span>
                <h1 className="font-plus font-extrabold text-3xl md:text-5xl text-white tracking-wide leading-tight mt-1 mb-3">
                  THƯ VIỆN NHẠC
                </h1>
                <p className="text-xs text-[#8a80a8] font-medium max-w-[450px] leading-relaxed italic">
                  Bảng lưới danh mục các album tác phẩm tuyển chọn. Định dạng hiển thị bento sang trọng.
                </p>
              </div>

              {/* Quick actions trigger addition */}
              <button
                onClick={() => {
                  setShowImporter(!showImporter);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="bg-white/5 border border-white/8 hover:border-[#b76cff]/30 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 text-white active:scale-95 transition-all animate-pulse"
              >
                <Plus className="w-4 h-4 text-[#ff4fd8]" />
                <span>+ Thêm Nhạc Của Bạn</span>
              </button>
            </div>
          </div>

          <div className="mt-8 flex-1">
            {/* Show local DB file importer inside Thư Viện too! */}
            {showImporter && renderImporterCard()}

            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h2 className="text-md font-bold text-[#f0ecff]">Tất cả bài hát</h2>
              <span className="text-xs font-mono text-[#8a80a8] font-bold">
                {filteredPlaylist.length} TÁC PHẨM
              </span>
            </div>

            {filteredPlaylist.length === 0 ? (
              <div className="py-20 text-center text-[#8a80a8] text-xs bg-[#0f0d1a]/50 p-6 rounded-3xl border border-white/6">
                Chưa tìm thấy bài hát nào khớp với từ khóa tìm kiếm. Triệt tiêu tìm kiếm để khôi phục danh mục.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPlaylist.map((song) => {
                  const isCurrent = song.id === currentTrack.id;
                  return (
                    <div
                      key={song.id}
                      onClick={() => playTrack(song)}
                      className={`group relative p-3.5 rounded-2xl bg-[#110e20]/60 border transition cursor-pointer select-none flex flex-col gap-3 ${
                        isCurrent
                          ? 'border-[#b76cff]/55 bg-[#7c3cff]/10 shadow-[0_8px_24px_rgba(183,108,255,0.15)]'
                          : 'border-white/6 hover:border-[#b76cff]/20 hover:bg-[#1a1632]/80'
                      }`}
                    >
                      {/* Cover wrapper block */}
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                        <img
                          src={song.coverSrc}
                          alt="Cover view"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%231d1730%22 width=%221%22 height=%221%22/></svg>';
                          }}
                        />
                        {/* Play overlays trigger visually */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-[#b76cff]/90 text-white flex items-center justify-center shadow-lg">
                            <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                          </div>
                        </div>

                        {/* Genre badge overlays */}
                        <span className={`absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded ${
                          song.genre === 'VN' ? 'bg-[#b76cff]/25 text-[#f5f1fe]' : 'bg-[#ff4fd8]/25 text-[#f5f1fe]'
                        }`}>
                          {song.genre}
                        </span>

                        {/* Live trash deletion trigger */}
                        {(song.isFirebase && user && user.uid === song.userId) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Xoá tác phẩm chia sẻ cộng đồng "${song.title}" khỏi Firebase?`)) {
                                deleteFirebaseSong(song.id);
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#300a12]/90 text-rose-400 hover:bg-rose-600 hover:text-white transition shadow z-30 border border-rose-800/30"
                            title="Xoá vĩnh viễn khỏi Firebase"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Info details */}
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-[#b76cff]' : 'text-white group-hover:text-[#b76cff] transition'}`}>
                            {song.title}
                          </h4>
                          <p className="text-[10px] text-[#8a80a8] font-medium leading-normal mt-0.5 truncate">
                            {song.artist}
                          </p>
                          {song.isFirebase && (
                            <span className="inline-block mt-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 max-w-full truncate">
                              👤 {song.username || 'Cộng đồng'}
                            </span>
                          )}
                        </div>
                        {isCurrent && isPlaying && (
                          <div className="flex items-center gap-1.5 mt-2.5 text-[9px] font-bold text-[#b76cff]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#b76cff] animate-ping" />
                            <span>ĐANG PHÁT NHẠC</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <CopyrightFooter />
        </section>
      );

    case 'playlists': {
      return (
        <section className="animate-fade-in flex flex-col h-full font-plus">
          {/* Playlist toast notification */}
          {plToast && (
            <div className="fixed bottom-40 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1630] border border-[#b76cff]/30 rounded-2xl text-xs text-white shadow-2xl animate-fade-in">
              {plToast}
            </div>
          )}

          {/* Header */}
          <div className="relative overflow-hidden min-h-[180px] rounded-[28px] p-8 bg-gradient-to-tr from-[#7c3cff]/35 to-[#ff4fd8]/15 border border-[#b76cff]/15 flex flex-col justify-end mb-6">
            <div className="absolute top-[-60px] right-[-40px] w-64 h-64 rounded-full bg-[#b76cff]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[10px] font-bold tracking-[0.25em] text-[#b76cff] uppercase">Thư viện cá nhân</span>
              <h1 className="font-plus font-extrabold text-3xl text-white tracking-wide leading-tight mt-1">
                🎵 Playlist của tôi
              </h1>
              <p className="text-[#8a80a8] text-xs mt-1">{playlists.length} playlist · Chỉ hiển thị cho bạn</p>
            </div>
          </div>

          {!user ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
              <ListMusic className="w-12 h-12 text-[#8a80a8]/40" />
              <p className="text-[#8a80a8] text-sm">Đăng nhập để tạo và quản lý playlist của bạn</p>
            </div>
          ) : playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
              <ListMusic className="w-12 h-12 text-[#8a80a8]/40" />
              <p className="text-[#8a80a8] text-sm">Chưa có playlist nào</p>
              <p className="text-[#8a80a8]/60 text-xs">Nhấn dấu "+" ở sidebar để tạo playlist đầu tiên</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map(pl => {
                // Find cover from first track in playlist
                const firstTrackId = pl.trackIds[0];
                const firstTrack = playlist.find(t => t.id === firstTrackId);
                const coverSrc = firstTrack?.coverSrc || '';

                return (
                  <div
                    key={pl.id}
                    className="group relative flex flex-col bg-white/3 border border-white/6 rounded-2xl overflow-hidden cursor-pointer hover:bg-white/6 hover:border-[#b76cff]/20 transition-all duration-200"
                    onClick={() => { setSelectedPlaylistId(pl.id); setCurrentView('playlist-detail'); }}
                  >
                    {/* Cover art */}
                    <div className="relative w-full aspect-square bg-gradient-to-br from-[#7c3cff]/20 to-[#ff4fd8]/10 overflow-hidden">
                      {coverSrc ? (
                        <img src={coverSrc} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">🎵</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <button
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 w-9 h-9 rounded-full bg-[#b76cff] flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                        onClick={e => { e.stopPropagation(); const tracks = playlist.filter(t => pl.trackIds.includes(t.id)); if (tracks.length > 0) playTrack(tracks[0]); }}
                      >
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-3 flex flex-col gap-1">
                      {renamingPlId === pl.id ? (
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            type="text"
                            value={renameVal}
                            onChange={e => setRenameVal(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter') { await renamePlaylist(pl.id, renameVal); setRenamingPlId(null); }
                              if (e.key === 'Escape') setRenamingPlId(null);
                            }}
                            className="flex-1 px-2 py-1 bg-white/5 border border-[#b76cff]/30 rounded-lg text-[11px] text-white outline-none"
                          />
                          <button onClick={async () => { await renamePlaylist(pl.id, renameVal); setRenamingPlId(null); }} className="px-2 py-1 bg-[#7c3cff] rounded-lg text-white text-[10px] font-bold">OK</button>
                        </div>
                      ) : (
                        <h3 className="text-xs font-bold text-white truncate">{pl.name}</h3>
                      )}
                      <p className="text-[10px] text-[#8a80a8]">{pl.trackIds.length} bài hát</p>

                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={e => { e.stopPropagation(); setRenamingPlId(pl.id); setRenameVal(pl.name); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#8a80a8] hover:text-white text-[9px] font-bold transition"
                        >
                          <Pencil className="w-2.5 h-2.5" /> Đổi tên
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); if (confirm(`Xoá playlist "${pl.name}"?`)) deletePlaylist(pl.id); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-bold transition"
                        >
                          <Trash className="w-2.5 h-2.5" /> Xoá
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <CopyrightFooter />
        </section>
      );
    }

    case 'playlist-detail': {
      const currentPl = playlists.find(p => p.id === selectedPlaylistId);
      const plTracks = currentPl ? playlist.filter(t => currentPl.trackIds.includes(t.id)) : [];

      return (
        <section className="animate-fade-in flex flex-col h-full font-plus">
          {/* Playlist toast */}
          {plToast && (
            <div className="fixed bottom-40 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#1a1630] border border-[#b76cff]/30 rounded-2xl text-xs text-white shadow-2xl animate-fade-in">
              {plToast}
            </div>
          )}

          {!currentPl ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
              <p className="text-[#8a80a8] text-sm">Không tìm thấy playlist này.</p>
              <button onClick={() => setCurrentView('playlists')} className="text-[#b76cff] text-xs hover:underline">← Quay về danh sách</button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative overflow-hidden min-h-[200px] rounded-[28px] p-8 bg-gradient-to-tr from-[#7c3cff]/35 to-[#ff4fd8]/15 border border-[#b76cff]/15 flex items-end gap-6 mb-6">
                <div className="absolute top-[-60px] right-[-40px] w-64 h-64 rounded-full bg-[#b76cff]/10 blur-3xl pointer-events-none" />
                {/* Playlist mosaic cover */}
                <div className="relative z-10 w-24 h-24 rounded-2xl overflow-hidden bg-[#1a1630] border border-white/10 flex-shrink-0 grid grid-cols-2 gap-0">
                  {plTracks.slice(0, 4).map((t, i) => (
                    <img key={i} src={t.coverSrc} alt="" className="w-full h-full object-cover" />
                  ))}
                  {plTracks.length === 0 && <div className="col-span-2 row-span-2 flex items-center justify-center text-3xl">🎵</div>}
                </div>

                <div className="relative z-10 flex flex-col gap-2 flex-1 min-w-0">
                  {renamingPlId === currentPl.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        autoFocus
                        type="text"
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onKeyDown={async e => { if (e.key === 'Enter') { await renamePlaylist(currentPl.id, renameVal); setRenamingPlId(null); } if (e.key === 'Escape') setRenamingPlId(null); }}
                        className="px-3 py-1.5 bg-white/10 border border-[#b76cff]/40 rounded-xl text-white text-xl font-extrabold outline-none w-full"
                      />
                      <button onClick={async () => { await renamePlaylist(currentPl.id, renameVal); setRenamingPlId(null); }} className="px-3 py-1.5 bg-[#7c3cff] rounded-xl text-white text-xs font-bold">OK</button>
                    </div>
                  ) : (
                    <h1 className="font-plus font-extrabold text-2xl md:text-4xl text-white tracking-wide leading-tight truncate">{currentPl.name}</h1>
                  )}
                  <p className="text-[#8a80a8] text-xs">{plTracks.length} bài hát</p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {plTracks.length > 0 && (
                      <button
                        onClick={() => playTrack(plTracks[0])}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b76cff] hover:brightness-110 active:scale-95 transition text-white text-xs font-bold shadow-lg shadow-purple-500/20"
                      >
                        <PlayCircle className="w-4 h-4" /> Phát tất cả
                      </button>
                    )}
                    <button
                      onClick={() => { setRenamingPlId(currentPl.id); setRenameVal(currentPl.name); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 text-[#8a80a8] hover:text-white text-xs font-bold transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Đổi tên
                    </button>
                    <button
                      onClick={() => { if (confirm(`Xoá playlist "${currentPl.name}"?`)) { deletePlaylist(currentPl.id); setCurrentView('playlists'); } }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition"
                    >
                      <Trash className="w-3.5 h-3.5" /> Xoá playlist
                    </button>
                    <button
                      onClick={() => setCurrentView('playlists')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 text-[#8a80a8] hover:text-white text-xs font-bold transition"
                    >
                      ← Danh sách
                    </button>
                  </div>
                </div>
              </div>

              {/* Track list */}
              {plTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
                  <Music className="w-12 h-12 text-[#8a80a8]/30" />
                  <p className="text-[#8a80a8] text-sm">Playlist này chưa có bài hát nào</p>
                  <p className="text-[#8a80a8]/60 text-xs">Hover vào bài hát ở các tab khác và nhấn nút <FolderPlus className="inline w-3 h-3 mx-0.5" /> để thêm vào đây</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 bg-white/2 border border-white/5 rounded-2xl p-4">
                  {plTracks.map((song, idx) => {
                    const isCurrent = song.id === currentTrack.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => playTrack(song)}
                        className={`group relative flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition ${
                          isCurrent
                            ? 'bg-gradient-to-r from-[#7c3cff]/15 to-transparent border border-[#b76cff]/20'
                            : 'hover:bg-white/4 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <span className="font-mono text-xs font-bold text-[#8a80a8] w-4 select-none">
                            {isCurrent && isPlaying ? (
                              <Activity className="w-3.5 h-3.5 text-[#b76cff] animate-pulse" />
                            ) : (
                              String(idx + 1).padStart(2, '0')
                            )}
                          </span>
                          <img
                            src={song.coverSrc}
                            alt="art"
                            className="w-11 h-11 rounded-xl object-cover bg-white/5 flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%231d1730%22 width=%221%22 height=%221%22/></svg>'; }}
                          />
                          <div className="min-w-0 pr-4">
                            <h4 className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-[#b76cff]' : 'text-[#f0ecff] group-hover:text-white'}`}>{song.title}</h4>
                            <p className="text-[10px] text-[#8a80a8] font-medium leading-normal mt-0.5 truncate">{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${song.genre === 'VN' ? 'text-[#b76cff] bg-[#b76cff]/10 border-[#b76cff]/20' : 'text-[#ff4fd8] bg-[#ff4fd8]/10 border-[#ff4fd8]/20'}`}>
                            {song.genre}
                          </span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (confirm(`Xoá "${song.title}" khỏi playlist?`)) removeTrackFromPlaylist(currentPl.id, song.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/15 text-rose-400 hover:bg-rose-500/20 transition active:scale-90"
                            title="Xoá khỏi playlist"
                          >
                            <Trash className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs text-[#8a80a8] select-none w-16 text-right">
                            {isCurrent ? 'Đang phát' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <CopyrightFooter />
            </>
          )}
        </section>
      );
    }
  }
};
export default MainScreen;