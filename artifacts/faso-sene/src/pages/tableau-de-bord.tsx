import { useState } from "react";
import { motion } from "framer-motion";
import { Package, ShoppingBag, Truck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useListSuppliers,
  useGetSupplierProducts,
  useGetSupplierOrders,
  getGetSupplierProductsQueryKey,
  getGetSupplierOrdersQueryKey,
} from "@workspace/api-client-react";

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  "en_attente": { label: "En attente", class: "bg-yellow-100 text-yellow-800" },
  "confirme": { label: "Confirmé", class: "bg-blue-100 text-blue-800" },
  "en_preparation": { label: "En préparation", class: "bg-orange-100 text-orange-800" },
  "livre": { label: "Livré", class: "bg-green-100 text-green-800" },
  "annule": { label: "Annulé", class: "bg-red-100 text-red-800" },
};

export default function TableauDeBord() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const { data: suppliers, isLoading: suppliersLoading } = useListSuppliers();

  const supplierId = selectedSupplierId ? parseInt(selectedSupplierId) : 0;

  const { data: products, isLoading: productsLoading } = useGetSupplierProducts(
    supplierId,
    { query: { enabled: !!supplierId, queryKey: getGetSupplierProductsQueryKey(supplierId) } }
  );

  const { data: orders, isLoading: ordersLoading } = useGetSupplierOrders(
    supplierId,
    { query: { enabled: !!supplierId, queryKey: getGetSupplierOrdersQueryKey(supplierId) } }
  );

  const totalRevenue = orders?.reduce((sum, o) => sum + o.totalAmount, 0) ?? 0;
  const pendingOrders = orders?.filter((o) => o.status === "en_attente").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-2"
          >
            Tableau de Bord Fournisseur
          </motion.h1>
          <p className="text-primary-foreground/80">Gérez vos produits et suivez vos commandes</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Supplier selector */}
        <div className="mb-8 max-w-sm">
          {suppliersLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
              <SelectTrigger data-testid="select-supplier">
                <SelectValue placeholder="Sélectionner votre compte fournisseur..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {!selectedSupplierId ? (
          <div className="text-center py-24 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-4 opacity-30" />
            <p>Sélectionnez votre compte fournisseur pour accéder au tableau de bord.</p>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Package, label: "Produits", value: products?.length ?? 0, color: "text-blue-600" },
                { icon: ShoppingBag, label: "Commandes", value: orders?.length ?? 0, color: "text-purple-600" },
                { icon: TrendingUp, label: "En attente", value: pendingOrders, color: "text-yellow-600" },
                { icon: Truck, label: "Revenu total", value: `${totalRevenue.toLocaleString("fr-FR")} F`, color: "text-primary" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-xl font-bold">{stat.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Tabs defaultValue="products">
              <TabsList>
                <TabsTrigger value="products" data-testid="tab-products">Mes Produits</TabsTrigger>
                <TabsTrigger value="orders" data-testid="tab-orders">Mes Commandes</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="mt-6">
                {productsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : !products || products.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="mx-auto h-10 w-10 mb-3 opacity-30" />
                    <p>Aucun produit enregistré.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((p) => (
                      <Card key={p.id} data-testid={`card-product-${p.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{p.name}</p>
                              <p className="text-sm text-muted-foreground">{p.category} · {p.unit}</p>
                            </div>
                            <Badge variant={p.isAvailable ? "default" : "secondary"} className="text-xs">
                              {p.isAvailable ? "Disponible" : "Indisponible"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="orders" className="mt-6">
                {ordersLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : !orders || orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingBag className="mx-auto h-10 w-10 mb-3 opacity-30" />
                    <p>Aucune commande pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, class: "bg-gray-100 text-gray-800" };
                      return (
                        <Card key={order.id} data-testid={`row-order-${order.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold">Commande #{order.id}</p>
                                <p className="text-sm text-muted-foreground">{order.customerName} · {order.customerPhone}</p>
                                <p className="text-sm text-muted-foreground mt-1">{order.deliveryAddress}</p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
                                  {statusInfo.label}
                                </span>
                                <p className="text-sm font-bold text-primary mt-1">
                                  {order.totalAmount.toLocaleString("fr-FR")} FCFA
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </section>
    </div>
  );
}
