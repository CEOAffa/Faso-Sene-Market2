import { Router, type IRouter } from "express";
import { db, suppliersTable, productsTable, ordersTable, deliveriesTable } from "@workspace/db";
import { count, sql, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [supplierCount] = await db.select({ count: count() }).from(suppliersTable);
  const [productCount] = await db.select({ count: count() }).from(productsTable);
  const [orderCount] = await db.select({ count: count() }).from(ordersTable);

  const allOrders = await db.select().from(ordersTable);
  const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(String(o.totalAmount)), 0);
  const pendingOrders = allOrders.filter((o) => o.status === "en_attente").length;

  const today = new Date().toISOString().split("T")[0];
  const todayOrders = allOrders.filter((o) => o.createdAt.toISOString().startsWith(today)).length;

  const allDeliveries = await db.select().from(deliveriesTable);
  const activeDeliveries = allDeliveries.filter((d) => d.status === "en_cours").length;

  // Count order mentions per product
  const productOrderCount = new Map<string, number>();
  for (const order of allOrders) {
    const items = order.items as Array<{ productName: string }>;
    for (const item of items) {
      productOrderCount.set(item.productName, (productOrderCount.get(item.productName) ?? 0) + 1);
    }
  }
  const topProducts = Array.from(productOrderCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, orderCount]) => ({ name, orderCount }));

  res.json({
    totalSuppliers: supplierCount.count,
    totalProducts: productCount.count,
    totalOrders: orderCount.count,
    totalRevenue,
    pendingOrders,
    activeDeliveries,
    todayOrders,
    topProducts,
  });
});

export default router;
