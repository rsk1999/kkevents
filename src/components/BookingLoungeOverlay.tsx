import React, { useState } from 'react';
import type { BookingFormState } from '../types';
import { Sparkles, Send, Check, Phone, Mail, MapPin, MessageSquare, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingLoungeOverlayProps {
  onBackToCorridor: () => void;
}

const EVENT_CATEGORIES = [
  'Wedding',
  'Corporate',
  'Birthday',
  'Engagement',
  'Private Celebration',
  'Other'
];

export const BookingLoungeOverlay: React.FC<BookingLoungeOverlayProps> = ({ onBackToCorridor }) => {
  const [formData, setFormData] = useState<BookingFormState>({
    name: '',
    phone: '',
    email: '',
    eventType: 'Wedding',
    eventDate: '',
    location: '',
    guestCount: '250 - 500 Guests',
    notes: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      // Trigger celebratory gold confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#B89A6A', '#DFC8A1', '#8C6D3F', '#F3F0E9']
        });
      } catch {
        // Confetti fallback
      }
    }, 800);
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello KK Events Concierge, I would like to inquire regarding a ${formData.eventType} event${
        formData.location ? ` in ${formData.location}` : ''
      }. My name is ${formData.name || 'a visitor'}.`
    );
    window.open(`https://wa.me/919820045678?text=${text}`, '_blank');
  };

  return (
    <div className="relative z-40 max-w-5xl mx-auto px-6 py-12">
      {/* Return To Corridor Button */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={onBackToCorridor}
          className="group inline-flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-sans-clean text-[#555555] hover:text-[#222222] transition-colors cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full border border-[#B89A6A]/40 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5 text-[#B89A6A]" />
          </div>
          <span>← Revisit Exhibition Corridor</span>
        </button>

        <span className="font-display text-xs tracking-[0.25em] text-[#8C6D3F] uppercase">
          THE BOOKING LOUNGE · FINAL ROOM
        </span>
      </div>

      {/* Hero Architectural Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-[#B89A6A]/30 bg-[#FAF8F5]/80 text-[#8C6D3F] text-xs font-display tracking-widest uppercase mb-4">
          <Sparkles className="w-3 h-3 text-[#B89A6A]" />
          <span>Curating Extraordinary Moments</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#222222] font-light tracking-tight leading-[1.12] mb-5">
          LET'S MAKE YOUR NEXT EVENT <span className="italic text-[#8C6D3F]">UNFORGETTABLE.</span>
        </h1>

        <p className="font-sans-clean text-base text-[#666666] font-light max-w-xl mx-auto">
          Whether a multi-day destination wedding, royal gala, or executive summit, our production team shapes every detail into an enduring memory.
        </p>
      </div>

      {/* Main Booking Container */}
      <div className="bg-[#FAF8F5]/90 backdrop-blur-xl border border-[#B89A6A]/35 rounded-2xl p-6 sm:p-10 shadow-2xl">
        {isSubmitted ? (
          <div className="text-center py-12 px-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#B89A6A]/15 text-[#8C6D3F] flex items-center justify-center mx-auto mb-5 border border-[#B89A6A]/40">
              <Check className="w-8 h-8 text-[#B89A6A]" />
            </div>

            <h3 className="font-serif text-3xl text-[#222222] mb-3">Inquiry Received</h3>
            <p className="font-sans-clean text-[#555555] text-sm leading-relaxed mb-6">
              Thank you, <strong className="text-[#222222]">{formData.name || 'Valued Guest'}</strong>. Our private event director will review your details and contact you within 24 hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleWhatsAppDirect}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-[#25D366] text-white hover:bg-[#20ba59] transition-all text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </button>

              <button
                onClick={() => setIsSubmitted(false)}
                className="px-6 py-3 rounded-full border border-[#B89A6A]/50 text-[#222222] hover:bg-[#B89A6A]/10 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Category Selector */}
            <div>
              <label className="block font-display text-xs tracking-[0.2em] uppercase text-[#777777] mb-3">
                1. Select Event Type
              </label>
              <div className="flex flex-wrap gap-2.5">
                {EVENT_CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setFormData({ ...formData, eventType: cat })}
                    className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-sans-clean tracking-wider uppercase transition-all cursor-pointer ${
                      formData.eventType === cat
                        ? 'bg-[#222222] text-[#F3F0E9] shadow-md border-transparent scale-105'
                        : 'bg-[#F3F0E9] text-[#555555] border border-[#B89A6A]/25 hover:border-[#B89A6A] hover:text-[#222222]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Grid */}
            <div>
              <label className="block font-display text-xs tracking-[0.2em] uppercase text-[#777777] mb-3">
                2. Contact & Event Details
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Your Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#B89A6A]/30 bg-white/70 text-[#222222] text-sm focus:outline-none focus:border-[#8C6D3F] transition-all"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number (with Country Code) *"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#B89A6A]/30 bg-white/70 text-[#222222] text-sm focus:outline-none focus:border-[#8C6D3F] transition-all"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email Address *"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#B89A6A]/30 bg-white/70 text-[#222222] text-sm focus:outline-none focus:border-[#8C6D3F] transition-all"
                  />
                </div>

                <div>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#B89A6A]/30 bg-white/70 text-[#222222] text-sm focus:outline-none focus:border-[#8C6D3F] transition-all"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Location / Destination (e.g. Udaipur, Mumbai, Dubai)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#B89A6A]/30 bg-white/70 text-[#222222] text-sm focus:outline-none focus:border-[#8C6D3F] transition-all"
                  />
                </div>

                <div>
                  <select
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#B89A6A]/30 bg-white/70 text-[#222222] text-sm focus:outline-none focus:border-[#8C6D3F] transition-all"
                  >
                    <option value="Under 150 Guests">Under 150 Guests (Intimate Gathering)</option>
                    <option value="150 - 350 Guests">150 - 350 Guests</option>
                    <option value="350 - 700 Guests">350 - 700 Guests</option>
                    <option value="700+ Guests">700+ Guests (Grand Celebration)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-display text-xs tracking-[0.2em] uppercase text-[#777777] mb-2">
                3. Tell us about your event vision...
              </label>
              <textarea
                rows={3}
                placeholder="Share your aesthetic preferences, venue dreams, decor style, or special requirements..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#B89A6A]/30 bg-white/70 text-[#222222] text-sm focus:outline-none focus:border-[#8C6D3F] transition-all"
              />
            </div>

            {/* Submit & WhatsApp Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-[#B89A6A]/20">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#222222] text-[#F3F0E9] hover:bg-[#8C6D3F] transition-all font-display text-xs tracking-[0.25em] uppercase font-bold flex items-center justify-center space-x-3 shadow-xl cursor-pointer"
              >
                <span>{isSubmitting ? 'Sending Request...' : 'SEND EVENT INQUIRY'}</span>
                <Send className="w-3.5 h-3.5 text-[#B89A6A]" />
              </button>

              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#25D366]" />
                <span>Instant WhatsApp Concierge</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Atelier Locations & Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-xs text-[#555555] font-sans-clean">
        <div className="p-4 rounded-xl border border-[#B89A6A]/20 bg-[#FAF8F5]/60 flex items-start space-x-3">
          <MapPin className="w-4 h-4 text-[#B89A6A] shrink-0 mt-0.5" />
          <div>
            <strong className="block text-[#222222] uppercase tracking-wider mb-1">
              Mumbai Atelier
            </strong>
            <span>Pali Hill, Bandra West, Mumbai, MH 400050</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#B89A6A]/20 bg-[#FAF8F5]/60 flex items-start space-x-3">
          <Phone className="w-4 h-4 text-[#B89A6A] shrink-0 mt-0.5" />
          <div>
            <strong className="block text-[#222222] uppercase tracking-wider mb-1">
              Concierge Line
            </strong>
            <span>+91 (0) 98200 45678 / +91 22 6789 0000</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#B89A6A]/20 bg-[#FAF8F5]/60 flex items-start space-x-3">
          <Mail className="w-4 h-4 text-[#B89A6A] shrink-0 mt-0.5" />
          <div>
            <strong className="block text-[#222222] uppercase tracking-wider mb-1">
              Private Inquiries
            </strong>
            <span>concierge@kkevents.luxury</span>
          </div>
        </div>
      </div>
    </div>
  );
};
