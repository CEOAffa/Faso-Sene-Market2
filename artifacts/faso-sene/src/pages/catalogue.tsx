import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Search, Filter, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = "https://qemkisjyyltbvqdcurpg.supabase.co";
const SUPABASE_KEY = "sb_publishable_6tB7OHqsUoIo0zkrgLU5wg_jFvW3jMr";
const WHATSAPP_NUMBER = "22300000000";

async function fetchProduits() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/produits?select=*,categories(nom)&disponible=eq.true`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  return res.json();
}

export default function Catalogue() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [produits, setProduits] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["Tous"]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProduits().then((data) => {
      if (Array.isArray(data)) {
        setProduits(data);
        const cats = [...new Set(data.map((p: any) => p.categories?.nom).filter(Boolean))] as string[];
        setCategories(["Tous", ...cats]);
      }
      setLoading(false);
    });
  }, []);

  const filtered = produits.filter((p) => {
    const matchesSearch = p.nom.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || p.categories?.nom === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  function handleWhatsApp(nom: string, unite: string, prix: number) {
    const msg = encodeURIComponent(`Bonjour, je souhaite commander:\n- Produit: ${nom}\n- Prix: ${prix} FCFA/${unite}\n\nMerci de me contacter.`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    toast({ title: "WhatsApp ouvert", description: "Votre commande a été préparée." });
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary/5 border-b py-12">
        <div className="container mx-auto px-4">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Catalogue des Produits
          </motion.h1>
          <p className="text-muted-foreground">Produits frais directement des agriculteurs maliens</p>
        </div>
      </section>

      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un produit..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-24 text-muted-foreground">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Aucun produit trouvé</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                  <div className="h-44 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    {p.image_url ? <img src={p.image_url} alt={p.nom} className="w-full h-full object-cover" /> : <Package className="h-16 w-16 text-primary/30" />}
                  </div>
                  <CardContent className="flex-1 pt-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-foreground">{p.nom}</h3>
                      {p.categories?.nom && <Badge variant="secondary" className="text-xs">{p.categories.nom}</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xl font-bold text-primary">{Number(p.prix).toLocaleString("fr-FR")}</span>
                      <span className="text-sm text-muted-foreground">FCFA/{p.unite}</span>
                    </div>
                    {p.stock > 0 && <p className="text-xs text-muted-foreground mt-1">Stock: {p.stock} {p.unite}</p>}
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-0">
                    <Button className="flex-1 bg-[#25D366] hover:bg-[#1ebe59] text-white" size="sm" onClick={() => handleWhatsApp(p.nom, p.unite, p.prix)}>
                      <MessageCircle className="h-4 w-4 mr-1" />WhatsApp
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href="/commander">Commander</a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
