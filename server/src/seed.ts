import "dotenv/config"
import mongoose from "mongoose"
// The frontend mock data is the single source of seed data. Its dates are
// relative to now, so "due in 2 days" and "overdue" stay true whenever you seed.
import { activity } from "../../src/data/activity"
import { books } from "../../src/data/books"
import { copies } from "../../src/data/copies"
import { finePayments } from "../../src/data/finePayments"
import { loans } from "../../src/data/loans"
import { reminders } from "../../src/data/reminders"
import { requests } from "../../src/data/requests"
import { savedBooks } from "../../src/data/savedBooks"
import { settings } from "../../src/data/settings"
import { users } from "../../src/data/users"
import { connect } from "./db"
import {
  Activities,
  allModels,
  Books,
  Copies,
  FinePayments,
  Loans,
  Reminders,
  Requests,
  SavedBooks,
  SettingsStore,
  Users,
} from "./models"
import { DAY } from "./services/lookups"

async function seed() {
  await connect()
  const dbName = mongoose.connection.name
  console.log(`Seeding database "${dbName}"…`)

  for (const model of allModels) {
    await model.collection.drop().catch(() => undefined) // missing collection is fine
    await model.syncIndexes()
  }

  // Counters on books must agree with the copies collection.
  const stocked = books.map((book) => {
    const own = copies.filter((c) => c.bookId === book._id && c.status !== "retired")
    return {
      ...book,
      archived: book.archived ?? false,
      totalCopies: own.length,
      availableCopies: own.filter((c) => c.status === "available").length,
    }
  })

  await Users.insertMany(users)
  await Books.insertMany(stocked)
  await Copies.insertMany(copies)
  await Loans.insertMany(loans)
  await Requests.insertMany(requests)
  await FinePayments.insertMany(finePayments)
  await Reminders.insertMany(reminders)
  await Activities.insertMany(activity)
  await SavedBooks.insertMany(savedBooks)
  await SettingsStore.create({ _id: "default", ...settings })

  const now = Date.now()
  const active = loans.filter((l) => l.status === "active")
  const msLeft = (iso: string) => new Date(iso).getTime() - now
  console.table({
    users: users.length,
    books: books.length,
    copies: copies.length,
    loans: loans.length,
    requests: requests.length,
    finePayments: finePayments.length,
    reminders: reminders.length,
    activity: activity.length,
    savedBooks: savedBooks.length,
  })
  console.log("Seeded state:")
  console.log(`  active loans        ${active.length}`)
  console.log(
    `  due within 2 days   ${active.filter((l) => msLeft(l.dueDate) >= 0 && msLeft(l.dueDate) <= 2 * DAY).length}`,
  )
  console.log(`  overdue             ${active.filter((l) => msLeft(l.dueDate) <= -DAY).length}`)
  console.log(`  approved holds      ${requests.filter((r) => r.status === "approved").length}`)
  console.log(`  pending requests    ${requests.filter((r) => r.status === "pending").length}`)
  console.log(`  returned loans      ${loans.filter((l) => l.status === "returned").length}`)
}

seed()
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error(`Seed failed: ${err instanceof Error ? err.message : err}`)
    await mongoose.disconnect()
    process.exit(1)
  })
