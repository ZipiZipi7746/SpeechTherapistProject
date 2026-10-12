import type {
  Category, CategoryInput, ProfessionalType, VerificationStatus, PendingUpload, Profile, Role, SearchFilters, SearchResult, SetDetail, SetSummary,
  UploadInput, Word, WordInput,
} from "../types";

export class AppError extends Error {
  constructor(message: string, public code = "app_error") {
    super(message);
  }
}

export interface Repo {
  mode: "demo" | "supabase";

  // auth
  getProfile(): Promise<Profile | null>;
  onAuthChange(cb: (p: Profile | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string, pro?: { type: ProfessionalType; license: string }): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  updateDisplayName(name: string): Promise<void>;
  submitLicense(type: ProfessionalType, license: string): Promise<void>;

  // library
  listCategories(): Promise<Category[]>;
  searchWords(f: SearchFilters, page: number, pageSize: number): Promise<SearchResult>;
  countWords(f: SearchFilters): Promise<number>;
  getWord(id: string): Promise<Word | null>;
  guestSearch(q: string): Promise<SearchResult & { libraryTotal: number }>;

  // sets
  listSets(): Promise<SetSummary[]>;
  getSet(id: string): Promise<SetDetail | null>;
  createSet(input: { name: string; childName: string | null; color?: string; wordIds: string[] }): Promise<string>;
  addWordsToSet(setId: string, wordIds: string[]): Promise<number>;
  removeWordFromSet(setId: string, wordId: string): Promise<void>;
  updateSet(id: string, patch: { name?: string; childName?: string | null; color?: string }): Promise<void>;
  deleteSet(id: string): Promise<void>;

  // community uploads
  submitUpload(input: UploadInput, image: Blob | null): Promise<void>;
  listMyUploads(): Promise<PendingUpload[]>;
  resubmitUpload(id: string, input: UploadInput, image: Blob | null): Promise<void>;
  deleteUpload(id: string): Promise<void>;

  // admin
  listPendingUploads(): Promise<PendingUpload[]>;
  pendingCount(): Promise<number>;
  approveUpload(id: string): Promise<void>;
  rejectUpload(id: string, reason: string): Promise<void>;
  adminListWords(q: string, page: number, pageSize: number): Promise<SearchResult>;
  adminSaveWord(input: WordInput): Promise<void>;
  adminDeleteWord(id: string): Promise<void>;
  adminReviewLicense(userId: string, status: VerificationStatus, note?: string): Promise<void>;
  adminSaveCategory(input: CategoryInput): Promise<void>;
  adminDeleteCategory(id: string): Promise<void>;
  sendTestEmail(): Promise<{ sent: boolean; reason?: string }>;
  adminListUsers(): Promise<Profile[]>;
  adminSetRole(userId: string, role: Role): Promise<void>;
}
