import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, dailyPricesTable } from "@workspace/db";
import {
  ListPricesQueryParams,
  CreatePriceBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializePrice(p: typeof dailyPricesTable.$inferSelect) {
  return {
    id: p.id,
    productName: p.productName,
    pricePerUnit: parseFloat(p.pricePerUnit),
    unit: p.unit,
    date: p.date,
    trend: p.trend ?? null,
    percentChange: p.percentChange != null ? parseFloat(p.percentChange) : null,
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/prices", async (req, res): Promise<void> => {
  const query = ListPricesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let allPrices = await db.select().from(dailyPricesTable).orderBy(desc(dailyPricesTable.updatedAt));

  if (query.data.productName) {
    allPrices = allPrices.filter((p) => p.productName === query.data.productName);
  }
  if (query.data.date) {
    allPrices = allPrices.filter((p) => p.date === query.data.date);
  }

  res.json(allPrices.map(serializePrice));
});

router.post("/prices", async (req, res): Promise<void> => {
  const parsed = CreatePriceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [price] = await db.insert(dailyPricesTable).values({
    productName: parsed.data.productName,
    pricePerUnit: String(parsed.data.pricePerUnit),
    unit: parsed.data.unit,
    date: parsed.data.date,
    trend: parsed.data.trend ?? null,
    percentChange: parsed.data.percentChange != null ? String(parsed.data.percentChange) : null,
  }).returning();

  res.status(201).json(serializePrice(price));
});

router.get("/prices/latest", async (_req, res): Promise<void> => {
  const allPrices = await db.select().from(dailyPricesTable).orderBy(desc(dailyPricesTable.updatedAt));

  // Get latest price per product
  const latestMap = new Map<string, typeof dailyPricesTable.$inferSelect>();
  for (const price of allPrices) {
    if (!latestMap.has(price.productName)) {
      latestMap.set(price.productName, price);
    }
  }

  res.json(Array.from(latestMap.values()).map(serializePrice));
});

export default router;
