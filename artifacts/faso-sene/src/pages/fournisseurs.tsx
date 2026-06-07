import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, MapPin, Phone, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = "https://qemkisjyyltbvqdcurpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbWtpc2p5eWx0YnZxZGN1cnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTM4NjcsImV4cCI6MjA5NjA4OTg2N30.gC9cXHEZyZNVgqk34Sd297HIG760vX7SiK6mFl_WJ88";
const headers = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY };

const REGIONS = ["Bamako", "Sikasso", "Mopti", "Segou", "Kayes", "Koulikoro", "Tombouctou", "Gao", "Kidal"];
const TYPES = ["Agriculteur", "Eleveur", "Grossiste", "Cooperative"];

export default function Fournisseurs() {
  const [tab, setTab] = useState<"register" | "list">("register");
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nom: "", telephone: "", email: "", region: "", village: "", type: "", description: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/fournisseurs?select=*&order=created_at.desc`, { headers })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFournisseurs(data); setLoading(false); });
  }, []);

  async function submit() {
    if (!form.nom || !form.telephone || !form.region || !form.type) {
      toast({ title: "Champs requis", description: "Nom, telephone, region et type sont obligatoires.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/fournisseurs`, {
        method: "POST", headers,
        body: JSON.stringify({
          nom: form.nom,
          telephone: form.telephone,
          email: form.email || null,
          region: form.region,
          village: form.village || null,
          type: form.type,
          description: form.description || null,
        })
      });
      setIsSuccess(true);
      setForm({ nom: "", telephone: "", email: "", region: "", village: "", type: "", description: "" });
      const data = await fetch(`${SUPABASE_URL}/rest/v1/fournisseurs?select=*&order=created_at.desc`, { headers }).then(r => r.json());
      if (Array.isArray(data)) setFournisseurs(data);
    } catch(e) {
      toast({ title: "Erreur", description: "Une erreur s'est produite.", variant: "destructive" });
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-bold mb-2">
            Fournisseurs
          </motion.h1>
          <p className="text-primary-foreground/80">Rejoignez notre reseau de producteurs agricoles</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex gap-2 mb-8">
          <button onClick={() => setTab("register")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${tab === "register" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            S'inscrire
          </button>
          <button onClick={() => setTab("list")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${tab === "list" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            Annuaire ({fournisseurs.length})
          </button>
        </div>

        {tab === "register" && (
          <div className="max-w-xl mx-auto">
            {isSuccess ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Inscription soumise !</h2>
                <p className="text-muted-foreground mb-6">Nous vous contacterons sous 24h pour finaliser votre inscription.</p>
                <Button onClick={() => setIsSuccess(false)} variant="outline">Nouvelle inscription</Button>
              </motion.div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Inscription Fournisseur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Nom / Societe *</label>
                      <Input placeholder="Votre nom ou societe" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Telephone *</label>
                      <Input placeholder="+223..." value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email (optionnel)</label>
                    <Input placeholder="email@exemple.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Region *</label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.region} onChange={e => setForm({...form, region: e.target.value})}>
                        <option value="">Choisir...</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Type *</label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                        <option value="">Choisir...</option>
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Village / Quartier (optionnel)</label>
                    <Input placeholder="Votre localite" value={form.village} onChange={e => setForm({...form, village: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description de vos produits (optionnel)</label>
                    <Textarea placeholder="Quels produits proposez-vous ?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                  </div>
                  <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
                    {submitting ? "Envoi..." : "Soumettre l'inscription"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === "list" && (
          loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : fournisseurs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Aucun fournisseur inscrit pour le moment.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fournisseurs.map((f: any, i: number) => (
                <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{f.nom}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">{f.type}</Badge>
                        </div>
                        {f.statut === "actif" && <div className="w-2 h-2 bg-primary rounded-full mt-2" />}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{f.village ? `${f.village}, ` : ""}{f.region}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{f.telephone}</span>
                      </div>
                      {f.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{f.email}</span>
                        </div>
                      )}
                      {f.description && <p className="text-sm text-muted-foreground line-clamp-2 pt-1">{f.description}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )
        )}
      </section>
    </div>
  );
}
