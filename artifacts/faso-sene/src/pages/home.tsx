import { motion } from "framer-motion";
import { Link } from "wouter";
import { TrendingUp, Users, ShoppingCart, Leaf, ArrowRight, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetLatestPrices, useListProducts } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

const WA_NUMBER = "22374947541";
const WA_MESSAGE = encodeURIComponent("Bonjour, je souhaite commander des produits sur Faso Sènè.");
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

const FEATURED_NAMES = ["Œufs", "Tomates", "Oignons", "Riz", "Mangues", "Pommes de terre"];

const TREND_ICON: Record<string, React.ReactNode> = {
  up: <TrendingUp className="h-3.5 w-3.5 text-red-500" />,
  down: <TrendingUp className="h-3.5 w-3.5 text-primary rotate-180" />,
};

export default function Home() {
  const { data: latestPrices, isLoading: pricesLoading } = useGetLatestPrices();
  const { data: products, isLoading: productsLoading } = useListProducts();

  const priceMap = new Map(latestPrices?.map((p) => [p.productName, p]) ?? []);

  const featuredProducts = products?.filter((p) => FEATURED_NAMES.includes(p.name)) ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground py-24 lg:py-36">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/80 to-primary" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
          >
            <Star className="h-3.5 w-3.5 text-secondary fill-secondary" />
            Le marché #1 des agriculteurs du Mali
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight"
          >
            Connectez Producteurs&nbsp;&amp;&nbsp;Acheteurs
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
            transition={{ delay: 0.18 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/catalogue">
              <Button size="lg" className="w-full sm:w-auto bg-secondary text-white hover:bg-secondary/90 shadow-lg">
                Parcourir le catalogue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-primary-foreground border-white/30 hover:bg-white/10 backdrop-blur-sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Commander sur WhatsApp
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Price ticker ── */}
      <section className="bg-foreground/95 text-background py-3 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-background/50 flex-shrink-0">
              Prix du jour
            </span>
            <div className="flex gap-8 overflow-x-auto pb-1 items-center scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {pricesLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-28 flex-shrink-0 bg-white/10" />
                  ))
                : latestPrices?.map((price) => (
                    <div key={price.id} className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-sm text-background/70">{price.productName}</span>
                      <span className="text-sm font-bold text-secondary">
                        {price.pricePerUnit.toLocaleString("fr-FR")} F
                      </span>
                      <span className="text-xs text-background/40">/{price.unit}</span>
                      {price.trend && price.trend !== "stable" && TREND_ICON[price.trend]}
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured products ── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-secondary uppercase tracking-widest mb-1">Produits vedettes</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Fraîcheur garantie</h2>
            </div>
            <Link href="/catalogue">
              <Button variant="ghost" className="hidden sm:flex items-center gap-1 text-primary">
                Tout voir <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {productsLoading || pricesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-2xl" />
                ))
              : featuredProducts.map((product, i) => {
                  const priceInfo = priceMap.get(product.name);
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Link href="/catalogue">
                        <Card className="group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                          <div className="relative h-36 overflow-hidden bg-muted">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <Leaf className="h-8 w-8 text-primary/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {priceInfo?.trend && priceInfo.trend !== "stable" && (
                              <div className="absolute top-2 right-2">
                                <Badge className={`text-xs px-1.5 py-0.5 ${priceInfo.trend === "up" ? "bg-red-500" : "bg-primary"} text-white border-0`}>
                                  {priceInfo.trend === "up" ? "↑" : "↓"} {Math.abs(priceInfo.percentChange ?? 0).toFixed(0)}%
                                </Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <p className="font-bold text-sm text-foreground truncate">{product.name}</p>
                            {priceInfo ? (
                              <div className="mt-1">
                                <span className="text-base font-extrabold text-primary">
                                  {priceInfo.pricePerUnit.toLocaleString("fr-FR")}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">
                                  F/{priceInfo.unit}
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">Sur demande</p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/catalogue">
              <Button variant="outline" className="gap-2">
                Voir tous les produits <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-secondary uppercase tracking-widest mb-2">Simple &amp; rapide</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comment ça marche</h2>
            <p className="text-muted-foreground">Une plateforme simple pour faciliter les échanges agricoles au Mali.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Users, num: "01", color: "bg-blue-50 text-blue-600", title: "Inscription", desc: "Les agriculteurs s'inscrivent et listent leurs produits disponibles." },
              { icon: ShoppingCart, num: "02", color: "bg-secondary/10 text-secondary", title: "Commande", desc: "Les acheteurs parcourent le catalogue et passent commande facilement." },
              { icon: Leaf, num: "03", color: "bg-primary/10 text-primary", title: "Livraison", desc: "Les produits frais sont livrés directement du champ au marché." },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.12 }}
                className="text-center relative"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 z-10 text-muted-foreground/30">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                )}
                <div className={`mx-auto w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-5 relative`}>
                  <step.icon className="h-8 w-8" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold mb-4"
          >
            Prêt à commander ?
          </motion.h2>
          <p className="text-primary-foreground/70 mb-8 max-w-md mx-auto">
            Contactez-nous sur WhatsApp pour une réponse immédiate ou parcourez notre catalogue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={WA_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-[#25D366] hover:bg-[#1ebe59] text-white shadow-lg w-full sm:w-auto">
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp : +223 74 94 75 41
              </Button>
            </a>
            <Link href="/catalogue">
              <Button size="lg" variant="outline" className="border-white/30 text-primary-foreground hover:bg-white/10 w-full sm:w-auto">
                Voir le catalogue
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
