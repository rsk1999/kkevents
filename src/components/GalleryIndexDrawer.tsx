import React from 'react';
import { EXHIBITION_PROJECTS } from '../data/projects';
import type { Project } from '../types';
import { X, ArrowRight, Sparkles, MapPin } from 'lucide-react';

interface GalleryIndexDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToProject: (project: Project) => void;
  onJumpToBooking: () => void;
  currentProjectId: string | null;
}

export const GalleryIndexDrawer: React.FC<GalleryIndexDrawerProps> = ({
  isOpen,
  onClose,
  onJumpToProject,
  onJumpToBooking,
  currentProjectId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg bg-[#FAF8F5] h-full shadow-2xl flex flex-col justify-between border-l border-[#B89A6A]/30 animate-slideLeft">
        {/* Header */}
        <div className="p-6 border-b border-[#B89A6A]/20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#B89A6A]" />
            <h2 className="font-display text-xs tracking-[0.25em] uppercase text-[#222222] font-semibold">
              Exhibition Directory
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#B89A6A]/30 flex items-center justify-center hover:bg-[#222222] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of 8 Exhibits */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs uppercase tracking-widest text-[#888888] font-sans-clean mb-2">
            Select an installation to navigate directly:
          </p>

          {EXHIBITION_PROJECTS.map((proj) => {
            const isSelected = currentProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => {
                  onJumpToProject(proj);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-4 ${
                  isSelected
                    ? 'border-[#B89A6A] bg-[#B89A6A]/10 shadow-sm'
                    : 'border-[#B89A6A]/20 bg-white/60 hover:border-[#B89A6A] hover:bg-[#FAF8F5]'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-16 h-12 rounded overflow-hidden shrink-0 border border-[#B89A6A]/20 bg-[#222222]">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[10px] tracking-wider text-[#8C6D3F] font-bold">
                      {proj.number} · {proj.category.toUpperCase()}
                    </span>
                    <span className="text-[10px] uppercase text-[#999999]">{proj.side} wall</span>
                  </div>
                  <h4 className="font-serif text-base text-[#222222] truncate font-medium">
                    {proj.title}
                  </h4>
                  <div className="flex items-center text-[11px] text-[#666666] truncate mt-0.5">
                    <MapPin className="w-3 h-3 text-[#B89A6A] mr-1 shrink-0" />
                    <span className="truncate">{proj.location}</span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-[#B89A6A] opacity-60 hover:opacity-100 shrink-0" />
              </div>
            );
          })}

          {/* Jump to Final Booking Lounge */}
          <div
            onClick={() => {
              onJumpToBooking();
              onClose();
            }}
            className="mt-6 p-4 rounded-xl border-2 border-dashed border-[#B89A6A]/50 bg-[#FAF8F5] hover:bg-[#B89A6A]/15 transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-display uppercase tracking-widest text-[#8C6D3F] font-bold">
                Final Room
              </span>
              <h4 className="font-serif text-lg text-[#222222]">The Booking Lounge & Inquiries</h4>
            </div>
            <ArrowRight className="w-4 h-4 text-[#B89A6A]" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#B89A6A]/20 text-xs text-[#777777] flex items-center justify-between font-sans-clean">
          <span>8 Curated Masterworks</span>
          <button
            onClick={onClose}
            className="text-[#222222] font-semibold uppercase tracking-wider hover:underline"
          >
            Close Index
          </button>
        </div>
      </div>
    </div>
  );
};
