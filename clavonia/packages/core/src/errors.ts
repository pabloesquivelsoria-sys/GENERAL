/** Application error with a stable, machine-readable code. */
export class AppError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
