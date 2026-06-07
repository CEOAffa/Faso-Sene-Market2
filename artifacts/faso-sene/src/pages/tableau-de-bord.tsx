import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, ShoppingBag, TrendingUp, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const SUPABASE_URL = "https://qemkisjyyltbvqdcurpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbWtpc2p5eWx0YnZxZGN1cnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTM4NjcsImV4cCI6MjA5NjA4OTg2N30.gC9cXHEZyZNVgqk34Sd297HIG760vX7SiK6mFl_WJ88";
const headers = { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  "en_attente": { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  "confirme": { label: "Confirme", color: "bg-blue-100 text-blue-800" },
  "livre": { label: "Livre", color: "bg-green-100 text-green-800" },
  "annule": { label: "Annule", color: "bg-red-100 text-red-800" },
};

export default function TableauDeBord() {
  const [tab, setTab] = useState<"produits" | "commandes">("produits");
  const [produits, setProduits] = useState<any[]>([]);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/produits?select=*,categories(nom)&order=created_at.desc`, { headers }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/commandes?select=*&order=created_at.desc`, { headers }).then(r => r.json()),
    ]).then(([p, c]) => {
      if (Array.isArray(p)) setProduits(p);
      if (Array.isArray(c)) setCommandes(c);
      setLoading(false);
    });
  }, []);

  const totalRevenu = commandes.reduce((s: number, c: any) => s + (parseFloat(c.total) || 0), 0);
  const enAttente = commandes.filter((c: any) => c.statut === "en_attente").length;

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-bold mb-2">
            Tableau de Bord
          </motion.h1>
          <p className="text-primary-foreground/80">Vue d'ensemble de Faso Sene</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Package, label: "Produits", value: loading ? "..." : produits.length, color: "text-blue-600" },
            { icon: ShoppingBag, label: "Commandes", value: loading ? "..." : commandes.length, color: "text-purple-600" },
            { icon: TrendingUp, label: "En attente", value: loading ? "..." : enAttente, color: "text-yellow-600" },
            { icon: Truck, label: "Revenu total", value: loading ? "..." : totalRevenu.toLocaleString("fr-FR") + " F", color: "text-primary" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
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

        {/* TABS */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("produits")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${tab === "produits" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            Produits ({produits.length})
          </button>
          <button onClick={() => setTab("commandes")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${tab === "commandes" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            Commandes ({commandes.length})
          </button>
        </div>

        {/* PRODUITS */}
        {tab === "produits" && (
          loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : produits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p>Aucun produit enregistre.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {produits.map((p: any) => (
                <Card key={p.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{p.nom}</p>
                        <p className="text-sm text-muted-foreground">{p.categories?.nom || "—"} · {p.unite}</p>
                        <p className="text-sm font-bold text-primary mt-1">{Number(p.prix).toLocaleString("fr-FR")} FCFA</p>
                      </div>
                      <Badge variant={p.disponible ? "default" : "secondary"} className="text-xs">
                        {p.disponible ? "Disponible" : "Indisponible"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {/* COMMANDES */}
        {tab === "commandes" && (
          loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : commandes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p>Aucune commande pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commandes.map((c: any) => {
                const s = STATUS_LABELS[c.statut] || { label: c.statut, color: "bg-gray-100 text-gray-800" };
                return (
                  <Card key={c.id}>
                    <CardContent className="pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{c.client_nom}</p>
                          <p className="text-sm text-muted-foreground">{c.client_telephone}</p>
                          <p className="text-sm text-muted-foreground">{c.adresse_livraison}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                          <p className="text-sm font-bold text-primary mt-1">{Number(c.total).toLocaleString("fr-FR")} FCFA</p>
                          <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        )}
      </section>
    </div>
  );
}
