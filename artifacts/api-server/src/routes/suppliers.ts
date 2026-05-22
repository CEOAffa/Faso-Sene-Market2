import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, suppliersTable, productsTable, ordersTable } from "@workspace/db";
import {
  CreateSupplierBody,
  GetSupplierParams,
  UpdateSupplierParams,
  UpdateSupplierBody,
  GetSupplierProductsParams,
  GetSupplierOrdersParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeSupplier(s: typeof suppliersTable.$inferSelect) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/suppliers", async (_req, res): Promise<void> => {
  const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.createdAt);
  res.json(suppliers.map(serializeSupplier));
});

router.post("/suppliers", async (req, res): Promise<void> => {
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [supplier] = await db.insert(suppliersTable).values({
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email ?? null,
    region: parsed.data.region,
    village: parsed.data.village ?? null,
    type: parsed.data.type,
    description: parsed.data.description ?? null,
    status: "active",
  }).returning();

  res.status(201).json(serializeSupplier(supplier));
});

router.get("/suppliers/:id", async (req, res): Promise<void> => {
  const params = GetSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, params.data.id));
  if (!supplier) {
    res.status(404).json({ error: "Fournisseur non trouvé" });
    return;
  }

  res.json(serializeSupplier(supplier));
});

router.patch("/suppliers/:id", async (req, res): Promise<void> => {
  const params = UpdateSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
  if (parsed.data.region !== undefined) updateData.region = parsed.data.region;
  if (parsed.data.village !== undefined) updateData.village = parsed.data.village;
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  const [supplier] = await db.update(suppliersTable).set(updateData).where(eq(suppliersTable.id, params.data.id)).returning();

  if (!supplier) {
    res.status(404).json({ error: "Fournisseur non trouvé" });
    return;
  }

  res.json(serializeSupplier(supplier));
});

router.get("/suppliers/:id/products", async (req, res): Promise<void> => {
  const params = GetSupplierProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, params.data.id));
  if (!supplier) {
    res.status(404).json({ error: "Fournisseur non trouvé" });
    return;
  }

  const products = await db.select().from(productsTable).where(eq(productsTable.supplierId, params.data.id));
  res.json(products.map((p) => ({
    ...p,
    supplierName: supplier.name,
    currentPrice: null,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.get("/suppliers/:id/orders", async (req, res): Promise<void> => {
  const params = GetSupplierOrdersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Get all products for this supplier
  const supplierProducts = await db.select().from(productsTable).where(eq(productsTable.supplierId, params.data.id));
  const productIds = new Set(supplierProducts.map((p) => p.id));

  // Get orders that have items from this supplier's products
  const allOrders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
  const supplierOrders = allOrders.filter((o) => {
    const items = o.items as Array<{ productId: number }>;
    return items.some((item) => productIds.has(item.productId));
  });

  res.json(supplierOrders.map((o) => ({
    ...o,
    totalAmount: parseFloat(String(o.totalAmount)),
    createdAt: o.createdAt.toISOString(),
  })));
});

export default router;
