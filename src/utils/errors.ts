// src/utils/errors.ts
/**
 * Base class for all custom application errors.
 * Carries an HTTP status code that the error‑handling middleware can use.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    // Restore prototype chain (necessary when extending built‑ins)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
