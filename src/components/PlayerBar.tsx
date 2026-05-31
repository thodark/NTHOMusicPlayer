import React, { useState, useEffect } from 'react';
import { useAudioPlayback } from '../context/AudioPlaybackContext';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  FileMusic,
  Tv,
  ListMusic
} from 'lucide-react';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    favorites,
    togglePlayPause,
    playNext,
    playPrev,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    setVolumeAndValue,
    seekPercent,
    currentView,
    setCurrentView
  } = useAudioPlayback();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(0.8);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragProgress, setDragProgress] = useState<number>(0);

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs) || !isFinite(timeInSecs)) return '0:00';
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toast notifier triggers
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleShuffleToggle = () => {
    toggleShuffle();
    triggerToast(!shuffle ? '🔀 Định chế phát ngẫu nhiên BẬT' : '🔁 Trạng thái phát tự nhiên khôi phục');
  };

  const handleRepeatToggle = () => {
    cycleRepeat();
    if (repeat === 'none') {
      triggerToast('🔁 Lặp lại tất cả bài hát');
    } else if (repeat === 'all') {
      triggerToast('🔂 Lặp lại một bài duy nhất');
    } else {
      triggerToast('➡️ Trở lại không phát lại');
    }
  };

  const handleFavoriteToggle = () => {
    toggleFavorite(currentTrack.id);
    const isNowFav = !favorites.includes(currentTrack.id);
    triggerToast(isNowFav ? '❤️ Đã thêm vào Thư mục Yêu thích!' : '💔 Đã xoá khỏi danh sách Yêu thích');
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolumeAndValue(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolumeAndValue(0);
      setIsMuted(true);
    }
  };

  return (
    <footer className="fixed bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4 h-auto min-h-[76px] md:h-[96px] bg-[#0f0d1a]/85 border border-white/8 rounded-2xl md:rounded-[26px] py-2.5 md:py-3.5 px-4 md:px-6 shadow-2xl backdrop-blur-3xl z-50 flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-3 font-plus">
      
      {/* Toast Alert System overlay */}
      {toastMessage && (
        <div className="absolute top-[-56px] left-1/2 transform -translate-x-1/2 px-5 py-2.5 bg-[#1a1630] border border-[#b76cff]/40 text-xs text-[#f0ecff] font-bold rounded-full shadow-[0_4px_24px_rgba(183,108,255,0.25)] animate-bounce z-50 transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* 1. Standard Info Track with Mini Spinning Vinyl disk + Mobile Controls (left-module) */}
      <div className="flex items-center justify-between w-full md:w-1/4 min-w-0 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <div
              onClick={() => setCurrentView('now-playing')}
              className={`w-11 h-11 md:w-[52px] md:h-[52px] rounded-full overflow-hidden border-2 border-[#b76cff]/30 shadow-lg cursor-pointer bg-zinc-950 flex items-center justify-center transition-transform ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
            >
              <img
                src={currentTrack.coverSrc}
                alt="Cover Mini"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect fill=%22%231d1730%22 width=%221%22 height=%221%22/></svg>';
                }}
              />
            </div>
            {/* Audio core spindle dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 md:w-2.5 md:h-2.5 bg-[#06040f] rounded-full border border-[#b76cff]/40 pointer-events-none" />
          </div>

          <div className="min-w-0 flex-1 flex flex-col">
            <h4
              onClick={() => setCurrentView('now-playing')}
              className="text-xs font-bold text-white leading-tight hover:text-[#b76cff] transition cursor-pointer overflow-hidden text-overflow-ellipsis whitespace-nowrap"
            >
              {currentTrack.title}
            </h4>
            <p className="text-[10px] text-[#8a80a8] font-medium leading-normal overflow-hidden text-overflow-ellipsis whitespace-nowrap mt-1">
              {currentTrack.artist}
            </p>
          </div>

          <button
            onClick={handleFavoriteToggle}
            className="text-[#8a80a8] hover:text-rose-500 hover:scale-110 active:scale-95 transition-all flex-shrink-0"
          >
            <Heart
              className={`w-[16px] h-[16px] md:w-[18px] md:h-[18px] ${
                favorites.includes(currentTrack.id) ? 'text-rose-500 fill-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Play Pause Controls in Track Info Row specifically for Mobile Screens */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={playPrev}
            className="text-[#8a80a8] hover:text-white transition p-1 active:scale-90"
            title="Phát bài trước đó"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-8.5 h-8.5 rounded-full bg-gradient-to-r from-[#7c3cff] to-[#b76cff] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
            title={isPlaying ? "Tạm hoãn" : "Bắt đầu phát"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current translate-x-[0.5px]" />
            )}
          </button>

          <button
            onClick={playNext}
            className="text-[#8a80a8] hover:text-white transition p-1 active:scale-90"
            title="Phát bài kế tiếp"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* 2. Timeline Control System (center module) - On desktop shown fully */}
      <div className="hidden md:flex flex-col gap-1.5 w-full md:w-2/5 flex-1">
        
        {/* Buttons Panel */}
        <div className="flex items-center justify-center gap-4">
          
          {/* Shuffle Trigger */}
          <button
            onClick={handleShuffleToggle}
            className={`transition-all duration-150 relative ${
              shuffle
                ? 'text-[#b76cff] drop-shadow-[0_0_8px_rgba(183,108,255,0.6)]'
                : 'text-[#8a80a8] hover:text-white'
            }`}
            title="Ngẫu nhiên (Tự tắt Lặp)"
          >
            <Shuffle className="w-4 h-4" />
            {shuffle && (
              <span className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-[#b76cff]" />
            )}
          </button>

          {/* Previous Track button */}
          <button
            onClick={playPrev}
            className="text-[#8a80a8] hover:text-white transition active:scale-90"
            title="Phát bài trước đó"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Main Play / Pause Circle button */}
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#7c3cff] to-[#b76cff] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 hover:from-[#b76cff] hover:to-[#ff4fd8] transition-all"
            title={isPlaying ? "Tạm hoãn" : "Bắt đầu phát"}
          >
            {isPlaying ? (
              <Pause className="w-[18px] h-[18px] fill-current" />
            ) : (
              <Play className="w-[18px] h-[18px] fill-current translate-x-[1px]" />
            )}
          </button>

          {/* Next Track button */}
          <button
            onClick={playNext}
            className="text-[#8a80a8] hover:text-white transition active:scale-90"
            title="Phát bài kế tiếp"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Repeat Trigger */}
          <button
            onClick={handleRepeatToggle}
            className={`transition-all duration-150 relative ${
              repeat !== 'none'
                ? 'text-[#ff4fd8] drop-shadow-[0_0_8px_rgba(255,79,216,0.6)]'
                : 'text-[#8a80a8] hover:text-white'
            }`}
            title="Chế độ Lặp (Tự tắt Ngẫu nhiên)"
          >
            {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            {repeat !== 'none' && (
              <span className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff4fd8]" />
            )}
          </button>

        </div>

        {/* Progress Slider */}
        <div className="flex items-center gap-3 text-[10px] text-[#8a80a8] font-mono select-none">
          <span className="w-8 text-right tabular-nums">
            {formatTime(isDragging ? (dragProgress / 100) * duration : currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={isDragging ? dragProgress : progress}
            onMouseDown={() => {
              setIsDragging(true);
              setDragProgress(progress);
            }}
            onTouchStart={() => {
              setIsDragging(true);
              setDragProgress(progress);
            }}
            onChange={(e) => setDragProgress(Number(e.target.value))}
            onMouseUp={() => {
              seekPercent(dragProgress);
              setIsDragging(false);
            }}
            onTouchEnd={() => {
              seekPercent(dragProgress);
              setIsDragging(false);
            }}
            className="flex-1 h-1 bg-[#1a1630] rounded-lg appearance-none cursor-pointer accent-[#b76cff] focus:outline-none hover:h-1.5 transition-all duration-100"
          />
          <span className="w-8 text-left tabular-nums">{formatTime(duration)}</span>
        </div>

      </div>

      {/* Mobile progress slider at the bottom of the stack */}
      <div className="w-full md:hidden flex items-center gap-2 text-[9px] text-[#8a80a8] font-mono mt-0.5 border-t border-white/5 pt-1.5 px-1 select-none">
        <span className="tabular-nums">
          {formatTime(isDragging ? (dragProgress / 100) * duration : currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={isDragging ? dragProgress : progress}
          onMouseDown={() => {
            setIsDragging(true);
            setDragProgress(progress);
          }}
          onTouchStart={() => {
            setIsDragging(true);
            setDragProgress(progress);
          }}
          onChange={(e) => setDragProgress(Number(e.target.value))}
          onMouseUp={() => {
            seekPercent(dragProgress);
            setIsDragging(false);
          }}
          onTouchEnd={() => {
            seekPercent(dragProgress);
            setIsDragging(false);
          }}
          className="flex-1 h-0.5 bg-[#1a1630] rounded-lg appearance-none cursor-pointer accent-[#b76cff]"
        />
        <span className="tabular-nums">{formatTime(duration)}</span>
      </div>

      {/* 3. Utility Volume & View mode triggers (right module) */}
      <div className="hidden md:flex items-center justify-end gap-5 w-full md:w-1/4">
        
        {/* Playback Indicators */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-wider text-[#8a80a8] px-2 py-0.5 rounded-full bg-white/4 border border-white/5 uppercase">
            {currentView === 'nhac-viet' ? 'Nhạc Việt' : currentView === 'usuk' ? 'USUK' : currentView === 'yeu-thich' ? 'Yêu Thích' : 'Library'}
          </span>
          {volume === 0 ? (
            <span className="text-[8px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">TẮT ÂM</span>
          ) : (
            <span className="text-[8px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">ONLINE</span>
          )}
        </div>

        {/* Volume system */}
        <div className="flex items-center gap-2 w-[110px]">
          <button
            onClick={handleMuteToggle}
            className="text-[#8a80a8] hover:text-white transition"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = Number(e.target.value);
              setVolumeAndValue(val);
              if (val > 0) setIsMuted(false);
            }}
            className="w-full h-1 bg-[#1a1630] rounded-lg appearance-none cursor-pointer accent-[#b76cff]"
          />
        </div>

      </div>

    </footer>
  );
};
