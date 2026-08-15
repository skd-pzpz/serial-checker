import { pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["active", "inactive"]);

export const serialNumbers = pgTable("serial_numbers", {
  id: serial("id").primaryKey(),
  serialNumber: varchar("serial_number", { length: 100 }).notNull().unique(),
  holderName: varchar("holder_name", { length: 100 }).notNull(),
  status: statusEnum("status").default("active").notNull(),
  activatedAt: timestamp("activated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SerialNumber = typeof serialNumbers.$inferSelect;
export type NewSerialNumber = typeof serialNumbers.$inferInsert;
export type SerialStatus = "active" | "inactive";
