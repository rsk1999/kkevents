import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface InteractionHintProps {
  onDismiss?: () => void;
}

export const InteractionHint: React.FC<InteractionHintProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Automatically minimize to a small subtle badge after 9 seconds
    const timer = setTimeout(() => {
      setIsMinimized(true);
    }, 9000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="pointer-events-auto bg-[#181716]/90 hover:bg-[#181716] text-[#FAF8F5] border border-[#B89A6A]/40 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center space-x-2 text-[11px] font-sans-clean tracking-wider uppercase shadow-xl hover:border-[#B89A6A] transition-all cursor-pointer"
        title="View Navigation Controls"
      >
        <span className="text-[#B89A6A] font-bold text-xs tracking-widest">↑↓ ⇆</span>
        <span className="text-[#C8C2B6]">Controls</span>
      </button>
    );
  }

  return (
    <div className="pointer-events-auto relative bg-[#181716]/95 border border-[#B89A6A]/35 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-2xl text-center text-white max-w-xs sm:max-w-sm mx-auto animate-fadeIn transition-all select-none">
      {/* Dismiss / Close button */}
      <button
        onClick={() => {
          setIsVisible(false);
          onDismiss?.();
        }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        title="Close guide"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Two Main Visual Badges matching the user screenshot */}
      <div className="flex items-center justify-center space-x-8 pt-1 pb-1">
        {/* Walk Control */}
        <div className="flex flex-col items-center">
          <div className="text-[#B89A6A] text-2xl font-light mb-0.5 leading-none select-none">
            ↑↓
          </div>
          <span className="font-sans-clean text-sm font-medium tracking-wide text-white">
            Walk
          </span>
        </div>

        {/* Look Around Control */}
        <div className="flex flex-col items-center">
          <div className="text-[#B89A6A] text-2xl font-light mb-0.5 leading-none select-none">
            ⇆
          </div>
          <span className="font-sans-clean text-sm font-medium tracking-wide text-white">
            Look around
          </span>
        </div>
      </div>

      {/* Primary Instruction Sentence */}
      <p className="font-sans-clean text-xs text-[#C8C2B6] tracking-wide mt-2 pt-2 border-t border-white/10 leading-relaxed font-normal">
        Swipe up/down to walk · Swipe left/right to look
      </p>

      {/* Secondary Desktop Mouse Instruction */}
      <p className="text-[10px] text-[#8C8578] uppercase tracking-wider font-sans-clean mt-1 hidden sm:block">
        Scroll / Drag to walk · Move mouse to look around
      </p>
    </div>
  );
};
