import React from 'react';
import { Menu, Volume2, VolumeX, ArrowUpRight, ChevronLeft, ChevronRight, Compass, Play, Pause } from 'lucide-react';
import type { Project } from '../types';

interface GalleryHUDProps {
  currentZ: number;
  nearestProject: Project | null;
  onOpenMenu: () => void;
  onToggleAudio: () => void;
  isAudioOn: boolean;
  onJumpToBooking: () => void;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
  hoveredProject: Project | null;
  isInLounge: boolean;
  isAutoTouring: boolean;
  onToggleAutoTour: () => void;
}

export const GalleryHUD: React.FC<GalleryHUDProps> = ({
  currentZ,
  nearestProject,
  onOpenMenu,
  onToggleAudio,
  isAudioOn,
  onJumpToBooking,
  onNavigateNext,
  onNavigatePrev,
  hoveredProject,
  isInLounge,
  isAutoTouring,
  onToggleAutoTour
}) => {
  // Calculate progress percentage (Entrance Z = 8.0 -> Lounge Z = -66.0)
  const startZ = 8.0;
  const endZ = -66.0;
  const totalDist = startZ - endZ;
  const currentDist = Math.max(0, Math.min(totalDist, startZ - currentZ));
  const progressPercent = Math.min(100, Math.max(0, (currentDist / totalDist) * 100));

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* TOP NAVIGATION BAR */}
      <div className="pointer-events-auto flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 bg-[#FAF8F5]/85 backdrop-blur-md px-4 py-2.5 rounded-full border border-[#B89A6A]/30 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#B89A6A]" />
          <span className="font-display text-xs tracking-[0.25em] text-[#222222] font-bold">
            KK EVENTS
          </span>
          <span className="text-[#222222]/20 hidden sm:inline">|</span>
          <span className="text-[11px] font-sans-clean tracking-wider text-[#666666] uppercase hidden sm:inline">
            3D Exhibition
          </span>
        </div>

        {/* Current Location Badge (Center on md+) */}
        <div className="hidden md:flex items-center space-x-2 bg-[#FAF8F5]/85 backdrop-blur-md px-5 py-2.5 rounded-full border border-[#B89A6A]/30 shadow-sm">
          {isInLounge ? (
            <span className="font-display text-xs tracking-[0.2em] text-[#8C6D3F] font-semibold uppercase">
              ✦ The Booking Lounge
            </span>
          ) : nearestProject ? (
            <div className="flex items-center space-x-2">
              <span className="font-display text-xs tracking-wider text-[#B89A6A] font-bold">
                {nearestProject.number} / 08
              </span>
              <span className="text-[#222222]/30">·</span>
              <span className="font-serif text-sm text-[#222222] font-medium truncate max-w-[240px]">
                {nearestProject.title}
              </span>
            </div>
          ) : (
            <span className="font-display text-xs tracking-widest text-[#777777] uppercase">
              Entrance Corridor
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Cinematic Auto-Tour button */}
          <button
            onClick={onToggleAutoTour}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-full border transition-all shadow-sm cursor-pointer text-xs font-sans-clean tracking-wider uppercase ${
              isAutoTouring
                ? 'bg-[#B89A6A] text-[#222222] border-[#B89A6A] font-semibold'
                : 'bg-[#FAF8F5]/85 backdrop-blur-md text-[#555555] border-[#B89A6A]/30 hover:border-[#B89A6A]'
            }`}
            title="Sit back and enjoy the automated cinematic gallery tour"
          >
            {isAutoTouring ? (
              <>
                <Pause className="w-3.5 h-3.5 text-[#222222]" />
                <span className="hidden sm:inline">Pause Tour</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#B89A6A]" />
                <span className="hidden sm:inline">Auto Walk</span>
              </>
            )}
          </button>

          {/* Audio toggle */}
          <button
            onClick={onToggleAudio}
            className="w-10 h-10 rounded-full bg-[#FAF8F5]/85 backdrop-blur-md border border-[#B89A6A]/30 flex items-center justify-center text-[#444444] hover:text-[#222222] hover:border-[#B89A6A] transition-all shadow-sm cursor-pointer"
            title="Toggle Ambient Gallery Sound"
          >
            {isAudioOn ? (
              <Volume2 className="w-4 h-4 text-[#B89A6A]" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Menu button */}
          <button
            onClick={onOpenMenu}
            className="flex items-center space-x-2 px-3.5 sm:px-4 py-2.5 rounded-full bg-[#FAF8F5]/85 backdrop-blur-md border border-[#B89A6A]/30 text-xs font-display tracking-[0.2em] uppercase text-[#222222] hover:border-[#B89A6A] transition-all shadow-sm cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5 text-[#B89A6A]" />
            <span className="hidden sm:inline">Directory</span>
          </button>

          {/* Book Your Event CTA */}
          <button
            onClick={onJumpToBooking}
            className="flex items-center space-x-1.5 sm:space-x-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#222222] text-[#F3F0E9] hover:bg-[#8C6D3F] transition-all text-xs font-display tracking-[0.18em] uppercase font-bold shadow-md cursor-pointer"
          >
            <span>Book Lounge</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#B89A6A]" />
          </button>
        </div>
      </div>

      {/* CENTER HOVER PROMPT (Appears when user points mouse at any frame) */}
      {hoveredProject && (
        <div className="pointer-events-auto self-center my-auto transition-all transform animate-fadeIn">
          <div className="bg-[#222222]/90 text-white backdrop-blur-lg px-6 py-3 rounded-full border border-[#B89A6A] shadow-2xl flex items-center space-x-3 cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-[#B89A6A] animate-ping" />
            <span className="font-display text-xs tracking-[0.25em] text-[#B89A6A] uppercase font-bold">
              {hoveredProject.number} · {hoveredProject.category}
            </span>
            <span className="text-white/40">|</span>
            <span className="font-serif text-sm tracking-wide">
              Click to inspect {hoveredProject.title} →
            </span>
          </div>
        </div>
      )}

      {/* BOTTOM CONTROL & PROGRESS BAR */}
      <div className="pointer-events-auto flex flex-col sm:flex-row items-center justify-between w-full max-w-7xl mx-auto gap-4 mt-auto">
        {/* Progress Tracker (01 - 08) */}
        <div className="flex items-center space-x-4 bg-[#FAF8F5]/90 backdrop-blur-md px-4 sm:px-5 py-2.5 rounded-full border border-[#B89A6A]/30 shadow-sm w-full sm:w-auto">
          <span className="font-display text-[11px] tracking-widest text-[#8C6D3F] font-bold">
            01 — 08
          </span>

          <div className="w-28 sm:w-44 h-1.5 bg-[#E2DCCE] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#B89A6A] to-[#8C6D3F] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="font-sans-clean text-xs font-medium text-[#555555]">
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Scroll & Drag Helper */}
        <div className="hidden lg:flex items-center space-x-2 text-xs font-sans-clean text-[#666666] bg-[#FAF8F5]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#B89A6A]/20">
          <Compass className="w-3.5 h-3.5 text-[#B89A6A] animate-spin" style={{ animationDuration: '8s' }} />
          <span className="uppercase tracking-widest text-[11px]">
            Scroll mouse or drag to glide corridor · Click artwork to open
          </span>
        </div>

        {/* Quick Stepper (Previous / Next Artwork) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigatePrev}
            className="flex items-center space-x-1 px-3 py-2 rounded-full bg-[#FAF8F5]/90 backdrop-blur-md border border-[#B89A6A]/30 text-xs font-sans-clean text-[#333333] hover:border-[#B89A6A] transition-all cursor-pointer shadow-sm"
            title="Glide backward"
          >
            <ChevronLeft className="w-4 h-4 text-[#B89A6A]" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <button
            onClick={onNavigateNext}
            className="flex items-center space-x-1 px-3 py-2 rounded-full bg-[#FAF8F5]/90 backdrop-blur-md border border-[#B89A6A]/30 text-xs font-sans-clean text-[#333333] hover:border-[#B89A6A] transition-all cursor-pointer shadow-sm"
            title="Glide forward"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 text-[#B89A6A]" />
          </button>
        </div>
      </div>
    </div>
  );
};
