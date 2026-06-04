import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const SUPABASE_URL = "https://qemkisjyyltbvqdcurpg.supabase.co";
const SUPABASE_KEY = "sb_publishable_6tB7OHqsUoIo0zkrgLU5wg_jFvW3jMr";

async function fetchPrix() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/prix?select=*&order=created_at.desc`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  return res.json();
}

export default function Prix() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  async function load() {
    setFetching(true);
    const data = await fetchPrix();
    if (Array.isArray(data)) setPrices(data);
    setLoading(false);
    setFetching(false);
  }

  useEffect(() => { load(); }, []);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-bold mb-1">
                Prix du Marché
              </motion.h1>
              <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Clock className="h-4 w-4" />
                <span>Mis à jour le {today}</span>
              </div>
            </div>
            <button onClick={load} className="flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors px-4 py-2 rounded-lg text-sm font-medium">
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 border-b py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-destructive" /><span>Hausse</span></div>
            <div className="flex items-center gap-1.5"><TrendingDown className="h-4 w-4 text-primary" /><span>Baisse</span></div>
            <div className="flex items-center gap-1.5"><Minus className="h-4 w-4 text-muted-foreground" /><span>Stable</span></div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : !prices.length ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground text-lg">Aucun prix disponible.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {prices.map((price, i) => (
              <motion.div key={price.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
                <Card className="border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold">{price.produit_nom}</CardTitle>
                      {price.tendance === "up" ? <TrendingUp className="h-5 w-5 text-destructive" /> : price.tendance === "down" ? <TrendingDown className="h-5 w-5 text-primary" /> : <Minus className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-1">
                      <span className="text-2xl font-bold">{Number(price.prix_par_unite).toLocaleString("fr-FR")}</span>
                      <span className="text-sm text-muted-foreground ml-1">FCFA/{price.unite}</span>
                    </div>
                    <Badge className={`mt-2 text-xs ${price.tendance === "up" ? "bg-red-100 text-red-700" : price.tendance === "down" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`} variant="outline">
                      {price.tendance === "up" ? "Hausse ⬆️" : price.tendance === "down" ? "Baisse ⬇️" : "Stable ➡️"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(price.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
