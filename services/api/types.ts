// Types communs pour les réponses Laravel
export interface LaravelResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LaravelError {
  message: string;
  errors?: Record<string, string[]>;
} 