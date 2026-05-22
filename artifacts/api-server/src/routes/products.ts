import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable, suppliersTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const allProducts = await db.select().from(productsTable);
  const allSuppliers = await db.select().from(suppliersTable);
  const supplierMap = new Map(allSuppliers.map((s) => [s.id, s.name]));

  let filtered = allProducts;
  if (query.data.category) {
    filtered = filtered.filter((p) => p.category === query.data.category);
  }
  if (query.data.supplierId != null) {
    filtered = filtered.filter((p) => p.supplierId === query.data.supplierId);
  }

  const result = filtered.map((p) => ({
    ...p,
    supplierName: supplierMap.get(p.supplierId) ?? null,
    currentPrice: null,
    createdAt: p.createdAt.toISOString(),
  }));

  res.json(result);
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.insert(productsTable).values({
    name: parsed.data.name,
    nameLocal: parsed.data.nameLocal ?? null,
    category: parsed.data.category,
    unit: parsed.data.unit,
    description: parsed.data.description ?? null,
    supplierId: parsed.data.supplierId,
    isAvailable: parsed.data.isAvailable ?? true,
    imageUrl: parsed.data.imageUrl ?? null,
  }).returning();

  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, product.supplierId));

  res.status(201).json({
    ...product,
    supplierName: supplier?.name ?? null,
    currentPrice: null,
    createdAt: product.createdAt.toISOString(),
  });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Produit non trouvé" });
    return;
  }

  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, product.supplierId));

  res.json({
    ...product,
    supplierName: supplier?.name ?? null,
    currentPrice: null,
    createdAt: product.createdAt.toISOString(),
  });
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.nameLocal !== undefined) updateData.nameLocal = parsed.data.nameLocal;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.unit !== undefined) updateData.unit = parsed.data.unit;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.isAvailable !== undefined) updateData.isAvailable = parsed.data.isAvailable;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;

  const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, params.data.id)).returning();

  if (!product) {
    res.status(404).json({ error: "Produit non trouvé" });
    return;
  }

  const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, product.supplierId));

  res.json({
    ...product,
    supplierName: supplier?.name ?? null,
    currentPrice: null,
    createdAt: product.createdAt.toISOString(),
  });
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.delete(productsTable).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Produit non trouvé" });
    return;
  }

  res.sendStatus(204);
});

export default router;
