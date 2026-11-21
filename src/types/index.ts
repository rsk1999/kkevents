export interface Project {
  id: string;
  number: string;
  title: string;
  tagline: string;
  category: 'Wedding' | 'Engagement' | 'Corporate' | 'Birthday' | 'Stage' | 'Decoration' | 'Special' | 'Featured';
  side: 'left' | 'right';
  wallZ: number;
  pathU: number;
  width: number;
  height: number;
  aspectRatio: number;
  sizeLabel: 'Medium' | 'Large' | 'Extra large';
  image: string;
  galleryImages: string[];
  location: string;
  year: string;
  guestCount: string;
  description: string;
  conceptStory: string;
  highlights: string[];
}

export interface BookingFormState {
  name: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  location: string;
  guestCount: string;
  notes: string;
}
