import React, { useState } from 'react';
import type { BookingFormState } from '../types';
import {
  Sparkles,
  Send,
  Check,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  ArrowLeft,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
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

const SUGGESTED_LOCATIONS = [
  'Udaipur',
  'Goa',
  'Jaipur',
  'Mumbai',
  'Dubai',
  'Lake Como'
];

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  eventDate?: string;
}

export const BookingLoungeOverlay: React.FC<BookingLoungeOverlayProps> = ({ onBackToCorridor }) => {
  const [formData, setFormData] = useState<BookingFormState>({
    name: '',
    phone: '',
    email: '',
    eventType: 'Wedding',
    eventDate: '',
    location: '',
    guestCount: '150 - 350 Guests',
    notes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string>('');

  // Minimum date selectable is today
  const todayString = new Date().toISOString().split('T')[0];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please provide your full name.';
    }

    const cleanPhone = formData.phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      newErrors.phone = 'Please enter a valid phone number with country code.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (formData.eventDate && formData.eventDate < todayString) {
      newErrors.eventDate = 'Event date cannot be in the past.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof BookingFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    // Generate unique inquiry reference ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedId = `KK-${new Date().getFullYear()}-${randomSuffix}`;
    setConfirmedId(generatedId);

    // Save inquiry to localStorage so data is securely preserved
    try {
      const stored = localStorage.getItem('kk_event_inquiries');
      const inquiries = stored ? JSON.parse(stored) : [];
      inquiries.push({
        id: generatedId,
        timestamp: new Date().toISOString(),
        ...formData
      });
      localStorage.setItem('kk_event_inquiries', JSON.stringify(inquiries));
    } catch {
      // LocalStorage fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      // Trigger celebratory champagne-gold confetti
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#B89A6A', '#DFC8A1', '#8C6D3F', '#FFFFFF', '#222222']
        });
      } catch {
        // Confetti fallback
      }
    }, 750);
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello KK Events Concierge, I would like to inquire regarding a ${formData.eventType} celebration.\n\n` +
      `Reference: ${confirmedId || 'Direct Web Inquiry'}\n` +
      `Name: ${formData.name || 'Valued Guest'}\n` +
      `Date: ${formData.eventDate || 'To be decided'}\n` +
      `Location: ${formData.location || 'Flexible'}\n` +
      `Guests: ${formData.guestCount}\n` +
      (formData.notes ? `Vision: ${formData.notes}\n` : '')
    );
    window.open(`https://wa.me/919820045678?text=${text}`, '_blank');
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      eventType: 'Wedding',
      eventDate: '',
      location: '',
      guestCount: '150 - 350 Guests',
      notes: ''
    });
    setErrors({});
    setIsSubmitted(false);
  };

  return (
    <div className="relative z-50 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 select-text pointer-events-auto">
      {/* Return To Corridor Button */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={onBackToCorridor}
          className="group inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-[#FAF8F5]/90 border border-[#B89A6A]/35 text-xs uppercase tracking-[0.2em] font-sans-clean text-[#444444] hover:text-[#161514] hover:border-[#B89A6A] hover:bg-white transition-all shadow-sm cursor-pointer"
          title="Return to the curved 3D exhibition gallery"
        >
          <div className="w-6 h-6 rounded-full bg-[#B89A6A]/15 flex items-center justify-center group-hover:-translate-x-0.5 transition-transform text-[#B89A6A]">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium">← Revisit Exhibition Corridor</span>
        </button>

        <span className="font-display text-[11px] sm:text-xs tracking-[0.25em] text-[#8C6D3F] uppercase font-semibold">
          THE BOOKING LOUNGE · FINAL ROOM
        </span>
      </div>

      {/* Hero Architectural Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-[#B89A6A]/30 bg-[#FAF8F5]/90 text-[#8C6D3F] text-xs font-display tracking-widest uppercase mb-4 shadow-sm">
          <Sparkles className="w-3 h-3 text-[#B89A6A]" />
          <span>Curating Extraordinary Moments</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#222222] font-light tracking-tight leading-[1.12] mb-5">
          LET'S MAKE YOUR NEXT EVENT <span className="italic text-[#8C6D3F] font-normal">UNFORGETTABLE.</span>
        </h1>

        <p className="font-sans-clean text-sm sm:text-base text-[#666666] font-light max-w-xl mx-auto leading-relaxed">
          Whether a multi-day destination wedding, royal gala, or executive summit, our production atelier shapes every detail into an enduring memory.
        </p>
      </div>

      {/* Main Booking Container */}
      <div className="bg-[#FAF8F5]/95 backdrop-blur-2xl border border-[#B89A6A]/35 rounded-2xl p-6 sm:p-10 shadow-2xl transition-all">
        {isSubmitted ? (
          <div className="text-center py-8 sm:py-12 px-4 max-w-lg mx-auto animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#B89A6A]/15 text-[#8C6D3F] flex items-center justify-center mx-auto mb-5 border border-[#B89A6A]/40 shadow-inner">
              <Check className="w-8 h-8 text-[#B89A6A]" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-[#B89A6A]/10 text-[#8C6D3F] text-xs font-mono font-semibold tracking-wider mb-2 border border-[#B89A6A]/25">
              Reference: {confirmedId}
            </div>

            <h3 className="font-serif text-3xl sm:text-4xl text-[#222222] mb-3 font-normal">
              Inquiry Confirmed
            </h3>
            <p className="font-sans-clean text-[#555555] text-sm leading-relaxed mb-6 font-normal">
              Thank you, <strong className="text-[#222222] font-semibold">{formData.name}</strong>. Your private consultation request has been lodged in our atelier registry. Our bespoke events director will review your vision and connect within 24 hours.
            </p>

            {/* Summary Card */}
            <div className="bg-white/70 border border-[#B89A6A]/25 rounded-xl p-4 mb-6 text-left text-xs font-sans-clean space-y-1.5 text-[#555555]">
              <div className="flex justify-between border-b border-black/5 pb-1">
                <span className="text-[#888888]">Event Type:</span>
                <span className="font-semibold text-[#222222]">{formData.eventType}</span>
              </div>
              {formData.eventDate && (
                <div className="flex justify-between border-b border-black/5 pb-1">
                  <span className="text-[#888888]">Preferred Date:</span>
                  <span className="font-semibold text-[#222222]">{formData.eventDate}</span>
                </div>
              )}
              {formData.location && (
                <div className="flex justify-between border-b border-black/5 pb-1">
                  <span className="text-[#888888]">Location:</span>
                  <span className="font-semibold text-[#222222]">{formData.location}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#888888]">Guest Count:</span>
                <span className="font-semibold text-[#222222]">{formData.guestCount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full bg-[#25D366] text-white hover:bg-[#20ba59] transition-all text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Instant WhatsApp Concierge</span>
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full border border-[#B89A6A]/50 text-[#222222] hover:bg-[#B89A6A]/10 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#B89A6A]" />
                <span>New Inquiry</span>
              </button>

              <button
                type="button"
                onClick={onBackToCorridor}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full bg-[#222222] text-[#F3F0E9] hover:bg-[#8C6D3F] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                <span>Back to Gallery</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* 1. Event Category Selector */}
            <div>
              <label className="block font-display text-xs tracking-[0.2em] uppercase text-[#777777] mb-3 font-semibold">
                1. Select Event Type
              </label>
              <div className="flex flex-wrap gap-2.5">
                {EVENT_CATEGORIES.map((cat) => {
                  const isSelected = formData.eventType === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleInputChange('eventType', cat)}
                      className={`group flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-full text-xs font-sans-clean tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E1D1B] text-[#FAF8F5] border border-[#B89A6A] shadow-md scale-[1.02]'
                          : 'bg-white/80 text-[#555555] border border-[#B89A6A]/30 hover:border-[#B89A6A] hover:text-[#1E1D1B] hover:bg-white'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          isSelected ? 'bg-[#B89A6A]' : 'bg-[#B89A6A]/30 group-hover:bg-[#B89A6A]'
                        }`}
                      />
                      <span className="font-medium">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Contact & Event Details */}
            <div>
              <label className="block font-display text-xs tracking-[0.2em] uppercase text-[#777777] mb-3 font-semibold">
                2. Contact & Celebration Specifications
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="booking-name" className="block text-[11px] font-sans-clean uppercase tracking-wider text-[#666666] mb-1.5 font-medium">
                    Your Name <span className="text-[#8C6D3F]">*</span>
                  </label>
                  <input
                    id="booking-name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Maharani Radhika & Kabir"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl border bg-white/85 text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#B89A6A]/40 focus:border-[#8C6D3F] transition-all ${
                      errors.name ? 'border-red-400 bg-red-50/30' : 'border-[#B89A6A]/35 hover:border-[#B89A6A]/60'
                    }`}
                  />
                  {errors.name && (
                    <p className="flex items-center text-xs text-red-600 mt-1.5 font-sans-clean">
                      <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="booking-phone" className="block text-[11px] font-sans-clean uppercase tracking-wider text-[#666666] mb-1.5 font-medium">
                    Phone with Country Code <span className="text-[#8C6D3F]">*</span>
                  </label>
                  <input
                    id="booking-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    placeholder="e.g. +91 98200 45678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl border bg-white/85 text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#B89A6A]/40 focus:border-[#8C6D3F] transition-all ${
                      errors.phone ? 'border-red-400 bg-red-50/30' : 'border-[#B89A6A]/35 hover:border-[#B89A6A]/60'
                    }`}
                  />
                  {errors.phone && (
                    <p className="flex items-center text-xs text-red-600 mt-1.5 font-sans-clean">
                      <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="booking-email" className="block text-[11px] font-sans-clean uppercase tracking-wider text-[#666666] mb-1.5 font-medium">
                    Email Address <span className="text-[#8C6D3F]">*</span>
                  </label>
                  <input
                    id="booking-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    required
                    placeholder="e.g. kabir@luxuryestate.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl border bg-white/85 text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#B89A6A]/40 focus:border-[#8C6D3F] transition-all ${
                      errors.email ? 'border-red-400 bg-red-50/30' : 'border-[#B89A6A]/35 hover:border-[#B89A6A]/60'
                    }`}
                  />
                  {errors.email && (
                    <p className="flex items-center text-xs text-red-600 mt-1.5 font-sans-clean">
                      <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Event Date Picker */}
                <div>
                  <label htmlFor="booking-date" className="block text-[11px] font-sans-clean uppercase tracking-wider text-[#666666] mb-1.5 font-medium">
                    Anticipated Event Date
                  </label>
                  <div className="relative">
                    <input
                      id="booking-date"
                      name="eventDate"
                      type="date"
                      min={todayString}
                      value={formData.eventDate}
                      onChange={(e) => handleInputChange('eventDate', e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border bg-white/85 text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#B89A6A]/40 focus:border-[#8C6D3F] transition-all cursor-pointer ${
                        errors.eventDate ? 'border-red-400 bg-red-50/30' : 'border-[#B89A6A]/35 hover:border-[#B89A6A]/60'
                      }`}
                    />
                  </div>
                  {errors.eventDate && (
                    <p className="flex items-center text-xs text-red-600 mt-1.5 font-sans-clean">
                      <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                      {errors.eventDate}
                    </p>
                  )}
                </div>

                {/* Location with Quick Suggestions */}
                <div>
                  <label htmlFor="booking-location" className="block text-[11px] font-sans-clean uppercase tracking-wider text-[#666666] mb-1.5 font-medium">
                    Event Destination / Venue
                  </label>
                  <input
                    id="booking-location"
                    name="location"
                    type="text"
                    placeholder="e.g. Jagmandir Island Palace, Udaipur"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#B89A6A]/35 bg-white/85 text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#B89A6A]/40 focus:border-[#8C6D3F] hover:border-[#B89A6A]/60 transition-all"
                  />
                  {/* Location Quick Chips */}
                  <div className="flex items-center space-x-1.5 mt-2 flex-wrap gap-y-1">
                    <span className="text-[10px] text-[#888888] font-sans-clean mr-1">Popular:</span>
                    {SUGGESTED_LOCATIONS.map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => handleInputChange('location', loc)}
                        className="px-2 py-0.5 rounded text-[10px] font-sans-clean text-[#666666] bg-black/5 hover:bg-[#B89A6A]/15 hover:text-[#8C6D3F] transition-colors cursor-pointer"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guest Count Range Dropdown */}
                <div>
                  <label htmlFor="booking-guests" className="block text-[11px] font-sans-clean uppercase tracking-wider text-[#666666] mb-1.5 font-medium">
                    Estimated Guest Count
                  </label>
                  <div className="relative">
                    <select
                      id="booking-guests"
                      name="guestCount"
                      value={formData.guestCount}
                      onChange={(e) => handleInputChange('guestCount', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-[#B89A6A]/35 bg-white/85 text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#B89A6A]/40 focus:border-[#8C6D3F] hover:border-[#B89A6A]/60 transition-all cursor-pointer"
                    >
                      <option value="Under 150 Guests">Intimate Gathering (Under 150 Guests)</option>
                      <option value="150 - 350 Guests">Signature Celebration (150 – 350 Guests)</option>
                      <option value="350 - 700 Guests">Grand Affair (350 – 700 Guests)</option>
                      <option value="700+ Guests">Royal Palace Gala (700+ Guests)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Event Vision & Notes */}
            <div>
              <label htmlFor="booking-notes" className="block font-display text-xs tracking-[0.2em] uppercase text-[#777777] mb-2 font-semibold">
                3. Tell Us About Your Event Vision
              </label>
              <textarea
                id="booking-notes"
                name="notes"
                rows={3}
                placeholder="Share your aesthetic preferences, floral palette, architectural scale, bespoke requirements, or preferred dates..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-[#B89A6A]/35 bg-white/85 text-[#222222] text-sm focus:outline-none focus:ring-2 focus:ring-[#B89A6A]/40 focus:border-[#8C6D3F] hover:border-[#B89A6A]/60 transition-all leading-relaxed"
              />
            </div>

            {/* Submit & WhatsApp Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-[#B89A6A]/20">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-8 sm:px-10 py-4 rounded-full font-display text-xs tracking-[0.25em] uppercase font-bold flex items-center justify-center space-x-3 shadow-xl transition-all cursor-pointer ${
                  isSubmitting
                    ? 'bg-[#8C6D3F] text-white opacity-80 cursor-wait'
                    : 'bg-[#222222] text-[#F3F0E9] hover:bg-[#8C6D3F] hover:shadow-2xl hover:scale-[1.01]'
                }`}
              >
                <span>{isSubmitting ? 'Transmitting Inquiry...' : 'SEND EVENT INQUIRY'}</span>
                <Send className={`w-3.5 h-3.5 text-[#B89A6A] ${isSubmitting ? 'animate-pulse' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full border border-[#25D366] text-[#128C7E] bg-white/60 hover:bg-[#25D366]/10 transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-sm"
              >
                <MessageSquare className="w-4 h-4 text-[#25D366]" />
                <span>Instant WhatsApp Concierge</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Atelier Locations & Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mt-10 text-xs text-[#555555] font-sans-clean">
        <div className="p-4 rounded-xl border border-[#B89A6A]/25 bg-[#FAF8F5]/80 backdrop-blur-md flex items-start space-x-3 shadow-sm hover:border-[#B89A6A]/50 transition-all">
          <MapPin className="w-4 h-4 text-[#B89A6A] shrink-0 mt-0.5" />
          <div>
            <strong className="block text-[#222222] uppercase tracking-wider mb-1 font-semibold">
              Mumbai Atelier
            </strong>
            <span className="leading-relaxed">Pali Hill, Bandra West, Mumbai, MH 400050</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#B89A6A]/25 bg-[#FAF8F5]/80 backdrop-blur-md flex items-start space-x-3 shadow-sm hover:border-[#B89A6A]/50 transition-all">
          <Phone className="w-4 h-4 text-[#B89A6A] shrink-0 mt-0.5" />
          <div>
            <strong className="block text-[#222222] uppercase tracking-wider mb-1 font-semibold">
              Concierge Line
            </strong>
            <span className="leading-relaxed">+91 (0) 98200 45678 / +91 22 6789 0000</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#B89A6A]/25 bg-[#FAF8F5]/80 backdrop-blur-md flex items-start space-x-3 shadow-sm hover:border-[#B89A6A]/50 transition-all">
          <Mail className="w-4 h-4 text-[#B89A6A] shrink-0 mt-0.5" />
          <div>
            <strong className="block text-[#222222] uppercase tracking-wider mb-1 font-semibold">
              Private Inquiries
            </strong>
            <span className="leading-relaxed">concierge@kkevents.luxury</span>
          </div>
        </div>
      </div>
    </div>
  );
};
