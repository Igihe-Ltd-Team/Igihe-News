export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = false,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Determine if error is retryable based on status code
    if (statusCode) {
      this.isRetryable = [
        408, // Request Timeout
        429, // Too Many Requests
        500, // Internal Server Error
        502, // Bad Gateway
        503, // Service Unavailable
        504, // Gateway Timeout
      ].includes(statusCode);
    }
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  static fromError(error: unknown, fallbackMessage: string = 'Unknown error'): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new ApiError(error.message, undefined, error.name === 'AbortError');
    }
    
    return new ApiError(fallbackMessage);
  }
}