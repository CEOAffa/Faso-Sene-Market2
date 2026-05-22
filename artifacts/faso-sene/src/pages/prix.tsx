import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetLatestPrices } from "@workspace/api-client-react";

const PRODUCT_COLORS: Record<string, string> = {
  "Œufs": "from-amber-50 to-yellow-50 border-amber-200",
  "Riz": "from-stone-50 to-gray-50 border-stone-200",
  "Oignons": "from-purple-50 to-violet-50 border-purple-200",
  "Tomates": "from-red-50 to-rose-50 border-red-200",
  "Mangues": "from-orange-50 to-yellow-50 border-orange-200",
  "Papayes": "from-orange-50 to-amber-50 border-orange-300",
  "Pommes de terre": "from-yellow-50 to-stone-50 border-yellow-200",
  "Poulets": "from-amber-50 to-orange-50 border-amber-300",
};

export default function Prix() {
  const { data: prices, isLoading, refetch, isFetching } = useGetLatestPrices();

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold mb-1"
              >
                Prix du Marché
              </motion.h1>
              <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Clock className="h-4 w-4" />
                <span>Mis à jour le {today}</span>
              </div>
            </div>
            <button
              data-testid="button-refresh"
              onClick={() => refetch()}
              className="flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>
        </div>
      </section>

      {/* Legend */}
      <section className="bg-muted/50 border-b py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-destructive" />
              <span>Hausse des prix</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span>Baisse des prix</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Minus className="h-4 w-4 text-muted-foreground" />
              <span>Prix stable</span>
            </div>
          </div>
        </div>
      </section>

      {/* Price Board */}
      <section className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : !prices || prices.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground text-lg">Aucun prix disponible pour aujourd'hui.</p>
            <p className="text-sm text-muted-foreground mt-2">Les prix seront mis à jour prochainement.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {prices.map((price, i) => {
              const colorClass = PRODUCT_COLORS[price.productName] ?? "from-green-50 to-emerald-50 border-green-200";
              return (
                <motion.div
                  key={price.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  data-testid={`card-price-${price.id}`}
                >
                  <Card className={`bg-gradient-to-br ${colorClass} border`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-foreground">{price.productName}</CardTitle>
                        {price.trend === "up" ? (
                          <TrendingUp className="h-5 w-5 text-destructive" />
                        ) : price.trend === "down" ? (
                          <TrendingDown className="h-5 w-5 text-primary" />
                        ) : (
                          <Minus className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-1">
                        <span className="text-2xl font-bold text-foreground">
                          {price.pricePerUnit.toLocaleString("fr-FR")}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">FCFA/{price.unit}</span>
                      </div>
                      {price.percentChange != null && (
                        <Badge
                          className={`mt-2 text-xs ${
                            price.trend === "up"
                              ? "bg-red-100 text-red-700"
                              : price.trend === "down"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                          variant="outline"
                        >
                          {price.trend === "up" ? "+" : ""}{price.percentChange.toFixed(1)}%
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        Mis à jour: {new Date(price.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Info section */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 pb-6">
            <p className="text-sm text-muted-foreground text-center">
              Les prix affichés sont collectés quotidiennement auprès des marchés de Bamako, Sikasso et Mopti.
              Ils peuvent varier selon les fournisseurs et les quantités commandées.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
