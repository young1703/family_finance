export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string
  ) {
    super(message);
  }
}

export const badRequest = (message: string, code = "BAD_REQUEST") =>
  new ApiError(400, message, code);

export const forbidden = (message = "forbidden", code = "FORBIDDEN") =>
  new ApiError(403, message, code);

export const notFound = (message = "not_found", code = "NOT_FOUND") =>
  new ApiError(404, message, code);
