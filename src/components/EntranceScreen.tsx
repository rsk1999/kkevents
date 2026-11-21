import React, { useState, useEffect } from 'react';
import { ArrowRight, Volume2, Sparkles, Compass } from 'lucide-react';

interface EntranceScreenProps {
  onEnter: () => void;
  onSkip: () => void;
  onToggleAudio: () => void;
  isAudioOn: boolean;
}

export const EntranceScreen: React.FC<EntranceScreenProps> = ({
  onEnter,
  onSkip,
  onToggleAudio,
  isAudioOn
}) => {
  const [stage, setStage] = useState<'initial' | 'textIn' | 'ready'>('initial');

  useEffect(() => {
    const timer1 = setTimeout(() => setStage('textIn'), 300);
    const timer2 = setTimeout(() => setStage('ready'), 900);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 bg-[#F3F0E9]/92 backdrop-blur-xl transition-all duration-1000">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B89A6A] animate-ping" />
          <span className="font-display text-xs tracking-[0.25em] text-[#222222] uppercase font-semibold">
            KK EVENTS — VIRTUAL EXHIBITION
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleAudio}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[#B89A6A]/30 text-xs tracking-wider font-sans-clean text-[#555555] hover:text-[#222222] hover:border-[#B89A6A] transition-all"
            title="Toggle Ambient Gallery Soundscape"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isAudioOn ? 'text-[#B89A6A]' : 'text-gray-400'}`} />
            <span className="hidden sm:inline">{isAudioOn ? 'Sound On' : 'Ambient Sound'}</span>
          </button>

          <button
            onClick={onSkip}
            className="text-xs tracking-widest uppercase font-sans-clean text-[#777777] hover:text-[#222222] underline underline-offset-4 decoration-[#B89A6A]/40 transition-colors"
          >
            Skip Intro
          </button>
        </div>
      </div>

      {/* Main Hero Exhibition Presentation */}
      <div className="w-full max-w-4xl mx-auto text-center my-auto px-4 py-8">
        {/* Monogram Crest */}
        <div
          className={`transition-all duration-1000 transform ${
            stage === 'initial'
              ? 'opacity-0 scale-90 translate-y-4'
              : 'opacity-100 scale-100 translate-y-0'
          } mb-8 inline-flex items-center justify-center`}
        >
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-[#B89A6A]/40 flex items-center justify-center shadow-lg bg-[#FAF8F5]/80">
            <span className="font-serif text-3xl sm:text-4xl font-light text-[#222222] tracking-wider">
              KK
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#B89A6A] absolute -top-1 right-2" />
          </div>
        </div>

        {/* Subtitle */}
        <p
          className={`font-display text-xs sm:text-sm tracking-[0.35em] text-[#8C6D3F] uppercase mb-4 transition-all duration-1000 delay-200 ${
            stage === 'initial' ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
          }`}
        >
          Architectural Exhibition · Curated Portfolio
        </p>

        {/* Headline */}
        <h1
          className={`font-serif text-4xl sm:text-6xl md:text-7xl font-light text-[#222222] tracking-tight leading-[1.08] mb-6 transition-all duration-1000 delay-300 ${
            stage === 'initial' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          WE CREATE MOMENTS.
          <br />
          <span className="italic font-normal text-[#B89A6A]">YOU REMEMBER FOREVER.</span>
        </h1>

        {/* Lead sentence */}
        <p
          className={`font-sans-clean text-base sm:text-lg text-[#666666] font-light max-w-xl mx-auto mb-10 transition-all duration-1000 delay-500 ${
            stage === 'initial' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          Step into our world of celebrations. Explore our masterworks by walking through a 3D architectural corridor.
        </p>

        {/* CTA Enter Button */}
        <div
          className={`transition-all duration-1000 delay-700 ${
            stage === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <button
            onClick={onEnter}
            className="group relative inline-flex items-center space-x-4 px-9 py-4 bg-[#222222] text-[#F3F0E9] rounded-full hover:bg-[#8C6D3F] transition-all duration-300 shadow-2xl hover:shadow-[#B89A6A]/20 hover:scale-[1.02] cursor-pointer"
          >
            <span className="font-display text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
              ENTER THE EXPERIENCE
            </span>
            <div className="w-8 h-8 rounded-full bg-[#B89A6A] text-[#222222] flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </button>

          <p className="mt-4 text-xs tracking-widest text-[#888888] font-sans-clean uppercase flex items-center justify-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#B89A6A]" />
            Scroll with mouse or touch swipe to move along the gallery
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs tracking-wider text-[#888888] font-sans-clean border-t border-[#B89A6A]/20 pt-4 w-full max-w-7xl mx-auto">
        <div>MUMBAI · NEW DELHI · DUBAI</div>
        <div className="mt-2 sm:mt-0">© KK EVENTS — PRIVATE HAUTE CELEBRATIONS</div>
      </div>
    </div>
  );
};
