export type Role = "clinician" | "admin";
export type Difficulty = "easy" | "medium" | "hard";
export type Abstractness = "concrete" | "abstract";
export type ImageKind = "color" | "bw" | "illustration";
export type Position = "start" | "middle" | "end";
export type VowelGroup = "a" | "e" | "i" | "o" | "u";
export type UploadStatus = "pending" | "approved" | "rejected";
export type ProfessionalType = "slp" | "student" | "other";
export type VerificationStatus = "none" | "pending" | "verified" | "rejected";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  professional_type: ProfessionalType;
  license_number: string | null;
  verification_status: VerificationStatus;
  verification_note: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_he: string;
  description_he: string;
}

export interface WordImage {
  id: string;
  kind: ImageKind;
  url: string | null; // null => emoji placeholder
  cultural_warning: boolean;
}

export interface Word {
  id: string;
  text: string;
  plain_text: string;
  syllable_count: number;
  letter_count: number;
  vowels: VowelGroup[];
  primary_phoneme: string | null;
  category_id: string | null;
  category: Category | null;
  age_min: number;
  age_max: number;
  difficulty: Difficulty;
  abstractness: Abstractness;
  emoji: string | null;
  cultural_warning: boolean;
  images: WordImage[];
}

export interface SetSummary {
  id: string;
  name: string;
  child_name: string | null;
  color: string;
  updated_at: string;
  word_count: number;
}

export interface SetDetail extends SetSummary {
  words: Word[];
}

export interface UploadInput {
  text: string;
  syllable_count: number;
  primary_phoneme: string | null;
  category_id: string | null;
  vowels: VowelGroup[];
  age_min: number;
  age_max: number;
  difficulty: Difficulty;
  abstractness: Abstractness;
  image_kind: ImageKind;
  cultural_warning: boolean;
}

export interface PendingUpload extends UploadInput {
  id: string;
  submitted_by: string;
  submitter_name?: string;
  image_url: string | null;
  status: UploadStatus;
  rejection_reason: string | null;
  created_at: string;
  category: Category | null;
}

export interface WordInput {
  id?: string;
  text: string;
  syllable_count: number;
  vowels: VowelGroup[];
  category_id: string | null;
  age_min: number;
  age_max: number;
  difficulty: Difficulty;
  abstractness: Abstractness;
  emoji: string | null;
  cultural_warning: boolean;
}

export interface SearchFilters {
  q: string;
  phonemes: string[];
  position: Position | null;
  forbidden: string[];
  syllables: number[]; // 4 => 4+
  letters: number[]; // 7 => 7+
  vowels: VowelGroup[];
  categories: string[]; // category slugs
  age: number | null; // 6 => 6+
  difficulty: Difficulty[];
  abstractness: Abstractness[];
  imageKinds: ImageKind[];
}

export interface SearchResult {
  words: Word[];
  total: number;
}

export interface CategoryInput {
  id?: string;
  name_he: string;
  description_he: string;
}
