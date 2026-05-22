import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, TrendingUp, Users, ShoppingCart, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetLatestPrices } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: latestPrices, isLoading } = useGetLatestPrices();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground py-24 lg:py-32">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Connectez Producteurs & Acheteurs
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-primary-foreground/80 mb-10"
          >
            Le premier marché agricole numérique du Mali. Des produits frais, des prix transparents, des transactions directes.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/catalogue">
              <Button size="lg" className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Acheter des produits
              </Button>
            </Link>
            <Link href="/fournisseurs">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10">
                Devenir fournisseur
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Ticker / Daily Prices Quick View */}
      <section className="bg-muted py-4 border-b overflow-hidden whitespace-nowrap flex items-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <span className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex-shrink-0">
              Prix du jour :
            </span>
            <div className="flex gap-8 overflow-x-auto pb-2 scrollbar-hide no-scrollbar items-center">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-32 flex-shrink-0" />
                ))
              ) : (
                latestPrices?.map((price) => (
                  <div key={price.id} className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-medium">{price.productName}</span>
                    <span className="text-primary font-bold">{price.pricePerUnit} FCFA/{price.unit}</span>
                    {price.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    ) : price.trend === 'down' ? (
                      <TrendingUp className="h-4 w-4 text-primary rotate-180" />
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Comment ça marche</h2>
          <p className="text-muted-foreground">Une plateforme simple pour faciliter les échanges agricoles au Mali.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">1. Inscription</h3>
            <p className="text-muted-foreground">Les agriculteurs s'inscrivent et listent leurs produits disponibles.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
              <ShoppingCart className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-2">2. Commande</h3>
            <p className="text-muted-foreground">Les acheteurs parcourent le catalogue et passent commande.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-6">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">3. Livraison</h3>
            <p className="text-muted-foreground">Les produits frais sont livrés directement du champ au marché.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
