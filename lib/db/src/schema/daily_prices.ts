import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyPricesTable = pgTable("daily_prices", {
  id: serial("id").primaryKey(),
  productName: text("product_name").notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  date: text("date").notNull(),
  trend: text("trend"),
  percentChange: numeric("percent_change", { precision: 5, scale: 2 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDailyPriceSchema = createInsertSchema(dailyPricesTable).omit({ id: true, updatedAt: true });
export type InsertDailyPrice = z.infer<typeof insertDailyPriceSchema>;
export type DailyPrice = typeof dailyPricesTable.$inferSelect;
