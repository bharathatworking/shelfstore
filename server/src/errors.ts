import type { ErrorRequestHandler } from "express"

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export function fail(message: string, status = 400): never {
  throw new HttpError(status, message)
}

/** Every error reaches the client as { error: message }, which api.ts rethrows as an Error. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  if (err?.code === 11000) {
    res.status(409).json({ error: "This record already exists." })
    return
  }
  console.error(err)
  res.status(500).json({ error: "Something went wrong. Please try again." })
}
