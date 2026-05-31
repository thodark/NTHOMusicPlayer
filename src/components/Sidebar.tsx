import React from 'react';
import { useAudioPlayback } from '../context/AudioPlaybackContext';
import { ViewType, EqPreset } from '../types';
import { Music, Globe, Heart, Library, Search, SlidersHorizontal, Sparkles, LogIn, LogOut, ListMusic, Plus, ChevronRight } from 'lucide-react';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const {
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    isPlaying,
    eqPreset,
    setPreset,
    eqGains,
    updateEqGain,
    favorites,
    user,
    signInWithGoogle,
    logout,
    playlists,
    selectedPlaylistId,
    setSelectedPlaylistId,
    createPlaylist,
  } = useAudioPlayback();

  const handleNavClick = (view: ViewType) => {
    setCurrentView(view);
    onCloseMobile?.();
  };

  const [isCreatingPlaylist, setIsCreatingPlaylist] = React.useState(false);
  const [newPlaylistName, setNewPlaylistName] = React.useState('');

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreatingPlaylist(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setCurrentView('playlist-detail');
    onCloseMobile?.();
  };

  return (
    <aside className={`
      flex-shrink-0 flex flex-col gap-4 overflow-y-auto transition-all duration-300 ease-out
      fixed inset-y-0 left-0 h-screen w-[290px] bg-[#0f0d1a]/98 border-r border-[#ffffff]/10 rounded-r-[32px] rounded-l-none shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-[100] p-6
      
      /* Mobile open/closed states */
      ${isOpenMobile 
        ? 'translate-x-0 opacity-100 pointer-events-auto' 
        : '-translate-x-full opacity-0 pointer-events-none'
      }

      /* Desktop layouts and resets */
      md:flex md:sticky md:top-5 md:h-[calc(100vh-120px)] md:max-h-[calc(100vh-120px)] md:w-[280px] md:bg-[#0f0d1a]/82 md:border md:border-white/8 md:rounded-[32px] md:shadow-2xl md:backdrop-blur-3xl md:p-5 md:z-40 md:translate-x-0 md:opacity-100 md:pointer-events-auto md:rounded-l-[32px]
    `}>
      {/* 1. Logo & Brand: Fixed, exquisite, and non-distorted typography using Unbounded */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Pumpkin" className="w-10 h-10 object-contain filter drop-shadow-[0_0_8px_rgba(183,108,255,0.4)] animate-pulse" />
          <div>
            <span className="font-unbounded font-black tracking-widest text-[#f5f1fe] text-md bg-clip-text text-transparent bg-gradient-to-r from-[#b76cff] to-[#ff4fd8] logo-glow uppercase">
              Pumpkin
            </span>
            <span className="block text-[8px] tracking-[0.25em] text-[#8a80a8] font-bold uppercase">
              Player Premium
            </span>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden w-8 h-8 rounded-xl border border-white/10 bg-white/4 flex items-center justify-center text-[#8a80a8] hover:text-white transition active:scale-95"
            title="Đóng menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* 1.5 Google Authentication Profile Section */}
      <div className="border-t border-b border-white/5 py-3 my-1">
        {user ? (
          <div className="flex items-center justify-between gap-3 bg-white/3 border border-white/6 p-2 rounded-2xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user.photoURL || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%23b76cff%22 width=%221%22 height=%221%22/></svg>'}
                alt="Avatar"
                className="w-7 h-7 rounded-full border border-[#b76cff]/40 flex-shrink-0 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white truncate leading-tight">{user.displayName}</p>
                <p className="text-[8px] text-[#8a80a8] tracking-wider uppercase font-semibold leading-normal">Artist</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1 px-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/15 text-[8px] font-bold tracking-wider transition active:scale-95"
              title="Đăng xuất"
            >
              OUT
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-[#7c3cff] to-[#b76cff] text-white flex items-center justify-center gap-2 text-[10px] font-extrabold tracking-wider shadow-lg shadow-purple-500/10 hover:brightness-110 active:scale-95 transition-all duration-150 uppercase"
          >
            <LogIn className="w-3 h-3" />
            <span>Kết nối Google</span>
          </button>
        )}
      </div>

      {/* 2. Search Box: Instantly search tracks dynamically (Spotify Style) */}
      <div className="relative mt-1">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#8a80a8]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm tên bài hát, ca sĩ..."
          className="w-full pl-9 pr-4 py-2.5 bg-white/4 border border-white/8 rounded-2xl text-xs text-[#f0ecff] placeholder-[#8a80a8] outline-none focus:ring-1 focus:ring-[#b76cff]/40 focus:border-[#b76cff]/40 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-3 flex items-center text-xs text-[#8a80a8] hover:text-[#f0ecff]"
          >
            Xóa
          </button>
        )}
      </div>

      {/* 3. Navigation Links */}
      <nav className="flex flex-col gap-1.5 mt-2">
        <button
          onClick={() => handleNavClick('nhac-viet')}
          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-150 ${
            currentView === 'nhac-viet'
              ? 'text-white bg-gradient-to-r from-[#7c3cff]/25 to-[#ff4fd8]/10 border border-[#b76cff]/20 shadow-md'
              : 'text-[#8a80a8] hover:text-white hover:bg-white/4'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm">🇻🇳</span>
            <span>Nhạc Việt</span>
          </div>
          {currentView === 'nhac-viet' && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#b76cff] animate-pulse" />
          )}
        </button>

        <button
          onClick={() => handleNavClick('usuk')}
          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-150 ${
            currentView === 'usuk'
              ? 'text-white bg-gradient-to-r from-[#7c3cff]/25 to-[#ff4fd8]/10 border border-[#b76cff]/20 shadow-md'
              : 'text-[#8a80a8] hover:text-white hover:bg-white/4'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm">🌐</span>
            <span>USUK Songs</span>
          </div>
          {currentView === 'usuk' && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff4fd8] animate-pulse" />
          )}
        </button>

        <button
          onClick={() => handleNavClick('yeu-thich')}
          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-150 ${
            currentView === 'yeu-thich'
              ? 'text-white bg-gradient-to-r from-[#7c3cff]/25 to-[#ff4fd8]/10 border border-[#b76cff]/20 shadow-md'
              : 'text-[#8a80a8] hover:text-white hover:bg-white/4'
          }`}
        >
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            <span>Yêu thích ({favorites.length})</span>
          </div>
          {favorites.length > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-500/20 text-rose-400">
              {favorites.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleNavClick('now-playing')}
          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-150 ${
            currentView === 'now-playing'
              ? 'text-white bg-gradient-to-r from-[#7c3cff]/25 to-[#ff4fd8]/10 border border-[#b76cff]/20 shadow-md'
              : 'text-[#8a80a8] hover:text-white hover:bg-white/4'
          }`}
        >
          <div className="flex items-center gap-3">
            <Music className="w-4 h-4 text-[#b76cff]" />
            <span>Now Playing</span>
          </div>
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-[2px] bg-[#b76cff] animate-pulse h-1 eq-bar" style={{ animationDelay: '0s' }}></span>
              <span className="w-[2px] bg-[#b76cff] animate-pulse h-2 eq-bar" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-[2px] bg-[#b76cff] animate-pulse h-3 eq-bar" style={{ animationDelay: '0.4s' }}></span>
            </div>
          )}
        </button>

        <button
          onClick={() => handleNavClick('library')}
          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-150 ${
            currentView === 'library'
              ? 'text-white bg-gradient-to-r from-[#7c3cff]/25 to-[#ff4fd8]/10 border border-[#b76cff]/20 shadow-md'
              : 'text-[#8a80a8] hover:text-white hover:bg-white/4'
          }`}
        >
          <div className="flex items-center gap-3">
            <Library className="w-4 h-4 text-indigo-400" />
            <span>Thư viện</span>
          </div>
        </button>

        <button
          onClick={() => handleNavClick('playlists')}
          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-150 ${
            currentView === 'playlists' || currentView === 'playlist-detail'
              ? 'text-white bg-gradient-to-r from-[#7c3cff]/25 to-[#ff4fd8]/10 border border-[#b76cff]/20 shadow-md'
              : 'text-[#8a80a8] hover:text-white hover:bg-white/4'
          }`}
        >
          <div className="flex items-center gap-3">
            <ListMusic className="w-4 h-4 text-[#b76cff]" />
            <span>Playlist</span>
          </div>
          {playlists.length > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#b76cff]/20 text-[#b76cff]">
              {playlists.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleNavClick('danh-muc-khac')}
          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-150 ${
            currentView === 'danh-muc-khac'
              ? 'text-white bg-gradient-to-r from-[#7c3cff]/25 to-[#ff4fd8]/10 border border-[#b76cff]/20 shadow-md'
              : 'text-[#8a80a8] hover:text-white hover:bg-white/4'
          }`}
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-[#ff4fd8]" />
            <span>Danh mục khác</span>
          </div>
        </button>

        {/* Playlist section */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <div className="flex items-center gap-2">
              <ListMusic className="w-3.5 h-3.5 text-[#b76cff]" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#8a80a8]">Playlist của tôi</span>
            </div>
            {user && (
              <button
                onClick={() => setIsCreatingPlaylist(v => !v)}
                className="w-5 h-5 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-[#8a80a8] hover:text-[#b76cff] hover:bg-white/10 transition active:scale-90"
                title="Tạo playlist mới"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Create playlist input */}
          {isCreatingPlaylist && user && (
            <div className="flex gap-1.5 mb-2 px-1">
              <input
                autoFocus
                type="text"
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreatePlaylist(); if (e.key === 'Escape') setIsCreatingPlaylist(false); }}
                placeholder="Tên playlist..."
                className="flex-1 px-2.5 py-1.5 bg-white/4 border border-white/8 rounded-xl text-[11px] text-[#f0ecff] placeholder-[#8a80a8] outline-none focus:ring-1 focus:ring-[#b76cff]/40"
              />
              <button onClick={handleCreatePlaylist} className="px-2 py-1.5 bg-[#7c3cff] rounded-xl text-white text-[10px] font-bold hover:brightness-110 active:scale-95 transition">
                OK
              </button>
            </div>
          )}

          {/* Playlist list */}
          {!user ? (
            <p className="text-[10px] text-[#8a80a8]/60 px-2 py-1 italic">Đăng nhập để tạo playlist</p>
          ) : playlists.length === 0 ? (
            <p className="text-[10px] text-[#8a80a8]/60 px-2 py-1 italic">Chưa có playlist nào</p>
          ) : (
            <div className="flex flex-col gap-0.5 max-h-[140px] overflow-y-auto pr-1">
              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => handleOpenPlaylist(pl.id)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-left transition-all duration-150 ${
                    currentView === 'playlist-detail' && selectedPlaylistId === pl.id
                      ? 'bg-[#7c3cff]/20 border border-[#b76cff]/20 text-white'
                      : 'text-[#8a80a8] hover:text-white hover:bg-white/4'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">🎵</span>
                    <span className="text-[11px] font-semibold truncate">{pl.name}</span>
                  </div>
                  <span className="text-[9px] text-[#8a80a8] flex-shrink-0 ml-1">{pl.trackIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* 4. Sound Enhancer & DSP Audio Equalizer: Beautifully replacing the useless add music locally box */}
      <div className="mt-2 flex flex-col justify-end">
        <div className="bg-white/3 border border-white/6 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#b76cff]" />
              <h4 className="text-[10px] font-bold tracking-wider uppercase text-[#f0ecff]">
                Bộ chỉnh âm DSP
              </h4>
            </div>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-[#b76cff] border border-[#b76cff]/20">
              PRO
            </span>
          </div>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 gap-1">
            {(['flat', 'bass', 'vocal', 'acoustic', 'electronic'] as EqPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setPreset(preset)}
                className={`py-1 px-1.5 rounded-lg text-[9px] font-bold border capitalize transition ${
                  eqPreset === preset
                    ? 'bg-[#7c3cff] text-white border-transparent shadow-sm'
                    : 'bg-white/2 border-white/4 text-[#8a80a8] hover:text-[#f0ecff] hover:bg-white/4'
                }`}
              >
                {preset === 'flat' ? 'Mặc định' : preset === 'bass' ? 'Siêu trầm' : preset === 'vocal' ? 'Tăng giọng' : preset}
              </button>
            ))}
          </div>

          {/* Equalizer Frequency sliders */}
          <div className="flex flex-col gap-1.5 mt-1 font-mono text-[9px] text-[#8a80a8]">
            {/* Bass slider */}
            <div className="flex items-center justify-between gap-1">
              <span className="w-8">Bass</span>
              <input
                type="range"
                min="-10"
                max="12"
                step="1"
                value={eqGains.bass}
                onChange={(e) => updateEqGain('bass', Number(e.target.value))}
                className="flex-1 h-1 bg-white/10 rounded accent-[#b76cff]"
              />
              <span className="w-6 text-right text-white font-semibold">
                {eqGains.bass > 0 ? `+${eqGains.bass}` : eqGains.bass}dB
              </span>
            </div>

            {/* Mid slider */}
            <div className="flex items-center justify-between gap-1">
              <span className="w-8">Mids</span>
              <input
                type="range"
                min="-10"
                max="12"
                step="1"
                value={eqGains.mid}
                onChange={(e) => updateEqGain('mid', Number(e.target.value))}
                className="flex-1 h-1 bg-white/10 rounded accent-[#b76cff]"
              />
              <span className="w-6 text-right text-white font-semibold">
                {eqGains.mid > 0 ? `+${eqGains.mid}` : eqGains.mid}dB
              </span>
            </div>

            {/* Treble slider */}
            <div className="flex items-center justify-between gap-1">
              <span className="w-8">Treble</span>
              <input
                type="range"
                min="-10"
                max="12"
                step="1"
                value={eqGains.treble}
                onChange={(e) => updateEqGain('treble', Number(e.target.value))}
                className="flex-1 h-1 bg-white/10 rounded accent-[#b76cff]"
              />
              <span className="w-6 text-right text-white font-semibold">
                {eqGains.treble > 0 ? `+${eqGains.treble}` : eqGains.treble}dB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Minimal Equalizer Visualizer Bars at the absolute bottom of sidebar */}
      <div className="flex items-end justify-between px-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-[10px] text-[#8a80a8] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-[#ff4fd8]" />
          <span>Vibe Radar</span>
        </div>
        <div className="flex items-end gap-1 h-[20px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`w-[3px] bg-gradient-to-t from-[#7c3cff] to-[#ff4fd8] rounded-t-sm transition-transform duration-100 ${
                isPlaying ? 'eq-bar' : 'h-1'
              }`}
              style={{
                animationDuration: `${0.8 + i * 0.15}s`,
                animationDelay: `${i * 0.1}s`,
                height: isPlaying ? 'auto' : '3px'
              }}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};