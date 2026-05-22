import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliveriesTable } from "@workspace/db";
import {
  ListDeliveriesQueryParams,
  CreateDeliveryBody,
  UpdateDeliveryParams,
  UpdateDeliveryBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDelivery(d: typeof deliveriesTable.$inferSelect) {
  return {
    ...d,
    deliveredAt: d.deliveredAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/deliveries", async (req, res): Promise<void> => {
  const query = ListDeliveriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let allDeliveries = await db.select().from(deliveriesTable).orderBy(deliveriesTable.createdAt);

  if (query.data.status) {
    allDeliveries = allDeliveries.filter((d) => d.status === query.data.status);
  }

  res.json(allDeliveries.map(serializeDelivery));
});

router.post("/deliveries", async (req, res): Promise<void> => {
  const parsed = CreateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [delivery] = await db.insert(deliveriesTable).values({
    orderId: parsed.data.orderId,
    driverName: parsed.data.driverName,
    driverPhone: parsed.data.driverPhone,
    status: "planifiee",
    scheduledDate: parsed.data.scheduledDate,
    notes: parsed.data.notes ?? null,
  }).returning();

  res.status(201).json(serializeDelivery(delivery));
});

router.patch("/deliveries/:id", async (req, res): Promise<void> => {
  const params = UpdateDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.deliveredAt !== undefined) updateData.deliveredAt = new Date(parsed.data.deliveredAt);
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [delivery] = await db.update(deliveriesTable).set(updateData).where(eq(deliveriesTable.id, params.data.id)).returning();

  if (!delivery) {
    res.status(404).json({ error: "Livraison non trouvée" });
    return;
  }

  res.json(serializeDelivery(delivery));
});

export default router;
