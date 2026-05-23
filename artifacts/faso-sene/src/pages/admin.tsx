import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Package, ShoppingBag, Truck, DollarSign, Clock,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight, Save, CheckCircle2, LogOut,
  Settings, Eye, EyeOff, ShieldCheck, Plus, Pencil, Trash2, X,
  AlertTriangle, ImageIcon, ToggleLeft, ToggleRight, Banknote, Smartphone, Wallet, Mail, MapPin, CalendarDays,
  ClipboardCheck, XCircle, PackageCheck, Navigation,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  useGetAdminStats,
  useListOrders,
  useListDeliveries,
  useListSuppliers,
  useListProducts,
  useUpdateOrder,
  useUpdateDelivery,
  useUpdateProduct,
  useDeleteProduct,
  useCreateProduct,
  useGetLatestPrices,
  useCreatePrice,
  getListOrdersQueryKey,
  getListDeliveriesQueryKey,
  getGetLatestPricesQueryKey,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/components/admin-guard";

const ORDER_STATUSES = [
  { value: "en_attente", label: "En attente" },
  { value: "confirme", label: "Confirmé" },
  { value: "en_preparation", label: "En préparation" },
  { value: "en_livraison", label: "En livraison" },
  { value: "livre", label: "Livré" },
  { value: "annule", label: "Annulé" },
];

const DELIVERY_STATUSES = [
  { value: "planifiee", label: "Planifiée" },
  { value: "en_cours", label: "En cours" },
  { value: "livree", label: "Livrée" },
  { value: "echouee", label: "Échouée" },
];

const STATUS_COLORS: Record<string, string> = {
  en_attente: "bg-yellow-100 text-yellow-800",
  confirme: "bg-blue-100 text-blue-800",
  en_preparation: "bg-orange-100 text-orange-800",
  en_livraison: "bg-indigo-100 text-indigo-800",
  livre: "bg-green-100 text-green-800",
  livree: "bg-green-100 text-green-800",
  annule: "bg-red-100 text-red-800",
  planifiee: "bg-purple-100 text-purple-800",
  en_cours: "bg-blue-100 text-blue-800",
  echouee: "bg-red-100 text-red-800",
};

// ─── Price Editor ────────────────────────────────────────────────────────────

interface PriceDraft {
  productName: string;
  unit: string;
  currentPrice: number;
  newPrice: string;
}

function PriceEditor() {
  const { data: latestPrices, isLoading } = useGetLatestPrices();
  const createPrice = useCreatePrice();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<PriceDraft[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (latestPrices && drafts.length === 0) {
      setDrafts(
        latestPrices.map((p) => ({
          productName: p.productName,
          unit: p.unit,
          currentPrice: p.pricePerUnit,
          newPrice: String(p.pricePerUnit),
        }))
      );
    }
  }, [latestPrices, drafts.length]);

  function handleChange(productName: string, value: string) {
    setSaved(false);
    setDrafts((prev) =>
      prev.map((d) => (d.productName === productName ? { ...d, newPrice: value } : d))
    );
  }

  function computeTrend(current: number, next: number): { trend: "up" | "down" | "stable"; pct: number } {
    if (next > current) return { trend: "up", pct: parseFloat((((next - current) / current) * 100).toFixed(1)) };
    if (next < current) return { trend: "down", pct: parseFloat((((next - current) / current) * 100).toFixed(1)) };
    return { trend: "stable", pct: 0 };
  }

  async function handleSave() {
    const today = new Date().toISOString().split("T")[0];
    const changed = drafts.filter((d) => {
      const val = parseFloat(d.newPrice);
      return !isNaN(val) && val > 0 && val !== d.currentPrice;
    });

    if (changed.length === 0) {
      toast({ title: "Aucun changement", description: "Modifiez au moins un prix avant de sauvegarder." });
      return;
    }

    let successCount = 0;
    for (const draft of changed) {
      const newVal = parseFloat(draft.newPrice);
      const { trend, pct } = computeTrend(draft.currentPrice, newVal);
      await new Promise<void>((resolve, reject) =>
        createPrice.mutate(
          {
            data: {
              productName: draft.productName,
              pricePerUnit: newVal,
              unit: draft.unit,
              date: today,
              trend,
              percentChange: pct,
            },
          },
          {
            onSuccess: () => { successCount++; resolve(); },
            onError: reject,
          }
        )
      );
    }

    queryClient.invalidateQueries({ queryKey: getGetLatestPricesQueryKey() });
    // Refresh drafts with new prices
    setDrafts((prev) =>
      prev.map((d) => {
        const val = parseFloat(d.newPrice);
        if (!isNaN(val) && val > 0) return { ...d, currentPrice: val, newPrice: String(val) };
        return d;
      })
    );
    setSaved(true);
    toast({
      title: `${successCount} prix mis à jour`,
      description: "Les nouveaux prix sont visibles sur tout le site.",
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  const hasChanges = drafts.some((d) => {
    const val = parseFloat(d.newPrice);
    return !isNaN(val) && val > 0 && val !== d.currentPrice;
  });

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <p className="text-sm text-muted-foreground">
            Modifiez les prix ci-dessous et cliquez sur <strong>Publier les prix</strong>. Les tendances (hausse/baisse) sont calculées automatiquement et s'affichent en temps réel sur tout le site.
          </p>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {drafts.map((draft) => {
          const newVal = parseFloat(draft.newPrice);
          const isValid = !isNaN(newVal) && newVal > 0;
          const changed = isValid && newVal !== draft.currentPrice;
          const { trend } = changed ? computeTrend(draft.currentPrice, newVal) : { trend: "stable" as const };

          return (
            <Card
              key={draft.productName}
              className={`transition-all ${changed ? "border-primary shadow-sm ring-1 ring-primary/20" : ""}`}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">{draft.productName}</CardTitle>
                  {changed ? (
                    trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-primary" />
                    )
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
                <CardDescription className="text-xs">
                  Actuel : <span className="font-semibold text-foreground">{draft.currentPrice.toLocaleString("fr-FR")} FCFA</span>
                  <span className="text-muted-foreground">/{draft.unit}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="relative">
                  <Input
                    data-testid={`input-price-${draft.productName}`}
                    type="number"
                    min="1"
                    step="50"
                    value={draft.newPrice}
                    onChange={(e) => handleChange(draft.productName, e.target.value)}
                    className={`pr-16 text-base font-semibold ${changed ? "border-primary" : ""}`}
                    placeholder="Nouveau prix"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none">
                    FCFA
                  </span>
                </div>
                {changed && isValid && (
                  <p className="text-xs mt-1.5 font-medium flex items-center gap-1">
                    {trend === "up" ? (
                      <span className="text-red-600">
                        +{Math.abs(((newVal - draft.currentPrice) / draft.currentPrice) * 100).toFixed(1)}% vs actuel
                      </span>
                    ) : (
                      <span className="text-primary">
                        -{Math.abs(((newVal - draft.currentPrice) / draft.currentPrice) * 100).toFixed(1)}% vs actuel
                      </span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          {hasChanges
            ? `${drafts.filter((d) => { const v = parseFloat(d.newPrice); return !isNaN(v) && v > 0 && v !== d.currentPrice; }).length} produit(s) modifié(s)`
            : "Aucun changement en attente"}
        </p>
        <Button
          data-testid="button-publish-prices"
          size="lg"
          onClick={handleSave}
          disabled={!hasChanges || createPrice.isPending}
          className="gap-2 min-w-48"
        >
          {createPrice.isPending ? (
            "Publication..."
          ) : saved && !hasChanges ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Prix publiés
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Publier les prix
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Product Manager ──────────────────────────────────────────────────────────

const PRODUCT_CATEGORIES = ["Légumes", "Fruits", "Céréales", "Protéines", "Tubercules"];
const PRODUCT_UNITS = ["kg", "g", "unité", "sac", "litre", "boîte", "douzaine", "botte"];

interface EditForm { name: string; category: string; unit: string; imageUrl: string; isAvailable: boolean; }
interface AddForm extends EditForm { nameLocal: string; supplierId: string; }

function ProductManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: products, isLoading } = useListProducts();
  const { data: suppliers } = useListSuppliers();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", category: "Légumes", unit: "kg", imageUrl: "", isAvailable: true });
  const [addForm, setAddForm] = useState<AddForm>({ name: "", nameLocal: "", category: "Légumes", unit: "kg", imageUrl: "", supplierId: "", isAvailable: true });

  function startEdit(p: NonNullable<typeof products>[number]) {
    setEditingId(p.id);
    setDeleteId(null);
    setEditForm({ name: p.name, category: p.category, unit: p.unit, imageUrl: p.imageUrl ?? "", isAvailable: p.isAvailable });
  }

  function saveEdit() {
    if (!editingId) return;
    updateProduct.mutate({ id: editingId, data: { name: editForm.name, category: editForm.category, unit: editForm.unit, imageUrl: editForm.imageUrl || undefined, isAvailable: editForm.isAvailable } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setEditingId(null);
        toast({ title: "Produit mis à jour" });
      },
      onError: () => toast({ title: "Erreur", description: "Impossible de mettre à jour.", variant: "destructive" }),
    });
  }

  function confirmDelete() {
    if (!deleteId) return;
    deleteProduct.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setDeleteId(null);
        toast({ title: "Produit supprimé" });
      },
      onError: () => toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" }),
    });
  }

  function handleAdd() {
    if (!addForm.name || !addForm.supplierId) {
      toast({ title: "Champs requis", description: "Le nom et le fournisseur sont obligatoires.", variant: "destructive" });
      return;
    }
    createProduct.mutate({
      data: {
        name: addForm.name,
        nameLocal: addForm.nameLocal || undefined,
        category: addForm.category,
        unit: addForm.unit,
        imageUrl: addForm.imageUrl || undefined,
        supplierId: parseInt(addForm.supplierId),
        isAvailable: addForm.isAvailable,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setShowAdd(false);
        setAddForm({ name: "", nameLocal: "", category: "Légumes", unit: "kg", imageUrl: "", supplierId: "", isAvailable: true });
        toast({ title: "Produit ajouté" });
      },
      onError: () => toast({ title: "Erreur", description: "Impossible d'ajouter le produit.", variant: "destructive" }),
    });
  }

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products?.length ?? 0} produit{(products?.length ?? 0) !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => { setShowAdd(true); setEditingId(null); }} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter un produit
        </Button>
      </div>

      {/* Add product form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="border-primary/30 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Nouveau produit</CardTitle>
                  <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Nom *</label>
                    <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="ex: Tomates" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Nom local</label>
                    <Input value={addForm.nameLocal} onChange={(e) => setAddForm({ ...addForm, nameLocal: e.target.value })} placeholder="Nom en bambara..." className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Catégorie</label>
                    <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{PRODUCT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Unité</label>
                    <Select value={addForm.unit} onValueChange={(v) => setAddForm({ ...addForm, unit: v })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{PRODUCT_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium">URL de l'image</label>
                    <Input value={addForm.imageUrl} onChange={(e) => setAddForm({ ...addForm, imageUrl: e.target.value })} placeholder="https://..." className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Fournisseur *</label>
                    <Select value={addForm.supplierId} onValueChange={(v) => setAddForm({ ...addForm, supplierId: v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      <SelectContent>{suppliers?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <Switch checked={addForm.isAvailable} onCheckedChange={(v) => setAddForm({ ...addForm, isAvailable: v })} id="add-available" />
                    <label htmlFor="add-available" className="text-xs font-medium cursor-pointer">Disponible à la vente</label>
                  </div>
                </div>
                {addForm.imageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <img src={addForm.imageUrl} alt="Aperçu" className="w-12 h-12 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-xs text-muted-foreground">Aperçu de l'image</span>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleAdd} disabled={createProduct.isPending} className="gap-2">
                    <Save className="h-3.5 w-3.5" /> {createProduct.isPending ? "Ajout..." : "Ajouter le produit"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Annuler</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product list */}
      <div className="space-y-3">
        {products?.map((product) => (
          <motion.div key={product.id} layout>
            <Card>
              <CardContent className="pt-4">
                {/* Product row */}
                <div className="flex items-center gap-3">
                  {/* Image */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm">{product.name}</p>
                      <Badge variant={product.isAvailable ? "default" : "secondary"} className="text-xs">
                        {product.isAvailable ? "Disponible" : "Indisponible"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{product.category} · {product.unit}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => editingId === product.id ? setEditingId(null) : startEdit(product)}>
                      {editingId === product.id ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-destructive" onClick={() => { setDeleteId(deleteId === product.id ? null : product.id); setEditingId(null); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Delete confirmation */}
                <AnimatePresence>
                  {deleteId === product.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-destructive text-sm flex-1">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Supprimer « {product.name} » définitivement ?</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={confirmDelete} disabled={deleteProduct.isPending} className="h-7 text-xs">
                            {deleteProduct.isPending ? "..." : "Supprimer"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteId(null)} className="h-7 text-xs">Annuler</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Edit form */}
                <AnimatePresence>
                  {editingId === product.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Nom</label>
                            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Catégorie</label>
                            <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>{PRODUCT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Unité</label>
                            <Select value={editForm.unit} onValueChange={(v) => setEditForm({ ...editForm, unit: v })}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>{PRODUCT_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">URL de l'image</label>
                            <Input value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} placeholder="https://..." className="h-9" />
                          </div>
                        </div>
                        {editForm.imageUrl && (
                          <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                            <img src={editForm.imageUrl} alt="Aperçu" className="w-12 h-12 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            <span className="text-xs text-muted-foreground">Aperçu de l'image</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Switch checked={editForm.isAvailable} onCheckedChange={(v) => setEditForm({ ...editForm, isAvailable: v })} id={`avail-${product.id}`} />
                          <label htmlFor={`avail-${product.id}`} className="text-xs font-medium cursor-pointer">Disponible à la vente</label>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} disabled={updateProduct.isPending} className="gap-2 h-8">
                            <Save className="h-3.5 w-3.5" /> {updateProduct.isPending ? "Sauvegarde..." : "Sauvegarder"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8">Annuler</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {products?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Aucun produit. Ajoutez votre premier produit ci-dessus.</p>
        </div>
      )}
    </div>
  );
}

// ─── Password Settings ────────────────────────────────────────────────────────

function PasswordSettings() {
  const { token, logout } = useAdminAuth();
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = next.length === 0 ? null
    : next.length < 8 ? "faible"
    : next.length < 12 || !/[^a-zA-Z0-9]/.test(next) ? "moyen"
    : "fort";

  const strengthColor = { faible: "bg-red-400", moyen: "bg-yellow-400", fort: "bg-primary" }[strength ?? "faible"];
  const strengthWidth = { faible: "w-1/3", moyen: "w-2/3", fort: "w-full" }[strength ?? "faible"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (next !== confirm) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (next.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur lors du changement de mot de passe.");
        return;
      }

      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre nouveau mot de passe est actif. Vous serez déconnecté.",
      });
      setTimeout(() => logout(), 2500);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Changer le mot de passe</CardTitle>
          </div>
          <CardDescription>
            Choisissez un mot de passe fort d'au moins 8 caractères.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 gap-3 text-center"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <p className="font-semibold">Mot de passe mis à jour !</p>
              <p className="text-sm text-muted-foreground">Déconnexion en cours...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mot de passe actuel</label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pr-10 h-11"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nouveau mot de passe</label>
                <div className="relative">
                  <Input
                    type={showNext ? "text" : "password"}
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    required
                    placeholder="Minimum 8 caractères"
                    className="pr-10 h-11"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNext(!showNext)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {strength && (
                  <div className="space-y-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strengthColor} ${strengthWidth}`} />
                    </div>
                    <p className={`text-xs font-medium ${
                      strength === "faible" ? "text-red-500" : strength === "moyen" ? "text-yellow-600" : "text-primary"
                    }`}>
                      Force : {strength}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`h-11 ${confirm && confirm !== next ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  autoComplete="new-password"
                />
                {confirm && confirm !== next && (
                  <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading || !current || !next || !confirm || next !== confirm}
              >
                {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4 border-muted">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">
            <strong>Note :</strong> Après le changement, vous serez automatiquement déconnecté et devrez vous reconnecter avec votre nouveau mot de passe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Order Card (expandable) ─────────────────────────────────────────────────

const TIME_SLOT_LABELS: Record<string, string> = {
  matin: "Matin (8h–12h)",
  "apres-midi": "Après-midi (12h–17h)",
  soir: "Soir (17h–20h)",
  flexible: "Flexible",
};

function PaymentBadge({ method }: { method?: string | null }) {
  if (!method || method === "livraison") {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Banknote className="h-3 w-3 text-emerald-600" /> Contre remboursement
      </Badge>
    );
  }
  if (method === "orange_money") {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Smartphone className="h-3 w-3 text-orange-500" /> Orange Money
      </Badge>
    );
  }
  if (method === "wave") {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Wallet className="h-3 w-3 text-blue-500" /> Wave
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-xs">{method}</Badge>;
}

type OrderItem = { productId?: number; productName?: string; quantity?: number; unit?: string; unitPrice?: number; subtotal?: number };
type OrderType = {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  whatsappOrder?: boolean | null;
  paymentMethod?: string | null;
  deliveryAddress: string;
  deliveryDate?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
};

const STATUS_ACTIONS: {
  value: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    value: "confirme",
    label: "Confirmer",
    shortLabel: "Confirmer",
    icon: ClipboardCheck,
    activeClass: "bg-blue-600 text-white border-blue-600 shadow-sm",
    inactiveClass: "border-blue-200 text-blue-700 hover:bg-blue-50",
  },
  {
    value: "en_preparation",
    label: "En préparation",
    shortLabel: "Préparer",
    icon: Package,
    activeClass: "bg-orange-500 text-white border-orange-500 shadow-sm",
    inactiveClass: "border-orange-200 text-orange-700 hover:bg-orange-50",
  },
  {
    value: "en_livraison",
    label: "En livraison",
    shortLabel: "Livrer",
    icon: Navigation,
    activeClass: "bg-indigo-600 text-white border-indigo-600 shadow-sm",
    inactiveClass: "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
  },
  {
    value: "livre",
    label: "Livré",
    shortLabel: "Livré ✓",
    icon: PackageCheck,
    activeClass: "bg-green-600 text-white border-green-600 shadow-sm",
    inactiveClass: "border-green-200 text-green-700 hover:bg-green-50",
  },
];

function OrderCard({ order, onStatusChange }: { order: OrderType; onStatusChange: (id: number, status: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isCancelled = order.status === "annule";
  const isDelivered = order.status === "livre";

  const itemSummary = order.items
    .map((i) => `${i.productName ?? `#${i.productId}`} ×${i.quantity}${i.unit ? ` ${i.unit}` : ""}`)
    .join(" · ");

  return (
    <Card data-testid={`row-order-${order.id}`} className={`overflow-hidden transition-all ${isCancelled ? "opacity-60" : ""}`}>
      {/* ── Collapsed header ── */}
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? "Réduire" : "Développer"}
          >
            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
          </button>

          <div className="flex-1 min-w-0">
            {/* Top row: id, name, phone, status */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-bold text-sm text-muted-foreground">#{order.id}</span>
              <span className="font-semibold">{order.customerName}</span>
              <span className="text-sm text-muted-foreground">{order.customerPhone}</span>
              {order.whatsappOrder && (
                <Badge className="bg-[#25D366] text-white text-xs px-1.5 py-0">WhatsApp</Badge>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                {ORDER_STATUSES.find((s) => s.value === order.status)?.label ?? order.status}
              </span>
            </div>

            {/* Quick product summary */}
            <p className="text-xs text-muted-foreground mt-1 truncate">{itemSummary || "—"}</p>

            {/* Address + date */}
            <div className="flex flex-wrap gap-x-3 mt-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />{order.deliveryAddress}
              </span>
              {order.deliveryDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 shrink-0" />{order.deliveryDate}
                  {order.deliveryTime && ` · ${TIME_SLOT_LABELS[order.deliveryTime] ?? order.deliveryTime}`}
                </span>
              )}
            </div>
          </div>

          {/* Total + received date */}
          <div className="text-right shrink-0">
            <p className="font-bold text-primary">{order.totalAmount.toLocaleString("fr-FR")} F</p>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>

        {/* ── Expanded detail ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t space-y-5">

                {/* ── Products table ── */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" /> Produits commandés
                  </p>
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/60">
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Produit</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Quantité</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs hidden sm:table-cell">Prix unitaire</th>
                          <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Sous-total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, i) => (
                          <tr key={i} className="border-t hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 font-medium">
                              {item.productName ?? `Produit #${item.productId}`}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">
                              {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                              {(item.unitPrice ?? 0).toLocaleString("fr-FR")} FCFA
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-primary">
                              {(item.subtotal ?? (item.quantity ?? 0) * (item.unitPrice ?? 0)).toLocaleString("fr-FR")} F
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/30">
                          <td colSpan={2} className="px-4 py-3 font-bold sm:hidden">Total</td>
                          <td colSpan={3} className="px-4 py-3 font-bold text-right hidden sm:table-cell">Total</td>
                          <td className="px-4 py-3 font-bold text-right text-primary text-base">
                            {order.totalAmount.toLocaleString("fr-FR")} FCFA
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* ── Info grid ── */}
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Customer */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</p>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      {order.customerEmail && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />{order.customerEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Livraison</p>
                    <div className="space-y-1">
                      <p className="flex items-start gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />{order.deliveryAddress}
                      </p>
                      {order.deliveryDate && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3 shrink-0" />
                          {order.deliveryDate}
                          {order.deliveryTime && (
                            <span className="ml-0.5">· {TIME_SLOT_LABELS[order.deliveryTime] ?? order.deliveryTime}</span>
                          )}
                        </p>
                      )}
                      {!order.deliveryDate && order.deliveryTime && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />{TIME_SLOT_LABELS[order.deliveryTime] ?? order.deliveryTime}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment + notes */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paiement</p>
                    <PaymentBadge method={order.paymentMethod} />
                    {order.notes && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-xs bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Status action buttons ── */}
                <div className="pt-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
                    Gestion de la commande
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      const isActive = order.status === action.value;
                      const disabled = isCancelled && action.value !== "annule";
                      return (
                        <button
                          key={action.value}
                          data-testid={`btn-status-${action.value}-${order.id}`}
                          type="button"
                          disabled={disabled || isActive}
                          onClick={() => onStatusChange(order.id, action.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isActive
                              ? action.activeClass
                              : disabled
                              ? "opacity-40 cursor-not-allowed border-border text-muted-foreground"
                              : action.inactiveClass
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {action.shortLabel}
                          {isActive && <CheckCircle2 className="h-3 w-3 ml-0.5" />}
                        </button>
                      );
                    })}
                    {/* Cancel button — always last */}
                    {!isDelivered && (
                      <button
                        data-testid={`btn-status-annule-${order.id}`}
                        type="button"
                        disabled={isCancelled}
                        onClick={() => onStatusChange(order.id, "annule")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ml-auto ${
                          isCancelled
                            ? "bg-red-600 text-white border-red-600 opacity-80 cursor-not-allowed"
                            : "border-red-200 text-red-700 hover:bg-red-50"
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {isCancelled ? "Annulé" : "Annuler"}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────

export default function Admin() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: orders, isLoading: ordersLoading } = useListOrders();
  const { data: deliveries, isLoading: deliveriesLoading } = useListDeliveries();
  const { data: suppliers } = useListSuppliers();
  const updateOrder = useUpdateOrder();
  const updateDelivery = useUpdateDelivery();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { logout } = useAdminAuth();

  function handleOrderStatusChange(orderId: number, status: string) {
    updateOrder.mutate({ id: orderId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Statut mis à jour" });
      },
    });
  }

  function handleDeliveryStatusChange(deliveryId: number, status: string) {
    updateDelivery.mutate({ id: deliveryId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeliveriesQueryKey() });
        toast({ title: "Statut de livraison mis à jour" });
      },
    });
  }

  const statCards = [
    { icon: Users, label: "Fournisseurs", value: stats?.totalSuppliers ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Package, label: "Produits", value: stats?.totalProducts ?? 0, color: "text-purple-600", bg: "bg-purple-50" },
    { icon: ShoppingBag, label: "Commandes", value: stats?.totalOrders ?? 0, color: "text-orange-600", bg: "bg-orange-50" },
    { icon: DollarSign, label: "Revenu total", value: `${(stats?.totalRevenue ?? 0).toLocaleString("fr-FR")} F`, color: "text-primary", bg: "bg-green-50" },
    { icon: Clock, label: "En attente", value: stats?.pendingOrders ?? 0, color: "text-yellow-600", bg: "bg-yellow-50" },
    { icon: Truck, label: "Livraisons actives", value: stats?.activeDeliveries ?? 0, color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: TrendingUp, label: "Aujourd'hui", value: stats?.todayOrders ?? 0, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold mb-2"
            >
              Administration
            </motion.h1>
            <p className="opacity-70">Tableau de bord de gestion Faso Sènè</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-white/20 text-background hover:bg-white/10 gap-2"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
          {statsLoading
            ? Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            : statCards.map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="text-center">
                    <CardContent className="pt-4 pb-4">
                      <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                      <p className="text-lg font-bold mt-0.5">{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>

        {/* Top products */}
        {stats?.topProducts && stats.topProducts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base">Produits les plus commandés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {stats.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-muted-foreground font-bold">#{i + 1}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                    <Badge variant="secondary" className="text-xs">{p.orderCount}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="prix">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="prix" data-testid="tab-prix" className="gap-1.5 text-xs sm:text-sm">
              <DollarSign className="h-3.5 w-3.5" />
              Prix
            </TabsTrigger>
            <TabsTrigger value="produits" data-testid="tab-produits" className="gap-1.5 text-xs sm:text-sm">
              <Package className="h-3.5 w-3.5" />
              Produits
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders" className="text-xs sm:text-sm">Commandes ({orders?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="deliveries" data-testid="tab-deliveries" className="text-xs sm:text-sm">Livraisons ({deliveries?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="suppliers" data-testid="tab-suppliers" className="text-xs sm:text-sm">Fournisseurs ({suppliers?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings" className="gap-1.5 text-xs sm:text-sm">
              <Settings className="h-3.5 w-3.5" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* ── Price management tab ── */}
          <TabsContent value="prix" className="mt-6">
            <PriceEditor />
          </TabsContent>

          {/* ── Products tab ── */}
          <TabsContent value="produits" className="mt-6">
            <ProductManager />
          </TabsContent>

          {/* ── Orders ── */}
          <TabsContent value="orders" className="mt-6">
            {ordersLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Aucune commande</div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleOrderStatusChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Deliveries ── */}
          <TabsContent value="deliveries" className="mt-6">
            {deliveriesLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : !deliveries || deliveries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Aucune livraison</div>
            ) : (
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <Card key={delivery.id} data-testid={`row-delivery-${delivery.id}`}>
                    <CardContent className="pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Livraison #{delivery.id}</span>
                            <span className="text-sm text-muted-foreground">· Commande #{delivery.orderId}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{delivery.driverName} — {delivery.driverPhone}</p>
                          <p className="text-xs text-muted-foreground">Prévu le {delivery.scheduledDate}</p>
                        </div>
                        <Select value={delivery.status} onValueChange={(v) => handleDeliveryStatusChange(delivery.id, v)}>
                          <SelectTrigger data-testid={`select-delivery-status-${delivery.id}`} className="w-36 h-8 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[delivery.status] ?? "bg-gray-100"}`}>
                              {DELIVERY_STATUSES.find((s) => s.value === delivery.status)?.label ?? delivery.status}
                            </span>
                            <ChevronDown className="h-3 w-3 ml-auto" />
                          </SelectTrigger>
                          <SelectContent>
                            {DELIVERY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Suppliers ── */}
          <TabsContent value="suppliers" className="mt-6">
            {!suppliers || suppliers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Aucun fournisseur</div>
            ) : (
              <div className="space-y-3">
                {suppliers.map((supplier) => (
                  <Card key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{supplier.name}</p>
                          <p className="text-sm text-muted-foreground">{supplier.type} · {supplier.region}</p>
                          <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                        </div>
                        <Badge variant={supplier.status === "active" ? "default" : "secondary"} className="text-xs">
                          {supplier.status === "active" ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Settings tab ── */}
          <TabsContent value="settings" className="mt-6">
            <PasswordSettings />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
