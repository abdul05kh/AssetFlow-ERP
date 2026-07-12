export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly errorCode: string = "INTERNAL_ERROR",
    public readonly errors: any[] = []
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors: any[] = []) {
    super(message, 400, "VALIDATION_ERROR", errors);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Unauthorized access", errorCode: string = "AUTH_001") {
    super(message, 401, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, "AUTH_003");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string, errorCode: string) {
    super(message, 409, errorCode);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, errorCode: string) {
    super(message, 422, errorCode);
  }
}
