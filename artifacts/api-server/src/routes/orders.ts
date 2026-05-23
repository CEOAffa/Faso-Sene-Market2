import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, productsTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderParams,
  UpdateOrderBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeOrder(o: typeof ordersTable.$inferSelect) {
  return {
    ...o,
    totalAmount: parseFloat(String(o.totalAmount)),
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let allOrders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);

  if (query.data.status) {
    allOrders = allOrders.filter((o) => o.status === query.data.status);
  }

  res.json(allOrders.map(serializeOrder));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Resolve product names and calculate total
  const itemsWithNames = await Promise.all(
    parsed.data.items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      const subtotal = item.quantity * item.unitPrice;
      return {
        productId: item.productId,
        productName: product?.name ?? "Produit inconnu",
        quantity: item.quantity,
        unit: product?.unit ?? "kg",
        unitPrice: item.unitPrice,
        subtotal,
      };
    })
  );

  const totalAmount = itemsWithNames.reduce((sum, item) => sum + item.subtotal, 0);

  const [order] = await db.insert(ordersTable).values({
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone,
    customerEmail: parsed.data.customerEmail ?? null,
    items: itemsWithNames,
    totalAmount: String(totalAmount),
    status: "en_attente",
    deliveryAddress: parsed.data.deliveryAddress,
    deliveryDate: parsed.data.deliveryDate ?? null,
    notes: parsed.data.notes ?? null,
    whatsappOrder: parsed.data.whatsappOrder ?? false,
    paymentMethod: (parsed.data as Record<string, unknown>).paymentMethod as string ?? "livraison",
  }).returning();

  res.status(201).json(serializeOrder(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Commande non trouvée" });
    return;
  }

  res.json(serializeOrder(order));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.deliveryDate !== undefined) updateData.deliveryDate = parsed.data.deliveryDate;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [order] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, params.data.id)).returning();

  if (!order) {
    res.status(404).json({ error: "Commande non trouvée" });
    return;
  }

  res.json(serializeOrder(order));
});

export default router;
