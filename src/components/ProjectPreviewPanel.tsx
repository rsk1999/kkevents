import React, { useEffect } from 'react';
import { ArrowUpRight, X, MapPin } from 'lucide-react';
import type { Project } from '../types';

interface ProjectPreviewPanelProps {
  project: Project;
  onViewProject: (project: Project) => void;
  onClose: () => void;
}

export const ProjectPreviewPanel: React.FC<ProjectPreviewPanelProps> = ({
  project,
  onViewProject,
  onClose
}) => {
  // Listen for Escape key to close preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="pointer-events-auto fixed inset-x-4 bottom-20 sm:bottom-24 md:bottom-28 z-50 max-w-2xl mx-auto animate-fadeIn select-auto"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="relative bg-[#161514]/95 backdrop-blur-2xl border border-[#B89A6A]/45 rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-6 text-white transition-all">
        {/* Top Accent Gold Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#B89A6A] to-transparent" />

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
          title="Close preview (Esc)"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start">
          {/* Project Thumbnail Image */}
          <div className="relative w-full sm:w-44 h-36 sm:h-36 rounded-xl overflow-hidden border border-[#B89A6A]/30 flex-shrink-0 bg-[#222222]">
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            {/* Number Badge */}
            <div className="absolute top-2 left-2 bg-[#161514]/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-display tracking-widest text-[#B89A6A] font-bold border border-[#B89A6A]/30">
              {project.number} / 08
            </div>
          </div>

          {/* Project Information */}
          <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
            <div>
              {/* Category & Location Badges */}
              <div className="flex items-center space-x-2 text-[10px] font-sans-clean tracking-wider text-[#B89A6A] uppercase mb-1.5 font-medium flex-wrap gap-y-1">
                <span className="px-2 py-0.5 rounded-full bg-[#B89A6A]/15 border border-[#B89A6A]/30">
                  {project.category}
                </span>
                {project.location && (
                  <span className="flex items-center text-white/50 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3 mr-1 text-[#B89A6A]" />
                    {project.location}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-serif text-lg sm:text-xl font-medium text-white tracking-wide leading-snug line-clamp-1 mb-1">
                {project.title}
              </h3>

              {/* Tagline / Subtitle */}
              <p className="font-sans-clean text-xs text-[#B89A6A]/90 tracking-wide line-clamp-1 mb-2 font-medium">
                {project.tagline}
              </p>

              {/* Short Description */}
              <p className="font-sans-clean text-xs text-[#C8C2B6] leading-relaxed line-clamp-2 mb-4 font-normal">
                {project.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewProject(project);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-full bg-[#B89A6A] hover:bg-[#A38657] text-[#161514] font-bold text-xs uppercase font-sans-clean tracking-[0.16em] transition-all shadow-md cursor-pointer hover:shadow-[#B89A6A]/20 active:scale-95"
              >
                <span>VIEW PROJECT</span>
                <ArrowUpRight className="w-4 h-4 text-[#161514]" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="px-4 py-2.5 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 text-xs uppercase font-sans-clean tracking-wider transition-all cursor-pointer"
              >
                CLOSE
              </button>

              <span className="hidden md:inline text-[10px] text-white/40 font-sans-clean tracking-wider uppercase ml-auto">
                Tap frame again to open
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
