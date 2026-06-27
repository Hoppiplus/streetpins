// ─── Place Categories (from DropPin) ──────────────────────────────────────

export type CategoryId = 'all' | 'food' | 'drinks' | 'entertainment' | 'shopping' | 'hotels';

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  color: string;
  placeTypes: string[];
  ytTerms: string[];
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', emoji: '\u{1F525}', color: '#f97316', placeTypes: ['restaurant','cafe','bar','shopping_mall','tourist_attraction','lodging'], ytTerms: ['kuliner','street food','review','viral'] },
  { id: 'food', label: 'Food', emoji: '\u{1F35C}', color: '#f97316', placeTypes: ['restaurant','cafe','bakery'], ytTerms: ['kuliner','street food','makan','food review','warung'] },
  { id: 'drinks', label: 'Drinks', emoji: '\u{1F9CB}', color: '#8b5cf6', placeTypes: ['bar','cafe','night_club'], ytTerms: ['kafe','cafe tour','coffee shop','minuman','boba'] },
  { id: 'entertainment', label: 'Fun', emoji: '\u{1F3AD}', color: '#ec4899', placeTypes: ['movie_theater','amusement_park','museum','tourist_attraction','night_club','bowling_alley'], ytTerms: ['hiburan','wisata','tempat seru','hidden gem'] },
  { id: 'shopping', label: 'Shopping', emoji: '\u{1F6CD}\uFE0F', color: '#3b82f6', placeTypes: ['shopping_mall','clothing_store','department_store','supermarket'], ytTerms: ['belanja','mall','thrift','pasar'] },
  { id: 'hotels', label: 'Stay', emoji: '\u{1F3E8}', color: '#14b8a6', placeTypes: ['lodging'], ytTerms: ['hotel review','staycation','penginapan'] },
];

// ─── Street Mood Tags ──────────────────────────────────────────────────────

export type MoodTag =
  | 'night_scene'
  | 'best_in_rain'
  | 'quiet_local'
  | 'energetic'
  | 'old_jakarta'
  | 'golden_hour';

export const MOOD_TAGS: Record<MoodTag, { label: string; emoji: string }> = {
  night_scene:  { label: 'Night scene',      emoji: '\u{1F319}' },
  best_in_rain: { label: 'Best in the rain', emoji: '\u2614\uFE0F' },
  quiet_local:  { label: 'Quiet & local',    emoji: '\u{1F9D8}' },
  energetic:    { label: 'Energetic',        emoji: '\u{1F525}' },
  old_jakarta:  { label: 'Old Jakarta feel', emoji: '\u{1F570}\uFE0F' },
  golden_hour:  { label: 'Golden hour',      emoji: '\u{1F305}' },
};

// Infer mood tags from place types + video title keywords
export function inferMoodTags(types: string[], videoTitles: string[] = []): MoodTag[] {
  const tags = new Set<MoodTag>();
  const allText = [...types, ...videoTitles].join(' ').toLowerCase();
  if (allText.includes('night') || allText.includes('malam') || allText.includes('bar')) tags.add('night_scene');
  if (allText.includes('rain') || allText.includes('hujan')) tags.add('best_in_rain');
  if (allText.includes('quiet') || allText.includes('local') || allText.includes('sepi')) tags.add('quiet_local');
  if (allText.includes('market') || allText.includes('pasar') || allText.includes('busy') || allText.includes('ramai')) tags.add('energetic');
  if (allText.includes('heritage') || allText.includes('colonial') || allText.includes('tua') || allText.includes('kota')) tags.add('old_jakarta');
  if (allText.includes('golden') || allText.includes('sunset') || allText.includes('senja')) tags.add('golden_hour');
  return Array.from(tags).slice(0, 3);
}

// ─── Place (Google Places result) ─────────────────────────────────────────

export interface Place {
  id: string;
  name: string;
  vicinity: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number;
  types: string[];
  photoRef?: string;
  openNow?: boolean;
  lat: number;
  lng: number;
  category: CategoryId;
  moodTags?: MoodTag[];
}

// ─── POV Types (from WanderStreet) ────────────────────────────────────────

export type PovType = 'all' | 'car' | 'motorbike' | 'walking' | 'train' | 'mrt';

export interface PovOption {
  id: PovType;
  label: string;
  emoji: string;
  color: string;
  keywords: string[];
}

export const POV_OPTIONS: PovOption[] = [
  { id: 'all',       label: 'All POV',   emoji: '\u{1F3A5}', color: '#7c6aff', keywords: [] },
  { id: 'walking',   label: 'Walking',   emoji: '\u{1F6B6}', color: '#22c55e', keywords: ['walk','jalan kaki','on foot','pedestrian','pejalan'] },
  { id: 'motorbike', label: 'Motorbike', emoji: '\u{1F3CD}\uFE0F', color: '#f97316', keywords: ['motor','ojek','motorbike','motorcycle','riding'] },
  { id: 'car',       label: 'Car',       emoji: '\u{1F697}', color: '#3b82f6', keywords: ['car','mobil','drive','driving','dashcam'] },
  { id: 'train',     label: 'Train',     emoji: '\u{1F686}', color: '#8b5cf6', keywords: ['train','kereta','krl','commuter','rail'] },
  { id: 'mrt',       label: 'MRT',       emoji: '\u{1F687}', color: '#ec4899', keywords: ['mrt','lrt','metro','subway'] },
];

// ─── Time of Day ───────────────────────────────────────────────────────────

export type TimeOfDay = 'all' | 'dawn' | 'morning' | 'afternoon' | 'golden' | 'night' | 'late_night';

export interface TimeOption {
  id: TimeOfDay;
  label: string;
  emoji: string;
  keywords: string[];
  hours?: [number, number];
}

export const TIME_OPTIONS: TimeOption[] = [
  { id: 'all',        label: 'Any time',    emoji: '\u{1F551}', keywords: [] },
  { id: 'dawn',       label: 'Dawn',        emoji: '\u{1F305}', keywords: ['dawn','subuh','sunrise','pagi buta'], hours: [4,7] },
  { id: 'morning',    label: 'Morning',     emoji: '\u2600\uFE0F', keywords: ['morning','pagi','siang'], hours: [7,12] },
  { id: 'afternoon',  label: 'Afternoon',   emoji: '\u{1F31E}', keywords: ['afternoon','siang','midday'], hours: [12,17] },
  { id: 'golden',     label: 'Golden Hour', emoji: '\u{1F307}', keywords: ['golden hour','sunset','senja','dusk'], hours: [17,19] },
  { id: 'night',      label: 'Night',       emoji: '\u{1F319}', keywords: ['night','malam','evening'], hours: [19,23] },
  { id: 'late_night', label: 'Late Night',  emoji: '\u{1F303}', keywords: ['late night','midnight','dini hari','tengah malam'], hours: [23,4] },
];

// ─── Video Result ──────────────────────────────────────────────────────────

export interface VideoResult {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  viewCount?: string;
  description: string;
  // POV classification
  povType: PovType;
  // Time of day classification
  timeOfDay?: TimeOfDay;
  // Duration
  duration?: string;
  // For Memory Walk — the year this video was published
  publishedYear?: number;
}

// ─── Memory Pin (I Was Here) ──────────────────────────────────────────────

export interface MemoryPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  areaName: string;
  visitedYear: number;
  note: string;
  savedAt: number; // timestamp
}

// ─── Ambient Sound ────────────────────────────────────────────────────────

export type AmbientCategory = 'street' | 'nature' | 'rain' | 'cafe';

export interface AmbientTrack {
  id: string;
  label: string;
  emoji: string;
  src: string;
  category: AmbientCategory;
}

export const AMBIENT_TRACKS: AmbientTrack[] = [
  { id: 'street_busy',   label: 'Busy Street',    emoji: '\u{1F699}', src: '/sounds/street-busy.mp3',   category: 'street' },
  { id: 'street_night',  label: 'Night Street',   emoji: '\u{1F319}', src: '/sounds/street-night.mp3',  category: 'street' },
  { id: 'market',        label: 'Market Chatter', emoji: '\u{1F6D2}', src: '/sounds/market.mp3',        category: 'street' },
  { id: 'traffic',       label: 'Light Traffic',  emoji: '\u{1F6A6}', src: '/sounds/traffic.mp3',       category: 'street' },
  { id: 'birds',         label: 'Birds',          emoji: '\u{1F426}', src: '/sounds/birds.mp3',         category: 'nature' },
  { id: 'river',         label: 'River',          emoji: '\u{1F30A}', src: '/sounds/river.mp3',         category: 'nature' },
  { id: 'crickets',      label: 'Crickets',       emoji: '\u{1F997}', src: '/sounds/crickets.mp3',      category: 'nature' },
  { id: 'rain_light',    label: 'Light Rain',     emoji: '\u{1F326}\uFE0F', src: '/sounds/rain-light.mp3', category: 'rain' },
  { id: 'rain_heavy',    label: 'Heavy Rain',     emoji: '\u26C8\uFE0F', src: '/sounds/rain-heavy.mp3', category: 'rain' },
  { id: 'thunder',       label: 'Thunder',        emoji: '\u26A1', src: '/sounds/thunder.mp3',          category: 'rain' },
  { id: 'cafe_indoor',   label: 'Cafe Buzz',      emoji: '\u2615', src: '/sounds/cafe-indoor.mp3',      category: 'cafe' },
  { id: 'gamelan',       label: 'Gamelan',        emoji: '\u{1F3B5}', src: '/sounds/gamelan.mp3',       category: 'cafe' },
];

// ─── Search State ─────────────────────────────────────────────────────────

export interface SearchState {
  lat: number;
  lng: number;
  label: string;
  areaName: string;
  radiusMeters: number;
}

// ─── Panel Tabs ───────────────────────────────────────────────────────────

export type PanelTab = 'places' | 'streets' | 'trending' | 'memories';

// ─── Backwards-compat aliases ──────────────────────────────────────────────

export type SoundCategory = AmbientCategory;
export const SOUND_TRACKS = AMBIENT_TRACKS;

export const SOUND_CATEGORIES: { id: AmbientCategory; label: string; emoji: string }[] = [
  { id: 'street', label: 'Street',  emoji: '🌆' },
  { id: 'nature', label: 'Nature',  emoji: '🌿' },
  { id: 'rain',   label: 'Rain',    emoji: '🌧️' },
  { id: 'cafe',   label: 'Cafe',    emoji: '☕' },
];
