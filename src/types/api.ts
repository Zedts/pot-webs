export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export class ApiError extends Error {
  statusCode: number;
  errors?: string[];
  userMessage: string;

  constructor(statusCode: number, message: string, errors?: string[], userMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.userMessage = userMessage || message;
  }
}
