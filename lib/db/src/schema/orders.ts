import { pgTable, text, serial, timestamp, numeric, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  items: json("items").notNull().$type<Array<{
    productId: number;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }>>(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("en_attente"),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryDate: text("delivery_date"),
  notes: text("notes"),
  whatsappOrder: boolean("whatsapp_order").default(false),
  paymentMethod: text("payment_method").default("livraison"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
