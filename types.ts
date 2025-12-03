export interface Article {
  id: string;
  title: string;
  date: string;
  content: string; // The full text
}

export interface Word {
  id: string; // The English word itself
  translation: string;
  articleId: string; // Reference to source article
}

// Learning Level: 0 (New), 1 (1x), 2 (2x), 3 (3x), 4 (Graduated)
export type MasteryLevel = 0 | 1 | 2 | 3 | 4;

export interface Progress {
  level: MasteryLevel;
  nextReview: number; // Timestamp
  lastReview: number; // Timestamp
}

export interface AppState {
  articles: Article[];
  words: Word[];
  progress: Record<string, Progress>; // Keyed by Word ID
}

export const STORAGE_KEY = 'vocab_booster_data_v1';
