import React, { useState } from 'react';
import { AudioPlaybackProvider } from './context/AudioPlaybackContext';
import { Sidebar } from './components/Sidebar';
import { MainScreen } from './components/MainScreen';
import { PlayerBar } from './components/PlayerBar';
import { SlidersHorizontal, PlayCircle, Menu } from 'lucide-react';

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AudioPlaybackProvider>
      <div className="min-h-screen bg-[#06040f] text-[#f0ecff] font-plus overflow-x-hidden flex flex-col pb-[120px] md:pb-[130px]">
        {/* Background ambient lighting effects */}
        <div className="fixed top-0 inset-x-0 h-96 bg-gradient-to-b from-[#7c3cff]/5 via-transparent to-transparent pointer-events-none z-0" />
        
        {/* Mobile top glass header */}
        <header className="md:hidden sticky top-0 w-full flex items-center justify-between px-4 py-3 bg-[#0f0d1a]/85 border-b border-white/8 z-40 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Pumpkin" className="w-8 h-8 object-contain filter drop-shadow-[0_0_6px_rgba(183,108,255,0.5)]" />
            <div>
              <span className="font-unbounded font-black tracking-widest text-[#f5f1fe] text-sm bg-clip-text text-transparent bg-gradient-to-r from-[#b76cff] to-[#ff4fd8]">
                Pumpkin
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold text-[#b76cff] hover:bg-white/8 transition active:scale-95"
            title="Mở Menu & Bộ chỉnh âm"
          >
            <Menu className="w-4 h-4 text-[#b76cff]" />
            <span>Menu & EQ</span>
          </button>
        </header>

        {/* Layout Shell */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-3 py-3 md:px-4 md:py-6 flex flex-col md:flex-row gap-4 md:gap-6 flex-1 items-start">
          {/* Mobile menu backdrop layer - custom anims from index.css */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar Left Component */}
          <Sidebar isOpenMobile={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} />

          {/* Main Workspace Frame */}
          <main className="w-full flex-1 bg-[#0f0d1a]/55 border border-white/6 p-4 md:p-8 rounded-3xl md:rounded-[32px] shadow-2xl backdrop-blur-2xl min-h-[calc(100vh-140px)] flex flex-col">
            <MainScreen />
          </main>
        </div>

        {/* Global Action Player Controller */}
        <PlayerBar />
      </div>
    </AudioPlaybackProvider>
  );
}
