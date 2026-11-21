import React, { useState } from 'react';
import type { Project } from '../types';
import { ArrowLeft, ArrowUpRight, MapPin, Calendar, Users, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onPlanEvent: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onPlanEvent
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const images = project.galleryImages.length > 0 ? project.galleryImages : [project.image];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F3F0E9]/95 backdrop-blur-2xl transition-all duration-500 animate-fadeIn flex flex-col justify-between">
      {/* Top Floating Control Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 sm:px-12 py-5 bg-[#F3F0E9]/80 backdrop-blur-md border-b border-[#B89A6A]/20">
        <button
          onClick={onClose}
          className="group flex items-center space-x-3 text-xs sm:text-sm font-sans-clean font-medium tracking-[0.2em] uppercase text-[#222222] hover:text-[#8C6D3F] transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full border border-[#B89A6A]/50 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4 text-[#B89A6A]" />
          </div>
          <span>Return to exhibition</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="font-display text-xs tracking-widest text-[#B89A6A]">
            {project.number} / 08
          </span>
          <span className="text-[#222222]/30">|</span>
          <span className="font-sans-clean text-xs tracking-wider uppercase text-[#555555]">
            {project.category} Showcase
          </span>
        </div>

        <button
          onClick={onPlanEvent}
          className="hidden sm:inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#222222] text-[#F3F0E9] hover:bg-[#8C6D3F] transition-all text-xs tracking-widest uppercase font-semibold cursor-pointer shadow-md"
        >
          <span>Plan Your Event</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#B89A6A]" />
        </button>
      </div>

      {/* Main Exhibition Detail Content */}
      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-10 w-full flex-1">
        {/* Header Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-xs tracking-[0.3em] uppercase text-[#8C6D3F] font-display mb-2">
            <span>KK EVENTS — PROJECT {project.number}</span>
            <span>·</span>
            <span>{project.category} ARCHITECTURE</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#222222] font-light tracking-tight leading-[1.1] mb-3">
            {project.title}
          </h1>
          <p className="font-serif italic text-lg sm:text-2xl text-[#8C6D3F]">
            {project.tagline}
          </p>
        </div>

        {/* Hero Image Showcase with Gallery Thumbnails */}
        <div className="relative mb-12 rounded-xl overflow-hidden shadow-2xl border border-[#B89A6A]/20 bg-[#222222]">
          <div className="relative aspect-[16/10] sm:aspect-[21/10] w-full max-h-[580px] overflow-hidden">
            <img
              src={images[activeImageIndex]}
              alt={project.title}
              className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

            {/* In-photo Badge */}
            <div className="absolute bottom-6 left-6 text-white text-xs tracking-widest font-sans-clean uppercase flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
              <Sparkles className="w-3 h-3 text-[#B89A6A]" />
              {project.location}
            </div>
          </div>

          {/* Gallery Thumbnails Strip */}
          {images.length > 1 && (
            <div className="p-4 bg-[#1E1B18] flex items-center gap-3 overflow-x-auto">
              <span className="text-xs tracking-wider text-[#A69B89] uppercase mr-2 shrink-0">
                Gallery Views:
              </span>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-14 rounded overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#B89A6A] scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Project Meta Information Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="p-4 sm:p-5 rounded-xl border border-[#B89A6A]/25 bg-[#FAF8F5]/60">
            <div className="flex items-center text-[#8C6D3F] mb-1.5">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="text-[11px] tracking-widest uppercase font-display">Location</span>
            </div>
            <p className="font-sans-clean text-sm font-semibold text-[#222222]">{project.location}</p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border border-[#B89A6A]/25 bg-[#FAF8F5]/60">
            <div className="flex items-center text-[#8C6D3F] mb-1.5">
              <Users className="w-4 h-4 mr-2" />
              <span className="text-[11px] tracking-widest uppercase font-display">Attendance</span>
            </div>
            <p className="font-sans-clean text-sm font-semibold text-[#222222]">{project.guestCount}</p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border border-[#B89A6A]/25 bg-[#FAF8F5]/60">
            <div className="flex items-center text-[#8C6D3F] mb-1.5">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-[11px] tracking-widest uppercase font-display">Production Year</span>
            </div>
            <p className="font-sans-clean text-sm font-semibold text-[#222222]">{project.year}</p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border border-[#B89A6A]/25 bg-[#FAF8F5]/60">
            <div className="flex items-center text-[#8C6D3F] mb-1.5">
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="text-[11px] tracking-widest uppercase font-display">Scale</span>
            </div>
            <p className="font-sans-clean text-sm font-semibold text-[#222222]">{project.sizeLabel} Curation</p>
          </div>
        </div>

        {/* Narrative & Curatorial Story */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#222222] mb-3">
                Curatorial Vision & Architectural Concept
              </h2>
              <div className="w-12 h-0.5 bg-[#B89A6A] mb-4" />
              <p className="font-sans-clean text-[#444444] text-base leading-relaxed mb-4">
                {project.description}
              </p>
              <p className="font-sans-clean text-[#555555] text-base leading-relaxed">
                {project.conceptStory}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-[#EBE7DF]/60 border border-[#B89A6A]/30">
            <h3 className="font-display text-xs tracking-[0.25em] uppercase text-[#8C6D3F] font-bold mb-4">
              Production Highlights
            </h3>
            <ul className="space-y-3.5">
              {project.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-[#333333]">
                  <CheckCircle2 className="w-4 h-4 text-[#B89A6A] shrink-0 mt-0.5" />
                  <span className="font-sans-clean leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-[#B89A6A]/20">
              <button
                onClick={onPlanEvent}
                className="w-full py-3.5 px-6 rounded-full bg-[#222222] text-[#F3F0E9] hover:bg-[#8C6D3F] transition-all font-display text-xs tracking-widest uppercase font-bold flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
              >
                <span>Book a Similar Celebration</span>
                <ArrowUpRight className="w-4 h-4 text-[#B89A6A]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-0 z-30 p-4 sm:p-6 bg-[#F3F0E9]/90 backdrop-blur-md border-t border-[#B89A6A]/20 flex items-center justify-between max-w-6xl mx-auto w-full">
        <button
          onClick={onClose}
          className="flex items-center space-x-2 text-xs uppercase tracking-widest font-sans-clean text-[#666666] hover:text-[#222222] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to gallery walk</span>
        </button>

        <button
          onClick={onPlanEvent}
          className="sm:hidden px-4 py-2 bg-[#222222] text-white rounded-full text-xs font-semibold tracking-wider"
        >
          Plan Your Event →
        </button>
      </div>
    </div>
  );
};
