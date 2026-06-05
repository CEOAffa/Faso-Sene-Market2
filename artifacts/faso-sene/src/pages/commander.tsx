import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MessageCircle, ShoppingCart, Check, Banknote, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = "https://qemkisjyyltbvqdcurpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbWtpc2p5eWx0YnZxZGN1cnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTM4NjcsImV4cCI6MjA5NjA4OTg2N30.gC9cXHEZyZNVgqk34Sd297HIG760vX7SiK6mFl_WJ88";
const WHATSAPP_NUMBER = "22374947541";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": "Bearer " + SUPABASE_KEY
};

const PAYMENT_METHODS = [
  { id: "livraison", label: "Livraison contre remboursement", icon: Banknote },
  { id: "orange_money", label: "Orange Money", icon: Smartphone },
  { id: "wave", label: "Wave", icon: Wallet },
];

const TIME_SLOTS = [
  { value: "matin", label: "Matin", sub: "8h–12h" },
  { value: "apres-midi", label: "Après-midi", sub: "12h–17h" },
  { value: "soir", label: "Soir", sub: "17h–20h" },
  { value: "flexible", label: "Flexible", sub: "À définir" },
];

export default function Commander() {
  const [produits, setProduits] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedProduit, setSelectedProduit] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("livraison");
  const [heureSlot, setHeureSlot] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nom: "", telephone: "", email: "",
    adresse: "", date: "", notes: "", whatsapp: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/produits?select=*&disponible=eq.true`, { headers })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setProduits(data); });
  }, []);

  const total = cart.reduce((s: number, i: any) => s + i.subtotal, 0);

  function addToCart() {
    if (!selectedProduit) return;
    const p = produits.find((x: any) => x.id === parseInt(selectedProduit));
    if (!p) return;
    const qty = parseFloat(quantite) || 1;
    const existing = cart.find((i: any) => i.id === p.id);
    if (existing) {
      setCart(cart.map((i: any) => i.id === p.id ? { ...i, qty: i.qty + qty, subtotal: (i.qty + qty) * i.prix } : i));
    } else {
      setCart([...cart, { id: p.id, nom: p.nom, qty, prix: p.prix, unite: p.unite, subtotal: qty * p.prix }]);
    }
    setSelectedProduit(""); setQuantite("1");
  }

  function removeFromCart(id: number) {
    setCart(cart.filter((i: any) => i.id !== id));
  }

  async function submit() {
    if (!form.nom || !form.telephone || !form.adresse) {
      toast({ title: "Champs requis", description: "Nom, téléphone et adresse sont obligatoires.", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "Panier vide", description: "Ajoutez des produits.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/commandes`, {
        method: "POST", headers,
        body: JSON.stringify({
          client_nom: form.nom,
          client_telephone: form.telephone,
          client_email: form.email || null,
          adresse_livraison: form.adresse,
          date_livraison: form.date || null,
          heure_livraison: heureSlot || null,
          methode_paiement: paymentMethod,
          notes: form.notes || null,
          total,
          produits: cart,
          statut: "en_attente"
        })
      });

      if (form.whatsapp) {
        const lignes = cart.map((i: any) => `- ${i.nom}: ${i.qty} ${i.unite} x ${i.prix.toLocaleString("fr-FR")} FCFA = ${i.subtotal.toLocaleString("fr-FR")} FCFA`).join("\n");
        const msg = encodeURIComponent(`Bonjour Faso Sènè,\n\nNouvelle commande:\n\n${lignes}\n\nTotal: ${total.toLocaleString("fr-FR")} FCFA\nPaiement: ${paymentMethod}\nLivraison: ${form.adresse}\nNom: ${form.nom}\nTél: ${form.telephone}${form.notes ? `\nNotes: ${form.notes}` : ""}`);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
      }

      setIsSuccess(true);
      setCart([]);
      setForm({ nom: "", telephone: "", email: "", adresse: "", date: "", notes: "", whatsapp: false });
    } catch(e) {
      toast({ title: "Erreur", description: "Une erreur s'est produite.", variant: "destructive" });
    }
    setLoading(false);
  }

  if (isSuccess) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-8 max-w-md">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Commande envoyée !</h2>
        <p className="text-muted-foreground mb-6">Nous vous contacterons sous peu pour confirmer la livraison.</p>
        <Button onClick={() => setIsSuccess(false)}>Nouvelle commande</Button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary/5 border-b py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Passer une Commande</h1>
          <p className="text-muted-foreground">Sélectionnez vos produits et choisissez votre mode de paiement.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-5">

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" />Produits</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedProduit} onValueChange={setSelectedProduit}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choisir un produit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {produits.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nom} — {Number(p.prix).toLocaleString("fr-FR")} FCFA/{p.unite}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min="1" value={quantite} onChange={e => setQuantite(e.target.value)} className="w-20" />
                <Button onClick={addToCart} disabled={!selectedProduit}><Plus className="h-4 w-4" /></Button>
              </div>

              <AnimatePresence>
                {cart.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Separator className="my-2" />
                    {cart.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-sm">{item.nom}</p>
                          <p className="text-xs text-muted-foreground">{item.qty} {item.unite} × {Number(item.prix).toLocaleString("fr-FR")} FCFA</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary text-sm">{Number(item.subtotal).toLocaleString("fr-FR")} F</span>
                          <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">{total.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Mode de paiement</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon;
                  return (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border"}`}>
                      <Icon className={`h-5 w-5 ${paymentMethod === m.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Informations de livraison</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom complet *</label>
                  <Input placeholder="Votre nom" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Téléphone *</label>
                  <Input placeholder="+223..."
