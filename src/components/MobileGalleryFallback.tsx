import React from 'react';
import { EXHIBITION_PROJECTS } from '../data/projects';
import type { Project } from '../types';
import { Sparkles, MapPin, ArrowRight, ArrowUpRight, Box } from 'lucide-react';

interface MobileGalleryFallbackProps {
  onSelectProject: (project: Project) => void;
  onGoToBooking: () => void;
  onSwitchTo3D: () => void;
}

export const MobileGalleryFallback: React.FC<MobileGalleryFallbackProps> = ({
  onSelectProject,
  onGoToBooking,
  onSwitchTo3D
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-[#F3F0E9] overflow-y-auto p-5 sm:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-[#B89A6A]/20 max-w-4xl mx-auto">
        <div>
          <span className="font-display text-[10px] tracking-[0.25em] text-[#8C6D3F] uppercase font-bold block">
            KK EVENTS
          </span>
          <h2 className="font-serif text-2xl text-[#222222]">Curated Gallery Stream</h2>
        </div>

        <button
          onClick={onSwitchTo3D}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-full border border-[#B89A6A] bg-[#FAF8F5] text-xs font-sans-clean font-semibold uppercase tracking-wider text-[#222222] shadow-sm cursor-pointer"
        >
          <Box className="w-3.5 h-3.5 text-[#B89A6A]" />
          <span>Enter 3D Corridor</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="max-w-4xl mx-auto py-8 space-y-12">
        {EXHIBITION_PROJECTS.map((proj) => (
          <div
            key={proj.id}
            onClick={() => onSelectProject(proj)}
            className="group bg-[#FAF8F5] rounded-2xl overflow-hidden border border-[#B89A6A]/30 shadow-xl cursor-pointer transition-all hover:border-[#8C6D3F]"
          >
            {/* Image */}
            <div className="relative aspect-[16/10] overflow-hidden bg-[#222222]">
              <img
                src={proj.image}
                alt={proj.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-display tracking-widest uppercase border border-white/20">
                {proj.number} · {proj.category}
              </div>
            </div>

            {/* Info */}
            <div className="p-6">
              <div className="flex items-center text-xs text-[#8C6D3F] font-sans-clean mb-1">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>{proj.location}</span>
                <span className="mx-2">·</span>
                <span>{proj.year}</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl text-[#222222] mb-2 font-normal">
                {proj.title}
              </h3>

              <p className="font-sans-clean text-sm text-[#555555] line-clamp-2 mb-4">
                {proj.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#B89A6A]/20">
                <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-semibold flex items-center">
                  Explore Case Study <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </span>
                <span className="text-xs text-[#888888]">{proj.guestCount}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Lounge Booking Banner */}
        <div className="p-8 rounded-2xl bg-[#222222] text-[#F3F0E9] border border-[#B89A6A] text-center shadow-2xl">
          <Sparkles className="w-6 h-6 text-[#B89A6A] mx-auto mb-3" />
          <h3 className="font-serif text-3xl text-white mb-2">Let's Plan Your Celebration</h3>
          <p className="font-sans-clean text-sm text-white/70 max-w-md mx-auto mb-6">
            Connect with our bespoke event architects for destination weddings, royal galas, and VIP celebrations.
          </p>
          <button
            onClick={onGoToBooking}
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-[#B89A6A] text-[#222222] font-display text-xs tracking-widest uppercase font-bold hover:bg-[#DFC8A1] transition-all cursor-pointer shadow-lg"
          >
            <span>Open Booking Lounge</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
