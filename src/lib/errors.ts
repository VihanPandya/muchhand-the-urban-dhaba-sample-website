/**
 * Errors whose message is safe (and intended) to show the user. Anything else
 * that reaches handleError() is logged and reported as a generic failure.
 */
export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}
