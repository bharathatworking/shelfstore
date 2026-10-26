import type { Request } from "express"

/** Typed readers for query-string values. */

export function text(req: Request, key: string): string | undefined {
  const value = req.query[key]
  return typeof value === "string" ? value : undefined
}

export function int(req: Request, key: string): number | undefined {
  const value = Number(text(req, key))
  return Number.isFinite(value) && text(req, key) !== "" ? value : undefined
}

export function list(req: Request, key: string): string[] {
  const value = req.query[key]
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string")
  return typeof value === "string" ? [value] : []
}
