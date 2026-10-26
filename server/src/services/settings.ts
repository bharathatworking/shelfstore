import { SettingsStore } from "../models"
import type { Settings } from "../types"

export const DEFAULT_SETTINGS: Settings = {
  loanPeriodDays: 14,
  maxBooksPerUser: 3,
  maxRenewals: 2,
  finePerDay: 5,
  fineBlockThreshold: 100,
  holdHours: 48,
  requireManualApproval: false,
}

const KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]

export async function getSettings(): Promise<Settings> {
  const doc = await SettingsStore.findById("default", { _id: 0 }).lean<Settings>()
  return { ...DEFAULT_SETTINGS, ...doc }
}

export async function saveSettings(input: Partial<Settings>): Promise<Settings> {
  const patch: Partial<Record<keyof Settings, unknown>> = {}
  for (const key of KEYS) if (input[key] !== undefined) patch[key] = input[key]
  await SettingsStore.updateOne({ _id: "default" }, { $set: patch }, { upsert: true })
  return getSettings()
}
