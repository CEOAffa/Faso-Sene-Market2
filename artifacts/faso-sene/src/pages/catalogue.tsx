import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, MessageCircle, Search, Filter, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListProducts, useGetLatestPrices } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "22300000000";

const CATEGORIES = ["Tous", "Légumes", "Fruits", "Céréales", "Protéines", "Tubercules"];

function buildWhatsAppMessage(productName: string, unit: string, price: number) {
  return encodeURIComponent(
    `Bonjour, je souhaite commander:\n- Produit: ${productName}\n- Prix: ${price} FCFA/${unit}\n\nMerci de me contacter pour confirmer la commande.`
  );
}

export default function Catalogue() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const { data: products, isLoading } = useListProducts();
  const { data: latestPrices } = useGetLatestPrices();
  const { toast } = useToast();

  const priceMap = new Map(latestPrices?.map((p) => [p.productName, p]) ?? []);

  const filtered = products?.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.isAvailable;
  }) ?? [];

  function handleWhatsAppOrder(productName: string, unit: string, price: number) {
    const msg = buildWhatsAppMessage(productName, unit, price);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    toast({ title: "WhatsApp ouvert", description: "Votre commande a été préparée sur WhatsApp." });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary/5 border-b py-12">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-2"
          >
            Catalogue des Produits
          </motion.h1>
          <p className="text-muted-foreground">Produits frais directement des agriculteurs maliens</p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-search"
              placeholder="Rechercher un produit..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger data-testid="select-category" className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Aucun produit trouvé</h3>
            <p className="text-muted-foreground mt-2">Essayez une autre recherche ou catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product, i) => {
              const priceInfo = priceMap.get(product.name);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  data-testid={`card-product-${product.id}`}
                >
                  <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-44 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-16 w-16 text-primary/30" />
                      )}
                    </div>
                    <CardContent className="flex-1 pt-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-foreground leading-tight">{product.name}</h3>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">{product.category}</Badge>
                      </div>
                      {product.supplierName && (
                        <p className="text-sm text-muted-foreground mb-2">par {product.supplierName}</p>
                      )}
                      {priceInfo ? (
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-xl font-bold text-primary">{priceInfo.pricePerUnit.toLocaleString("fr-FR")}</span>
                          <span className="text-sm text-muted-foreground">FCFA/{priceInfo.unit}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">Prix sur demande</p>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2 pt-0">
                      <Button
                        data-testid={`button-whatsapp-${product.id}`}
                        className="flex-1 bg-[#25D366] hover:bg-[#1ebe59] text-white"
                        size="sm"
                        onClick={() => handleWhatsAppOrder(product.name, priceInfo?.unit ?? product.unit, priceInfo?.pricePerUnit ?? 0)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        WhatsApp
                      </Button>
                      <Button
                        data-testid={`button-order-${product.id}`}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <a href="/commander">Commander</a>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
